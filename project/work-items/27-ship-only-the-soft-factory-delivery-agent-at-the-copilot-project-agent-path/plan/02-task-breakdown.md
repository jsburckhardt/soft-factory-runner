# Task Breakdown: Ship only the Soft Factory delivery agent

Tasks are ordered by dependency. Status values belong to the Implement stage.

## Task T1: Model the sole current catalog and closed legacy ownership grammar

- **Status:** Complete
- **Complexity:** High
- **Dependencies:** None
- **Acceptance Criteria:** AC-1, AC-4, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11, AC-13
- **Related ADRs:** ADR-260812-official-asset-distribution-installation; ADR-260810-typescript-node-cli; ADR-260812-repository-doctor-readiness
- **Related Core-Components:** CORE-COMPONENT-260812-official-asset-installation-contract; CORE-COMPONENT-260810-error-handling; CORE-COMPONENT-260810-development-standards

### Description
Replace the three-entry selectable catalog with the sole current delivery-agent entry while adding a separate closed migration vocabulary for the exact current and three legacy identity-destination pairs. Refactor manifest parsing so safe historical ownership can be read even though removed assets are no longer selectable. Preserve schema version 1, define stable migration rank, allow only the exact old/current soft-factory bridge, and serialize final state to one current entry.

Keep current selection and legacy ownership types distinct so a removed asset can authorize retirement but can never re-enter command selection or the recommended set. Return stable typed preflight failures for malformed metadata, duplicates, contradictions, unsupported destinations, and unsafe paths.

### Acceptance Criteria
- AC-1: `OFFICIAL_ASSET_CATALOG` contains exactly `agent:soft-factory` at `.github/agents/soft-factory.agent.md`.
- AC-4: final manifest serialization records the sole current type, name, package version, protocol 1, destination, and desired digest.
- AC-6, AC-7, AC-8, AC-11: parser output can represent absent, matching, current-destination, dual-destination, assessor, and skill ownership needed by convergence.
- AC-9, AC-13: the model identifies only known legacy ancestors and never asks clean installation to create them.
- AC-10: every unknown, malformed, duplicate, contradictory, unstable-order, or unsafe ownership shape fails before a mutation plan is returned.

### Test Coverage
- Implement V1 catalog and package-surface assertions in `src/official-assets.test.ts`.
- Add manifest unit tables for the four allowed identity-destination pairs, stable rank, exact dual-agent exception, unknown destination, duplicate pair, duplicate destination, contradictory identity, malformed digest, unsupported protocol/schema, extra fields, and unsafe paths.
- Support V4, V6, and V7 fixture construction without weakening current final-manifest assertions.

### Expected Evidence
- Jest output naming the closed catalog and migration-parser cases.
- Serialized final manifest fixture with exactly one current entry.
- Mutation-port trace remains empty for every parser or path refusal.
- Diff shows no removed identity in selectable catalog or recommended selection data.

## Task T2: Implement cross-root convergence, retirement, and rollback

- **Status:** Complete
- **Complexity:** Very high
- **Dependencies:** T1
- **Acceptance Criteria:** AC-4, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11, AC-12, AC-13, AC-15
- **Related ADRs:** ADR-260812-official-asset-distribution-installation; ADR-260812-repository-doctor-readiness
- **Related Core-Components:** CORE-COMPONENT-260812-official-asset-installation-contract; CORE-COMPONENT-260810-error-handling; CORE-COMPONENT-260810-development-standards

### Description
Refactor `AssetInstallationService`, live filesystem ports, and rendering around one immutable preflight plan spanning `.github/` and `.agents/`. Classify every recognized destination before mutation, then represent current writes or adoption, stale-entry retirement, reversible file retirement, eligible empty-directory removal, final manifest bytes, and the complete affected-path set.

Broaden path containment only to the exact managed roots while rejecting symlink or non-directory parents. Stage replacements beside destinations for same-volume renames. Preserve exact backups, apply or adopt the current file, move proved obsolete files to reversible backups, remove only eligible empty ancestors, and replace the manifest last. Roll back in reverse order and verify exact prior inventory; expose all planned affected paths and direct remediation when rollback is uncertain.

