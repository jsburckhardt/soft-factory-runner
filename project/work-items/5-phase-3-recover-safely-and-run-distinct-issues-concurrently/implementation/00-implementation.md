# Implementation: Issue 5 integration recovery and release 0.1.3

## Scope

- **Issue:** #5
- **Branch:** `fix/5-reconcile-successful-terminal-result`
- **Work item:** `project/work-items/5-phase-3-recover-safely-and-run-distinct-issues-concurrently/`
- **Delivery version:** `0.1.3` (PATCH, backward-compatible integration defect correction)
- **Integration merge:** `dbc17347d5916dcdc9d57edad202bc1e8114815c` with parents `1b0392df1d594f6b297b3534089b41b5f1c881e9` and exact `origin/main` `61ac7dd21ce02709ba714353c61dfb67a05e390d`.
- This record is implementation evidence only. Final verification and acceptance remain owned by Verify.

## Completed tasks

- [x] **T-15** — Committed updated Research/Plan artifacts, confirmed `origin/main` at `61ac7dd`, and created a normal no-ff two-parent merge without history rewriting.
- [x] **T-16** — Resolved exactly the five planned conflicts; retained Issue #34 decisions 163-167 unchanged and added candidate-recovery decisions 168-171 with their 2026-08-15 dates.
- [x] **T-17** — Preserved post-wait latest-snapshot handling and strict inactive candidate recovery, and added a combined regression proving the paths remain separate and relaunch-free.
- [x] **T-18** — Synchronized package, root lock entries, catalog, tests, package filenames, README, docs index, and upgrade guidance to PATCH 0.1.3 with unchanged dependencies.
- [x] **T-19** — Ran focused/full harness and direct root gates, merge/history checks, package dry-run and actual pack/install proof, tarball cleanup, and evidence capture.

## Acceptance evidence

| AC | Concrete implementation and test evidence |
| --- | --- |
| **AC-1** | Merged reconciliation retains lock, lease, filesystem, Git/worktree, tmux, worker/RPIV, result, fresh remote, GitHub, and progress boundaries. `src/recovery-control.test.ts` combined regression and the complete reconciliation suites pass. |
| **AC-2** | Active-process tests preserve one matching RPIV; candidate resume reports `FINALIZATION_RECOVERED`, keeps the attempt, and records zero launches. Post-wait held-worker tests record exactly one original launch. |
| **AC-3** | Status/list/resume/stop/clean/attach/logs regressions pass with shared human/JSON reports. Documentation names `POST_WAIT_STATE_REFUSED`, `RESULT_RECOVERY_CANDIDATE`, and `FINALIZATION_RECOVERY_AVAILABLE`. |
| **AC-4** | `src/publication-concurrency.test.ts` and orchestration fixtures pass, proving distinct locks, branches, worktrees, tmux identities, records, and leases. |
| **AC-5** | Capacity-race fixtures pass and retain explicit issue admission with no automatic selection or over-admission. |
| **AC-6** | Completion/cleanup suites pass: only accepted persisted completion plus exact merged source-head and ownership proof permits automatic worktree/lock cleanup; candidate observations remain query-only. |
| **AC-7** | Recovery-control stop tests retain SIGTERM, bounded 10-second wait, conditional SIGKILL, 5-second wait, worktree, tmux, and transcript evidence. |
| **AC-8** | Candidate, active, dirty, unknown, mismatched, absent-unproved, and malformed-tmux rows retain zero unauthorized destructive calls; the cleanup contract explicitly prohibits candidate authorization. |
| **AC-9** | Closed-unmerged, incomplete, contradictory, and ambiguous PR/ownership fixtures remain blocked and preserve resources with stable remediation. |
| **AC-10** | The combined latest-post-wait/candidate regression passes beside interruption, event/snapshot, same-issue, distinct-issue, and capacity races. Full result: 24 suites and 601 tests passed with no duplicate launch/owner assertions failing. |

## Combined behavior evidence

