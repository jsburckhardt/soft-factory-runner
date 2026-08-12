export interface AgentContractResult {
  readonly valid: boolean;
  readonly missing: readonly string[];
  readonly forbidden: readonly string[];
}

export const OPERATOR_REQUIRED_DELEGATIONS = Object.freeze([
  "soft-factory run --issue <number>",
  "soft-factory doctor --json",
  "soft-factory list --json",
  "soft-factory status <issue> --json",
  "soft-factory attach <issue>",
  "soft-factory logs <issue> --json",
  "soft-factory reconcile <issue> --json",
  "soft-factory resume <issue> --json",
  "soft-factory stop <issue> --json",
  "soft-factory clean <issue> --json",
]);
export const OPERATOR_REQUIRED_PROHIBITIONS = Object.freeze([
  "never select, rank, queue, or infer an issue",
  "Do not manually create, reuse, move, or delete worktrees",
  "Do not acquire, alter, infer, or remove Runner locks or concurrency leases",
  "Do not directly read or write Runner snapshots, events, state, or result files",
  "Do not directly launch, signal, replace, or kill Runner-owned tmux or process resources",
  "Do not perform manual cleanup or bypass ownership and invariant checks",
  "Do not infer completion from prose, terminal output, or process exit alone",
  "Do not override a structured Runner refusal",
]);
export const ASSESSOR_REQUIRED_AUTHORITY = Object.freeze([
  "Invoke exactly `soft-factory doctor --json`",
  "Consume the complete Doctor result",
  "preserve its top-level `ready` value",
  "only readiness authority",
  "Do not independently infer READY",
  "Do not infer READY from incomplete, malformed, failed, or partial Doctor output",
  "Do not bypass, ignore, replace, or override a failed Doctor check",
  "Do not assess, select, rank, or execute a GitHub issue",
]);
const FORBIDDEN_BYPASS_MARKERS = Object.freeze([
  "BYPASS_RUNNER_INVARIANTS",
  "BYPASS_DOCTOR_READINESS",
  "DIRECT_RUNNER_STATE_WRITE_ALLOWED",
]);

function check(text: string, required: readonly string[]): AgentContractResult {
  const missing = required.filter((phrase) => !text.includes(phrase));
  const forbidden = FORBIDDEN_BYPASS_MARKERS.filter((marker) =>
    text.includes(marker),
  );
  return {
    valid: missing.length === 0 && forbidden.length === 0,
    missing,
    forbidden,
  };
}

export function checkOperatorContract(text: string): AgentContractResult {
  return check(text, [
    ...OPERATOR_REQUIRED_DELEGATIONS,
    ...OPERATOR_REQUIRED_PROHIBITIONS,
  ]);
}

export function checkAssessorContract(text: string): AgentContractResult {
  return check(text, ASSESSOR_REQUIRED_AUTHORITY);
}
