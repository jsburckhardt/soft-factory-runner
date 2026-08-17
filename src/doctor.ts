import { RunnerError } from "./errors";

export const DOCTOR_SCHEMA_VERSION = 2 as const;
export const DOCTOR_PROTOCOL_VERSION = 1 as const;
export const DOCTOR_RESULT_CONTRACT = "agent-result-v1" as const;
export const DOCTOR_EXTERNAL_TIMEOUT_MS = 2_000 as const;
export const DOCTOR_AGGREGATE_TIMEOUT_MS = 9_000 as const;
export const DOCTOR_OPERATION_CUTOFF_MS = 6_500 as const;
export const DOCTOR_TMUX_OUTPUT_LIMIT_BYTES = 4_096 as const;
export const DOCTOR_TMUX_KILL_SERVER_MILESTONE_MS = 7_000 as const;
export const DOCTOR_TMUX_POST_KILL_MILESTONE_MS = 7_250 as const;
export const DOCTOR_TMUX_SIGTERM_MILESTONE_MS = 7_750 as const;
export const DOCTOR_TMUX_SIGKILL_MILESTONE_MS = 8_250 as const;

export const DOCTOR_CHECK_IDS = [
  "repository.git-membership",
  "repository.primary-worktree",
  "repository.git-common-directory",
  "repository.github-identity",
  "repository.default-branch",
  "command.git",
  "command.gh",
  "command.tmux",
  "command.node",
  "command.copilot",
  "authentication.github-cli",
  "authentication.copilot-cli",
  "compatibility.rpiv-agent",
  "compatibility.runner-protocol",
  "compatibility.configuration",
  "compatibility.worktree-root",
  "compatibility.state-root-writable",
  "compatibility.trees-ignored",
  "compatibility.runtime-state-ignored",
  "compatibility.result-contract",
  "runtime.trees-ownership",
  "runtime.state-readable",
  "runtime.locks-interpretable",
  "runtime.required-paths-creatable",
] as const;

export type DoctorCheckId = (typeof DOCTOR_CHECK_IDS)[number];
export type DoctorCheckStatus = "passed" | "failed";

export const DOCTOR_CHECK_DEPENDENCIES: Readonly<
  Record<DoctorCheckId, readonly DoctorCheckId[]>
> = {
  "repository.git-membership": [],
  "repository.primary-worktree": ["repository.git-membership"],
  "repository.git-common-directory": ["repository.git-membership"],
  "repository.github-identity": ["repository.git-membership"],
  "repository.default-branch": [
    "repository.git-membership",
    "repository.github-identity",
  ],
  "command.git": [],
  "command.gh": [],
  "command.tmux": [],
  "command.node": [],
  "command.copilot": [],
  "authentication.github-cli": ["command.gh", "repository.github-identity"],
  "authentication.copilot-cli": ["command.copilot"],
  "compatibility.rpiv-agent": ["repository.primary-worktree"],
  "compatibility.runner-protocol": ["compatibility.rpiv-agent"],
  "compatibility.configuration": ["repository.primary-worktree"],
  "compatibility.worktree-root": [
    "compatibility.configuration",
    "repository.git-common-directory",
  ],
  "compatibility.state-root-writable": [
    "compatibility.configuration",
    "compatibility.worktree-root",
  ],
  "compatibility.trees-ignored": ["compatibility.worktree-root", "command.git"],
  "compatibility.runtime-state-ignored": [
    "compatibility.configuration",
    "command.git",
  ],
  "compatibility.result-contract": ["compatibility.rpiv-agent"],
  "runtime.trees-ownership": ["compatibility.worktree-root"],
  "runtime.state-readable": ["compatibility.configuration"],
  "runtime.locks-interpretable": ["compatibility.configuration"],
  "runtime.required-paths-creatable": [
    "compatibility.worktree-root",
    "compatibility.state-root-writable",
  ],
};

export const DOCTOR_TMUX_OPERATIONS = [
  "workspace",
  "server-start",
  "socket-ready",
  "session-create",
  "session-query",
  "window-list",
  "dashboard-pane-identify",
  "window-create",
  "window-configure",
  "issue-pane-identify",
  "pane-observe",
  "window-remove",
  "server-stop",
  "helper-stop",
  "workspace-remove",
  "aggregate",
] as const;
export type DoctorTmuxProbeOperationV1 =
  (typeof DOCTOR_TMUX_OPERATIONS)[number];

