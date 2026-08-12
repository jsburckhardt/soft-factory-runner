import { parseAgentResult, reconcileCompletion } from "./completion";
import type { AgentResultV1, RunSnapshotV2 } from "./domain";
import { REQUIRED_VALIDATIONS } from "./domain";
import { RunnerError } from "./errors";
import { RunStore } from "./persistence";
import type { FilePort } from "./ports";
import { extractAcceptanceCriteria } from "./readiness";

const sha = "a".repeat(40);
const required = [
  { id: "AC-1", text: "first criterion" },
  { id: "AC-2", text: "second criterion" },
];
const validResult: AgentResultV1 = {
  schemaVersion: 1,
  issueNumber: 4,
  outcome: "succeeded",
  branch: "feat/4-proof",
  headSha: sha,
  prNumber: 14,
  acceptanceCriteria: required.map(({ id }) => ({
    id,
    status: "verified",
    evidence: [`test:${id}`],
  })),
  validations: REQUIRED_VALIDATIONS.map(({ command }) => ({
    command,
    status: "passed",
  })),
  requiredFinalValidation: {
    command: "just verify",
    status: "passed",
    evidence: ["test:just-verify"],
  },
  completedAt: "2026-08-11T12:00:00.000Z",
};

class MemoryFiles implements FilePort {
  public readonly values = new Map<string, string>();
  public readonly trace: string[] = [];
  public failAppend = false;
  public failWrite = false;
  public async readText(filePath: string): Promise<string | null> {
    return this.values.get(filePath) ?? null;
  }
  public async readAgentResult(worktreePath: string): Promise<string | null> {
    return this.readText(`${worktreePath}/.soft-factory/agent-result.json`);
  }
  public async exists(filePath: string): Promise<boolean> {
    return this.values.has(filePath);
  }
  public async list(directoryPath: string): Promise<readonly string[]> {
    const prefix = `${directoryPath}/`;
    return [...this.values.keys()]
      .filter((entry) => entry.startsWith(prefix))
      .map((entry) => entry.slice(prefix.length).split("/")[0]);
  }
  public async exclusiveCreate(
    filePath: string,
    content: string,
  ): Promise<boolean> {
    if (this.values.has(filePath)) return false;
    this.values.set(filePath, content);
    return true;
  }
  public async atomicWrite(filePath: string, content: string): Promise<void> {
    this.trace.push("snapshot");
    if (this.failWrite) throw new Error("write failed");
    this.values.set(filePath, content);
  }
  public async append(filePath: string, content: string): Promise<void> {
    this.trace.push("event");
    if (this.failAppend) throw new Error("append failed");
    this.values.set(filePath, (this.values.get(filePath) ?? "") + content);
  }
  public async compareAndDelete(
    filePath: string,
    expectedContent: string,
  ): Promise<boolean> {
    if (this.values.get(filePath) !== expectedContent) return false;
    this.values.delete(filePath);
    return true;
  }
}

function snapshot(state: RunSnapshotV2["state"] = "finalizing"): RunSnapshotV2 {
  return {
    schemaVersion: 2,
    runId: "run-4",
    ownerId: "owner-4",
    repository: "owner/repo",
    issueNumber: 4,
    state,
    branchType: "feat",
    branch: "feat/4-proof",
    worktreePath: "/tmp/repo/.trees/4",
    fetchedBaseProof: {
      schemaVersion: 1,
      remote: "origin",
      defaultBranch: "main",
      advertisedHeadSha: sha,
      trackingRefSha: sha,
      fetchedAt: "2026-08-11T11:00:00.000Z",
      matches: true,
    },
    tmux: null,
    copilot: null,
    error: null,
    updatedAt: "2026-08-11T12:00:00.000Z",
    requiredAcceptanceCriteria: required,
    requiredValidations: REQUIRED_VALIDATIONS,
    finalization: null,
  };
}

