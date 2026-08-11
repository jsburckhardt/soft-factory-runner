import type {
  CompletionPullRequestFacts,
  IssueFacts,
  RepositoryFacts,
  RunSnapshot,
  TmuxIdentity,
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
  exists(path: string): Promise<boolean>;
  exclusiveCreate(path: string, content: string): Promise<boolean>;
  atomicWrite(path: string, content: string): Promise<void>;
  append(path: string, content: string): Promise<void>;
}

export interface GitPort {
  discover(startPath: string): Promise<RepositoryFacts>;
  branchExists(repositoryRoot: string, branch: string): Promise<boolean>;
  registeredWorktreeExists(
    repositoryRoot: string,
    path: string,
  ): Promise<boolean>;
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
  attach(target: TmuxIdentity): Promise<void>;
}

export interface ProcessPort {
  runCopilot(input: {
    readonly executable: "copilot";
    readonly args: readonly string[];
    readonly cwd: string;
    readonly environment: Readonly<Record<string, string>>;
  }): Promise<{ readonly exitCode: number }>;
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
