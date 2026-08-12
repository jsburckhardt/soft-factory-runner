# CORE-COMPONENT-260812-rpiv-integration-handoff: RPIV Integration Handoff

## Status

Adopted

## Purpose

Define one reusable contract for deterministic Runner instructions, mutable RPIV progress, immutable result publication, pre-exit validation, status observation, atomicity, and redaction.

## Scope

This component applies to CLI instructions, RPIV launch facts, `.soft-factory/rpiv-status.json`, `.soft-factory/agent-result.json`, the coordinator and Verifier agent contracts, status/list reconciliation and rendering, persistence compatibility, official guidance, and deterministic fixtures. It does not let progress authorize ownership, recovery, process control, cleanup, or completion.

## Definition

### Rules
- Expose `soft-factory instructions [--json]` as a repository-scoped, read-only command. Derive both forms from one `IntegrationContractV1`; include exact owned paths, schemas, atomicity, transitions, ownership, timing, result identity/evidence, configured and snapshotted final-validation behavior, legacy behavior, failure semantics, and mutable-versus-immutable boundaries.
- Parse only the exact command and optional `--json`; use existing `CLI_INVALID` and exit-2 behavior for unsupported forms. Repeated calls over unchanged configuration and root `justfile` bytes return equivalent facts. Invalid final-validation configuration returns value-free `CONFIG_INVALID` and creates no ownership.
- Report the current new-run effective final validation, but state that an active or recovered run uses only its injected and persisted snapshot. Never report configured Copilot environment names or values.
- Inject `IntegrationLaunchV1` into every new and resumed RPIV prompt with run ID, attempt, issue number, branch, exact progress/result paths, snapshotted final validation, and exact publication/validation helper invocations. Persist the same redacted launch facts before spawn.
- Define `RpivStatusV1` with exact keys `schemaVersion`, `runId`, `attempt`, `issueNumber`, `branch`, `sequence`, `phase`, `status`, and `updatedAt`. Phases are `research`, `plan`, `implement`, `verify`, and `terminal`; nonterminal status is only `running`; terminal statuses are `succeeded`, `failed`, `blocked`, `cancelled`, and `interrupted`.
- Publish progress at each phase start and every failed or terminal outcome through the injected Runner helper. The helper derives identity and next sequence from the owned snapshot and prior complete progress, then performs a same-directory exclusive temporary write, file sync, close, atomic rename, parent-directory sync, and temporary cleanup.
- Order phases as research < plan < implement < verify < terminal. An identical same-sequence artifact is `repeated`; the same sequence with different facts is `conflicting`; a lower sequence, attempt, timestamp, or phase is `regressed`; any update observed after immutable result acceptance or completion reconciliation is `late`. Regressed, conflicting, repeated, and late observations never replace the last accepted progress fact.
- Treat a progress artifact as fresh only when run ID, attempt, issue, and branch match the snapshot, its ISO-8601 `updatedAt` is not before the persisted attempt launch time and not after the observation time, and its sequence/phase/status obey the transition rules. Do not impose an elapsed-age timeout.
- Classify progress as `PROGRESS_MISSING`, `PROGRESS_EMPTY`, `PROGRESS_INVALID`, `PROGRESS_REQUIRED_FIELD_MISSING`, `PROGRESS_VERSION_UNSUPPORTED`, `PROGRESS_IDENTITY_MISMATCH`, `PROGRESS_STALE`, `PROGRESS_REGRESSED`, `PROGRESS_REPEATED`, `PROGRESS_CONFLICT`, `PROGRESS_LATE`, or `PROGRESS_VALID`. Preserve the last accepted fact and classification separately from operational state.
- Expose observed RPIV phase and progress classification in status and list human/JSON output. Use `unknown` for missing or unusable progress and never infer a phase from `running_rpiv` or another operational state.
- Require the Verifier to finish acceptance, run the snapshotted final validation, push the final head, create the pull request, and only then create a strict candidate `AgentResultV1`. Publish via the injected Runner helper, which validates schema, owned identity, final head, PR identity, every AC result, the exact final-validation binding and evidence, then atomically installs the immutable destination without replacement.
- Implement immutable publication with a same-directory exclusive temporary file, file sync, close, and no-clobber atomic link or equivalent primitive; sync the directory and remove the temporary name. If a destination exists, accept only an already-valid byte-equivalent owned result as idempotent. Never truncate, rename over, or replace an existing destination.
- Require the coordinator to invoke the injected local validator after Verify returns. The validator reads the owned snapshot and final artifact, performs strict schema, identity, acceptance, and snapshotted-validation binding checks without state mutation, and exits nonzero with a stable redacted code on missing, write, parse, identity, or evidence failure. The coordinator exits zero only after this validator succeeds.
- Keep Runner post-exit Git, remote, pull-request, and completion reconciliation authoritative. Mutable progress and coordinator local validation are never completion proof.
- Redact progress, result, instructions, status, list, helper errors, snapshots, events, and launch facts. Prohibit all configured Copilot environment names and values from those surfaces.

