# Research Brief: Define RPIV progress, final-result ownership, and integration instructions

## GitHub Issue
- **Issue:** #19
- **Title:** Define RPIV progress, final-result ownership, and integration instructions
- **Work Item:** project/work-items/19-define-rpiv-progress-final-result-ownership-and-integration-instructions

## Scope Classification
- **Scope Type:** issue

## Problem Statement
Runner requires the immutable `<owned-worktree>/.soft-factory/agent-result.json` AgentResultV1 handoff after RPIV exits, but the repository RPIV contract only declares `result_contract: agent-result-v1`. It does not assign artifact creation to the Verifier or require the coordinator to validate the handoff before a success-shaped exit, so a verified run can finish without the completion proof Runner expects.

Runner's operational state does not identify the observed Research, Plan, Implement, or Verify phase. The authoritative final validation is also hard-coded rather than snapshotted from repository configuration, and focused validation is currently treated as completion proof.

## Acceptance Criteria

**Core**
- [ ] `soft-factory instructions` deterministically reports the complete Runner/RPIV integration contract: the exact owned progress and final-result paths; atomic writes; phase transitions; final AgentResultV1 ownership, timing, identity, and evidence; the run-snapshotted final validation requirement; mutable-progress versus immutable-completion semantics; and the rule that no valid final artifact means no successful RPIV exit.
- [ ] `soft-factory instructions --json` returns a versioned structured form with the same contract facts as human output; repeated invocations against unchanged inputs return equivalent facts and unsupported command forms fail with the existing CLI error semantics.
- [ ] Each new run snapshots exactly one authoritative final validation requirement from the repository's current configuration, defaulting to `just verify` when no value is configured, and completion requires matching passed evidence for that snapshotted requirement; the documented configuration contract defines its accepted value and rejects invalid or explicitly empty values before run ownership or state is created.
- [ ] Runner neither requires nor interprets `just verify-focused` as completion proof; its presence, absence, pass, or failure in RPIV evidence does not change the completion decision, while RPIV may continue to use it during implementation.
- [ ] The RPIV Verifier has permission and explicit responsibility to publish `<owned-worktree>/.soft-factory/agent-result.json` only after verification succeeds and the pull request is created; the strict AgentResultV1 identifies the owned issue, branch, final head, pull request, outcome, acceptance evidence, the snapshotted required final validation and its passed evidence, and completion time.
- [ ] The RPIV coordinator exits successfully only after confirming that the final artifact exists at the owned path and passes strict AgentResultV1 validation against the run's snapshotted requirement; creation, write, absence, or validation failure yields an observable nonzero RPIV exit and does not replace an existing valid final artifact with partial or invalid content.
- [ ] RPIV atomically publishes a versioned `<owned-worktree>/.soft-factory/rpiv-status.json` containing the owned issue identity, current Research, Plan, Implement, Verify, or terminal phase, status, and update time at every phase transition and failed or terminal outcome.
- [ ] `soft-factory status` and `soft-factory list` expose the separately observed RPIV phase in human and JSON output while preserving the existing operational state, including `running_rpiv`; absent progress is explicitly unknown and is never inferred from operational state.
- [ ] Official repository integration guidance directs RPIV agents to `soft-factory instructions`, while the installed Operator, Assessor, and Skill remain observably delegated to Runner rather than introducing a competing operational path.

**Edge Cases**
- [ ] Changes to final-validation configuration after a run starts do not alter that run's completion or recovery requirement; a later new run snapshots the then-current valid requirement.
- [ ] A supported legacy snapshot that predates the configurable requirement deterministically retains `just verify` as its sole final validation requirement, never consults later configuration, and no longer requires `just verify-focused`; malformed or unsupported persistence fails safe without inferred completion. `soft-factory instructions` explains this compatibility behavior.
- [ ] Mutable progress is never accepted as completion proof; conflicting, regressed, repeated, or late progress cannot replace or alter an existing immutable final AgentResultV1 or Runner's completion reconciliation result.
- [ ] Missing, zero-byte, malformed, required-field-incomplete, stale, identity-mismatched, or unsupported progress is classified explicitly under deterministic rules documented by `soft-factory instructions` and cannot produce completion or authorize ownership, process, recovery, or cleanup actions.
- [ ] Missing, zero-byte, malformed, required-field-incomplete, identity-mismatched, unsupported, or final-validation-mismatched results retain non-completed reconciliation outcomes and safe recovery semantics.
- [ ] Interrupted or competing writes and simultaneous readers expose either the prior complete artifact or the new complete artifact at each owned path, never a partial success-shaped document or mixed-issue identity.
- [ ] Progress, result, instructions, status, and list output do not expose configured Copilot environment names or values and preserve existing redaction and ownership boundaries.

