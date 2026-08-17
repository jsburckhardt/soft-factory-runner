import type { ProcessIdentityV1, RunSnapshot, RunSnapshotV6 } from "./domain";
import { isRunnerError, RunnerError } from "./errors";

export type PostWaitRefusalReasonV1 =
  | "missing"
  | "invalid"
  | "run_mismatch"
  | "owner_mismatch"
  | "worker_mismatch"
  | "rpiv_mismatch"
  | "state_advanced";

export interface PostWaitIdentityV1 {
  readonly runId: string;
  readonly ownerId: string;
  readonly workerProcess: ProcessIdentityV1;
  readonly rpivProcess: ProcessIdentityV1;
}

export type PostWaitDecisionV1 =
  | { readonly kind: "active"; readonly snapshot: RunSnapshotV6 }
  | { readonly kind: "terminal"; readonly snapshot: RunSnapshotV6 }
  | { readonly kind: "refused"; readonly reason: PostWaitRefusalReasonV1 };

const TERMINAL_STATES = new Set([
  "completed",
  "failed",
  "blocked",
  "cancelled",
  "interrupted",
]);

export function classifyPostWaitState(
  current: RunSnapshot,
  expected: PostWaitIdentityV1,
): PostWaitDecisionV1 {
  if (current.schemaVersion !== 6) return refused("invalid");
  if (current.runId !== expected.runId) return refused("run_mismatch");
  if (current.ownerId !== expected.ownerId) return refused("owner_mismatch");
  if (!same(current.workerProcess, expected.workerProcess))
    return refused("worker_mismatch");
  if (TERMINAL_STATES.has(current.state))
    return { kind: "terminal", snapshot: current };
  if (current.state !== "running_rpiv") return refused("invalid");
  if (!same(current.rpivProcess, expected.rpivProcess))
    return refused("rpiv_mismatch");
  return { kind: "active", snapshot: current };
}

export function postWaitRefusal(
  reason: PostWaitRefusalReasonV1,
  cause?: unknown,
): RunnerError {
  const causeCode = isRunnerError(cause) ? cause.code : undefined;
  return new RunnerError(
    "POST_WAIT_STATE_REFUSED",
    `Post-wait state handling was refused: ${reason}.`,
    "Inspect the current run history and retry only after exact ownership and identity are restored.",
    {
      details: causeCode === undefined ? { reason } : { reason, causeCode },
      cause,
    },
  );
}

function refused(reason: PostWaitRefusalReasonV1): PostWaitDecisionV1 {
  return { kind: "refused", reason };
}

function same(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
