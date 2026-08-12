import type {
  AgentAcceptanceResultV1,
  AgentOutcome,
  AgentResultV1,
  AgentValidationResultV1,
  CompletionComparisonV1,
  CompletionGitFacts,
  CompletionPullRequestFacts,
  CompletionReconciliationV1,
  LegacyAgentResultV1,
  RequiredAcceptanceCriterionV1,
  RequiredFinalValidationV1,
  TerminalState,
} from "./domain";
import {
  DEFAULT_FINAL_VALIDATION,
  LEGACY_FINAL_VALIDATION_EVIDENCE,
} from "./domain";
import { RunnerError } from "./errors";

const SHA = /^[0-9a-f]{40,64}$/;
const ISO_TIME =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const OUTCOMES: readonly AgentOutcome[] = [
  "succeeded",
  "failed",
  "blocked",
  "cancelled",
  "interrupted",
];

export interface CompletionInput {
  readonly issueNumber: number;
  readonly branch: string;
  readonly baseBranch: string;
  readonly remote: string;
  readonly requiredAcceptanceCriteria: readonly RequiredAcceptanceCriterionV1[];
  readonly requiredFinalValidation: RequiredFinalValidationV1;
  readonly result: AgentResultV1;
  readonly git: CompletionGitFacts | null;
  readonly pullRequest: CompletionPullRequestFacts | null;
}

export interface CompletionDecision {
  readonly state: TerminalState;
  readonly code: string;
  readonly reconciliation: CompletionReconciliationV1;
}

export function parseAgentResult(text: string | null): AgentResultV1 {
  if (text === null)
    throw new RunnerError(
      "RESULT_MISSING",
      "The owned worktree has no RPIV result artifact.",
      "Write .soft-factory/agent-result.json before RPIV exits.",
    );
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (cause: unknown) {
    throw invalidResult("RPIV result artifact is not valid JSON.", cause);
  }
  if (isRecord(value) && value.schemaVersion !== 1)
    throw new RunnerError(
      "RESULT_VERSION_UNSUPPORTED",
      "RPIV result artifact has an unsupported schema version.",
      "Emit schemaVersion 1 from RPIV.",
    );
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "schemaVersion",
      "issueNumber",
      "outcome",
      "branch",
      "headSha",
      "prNumber",
      "acceptanceCriteria",
      "validations",
      "requiredFinalValidation",
      "completedAt",
    ])
  )
    throw invalidResult("RPIV result artifact has an invalid shape.");
  if (
    value.schemaVersion !== 1 ||
    !isPositiveInteger(value.issueNumber) ||
    !OUTCOMES.includes(value.outcome as AgentOutcome) ||
    !isNonemptyString(value.branch) ||
    typeof value.headSha !== "string" ||
    !SHA.test(value.headSha) ||
    !isPositiveInteger(value.prNumber) ||
    !Array.isArray(value.acceptanceCriteria) ||
    !Array.isArray(value.validations) ||
    !isRecord(value.requiredFinalValidation) ||
    !hasExactKeys(value.requiredFinalValidation, [
      "command",
      "status",
      "evidence",
    ]) ||
    !isNonemptyString(value.requiredFinalValidation.command) ||
    value.requiredFinalValidation.status !== "passed" ||
    !Array.isArray(value.requiredFinalValidation.evidence) ||
    value.requiredFinalValidation.evidence.length === 0 ||
    !value.requiredFinalValidation.evidence.every(isNonemptyString) ||
    typeof value.completedAt !== "string" ||
    !ISO_TIME.test(value.completedAt) ||
    !Number.isFinite(Date.parse(value.completedAt))
  )
    throw invalidResult(
      "RPIV result artifact contains an invalid required field.",
    );
  const acceptanceCriteria = value.acceptanceCriteria.map(parseAcceptance);
  const validations = value.validations.map(parseValidation);
  requireUnique(
    acceptanceCriteria.map((entry) => entry.id),
    "acceptance criterion IDs",
  );
  requireUnique(
    validations.map((entry) => entry.command),
    "validation commands",
  );
  return {
    schemaVersion: 1,
    issueNumber: value.issueNumber as number,
    outcome: value.outcome as AgentOutcome,
    branch: value.branch as string,
    headSha: value.headSha,
    prNumber: value.prNumber as number,
    acceptanceCriteria,
    validations,
    requiredFinalValidation: {
      command: value.requiredFinalValidation.command,
      status: "passed",
      evidence: value.requiredFinalValidation.evidence,
    },
    completedAt: value.completedAt,
  };
}

