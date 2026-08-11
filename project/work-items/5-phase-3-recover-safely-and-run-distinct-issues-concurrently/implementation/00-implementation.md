# Implementation: Phase 3 recovery and explicit concurrency

## Scope and correction proof

- **Issue:** #5
- **Branch:** feat/5-recover-and-run-concurrently
- **Work item:** 5-phase-3-recover-safely-and-run-distinct-issues-concurrently
- **Original correction base:** 262e2b6bc7b3479170651b397bd31002708f43ef
- **Prior correction commit:** 89ad0f694cc43f17d25fe8f0ab4366e3f80c3077
- **Verify continuation base/parent:** 89ad0f694cc43f17d25fe8f0ab4366e3f80c3077
- **Continuation commit:** this record is included in the new Conventional Commit; the immutable SHA is reported in the Implement handoff because a commit cannot embed its own SHA.
- **Acceptance ownership:** this record provides implementation evidence only. Final verification and acceptance remain owned by Verify.

## Completed tasks

- [x] **T-1** — Revisioned v3 snapshots, v2 event replay, strict legacy handling, enumeration, compare-and-delete, and retained logs remain complete.
- [x] **T-2** — Reconciliation now separately observes exact leases, persisted worker identity, strict result identity/content, and permission failures as unknown.
- [x] **T-3** — Shared reconciliation now blocks mismatched resume, missing or ambiguous completion cleanup proof, and exposes actionable remediation.
- [x] **T-4** — Atomic explicit-issue admission remains intact; active-after-escalation now retains exact leased capacity.
- [x] **T-5** — Resume now requires one allowed exact reconciliation decision before preparation, finalization, or interrupted-attempt actions.
- [x] **T-6** — Bounded stop now cancels and releases capacity only after inactivity is proved; still-active escalation remains owned and actionable.
- [x] **T-7** — Cleanup proves lease and lock ownership before every destructive step, resumes same-owner/run durable progress, and treats completed automatic cleanup as already cleaned without another intent transition.
- [x] **T-8** — Human and JSON control rendering now expose equivalent report meaning, and stale operator documentation is corrected.
- [x] **T-9** — V-7 includes active-after-SIGKILL, V-8 retains every partial-progress retry fixture, and V-9 now repeats status/list/reconcile with revision, event-count, and destructive-trace invariants.

The plan task breakdown remains marked complete. This correction changes no task dependency or architecture contract.

## Final Verify continuation correction

| Final Verify defect | Continuation correction and evidence |
| --- | --- |
| Completed automatic cleanup still reported `MERGED_CLEANUP_READY` and authorized another cleanup intent | `buildCompletedReport()` now recognizes same-owner/run completion of worktree, lease, and lock progress, returns `CLEANUP_ALREADY_COMPLETED`, and omits `automatic_clean`. `performCleanup()` also returns immediately when all steps required by the requested mode are already proved complete, so even a stale caller cannot persist another intent. |
| Committed V-9 invoked only one reconciliation-capable path once | V-9 now runs fresh `status`, `list`, and `reconcile` fixtures, invokes each trigger twice, and proves the second report remains `CLEANUP_ALREADY_COMPLETED` with identical revision, event count, Git/tmux trace, and compare-and-delete trace. Each first invocation removes the worktree once and exact lease/lock once; each second invocation performs zero destructive operations. |
| Explicit cleanup after automatic cleanup needed to retain its architecture-defined tmux behavior | Cleanup carries same-owner/run completed steps across mode changes. A dedicated fixture proves explicit clean removes only the retained tmux window after automatic cleanup and does not repeat worktree removal or lease/lock deletion. |
| Partial-progress behavior needed regression protection | The complete V-8 matrix still passes: failures after tmux, worktree, lease, and lock completion replay durable progress, retry once, and refuse unrelated replacements. |

The correction is a bounded T-7/T-9 implementation fix. No task dependency, acceptance criterion, ADR, or core-component contract changed.

## Prior correction Verify findings resolved by 89ad0f6

