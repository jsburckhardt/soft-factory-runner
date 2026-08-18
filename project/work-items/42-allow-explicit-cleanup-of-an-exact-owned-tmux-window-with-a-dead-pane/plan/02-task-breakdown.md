# Task Breakdown: Allow explicit cleanup of an exact owned tmux window with a dead pane

## Task T-1: Model and observe exact dead panes

- **Status:** Completed
- **Complexity:** Medium
- **Dependencies:** None
- **Acceptance Criteria:** AC-1, AC-3, AC-9
- **Related ADRs:** ADR-260817-invoking-tmux-context-targeting; ADR-260814-tmux-identity-failure-recovery
- **Related Core-Components:** CORE-COMPONENT-260817-exact-tmux-context-ownership; CORE-COMPONENT-260814-tmux-identity-diagnostics

### Description
Extend TmuxPort observation and the closed LF-terminated exact-target format with a strict dead flag. Parse one complete record only. A live observation requires exact socket identity, selectors, and cwd; exact dead requires the same immutable selectors, dead=true, empty current cwd, and a complete persisted cwd. Keep dead state out of ownership, process, attach, resume, and stop authority.

### Acceptance Criteria
- AC-1 exact dead-pane observation is representable and no historical process identity becomes active evidence.
- AC-3 malformed, incomplete, unavailable, live, and mismatched records fail closed without mutation.
- AC-9 the same adapter supports a real isolated remain-on-exit dead pane.

### Test Coverage
- Unit parser rows for dead/live flags, empty/nonempty cwd, framing, duplicate records, invalid UTF-8, and selector mismatch.
- Adapter tests assert one explicit-socket query, one whole record, bounded execution, and no ambient/default tmux access.

### Expected Evidence
- Typed observation fixtures for live match, exact dead, absent, mismatch, and unknown.
- Command traces show one explicit persisted socket and no rendered raw values.

## Task T-2: Reconcile cleanup eligibility and redacted public results

- **Status:** Completed
- **Complexity:** High
- **Dependencies:** T-1
- **Acceptance Criteria:** AC-1, AC-3, AC-4, AC-6
- **Related ADRs:** ADR-260811-prototype-three-recovery-concurrency; ADR-260817-invoking-tmux-context-targeting
- **Related Core-Components:** CORE-COMPONENT-260811-run-reconciliation-control; CORE-COMPONENT-260811-owned-resource-cleanup; CORE-COMPONENT-260817-exact-tmux-context-ownership

### Description
Update reconciliation and canExplicitCleanup to accept exact dead only within the full inactive terminal conjunction: exact lock; lease when present; expected clean registered worktree branch and HEAD; completed result when required; absent worker/RPIV; exact persisted target. Preserve live-pane and active-process refusal, completed-step absence rules, and automatic merged tmux retention. Replace direct report/snapshot serialization for control surfaces with one categorical public cleanup view.

### Acceptance Criteria
- AC-1 reports explicit_clean for only the complete exact dead conjunction.
- AC-3 every missing, contradictory, active, dirty, same-name, or replacement fact refuses with no mutation.
- AC-4 human and JSON agree on eligibility, outcome, resource categories, refusal, remediation, and exit meaning while confidential values are absent.
- AC-6 all finite matrix classifications are represented.

### Test Coverage
- Table-driven reconciliation conjunction and refusal precedence tests.
- Human/JSON parity and forbidden-value sentinel tests across status, reconcile, clean success, partial, and refusal.
- Regression test that automatic merged cleanup has no tmux step.

### Expected Evidence
- Stable outcome/action matrix with no raw snapshot/report serialization.
- Negative searches over rendered bytes find no socket, IDs, cwd, PIDs, or unrelated sentinels.

## Task T-3: Make exact cleanup transitions retry-safe

- **Status:** Completed
- **Complexity:** High
- **Dependencies:** T-1, T-2
- **Acceptance Criteria:** AC-2, AC-3, AC-4, AC-6, AC-7, AC-8, AC-9
- **Related ADRs:** ADR-260811-prototype-three-recovery-concurrency; ADR-260817-invoking-tmux-context-targeting
- **Related Core-Components:** CORE-COMPONENT-260811-owned-resource-cleanup; CORE-COMPONENT-260810-persistence-recovery; CORE-COMPONENT-260810-issue-worktree-locking

### Description
Persist an owner/run-bound exact-resource started checkpoint only after present observation and immediately before each ordered mutation. Capture and retain the exact pane transcript before tmux removal. After tmux, worktree, lease, and lock operations, observe absence and persist completion. On retry, accept absence after an exact started checkpoint or completion only when no replacement or contradiction exists; do not invoke removal twice. Retain branch, snapshot, events, and logs.

