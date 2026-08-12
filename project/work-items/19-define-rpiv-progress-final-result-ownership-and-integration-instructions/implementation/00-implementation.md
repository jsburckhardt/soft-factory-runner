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
- **AC-5:** The Verifier contract now orders acceptance -> snapshotted validation -> push -> PR -> no-clobber publication. Strict results bind issue, branch, head, PR, outcome, AC evidence, final validation evidence, supplementary diagnostics, and completion time.
- **AC-6:** Internal publish/validate helpers return nonzero typed errors on missing, invalid, mismatch, or collision; coordinator guidance invokes local validation after Verify and before terminal success. Existing immutable bytes are preserved.
- **AC-7:** `publishProgress` atomically writes strict identity-bound phase starts/outcomes with monotonic sequence. Parser/publication tests prove complete documents and Research/Plan progression; canonical coordinator guidance covers all phases and terminal/failure publication.
- **AC-8:** `ReconciliationObservationsV1.progress`, `renderReport`, status schema 3, and list records expose phase/classification separately. Missing progress is unknown; authorizing report calculations explicitly exclude progress.
- **AC-9:** Canonical RPIV agents and all packaged official assets direct discovery to `soft-factory instructions --json`. Operator/Assessor/Skill remain Runner delegates; updated catalog digests and npm package/install tests passed.
- **AC-10:** V4 snapshots and injected launch facts retain the command across transitions; recovery reads the snapshot rather than current final-validation configuration, while each later new run parses current configuration.
- **AC-11:** `migrateLegacySnapshot` drops legacy arrays and installs sole `just verify` without configuration lookup. v1 remains non-completable without acceptance migration; malformed/unsupported state fails safe. Instructions and migration docs state this behavior.
- **AC-12:** Classification preserves `lastAccepted` for repeated, conflicting, regressed, and late updates. Progress is excluded from activity, result, completion, recovery, signaling, and cleanup decisions; immutable result collision tests preserve destination bytes.
- **AC-13:** The strict parser/classifier implements missing, empty, malformed, incomplete, unsupported, identity mismatch, stale, regressed, repeated, conflict, late, and valid codes. Status uses unknown or the preserved accepted phase, never operational-state inference.
- **AC-14:** Strict result parsing rejects missing/empty/malformed/incomplete/unsupported forms; bound validation rejects issue/branch/head/PR/AC/final-validation mismatches. Existing completion/recovery tests retain noncompleted safe outcomes.
- **AC-15:** Live file adapters sync complete same-directory temporary files and directory metadata. Progress uses atomic rename; result uses no-clobber hard-link installation. Publication/idempotence/race controls expose complete old/new bytes only.
- **AC-16:** Integration facts carry no Copilot environment mapping. Existing sentinel tests plus integration/documentation scans cover instructions, progress, result, status/list, snapshots, events, errors, and logs while preserving issue/run/branch ownership.
- **AC-17:** The 262-test repository-local suite covers default/custom final validation, persisted bindings, focused forms, phase/classification, result ordering, status/list, helpers, assets, and human/JSON instructions without credentials or live services.
- **AC-18:** Negative controls cover legacy and malformed persistence, every progress/result invalidity class, missing validation binding, identity mismatch, write/collision behavior, repeated/late/conflicting facts, stale remote proof, and unchanged ownership/destination evidence.
- **AC-19:** Harness full checks and direct `just verify` exited 0. Coverage: statements 85.81%, branches 80.43%, functions 92.87%, lines 87.42%.

## Validation evidence (V-1 through V-12)

