# Research Brief: Reload current run state after Copilot exits

## GitHub Issue
- **Issue:** #34
- **Title:** Reload current run state after Copilot exits
- **Work Item:** `project/work-items/34-reload-current-run-state-after-copilot-exits`

## Scope Classification
- **Scope Type:** issue

## Problem Statement

A Runner worker can retain a pre-wait `RunSnapshotV5` in memory while accepted RPIV progress publication and reconciliation advance the durable snapshot. After Copilot exits, the worker derives a terminal transition from the stale object. `RunStore.save` correctly rejects the noncontiguous replacement with `STATE_HISTORY_INVALID`, but the valid delivery remains reported as `running_rpiv` and the worker exits 3.

## Acceptance Criteria

<!-- ACCEPTANCE_CRITERIA_START -->

**Core**
- [ ] After the Copilot process wait resolves, the worker reloads the current snapshot before any terminal transition and proceeds only when its run, owner, and worker identities match the pre-wait run and its Copilot process identity matches the process whose exit was awaited.
- [ ] From a current identity-matching snapshot, a zero exit enters completion reconciliation and a nonzero exit reaches `failed` with the observed exit recorded in run history; the complete accepted snapshot and event history through the resulting state has no missing, duplicate, or out-of-order revisions.
- [ ] Post-wait handling leaves every pre-existing accepted RPIV progress, terminal progress, strict final result, and retained diagnostic record unchanged and in order; only records required to represent the observed exit and resulting run state may be appended.

**Edge Cases**
- [ ] A missing, invalid, or identity-mismatched current snapshot returns a stable machine-readable refusal without a terminal transition, duplicate Copilot launch, or mutation of pre-existing accepted evidence.
- [ ] If the snapshot advances between the post-wait reload and transition, newer history is not overwritten and handling ends with a stable machine-readable refusal rather than persisting a stale transition.
- [ ] Repeated post-wait handling or an already-terminal current run returns the existing terminal outcome without adding a launch or terminal transition and without changing existing exit, finalization, progress, result, or diagnostic records.

**Verification**
- [ ] A repeatable repository-local regression case holds a zero-exit wait pending while the same snapshot advances through research, plan, implement, verify, terminal progress, and a retained diagnostic, then proves a completed run, contiguous complete history, unchanged pre-existing evidence, one launch, and no result overwrite after the wait resolves.
- [ ] The same bounded concurrent regression is exercised for a nonzero exit and proves a failed run with the observed exit in run history, contiguous complete history, unchanged pre-existing evidence including any strict final result, one launch, and no result overwrite.
- [ ] Four bounded repository-local cases change the run, owner, worker, and waited Copilot process identity respectively, and one case advances the snapshot between reload and transition; each proves the required refusal, unchanged newer history and evidence, and no additional launch.

<!-- ACCEPTANCE_CRITERIA_END -->

## Repository Findings

- Issue #34 has exactly one marker-wrapped Acceptance Criteria section with Core, Edge Cases, and Verification headings and nine ordered nonempty Markdown checkboxes. The criteria above are preserved verbatim and in issue order. No existing `project/work-items/34-*` directory existed, so the issue title resolves to the work-item path shown above.
- `IssueRunService.runWorker` (`src/orchestrator.ts`) loads and normalizes once at entry, then carries local `snapshot` through worker identity capture, launch intent, Copilot spawn, RPIV process identity persistence, and `process.wait()`. It does not load after the wait before deriving either `failed` or `finalizing`.
- `IssueRunService.next` increments the revision of the object supplied to it. Both post-wait paths clear `rpivProcess` and record the observed exit, but derive that transition from the pre-wait object. The zero path saves reason `copilot-exited-zero`; the nonzero path saves reason `copilot-failed`.
- `IssueRunService.publishRpivProgress` acquires a progress-publication lock, reloads the bound v5 snapshot, writes the atomic mutable progress artifact, and persists a revisioned snapshot transition. That lock serializes progress publishers only; it does not serialize them with the already-running worker. `src/integration.ts` enforces strict progress ordering, while accepted progress still advances the shared snapshot revision.
- `RunStore.save` (`src/persistence.ts`) reloads durable state and requires matching run ID, matching owner ID, and exactly `existing.revision + 1` before it appends an event and atomically replaces the snapshot. A stale candidate is refused with `STATE_HISTORY_INVALID` before event or snapshot mutation. `RunStore.load` plus `replayHistory` advances only through contiguous issue/run-matching v2 events and rejects conflicting, wrong-run, duplicate-conflicting, or noncontiguous history.
- The production incident matches these code boundaries. Run `453ac411-970e-479e-8f08-16d6781a037f` waited with an in-memory revision-6 `running_rpiv` snapshot; accepted `publish-progress` transitions advanced durable revisions 7-11; reconciliation advanced revision 12; after Copilot exit zero the worker derived stale revision 7 although revision 13 was required, and `RunStore.save` refused it with `STATE_HISTORY_INVALID`. Issue #34 itself records revision 6, durable advance through 12, stale 7, and required 13; the requested incident trace supplies the revision 7-11 progress and revision 12 reconciliation attribution.
- The production run files are not present in this workspace and are not committed in Sparkta, so the exact per-revision snapshot/event payload bytes were not independently readable. Repository source proves the refusal mechanics and preservation behavior, but the detailed production attribution remains supplied incident evidence.
- Sparkta Issue #6 remains open with all six criteria checked. Sparkta PR #13 is open at head `cd2019e90cc63c6740dec1e7fd8832d4c497f798` and records strict delivery, all six AC passes, `just verify` success, clean state, final result, and verification evidence. This corroborates that valid work and completion evidence survived the Runner failure, without implying a merged or closed outcome.
- Issue #5 established interruption recovery, contiguous revision history, compound process identity, and duplicate-launch prevention. PR #33 (`5122131cf0252bc170d1dc039e42e9e81f4a91ea`, open) extends recovery for a strict successful result left with durable `running_rpiv`; its diff changes reconciliation/resume behavior but leaves the post-`Process.wait` path in `runWorker` unchanged. The current branch is based on main `84e4cac`; PR #33 is not merged.
- Existing tests cover nonzero exit classification, ordinary zero-exit finalization, strict result/progress behavior, atomic publication, revision replay, and stale/noncontiguous save refusal. In `src/orchestration.test.ts`, the process fake `wait` removes the observed process and returns immediately; existing worker coverage does not hold the wait pending while another snapshot writer advances the same run. `src/publication-concurrency.test.ts` covers artifact atomicity rather than this worker/snapshot race.
- `src/index.ts` maps `STATE_HISTORY_INVALID` to exit 3. The `runWorker` catch around spawn, wait, and terminal persistence also catches a terminal-save `RunnerError`, derives another `failed` transition from the same stale object, and attempts another save; this can obscure the first refusal path while retaining typed non-success.

