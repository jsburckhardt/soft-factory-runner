export const RUN_SNAPSHOT_SCHEMA_VERSION = 2 as const;
export const EVENT_SCHEMA_VERSION = 1 as const;
export const AGENT_RESULT_SCHEMA_VERSION = 1 as const;

export type PreparationState =
  "acquiring_lock" | "preparing_worktree" | "starting_tmux" | "running_rpiv";
export type TerminalState =
  "completed" | "failed" | "blocked" | "cancelled" | "interrupted";
export type RunState = PreparationState | "finalizing" | TerminalState;
export type LegacyRunState =
  PreparationState | "failed" | "blocked" | "interrupted";

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

interface RunSnapshotBase {
  readonly runId: string;
  readonly ownerId: string;
  readonly repository: string;
  readonly issueNumber: number;
  readonly branchType: string;
  readonly branch: string;
  readonly worktreePath: string;
  readonly fetchedBaseProof: FetchedBaseProofV1 | null;
  readonly tmux: TmuxIdentity | null;
  readonly copilot: CopilotLaunchFacts | null;
  readonly error: { readonly code: string; readonly message: string } | null;
  readonly updatedAt: string;
}

export interface RunSnapshotV1 extends RunSnapshotBase {
  readonly schemaVersion: 1;
  readonly state: LegacyRunState;
}

export interface RequiredAcceptanceCriterionV1 {
  readonly id: string;
  readonly text: string;
}

export interface RequiredValidationV1 {
  readonly command: "just verify-focused" | "just verify";
}

export const REQUIRED_VALIDATIONS: readonly RequiredValidationV1[] = [
  { command: "just verify-focused" },
  { command: "just verify" },
];

export type AgentOutcome =
  "succeeded" | "failed" | "blocked" | "cancelled" | "interrupted";

export interface AgentAcceptanceResultV1 {
  readonly id: string;
  readonly status: "verified" | "unverified";
  readonly evidence: readonly string[];
}

export interface AgentValidationResultV1 {
  readonly command: string;
  readonly status: "passed" | "failed";
}

export interface AgentResultV1 {
  readonly schemaVersion: 1;
  readonly issueNumber: number;
  readonly outcome: AgentOutcome;
  readonly branch: string;
  readonly headSha: string;
  readonly prNumber: number;
  readonly acceptanceCriteria: readonly AgentAcceptanceResultV1[];
  readonly validations: readonly AgentValidationResultV1[];
  readonly completedAt: string;
}

export interface CompletionGitFacts {
  readonly localHeadSha: string | null;
  readonly remote: string;
  readonly remoteBranch: string;
  readonly remoteHeadSha: string | null;
}

export interface CompletionPullRequestFacts {
  readonly number: number;
  readonly state: "OPEN" | "CLOSED" | "MERGED";
  readonly baseBranch: string;
  readonly headBranch: string;
  readonly headSha: string;
  readonly closesIssues: readonly number[];
  readonly complete: boolean;
}

export interface CompletionComparisonV1 {
  readonly code: string;
  readonly expected: unknown;
  readonly observed: unknown;
  readonly passed: boolean;
}

export interface CompletionReconciliationV1 {
  readonly schemaVersion: 1;
  readonly comparisons: readonly CompletionComparisonV1[];
  readonly passed: boolean;
  readonly decisionCode: string;
}

export interface FinalizationFactsV1 {
  readonly result: AgentResultV1 | null;
  readonly git: CompletionGitFacts | null;
  readonly pullRequest: CompletionPullRequestFacts | null;
  readonly reconciliation: CompletionReconciliationV1 | null;
}

export interface RunSnapshotV2 extends RunSnapshotBase {
  readonly schemaVersion: 2;
  readonly state: RunState;
  readonly requiredAcceptanceCriteria: readonly RequiredAcceptanceCriterionV1[];
  readonly requiredValidations: readonly RequiredValidationV1[];
  readonly finalization: FinalizationFactsV1 | null;
}

export type RunSnapshot = RunSnapshotV1 | RunSnapshotV2;

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
  readonly persisted: RunSnapshot;
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
  readonly requiredAcceptanceCriteria: readonly RequiredAcceptanceCriterionV1[];
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