Add explicit retirement outcomes to the typed result and renderer. Individual and recommended installation must invoke the same complete reconciliation, including retirement-only behavior.

### Acceptance Criteria
- AC-4, AC-6, AC-11: clean, old-path, absent-old, desired-new, and previous-owned-new inputs converge to trusted current bytes and one manifest entry.
- AC-7: dual destinations mutate only when both independently satisfy ownership rules.
- AC-8, AC-9: only digest-proved obsolete files retire; stale entries retire; siblings and nonempty directories remain; only empty eligible ancestors are removed.
- AC-10: path indirection, collisions, local modifications, and metadata ambiguity return stable actionable no-change failures.
- AC-12, AC-15: every mutating plan is rollback-protected across both roots at every injectable boundary.
- AC-13: a repeated successful invocation performs zero writes and retains the canonical final tree.

### Test Coverage
- Implement V3 through V9 in temporary repositories through the same service composition used by production.
- Extend the filesystem port and deterministic recording adapter only with operations required for reversible retirement, path verification, and boundary injection; add no production fault flag.
- Assert byte hashes, path kinds, directory existence, inode preservation for adoption, mutation order, manifest-last ordering, exact rollback inventory, and uncertain path reporting.
- Retain `src/asset-doctor-regression.test.ts` to prove the canonical 24-check Doctor authority is unchanged.

### Expected Evidence
- Named Jest state-matrix and fault-matrix output.
- Before/after inventory equality for every refusal and exact rollback case.
- Trace showing current destination mutation before legacy retirement and manifest replacement last.
- `ASSET_ROLLBACK_UNCERTAIN` fixture output listing `.github/agents/soft-factory.agent.md`, `.agents/manifest.json`, and every planned legacy path for the scenario.

## Task T3: Finalize the APS Copilot delivery agent contract

- **Status:** Complete
- **Complexity:** Medium
- **Dependencies:** None
- **Acceptance Criteria:** AC-2, AC-3, AC-16
- **Related ADRs:** ADR-260812-official-asset-distribution-installation; ADR-260812-rpiv-integration-completion-contract
- **Related Core-Components:** CORE-COMPONENT-260812-official-asset-installation-contract; CORE-COMPONENT-260812-rpiv-integration-handoff; CORE-COMPONENT-260811-completion-evidence-reconciliation

### Description
Complete `assets/official/soft-factory.agent.md` as the accepted APS delivery agent, preserving useful preliminary APS direction while replacing generic `bash`, lifecycle routing, Doctor-first order, status follow-up, and inferred result fields. Use the repository APS VS Code adapter frontmatter and exact qualified terminal tools.

The process must reject every invalid input class before tool use, then call instructions, Doctor, and ready-only run in exact order. It must stop and preserve the applicable structured output on instructions failure, non-ready Doctor, or run completion; it must not retry, call status, or infer completion. Separate dispatch acceptance from ticket completion and retain every Runner-only resource prohibition.

Refactor `src/official-agent-contracts.ts` to use mutation-sensitive static assertions for frontmatter, APS sections, input directives, process ordering, direct commands, exact-result preservation, prohibited operations, and dispatch/completion separation. Remove assessor contract assertions.

### Acceptance Criteria
- AC-2: the asset has one ordered instance of every APS section, tag newlines, exact Copilot frontmatter, delivery-primary directives, and all competing-path prohibitions.
- AC-3: invalid input is rejected before any terminal tool; instructions precede Doctor; run is ready-only; output is preserved; dispatch and completion remain distinct.
- AC-16: deleting or reordering any required static clause, tool, process relation, or result field makes the contract check fail.

### Test Coverage
- Implement V2 in `src/official-assets.test.ts` with exact frontmatter parsing, APS section/order/newline checks, forbidden tool and lifecycle checks, and process substring ordering.
- For every required directive and format field, mutate all occurrences and assert failure.
- Assert direct `soft-factory ... --json` commands, no shell chaining/wrappers, no retry/status process, and completion default `unknown`.

### Expected Evidence
- Static contract Jest output with one test per behavior family.
- Agent frontmatter snapshot showing only the qualified terminal tools and required recommended fields.
- Process-order indices proving validation before first `USE`, instructions before Doctor, and Doctor-ready branch before run.

