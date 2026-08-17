# Implementation: Issue 36 exact invoking tmux context

## Scope and completed tasks

- [x] T1 — Model and resolve exact tmux targets.
- [x] T2 — Route every tmux operation through persisted explicit selectors.
- [x] T3 — Integrate exact reconciliation, lifecycle control, and concurrency behavior.
- [x] T4 — Add safe value-free Doctor target classification without changing the 24 IDs.
- [x] T5 — Add isolated custom-socket, fallback, refusal, and AC-ledger fixtures.
- [x] T6 — Update user, recovery, Doctor, migration, and release documentation.
- [x] T7 — Preserve eight skill deletions and remove four stale lock references.
- [x] T8 — Synchronize the backward-compatible functionality release at 0.2.0.
- [x] T9 — Run focused/full root and harness validation and package smoke proof.

Implementation remains within ADR-260817 and CORE-COMPONENT-260817. No architecture or plan deviation was required.

## Acceptance evidence

| Criterion | Concrete evidence |
| --- | --- |
| AC-1 | `src/tmux-context.test.ts` starts selected and unrelated isolated sockets, resolves the custom invoking socket/current session, creates one issue window, verifies the complete record, and proves unrelated inventory equality. `src/live.ts` uses the canonical socket and session ID. |
| AC-2 | `deriveStandaloneTmuxTarget` hashes canonical repository identity; resolver tests prove repeatability and separation for a legacy-normalization collision pair. The standalone integration proves owned metadata/session creation. |
| AC-3 | `RunSnapshotV6`, `TmuxTargetV2`, `PaneLineageV2`, strict persistence/event parsing, and reconciliation tests persist and compare socket path/device/inode, session, window, pane, and cwd. Legacy v1-v5 readers remain non-authorizing when exact selectors are absent. |
| AC-4 | Orchestration, reconciliation, recovery-control, and tmux identity suites prove lifecycle behavior uses the persisted target independent of caller context; human/JSON facts use the same complete report. |
| AC-5 | The isolated twin-server fixture proves create/observe/remove changes only the selected server. Adapter traces prove logs/attach use pane identity and cleanup uses immutable window identity. |
| AC-6 | Table-driven malformed/partial/stale tests return closed `TMUX_CONTEXT_REFUSED` reasons before commands; same-name fallback integration returns `RESOURCE_OWNERSHIP_UNKNOWN` and byte-identical inventory. |
| AC-7 | `src/tmux-identity.test.ts` requires explicit `-S` on every lifecycle call, pane IDs for capture/select/restart, and window IDs for removal; twin-server inventory remains unchanged. |
| AC-8 | Stopped socket, malformed record, mismatched target, recovery, and Doctor invalid-context tests prove refusal/non-ready behavior before mutation. |
| AC-9 | Standalone ownership metadata is created atomically, mismatches/stale ownership refuse, deterministic names are collision-resistant, and expected-name resources are never adopted. |
| AC-10 | Existing `src/orchestration.test.ts`, `src/publication-concurrency.test.ts`, and recovery concurrency fixtures retain exclusive issue ownership and whole-record transition behavior while carrying v6 targets. |
| AC-11 | Recovery-control and reconciliation tests prove absent/mismatch attach/logs/resume refusal and stable terminal stop/cleanup semantics; live cleanup targets only the persisted immutable window. |
| AC-12 | Resolver and Doctor sentinel assertions prove raw tuple/PID values are discarded and value-free; allowed child environments omit `TMUX`/`TMUX_PANE`; strict schemas contain only selected identity facts. |
| AC-13 | `fixtures/doctor/ready.json`, Doctor integration/contracts, and `classifyDoctorTmuxTargeting` prove `invoking-valid`, `standalone-fallback`, and closed `invalid-context` evidence while retaining exactly 24 ordered IDs and human/JSON parity. |
| AC-14 | `fixtures/tmux/issue-36-scenarios.json` has one direct row for every AC-1 through AC-14; `src/tmux-context.test.ts` validates the ledger and repository-local isolated cleanup. |
| AC-15 | README, PRD, docs index, Phase 1, Phase 3, Phase 4, Phase 5, and RPIV integration docs describe selection, fallback, v6 migration, exact lifecycle routing, refusal/non-adoption, confidentiality, Doctor evidence, repeated absence, and local/no-service boundaries. `src/documentation.test.ts` enforces these surfaces. |
| AC-16 | `src/issue-36-repository.test.ts` proves exactly eight tracked deletions, four absent lock keys, zero live references/symlinks, and 0.2.0 version synchronization. Pack/install smoke reports 0.2.0 and the generated tarball was removed. Focused/full validation passed. |

## Documentation evidence

- Changed `README.md`, `PRD.md`, `docs/README.md`, `docs/phase-1-issue-run.md`, `docs/phase-3-recovery-operations.md`, `docs/phase-4-repository-doctor.md`, `docs/phase-5-official-assets.md`, and `docs/rpiv-integration-contract.md`.
- API impact: no network API or API specification changed. The local persistence contract advances new runs to v6 and is documented as a compatibility migration.
- Configuration impact: no key/default changed. Selection derives from command-entry process evidence or complete absence.
- Operations/deployment impact: lifecycle commands now use persisted explicit tmux selectors; no service, container, daemon, database, or deployment procedure was added.
- Architecture documentation: ADR-260817, CORE-COMPONENT-260817, and DECISION-LOG 172-179 are included and implementation conforms to them.

## Deletion and reference proof

`git diff --name-status --diff-filter=D` reports exactly the eight requested `.agents/skills` paths. `skills-lock.json` retains only the three live skills. A tracked live-scope `git grep` over `.agents`, `.github`, assets, docs, src, README, PRD, package metadata, and the skill lock returned no deleted name/path references; the `.agents` symlink inventory is empty. Historical plan/research/retro evidence is intentionally excluded.

## Release and package proof

- `package.json`, both root lock values, and `OFFICIAL_ASSET_VERSION`: 0.2.0.
- `npm pack --dry-run --json`: `soft-factory-runner@0.2.0`, `soft-factory-runner-0.2.0.tgz`, 73 entries, zero bundled dependencies.
- Actual `npm pack --json` followed by clean-prefix `npm install --omit=dev` reported installed version 0.2.0 and binary `dist/index.js`; installed `soft-factory --help` printed the Phase 5 heading.
- The generated root tarball and temporary install prefix were removed. Dependency ranges and third-party lock metadata were not changed.

## Validation

- `harness checks --focused --json`: status `ok`, delegated `just verify-focused`, exit 0, 26 suites / 578 tests.
- Direct `just verify-focused`: exit 0, 26 suites / 578 tests, `git diff --check` clean.
- `harness checks --json`: status `ok`, delegated `just verify`, exit 0.
- Direct `just verify`: lint, format, typecheck, 26 suites / 578 tests, coverage (89.14% statements, 84.62% branches, 95.84% functions, 90.85% lines), build, and diff check all passed.

## Harness friction records

- `.harness/records/retro/2026-08-17/001-issue-36-rpiv-research.md`
- `.harness/records/retro/2026-08-17/002-issue-36-rpiv-implementer.md`
- `.harness/records/retro/2026-08-17/003-issue-36-rpiv-planner.md`

All pending coordinator, Research, Plan, and Implement buffers were listed. The three nonempty buffers were persisted with schema 1.2, read back, then cleared successfully; the coordinator buffer was empty. Final acceptance remains owned by Verify.
