# Action Plan: Define RPIV progress, final-result ownership, and integration instructions

## Feature
- **ID:** 19
- **Research Brief:** project/work-items/19-define-rpiv-progress-final-result-ownership-and-integration-instructions/research/00-research.md

## ADRs Created
- [ADR-260812-rpiv-integration-completion-contract](../../../architecture/ADR/ADR-260812-rpiv-integration-completion-contract.md)
- Modified/superseded: [ADR-260811-prototype-two-completion-proof](../../../architecture/ADR/ADR-260811-prototype-two-completion-proof.md)
- Modified: [ADR-260811-prototype-three-recovery-concurrency](../../../architecture/ADR/ADR-260811-prototype-three-recovery-concurrency.md)

## Core-Components Created
- [CORE-COMPONENT-260812-rpiv-integration-handoff](../../../architecture/core-components/CORE-COMPONENT-260812-rpiv-integration-handoff.md)
- Modified: [CORE-COMPONENT-260806-rpiv-stage-contract](../../../architecture/core-components/CORE-COMPONENT-260806-rpiv-stage-contract.md)
- Modified: [CORE-COMPONENT-260811-completion-evidence-reconciliation](../../../architecture/core-components/CORE-COMPONENT-260811-completion-evidence-reconciliation.md)
- Modified: [CORE-COMPONENT-260811-run-reconciliation-control](../../../architecture/core-components/CORE-COMPONENT-260811-run-reconciliation-control.md)

## Acceptance Criteria
- **AC-1:** `soft-factory instructions` deterministically reports the complete Runner/RPIV integration contract: the exact owned progress and final-result paths; atomic writes; phase transitions; final AgentResultV1 ownership, timing, identity, and evidence; the run-snapshotted final validation requirement; mutable-progress versus immutable-completion semantics; and the rule that no valid final artifact means no successful RPIV exit.
- **AC-2:** `soft-factory instructions --json` returns a versioned structured form with the same contract facts as human output; repeated invocations against unchanged inputs return equivalent facts and unsupported command forms fail with the existing CLI error semantics.
- **AC-3:** Each new run snapshots exactly one authoritative final validation requirement from the repository's current configuration, defaulting to `just verify` when no value is configured, and completion requires matching passed evidence for that snapshotted requirement; the documented configuration contract defines its accepted value and rejects invalid or explicitly empty values before run ownership or state is created.
- **AC-4:** Runner neither requires nor interprets `just verify-focused` as completion proof; its presence, absence, pass, or failure in RPIV evidence does not change the completion decision, while RPIV may continue to use it during implementation.
- **AC-5:** The RPIV Verifier has permission and explicit responsibility to publish `<owned-worktree>/.soft-factory/agent-result.json` only after verification succeeds and the pull request is created; the strict AgentResultV1 identifies the owned issue, branch, final head, pull request, outcome, acceptance evidence, the snapshotted required final validation and its passed evidence, and completion time.
- **AC-6:** The RPIV coordinator exits successfully only after confirming that the final artifact exists at the owned path and passes strict AgentResultV1 validation against the run's snapshotted requirement; creation, write, absence, or validation failure yields an observable nonzero RPIV exit and does not replace an existing valid final artifact with partial or invalid content.
- **AC-7:** RPIV atomically publishes a versioned `<owned-worktree>/.soft-factory/rpiv-status.json` containing the owned issue identity, current Research, Plan, Implement, Verify, or terminal phase, status, and update time at every phase transition and failed or terminal outcome.
- **AC-8:** `soft-factory status` and `soft-factory list` expose the separately observed RPIV phase in human and JSON output while preserving the existing operational state, including `running_rpiv`; absent progress is explicitly unknown and is never inferred from operational state.
- **AC-9:** Official repository integration guidance directs RPIV agents to `soft-factory instructions`, while the installed Operator, Assessor, and Skill remain observably delegated to Runner rather than introducing a competing operational path.
- **AC-10:** Changes to final-validation configuration after a run starts do not alter that run's completion or recovery requirement; a later new run snapshots the then-current valid requirement.
- **AC-11:** A supported legacy snapshot that predates the configurable requirement deterministically retains `just verify` as its sole final validation requirement, never consults later configuration, and no longer requires `just verify-focused`; malformed or unsupported persistence fails safe without inferred completion. `soft-factory instructions` explains this compatibility behavior.
- **AC-12:** Mutable progress is never accepted as completion proof; conflicting, regressed, repeated, or late progress cannot replace or alter an existing immutable final AgentResultV1 or Runner's completion reconciliation result.
- **AC-13:** Missing, zero-byte, malformed, required-field-incomplete, stale, identity-mismatched, or unsupported progress is classified explicitly under deterministic rules documented by `soft-factory instructions` and cannot produce completion or authorize ownership, process, recovery, or cleanup actions.
- **AC-14:** Missing, zero-byte, malformed, required-field-incomplete, identity-mismatched, unsupported, or final-validation-mismatched results retain non-completed reconciliation outcomes and safe recovery semantics.
- **AC-15:** Interrupted or competing writes and simultaneous readers expose either the prior complete artifact or the new complete artifact at each owned path, never a partial success-shaped document or mixed-issue identity.
- **AC-16:** Progress, result, instructions, status, and list output do not expose configured Copilot environment names or values and preserve existing redaction and ownership boundaries.
- **AC-17:** Repeatable repository-local evidence exercises the default and a configured final validation, configuration changes during active and recovered runs, focused-validation evidence in every pass/fail/absent form, Research-to-Verify-to-terminal progression, final artifact publication after represented pull-request creation, coordinator validation before zero exit, status/list phase reporting, and equivalent human/JSON instructions without live credentials or services.
- **AC-18:** Repeatable repository-local negative controls cover supported legacy snapshots, missing snapshotted validation evidence, write failures, concurrent reads/writes, repeated and late updates, and every missing, empty, malformed, stale, mismatched, conflicting, and unsupported artifact class above, with inspectable exit, output, artifact, and unchanged-ownership evidence.
- **AC-19:** `just verify` passes and produces inspectable evidence for the integration contract.

