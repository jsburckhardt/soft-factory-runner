export const RUN_SNAPSHOT_SCHEMA_VERSION = 5 as const;
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

export type TmuxIdentityPhase = "create" | "observe";
export type TmuxIdentityTokenV1 =
  | "window_id"
  | "pane_id"
  | "vertical_bar"
  | "horizontal_tab"
  | "carriage_return"
  | "line_feed"
  | "backslash"
  | "other";
export interface TmuxIdentityFieldSummaryV1 {
  readonly fieldCount: number;
  readonly truncated: boolean;
}
export interface TmuxIdentityDiagnosticV1 {
  readonly schemaVersion: 1;
  readonly phase: TmuxIdentityPhase;
  readonly exitCode: number;
  readonly stdoutByteCount: number;
  readonly stderrByteCount: number;
  readonly recordCount: number;
  readonly recordsTruncated: boolean;
  readonly records: readonly TmuxIdentityFieldSummaryV1[];
  readonly signature: readonly TmuxIdentityTokenV1[];
  readonly signatureTruncated: boolean;
}

export interface TmuxIdentity {
  readonly sessionName: string;
  readonly windowName: string;
  readonly windowId: string;
  readonly paneId: string;
  readonly cwd: string;
}

export interface TmuxNamePresenceV1 {
  readonly present: boolean;
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
  readonly ownerId: string;
  readonly runId: string;
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
  readonly command: string;
}

export interface RequiredFinalValidationV1 {
  readonly command: string;
}

export const DEFAULT_FINAL_VALIDATION: RequiredFinalValidationV1 =
  Object.freeze({
    command: "just verify",
  });

/** Legacy compatibility export. New v4 runs persist requiredFinalValidation instead. */
export const REQUIRED_VALIDATIONS: readonly RequiredValidationV1[] = [
  DEFAULT_FINAL_VALIDATION,
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

export interface LegacyAgentResultV1 {
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

export const LEGACY_FINAL_VALIDATION_EVIDENCE =
  "snapshot:v1-v3:agent-result.validations[just verify]";

export interface AgentResultV1 extends LegacyAgentResultV1 {
  readonly requiredFinalValidation: {
    readonly command: string;
    readonly status: "passed";
    readonly evidence: readonly string[];
  };
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

export interface LegacyFinalizationFactsV1 {
  readonly result: LegacyAgentResultV1 | null;
  readonly git: CompletionGitFacts | null;
  readonly pullRequest: CompletionPullRequestFacts | null;
  readonly reconciliation: CompletionReconciliationV1 | null;
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
  readonly finalization: LegacyFinalizationFactsV1 | null;
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
  readonly finalization: LegacyFinalizationFactsV1 | null;
}

export type RpivPhase =
  "research" | "plan" | "implement" | "verify" | "terminal";
export type RpivProgressStatus =
  "running" | "succeeded" | "failed" | "blocked" | "cancelled" | "interrupted";
export interface RpivStatusV1 {
  readonly schemaVersion: 1;
  readonly runId: string;
  readonly attempt: number;
  readonly issueNumber: number;
  readonly branch: string;
  readonly sequence: number;
  readonly phase: RpivPhase;
  readonly status: RpivProgressStatus;
  readonly updatedAt: string;
}
export type ProgressClassification =
  | "PROGRESS_MISSING"
  | "PROGRESS_EMPTY"
  | "PROGRESS_INVALID"
  | "PROGRESS_REQUIRED_FIELD_MISSING"
  | "PROGRESS_VERSION_UNSUPPORTED"
  | "PROGRESS_IDENTITY_MISMATCH"
  | "PROGRESS_STALE"
  | "PROGRESS_REGRESSED"
  | "PROGRESS_REPEATED"
  | "PROGRESS_CONFLICT"
  | "PROGRESS_LATE"
  | "PROGRESS_VALID";
export interface ProgressObservationV1 {
  readonly classification: ProgressClassification;
  readonly phase: RpivPhase | "unknown";
  readonly observed: RpivStatusV1 | null;
  readonly lastAccepted: RpivStatusV1 | null;
}
export interface IntegrationLaunchV1 {
  readonly schemaVersion: 1;
  readonly runId: string;
  readonly attempt: number;
  readonly issueNumber: number;
  readonly branch: string;
  readonly startedAt: string;
  readonly progressPath: string;
  readonly resultPath: string;
  readonly requiredFinalValidation: RequiredFinalValidationV1;
  readonly publishProgressCommand: string;
  readonly publishResultCommand: string;
  readonly validateResultCommand: string;
}
export interface RunSnapshotV4 extends Omit<
  RunSnapshotV3,
  "schemaVersion" | "requiredValidations" | "finalization"
> {
  readonly schemaVersion: 4;
  readonly finalization: FinalizationFactsV1 | null;
  readonly requiredFinalValidation: RequiredFinalValidationV1;
  readonly integrationLaunch: IntegrationLaunchV1;
  readonly progress: RpivStatusV1 | null;
}

export interface RunSnapshotV5 extends Omit<RunSnapshotV4, "schemaVersion"> {
  readonly schemaVersion: 5;
  readonly tmuxIdentityDiagnostic: TmuxIdentityDiagnosticV1 | null;
}

export type RunSnapshot =
  RunSnapshotV1 | RunSnapshotV2 | RunSnapshotV3 | RunSnapshotV4 | RunSnapshotV5;

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
  readonly resultingSnapshot: RunSnapshotV3 | RunSnapshotV4 | RunSnapshotV5;
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
  readonly lease: ObservationV1<ConcurrencyLeaseV1>;
  readonly filesystem: ObservationV1<{ readonly worktreePath: string }>;
  readonly git: ObservationV1<WorktreeObservationV1>;
  readonly tmux: ObservationV1<TmuxIdentity | TmuxNamePresenceV1>;
  readonly workerProcess: ObservationV1<ProcessIdentityV1>;
  readonly rpivProcess: ObservationV1<ProcessIdentityV1>;
  readonly progress: ObservationV1<ProgressObservationV1>;
  readonly result: ObservationV1<AgentResultV1>;
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

export interface ReconciliationReportV2 {
  readonly schemaVersion: 2;
  readonly issueNumber: number;
  readonly persisted: RunSnapshot;
  readonly observations: ReconciliationObservationsV1;
  readonly activity: "active" | "inactive" | "interrupted" | "blocked";
  readonly decisionCode: string;
  readonly safeActions: readonly SafeAction[];
  readonly resultAuthority:
    "none" | "recovery_candidate" | "persisted_completion";
  readonly diagnostics: readonly string[];
  readonly remediation: string | null;
  readonly tmuxIdentityDiagnostic: TmuxIdentityDiagnosticV1 | null;
}

export interface StatusFacts {
  readonly schemaVersion: 4;
  readonly issueNumber: number;
  readonly persisted: RunSnapshot;
  readonly observed: TmuxIdentity | TmuxNamePresenceV1 | null;
  readonly reconciliation: ReconciliationReportV2;
}

export interface RunConfiguration {
  readonly protocolVersion: number | null;
  readonly remote: string | null;
  readonly baseBranch: string | null;
  readonly worktreeRoot: string;
  readonly stateRoot: string;
  readonly labelTypes: Readonly<Record<string, string>>;
  readonly promptTemplate: string;
  readonly maxConcurrentRuns: number;
  readonly copilotEnvironment: Readonly<Record<string, string>>;
  readonly finalValidation: RequiredFinalValidationV1;
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
  readonly report: ReconciliationReportV2 | null;
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
