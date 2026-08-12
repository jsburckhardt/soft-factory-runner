# Implementation Evidence: Issue #19

## Status and scope

Implemented dependency-ordered tasks T-1 through T-8 on branch `feat/19-rpiv-progress-and-instructions`. This record provides implementation evidence only; final acceptance remains owned by Verify.

## Latest Verify correction after `a92a056` — completed V3 legacy result compatibility

### Compatibility design

- Added explicit `LegacyAgentResultV1` and `LegacyFinalizationFactsV1` types for v2/v3 persistence instead of making `requiredFinalValidation` optional on the current result. `RunSnapshotV4` retains strict `FinalizationFactsV1` and current AgentResultV1 publication still uses the unchanged exact-key parser.
- Snapshot parsing now selects the exact historical AgentResult shape only for v2/v3 finalization. A completed legacy result must contain one passed `just verify`; malformed shape, unsupported version, the current-only binding at a legacy boundary, and failed/missing legacy final validation all reject safely as `STATE_INVALID`. V4 snapshots containing the old shape remain invalid.
- Migration removes legacy `requiredValidations`, fixes the sole snapshot requirement to `just verify`, and converts persisted legacy proof into a current binding with deterministic evidence reference `snapshot:v1-v3:agent-result.validations[just verify]`. It never reads current configuration and never interprets the retained focused entry as a requirement.
- Recovery observes an immutable historical result through the legacy parser only when the snapshot version is v2/v3 or the migrated V4 persisted result carries the exact Runner-generated compatibility evidence. Current parsing is attempted first for V4, so no broad fallback weakens new snapshots or publication.
- V1 remains readable and non-completable without acceptance migration. Completed V2 legacy persistence is directly readable; V2 and V3 share the same typed normalization path.

### Acceptance evidence

- **AC-11:** `src/recovery-persistence.test.ts` loads a completed base-valid V3 snapshot whose embedded result has the historical exact shape, proves the same shape is rejected in V4, and covers completed V2/V1 readability. `src/recovery-control.test.ts` migrates the completed V3 under both invalid and changed current configuration, obtains byte-equivalent normalized result/requirement facts, retains focused evidence only in supplementary `validations[]`, and observes the untouched historical artifact as `RESULT_MATCH`.
- **AC-18:** Persistence negative controls reject unsupported legacy result versions, current-only fields at the legacy boundary, and failed/missing `just verify`; completion tests prove the current AgentResultV1 parser rejects the historical shape while deterministic legacy migration rejects non-migratable proof. Existing malformed/unknown state and recovery safety controls remain passing.

### Changed files and documentation

- Source: `src/domain.ts`, `src/completion.ts`, `src/persistence.ts`, `src/orchestrator.ts`, `src/reconciliation.ts`.
- Tests: `src/completion.test.ts`, `src/recovery-persistence.test.ts`, `src/recovery-control.test.ts`, `src/documentation.test.ts`.
- Documentation: `README.md`, `docs/rpiv-integration-contract.md`, and `docs/phase-3-recovery-operations.md` now precisely identify the historical result boundary, deterministic passed-`just verify` conversion, current-config independence, focused neutrality, and unchanged strict current/V4 contracts.
- No ADR or core-component change was required because this restores their existing v1-v3 readability, sole-`just verify`, fail-safe, and strict-V4 decisions. No configuration option/default, network API, deployment procedure, or destructive migration changed.

### Validation evidence

- Targeted direct `just verify-focused src/recovery-persistence.test.ts src/recovery-control.test.ts src/completion.test.ts` passed 3 suites / 103 tests. The documentation-inclusive targeted rerun passed 4 suites / 124 tests.
- Focused Harness envelope: `status: ok`, `scope: focused`, delegated `just verify-focused`, exit 0; 21 suites / 327 tests. Direct `just verify-focused` also passed 21 suites / 327 tests and diff hygiene.
- The first full Harness run reached `format-check` and failed on four edited TypeScript files; after repository Prettier formatting, the required rerun returned `status: ok`, `scope: full`, delegated `just verify`, exit 0. Direct `just verify` passed lint, formatting, types, 21 suites / 327 tests, build, and diff hygiene with 88.04% statements, 83.48% branches, 94.44% functions, and 89.65% lines.

