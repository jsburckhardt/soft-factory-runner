# Test Plan: Allow explicit cleanup of an exact owned tmux window with a dead pane

## Test V-1: Strict exact dead-pane observation

- **Type:** Unit and adapter
- **Task:** T-1
- **Acceptance Criteria:** AC-1, AC-3, AC-10
- **Priority:** Critical

### Setup
Use deterministic original-byte command results for the persisted exact target and instrument the tmux port query.

### Steps
1. Exercise live exact, dead exact with empty current cwd, dead with nonempty cwd, invalid dead flag, incomplete fields, malformed framing/UTF-8, duplicate records, and selector mismatches.
2. Assert one explicit-socket query and no ambient/default selector.
3. Assert dead state does not imply process activity or ownership.

### Expected Result
Only complete live equality and strict complete exact-dead evidence parse; all malformed or contradictory rows become closed unknown/mismatch outcomes without mutation.

### Expected Evidence
Parser row report, bounded query trace, and forbidden-value render scan.

## Test V-2: Cleanup eligibility conjunction

- **Type:** Unit reconciliation
- **Task:** T-2
- **Acceptance Criteria:** AC-1, AC-3, AC-6, AC-10
- **Priority:** Critical

### Setup
Build a terminal v6 run fixture with independently variable lock, lease, worktree/path/branch/HEAD/cleanliness, result, worker, RPIV, and tmux facts.

### Steps
1. Prove exact dead plus every independent fact yields explicit_clean.
2. Toggle each fact to active, nonterminal, dirty, absent without proof, unknown, incomplete, mismatch, or replacement.
3. Exercise live pane, active process, completed result requirements, and interrupted result not-applicable behavior.

### Expected Result
Only the full conjunction is eligible. Every changed required fact returns the existing stable refusal/remediation and zero state/resource mutation.

### Expected Evidence
Finite conjunction table with decision code, safe actions, refusal, and zero-write counters.

## Test V-3: Ordered cleanup, retained transcript, and output parity

- **Type:** Service integration
- **Task:** T-2, T-3
- **Acceptance Criteria:** AC-2, AC-4, AC-8, AC-10
- **Priority:** Critical

### Setup
Create an exactly owned dead-pane fixture with worktree, lease, lock, branch, snapshot, events, retained evidence, and unrelated sentinels.

### Steps
1. Run explicit cleanup and collect before/after observations around each ordered step.
2. Read retained logs after tmux and worktree removal.
3. Render human and JSON success, partial, and refusal views.
4. Run automatic merged cleanup separately.

### Expected Result
Transcript capture precedes tmux removal; exact tmux/worktree/lease/lock transition present to absent; branch/snapshot/events/logs remain; automatic cleanup retains tmux; human/JSON categorical meaning agrees and confidential values never appear.

### Expected Evidence
Ordered transition trace, retained marker text, inventory hashes, parity table, and forbidden-sentinel scan.

## Test V-4: Complete edge-case matrix and no-mutation refusals

- **Type:** Parameterized service
- **Task:** T-2, T-3, T-4
- **Acceptance Criteria:** AC-3, AC-4, AC-6, AC-8, AC-10
- **Priority:** Critical

### Setup
Load a tracked finite scenario table containing every AC-6 row and before-state hashes.

### Steps
1. Run exact dead eligible, live/active refusal, proved tmux-complete continuation, fully complete idempotence, unproved absence refusal, malformed/unavailable/incomplete/mismatch refusal, and unrelated same-name refusal.
2. Compare outcome, exit meaning, category progress, remediation, mutation counters, and required inventories.

### Expected Result
Every row matches its declared outcome; every refusal performs no tmux/worktree/lease/lock/run-state mutation and leaves unrelated inventories byte-identical.

### Expected Evidence
Inspectable scenario manifest and criterion-to-row result table.

## Test V-5: Post-removal interruption and retry checkpoints

- **Type:** Failure-injection integration
- **Task:** T-3, T-4
- **Acceptance Criteria:** AC-2, AC-3, AC-6, AC-7, AC-8, AC-10
- **Priority:** Critical

### Setup
Inject interruption after each tmux, worktree, lease, and lock removal returns and absence is observable, but before completed progress persists.

### Steps
1. Run each interrupted cleanup, inspect the exact started checkpoint and partial resource state, then retry.
2. Compare with uninterrupted final state and count each destructive call.
3. Insert an unrelated replacement before each applicable retry and repeat.

### Expected Result
Normal retries converge with every resource removed at most once. Replacement retries refuse before further mutation and preserve the replacement.

### Expected Evidence
Per-step event/checkpoint history, operation counters, final-state equality, and replacement no-mutation traces.

