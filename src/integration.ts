import path from "node:path";
import { parseAgentResult } from "./completion";
import type {
  AgentResultV1,
  IntegrationLaunchV1,
  ProgressObservationV1,
  RequiredAcceptanceCriterionV1,
  RequiredFinalValidationV1,
  RpivPhase,
  RpivProgressStatus,
  RpivStatusV1,
  RunSnapshot,
} from "./domain";
import { RunnerError } from "./errors";
import type { FilePort } from "./ports";

const STATUS_KEYS = [
  "schemaVersion",
  "runId",
  "attempt",
  "issueNumber",
  "branch",
  "sequence",
  "phase",
  "status",
  "updatedAt",
] as const;
const PHASES: readonly RpivPhase[] = [
  "research",
  "plan",
  "implement",
  "verify",
  "terminal",
];
const TERMINAL_STATUSES: readonly RpivProgressStatus[] = [
  "succeeded",
  "failed",
  "blocked",
  "cancelled",
  "interrupted",
];
const ISO_TIME =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

export interface IntegrationContractV1 {
  readonly schemaVersion: 1;
  readonly command: "soft-factory instructions [--json]";
  readonly paths: {
    readonly progress: ".soft-factory/rpiv-status.json";
    readonly result: ".soft-factory/agent-result.json";
  };
  readonly effectiveFinalValidation: RequiredFinalValidationV1;
  readonly finalValidation: {
    readonly configurationKey: "rpiv.final_validation";
    readonly grammar: "just <declared-root-recipe>";
    readonly defaultCommand: "just verify";
    readonly snapshotRule: string;
    readonly focusedRule: string;
    readonly legacyRule: string;
  };
  readonly progress: {
    readonly schema: "RpivStatusV1";
    readonly phases: readonly RpivPhase[];
    readonly statuses: readonly RpivProgressStatus[];
    readonly classifications: readonly string[];
    readonly semantics: string;
  };
  readonly result: {
    readonly schema: "AgentResultV1";
    readonly owner: "Verifier";
    readonly timing: string;
    readonly requiredIdentity: readonly string[];
    readonly publication: string;
    readonly coordinatorGate: string;
  };
  readonly atomicity: string;
  readonly redaction: string;
  readonly ownership: string;
}

export function integrationContract(
  finalValidation: RequiredFinalValidationV1,
): IntegrationContractV1 {
  return {
    schemaVersion: 1,
    command: "soft-factory instructions [--json]",
    paths: {
      progress: ".soft-factory/rpiv-status.json",
      result: ".soft-factory/agent-result.json",
    },
    effectiveFinalValidation: finalValidation,
    finalValidation: {
      configurationKey: "rpiv.final_validation",
      grammar: "just <declared-root-recipe>",
      defaultCommand: "just verify",
      snapshotRule:
        "Each new run validates and snapshots exactly one requirement before ownership; active and recovered runs use only that snapshot.",
      focusedRule:
        "just verify-focused is optional implementation feedback and is never completion proof.",
      legacyRule:
        "Supported v1-v3 snapshots use sole just verify and never consult current configuration; malformed or unsupported persistence fails safe.",
    },
    progress: {
      schema: "RpivStatusV1",
      phases: PHASES,
      statuses: ["running", ...TERMINAL_STATUSES],
      classifications: [
        "PROGRESS_MISSING",
        "PROGRESS_EMPTY",
        "PROGRESS_INVALID",
        "PROGRESS_REQUIRED_FIELD_MISSING",
        "PROGRESS_VERSION_UNSUPPORTED",
        "PROGRESS_IDENTITY_MISMATCH",
        "PROGRESS_STALE",
        "PROGRESS_REGRESSED",
        "PROGRESS_REPEATED",
        "PROGRESS_CONFLICT",
        "PROGRESS_LATE",
        "PROGRESS_VALID",
      ],
      semantics:
        "Progress is mutable non-authorizing diagnostics; every failure publishes terminal failed before nonzero exit, and only the exact next forward transition mutates progress. Unknown, stale, regressed, repeated, conflicting, identity-invalid, and late facts are rejected with stable nonzero codes and never authorize ownership, processes, recovery, cleanup, or completion.",
    },
    result: {
      schema: "AgentResultV1",
      owner: "Verifier",
      timing:
        "Publish only after acceptance, the snapshotted final validation, pull-request creation/update, every verification summary and retro commit is pushed, and the pull request is independently confirmed at the final head.",
      requiredIdentity: [
        "issueNumber",
        "branch",
        "headSha",
        "prNumber",
        "outcome",
        "acceptanceCriteria",
        "requiredFinalValidation",
        "completedAt",
      ],
      publication:
        "Bind the candidate to the independently observed one open pull request for the owned branch and final head, reject candidate PR mismatch, then use same-directory synced no-clobber atomic installation; an existing valid byte-equivalent result is idempotent and is never replaced.",
      coordinatorGate:
        "The coordinator validates the owned artifact against the injected binding before zero exit; no valid final artifact means no successful RPIV exit.",
    },
    atomicity:
      "Writers sync a complete same-directory temporary file and atomically publish; readers observe only the prior or new complete artifact.",
    redaction:
      "Instructions, progress, results, status, list, errors, snapshots, events, and launch facts exclude configured Copilot environment names and values.",
    ownership:
      "Runner owns snapshots, operational state, reconciliation, recovery, control, and cleanup; RPIV owns only bound progress publication and the Verifier-owned immutable result handoff.",
  };
}