export const DOCTOR_TMUX_REASONS = [
  "unavailable",
  "unsafe-workspace",
  "filesystem-failed",
  "launch-failed",
  "socket-unavailable",
  "nonzero-exit",
  "timeout",
  "cancelled",
  "output-truncated",
  "malformed-output",
  "identity-mismatch",
  "cwd-mismatch",
  "process-identity-unknown",
  "cleanup-failed",
  "unexpected-resource",
  "aggregate-deadline",
] as const;
export type DoctorTmuxProbeReasonV1 = (typeof DOCTOR_TMUX_REASONS)[number];
export type DoctorTmuxCleanupStateV1 =
  "not-created" | "absent" | "present" | "unknown";

export interface DoctorTmuxProbeEvidenceV1 {
  readonly schemaVersion: 1;
  readonly kind: "tmux-functional-probe";
  readonly operation: DoctorTmuxProbeOperationV1;
  readonly reason: DoctorTmuxProbeReasonV1;
  readonly exitCode: number | null;
  readonly timedOut: boolean;
  readonly stdoutByteCount: number;
  readonly stderrByteCount: number;
  readonly stdoutTruncated: boolean;
  readonly stderrTruncated: boolean;
  readonly identityDiagnostic:
    import("./domain").TmuxIdentityDiagnosticV1 | null;
  readonly cleanup: {
    readonly server: DoctorTmuxCleanupStateV1;
    readonly paneProcesses: DoctorTmuxCleanupStateV1;
    readonly socket: DoctorTmuxCleanupStateV1;
    readonly workspace: DoctorTmuxCleanupStateV1;
  };
}

export interface DoctorTmuxTargetingEvidenceV1 {
  readonly schemaVersion: 1;
  readonly kind: "tmux-targeting";
  readonly mode: "invoking-valid" | "standalone-fallback" | "invalid-context";
  readonly reason: import("./tmux-target").TmuxContextRefusalReason | null;
  readonly bounded: true;
  readonly ambientUnchanged: true;
  readonly unrelatedUnchanged: true;
}
export type DoctorCheckEvidenceV1 =
  DoctorTmuxProbeEvidenceV1 | DoctorTmuxTargetingEvidenceV1;

export interface DoctorPassedCheckV2 {
  readonly id: DoctorCheckId;
  readonly status: "passed";
  readonly blocking: true;
  readonly evidence?: DoctorCheckEvidenceV1;
}
export interface DoctorFailedCheckV2 {
  readonly id: DoctorCheckId;
  readonly status: "failed";
  readonly blocking: true;
  readonly message: string;
  readonly remediation: string;
  readonly evidence?: DoctorCheckEvidenceV1;
}
export type DoctorCheckResultV2 = DoctorPassedCheckV2 | DoctorFailedCheckV2;
export interface DoctorRepositoryFactsV2 {
  readonly github: string | null;
  readonly defaultBranch: string | null;
}
export interface DoctorResultV2 {
  readonly schemaVersion: 2;
  readonly ready: boolean;
  readonly repository: DoctorRepositoryFactsV2;
  readonly checks: readonly DoctorCheckResultV2[];
}
export interface RpivMetadataV1 {
  readonly name: "rpiv";
  readonly runnerProtocol: number | null;
  readonly resultContract: string | null;
}

export function passedCheck(
  id: DoctorCheckId,
  evidence?: DoctorCheckEvidenceV1,
): DoctorPassedCheckV2 {
  return evidence === undefined
    ? { id, status: "passed", blocking: true }
    : { id, status: "passed", blocking: true, evidence };
}
export function failedCheck(
  id: DoctorCheckId,
  message: string,
  remediation: string,
  evidence?: DoctorCheckEvidenceV1,
): DoctorFailedCheckV2 {
  if (message.trim() === "" || remediation.trim() === "")
    throw new RunnerError(
      "DOCTOR_INVARIANT",
      "Doctor failures require message and remediation.",
      "Correct the Doctor check implementation.",
    );
  return evidence === undefined
    ? { id, status: "failed", blocking: true, message, remediation }
    : { id, status: "failed", blocking: true, message, remediation, evidence };
}
export function makeDoctorResult(
  repository: DoctorRepositoryFactsV2,
  checks: readonly DoctorCheckResultV2[],
): DoctorResultV2 {
  const ordered =
    checks.length === DOCTOR_CHECK_IDS.length &&
    checks.every(
      (check, index) =>
        check.id === DOCTOR_CHECK_IDS[index] && isDoctorCheckResult(check),
    );
  if (!ordered)
    throw new RunnerError(
      "DOCTOR_INVARIANT",
      "Doctor must produce exactly the canonical ordered 24 checks.",
      "Correct the Doctor check assembly before rendering output.",
    );
  return {
    schemaVersion: 2,
    ready: checks.every((check) => check.status === "passed"),
    repository,
    checks: [...checks],
  };
}

