# ADR-260812-rpiv-integration-completion-contract: RPIV Integration and Completion Contract

## Status

Accepted

## Context

Runner currently persists both `just verify-focused` and `just verify` as completion requirements, but Issue #19 requires exactly one run-snapshotted configurable final validation and requires focused validation to have no effect on completion. RPIV also has no versioned progress handoff, executable publication boundary for the immutable result, or coordinator pre-exit validation. Configuration grammar, progress ordering, freshness, conflicts, result binding, and legacy behavior must be deterministic before implementation.

## Decision

Adopt `rpiv.final_validation` as the only final-validation configuration key. Accept exactly `just <recipe>`, where `<recipe>` matches `[A-Za-z][A-Za-z0-9_-]*` and is declared by the repository root `justfile`. Reject arguments, extra whitespace, shell metacharacters, non-string scalars, explicit empty scalars or mappings, undeclared recipes, and `just verify-focused`. Default to `just verify` only when the key is absent. Validate before creating a lock, lease, snapshot, or owned resource.

Snapshot exactly one normalized final validation in new `RunSnapshotV4` state and carry it unchanged through recovery and finalization. Supported v1, v2, and v3 snapshots never consult current configuration for completion. Normalize their legacy validation requirement to sole `just verify` and ignore any legacy `just verify-focused` requirement. A v1 snapshot still lacks persisted acceptance input and cannot complete until an explicit supported migration proves that input. Malformed or unsupported persistence fails safe.

Retain strict `AgentResultV1` and add a required `requiredFinalValidation` binding containing the exact snapshotted `command`, `passed` status, and one or more nonempty redacted evidence references. Retain unique supplementary `validations[]` entries for RPIV diagnostics, but never inspect the presence, absence, pass, or fail status of `just verify-focused` when deciding completion. Completion requires the binding command to equal the snapshot and to be `passed` with evidence.

Introduce one versioned RPIV integration contract for instructions, progress, publication, and local pre-exit validation, governed by `CORE-COMPONENT-260812-rpiv-integration-handoff`. Runner injects the run ID, attempt, issue, branch, owned paths, and snapshotted final validation into a deterministic RPIV launch block. The Verifier publishes the final artifact only after acceptance, final validation, push, and pull-request creation. The coordinator uses the injected Runner validator and returns zero only after the owned artifact passes strict local schema, identity, and snapshot-binding validation. Remote Git and GitHub reconciliation remains the Runner post-exit completion decision.

Supersede `ADR-260811-prototype-two-completion-proof`. Preserve its Git, GitHub, acceptance, terminal-classification, and event-before-snapshot decisions except where this decision replaces validation, schema, legacy compatibility, and RPIV handoff rules.

## Alternatives

What other options were considered? Why were they rejected?

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Keep both root recipes as completion | No persistence change | Focused checks can falsely block or authorize completion | Conflicts with Issue #19 |
| Re-read configuration at finalization | No snapshot migration | Active runs change meaning during execution or recovery | Violates deterministic recovery |
| Accept arbitrary command strings | Flexible | Duplicates shell grammar and creates injection ambiguity | Root `justfile` must remain authoritative |
| Let the coordinator read Runner snapshots | Avoids a validator | Breaks ownership and couples agents to persistence | Runner must provide executable binding validation |

## Consequences

What becomes easier or harder as a result of this decision?

### Positive
- Completion depends on one persisted, configurable, evidence-bound requirement.
- RPIV validates its handoff before a success-shaped exit.
- Legacy runs remain deterministic without reading changed configuration.

### Negative
- Snapshot, result, prompt, and agent contracts require coordinated migration.
- Custom validations must be argument-free root recipes.

### Neutral
- `just verify-focused` remains an implementation aid and RPIV stage boundary.
- Runner remains the only authority that declares a run `completed`.

## Related Issues

- [#19](https://github.com/jsburckhardt/soft-factory-runner/issues/19)

## References

- [Prototype Two Completion Proof](ADR-260811-prototype-two-completion-proof.md)
- [Prototype Three Recovery and Explicit Concurrency](ADR-260811-prototype-three-recovery-concurrency.md)
- [RPIV Integration Handoff](../core-components/CORE-COMPONENT-260812-rpiv-integration-handoff.md)
