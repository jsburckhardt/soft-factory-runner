# Research Brief: Define RPIV progress, final-result ownership, and integration instructions

## GitHub Issue
- **Issue:** #19
- **Title:** Define RPIV progress, final-result ownership, and integration instructions
- **Work Item:** project/work-items/19-define-rpiv-progress-final-result-ownership-and-integration-instructions

## Scope Classification
- **Scope Type:** issue

## Problem Statement
Within the user-bounded Research scope, `PRD.md` does not contain the required exact generic one-line launch command `OTEL_RESOURCE_ATTRIBUTES="project.name=<project>,issue.id=issue-<number>" copilot --yolo`.

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
- `PRD.md:1087-1110` section 27 contains a concrete multiline invocation for issue 123: the environment assignment is on one line and `copilot --yolo --name ... --agent rpiv -p ...` is on the next.
- `PRD.md:1991-2009` Observability contains only the generic environment assignment `OTEL_RESOURCE_ATTRIBUTES=project.name=<project>,issue.id=issue-<number>`; it is not a launch invocation.
- A literal repository check found zero occurrences in `PRD.md` of the exact required generic one-line command.
- `src/domain.ts` symbol `otelResourceAttributes` generates `project.name=<normalized repository>,issue.id=issue-<number>`; `src/orchestrator.ts` `runWorker` separately constructs the Copilot argument array beginning with `--yolo` and passes both through `ProcessPort.spawnCopilot`.
- `src/live.ts` `LiveProcessPort.spawnCopilot` launches executable `copilot` with an argument array, `shell: false`, and the composed child environment; the requested PRD command is therefore documentation syntax rather than the application subprocess representation.
- `src/orchestration.test.ts` verifies normalized telemetry and the `--yolo --name issue-<number> --agent rpiv --prompt ...` launch trace. `src/documentation.test.ts` checks that operational guides mention `OTEL_RESOURCE_ATTRIBUTES`, but no inspected test requires the exact generic PRD line.
- The root `justfile` defines distinct `verify-focused` and `verify` recipes; `verify` composes lint, format, type checking, tests, build, and `git diff --check`.

## Constraints
- `PRD.md` must include this exact generic launch command verbatim and on one line: `OTEL_RESOURCE_ATTRIBUTES="project.name=<project>,issue.id=issue-<number>" copilot --yolo`.
- Research is bounded to documenting the repository state relevant to that PRD requirement; `PRD.md` is not edited in this stage.
- `CORE-COMPONENT-260812-copilot-child-environment-contract` and ADR `ADR-260812-copilot-child-environment` require Runner-owned `OTEL_RESOURCE_ATTRIBUTES` to be applied last, preserve the existing Copilot executable and arguments, and require shell-free argument-array spawning.
- `CORE-COMPONENT-260811-issue-run-orchestration` fixes telemetry normalization and the generated attribute shape while requiring exact `--name issue-<number>` and `--agent rpiv` launch arguments.
- `CORE-COMPONENT-260806-project-command-interface` and `CORE-COMPONENT-260806-rpiv-stage-contract` retain the root `justfile` as command authority and keep focused and full verification distinct.
- Existing completion architecture conflicts with broader Issue #19 criteria: `ADR-260811-prototype-two-completion-proof`, `CORE-COMPONENT-260811-completion-evidence-reconciliation`, `src/domain.ts` `REQUIRED_VALIDATIONS`, and `src/persistence.ts` currently require both `just verify-focused` and `just verify` as completion proof.
- `project/architecture/ADR/DECISION-LOG.md` records all cited ADRs and core-components as Accepted or Adopted and includes the current decisions requiring both validation entries.

## Relevant ADRs and Core-Components
- `project/architecture/ADR/ADR-260812-copilot-child-environment.md` and `project/architecture/core-components/CORE-COMPONENT-260812-copilot-child-environment-contract.md`: Copilot child environment composition and immutable telemetry precedence.
- `project/architecture/ADR/ADR-260811-prototype-one-run-orchestration.md` and `project/architecture/core-components/CORE-COMPONENT-260811-issue-run-orchestration.md`: normalized repository identity and Copilot launch contract.
- `project/architecture/ADR/ADR-260811-prototype-two-completion-proof.md` and `project/architecture/core-components/CORE-COMPONENT-260811-completion-evidence-reconciliation.md`: existing final-result and dual-validation completion contract implicated by Issue #19.
- `project/architecture/core-components/CORE-COMPONENT-260806-rpiv-stage-contract.md` and `project/architecture/core-components/CORE-COMPONENT-260806-project-command-interface.md`: stable work-item resolution and root validation command authority.

## Risks and Open Questions
- The exact generic one-line command intentionally omits the additional runtime arguments shown in section 27 and used by application code; without surrounding context, readers could interpret the generic example as the complete production argument contract.
- Section 27 uses quoted `OTEL_RESOURCE_ATTRIBUTES`, while Observability uses an unquoted environment-only form. The required exact line introduces a third textual representation whose consistency must remain clear.
- The broad Issue #19 acceptance criteria extend well beyond this user-bounded PRD requirement; this research does not establish repository coverage for all progress, result-ownership, instructions, status/list, recovery, and configurable-validation behaviors.
- Existing accepted architecture and code hard-code `just verify-focused` as completion proof, whereas Issue #19 says it must not affect completion. That mismatch remains unresolved in this research-only artifact.