function reconciliation(
  overrides: Partial<Parameters<typeof reconcileCompletion>[0]> = {},
) {
  return reconcileCompletion({
    issueNumber: 4,
    branch: "feat/4-proof",
    baseBranch: "main",
    remote: "origin",
    requiredAcceptanceCriteria: required,
    requiredFinalValidation: { command: "just verify" },
    result: validResult,
    git: {
      localHeadSha: sha,
      remote: "origin",
      remoteBranch: "feat/4-proof",
      remoteHeadSha: sha,
    },
    pullRequest: {
      number: 14,
      state: "OPEN",
      baseBranch: "main",
      headBranch: "feat/4-proof",
      headSha: sha,
      closesIssues: [4],
      complete: true,
    },
    ...overrides,
  });
}

describe("AgentResultV1", () => {
  it("strictly parses every required versioned result field", () => {
    expect(parseAgentResult(JSON.stringify(validResult))).toEqual(validResult);
  });
  it.each([
    ["missing", null, "RESULT_MISSING"],
    ["malformed", "{", "RESULT_INVALID"],
    [
      "unsupported",
      JSON.stringify({ ...validResult, schemaVersion: 2 }),
      "RESULT_VERSION_UNSUPPORTED",
    ],
    [
      "invalid SHA",
      JSON.stringify({ ...validResult, headSha: "abc" }),
      "RESULT_INVALID",
    ],
    [
      "invalid time",
      JSON.stringify({ ...validResult, completedAt: "yesterday" }),
      "RESULT_INVALID",
    ],
    [
      "empty evidence",
      JSON.stringify({
        ...validResult,
        acceptanceCriteria: [{ id: "AC-1", status: "verified", evidence: [] }],
      }),
      "RESULT_INVALID",
    ],
    [
      "duplicate validation",
      JSON.stringify({
        ...validResult,
        validations: [validResult.validations[0], validResult.validations[0]],
      }),
      "RESULT_INVALID",
    ],
    [
      "duplicate acceptance",
      JSON.stringify({
        ...validResult,
        acceptanceCriteria: [
          validResult.acceptanceCriteria[0],
          validResult.acceptanceCriteria[0],
        ],
      }),
      "RESULT_INVALID",
    ],
    [
      "extra field",
      JSON.stringify({ ...validResult, extra: true }),
      "RESULT_INVALID",
    ],
  ])("rejects %s artifacts", (_name, text, code) => {
    try {
      parseAgentResult(text);
      throw new Error("expected parser failure");
    } catch (cause: unknown) {
      expect(cause).toBeInstanceOf(RunnerError);
      expect((cause as RunnerError).code).toBe(code);
    }
  });
  it("extracts exact ordered criterion text and stable IDs", () => {
    expect(
      extractAcceptanceCriteria(
        `before\n<!-- ACCEPTANCE_CRITERIA_START -->\n- [ ] first criterion\n- [x] second criterion\n<!-- ACCEPTANCE_CRITERIA_END -->`,
      ),
    ).toEqual(required);
  });
});

