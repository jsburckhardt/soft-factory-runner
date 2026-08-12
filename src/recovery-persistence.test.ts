import type {
  RunSnapshotV1,
  RunSnapshotV2,
  RunSnapshotV3,
  RunSnapshotV4,
  TransitionEventV2,
} from "./domain";
import { REQUIRED_VALIDATIONS } from "./domain";
import { RunnerError } from "./errors";
import { integrationLaunch } from "./integration";
import { replayHistory, RunStore } from "./persistence";
import type { FilePort } from "./ports";

class FaultFiles implements FilePort {
  public readonly values = new Map<string, string>();
  public readonly trace: string[] = [];
  public failAppend = false;
  public failWrite = false;
  public async readText(path: string) {
    return this.values.get(path) ?? null;
  }
  public async readAgentResult(worktree: string) {
    return this.readText(`${worktree}/.soft-factory/agent-result.json`);
  }
  public async exists(path: string) {
    return this.values.has(path);
  }
  public async list(directory: string) {
    const prefix = `${directory}/`;
    return [
      ...new Set(
        [...this.values.keys()]
          .filter((entry) => entry.startsWith(prefix))
          .map((entry) => entry.slice(prefix.length).split("/")[0]),
      ),
    ];
  }
  public async exclusiveCreate(path: string, content: string) {
    if (this.values.has(path)) return false;
    this.values.set(path, content);
    return true;
  }
  public async atomicWrite(path: string, content: string) {
    this.trace.push(`write:${path}`);
    if (this.failWrite)
      throw new RunnerError("EXTERNAL_COMMAND_FAILED", "write", "retry");
    this.values.set(path, content);
  }
  public async append(path: string, content: string) {
    this.trace.push(`append:${path}`);
    if (this.failAppend)
      throw new RunnerError("EXTERNAL_COMMAND_FAILED", "append", "retry");
    this.values.set(path, (this.values.get(path) ?? "") + content);
  }
  public async compareAndDelete(path: string, expected: string) {
    this.trace.push(`compare-delete:${path}`);
    if (this.values.get(path) !== expected) return false;
    this.values.delete(path);
    return true;
  }
}

const clock = { now: () => "2026-08-11T13:00:00.000Z" };
const root = "/repo";
const base = {
  runId: "run-5",
  ownerId: "owner-5",
  repository: "owner/repo",
  issueNumber: 5,
  state: "running_rpiv" as const,
  branchType: "feat",
  branch: "feat/5-recovery",
  worktreePath: "/repo/.trees/5",
  fetchedBaseProof: null,
  tmux: null,
  copilot: null,
  error: null,
  updatedAt: "2026-08-11T13:00:00.000Z",
};
function v3(revision = 1): RunSnapshotV3 {
  return {
    ...base,
    schemaVersion: 3,
    revision,
    attempt: 1,
    admission: null,
    launchIntent: null,
    workerProcess: null,
    rpivProcess: null,
    stop: null,
    cleanup: null,
    logs: [],
    mergedPullRequest: null,
    requiredAcceptanceCriteria: [{ id: "AC-1", text: "recover" }],
    requiredValidations: REQUIRED_VALIDATIONS,
    finalization: null,
  };
}
function v4(revision = 1): RunSnapshotV4 {
  const { requiredValidations: legacyValidations, ...versionThree } =
    v3(revision);
  void legacyValidations;
  const requiredFinalValidation = { command: "just verify" };
  return {
    ...versionThree,
    schemaVersion: 4,
    requiredFinalValidation,
    integrationLaunch: integrationLaunch({
      runId: versionThree.runId,
      attempt: versionThree.attempt,
      issueNumber: versionThree.issueNumber,
      branch: versionThree.branch,
      worktreePath: versionThree.worktreePath,
      startedAt: versionThree.updatedAt,
      requiredFinalValidation,
    }),
    progress: null,
  };
}
function event(
  snapshot: RunSnapshotV3,
  prior = snapshot.revision - 1,
): TransitionEventV2 {
  return {
    schemaVersion: 2,
    at: clock.now(),
    runId: snapshot.runId,
    issueNumber: snapshot.issueNumber,
    priorRevision: prior,
    resultingRevision: snapshot.revision,
    reason: "fixture",
    resultingSnapshot: snapshot,
  };
}