export function isDoctorResultV2(value: unknown): boolean {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["schemaVersion", "ready", "repository", "checks"])
  )
    return false;
  if (
    value.schemaVersion !== 2 ||
    typeof value.ready !== "boolean" ||
    !isRecord(value.repository)
  )
    return false;
  if (!hasExactKeys(value.repository, ["github", "defaultBranch"]))
    return false;
  if (
    !nullableString(value.repository.github) ||
    !nullableString(value.repository.defaultBranch)
  )
    return false;
  if (
    !Array.isArray(value.checks) ||
    value.checks.length !== DOCTOR_CHECK_IDS.length
  )
    return false;
  if (
    !value.checks.every(
      (check, index) =>
        isRecord(check) &&
        check.id === DOCTOR_CHECK_IDS[index] &&
        isDoctorCheckResult(check),
    )
  )
    return false;
  return (
    value.ready ===
    value.checks.every((check) => isRecord(check) && check.status === "passed")
  );
}

function isDoctorCheckResult(value: unknown): boolean {
  if (
    !isRecord(value) ||
    value.blocking !== true ||
    !includesDoctorId(value.id)
  )
    return false;
  if (value.status === "passed")
    return (
      hasExactKeys(value, ["id", "status", "blocking"]) ||
      (hasExactKeys(value, ["id", "status", "blocking", "evidence"]) &&
        isDoctorTmuxEvidence(value.evidence))
    );
  if (value.status !== "failed") return false;
  const keys = Object.keys(value);
  const common =
    (keys.length === 5 || keys.length === 6) &&
    keys.every((key) =>
      [
        "id",
        "status",
        "blocking",
        "message",
        "remediation",
        "evidence",
      ].includes(key),
    ) &&
    typeof value.message === "string" &&
    value.message.trim() !== "" &&
    typeof value.remediation === "string" &&
    value.remediation.trim() !== "";
  return (
    common && (!("evidence" in value) || isDoctorTmuxEvidence(value.evidence))
  );
}

function isDoctorTmuxEvidence(value: unknown): boolean {
  return (
    isDoctorTmuxProbeEvidence(value) || isDoctorTmuxTargetingEvidence(value)
  );
}
function isDoctorTmuxTargetingEvidence(value: unknown): boolean {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "schemaVersion",
      "kind",
      "mode",
      "reason",
      "bounded",
      "ambientUnchanged",
      "unrelatedUnchanged",
    ])
  )
    return false;
  const reasons = [
    "partial-evidence",
    "malformed-evidence",
    "stale-server",
    "contradictory-target",
    "ambiguous-session",
    "unavailable-proof",
  ];
  return (
    value.schemaVersion === 1 &&
    value.kind === "tmux-targeting" &&
    ["invoking-valid", "standalone-fallback", "invalid-context"].includes(
      String(value.mode),
    ) &&
    (value.reason === null ||
      (typeof value.reason === "string" && reasons.includes(value.reason))) &&
    value.bounded === true &&
    value.ambientUnchanged === true &&
    value.unrelatedUnchanged === true &&
    (value.mode === "invalid-context") === (value.reason !== null)
  );
}
function isDoctorTmuxProbeEvidence(value: unknown): boolean {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "schemaVersion",
      "kind",
      "operation",
      "reason",
      "exitCode",
      "timedOut",
      "stdoutByteCount",
      "stderrByteCount",
      "stdoutTruncated",
      "stderrTruncated",
      "identityDiagnostic",
      "cleanup",
    ])
  )
    return false;
  if (
    value.schemaVersion !== 1 ||
    value.kind !== "tmux-functional-probe" ||
    !includesOperation(value.operation) ||
    !includesReason(value.reason) ||
    !(value.exitCode === null || Number.isSafeInteger(value.exitCode)) ||
    typeof value.timedOut !== "boolean" ||
    !nonnegativeInteger(value.stdoutByteCount) ||
    !nonnegativeInteger(value.stderrByteCount) ||
    typeof value.stdoutTruncated !== "boolean" ||
    typeof value.stderrTruncated !== "boolean" ||
    !isValueFreeIdentityDiagnostic(value.identityDiagnostic) ||
    !isRecord(value.cleanup) ||
    !hasExactKeys(value.cleanup, [
      "server",
      "paneProcesses",
      "socket",
      "workspace",
    ])
  )
    return false;
  return [
    value.cleanup.server,
    value.cleanup.paneProcesses,
    value.cleanup.socket,
    value.cleanup.workspace,
  ].every(
    (state) =>
      state === "not-created" ||
      state === "absent" ||
      state === "present" ||
      state === "unknown",
  );
}