## Test V-6: Controlled clean/read overlaps

- **Type:** Concurrency integration
- **Task:** T-4
- **Acceptance Criteria:** AC-7, AC-8, AC-10
- **Priority:** High

### Setup
Use deterministic barriers around exact tmux removal for one clean/status overlap and one clean/reconcile overlap, with unrelated inventory sentinels.

### Steps
1. Release each overlap at the selected boundary and impose a 30-second outer timeout on both commands.
2. Inspect the read-side target record, cleanup operation counters, and unrelated inventories.

### Expected Result
Each command finishes within 30 seconds; cleanup removes each authorized resource exactly once; readers report one complete matching target or complete absence, never mixed fields; unrelated inventories remain byte-identical.

### Expected Evidence
Durations, barrier trace, whole-target/absence record, operation counts, and hashes.

## Test V-7: Exact transitions and scoped inventory equality

- **Type:** Deterministic integration
- **Task:** T-3, T-4
- **Acceptance Criteria:** AC-2, AC-3, AC-8, AC-10
- **Priority:** High

### Setup
Inventory exact owned resources, unrelated tmux/worktrees/locks/leases/runs, branch/state, and retained evidence separately.

### Steps
1. Capture finite before inventories.
2. Run eligible cleanup and each refusal family.
3. Capture after inventories and compare only the categories required by AC-8.

### Expected Result
Eligible exact owned resources transition present to absent. Unrelated and retained-evidence inventories are byte-identical. Refusals change nothing. No test requires the complete mutable resource inventory to be equal.

### Expected Evidence
Named before/after bytes and hashes split by exact-owned, unrelated, and retained categories.

## Test V-8: Live isolated remain-on-exit scenario

- **Type:** Live repository integration
- **Task:** T-1, T-3, T-5
- **Acceptance Criteria:** AC-1, AC-2, AC-8, AC-9, AC-10
- **Priority:** Critical

### Setup
Create a temporary repository, explicit isolated owned and unrelated tmux sockets, controlled clock/IDs, exact run resources, and a remain-on-exit pane command that prints a unique marker and exits.

### Steps
1. Wait at a bounded fixture barrier for strict pane-dead state and inspect retained terminal output.
2. Reconcile and explicitly clean through Runner services.
3. Read the marker from retained logs after cleanup.
4. Repeat with equal controlled inputs and compare normalized evidence.

### Expected Result
Both runs produce equal outcome codes, exact transitions, retained/unrelated inventories, and transcript results without credentials, network, external state, or ambient/default tmux mutation.

### Expected Evidence
Live command trace, retained markers, normalized run comparison, isolated inventory hashes, and teardown proof.

## Test V-9: Beta.2 finite package and documentation inventory

- **Type:** Repository and package integration
- **Task:** T-6, T-7
- **Acceptance Criteria:** AC-4, AC-5, AC-10
- **Priority:** Critical

### Setup
Resolve the target-branch merge base and enumerate only authoritative version-bearing package, lock, asset, fixture, packed/installed, release, and user-guidance surfaces.

### Steps
1. Assert every authoritative value is 0.2.1-beta.2 and stale beta.1 current-release references are absent.
2. Run npm pack dry-run, local tarball packing, and clean local installation without registry fetch/publication; inspect installed package and generated asset metadata.
3. Compare package dependency ranges and lock dependency metadata with the merge base.
4. Validate recovery/confidentiality/retry/overlap docs and the deferred Sparkta handoff boundary.

### Expected Result
All governed values agree at beta.2, third-party dependencies are unchanged, local packed/installed evidence agrees, and guidance makes no publication or automated external-recovery claim.

### Expected Evidence
Finite path/value inventory, pack/install JSON metadata, empty dependency diff, and documentation assertions.

## Test V-10: Direct focused and full delivery gates

- **Type:** Validation gate
- **Task:** T-4, T-5, T-6, T-7
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10
- **Priority:** Critical

### Setup
Use the clean exact implementation handoff with no external credentials or services.

### Steps
1. Run direct root just verify-focused and record exit/output.
2. Run direct root just verify and record exit/output.
3. Review the criterion-to-evidence index for every finite matrix row, interruption, overlap, transition, inventory, version surface, and dependency comparison.
4. Confirm the visible Sparkta beta.2 installation and Issue 7 recovery remain a deferred operator checklist.

### Expected Result
Both direct gates exit successfully and inspectable evidence completely covers AC-1 through AC-10. No automated gate accesses Sparkta, a registry, credentials, network state, or ambient tmux.

### Expected Evidence
Exit-zero focused/full logs, test summary, diff hygiene, complete AC evidence index, and separate non-gating operational handoff.