describe("V-1 revisioned persistence and replay", () => {
  it("round trips a strictly bound v4 snapshot", async () => {
    const files = new FaultFiles();
    const store = new RunStore(root, files, clock);
    files.values.set(store.snapshotPath(5), JSON.stringify(v4()));
    await expect(store.load(5)).resolves.toEqual(v4());
    expect(files.trace).toEqual([]);
  });

  it.each([
    [
      "run ID",
      (value: RunSnapshotV4) => ({
        ...value,
        integrationLaunch: { ...value.integrationLaunch, runId: "forged-run" },
      }),
    ],
    [
      "attempt",
      (value: RunSnapshotV4) => ({
        ...value,
        integrationLaunch: { ...value.integrationLaunch, attempt: 2 },
      }),
    ],
    [
      "issue number",
      (value: RunSnapshotV4) => ({
        ...value,
        integrationLaunch: { ...value.integrationLaunch, issueNumber: 6 },
      }),
    ],
    [
      "branch",
      (value: RunSnapshotV4) => ({
        ...value,
        integrationLaunch: {
          ...value.integrationLaunch,
          branch: "feat/forged",
        },
      }),
    ],
    [
      "progress path",
      (value: RunSnapshotV4) => ({
        ...value,
        integrationLaunch: {
          ...value.integrationLaunch,
          progressPath: "/tmp/forged-rpiv-status.json",
        },
      }),
    ],
    [
      "result path",
      (value: RunSnapshotV4) => ({
        ...value,
        integrationLaunch: {
          ...value.integrationLaunch,
          resultPath: "/tmp/forged-agent-result.json",
        },
      }),
    ],
    [
      "required final validation",
      (value: RunSnapshotV4) => ({
        ...value,
        integrationLaunch: {
          ...value.integrationLaunch,
          requiredFinalValidation: { command: "just release_check" },
        },
      }),
    ],
  ] as const)(
    "rejects a v4 launch whose %s contradicts its snapshot without mutation",
    async (_name, mutate) => {
      const files = new FaultFiles();
      const store = new RunStore(root, files, clock);
      const contradictory = mutate(v4());
      files.values.set(store.snapshotPath(5), JSON.stringify(contradictory));
      const before = new Map(files.values);

      await expect(store.load(5)).rejects.toMatchObject({
        code: "STATE_INVALID",
      });

      expect(files.values).toEqual(before);
      expect(files.trace).toEqual([]);
    },
  );

  it("round trips v3 and appends its complete v2 event before snapshot replacement", async () => {
    const files = new FaultFiles();
    const store = new RunStore(root, files, clock);
    await store.save(v3(), null, "created");
    expect(files.trace).toEqual([
      "append:/repo/.soft-factory/events/5.jsonl",
      "write:/repo/.soft-factory/runs/5.json",
    ]);
    const history = await store.loadHistory(5);
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      schemaVersion: 2,
      priorRevision: 0,
      resultingRevision: 1,
      resultingSnapshot: { schemaVersion: 3, revision: 1 },
    });
    await expect(store.load(5)).resolves.toEqual(v3());
  });

  it("replays one or several contiguous event-ahead transitions after replacement failure", async () => {
    const files = new FaultFiles();
    const store = new RunStore(root, files, clock);
    await store.save(v3(1), null, "one");
    files.failWrite = true;
    await expect(store.save(v3(2), "running_rpiv", "two")).rejects.toThrow(
      "write",
    );
    files.failWrite = false;
    expect((await store.load(5)).revision).toBe(2);
    expect(
      replayHistory(v3(1), [event(v3(2)), event(v3(3)), event(v3(4))]),
    ).toEqual(v3(4));
  });

  it("refuses malformed, conflicting, wrong-run, duplicate, and noncontiguous histories repeatably", () => {
    const cases: readonly (readonly TransitionEventV2[])[] = [
      [event(v3(3), 2)],
      [{ ...event(v3(2)), runId: "other" }],
      [event(v3(2)), { ...event(v3(2)), reason: "conflict" }],
      [{ ...event(v3(2)), resultingRevision: 3 }],
    ];
    for (const history of cases) {
      for (let repetition = 0; repetition < 2; repetition += 1)
        expect(() => replayHistory(v3(1), history)).toThrow(RunnerError);
    }
  });

  it("keeps valid v1/v2 readable, rejects unknown versions, and blocks legacy event-ahead inference", async () => {
    const files = new FaultFiles();
    const store = new RunStore(root, files, clock);
    const legacy: RunSnapshotV1 = { ...base, schemaVersion: 1 };
    files.values.set(store.snapshotPath(5), JSON.stringify(legacy));
    await expect(store.load(5)).resolves.toEqual(legacy);
    const versionTwo: RunSnapshotV2 = {
      ...base,
      schemaVersion: 2,
      requiredAcceptanceCriteria: [{ id: "AC-1", text: "recover" }],
      requiredValidations: REQUIRED_VALIDATIONS,
      finalization: null,
    };
    files.values.set(store.snapshotPath(5), JSON.stringify(versionTwo));
    await expect(store.load(5)).resolves.toEqual(versionTwo);
    files.values.set(store.eventsPath(5), `${JSON.stringify(event(v3()))}\n`);
    await expect(store.load(5)).rejects.toMatchObject({
      code: "STATE_HISTORY_INVALID",
    });
    files.values.set(store.eventsPath(5), "");
    files.values.set(
      store.snapshotPath(5),
      JSON.stringify({ ...versionTwo, schemaVersion: 99 }),
    );
    await expect(store.load(5)).rejects.toMatchObject({
      code: "STATE_INVALID",
    });
  });

  it("leaves old state after append failure and preserves replayable history after write failure", async () => {
    const files = new FaultFiles();
    const store = new RunStore(root, files, clock);
    await store.save(v3(1), null, "one");
    files.failAppend = true;
    await expect(store.save(v3(2), "running_rpiv", "two")).rejects.toThrow(
      "append",
    );
    files.failAppend = false;
    expect(
      JSON.parse(files.values.get(store.snapshotPath(5)) ?? "{}").revision,
    ).toBe(1);
    expect(await store.loadHistory(5)).toHaveLength(1);
    await expect(
      store.save(v3(4), "running_rpiv", "skip"),
    ).rejects.toMatchObject({ code: "STATE_HISTORY_INVALID" });
    expect(await store.loadHistory(5)).toHaveLength(1);
  });

  it("strictly enumerates union records and compare-deletes only exact owner bytes", async () => {
    const files = new FaultFiles();
    const store = new RunStore(root, files, clock);
    const owner = {
      schemaVersion: 1 as const,
      issueNumber: 5,
      ownerId: "owner-5",
      runId: "run-5",
      repository: "owner/repo",
      acquiredAt: clock.now(),
    };
    await store.acquire(5, owner);
    files.values.set(
      "/repo/.soft-factory/runs/8.json",
      "not-read-during-enumeration",
    );
    files.values.set("/repo/.soft-factory/runs/x.json", "ignored");
    files.values.set("/repo/.soft-factory/logs/3/1.log", "log");
    expect(await store.enumerateIssueNumbers()).toEqual([3, 5, 8]);
    const replacement = { ...owner, ownerId: "replacement" };
    files.values.set(store.lockPath(5), `${JSON.stringify(replacement)}\n`);
    await expect(store.releaseOwner(5, owner)).resolves.toBe(false);
    expect(files.values.get(store.lockPath(5))).toContain("replacement");
    await expect(store.releaseOwner(5, replacement)).resolves.toBe(true);
  });
});
