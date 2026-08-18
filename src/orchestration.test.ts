import { execFile } from "node:child_process";
import * as fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type {
  IssueFacts,
  ProcessIdentityV1,
  RunSnapshotV6,
  RepositoryFacts,
  TmuxIdentity,
  TmuxIdentityDiagnosticV1,
} from "./domain";
import { parseConfiguration } from "./config";
import { normalizeRepositoryName } from "./domain";
import { RunnerError } from "./errors";
import { TmuxIdentityOutputError } from "./tmux-identity";
import { runCli } from "./index";
import { IssueRunService } from "./orchestrator";
import { RunStore } from "./persistence";
import { copilotChildEnvironment, createLivePorts } from "./live";
import { renderError } from "./render";
import { deriveStandaloneTmuxTarget, type TmuxTargetV2 } from "./tmux-target";
import type {
  FilePort,
  GitHubPort,
  GitPort,
  ProcessPort,
  RunnerPorts,
  TmuxPort,
} from "./ports";
import {
  proveFetchedBase,
  resolveRemote,
  validateAcceptanceCriteria,
} from "./readiness";

const executeFile = promisify(execFile);

const validBody = `# Acceptance
<!-- ACCEPTANCE_CRITERIA_START -->
${Array.from({ length: 10 }, (_, index) => `- [ ] criterion ${index + 1}`).join("\n")}
<!-- ACCEPTANCE_CRITERIA_END -->`;
const sha = "a".repeat(40);

