import { parseCommand } from "./command";
import { parseAgentResult, reconcileCompletion } from "./completion";
import { parseConfiguration } from "./config";
import type { AgentResultV1, RpivStatusV1, RunSnapshotV4 } from "./domain";
import {
  classifyProgress,
  integrationContract,
  integrationLaunch,
  parseRpivStatus,
  publishAgentResult,
  publishProgress,
  renderIntegrationInstructions,
  validateBoundResult,
} from "./integration";
import type { FilePort } from "./ports";

const justfile =
  "verify-focused:\n\ttrue\nverify:\n\ttrue\nrelease_check:\n\ttrue\n";
const now = "2026-08-12T08:00:10.000Z";
const sha = "a".repeat(40);

class MemoryFiles implements FilePort {
  public readonly values = new Map<string, string>();
  public readonly writes: string[] = [];
  public async readText(filePath: string): Promise<string | null> {
    return this.values.get(filePath) ?? null;
  }
  public async readAgentResult(worktreePath: string): Promise<string | null> {
    return this.readText(worktreePath + "/.soft-factory/agent-result.json");
  }
  public async readRpivStatus(worktreePath: string): Promise<string | null> {
    return this.readText(worktreePath + "/.soft-factory/rpiv-status.json");
  }
  public async exists(filePath: string): Promise<boolean> {
    return this.values.has(filePath);
  }
  public async list(): Promise<readonly string[]> {
    return [];
  }
  public async exclusiveCreate(
    filePath: string,
    content: string,
  ): Promise<boolean> {
    if (this.values.has(filePath)) return false;
    this.values.set(filePath, content);
    this.writes.push("exclusive:" + filePath);
    return true;
  }
  public async immutableWrite(
    filePath: string,
    content: string,
  ): Promise<boolean> {
    if (this.values.has(filePath)) return false;
    this.values.set(filePath, content);
    this.writes.push("immutable:" + filePath);
    return true;
  }
  public async atomicWrite(filePath: string, content: string): Promise<void> {
    this.values.set(filePath, content);
    this.writes.push("atomic:" + filePath);
  }
  public async append(): Promise<void> {
    return;
  }
  public async compareAndDelete(): Promise<boolean> {
    return false;
  }
}

const launch = integrationLaunch({
  runId: "run-19",
  attempt: 1,
  issueNumber: 19,
  branch: "feat/19-contract",
  worktreePath: "/repo/.trees/19",
  startedAt: "2026-08-12T08:00:00.000Z",
  requiredFinalValidation: { command: "just verify" },
});
const snapshot: RunSnapshotV4 = {
  schemaVersion: 4,
  revision: 4,
  attempt: 1,
  runId: "run-19",
  ownerId: "owner-19",
  repository: "owner/repo",
  issueNumber: 19,
  state: "running_rpiv",
  branchType: "feat",
  branch: "feat/19-contract",
  worktreePath: "/repo/.trees/19",
  fetchedBaseProof: null,
  tmux: null,
  copilot: null,
  error: null,
  updatedAt: "2026-08-12T08:00:00.000Z",
  admission: null,
  launchIntent: null,
  workerProcess: null,
  rpivProcess: null,
  stop: null,
  cleanup: null,
  logs: [],
  mergedPullRequest: null,
  requiredAcceptanceCriteria: [{ id: "AC-1", text: "proof" }],
  requiredFinalValidation: { command: "just verify" },
  integrationLaunch: launch,
  progress: null,
  finalization: null,
};
function status(overrides: Partial<RpivStatusV1> = {}): RpivStatusV1 {
  return {
    schemaVersion: 1,
    runId: "run-19",
    attempt: 1,
    issueNumber: 19,
    branch: "feat/19-contract",
    sequence: 1,
    phase: "research",
    status: "running",
    updatedAt: "2026-08-12T08:00:01.000Z",
    ...overrides,
  };
}
const result: AgentResultV1 = {
  schemaVersion: 1,
  issueNumber: 19,
  outcome: "succeeded",
  branch: "feat/19-contract",
  headSha: sha,
  prNumber: 119,
  acceptanceCriteria: [
    { id: "AC-1", status: "verified", evidence: ["test:AC-1"] },
  ],
  validations: [],
  requiredFinalValidation: {
    command: "just verify",
    status: "passed",
    evidence: ["test:verify"],
  },
  completedAt: now,
};
const binding = {
  issueNumber: 19,
  branch: "feat/19-contract",
  headSha: sha,
  prNumber: 119,
  requiredAcceptanceCriteria: snapshot.requiredAcceptanceCriteria,
  requiredFinalValidation: snapshot.requiredFinalValidation,
};