### Friction evidence

- `.harness/records/retro/2026-08-12/020-issue-19-rpiv-implementer-legacy-v3-compatibility.md` was scaffolded by Harness, written as schema 1.2 with the exact work-item plan ID and `rpiv-implementer` agent, read back with DL-001 through DL-005, then cleared with `cleared: 5`. Coordinator, Research, Plan, and Implement post-drain listings were empty; verifier observations were not listed or cleared.

## Verify rejection correction after `b321812`

- **AC-3:** `validateDeclaredRecipe` now rejects a missing root `justfile` for both default `just verify` and configured recipes. Direct parser and new-run orchestration tests prove `CONFIG_INVALID` before lock, lease, snapshot, event, worktree, tmux, process, or other owned-resource mutation.
- **AC-8 / AC-12 / AC-13 / AC-17 / AC-18:** Completed reconciliation now excludes `progress` from its non-GitHub ownership problem set, matching the existing exclusion in all other report paths. An integrated Research-to-terminal-to-`completed` flow proves a current byte-equivalent terminal artifact remains visible as `PROGRESS_REPEATED` while status/list preserve `completed`, `inactive`, `MERGE_PENDING`, and cleanup-safe actions. A completed-state cross-product proves identical persisted completion, activity, decision, safe actions, diagnostics, remediation, and cleanup eligibility for valid, repeated, missing, empty, malformed, incomplete, unsupported, identity-mismatched, stale, regressed, conflicting, and late progress.
- **AC-11 / AC-18:** V4 parsing now cross-checks `IntegrationLaunchV1` run ID, attempt, issue, branch, exact worktree progress/result paths, and required final validation against the containing snapshot. The seven-row mismatch table fails with `STATE_INVALID` and byte-identical state/no action; integrated progress/result helper tests prove forged paths are never used. Resume now atomically refreshes the attempt-bound launch and clears prior-attempt progress, so valid resumed V4 state remains strictly parseable.
- **Documentation correction:** `CORE-COMPONENT-260811-run-reconciliation-control.md` now names `RunSnapshotV4`, supported v1-v4 reads, eligible v2/v3-to-v4 migration, and v3/v4 event replay. Existing Decision 105 was corrected in place with the same artifact identity/date. `docs/phase-1-issue-run.md` now requires committed and pushed verification-summary/verifier-retro records plus independent final PR-head confirmation before result publication. README, recovery operations, and the integration guide document missing-justfile failure, strict V4 launch binding, and classification-wide progress neutrality. Documentation assertions reject the stale V3 wording and publication order.

### Correction changed files

- Source: `src/config.ts`, `src/orchestrator.ts`, `src/persistence.ts`, `src/reconciliation.ts`.
- Tests: `src/documentation.test.ts`, `src/integration-contract.test.ts`, `src/integration.test.ts`, `src/orchestration.test.ts`, `src/reconciliation.test.ts`, `src/recovery-control.test.ts`, `src/recovery-persistence.test.ts`.
- Documentation/contracts: `README.md`, `docs/phase-1-issue-run.md`, `docs/phase-3-recovery-operations.md`, `docs/rpiv-integration-contract.md`, `project/architecture/core-components/CORE-COMPONENT-260811-run-reconciliation-control.md`, `project/architecture/ADR/DECISION-LOG.md`.
- Durable friction: `.harness/records/retro/2026-08-12/019-issue-19-rpiv-implementer-verify-rejection-correction.md`.

### Correction validation evidence

