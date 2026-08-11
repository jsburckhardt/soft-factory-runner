export const RUN_SNAPSHOT_SCHEMA_VERSION = 3 as const;
export const EVENT_SCHEMA_VERSION = 2 as const;
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

export interface ConcurrencyLeaseV1 {
  readonly schemaVersion: 1;
  readonly slot: number;
  readonly issueNumber: number;
  readonly ownerId: string;
  readonly runId: string;
  readonly repository: string;
  readonly configuredLimit: number;
  readonly acquiredAt: string;
}

export interface TmuxIdentity {
  readonly sessionName: string;
  readonly windowName: string;
  readonly windowId: string;
  readonly paneId: string;
  readonly cwd: string;
}

export interface PaneLineageV1 {
  readonly sessionName: string;
  readonly windowId: string;
  readonly paneId: string;
  readonly panePid: number;
}

export interface ProcessIdentityV1 {
  readonly schemaVersion: 1;
  readonly pid: number;
  readonly processGroupId: number;
  readonly startToken: string;
  readonly executable: string;
  readonly args: readonly string[];
  readonly cwd: string;
  readonly launchedAt: string;
  readonly paneLineage: PaneLineageV1;
}

export interface LaunchIntentV1 {
  readonly schemaVersion: 1;
  readonly attempt: number;
  readonly executable: "copilot";
  readonly args: readonly string[];
  readonly cwd: string;
  readonly resourceAttributes: string;
  readonly pane: TmuxIdentity;
  readonly panePid: number;
  readonly recordedAt: string;
}

export interface CopilotLaunchFacts {
  readonly executable: "copilot";
  readonly args: readonly string[];
  readonly cwd: string;
  readonly resourceAttributes: string;
  readonly exitCode: number | null;
}

export interface StopFactsV1 {
  readonly requestedAt: string;
  readonly termSentAt: string | null;
  readonly killSentAt: string | null;
  readonly completedAt: string | null;
  readonly escalated: boolean;
  readonly processIdentity: ProcessIdentityV1 | null;
  readonly beforeLog: string | null;
  readonly afterLog: string | null;
}

export type CleanupMode = "explicit" | "automatic_merged";
export type CleanupStep = "tmux" | "worktree" | "lease" | "lock";
export interface CleanupFactsV1 {
  readonly mode: CleanupMode;
  readonly intentAt: string;
  readonly completedSteps: readonly CleanupStep[];
  readonly remainingSteps: readonly CleanupStep[];
  readonly blockedCode: string | null;
  readonly updatedAt: string;
}

export interface RetainedLogV1 {
  readonly attempt: number;
  readonly path: string;
  readonly bytes: number;
  readonly truncated: boolean;
  readonly source: "tmux" | "process" | "combined";
  readonly capturedAt: string;
}

export interface MergedPullRequestFactsV1 {
  readonly number: number;
  readonly state: "OPEN" | "CLOSED" | "MERGED";
  readonly mergedAt: string | null;
  readonly sourceBranch: string;
  readonly sourceHeadSha: string;
  readonly mergeCommitSha: string | null;
  readonly closesIssues: readonly number[];
  readonly complete: boolean;
}

export interface RunSnapshotBase {
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

export interface RunSnapshotV3 extends RunSnapshotBase {
  readonly schemaVersion: 3;
  readonly state: RunState;
  readonly revision: number;
  readonly attempt: number;
  readonly admission: ConcurrencyLeaseV1 | null;
  readonly launchIntent: LaunchIntentV1 | null;
  readonly workerProcess: ProcessIdentityV1 | null;
  readonly rpivProcess: ProcessIdentityV1 | null;
  readonly stop: StopFactsV1 | null;
  readonly cleanup: CleanupFactsV1 | null;
  readonly logs: readonly RetainedLogV1[];
  readonly mergedPullRequest: MergedPullRequestFactsV1 | null;
  readonly requiredAcceptanceCriteria: readonly RequiredAcceptanceCriterionV1[];
  readonly requiredValidations: readonly RequiredValidationV1[];
  readonly finalization: FinalizationFactsV1 | null;
}

export type RunSnapshot = RunSnapshotV1 | RunSnapshotV2 | RunSnapshotV3;

export interface TransitionEventV1 {
  readonly schemaVersion: 1;
  readonly at: string;
  readonly runId: string;
  readonly issueNumber: number;
  readonly from: RunState | null;
  readonly to: RunState;
  readonly reason: string;
}

export interface TransitionEventV2 {
  readonly schemaVersion: 2;
  readonly at: string;
  readonly runId: string;
  readonly issueNumber: number;
  readonly priorRevision: number;
  readonly resultingRevision: number;
  readonly reason: string;
  readonly resultingSnapshot: RunSnapshotV3;
}

export type TransitionEvent = TransitionEventV1 | TransitionEventV2;

export type ObservationState =
  "match" | "absent" | "mismatch" | "unknown" | "not_applicable";

export interface ObservationV1<T = unknown> {
  readonly state: ObservationState;
  readonly facts: T | null;
  readonly code: string;
}

export interface WorktreeObservationV1 {
  readonly pathExists: boolean;
  readonly registered: boolean;
  readonly branch: string | null;
  readonly headSha: string | null;
  readonly staged: boolean;
  readonly unstaged: boolean;
  readonly untracked: boolean;
}

export interface ReconciliationObservationsV1 {
  readonly lock: ObservationV1<OwnerRecordV1>;
  readonly filesystem: ObservationV1<{ readonly worktreePath: string }>;
  readonly git: ObservationV1<WorktreeObservationV1>;
  readonly tmux: ObservationV1<TmuxIdentity>;
  readonly workerProcess: ObservationV1<ProcessIdentityV1>;
  readonly rpivProcess: ObservationV1<ProcessIdentityV1>;
  readonly result: ObservationV1<{ readonly present: boolean }>;
  readonly remote: ObservationV1<{ readonly headSha: string | null }>;
  readonly github: ObservationV1<MergedPullRequestFactsV1>;
}

export type SafeAction =
  | "preserve_active"
  | "resume"
  | "retry_finalization"
  | "attach"
  | "stop"
  | "explicit_clean"
  | "automatic_clean";

export interface ReconciliationReportV1 {
  readonly schemaVersion: 1;
  readonly issueNumber: number;
  readonly persisted: RunSnapshot;
  readonly observations: ReconciliationObservationsV1;
  readonly activity: "active" | "inactive" | "interrupted" | "blocked";
  readonly decisionCode: string;
  readonly safeActions: readonly SafeAction[];
  readonly diagnostics: readonly string[];
}

export interface StatusFacts {
  readonly schemaVersion: 2;
  readonly issueNumber: number;
  readonly persisted: RunSnapshot;
  readonly observed: TmuxIdentity | null;
  readonly reconciliation: ReconciliationReportV1;
}

export interface RunConfiguration {
  readonly remote: string | null;
  readonly baseBranch: string | null;
  readonly labelTypes: Readonly<Record<string, string>>;
  readonly promptTemplate: string;
  readonly maxConcurrentRuns: number;
}

export interface PreparedIssue {
  readonly issue: IssueFacts;
  readonly branchType: string;
  readonly branchName: string;
  readonly requiredAcceptanceCriteria: readonly RequiredAcceptanceCriterionV1[];
}

export interface ControlOutcomeV1<T = unknown> {
  readonly schemaVersion: 1;
  readonly issueNumber: number | null;
  readonly state: RunState | "missing" | "inventory";
  readonly code: string;
  readonly exitCode: number;
  readonly report: ReconciliationReportV1 | null;
  readonly facts: T;
  readonly remediation: string | null;
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
