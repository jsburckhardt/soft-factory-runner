export const RUN_SNAPSHOT_SCHEMA_VERSION = 1 as const;
export const EVENT_SCHEMA_VERSION = 1 as const;

export type RunState =
  | "acquiring_lock"
  | "preparing_worktree"
  | "starting_tmux"
  | "running_rpiv"
  | "failed"
  | "blocked"
  | "interrupted";

export interface RepositoryIdentity {
  readonly nameWithOwner: string;
  readonly normalizedName: string;
}

export interface RepositoryFacts {
  readonly root: string;
  readonly commonDirectory: string;
  readonly identity: RepositoryIdentity;
  readonly remotes: readonly string[];
  readonly pushDefault: string | null;
  readonly currentBranchRemote: string | null;
}

export interface IssueFacts {
  readonly number: number;
  readonly title: string;
  readonly body: string;
  readonly state: "OPEN" | "CLOSED";
  readonly labels: readonly string[];
  readonly openBlockers: readonly number[];
  readonly openPullRequests: readonly PullRequestFacts[];
  readonly complete: boolean;
}

export interface PullRequestFacts {
  readonly number: number;
  readonly headBranch: string;
  readonly closesIssues: readonly number[];
}

export interface FetchedBaseProofV1 {
  readonly schemaVersion: 1;
  readonly remote: string;
  readonly defaultBranch: string;
  readonly advertisedHeadSha: string;
  readonly trackingRefSha: string;
  readonly fetchedAt: string;
  readonly matches: true;
}

export interface OwnerRecordV1 {
  readonly schemaVersion: 1;
  readonly issueNumber: number;
  readonly ownerId: string;
  readonly runId: string;
  readonly repository: string;
  readonly acquiredAt: string;
}

export interface TmuxIdentity {
  readonly sessionName: string;
  readonly windowName: string;
  readonly windowId: string;
  readonly paneId: string;
  readonly cwd: string;
}

export interface CopilotLaunchFacts {
  readonly executable: "copilot";
  readonly args: readonly string[];
  readonly cwd: string;
  readonly resourceAttributes: string;
  readonly exitCode: number | null;
}

export interface RunSnapshotV1 {
  readonly schemaVersion: 1;
  readonly runId: string;
  readonly ownerId: string;
  readonly repository: string;
  readonly issueNumber: number;
  readonly state: RunState;
  readonly branchType: string;
  readonly branch: string;
  readonly worktreePath: string;
  readonly fetchedBaseProof: FetchedBaseProofV1 | null;
  readonly tmux: TmuxIdentity | null;
  readonly copilot: CopilotLaunchFacts | null;
  readonly error: { readonly code: string; readonly message: string } | null;
  readonly updatedAt: string;
}

export interface TransitionEventV1 {
  readonly schemaVersion: 1;
  readonly at: string;
  readonly runId: string;
  readonly issueNumber: number;
  readonly from: RunState | null;
  readonly to: RunState;
  readonly reason: string;
}

export interface StatusFacts {
  readonly schemaVersion: 1;
  readonly issueNumber: number;
  readonly persisted: RunSnapshotV1;
  readonly observed: TmuxIdentity | null;
}

export interface RunConfiguration {
  readonly remote: string | null;
  readonly baseBranch: string | null;
  readonly labelTypes: Readonly<Record<string, string>>;
  readonly promptTemplate: string;
}

export interface PreparedIssue {
  readonly issue: IssueFacts;
  readonly branchType: string;
  readonly branchName: string;
}

export function normalizeRepositoryName(nameWithOwner: string): string {
  return nameWithOwner
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function issueSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug.slice(0, 60).replace(/-$/g, "") || "issue";
}

export function issueName(issueNumber: number): string {
  return `issue-${issueNumber}`;
}

export function tmuxSessionName(repository: RepositoryIdentity): string {
  return `sf-${repository.normalizedName}`;
}

export function otelResourceAttributes(
  repository: RepositoryIdentity,
  issueNumber: number,
): string {
  return `project.name=${repository.normalizedName},issue.id=${issueName(issueNumber)}`;
}
