import path from "node:path";
import type {
  AgentResultV1,
  CleanupStep,
  ConcurrencyLeaseV1,
  IssueFacts,
  LaunchIntentV1,
  LegacyAgentResultV1,
  MergedPullRequestFactsV1,
  ProcessIdentityV1,
  ReconciliationReportV2,
  RepositoryFacts,
  RunSnapshotV2,
  RunSnapshotV3,
  RunSnapshotV4,
  TmuxIdentity,
  TmuxIdentityDiagnosticV1,
} from "./domain";
import {
  LEGACY_FINAL_VALIDATION_EVIDENCE,
  REQUIRED_VALIDATIONS,
} from "./domain";
import { RunnerError } from "./errors";
import { TmuxIdentityOutputError } from "./tmux-identity";
import { runCli } from "./index";
import { integrationLaunch } from "./integration";
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
const tmuxDiagnostic: TmuxIdentityDiagnosticV1 = {
  schemaVersion: 1,
  phase: "create",
  exitCode: 0,
  stdoutByteCount: 7,
  stderrByteCount: 0,
  recordCount: 1,
  recordsTruncated: false,
  records: [{ fieldCount: 3, truncated: false }],
  signature: [
    "window_id",
    "horizontal_tab",
    "pane_id",
    "horizontal_tab",
    "other",
    "line_feed",
  ],
  signatureTruncated: false,
};

const lease: ConcurrencyLeaseV1 = {
  schemaVersion: 1,
  slot: 1,
  issueNumber: 5,
  ownerId: "owner-5",
  runId: "run-5",
  repository: "owner/repo",
  configuredLimit: 2,
  acquiredAt: "2026-08-11T13:00:00.000Z",
};
const legacyRequiredValidations = [
  { command: "just verify-focused" },
  { command: "just verify" },
] as const;
const legacyResult: LegacyAgentResultV1 = {
  schemaVersion: 1,
  issueNumber: 5,
  outcome: "succeeded",
  branch,
  headSha: sha,
  prNumber: 15,
  acceptanceCriteria: [{ id: "AC-1", status: "verified", evidence: ["test"] }],
  validations: legacyRequiredValidations.map(({ command }) => ({
    command,
    status: "passed" as const,
  })),
  completedAt: "2026-08-11T13:10:00.000Z",
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
  requiredFinalValidation: {
    command: "just verify",
    status: "passed",
    evidence: ["test:just-verify"],
  },
  completedAt: "2026-08-11T13:10:00.000Z",
};

function requireMerged(
  value: MergedPullRequestFactsV1 | null,
): MergedPullRequestFactsV1 {
  if (value === null) throw new Error("fixture expected merged PR facts");
  return value;
}

