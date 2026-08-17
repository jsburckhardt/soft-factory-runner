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
| AC-1 | `src/orchestration.test.ts` now executes one complete `IssueRunService.run` against a real custom socket/session, proves the persisted exact session/window/pane, and compares an isolated default-server tripwire byte-for-byte with zero issue window. `src/tmux-context.test.ts` independently inventories the exact created pane and cleanup. |
| AC-2 | `src/tmux-context.test.ts` executes two sequential clean standalone create/remove/server-clean cycles for one repository and proves equal socket/session targets; distinct repository names and the legacy-normalization collision pair produce distinct targets. |
| AC-3 | `RunSnapshotV6`, `TmuxTargetV2`, `PaneLineageV2`, strict persistence/event parsing, and reconciliation tests persist and compare socket path/device/inode, session, window, pane, and cwd. Legacy v1-v5 readers remain non-authorizing when exact selectors are absent. |
| AC-4 | Orchestration, reconciliation, recovery-control, and tmux identity suites prove lifecycle behavior uses the persisted target independent of caller context; human/JSON facts use the same complete report. |
| AC-5 | The live attach fixture starts from another selected window/pane and proves `select-window <persisted-window>` then `select-pane <persisted-pane>` occur before attachment. Exact logs and immutable window cleanup preserve unrelated inventory. |
| AC-6 | Table-driven malformed/partial/stale tests return closed `TMUX_CONTEXT_REFUSED` reasons before commands; same-name fallback integration returns `RESOURCE_OWNERSHIP_UNKNOWN` and byte-identical inventory. |
| AC-7 | The twin-server fixture creates two persisted targets with identical session/window names, proves transcript isolation, cleans the first exact window, and byte-compares the second server inventory unchanged; adapter tests retain explicit `-S` and immutable IDs. |
| AC-8 | The finite malformed/stopped/nested-record/contradictory-pane/unresolvable matrix returns `TMUX_CONTEXT_REFUSED` and byte-compares run state plus both isolated server inventories for every row. Doctor covers all six closed refusal reasons with two measured inventory samples. |
| AC-9 | Standalone ownership metadata is created atomically, mismatches/stale ownership refuse, deterministic names are collision-resistant, and expected-name resources are never adopted. |
| AC-10 | Same-issue admission still proves one owner/window. New bounded service barriers overlap cleanup with status at the complete pre-target and cleanup with reconciliation at complete absence; isolated tmux overlaps also accept only a whole exact record or absence and preserve unrelated inventory. |
| AC-11 | Recovery-control and reconciliation tests prove absent/mismatch attach/logs/resume refusal and stable terminal stop/cleanup semantics; live cleanup targets only the persisted immutable window. |
| AC-12 | Resolver and Doctor sentinel assertions prove raw tuple/PID values are discarded and value-free; allowed child environments omit `TMUX`/`TMUX_PANE`; strict schemas contain only selected identity facts. |
| AC-13 | `classifyDoctorTmuxTargeting` now takes two real before/after inventory samples and computes, rather than hard-codes, `ambientUnchanged`/`unrelatedUnchanged`; changed inventory fails readiness. Fixtures cover valid, fallback, and every invalid reason while retaining 24 IDs and value-free output. |
| AC-14 | `fixtures/tmux/issue-36-scenarios.json` schema v2 names concrete fixture paths and machine assertions for every AC-1 through AC-14, plus explicit no-credential/no-network/unconditional-cleanup facts; tests reject generic ledger pointers. |
| AC-15 | README, PRD, Phase 1, Phase 3, and Phase 4 now consistently describe v6/current-context behavior, measured Doctor inventories, exact lifecycle routing, fallback/refusal/confidentiality, and legacy v1-v5 limits. Stale README v5, Phase 3 schema-v5, and PRD deterministic-single-session/v5 claims were removed and documentation tests parse the complete v6 example. |
| AC-16 | `src/issue-36-repository.test.ts` proves exactly eight tracked deletions, four absent lock keys, zero live references/symlinks, and 0.2.0 version synchronization. Pack/install smoke reports 0.2.0 and the generated tarball was removed. Focused/full validation passed. |


## Verify correction cycle

The one allowed correction cycle fixed every returned AC-1, AC-2, AC-5, AC-7, AC-8, AC-10, AC-13, AC-14, and AC-15 defect without architecture deviation. Package proof after the final build reported dry-run, packed, and installed version `0.2.0`, 73 entries, successful installed CLI help smoke, and removed temporary pack/install roots. The original eight committed skill deletions, four removed lock keys, and zero live deleted-skill references remain unchanged.

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

- Correction `harness checks --focused --json`: status `ok`, delegated `just verify-focused`, exit 0, 26 suites / 586 tests.
- Correction direct `just verify-focused`: exit 0, 26 suites / 586 tests, `git diff --check` clean.
- Correction `harness checks --json`: first exposed four Prettier failures; after formatting, status `ok`, delegated `just verify`, exit 0.
- Correction direct `just verify`: lint, format, typecheck, 26 suites / 586 tests, coverage (89.16% statements, 84.74% branches, 95.69% functions, 90.84% lines), build, and diff check all passed.

## Harness friction records

- `.harness/records/retro/2026-08-17/001-issue-36-rpiv-research.md`
- `.harness/records/retro/2026-08-17/002-issue-36-rpiv-implementer.md`
- `.harness/records/retro/2026-08-17/003-issue-36-rpiv-planner.md`
- `.harness/records/retro/2026-08-17/004-issue-36-rpiv-implementer-postcommit.md`
- `.harness/records/retro/2026-08-17/005-issue-36-rpiv-implementer-correction.md`

All pending coordinator, Research, Plan, and Implement buffers were listed. The initial three nonempty buffers, one post-commit Implement observation, and five concrete correction observations were persisted with schema 1.2, read back, then cleared successfully; the coordinator buffer was empty. Final acceptance remains owned by Verify.
