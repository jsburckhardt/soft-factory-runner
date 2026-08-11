import { claimConcurrencySlot } from "./admission";
import type {
  ConcurrencyLeaseV1,
  ObservationV1,
  OwnerRecordV1,
  ProcessIdentityV1,
  ReconciliationObservationsV1,
  RunSnapshotV3,
} from "./domain";
import { REQUIRED_VALIDATIONS } from "./domain";
import { RunStore } from "./persistence";
import type { FilePort } from "./ports";
import { buildReconciliationReport } from "./reconciliation";

const processIdentity: ProcessIdentityV1 = {
  schemaVersion: 1,
  pid: 500,
  processGroupId: 500,
  startToken: "9000",
  executable: "/usr/bin/copilot",
  args: ["--agent", "rpiv"],
  cwd: "/repo/.trees/5",
  launchedAt: "2026-08-11T13:00:00.000Z",
  paneLineage: {
    sessionName: "sf-owner-repo",
    windowId: "@5",
    paneId: "%5",
    panePid: 499,
  },
};
const snapshot: RunSnapshotV3 = {
  schemaVersion: 3,
  revision: 7,
  attempt: 2,
  runId: "run-5",
  ownerId: "owner-5",
  repository: "owner/repo",
  issueNumber: 5,
  state: "running_rpiv",
  branchType: "feat",
  branch: "feat/5-recovery",
  worktreePath: "/repo/.trees/5",
  fetchedBaseProof: null,
  tmux: {
    sessionName: "sf-owner-repo",
    windowName: "5",
    windowId: "@5",
    paneId: "%5",
    cwd: "/repo/.trees/5",
  },
  copilot: null,
  admission: null,
  launchIntent: null,
  workerProcess: null,
  rpivProcess: processIdentity,
  stop: null,
  cleanup: null,
  logs: [],
  mergedPullRequest: null,
  error: null,
  updatedAt: "2026-08-11T13:00:00.000Z",
  requiredAcceptanceCriteria: [{ id: "AC-1", text: "recover" }],
  requiredValidations: REQUIRED_VALIDATIONS,
  finalization: null,
};
function observation<T>(
  state: ObservationV1<T>["state"],
  facts: T | null,
  code: string,
): ObservationV1<T> {
  return { state, facts, code };
}
function matchingObservations(): ReconciliationObservationsV1 {
  return {
    lock: observation(
      "match",
      {
        schemaVersion: 1,
        issueNumber: 5,
        ownerId: "owner-5",
        runId: "run-5",
        repository: "owner/repo",
        acquiredAt: "time",
      },
      "LOCK_MATCH",
    ),
    filesystem: observation(
      "match",
      { worktreePath: snapshot.worktreePath },
      "FILESYSTEM_MATCH",
    ),
    git: observation(
      "match",
      {
        pathExists: true,
        registered: true,
        branch: snapshot.branch,
        headSha: "a".repeat(40),
        staged: false,
        unstaged: false,
        untracked: false,
      },
      "GIT_MATCH",
    ),
    tmux: observation("match", snapshot.tmux, "TMUX_MATCH"),
    workerProcess: observation("not_applicable", null, "WORKER_NOT_RECORDED"),
    rpivProcess: observation("match", processIdentity, "RPIV_MATCH"),
    result: observation("not_applicable", null, "RESULT_NOT_REQUIRED"),
    remote: observation("not_applicable", null, "REMOTE_NOT_REQUIRED"),
    github: observation("not_applicable", null, "GITHUB_NOT_REQUIRED"),
  };
}

function replaceBoundary(
  observations: ReconciliationObservationsV1,
  boundary: keyof ReconciliationObservationsV1,
  state: "mismatch" | "unknown",
): ReconciliationObservationsV1 {
  const changed = observation<never>(state, null, `${boundary}-${state}`);
  switch (boundary) {
    case "lock":
      return { ...observations, lock: changed };
    case "filesystem":
      return { ...observations, filesystem: changed };
    case "git":
      return { ...observations, git: changed };
    case "tmux":
      return { ...observations, tmux: changed };
    case "workerProcess":
      return { ...observations, workerProcess: changed };
    case "rpivProcess":
      return { ...observations, rpivProcess: changed };
    case "result":
      return { ...observations, result: changed };
    case "remote":
      return { ...observations, remote: changed };
    case "github":
      return { ...observations, github: changed };
  }
}

describe("V-2 full reconciliation matrix", () => {
  it("returns identical complete reports and preserves an exact active process", () => {
    const first = buildReconciliationReport(snapshot, matchingObservations());
    const second = buildReconciliationReport(snapshot, matchingObservations());
    expect(first).toEqual(second);
    expect(first).toMatchObject({
      schemaVersion: 1,
      decisionCode: "active_preserved",
      activity: "active",
      safeActions: ["preserve_active", "attach", "stop"],
    });
    expect(Object.keys(first.observations)).toEqual([
      "lock",
      "filesystem",
      "git",
      "tmux",
      "workerProcess",
      "rpivProcess",
      "result",
      "remote",
      "github",
    ]);
    expect(first.persisted.attempt).toBe(2);
  });

  it("blocks every individual mismatch or unknown without a destructive safe action", () => {
    const boundaries = [
      "lock",
      "filesystem",
      "git",
      "tmux",
      "workerProcess",
      "rpivProcess",
      "result",
      "remote",
      "github",
    ] as const satisfies readonly (keyof ReconciliationObservationsV1)[];
    for (const boundary of boundaries) {
      for (const state of ["mismatch", "unknown"] as const) {
        const changed = replaceBoundary(
          matchingObservations(),
          boundary,
          state,
        );
        const report = buildReconciliationReport(snapshot, changed);
        expect(report.decisionCode).toBe(
          state === "unknown"
            ? "RECONCILIATION_UNKNOWN"
            : "RECONCILIATION_MISMATCH",
        );
        expect(report.safeActions).toEqual([]);
      }
    }
  });

  it("treats equal PID with a changed start token as an identity mismatch", () => {
    const observations = matchingObservations();
    const report = buildReconciliationReport(snapshot, {
      ...observations,
      rpivProcess: observation(
        "mismatch",
        { ...processIdentity, startToken: "reused" },
        "RPIV_PROCESS_IDENTITY_MISMATCH",
      ),
    });
    expect(report.activity).toBe("blocked");
    expect(report.diagnostics).toContain(
      "rpivProcess:RPIV_PROCESS_IDENTITY_MISMATCH",
    );
  });
});