**Verification**
- [ ] Repeatable repository-local evidence exercises the default and a configured final validation, configuration changes during active and recovered runs, focused-validation evidence in every pass/fail/absent form, Research-to-Verify-to-terminal progression, final artifact publication after represented pull-request creation, coordinator validation before zero exit, status/list phase reporting, and equivalent human/JSON instructions without live credentials or services.
- [ ] Repeatable repository-local negative controls cover supported legacy snapshots, missing snapshotted validation evidence, write failures, concurrent reads/writes, repeated and late updates, and every missing, empty, malformed, stale, mismatched, conflicting, and unsupported artifact class above, with inspectable exit, output, artifact, and unchanged-ownership evidence.
- [ ] `just verify` passes and produces inspectable evidence for the integration contract.

## Repository Findings
- `src/command.ts` (`Command`, `parseCommand`, `HELP_TEXT`) and `src/index.ts:runCli` have no `instructions` command or dispatch; unsupported forms use `CLI_INVALID`.
- `src/domain.ts` defines operational `RunState`; `running_rpiv` is one state and no separate RPIV-phase type or progress model exists. `StatusFacts` and list records contain no separately observed phase.
- `src/orchestrator.ts:status` returns persisted state, tmux facts, and reconciliation. `IssueRunService.list` returns issue number, state, and code. `src/render.ts` derives human and JSON output from those structures.
- `src/domain.ts:REQUIRED_VALIDATIONS` hard-codes `just verify-focused` and `just verify`; `RequiredValidationV1.command` is a two-value union. New `RunSnapshotV3` records both, and `src/persistence.ts:isRequiredValidations` requires exactly both.
- `src/completion.ts:reconcileCompletion` compares every persisted required validation, so focused evidence currently changes completion. `src/completion.test.ts` covers missing, duplicate, and failed focused validation as failure.
- `src/config.ts:RunConfiguration` and `parseConfiguration` have no final-validation field. The strict parser rejects unsupported keys; its `optional` helper maps empty scalar values to absence.
- `src/completion.ts:parseAgentResult` strictly accepts issue, outcome, branch, SHA, PR, acceptance results, validation results, and completion time. It has no field separately identifying the snapshotted final validation.
- `src/orchestrator.ts:finalize` reads the result after zero Copilot exit, persists missing/invalid result as `interrupted`, and reconciles Git and PR facts. `src/index.ts:runWorker` returns zero only for `completed`; this is Runner post-process validation, not coordinator pre-exit validation.
- `src/live.ts:NodeFilePort.readAgentResult` owns the exact result path. `NodeFilePort.atomicWrite` uses same-directory exclusive temporary creation, sync, close, and rename. No progress read/write port exists.
- `src/reconciliation.ts:collectReconciliation` strictly parses result identity and protects persisted result content with `RESULT_CONTENT_MISMATCH`; its shared observations and safe-action rules have no progress boundary.
- `.github/agents/rpiv.agent.md` declares the result contract but finishes after Verify returns a PR and does not validate AgentResultV1. `.github/agents/rpiv-verifier.agent.md` creates the PR and summary but neither permits nor requires writing the result.
- Official Operator, Assessor, and Skill assets delegate operational authority to Runner. `src/official-agent-contracts.ts` enforces Operator/Assessor delegation phrases; none reference `soft-factory instructions`.
- `docs/phase-1-issue-run.md` says both root validations are completion evidence; `docs/phase-3-recovery-operations.md` carries that conjunction into recovery. README, docs index, and the official-assets guide contain no instructions command or progress path.
- Existing tests cover strict results and mismatches (`src/completion.test.ts`), zero-exit false completion (`src/orchestration.test.ts`), recovery/status/list (`src/recovery-control.test.ts`), CLI/config (`src/index.test.ts`), remote reconciliation (`src/integration.test.ts`), and documentation/agent contracts (`src/documentation.test.ts`). Current assertions encode both validations and operational-state-only status/list output.

