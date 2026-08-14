import type { TmuxIdentity } from "./domain";
import type { CommandResult, CommandRunner } from "./live";
import { createLivePorts } from "./live";
import {
  buildTmuxIdentityDiagnostic,
  parseTmuxIdentityResult,
  TmuxIdentityOutputError,
} from "./tmux-identity";

function result(
  stdout: Buffer | string,
  exitCode = 0,
  stderr: Buffer | string = Buffer.alloc(0),
): CommandResult {
  const stdoutBuffer =
    typeof stdout === "string" ? Buffer.from(stdout, "utf8") : stdout;
  const stderrBuffer =
    typeof stderr === "string" ? Buffer.from(stderr, "utf8") : stderr;
  return {
    exitCode,
    signal: null,
    stdout: stdoutBuffer.toString("utf8"),
    stderr: stderrBuffer.toString("utf8"),
    stdoutBuffer,
    stderrBuffer,
    stdoutByteCount: stdoutBuffer.byteLength,
    stderrByteCount: stderrBuffer.byteLength,
  };
}

class QueueCommandRunner implements CommandRunner {
  public readonly calls: Array<{
    readonly executable: string;
    readonly args: readonly string[];
    readonly cwd: string;
    readonly timeoutMs: number;
    readonly shell: false | undefined;
  }> = [];

  public constructor(private readonly results: CommandResult[]) {}

  public async run(
    executable: string,
    args: readonly string[],
    cwd: string,
    timeoutMs: number,
    shell?: false,
  ): Promise<CommandResult> {
    this.calls.push({ executable, args, cwd, timeoutMs, shell });
    const next = this.results.shift();
    if (next === undefined)
      throw new Error("controlled result queue exhausted");
    return next;
  }

  public async runInherited(
    executable: string,
    args: readonly string[],
    cwd: string,
  ): Promise<CommandResult> {
    return this.run(executable, args, cwd, 0, false);
  }
}

const target: TmuxIdentity = {
  sessionName: "sf-owner-repo",
  windowName: "29",
  windowId: "@1",
  paneId: "%1",
  cwd: "/tmp",
};

async function createWith(stdout: Buffer | string, exitCode = 0) {
  const commands = new QueueCommandRunner([
    result(""),
    result("dashboard\n"),
    result(stdout, exitCode, exitCode === 0 ? "" : "secret-stderr"),
  ]);
  const created = createLivePorts(commands).tmux.createIssueWindow({
    sessionName: target.sessionName,
    windowName: target.windowName,
    cwd: target.cwd,
    executable: "soft-factory",
    args: ["internal", "run-agent", "--issue", "29"],
  });
  return { commands, created };
}

async function observeWith(stdout: Buffer | string, exitCode = 0) {
  const commands = new QueueCommandRunner([result(stdout, exitCode)]);
  const observed = createLivePorts(commands).tmux.observe(target);
  return { commands, observed };
}

describe("Issue 29 strict tmux identity transport", () => {
  it.each([
    ["tmux 3.7b bytes", Buffer.from([0x40, 0x31, 0x09, 0x25, 0x31, 0x0a])],
    ["optional final LF absent", Buffer.from("@1\t%1")],
  ])("accepts exact creation %s", async (_label, bytes) => {
    const { commands, created } = await createWith(bytes);
    await expect(created).resolves.toEqual({
      ...target,
      windowName: "29",
    });
    expect(commands.calls.at(-1)).toEqual({
      executable: "tmux",
      args: [
        "new-window",
        "-d",
        "-P",
        "-F",
        "#{window_id}\t#{pane_id}",
        "-t",
        target.sessionName,
        "-n",
        "29",
        "-c",
        "/tmp",
        "soft-factory",
        "internal",
        "run-agent",
        "--issue",
        "29",
      ],
      cwd: "/tmp",
      timeoutMs: 15_000,
      shell: undefined,
    });
  });

  it("observes only same-name presence and treats an absent session as zero candidates", async () => {
    const presentCommands = new QueueCommandRunner([result("dashboard\n29\n")]);
    await expect(
      createLivePorts(presentCommands).tmux.observeIssueWindowName({
        sessionName: target.sessionName,
        windowName: target.windowName,
        cwd: target.cwd,
      }),
    ).resolves.toBe(true);
    expect(presentCommands.calls[0]).toMatchObject({
      executable: "tmux",
      args: ["list-windows", "-t", target.sessionName, "-F", "#{window_name}"],
      timeoutMs: 15_000,
    });

    const absentCommands = new QueueCommandRunner([
      result("", 1, "can.t find session: value-never-persisted"),
    ]);
    await expect(
      createLivePorts(absentCommands).tmux.observeIssueWindowName({
        sessionName: target.sessionName,
        windowName: target.windowName,
        cwd: target.cwd,
      }),
    ).resolves.toBe(false);
  });

  it.each([
    [
      "tmux 3.7b bytes",
      Buffer.from([
        0x40, 0x31, 0x09, 0x25, 0x31, 0x09, 0x2f, 0x74, 0x6d, 0x70, 0x0a,
      ]),
    ],
    ["optional final LF absent", Buffer.from("@1\t%1\t/tmp")],
  ])("accepts exact observation %s", async (_label, bytes) => {
    const { commands, observed } = await observeWith(bytes);
    await expect(observed).resolves.toEqual(target);
    expect(commands.calls).toEqual([
      {
        executable: "tmux",
        args: [
          "list-panes",
          "-t",
          "sf-owner-repo:29",
          "-F",
          "#{window_id}\t#{pane_id}\t#{pane_current_path}",
        ],
        cwd: "/tmp",
        timeoutMs: 15_000,
        shell: undefined,
      },
    ]);
  });

  it.each([
    ["empty", ""],
    ["one field", "@1\n"],
    ["extra field", "@1\t%1\textra\n"],
    ["two records", "@1\t%1\n@2\t%2\n"],
    ["window grammar", "1\t%1\n"],
    ["pane grammar", "@1\t1\n"],
  ])("rejects required creation matrix: %s", async (_label, stdout) => {
    const { commands, created } = await createWith(stdout);
    await expect(created).rejects.toMatchObject({
      code: "TMUX_IDENTITY_MALFORMED",
      tmuxIdentityDiagnostic: { phase: "create" },
    });
    expect(commands.calls).toHaveLength(3);
  });

  it.each([
    ["empty", ""],
    ["two fields", "@1\t%1\n"],
    ["extra field", "@1\t%1\t/tmp\textra\n"],
    ["two records", "@1\t%1\t/tmp\n@2\t%2\t/tmp\n"],
    ["window grammar", "1\t%1\t/tmp\n"],
    ["pane grammar", "@1\t1\t/tmp\n"],
  ])("rejects required observation matrix: %s", async (_label, stdout) => {
    const { commands, observed } = await observeWith(stdout);
    await expect(observed).rejects.toMatchObject({
      code: "TMUX_IDENTITY_MALFORMED",
      tmuxIdentityDiagnostic: { phase: "observe" },
    });
    expect(commands.calls).toHaveLength(1);
  });

  it.each([
    ["CRLF", Buffer.from("@1\t%1\t/tmp\r\n")],
    ["two final LFs", Buffer.from("@1\t%1\t/tmp\n\n")],
    ["empty cwd", Buffer.from("@1\t%1\t\n")],
    [
      "invalid UTF-8 cwd",
      Buffer.from([0x40, 0x31, 0x09, 0x25, 0x31, 0x09, 0xc3, 0x28]),
    ],
    ["partial window", Buffer.from("@x\t%1\t/tmp")],
    ["partial pane", Buffer.from("@1\t%1x\t/tmp")],
  ])("rejects bounded transport control: %s", async (_label, stdout) => {
    const { observed } = await observeWith(stdout);
    await expect(observed).rejects.toMatchObject({
      code: "TMUX_IDENTITY_MALFORMED",
    });
  });

  it("keeps nonzero observe as absence and nonzero create as a bounded command failure", async () => {
    const observation = await observeWith("secret-path", 1);
    await expect(observation.observed).resolves.toBeNull();

    const creation = await createWith("secret-path", 1);
    await expect(creation.created).rejects.toMatchObject({
      code: "EXTERNAL_COMMAND_FAILED",
      tmuxIdentityDiagnostic: {
        phase: "create",
        exitCode: 1,
        stdoutByteCount: 11,
        stderrByteCount: 13,
      },
    });
  });
});