- Targeted direct gates: final-validation/parser plus orchestration (2 suites / 66 tests), V4 persistence/helpers (2 / 57), progress reconciliation/status/list (2 / 62), complete corrected matrix (5 / 122), live/new-run fixture and persistence matrix (4 / 97), resume binding (2 / 57), and documentation assertions (1 / 21) all exited 0.
- Focused Harness: final `harness checks --focused --json` envelope `status: ok`, `scope: focused`, delegated `just verify-focused`, exit 0; 21 suites / 318 tests. Earlier retries exposed and then cleared typed-guard, fixture-justfile, and resume-binding failures recorded in the retro.
- Focused direct: final `just verify-focused` exit 0; 21 suites / 318 tests and `git diff --check` passed.
- Full Harness: final `harness checks --json` envelope `status: ok`, `scope: full`, delegated `just verify`, exit 0 after recorded lint/format retries; lint, format, types, 21 suites / 318 tests, coverage, build, and diff hygiene passed.
- Full direct: final `just verify` exit 0 with 87.96% statements, 83.21% branches, 94.30% functions, and 89.61% lines.

## Resumed Verify correction — current progress ownership

- Corrected `progressObservation` so persisted `lastAccepted` remains inspectable comparison history but is never used as the displayed phase when the current progress artifact is missing or unusable.
- Preserved phase display for the currently present byte-equivalent accepted artifact (`PROGRESS_REPEATED`), which is the usable current document rather than a fallback.
- Added direct V-6/AC-8/AC-13 status/list human and JSON coverage for missing current progress after accepted `plan`, plus classification coverage for every other applicable unusable current artifact.
- Updated `docs/rpiv-integration-contract.md` and its documentation assertion to state the current-artifact-only display rule and no-fallback role of `lastAccepted`.
- No architecture, README, configuration, API, migration, or deployment contract changed; this is the existing Decision 111 and AC-8/AC-13 behavior correction.

### Correction changed files

- Source: `src/integration.ts`.
- Tests: `src/integration-contract.test.ts`, `src/orchestration.test.ts`, `src/documentation.test.ts`.
- Documentation/evidence: `docs/rpiv-integration-contract.md`, this implementation record.
- Durable friction: `.harness/records/retro/2026-08-12/017-issue-19-rpiv-resume-correction.md`, `.harness/records/retro/2026-08-12/017-issue-19-rpiv-implementer-resume-correction.md`, `.harness/records/retro/2026-08-12/018-issue-19-rpiv-implementer-evidence-correction.md`.

## Completed tasks

- **T-1:** Added strict `rpiv.final_validation` parsing, root-recipe declaration checks, default `just verify`, pre-ownership validation, `RunSnapshotV4`, immutable launch binding, and deterministic v1-v3 sole-`just verify` normalization.
- **T-2:** Added strict `instructions [--json]` parsing, one deterministic `IntegrationContractV1`, equivalent renderers, cumulative help, and read-only repository-scoped dispatch.
- **T-3:** Added strict `RpivStatusV1`, complete classification policy, mutable atomic publisher, persisted last-accepted progress, and non-authorizing observation.
- **T-4:** Added schema-v3 status output and list inventory fields for separately observed RPIV phase/classification while preserving operational state and safe actions.
- **T-5:** Extended strict `AgentResultV1` with `requiredFinalValidation`, added no-clobber publication/read-back validation, internal helper commands, focused-neutral completion, and coordinator local validation.
- **T-6:** Updated canonical coordinator/Verifier and packaged Operator/Assessor/Skill delegation; refreshed all three catalog SHA-256 digests and contract/package assertions.
- **T-7:** Updated README, docs index, issue run, recovery, Doctor, official assets, and the new integration/configuration/migration/operations guide.
- **T-8:** Added and ran credential-free positive/negative integration matrices, asset/package checks, documentation stale-guidance scans, focused gates, and full gates.

## Acceptance evidence