export function parseLegacyAgentResult(
  text: string | null,
): LegacyAgentResultV1 {
  if (text === null)
    throw new RunnerError(
      "RESULT_MISSING",
      "The owned worktree has no legacy RPIV result artifact.",
      "Preserve the legacy run and its result artifact before retrying.",
    );
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (cause: unknown) {
    throw invalidResult(
      "Legacy RPIV result artifact is not valid JSON.",
      cause,
    );
  }
  if (isRecord(value) && value.schemaVersion !== 1)
    throw new RunnerError(
      "RESULT_VERSION_UNSUPPORTED",
      "Legacy RPIV result artifact has an unsupported schema version.",
      "Preserve the legacy run and migrate only a schemaVersion 1 result.",
    );
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "schemaVersion",
      "issueNumber",
      "outcome",
      "branch",
      "headSha",
      "prNumber",
      "acceptanceCriteria",
      "validations",
      "completedAt",
    ]) ||
    value.schemaVersion !== 1 ||
    !isPositiveInteger(value.issueNumber) ||
    !OUTCOMES.includes(value.outcome as AgentOutcome) ||
    !isNonemptyString(value.branch) ||
    typeof value.headSha !== "string" ||
    !SHA.test(value.headSha) ||
    !isPositiveInteger(value.prNumber) ||
    !Array.isArray(value.acceptanceCriteria) ||
    !Array.isArray(value.validations) ||
    typeof value.completedAt !== "string" ||
    !ISO_TIME.test(value.completedAt) ||
    !Number.isFinite(Date.parse(value.completedAt))
  )
    throw invalidResult(
      "Legacy RPIV result artifact contains an invalid required field.",
    );
  const acceptanceCriteria = value.acceptanceCriteria.map(parseAcceptance);
  const validations = value.validations.map(parseValidation);
  requireUnique(
    acceptanceCriteria.map((entry) => entry.id),
    "acceptance criterion IDs",
  );
  requireUnique(
    validations.map((entry) => entry.command),
    "validation commands",
  );
  return {
    schemaVersion: 1,
    issueNumber: value.issueNumber as number,
    outcome: value.outcome as AgentOutcome,
    branch: value.branch as string,
    headSha: value.headSha,
    prNumber: value.prNumber as number,
    acceptanceCriteria,
    validations,
    completedAt: value.completedAt,
  };
}

export function migrateLegacyAgentResult(
  result: LegacyAgentResultV1,
): AgentResultV1 {
  const finalValidation = result.validations.filter(
    (entry) => entry.command === DEFAULT_FINAL_VALIDATION.command,
  );
  if (finalValidation.length !== 1 || finalValidation[0]?.status !== "passed")
    throw invalidResult(
      "Legacy RPIV completion does not contain one passed just verify result.",
    );
  return {
    ...result,
    requiredFinalValidation: {
      command: DEFAULT_FINAL_VALIDATION.command,
      status: "passed",
      evidence: [LEGACY_FINAL_VALIDATION_EVIDENCE],
    },
  };
}

export function isMigratedLegacyAgentResult(result: AgentResultV1): boolean {
  return (
    result.requiredFinalValidation.command ===
      DEFAULT_FINAL_VALIDATION.command &&
    result.requiredFinalValidation.status === "passed" &&
    result.requiredFinalValidation.evidence.length === 1 &&
    result.requiredFinalValidation.evidence[0] ===
      LEGACY_FINAL_VALIDATION_EVIDENCE
  );
}

