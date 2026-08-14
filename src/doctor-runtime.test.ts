import * as fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type {
  DoctorCommandResult,
  DoctorCommandRunner,
  DoctorCommandSpec,
} from "./doctor-adapters";
import { observeDoctorRuntime } from "./doctor-runtime";

const owner = (issue = 5) => ({
  schemaVersion: 1,
  issueNumber: issue,
  ownerId: "owner-1",
  runId: "run-1",
  repository: "owner/repo",
  acquiredAt: "2026-08-12T00:00:00.000Z",
});
const snapshot = (worktreePath: string, issue = 5) => ({
  schemaVersion: 1,
  runId: "run-1",
  ownerId: "owner-1",
  repository: "owner/repo",
  issueNumber: issue,
  branchType: "feat",
  branch: "feat/5-test",
  worktreePath,
  fetchedBaseProof: null,
  tmux: null,
  copilot: null,
  error: null,
  updatedAt: "2026-08-12T00:00:00.000Z",
  state: "interrupted",
});
class WorktreeRunner implements DoctorCommandRunner {
  public readonly calls: DoctorCommandSpec[] = [];
  public constructor(
    private readonly paths: readonly string[],
    private readonly exitCode = 0,
  ) {}
  public async run(spec: DoctorCommandSpec): Promise<DoctorCommandResult> {
    this.calls.push(spec);
    const stdout = this.paths
      .map((entry) => "worktree " + entry + "\nHEAD abc\n")
      .join("\n");
    return {
      exitCode: this.exitCode,
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
    };
  }
}
async function runtimeFixture(
  withOwnedTree = false,
): Promise<{ root: string; trees: string; state: string; worktree: string }> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doctor-runtime-"));
  const trees = path.join(root, ".trees");
  const state = path.join(root, ".soft-factory");
  const worktree = path.join(trees, "5");
  await fs.mkdir(trees);
  await fs.mkdir(state);
  if (withOwnedTree) {
    await fs.mkdir(worktree);
    await fs.mkdir(path.join(state, "runs"));
    await fs.writeFile(
      path.join(state, "runs", "5.json"),
      JSON.stringify(snapshot(worktree)),
    );
    await fs.mkdir(path.join(state, "locks"));
    await fs.writeFile(
      path.join(state, "locks", "5.lock"),
      JSON.stringify(owner()),
    );
  }
  return { root, trees, state, worktree };
}