- **AC-1:** `src/integration.ts` defines the complete versioned contract and human renderer; `src/integration-contract.test.ts` proves path, atomicity, phase, result, snapshot, legacy, and no-success-without-result facts.
- **AC-2:** `parseCommand` accepts only `instructions [--json]`; deterministic repeated rendering and parsed JSON equality pass in the integration-contract suite, while unsupported syntax retains `CLI_INVALID` / exit 2 semantics.
- **AC-3:** `src/config.ts` accepts one declared argument-free root recipe, defaults absence to `just verify`, rejects empty/focused/shell/undeclared values, and now rejects a missing root `justfile` for default and configured forms. Parser and orchestration tests prove byte-identical files plus no lock, lease, snapshot, event, worktree, tmux, or process mutation before `CONFIG_INVALID`. New snapshots contain one `requiredFinalValidation`.
- **AC-4:** `reconcileCompletion` compares only `requiredFinalValidation`. Metamorphic tests pass with focused evidence absent, passed, failed, or unrelated.
- **AC-5:** The corrected Verifier contract orders acceptance -> snapshotted validation -> PR creation/update -> verification summary/verifier-retro commit and push -> independent PR/final-head confirmation -> no-clobber publication. Strict results bind issue, branch, final head, independently observed PR number, outcome, AC evidence, final-validation evidence, supplementary diagnostics, and completion time.
- **AC-6:** Internal publish/validate helpers independently query one open PR for the owned branch and final head, reject candidate `prNumber` mismatch, and return nonzero typed errors on missing, invalid, mismatch, write failure, or collision. Coordinator guidance invokes local validation before zero exit; immutable bytes are preserved.
- **AC-7:** `publishProgress` invokes `classifyProgress` before mutation, accepts only exact forward phase transitions, serializes competing helpers, and atomically writes strict identity-bound progress. Canonical coordinator guidance attempts terminal failed publication before every nonzero return/exception while preserving the original error and surfacing publication failure.
- **AC-8:** `ReconciliationObservationsV1.progress`, `renderReport`, status schema 3, and list records expose phase/classification separately. Missing or unusable current progress is `unknown`, while a present byte-equivalent accepted artifact displays its phase as `PROGRESS_REPEATED`. Integrated terminal-progress-to-completed human/JSON status/list coverage proves operational completion, activity, decision code, and safe actions remain unchanged.
- **AC-9:** Canonical RPIV agents and all packaged official assets direct discovery to `soft-factory instructions --json`. Operator/Assessor/Skill remain Runner delegates; updated catalog digests and npm package/install tests passed.
- **AC-10:** V4 active/resume paths parse other runtime configuration with the persisted final-validation override, so changed, invalid, empty, nested, focused, or undeclared current values cannot block or alter the run. Existing-state `run` reconciles before any current config parse; later new runs alone parse and snapshot current validation.
- **AC-11:** `migrateLegacySnapshot` drops legacy arrays and installs sole `just verify` without configuration lookup. Strict V4 parsing additionally cross-checks launch run ID, attempt, issue, branch, exact owned paths, and final validation; seven contradictory records fail `STATE_INVALID` without mutation, helpers reject forged paths before use, and resumed attempts refresh the bound launch. v1 remains non-completable without acceptance migration and malformed/unsupported state fails safe.
- **AC-12:** Helper publication rejects exact repeats, skips, same-phase advances, regressions, conflicts, stale/identity-invalid facts, and post-terminal updates before mutation. Completed reconciliation also excludes every progress observation from authorization; the cross-product proves completion, activity, decision, safe actions, cleanup eligibility, diagnostics, and remediation are invariant across every classification.
- **AC-13:** The strict parser/classifier implements missing, empty, malformed, incomplete, unsupported, identity mismatch, stale, regressed, repeated, conflict, late, and valid codes. Every unusable current artifact reports phase `unknown` without falling back to `lastAccepted`; a present byte-equivalent accepted artifact reports its own phase as `PROGRESS_REPEATED`, and neither shape authorizes any process or state action.
- **AC-14:** Strict result parsing rejects missing/empty/malformed/incomplete/unsupported forms; bound validation rejects issue/branch/head/PR/AC/final-validation mismatches. Existing completion/recovery tests retain noncompleted safe outcomes.
- **AC-15:** Real temporary-directory tests run simultaneous mutable readers/writers and competing immutable publishers. Readers see only complete old/new identity documents, AgentResultV1 has one no-clobber winner, and injected faults at temporary-create, temporary-sync, pre-publish, publish, and directory-sync boundaries expose only absence or complete prior/new bytes with no temporary residue.
- **AC-16:** Integration facts carry no Copilot environment mapping. Existing sentinel tests plus integration/documentation scans cover instructions, progress, result, status/list, snapshots, events, errors, and logs while preserving issue/run/branch ownership.
- **AC-17:** The 318-test repository-local suite adds credential-free CLI helper publication/validation, trusted PR mismatch, exact final-head agent ordering, active/legacy invalid-config recovery, terminal failed progress, transition rejection, current-artifact-only phase reporting, write faults, real filesystem concurrency, and unchanged ownership.
- **AC-18:** Negative controls cover missing root justfiles with zero ownership mutation; seven V4 launch contradictions and forged helper paths with unchanged bytes/no action; completed valid/repeated/missing/every-unusable progress invariance; invalid active/new/legacy config; helper write faults; concurrent progress; transition rejection; all atomic fault steps; and unchanged ownership/result bytes.
- **AC-19:** Fresh Harness full checks and direct `just verify` exited 0. Coverage: statements 87.96%, branches 83.21%, functions 94.30%, lines 89.61%.

