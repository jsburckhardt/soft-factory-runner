import { spawnSync } from "node:child_process";
import * as fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  DOCTOR_CHECK_IDS,
  failedCheck,
  makeDoctorResult,
  passedCheck,
  type DoctorCheckId,
  type DoctorCheckResultV1,
  type DoctorResultV1,
} from "./doctor";
import type { DoctorRunner } from "./doctor-service";
import { runCli } from "./index";
import type { RunnerPorts } from "./ports";

const projectRoot = path.resolve(__dirname, "..");
const manifests = path.join(projectRoot, "fixtures", "doctor");
const tripwirePorts = new Proxy({} as RunnerPorts, {
  get() {
    throw new Error("isolated Doctor fixture accessed issue ports");
  },
});
class StaticDoctor implements DoctorRunner {
  public constructor(private readonly result: DoctorResultV1) {}
  public async run(): Promise<DoctorResultV1> {
    return this.result;
  }
}
interface IsolatedManifest {
  readonly schemaVersion: 1;
  readonly variants: readonly {
    readonly name: string;
    readonly failedId: DoctorCheckId;
  }[];
}
async function readManifest<T>(name: string): Promise<T> {
  return JSON.parse(await fs.readFile(path.join(manifests, name), "utf8")) as T;
}
function normalizeHuman(text: string): DoctorResultV1 {
  const lines = text.trimEnd().split("\n");
  const checks: DoctorCheckResultV1[] = [];
  for (let index = 3; index < lines.length - 1; index += 1) {
    const match = /^CHECK id=(\S+) status=(passed|failed) blocking=true$/.exec(
      lines[index],
    );
    if (match === null) continue;
    const id = match[1] as DoctorCheckId;
    if (match[2] === "failed") {
      checks.push(
        failedCheck(id, lines[index + 1].slice(11), lines[index + 2].slice(15)),
      );
      index += 2;
    } else checks.push(passedCheck(id));
  }
  const github = lines[1].slice("REPOSITORY github=".length);
  const branch = lines[2].slice("REPOSITORY defaultBranch=".length);
  return {
    schemaVersion: 1,
    ready: lines.at(-1) === "STATUS: READY",
    repository: {
      github: github === "null" ? null : github,
      defaultBranch: branch === "null" ? null : branch,
    },
    checks,
  };
}
async function writeExecutable(target: string, body: string): Promise<void> {
  await fs.writeFile(target, "#!" + process.execPath + "\n" + body);
  await fs.chmod(target, 0o700);
}
async function readyRepository(): Promise<{ root: string; bin: string }> {
  const root = await fs.mkdtemp(
    path.join(os.tmpdir(), "doctor-ready-process-"),
  );
  const bin = path.join(root, "bin");
  await fs.mkdir(bin);
  await fs.mkdir(path.join(root, ".git"));
  await fs.mkdir(path.join(root, ".github", "agents"), { recursive: true });
  await fs.mkdir(path.join(root, ".soft-factory"));
  await fs.mkdir(path.join(root, ".trees"));
  await fs.writeFile(
    path.join(root, ".github", "agents", "rpiv.agent.md"),
    "---\nname: rpiv\nrunner_protocol: 1\nresult_contract: agent-result-v1\n---\n",
  );
  await fs.writeFile(
    path.join(root, ".soft-factory", "config.yml"),
    "protocol_version: 1\nrepository:\n  worktree_root: .trees\n  state_root: .soft-factory\n",
  );
  const gitBody = `const a=process.argv.slice(2);const k=a.join(" ");const cwd=process.cwd();let out="";let code=0;if(k==="rev-parse --is-inside-work-tree")out="true\\n";else if(k==="rev-parse --show-toplevel")out=cwd+"\\n";else if(k==="rev-parse --path-format=absolute --git-common-dir")out=cwd+"/.git\\n";else if(k==="remote")out="origin\\n";else if(k==="remote get-url origin")out="git@github.com:owner/repo.git\\n";else if(k==="symbolic-ref --quiet refs/remotes/origin/HEAD")out="refs/remotes/origin/main\\n";else if(k.startsWith("check-ignore --no-index --quiet -- "))code=0;else if(k==="worktree list --porcelain")out="worktree "+cwd+"\\nHEAD abc\\n";else code=1;process.stdout.write(out);process.exitCode=code;`;
  await writeExecutable(path.join(bin, "git"), gitBody);
  await writeExecutable(
    path.join(bin, "gh"),
    'process.exitCode=process.argv.slice(2).join(" ").startsWith("auth status --hostname github.com")?0:1;',
  );
  await writeExecutable(
    path.join(bin, "copilot"),
    'process.stdout.write("copilot 1\\n");',
  );
  await writeExecutable(path.join(bin, "tmux"), "process.exitCode=0;");
  await writeExecutable(path.join(bin, "node"), "process.exitCode=0;");
  return { root, bin };
}
function builtDoctor(
  cwd: string,
  pathValue: string,
  json: boolean,
): {
  status: number | null;
  stdout: string;
  stderr: string;
  elapsedMs: number;
} {
  const start = process.hrtime.bigint();
  const result = spawnSync(
    process.execPath,
    [
      path.join(projectRoot, "dist", "index.js"),
      "doctor",
      ...(json ? ["--json"] : []),
    ],
    {
      cwd,
      env: { PATH: pathValue, HOME: cwd },
      encoding: "utf8",
      timeout: 10_000,
    },
  );
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    elapsedMs: Number(process.hrtime.bigint() - start) / 1_000_000,
  };
}