- `src/orchestration.test.ts` holds Copilot wait while progress and tmux diagnostics advance, then proves zero/nonzero exits use the exact current revision, preserve evidence, reject identity/history races, and remain terminal-idempotent.
- `src/recovery-control.test.ts` now contains `keeps latest post-wait state distinct from strict candidate recovery`: the synthetic current post-wait snapshot is accepted only with exact worker/RPIV identities, while the separate inactive persisted candidate exposes recovery, resumes without launch, and keeps its attempt.
- `CORE-COMPONENT-260811-run-reconciliation-control` and `CORE-COMPONENT-260811-completion-evidence-reconciliation` retain both rule sets. `DECISION-LOG.md` is unique through 171; records 163-167 match `origin/main`, and 168-171 preserve PR #33 decisions.

## Validation evidence

### Focused

- Conflict baseline: `harness checks --focused --json` status `ok`, delegated `just verify-focused`, 24 suites / 600 tests; direct `just verify-focused` passed.
- Combined regression: focused harness and direct gates passed, 24 suites / 601 tests. One first-run assertion was corrected to account for explicit V4-to-V5 normalization before proving the distinct revision paths.
- Release synchronization: focused harness and direct gates passed at package version 0.1.3, 24 suites / 601 tests.

### Full

- `harness checks --json`: status `ok`, scope `full`, delegated `just verify`, exit 0.
- Direct `just verify`: exit 0; ESLint, Prettier, strict type-check, 24 suites / 601 tests, build, and `git diff --check` passed.
- Coverage: 89.21% statements, 85.33% branches, 95.74% functions, and 90.88% lines.
- Pre-work `harness boot --json`: status `ok`, application exit 0, exact bootstrap signal observed, composed checks exit 0.

## Package proof

- `npm pack --dry-run --json` reported `soft-factory-runner@0.1.3`, filename `soft-factory-runner-0.1.3.tgz`, 71 entries, no bundled dependencies.
- Actual `npm pack --json` reported version `0.1.3`, size 132182, unpacked size 596871, shasum `f8286a4ef8a04660e4ba7de026b01a93d8b46dfd`.
- Tar metadata contained name `soft-factory-runner`, version `0.1.3`, executable mapping `soft-factory -> dist/index.js`, unchanged dev dependency ranges, and no runtime dependencies.
- Temporary clean-prefix install reported installed version `0.1.3`; package inventory included `package.json`, `dist/index.js`, `docs/README.md`, and the sole official agent source.
- The generated root tarball and temporary install prefix were removed. No root `soft-factory-runner-*.tgz` remains.
- The package-lock diff changes only the top-level and root-package version values; dependency ranges, resolved metadata, and integrity metadata are unchanged.

## Documentation evidence

| Surface | Evidence |
| --- | --- |
| README behavior and release | `README.md` documents exact post-wait current-state safety, strict candidate query authority/resume, PATCH 0.1.3, and upgrade/reinstall from 0.1.2. |
| Usage and operations | `docs/phase-1-issue-run.md` and `docs/phase-3-recovery-operations.md` retain post-wait refusal, candidate, resume, stop, cleanup, concurrency, and troubleshooting guidance. |
| Package migration | `docs/README.md` and `docs/phase-5-official-assets.md` document local 0.1.3 pack/install, 0.1.2 upgrade, installed metadata confirmation, and manifest reconvergence without claiming registry publication. |
| Architecture | The ADR, reconciliation/completion/cleanup core-components, and decision records 163-171 describe both contracts without artifact renames or creation-date changes. |
| API/config/data/deployment | No network API, configuration option/default, persistence schema, database/data migration, service, container, or deployment procedure changed; no API specification or configuration migration update is required. |

## Harness friction records

Coordinator and Plan buffers were empty at drain time; the Plan record was already durable. Research and Implement observations were persisted, read back with schema 1.2, exact plan/agent/fingerprints, and only then cleared through successful JSON envelopes.

- `.harness/records/retro/2026-08-16/001-issue-5-rpiv-planner-integration-plan.md`
- `.harness/records/retro/2026-08-16/005-issue-5-rpiv-research.md`
- `.harness/records/retro/2026-08-16/006-issue-5-rpiv-implementer.md`
- `.harness/records/retro/2026-08-16/007-issue-5-rpiv-implementer-conflict-scan.md`

Research clear: status `ok`, 5 observations. Implement clears: status `ok`, 6 observations and then 1 follow-up observation.
