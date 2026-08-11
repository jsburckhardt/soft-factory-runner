# Implementation: Phase 3 recovery and explicit concurrency

## Scope and commit proof

- **Issue:** #5
- **Branch:** `feat/5-recover-and-run-concurrently`
- **Work item:** `5-phase-3-recover-safely-and-run-distinct-issues-concurrently`
- **Implementation commit:** this record is included in the Conventional Commit that contains the complete implementation; its exact immutable SHA is reported in the Implement handoff because a commit cannot embed its own SHA.
- **Acceptance ownership:** this record supplies implementation evidence only. Final verification and acceptance remain owned by Verify.

## Completed tasks

- [x] **T-1** — Added `RunSnapshotV3`, complete `TransitionEventV2`, strict v1/v2 compatibility, contiguous event replay, strict enumeration, retained logs, and owner compare-and-delete.
- [x] **T-2** — Expanded typed file, Git, GitHub, tmux, and process adapters for bounded observations, compound process identity, merge facts, dirtiness, capture, signals, and non-forced removal.
- [x] **T-3** — Added one persisted-versus-observed reconciliation report and numerically sorted union inventory shared by control commands.
- [x] **T-4** — Added strict concurrency configuration and atomic explicit-issue slot leases with exact rollback and resource isolation.
- [x] **T-5** — Added launch-intent/identity transitions, exact active preservation, single-candidate adoption, deterministic resume, and capacity reacquisition.
- [x] **T-6** — Added exact process-group stop with 10-second graceful and 5-second escalation bounds plus capped retained terminal evidence.
- [x] **T-7** — Added report-authorized explicit and merged-PR cleanup, source-head proof, progress persistence, non-forced removal, and fail-safe refusals.
- [x] **T-8** — Added strict Phase 3 CLI dispatch/rendering and complete operator/configuration/migration/deployment documentation.
- [x] **T-9** — Added deterministic repeated interruption/concurrency fixtures, documentation smoke tests, coverage proof, and direct/harness gates.

The task breakdown at `plan/02-task-breakdown.md` marks T-1 through T-9 complete only after task-focused validation passed.

## Changed behavior

- New runs persist revisioned v3 state and replay only complete contiguous identity-matching v2 event chains.
- `reconcile`, `resume`, `stop`, `clean`, `list`, `status`, `attach`, and `logs` consume common typed reconciliation/control facts.
- Matching compound RPIV identity is preserved without attempt increment or duplicate launch; interrupted launch adopts exactly one matching pane descendant.
- Explicit issue starts use atomic repository slots from strict `execution.max_concurrent_runs`; Runner never selects an issue automatically.
- Stop preserves worktree/tmux evidence and stores redacted attempt logs capped at 2 MiB.
- Explicit cleanup and automatic merged cleanup require exact inactive clean ownership; automatic mode verifies immutable PR source branch/SHA and retains branch, tmux, snapshot, events, and logs.

## Acceptance evidence