| Verify defect | Implement correction and evidence |
| --- | --- |
| 1. AC-1 lease, worker, and result facts | src/domain.ts and src/reconciliation.ts add the lease boundary and full parsed AgentResultV1 facts; IssueRunService.runWorker persists worker compound identity. V-2 tests exact/replacement lease, worker history, result-content mismatch, and process unknown classification. |
| 2. AC-3 human/JSON control parity | src/render.ts renders the shared report inside human controls with persisted state, decision/activity, every observation state/code/facts tuple, safe actions, diagnostics, and remediation. V-4 compares human text against the JSON facts. |
| 3. AC-5/AC-7 active after bounded escalation | stop persists STOP_PROCESS_STILL_ACTIVE without clearing RPIV identity, changing running_rpiv, releasing the lease, or deleting owner/worktree/tmux facts. The exact false/false 10-second plus 5-second fixture asserts no cancelled event. |
| 4. AC-8 cleanup authorization and retry | CleanupFactsV1 records ownerId/runId. performCleanup recollects authorization before every step, verifies absence after each operation, exact-deletes observed owner/lease records, and accepts absence only after same-owner/run completed progress. V-8 injects event-ahead snapshot failure after tmux, worktree, lease, and lock, retries each, and refuses an unrelated replacement. |
| 5. AC-9 missing or ambiguous expected PR | Completed reconciliation returns CLEANUP_MERGE_NOT_PROVED for closed-unmerged, missing, incomplete, unavailable, and source mismatch facts, or CLEANUP_OWNERSHIP_UNPROVED for ownership ambiguity. All preserve completed state and resources with remediation. |
| 6. Resume mismatch gate | resume requires PREPARATION_RESUME_AVAILABLE, FINALIZATION_RETRY_AVAILABLE, RUN_INTERRUPTED, active_preserved, or completed no-op as applicable. Preparation, interrupted, and finalization mismatch fixtures return RESUME_REFUSED with no restart or resource creation. |
| 7. Process permission failures | src/live.ts treats only ENOENT as absence. EACCES, EPERM, malformed, and other incomplete observations throw typed failures that reconciliation classifies unknown. Adapter and collector fixtures prove this. |
| 8. V-7 and V-8 gaps | src/recovery-control.test.ts adds exact active-after-SIGKILL, four cleanup step snapshot-failure/replay/retry cases, pre-destruction lease replacement refusal, and partial-cleanup unrelated replacement refusal. |
| 9. Stale documentation | README.md, docs/phase-1-issue-run.md, and docs/phase-3-recovery-operations.md now document lease/result facts, full human/JSON meaning, delivered operator stop, active-after-escalation ownership, and same-owner cleanup retry. |
| 10. Evidence correction | This implementation record replaces stale 129-test and incomplete V-7/V-8 claims with the 146-test correction evidence and the durable correction retro path. |

## Acceptance evidence

| AC | Corrected implementation evidence | Test or observable evidence |
| --- | --- | --- |
| **AC-1** | Reconciliation separately reports lock, lease, filesystem, Git, tmux, worker process, RPIV process, strict result, remote, and GitHub facts. Result files are parsed and compared to run identity and persisted content. | V-2 asserts all ten boundaries, exact and replacement leases, worker identity persistence, RESULT_CONTENT_MISMATCH, and unknown permission facts. |
| **AC-2** | Exact RPIV plus lease/resource identity still yields active_preserved; worker identity is durable and no duplicate RPIV starts. | V-3 preserves attempt 1, records worker-process-identity-recorded, and keeps launch count zero; adoption tests remain green. |
| **AC-3** | Resume, stop, clean, status, list, attach, logs, and reconcile consume common reports. Completed automatic cleanup now reports `CLEANUP_ALREADY_COMPLETED` without `automatic_clean` or a duplicate transition. | V-4 parity remains green; corrected V-9 repeats status, list, and reconcile and proves identical already-cleaned reports plus unchanged revision/event count. |
| **AC-4** | Per-issue lock, branch, worktree, tmux, snapshot/event/log, owner/run, and lease isolation is unchanged. | Existing V-5 repeated distinct-issue fixtures remain green in the 149-test suite. |
| **AC-5** | Exact leases remain capacity authority; a process still active after escalation keeps its slot and cannot free capacity prematurely. | V-6 admission races remain green; the new V-7 false/false fixture proves lease slot 1 and issue owner remain exact. |
| **AC-6** | Automatic cleanup still requires complete MERGED expected-PR source branch/head proof and exact ownership, then records worktree/lease/lock completion once. | V-9 proves status, list, and reconcile each remove the worktree and exact lease/lock once, retain evidence/tmux, and report already cleaned on repetition. |
| **AC-7** | SIGTERM 10 seconds precedes optional SIGKILL and 5 seconds. Cancellation, process clearing, and lease release occur only after observed exit. | V-7 covers graceful, escalated exit, PID reuse refusal, recorded-stop recovery, retention, and exact still-active-after-SIGKILL ownership preservation. |
| **AC-8** | Lease and issue ownership are proved before tmux/worktree destruction; progress carries owner/run across safe mode continuation and every completed operation is post-observed before persistence. | V-8 injects snapshot replacement failure after every step, replays durable event progress, retries without duplicate removal, and refuses lease/worktree replacements with zero further destruction; explicit-after-automatic removes only retained tmux. |
| **AC-9** | Completed state is preserved while missing, closed, incomplete, unavailable, mismatched, ambiguous PR or ownership evidence returns stable blocked cleanup remediation. | V-10 matrix asserts CLEANUP_MERGE_NOT_PROVED or CLEANUP_OWNERSHIP_UNPROVED, blocked activity, unchanged worktree/lock, and zero removal. |
| **AC-10** | All corrections stay behind deterministic typed ports and event-before-snapshot persistence; completed automatic progress cannot create another revision, event, cleanup intent, or destructive call. | 149 deterministic tests pass; V-9 asserts second-invocation revision/event equality and zero additional Git, tmux, lease, or lock operations while V-8 partial retries remain green. |