class ControlFiles implements FilePort {
  public readonly values = new Map<string, string>();
  public readonly compareAndDeleteTrace: string[] = [];
  public failSnapshotAfterStep: CleanupStep | null = null;
  private failureInjected = false;
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
    if (
      this.failSnapshotAfterStep !== null &&
      !this.failureInjected &&
      filePath.includes("/.soft-factory/runs/")
    ) {
      const parsed: unknown = JSON.parse(content);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "cleanup" in parsed &&
        typeof parsed.cleanup === "object" &&
        parsed.cleanup !== null &&
        "completedSteps" in parsed.cleanup &&
        Array.isArray(parsed.cleanup.completedSteps) &&
        parsed.cleanup.completedSteps.includes(this.failSnapshotAfterStep)
      ) {
        this.failureInjected = true;
        throw new RunnerError(
          "CLEANUP_PARTIAL",
          "Injected snapshot replacement failure after a cleanup step.",
          "Retry from the durable event-ahead cleanup progress.",
        );
      }
    }
    this.values.set(filePath, content);
  }
  public async append(filePath: string, content: string) {
    this.values.set(filePath, (this.values.get(filePath) ?? "") + content);
  }
  public async compareAndDelete(filePath: string, expected: string) {
    this.compareAndDeleteTrace.push(filePath);
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
  public merged: MergedPullRequestFactsV1 | null = {
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
  public async findOpenPullRequest() {
    return this.loadPullRequest();
  }
  public mergedFailure: RunnerError | null = null;
  public async loadMergedPullRequest() {
    if (this.mergedFailure !== null) throw this.mergedFailure;
    return this.merged;
  }
}

class ControlTmux implements TmuxPort {
  public readonly trace: string[] = [];
  public present = true;
  public namePresent = false;
  public nameResults: boolean[] = [];
  public createFailure: TmuxIdentityOutputError | null = null;
  public observationFailure: TmuxIdentityOutputError | null = null;
  public nameObservations = 0;
  public identityObservations = 0;
  public createCalls = 0;
  public createdWindows = 0;
  public captureContent = "token=[REDACTED] pane evidence";
  public async createIssueWindow(): Promise<TmuxIdentity> {
    this.createCalls += 1;
    if (await this.observeIssueWindowName())
      throw new RunnerError(
        "RESOURCE_OWNERSHIP_UNKNOWN",
        "A same-name tmux window appeared before creation.",
        "Preserve the unknown window and reconcile ownership manually.",
      );
    this.createdWindows += 1;
    if (this.createFailure !== null) throw this.createFailure;
    this.present = true;
    return tmux;
  }
  public async observeIssueWindowName(): Promise<boolean> {
    this.nameObservations += 1;
    this.trace.push("observe-name");
    return this.nameResults.shift() ?? this.namePresent;
  }
  public async observe(target: TmuxIdentity) {
    this.identityObservations += 1;
    if (this.observationFailure !== null) throw this.observationFailure;
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
  public workerObserved: ProcessIdentityV1 | null = null;
  public observationFailure: RunnerError | null = null;
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
  public async identify(
    pid: number,
    paneLineage: ProcessIdentityV1["paneLineage"],
    launchedAt: string,
  ) {
    const identity = {
      schemaVersion: 1 as const,
      pid,
      processGroupId: pid,
      startToken: "worker",
      executable: "/usr/bin/soft-factory",
      args: ["internal", "run-agent", "--issue", "5"],
      cwd: worktree,
      launchedAt,
      paneLineage,
    };
    this.workerObserved = identity;
    return identity;
  }
  public async observe(identity: ProcessIdentityV1) {
    if (this.observationFailure !== null) throw this.observationFailure;
    if (this.observed?.pid === identity.pid) return this.observed;
    return this.workerObserved?.pid === identity.pid
      ? this.workerObserved
      : null;
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
    admission:
      overrides.state === undefined || overrides.state === "running_rpiv"
        ? lease
        : null,
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
    requiredValidations: legacyRequiredValidations,
    finalization: null,
    ...overrides,
  };
}

async function fixture(initial: RunSnapshotV3 | RunSnapshotV4) {
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
  if (initial.admission !== null) await store.acquireLease(initial.admission);
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

function versionFour(value: RunSnapshotV3): RunSnapshotV4 {
  const { requiredValidations: legacyValidations, ...base } = value;
  void legacyValidations;
  const requiredFinalValidation = { command: "just verify" };
  return {
    ...base,
    schemaVersion: 4,
    requiredFinalValidation,
    integrationLaunch: integrationLaunch({
      runId: value.runId,
      attempt: value.attempt,
      issueNumber: value.issueNumber,
      branch: value.branch,
      worktreePath: value.worktreePath,
      startedAt: value.updatedAt,
      requiredFinalValidation,
    }),
    progress: null,
  };
}

describe("V-1 explicit legacy migration", () => {
  it("normalizes a supported v4 snapshot through one explicit revisioned v5 event", async () => {
    const f = await fixture(
      versionFour(snapshot({ state: "interrupted", rpivProcess: null })),
    );
    const report = await new IssueRunService(f.ports).reconcile(5, root);
    expect(report.persisted).toMatchObject({
      schemaVersion: 5,
      revision: 2,
      tmuxIdentityDiagnostic: null,
    });
    expect(await f.store.loadHistory(5)).toHaveLength(2);
    expect((await f.store.loadHistory(5)).at(-1)).toMatchObject({
      schemaVersion: 2,
      priorRevision: 1,
      resultingRevision: 2,
      reason: "v4-v5-snapshot-normalized",
      resultingSnapshot: { schemaVersion: 5, tmuxIdentityDiagnostic: null },
    });
  });

  it("writes explicit v4 and v5 transitions for an exactly reconciled terminal v2 snapshot", async () => {
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
      requiredValidations: legacyRequiredValidations,
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
      schemaVersion: 5,
      revision: 2,
      state: "interrupted",
    });
    expect(await f.store.loadHistory(5)).toHaveLength(3);
  });

  it("normalizes supported legacy state to sole just verify despite invalid current final-validation config", async () => {
    const f = await fixture(
      snapshot({ state: "interrupted", rpivProcess: null, admission: null }),
    );
    f.files.values.set(
      path.join(root, ".soft-factory", "config.yml"),
      "rpiv:\n  final_validation: [invalid current value]\n",
    );
    await new IssueRunService(f.ports).reconcile(5, root);
    await expect(f.store.load(5)).resolves.toMatchObject({
      schemaVersion: 5,
      requiredFinalValidation: { command: "just verify" },
      integrationLaunch: {
        requiredFinalValidation: { command: "just verify" },
      },
    });
  });

  it("deterministically migrates completed v3 proof without current config or focused requirements", async () => {
    const completed = snapshot({
      state: "completed",
      admission: null,
      rpivProcess: null,
      requiredValidations: legacyRequiredValidations,
      finalization: {
        result: legacyResult,
        git: null,
        pullRequest: null,
        reconciliation: {
          schemaVersion: 1,
          comparisons: [],
          passed: true,
          decisionCode: "COMPLETION_PROVED",
        },
      },
    });
    const normalized = [];
    for (const config of [
      "rpiv:\n  final_validation: [invalid current value]\n",
      "rpiv:\n  final_validation: just changed_check\n",
    ]) {
      const f = await fixture(completed);
      f.github.merged = null;
      f.files.values.set(
        path.join(root, ".soft-factory", "config.yml"),
        config,
      );
      const report = await new IssueRunService(f.ports).reconcile(5, root);
      expect(report.persisted).toMatchObject({
        schemaVersion: 5,
        state: "completed",
        requiredFinalValidation: { command: "just verify" },
        finalization: {
          result: {
            requiredFinalValidation: {
              command: "just verify",
              status: "passed",
              evidence: [LEGACY_FINAL_VALIDATION_EVIDENCE],
            },
          },
        },
      });
      expect(report.observations.result).toMatchObject({
        state: "match",
        code: "RESULT_MATCH",
      });
      expect("requiredValidations" in report.persisted).toBe(false);
      const migratedResult = report.persisted.finalization?.result;
      expect(migratedResult?.validations).toContainEqual({
        command: "just verify-focused",
        status: "passed",
      });
      normalized.push({
        requiredFinalValidation:
          report.persisted.schemaVersion === 5
            ? report.persisted.requiredFinalValidation
            : null,
        result: migratedResult,
      });
    }
    expect(normalized[0]).toEqual(normalized[1]);
  });
});

describe("V-2 collected reconciliation facts", () => {
  it("classifies an exact lease separately and blocks a replacement lease before control", async () => {
    const exact = await fixture(snapshot());
    const exactReport = await new IssueRunService(exact.ports).reconcile(
      5,
      root,
    );
    expect(exactReport.observations.lease).toEqual({
      state: "match",
      facts: lease,
      code: "LEASE_MATCH",
    });

    const replaced = await fixture(snapshot());
    replaced.files.values.set(
      replaced.store.leasePath(1),
      JSON.stringify({ ...lease, ownerId: "replacement-owner" }),
    );
    const replacementReport = await new IssueRunService(
      replaced.ports,
    ).reconcile(5, root);
    expect(replacementReport.observations.lease).toMatchObject({
      state: "mismatch",
      code: "LEASE_MISMATCH",
    });
    expect(replacementReport.safeActions).toEqual([]);
  });

  it("strictly parses and compares result identity and content instead of file presence", async () => {
    const persisted = snapshot({
      state: "completed",
      rpivProcess: null,
      finalization: {
        result: legacyResult,
        git: null,
        pullRequest: null,
        reconciliation: null,
      },
    });
    const f = await fixture(persisted);
    f.files.values.set(
      path.join(worktree, ".soft-factory", "agent-result.json"),
      JSON.stringify({ ...result, completedAt: "2026-08-11T13:11:00.000Z" }),
    );
    const report = await new IssueRunService(f.ports).reconcile(5, root);
    expect(report.observations.result).toMatchObject({
      state: "mismatch",
      code: "RESULT_CONTENT_MISMATCH",
    });
    expect(report.decisionCode).toBe("CLEANUP_OWNERSHIP_UNPROVED");
    expect(f.git.trace).toEqual([]);
  });

  it("classifies process observation permission failure as unknown, never absent", async () => {
    const f = await fixture(snapshot());
    f.processes.observationFailure = new RunnerError(
      "PROCESS_OBSERVATION_UNKNOWN",
      "Permission denied while reading process metadata.",
      "Restore process metadata permissions.",
    );
    const report = await new IssueRunService(f.ports).reconcile(5, root);
    expect(report.observations.rpivProcess).toEqual({
      state: "unknown",
      facts: null,
      code: "PROCESS_OBSERVATION_UNKNOWN",
    });
    expect(report.decisionCode).toBe("RECONCILIATION_UNKNOWN");
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
    expect(worker.workerProcess).toMatchObject({
      pid: 500,
      paneLineage: { paneId: tmux.paneId },
    });
    expect(
      (await f.store.loadHistory(5)).some(
        (event) =>
          event.schemaVersion === 2 &&
          event.reason === "worker-process-identity-recorded",
      ),
    ).toBe(true);
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
      integrationLaunch: {
        runId: "run-5",
        attempt: 2,
        issueNumber: 5,
        branch,
        progressPath: path.join(worktree, ".soft-factory", "rpiv-status.json"),
        resultPath: path.join(worktree, ".soft-factory", "agent-result.json"),
        requiredFinalValidation: { command: "just verify" },
      },
      progress: null,
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

describe("resume reconciliation gates", () => {
  it.each([
    ["preparation mismatch", "preparing_worktree" as const],
    ["interrupted mismatch", "interrupted" as const],
  ])(
    "refuses %s without creating or restarting resources",
    async (_label, state) => {
      const f = await fixture(
        snapshot({
          state,
          rpivProcess: null,
          admission: state === "preparing_worktree" ? lease : null,
        }),
      );
      f.processes.observed = null;
      f.git.observedBranch = "feat/unrelated";
      const resumed = await new IssueRunService(f.ports).resume(5, root);
      expect(resumed).toMatchObject({ code: "RESUME_REFUSED", exitCode: 4 });
      expect(resumed.report?.decisionCode).toBe("RECONCILIATION_MISMATCH");
      expect(f.tmux.trace).not.toContain("restart");
      expect(f.git.trace).toEqual([]);
    },
  );

  it("refuses finalization retry when strict result reconciliation is mismatched", async () => {
    const f = await fixture(
      snapshot({
        state: "finalizing",
        rpivProcess: null,
        finalization: {
          result: legacyResult,
          git: null,
          pullRequest: null,
          reconciliation: null,
        },
      }),
    );
    f.processes.observed = null;
    f.files.values.set(
      path.join(worktree, ".soft-factory", "agent-result.json"),
      JSON.stringify({ ...result, prNumber: 99 }),
    );
    const resumed = await new IssueRunService(f.ports).resume(5, root);
    expect(resumed).toMatchObject({ code: "RESUME_REFUSED", exitCode: 4 });
    expect(resumed.report?.observations.result.code).toBe(
      "RESULT_CONTENT_MISMATCH",
    );
  });
});

describe("Issue 29 preparation identity recovery", () => {
  function startingTmuxSnapshot(): RunSnapshotV3 {
    return snapshot({
      state: "starting_tmux",
      admission: lease,
      fetchedBaseProof: {
        schemaVersion: 1,
        remote: "origin",
        defaultBranch: "main",
        advertisedHeadSha: sha,
        trackingRefSha: sha,
        fetchedAt: "2026-08-11T12:00:00.000Z",
        matches: true,
      },
      tmux: null,
      workerProcess: null,
      rpivProcess: null,
    });
  }

  it("retains a create failure and retries one zero-candidate creation without duplicate resources", async () => {
    const f = await fixture(startingTmuxSnapshot());
    f.tmux.present = false;
    f.processes.observed = null;
    f.tmux.createFailure = new TmuxIdentityOutputError(
      "TMUX_IDENTITY_MALFORMED",
      "tmux returned malformed or ambiguous create identity evidence.",
      tmuxDiagnostic,
    );
    const service = new IssueRunService(f.ports);

    await expect(service.resume(5, root)).rejects.toMatchObject({
      code: "TMUX_IDENTITY_MALFORMED",
    });
    await expect(f.store.load(5)).resolves.toMatchObject({
      schemaVersion: 5,
      state: "starting_tmux",
      admission: lease,
      tmux: null,
      tmuxIdentityDiagnostic: tmuxDiagnostic,
    });
    expect(await f.store.readOwner(5)).not.toBeNull();
    expect(await f.store.readLease(lease.slot)).toEqual(lease);
    expect(f.git.trace).toEqual([]);

    f.tmux.createFailure = null;
    const beforeRetryCreates = f.tmux.createCalls;
    const report = await service.reconcile(5, root);
    expect(report).toMatchObject({
      schemaVersion: 2,
      decisionCode: "PREPARATION_RESUME_AVAILABLE",
      safeActions: ["resume"],
      tmuxIdentityDiagnostic: tmuxDiagnostic,
    });
    const resumed = await service.resume(5, root);
    expect(resumed).toMatchObject({
      code: "PREPARATION_RESUMED",
      state: "running_rpiv",
      facts: { launched: true, attempt: 1 },
    });
    expect(f.tmux.createCalls - beforeRetryCreates).toBe(1);
    expect(f.tmux.createdWindows).toBe(2);
    expect(f.git.trace).toEqual([]);
    expect(f.processes.launches).toBe(0);
    await expect(f.store.load(5)).resolves.toMatchObject({
      state: "running_rpiv",
      tmux,
      tmuxIdentityDiagnostic: null,
      admission: lease,
    });
  });

  it.each([
    ["HEAD mismatch", { observedHead: "b".repeat(40) }],
    ["staged", { staged: true }],
    ["unstaged", { unstaged: true }],
    ["untracked", { untracked: true }],
  ])(
    "refuses starting_tmux when %s without creation",
    async (_label, changed) => {
      const f = await fixture(startingTmuxSnapshot());
      f.tmux.present = false;
      f.processes.observed = null;
      Object.assign(f.git, changed);
      const resumed = await new IssueRunService(f.ports).resume(5, root);
      expect(resumed).toMatchObject({ code: "RESUME_REFUSED", exitCode: 4 });
      expect(resumed.report?.safeActions).toEqual([]);
      expect(f.tmux.createCalls).toBe(0);
      expect(f.git.trace).toEqual([]);
    },
  );

  it("refuses a same-name candidate without inspecting or mutating it", async () => {
    const f = await fixture(startingTmuxSnapshot());
    f.tmux.present = false;
    f.tmux.namePresent = true;
    f.processes.observed = null;
    const service = new IssueRunService(f.ports);
    await service.reconcile(5, root);
    const before = new Map(f.files.values);
    const resumed = await service.resume(5, root);
    expect(resumed).toMatchObject({
      code: "RESUME_REFUSED",
      report: {
        decisionCode: "RESOURCE_OWNERSHIP_UNKNOWN",
        safeActions: [],
        observations: {
          tmux: {
            state: "mismatch",
            code: "TMUX_NAME_PRESENT_UNKNOWN",
            facts: { present: true },
          },
        },
      },
    });
    expect(f.files.values).toEqual(before);
    expect(f.tmux.createCalls).toBe(0);
    expect(f.tmux.identityObservations).toBe(0);
    expect(f.processes.launches).toBe(0);
    expect(f.git.trace).toEqual([]);
  });

  it("rechecks only name absence and refuses a candidate that appears before mutation", async () => {
    const f = await fixture(startingTmuxSnapshot());
    f.tmux.present = false;
    f.tmux.nameResults = [false, true];
    f.processes.observed = null;
    await expect(
      new IssueRunService(f.ports).resume(5, root),
    ).rejects.toMatchObject({
      code: "RESOURCE_OWNERSHIP_UNKNOWN",
    });
    expect(f.tmux.nameObservations).toBe(2);
    expect(f.tmux.createCalls).toBe(1);
    expect(f.tmux.createdWindows).toBe(0);
    expect(f.processes.workerObserved).toBeNull();
    expect(f.processes.launches).toBe(0);
    expect(f.git.trace).toEqual([]);
  });

  it("keeps LOG_NOT_FOUND independent from a retained preparation diagnostic", async () => {
    const f = await fixture(startingTmuxSnapshot());
    f.tmux.present = false;
    f.processes.observed = null;
    f.tmux.createFailure = new TmuxIdentityOutputError(
      "TMUX_IDENTITY_MALFORMED",
      "tmux returned malformed or ambiguous create identity evidence.",
      tmuxDiagnostic,
    );
    const service = new IssueRunService(f.ports);
    await expect(service.resume(5, root)).rejects.toBeInstanceOf(
      TmuxIdentityOutputError,
    );
    const logs = await service.logs(5, root);
    expect(logs).toMatchObject({
      code: "LOG_NOT_FOUND",
      exitCode: 4,
      report: {
        decisionCode: "PREPARATION_RESUME_AVAILABLE",
        safeActions: ["resume"],
        tmuxIdentityDiagnostic: tmuxDiagnostic,
      },
    });
    const jsonStatus = await runCli(["status", "5", "--json"], root, f.ports);
    expect(JSON.parse(jsonStatus.stdout)).toMatchObject({
      schemaVersion: 4,
      persisted: { schemaVersion: 5, tmuxIdentityDiagnostic: tmuxDiagnostic },
      reconciliation: {
        schemaVersion: 2,
        tmuxIdentityDiagnostic: tmuxDiagnostic,
      },
    });
    const humanStatus = await runCli(["status", "5"], root, f.ports);
    expect(humanStatus.stdout).toContain(
      "Tmux identity evidence: malformed or ambiguous",
    );
    expect(humanStatus.stdout).not.toContain("Upgrade tmux");
  });
});

describe("Issue 29 one-pass observation diagnostic lifecycle", () => {
  it("retains, preserves on absence, replaces, and clears with one observation each", async () => {
    const f = await fixture(snapshot());
    const observeDiagnostic = { ...tmuxDiagnostic, phase: "observe" as const };
    f.tmux.observationFailure = new TmuxIdentityOutputError(
      "TMUX_IDENTITY_MALFORMED",
      "tmux returned malformed or ambiguous observe identity evidence.",
      observeDiagnostic,
    );
    const service = new IssueRunService(f.ports);
    const malformed = await service.reconcile(5, root);
    expect(f.tmux.identityObservations).toBe(1);
    expect(malformed).toMatchObject({
      decisionCode: "RECONCILIATION_UNKNOWN",
      tmuxIdentityDiagnostic: observeDiagnostic,
      persisted: { tmuxIdentityDiagnostic: observeDiagnostic },
    });

    f.tmux.observationFailure = null;
    f.tmux.present = false;
    const absent = await service.reconcile(5, root);
    expect(f.tmux.identityObservations).toBe(2);
    expect(absent).toMatchObject({
      observations: { tmux: { state: "absent", code: "TMUX_ABSENT" } },
      tmuxIdentityDiagnostic: observeDiagnostic,
    });

    const replacement = {
      ...observeDiagnostic,
      stdoutByteCount: 99,
      signature: ["other" as const],
    };
    f.tmux.observationFailure = new TmuxIdentityOutputError(
      "TMUX_IDENTITY_MALFORMED",
      "tmux returned malformed or ambiguous observe identity evidence.",
      replacement,
    );
    const replaced = await service.reconcile(5, root);
    expect(f.tmux.identityObservations).toBe(3);
    expect(replaced.tmuxIdentityDiagnostic).toEqual(replacement);

    f.tmux.observationFailure = null;
    f.tmux.present = true;
    const cleared = await service.reconcile(5, root);
    expect(f.tmux.identityObservations).toBe(4);
    expect(cleared.tmuxIdentityDiagnostic).toBeNull();
    await expect(f.store.load(5)).resolves.toMatchObject({
      tmuxIdentityDiagnostic: null,
    });
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
  it("preserves active process identity, ownership, and capacity after SIGKILL remains ineffective", async () => {
    const f = await fixture(snapshot());
    f.processes.waitResults = [false, false];
    const stopped = await new IssueRunService(f.ports).stop(5, root);
    expect(stopped).toMatchObject({
      code: "STOP_PROCESS_STILL_ACTIVE",
      exitCode: 4,
      state: "running_rpiv",
      facts: {
        processIdentityPreserved: true,
        leasePreserved: true,
        escalated: true,
      },
    });
    expect(f.processes.trace).toEqual([
      "SIGTERM",
      "wait:10000",
      "SIGKILL",
      "wait:5000",
    ]);
    const persisted = await f.store.load(5);
    expect(persisted).toMatchObject({
      state: "running_rpiv",
      rpivProcess: processIdentity,
      admission: lease,
      stop: { completedAt: null, escalated: true },
      error: { code: "STOP_PROCESS_STILL_ACTIVE" },
    });
    expect(await f.store.readLease(lease.slot)).toEqual(lease);
    expect(await f.store.readOwner(5)).not.toBeNull();
    expect(f.files.values.has(worktree)).toBe(true);
    expect(f.tmux.present).toBe(true);
    const report = await new IssueRunService(f.ports).reconcile(5, root);
    expect(report.decisionCode).toBe("active_preserved");
    expect(
      (await f.store.loadHistory(5)).every(
        (event) =>
          event.schemaVersion !== 2 ||
          event.resultingSnapshot.state !== "cancelled",
      ),
    ).toBe(true);
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
        result: legacyResult,
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

  it.each(["status", "list", "reconcile"] as const)(
    "automatically cleans once through %s and reports repeat reconciliation as already cleaned",
    async (trigger) => {
      const f = await fixture({ ...completed(), admission: lease });
      const service = new IssueRunService(f.ports);
      const invoke = async (): Promise<string | undefined> => {
        if (trigger === "status") {
          const report = (await service.status(5, root)).reconciliation;
          expect(report.safeActions).not.toContain("automatic_clean");
          return report.decisionCode;
        }
        if (trigger === "reconcile") {
          const report = await service.reconcile(5, root);
          expect(report.safeActions).not.toContain("automatic_clean");
          return report.decisionCode;
        }
        const listed = await service.list(root);
        expect(listed.code).toBe("INVENTORY_READY");
        return listed.facts.find((entry) => entry.issueNumber === 5)?.code;
      };

      await expect(invoke()).resolves.toBe("CLEANUP_ALREADY_COMPLETED");
      expect(f.git.trace).toEqual(["remove-worktree-no-force"]);
      expect(f.files.compareAndDeleteTrace).toEqual([
        f.store.leasePath(lease.slot),
        f.store.lockPath(5),
      ]);
      expect(await f.store.readLease(lease.slot)).toBeNull();
      expect(await f.store.readOwner(5)).toBeNull();
      expect(f.tmux.trace).toEqual([]);
      expect(f.tmux.present).toBe(true);

      const cleaned = await f.store.load(5);
      expect(cleaned).toMatchObject({
        state: "completed",
        admission: null,
        cleanup: {
          mode: "automatic_merged",
          completedSteps: ["worktree", "lease", "lock"],
          remainingSteps: [],
        },
        mergedPullRequest: {
          sourceHeadSha: sha,
          mergeCommitSha: "b".repeat(40),
        },
      });
      expect(cleaned.branch).toBe(branch);
      expect(f.files.values.has(f.store.eventsPath(5))).toBe(true);
      expect(f.files.values.has(f.store.snapshotPath(5))).toBe(true);
      const cleanedRevision = cleaned.revision;
      const cleanedEventCount = (await f.store.loadHistory(5)).length;
      const destructiveTrace = {
        git: [...f.git.trace],
        tmux: [...f.tmux.trace],
        compareAndDelete: [...f.files.compareAndDeleteTrace],
      };

      await expect(invoke()).resolves.toBe("CLEANUP_ALREADY_COMPLETED");
      expect((await f.store.load(5)).revision).toBe(cleanedRevision);
      expect(await f.store.loadHistory(5)).toHaveLength(cleanedEventCount);
      expect({
        git: f.git.trace,
        tmux: f.tmux.trace,
        compareAndDelete: f.files.compareAndDeleteTrace,
      }).toEqual(destructiveTrace);
    },
  );

  it("lets explicit clean remove retained tmux after automatic cleanup without repeating prior steps", async () => {
    const f = await fixture({ ...completed(), admission: lease });
    const service = new IssueRunService(f.ports);
    await service.status(5, root);
    const worktreeCalls = [...f.git.trace];
    const deleteCalls = [...f.files.compareAndDeleteTrace];

    await expect(service.clean(5, root)).resolves.toMatchObject({
      code: "CLEANUP_COMPLETED",
      exitCode: 0,
      facts: {
        completedSteps: ["tmux", "worktree", "lease", "lock"],
      },
    });
    expect(f.tmux.trace).toEqual(["capture", "remove-window"]);
    expect(f.git.trace).toEqual(worktreeCalls);
    expect(f.files.compareAndDeleteTrace).toEqual(deleteCalls);
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
    f.github.merged = {
      ...requireMerged(f.github.merged),
      state: "CLOSED",
      mergedAt: null,
    };
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
  it("proves lock and lease ownership before the first destructive cleanup step", async () => {
    const f = await fixture({ ...completed(), admission: lease });
    f.files.values.set(
      f.store.leasePath(lease.slot),
      JSON.stringify({ ...lease, runId: "replacement-run" }),
    );
    const cleaned = await new IssueRunService(f.ports).clean(5, root);
    expect(cleaned).toMatchObject({
      code: "CLEANUP_OWNERSHIP_UNPROVED",
      exitCode: 4,
    });
    expect(f.tmux.trace).toEqual([]);
    expect(f.git.trace).toEqual([]);
    expect(f.files.values.has(worktree)).toBe(true);
  });

  it.each(["tmux", "worktree", "lease", "lock"] as const)(
    "replays durable progress and safely retries after %s completion snapshot failure",
    async (failedStep) => {
      const f = await fixture(
        snapshot({
          state: "interrupted",
          rpivProcess: null,
          admission: lease,
        }),
      );
      f.processes.observed = null;
      f.files.failSnapshotAfterStep = failedStep;
      const service = new IssueRunService(f.ports);
      const partial = await service.clean(5, root);
      expect(partial).toMatchObject({ code: "CLEANUP_PARTIAL", exitCode: 4 });
      expect(partial.facts).toMatchObject({
        completedSteps: expect.any(Array),
      });
      expect(
        (partial.facts as { completedSteps: readonly CleanupStep[] })
          .completedSteps,
      ).toContain(failedStep);

      const retried = await service.clean(5, root);
      expect(["CLEANUP_COMPLETED", "CLEANUP_ALREADY_COMPLETED"]).toContain(
        retried.code,
      );
      const persisted = await f.store.load(5);
      expect(persisted.cleanup).toMatchObject({
        ownerId: persisted.ownerId,
        runId: persisted.runId,
        completedSteps: ["tmux", "worktree", "lease", "lock"],
        remainingSteps: [],
      });
      expect(
        f.tmux.trace.filter((entry) => entry === "remove-window"),
      ).toHaveLength(1);
      expect(
        f.git.trace.filter((entry) => entry === "remove-worktree-no-force"),
      ).toHaveLength(1);
    },
  );

  it("refuses an unrelated worktree replacement after recorded partial cleanup", async () => {
    const f = await fixture(
      snapshot({ state: "interrupted", rpivProcess: null, admission: lease }),
    );
    f.processes.observed = null;
    f.files.failSnapshotAfterStep = "worktree";
    const service = new IssueRunService(f.ports);
    const partial = await service.clean(5, root);
    expect(partial.code).toBe("CLEANUP_PARTIAL");
    expect(partial.facts).toMatchObject({
      completedSteps: ["tmux", "worktree"],
    });

    f.files.values.set(worktree, "replacement bytes");
    f.git.pathExists = true;
    f.git.registered = true;
    f.git.observedBranch = "feat/unrelated-replacement";
    f.git.observedHead = "c".repeat(40);
    const destructiveCalls = [...f.tmux.trace, ...f.git.trace];
    const retried = await service.clean(5, root);
    expect(retried).toMatchObject({
      code: "CLEANUP_OWNERSHIP_UNPROVED",
      exitCode: 4,
    });
    expect([...f.tmux.trace, ...f.git.trace]).toEqual(destructiveCalls);
    expect(f.files.values.get(worktree)).toBe("replacement bytes");
  });

  it("blocks every unavailable, incomplete, missing, mismatched, or ambiguous expected-PR proof", async () => {
    for (const variant of [
      "closed-unmerged",
      "missing",
      "incomplete",
      "source-mismatch",
      "unavailable",
    ] as const) {
      const f = await fixture(completed());
      if (variant === "closed-unmerged")
        f.github.merged = {
          ...requireMerged(f.github.merged),
          state: "CLOSED",
          mergedAt: null,
        };
      if (variant === "missing") f.github.merged = null;
      if (variant === "incomplete")
        f.github.merged = {
          ...requireMerged(f.github.merged),
          complete: false,
        };
      if (variant === "source-mismatch")
        f.github.merged = {
          ...requireMerged(f.github.merged),
          sourceBranch: "feat/unrelated",
        };
      if (variant === "unavailable")
        f.github.mergedFailure = new RunnerError(
          "GITHUB_PROOF_INCOMPLETE",
          "GitHub observation unavailable.",
          "Retry the bounded GitHub observation.",
        );
      const status = await new IssueRunService(f.ports).status(5, root);
      expect(status.persisted.state).toBe("completed");
      expect(status.reconciliation).toMatchObject({
        activity: "blocked",
        decisionCode: "CLEANUP_MERGE_NOT_PROVED",
      });
      expect(status.reconciliation.remediation).toContain(
        "Preserve completed state and resources",
      );
      expect(f.git.trace).toEqual([]);
      expect(f.files.values.has(worktree)).toBe(true);
      expect(await f.store.readOwner(5)).not.toBeNull();
    }
  });

  it("blocks ambiguous completed ownership separately without rewriting completion", async () => {
    const f = await fixture(completed());
    f.files.values.set(
      f.store.lockPath(5),
      JSON.stringify({
        schemaVersion: 1,
        issueNumber: 5,
        ownerId: "replacement-owner",
        runId: "replacement-run",
        repository: "owner/repo",
        acquiredAt: "replacement-time",
      }),
    );
    const status = await new IssueRunService(f.ports).status(5, root);
    expect(status.persisted.state).toBe("completed");
    expect(status.reconciliation).toMatchObject({
      activity: "blocked",
      decisionCode: "CLEANUP_OWNERSHIP_UNPROVED",
    });
    expect(status.reconciliation.remediation).toContain(
      "Preserve the completed run",
    );
    expect(f.git.trace).toEqual([]);
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

  it("renders human and JSON control outcomes from equivalent common facts", async () => {
    const jsonFixture = await fixture(snapshot());
    const jsonResponse = await runCli(
      ["resume", "5", "--json"],
      root,
      jsonFixture.ports,
    );
    const structured = JSON.parse(jsonResponse.stdout) as {
      state: string;
      code: string;
      facts: unknown;
      remediation: string | null;
      report: ReconciliationReportV2;
    };
    const humanFixture = await fixture(snapshot());
    const humanResponse = await runCli(
      ["resume", "5"],
      root,
      humanFixture.ports,
    );
    expect(humanResponse.stdout).toContain("Issue #5: " + structured.state);
    expect(humanResponse.stdout).toContain("Outcome: " + structured.code);
    expect(humanResponse.stdout).toContain(
      "Facts: " + JSON.stringify(structured.facts),
    );
    expect(humanResponse.stdout).toContain(
      "Persisted state: " + structured.report.persisted.state,
    );
    expect(humanResponse.stdout).toContain(
      "Safe actions: " + structured.report.safeActions.join(", "),
    );
    for (const [boundary, observation] of Object.entries(
      structured.report.observations,
    ))
      expect(humanResponse.stdout).toContain(
        boundary +
          "=" +
          observation.state +
          ":" +
          observation.code +
          ":" +
          JSON.stringify(observation.facts),
      );
    expect(humanResponse.stdout).toContain("Remediation: none");

    const refusedJsonFixture = await fixture(snapshot());
    refusedJsonFixture.processes.observed = {
      ...processIdentity,
      startToken: "reused",
    };
    const refusedJson = await runCli(
      ["stop", "5", "--json"],
      root,
      refusedJsonFixture.ports,
    );
    const refused = JSON.parse(refusedJson.stdout) as {
      remediation: string;
      report: { safeActions: readonly string[] };
    };
    const refusedHumanFixture = await fixture(snapshot());
    refusedHumanFixture.processes.observed = {
      ...processIdentity,
      startToken: "reused",
    };
    const refusedHuman = await runCli(
      ["stop", "5"],
      root,
      refusedHumanFixture.ports,
    );
    expect(refusedHuman.stdout).toContain(
      "Safe actions: " +
        (refused.report.safeActions.length === 0
          ? "none"
          : refused.report.safeActions.join(", ")),
    );
    expect(refusedHuman.stdout).toContain(
      "Remediation: " + refused.remediation,
    );
  });
});