describe("V-1/V-2 integration instructions and final-validation configuration", () => {
  it("accepts default and declared custom recipes and rejects unsafe or empty values", () => {
    expect(parseConfiguration(null, justfile).finalValidation.command).toBe(
      "just verify",
    );
    expect(
      parseConfiguration(
        "rpiv:\n  final_validation: just release_check\n",
        justfile,
      ).finalValidation.command,
    ).toBe("just release_check");
    expect(
      parseConfiguration(
        "rpiv:\n  final_validation: [invalid current value]\n",
        justfile,
        { command: "just verify" },
      ).finalValidation.command,
    ).toBe("just verify");
    expect(
      parseConfiguration(
        "rpiv:\n  final_validation:\n    unsupported: current\n",
        justfile,
        { command: "just verify" },
      ).finalValidation.command,
    ).toBe("just verify");
    for (const value of [
      "",
      "just verify-focused",
      "just missing",
      "just verify now",
      "just verify;echo",
    ]) {
      const text =
        value === ""
          ? "rpiv:\n  final_validation:\n"
          : "rpiv:\n  final_validation: " + value + "\n";
      expect(() => parseConfiguration(text, justfile)).toThrow(
        "rpiv.final_validation",
      );
    }
  });
  it("renders deterministic equivalent human and JSON contract facts", () => {
    const contract = integrationContract({ command: "just release_check" });
    const first = renderIntegrationInstructions(contract, false);
    expect(renderIntegrationInstructions(contract, false)).toBe(first);
    const json = JSON.parse(
      renderIntegrationInstructions(contract, true),
    ) as typeof contract;
    expect(json).toEqual(contract);
    for (const fact of [
      contract.paths.progress,
      contract.paths.result,
      contract.effectiveFinalValidation.command,
      ...contract.progress.classifications,
    ])
      expect(first).toContain(fact);
    expect(parseCommand(["instructions", "--json"])).toEqual({
      kind: "instructions",
      json: true,
    });
    expect(() => parseCommand(["instructions", "extra"])).toThrow(
      "Only --json",
    );
  });
});

describe("V-5/V-7 RPIV progress schema, transition, and atomic publication", () => {
  it.each([
    [null, "PROGRESS_MISSING"],
    ["", "PROGRESS_EMPTY"],
    ["{", "PROGRESS_INVALID"],
    [JSON.stringify({ schemaVersion: 1 }), "PROGRESS_REQUIRED_FIELD_MISSING"],
    [
      JSON.stringify({ ...status(), schemaVersion: 2 }),
      "PROGRESS_VERSION_UNSUPPORTED",
    ],
    [JSON.stringify(status({ runId: "other" })), "PROGRESS_IDENTITY_MISMATCH"],
    [
      JSON.stringify(status({ updatedAt: "2026-08-12T07:59:59.000Z" })),
      "PROGRESS_STALE",
    ],
  ])("classifies %p as %s", (text, expected) =>
    expect(
      classifyProgress({ text, snapshot, observedAt: now }).classification,
    ).toBe(expected),
  );
  it.each([
    [null, "PROGRESS_MISSING"],
    ["", "PROGRESS_EMPTY"],
    ["{", "PROGRESS_INVALID"],
    [JSON.stringify({ schemaVersion: 1 }), "PROGRESS_REQUIRED_FIELD_MISSING"],
    [
      JSON.stringify({ ...status(), schemaVersion: 2 }),
      "PROGRESS_VERSION_UNSUPPORTED",
    ],
    [JSON.stringify(status({ runId: "other" })), "PROGRESS_IDENTITY_MISMATCH"],
    [
      JSON.stringify(status({ updatedAt: "2026-08-12T07:59:59.000Z" })),
      "PROGRESS_STALE",
    ],
    [JSON.stringify(status({ sequence: 1 })), "PROGRESS_REGRESSED"],
    [
      JSON.stringify(status({ sequence: 4, phase: "implement" })),
      "PROGRESS_CONFLICT",
    ],
    [
      JSON.stringify(status({ sequence: 3, phase: "implement" })),
      "PROGRESS_LATE",
    ],
  ] as const)(
    "reports unknown phase for unusable %p current progress classified as %s after an accepted phase",
    (text, expected) => {
      const acceptedProgress = status({ sequence: 2, phase: "plan" });
      const accepted: RunSnapshotV4 = {
        ...snapshot,
        state: expected === "PROGRESS_LATE" ? "completed" : snapshot.state,
        progress: acceptedProgress,
      };
      expect(
        classifyProgress({ text, snapshot: accepted, observedAt: now }),
      ).toMatchObject({
        classification: expected,
        phase: "unknown",
        lastAccepted: acceptedProgress,
      });
    },
  );

  it("classifies valid, repeated, conflicting, regressed, and late observations without replacing accepted facts", () => {
    const valid = classifyProgress({
      text: JSON.stringify(status()),
      snapshot,
      observedAt: now,
    });
    expect(valid).toMatchObject({
      classification: "PROGRESS_VALID",
      phase: "research",
    });
    const accepted = {
      ...snapshot,
      progress: status({ sequence: 2, phase: "plan" }),
    };
    expect(
      classifyProgress({
        text: JSON.stringify(accepted.progress),
        snapshot: accepted,
        observedAt: now,
      }),
    ).toMatchObject({
      classification: "PROGRESS_REPEATED",
      phase: "plan",
    });
    expect(
      classifyProgress({
        text: JSON.stringify(status({ sequence: 2, phase: "research" })),
        snapshot: accepted,
        observedAt: now,
      }).classification,
    ).toBe("PROGRESS_CONFLICT");
    expect(
      classifyProgress({
        text: JSON.stringify(status({ sequence: 1 })),
        snapshot: accepted,
        observedAt: now,
      }).classification,
    ).toBe("PROGRESS_REGRESSED");
    expect(
      classifyProgress({
        text: JSON.stringify(status()),
        snapshot: { ...snapshot, state: "completed" },
        observedAt: now,
      }).classification,
    ).toBe("PROGRESS_LATE");
  });
  it("atomically publishes complete monotonic status documents", async () => {
    const files = new MemoryFiles();
    const research = await publishProgress(
      files,
      launch,
      snapshot,
      "research",
      "running",
      "2026-08-12T08:00:01.000Z",
    );
    const plan = await publishProgress(
      files,
      launch,
      { ...snapshot, progress: research },
      "plan",
      "running",
      "2026-08-12T08:00:02.000Z",
    );
    expect([research.sequence, plan.sequence]).toEqual([1, 2]);
    expect(
      parseRpivStatus((await files.readText(launch.progressPath)) as string),
    ).toEqual(plan);
    expect(files.writes).toEqual([
      "atomic:" + launch.progressPath,
      "atomic:" + launch.progressPath,
    ]);
    await expect(
      publishProgress(
        files,
        launch,
        { ...snapshot, progress: plan },
        "plan",
        "running",
        "2026-08-12T08:00:03.000Z",
      ),
    ).rejects.toMatchObject({ code: "PROGRESS_REPEATED" });
    expect(
      parseRpivStatus((await files.readText(launch.progressPath)) as string),
    ).toEqual(plan);
    expect(files.writes).toHaveLength(2);
  });
});

