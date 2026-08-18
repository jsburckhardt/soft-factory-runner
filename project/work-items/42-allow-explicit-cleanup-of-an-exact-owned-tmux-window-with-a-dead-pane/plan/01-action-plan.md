# Action Plan: Allow explicit cleanup of an exact owned tmux window with a dead pane

## Feature
- **ID:** 42
- **Research Brief:** project/work-items/42-allow-explicit-cleanup-of-an-exact-owned-tmux-window-with-a-dead-pane/research/00-research.md

## ADRs Created
- None. Amend ADR-260817-invoking-tmux-context-targeting in place for strict dead-pane observation, non-authorizing lifecycle corroboration, exact retry checkpoints, and the 0.2.1-beta.2 correction. Existing ADR-260811-prototype-three-recovery-concurrency and ADR-260814-tmux-identity-failure-recovery remain applicable without new artifacts.

## Core-Components Created
- None. Amend CORE-COMPONENT-260811-owned-resource-cleanup, CORE-COMPONENT-260811-run-reconciliation-control, CORE-COMPONENT-260817-exact-tmux-context-ownership, and CORE-COMPONENT-260815-package-semver-governance. Decision-log records 185-197 register the enforceable amendments.

## Acceptance Criteria
- **AC-1:** For an inactive terminal run with an exact issue lock; an expected-path worktree registered at the expected branch and HEAD with no staged, unstaged, or untracked changes; the exact recorded lease when present; matching persisted result evidence for completed runs; no active worker or RPIV process; and one persisted socket/session/window/pane/working-directory identity that exactly matches a remain-on-exit window whose pane is dead, reconciliation reports explicit cleanup as available rather than treating the pane's historical process identity as active, mismatched, or unknown.
- **AC-2:** Explicit cleanup of that state exits successfully, makes the final captured transcript available through retained logs, removes the exact owned dead window and clean owned worktree, releases the exact recorded lease when present, and releases the exact issue lock; each resource is observed present before its cleanup and absent afterward, while the local branch, snapshots, events, and retained logs remain present.
- **AC-3:** Dead-pane state alone never authorizes mutation. A live pane or active recorded process, nonterminal run, dirty worktree, unproved absence, incomplete identity, malformed or unavailable observation, ownership mismatch, or same-name/replacement resource returns the existing documented refusal outcome and remediation with no tmux, worktree, lease, lock, or run-state mutation and no change to unrelated-resource inventories.
- **AC-4:** Automatic merged cleanup continues to retain tmux evidence. For explicit cleanup, human and JSON results agree on eligibility, outcome code, completed and remaining tmux/worktree/lease/lock categories, refusal reason, remediation, and exit meaning; output excludes socket paths, session/window/pane identifiers, working directories, process identifiers, and unrelated-resource values.
- **AC-5:** Package manifest, root lock metadata, official-asset metadata, package and installation fixtures, packed metadata, locally installed metadata, and version-bearing current release and user guidance identified by a finite repository search all report 0.2.1-beta.2; comparison with the target-branch merge base shows no third-party dependency change, and local package evidence requires no registry fetch or publication.
- **AC-6:** A finite matrix has these outcomes: an exact dead pane with all Core ownership facts permits explicit cleanup; a live pane or active process refuses; an already-absent window with same-owner/run completed tmux-cleanup evidence treats only the tmux removal as complete and continues eligible remaining cleanup; that same state after all owned cleanup is idempotently successful; an absent window without completed tmux-cleanup evidence refuses; malformed, unavailable, incomplete, or mismatched identity proof refuses; and an unrelated same-name window refuses. Every refusal has the no-mutation outcome defined in Core.
- **AC-7:** An interruption after each authorized resource removal followed by retry reaches the same final resource states as uninterrupted cleanup, with each resource removed at most once; an unrelated replacement introduced before retry refuses without mutation. In one controlled clean/status overlap and one clean/reconcile overlap, each command finishes within 30 seconds, cleanup removes each authorized owned resource exactly once, and the read command reports either one complete matching socket/session/window/pane/working-directory observation or complete absence for that target, never fields mixed across those states.
- **AC-8:** Finite before/after evidence proves the exact owned dead window, clean owned worktree, recorded lease when present, and exact issue lock transition from present to absent. Only the inventories of unrelated sessions/windows/panes, unrelated worktrees, unrelated locks/leases/runs, and retained evidence are required to remain byte-identical before and after; the complete tmux or resource inventory is not required to remain unchanged.
- **AC-9:** A repository-local isolated tmux scenario creates an exactly owned remain-on-exit window, lets its pane process exit, preserves inspectable terminal output, completes explicit cleanup, and then returns that output from retained logs. Two runs with controlled clocks and identities produce equal outcome codes, tmux/worktree/lease/lock transitions, retained-evidence inventories, and unrelated-resource inventories without credentials, network access, ambient/default tmux mutation, or external project state.
- **AC-10:** Direct root just verify-focused and just verify both exit successfully, with inspectable criterion-to-evidence results covering the finite matrix, each interruption point, both overlaps, exact owned-resource present-to-absent transitions, unrelated and retained-evidence inventory byte equality, the enumerated version inventory, and the merge-base dependency diff.

