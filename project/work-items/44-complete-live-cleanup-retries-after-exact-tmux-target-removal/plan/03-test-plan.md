# Test Plan: Complete live cleanup retries after exact tmux target removal

## Test V-1: Classify exact live-adapter missing-target bytes

- **Type:** Unit / adapter matrix
- **Task:** T-1
- **Acceptance Criteria:** AC-1, AC-7, AC-11
- **Priority:** Critical

### Setup
Inject a byte-aware `CommandRunner` and socket identity reader into the live tmux port. Provide persisted pane/window/session selectors, repository-root execution cwd, and finite command results.

### Steps
1. Run one row for each exact LF-terminated `can't find pane`, `can't find window`, and `can't find session` record with the matching persisted selector, zero stdout, complete streams, and equal before/after socket identity.
2. Run strict near misses: wrong selector, wrong case/text, missing/extra LF, CRLF, extra record/bytes, stdout data, invalid UTF-8, truncation, alternate nonzero, timeout/spawn failure, socket loss, and device/inode replacement.
3. Assert explicit socket arguments, one call, 15-second bound, stable repository cwd, and value-free typed results.

### Expected Result
Only the three exact accepted rows produce their bounded missing-target category. Every other row is non-authorizing and no raw values escape.

### Expected Evidence
Inspectable row table with category, call count, byte/truncation facts, socket comparison, and forbidden-sentinel scan.

## Test V-2: Enforce checkpoint gate and zero-mutation refusal matrices

- **Type:** Unit / reconciliation matrix
- **Task:** T-2, T-4
- **Acceptance Criteria:** AC-1, AC-6, AC-7, AC-10, AC-11
- **Priority:** Critical

### Setup
Create same-owner/run v6 snapshots with and without exact tmux started/completed checkpoints. Snapshot finite owned and unrelated resource inventories and inject typed adapter outcomes from V-1.

### Steps
1. Combine each accepted category with exact checkpoint plus unchanged identity and assert complete absence.
2. Repeat accepted categories before checkpoint and with foreign/run-mismatched/checkpoint-identity-mismatched progress.
3. Exercise changed/unavailable identity, replacement/mismatched target, malformed/truncated responses, spawn/timeout, and every finite nonaccepted nonzero category.
4. Invoke reconcile and clean; compare run state and all inventories byte-for-byte.

### Expected Result
Only exact same-owner/run checkpoint plus identity-stable accepted category becomes `TMUX_ABSENT`. Every other row refuses cleanup with zero mutation.

### Expected Evidence
Matrix keyed by checkpoint/category/identity with decision code, safe actions, mutation trace, and before/after hashes or bytes.

## Test V-3: Complete remaining lease and lock while retaining evidence

- **Type:** Integration / persistence
- **Task:** T-2, T-4
- **Acceptance Criteria:** AC-2, AC-3, AC-11
- **Priority:** Critical

### Setup
Persist a terminal same-owner/run snapshot and history where tmux and worktree are completed, exact tmux checkpoint exists, lease and lock remain, the exact target/worktree are absent, and branch/snapshot/events/log including a terminal marker are present.

### Steps
1. Invoke clean with accepted identity-stable missing-target observation.
2. Inspect compare-delete order, transitions, completed and remaining steps, and retained resources.
3. Invoke clean again and compare mutation/event/revision traces.

### Expected Result
First retry releases exact lease then lock and reports `CLEANUP_COMPLETED`; second reports `CLEANUP_ALREADY_COMPLETED` with no repeated removal or transition. Branch, snapshot, events, logs, and terminal marker remain.

### Expected Evidence
Ordered mutation/event trace, final CleanupFactsV1, idempotence diff, and retained-resource byte inventory.

## Test V-4: Keep human and JSON cleanup meaning confidential

- **Type:** Contract / rendering
- **Task:** T-3, T-4
- **Acceptance Criteria:** AC-4, AC-6, AC-7, AC-8, AC-11
- **Priority:** High

### Setup
Prepare success, already-complete, lease-partial, lock-partial, pre-checkpoint, changed/unavailable identity, replacement/mismatch, malformed/truncated, and nonaccepted-category outcomes containing private sentinels.

### Steps
1. Render each outcome in human and JSON modes.
2. Parse/normalize eligibility, outcome, completed/remaining categories, refusal, remediation, and exit meaning.
3. Scan both forms for socket path, tmux selectors, cwd, PIDs, raw external output, private persisted fields, and unrelated sentinels.

### Expected Result
Both forms agree semantically for every row and contain no forbidden value.

### Expected Evidence
Equivalence table, stable exit assertions, and empty confidentiality scan.

## Test V-5: Retry bounded lease and lock failures safely

- **Type:** Integration / fault injection
- **Task:** T-2, T-4
- **Acceptance Criteria:** AC-8, AC-11
- **Priority:** Critical

### Setup
Start from the V-3 partial state and inject failures before/after lease compare-delete, lease completion persistence, lock compare-delete, and lock completion persistence, including event-ahead/snapshot-behind recovery.

