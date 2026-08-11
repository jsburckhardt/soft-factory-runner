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
  | "TMUX_TARGET_MISSING"
  | "TMUX_TARGET_MISMATCH"
  | "EXTERNAL_COMMAND_FAILED";

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
    error.code === "RESOURCE_OWNERSHIP_UNKNOWN"
  )
    return 4;
  return 3;
}