## Acceptance Coverage
| AC | Implementation tasks | Tests/validation | Expected inspectable evidence |
|---|---|---|---|
| AC-1 | T-2, T-6, T-7 | V-1 | Task acceptance traces plus V-1 artifacts |
| AC-2 | T-2 | V-1 | Task acceptance traces plus V-1 artifacts |
| AC-3 | T-1, T-7 | V-2 | Task acceptance traces plus V-2 artifacts |
| AC-4 | T-1, T-5, T-7 | V-3 | Task acceptance traces plus V-3 artifacts |
| AC-5 | T-5, T-6, T-7 | V-4 | Task acceptance traces plus V-4 artifacts |
| AC-6 | T-5, T-6, T-7 | V-4, V-7 | Task acceptance traces plus V-4, V-7 artifacts |
| AC-7 | T-3, T-6, T-7 | V-5, V-7 | Task acceptance traces plus V-5, V-7 artifacts |
| AC-8 | T-4, T-7 | V-6 | Task acceptance traces plus V-6 artifacts |
| AC-9 | T-6, T-7 | V-10 | Task acceptance traces plus V-10 artifacts |
| AC-10 | T-1, T-7 | V-2, V-8 | Task acceptance traces plus V-2, V-8 artifacts |
| AC-11 | T-1, T-2, T-6, T-7 | V-1, V-2, V-8 | Task acceptance traces plus V-1, V-2, V-8 artifacts |
| AC-12 | T-3, T-4, T-5, T-7 | V-5, V-6, V-8 | Task acceptance traces plus V-5, V-6, V-8 artifacts |
| AC-13 | T-2, T-3, T-4, T-7 | V-1, V-5, V-6 | Task acceptance traces plus V-1, V-5, V-6 artifacts |
| AC-14 | T-5, T-7 | V-3, V-4, V-8 | Task acceptance traces plus V-3, V-4, V-8 artifacts |
| AC-15 | T-3, T-5, T-7 | V-7 | Task acceptance traces plus V-7 artifacts |
| AC-16 | T-3, T-5, T-7 | V-4, V-9 | Task acceptance traces plus V-4, V-9 artifacts |
| AC-17 | T-1, T-2, T-3, T-4, T-5, T-6, T-7, T-8 | V-1, V-2, V-6, V-11 | Task acceptance traces plus V-1, V-2, V-6, V-11 artifacts |
| AC-18 | T-8 | V-3, V-4, V-9, V-10, V-11 | Task acceptance traces plus V-3, V-4, V-9, V-10, V-11 artifacts |
| AC-19 | T-8 | V-12 | Task acceptance traces plus V-12 artifacts |

