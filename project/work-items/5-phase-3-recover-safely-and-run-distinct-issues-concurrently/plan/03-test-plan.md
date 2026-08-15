# Test Plan: Phase 3 Interrupted Finalization Recovery Correction

## Test V-13: Composite reported-incident precedence

- **Type:** Reconciliation composition and pure-policy regression
- **Task:** T-10, T-11, T-14
- **Acceptance Criteria:** AC-1, AC-3, AC-8, AC-9, AC-10
- **Priority:** Critical

### Setup
Create one v5 `running_rpiv` snapshot with matching lock/lease/worktree, no worker or RPIV process, terminal succeeded progress repeated against `lastAccepted`, strict immutable successful result with PR number, divergent remote head, and parameterized malformed/absent tmux evidence.

### Steps
1. Reconcile malformed tmux twice.
2. Reconcile valid absent tmux twice.
3. Record result, Git, remote, GitHub, progress, decision, actions, diagnostics, persistence, and adapter counts.
4. Vary progress through all classifications without changing authorizing facts.

### Expected Result
The result is a recovery candidate and its PR is queried once; divergent candidate-head Git/remote/PR facts are visible. Malformed tmux selects `RECONCILIATION_UNKNOWN`; valid absence never authorizes cleanup. Progress changes no decision/action. No state, result, cleanup, or resource is mutated.

### Expected Evidence
Complete redacted report snapshots, one-call counters, equal repeat hashes, unchanged snapshot/event bytes, and zero destructive/launch traces.

## Test V-14: Exact candidate finalization recovery

- **Type:** Orchestration and persistence fault-injection
- **Task:** T-10, T-11, T-12, T-14
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-10
- **Priority:** Critical

### Setup
Use the composite fixture with strict candidate, matching candidate-head worktree/fresh remote/open PR, absent RPIV, absent-or-unrecorded worker, matching ownership, and exact or proved-absent tmux.

### Steps
1. Reconcile and assert `FINALIZATION_RECOVERY_AVAILABLE` with only `retry_finalization`.
2. Resume and inspect transition/event order, attempt, launch counts, final completion proof, and retained ownership.
3. Inject event append and snapshot replacement failures around `running_rpiv -> finalizing`, reload, and retry.
4. Repeat with an exact active RPIV as a precedence control.

### Expected Result
Explicit resume enters finalizing, runs the existing strict finalizer, never increments attempt or launches a process, and completes only after the full conjunction. Event-ahead recovery is deterministic. Exact active RPIV remains `active_preserved`.

### Expected Evidence
Event-before-snapshot trace, zero launch/adoption counts, unchanged attempt, final strict result/Git/remote/PR facts, and replay/idempotency assertions.

## Test V-15: Candidate eligibility and contradiction refusal matrix

- **Type:** Table-driven negative domain and orchestration test
- **Task:** T-10, T-11, T-12, T-14
- **Acceptance Criteria:** AC-1, AC-3, AC-8, AC-9, AC-10
- **Priority:** Critical

### Setup
Vary missing/malformed/unsupported/non-success result, issue/branch/AC/final-validation mismatch, local head mismatch, remote absence/divergence, PR absence/closed/wrong number/base/head/issue, unknown/active process, lock/lease/Git mismatch, malformed/mismatched tmux, and repeated terminal progress.

### Steps
1. Reconcile and resume every row twice.
2. Assert whether candidate query authority is available.
3. Capture decision precedence, remediation, transitions, calls, and resources.

### Expected Result
Only a strict eligible successful candidate keys dependent queries. Every unknown or contradiction blocks with stable diagnostics; malformed tmux never becomes absence. Resume performs no transition/launch/cleanup. Progress remains irrelevant.

### Expected Evidence
Negative matrix, stable human/JSON codes, query call counts, zero mutation/destruction/launch assertions, and unchanged resource hashes.

## Test V-16: Cleanup non-authorization and rendering/documentation

- **Type:** Cleanup safety, CLI rendering, and documentation contract
- **Task:** T-11, T-13, T-14
- **Acceptance Criteria:** AC-3, AC-6, AC-8, AC-9, AC-10
- **Priority:** Critical

### Setup
Provide candidate-only running states with exact, absent, malformed, and mismatched tmux plus OPEN, MERGED, CLOSED, unavailable, and mismatched PR observations. Capture status/list/reconcile/clean human and JSON output and documentation.

### Steps
1. Invoke every reconciliation-capable command and explicit clean twice.
2. Compare human/JSON semantics and destructive traces.
3. Repeat after normal finalization persistence to prove existing merged cleanup remains unchanged.
4. Assert operator docs state candidate/progress/tmux limits and remediation.

### Expected Result
Candidate-only states never expose cleanup, even with MERGED-shaped PR evidence. Absent/malformed tmux never authorizes cleanup. Normal persisted completion continues to require exact merged-source and ownership proof. Output/docs are equivalent and actionable.

### Expected Evidence
Zero-remove candidate traces, preserved worktree/lock/lease/tmux bytes, existing positive/negative cleanup regression results, render snapshots, and documentation tests.

## Test V-17: Historical Phase 3 safety regressions

- **Type:** Regression integration suite
- **Task:** T-14
- **Acceptance Criteria:** AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10
- **Priority:** Critical

### Setup
Reuse existing V-1 through V-12 fixtures for process preservation/adoption, explicit concurrency, bounded stop, retained evidence, event replay, completion, merged cleanup, refusal, tmux identity, and controls.

### Steps
1. Run all existing suites unchanged except necessary candidate expectation updates.
2. Repeat concurrency and interruption barriers.
3. Compare normalized owner, launch, signal, cleanup, and resource traces.

### Expected Result
No prior ownership, concurrency, stop, completion, cleanup, progress, or tmux guarantee regresses. Distinct issues remain isolated and capacity remains explicit.

### Expected Evidence
Passing historical test names, repeated barrier summary, zero collision/duplicate owner, bounded stop transcript, and cleanup retention/refusal matrix.

## Test V-18: SemVer 0.1.2 and stage-boundary proof

- **Type:** Release metadata, packaging, documentation, and full validation
- **Task:** T-13, T-14
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10
- **Priority:** Critical

### Setup
Complete T-10 through T-14; read harness checks instructions. Inventory all authoritative Runner version surfaces and preserve the pre-change dependency graph.

### Steps
1. Assert exact `0.1.2` agreement across package, root lock entries, official assets/manifests/fixtures, and current docs.
2. Run pack dry-run, temporary pack/install, installed-version confirmation, and asset-manifest convergence without registry publication.
3. Prove dependency ranges/metadata and package inventory have no unintended churn.
4. Run focused direct/harness checks, direct authoritative `just verify`, full harness checks, coverage inspection, and `git diff --check`.
5. Cross-check every AC against tests and implementation evidence.

### Expected Result
The backward-compatible defect correction is consistently versioned `0.1.2`; packed and installed metadata agree; upgrade guidance is executable; all gates pass with at least 80% coverage and no dependency churn.

### Expected Evidence
Version inventory, pack/install JSON and confirmation output, dependency diff, documentation assertions, direct/harness envelopes, Jest/coverage/build/diff summaries, and complete AC evidence matrix.