describe("V-3/V-4 immutable AgentResultV1 binding", () => {
  it("strictly validates required final evidence and ignores supplementary focused forms for completion", () => {
    expect(validateBoundResult(JSON.stringify(result), binding)).toEqual(
      result,
    );
    expect(() =>
      parseAgentResult(
        JSON.stringify({ ...result, requiredFinalValidation: undefined }),
      ),
    ).toThrow("invalid shape");
    for (const validations of [
      [],
      [{ command: "just verify-focused", status: "passed" as const }],
      [{ command: "just verify-focused", status: "failed" as const }],
    ]) {
      const decision = reconcileCompletion({
        issueNumber: 19,
        branch: result.branch,
        baseBranch: "main",
        remote: "origin",
        requiredAcceptanceCriteria: snapshot.requiredAcceptanceCriteria,
        requiredFinalValidation: snapshot.requiredFinalValidation,
        result: { ...result, validations },
        git: {
          localHeadSha: sha,
          remote: "origin",
          remoteBranch: result.branch,
          remoteHeadSha: sha,
        },
        pullRequest: {
          number: 119,
          state: "OPEN",
          baseBranch: "main",
          headBranch: result.branch,
          headSha: sha,
          closesIssues: [19],
          complete: true,
        },
      });
      expect(decision.code).toBe("COMPLETION_PROVED");
    }
  });
  it("publishes once, accepts byte-equivalent idempotence, and preserves a conflicting destination", async () => {
    const files = new MemoryFiles();
    const candidate = JSON.stringify(result);
    await publishAgentResult(files, launch.resultPath, candidate, binding);
    await publishAgentResult(files, launch.resultPath, candidate, binding);
    expect(files.writes).toEqual(["immutable:" + launch.resultPath]);
    await expect(
      publishAgentResult(
        files,
        launch.resultPath,
        JSON.stringify({ ...result, completedAt: "2026-08-12T08:00:11.000Z" }),
        binding,
      ),
    ).rejects.toMatchObject({ code: "RESULT_ALREADY_EXISTS" });
    expect(
      validateBoundResult(await files.readText(launch.resultPath), binding),
    ).toEqual(result);
  });
});