describe("Issue 29 bounded value-free tmux diagnostics", () => {
  it("reports exact original byte structure without retaining values", () => {
    const stdout = Buffer.from([
      0x40, 0x31, 0x09, 0x25, 0x31, 0x0d, 0x0a, 0x5c, 0xff,
    ]);
    const diagnostic = buildTmuxIdentityDiagnostic(
      "observe",
      result(stdout, 0, Buffer.from([0xff, 0x00])),
    );
    expect(diagnostic).toEqual({
      schemaVersion: 1,
      phase: "observe",
      exitCode: 0,
      stdoutByteCount: 9,
      stderrByteCount: 2,
      recordCount: 2,
      recordsTruncated: false,
      records: [
        { fieldCount: 2, truncated: false },
        { fieldCount: 1, truncated: false },
      ],
      signature: [
        "window_id",
        "horizontal_tab",
        "pane_id",
        "carriage_return",
        "line_feed",
        "backslash",
        "other",
      ],
      signatureTruncated: false,
    });
    expect(
      buildTmuxIdentityDiagnostic("create", result(Buffer.alloc(0))),
    ).toMatchObject({ recordCount: 0, records: [] });
  });

  it("caps records, fields, and signature exactly at 8/8/32", () => {
    const records = Array.from({ length: 9 }, () =>
      Array.from({ length: 9 }, () => "x").join("\t"),
    ).join("\n");
    const bounded = buildTmuxIdentityDiagnostic("create", result(records));
    expect(bounded).toMatchObject({
      recordCount: 8,
      recordsTruncated: true,
      records: Array.from({ length: 8 }, () => ({
        fieldCount: 8,
        truncated: true,
      })),
    });
    const signatureInput = Buffer.from(
      Array.from({ length: 17 }, () => "@1\t").join(""),
    );
    const signature = buildTmuxIdentityDiagnostic(
      "observe",
      result(signatureInput),
    );
    expect(signature.signature).toHaveLength(32);
    expect(signature.signatureTruncated).toBe(true);
  });

  it("keeps command, stderr, cwd, identity, and other-run sentinels off every error diagnostic", () => {
    const sentinels = [
      "secret-path-component",
      "secret-command-argument",
      "secret-environment-value",
      "issue-29-owner-run",
      "other-run-bytes",
    ];
    const command = result(
      sentinels.join("/"),
      0,
      sentinels.slice().reverse().join("/"),
    );
    let captured: TmuxIdentityOutputError | null = null;
    try {
      parseTmuxIdentityResult("create", command);
    } catch (cause: unknown) {
      if (!(cause instanceof TmuxIdentityOutputError)) throw cause;
      captured = cause;
    }
    expect(captured).not.toBeNull();
    const serialized = JSON.stringify(captured);
    for (const sentinel of sentinels)
      expect(serialized).not.toContain(sentinel);
    expect(serialized).not.toContain("stdoutBuffer");
    expect(serialized).not.toContain("stderrBuffer");
  });
});
