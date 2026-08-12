# Implementation Evidence: Issue #19

## Status and scope

Implemented dependency-ordered tasks T-1 through T-8 on branch `feat/19-rpiv-progress-and-instructions`. This record provides implementation evidence only; final acceptance remains owned by Verify.

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
- **AC-3:** `src/config.ts` accepts one declared argument-free root recipe, defaults absence to `just verify`, rejects empty/focused/shell/undeclared values, and `IssueRunService.run` creates no owner until configuration and root justfile validation complete. New snapshots contain one `requiredFinalValidation`.
- **AC-4:** `reconcileCompletion` compares only `requiredFinalValidation`. Metamorphic tests pass with focused evidence absent, passed, failed, or unrelated.
- **AC-5:** The corrected Verifier contract orders acceptance -> snapshotted validation -> PR creation/update -> verification summary/verifier-retro commit and push -> independent PR/final-head confirmation -> no-clobber publication. Strict results bind issue, branch, final head, independently observed PR number, outcome, AC evidence, final-validation evidence, supplementary diagnostics, and completion time.
- **AC-6:** Internal publish/validate helpers independently query one open PR for the owned branch and final head, reject candidate `prNumber` mismatch, and return nonzero typed errors on missing, invalid, mismatch, write failure, or collision. Coordinator guidance invokes local validation before zero exit; immutable bytes are preserved.
- **AC-7:** `publishProgress` invokes `classifyProgress` before mutation, accepts only exact forward phase transitions, serializes competing helpers, and atomically writes strict identity-bound progress. Canonical coordinator guidance attempts terminal failed publication before every nonzero return/exception while preserving the original error and surfacing publication failure.
- **AC-8:** `ReconciliationObservationsV1.progress`, `renderReport`, status schema 3, and list records expose phase/classification separately. Missing progress is unknown; authorizing report calculations explicitly exclude progress.
- **AC-9:** Canonical RPIV agents and all packaged official assets direct discovery to `soft-factory instructions --json`. Operator/Assessor/Skill remain Runner delegates; updated catalog digests and npm package/install tests passed.
- **AC-10:** V4 active/resume paths parse other runtime configuration with the persisted final-validation override, so changed, invalid, empty, nested, focused, or undeclared current values cannot block or alter the run. Existing-state `run` reconciles before any current config parse; later new runs alone parse and snapshot current validation.
- **AC-11:** `migrateLegacySnapshot` drops legacy arrays and installs sole `just verify` without configuration lookup. Recovery tests set invalid current final-validation config and still normalize supported v3 to sole `just verify`; v1 remains non-completable without acceptance migration and malformed/unsupported state fails safe.
- **AC-12:** Helper publication now rejects exact repeats, skips, same-phase advances, regressions, conflicts, stale/identity-invalid facts, and post-terminal updates with stable nonzero codes before mutation. Tests prove the prior artifact, persisted accepted fact, immutable result, operational state, and ownership remain unchanged.
- **AC-13:** The strict parser/classifier implements missing, empty, malformed, incomplete, unsupported, identity mismatch, stale, regressed, repeated, conflict, late, and valid codes. Status uses unknown or the preserved accepted phase, never operational-state inference.
- **AC-14:** Strict result parsing rejects missing/empty/malformed/incomplete/unsupported forms; bound validation rejects issue/branch/head/PR/AC/final-validation mismatches. Existing completion/recovery tests retain noncompleted safe outcomes.
- **AC-15:** Real temporary-directory tests run simultaneous mutable readers/writers and competing immutable publishers. Readers see only complete old/new identity documents, AgentResultV1 has one no-clobber winner, and injected faults at temporary-create, temporary-sync, pre-publish, publish, and directory-sync boundaries expose only absence or complete prior/new bytes with no temporary residue.
- **AC-16:** Integration facts carry no Copilot environment mapping. Existing sentinel tests plus integration/documentation scans cover instructions, progress, result, status/list, snapshots, events, errors, and logs while preserving issue/run/branch ownership.
- **AC-17:** The 279-test repository-local suite adds credential-free CLI helper publication/validation, trusted PR mismatch, exact final-head agent ordering, active/legacy invalid-config recovery, terminal failed progress, transition rejection, write faults, real filesystem concurrency, and unchanged ownership.
- **AC-18:** Negative controls now concretely cover invalid current config during active/new/legacy paths, candidate PR mismatch, helper write failure, concurrent progress calls, repeated/regressed/skipped/late transitions, all five atomic fault steps, one-winner result races, complete-reader corpora, temporary cleanup, and unchanged ownership/result bytes.
- **AC-19:** Harness full checks and direct `just verify` exited 0. Coverage: statements 87.75%, branches 82.75%, functions 94.29%, lines 89.40%.

## Validation evidence (V-1 through V-12)

- **V-1:** `src/integration-contract.test.ts` instructions parity, deterministic repetition, syntax, and configuration controls passed.
- **V-2:** Final-validation grammar/default/custom and v4/legacy lifecycle tests passed across configuration, orchestration, persistence, and recovery suites.
- **V-3:** Focused-neutral metamorphic completion tests passed.
- **V-4:** Strict result binding now uses independently observed PR-by-branch facts; candidate mismatch, helper exits/write faults, final-summary push ordering, final-head confirmation, idempotence/collision, and coordinator gate assertions passed.
- **V-5:** Progress schema and classification matrix passed.
- **V-6:** Existing reconciliation/status/list cross-product tests plus progress separation assertions passed.
- **V-7:** Real concurrent reader/writer and publisher races plus every injected live-adapter publication fault step passed; complete old/new bytes, one immutable winner, no clobber, and temporary cleanup were asserted.
- **V-8:** v1-v4 parsing/migration, event replay, active v3 normalization, and recovery boundaries passed.
- **V-9:** Copilot sentinel redaction and documentation scans passed.
- **V-10:** Canonical/official delegation, SHA-256 catalog, npm package, clean/repeated install, and no-bypass checks passed.
- **V-11:** Credential-free integration suites passed: 21 suites, 279 tests.
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

- Focused harness: `harness checks --focused --json` status `ok`, delegated `just verify-focused`, exit 0.
- Focused direct: `just verify-focused` exit 0; 21 suites / 279 tests.
- Full harness: `harness checks --json` status `ok`, delegated `just verify`, exit 0.
- Full direct: `just verify` exit 0; lint, format, types, 21 suites / 279 tests, coverage, build, and diff hygiene passed. Coverage is 87.75% statements, 82.75% branches, 94.29% functions, and 89.40% lines.

## Friction records

- `.harness/records/retro/2026-08-12/014-issue-19-rpiv-research.md` — read back with CONF-001 and DL-001..DL-003, then buffer clear reported 4.
- `.harness/records/retro/2026-08-12/015-issue-19-rpiv-planner.md` — read back with DL-001..DL-002, then buffer clear reported 2.
- `.harness/records/retro/2026-08-12/015-issue-19-rpiv-implementer.md` — read back with DL-001, DL-002, SUGG-001, and post-commit DL-003. The first clear reported 3; DL-003 was durably appended and read back before its separate clear.
- Coordinator, Research, and Plan correction-cycle listings were empty. `.harness/records/retro/2026-08-12/016-issue-19-rpiv-implementer-correction.md` was scaffolded by Harness, filled with correction DL-001..DL-008, read back with schema 1.2 / exact plan and agent / all eight entries, then the implementer clear envelope reported `cleared: 8`; post-clear listing was empty. The five pending `rpiv-verifier` observations were neither listed, drained, nor cleared and remain Verify-owned.