### Interfaces
- `IntegrationContractV1` is the single structured source for instructions human/JSON rendering.
- `IntegrationLaunchV1` binds one run and attempt to issue, branch, owned paths, final validation, and helper commands.
- `RpivStatusV1` is the mutable progress schema at `<owned-worktree>/.soft-factory/rpiv-status.json`.
- `AgentResultV1` is the immutable completion handoff at `<owned-worktree>/.soft-factory/agent-result.json` with `requiredFinalValidation: { command, status, evidence[] }`.
- Internal publication and validation helpers consume only the injected issue/run binding and return stable redacted JSON-compatible outcomes; unsupported forms retain CLI syntax failure semantics.

### Expectations
- Readers see either the prior complete artifact or the new complete artifact, never partial JSON or mixed identity.
- Missing or invalid progress yields phase `unknown` while preserving operational state and safe-action decisions.
- Focused-validation evidence in any form leaves completion comparisons byte-for-byte equivalent.
- Repository-local fixtures need no credentials, network, live Copilot, live tmux, or live GitHub.

## Rationale

The integration spans configuration, persistence, agent contracts, filesystem publication, reconciliation, rendering, and documentation. One executable contract prevents agent prose, mutable observations, and current configuration from weakening immutable completion proof.

## Usage Examples

```text
soft-factory instructions
soft-factory instructions --json
running_rpiv + missing progress -> operational state running_rpiv, RPIV phase unknown
Verify creates PR -> publishes valid result -> coordinator validator passes -> RPIV may exit zero
```

## Integration Guidelines

How should other parts of the system integrate with this component?

- Keep schema and classification policy in pure domain modules and filesystem behavior in typed adapters.
- Reuse the root `justfile` parser for configured recipe existence; do not execute final validation inside Runner.
- Add progress as a non-authorizing reconciliation observation and retain the prior accepted observation for comparison.
- Update canonical RPIV coordinator/Verifier assets, packaged official assets, contract assertions, README, docs index, configuration, migration, operations, and troubleshooting guidance together.
- Validate through focused tests while implementing and finish with the snapshotted root recipe plus `just verify` for repository proof.

## Exceptions

Under what circumstances is it acceptable to deviate from this component rules?

- None. Progress ambiguity, publication uncertainty, absent result proof, and local validation failure always remain non-success.

## Enforcement

How is compliance with this component verified?

- [x] Automated checks
- [x] Code review checklist
- [x] Test coverage requirements

## Related ADRs

- [ADR-260812-rpiv-integration-completion-contract](../ADR/ADR-260812-rpiv-integration-completion-contract.md)
- [ADR-260811-prototype-three-recovery-concurrency](../ADR/ADR-260811-prototype-three-recovery-concurrency.md)