## Task T4: Contract CLI selectors and package publication

- **Status:** Complete
- **Complexity:** Medium
- **Dependencies:** T1, T3
- **Acceptance Criteria:** AC-1, AC-4, AC-5, AC-16
- **Related ADRs:** ADR-260812-official-asset-distribution-installation; ADR-260810-typescript-node-cli
- **Related Core-Components:** CORE-COMPONENT-260812-official-asset-installation-contract; CORE-COMPONENT-260806-project-command-interface; CORE-COMPONENT-260810-error-handling

### Description
Narrow `parseCommand`, `HELP_TEXT`, and recommended selection to the sole agent. Removed assessor and skill forms must flow through existing stable `CLI_INVALID` syntax handling. Delete the tracked assessor and skill product sources and their now-empty tracked source directory, but do not touch the untracked reference agent.

Change `package.json` and package CI checks from the broad official directory to the exact `assets/official/soft-factory.agent.md` allowlist entry. Package validation must reject every extra `assets/official/` path, including the untracked reference if present in the working tree, while retaining `dist/` and documentation.

Update the compiled digest only after T3 final agent bytes are stable. Ensure both public install forms select the same one-entry request and built CLI installation writes the new destination while the manifest remains under `.agents/`.

### Acceptance Criteria
- AC-1: catalog, recommended selection, source tree, and tarball expose one consumable official asset.
- AC-4: both supported forms dispatch the same one-agent convergence and built package bytes match the catalog digest.
- AC-5: removed selectors fail as unsupported and help names only current forms and destination semantics.
- AC-16: package inventory contains the sole agent and excludes assessor, skill, and reference sources.

### Test Coverage
- Implement V1 parser and package inventory tests plus V11 built-package smoke.
- Assert exact accepted and rejected CLI argument arrays and stable exit-2 `CLI_INVALID` output.
- Parse `npm pack --dry-run --json` and compare official asset files to an exact one-element list rather than only checking catalog inclusion.
- Exercise individual and recommended built CLI forms in temporary target repositories.

### Expected Evidence
- Exact package file-list JSON containing `assets/official/soft-factory.agent.md` and no other official source.
- CLI table showing accepted current forms and rejected assessor/skill forms.
- SHA-256 equality among package bytes, compiled catalog, installed bytes, and manifest.
- Git status proves `assets/official/theoutsideone.agent.md` and the unrelated tarball remain untracked and untouched.

## Task T5: Build deterministic state and fault-injection coverage

- **Status:** Complete
- **Complexity:** Very high
- **Dependencies:** T2, T3, T4
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15, AC-16
- **Related ADRs:** ADR-260812-official-asset-distribution-installation; ADR-260812-repository-doctor-readiness; ADR-260812-rpiv-integration-completion-contract
- **Related Core-Components:** CORE-COMPONENT-260812-official-asset-installation-contract; CORE-COMPONENT-260810-development-standards; CORE-COMPONENT-260810-error-handling; CORE-COMPONENT-260811-completion-evidence-reconciliation

### Description
Rebuild the official asset fixture and test matrix around the one-agent contract. Cover all accepted and refused combinations explicitly rather than relying on broad loops that obscure state. Keep fixtures deterministic, uniquely named, stable ordered, repository-local, and independent of network, credentials, live Copilot, or production fault switches.

Create a mutation-boundary enumerator from each concrete transaction plan so clean install, migration, adoption-plus-retirement, upgrade, and retirement-only operations inject before and after every mutation. Include the boundary after the current agent is written and before the old agent retires. For each caught fault, compare complete tree inventory and path kinds with the pre-invocation snapshot; separately force rollback failure and inspect uncertainty evidence.

### Acceptance Criteria
- AC-1 through AC-13 and AC-16: V1 through V7 and V11 assert every functional, safety, agent, and package outcome.
- AC-14: every named deterministic scenario in the issue has a distinct case with outcome and filesystem evidence.
- AC-15: every mutation boundary for every required operation shape is enumerated and faulted, with no untested plan boundary.