Coverage proof: all 19 criteria have at least one implementation task, one test/validation, and inspectable evidence. No plan artifact was written before this matrix was complete.

## Implementation Tasks
- **T-1 — Model and snapshot the authoritative final validation** (AC-3, AC-4, AC-10, AC-11, AC-17); depends on None. Extend configuration, domain, readiness, launch binding, and versioned persistence. Implement `rpiv.final_validation` exactly as architected: absent defaults to `just verify`; an explicit value is one argument-free `just <recipe>` declared by the root justfile; empty, malformed, undeclared, shell-shaped, or focused values fail before ownership. Introduce v4 snapshots with one immutable requirement and deterministic v1-v3 normalization.
- **T-2 — Expose the versioned integration instructions command** (AC-1, AC-2, AC-11, AC-13, AC-17); depends on T-1. Add strict `instructions [--json]` parsing, `IntegrationContractV1`, shared human/JSON rendering, current new-run effective validation facts, all path/schema/atomicity/phase/result/legacy/failure rules, and cumulative help. Keep the command read-only and repository-scoped.
- **T-3 — Implement atomic RPIV progress publication and observation** (AC-7, AC-12, AC-13, AC-15, AC-16, AC-17); depends on T-1. Add strict `RpivStatusV1`, injected phase-publication helper, typed file port, last-accepted progress facts, and deterministic classification for missing, empty, malformed, incomplete, unsupported, mismatched, stale, regressed, repeated, conflicting, late, and valid progress. Use same-directory synced atomic replacement.
- **T-4 — Render separately observed RPIV phase in status and list** (AC-8, AC-12, AC-13, AC-17); depends on T-3. Extend reconciliation/status/list types and renderers with a non-authorizing progress observation, phase, classification, and last-accepted facts while preserving operational state including `running_rpiv`. Update list inventory composition and schema versions deliberately.
- **T-5 — Publish and validate immutable AgentResultV1 at the RPIV boundary** (AC-4, AC-5, AC-6, AC-12, AC-14, AC-15, AC-16, AC-17); depends on T-1,T-3. Extend strict AgentResultV1 with `requiredFinalValidation` command/status/evidence binding, keep supplementary validations diagnostic-only, add no-clobber atomic publication and local validation helpers, inject exact run binding, and update coordinator/Verifier contracts. Verify publishes only after acceptance, snapshotted validation, push, and PR creation; coordinator validates before zero exit.
- **T-6 — Align canonical and packaged integration guidance** (AC-1, AC-5, AC-6, AC-7, AC-9, AC-11, AC-17); depends on T-2,T-5. Update canonical RPIV coordinator and Verifier assets, packaged Operator/Assessor/Skill, official contract assertions/catalog digests as required, and integration guidance. Direct RPIV to `soft-factory instructions`; preserve Operator, Assessor, and Skill delegation to Runner without a competing control path.
- **T-7 — Document configuration, schemas, operations, compatibility, and safety** (AC-1, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15, AC-16, AC-17); depends on T-2,T-4,T-5,T-6. Update README, docs index, issue-run and recovery guides, plus an integration-contract guide if useful. Cover exact command grammar, configuration and examples, v4 migration, legacy behavior, progress/result schemas and paths, terminal semantics, status/list output, atomicity, redaction, troubleshooting, local deployment boundaries, and no network API impact.
- **T-8 — Run integrated positive and negative verification matrices** (AC-17, AC-18, AC-19); depends on T-1,T-2,T-3,T-4,T-5,T-6,T-7. Compose repository-local fixtures spanning configuration, launch/recovery, phase publication, immutable result publication, coordinator validation, status/list, reconciliation, official assets, redaction, and write faults. Run focused checks during implementation and finish with authoritative root `just verify`.

## Delivery Order and Boundaries
1. Establish configuration/persistence and the executable contract model before consumers.
2. Build progress and result publication independently, then integrate status/list and agent assets.
3. Update all application documentation only after executable contracts stabilize.
4. Finish with the credential-free matrix and authoritative root `just verify`. Runner remains non-agentic; RPIV progress never authorizes control or completion.
