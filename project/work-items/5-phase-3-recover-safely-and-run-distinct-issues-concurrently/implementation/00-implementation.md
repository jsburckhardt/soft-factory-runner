# Implementation: Issue 5 interrupted-finalization recovery correction

## Scope

- **Issue:** #5
- **Branch:** `fix/5-reconcile-successful-terminal-result`
- **Work item:** `project/work-items/5-phase-3-recover-safely-and-run-distinct-issues-concurrently/`
- **Delivery version:** `0.1.2` (PATCH, backward-compatible defect correction)
- **Architecture:** implemented within ADR-260811-prototype-three-recovery-concurrency and the updated reconciliation, completion-evidence, cleanup, tmux-diagnostic, persistence, locking, RPIV-handoff, and SemVer core-components. No architecture deviation or Plan return was required.
- This record is implementation evidence only; final verification and acceptance remain owned by Verify.

## Completed tasks

- [x] **T-10** — Added strict `RESULT_RECOVERY_CANDIDATE` policy bound to running state, proved process inactivity, issue/branch, ordered AC results, and snapshotted final validation.
- [x] **T-11** — Staged process/result collection before candidate-keyed worktree, fresh-remote, and PR observations; preserved one call per boundary and unknown-before-mismatch precedence.
- [x] **T-12** — Added explicit `FINALIZATION_RECOVERY_AVAILABLE` resume into `finalizing` with unchanged attempt and zero worker/RPIV launch.
- [x] **T-13** — Added human/JSON result-authority rendering, operator guidance, and synchronized package/catalog/docs metadata at `0.1.2` without dependency churn.
- [x] **T-14** — Added the reusable incident fixture and negative matrix while retaining historical recovery, concurrency, stop, completion, cleanup, tmux, package, and documentation suites.

## Acceptance evidence

| AC | Implementation and observable test evidence |
| --- | --- |
| **AC-1** | `collectReconciliation` reports lock, lease, filesystem, candidate-head Git, tmux, worker, RPIV, progress, strict result, fresh remote, and candidate-number PR facts. V-13 composite tests assert candidate result/remote/PR codes and one worktree/remote/PR observation. |
| **AC-2** | Exact active RPIV is checked before an unaccepted result mismatch and returns `active_preserved`. V-2/V-3 and V-14 prove unchanged attempt and zero process launch for both active preservation and candidate finalization. |
| **AC-3** | Shared reports expose stable `RESULT_RECOVERY_CANDIDATE`, `FINALIZATION_RECOVERY_AVAILABLE`, unknown/mismatch/refusal codes, safe actions, remediation, and `resultAuthority`. Human and JSON status tests prove equivalent candidate and cleanup-authority meaning. |
| **AC-4** | Existing repeated distinct-issue fixtures remain green, preserving disjoint lock, branch, worktree, tmux, run, and lease identities. |
| **AC-5** | Existing atomic capacity-race fixtures remain green; no candidate path selects an issue, claims a new slot, or launches work. |
| **AC-6** | Candidate-only reports never expose `automatic_clean`; candidate GitHub observations are query-only. Existing MERGED source-head cleanup tests remain green and still require persisted completed proof. |
| **AC-7** | Existing bounded SIGTERM/10-second/SIGKILL/5-second and retained-evidence tests remain green in the 566-test suite. |
| **AC-8** | Malformed tmux remains unknown; proved absence permits only candidate finalization resume. V-13/V-15 assert no transition, restart, launch, Git mutation, or cleanup for malformed and contradictory evidence. |
| **AC-9** | Wrong AC/final-validation bindings suppress candidate PR queries and return `RESUME_REFUSED`; divergent remote and malformed tmux remain visible with unknown precedence and preserved resources. Existing closed/unproved PR cleanup refusals remain green. |
| **AC-10** | Composite exact/absent/malformed rows assert bounded call counts, unchanged running snapshot before resume, zero launch, and deterministic typed outcomes; all historical interruption and concurrency tests pass. |

## Validation evidence

### Focused

- `harness checks --focused --json` — status `ok`, scope `focused`, delegated `just verify-focused`, exit 0, 23 suites / 566 tests.
- Direct `just verify-focused` — exit 0, 23 suites / 566 tests, `git diff --check` passed. This boundary was run after candidate policy/resume work, after rendering/version/docs work, and after marking T-10 through T-14 complete.
- One focused retry was required after the active-process precedence change invalidated an old result-boundary expectation; the test now explicitly proves active preservation while other authorizing boundary failures still block.

### Full

- First `harness checks --json` failed on ESLint because staged reconciliation left the unused `expectedWorktreeHead` helper. The helper was removed.
- Rerun `harness checks --json` — status `ok`, scope `full`, delegated `just verify`, exit 0.
- Direct `just verify` — exit 0: ESLint, Prettier, strict type-check, 23 suites / 566 tests, coverage, build, and `git diff --check` passed.
- Coverage: **89.23% statements, 85.36% branches, 95.88% functions, 90.88% lines**.
- Package tests run by the root gate prove dry-run pack metadata, temporary packed installation, installed `0.1.2` metadata, official-manifest `0.1.2` convergence, and preservation of dependency `0.1.0` entries. The lock diff changes only the root package versions.
- Pre-work `harness boot --json` was `ok`: application exit 0, exact bootstrap signal observed, and composed full checks exit 0.

## Documentation evidence

| Surface | Evidence |
| --- | --- |
| README behavior/usage | `README.md` documents unaccepted candidate query authority, active precedence, explicit relaunch-free resume, malformed/absent tmux limits, fail-closed contradictions, and human/JSON authority. |
| Recovery operations | `docs/phase-3-recovery-operations.md` documents exact candidate conjunction, decision codes, resume flow, cleanup prohibition, troubleshooting, and no migration/deployment/API impact. |
| Package upgrade/configuration | `README.md`, `docs/README.md`, and `docs/phase-5-official-assets.md` document current `0.1.2`, upgrade/reinstall from `0.1.1`, installed-version confirmation, and manifest reconvergence. No configuration option/default changed. |
| API/data/deployment | No network API, database/data migration, service, container, daemon, or deployment procedure changed; the product remains a short-lived local CLI. |
| Architecture | The Plan-stage ADR, decision log, and three updated core-components are included unchanged by Implement and are enforced by documentation tests. |

## Harness friction records

Pending coordinator, Research, Plan, and Implement buffers were inspected. Plan had no pending entries because its durable record already existed. Every nonempty buffer was persisted and read back as schema 1.2 with the exact work-item `plan_id`, agent, observation descriptions/fingerprints, and `disposition: kept` before its successful JSON clear:

- `.harness/records/retro/2026-08-15/011-issue-5-rpiv-planner-recovery-plan.md`
- `.harness/records/retro/2026-08-15/012-issue-5-rpiv.md`
- `.harness/records/retro/2026-08-15/013-issue-5-rpiv-research.md`
- `.harness/records/retro/2026-08-15/014-issue-5-rpiv-implementer.md`

Clear envelopes were `ok`: coordinator 1, Research 4, Plan 0, and Implement 4 observations cleared.