describe("pure completion reconciliation", () => {
  it("completes only the full conjunction deterministically without mutation", () => {
    const input = JSON.parse(JSON.stringify(validResult)) as AgentResultV1;
    const first = reconciliation({ result: input });
    const second = reconciliation({ result: input });
    expect(first).toEqual(second);
    expect(first.state).toBe("completed");
    expect(
      first.reconciliation.comparisons.every((entry) => entry.passed),
    ).toBe(true);
    expect(input).toEqual(validResult);
  });
  it.each([
    [
      "issue",
      { result: { ...validResult, issueNumber: 5 } },
      "RESULT_ISSUE_MISMATCH",
    ],
    [
      "branch",
      { result: { ...validResult, branch: "feat/wrong" } },
      "RESULT_BRANCH_MISMATCH",
    ],
    [
      "local SHA",
      {
        git: {
          localHeadSha: "b".repeat(40),
          remote: "origin",
          remoteBranch: "feat/4-proof",
          remoteHeadSha: sha,
        },
      },
      "RESULT_LOCAL_SHA_MISMATCH",
    ],
    [
      "remote name",
      {
        git: {
          localHeadSha: sha,
          remote: "upstream",
          remoteBranch: "feat/4-proof",
          remoteHeadSha: sha,
        },
      },
      "RESULT_REMOTE_NAME_MISMATCH",
    ],
    [
      "remote branch",
      {
        git: {
          localHeadSha: sha,
          remote: "origin",
          remoteBranch: "feat/wrong",
          remoteHeadSha: sha,
        },
      },
      "RESULT_REMOTE_BRANCH_MISMATCH",
    ],
    [
      "remote SHA",
      {
        git: {
          localHeadSha: sha,
          remote: "origin",
          remoteBranch: "feat/4-proof",
          remoteHeadSha: "b".repeat(40),
        },
      },
      "RESULT_REMOTE_SHA_MISMATCH",
    ],
    [
      "PR number",
      {
        pullRequest: {
          number: 15,
          state: "OPEN",
          baseBranch: "main",
          headBranch: "feat/4-proof",
          headSha: sha,
          closesIssues: [4],
          complete: true,
        },
      },
      "PR_NUMBER_MISMATCH",
    ],
    [
      "PR state",
      {
        pullRequest: {
          number: 14,
          state: "CLOSED",
          baseBranch: "main",
          headBranch: "feat/4-proof",
          headSha: sha,
          closesIssues: [4],
          complete: true,
        },
      },
      "PR_STATE_MISMATCH",
    ],
    [
      "PR base",
      {
        pullRequest: {
          number: 14,
          state: "OPEN",
          baseBranch: "trunk",
          headBranch: "feat/4-proof",
          headSha: sha,
          closesIssues: [4],
          complete: true,
        },
      },
      "PR_BASE_MISMATCH",
    ],
    [
      "PR head",
      {
        pullRequest: {
          number: 14,
          state: "OPEN",
          baseBranch: "main",
          headBranch: "feat/wrong",
          headSha: sha,
          closesIssues: [4],
          complete: true,
        },
      },
      "PR_HEAD_MISMATCH",
    ],
    [
      "PR SHA",
      {
        pullRequest: {
          number: 14,
          state: "OPEN",
          baseBranch: "main",
          headBranch: "feat/4-proof",
          headSha: "b".repeat(40),
          closesIssues: [4],
          complete: true,
        },
      },
      "PR_SHA_MISMATCH",
    ],
    [
      "PR issue link",
      {
        pullRequest: {
          number: 14,
          state: "OPEN",
          baseBranch: "main",
          headBranch: "feat/4-proof",
          headSha: sha,
          closesIssues: [],
          complete: true,
        },
      },
      "PR_ISSUE_LINK_MISMATCH",
    ],
    [
      "acceptance missing",
      {
        result: {
          ...validResult,
          acceptanceCriteria: [validResult.acceptanceCriteria[1]],
        },
      },
      "AC_AC-1_MISMATCH",
    ],
    [
      "acceptance duplicate",
      {
        result: {
          ...validResult,
          acceptanceCriteria: [
            validResult.acceptanceCriteria[0],
            validResult.acceptanceCriteria[0],
            validResult.acceptanceCriteria[1],
          ],
        },
      },
      "AC_AC-1_MISMATCH",
    ],
    [
      "acceptance unverified",
      {
        result: {
          ...validResult,
          acceptanceCriteria: [
            { id: "AC-1", status: "unverified", evidence: ["proof"] },
            validResult.acceptanceCriteria[1],
          ],
        },
      },
      "AC_AC-1_MISMATCH",
    ],
    [
      "acceptance empty evidence",
      {
        result: {
          ...validResult,
          acceptanceCriteria: [
            { id: "AC-1", status: "verified", evidence: [] },
            validResult.acceptanceCriteria[1],
          ],
        },
      },
      "AC_AC-1_MISMATCH",
    ],
  ])("rejects isolated %s contradiction", (_name, override, code) => {
    const result = reconciliation(
      override as Partial<Parameters<typeof reconcileCompletion>[0]>,
    );
    expect(result.state).toBe("failed");
    expect(result.code).toBe(code);
  });
  it.each([
    [[]],
    [[{ command: "just verify-focused", status: "passed" as const }]],
    [[{ command: "just verify-focused", status: "failed" as const }]],
    [[{ command: "just verify", status: "failed" as const }]],
  ])(
    "keeps supplementary validation evidence completion-neutral",
    (validations) => {
      const result = reconciliation({
        result: { ...validResult, validations },
      });
      expect(result.state).toBe("completed");
      expect(result.code).toBe("COMPLETION_PROVED");
    },
  );
  it("rejects a mismatched required final-validation binding", () => {
    const result = reconciliation({
      result: {
        ...validResult,
        requiredFinalValidation: {
          command: "just custom",
          status: "passed",
          evidence: ["proof"],
        },
      },
    });
    expect(result.code).toBe("RESULT_FINAL_VALIDATION_MISMATCH");
  });
  it("classifies incomplete proof and named non-success outcomes", () => {
    expect(reconciliation({ git: null }).state).toBe("interrupted");
    for (const outcome of [
      "failed",
      "blocked",
      "cancelled",
      "interrupted",
    ] as const)
      expect(
        reconciliation({ result: { ...validResult, outcome } }).state,
      ).toBe(outcome);
  });
});