### Acceptance Criteria
- AC-2 proves every exact category present before and absent after cleanup with final transcript retained.
- AC-3 refuses changed authority or replacements without further mutation.
- AC-4 emits categorical progress and preserves automatic retention.
- AC-6 continues from proved tmux completion and is idempotent after all completion.
- AC-7 converges after interruption following every removal with at-most-once calls.
- AC-8 limits equality assertions to unrelated and retained inventories.
- AC-9 returns dead-pane output through retained logs after cleanup.

### Test Coverage
- Failure injection immediately after each destructive return and before completed-event persistence.
- Replacement injection before retry for tmux, worktree, lease, and lock.
- Exact before/after observers and retained-log readback.

### Expected Evidence
- Ordered trace: observe present, started checkpoint, mutate once, observe absent, completed checkpoint.
- Retry traces equal uninterrupted final state and each destructive adapter count is at most one.

## Task T-4: Add finite matrix, interruption, overlap, and inventory verification

- **Status:** Completed
- **Complexity:** High
- **Dependencies:** T-2, T-3
- **Acceptance Criteria:** AC-3, AC-6, AC-7, AC-8, AC-10
- **Related ADRs:** ADR-260811-prototype-three-recovery-concurrency; ADR-260817-invoking-tmux-context-targeting
- **Related Core-Components:** CORE-COMPONENT-260811-owned-resource-cleanup; CORE-COMPONENT-260817-exact-tmux-context-ownership; CORE-COMPONENT-260811-concurrent-run-admission

### Description
Build a finite repository fixture and deterministic fake suite for every issue row, every post-removal interruption, unrelated replacements, and controlled clean/status plus clean/reconcile overlaps. Use explicit barriers and 30-second outer bounds. Compare exact owned transitions separately from byte-identical unrelated sessions/windows/panes, worktrees, locks/leases/runs, and retained evidence.

### Acceptance Criteria
- AC-3 refusal rows have zero mutation and unchanged unrelated inventories.
- AC-6 every named row has an exact expected code, remediation, exit, and category state.
- AC-7 retries remove at most once and overlap readers see a whole complete target or complete absence.
- AC-8 exact owned transitions and required byte-equality inventories are inspectable.
- AC-10 results are criterion-addressable from root gates.

### Test Coverage
- Parameterized matrix fixture consumed by focused tests.
- Fake controlled-clock interruption and overlap tests with operation counters and timeout assertions.

### Expected Evidence
- One finite criterion-to-row report with outcome, transition, counter, duration, and inventory hashes.
- No assertion incorrectly requires the complete mutable resource inventory to remain unchanged.

## Task T-5: Add repository-local live dead-pane proof

- **Status:** Completed
- **Complexity:** High
- **Dependencies:** T-1, T-3, T-4
- **Acceptance Criteria:** AC-2, AC-8, AC-9, AC-10
- **Related ADRs:** ADR-260817-invoking-tmux-context-targeting
- **Related Core-Components:** CORE-COMPONENT-260817-exact-tmux-context-ownership; CORE-COMPONENT-260811-owned-resource-cleanup; CORE-COMPONENT-260810-development-standards

### Description
Create temporary repositories, explicit isolated sockets, unrelated sentinels, exact owned worktrees/locks/leases, and a remain-on-exit command that prints a marker then exits. Drive explicit cleanup and logs through repository-local services. Repeat twice with controlled clocks/IDs and unconditional exact fixture teardown; never access ambient/default tmux, credentials, network, Sparkta, or external project state.

### Acceptance Criteria
- AC-2 live proof captures transcript before exact removal and reads it afterward.
- AC-8 exact owned resources disappear and unrelated/retained inventories remain byte-identical.
- AC-9 two runs produce equal categorical outcomes and transitions without external state.
- AC-10 live evidence is included in focused and full validation.

### Test Coverage
- Live isolated tmux integration test with bounded waits only at explicit fixture synchronization points.
- Determinism comparison over normalized categorical results, transition lists, and inventory hashes.

### Expected Evidence
- Retained marker output after pane/window removal.
- Before/after explicit-socket inventories and proof that ambient/default tmux was untouched.

## Task T-6: Synchronize beta.2 release and operations guidance

- **Status:** Completed
- **Complexity:** Medium
- **Dependencies:** T-2, T-3
- **Acceptance Criteria:** AC-4, AC-5, AC-10
- **Related ADRs:** ADR-260817-invoking-tmux-context-targeting; ADR-260810-typescript-node-cli
- **Related Core-Components:** CORE-COMPONENT-260815-package-semver-governance; CORE-COMPONENT-260812-official-asset-installation-contract; CORE-COMPONENT-260811-owned-resource-cleanup