## Validation evidence (V-1 through V-12)

- **V-1:** `src/integration-contract.test.ts` instructions parity, deterministic repetition, syntax, and configuration controls passed.
- **V-2:** Final-validation grammar/default/custom and v4/legacy lifecycle tests passed across configuration, orchestration, persistence, and recovery suites.
- **V-3:** Focused-neutral metamorphic completion tests passed.
- **V-4:** Strict result binding now uses independently observed PR-by-branch facts; candidate mismatch, helper exits/write faults, final-summary push ordering, final-head confirmation, idempotence/collision, and coordinator gate assertions passed.
- **V-5:** Progress schema and classification matrix passed.
- **V-6:** Human/JSON status/list prove missing current progress is `unknown` despite `lastAccepted`, and integrated terminal progress observed after `completed` remains diagnostic `PROGRESS_REPEATED` while completion, activity, decision, and safe actions remain stable. The completed cross-product covers valid, repeated, missing, and every unusable class.
- **V-7:** Real concurrent reader/writer and publisher races plus every injected live-adapter publication fault step passed; complete old/new bytes, one immutable winner, no clobber, and temporary cleanup were asserted.
- **V-8:** v1-v4 parsing/migration, seven strict V4 launch-binding mismatches, forged-path helper refusal, refreshed resumed-attempt binding, event replay, active v3 normalization, and recovery boundaries passed.
- **V-9:** Copilot sentinel redaction and documentation scans passed.
- **V-10:** Canonical/official delegation, SHA-256 catalog, npm package, clean/repeated install, and no-bypass checks passed.
- **V-11:** Credential-free integration suites passed: 21 suites, 318 tests.
- **V-12:** `harness checks --json` and direct `just verify` passed; `git diff --check` passed.

## Architecture adherence

Implementation follows ADR-260812-rpiv-integration-completion-contract and CORE-COMPONENT-260812-rpiv-integration-handoff. It preserves the superseded ADR record, v3 recovery ownership, completion reconciliation, non-authorizing progress, event-before-snapshot persistence, typed shell-free adapters, redaction, official-asset integrity, and root-justfile authority. No architecture or plan deviation was required.

## Changed files

- **Source:** `src/command.ts`, `completion.ts`, `config.ts`, `domain.ts`, `errors.ts`, `index.ts`, new `integration.ts`, `live.ts`, `official-agent-contracts.ts`, `official-assets.ts`, `orchestrator.ts`, `persistence.ts`, `ports.ts`, `reconciliation.ts`, `render.ts`.
- **Tests:** `src/integration-contract.test.ts`, new `src/publication-concurrency.test.ts`, and corrected documentation, integration, orchestration, recovery-control, package/asset contract tests plus the existing full suite.
- **Canonical/package assets:** `.github/agents/rpiv.agent.md`, `.github/agents/rpiv-verifier.agent.md`, and all three `assets/official/` files with refreshed digests.
- **Documentation:** `README.md`, `docs/README.md`, phase 1/3/4/5 guides, and new `docs/rpiv-integration-contract.md`.
- **Architecture/plan/research:** the exact issue-19 research/plan directory, new ADR/core-component, superseded/modified contracts, and `DECISION-LOG.md`.
- **Harness evidence:** research, planner, initial implementer, and correction implementer schema-v1.2 retro records under `.harness/records/retro/2026-08-12/`.