### Test Coverage
- Implement V1 through V9 and V11 as defined in `03-test-plan.md` across `src/official-assets.test.ts`, `src/asset-installation.test.ts`, `src/asset-cli.test.ts`, manifest tests, and tracked `fixtures/install/` declarations.
- Add assertions for zero mutation traces, exact inventories, inode stability, stable error codes, complete retirement output, directory cleanup, package file list, and process-order static checks.
- Keep global statement, branch, function, and line coverage at or above 80 percent.

### Expected Evidence
- Jest output naming every scenario and fault-plan family.
- Fixture inventory list matching the test-plan scenario catalog with no duplicate names.
- Coverage summary at or above project thresholds.
- Machine-readable boundary report showing planned mutation count equals injected boundary count for every operation shape.

### Verification Return Correction (2026-08-14)

- AC-14: added the executable `unrelated-content-preservation` V5 case, bound it to the tracked fixture declaration, and proved byte, inode, and exact path preservation under `.github/agents`, `.agents/agents`, and `.agents/skills` during successful convergence.
- Targeted Jest evidence: 2 suites and 60 tests passed.

## Task T6: Update consumer, product, migration, and help documentation

- **Status:** Complete
- **Complexity:** Medium
- **Dependencies:** T1, T2, T3, T4
- **Acceptance Criteria:** AC-5, AC-17
- **Related ADRs:** ADR-260812-official-asset-distribution-installation; ADR-260812-repository-doctor-readiness; ADR-260812-rpiv-integration-completion-contract
- **Related Core-Components:** CORE-COMPONENT-260812-official-asset-installation-contract; CORE-COMPONENT-260806-project-command-interface; CORE-COMPONENT-260806-rpiv-stage-contract

### Description
Update `README.md`, `docs/README.md`, `docs/phase-5-official-assets.md`, `PRD.md`, cumulative CLI help, and documentation assertions to describe one agent and one destination. Remove assessor, skill, old destination, and broad package-directory claims from the current product contract while retaining those paths only where migration behavior requires them.

Document exact local install and invocation commands, schema-v1 manifest location and fields, matching and absent legacy outcomes, both-destination rules, adoption, upgrade, modified/unproved refusal, sibling preservation, empty-only cleanup, atomic cross-root rollback, uncertain path remediation, idempotency, package allowlist behavior, and unchanged Doctor authority. State explicitly that no network API, service, daemon, container, webhook, or deployment contract changes.

### Acceptance Criteria
- AC-5: help and current user guidance advertise only `install agent soft-factory`, `install --recommended`, and `.github/agents/soft-factory.agent.md`; removed selectors are described only as unsupported migration context.
- AC-17: consumer documentation covers every requested install, invocation, migration, refusal, preservation, rollback, and no-API/service/deployment fact.

### Test Coverage
- Implement V10 in `src/documentation.test.ts` with required and forbidden phrase tables across README, docs index, operations guide, PRD, and live help.
- Assert legacy paths appear only in migration sections and assessor/skill are not presented as current assets or commands.
- Run live help through the root `just run --help` recipe.

### Expected Evidence
- Passing documentation Jest output.
- Reviewed documentation diff with exact commands and migration truth table.
- Live help capture with only the current install forms.
- Explicit documentation statements that API, service, and deployment behavior are unchanged.

### Verification Return Correction (2026-08-14)

- AC-17: corrected the migration table to state that Runner installs trusted current packaged bytes and independently retires digest-proved legacy bytes; coupled documentation assertions require the corrected behavior and reject the inaccurate move wording.
- Targeted Jest evidence: `src/documentation.test.ts` passed.

### Second Verification Return Correction (2026-08-14)

- AC-17: rewrote PRD §§15–17 as an exact delivery-only contract and aligned the executive model, product principles, AC-019, user journey, product boundary, success metric, and final product definition.
- Added V10 assertions that require strict pre-terminal input rejection, instructions-before-Doctor, ready-only one-run dispatch, unchanged applicable output, dispatch/completion separation, and no lifecycle command authorization in current PRD agent sections.
- Targeted `src/documentation.test.ts`: 1 suite and 22 tests passed.

## Task T7: Run full validation and record acceptance evidence

