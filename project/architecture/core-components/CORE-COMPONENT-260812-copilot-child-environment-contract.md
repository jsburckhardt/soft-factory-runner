# CORE-COMPONENT-260812-copilot-child-environment-contract: Copilot Child Environment Contract

## Status

Adopted

## Purpose

Define one reusable configuration, launch, confidentiality, correction, and isolation contract for every Runner-launched Copilot process.

## Scope

This component applies to `.soft-factory/config.yml`, `RunConfiguration`, new and resumed Copilot launch orchestration, the typed process port, live environment composition, Doctor configuration compatibility, deterministic fixtures, output, persistence, and user documentation. It does not alter non-Copilot subprocess environments, Copilot arguments, process identity, completion proof, or external Copilot output behavior.

## Definition

### Rules
- Expose exactly one mapping at `copilot.environment`; accept only names matching `[A-Za-z_][A-Za-z0-9_]*` and string scalar values, including explicit double-quoted `""`.
- Treat absent `copilot`, absent `copilot.environment`, and an empty `copilot.environment` mapping as an empty immutable map that preserves existing behavior.
- Reject duplicate or invalid names, non-string and nested values, aliases, anchors, merge keys, unsupported keys, and malformed syntax before `spawnCopilot`; identify the field and reason without rendering its value.
- Read and validate configuration immediately for every new or resumed Copilot launch, before launch-intent persistence and spawn; a rejected attempt launches nothing and does not contaminate a later corrected attempt.
- Compose each Copilot child environment as allowlisted inherited entries, then configured entries, then Runner-owned `OTEL_RESOURCE_ATTRIBUTES` for the current normalized repository and issue.
- Preserve configured strings literally through a shell-free executable and argument-array spawn; perform no command substitution, shell evaluation, or variable expansion.
- Pass the immutable map only to `ProcessPort.spawnCopilot`; never mutate ambient environment or apply configured entries to Git, `gh`, tmux, workers, Doctor, or other subprocesses.
- Never persist or render configured values in errors, human or JSON output, snapshots, events, launch intents, or retained logs. Persist only existing generated resource attributes and process identity facts.
- Keep each concurrent issue launch map local to that invocation so configured values and generated attributes cannot cross issue boundaries.

### Interfaces
- `RunConfiguration.copilotEnvironment` is a readonly name-to-string mapping and defaults to an empty mapping.
- `ProcessPort.spawnCopilot.environment` carries the complete explicit launch override map at the typed process boundary.
- `LiveProcessPort` merges allowlisted inherited values with the explicit map and invokes `copilot` with `shell: false` and the existing argument array.
- Shared configuration parsing returns safe `CONFIG_INVALID` errors containing field identity and reason only.

### Expectations
- Child-boundary fixtures observe configured variables and the exact generated resource attributes without live Copilot, credentials, telemetry, or network access.
- Absent and empty mappings produce the same command and allowed environment as before this contract.
- Correction and two-issue concurrency fixtures prove fresh reads, zero rejected spawns, and disjoint immutable launch maps.
- Sentinel-value tests scan fixture human/JSON output, errors, snapshots, events, and retained logs and find no configured value.

## Rationale

The child environment crosses configuration, orchestration, external execution, persistence, recovery, Doctor, and documentation. One contract prevents parser, adapter, and fixture behavior from inventing different precedence or confidentiality rules while retaining the existing typed subprocess boundary.

## Usage Examples

```
copilot:
  environment:
    COPILOT_OTEL_ENABLED: "true"
    OTEL_EXPORTER_OTLP_ENDPOINT: "https://collector.example.invalid"
    OPTIONAL_EMPTY: ""
```

## Integration Guidelines

- Parse into a fresh readonly object and compose the Runner-owned telemetry value last.
- Record only variable names and pass/fail outcomes in verification evidence; keep fixture sentinel values in test-local assertions.
- Exercise configuration through the same parser used by issue execution and Doctor.
- Keep launch arguments and all existing persistence schemas unchanged.
- Validate with direct `just verify-focused` and `just verify`, then the delegating harness checks.

## Exceptions

- None. Unknown syntax, value disclosure, non-Copilot propagation, or Runner-owned telemetry override always fails acceptance.

## Enforcement

- [x] Automated checks
- [x] Code review checklist
- [x] Test coverage requirements

## Related ADRs

- [ADR-260812-copilot-child-environment](../ADR/ADR-260812-copilot-child-environment.md)
- [ADR-260811-prototype-one-run-orchestration](../ADR/ADR-260811-prototype-one-run-orchestration.md)
- [ADR-260811-prototype-three-recovery-concurrency](../ADR/ADR-260811-prototype-three-recovery-concurrency.md)