### Steps
1. Invoke cleanup for each failure boundary and inspect returned/persisted completed and remaining categories.
2. Remove the fault and retry.
3. Compare final state to uninterrupted cleanup and count each destructive operation.
4. Repeat replacement rows for lease and lock identities.

### Expected Result
Every interruption returns truthful non-success with safe remediation; retry converges to the uninterrupted final state; each authorized resource is removed at most once; replacements are preserved and refused.

### Expected Evidence
Fault matrix, partial and recovered snapshots/events, mutation counts, replacement inventories, and final-state equality.

## Test V-6: Bound cleanup overlaps without mixed observations

- **Type:** Concurrency / deterministic barriers
- **Task:** T-2, T-4
- **Acceptance Criteria:** AC-9, AC-11
- **Priority:** Critical

### Setup
Use deterministic barriers around exact target removal and cleanup progress persistence. Seed finite unrelated tmux/worktree/lease/lock/run/replacement inventories.

### Steps
1. Run cleanup/retry overlap from the partial state.
2. Run cleanup/status while the exact target is still complete and while checkpoint-proved absence is visible.
3. Run cleanup/reconcile at the same boundaries.
4. Settle each overlap under a 30-second outer deadline, then call cleanup, status, and reconcile again.

### Expected Result
Every read shows one complete persisted target or complete checkpoint-proved absence, never mixed fields. Final commands agree on absent target and completed cleanup. Unrelated inventories are byte-identical.

### Expected Evidence
Barrier trace, per-read classification, elapsed times below 30 seconds, final agreement table, and unrelated inventory comparison.

## Test V-7: Reproduce full retry through the real live tmux adapter

- **Type:** Repository-local functional integration
- **Task:** T-1, T-2, T-4
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-9, AC-10, AC-11
- **Priority:** Critical

### Setup
Create an exclusive temporary directory, private custom tmux socket/session, unrelated isolated socket inventory, owned remain-on-exit dead window, temporary Runner store, exact lock/lease, worktree, branch, snapshot/events/log paths, and terminal marker. Require no credentials, network, production access, Sparkta, or ambient/default tmux.

### Steps
1. Capture terminal evidence, persist exact tmux checkpoint, remove the immutable window and worktree, and leave lease/lock remaining.
2. Invoke cleanup through `IssueRunService` and the real `LiveTmuxPort`; record the original-byte missing-target category and unchanged socket identity.
3. Verify only lease and lock are released and call cleanup again.
4. Exercise controlled status/reconcile overlap and compare unrelated inventories.
5. In unconditional teardown, remove only fixture-owned servers/tree and prove no residual process/socket/path.

### Expected Result
The real response is accepted only through checkpoint proof, cleanup completes remaining steps, evidence remains, repeat is idempotent, overlaps converge, unrelated/ambient resources do not change, and teardown is complete.

### Expected Evidence
Real command/result category, socket before/after identity, cleanup transition and mutation trace, retained marker, idempotence result, resource inventories, and teardown proof.

## Test V-8: Prove beta.3 finite release and dependency inventory

- **Type:** Repository / package / documentation
- **Task:** T-5, T-6
- **Acceptance Criteria:** AC-5, AC-11
- **Priority:** Critical

### Setup
Resolve the issue-start main merge base. Enumerate package/root lock versions, official asset constant/generated manifest, finite fixture assertions, README/docs release and cleanup guidance, and a temporary package destination/prefix.

### Steps
1. Assert every current governed surface equals `0.2.1-beta.3` and prerelease history remains truthful.
2. Run local `npm pack --dry-run --json`, create the tarball, install it into a clean temporary prefix with scripts/audit/fund disabled, and inspect packed/installed metadata and files.
3. Generate/reconverge official asset metadata locally.
4. Compare package dependency declarations and all non-root lock package metadata to main at issue start.
5. Assert docs describe checkpoint gating, retries, retention, refusal, no publication/production access, and deferred visible Sparkta recovery.

### Expected Result
All finite surfaces and local artifacts report beta.3; dependencies and resolved metadata equal main; no publication, network service, production, or Sparkta action occurs.

### Expected Evidence
Path/version inventory, dry-run/pack/install JSON, generated manifest, dependency equality report, and documentation assertions.

## Test V-9: Pass focused and full repository gates

- **Type:** Validation / acceptance
- **Task:** T-6
- **Acceptance Criteria:** AC-5, AC-11
- **Priority:** Critical

### Setup
Implementation and tests are complete; repository-owned fixture resources are absent. Read `harness instructions checks` before optional delegating harness checks.

### Steps
1. Run focused Jest paths for live tmux, reconciliation/recovery control, rendering, package, and documentation tests.
2. Run `just verify-focused` and `just verify` directly.
3. Optionally run `harness checks --focused --json` and `harness checks --json` as delegating evidence.
4. Review outputs against AC-1 through AC-11 and confirm no residual fixture resources or changed dependency metadata.

### Expected Result
Every command exits successfully, coverage remains at least 80%, and the evidence index has no acceptance gap.

### Expected Evidence
Command logs/envelopes, test counts and coverage summary, clean fixture inventory, dependency report, and AC-1..AC-11 evidence index.
