import path from "node:path";
import type {
  AgentResultV1,
  IssueFacts,
  LaunchIntentV1,
  MergedPullRequestFactsV1,
  ProcessIdentityV1,
  RepositoryFacts,
  RunSnapshotV2,
  RunSnapshotV3,
  TmuxIdentity,
} from "./domain";
import { REQUIRED_VALIDATIONS } from "./domain";
import { runCli } from "./index";
import { IssueRunService } from "./orchestrator";
import { RunStore } from "./persistence";
import type {
  FilePort,
  GitHubPort,
  GitPort,
  ProcessPort,
  RunnerPorts,
  TmuxPort,
} from "./ports";

const root = "/repo";
const worktree = "/repo/.trees/5";
const branch = "feat/5-recovery";
const sha = "a".repeat(40);
const tmux: TmuxIdentity = {
  sessionName: "sf-owner-repo",
  windowName: "5",
  windowId: "@5",
  paneId: "%5",
  cwd: worktree,
};
const processIdentity: ProcessIdentityV1 = {
  schemaVersion: 1,
  pid: 501,
  processGroupId: 501,
  startToken: "1000",
  executable: "copilot",
  args: ["--agent", "rpiv"],
  cwd: worktree,
  launchedAt: "2026-08-11T13:00:00.000Z",
  paneLineage: {
    sessionName: tmux.sessionName,
    windowId: tmux.windowId,
    paneId: tmux.paneId,
    panePid: 500,
  },
};
const result: AgentResultV1 = {
  schemaVersion: 1,
  issueNumber: 5,
  outcome: "succeeded",
  branch,
  headSha: sha,
  prNumber: 15,
  acceptanceCriteria: [{ id: "AC-1", status: "verified", evidence: ["test"] }],
  validations: REQUIRED_VALIDATIONS.map(({ command }) => ({
    command,
    status: "passed",
  })),
  completedAt: "2026-08-11T13:10:00.000Z",
};