export function reconcileCompletion(
  input: CompletionInput,
): CompletionDecision {
  if (input.result.outcome !== "succeeded") {
    const state = input.result.outcome;
    return decision(state, `RESULT_OUTCOME_${state.toUpperCase()}`, []);
  }
  if (
    input.git === null ||
    input.git.localHeadSha === null ||
    input.git.remoteHeadSha === null ||
    input.pullRequest === null ||
    !input.pullRequest.complete
  )
    return decision("interrupted", "COMPLETION_PROOF_INCOMPLETE", []);

  const comparisons: CompletionComparisonV1[] = [
    comparison(
      "RESULT_ISSUE_MISMATCH",
      input.issueNumber,
      input.result.issueNumber,
    ),
    comparison("RESULT_BRANCH_MISMATCH", input.branch, input.result.branch),
    comparison(
      "RESULT_LOCAL_SHA_MISMATCH",
      input.result.headSha,
      input.git.localHeadSha,
    ),
    comparison("RESULT_REMOTE_NAME_MISMATCH", input.remote, input.git.remote),
    comparison(
      "RESULT_REMOTE_BRANCH_MISMATCH",
      input.branch,
      input.git.remoteBranch,
    ),
    comparison(
      "RESULT_REMOTE_SHA_MISMATCH",
      input.result.headSha,
      input.git.remoteHeadSha,
    ),
    comparison(
      "PR_NUMBER_MISMATCH",
      input.result.prNumber,
      input.pullRequest.number,
    ),
    comparison("PR_STATE_MISMATCH", "OPEN", input.pullRequest.state),
    comparison(
      "PR_BASE_MISMATCH",
      input.baseBranch,
      input.pullRequest.baseBranch,
    ),
    comparison("PR_HEAD_MISMATCH", input.branch, input.pullRequest.headBranch),
    comparison(
      "PR_SHA_MISMATCH",
      input.result.headSha,
      input.pullRequest.headSha,
    ),
    comparison(
      "PR_ISSUE_LINK_MISMATCH",
      true,
      input.pullRequest.closesIssues.includes(input.issueNumber),
    ),
  ];
  for (const criterion of input.requiredAcceptanceCriteria) {
    const matches = input.result.acceptanceCriteria.filter(
      (entry) => entry.id === criterion.id,
    );
    comparisons.push(
      comparison(
        `AC_${criterion.id}_MISMATCH`,
        { count: 1, status: "verified", evidence: true },
        {
          count: matches.length,
          status: matches[0]?.status ?? null,
          evidence: (matches[0]?.evidence.length ?? 0) > 0,
        },
      ),
    );
  }
  comparisons.push(
    comparison(
      "RESULT_FINAL_VALIDATION_MISMATCH",
      {
        command: input.requiredFinalValidation.command,
        status: "passed",
        evidence: true,
      },
      {
        command: input.result.requiredFinalValidation.command,
        status: input.result.requiredFinalValidation.status,
        evidence: input.result.requiredFinalValidation.evidence.length > 0,
      },
    ),
  );
  const failed = comparisons.find((entry) => !entry.passed);
  return failed === undefined
    ? decision("completed", "COMPLETION_PROVED", comparisons)
    : decision("failed", failed.code, comparisons);
}

function decision(
  state: TerminalState,
  code: string,
  comparisons: readonly CompletionComparisonV1[],
): CompletionDecision {
  return {
    state,
    code,
    reconciliation: {
      schemaVersion: 1,
      comparisons,
      passed: state === "completed",
      decisionCode: code,
    },
  };
}

function comparison(
  code: string,
  expected: unknown,
  observed: unknown,
): CompletionComparisonV1 {
  return { code, expected, observed, passed: deepEqual(expected, observed) };
}

function deepEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function parseAcceptance(
  value: unknown,
  index: number,
): AgentAcceptanceResultV1 {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["id", "status", "evidence"]) ||
    !isNonemptyString(value.id) ||
    (value.status !== "verified" && value.status !== "unverified") ||
    !Array.isArray(value.evidence) ||
    value.evidence.length === 0 ||
    !value.evidence.every(isNonemptyString)
  )
    throw invalidResult(`Acceptance result ${index + 1} is invalid.`);
  return { id: value.id, status: value.status, evidence: value.evidence };
}

function parseValidation(
  value: unknown,
  index: number,
): AgentValidationResultV1 {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["command", "status"]) ||
    !isNonemptyString(value.command) ||
    (value.status !== "passed" && value.status !== "failed")
  )
    throw invalidResult(`Validation result ${index + 1} is invalid.`);
  return { command: value.command, status: value.status };
}

function requireUnique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length)
    throw invalidResult(`RPIV result artifact contains duplicate ${label}.`);
}
function invalidResult(message: string, cause?: unknown): RunnerError {
  return new RunnerError(
    "RESULT_INVALID",
    message,
    "Emit one complete schemaVersion 1 result from the owned worktree.",
    { cause },
  );
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function hasExactKeys(
  value: Readonly<Record<string, unknown>>,
  keys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return deepEqual(actual, expected);
}
function isPositiveInteger(value: unknown): boolean {
  return Number.isSafeInteger(value) && (value as number) > 0;
}
function isNonemptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}