| AC | Implementation evidence | Test/observable evidence |
| --- | --- | --- |
| **AC-1** | `src/domain.ts`, `src/persistence.ts`, `src/reconciliation.ts`, and `src/live.ts` separate persisted state from lock, filesystem, Git, tmux, worker/RPIV process, result, remote, and GitHub facts. | `V-1` in `src/recovery-persistence.test.ts` proves v3/v2 replay and refusal; `V-2` in `src/reconciliation.test.ts` asserts all nine report keys and individual mismatch/unknown classification. |
| **AC-2** | `IssueRunService.runWorker`, `resume`, and `collectReconciliation` compare complete process identity and preserve `active_preserved` without spawn. | `V-3` in `src/recovery-control.test.ts` runs reconcile/resume/worker over an exact active process: attempt remains 1 and launch count is zero; single-candidate adoption launches zero. |
| **AC-3** | `src/command.ts`, `src/index.ts`, `src/render.ts`, and `IssueRunService` expose strict deterministic resume/stop/clean/list/status/attach/logs/reconcile outcomes from common facts. | `V-4` CLI dispatch tests cover all controls, human/JSON status meaning, list ordering surface, stable exits, and idempotent active facts; `V-11` smokes help and safe missing-state forms through `just run`. |
| **AC-4** | Run admission derives issue lock, branch, worktree, window/pane, run, event, and log identities from each explicit issue while sharing only the repository tmux session. | Repeated `V-5` temporary-root fixture in `src/integration.test.ts` runs three explicit issues at capacity two for 20 repetitions; the two admitted runs have disjoint locks, branches, worktrees, windows/panes, snapshots, and events. |
| **AC-5** | `src/config.ts` parses a strict positive safe integer defaulting to 1; `src/admission.ts` uses exclusive lowest-slot creation, conservative occupied leases, safe limit-reduction blocking, and exact just-created-lock rollback. | `V-6` in `src/reconciliation.test.ts` repeats three-way limit-two races 20 times with exactly two slots and one `CONCURRENCY_LIMIT_REACHED`; `src/index.test.ts` rejects zero, negative, fractional, exponent, and unsafe values. |
| **AC-6** | `loadMergedPullRequest`, reconciliation, and automatic cleanup compare expected PR, `MERGED`, merge time, source branch, and immutable source head; merge commit and remote branch are non-authoritative. | `V-9` in `src/recovery-control.test.ts` uses a differing merge commit and absent remote branch, then proves worktree/lock absent while branch, tmux, snapshot, events, and logs contract remain; adapter arguments/facts are tested in `src/integration.test.ts`. |
| **AC-7** | `IssueRunService.stop` captures before/after, sends exact-group `SIGTERM`, waits 10 seconds, optionally sends `SIGKILL`, waits 5 seconds, persists cancellation, and retains evidence. | `V-7` traces are exactly `SIGTERM -> wait:10000` and `SIGTERM -> wait:10000 -> SIGKILL -> wait:5000`; PID-reuse mismatch sends zero signals; 2 MiB truncation and preserved worktree/tmux/log are asserted. |
| **AC-8** | Cleanup derives authorization from the shared report and refuses active, staged, unstaged, untracked, unknown, mismatched, and ambiguous facts before destructive calls. | `V-8` table tests active and every dirtiness class with zero Git/tmux destruction, mismatched branch replacement preservation, and live Git non-forced dirty-worktree refusal. |
| **AC-9** | Completed-state cleanup blockage is stored separately; CLOSED-unmerged/incomplete or contradictory merge proof never rewrites completion or removes resources. | `V-10` closed-unmerged fixture returns `CLEANUP_MERGE_NOT_PROVED`, preserves `completed`, lock, registration/path bytes, and records zero destructive calls; mismatch matrices are repeatable. |
| **AC-10** | Persistence boundaries, process adoption, slot admission, stop, and cleanup are dependency-injected and use fixed facts/barriers without ambient credentials, tmux, or Copilot. | V-1 refusal cases repeat identically; V-5/V-6 races repeat 20 times; V-3 proves no duplicate launch; all 129 tests pass with no owner over-admission or resource collision. |

## Test and validation evidence

### Task-focused direct recipes

All task boundaries passed with `git diff --check`:

- T-1: `just verify-focused src/completion.test.ts src/recovery-persistence.test.ts` — 42 tests passed.
- T-2: `just verify-focused src/reconciliation.test.ts src/integration.test.ts src/recovery-control.test.ts` — 45 tests passed.
- T-3: `just verify-focused src/reconciliation.test.ts src/recovery-control.test.ts` — 25 tests passed.
- T-4: `just verify-focused src/reconciliation.test.ts src/integration.test.ts` — 25 tests passed.
- T-5: `just verify-focused src/recovery-control.test.ts src/orchestration.test.ts` — 47 tests passed.
- T-6: `just verify-focused src/recovery-control.test.ts` — 20 tests passed.
- T-7: `just verify-focused src/recovery-control.test.ts src/integration.test.ts` — 40 tests passed.
- T-8: `just verify-focused src/index.test.ts src/documentation.test.ts` — 11 tests passed.
- T-9: `just verify-focused` — 8 suites and 129 tests passed.

### Final focused and full boundaries