## Constraints

- `RunStore.save` remains the durable concurrency guard: only matching run/owner identity and the exact next revision can append. Newer history must never be overwritten, renumbered, or hand-edited. Events remain append-before-atomic-snapshot.
- `RunSnapshotV5` already carries run, owner, worker, RPIV compound process, attempt, progress, integration, finalization, and retained tmux diagnostic facts. Compound process identity includes PID, process group, start token, executable, exact args, cwd, launch time, and pane lineage; PID alone is insufficient.
- Accepted progress is mutable and atomically published but non-authorizing. It is still part of revisioned state and must remain ordered and unchanged by post-wait handling. `AgentResultV1` publication is immutable and no-clobber. Neither artifact alone authorizes completion.
- Completion remains the strict conjunction of bound result, local Git, fresh remote, open GitHub PR, ordered acceptance evidence, and snapshotted final validation. A zero exit or terminal progress is not completion proof.
- Unknown, absent, malformed, or identity-mismatched current state must fail safe with stable typed codes and nonzero output. It cannot authorize launch, signal, cleanup, reuse, or evidence mutation.
- Reconciliation observes each external boundary once without hidden polling or retry. Repeated handling must remain explicit and idempotent where existing terminal facts already decide the outcome.
- PR #33 is open, unmerged branch evidence. Its proposed decisions 163-166 and recovery-candidate behavior are not part of the current main baseline and do not alter the stale post-wait path.

## Relevant ADRs and Core-Components

- `project/architecture/ADR/ADR-260811-prototype-three-recovery-concurrency.md` — accepted revisioned history, compound process identity, one-pass reconciliation, active-process preservation, and safe recovery policy.
- `project/architecture/ADR/ADR-260812-rpiv-integration-completion-contract.md` — accepted snapshotted final-validation and Runner-owned post-exit completion authority.
- `project/architecture/ADR/ADR-260811-prototype-two-completion-proof.md` — superseded historical event-before-snapshot and terminal-classification context.
- `project/architecture/core-components/CORE-COMPONENT-260810-persistence-recovery.md` — versioned atomic snapshots, append-only events, persisted/observed separation, and idempotent fail-safe recovery.
- `project/architecture/core-components/CORE-COMPONENT-260810-structured-events.md` — append-only versioned redacted lifecycle facts.
- `project/architecture/core-components/CORE-COMPONENT-260810-subprocess-execution.md` — typed long-running process identity and bounded execution.
- `project/architecture/core-components/CORE-COMPONENT-260811-issue-run-orchestration.md` — deterministic worker launch and typed adapter boundaries.
- `project/architecture/core-components/CORE-COMPONENT-260811-completion-evidence-reconciliation.md` — strict `finalizing` and completion conjunction after zero exit.
- `project/architecture/core-components/CORE-COMPONENT-260811-run-reconciliation-control.md` — contiguous replay, identity-strict reconciliation, no duplicate launch, and one-pass observation.
- `project/architecture/core-components/CORE-COMPONENT-260812-rpiv-integration-handoff.md` — ordered non-authorizing progress, immutable result publication, and Runner-owned post-exit reconciliation.
- `project/architecture/core-components/CORE-COMPONENT-260810-error-handling.md` — stable machine-readable refusals, actionable redacted context, and fail-safe ambiguity.
- `project/architecture/ADR/DECISION-LOG.md` registers these contracts; relevant current decisions include 29-30, 40, 49, 53-65, 68-70, 102, 104-113, and 131-134.

## Risks and Open Questions

- Exact production snapshot/event bytes are unavailable here; revision 7-11 progress and revision 12 reconciliation attribution depends on the supplied incident trace.
- A snapshot may advance after any post-wait load but before persistence. `RunStore.save` must remain the final refusal boundary, so this race cannot be treated as proof that a transition persisted.
- The current catch path can issue a second stale save after the first terminal save refusal, potentially obscuring the original cause in diagnostics.
- Existing worker fixtures do not model a held post-launch wait plus concurrent progress/reconciliation writers, so current repository behavior around that interleaving is inferred from source and production evidence rather than exercised by existing coverage.
- PR #33 is unmerged and addresses recovery of surviving successful evidence, not the post-wait stale transition. Its eventual disposition may change the branch baseline that later stages inspect.
- Sparkta Issue #6 and PR #13 remain open; their checked criteria and verification records prove preserved delivery evidence, not final merge or issue closure.
