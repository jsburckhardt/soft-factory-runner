# Action Plan: Reload Current Run State After Copilot Exits

## Feature
- **ID:** 34
- **Research Brief:** project/work-items/34-reload-current-run-state-after-copilot-exits/research/00-research.md
- **Scope:** issue
- **Release:** PATCH 0.1.2 from current 0.1.1, because this is a backward-compatible defect correction. If the base version changes before Implement, return to Plan to select the next PATCH.

## ADRs Created
- No new ADR. Updated global ADR-260811-prototype-three-recovery-concurrency in place, preserving its 2026-08-11 creation date, to require current-state reload, exact identity, typed refusal, terminal idempotence, and store-guarded race refusal.

## Core-Components Created
- No new core-component. Updated CORE-COMPONENT-260811-run-reconciliation-control and CORE-COMPONENT-260811-completion-evidence-reconciliation in place, preserving their 2026-08-11 creation dates.
- Decision log records 163-167 capture the enforceable choices.

## Acceptance Criteria
- **AC-1:** After the Copilot process wait resolves, the worker reloads the current snapshot before any terminal transition and proceeds only when its run, owner, and worker identities match the pre-wait run and its Copilot process identity matches the process whose exit was awaited.
- **AC-2:** From a current identity-matching snapshot, a zero exit enters completion reconciliation and a nonzero exit reaches `failed` with the observed exit recorded in run history; the complete accepted snapshot and event history through the resulting state has no missing, duplicate, or out-of-order revisions.
- **AC-3:** Post-wait handling leaves every pre-existing accepted RPIV progress, terminal progress, strict final result, and retained diagnostic record unchanged and in order; only records required to represent the observed exit and resulting run state may be appended.
- **AC-4:** A missing, invalid, or identity-mismatched current snapshot returns a stable machine-readable refusal without a terminal transition, duplicate Copilot launch, or mutation of pre-existing accepted evidence.
- **AC-5:** If the snapshot advances between the post-wait reload and transition, newer history is not overwritten and handling ends with a stable machine-readable refusal rather than persisting a stale transition.
- **AC-6:** Repeated post-wait handling or an already-terminal current run returns the existing terminal outcome without adding a launch or terminal transition and without changing existing exit, finalization, progress, result, or diagnostic records.
- **AC-7:** A repeatable repository-local regression case holds a zero-exit wait pending while the same snapshot advances through research, plan, implement, verify, terminal progress, and a retained diagnostic, then proves a completed run, contiguous complete history, unchanged pre-existing evidence, one launch, and no result overwrite after the wait resolves.
- **AC-8:** The same bounded concurrent regression is exercised for a nonzero exit and proves a failed run with the observed exit in run history, contiguous complete history, unchanged pre-existing evidence including any strict final result, one launch, and no result overwrite.
- **AC-9:** Four bounded repository-local cases change the run, owner, worker, and waited Copilot process identity respectively, and one case advances the snapshot between reload and transition; each proves the required refusal, unchanged newer history and evidence, and no additional launch.

## Acceptance Coverage
| AC | Implementation tasks | Tests or validation | Expected evidence |
|---|---|---|---|
| AC-1 | T-1, T-2 | V-1, V-2, V-3 | Trace shows reload after wait and full identity comparisons before save. |
| AC-2 | T-2, T-3 | V-1, V-2, V-7 | Zero completion and nonzero failure snapshots plus contiguous event revisions. |
| AC-3 | T-2, T-3 | V-1, V-2, V-7 | Before/after deep equality for accepted progress, result, and diagnostic facts. |
| AC-4 | T-1, T-2, T-3 | V-3, V-4 | Stable JSON refusal reason, unchanged bytes/history, one launch. |
| AC-5 | T-1, T-2, T-3 | V-5 | Injected second advance survives; no stale event or snapshot replacement. |
| AC-6 | T-1, T-2, T-3 | V-6 | Repeated/already-terminal outcome with unchanged event count and evidence. |
| AC-7 | T-3 | V-1, V-7 | Bounded held-wait zero fixture, completed state, one launch, complete history. |
| AC-8 | T-3 | V-2, V-7 | Bounded held-wait nonzero fixture, exit 9 failure, one launch, complete history. |
| AC-9 | T-3 | V-3, V-5 | Four identity rows and reload/save race row with exact refusal assertions. |

Coverage proof: every AC-1 through AC-9 has implementation, validation, and expected evidence before these plan artifacts are written.

## Implementation Tasks
1. **T-1 — Define the typed post-wait decision boundary (AC-1, AC-4, AC-5, AC-6, AC-9).** Add the closed refusal reason type/code and a pure exact-identity/current-state classifier; preserve typed load/save causes safely.
2. **T-2 — Refactor worker post-wait persistence (AC-1, AC-2, AC-3, AC-4, AC-5, AC-6).** Reload after wait, derive zero/nonzero transitions from current state, separate launch/wait failures from post-wait refusal, return exact terminal outcomes idempotently, and never perform the current fallback stale save.
3. **T-3 — Add deterministic bounded regression coverage (AC-1 through AC-9).** Extend the process fixture with a deferred wait and reload/save barrier; advance progress and diagnostic facts, run identity/refusal matrices, and assert complete snapshot/event/evidence invariants.
4. **T-4 — Update application documentation and release surfaces (AC-1 through AC-6).** Document post-wait semantics and troubleshooting in README and phase guides; state API/configuration/data/deployment impact; assign and synchronize PATCH 0.1.2 across all governed package, lock, asset, fixture, and user guidance surfaces with no dependency churn.
5. **T-5 — Validate and record Implement handoff (AC-1 through AC-9).** Run root `just verify-focused` while building and root `just verify` before handoff; record AC evidence, package inventory, documentation review, friction drain, commit SHA, and clean tree.
