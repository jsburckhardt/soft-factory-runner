import type { ConcurrencyLeaseV1, OwnerRecordV1 } from "./domain";
import { isRunnerError, RunnerError } from "./errors";
import { RunStore } from "./persistence";

export interface AdmissionResultV1 {
  readonly lease: ConcurrencyLeaseV1;
  readonly occupiedSlots: readonly number[];
}

export async function claimConcurrencySlot(input: {
  readonly store: RunStore;
  readonly owner: OwnerRecordV1;
  readonly maxConcurrentRuns: number;
  readonly acquiredAt: string;
  readonly rollbackOwnerOnFailure?: boolean;
}): Promise<AdmissionResultV1> {
  let occupied: readonly ConcurrencyLeaseV1[];
  try {
    occupied = await input.store.enumerateLeases();
  } catch (cause: unknown) {
    if (!isRunnerError(cause)) throw cause;
    if (input.rollbackOwnerOnFailure !== false)
      await rollbackOwner(input.store, input.owner);
    throw new RunnerError(
      "CONCURRENCY_STATE_UNKNOWN",
      "Concurrency lease records could not be observed safely.",
      "Preserve malformed or unknown leases and repair exact ownership before admission.",
      { cause },
    );
  }
  const aboveLimit = occupied.find(
    (lease) => lease.slot > input.maxConcurrentRuns,
  );
  if (aboveLimit !== undefined) {
    if (input.rollbackOwnerOnFailure !== false)
      await rollbackOwner(input.store, input.owner);
    throw new RunnerError(
      "CONCURRENCY_STATE_UNKNOWN",
      `Slot ${aboveLimit.slot} remains occupied above configured limit ${input.maxConcurrentRuns}.`,
      "Restore the previous limit or reconcile and release the exact inactive lease.",
      { details: { occupiedSlots: occupied.map((lease) => lease.slot) } },
    );
  }
  for (let slot = 1; slot <= input.maxConcurrentRuns; slot += 1) {
    const lease: ConcurrencyLeaseV1 = {
      schemaVersion: 1,
      slot,
      issueNumber: input.owner.issueNumber,
      ownerId: input.owner.ownerId,
      runId: input.owner.runId,
      repository: input.owner.repository,
      configuredLimit: input.maxConcurrentRuns,
      acquiredAt: input.acquiredAt,
    };
    if (await input.store.acquireLease(lease)) {
      return {
        lease,
        occupiedSlots: [...occupied.map((entry) => entry.slot), slot].sort(
          (left, right) => left - right,
        ),
      };
    }
  }
  if (input.rollbackOwnerOnFailure !== false)
    await rollbackOwner(input.store, input.owner);
  throw new RunnerError(
    "CONCURRENCY_LIMIT_REACHED",
    `Issue #${input.owner.issueNumber} cannot start because all ${input.maxConcurrentRuns} concurrency slots are occupied.`,
    "Wait for an explicitly requested active issue to become inactive; Runner does not select or queue another issue.",
    {
      details: {
        issueNumber: input.owner.issueNumber,
        configuredLimit: input.maxConcurrentRuns,
      },
    },
  );
}

async function rollbackOwner(
  store: RunStore,
  owner: OwnerRecordV1,
): Promise<void> {
  const released = await store.releaseOwner(owner.issueNumber, owner);
  if (!released) {
    throw new RunnerError(
      "CONCURRENCY_STATE_UNKNOWN",
      "Capacity admission failed and the just-created issue lock no longer matched its owner.",
      "Preserve the replacement lock and reconcile ownership before retrying.",
    );
  }
}