export function renderIntegrationInstructions(
  contract: IntegrationContractV1,
  json: boolean,
): string {
  if (json) return JSON.stringify(contract, null, 2) + "\n";
  return (
    [
      "Soft Factory Runner RPIV IntegrationContractV1 (schema 1)",
      "Command: " + contract.command,
      "Owned progress path: <owned-worktree>/" + contract.paths.progress,
      "Owned final-result path: <owned-worktree>/" + contract.paths.result,
      "Effective new-run final validation: " +
        contract.effectiveFinalValidation.command,
      "Configuration: " +
        contract.finalValidation.configurationKey +
        " = " +
        contract.finalValidation.grammar +
        "; absent defaults to " +
        contract.finalValidation.defaultCommand +
        ".",
      "Snapshot: " + contract.finalValidation.snapshotRule,
      "Focused validation: " + contract.finalValidation.focusedRule,
      "Legacy compatibility: " + contract.finalValidation.legacyRule,
      "Progress phases: " + contract.progress.phases.join(" -> "),
      "Progress statuses: " + contract.progress.statuses.join(", "),
      "Progress classifications: " +
        contract.progress.classifications.join(", "),
      "Progress semantics: " + contract.progress.semantics,
      "Result owner: " + contract.result.owner,
      "Result timing: " + contract.result.timing,
      "Result identity/evidence: " +
        contract.result.requiredIdentity.join(", "),
      "Result publication: " + contract.result.publication,
      "Coordinator gate: " + contract.result.coordinatorGate,
      "Atomicity: " + contract.atomicity,
      "Redaction: " + contract.redaction,
      "Ownership: " + contract.ownership,
    ].join("\n") + "\n"
  );
}

export function integrationLaunch(input: {
  readonly runId: string;
  readonly attempt: number;
  readonly issueNumber: number;
  readonly branch: string;
  readonly worktreePath: string;
  readonly startedAt?: string;
  readonly requiredFinalValidation: RequiredFinalValidationV1;
}): IntegrationLaunchV1 {
  const progressPath = path.join(
    input.worktreePath,
    ".soft-factory",
    "rpiv-status.json",
  );
  const resultPath = path.join(
    input.worktreePath,
    ".soft-factory",
    "agent-result.json",
  );
  const issue = String(input.issueNumber);
  return {
    schemaVersion: 1,
    runId: input.runId,
    attempt: input.attempt,
    issueNumber: input.issueNumber,
    branch: input.branch,
    startedAt: input.startedAt ?? "1970-01-01T00:00:00.000Z",
    progressPath,
    resultPath,
    requiredFinalValidation: input.requiredFinalValidation,
    publishProgressCommand:
      "soft-factory internal publish-progress --issue " +
      issue +
      " --phase <phase> --status <status>",
    publishResultCommand:
      "soft-factory internal publish-result --issue " +
      issue +
      " --candidate .soft-factory/agent-result.candidate.json",
    validateResultCommand:
      "soft-factory internal validate-result --issue " + issue,
  };
}