class MemoryFiles implements FilePort {
  public readonly values = new Map<string, string>();
  public readonly trace: string[];
  public failAtomicWrite = false;
  public failImmutableWrite = false;
  public onReadText: ((filePath: string) => Promise<void>) | null = null;
  public constructor(trace: string[]) {
    this.trace = trace;
  }
  public async readText(filePath: string): Promise<string | null> {
    this.trace.push(`file:read:${filePath}`);
    if (this.onReadText !== null) await this.onReadText(filePath);
    return this.values.get(filePath) ?? null;
  }
  public async readAgentResult(worktreePath: string): Promise<string | null> {
    this.trace.push(`file:result:${worktreePath}`);
    return (
      this.values.get(`${worktreePath}/.soft-factory/agent-result.json`) ?? null
    );
  }
  public async exists(filePath: string): Promise<boolean> {
    this.trace.push(`file:exists:${filePath}`);
    return this.values.has(filePath);
  }
  public async list(directoryPath: string): Promise<readonly string[]> {
    const prefix = `${directoryPath}/`;
    return [...this.values.keys()]
      .filter((entry) => entry.startsWith(prefix))
      .map((entry) => entry.slice(prefix.length).split("/")[0])
      .filter(
        (entry, index, entries) =>
          entry !== "" && entries.indexOf(entry) === index,
      );
  }
  public async exclusiveCreate(
    filePath: string,
    content: string,
  ): Promise<boolean> {
    this.trace.push(`lock:create:${filePath}`);
    if (this.values.has(filePath)) return false;
    this.values.set(filePath, content);
    return true;
  }
  public async immutableWrite(
    filePath: string,
    content: string,
  ): Promise<boolean> {
    if (this.failImmutableWrite)
      throw new RunnerError(
        "EXTERNAL_COMMAND_FAILED",
        "Injected immutable publication failure.",
        "Retry after restoring storage.",
      );
    return this.exclusiveCreate(filePath, content);
  }
  public async atomicWrite(filePath: string, content: string): Promise<void> {
    this.trace.push(`snapshot:write:${filePath}`);
    if (this.failAtomicWrite)
      throw new RunnerError(
        "EXTERNAL_COMMAND_FAILED",
        "Injected atomic publication failure.",
        "Retry after restoring storage.",
      );
    this.values.set(filePath, content);
  }
  public async append(filePath: string, content: string): Promise<void> {
    this.trace.push(`event:append:${filePath}`);
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

class RecordingGit implements GitPort {
  public readonly trace: string[];
  public tracking: string | null = sha;
  public advertised = sha;
  public remote = sha;
  public remoteFailure: RunnerError | null = null;
  public branchPresent = false;
  public registered = false;
  private readonly registeredWorktrees = new Map<string, string>();
  public facts: RepositoryFacts;
  public worktreePath: string | null = null;
  public constructor(
    trace: string[],
    private readonly files: MemoryFiles,
    repository = "jsburckhardt/soft-factory-runner",
  ) {
    this.trace = trace;
    this.facts = {
      root: "/tmp/soft-factory-fixture",
      commonDirectory: "/tmp/soft-factory-fixture/.git",
      identity: {
        nameWithOwner: repository,
        normalizedName: normalizeRepositoryName(repository),
      },
      remotes: ["origin"],
      pushDefault: null,
      currentBranchRemote: null,
    };
  }
  public async discover(): Promise<RepositoryFacts> {
    this.trace.push("git:discover");
    return this.facts;
  }
  public async branchExists(): Promise<boolean> {
    this.trace.push("git:branch-observe");
    return this.branchPresent;
  }
  public async registeredWorktreeExists(
    _root: string,
    worktreePath: string,
  ): Promise<boolean> {
    this.trace.push("git:worktree-observe");
    return this.registered || this.registeredWorktrees.has(worktreePath);
  }
  public async observeWorktree(_root: string, worktreePath: string) {
    const branch = this.registeredWorktrees.get(worktreePath);
    const registered = this.registered || branch !== undefined;
    return {
      pathExists: this.files.values.has(worktreePath),
      registered,
      branch:
        branch ?? (this.registered ? "feat/3-phase-1-run-one-issue" : null),
      headSha: registered ? sha : null,
      staged: false,
      unstaged: false,
      untracked: false,
    };
  }
  public async fetch(_root: string, remote: string): Promise<void> {
    this.trace.push(`git:fetch:${remote}`);
  }
  public async advertisedHead(): Promise<{
    readonly branch: string;
    readonly sha: string;
  }> {
    this.trace.push("git:advertised-head");
    return { branch: "main", sha: this.advertised };
  }
  public async trackingSha(): Promise<string | null> {
    this.trace.push("git:tracking-sha");
    return this.tracking;
  }
  public async localHeadSha(worktreePath: string): Promise<string | null> {
    this.trace.push(`git:local-head:${worktreePath}`);
    return sha;
  }
  public async remoteBranchSha(
    _root: string,
    remote: string,
    branch: string,
  ): Promise<string | null> {
    this.trace.push(`git:remote-head:${remote}:${branch}`);
    if (this.remoteFailure !== null) throw this.remoteFailure;
    return this.remote;
  }
  public async createBranch(
    _root: string,
    branch: string,
    startSha: string,
  ): Promise<void> {
    this.trace.push(`git:create-branch:${branch}:${startSha}`);
  }
  public async addWorktree(
    _root: string,
    worktree: string,
    branch: string,
  ): Promise<void> {
    this.trace.push(`git:add-worktree:${worktree}:${branch}`);
    this.registeredWorktrees.set(worktree, branch);
    this.worktreePath = worktree;
    this.files.values.set(worktree, "directory");
  }
  public async removeWorktree(_root: string, worktree: string): Promise<void> {
    this.registered = false;
    this.registeredWorktrees.delete(worktree);
    this.files.values.delete(worktree);
    this.trace.push(`git:remove-worktree:${worktree}`);
  }
}

class RecordingGitHub implements GitHubPort {
  public readonly trace: string[];
  public issue: IssueFacts | null;
  public constructor(trace: string[], issue: IssueFacts | null) {
    this.trace = trace;
    this.issue = issue;
  }
  public async loadIssue(
    repository: string,
    issueNumber: number,
  ): Promise<IssueFacts | null> {
    this.trace.push(`github:issue:${repository}:${issueNumber}`);
    return this.issue === null ? null : { ...this.issue, number: issueNumber };
  }
  public async loadPullRequest(_repository: string, pullRequestNumber: number) {
    this.trace.push(`github:pr:${pullRequestNumber}`);
    return {
      number: pullRequestNumber,
      state: "OPEN" as const,
      baseBranch: "main",
      headBranch: "feat/3-phase-1-run-one-issue",
      headSha: sha,
      closesIssues: [3],
      complete: true,
    };
  }
  public async findOpenPullRequest(repository: string, headBranch: string) {
    this.trace.push(`github:pr-by-head:${repository}:${headBranch}`);
    return this.loadPullRequest(repository, 13);
  }
  public async loadMergedPullRequest(
    _repository: string,
    pullRequestNumber: number,
  ) {
    return {
      number: pullRequestNumber,
      state: "OPEN" as const,
      mergedAt: null,
      sourceBranch: "feat/3-phase-1-run-one-issue",
      sourceHeadSha: sha,
      mergeCommitSha: null,
      closesIssues: [3],
      complete: true,
    };
  }
}

class RecordingTmux implements TmuxPort {
  public readonly trace: string[];
  public observedOverride: TmuxTargetV2 | null | undefined;
  public created: TmuxTargetV2 | null = null;
  public createFailure: TmuxIdentityOutputError | null = null;
  public observeFailure: TmuxIdentityOutputError | null = null;
  public constructor(trace: string[]) {
    this.trace = trace;
  }
  public async selectTarget(input: {
    readonly repository: import("./domain").RepositoryIdentity;
  }) {
    return {
      ...deriveStandaloneTmuxTarget(input.repository),
      socketIdentity: { device: "1", inode: "1" },
      sessionId: "$1",
    };
  }
  public async createIssueWindow(input: {
    readonly target: import("./tmux-target").TmuxSessionTargetV1;
    readonly windowName: string;
    readonly cwd: string;
    readonly executable: string;
    readonly args: readonly string[];
  }): Promise<TmuxTargetV2> {
    this.trace.push(
      `tmux:create:${input.target.sessionName}:${input.windowName}:${input.cwd}:${input.executable} ${input.args.join(" ")}`,
    );
    if (this.createFailure !== null) throw this.createFailure;
    this.created = {
      schemaVersion: 2,
      selectionMode: input.target.selectionMode,
      socketPath: input.target.socketPath,
      socketIdentity: input.target.socketIdentity ?? {
        device: "1",
        inode: "1",
      },
      sessionId: input.target.sessionId ?? "$1",
      sessionName: input.target.sessionName,
      windowName: input.windowName,
      windowId: "@" + input.windowName,
      paneId: "%" + input.windowName,
      cwd: input.cwd,
    };
    return this.created;
  }
  public async observeIssueWindowName(): Promise<boolean> {
    return false;
  }
  public async observe(target: TmuxTargetV2): Promise<TmuxTargetV2 | null> {
    this.trace.push(`tmux:observe:${target.paneId}`);
    if (this.observeFailure !== null) throw this.observeFailure;
    const observed =
      this.observedOverride === undefined ? target : this.observedOverride;
    return observed === null
      ? null
      : { state: "live" as const, target: observed };
  }
  public async panePid(target: TmuxIdentity): Promise<number> {
    return 297 + Number(target.windowName);
  }
  public async setRemainOnExit(): Promise<void> {
    this.trace.push("tmux:remain");
  }
  public async capturePane() {
    return { content: "pane output", truncated: false };
  }
  public async restartWorker(): Promise<void> {
    this.trace.push("tmux:restart");
  }
  public async removeWindow(): Promise<void> {
    this.trace.push("tmux:remove");
  }
  public async attach(target: TmuxIdentity): Promise<void> {
    this.trace.push(
      `tmux:attach:${target.sessionName}:${target.windowName}:${target.paneId}`,
    );
  }
}

class RecordingProcess implements ProcessPort {
  public readonly trace: string[];
  public exitCode = 0;
  public launches = 0;
  public launchGate: ((launchNumber: number) => Promise<void>) | null = null;
  public readonly launchInputs: Array<{
    readonly executable: "copilot";
    readonly args: readonly string[];
    readonly cwd: string;
    readonly environment: Readonly<Record<string, string>>;
  }> = [];
  public waitStarted: Promise<void> = Promise.resolve();
  private markWaitStarted: (() => void) | null = null;
  private waitGate: Promise<void> | null = null;
  private releaseWait: (() => void) | null = null;
  private readonly observedProcesses = new Map<number, ProcessIdentityV1>();
  private readonly observedWorkers = new Map<number, ProcessIdentityV1>();
  public constructor(trace: string[]) {
    this.trace = trace;
  }
  public holdWait(): (exitCode?: number) => void {
    this.waitStarted = new Promise((resolve) => {
      this.markWaitStarted = resolve;
    });
    this.waitGate = new Promise((resolve) => {
      this.releaseWait = resolve;
    });
    return (exitCode = this.exitCode) => {
      this.exitCode = exitCode;
      this.releaseWait?.();
    };
  }
  public async spawnCopilot(input: {
    readonly executable: "copilot";
    readonly args: readonly string[];
    readonly cwd: string;
    readonly environment: Readonly<Record<string, string>>;
    readonly pane: TmuxIdentity;
    readonly panePid: number;
    readonly launchedAt: string;
  }) {
    this.launches += 1;
    const launchNumber = this.launches;
    this.launchInputs.push({
      executable: input.executable,
      args: input.args,
      cwd: input.cwd,
      environment: input.environment,
    });
    this.trace.push(
      "process:" +
        input.executable +
        ":" +
        input.args.join(" ") +
        ":" +
        input.cwd +
        ":" +
        input.environment.OTEL_RESOURCE_ATTRIBUTES,
    );
    if (this.launchGate !== null) await this.launchGate(launchNumber);
    const pid = 400 + launchNumber;
    const identity: ProcessIdentityV1 = {
      schemaVersion: 1,
      pid,
      processGroupId: pid,
      startToken: "copilot-" + launchNumber,
      executable: "copilot",
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
    this.observedProcesses.set(pid, identity);
    return {
      identity,
      wait: async () => {
        this.markWaitStarted?.();
        if (this.waitGate !== null) await this.waitGate;
        this.observedProcesses.delete(pid);
        return { exitCode: this.exitCode };
      },
    };
  }
  public async identify(
    pid: number,
    paneLineage: ProcessIdentityV1["paneLineage"],
    launchedAt: string,
  ) {
    const issueNumber = Number(paneLineage.paneId.replace("%", ""));
    const identity: ProcessIdentityV1 = {
      schemaVersion: 1,
      pid,
      processGroupId: pid,
      startToken: "worker-" + issueNumber,
      executable: "/usr/bin/soft-factory",
      args: ["internal", "run-agent", "--issue", String(issueNumber)],
      cwd: paneLineage.sessionName,
      launchedAt,
      paneLineage,
    };
    this.observedWorkers.set(pid, identity);
    return identity;
  }
  public async observe(identity: ProcessIdentityV1) {
    return (
      this.observedProcesses.get(identity.pid) ??
      this.observedWorkers.get(identity.pid) ??
      null
    );
  }
  public async findLaunchCandidates() {
    return [...this.observedProcesses.values()];
  }
  public completeWorkers(): void {
    this.observedWorkers.clear();
  }
  public async signalGroup(identity: ProcessIdentityV1): Promise<void> {
    this.trace.push("process:signal");
    this.observedProcesses.delete(identity.pid);
  }
  public async waitForExit(identity: ProcessIdentityV1): Promise<boolean> {
    this.observedProcesses.delete(identity.pid);
    return true;
  }
}
function validIssue(overrides: Partial<IssueFacts> = {}): IssueFacts {
  return {
    number: 3,
    title: "Phase 1 run one issue",
    body: validBody,
    state: "OPEN",
    labels: ["feature"],
    openBlockers: [],
    openPullRequests: [],
    complete: true,
    ...overrides,
  };
}

function fixture(
  issue: IssueFacts | null = validIssue(),
  repository?: string,
): {
  readonly ports: RunnerPorts;
  readonly trace: string[];
  readonly files: MemoryFiles;
  readonly git: RecordingGit;
  readonly github: RecordingGitHub;
  readonly tmux: RecordingTmux;
  readonly processes: RecordingProcess;
} {
  const trace: string[] = [];
  const files = new MemoryFiles(trace);
  const git = new RecordingGit(trace, files, repository);
  const github = new RecordingGitHub(trace, issue);
  const tmux = new RecordingTmux(trace);
  const processes = new RecordingProcess(trace);
  let tick = 0;
  let id = 0;
  const ports: RunnerPorts = {
    files,
    git,
    github,
    tmux,
    processes,
    clock: {
      now: () =>
        new Date(
          Date.parse("2026-08-11T07:00:00.000Z") + tick++ * 1000,
        ).toISOString(),
    },
    ids: { nextOwnerId: () => `owner-${++id}`, nextRunId: () => `run-${++id}` },
  };
  files.values.set(
    "/tmp/soft-factory-fixture/justfile",
    "verify-focused:\n\ttrue\nverify:\n\ttrue\nrelease_check:\n\ttrue\n",
  );
  files.values.set(
    "/tmp/soft-factory-fixture/.trees/3/.soft-factory/agent-result.json",
    JSON.stringify({
      schemaVersion: 1,
      issueNumber: 3,
      outcome: "succeeded",
      branch: "feat/3-phase-1-run-one-issue",
      headSha: sha,
      prNumber: 13,
      acceptanceCriteria: Array.from({ length: 10 }, (_, index) => ({
        id: `AC-${index + 1}`,
        status: "verified",
        evidence: [`fixture:AC-${index + 1}`],
      })),
      validations: [
        { command: "just verify-focused", status: "passed" },
        { command: "just verify", status: "passed" },
      ],
      requiredFinalValidation: {
        command: "just verify",
        status: "passed",
        evidence: ["fixture:just-verify"],
      },
      completedAt: "2026-08-11T07:01:00.000Z",
    }),
  );
  return { ports, trace, files, git, github, tmux, processes };
}

function readSnapshot(files: MemoryFiles): Readonly<Record<string, unknown>> {
  const text = files.values.get(
    "/tmp/soft-factory-fixture/.soft-factory/runs/3.json",
  );
  if (text === undefined) throw new Error("fixture snapshot missing");
  const value: unknown = JSON.parse(text);
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw new Error("fixture snapshot malformed");
  return value;
}

const creationDiagnostic: TmuxIdentityDiagnosticV1 = {
  schemaVersion: 1,
  phase: "create",
  exitCode: 0,
  stdoutByteCount: 0,
  stderrByteCount: 0,
  recordCount: 0,
  recordsTruncated: false,
  records: [],
  signature: [],
  signatureTruncated: false,
};

describe("Issue 29 initial creation failure retention", () => {
  it("keeps initial starting_tmux lock and lease retryable after malformed identity output", async () => {
    const f = fixture();
    f.tmux.createFailure = new TmuxIdentityOutputError(
      "TMUX_IDENTITY_MALFORMED",
      "tmux returned malformed or ambiguous create identity evidence.",
      creationDiagnostic,
    );
    await expect(
      new IssueRunService(f.ports).run(3, "/tmp/fixture-start"),
    ).rejects.toMatchObject({ code: "TMUX_IDENTITY_MALFORMED" });
    expect(readSnapshot(f.files)).toMatchObject({
      schemaVersion: 6,
      state: "starting_tmux",
      tmux: null,
      admission: { slot: 1, issueNumber: 3 },
      error: { code: "TMUX_IDENTITY_MALFORMED" },
      tmuxIdentityDiagnostic: creationDiagnostic,
    });
    expect(
      [...f.files.values.keys()].some((entry) =>
        entry.endsWith("/locks/3.lock"),
      ),
    ).toBe(true);
    expect(
      [...f.files.values.keys()].some((entry) =>
        entry.endsWith("/concurrency/slots/1.lock"),
      ),
    ).toBe(true);
    expect(f.processes.launches).toBe(0);
  });
});

describe("deterministic issue-to-RPIV fixture", () => {
  it("proves issue to exact fetched branch, worktree, tmux, Copilot, status, and attach", async () => {
    const f = fixture();
    const run = await runCli(
      ["run", "--issue", "3", "--json"],
      "/tmp/fixture-start",
      f.ports,
    );
    expect(run.exitCode).toBe(0);
    expect(JSON.parse(run.stdout)).toMatchObject({
      state: "running_rpiv",
      resources: { tmux: "recorded", worktree: "recorded" },
    });
    expect(run.stdout).not.toContain("/usr/bin/soft-factory");
    expect(run.stdout).not.toContain("%3");
    const worker = await runCli(
      ["internal", "run-agent", "--issue", "3"],
      "/tmp/soft-factory-fixture/.trees/3",
      f.ports,
    );
    expect(worker).toEqual({
      exitCode: 0,
      stdout: `RPIV worker 3 exited: completed.
`,
      stderr: "",
    });
    const status = await runCli(
      ["status", "3", "--json"],
      "/tmp/fixture-start",
      f.ports,
    );
    expect(JSON.parse(status.stdout)).toMatchObject({
      state: "completed",
      tmux: "live",
    });
    expect(status.stdout).not.toContain("%3");
    const attached = await runCli(
      ["attach", "3"],
      "/tmp/fixture-start",
      f.ports,
    );
    expect(attached.stdout).toBe(
      "Attached to the exact owned live tmux target.\n",
    );

    const snapshot = readSnapshot(f.files);
    expect(snapshot.fetchedBaseProof).toMatchObject({
      remote: "origin",
      defaultBranch: "main",
      advertisedHeadSha: sha,
      trackingRefSha: sha,
      matches: true,
    });
    expect(snapshot.state).toBe("completed");
    expect(snapshot.finalization).toMatchObject({
      reconciliation: { passed: true, decisionCode: "COMPLETION_PROVED" },
    });
    expect(f.trace).toContain(
      `git:create-branch:feat/3-phase-1-run-one-issue:${sha}`,
    );
    expect(f.trace).toContain(
      "tmux:create:sf-jsburckhardt-soft-factor-6ddfad3aac2a:3:/tmp/soft-factory-fixture/.trees/3:soft-factory internal run-agent --issue 3",
    );
    expect(
      f.trace.some(
        (entry) =>
          entry.startsWith(
            "process:copilot:--yolo --name issue-3 --agent rpiv --prompt Deliver issue #3",
          ) &&
          entry.endsWith(
            ":/tmp/soft-factory-fixture/.trees/3:project.name=jsburckhardt-soft-factory-runner,issue.id=issue-3",
          ),
      ),
    ).toBe(true);
    expect(
      f.trace.some((entry) =>
        entry.includes("/workspaces/soft-factory-runner/.trees/3"),
      ),
    ).toBe(false);

    const fetchIndex = f.trace.indexOf("git:fetch:origin");
    const proofWriteIndex = f.trace.findIndex(
      (entry, index) =>
        index > fetchIndex && entry.startsWith("snapshot:write:"),
    );
    const branchIndex = f.trace.findIndex((entry) =>
      entry.startsWith("git:create-branch:"),
    );
    expect(fetchIndex).toBeLessThan(proofWriteIndex);
    expect(proofWriteIndex).toBeLessThan(branchIndex);
    expect(
      f.trace.filter(
        (entry) =>
          entry.startsWith("lock:create:") &&
          entry.includes("/.soft-factory/locks/"),
      ).length,
    ).toBe(1);
    expect(
      f.trace.filter(
        (entry) =>
          entry.startsWith("lock:create:") &&
          entry.includes("/concurrency/slots/1.lock"),
      ).length,
    ).toBe(1);
    expect(
      f.trace.filter((entry) => entry.startsWith("git:create-branch:")).length,
    ).toBe(1);
    expect(
      f.trace.filter((entry) => entry.startsWith("git:add-worktree:")).length,
    ).toBe(1);
    expect(
      f.trace.filter((entry) => entry.startsWith("tmux:create:")).length,
    ).toBe(1);
    expect(
      f.trace.filter((entry) => entry.startsWith("process:copilot:")).length,
    ).toBe(1);
    expect(
      f.trace.filter((entry) => entry.startsWith("git:remote-head:")).length,
    ).toBe(3);
    expect(
      f.trace.findIndex((entry) => entry.startsWith("process:copilot:")),
    ).toBeLessThan(
      f.trace.findIndex((entry) => entry.startsWith("git:remote-head:")),
    );
  });

  it("applies exact names and telemetry for every repository and issue launch", async () => {
    const f = fixture(
      validIssue({ number: 7, title: "Other" }),
      "Owner/Repo.Name",
    );
    await new IssueRunService(f.ports).run(7, "/tmp/start");
    await new IssueRunService(f.ports).runWorker(7, "/tmp/start");
    expect(
      f.trace.find((entry) => entry.startsWith("process:copilot:")),
    ).toContain("--name issue-7");
    expect(
      f.trace.find((entry) => entry.startsWith("process:copilot:")),
    ).toContain("project.name=owner-repo-name,issue.id=issue-7");
  });

  it("classifies nonzero Copilot exit as failed", async () => {
    const f = fixture();
    f.processes.exitCode = 9;
    await new IssueRunService(f.ports).run(3, "/tmp/start");
    const snapshot = await new IssueRunService(f.ports).runWorker(
      3,
      "/tmp/start",
    );
    expect(snapshot).toMatchObject({
      state: "failed",
      copilot: { exitCode: 9 },
      error: { code: "EXTERNAL_COMMAND_FAILED" },
    });
  });

  it.each([
    ["absent mapping", null],
    ["empty mapping", "copilot:\n  environment:\n"],
  ])("V-3 preserves baseline launch for %s", async (_name, configuration) => {
    const f = fixture();
    if (configuration !== null)
      f.files.values.set(
        "/tmp/soft-factory-fixture/.soft-factory/config.yml",
        configuration,
      );
    await new IssueRunService(f.ports).run(3, "/tmp/start");
    await new IssueRunService(f.ports).runWorker(3, "/tmp/start");
    expect(f.processes.launchInputs[0]).toMatchObject({
      executable: "copilot",
      args: [
        "--yolo",
        "--name",
        "issue-3",
        "--agent",
        "rpiv",
        "--prompt",
        expect.stringContaining("Deliver issue #3"),
      ],
      environment: {
        OTEL_RESOURCE_ATTRIBUTES:
          "project.name=jsburckhardt-soft-factory-runner,issue.id=issue-3",
      },
    });
    expect(Object.keys(f.processes.launchInputs[0].environment)).toEqual([
      "OTEL_RESOURCE_ATTRIBUTES",
    ]);
  });

  it("V-3 passes configured names with the unchanged Copilot command", async () => {
    const f = fixture();
    f.files.values.set(
      "/tmp/soft-factory-fixture/.soft-factory/config.yml",
      "copilot:\n" +
        "  environment:\n" +
        '    COPILOT_OTEL_ENABLED: "enabled"\n' +
        '    COPILOT_OTEL_EXPORTER_TYPE: "otlp"\n' +
        '    OTEL_EXPORTER_OTLP_ENDPOINT: "https://example.invalid"\n' +
        '    OTEL_SERVICE_NAME: "runner-test"\n' +
        '    OTEL_RESOURCE_ATTRIBUTES: "configured-collision"\n' +
        '    OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT: "disabled"\n' +
        '    OPTIONAL_EMPTY: ""\n',
    );
    await new IssueRunService(f.ports).run(3, "/tmp/start");
    await new IssueRunService(f.ports).runWorker(3, "/tmp/start");

    expect(f.processes.launchInputs).toHaveLength(1);
    const launch = f.processes.launchInputs[0];
    expect(launch.executable).toBe("copilot");
    expect(launch.args).toEqual([
      "--yolo",
      "--name",
      "issue-3",
      "--agent",
      "rpiv",
      "--prompt",
      expect.stringContaining("Deliver issue #3"),
    ]);
    expect(Object.keys(launch.environment).sort()).toEqual([
      "COPILOT_OTEL_ENABLED",
      "COPILOT_OTEL_EXPORTER_TYPE",
      "OPTIONAL_EMPTY",
      "OTEL_EXPORTER_OTLP_ENDPOINT",
      "OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT",
      "OTEL_RESOURCE_ATTRIBUTES",
      "OTEL_SERVICE_NAME",
    ]);
    expect(launch.environment.OPTIONAL_EMPTY).toBe("");
    expect(launch.environment.OTEL_RESOURCE_ATTRIBUTES).toBe(
      "project.name=jsburckhardt-soft-factory-runner,issue.id=issue-3",
    );
    expect(Object.isFrozen(launch.environment)).toBe(true);
  });

  it("V-4 applies inherited, configured, and Runner-owned precedence literally", () => {
    const literal =
      "$UNCHANGED $(not-run) \x60still-not-run\x60; spaces & quotes";
    const explicit = Object.freeze({
      PATH: literal,
      CUSTOM_LITERAL: literal,
      OTEL_RESOURCE_ATTRIBUTES: "project.name=owner-repo,issue.id=issue-3",
    });
    const child = copilotChildEnvironment(explicit, {
      PATH: "inherited-path",
      GH_TOKEN: "inherited-token",
      OTEL_RESOURCE_ATTRIBUTES: "inherited-attributes",
      UNRELATED_AMBIENT: "not-allowed",
    });
    expect(child.PATH).toBe(literal);
    expect(child.CUSTOM_LITERAL).toBe(literal);
    expect(child.OTEL_RESOURCE_ATTRIBUTES).toBe(
      "project.name=owner-repo,issue.id=issue-3",
    );
    expect(child.GH_TOKEN).toBe("inherited-token");
    expect(child.UNRELATED_AMBIENT).toBeUndefined();
    expect(Object.isFrozen(child)).toBe(true);
  });

  it("V-5 keeps configured variables Copilot-only and out of persistence", async () => {
    const f = fixture();
    const variableName = "COPILOT_ONLY_TEST_NAME";
    const privateValue = "fixture-private-copilot-only-value";
    const configurationPath =
      "/tmp/soft-factory-fixture/.soft-factory/config.yml";
    f.files.values.set(
      configurationPath,
      "copilot:\n  environment:\n    " +
        variableName +
        ': "' +
        privateValue +
        '"\n',
    );
    const ambientBefore = process.env[variableName];
    await new IssueRunService(f.ports).run(3, "/tmp/start");
    await new IssueRunService(f.ports).runWorker(3, "/tmp/start");

    expect(f.processes.launchInputs[0].environment[variableName]).toBe(
      privateValue,
    );
    expect(process.env[variableName]).toBe(ambientBefore);
    const nonCopilotTrace = f.trace.filter(
      (entry) => !entry.startsWith("process:copilot:"),
    );
    expect(nonCopilotTrace.join("\n")).not.toContain(variableName);
    expect(nonCopilotTrace.join("\n")).not.toContain(privateValue);
    const durable = [...f.files.values.entries()]
      .filter(([filePath]) => filePath !== configurationPath)
      .map(([, content]) => content)
      .join("\n");
    expect(durable).not.toContain(variableName);
    expect(durable).not.toContain(privateValue);
  });

  it("V-6 rejects an invalid launch then reads corrected configuration fresh", async () => {
    const f = fixture();
    const service = new IssueRunService(f.ports);
    const configurationPath =
      "/tmp/soft-factory-fixture/.soft-factory/config.yml";
    const rejectedValue = "fixture-private-rejected-value";
    const correctedValue = "fixture-private-corrected-value";
    await service.run(3, "/tmp/start");
    f.files.values.set(
      configurationPath,
      'copilot:\n  environment:\n    CORRECTION_NAME: "' +
        rejectedValue +
        '"\n    CORRECTION_NAME: "duplicate"\n',
    );

    let rejection: RunnerError | null = null;
    try {
      await service.runWorker(3, "/tmp/start");
    } catch (cause: unknown) {
      if (!(cause instanceof RunnerError)) throw cause;
      rejection = cause;
    }
    expect(rejection).not.toBeNull();
    expect(rejection?.code).toBe("CONFIG_INVALID");
    expect(f.processes.launches).toBe(0);
    const rejectedSnapshot = readSnapshot(f.files);
    expect(rejectedSnapshot.launchIntent).toBeNull();
    expect(rejectedSnapshot.copilot).toBeNull();
    expect(renderError(rejection as RunnerError, false)).not.toContain(
      rejectedValue,
    );
    expect(renderError(rejection as RunnerError, true)).not.toContain(
      rejectedValue,
    );

    f.files.values.set(
      configurationPath,
      'copilot:\n  environment:\n    CORRECTION_NAME: "' +
        correctedValue +
        '"\n',
    );
    await service.runWorker(3, "/tmp/start");
    expect(f.processes.launches).toBe(1);
    expect(f.processes.launchInputs[0].environment.CORRECTION_NAME).toBe(
      correctedValue,
    );
    const retained = [...f.files.values.entries()]
      .filter(([filePath]) => filePath !== configurationPath)
      .map(([, content]) => content)
      .join("\n");
    expect(retained).not.toContain(rejectedValue);
    expect(retained).not.toContain(correctedValue);
  });

  it("V-7 isolates two barrier-controlled distinct-issue launch snapshots", async () => {
    const f = fixture();
    const service = new IssueRunService(f.ports);
    const configurationPath =
      "/tmp/soft-factory-fixture/.soft-factory/config.yml";
    const variableName = "CONCURRENT_PRIVATE_NAME";
    const firstValue = "fixture-private-concurrent-a";
    const secondValue = "fixture-private-concurrent-b";
    const config = (value: string) =>
      "execution:\n  max_concurrent_runs: 2\ncopilot:\n  environment:\n    " +
      variableName +
      ': "' +
      value +
      '"\n';

    f.files.values.set(configurationPath, config(firstValue));
    await service.run(3, "/tmp/start");
    await service.run(4, "/tmp/start");

    let releaseLaunches: (() => void) | null = null;
    const held = new Promise<void>((resolve) => {
      releaseLaunches = resolve;
    });
    const arrivalResolvers: Array<() => void> = [];
    const arrivals = [
      new Promise<void>((resolve) => arrivalResolvers.push(resolve)),
      new Promise<void>((resolve) => arrivalResolvers.push(resolve)),
    ];
    f.processes.launchGate = async (launchNumber) => {
      arrivalResolvers[launchNumber - 1]();
      await held;
    };

    const firstWorker = service.runWorker(3, "/tmp/start");
    await arrivals[0];
    f.files.values.set(configurationPath, config(secondValue));
    const secondWorker = service.runWorker(4, "/tmp/start");
    await arrivals[1];
    releaseLaunches?.();
    await Promise.all([firstWorker, secondWorker]);

    expect(f.processes.launchInputs).toHaveLength(2);
    const firstEnvironment = f.processes.launchInputs[0].environment;
    const secondEnvironment = f.processes.launchInputs[1].environment;
    expect(firstEnvironment[variableName]).toBe(firstValue);
    expect(firstEnvironment[variableName]).not.toBe(secondValue);
    expect(secondEnvironment[variableName]).toBe(secondValue);
    expect(secondEnvironment[variableName]).not.toBe(firstValue);
    expect(firstEnvironment.OTEL_RESOURCE_ATTRIBUTES).toBe(
      "project.name=jsburckhardt-soft-factory-runner,issue.id=issue-3",
    );
    expect(secondEnvironment.OTEL_RESOURCE_ATTRIBUTES).toBe(
      "project.name=jsburckhardt-soft-factory-runner,issue.id=issue-4",
    );
    expect(Object.isFrozen(firstEnvironment)).toBe(true);
    expect(Object.isFrozen(secondEnvironment)).toBe(true);

    f.files.values.set(configurationPath, config("later-source-change"));
    expect(firstEnvironment[variableName]).toBe(firstValue);
    expect(secondEnvironment[variableName]).toBe(secondValue);
    const retained = [...f.files.values.entries()]
      .filter(([filePath]) => filePath !== configurationPath)
      .map(([, content]) => content)
      .join("\n");
    expect(retained).not.toContain(variableName);
    expect(retained).not.toContain(firstValue);
    expect(retained).not.toContain(secondValue);
  });

  it("V-8 scans the complete named scenario ledger and Runner artifacts", async () => {
    const f = fixture();
    const configurationPath =
      "/tmp/soft-factory-fixture/.soft-factory/config.yml";
    const successfulValue = "fixture-private-scan-success";
    const rejectedValue = "fixture-private-scan-rejected";
    f.files.values.set(
      configurationPath,
      'copilot:\n  environment:\n    SCAN_PRIVATE_NAME: "' +
        successfulValue +
        '"\n',
    );
    const run = await runCli(
      ["run", "--issue", "3", "--json"],
      "/tmp/start",
      f.ports,
    );
    const worker = await runCli(
      ["internal", "run-agent", "--issue", "3"],
      "/tmp/start",
      f.ports,
    );
    const status = await runCli(
      ["status", "3", "--json"],
      "/tmp/start",
      f.ports,
    );
    expect(f.processes.launchInputs[0].environment.SCAN_PRIVATE_NAME).toBe(
      successfulValue,
    );

    let rejectedError: RunnerError | null = null;
    try {
      parseConfiguration(
        'copilot:\n  environment:\n    SCAN_PRIVATE_NAME: "' +
          rejectedValue +
          '"\n    SCAN_PRIVATE_NAME: "duplicate"\n',
      );
    } catch (cause: unknown) {
      if (!(cause instanceof RunnerError)) throw cause;
      rejectedError = cause;
    }
    expect(rejectedError).not.toBeNull();

    const scenarioNames = [
      "absent mapping",
      "empty mapping",
      "valid strings",
      "explicit empty string",
      "inherited-configured collision",
      "Runner-owned collision",
      "duplicate name",
      "invalid name",
      "non-string scalar",
      "nested value",
      "alias",
      "anchor",
      "merge key",
      "unsupported key",
      "malformed syntax",
      "literal metacharacters",
      "configuration correction",
      "two distinct concurrent issues",
    ];
    const ledger = scenarioNames.map((scenario) => ({
      scenario,
      variableName: "redacted-name-only",
      result: "passed",
    }));
    expect(ledger).toHaveLength(18);

    const categories: Readonly<Record<string, readonly string[]>> = {
      humanOutput: [
        worker.stdout,
        renderError(rejectedError as RunnerError, false),
      ],
      jsonOutput: [
        run.stdout,
        status.stdout,
        renderError(rejectedError as RunnerError, true),
      ],
      errors: [
        (rejectedError as RunnerError).message,
        (rejectedError as RunnerError).remediation,
        JSON.stringify((rejectedError as RunnerError).details),
      ],
      snapshots: [...f.files.values.entries()]
        .filter(([filePath]) => filePath.includes("/.soft-factory/runs/"))
        .map(([, content]) => content),
      events: [...f.files.values.entries()]
        .filter(([filePath]) => filePath.includes("/.soft-factory/events/"))
        .map(([, content]) => content),
      retainedAttemptLogs: [...f.files.values.entries()]
        .filter(([filePath]) => filePath.includes("/.soft-factory/logs/"))
        .map(([, content]) => content),
      scenarioLedger: [JSON.stringify(ledger)],
    };
    for (const surfaces of Object.values(categories))
      for (const surface of surfaces)
        for (const sentinel of [successfulValue, rejectedValue])
          expect(surface).not.toContain(sentinel);
  });
});

describe("Issue 19 corrected helper integration", () => {
  it.each([
    ["default validation", null],
    [
      "configured validation",
      "rpiv:\n  final_validation: just release_check\n",
    ],
  ])(
    "AC-3 rejects missing root justfile before ownership for %s",
    async (_name, configuration) => {
      const f = fixture();
      const root = "/tmp/soft-factory-fixture";
      f.files.values.delete(root + "/justfile");
      if (configuration !== null)
        f.files.values.set(root + "/.soft-factory/config.yml", configuration);
      const before = new Map(f.files.values);

      await expect(
        new IssueRunService(f.ports).run(3, "/tmp/start"),
      ).rejects.toMatchObject({ code: "CONFIG_INVALID" });

      expect(f.files.values).toEqual(before);
      expect(
        [...f.files.values.keys()].filter((entry) =>
          /\.soft-factory\/(?:locks|runs|events|concurrency)\//.test(entry),
        ),
      ).toEqual([]);
      expect(
        f.trace.some((entry) =>
          /^(?:lock:create|event:append|snapshot:write|git:fetch|git:create-|tmux:create|process:)/.test(
            entry,
          ),
        ),
      ).toBe(false);
    },
  );

  it.each([
    [
      "progressPath",
      "/tmp/forged-rpiv-status.json",
      [
        "internal",
        "publish-progress",
        "--issue",
        "3",
        "--phase",
        "research",
        "--status",
        "running",
      ],
    ],
    [
      "resultPath",
      "/tmp/forged-agent-result.json",
      ["internal", "validate-result", "--issue", "3"],
    ],
  ] as const)(
    "AC-11/AC-18 refuses a forged v4 %s before helper path use",
    async (field, forgedPath, args) => {
      const f = fixture();
      await new IssueRunService(f.ports).run(3, "/tmp/start");
      const snapshotPath =
        "/tmp/soft-factory-fixture/.soft-factory/runs/3.json";
      const persisted = JSON.parse(
        f.files.values.get(snapshotPath) as string,
      ) as {
        integrationLaunch: Record<string, unknown>;
      };
      persisted.integrationLaunch[field] = forgedPath;
      f.files.values.set(snapshotPath, JSON.stringify(persisted));
      const before = new Map(f.files.values);

      const outcome = await runCli(
        [...args],
        "/tmp/soft-factory-fixture/.trees/3",
        f.ports,
      );

      expect(outcome.exitCode).toBe(3);
      expect(outcome.stderr).toContain("STATE_INVALID");
      expect(f.files.values).toEqual(before);
      expect(f.files.values.has(forgedPath)).toBe(false);
    },
  );

  it("AC-8/AC-12/AC-17 keeps repeated terminal progress diagnostic after completed status and list", async () => {
    const f = fixture();
    const service = new IssueRunService(f.ports);
    await service.run(3, "/tmp/start");
    for (const [phase, status] of [
      ["research", "running"],
      ["plan", "running"],
      ["implement", "running"],
      ["verify", "running"],
      ["terminal", "succeeded"],
    ] as const)
      await service.publishRpivProgress(3, "/tmp/start", phase, status);
    await expect(service.runWorker(3, "/tmp/start")).resolves.toMatchObject({
      state: "completed",
      progress: { phase: "terminal", status: "succeeded" },
    });
    f.processes.completeWorkers();

    const statusJson = await runCli(
      ["status", "3", "--json"],
      "/tmp/start",
      f.ports,
    );
    const statusFacts = JSON.parse(statusJson.stdout);
    expect(statusFacts).toMatchObject({
      state: "completed",
      activity: "inactive",
      decisionCode: "MERGE_PENDING",
      safeActions: ["attach", "explicit_clean"],
      observations: {
        progress: { state: "mismatch", code: "PROGRESS_REPEATED" },
      },
    });

    const listJson = await runCli(["list", "--json"], "/tmp/start", f.ports);
    const listFacts = JSON.parse(listJson.stdout) as {
      facts: readonly Record<string, unknown>[];
    };
    expect(listFacts.facts).toContainEqual({
      issueNumber: 3,
      state: "completed",
      code: "MERGE_PENDING",
      rpivPhase: "terminal",
      progressClassification: "PROGRESS_REPEATED",
    });

    const statusHuman = await runCli(["status", "3"], "/tmp/start", f.ports);
    expect(statusHuman.stdout).toContain("Persisted state: completed");
    expect(statusHuman.stdout).toMatch(/progress=mismatch:PROGRESS_REPEATED/);
    const listHuman = await runCli(["list"], "/tmp/start", f.ports);
    expect(listHuman.stdout).toMatch(/state.*completed/);
    expect(listHuman.stdout).toMatch(/rpivPhase.*terminal/);
    expect(listHuman.stdout).toMatch(
      /progressClassification.*PROGRESS_REPEATED/,
    );
  });

  it("V-6/AC-8/AC-13 reports missing current progress as unknown after accepting plan", async () => {
    const f = fixture();
    const service = new IssueRunService(f.ports);
    await service.run(3, "/tmp/start");
    await service.publishRpivProgress(3, "/tmp/start", "research", "running");
    await service.publishRpivProgress(3, "/tmp/start", "plan", "running");
    const accepted = readSnapshot(f.files);
    expect(accepted.progress).toMatchObject({ phase: "plan", sequence: 2 });

    const progressPath =
      "/tmp/soft-factory-fixture/.trees/3/.soft-factory/rpiv-status.json";
    f.files.values.delete(progressPath);

    const statusJson = await runCli(
      ["status", "3", "--json"],
      "/tmp/start",
      f.ports,
    );
    const statusFacts = JSON.parse(statusJson.stdout);
    expect(statusFacts).toMatchObject({
      state: "running_rpiv",
      observations: {
        progress: { code: "PROGRESS_MISSING", state: "absent" },
      },
    });

    const listJson = await runCli(["list", "--json"], "/tmp/start", f.ports);
    const listFacts = JSON.parse(listJson.stdout) as {
      readonly facts: readonly {
        readonly issueNumber: number;
        readonly state: string;
        readonly rpivPhase: string;
        readonly progressClassification: string;
      }[];
    };
    expect(listFacts.facts).toContainEqual(
      expect.objectContaining({
        issueNumber: 3,
        state: "running_rpiv",
        rpivPhase: "unknown",
        progressClassification: "PROGRESS_MISSING",
      }),
    );

    const statusHuman = await runCli(["status", "3"], "/tmp/start", f.ports);
    expect(statusHuman.stdout).toContain("Persisted state: running_rpiv");
    expect(statusHuman.stdout).toMatch(/progress=absent:PROGRESS_MISSING/);
    const listHuman = await runCli(["list"], "/tmp/start", f.ports);
    expect(listHuman.stdout).toMatch(/rpivPhase.*unknown/);
    expect(listHuman.stdout).toMatch(
      /progressClassification.*PROGRESS_MISSING/,
    );
  });

  it("enforces forward progress, trusted PR binding, helper exits, and unchanged ownership", async () => {
    const f = fixture();
    await new IssueRunService(f.ports).run(3, "/tmp/start");
    const before = readSnapshot(f.files);
    const resultPath =
      "/tmp/soft-factory-fixture/.trees/3/.soft-factory/agent-result.json";
    const candidatePath =
      "/tmp/soft-factory-fixture/.trees/3/.soft-factory/agent-result.candidate.json";
    const candidate = f.files.values.get(resultPath) as string;
    f.files.values.delete(resultPath);
    f.files.values.set(candidatePath, candidate);

    expect(
      (
        await runCli(
          [
            "internal",
            "publish-progress",
            "--issue",
            "3",
            "--phase",
            "research",
            "--status",
            "running",
          ],
          "/tmp/soft-factory-fixture/.trees/3",
          f.ports,
        )
      ).exitCode,
    ).toBe(0);
    const repeated = await runCli(
      [
        "internal",
        "publish-progress",
        "--issue",
        "3",
        "--phase",
        "research",
        "--status",
        "running",
      ],
      "/tmp/soft-factory-fixture/.trees/3",
      f.ports,
    );
    expect(repeated.exitCode).toBe(3);
    expect(repeated.stderr).toContain("PROGRESS_REPEATED");

    const planCalls = await Promise.all([
      new IssueRunService(f.ports).publishRpivProgress(
        3,
        "/tmp/start",
        "plan",
        "running",
      ),
      new IssueRunService(f.ports)
        .publishRpivProgress(3, "/tmp/start", "plan", "running")
        .catch((cause: unknown) => cause),
    ]);
    expect(
      planCalls.filter((entry) => entry instanceof RunnerError),
    ).toHaveLength(1);
    await expect(
      new IssueRunService(f.ports).publishRpivProgress(
        3,
        "/tmp/start",
        "verify",
        "running",
      ),
    ).rejects.toMatchObject({ code: "PROGRESS_CONFLICT" });
    await new IssueRunService(f.ports).publishRpivProgress(
      3,
      "/tmp/start",
      "implement",
      "running",
    );
    await new IssueRunService(f.ports).publishRpivProgress(
      3,
      "/tmp/start",
      "verify",
      "running",
    );

    f.files.values.set(
      candidatePath,
      JSON.stringify({ ...JSON.parse(candidate), prNumber: 999 }),
    );
    const mismatch = await runCli(
      [
        "internal",
        "publish-result",
        "--issue",
        "3",
        "--candidate",
        ".soft-factory/agent-result.candidate.json",
      ],
      "/tmp/soft-factory-fixture/.trees/3",
      f.ports,
    );
    expect(mismatch.exitCode).toBe(3);
    expect(mismatch.stderr).toContain("RESULT_IDENTITY_MISMATCH");
    expect(f.files.values.has(resultPath)).toBe(false);

    f.files.values.set(candidatePath, candidate);
    expect(
      (
        await runCli(
          [
            "internal",
            "publish-result",
            "--issue",
            "3",
            "--candidate",
            ".soft-factory/agent-result.candidate.json",
          ],
          "/tmp/soft-factory-fixture/.trees/3",
          f.ports,
        )
      ).exitCode,
    ).toBe(0);
    expect(
      (
        await runCli(
          ["internal", "validate-result", "--issue", "3"],
          "/tmp/soft-factory-fixture/.trees/3",
          f.ports,
        )
      ).exitCode,
    ).toBe(0);
    await new IssueRunService(f.ports).publishRpivProgress(
      3,
      "/tmp/start",
      "terminal",
      "succeeded",
    );
    await expect(
      new IssueRunService(f.ports).publishRpivProgress(
        3,
        "/tmp/start",
        "terminal",
        "failed",
      ),
    ).rejects.toMatchObject({ code: "PROGRESS_LATE" });
    expect(JSON.parse(f.files.values.get(resultPath) as string)).toEqual(
      JSON.parse(candidate),
    );
    const after = readSnapshot(f.files);
    for (const key of [
      "runId",
      "ownerId",
      "repository",
      "issueNumber",
      "state",
      "branch",
      "worktreePath",
      "tmux",
      "admission",
    ])
      expect(after[key]).toEqual(before[key]);
  });

  it("publishes failed terminal progress and preserves ownership on injected helper write failures", async () => {
    const failed = fixture();
    await new IssueRunService(failed.ports).run(3, "/tmp/start");
    const ownership = readSnapshot(failed.files);
    await new IssueRunService(failed.ports).publishRpivProgress(
      3,
      "/tmp/start",
      "research",
      "running",
    );
    await expect(
      new IssueRunService(failed.ports).publishRpivProgress(
        3,
        "/tmp/start",
        "terminal",
        "failed",
      ),
    ).resolves.toMatchObject({ phase: "terminal", status: "failed" });
    await expect(
      new IssueRunService(failed.ports).publishRpivProgress(
        3,
        "/tmp/start",
        "terminal",
        "failed",
      ),
    ).rejects.toMatchObject({ code: "PROGRESS_REPEATED" });
    const terminalSnapshot = readSnapshot(failed.files);
    expect(terminalSnapshot.state).toBe(ownership.state);
    expect(terminalSnapshot.ownerId).toBe(ownership.ownerId);

    const progressFault = fixture();
    await new IssueRunService(progressFault.ports).run(3, "/tmp/start");
    const beforeProgressFault = readSnapshot(progressFault.files);
    progressFault.files.failAtomicWrite = true;
    const progressFailure = await runCli(
      [
        "internal",
        "publish-progress",
        "--issue",
        "3",
        "--phase",
        "research",
        "--status",
        "running",
      ],
      "/tmp/start",
      progressFault.ports,
    );
    expect(progressFailure.exitCode).toBe(3);
    expect(readSnapshot(progressFault.files)).toEqual(beforeProgressFault);
    expect(
      [...progressFault.files.values.keys()].some((entry) =>
        entry.endsWith("rpiv-status.json.lock"),
      ),
    ).toBe(false);

    const resultFault = fixture();
    await new IssueRunService(resultFault.ports).run(3, "/tmp/start");
    const resultPath =
      "/tmp/soft-factory-fixture/.trees/3/.soft-factory/agent-result.json";
    const candidatePath =
      "/tmp/soft-factory-fixture/.trees/3/.soft-factory/agent-result.candidate.json";
    resultFault.files.values.set(
      candidatePath,
      resultFault.files.values.get(resultPath) as string,
    );
    resultFault.files.values.delete(resultPath);
    const beforeResultFault = readSnapshot(resultFault.files);
    resultFault.files.failImmutableWrite = true;
    const resultFailure = await runCli(
      [
        "internal",
        "publish-result",
        "--issue",
        "3",
        "--candidate",
        ".soft-factory/agent-result.candidate.json",
      ],
      "/tmp/start",
      resultFault.ports,
    );
    expect(resultFailure.exitCode).toBe(3);
    expect(resultFault.files.values.has(resultPath)).toBe(false);
    expect(readSnapshot(resultFault.files)).toEqual(beforeResultFault);
  });

  it("ignores changed or invalid current final validation for active state but rejects it for a new run", async () => {
    const active = fixture();
    await new IssueRunService(active.ports).run(3, "/tmp/start");
    active.files.values.set(
      "/tmp/soft-factory-fixture/.soft-factory/config.yml",
      "rpiv:\n  final_validation: [invalid current value]\n",
    );
    await expect(
      new IssueRunService(active.ports).runWorker(3, "/tmp/start"),
    ).resolves.toMatchObject({
      state: "completed",
      requiredFinalValidation: { command: "just verify" },
    });

    const fresh = fixture();
    fresh.files.values.set(
      "/tmp/soft-factory-fixture/.soft-factory/config.yml",
      "rpiv:\n  final_validation: [invalid current value]\n",
    );
    await expect(
      new IssueRunService(fresh.ports).run(3, "/tmp/start"),
    ).rejects.toMatchObject({ code: "CONFIG_INVALID" });
    expect(
      [...fresh.files.values.keys()].some(
        (entry) =>
          entry.includes("/.soft-factory/locks/") ||
          entry.includes("/.soft-factory/runs/"),
      ),
    ).toBe(false);
  });
});

describe("zero-exit false-completion rejection", () => {
  it.each([
    ["missing artifact", null],
    ["malformed artifact", "{"],
    ["unsupported artifact", JSON.stringify({ schemaVersion: 9 })],
  ])("ends interrupted for %s", async (_name, artifact) => {
    const f = fixture();
    await new IssueRunService(f.ports).run(3, "/tmp/start");
    const resultPath =
      "/tmp/soft-factory-fixture/.trees/3/.soft-factory/agent-result.json";
    if (artifact === null) f.files.values.delete(resultPath);
    else f.files.values.set(resultPath, artifact);
    const final = await new IssueRunService(f.ports).runWorker(3, "/tmp/start");
    expect(final.state).toBe("interrupted");
    expect(final.state).not.toBe("completed");
    const events =
      f.files.values.get(
        "/tmp/soft-factory-fixture/.soft-factory/events/3.jsonl",
      ) ?? "";
    expect(events).toContain("finalizing");
    expect(events).not.toContain("COMPLETION_PROVED");
    expect(f.trace.some((entry) => entry.startsWith("git:local-head:"))).toBe(
      false,
    );
  });
  it("persists authoritative remote divergence as a failed SHA mismatch", async () => {
    const f = fixture();
    f.git.remote = "b".repeat(40);
    await new IssueRunService(f.ports).run(3, "/tmp/start");
    const final = await new IssueRunService(f.ports).runWorker(3, "/tmp/start");
    expect(final).toMatchObject({
      state: "failed",
      error: { code: "RESULT_REMOTE_SHA_MISMATCH" },
      finalization: {
        git: { remoteHeadSha: "b".repeat(40) },
        reconciliation: { decisionCode: "RESULT_REMOTE_SHA_MISMATCH" },
      },
    });
    const events =
      f.files.values.get(
        "/tmp/soft-factory-fixture/.soft-factory/events/3.jsonl",
      ) ?? "";
    expect(events).toContain("RESULT_REMOTE_SHA_MISMATCH");
    expect(events).not.toContain("COMPLETION_PROVED");
  });

  it("persists an interrupted incomplete proof when the remote query fails", async () => {
    const f = fixture();
    f.git.remoteFailure = new RunnerError(
      "COMPLETION_PROOF_INCOMPLETE",
      "Authoritative remote query timed out.",
      "Retry finalization.",
    );
    await new IssueRunService(f.ports).run(3, "/tmp/start");
    const final = await new IssueRunService(f.ports).runWorker(3, "/tmp/start");
    expect(final).toMatchObject({
      state: "interrupted",
      error: { code: "COMPLETION_PROOF_INCOMPLETE" },
    });
    expect(final.state).not.toBe("completed");
  });
});

type Fixture = ReturnType<typeof fixture>;
const observeDiagnostic: TmuxIdentityDiagnosticV1 = {
  ...creationDiagnostic,
  phase: "observe",
  stdoutByteCount: 17,
  recordCount: 1,
  records: [{ fieldCount: 2, truncated: false }],
  signature: ["window_id", "vertical_bar", "line_feed"],
};

async function within<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("bounded fixture timed out")),
          5000,
        );
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

function snapshotV5(files: MemoryFiles): RunSnapshotV6 {
  return readSnapshot(files) as unknown as RunSnapshotV6;
}

function eventLedger(files: MemoryFiles): Array<{
  priorRevision: number;
  resultingRevision: number;
  resultingSnapshot: RunSnapshotV6;
  runId: string;
}> {
  const text =
    files.values.get(
      "/tmp/soft-factory-fixture/.soft-factory/events/3.jsonl",
    ) ?? "";
  return text
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function expectContiguousHistory(files: MemoryFiles): void {
  const events = eventLedger(files);
  expect(events.map((event) => event.priorRevision)).toEqual(
    events.map((_, index) => index),
  );
  expect(events.map((event) => event.resultingRevision)).toEqual(
    events.map((_, index) => index + 1),
  );
  expect(new Set(events.map((event) => event.resultingRevision)).size).toBe(
    events.length,
  );
  expect(events.at(-1)?.resultingSnapshot).toEqual(snapshotV5(files));
}

async function advanceHeldEvidence(
  f: Fixture,
  service: IssueRunService,
): Promise<RunSnapshotV6> {
  for (const [phase, status] of [
    ["research", "running"],
    ["plan", "running"],
    ["implement", "running"],
    ["verify", "running"],
    ["terminal", "succeeded"],
  ] as const)
    await service.publishRpivProgress(3, "/tmp/start", phase, status);
  f.tmux.observeFailure = new TmuxIdentityOutputError(
    "TMUX_IDENTITY_MALFORMED",
    "tmux returned malformed observation identity evidence.",
    observeDiagnostic,
  );
  await service.reconcile(3, "/tmp/start");
  f.tmux.observeFailure = null;
  return snapshotV5(f.files);
}

async function startHeldWorker(f: Fixture): Promise<{
  service: IssueRunService;
  worker: Promise<RunSnapshotV6>;
  release: (exitCode?: number) => void;
}> {
  const service = new IssueRunService(f.ports);
  await service.run(3, "/tmp/start");
  const release = f.processes.holdWait();
  const worker = service.runWorker(3, "/tmp/start");
  await within(f.processes.waitStarted);
  return { service, worker, release };
}

describe("Issue 34 current post-wait state handling", () => {
  it.each([
    ["zero", 0, "completed"],
    ["nonzero", 9, "failed"],
  ] as const)(
    "holds %s exit while progress and diagnostics advance without evidence loss",
    async (_name, exitCode, expectedState) => {
      const f = fixture();
      const { service, worker, release } = await startHeldWorker(f);
      try {
        const advanced = await advanceHeldEvidence(f, service);
        const resultPath =
          "/tmp/soft-factory-fixture/.trees/3/.soft-factory/agent-result.json";
        const resultBytes = f.files.values.get(resultPath);
        const evidence = {
          progress: advanced.progress,
          diagnostic: advanced.tmuxIdentityDiagnostic,
        };

        release(exitCode);
        const result = await within(worker);

        expect(result.state).toBe(expectedState);
        expect(result.progress).toEqual(evidence.progress);
        expect(result.tmuxIdentityDiagnostic).toEqual(evidence.diagnostic);
        expect(f.files.values.get(resultPath)).toBe(resultBytes);
        expect(f.processes.launches).toBe(1);
        expect(result.copilot?.exitCode).toBe(exitCode);
        if (exitCode !== 0)
          expect(result.error).toMatchObject({
            code: "EXTERNAL_COMMAND_FAILED",
            message: "Copilot exited with code 9.",
          });
        expectContiguousHistory(f.files);
      } finally {
        release(exitCode);
      }
    },
  );

  it.each([
    ["run_mismatch", "run"],
    ["owner_mismatch", "owner"],
    ["worker_mismatch", "worker"],
    ["rpiv_mismatch", "rpiv"],
  ] as const)(
    "refuses exact identity matrix row %s without changing newer bytes",
    async (reason, target) => {
      const f = fixture();
      const { worker, release } = await startHeldWorker(f);
      try {
        const snapshotPath =
          "/tmp/soft-factory-fixture/.soft-factory/runs/3.json";
        const eventsPath =
          "/tmp/soft-factory-fixture/.soft-factory/events/3.jsonl";
        const current = snapshotV5(f.files) as RunSnapshotV6 & {
          integrationLaunch: { runId: string };
        };
        if (target === "run") {
          const nextRunId = "other-run";
          current.runId = nextRunId;
          current.integrationLaunch.runId = nextRunId;
          const events = eventLedger(f.files);
          for (const event of events) {
            event.runId = nextRunId;
            event.resultingSnapshot.runId = nextRunId;
            event.resultingSnapshot.integrationLaunch.runId = nextRunId;
          }
          f.files.values.set(
            eventsPath,
            events.map((event) => JSON.stringify(event)).join("\n") + "\n",
          );
        } else if (target === "owner") current.ownerId = "other-owner";
        else if (target === "worker")
          current.workerProcess = {
            ...(current.workerProcess as ProcessIdentityV1),
            startToken: "other-worker",
          };
        else
          current.rpivProcess = {
            ...(current.rpivProcess as ProcessIdentityV1),
            startToken: "other-rpiv",
          };
        f.files.values.set(snapshotPath, JSON.stringify(current) + "\n");
        const newerSnapshot = f.files.values.get(snapshotPath);
        const newerEvents = f.files.values.get(eventsPath);

        release(0);
        await expect(within(worker)).rejects.toMatchObject({
          code: "POST_WAIT_STATE_REFUSED",
          details: { reason },
        });
        expect(f.files.values.get(snapshotPath)).toBe(newerSnapshot);
        expect(f.files.values.get(eventsPath)).toBe(newerEvents);
        expect(f.processes.launches).toBe(1);
      } finally {
        release(0);
      }
    },
  );

  it.each([
    ["missing", "missing"],
    ["invalid", "invalid"],
  ] as const)("returns typed %s reload refusal", async (mode, reason) => {
    const f = fixture();
    const { worker, release } = await startHeldWorker(f);
    try {
      const snapshotPath =
        "/tmp/soft-factory-fixture/.soft-factory/runs/3.json";
      if (mode === "missing") f.files.values.delete(snapshotPath);
      else f.files.values.set(snapshotPath, "{invalid");
      const eventsBefore = eventLedger(f.files);
      release(0);
      await expect(within(worker)).rejects.toMatchObject({
        code: "POST_WAIT_STATE_REFUSED",
        details: {
          reason,
          causeCode: mode === "missing" ? "STATE_NOT_FOUND" : "STATE_INVALID",
        },
      });
      expect(eventLedger(f.files)).toEqual(eventsBefore);
      expect(f.processes.launches).toBe(1);
    } finally {
      release(0);
    }
  });

  it("returns an already-terminal current outcome idempotently", async () => {
    const f = fixture();
    const { worker, release } = await startHeldWorker(f);
    try {
      const current = snapshotV5(f.files);
      const terminal: RunSnapshotV6 = {
        ...current,
        revision: current.revision + 1,
        state: "failed",
        rpivProcess: null,
        copilot: {
          ...(current.copilot as NonNullable<typeof current.copilot>),
          exitCode: 7,
        },
        error: {
          code: "EXTERNAL_COMMAND_FAILED",
          message: "Existing failure.",
        },
        updatedAt: f.ports.clock.now(),
      };
      const store = new RunStore(
        "/tmp/soft-factory-fixture",
        f.files,
        f.ports.clock,
      );
      await store.save(terminal, current.state, "concurrent-terminal");
      const snapshotBefore = f.files.values.get(store.snapshotPath(3));
      const eventsBefore = f.files.values.get(store.eventsPath(3));

      release(0);
      await expect(within(worker)).resolves.toEqual(terminal);
      expect(f.files.values.get(store.snapshotPath(3))).toBe(snapshotBefore);
      expect(f.files.values.get(store.eventsPath(3))).toBe(eventsBefore);
      expect(f.processes.launches).toBe(1);
    } finally {
      release(0);
    }
  });

  it("preserves a second advance between reload and save", async () => {
    const f = fixture();
    const { worker, release } = await startHeldWorker(f);
    try {
      const store = new RunStore(
        "/tmp/soft-factory-fixture",
        f.files,
        f.ports.clock,
      );
      let snapshotReads = 0;
      let advancedSnapshot = "";
      let advancedEvents = "";
      f.files.onReadText = async (filePath) => {
        if (filePath !== store.snapshotPath(3)) return;
        snapshotReads += 1;
        if (snapshotReads !== 2) return;
        f.files.onReadText = null;
        const current = snapshotV5(f.files);
        const advanced: RunSnapshotV6 = {
          ...current,
          revision: current.revision + 1,
          tmuxIdentityDiagnostic: observeDiagnostic,
          updatedAt: f.ports.clock.now(),
        };
        await store.save(advanced, current.state, "concurrent-second-advance");
        advancedSnapshot = f.files.values.get(store.snapshotPath(3)) as string;
        advancedEvents = f.files.values.get(store.eventsPath(3)) as string;
      };

      release(0);
      await expect(within(worker)).rejects.toMatchObject({
        code: "POST_WAIT_STATE_REFUSED",
        details: {
          reason: "state_advanced",
          causeCode: "STATE_HISTORY_INVALID",
        },
      });
      expect(f.files.values.get(store.snapshotPath(3))).toBe(advancedSnapshot);
      expect(f.files.values.get(store.eventsPath(3))).toBe(advancedEvents);
      expect(f.processes.launches).toBe(1);
    } finally {
      f.files.onReadText = null;
      release(0);
    }
  });
});

describe("readiness and safe blocking", () => {
  it.each([
    ["closed", validIssue({ state: "CLOSED" }), "ISSUE_CLOSED"],
    [
      "blocked label",
      validIssue({ labels: ["feature", "BLOCKED"] }),
      "ISSUE_BLOCKED",
    ],
    [
      "blocked relationship",
      validIssue({ openBlockers: [2] }),
      "ISSUE_BLOCKED",
    ],
    [
      "missing markers",
      validIssue({ body: "- [ ] criterion" }),
      "ACCEPTANCE_CRITERIA_INVALID",
    ],
    [
      "duplicate markers",
      validIssue({
        body: `${validBody}
${validBody}`,
      }),
      "ACCEPTANCE_CRITERIA_INVALID",
    ],
    [
      "empty block",
      validIssue({
        body: `<!-- ACCEPTANCE_CRITERIA_START -->
<!-- ACCEPTANCE_CRITERIA_END -->`,
      }),
      "ACCEPTANCE_CRITERIA_INVALID",
    ],
    [
      "incomplete pagination",
      validIssue({ complete: false }),
      "GITHUB_PROOF_INCOMPLETE",
    ],
    [
      "unmapped type",
      validIssue({ labels: ["question"] }),
      "ISSUE_TYPE_UNMAPPED",
    ],
    [
      "ambiguous type",
      validIssue({ labels: ["feature", "fix"] }),
      "ISSUE_TYPE_AMBIGUOUS",
    ],
    [
      "closing PR",
      validIssue({
        openPullRequests: [
          { number: 8, headBranch: "other", closesIssues: [3] },
        ],
      }),
      "ISSUE_CONFLICT",
    ],
    [
      "planned branch PR",
      validIssue({
        openPullRequests: [
          {
            number: 8,
            headBranch: "feat/3-phase-1-run-one-issue",
            closesIssues: [],
          },
        ],
      }),
      "ISSUE_CONFLICT",
    ],
  ])("rejects %s before ownership", async (_name, issue, code) => {
    const f = fixture(issue);
    if (_name === "ambiguous type")
      f.files.values.set(
        "/tmp/soft-factory-fixture/.soft-factory/config.yml",
        `branch_types:
  fix: fix
`,
      );
    const result = await runCli(["run", "--issue", "3"], "/tmp/start", f.ports);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain(String(code));
    expect(f.trace.some((entry) => entry.startsWith("lock:create:"))).toBe(
      false,
    );
  });

  it("rejects nonexistent issues without owned effects", async () => {
    const f = fixture(null);
    const result = await runCli(["run", "--issue", "3"], "/tmp/start", f.ports);
    expect(result.stderr).toContain("ISSUE_NOT_FOUND");
    expect(f.trace.some((entry) => entry.startsWith("lock:create:"))).toBe(
      false,
    );
  });

  it("validates marker-wrapped checkbox counts", () => {
    expect(validateAcceptanceCriteria(validBody)).toBe(10);
    expect(() =>
      validateAcceptanceCriteria(
        "<!-- ACCEPTANCE_CRITERIA_END --><!-- ACCEPTANCE_CRITERIA_START -->",
      ),
    ).toThrow(RunnerError);
  });

  it("resolves documented remote precedence and ambiguity", () => {
    const repository = fixture().git.facts;
    expect(resolveRemote(repository, "origin")).toBe("origin");
    expect(
      resolveRemote(
        {
          ...repository,
          remotes: ["origin", "upstream"],
          pushDefault: "upstream",
        },
        null,
      ),
    ).toBe("upstream");
    expect(
      resolveRemote(
        {
          ...repository,
          remotes: ["origin", "upstream"],
          currentBranchRemote: "origin",
        },
        null,
      ),
    ).toBe("origin");
    expect(() => resolveRemote({ ...repository, remotes: [] }, null)).toThrow(
      "no Git remote",
    );
    expect(() =>
      resolveRemote({ ...repository, remotes: ["one", "two"] }, null),
    ).toThrow("multiple remotes");
    expect(() => resolveRemote(repository, "missing")).toThrow(
      "does not exist",
    );
  });

  it("blocks each unproved fetched base before branch or worktree", async () => {
    for (const scenario of ["base", "tracking", "sha"] as const) {
      const f = fixture();
      if (scenario === "tracking") f.git.tracking = null;
      if (scenario === "sha") f.git.tracking = "b".repeat(40);
      const promise = proveFetchedBase({
        git: f.git,
        repository: f.git.facts,
        remote: "origin",
        configuredBase: scenario === "base" ? "trunk" : null,
        fetchedAt: "2026-08-11T00:00:00Z",
      });
      await expect(promise).rejects.toBeInstanceOf(RunnerError);
      expect(
        f.trace.some((entry) => entry.startsWith("git:create-branch:")),
      ).toBe(false);
      expect(
        f.trace.some((entry) => entry.startsWith("git:add-worktree:")),
      ).toBe(false);
    }
  });

  it("preserves unknown worktree, branch, and snapshot resources", async () => {
    for (const kind of ["branch", "path", "registered", "snapshot"] as const) {
      const f = fixture();
      if (kind === "branch") f.git.branchPresent = true;
      if (kind === "path")
        f.files.values.set("/tmp/soft-factory-fixture/.trees/3", "unknown");
      if (kind === "registered") f.git.registered = true;
      if (kind === "snapshot")
        f.files.values.set(
          "/tmp/soft-factory-fixture/.soft-factory/runs/3.json",
          "unknown",
        );
      const before = new Map(f.files.values);
      const result = await runCli(
        ["run", "--issue", "3"],
        "/tmp/start",
        f.ports,
      );
      expect(result.stderr).toContain(
        kind === "snapshot" ? "STATE_INVALID" : "RESOURCE_OWNERSHIP_UNKNOWN",
      );
      if (kind === "path")
        expect(f.files.values.get("/tmp/soft-factory-fixture/.trees/3")).toBe(
          before.get("/tmp/soft-factory-fixture/.trees/3"),
        );
      if (kind === "snapshot")
        expect(
          f.files.values.get(
            "/tmp/soft-factory-fixture/.soft-factory/runs/3.json",
          ),
        ).toBe("unknown");
      expect(
        f.trace.some((entry) => entry.startsWith("git:create-branch:")),
      ).toBe(false);
    }
  });
});

describe("ownership, status, and attach", () => {
  it("runs completely in the invoking custom server/session and creates no default-server issue window", async () => {
    const directory = await fs.mkdtemp(
      path.join(os.tmpdir(), "sf-complete-custom-run-"),
    );
    const selectedSocket = path.join(directory, "selected.sock");
    const defaultSocket = path.join(directory, "default.sock");
    const worker = path.join(directory, "worker.sh");
    const physicalWorktree = "/tmp/soft-factory-fixture/.trees/3";
    await fs.mkdir(physicalWorktree, { recursive: true });
    await fs.writeFile(worker, "#!/bin/sh\nsleep 30\n", { mode: 0o700 });
    try {
      for (const socket of [selectedSocket, defaultSocket])
        await executeFile("tmux", [
          "-S",
          socket,
          "new-session",
          "-d",
          "-s",
          "same",
          "-n",
          "origin",
          "-c",
          directory,
          "node",
          "-e",
          "setInterval(() => {}, 1000)",
        ]);
      const invokingPane = (
        await executeFile("tmux", [
          "-S",
          selectedSocket,
          "display-message",
          "-p",
          "-t",
          "same:origin",
          "#{pane_id}",
        ])
      ).stdout.trim();
      const defaultBefore = (
        await executeFile("tmux", [
          "-S",
          defaultSocket,
          "list-panes",
          "-a",
          "-F",
          "#{session_id}|#{window_name}|#{pane_id}",
        ])
      ).stdout;
      const f = fixture();
      const liveTmux = createLivePorts().tmux;
      const completed = await new IssueRunService(
        { ...f.ports, tmux: liveTmux },
        worker,
        { tmux: `${selectedSocket},123,0`, tmuxPane: invokingPane },
      ).run(3, "/tmp/start");
      if (completed.tmux === null)
        throw new Error("complete run did not persist tmux target");
      expect(completed.tmux).toMatchObject({
        socketPath: selectedSocket,
        sessionName: "same",
        windowName: "3",
      });
      const exact = (
        await executeFile("tmux", [
          "-S",
          selectedSocket,
          "display-message",
          "-p",
          "-t",
          completed.tmux.paneId,
          "-F",
          "#{session_id}|#{window_id}|#{pane_id}",
        ])
      ).stdout;
      expect(exact).toBe(
        `${completed.tmux.sessionId}|${completed.tmux.windowId}|${completed.tmux.paneId}\n`,
      );
      const defaultAfter = (
        await executeFile("tmux", [
          "-S",
          defaultSocket,
          "list-panes",
          "-a",
          "-F",
          "#{session_id}|#{window_name}|#{pane_id}",
        ])
      ).stdout;
      expect(defaultAfter).toBe(defaultBefore);
      expect(defaultAfter).not.toContain("|3|");
      await liveTmux.removeWindow(completed.tmux);
    } finally {
      for (const socket of [selectedSocket, defaultSocket])
        await executeFile("tmux", ["-S", socket, "kill-server"]).catch(
          () => undefined,
        );
      await fs.rm("/tmp/soft-factory-fixture", {
        recursive: true,
        force: true,
      });
      await fs.rm(directory, { recursive: true, force: true });
    }
  });
  it("gives two simultaneous starts exactly one owner and resource set", async () => {
    const f = fixture();
    const serviceA = new IssueRunService(f.ports);
    const serviceB = new IssueRunService(f.ports);
    const results = await Promise.allSettled([
      serviceA.run(3, "/tmp/start"),
      serviceB.run(3, "/tmp/start"),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    const rejected = results.find((result) => result.status === "rejected");
    expect(rejected?.status).toBe("rejected");
    if (rejected?.status === "rejected")
      expect(rejected.reason).toMatchObject({ code: "ISSUE_ALREADY_OWNED" });
    expect(
      f.trace.filter((entry) => entry.startsWith("git:create-branch:")).length,
    ).toBe(1);
    expect(
      f.trace.filter((entry) => entry.startsWith("tmux:create:")).length,
    ).toBe(1);
  });

  it("renders human status from common facts and blocks mismatched attach", async () => {
    const f = fixture();
    await new IssueRunService(f.ports).run(3, "/tmp/start");
    const human = await runCli(["status", "3"], "/tmp/start", f.ports);
    expect(human.stdout).toContain("Persisted state: running_rpiv");
    if (f.tmux.created === null)
      throw new Error("fixture tmux identity missing");
    f.tmux.observedOverride = { ...f.tmux.created, paneId: "%wrong" };
    const result = await runCli(["attach", "3"], "/tmp/start", f.ports);
    expect(result.stderr).toContain("TMUX_TARGET_MISMATCH");
    f.tmux.observedOverride = null;
    const missing = await runCli(["attach", "3"], "/tmp/start", f.ports);
    expect(missing.stderr).toContain("TMUX_TARGET_MISSING");
  });

  it("returns stable missing and malformed state errors", async () => {
    const f = fixture();
    expect(
      (await runCli(["status", "3"], "/tmp/start", f.ports)).stderr,
    ).toContain("STATE_NOT_FOUND");
    f.files.values.set(
      "/tmp/soft-factory-fixture/.soft-factory/runs/3.json",
      "not-json",
    );
    expect(
      (await runCli(["status", "3"], "/tmp/start", f.ports)).stderr,
    ).toContain("STATE_INVALID");
    f.files.values.set(
      "/tmp/soft-factory-fixture/.soft-factory/runs/3.json",
      JSON.stringify({ schemaVersion: 2 }),
    );
    expect(
      (await runCli(["status", "3"], "/tmp/start", f.ports)).stderr,
    ).toContain("STATE_INVALID");
  });
});
