import * as fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type {
  DoctorCommandResult,
  DoctorCommandRunner,
  DoctorCommandSpec,
} from "./doctor-adapters";
import { observeDoctorCompatibility } from "./doctor-compatibility";
import {
  DOCTOR_CHECK_IDS,
  makeDoctorResult,
  passedCheck,
  failedCheck,
} from "./doctor";

const success: DoctorCommandResult = {
  exitCode: 0,
  signal: null,
  stdout: "",
  stderr: "",
  timedOut: false,
  launchError: null,
};
class Runner implements DoctorCommandRunner {
  public readonly calls: DoctorCommandSpec[] = [];
  public async run(spec: DoctorCommandSpec): Promise<DoctorCommandResult> {
    this.calls.push(spec);
    return success;
  }
}
async function rootFixture(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "asset-doctor-"));
  await fs.mkdir(path.join(root, ".git"));
  await fs.mkdir(path.join(root, ".soft-factory"));
  await fs.writeFile(
    path.join(root, ".soft-factory", "config.yml"),
    "protocol_version: 1\nrepository:\n  worktree_root: .trees\n  state_root: .soft-factory\n",
  );
  return root;
}

describe("V-8 Doctor non-regression and canonical authority", () => {
  it("preserves the exact ordered 24-check vocabulary and readiness conjunction", () => {
    expect(DOCTOR_CHECK_IDS).toEqual([
      "repository.git-membership",
      "repository.primary-worktree",
      "repository.git-common-directory",
      "repository.github-identity",
      "repository.default-branch",
      "command.git",
      "command.gh",
      "command.tmux",
      "command.node",
      "command.copilot",
      "authentication.github-cli",
      "authentication.copilot-cli",
      "compatibility.rpiv-agent",
      "compatibility.runner-protocol",
      "compatibility.configuration",
      "compatibility.worktree-root",
      "compatibility.state-root-writable",
      "compatibility.trees-ignored",
      "compatibility.runtime-state-ignored",
      "compatibility.result-contract",
      "runtime.trees-ownership",
      "runtime.state-readable",
      "runtime.locks-interpretable",
      "runtime.required-paths-creatable",
    ]);
    const ready = makeDoctorResult(
      { github: null, defaultBranch: null },
      DOCTOR_CHECK_IDS.map(passedCheck),
    );
    expect(ready.ready).toBe(true);
    const blocked = makeDoctorResult(
      { github: null, defaultBranch: null },
      DOCTOR_CHECK_IDS.map((id, index) =>
        index === 0 ? failedCheck(id, "blocked", "repair") : passedCheck(id),
      ),
    );
    expect(blocked.ready).toBe(false);
    expect(blocked.checks).toHaveLength(24);
  });

  it("never accepts .agents as an RPIV fallback or inspects its manifest", async () => {
    const root = await rootFixture();
    await fs.mkdir(path.join(root, ".agents", "agents"), { recursive: true });
    await fs.writeFile(
      path.join(root, ".agents", "agents", "rpiv.agent.md"),
      "---\nname: rpiv\nrunner_protocol: 1\nresult_contract: agent-result-v1\n---\n",
    );
    const noCanonical = await observeDoctorCompatibility({
      primaryWorktree: root,
      commonDirectory: path.join(root, ".git"),
      gitExecutable: "/bin/git",
      runner: new Runner(),
      token: "first",
    });
    expect(noCanonical.rpivAgent.ok).toBe(false);
    expect(noCanonical.runnerProtocol.ok).toBe(false);

    await fs.mkdir(path.join(root, ".github", "agents"), { recursive: true });
    await fs.writeFile(
      path.join(root, ".github", "agents", "rpiv.agent.md"),
      "---\nname: rpiv\nrunner_protocol: 1\nresult_contract: agent-result-v1\n---\n",
    );
    await fs.writeFile(
      path.join(root, ".agents", "manifest.json"),
      "malformed and ignored",
    );
    const canonical = await observeDoctorCompatibility({
      primaryWorktree: root,
      commonDirectory: path.join(root, ".git"),
      gitExecutable: "/bin/git",
      runner: new Runner(),
      token: "second",
    });
    expect(canonical.rpivAgent.ok).toBe(true);
    expect(canonical.runnerProtocol.ok).toBe(true);
    expect(canonical.resultContract.ok).toBe(true);
    await fs.rm(root, { recursive: true, force: true });
  });
});
