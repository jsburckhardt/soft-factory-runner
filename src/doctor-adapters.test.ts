import * as fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  doctorEnvironment,
  LiveDoctorCommandRunner,
  type DoctorCommandResult,
  type DoctorCommandRunner,
  type DoctorCommandSpec,
  observeDoctorAuthentication,
  observeDoctorRepository,
  redact,
  resolveDoctorExecutables,
} from "./doctor-adapters";

const ok = (stdout = ""): DoctorCommandResult => ({
  exitCode: 0,
  signal: null,
  stdout,
  stderr: "",
  stdoutBuffer: Buffer.from(stdout),
  stderrBuffer: Buffer.alloc(0),
  stdoutByteCount: Buffer.byteLength(stdout),
  stderrByteCount: 0,
  stdoutTruncated: false,
  stderrTruncated: false,
  timedOut: false,
  cancelled: false,
  launchError: null,
});
const bad = (stderr = "failed"): DoctorCommandResult => ({
  exitCode: 1,
  signal: null,
  stdout: "",
  stderr,
  stdoutBuffer: Buffer.alloc(0),
  stderrBuffer: Buffer.from(stderr),
  stdoutByteCount: 0,
  stderrByteCount: Buffer.byteLength(stderr),
  stdoutTruncated: false,
  stderrTruncated: false,
  timedOut: false,
  cancelled: false,
  launchError: null,
});
class RecordingRunner implements DoctorCommandRunner {
  public readonly calls: DoctorCommandSpec[] = [];
  public constructor(
    private readonly answer: (
      spec: DoctorCommandSpec,
    ) => DoctorCommandResult = () => ok(),
  ) {}
  public async run(spec: DoctorCommandSpec): Promise<DoctorCommandResult> {
    this.calls.push(spec);
    return this.answer(spec);
  }
}
function repositoryRunner(
  overrides: Readonly<Record<string, DoctorCommandResult>> = {},
): RecordingRunner {
  return new RecordingRunner((spec) => {
    const key = spec.args.join(" ");
    return (
      overrides[key] ??
      (
        {
          "rev-parse --is-inside-work-tree": ok("true\n"),
          "rev-parse --show-toplevel": ok("/repo\n"),
          "rev-parse --path-format=absolute --git-common-dir":
            ok("/repo/.git\n"),
          remote: ok("origin\n"),
          "remote get-url origin": ok("git@github.com:owner/repo.git\n"),
          "symbolic-ref --quiet refs/remotes/origin/HEAD": ok(
            "refs/remotes/origin/main\n",
          ),
        } as Record<string, DoctorCommandResult>
      )[key] ??
      bad()
    );
  });
}

