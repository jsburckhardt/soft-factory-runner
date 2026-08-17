# Implementation Notes: Issue #36 consistency correction

## Scope

Implemented the authorized consistency correction without changing product behavior or architecture beyond the Plan-stage edits. Current contracts now consistently identify `RunSnapshotV6`, `ReconciliationReportV3` (schema 3), and `StatusFactsV5` (status schema 5). Intentional Issue #29 and compatibility references remain explicitly scoped. Release surfaces remain `0.2.0`.

## Completed Tasks

- [x] T1 — Reconciled the three adopted core-components and Decision Log decisions 131/134 with the existing Issue #36 authority.
- [x] T2 — Corrected README, PRD, Phase 3 operations, and documentation assertions.
- [x] T3 — Re-ran exact-target behavioral and executable-schema proof without production-source changes.
- [x] T4 — Proved release preservation, stale-label classification, validation, documentation, and handoff evidence.

## Executable Schema Evidence

| Contract | Source/emission | Test evidence |
| --- | --- | --- |
| Snapshot v6 | `src/domain.ts`; `src/orchestrator.ts` emits schema 6 | `src/recovery-control.test.ts`, `src/reconciliation.test.ts` |
| Reconciliation v3 | `src/domain.ts`; `src/reconciliation.ts` emits schema 3 | `src/reconciliation.test.ts`, `src/recovery-control.test.ts` |
| Status v5 | `src/domain.ts`; `src/orchestrator.ts` emits schema 5 | `src/recovery-control.test.ts` |

The production `src/` diff is empty when excluding `src/documentation.test.ts`. `package.json` and `package-lock.json` have no diff.

## Acceptance Evidence

- **AC-1:** `src/tmux-context.test.ts`, `src/orchestration.test.ts`, and `src/issue-36-repository.test.ts` passed, covering explicit custom-socket/current-session creation and isolated inventory checks.
- **AC-2:** `src/tmux-context.test.ts` and `src/issue-36-repository.test.ts` passed deterministic repository-derived standalone target and distinct-repository coverage; corrected docs retain this behavior.
- **AC-3:** Runtime assertions passed for snapshot schema 6 and reconciliation schema 3; reconciliation/recovery suites retain complete persisted target equality.
- **AC-4:** `src/recovery-control.test.ts`, `src/reconciliation.test.ts`, and `src/orchestration.test.ts` passed persisted-target lifecycle and shared human/JSON status schema 5 behavior.
- **AC-5:** Orchestration and recovery-control suites passed exact attach, capture/log, status non-mutation, and cleanup targeting coverage.
- **AC-6:** Tmux-context, orchestration, and recovery-control suites passed same-name collision refusal and zero-adoption coverage.
- **AC-7:** `src/tmux-context.test.ts` and `src/issue-36-repository.test.ts` passed isolated twin-server/socket inventory coverage.
- **AC-8:** Tmux-context, orchestration, Doctor, and Issue #36 repository suites passed malformed/stale/contradictory context refusal with unchanged inventory assertions.
- **AC-9:** Tmux-context/orchestration suites passed absence-only fallback and existing expected-name refusal without adoption.
- **AC-10:** `src/publication-concurrency.test.ts`, `src/orchestration.test.ts`, and recovery-control coverage passed one-owner and bounded overlap behavior.
- **AC-11:** Recovery-control and orchestration suites passed repeated absent stop/cleanup outcomes and non-mutating attach/log/resume refusal.
- **AC-12:** Tmux-context, tmux-identity, Doctor, orchestration, and documentation suites passed sentinel/value-free confidentiality coverage; raw tuple and server PID remain non-retained.
- **AC-13:** `src/doctor-tmux.test.ts`, `src/doctor-integration.test.ts`, and `src/doctor-runtime.test.ts` passed bounded targeting classification and isolated cleanup/inventory coverage.
- **AC-14:** `src/issue-36-repository.test.ts` and the focused suite passed repository-local isolated-socket evidence without credentials or network access.
- **AC-15:** `README.md`, `PRD.md`, and `docs/phase-3-recovery-operations.md` retain invoking selection, standalone fallback, later-context routing, refusal, confidentiality, and non-adoption while naming V6/V3/V5; `src/documentation.test.ts` passed exact assertions.
- **AC-16:** Harness and direct focused/full gates exited 0; stale current-contract scan found no planned V5/V2/V4 contradictions, and release surfaces stayed `0.2.0`.

## Documentation Evidence

- **README:** corrected current recovery report/status schema names and exact versions.
- **PRD:** corrected the current completion-reconciliation contract to V3/V5.
- **Operations/migration:** corrected the Phase 3 current schema statement while preserving explicit v1-v5 and Issue #29 compatibility history.
- **Architecture:** Plan-stage corrections update exactly three adopted core-components and Decision Log decisions 131/134; no ADR, component, ID, status, or creation date was added or changed.
- **Tests:** documentation tests now require current V6/V3/V5 labels and explicitly preserve scoped historical `RunSnapshotV5` references.
- **API/configuration/usage/deployment:** no API, configuration option/default, supported workflow, runtime procedure, or deployment behavior changed; no additional documentation is required in those categories.

## Release and Classified Scan Evidence

- `package.json`, both root `package-lock.json` version entries, `OFFICIAL_ASSET_VERSION`, release docs, fixtures, and package tests remain `0.2.0`.
- No dependency metadata, package release file, or production source changed.
- Current live docs and adopted contracts use V6/V3/V5.
- Historical `ADR-260814-tmux-identity-failure-recovery`, Decision Log decision 124, compatibility guides, and historical work-item records retain version-scoped V5 references intentionally.

## Validation

- `harness checks --focused --json`: status `ok`, focused scope, delegated `just verify-focused`, exit 0; 26 suites and 586 tests passed.
- `just verify-focused`: exit 0; 26 suites and 586 tests passed; `git diff --check` passed.
- `harness checks --json`: status `ok`, full scope, delegated `just verify`, exit 0; lint, format, types, 26 suites/586 tests, coverage, build, and diff check passed.
- `just verify`: exit 0; lint, format, types, 26 suites/586 tests, coverage, build, and diff check passed.

## Harness Friction Records

All nonempty repository-shared pre-Verify buffers were scaffolded, populated as schema 1.2 with matching agent/plan IDs and every pending observation, read back, and only then cleared successfully:

- `.harness/records/retro/2026-08-17/006-issue-36-rpiv-research.md` — 4 observations; clear envelope status `ok`, cleared 4.
- `.harness/records/retro/2026-08-17/007-issue-36-rpiv-planner.md` — 1 observation; clear envelope status `ok`, cleared 1.
- `.harness/records/retro/2026-08-17/008-issue-36-rpiv-implementer.md` — 3 observations; clear envelope status `ok`, cleared 3.
- Coordinator `rpiv` buffer was empty (status `ok`), so no synthetic retro was created.

Implementation evidence is prepared for independent Verify review; this note does not claim final acceptance.