- **V-1:** `src/integration-contract.test.ts` instructions parity, deterministic repetition, syntax, and configuration controls passed.
- **V-2:** Final-validation grammar/default/custom and v4/legacy lifecycle tests passed across configuration, orchestration, persistence, and recovery suites.
- **V-3:** Focused-neutral metamorphic completion tests passed.
- **V-4:** Strict result binding, publication idempotence/collision, helper, Verifier ordering, and coordinator contract assertions passed.
- **V-5:** Progress schema and classification matrix passed.
- **V-6:** Existing reconciliation/status/list cross-product tests plus progress separation assertions passed.
- **V-7:** Atomic mutable writes, synced live adapter behavior, immutable no-clobber winner/idempotence, and preservation checks passed.
- **V-8:** v1-v4 parsing/migration, event replay, active v3 normalization, and recovery boundaries passed.
- **V-9:** Copilot sentinel redaction and documentation scans passed.
- **V-10:** Canonical/official delegation, SHA-256 catalog, npm package, clean/repeated install, and no-bypass checks passed.
- **V-11:** Credential-free integration suites passed: 20 suites, 262 tests.
- **V-12:** `harness checks --json` and direct `just verify` passed; `git diff --check` passed.

## Architecture adherence

Implementation follows ADR-260812-rpiv-integration-completion-contract and CORE-COMPONENT-260812-rpiv-integration-handoff. It preserves the superseded ADR record, v3 recovery ownership, completion reconciliation, non-authorizing progress, event-before-snapshot persistence, typed shell-free adapters, redaction, official-asset integrity, and root-justfile authority. No architecture or plan deviation was required.

## Changed files

- **Source:** `src/command.ts`, `completion.ts`, `config.ts`, `domain.ts`, `errors.ts`, `index.ts`, new `integration.ts`, `live.ts`, `official-agent-contracts.ts`, `official-assets.ts`, `orchestrator.ts`, `persistence.ts`, `ports.ts`, `reconciliation.ts`, `render.ts`.
- **Tests:** new `src/integration-contract.test.ts` plus completion, documentation, index, integration, orchestration, recovery-control, package/asset contract tests and existing full suite.
- **Canonical/package assets:** `.github/agents/rpiv.agent.md`, `.github/agents/rpiv-verifier.agent.md`, and all three `assets/official/` files with refreshed digests.
- **Documentation:** `README.md`, `docs/README.md`, phase 1/3/4/5 guides, and new `docs/rpiv-integration-contract.md`.
- **Architecture/plan/research:** the exact issue-19 research/plan directory, new ADR/core-component, superseded/modified contracts, and `DECISION-LOG.md`.
- **Harness evidence:** research, planner, and implementer schema-v1.2 retro records under `.harness/records/retro/2026-08-12/`.

## Documentation evidence and no-impact rationale

- README, setup/quick-start, configuration grammar/defaults, usage examples, v4 migration, compatibility, architecture explanation, status/list behavior, troubleshooting, operations, local deployment, official assets, and agent/skill integration were updated.
- API applicability is explicit: no network API, OpenAPI/Swagger, server, daemon, webhook, or database contract changed, so no API specification file is applicable.
- Data migration is limited to documented versioned local snapshot normalization; no database or destructive migration applies.
- Deployment remains a short-lived local CLI/npm package boundary; no container or service runbook applies. Package catalog digests and install/package tests were updated because official asset bytes changed.

## Focused and full results

- Focused harness: `harness checks --focused --json` status `ok`, delegated `just verify-focused`, exit 0.
- Focused direct: `just verify-focused` exit 0; 20 suites / 262 tests.
- Full harness: `harness checks --json` status `ok`, delegated `just verify`, exit 0.
- Full direct: `just verify` exit 0; lint, format, types, 20 suites / 262 tests, coverage, build, and diff hygiene passed.

## Friction records

- `.harness/records/retro/2026-08-12/014-issue-19-rpiv-research.md` — read back with CONF-001 and DL-001..DL-003, then buffer clear reported 4.
- `.harness/records/retro/2026-08-12/015-issue-19-rpiv-planner.md` — read back with DL-001..DL-002, then buffer clear reported 2.
- `.harness/records/retro/2026-08-12/015-issue-19-rpiv-implementer.md` — read back with DL-001, DL-002, and SUGG-001, then buffer clear reported 3.
- Coordinator had no pending observation. Post-clear JSON listings for all four agents reported empty observations.