## Constraints
- The completion path is already `<owned-worktree>/.soft-factory/agent-result.json`; strict parsing and fail-safe result classifications are established by `parseAgentResult` and accepted completion architecture.
- Requirements are persisted in versioned snapshots and carried through recovery. New runs are schema v3; supported v1/v2 records remain readable only under explicit compatibility rules, while malformed or unsupported state fails safely.
- Accepted architecture currently mandates focused and full validation as completion evidence. This conflicts with Issue #19's single configured final-validation requirement.
- Persisted and observed runtime facts must remain distinct. Unknown or contradictory observations cannot authorize launch, signaling, reuse, recovery, or cleanup.
- Human and JSON output must derive from the same versioned structured facts, with stable typed failures and nonzero exits.
- Owned mutable files and snapshots use atomic replacement semantics; append-only events precede snapshot replacement. Progress cannot weaken ownership, identity, completion, recovery, or cleanup comparisons.
- RPIV ownership is fixed: Verify decides acceptance, pushes, and creates the PR; the coordinator orchestrates and validates handoffs. Current write permissions and closeout steps omit AgentResultV1.
- Root justfile recipes remain command authority. Focused validation remains an implementation aid and `just verify` is the current Verify-stage default.
- Official Operator, Assessor, and Skill behavior must remain delegated to Runner; Doctor retains `.github/agents/rpiv.agent.md` as sole RPIV authority.
- Configured Copilot environment names and values must not enter errors, output, snapshots, events, launch intents, or logs.
- The codebase remains a strict TypeScript Node CLI with typed adapters, deterministic domain logic, shell-free subprocesses, and at least 80% coverage.

## Relevant ADRs and Core-Components
- **ADR-260811-prototype-two-completion-proof / CORE-COMPONENT-260811-completion-evidence-reconciliation:** AgentResultV1, owned result path, strict reconciliation, terminal classification, and current two-command validation conjunction.
- **ADR-260811-prototype-three-recovery-concurrency / CORE-COMPONENT-260811-run-reconciliation-control:** one-pass typed observations, unknown/mismatch handling, versioned recovery, shared status/list reconciliation, and preserved completion proof.
- **ADR-260811-prototype-one-run-orchestration / CORE-COMPONENT-260811-issue-run-orchestration:** deterministic Runner/RPIV separation, `running_rpiv`, status, worker launch, and owned setup.
- **ADR-260812-official-asset-distribution-installation / CORE-COMPONENT-260812-official-asset-installation-contract:** official assets delegate lifecycle authority to Runner.
- **ADR-260812-repository-doctor-readiness:** `.github/agents/rpiv.agent.md` metadata is sole RPIV compatibility authority; recognized persistence/result paths fail safe.
- **ADR-260812-copilot-child-environment / CORE-COMPONENT-260812-copilot-child-environment-contract:** configured environment names and values are prohibited from persisted/rendered surfaces.
- **CORE-COMPONENT-260806-rpiv-stage-contract / CORE-COMPONENT-260806-project-command-interface:** stage ownership, PR creation by Verify, root justfile authority, and distinct focused/full validation.
- **CORE-COMPONENT-260810-persistence-recovery, CORE-COMPONENT-260810-structured-events, CORE-COMPONENT-260810-error-handling:** atomic versioned persistence, persisted/observed separation, equivalent outputs, redaction, stable errors, and fail-safe ambiguity.
- **CORE-COMPONENT-260810-issue-worktree-locking / CORE-COMPONENT-260811-owned-resource-cleanup:** exact owned-resource authorization cannot be weakened by mutable or ambiguous observations.
- **CORE-COMPONENT-260810-subprocess-execution / CORE-COMPONENT-260810-development-standards:** safe external execution, secret handling, deterministic adapters, strict TypeScript, and validation constraints.

## Risks and Open Questions
- The authoritative GitHub block contains **19**, not 17, unchecked criteria: 9 Core, 7 Edge Cases, and 3 Verification. All 19 are preserved above in issue order; the requested count is inconsistent and requires downstream coordination.
- The accepted completion ADR and core-component explicitly require `just verify-focused`; the issue conflicts with that accepted invariant. Research does not resolve it.
- The issue does not name the final-validation configuration key or fully delimit its accepted value grammar. Existing repository evidence does not answer that contract detail.
- Existing AgentResultV1 validation entries do not separately bind claimed evidence to one snapshotted required validation.
- The issue does not enumerate progress statuses, terminal phase values, freshness rules, or deterministic regression/conflict ordering; no existing schema supplies them.
- The coordinator trusts successful Verify return/PR URL for closeout, while Runner validates the artifact after Copilot exits. Missing coordinator validation is a false-success risk.
- The shared reconciliation report has no progress observation; malformed or stale progress must not be confused with operational ownership or safe-action evidence.
- Result reads are strict, but atomicity depends on producer behavior. RPIV agents currently have no owned publication contract for either artifact.