export function parseRpivStatus(text: string): RpivStatusV1 {
  if (text.length === 0)
    throw progressError("PROGRESS_EMPTY", "RPIV progress artifact is empty.");
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (cause: unknown) {
    throw progressError(
      "PROGRESS_INVALID",
      "RPIV progress artifact is not valid JSON.",
      cause,
    );
  }
  if (!record(value))
    throw progressError(
      "PROGRESS_INVALID",
      "RPIV progress artifact must be an object.",
    );
  if (value.schemaVersion !== 1)
    throw progressError(
      "PROGRESS_VERSION_UNSUPPORTED",
      "RPIV progress schema is unsupported.",
    );
  const missing = STATUS_KEYS.filter((key) => !(key in value));
  if (missing.length > 0)
    throw progressError(
      "PROGRESS_REQUIRED_FIELD_MISSING",
      "RPIV progress artifact lacks required fields.",
    );
  if (
    !exactKeys(value, STATUS_KEYS) ||
    typeof value.runId !== "string" ||
    value.runId === "" ||
    !positive(value.attempt) ||
    !positive(value.issueNumber) ||
    typeof value.branch !== "string" ||
    value.branch === "" ||
    !positive(value.sequence) ||
    !PHASES.includes(value.phase as RpivPhase) ||
    (value.phase === "terminal"
      ? !TERMINAL_STATUSES.includes(value.status as RpivProgressStatus)
      : value.status !== "running") ||
    typeof value.updatedAt !== "string" ||
    !ISO_TIME.test(value.updatedAt) ||
    !Number.isFinite(Date.parse(value.updatedAt))
  )
    throw progressError(
      "PROGRESS_INVALID",
      "RPIV progress artifact contains invalid fields.",
    );
  return value as unknown as RpivStatusV1;
}

export function classifyProgress(input: {
  readonly text: string | null;
  readonly snapshot: RunSnapshot;
  readonly observedAt: string;
}): ProgressObservationV1 {
  const lastAccepted =
    input.snapshot.schemaVersion === 4 ? input.snapshot.progress : null;
  if (input.text === null)
    return progressObservation("PROGRESS_MISSING", null, lastAccepted);
  let observed: RpivStatusV1;
  try {
    observed = parseRpivStatus(input.text);
  } catch (cause: unknown) {
    if (!(cause instanceof RunnerError)) throw cause;
    return progressObservation(
      cause.code as ProgressObservationV1["classification"],
      null,
      lastAccepted,
    );
  }
  if (
    observed.runId !== input.snapshot.runId ||
    observed.issueNumber !== input.snapshot.issueNumber ||
    observed.branch !== input.snapshot.branch ||
    ((input.snapshot.schemaVersion === 3 ||
      input.snapshot.schemaVersion === 4) &&
      observed.attempt !== input.snapshot.attempt)
  )
    return progressObservation(
      "PROGRESS_IDENTITY_MISMATCH",
      observed,
      lastAccepted,
    );
  const launchTime =
    input.snapshot.schemaVersion === 4
      ? input.snapshot.integrationLaunch.startedAt
      : input.snapshot.updatedAt;
  if (
    Date.parse(observed.updatedAt) < Date.parse(launchTime) ||
    Date.parse(observed.updatedAt) > Date.parse(input.observedAt)
  )
    return progressObservation("PROGRESS_STALE", observed, lastAccepted);
  if (lastAccepted !== null && observed.sequence === lastAccepted.sequence)
    return progressObservation(
      same(observed, lastAccepted) ? "PROGRESS_REPEATED" : "PROGRESS_CONFLICT",
      observed,
      lastAccepted,
    );
  const acceptedResult =
    input.snapshot.schemaVersion === 1
      ? false
      : input.snapshot.finalization?.result !== null &&
        input.snapshot.finalization?.result !== undefined;
  if (
    input.snapshot.state === "completed" ||
    acceptedResult ||
    lastAccepted?.phase === "terminal"
  )
    return progressObservation("PROGRESS_LATE", observed, lastAccepted);
  if (lastAccepted === null) {
    if (
      observed.sequence !== 1 ||
      (observed.phase !== "research" &&
        !(observed.phase === "terminal" && observed.status !== "succeeded"))
    )
      return progressObservation("PROGRESS_CONFLICT", observed, lastAccepted);
    return validProgress(observed);
  }
  if (
    observed.sequence < lastAccepted.sequence ||
    PHASES.indexOf(observed.phase) < PHASES.indexOf(lastAccepted.phase) ||
    Date.parse(observed.updatedAt) < Date.parse(lastAccepted.updatedAt)
  )
    return progressObservation("PROGRESS_REGRESSED", observed, lastAccepted);
  if (observed.sequence !== lastAccepted.sequence + 1)
    return progressObservation("PROGRESS_CONFLICT", observed, lastAccepted);
  if (observed.phase === "terminal") {
    if (observed.status === "succeeded" && lastAccepted.phase !== "verify")
      return progressObservation("PROGRESS_CONFLICT", observed, lastAccepted);
    return validProgress(observed);
  }
  if (PHASES.indexOf(observed.phase) !== PHASES.indexOf(lastAccepted.phase) + 1)
    return progressObservation("PROGRESS_CONFLICT", observed, lastAccepted);
  return validProgress(observed);
}