describe("Doctor bounded adapters", () => {
  it("resolves exact executable files directly from PATH", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "doctor-path-"));
    await Promise.all(
      ["git", "gh", "tmux", "node", "copilot"].map(async (name) => {
        const target = path.join(root, name);
        await fs.writeFile(target, "#!/bin/sh\n");
        await fs.chmod(target, 0o700);
      }),
    );
    const resolved = await resolveDoctorExecutables(root, root);
    for (const name of ["git", "gh", "tmux", "node", "copilot"] as const)
      expect(resolved[name]).toEqual({
        ok: true,
        value: path.join(root, name),
        message: null,
        remediation: null,
      });
    await fs.chmod(path.join(root, "tmux"), 0o600);
    expect((await resolveDoctorExecutables(root, root)).tmux.ok).toBe(false);
    await fs.rm(root, { recursive: true, force: true });
  });

  it("caps and counts original command bytes at 4095/4096/4097 while draining overflow", async () => {
    const runner = new LiveDoctorCommandRunner();
    for (const size of [4095, 4096, 4097]) {
      const result = await runner.run({
        executable: process.execPath,
        args: [
          "-e",
          `process.stdout.write(Buffer.alloc(${size}, 97));process.stderr.write(Buffer.alloc(${size}, 98));`,
        ],
        cwd: process.cwd(),
        timeoutMs: 2000,
        shell: false,
        environment: {},
      });
      expect(result.exitCode).toBe(0);
      expect(result.stdoutByteCount).toBe(size);
      expect(result.stderrByteCount).toBe(size);
      expect(result.stdoutBuffer).toHaveLength(Math.min(size, 4096));
      expect(result.stderrBuffer).toHaveLength(Math.min(size, 4096));
      expect(result.stdoutTruncated).toBe(size > 4096);
      expect(result.stderrTruncated).toBe(size > 4096);
    }
  });

  it("discovers five independent repository facts with shell-free bounded Git arrays", async () => {
    const runner = repositoryRunner();
    const result = await observeDoctorRepository("/start", "/bin/git", runner);
    expect(result).toMatchObject({
      membership: { ok: true },
      primaryWorktree: { value: "/repo" },
      commonDirectory: { value: "/repo/.git" },
      githubIdentity: { value: "owner/repo" },
      defaultBranch: { value: "main" },
      githubHost: "github.com",
    });
    expect(runner.calls.map((call) => call.args)).toEqual(
      expect.arrayContaining([
        ["rev-parse", "--is-inside-work-tree"],
        ["rev-parse", "--show-toplevel"],
        ["rev-parse", "--path-format=absolute", "--git-common-dir"],
        ["remote"],
        ["remote", "get-url", "origin"],
        ["symbolic-ref", "--quiet", "refs/remotes/origin/HEAD"],
      ]),
    );
    for (const call of runner.calls)
      expect(call).toMatchObject({
        executable: "/bin/git",
        timeoutMs: 2000,
        shell: false,
      });
  });

  it("retains all repository observations when membership or dependent parsing fails", async () => {
    const outside = await observeDoctorRepository(
      "/start",
      "/bin/git",
      repositoryRunner({ "rev-parse --is-inside-work-tree": bad() }),
    );
    expect([
      outside.membership,
      outside.primaryWorktree,
      outside.commonDirectory,
      outside.githubIdentity,
      outside.defaultBranch,
    ]).toHaveLength(5);
    expect(outside.membership.ok).toBe(false);
    const malformed = await observeDoctorRepository(
      "/start",
      "/bin/git",
      repositoryRunner({
        "remote get-url origin": ok("https://example.com/owner/repo\n"),
        "symbolic-ref --quiet refs/remotes/origin/HEAD": bad(),
      }),
    );
    expect(malformed.githubIdentity.ok).toBe(false);
    expect(malformed.defaultBranch.ok).toBe(false);
  });

  it("checks GitHub auth and Copilot usability concurrently once with redacted diagnostics", async () => {
    const runner = new RecordingRunner((spec) =>
      spec.args[0] === "auth" ? bad("token=ghp_abcdefghijklmnop") : ok("1.0"),
    );
    const executables = {
      git: { ok: true, value: "/tools/git", message: null, remediation: null },
      gh: { ok: true, value: "/tools/gh", message: null, remediation: null },
      tmux: {
        ok: true,
        value: "/tools/tmux",
        message: null,
        remediation: null,
      },
      node: {
        ok: true,
        value: "/tools/node",
        message: null,
        remediation: null,
      },
      copilot: {
        ok: true,
        value: "/tools/copilot",
        message: null,
        remediation: null,
      },
    } as const;
    const result = await observeDoctorAuthentication({
      runner,
      cwd: "/repo",
      executables,
      githubHost: "github.com",
    });
    expect(result.github.message).toContain("[REDACTED]");
    expect(result.github.message).not.toContain("ghp_");
    expect(result.copilot.ok).toBe(true);
    expect(runner.calls.map((call) => [call.executable, call.args])).toEqual([
      ["/tools/gh", ["auth", "status", "--hostname", "github.com"]],
      ["/tools/copilot", ["--version"]],
    ]);
    expect(redact("password=hunter2")).toBe("[REDACTED]");
  });

  it("allowlists probe environment and reports timeout/launch uncertainty without retries", async () => {
    expect(
      doctorEnvironment({
        PATH: "/bin",
        HOME: "/home/u",
        GH_TOKEN: "secret",
        OTHER: "x",
      }),
    ).toEqual({ PATH: "/bin", HOME: "/home/u" });
    const timeout: DoctorCommandResult = {
      exitCode: null,
      signal: "SIGTERM",
      stdout: "",
      stderr: "",
      stdoutBuffer: Buffer.alloc(0),
      stderrBuffer: Buffer.alloc(0),
      stdoutByteCount: 0,
      stderrByteCount: 0,
      stdoutTruncated: false,
      stderrTruncated: false,
      timedOut: true,
      cancelled: false,
      launchError: null,
    };
    const runner = new RecordingRunner(() => timeout);
    const absent = {
      ok: false,
      value: null,
      message: "missing",
      remediation: "install",
    } as const;
    const executables = {
      git: absent,
      gh: { ok: true, value: "/gh", message: null, remediation: null },
      tmux: absent,
      node: absent,
      copilot: {
        ok: true,
        value: "/copilot",
        message: null,
        remediation: null,
      },
    } as const;
    const result = await observeDoctorAuthentication({
      runner,
      cwd: "/repo",
      executables,
      githubHost: "github.com",
    });
    expect(result.github.message).toContain("2000ms");
    expect(result.copilot.ok).toBe(false);
    expect(runner.calls).toHaveLength(2);
  });
});
