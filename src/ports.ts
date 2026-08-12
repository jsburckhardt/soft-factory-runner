import type {
  CompletionPullRequestFacts,
  IssueFacts,
  LaunchIntentV1,
  MergedPullRequestFactsV1,
  ProcessIdentityV1,
  RepositoryFacts,
  RunSnapshot,
  TmuxIdentity,
  WorktreeObservationV1,
} from "./domain";

export interface ClockPort {
  now(): string;
}
export interface IdPort {
  nextOwnerId(): string;
  nextRunId(): string;
}

export interface FilePort {
  readText(path: string): Promise<string | null>;
  readAgentResult(worktreePath: string): Promise<string | null>;
  readRpivStatus?(worktreePath: string): Promise<string | null>;
  exists(path: string): Promise<boolean>;
  list(path: string): Promise<readonly string[]>;
  exclusiveCreate(path: string, content: string): Promise<boolean>;
  immutableWrite?(path: string, content: string): Promise<boolean>;
  atomicWrite(path: string, content: string): Promise<void>;
  append(path: string, content: string): Promise<void>;
  compareAndDelete(path: string, expectedContent: string): Promise<boolean>;
}

export interface GitPort {
  discover(startPath: string): Promise<RepositoryFacts>;
  branchExists(repositoryRoot: string, branch: string): Promise<boolean>;
  registeredWorktreeExists(
    repositoryRoot: string,
    path: string,
  ): Promise<boolean>;
  observeWorktree(
    repositoryRoot: string,
    path: string,
  ): Promise<WorktreeObservationV1>;
  fetch(repositoryRoot: string, remote: string): Promise<void>;
  advertisedHead(
    repositoryRoot: string,
    remote: string,
  ): Promise<{ readonly branch: string; readonly sha: string }>;
  trackingSha(
    repositoryRoot: string,
    remote: string,
    branch: string,
  ): Promise<string | null>;
  localHeadSha(worktreePath: string): Promise<string | null>;
  remoteBranchSha(
    repositoryRoot: string,
    remote: string,
    branch: string,
  ): Promise<string | null>;
  createBranch(
    repositoryRoot: string,
    branch: string,
    sha: string,
  ): Promise<void>;
  addWorktree(
    repositoryRoot: string,
    path: string,
    branch: string,
  ): Promise<void>;
  removeWorktree(repositoryRoot: string, path: string): Promise<void>;
}

export interface GitHubPort {
  loadIssue(
    repository: string,
    issueNumber: number,
  ): Promise<IssueFacts | null>;
  loadPullRequest(
    repository: string,
    pullRequestNumber: number,
  ): Promise<CompletionPullRequestFacts | null>;
  loadMergedPullRequest(
    repository: string,
    pullRequestNumber: number,
  ): Promise<MergedPullRequestFactsV1 | null>;
}

export interface PaneCaptureV1 {
  readonly content: string;
  readonly truncated: boolean;
}

export interface TmuxPort {
  createIssueWindow(input: {
    readonly sessionName: string;
    readonly windowName: string;
    readonly cwd: string;
    readonly executable: string;
    readonly args: readonly string[];
  }): Promise<TmuxIdentity>;
  observe(target: TmuxIdentity): Promise<TmuxIdentity | null>;
  panePid(target: TmuxIdentity): Promise<number | null>;
  setRemainOnExit(target: TmuxIdentity): Promise<void>;
  capturePane(target: TmuxIdentity, maxBytes: number): Promise<PaneCaptureV1>;
  restartWorker(
    target: TmuxIdentity,
    executable: string,
    args: readonly string[],
  ): Promise<void>;
  removeWindow(target: TmuxIdentity): Promise<void>;
  attach(target: TmuxIdentity): Promise<void>;
}

export interface SpawnedProcessV1 {
  readonly identity: ProcessIdentityV1;
  wait(): Promise<{ readonly exitCode: number }>;
}

export interface ProcessPort {
  spawnCopilot(input: {
    readonly executable: "copilot";
    readonly args: readonly string[];
    readonly cwd: string;
    readonly environment: Readonly<Record<string, string>>;
    readonly pane: TmuxIdentity;
    readonly panePid: number;
    readonly launchedAt: string;
  }): Promise<SpawnedProcessV1>;
  identify(
    pid: number,
    paneLineage: ProcessIdentityV1["paneLineage"],
    launchedAt: string,
  ): Promise<ProcessIdentityV1 | null>;
  observe(identity: ProcessIdentityV1): Promise<ProcessIdentityV1 | null>;
  findLaunchCandidates(
    intent: LaunchIntentV1,
  ): Promise<readonly ProcessIdentityV1[]>;
  signalGroup(
    identity: ProcessIdentityV1,
    signal: "SIGTERM" | "SIGKILL",
  ): Promise<void>;
  waitForExit(identity: ProcessIdentityV1, timeoutMs: number): Promise<boolean>;
}

export interface RunnerPorts {
  readonly files: FilePort;
  readonly git: GitPort;
  readonly github: GitHubPort;
  readonly tmux: TmuxPort;
  readonly processes: ProcessPort;
  readonly clock: ClockPort;
  readonly ids: IdPort;
}

export interface SnapshotStore {
  load(issueNumber: number): Promise<RunSnapshot>;
}