describe("versioned event-first persistence", () => {
  it("writes the append-only event before the atomic v2 snapshot and round trips every terminal", async () => {
    for (const state of [
      "completed",
      "failed",
      "blocked",
      "cancelled",
      "interrupted",
    ] as const) {
      const files = new MemoryFiles();
      const store = new RunStore("/tmp/repo", files, {
        now: () => "2026-08-11T12:00:01.000Z",
      });
      await store.save(snapshot(state), "finalizing", `terminal-${state}`);
      expect(files.trace).toEqual(["event", "snapshot"]);
      expect((await store.load(4)).state).toBe(state);
      expect(
        JSON.parse(files.values.get(store.eventsPath(4)) ?? "").schemaVersion,
      ).toBe(1);
    }
  });
  it("keeps the prior snapshot when event append fails and preserves an event when replacement fails", async () => {
    const files = new MemoryFiles();
    const store = new RunStore("/tmp/repo", files, {
      now: () => "2026-08-11T12:00:01.000Z",
    });
    files.values.set(
      store.snapshotPath(4),
      JSON.stringify(snapshot("running_rpiv")),
    );
    files.failAppend = true;
    await expect(
      store.save(snapshot("completed"), "finalizing", "complete"),
    ).rejects.toThrow("append failed");
    expect(
      JSON.parse(files.values.get(store.snapshotPath(4)) ?? "").state,
    ).toBe("running_rpiv");
    files.failAppend = false;
    files.failWrite = true;
    await expect(
      store.save(snapshot("completed"), "finalizing", "complete"),
    ).rejects.toThrow("write failed");
    expect(files.values.get(store.eventsPath(4))).toContain("complete");
  });
  it("loads valid legacy v1 but rejects unknown versions", async () => {
    const files = new MemoryFiles();
    const store = new RunStore("/tmp/repo", files, { now: () => "now" });
    const legacy = {
      ...snapshot("interrupted"),
      schemaVersion: 1,
      state: "interrupted",
    } as Record<string, unknown>;
    delete legacy.requiredAcceptanceCriteria;
    delete legacy.requiredValidations;
    delete legacy.finalization;
    files.values.set(store.snapshotPath(4), JSON.stringify(legacy));
    expect((await store.load(4)).schemaVersion).toBe(1);
    files.values.set(
      store.snapshotPath(4),
      JSON.stringify({ ...legacy, schemaVersion: 3 }),
    );
    await expect(store.load(4)).rejects.toMatchObject({
      code: "STATE_INVALID",
    });
  });
});