## Acceptance Coverage

| AC | Implementation tasks | Tests or validation | Expected evidence |
|---|---|---|---|
| AC-1 | T-1, T-2 | V-1, V-2, V-8 | Exact dead observation plus complete independent conjunction yields explicit_clean; historical process data is ignored as activity |
| AC-2 | T-3, T-5 | V-3, V-7, V-8 | Ordered present-to-absent transition trace, retained final transcript, and retained branch/snapshot/event/log inventory |
| AC-3 | T-1, T-2, T-3 | V-1, V-2, V-4, V-7 | Closed refusal matrix, stable remediation, zero mutation trace, and byte-equal unrelated inventories |
| AC-4 | T-2, T-3, T-6 | V-3, V-4, V-9 | Automatic tmux retention and one redacted public result model shared by human and JSON output |
| AC-5 | T-6, T-7 | V-9, V-10 | Finite 0.2.1-beta.2 inventory, local pack/install metadata, and merge-base dependency equality |
| AC-6 | T-2, T-3, T-4 | V-2, V-4 | Every named row has an asserted outcome, category state, remediation, exit, and no-mutation proof |
| AC-7 | T-3, T-4 | V-5, V-6 | Every post-removal interruption converges at most once; replacement refuses; both overlaps finish under 30 seconds with whole-target observations |
| AC-8 | T-3, T-4, T-5 | V-3, V-7, V-8 | Exact owned categories transition present to absent while only required unrelated and retained inventories remain byte-identical |
| AC-9 | T-1, T-3, T-5 | V-8 | Two isolated deterministic dead-pane runs return retained output and equal categorical/resource evidence without ambient mutation |
| AC-10 | T-4, T-5, T-6, T-7 | V-1 through V-10 | Criterion-to-evidence manifest plus successful direct focused and full root gates |

Coverage proof: all ten criteria map to implementation, executable validation, and concrete evidence before plan artifacts are written.

## Implementation Tasks
1. **T-1 — Model and observe exact dead panes** (AC-1, AC-3, AC-9): extend the one-pass tmux record and parser with strict pane-dead state while preserving complete selector equality, persisted cwd authority, original-byte bounds, and fail-closed malformed handling.
2. **T-2 — Reconcile cleanup eligibility and redacted public results** (AC-1, AC-3, AC-4, AC-6): distinguish live match, exact dead, absent, mismatch, and unknown; preserve independent process/result/lock/lease/worktree gates; emit one categorical cleanup view for human and JSON.
3. **T-3 — Make exact cleanup transitions retry-safe** (AC-2, AC-3, AC-4, AC-6, AC-7, AC-8, AC-9): checkpoint exact present identity before every mutation, capture transcript first, verify absence after each operation, resume proved post-removal absence without duplicate calls, and retain durable evidence.
4. **T-4 — Add the finite matrix, interruption, overlap, and inventory suite** (AC-3, AC-6, AC-7, AC-8, AC-10): use deterministic fakes and barriers to prove refusals, idempotence, replacement safety, under-30-second completion, whole-target reads, and exact inventory comparisons.
5. **T-5 — Add repository-local live dead-pane proof** (AC-2, AC-8, AC-9, AC-10): create isolated explicit sockets and a remain-on-exit dead pane, capture final output, clean exact resources, read retained logs, and repeat with controlled identities.
6. **T-6 — Synchronize beta.2 release and operations guidance** (AC-4, AC-5, AC-10): update finite package/lock/asset/fixture/current guidance surfaces, package tests, cleanup docs, confidentiality language, and deferred Sparkta recovery instructions without dependency or publication changes.
7. **T-7 — Run delivery gates and prepare the operational handoff** (AC-5, AC-10): run direct just verify-focused and just verify, collect criterion evidence and merge-base dependency diff, then hand off the non-gating visible Sparkta beta.2 install and exact recovery of its existing Issue 7 run.

## Deferred Visible Sparkta Handoff
- This is an operator action after local implementation and verification, not repository-local acceptance proof and not recovery of this repository's already delivered Phase 5 work item.
- Install the locally packed 0.2.1-beta.2 candidate visibly in Sparkta, confirm installed package and reconverged official-asset manifest metadata, then inspect Sparkta Issue 7 through redacted status/reconcile/logs output.
- Proceed with clean only if the delivered conjunction reports explicit cleanup eligible for the persisted exact dead target. Confirm retained transcript first, then confirm exact tmux/worktree/lease/lock categories absent and branch/snapshots/events/logs retained. Any mismatch, unavailable proof, replacement, or unexpected activity is a refusal and escalation point, never a force-clean instruction.
- Record the Sparkta command results separately as post-delivery operational evidence; credentials, network state, ambient tmux state, and external project files remain outside automated gates.