## Documentation evidence and no-impact rationale

- README, setup/quick-start, configuration grammar/defaults, usage examples, v4 migration, compatibility, architecture explanation, status/list behavior, troubleshooting, operations, local deployment, official assets, and agent/skill integration were updated.
- API applicability is explicit: no network API, OpenAPI/Swagger, server, daemon, webhook, or database contract changed, so no API specification file is applicable.
- Data migration is limited to documented versioned local snapshot normalization; no database or destructive migration applies.
- Deployment remains a short-lived local CLI/npm package boundary; no container or service runbook applies. Package catalog digests and install/package tests were updated because official asset bytes changed.

## Focused and full results

- Focused harness: fresh `harness checks --focused --json` status `ok`, scope `focused`, delegated `just verify-focused`, exit 0; 21 suites / 318 tests.
- Focused direct: fresh `just verify-focused` exit 0; 21 suites / 318 tests. Targeted `just verify-focused src/integration-contract.test.ts src/recovery-persistence.test.ts src/reconciliation.test.ts src/orchestration.test.ts src/documentation.test.ts` also exited 0; 5 suites / 122 tests.
- Full harness: after the recorded lint and format-check retries, fresh `harness checks --json` status `ok`, scope `full`, delegated `just verify`, exit 0; 21 suites / 318 tests.
- Full direct: fresh `just verify` exit 0; lint, format, types, 21 suites / 318 tests, coverage, build, and diff hygiene passed. Coverage is 87.96% statements, 83.21% branches, 94.30% functions, and 89.61% lines.

## Friction records

- `.harness/records/retro/2026-08-12/014-issue-19-rpiv-research.md` — read back with CONF-001 and DL-001..DL-003, then buffer clear reported 4.
- `.harness/records/retro/2026-08-12/015-issue-19-rpiv-planner.md` — read back with DL-001..DL-002, then buffer clear reported 2.
- `.harness/records/retro/2026-08-12/015-issue-19-rpiv-implementer.md` — read back with DL-001, DL-002, SUGG-001, and post-commit DL-003. The first clear reported 3; DL-003 was durably appended and read back before its separate clear.
- Coordinator, Research, and Plan correction-cycle listings were empty. `.harness/records/retro/2026-08-12/016-issue-19-rpiv-implementer-correction.md` was scaffolded by Harness, filled with correction DL-001..DL-008, read back with schema 1.2 / exact plan and agent / all eight entries, then the implementer clear envelope reported `cleared: 8`; post-clear listing was empty. The five pending `rpiv-verifier` observations were neither listed, drained, nor cleared and remain Verify-owned.
- `.harness/records/retro/2026-08-12/017-issue-19-rpiv-resume-correction.md` — scaffolded by Harness; read back with schema 1.2, exact issue plan and `rpiv` agent, and coordinator COORD-001, DL-001, and COORD-002 before clear reported 3.
- `.harness/records/retro/2026-08-12/017-issue-19-rpiv-implementer-resume-correction.md` — scaffolded by Harness; read back with schema 1.2, exact issue plan and `rpiv-implementer` agent, and DL-001..DL-004 before clear reported 4. Post-clear listings for coordinator, Research, Plan, and Implement were all empty.
- `.harness/records/retro/2026-08-12/018-issue-19-rpiv-implementer-evidence-correction.md` — scaffolded by Harness; read back with schema 1.2, exact issue plan and `rpiv-implementer` agent, and the post-drain DL-001 evidence-edit retry before clear reported 1.

- `.harness/records/retro/2026-08-12/019-issue-19-rpiv-implementer-verify-rejection-correction.md` — scaffolded by Harness; read back with schema 1.2, exact work-item plan ID and `rpiv-implementer` agent, and DL-001..DL-008 before clear reported `cleared: 8`. Coordinator, Research, Plan, and Implement post-drain listings were all empty; verifier-owned observations were not listed or drained.