## Validation evidence

### Targeted correction tests

- The regression-first `just verify-focused -- src/recovery-control.test.ts` run failed exactly on the defect: status/list/reconcile returned `MERGED_CLEANUP_READY`, and explicit-after-automatic cleanup returned `CLEANUP_OWNERSHIP_UNPROVED`.
- After the root-cause fix, `just verify-focused -- src/recovery-control.test.ts` passed 1 suite and 42 tests, including all V-8 partial retry cases and the expanded V-9 matrix.
- `just verify-focused -- src/recovery-control.test.ts src/reconciliation.test.ts` passed 2 suites and 48 tests; `git diff --check` passed.

### Required focused boundary

- `harness checks --focused --json` — status `ok`, command exit 0, data exit 0, scope `focused`, delegated command `just verify-focused`, 8 suites and 149 tests passed.
- Direct `just verify-focused` — exit 0, 8 suites and 149 tests passed; `git diff --check` passed.

### Required full boundary

- Direct `just verify` — exit 0: ESLint, Prettier, strict type-check, 8 suites and 149 tests, coverage, build, and `git diff --check` passed.
- Coverage: **89.91% statements, 84.07% branches, 96.98% functions, 91.31% lines**.
- `harness checks --json` — status `ok`, command exit 0, data exit 0, scope `full`, delegated command `just verify`, with the same green 149-test full gate.
- Continuation pre-work `harness boot --json` — status `ok`; application exit 0, exact short-lived bootstrap signal observed, composed checks status `ok`/exit 0. The boot baseline contained the prior 146-test tree; the correction boundaries above contain 149 tests.

## Documentation evidence

| Category | Corrected evidence |
| --- | --- |
| README/setup/behavior | No continuation edit required. README behavior is unchanged, and the documented one-time automatic cleanup behavior is now enforced. Setup and configuration syntax are unchanged. |
| CLI and usage | No continuation edit required. `docs/phase-3-recovery-operations.md` already promises complete/already-cleaned outcomes and unchanged-input idempotency; the correction makes that existing contract true. |
| Configuration | No option or default changed. Existing max_concurrent_runs guidance remains accurate; active-after-escalation explicitly continues consuming capacity. |
| Recovery and operations | No continuation edit required. Existing guidance already distinguishes automatic retained tmux from explicit tmux removal and same-owner/run progress; the regression proves both semantics. |
| Migration | docs/phase-1-issue-run.md removes the stale claim that only v2 transitions carry evidence and states that proved versioned v3 transitions preserve completion evidence. No new data migration is required. |
| API reference | Not applicable: the product remains a local CLI and no network API contract changed. |
| Architecture | No ADR or core-component text changed. The correction directly enforces ADR-260811-prototype-three-recovery-concurrency and its three adopted core-components. |
| Deployment | No daemon, network service, or deployment procedure changed; local short-lived CLI guidance remains accurate. |

src/documentation.test.ts rejects the stale operator-cancellation and v2-only language and asserts the new stop, observation, parity, and cleanup retry guidance.

## Architecture compliance

- The continuation remains within ADR-260811-prototype-three-recovery-concurrency and requires no Plan return.
- CORE-COMPONENT-260811-run-reconciliation-control is enforced by ten separate observations, strict process/result facts, common rendering, resume gates, and unknown permission handling.
- CORE-COMPONENT-260811-concurrent-run-admission is enforced by retention of an active exact lease until inactivity is durably proved.
- CORE-COMPONENT-260811-owned-resource-cleanup is enforced by pre-step authorization, owner/run progress, post-step proof, exact deletion, blocked completed cleanup, replacement refusal, and transition-free already-completed automatic cleanup.
- Event-before-snapshot, completion conjunctions, TypeScript command/domain/adapter layering, and non-forced removal remain intact.
- No architecture divergence or Plan return is required.

## Harness friction drain evidence

- Prior correction record `.harness/records/retro/2026-08-11/023-issue-5-rpiv-implementer-correction.md` remains tracked.
- Continuation listings returned status `ok`/exit 0: Research and Plan had no pending observations; coordinator had COORD-001; Implement had DL-001 and DL-002. Verifier-owned observations were not listed, changed, or cleared.
- COORD-001 was persisted with schema 1.2, exact `rpiv` agent/plan identity, full description, fingerprint, and disposition `kept` at `.harness/records/retro/2026-08-11/024-issue-5-rpiv.md`.
- DL-001 and DL-002 were persisted with schema 1.2, exact `rpiv-implementer` agent/plan identity, full descriptions/fingerprints, and disposition `kept` at `.harness/records/retro/2026-08-11/025-issue-5-rpiv-implementer.md`.
- Durable read-back verified every pending entry before clear. Coordinator clear returned status `ok`/exit 0 with 1 cleared; Implement clear returned status `ok`/exit 0 with 2 cleared; both post-clear listings returned status `ok`/exit 0 and empty observations.