export async function publishProgress(
  files: FilePort,
  launch: IntegrationLaunchV1,
  snapshot: RunSnapshot,
  phase: RpivPhase,
  status: RpivProgressStatus,
  now: string,
): Promise<RpivStatusV1> {
  const priorText = await files.readText(launch.progressPath);
  const lastAccepted = snapshot.schemaVersion === 4 ? snapshot.progress : null;
  if (
    lastAccepted !== null &&
    lastAccepted.phase === phase &&
    lastAccepted.status === status
  )
    throwProgressObservation(
      progressObservation("PROGRESS_REPEATED", lastAccepted, lastAccepted),
    );
  if (lastAccepted === null) {
    if (priorText !== null) {
      const prior = classifyProgress({
        text: priorText,
        snapshot,
        observedAt: now,
      });
      throwProgressObservation(
        prior.classification === "PROGRESS_VALID"
          ? progressObservation("PROGRESS_CONFLICT", prior.observed, null)
          : prior,
      );
    }
  } else {
    const prior = classifyProgress({
      text: priorText,
      snapshot,
      observedAt: now,
    });
    if (
      prior.classification !== "PROGRESS_REPEATED" ||
      !same(prior.observed, lastAccepted)
    )
      throwProgressObservation(prior);
  }
  const next: RpivStatusV1 = {
    schemaVersion: 1,
    runId: launch.runId,
    attempt: launch.attempt,
    issueNumber: launch.issueNumber,
    branch: launch.branch,
    sequence: (lastAccepted?.sequence ?? 0) + 1,
    phase,
    status,
    updatedAt: now,
  };
  const classification = classifyProgress({
    text: JSON.stringify(next),
    snapshot,
    observedAt: now,
  });
  if (classification.classification !== "PROGRESS_VALID")
    throwProgressObservation(classification);
  await files.atomicWrite(
    launch.progressPath,
    JSON.stringify(next, null, 2) + "\n",
  );
  return next;
}

function validProgress(observed: RpivStatusV1): ProgressObservationV1 {
  return {
    classification: "PROGRESS_VALID",
    phase: observed.phase,
    observed,
    lastAccepted: observed,
  };
}

function throwProgressObservation(observation: ProgressObservationV1): never {
  throw new RunnerError(
    observation.classification,
    "RPIV progress transition was rejected before publication.",
    "Preserve the last accepted progress and publish only the next bound transition.",
    { details: { classification: observation.classification } },
  );
}