class LeaseFiles implements FilePort {
  public readonly values = new Map<string, string>();
  public async readText(path: string) {
    return this.values.get(path) ?? null;
  }
  public async readAgentResult(): Promise<null> {
    return null;
  }
  public async exists(path: string) {
    return this.values.has(path);
  }
  public async list(directory: string) {
    const prefix = `${directory}/`;
    return [...this.values.keys()]
      .filter((entry) => entry.startsWith(prefix))
      .map((entry) => entry.slice(prefix.length));
  }
  public async exclusiveCreate(path: string, content: string) {
    if (this.values.has(path)) return false;
    this.values.set(path, content);
    return true;
  }
  public async atomicWrite(path: string, content: string) {
    this.values.set(path, content);
  }
  public async append(path: string, content: string) {
    this.values.set(path, (this.values.get(path) ?? "") + content);
  }
  public async compareAndDelete(path: string, expected: string) {
    if (this.values.get(path) !== expected) return false;
    this.values.delete(path);
    return true;
  }
}
function owner(issueNumber: number): OwnerRecordV1 {
  return {
    schemaVersion: 1,
    issueNumber,
    ownerId: `owner-${issueNumber}`,
    runId: `run-${issueNumber}`,
    repository: "owner/repo",
    acquiredAt: "time",
  };
}

describe("V-5/V-6 atomic explicit concurrency admission", () => {
  it("admits exactly two of three explicit issues and rolls back only the capacity loser", async () => {
    for (let repetition = 0; repetition < 20; repetition += 1) {
      const files = new LeaseFiles();
      const store = new RunStore(`/repo-${repetition}`, files, {
        now: () => "time",
      });
      for (const issue of [5, 6, 7]) await store.acquire(issue, owner(issue));
      const results = await Promise.allSettled(
        [5, 6, 7].map((issue) =>
          claimConcurrencySlot({
            store,
            owner: owner(issue),
            maxConcurrentRuns: 2,
            acquiredAt: "time",
          }),
        ),
      );
      const admitted = results.flatMap((result) =>
        result.status === "fulfilled" ? [result.value.lease] : [],
      );
      expect(admitted).toHaveLength(2);
      expect(new Set(admitted.map((lease) => lease.slot))).toEqual(
        new Set([1, 2]),
      );
      const failure = results.find((result) => result.status === "rejected");
      expect(failure?.status).toBe("rejected");
      if (failure?.status === "rejected")
        expect(failure.reason).toMatchObject({
          code: "CONCURRENCY_LIMIT_REACHED",
        });
      const loser = [5, 6, 7].find(
        (issue) => !admitted.some((lease) => lease.issueNumber === issue),
      );
      expect(loser).toBeDefined();
      if (loser === undefined) throw new Error("fixture expected one loser");
      expect(await store.readOwner(loser)).toBeNull();
      expect(
        admitted.every(
          (lease) =>
            lease.issueNumber === 5 ||
            lease.issueNumber === 6 ||
            lease.issueNumber === 7,
        ),
      ).toBe(true);
    }
  });

  it("preserves malformed leases while rolling back only a new exact issue lock", async () => {
    const files = new LeaseFiles();
    const store = new RunStore("/repo-malformed", files, { now: () => "time" });
    files.values.set(store.leasePath(1), "malformed");
    await store.acquire(5, owner(5));
    await expect(
      claimConcurrencySlot({
        store,
        owner: owner(5),
        maxConcurrentRuns: 1,
        acquiredAt: "time",
      }),
    ).rejects.toMatchObject({ code: "CONCURRENCY_STATE_UNKNOWN" });
    expect(files.values.get(store.leasePath(1))).toBe("malformed");
    expect(await store.readOwner(5)).toBeNull();
  });

  it("counts unknown leases and blocks unsafe configured-limit reductions", async () => {
    const files = new LeaseFiles();
    const store = new RunStore("/repo", files, { now: () => "time" });
    const stale: ConcurrencyLeaseV1 = {
      schemaVersion: 1,
      slot: 3,
      issueNumber: 3,
      ownerId: "unknown",
      runId: "unknown",
      repository: "owner/repo",
      configuredLimit: 3,
      acquiredAt: "time",
    };
    await store.acquireLease(stale);
    await store.acquire(5, owner(5));
    await expect(
      claimConcurrencySlot({
        store,
        owner: owner(5),
        maxConcurrentRuns: 2,
        acquiredAt: "time",
      }),
    ).rejects.toMatchObject({ code: "CONCURRENCY_STATE_UNKNOWN" });
    await expect(store.readLease(3)).resolves.toEqual(stale);
    await expect(store.readOwner(5)).resolves.toBeNull();
  });
});
