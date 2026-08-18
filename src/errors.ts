export type ErrorCode =
  | "CLI_INVALID"
  | "REPOSITORY_INVALID"
  | "CONFIG_INVALID"
  | "ISSUE_NOT_FOUND"
  | "ISSUE_CLOSED"
  | "ISSUE_BLOCKED"
  | "ISSUE_CONFLICT"
  | "ACCEPTANCE_CRITERIA_INVALID"
  | "ISSUE_TYPE_UNMAPPED"
  | "ISSUE_TYPE_AMBIGUOUS"
  | "GITHUB_PROOF_INCOMPLETE"
  | "REMOTE_MISSING"
  | "REMOTE_AMBIGUOUS"
  | "REMOTE_FETCH_FAILED"
  | "REMOTE_HEAD_MISSING"
  | "BASE_BRANCH_CONFLICT"
  | "BASE_TRACKING_MISSING"
  | "BASE_SHA_MISMATCH"
  | "ISSUE_ALREADY_OWNED"
  | "RESOURCE_OWNERSHIP_UNKNOWN"
  | "STATE_NOT_FOUND"
  | "STATE_INVALID"
  | "TMUX_CONTEXT_REFUSED"
  | "TMUX_IDENTITY_MALFORMED"
  | "TMUX_TARGET_MISSING"
  | "TMUX_TARGET_MISMATCH"
  | "TMUX_TARGET_OBSERVATION_REFUSED"
  | "EXTERNAL_COMMAND_FAILED"
  | "RESULT_MISSING"
  | "RESULT_INVALID"
  | "RESULT_VERSION_UNSUPPORTED"
  | "RESULT_IDENTITY_MISMATCH"
  | "RESULT_OUTCOME_MISMATCH"
  | "RESULT_ACCEPTANCE_MISMATCH"
  | "RESULT_FINAL_VALIDATION_MISMATCH"
  | "RESULT_ALREADY_EXISTS"
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
  | "PROGRESS_VALID"
  | "COMPLETION_PROOF_INCOMPLETE"
  | "STATE_HISTORY_INVALID"
  | "POST_WAIT_STATE_REFUSED"
  | "CONCURRENCY_LIMIT_REACHED"
  | "CONCURRENCY_STATE_UNKNOWN"
  | "RUN_EXISTS"
  | "RECONCILIATION_UNKNOWN"
  | "RECONCILIATION_MISMATCH"
  | "PROCESS_IDENTITY_MISMATCH"
  | "PROCESS_IDENTITY_AMBIGUOUS"
  | "PROCESS_OBSERVATION_UNKNOWN"
  | "RESUME_REFUSED"
  | "STOP_REFUSED"
  | "STOP_PROCESS_STILL_ACTIVE"
  | "CLEANUP_ACTIVE"
  | "CLEANUP_DIRTY_WORKTREE"
  | "CLEANUP_OWNERSHIP_UNPROVED"
  | "CLEANUP_MERGE_NOT_PROVED"
  | "CLEANUP_PARTIAL"
  | "LOG_NOT_FOUND"
  | "DOCTOR_ADAPTER_FAILED"
  | "DOCTOR_INVARIANT"
  | "ASSET_CATALOG_INVALID"
  | "ASSET_PROTOCOL_INCOMPATIBLE"
  | "ASSET_INTEGRITY_INVALID"
  | "ASSET_MANIFEST_INVALID"
  | "ASSET_PATH_INVALID"
  | "ASSET_LOCAL_MODIFIED"
  | "ASSET_FILESYSTEM_FAILED"
  | "ASSET_ROLLBACK_UNCERTAIN";

export class RunnerError extends Error {
  public readonly code: ErrorCode;
  public readonly remediation: string;
  public readonly details: Readonly<Record<string, unknown>>;
  public readonly cause: unknown;

  public constructor(
    code: ErrorCode,
    message: string,
    remediation: string,
    options: {
      readonly details?: Readonly<Record<string, unknown>>;
      readonly cause?: unknown;
    } = {},
  ) {
    super(message);
    this.name = "RunnerError";
    this.code = code;
    this.remediation = remediation;
    this.details = options.details ?? {};
    this.cause = options.cause;
  }
}

export function isRunnerError(value: unknown): value is RunnerError {
  return value instanceof RunnerError;
}

export function errorExitCode(error: RunnerError): number {
  if (error.code === "CLI_INVALID") return 2;
  if (
    error.code === "ISSUE_ALREADY_OWNED" ||
    error.code === "RESOURCE_OWNERSHIP_UNKNOWN" ||
    error.code === "CONCURRENCY_LIMIT_REACHED" ||
    error.code.startsWith("CLEANUP_") ||
    error.code === "RESUME_REFUSED" ||
    error.code === "STOP_REFUSED" ||
    error.code === "STOP_PROCESS_STILL_ACTIVE" ||
    error.code === "ASSET_LOCAL_MODIFIED" ||
    error.code === "ASSET_ROLLBACK_UNCERTAIN"
  )
    return 4;
  return 3;
}