describe("Doctor runtime safety inventory", () => {
  it("passes empty and exactly owned runtime inventories with read-only traces", async () => {
    const empty = await runtimeFixture();
    const emptyResult = await observeDoctorRuntime({
      primaryWorktree: empty.root,
      worktreeRoot: empty.trees,
      stateRoot: empty.state,
      repositoryIdentity: "owner/repo",
      gitExecutable: "/bin/git",
      runner: new WorktreeRunner([]),
      token: "empty",
    });
    expect(Object.values(emptyResult).every((entry) => entry.ok)).toBe(true);
    await fs.rm(empty.root, { recursive: true, force: true });

    const owned = await runtimeFixture(true);
    const snapshotPath = path.join(owned.state, "runs", "5.json");
    const lockPath = path.join(owned.state, "locks", "5.lock");
    const before = [
      await fs.readFile(snapshotPath, "utf8"),
      await fs.readFile(lockPath, "utf8"),
    ];
    const runner = new WorktreeRunner([owned.root, owned.worktree]);
    const result = await observeDoctorRuntime({
      primaryWorktree: owned.root,
      worktreeRoot: owned.trees,
      stateRoot: owned.state,
      repositoryIdentity: "owner/repo",
      gitExecutable: "/bin/git",
      runner,
      token: "owned",
    });
    expect(Object.values(result).every((entry) => entry.ok)).toBe(true);
    expect(runner.calls).toHaveLength(1);
    expect(runner.calls[0]).toMatchObject({
      args: ["worktree", "list", "--porcelain"],
      timeoutMs: 2000,
      shell: false,
    });
    expect([
      await fs.readFile(snapshotPath, "utf8"),
      await fs.readFile(lockPath, "utf8"),
    ]).toEqual(before);
    await fs.rm(owned.root, { recursive: true, force: true });
  });

  it("fails malformed recognized state and locks while ignoring unrelated names", async () => {
    const f = await runtimeFixture();
    await fs.mkdir(path.join(f.state, "runs"));
    await fs.writeFile(
      path.join(f.state, "runs", "notes.txt"),
      "malformed but unrelated",
    );
    await fs.mkdir(path.join(f.state, "locks"));
    await fs.writeFile(
      path.join(f.state, "locks", "notes.lock.bak"),
      "malformed but unrelated",
    );
    const clean = await observeDoctorRuntime({
      primaryWorktree: f.root,
      worktreeRoot: f.trees,
      stateRoot: f.state,
      repositoryIdentity: "owner/repo",
      gitExecutable: "/bin/git",
      runner: new WorktreeRunner([]),
      token: "clean",
    });
    expect(clean.stateReadable.ok).toBe(true);
    expect(clean.locksInterpretable.ok).toBe(true);
    await fs.writeFile(path.join(f.state, "runs", "5.json"), "{broken");
    await fs.writeFile(path.join(f.state, "locks", "5.lock"), "{}");
    const broken = await observeDoctorRuntime({
      primaryWorktree: f.root,
      worktreeRoot: f.trees,
      stateRoot: f.state,
      repositoryIdentity: "owner/repo",
      gitExecutable: "/bin/git",
      runner: new WorktreeRunner([]),
      token: "broken",
    });
    expect(broken.stateReadable.ok).toBe(false);
    expect(broken.locksInterpretable.ok).toBe(false);
    await fs.rm(f.root, { recursive: true, force: true });
  });

  it("fails unknown or mismatched numeric worktree ownership without modifying it", async () => {
    const f = await runtimeFixture(true);
    await fs.writeFile(path.join(f.worktree, "preserve.txt"), "preserve");
    await fs.writeFile(
      path.join(f.state, "locks", "5.lock"),
      JSON.stringify({ ...owner(), runId: "other" }),
    );
    const result = await observeDoctorRuntime({
      primaryWorktree: f.root,
      worktreeRoot: f.trees,
      stateRoot: f.state,
      repositoryIdentity: "owner/repo",
      gitExecutable: "/bin/git",
      runner: new WorktreeRunner([f.root, f.worktree]),
      token: "mismatch",
    });
    expect(result.treesOwnership.ok).toBe(false);
    expect(
      await fs.readFile(path.join(f.worktree, "preserve.txt"), "utf8"),
    ).toBe("preserve");
    await fs.rm(f.root, { recursive: true, force: true });
  });

  it("fails snapshot/lock repository mismatch when discovery is unavailable and accepts a matching control", async () => {
    const matching = await runtimeFixture(true);
    const matchingResult = await observeDoctorRuntime({
      primaryWorktree: matching.root,
      worktreeRoot: matching.trees,
      stateRoot: matching.state,
      repositoryIdentity: null,
      gitExecutable: "/bin/git",
      runner: new WorktreeRunner([matching.root, matching.worktree]),
      token: "matching-no-discovery",
    });
    expect(matchingResult.treesOwnership.ok).toBe(true);
    await fs.rm(matching.root, { recursive: true, force: true });

    const mismatched = await runtimeFixture(true);
    await fs.writeFile(
      path.join(mismatched.state, "locks", "5.lock"),
      JSON.stringify({ ...owner(), repository: "other/repo" }),
    );
    const mismatchResult = await observeDoctorRuntime({
      primaryWorktree: mismatched.root,
      worktreeRoot: mismatched.trees,
      stateRoot: mismatched.state,
      repositoryIdentity: null,
      gitExecutable: "/bin/git",
      runner: new WorktreeRunner([mismatched.root, mismatched.worktree]),
      token: "mismatch-no-discovery",
    });
    expect(mismatchResult.treesOwnership.ok).toBe(false);
    expect(mismatchResult.treesOwnership.message).toContain(
      "mismatched ownership proof",
    );
    await fs.rm(mismatched.root, { recursive: true, force: true });
  });

  it("uses exclusive reversible required-path probes and preserves collisions", async () => {
    const f = await runtimeFixture();
    const collision = path.join(f.trees, ".doctor-path-worktree-collision");
    await fs.writeFile(collision, "owned by someone else");
    const result = await observeDoctorRuntime({
      primaryWorktree: f.root,
      worktreeRoot: f.trees,
      stateRoot: f.state,
      repositoryIdentity: "owner/repo",
      gitExecutable: "/bin/git",
      runner: new WorktreeRunner([]),
      token: "collision",
    });
    expect(result.requiredPathsCreatable.ok).toBe(false);
    expect(await fs.readFile(collision, "utf8")).toBe("owned by someone else");
    await fs.rm(f.root, { recursive: true, force: true });
  });
});
