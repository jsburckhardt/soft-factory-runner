import { parseConfiguration } from "./config";
import {
  DOCTOR_CHECK_DEPENDENCIES,
  DOCTOR_CHECK_IDS,
  DOCTOR_TMUX_OPERATIONS,
  DOCTOR_TMUX_REASONS,
  failedCheck,
  isDoctorResultV2,
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
      schemaVersion: 2,
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

  it("validates schema-v2 value-free tmux evidence and closed enums strictly", () => {
    expect(DOCTOR_TMUX_OPERATIONS).toEqual([
      "workspace",
      "server-start",
      "socket-ready",
      "session-create",
      "session-query",
      "window-list",
      "dashboard-pane-identify",
      "window-create",
      "window-configure",
      "issue-pane-identify",
      "pane-observe",
      "window-remove",
      "server-stop",
      "helper-stop",
      "workspace-remove",
      "aggregate",
    ]);
    expect(DOCTOR_TMUX_REASONS).toEqual([
      "unavailable",
      "unsafe-workspace",
      "filesystem-failed",
      "launch-failed",
      "socket-unavailable",
      "nonzero-exit",
      "timeout",
      "cancelled",
      "output-truncated",
      "malformed-output",
      "identity-mismatch",
      "cwd-mismatch",
      "process-identity-unknown",
      "cleanup-failed",
      "unexpected-resource",
      "aggregate-deadline",
    ]);
    const evidence = {
      schemaVersion: 1 as const,
      kind: "tmux-functional-probe" as const,
      operation: "window-create" as const,
      reason: "malformed-output" as const,
      exitCode: 0,
      timedOut: false,
      stdoutByteCount: 7,
      stderrByteCount: 0,
      stdoutTruncated: false,
      stderrTruncated: false,
      identityDiagnostic: {
        schemaVersion: 1 as const,
        phase: "create" as const,
        exitCode: 0,
        stdoutByteCount: 6,
        stderrByteCount: 0,
        recordCount: 1,
        recordsTruncated: false,
        records: [{ fieldCount: 2, truncated: false }],
        signature: [
          "window_id" as const,
          "vertical_bar" as const,
          "pane_id" as const,
          "line_feed" as const,
        ],
        signatureTruncated: false,
      },
      cleanup: {
        server: "absent" as const,
        paneProcesses: "absent" as const,
        socket: "absent" as const,
        workspace: "absent" as const,
      },
    };
    const result = makeDoctorResult(
      { github: null, defaultBranch: null },
      DOCTOR_CHECK_IDS.map((id) =>
        id === "command.tmux"
          ? failedCheck(
              id,
              "The isolated tmux probe failed.",
              "Repair tmux and rerun Doctor.",
              evidence,
            )
          : passedCheck(id),
      ),
    );
    expect(isDoctorResultV2(result)).toBe(true);
    for (const mutate of [
      (value: Record<string, unknown>) => {
        value.schemaVersion = 1;
      },
      (value: Record<string, unknown>) => {
        value.extra = true;
      },
      (value: Record<string, unknown>) => {
        const checks = value.checks;
        if (Array.isArray(checks)) checks.reverse();
      },
      (value: Record<string, unknown>) => {
        const checks = value.checks;
        if (
          Array.isArray(checks) &&
          typeof checks[7] === "object" &&
          checks[7] !== null
        )
          Reflect.set(checks[7], "evidence", {
            ...evidence,
            reason: "unknown",
          });
      },
      (value: Record<string, unknown>) => {
        const checks = value.checks;
        if (!Array.isArray(checks)) return;
        const check = checks[7];
        if (typeof check !== "object" || check === null) return;
        const invalidEvidence = JSON.parse(JSON.stringify(evidence));
        invalidEvidence.identityDiagnostic.signature = ["raw-value"];
        Reflect.set(check, "evidence", invalidEvidence);
      },
    ]) {
      const copy: Record<string, unknown> = JSON.parse(JSON.stringify(result));
      mutate(copy);
      expect(isDoctorResultV2(copy)).toBe(false);
    }
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
