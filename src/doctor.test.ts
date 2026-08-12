import { parseConfiguration } from "./config";
import {
  DOCTOR_CHECK_DEPENDENCIES,
  DOCTOR_CHECK_IDS,
  failedCheck,
  makeDoctorResult,
  parseRpivMetadata,
  passedCheck,
} from "./doctor";

const canonicalIds = [
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
];

describe("Doctor contracts", () => {
  it("defines exactly 24 unique ordered blocking checks and complete dependencies", () => {
    expect(DOCTOR_CHECK_IDS).toEqual(canonicalIds);
    expect(new Set(DOCTOR_CHECK_IDS).size).toBe(24);
    expect(Object.keys(DOCTOR_CHECK_DEPENDENCIES)).toEqual(canonicalIds);
    for (const [id, dependencies] of Object.entries(DOCTOR_CHECK_DEPENDENCIES))
      for (const dependency of dependencies)
        expect(canonicalIds.indexOf(dependency)).toBeLessThan(
          canonicalIds.indexOf(id),
        );
  });

  it("aggregates readiness and rejects missing or unordered checks", () => {
    const allPass = DOCTOR_CHECK_IDS.map(passedCheck);
    expect(
      makeDoctorResult({ github: null, defaultBranch: null }, allPass),
    ).toEqual({
      schemaVersion: 1,
      ready: true,
      repository: { github: null, defaultBranch: null },
      checks: allPass,
    });
    const oneFailure = [...allPass];
    oneFailure[4] = failedCheck(
      "repository.default-branch",
      "Default branch is unknown.",
      "Configure remote HEAD.",
    );
    expect(
      makeDoctorResult(
        { github: "owner/repo", defaultBranch: null },
        oneFailure,
      ).ready,
    ).toBe(false);
    expect(() =>
      makeDoctorResult({ github: null, defaultBranch: null }, allPass.slice(1)),
    ).toThrow("canonical ordered 24");
  });

  it("parses protocol and repository roots strictly without changing legacy defaults", () => {
    expect(parseConfiguration(null)).toMatchObject({
      protocolVersion: null,
      worktreeRoot: ".trees",
      stateRoot: ".soft-factory",
    });
    expect(
      parseConfiguration(
        "protocol_version: 1\nrepository:\n  worktree_root: worktrees\n  state_root: state\n",
      ),
    ).toMatchObject({
      protocolVersion: 1,
      worktreeRoot: "worktrees",
      stateRoot: "state",
    });
    expect(
      parseConfiguration(
        "repository:\nrpiv:\nexecution:\nbranch_types:\nprotocol_version: 1\n",
      ),
    ).toMatchObject({
      protocolVersion: 1,
      worktreeRoot: ".trees",
      stateRoot: ".soft-factory",
      promptTemplate: "Deliver issue #{issue}",
      maxConcurrentRuns: 1,
      labelTypes: { feature: "feat" },
    });
    for (const text of [
      "unknown: value\n",
      "unknown:\n",
      "repository:\n  unknown:\n",
      "protocol_version: nope\n",
      "repository:\n  worktree_root: /tmp/trees\n",
      "repository:\n  state_root: ../state\n",
      "repository:\n  worktree_root: data\n  state_root: data/state\n",
    ])
      expect(() => parseConfiguration(text)).toThrow();
  });

  it("parses only canonical explicit RPIV compatibility metadata", () => {
    expect(
      parseRpivMetadata(
        "---\nname: rpiv\nrunner_protocol: 1\nresult_contract: agent-result-v1\n---\n",
      ),
    ).toEqual({
      name: "rpiv",
      runnerProtocol: 1,
      resultContract: "agent-result-v1",
    });
    expect(parseRpivMetadata("---\nname: rpiv\n---\n")).toEqual({
      name: "rpiv",
      runnerProtocol: null,
      resultContract: null,
    });
    expect(() => parseRpivMetadata("name: rpiv")).toThrow("frontmatter");
  });
});