class ControlFiles implements FilePort {
  public readonly values = new Map<string, string>();
  public async readText(filePath: string) {
    return this.values.get(filePath) ?? null;
  }
  public async readAgentResult(worktreePath: string) {
    return this.readText(
      path.join(worktreePath, ".soft-factory", "agent-result.json"),
    );
  }
  public async exists(filePath: string) {
    return this.values.has(filePath);
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
  public async exclusiveCreate(filePath: string, content: string) {
    if (this.values.has(filePath)) return false;
    this.values.set(filePath, content);
    return true;
  }
  public async atomicWrite(filePath: string, content: string) {
    this.values.set(filePath, content);
  }
  public async append(filePath: string, content: string) {
    this.values.set(filePath, (this.values.get(filePath) ?? "") + content);
  }
  public async compareAndDelete(filePath: string, expected: string) {
    if (this.values.get(filePath) !== expected) return false;
    this.values.delete(filePath);
    return true;
  }
}

class ControlGit implements GitPort {
  public readonly trace: string[] = [];
  public pathExists = true;
  public registered = true;
  public observedBranch: string | null = branch;
  public observedHead: string | null = sha;
  public staged = false;
  public unstaged = false;
  public untracked = false;
  public remoteSha: string | null = null;
  public constructor(private readonly files: ControlFiles) {}
  public async discover(): Promise<RepositoryFacts> {
    return {
      root,
      commonDirectory: "/repo/.git",
      identity: { nameWithOwner: "owner/repo", normalizedName: "owner-repo" },
      remotes: ["origin"],
      pushDefault: null,
      currentBranchRemote: null,
    };
  }
  public async branchExists() {
    return true;
  }
  public async registeredWorktreeExists() {
    return this.registered;
  }
  public async observeWorktree() {
    return {
      pathExists: this.pathExists,
      registered: this.registered,
      branch: this.observedBranch,
      headSha: this.observedHead,
      staged: this.staged,
      unstaged: this.unstaged,
      untracked: this.untracked,
    };
  }
  public async fetch(): Promise<void> {}
  public async advertisedHead() {
    return { branch: "main", sha };
  }
  public async trackingSha() {
    return sha;
  }
  public async localHeadSha() {
    return this.observedHead;
  }
  public async remoteBranchSha() {
    return this.remoteSha;
  }
  public async createBranch(): Promise<void> {
    this.trace.push("create-branch");
  }
  public async addWorktree(): Promise<void> {
    this.trace.push("add-worktree");
  }
  public async removeWorktree(
    _root: string,
    worktreePath: string,
  ): Promise<void> {
    this.trace.push("remove-worktree-no-force");
    this.pathExists = false;
    this.registered = false;
    this.observedBranch = null;
    this.observedHead = null;
    this.files.values.delete(worktreePath);
  }
}

class ControlGitHub implements GitHubPort {
  public merged: MergedPullRequestFactsV1 = {
    number: 15,
    state: "MERGED",
    mergedAt: "2026-08-11T14:00:00.000Z",
    sourceBranch: branch,
    sourceHeadSha: sha,
    mergeCommitSha: "b".repeat(40),
    closesIssues: [5],
    complete: true,
  };
  public async loadIssue(): Promise<IssueFacts | null> {
    return null;
  }
  public async loadPullRequest() {
    return {
      number: 15,
      state: "OPEN" as const,
      baseBranch: "main",
      headBranch: branch,
      headSha: sha,
      closesIssues: [5],
      complete: true,
    };
  }
  public async loadMergedPullRequest() {
    return this.merged;
  }
}

class ControlTmux implements TmuxPort {
  public readonly trace: string[] = [];
  public present = true;
  public captureContent = "token=[REDACTED] pane evidence";
  public async createIssueWindow(): Promise<TmuxIdentity> {
    return tmux;
  }
  public async observe(target: TmuxIdentity) {
    return this.present ? target : null;
  }
  public async panePid() {
    return 500;
  }
  public async setRemainOnExit(): Promise<void> {}
  public async capturePane() {
    this.trace.push("capture");
    return { content: this.captureContent, truncated: false };
  }
  public async restartWorker(): Promise<void> {
    this.trace.push("restart");
  }
  public async removeWindow(): Promise<void> {
    this.trace.push("remove-window");
    this.present = false;
  }
  public async attach(): Promise<void> {
    this.trace.push("attach");
  }
}

class ControlProcess implements ProcessPort {
  public readonly trace: string[] = [];
  public observed: ProcessIdentityV1 | null = processIdentity;
  public candidates: readonly ProcessIdentityV1[] = [];
  public launches = 0;
  public waitResults: boolean[] = [true];
  public async spawnCopilot(input: {
    readonly args: readonly string[];
    readonly cwd: string;
    readonly pane: TmuxIdentity;
    readonly panePid: number;
    readonly launchedAt: string;
  }) {
    this.launches += 1;
    const identity = {
      ...processIdentity,
      args: input.args,
      cwd: input.cwd,
      launchedAt: input.launchedAt,
      paneLineage: {
        sessionName: input.pane.sessionName,
        windowId: input.pane.windowId,
        paneId: input.pane.paneId,
        panePid: input.panePid,
      },
    };
    this.observed = identity;
    return { identity, wait: async () => ({ exitCode: 0 }) };
  }
  public async observe(identity: ProcessIdentityV1) {
    return this.observed?.pid === identity.pid ? this.observed : null;
  }
  public async findLaunchCandidates() {
    return this.candidates;
  }
  public async signalGroup(
    _identity: ProcessIdentityV1,
    signal: "SIGTERM" | "SIGKILL",
  ) {
    this.trace.push(signal);
  }
  public async waitForExit(_identity: ProcessIdentityV1, timeoutMs: number) {
    this.trace.push(`wait:${timeoutMs}`);
    const result = this.waitResults.shift() ?? true;
    if (result) this.observed = null;
    return result;
  }
}

function snapshot(overrides: Partial<RunSnapshotV3> = {}): RunSnapshotV3 {
  return {
    schemaVersion: 3,
    revision: 1,
    attempt: 1,
    runId: "run-5",
    ownerId: "owner-5",
    repository: "owner/repo",
    issueNumber: 5,
    state: "running_rpiv",
    branchType: "feat",
    branch,
    worktreePath: worktree,
    fetchedBaseProof: null,
    tmux,
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
    ...overrides,
  };
}

async function fixture(initial: RunSnapshotV3) {
  const files = new ControlFiles();
  files.values.set(worktree, "directory");
  const git = new ControlGit(files);
  const github = new ControlGitHub();
  const tmuxPort = new ControlTmux();
  const processes = new ControlProcess();
  let tick = 0;
  const ports: RunnerPorts = {
    files,
    git,
    github,
    tmux: tmuxPort,
    processes,
    clock: {
      now: () => `2026-08-11T13:00:${String(tick++).padStart(2, "0")}.000Z`,
    },
    ids: { nextOwnerId: () => "unused", nextRunId: () => "unused" },
  };
  const store = new RunStore(root, files, ports.clock);
  await store.acquire(5, {
    schemaVersion: 1,
    issueNumber: 5,
    ownerId: initial.ownerId,
    runId: initial.runId,
    repository: initial.repository,
    acquiredAt: "2026-08-11T13:00:00.000Z",
  });
  await store.save(initial, null, "fixture");
  if (
    initial.finalization?.result !== undefined &&
    initial.finalization?.result !== null
  )
    files.values.set(
      path.join(worktree, ".soft-factory", "agent-result.json"),
      JSON.stringify(initial.finalization.result),
    );
  return { files, git, github, tmux: tmuxPort, processes, ports, store };
}

describe("V-1 explicit legacy migration", () => {
  it("writes v3 only for an exactly reconciled terminal v2 snapshot", async () => {
    const f = await fixture(
      snapshot({ state: "interrupted", rpivProcess: null }),
    );
    const legacy: RunSnapshotV2 = {
      schemaVersion: 2,
      runId: "run-5",
      ownerId: "owner-5",
      repository: "owner/repo",
      issueNumber: 5,
      state: "interrupted",
      branchType: "feat",
      branch,
      worktreePath: worktree,
      fetchedBaseProof: null,
      tmux,
      copilot: null,
      error: null,
      updatedAt: "2026-08-11T13:00:00.000Z",
      requiredAcceptanceCriteria: [{ id: "AC-1", text: "recover" }],
      requiredValidations: REQUIRED_VALIDATIONS,
      finalization: null,
    };
    f.files.values.set(f.store.snapshotPath(5), JSON.stringify(legacy));
    f.files.values.set(
      f.store.eventsPath(5),
      `${JSON.stringify({
        schemaVersion: 1,
        at: "2026-08-11T13:00:00.000Z",
        runId: legacy.runId,
        issueNumber: 5,
        from: "running_rpiv",
        to: "interrupted",
        reason: "legacy",
      })}\n`,
    );
    const report = await new IssueRunService(f.ports).reconcile(5, root);
    expect(report.persisted).toMatchObject({
      schemaVersion: 3,
      revision: 1,
      state: "interrupted",
    });
    expect(await f.store.loadHistory(5)).toHaveLength(2);
  });
});

describe("V-3 exact process preservation and adoption", () => {
  it("reconcile, resume, and worker preserve an exact active process without launch or attempt change", async () => {
    const f = await fixture(snapshot());
    const service = new IssueRunService(f.ports);
    const report = await service.reconcile(5, root);
    const resumed = await service.resume(5, root);
    const worker = await service.runWorker(5, root);
    expect(report.decisionCode).toBe("active_preserved");
    expect(resumed).toMatchObject({
      code: "ACTIVE_PRESERVED",
      facts: { launched: false, attempt: 1 },
    });
    expect(worker.attempt).toBe(1);
    expect(f.processes.launches).toBe(0);
  });

  it("reacquires one exact capacity slot before starting a new interrupted attempt", async () => {
    const f = await fixture(
      snapshot({ state: "interrupted", rpivProcess: null }),
    );
    f.processes.observed = null;
    const resumed = await new IssueRunService(f.ports).resume(5, root);
    expect(resumed).toMatchObject({
      code: "RESUME_STARTED",
      facts: { launched: true, attempt: 2 },
    });
    const persisted = await f.store.load(5);
    expect(persisted).toMatchObject({
      state: "running_rpiv",
      attempt: 2,
      admission: { slot: 1, issueNumber: 5 },
    });
    expect(f.tmux.trace).toContain("restart");
    expect(await f.store.readOwner(5)).not.toBeNull();
  });

  it("adopts exactly one interrupted-launch pane descendant and blocks multiple candidates", async () => {
    const intent: LaunchIntentV1 = {
      schemaVersion: 1,
      attempt: 1,
      executable: "copilot",
      args: processIdentity.args,
      cwd: worktree,
      resourceAttributes: "project.name=owner-repo,issue.id=issue-5",
      pane: tmux,
      panePid: 500,
      recordedAt: "2026-08-11T13:00:00.000Z",
    };
    const f = await fixture(
      snapshot({ launchIntent: intent, rpivProcess: null }),
    );
    f.processes.observed = null;
    f.processes.candidates = [processIdentity];
    const adopted = await new IssueRunService(f.ports).runWorker(5, root);
    expect(adopted.rpivProcess).toEqual(processIdentity);
    expect(f.processes.launches).toBe(0);

    const ambiguous = await fixture(
      snapshot({ launchIntent: intent, rpivProcess: null }),
    );
    ambiguous.processes.observed = null;
    ambiguous.processes.candidates = [
      processIdentity,
      { ...processIdentity, pid: 502 },
    ];
    await expect(
      new IssueRunService(ambiguous.ports).runWorker(5, root),
    ).rejects.toMatchObject({
      code: "PROCESS_IDENTITY_AMBIGUOUS",
    });
    expect(ambiguous.processes.launches).toBe(0);
  });
});

describe("V-7 bounded stop and retained evidence", () => {
  it("orders graceful stop and preserves worktree, tmux, snapshot, events, and log", async () => {
    const f = await fixture(snapshot());
    f.processes.waitResults = [true];
    const stopped = await new IssueRunService(f.ports).stop(5, root);
    expect(stopped).toMatchObject({
      code: "STOPPED",
      facts: { escalated: false, termWaitMs: 10000 },
    });
    expect(f.processes.trace).toEqual(["SIGTERM", "wait:10000"]);
    expect(f.files.values.has(worktree)).toBe(true);
    expect(f.tmux.present).toBe(true);
    expect(
      [...f.files.values.keys()].some((entry) =>
        entry.endsWith("/logs/5/1.log"),
      ),
    ).toBe(true);
    const persisted = await f.store.load(5);
    expect(persisted).toMatchObject({
      state: "cancelled",
      stop: { escalated: false },
    });
  });

  it("finalizes a recorded stop when the exact process is already absent", async () => {
    const f = await fixture(
      snapshot({
        stop: {
          requestedAt: "2026-08-11T13:00:00.000Z",
          termSentAt: "2026-08-11T13:00:01.000Z",
          killSentAt: null,
          completedAt: null,
          escalated: false,
          processIdentity,
          beforeLog: null,
          afterLog: null,
        },
      }),
    );
    f.processes.observed = null;
    const stopped = await new IssueRunService(f.ports).stop(5, root);
    expect(stopped).toMatchObject({
      code: "STOPPED",
      facts: { signaled: false, recoveredFromRecordedStop: true },
    });
    expect(f.processes.trace).toEqual([]);
    await expect(f.store.load(5)).resolves.toMatchObject({
      state: "cancelled",
    });
  });

  it("caps retained transcripts at 2 MiB and marks truncation", async () => {
    const f = await fixture(snapshot());
    f.tmux.captureContent = "x".repeat(2 * 1024 * 1024);
    await new IssueRunService(f.ports).stop(5, root);
    const logPath = [...f.files.values.keys()].find((entry) =>
      entry.endsWith("/logs/5/1.log"),
    );
    expect(logPath).toBeDefined();
    if (logPath === undefined) throw new Error("fixture log missing");
    const content = f.files.values.get(logPath) ?? "";
    expect(Buffer.byteLength(content)).toBeLessThanOrEqual(2 * 1024 * 1024);
    expect(content).toContain("[TRUNCATED TO LAST 2 MiB]");
  });

  it("sends no signal when PID reuse changes the process start token", async () => {
    const f = await fixture(snapshot());
    f.processes.observed = { ...processIdentity, startToken: "reused" };
    const stopped = await new IssueRunService(f.ports).stop(5, root);
    expect(stopped.code).toBe("STOP_REFUSED");
    expect(f.processes.trace).toEqual([]);
  });

  it("sends SIGKILL only after the ten-second wait and observes the five-second bound", async () => {
    const f = await fixture(snapshot());
    f.processes.waitResults = [false, true];
    const stopped = await new IssueRunService(f.ports).stop(5, root);
    expect(stopped).toMatchObject({
      code: "STOPPED",
      facts: { escalated: true, killWaitMs: 5000 },
    });
    expect(f.processes.trace).toEqual([
      "SIGTERM",
      "wait:10000",
      "SIGKILL",
      "wait:5000",
    ]);
  });
});

describe("V-8/V-9/V-10 guarded cleanup", () => {
  function completed(): RunSnapshotV3 {
    return snapshot({
      state: "completed",
      rpivProcess: null,
      fetchedBaseProof: {
        schemaVersion: 1,
        remote: "origin",
        defaultBranch: "main",
        advertisedHeadSha: sha,
        trackingRefSha: sha,
        fetchedAt: "2026-08-11T12:00:00.000Z",
        matches: true,
      },
      finalization: {
        result,
        git: {
          localHeadSha: sha,
          remote: "origin",
          remoteBranch: branch,
          remoteHeadSha: sha,
        },
        pullRequest: {
          number: 15,
          state: "OPEN",
          baseBranch: "main",
          headBranch: branch,
          headSha: sha,
          closesIssues: [5],
          complete: true,
        },
        reconciliation: {
          schemaVersion: 1,
          comparisons: [],
          passed: true,
          decisionCode: "COMPLETION_PROVED",
        },
      },
    });
  }

  it("automatically removes only the clean exact worktree and issue lock for matching merged source head", async () => {
    const f = await fixture(completed());
    const status = await new IssueRunService(f.ports).status(5, root);
    expect(f.git.trace).toEqual(["remove-worktree-no-force"]);
    expect(await f.store.readOwner(5)).toBeNull();
    expect(f.tmux.present).toBe(true);
    expect(status.persisted).toMatchObject({
      state: "completed",
      cleanup: {
        mode: "automatic_merged",
        completedSteps: ["worktree", "lease", "lock"],
      },
      mergedPullRequest: { sourceHeadSha: sha, mergeCommitSha: "b".repeat(40) },
    });
    expect(status.persisted.branch).toBe(branch);
    expect(f.files.values.has(f.store.eventsPath(5))).toBe(true);
    expect(f.files.values.has(f.store.snapshotPath(5))).toBe(true);
  });

  it("returns an idempotent already-cleaned result after explicit cleanup", async () => {
    const f = await fixture(
      snapshot({ state: "interrupted", rpivProcess: null }),
    );
    const service = new IssueRunService(f.ports);
    await expect(service.clean(5, root)).resolves.toMatchObject({
      code: "CLEANUP_COMPLETED",
    });
    const destructiveCalls = [...f.git.trace, ...f.tmux.trace].length;
    await expect(service.clean(5, root)).resolves.toMatchObject({
      code: "CLEANUP_ALREADY_COMPLETED",
      exitCode: 0,
    });
    expect([...f.git.trace, ...f.tmux.trace]).toHaveLength(destructiveCalls);
  });

  it("refuses active cleanup without any destructive call", async () => {
    const f = await fixture(snapshot());
    const cleaned = await new IssueRunService(f.ports).clean(5, root);
    expect(cleaned.code).toBe("CLEANUP_ACTIVE");
    expect(f.git.trace).toEqual([]);
    expect(f.tmux.trace).toEqual([]);
  });

  it.each([
    ["staged", { staged: true }],
    ["unstaged", { unstaged: true }],
    ["untracked", { untracked: true }],
  ])(
    "refuses %s dirtiness with zero destructive calls",
    async (_label, dirtiness) => {
      const f = await fixture(
        snapshot({ state: "interrupted", rpivProcess: null }),
      );
      Object.assign(f.git, dirtiness);
      const cleaned = await new IssueRunService(f.ports).clean(5, root);
      expect(cleaned.code).toBe("CLEANUP_DIRTY_WORKTREE");
      expect(f.git.trace).toEqual([]);
      expect(f.files.values.has(worktree)).toBe(true);
    },
  );

  it("preserves a closed-unmerged completed worktree with actionable blocked merge proof", async () => {
    const f = await fixture(completed());
    f.github.merged = { ...f.github.merged, state: "CLOSED", mergedAt: null };
    const status = await new IssueRunService(f.ports).status(5, root);
    expect(status.reconciliation.decisionCode).toBe("CLEANUP_MERGE_NOT_PROVED");
    expect(status.persisted.state).toBe("completed");
    expect(f.git.trace).toEqual([]);
    expect(f.files.values.has(worktree)).toBe(true);
    expect(await f.store.readOwner(5)).not.toBeNull();
  });

  it("refuses mismatched ownership and never removes a replacement", async () => {
    const f = await fixture(
      snapshot({ state: "interrupted", rpivProcess: null }),
    );
    f.git.observedBranch = "feat/other";
    const before = f.files.values.get(worktree);
    const cleaned = await new IssueRunService(f.ports).clean(5, root);
    expect(cleaned.code).toBe("CLEANUP_OWNERSHIP_UNPROVED");
    expect(f.git.trace).toEqual([]);
    expect(f.files.values.get(worktree)).toBe(before);
  });
});

describe("V-4 deterministic recovery and control CLI dispatch", () => {
  it.each([
    ["status", 0],
    ["reconcile", 0],
    ["resume", 0],
    ["stop", 0],
    ["logs", 0],
  ] as const)(
    "dispatches %s with structured JSON and stable exit",
    async (command, expectedExit) => {
      const f = await fixture(snapshot());
      const response = await runCli([command, "5", "--json"], root, f.ports);
      expect(response.exitCode).toBe(expectedExit);
      const parsed: unknown = JSON.parse(response.stdout);
      expect(parsed).toBeDefined();
    },
  );

  it("keeps human and JSON status meaning aligned and dispatches list, attach, and clean", async () => {
    const humanFixture = await fixture(snapshot());
    const human = await runCli(["status", "5"], root, humanFixture.ports);
    expect(human.stdout).toContain("active_preserved");
    expect(human.stdout).toContain("Persisted state: running_rpiv");

    const jsonFixture = await fixture(snapshot());
    const json = await runCli(
      ["status", "5", "--json"],
      root,
      jsonFixture.ports,
    );
    const facts: unknown = JSON.parse(json.stdout);
    expect(facts).toMatchObject({
      persisted: { state: "running_rpiv" },
      reconciliation: { decisionCode: "active_preserved" },
    });

    const attachFixture = await fixture(snapshot());
    await expect(
      runCli(["attach", "5"], root, attachFixture.ports),
    ).resolves.toMatchObject({ exitCode: 0 });

    const listFixture = await fixture(snapshot());
    const listed = await runCli(["list", "--json"], root, listFixture.ports);
    expect(listed).toMatchObject({ exitCode: 0 });
    expect(listed.stdout).toContain("INVENTORY_READY");

    const cleanFixture = await fixture(
      snapshot({ state: "interrupted", rpivProcess: null }),
    );
    const cleaned = await runCli(
      ["clean", "5", "--json"],
      root,
      cleanFixture.ports,
    );
    expect(cleaned.exitCode).toBe(0);
    expect(cleaned.stdout).toContain("CLEANUP_COMPLETED");
  });
});