- **Status:** Complete
- **Complexity:** Medium
- **Dependencies:** T5, T6
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15, AC-16, AC-17
- **Related ADRs:** ADR-260812-official-asset-distribution-installation; ADR-260810-typescript-node-cli; ADR-260812-repository-doctor-readiness; ADR-260812-rpiv-integration-completion-contract
- **Related Core-Components:** CORE-COMPONENT-260812-official-asset-installation-contract; CORE-COMPONENT-260810-development-standards; CORE-COMPONENT-260806-project-command-interface; CORE-COMPONENT-260806-rpiv-stage-contract; CORE-COMPONENT-260811-engineering-harness-interface

### Description
Run the focused and complete repository gates from root command authority, inspect exact npm package contents, review the final diff for protected-file and scope compliance, and record implementation evidence for every AC ID in `implementation/00-implementation.md`. Preserve the user-supplied reference agent and unrelated tarball as untracked, unmodified baseline items.

Use harness checks as structured delegates but retain direct root recipe evidence. Do not claim acceptance; hand the exact implementation commit, test output, package inventory, documentation evidence, and AC evidence to Verify.

### Acceptance Criteria
- AC-1 through AC-17 each has concrete implementation evidence linked to V1-V12 and the committed implementation diff.
- `just verify-focused` and `just verify` pass; `harness checks --focused --json` and `harness checks --json` return successful envelopes.
- Package inventory, static agent checks, migration matrix, fault matrix, documentation checks, and Doctor non-regression all pass in the same final source state.
- Final scoped status includes no Plan artifacts in the implementation commit and does not stage the reference agent or tarball.

### Test Coverage
- Run V12: `just verify-focused`, direct `just verify`, both harness check forms, `npm pack --dry-run --json`, `git diff --check`, and scoped `git status` inspection.
- Re-run V1-V11 through the full Jest suite and coverage gate.
- Inspect package and installed byte digests independently from catalog assertions.

### Expected Evidence
- Complete root recipe and harness JSON output with exit status 0.
- Full Jest summary and coverage report.
- Exact npm package file inventory and SHA-256 comparison evidence.
- `implementation/00-implementation.md` table mapping AC-1 through AC-17 to test names, outputs, files, and documentation.
- Commit SHA and scoped status proving only intended implementation artifacts were committed while protected untracked files remained untouched.

### Verification Return Correction (2026-08-14)

- Targeted `just verify-focused src/asset-installation.test.ts src/documentation.test.ts`: 2 suites, 60 tests, exit 0.
- `harness checks --focused --json`: status `ok`, delegated `just verify-focused`, 21 suites and 353 tests.
- Direct `just verify-focused`: 21 suites and 353 tests, exit 0.
- Direct `just verify`: lint, format, type check, 21 suites and 353 tests, coverage, build, and diff check passed.
- `harness checks --json`: status `ok`, delegated `just verify`, exit 0.
- Verification-return friction was read back from `.harness/records/retro/2026-08-14/006-issue-27-rpiv-implementer-verify-return.md` before the one-entry buffer was cleared successfully.
- The correction-evidence authoring retry was read back from `.harness/records/retro/2026-08-14/007-issue-27-rpiv-implementer-correction-evidence.md` before its one-entry buffer was cleared successfully.

### Second Verification Return Correction (2026-08-14)

- Targeted `just verify-focused src/documentation.test.ts`: 1 suite, 22 tests, exit 0.
- `harness checks --focused --json`: status `ok`, delegated `just verify-focused`, 21 suites and 354 tests.
- Direct `just verify-focused`: 21 suites and 354 tests, exit 0.
- Direct `just verify`: lint, format, type check, 21 suites and 354 tests, coverage, build, and diff check passed.
- `harness checks --json`: status `ok`, delegated `just verify`, exit 0.
- `.harness/records/retro/2026-08-14/008-issue-27-rpiv-implementer-second-verify-return.md` was read back with both pending observations before `harness observe --clear` returned status `ok` and `cleared: 2`.
- `.harness/records/retro/2026-08-14/009-issue-27-rpiv-implementer-second-return-evidence.md` was read back with both later evidence observations before a second status `ok`, `cleared: 2` envelope.