function isValueFreeIdentityDiagnostic(value: unknown): boolean {
  if (value === null) return true;
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "schemaVersion",
      "phase",
      "exitCode",
      "stdoutByteCount",
      "stderrByteCount",
      "recordCount",
      "recordsTruncated",
      "records",
      "signature",
      "signatureTruncated",
    ])
  )
    return false;
  const tokens = [
    "window_id",
    "pane_id",
    "vertical_bar",
    "horizontal_tab",
    "carriage_return",
    "line_feed",
    "backslash",
    "other",
  ];
  return (
    value.schemaVersion === 1 &&
    (value.phase === "create" || value.phase === "observe") &&
    Number.isSafeInteger(value.exitCode) &&
    nonnegativeInteger(value.stdoutByteCount) &&
    nonnegativeInteger(value.stderrByteCount) &&
    nonnegativeInteger(value.recordCount) &&
    Number(value.recordCount) <= 8 &&
    typeof value.recordsTruncated === "boolean" &&
    Array.isArray(value.records) &&
    value.records.length === Number(value.recordCount) &&
    value.records.every(
      (record) =>
        isRecord(record) &&
        hasExactKeys(record, ["fieldCount", "truncated"]) &&
        Number.isSafeInteger(record.fieldCount) &&
        Number(record.fieldCount) > 0 &&
        Number(record.fieldCount) <= 8 &&
        typeof record.truncated === "boolean",
    ) &&
    Array.isArray(value.signature) &&
    value.signature.length <= 32 &&
    value.signature.every(
      (token) => typeof token === "string" && tokens.includes(token),
    ) &&
    typeof value.signatureTruncated === "boolean"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const keys = Object.keys(value);
  return (
    keys.length === expected.length &&
    keys.every((key) => expected.includes(key))
  );
}
function nullableString(value: unknown): boolean {
  return value === null || typeof value === "string";
}
function nonnegativeInteger(value: unknown): boolean {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}

function includesDoctorId(value: unknown): boolean {
  return (
    typeof value === "string" && DOCTOR_CHECK_IDS.some((id) => id === value)
  );
}
function includesOperation(value: unknown): boolean {
  return (
    typeof value === "string" &&
    DOCTOR_TMUX_OPERATIONS.some((operation) => operation === value)
  );
}
function includesReason(value: unknown): boolean {
  return (
    typeof value === "string" &&
    DOCTOR_TMUX_REASONS.some((reason) => reason === value)
  );
}

export function parseRpivMetadata(text: string): RpivMetadataV1 {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== "---")
    throw metadataError("RPIV agent frontmatter is missing.");
  const end = lines.indexOf("---", 1);
  if (end < 0) throw metadataError("RPIV agent frontmatter is unterminated.");
  const fields = new Map<string, string>();
  for (const line of lines.slice(1, end)) {
    const match = /^([a-z_][a-z0-9_-]*):\s*(.*?)\s*$/.exec(line);
    if (match === null) continue;
    if (fields.has(match[1]))
      throw metadataError(
        "RPIV agent metadata contains duplicate field " + match[1] + ".",
      );
    fields.set(match[1], match[2].replace(/^"|"$/g, ""));
  }
  if (fields.get("name") !== "rpiv")
    throw metadataError("Canonical RPIV metadata must declare name: rpiv.");
  const protocol = fields.get("runner_protocol");
  const runnerProtocol =
    protocol === undefined
      ? null
      : /^[1-9]\d*$/.test(protocol) && Number.isSafeInteger(Number(protocol))
        ? Number(protocol)
        : null;
  return {
    name: "rpiv",
    runnerProtocol,
    resultContract: fields.get("result_contract") ?? null,
  };
}
function metadataError(message: string): RunnerError {
  return new RunnerError(
    "DOCTOR_ADAPTER_FAILED",
    message,
    "Install the canonical .github/agents/rpiv.agent.md with valid frontmatter metadata.",
  );
}
