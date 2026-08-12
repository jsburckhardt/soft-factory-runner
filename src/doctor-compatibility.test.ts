import * as fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type {
  DoctorCommandResult,
  DoctorCommandRunner,
  DoctorCommandSpec,
} from "./doctor-adapters";
import { observeDoctorCompatibility } from "./doctor-compatibility";

const success: DoctorCommandResult = {
  exitCode: 0,
  signal: null,
  stdout: "",
  stderr: "",
  timedOut: false,
  launchError: null,
};
class IgnoreRunner implements DoctorCommandRunner {
  public readonly calls: DoctorCommandSpec[] = [];
  public constructor(private readonly ignored = true) {}
  public async run(spec: DoctorCommandSpec): Promise<DoctorCommandResult> {
    this.calls.push(spec);
    return this.ignored ? success : { ...success, exitCode: 1 };
  }
}
async function fixture(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doctor-compatible-"));
  await fs.mkdir(path.join(root, ".git"));
  await fs.mkdir(path.join(root, ".github", "agents"), { recursive: true });
  await fs.mkdir(path.join(root, ".soft-factory"));
  await fs.writeFile(
    path.join(root, ".github", "agents", "rpiv.agent.md"),
    "---\nname: rpiv\nrunner_protocol: 1\nresult_contract: agent-result-v1\n---\n",
  );
  await fs.writeFile(
    path.join(root, ".soft-factory", "config.yml"),
    "protocol_version: 1\nrepository:\n  worktree_root: .trees\n  state_root: .soft-factory\n",
  );
  return root;
}

describe("Doctor compatibility checks", () => {
  it("passes eight distinct checks using exact ignore probes and reversible state evidence", async () => {
    const root = await fixture();
    const configPath = path.join(root, ".soft-factory", "config.yml");
    const before = await fs.readFile(configPath, "utf8");
    const runner = new IgnoreRunner();
    const result = await observeDoctorCompatibility({
      primaryWorktree: root,
      commonDirectory: path.join(root, ".git"),
      gitExecutable: "/bin/git",
      runner,
      token: "known",
    });
    expect(
      [
        result.rpivAgent,
        result.runnerProtocol,
        result.configuration,
        result.worktreeRoot,
        result.stateRootWritable,
        result.treesIgnored,
        result.runtimeStateIgnored,
        result.resultContract,
      ].every((entry) => entry.ok),
    ).toBe(true);
    expect(runner.calls.map((call) => call.args)).toEqual([
      [
        "check-ignore",
        "--no-index",
        "--quiet",
        "--",
        path.join(root, ".trees", "doctor-ignore-probe"),
      ],
      [
        "check-ignore",
        "--no-index",
        "--quiet",
        "--",
        path.join(root, ".soft-factory", "doctor-ignore-probe"),
      ],
    ]);
    expect(await fs.readFile(configPath, "utf8")).toBe(before);
    expect((await fs.readdir(path.join(root, ".soft-factory"))).sort()).toEqual(
      ["config.yml"],
    );
    await fs.rm(root, { recursive: true, force: true });
  });

  it("isolates missing/wrong metadata, protocol, configuration, and ignore failures", async () => {
    const root = await fixture();
    const agent = path.join(root, ".github", "agents", "rpiv.agent.md");
    await fs.writeFile(
      agent,
      "---\nname: rpiv\nrunner_protocol: 2\nresult_contract: other\n---\n",
    );
    const metadata = await observeDoctorCompatibility({
      primaryWorktree: root,
      commonDirectory: path.join(root, ".git"),
      gitExecutable: "/bin/git",
      runner: new IgnoreRunner(),
    });
    expect(metadata.rpivAgent.ok).toBe(true);
    expect(metadata.runnerProtocol.ok).toBe(false);
    expect(metadata.resultContract.ok).toBe(false);
    await fs.writeFile(
      path.join(root, ".soft-factory", "config.yml"),
      "protocol_version: 1\nunknown: value\n",
    );
    const invalid = await observeDoctorCompatibility({
      primaryWorktree: root,
      commonDirectory: path.join(root, ".git"),
      gitExecutable: "/bin/git",
      runner: new IgnoreRunner(false),
    });
    expect(invalid.configuration.ok).toBe(false);
    expect(invalid.worktreeRoot.ok).toBe(false);
    expect(invalid.treesIgnored.ok).toBe(false);
    expect(invalid.runtimeStateIgnored.ok).toBe(false);
    await fs.rm(root, { recursive: true, force: true });
  });

  it("rejects file collisions and physical symlink escapes without persistent probes", async () => {
    const root = await fixture();
    await fs.writeFile(path.join(root, "collision"), "preserve");
    await fs.writeFile(
      path.join(root, ".soft-factory", "config.yml"),
      "protocol_version: 1\nrepository:\n  worktree_root: collision\n  state_root: .soft-factory\n",
    );
    const collision = await observeDoctorCompatibility({
      primaryWorktree: root,
      commonDirectory: path.join(root, ".git"),
      gitExecutable: "/bin/git",
      runner: new IgnoreRunner(),
    });
    expect(collision.worktreeRoot.message).toContain("file");
    expect(await fs.readFile(path.join(root, "collision"), "utf8")).toBe(
      "preserve",
    );
    const outside = await fs.mkdtemp(path.join(os.tmpdir(), "doctor-outside-"));
    await fs.unlink(path.join(root, "collision"));
    await fs.symlink(outside, path.join(root, "collision"));
    const escaped = await observeDoctorCompatibility({
      primaryWorktree: root,
      commonDirectory: path.join(root, ".git"),
      gitExecutable: "/bin/git",
      runner: new IgnoreRunner(),
    });
    expect(escaped.worktreeRoot.message).toContain("symlink");
    await fs.rm(root, { recursive: true, force: true });
    await fs.rm(outside, { recursive: true, force: true });
  });
});
