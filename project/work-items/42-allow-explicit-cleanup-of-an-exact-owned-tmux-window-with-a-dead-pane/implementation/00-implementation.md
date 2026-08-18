# Implementation Notes: Issue 42 exact owned dead-pane cleanup

## Scope and completed tasks

- T-1 through T-7 remain completed in dependency order; the Verify-return corrections for T-2, T-4, T-5, and T-6 are recorded in `plan/02-task-breakdown.md`.
- `canExplicitCleanup` now requires `TMUX_EXACT_DEAD` (or same-owner/run proved post-removal absence) and refuses live `TMUX_MATCH`. Automatic merged cleanup retains its separate live-compatible ownership gate and still does not remove tmux.
- The former direct-adapter live fixture was replaced by full `IssueRunService` explicit cleanup over a real isolated remain-on-exit window plus owned clean worktree, issue lock, lease, snapshots, events, and logs.
- Release history is corrected: beta.0 is absent-server Doctor-collapse containment, beta.1 is exact stale-socket handling, and beta.2 is dead-pane cleanup only.

## Acceptance evidence

- **AC-1:** `src/reconciliation.ts` permits explicit cleanup only for `TMUX_EXACT_DEAD` with independently reconciled lock, optional lease, clean registered worktree path/branch/HEAD, result rules, and absent worker/RPIV. `src/reconciliation.test.ts` and `src/recovery-control.test.ts` prove the exact-dead row exposes only `explicit_clean`.
- **AC-2:** `src/recovery-control.test.ts` drives `IssueRunService.clean` through actual dead-window, worktree, lease, and lock present-to-absent transitions; `IssueRunService.logs` returns `retained-dead-marker` after cleanup while branch, snapshot, events, and log paths remain.
- **AC-3:** The finite live row returns `CLEANUP_OWNERSHIP_UNPROVED` with exit 4 and byte-identical snapshot/event/resource facts plus zero tmux, Git, lease, lock, or run-state mutation. Existing active, dirty, unknown, malformed, mismatch, and replacement refusal rows remain passing.
- **AC-4:** Shared categorical human/JSON rendering tests remain passing; live match exposes attach/resume as applicable but never explicit cleanup. Automatic merged cleanup remains separately eligible and retains tmux evidence.
- **AC-5:** `src/issue-42-repository.test.ts` keeps every authoritative package surface at `0.2.1-beta.2`, proves merge-base dependency equality, and now asserts beta.0/beta.1/beta.2 history scopes. Offline pack/install/asset smoke reported packed, installed, and generated-manifest version `0.2.1-beta.2` without registry access or publication.
- **AC-6:** `src/reconciliation.test.ts` explicitly proves live `TMUX_MATCH` refusal and exact-dead authorization. Guarded cleanup tests retain proved-absence continuation, full idempotence, unproved absence, malformed/unavailable/incomplete/mismatch, and same-name/replacement rows with stable outcomes.
- **AC-7:** Existing per-step interruption/retry and replacement tests run from exact dead authorization and still prove at-most-once removal. Controlled status/reconcile overlap tests remain bounded and whole-target-or-absence only.
- **AC-8:** The live Runner test separately records exact owned tmux/worktree/lease/lock transitions and byte-compares enumerated unrelated sessions, windows, panes, worktrees, locks, leases, runs, and evidence before/after. Branch, owned snapshot/events, and retained log presence are asserted after cleanup.
- **AC-9:** Two real isolated explicit-socket runs use the same controlled Runner facts, reach equal `CLEANUP_COMPLETED` codes and normalized transition/inventory evidence, return the retained marker, and tear down only their exact temporary sockets/directories. No ambient tmux, credentials, network, Sparkta, or external project state is used.
- **AC-10:** Direct and harness-focused/full gates pass with 28 suites and 646 tests. Criterion-addressable tests cover the live-refusal matrix, full Runner live proof, exact transitions, unrelated byte inventories, release inventory/history, package install, interruption, overlap, and confidentiality contracts.

## Documentation evidence

- `README.md`: explicit live refusal, exact-dead-only cleanup, beta.0/beta.1/beta.2 history, and correct 0.2.0 v6 attribution.
- `docs/README.md`: current beta.2 scope, live refusal, and separated prerelease history.
- `docs/phase-3-recovery-operations.md`: operational live refusal and exact-dead/Core-fact eligibility.
- `docs/phase-4-repository-doctor.md`: beta.0 absent-server collapse, beta.1 stale socket, and explicit statement that beta.2 does not alter Doctor.
- `docs/phase-5-official-assets.md`: beta.2 described only as guarded exact-owned dead-pane cleanup.
- `CORE-COMPONENT-260817-exact-tmux-context-ownership.md` and Decision 198 align the enforceable contract with exact-dead-only explicit cleanup.
- No network API, configuration option/default, database/data migration, service, container, or deployment behavior changed. The deferred Sparkta handoff remains non-gating and was not executed.

## Validation evidence

- `harness boot --json`: status `ok`; bootstrap signal observed; application and composed full checks exited 0.
- Direct `just verify-focused`: exit 0; 28 suites / 646 tests; `git diff --check` passed.
- `harness checks --focused --json`: status `ok`, scope `focused`, delegated `just verify-focused`, exit 0; 28 suites / 646 tests.
- Direct `just verify`: exit 0; lint, format, typecheck, 28 suites / 646 tests, 89.44% statements / 85.56% branches, build, and diff check passed.
- `harness checks --json`: status `ok`, scope `full`, delegated `just verify`, exit 0 with all configured stages passing.
- Offline package smoke: local tarball filename/version, offline installed package metadata, and generated official-asset manifest all reported `0.2.1-beta.2`; temporary package and consumer roots were removed.

## Harness friction records

- Existing issue records: `.harness/records/retro/2026-08-18/013-issue-42-rpiv-planner.md`, `014-issue-42-rpiv-research.md`, and `015-issue-42-rpiv-implementer.md`.
- Verify-return implementation record: `.harness/records/retro/2026-08-18/016-issue-42-rpiv-implementer-verify-return.md` (both pending implementer observations persisted and the buffer cleared after read-back).
- Coordinator, Research, and Plan buffers were empty. Verifier observations remain owned by Verify and were not cleared by Implement.

Implementation correction evidence is complete for renewed Verify review; final acceptance remains owned by Verify.