describe("Doctor manifest-driven acceptance fixtures", () => {
  beforeAll(() => {
    const build = spawnSync("just", ["build"], {
      cwd: projectRoot,
      encoding: "utf8",
    });
    if (build.status !== 0)
      throw new Error("Fixture build failed: " + build.stdout + build.stderr);
  });

  it("validates complete ordered ready, blocked, and isolated-failure manifests", async () => {
    const ready = await readManifest<DoctorResultV1>("ready.json");
    const blocked = await readManifest<DoctorResultV1>("blocked.json");
    const isolated = await readManifest<IsolatedManifest>(
      "isolated-failures.json",
    );
    for (const manifest of [ready, blocked]) {
      expect(manifest.schemaVersion).toBe(1);
      expect(manifest.checks.map((check) => check.id)).toEqual(
        DOCTOR_CHECK_IDS,
      );
      expect(new Set(manifest.checks.map((check) => check.id)).size).toBe(24);
      expect(manifest.checks.every((check) => check.blocking === true)).toBe(
        true,
      );
    }
    expect(isolated.variants.map((variant) => variant.failedId)).toEqual(
      DOCTOR_CHECK_IDS,
    );
    expect(new Set(isolated.variants.map((variant) => variant.name)).size).toBe(
      24,
    );
  });

  it("executes every isolated failure through normal CLI composition and proves a 24-row pass/fail matrix", async () => {
    const isolated = await readManifest<IsolatedManifest>(
      "isolated-failures.json",
    );
    const matrix: Array<{ id: string; pass: string; fail: string }> = [];
    for (const variant of isolated.variants) {
      const result = makeDoctorResult(
        { github: "owner/repo", defaultBranch: "main" },
        DOCTOR_CHECK_IDS.map((id) =>
          id === variant.failedId
            ? failedCheck(
                id,
                "Fixture prerequisite " + id + " failed.",
                "Correct " + id + " and rerun Doctor.",
              )
            : passedCheck(id),
        ),
      );
      const response = await runCli(
        ["doctor", "--json"],
        "/fixture",
        tripwirePorts,
        new StaticDoctor(result),
      );
      expect(response.exitCode).toBe(3);
      const output = JSON.parse(response.stdout) as DoctorResultV1;
      expect(output.checks).toHaveLength(24);
      expect(
        output.checks
          .filter((check) => check.status === "failed")
          .map((check) => check.id),
      ).toEqual([variant.failedId]);
      matrix.push({ id: variant.failedId, pass: "ready", fail: variant.name });
    }
    expect(matrix.map((row) => row.id)).toEqual(DOCTOR_CHECK_IDS);
  });

  it("runs controlled ready human/JSON built processes with parity, determinism, and <=10 second timing", async () => {
    const fixture = await readyRepository();
    const manifest = await readManifest<DoctorResultV1>("ready.json");
    const jsonFirst = builtDoctor(fixture.root, fixture.bin, true);
    const jsonSecond = builtDoctor(fixture.root, fixture.bin, true);
    const human = builtDoctor(fixture.root, fixture.bin, false);
    expect(jsonFirst.status).toBe(0);
    expect(jsonSecond.status).toBe(0);
    expect(human.status).toBe(0);
    expect(jsonFirst.stderr).toBe("");
    const parsed = JSON.parse(jsonFirst.stdout) as DoctorResultV1;
    expect(parsed).toEqual(manifest);
    expect(JSON.parse(jsonSecond.stdout)).toEqual(parsed);
    expect(normalizeHuman(human.stdout)).toEqual(parsed);
    expect(jsonFirst.elapsedMs).toBeLessThanOrEqual(10_000);
    expect(jsonSecond.elapsedMs).toBeLessThanOrEqual(10_000);
    expect(human.elapsedMs).toBeLessThanOrEqual(10_000);
    await fs.rm(fixture.root, { recursive: true, force: true });
  });

  it("runs a controlled blocked built fixture with complete human/JSON parity and exit 3", async () => {
    const root = await fs.mkdtemp(
      path.join(os.tmpdir(), "doctor-blocked-process-"),
    );
    const bin = path.join(root, "empty-bin");
    await fs.mkdir(bin);
    const json = builtDoctor(root, bin, true);
    const human = builtDoctor(root, bin, false);
    const parsed = JSON.parse(json.stdout) as DoctorResultV1;
    expect(json.status).toBe(3);
    expect(human.status).toBe(3);
    expect(parsed.ready).toBe(false);
    expect(parsed.checks).toHaveLength(24);
    expect(
      parsed.checks.every(
        (check) =>
          check.status === "failed" &&
          check.message !== "" &&
          check.remediation !== "",
      ),
    ).toBe(true);
    expect(normalizeHuman(human.stdout)).toEqual(parsed);
    await fs.rm(root, { recursive: true, force: true });
  });
});