export interface LocalResultBinding {
  readonly issueNumber: number;
  readonly branch: string;
  readonly headSha: string;
  readonly prNumber: number;
  readonly requiredAcceptanceCriteria: readonly RequiredAcceptanceCriterionV1[];
  readonly requiredFinalValidation: RequiredFinalValidationV1;
}

export function validateBoundResult(
  text: string | null,
  binding: LocalResultBinding,
): AgentResultV1 {
  const result = parseAgentResult(text);
  if (
    result.issueNumber !== binding.issueNumber ||
    result.branch !== binding.branch ||
    result.headSha !== binding.headSha ||
    result.prNumber !== binding.prNumber
  )
    throw new RunnerError(
      "RESULT_IDENTITY_MISMATCH",
      "AgentResultV1 does not match the injected run identity.",
      "Publish the exact bound issue, branch, final head, and pull request.",
    );
  if (result.outcome !== "succeeded")
    throw new RunnerError(
      "RESULT_OUTCOME_MISMATCH",
      "AgentResultV1 is not a successful outcome.",
      "Return nonzero for unsuccessful verification.",
    );
  for (const expected of binding.requiredAcceptanceCriteria) {
    const matches = result.acceptanceCriteria.filter(
      (entry) => entry.id === expected.id,
    );
    if (
      matches.length !== 1 ||
      matches[0]?.status !== "verified" ||
      matches[0].evidence.length === 0
    )
      throw new RunnerError(
        "RESULT_ACCEPTANCE_MISMATCH",
        "AgentResultV1 acceptance evidence is incomplete.",
        "Bind every required acceptance ID exactly once with verified evidence.",
      );
  }
  if (
    result.requiredFinalValidation.command !==
      binding.requiredFinalValidation.command ||
    result.requiredFinalValidation.status !== "passed" ||
    result.requiredFinalValidation.evidence.length === 0
  )
    throw new RunnerError(
      "RESULT_FINAL_VALIDATION_MISMATCH",
      "AgentResultV1 final-validation evidence does not match the snapshot.",
      "Run and bind the injected snapshotted final validation.",
    );
  return result;
}

export async function publishAgentResult(
  files: FilePort,
  destination: string,
  candidateText: string,
  binding: LocalResultBinding,
): Promise<AgentResultV1> {
  const parsed = validateBoundResult(candidateText, binding);
  const normalized = JSON.stringify(parsed, null, 2) + "\n";
  const existing = await files.readText(destination);
  if (existing !== null) {
    const existingParsed = validateBoundResult(existing, binding);
    if (JSON.stringify(existingParsed) === JSON.stringify(parsed))
      return existingParsed;
    throw new RunnerError(
      "RESULT_ALREADY_EXISTS",
      "Immutable AgentResultV1 already exists with different content.",
      "Preserve the existing result and return nonzero.",
    );
  }
  const installed =
    files.immutableWrite === undefined
      ? await files.exclusiveCreate(destination, normalized)
      : await files.immutableWrite(destination, normalized);
  if (!installed)
    throw new RunnerError(
      "RESULT_ALREADY_EXISTS",
      "Immutable AgentResultV1 won the publication race.",
      "Validate the existing owned result; never replace it.",
    );
  return validateBoundResult(await files.readText(destination), binding);
}

function progressObservation(
  classification: ProgressObservationV1["classification"],
  observed: RpivStatusV1 | null,
  lastAccepted: RpivStatusV1 | null,
): ProgressObservationV1 {
  return {
    classification,
    phase:
      lastAccepted?.phase ??
      (classification === "PROGRESS_VALID" && observed !== null
        ? observed.phase
        : "unknown"),
    observed,
    lastAccepted,
  };
}
function progressError(
  code: ProgressObservationV1["classification"],
  message: string,
  cause?: unknown,
): RunnerError {
  return new RunnerError(
    code,
    message,
    "Publish one complete identity-bound RpivStatusV1 through the injected helper.",
    { cause },
  );
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function positive(value: unknown): boolean {
  return Number.isSafeInteger(value) && (value as number) > 0;
}
function exactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return same(Object.keys(value).sort(), [...keys].sort());
}
function same(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