### Description
Set exactly 0.2.1-beta.2 in package.json, both root package-lock entries, OFFICIAL_ASSET_VERSION, package/install fixtures and assertions, packed/installed metadata tests, and finite current-release/user guidance found by repository search. Update recovery and release docs for dead-pane eligibility, refusal/confidentiality, retry checkpoints, exact transitions, overlaps, local package proof, and no registry publication. Add the deferred visible Sparkta install and existing Issue 7 recovery runbook as non-gating operational handoff.

### Acceptance Criteria
- AC-4 docs and executable rendering agree on retention and confidentiality.
- AC-5 every authoritative finite surface reports beta.2; merge-base dependency metadata is unchanged; pack/install is local.
- AC-10 release evidence participates in both gates.

### Test Coverage
- Finite repository version inventory test; npm pack dry-run, local tarball pack, clean local install, installed package and generated manifest assertions.
- Merge-base package dependency/range diff and package inventory checks.
- Documentation tests for current release, cleanup contracts, and deferred handoff boundaries.

### Expected Evidence
- Enumerated beta.2 path/value table and packed filename/version plus locally installed metadata.
- Empty third-party dependency diff and no registry/network/publication command.

## Task T-7: Run delivery gates and prepare operational handoff

- **Status:** Completed
- **Complexity:** Medium
- **Dependencies:** T-4, T-5, T-6
- **Acceptance Criteria:** AC-5, AC-10
- **Related ADRs:** ADR-260811-engineering-harness-surface
- **Related Core-Components:** CORE-COMPONENT-260806-project-command-interface; CORE-COMPONENT-260810-development-standards; CORE-COMPONENT-260806-rpiv-stage-contract

### Description
Run direct root just verify-focused and just verify from a clean implementation handoff, preserve inspectable test and diff evidence, and prepare the separate operator checklist for visible Sparkta installation of the locally packed beta.2 candidate and exact recovery of Sparkta Issue 7. The external handoff may proceed only on delivered eligibility; any refusal preserves resources and is escalated.

### Acceptance Criteria
- AC-5 local package/version/dependency proof is complete before external handoff.
- AC-10 both direct gates exit zero and criterion-to-evidence coverage includes every matrix, interruption, overlap, transition, inventory, and release check.

### Test Coverage
- Direct root gates, git diff --check within those gates, clean status review, and acceptance-evidence index review.
- No automated Sparkta, credential, network, or ambient tmux operation.

### Expected Evidence
- Exit-zero focused and full gate logs with test names tied to AC-1 through AC-10.
- A clearly deferred, non-gating Sparkta checklist covering beta.2 install confirmation, Issue 7 status/logs/clean, retained evidence, exact category absence, and refusal escalation.


## Verify-return correction (2026-08-18)

- **T-2 / AC-1, AC-3, AC-6:** Completed — `canExplicitCleanup` now refuses live `TMUX_MATCH`; the finite matrix proves live refusal and exact-dead authorization with the full independent conjunction.
- **T-4 / AC-3, AC-6, AC-8, AC-10:** Completed — refusal and success rows assert no mutation, exact transitions, and byte-identical enumerated unrelated inventories.
- **T-5 / AC-2, AC-8, AC-9, AC-10:** Completed — replaced the direct tmux-adapter fixture with full `IssueRunService` explicit cleanup over a real isolated remain-on-exit window, owned clean worktree, lock, lease, snapshots, events, and retained logs; two runs compare normalized outcomes and inventories.
- **T-6 / AC-5, AC-10:** Completed — release history now scopes beta.0 to absent-server Doctor collapse, beta.1 to exact stale-socket handling, and beta.2 only to exact-owned dead-pane cleanup.

## Documentation-gate correction (2026-08-18)

- **T-6 / AC-4, AC-5, AC-10:** Completed — corrected every current user-facing contract to describe one categorical redacted public view, the expanded internal exact-target observation with socket/session/window/pane selectors plus `pane_dead` and cwd, and scoped the older two-ID observation grammar to its historical diagnostic contract.
- **T-3 / AC-2, AC-4, AC-6, AC-7:** Completed — recovery guidance now states exact-dead-only cleanup ordering, transcript-first retention, present/checkpoint/mutate/absence semantics, replacement refusal, at-most-once retry, completed-cleanup idempotence, and automatic tmux retention explicitly.
- **T-7 / AC-10:** Completed — documentation contract tests, package/release smoke, and direct plus harness focused/full gates pass after the documentation correction.
