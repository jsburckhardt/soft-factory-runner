# Test Plan: Reload Current Run State After Copilot Exits

## Test V-1: Held zero exit consumes current advanced snapshot

- **Type:** Deterministic service concurrency regression
- **Task:** T-2, T-3
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-7
- **Priority:** Critical

### Setup
Create one run with a deferred Copilot wait. Preserve a strict immutable result; while wait is held, publish research, plan, implement, verify, and terminal progress and run one controlled malformed-tmux reconciliation that persists a retained diagnostic.

### Steps
1. Start worker and wait for the fake process to reach the deferred wait.
2. Advance the same run through all required progress and diagnostic revisions.
3. Capture result bytes, accepted evidence, snapshot, and event ledger.
4. Resolve wait with exit 0 and await worker completion under a finite timeout.
5. Reload snapshot/history and compare evidence.

### Expected Result
Worker reloads after wait, exact identities match, `finalizing` begins at the next durable revision, strict reconciliation completes, revisions are unique and contiguous, and there is one Copilot launch.

### Expected Evidence
Completed snapshot; ordered revision list; reload-after-wait trace; unchanged result/progress/diagnostic facts; one launch; no overwrite.

## Test V-2: Held nonzero exit consumes current advanced snapshot

- **Type:** Deterministic service concurrency regression
- **Task:** T-2, T-3
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-8
- **Priority:** Critical

### Setup
Use the V-1 held-wait fixture with the full progress sequence, retained diagnostic, and a strict successful result already present.

### Steps
Advance evidence while held, capture durable bytes, resolve wait with exit 9, and reload snapshot/history under a finite timeout.

### Expected Result
Current revision advances once to `failed` with exit 9 and error history, all earlier evidence remains unchanged, history is contiguous, result is not overwritten, and launch count is one.

### Expected Evidence
Failed snapshot/event, exit 9 facts, full revision ledger, deep evidence equality, immutable result bytes, one launch.

## Test V-3: Exact post-wait identity refusal matrix

- **Type:** Parameterized unit/service regression
- **Task:** T-1, T-3
- **Acceptance Criteria:** AC-1, AC-4, AC-9
- **Priority:** Critical

### Setup
Hold one awaited process and independently replace current run ID, owner ID, one complete worker identity field, or one complete RPIV process identity field after process identity persistence.

### Steps
Resolve each wait, capture JSON error and durable state, and count launch/event/save operations.

### Expected Result
Rows return `POST_WAIT_STATE_REFUSED` with `run_mismatch`, `owner_mismatch`, `worker_mismatch`, or `rpiv_mismatch`; no terminal transition, fallback save, release, or second launch occurs.

### Expected Evidence
Four-row reason table, exit 3 JSON, unchanged newer bytes/history/evidence, and launch count one per row.

## Test V-4: Missing and invalid post-wait state refuse safely

- **Type:** Parameterized negative service test
- **Task:** T-1, T-2, T-3
- **Acceptance Criteria:** AC-4
- **Priority:** High

### Setup
After wait begins, remove the current snapshot in one row and install malformed or unsupported snapshot/history bytes in invalid rows.

### Steps
Resolve wait and capture refusal, store calls, events, and accepted evidence.

### Expected Result
Stable `POST_WAIT_STATE_REFUSED` reasons `missing` or `invalid` preserve the underlying safe cause; no terminal transition, launch, or accepted-evidence mutation occurs.

### Expected Evidence
Machine-readable errors, zero post-wait append/write calls, one initial launch, byte-identical progress/result/diagnostic artifacts.

## Test V-5: Second advance between reload and save is preserved

- **Type:** Deterministic persistence race test
- **Task:** T-1, T-2, T-3
- **Acceptance Criteria:** AC-5, AC-9
- **Priority:** Critical

### Setup
Use a store/file barrier that pauses the post-wait path after its successful reload and before `save`; append one valid current transition through another writer.

### Steps
Release the barrier, let the stale candidate reach `RunStore.save`, and inspect error, latest snapshot, and all events.

### Expected Result
Store rejects noncontiguous save, worker returns `POST_WAIT_STATE_REFUSED/state_advanced`, the second-writer transition remains latest, and no stale or fallback event is appended.

### Expected Evidence
Latest revision/content from second writer, unchanged event count after refusal, typed cause `STATE_HISTORY_INVALID`, no overwrite or renumber.

## Test V-6: Repeated and already-terminal handling is idempotent

- **Type:** Idempotence service test
- **Task:** T-1, T-2, T-3
- **Acceptance Criteria:** AC-6
- **Priority:** High

### Setup
Produce exact completed and failed outcomes, retain exit/finalization/progress/result/diagnostic bytes, then invoke the post-wait decision again with matching run/owner/worker context.

### Steps
Capture snapshot/events/launch count before and after each repeated handling.

### Expected Result
Existing terminal outcome is returned; no launch, exit, finalization, lease-release, or terminal event is appended and all evidence is byte-equivalent.

### Expected Evidence
Same terminal state and bytes, same event line count, same launch count, deep equality for every listed evidence field.

## Test V-7: Snapshot and event history invariants

- **Type:** Persistence invariant test
- **Task:** T-2, T-3
- **Acceptance Criteria:** AC-2, AC-3, AC-7, AC-8
- **Priority:** Critical

### Setup
Consume durable outputs from V-1 and V-2 plus existing replay fixtures.

### Steps
Parse every event, require one event per resulting revision, compare prior/resulting pairs, replay from the initial snapshot, and compare the replayed snapshot to durable latest state.

### Expected Result
No missing, duplicate, conflicting, or out-of-order revision exists; all pre-exit accepted evidence appears unchanged and ordered in every resulting snapshot.

### Expected Evidence
Revision arrays, replay equality, unique-set counts, and evidence field hashes or deep comparisons.

## Test V-8: Documentation and SemVer 0.1.2 inventory

- **Type:** Documentation/package contract validation
- **Task:** T-4, T-5
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6
- **Priority:** High

### Setup
Update affected guides and all finite package release surfaces from current 0.1.1 to PATCH 0.1.2.

### Steps
Run documentation and package/asset focused tests; inspect package dry-run and temporary packed/installed metadata; compare lock dependency sections to baseline.

### Expected Result
Docs state exact post-wait behavior and no API/configuration/schema/data/deployment impact. All governed versions equal 0.1.2 and third-party dependencies do not churn.

### Expected Evidence
Documentation assertions, synchronized version inventory, tarball/install metadata, and dependency diff proof.

## Test V-9: Root authoritative validation

- **Type:** Full repository quality gate
- **Task:** T-5
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9
- **Priority:** Critical

### Setup
Complete T-1 through T-4 and ensure no deferred wait can remain unresolved after a failed test.

### Steps
Run root `just verify-focused` during implementation and root `just verify` before handoff; inspect `git diff --check`, coverage, complete diff, and clean status.

### Expected Result
Lint, format, strict type-check, all Jest suites with at least 80% coverage, build, and diff check pass.

### Expected Evidence
Root recipe transcripts, suite/test and coverage totals, build result, clean status, exact commit SHA, and AC-1 through AC-9 evidence index.