- `harness checks --focused --json` — status `ok`, exit 0, scope `focused`, delegated command `just verify-focused`, 8 suites/129 tests passed.
- Direct `just verify-focused` — 8 suites/129 tests passed and `git diff --check` passed.
- Direct `just verify` — lint, Prettier check, strict type check, 8 suites/129 tests, build, and `git diff --check` passed.
- Coverage: **89.23% statements, 84.76% branches, 96.33% functions, 90.57% lines**.
- `harness checks --json` — status `ok`, exit 0, scope `full`, delegated command `just verify`, same successful full gate.
- Pre-implementation `harness boot --json` — status `ok`; `just boot` exit 0, exact short-lived bootstrap signal observed, composed checks exit 0/status `ok`.

The first full attempts exposed and then resolved strict unused-symbol lint errors and Prettier drift; the successful direct and harness full results above are post-fix.

## Documentation evidence

| Category | Evidence |
| --- | --- |
| README/setup/behavior | `README.md` now provides local prerequisites, root-recipe quick start, all controls, reconciliation, concurrency, stop, logs, and merged cleanup behavior. |
| CLI/usage | `docs/phase-3-recovery-operations.md` contains the complete command/JSON/exit/idempotency table and root `just run` examples; `docs/phase-1-issue-run.md` links the delivered continuation. |
| Configuration | README and the Phase 3 guide document strict `execution.max_concurrent_runs`, default 1, leases, unsafe reduction, capacity refusal, and explicit selection only. |
| Recovery/operations | The Phase 3 guide contains revision replay, every observation boundary, exact process identity, resume table, bounded stop, retained logs, explicit/automatic cleanup, partial progress, and troubleshooting codes. |
| Migration | The Phase 3 guide documents v1/v2 read compatibility, explicit proved v3 transition, legacy event-ahead refusal, default-one capacity compatibility, and no destructive migration/purge. |
| Deployment | `docs/README.md` and the Phase 3 guide state local short-lived CLI prerequisites, no daemon, next-invocation automatic trigger, and no network service/API deployment. |
| API reference | Not applicable: the product remains a local CLI and introduces no network API. This rationale is explicit in `docs/README.md` and the migration section. |
| Architecture | Plan-created `ADR-260811-prototype-three-recovery-concurrency.md`, the three new core-components, and DECISION-LOG 64-76 are included unchanged as the governing explanatory architecture; implementation stayed within those contracts, so no Plan return or architecture revision was required. |

`src/documentation.test.ts` names and checks every documentation subject and executes help plus safe missing-state controls through the root `justfile`.

## Architecture compliance

- Strict TypeScript command/domain/adapter separation is preserved.
- Event-before-snapshot order and the existing completion-proof conjunction remain intact.
- External commands use executable/argument arrays, bounded typed results, and no shell interpolation.
- Unknown/contradictory facts never authorize launch, signaling, reuse, or cleanup.
- Issue locks and slot leases use exclusive creation and exact-content deletion.
- Cleanup uses immutable PR source-head proof and non-forced worktree removal.
- No ADR or core-component deviation was required.

## Harness friction drain evidence

Read-back verified schema 1.2, exact plan/agent identity, `disposition: kept`, and every pending observation before each nonempty buffer was cleared:

- Research: `.harness/records/retro/2026-08-11/020-issue-5-rpiv-research.md` — 4 observations persisted; clear envelope status `ok`, exit 0, `cleared: 4`.
- Plan: `.harness/records/retro/2026-08-11/020-issue-5-rpiv-planner.md` — 1 observation persisted; clear envelope status `ok`, exit 0, `cleared: 1`.
- Implement: `.harness/records/retro/2026-08-11/021-issue-5-rpiv-implementer.md` — 5 observations persisted; clear envelope status `ok`, exit 0, `cleared: 5`.
- Implement post-refinement: `.harness/records/retro/2026-08-11/022-issue-5-rpiv-implementer-post-refinement.md` — 1 observation persisted after the final safety refinement; read-back passed and clear envelope status `ok`, exit 0, `cleared: 1`.
- Coordinator `rpiv` had no pending observations and required no record/clear.
- Final JSON listings for `rpiv`, `rpiv-research`, `rpiv-planner`, and `rpiv-implementer` all returned status `ok`, exit 0, and empty observations.
