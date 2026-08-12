# ADR-260812-copilot-child-environment: Copilot Child Environment Configuration

## Status

Accepted

## Context

Runner-launched Copilot processes receive an allowlisted inherited environment and generated `OTEL_RESOURCE_ATTRIBUTES`, but repository configuration cannot supply literal Copilot-only variables. Issue #17 requires a public mapping name, strict value-free validation, deterministic precedence, confidentiality, and isolation from other subprocesses. The accepted issue-run contract currently describes only generated telemetry and must be broadened explicitly.

## Decision

Adopt `copilot.environment` as the only public `.soft-factory/config.yml` mapping for Runner-launched Copilot child variables. Names must match `[A-Za-z_][A-Za-z0-9_]*`. Values must be string scalars; double-quoted `""` represents an explicit empty string. An absent `copilot` mapping, absent `environment` mapping, or empty `environment` mapping contributes no entries. Reject duplicate or invalid names, non-string or nested values, aliases, anchors, merge keys, and unsupported keys before spawn. Diagnostics identify the field and reason but never its value.

For every new or resumed Copilot launch, read and validate the then-current configuration into an immutable per-launch map. Compose the child environment in this order: existing allowlisted inherited environment, then `copilot.environment`, then Runner-generated `OTEL_RESOURCE_ATTRIBUTES`. The final attribute is always `project.name=<normalized-project-name>,issue.id=issue-<number>` for that launch. Keep the existing executable and argument array unchanged.

Pass the composed map only through the typed `ProcessPort.spawnCopilot` boundary. Do not mutate `process.env`, reuse the map for Git, `gh`, tmux, workers, Doctor, or other subprocesses, or persist configured names or values in launch intents, snapshots, events, logs, or rendered output. Persist only existing generated resource attributes and process identity facts. Runner diagnostics and structured records must never include configured values; arbitrary content deliberately printed by the external Copilot program remains at the external-process output boundary.

## Alternatives

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| `rpiv.environment` | Matches the prompt namespace | Couples a Copilot process concern to an agent protocol name | The mapping configures the Copilot child regardless of agent implementation |
| `copilot_environment` | Shallow parser change | Introduces another top-level naming style and cannot grow with Copilot options | The PRD already reserves `copilot` as the namespace |
| Inherit the controlling tmux environment | Automatically carries exporter settings | Leaks unrelated variables and bypasses validation | Configuration must be explicit and reproducible |
| Persist configured values or hashes | Supports later audit comparison | Creates secret or secret-derived durable facts | Recovery needs process identity, not configuration content |

## Consequences

### Positive
- Repository configuration can enable Copilot exporters without broadening other subprocess environments.
- Explicit merge order preserves per-issue telemetry and deliberate inherited-name overrides.
- Fresh immutable launch maps preserve correction and concurrent-run isolation.

### Negative
- The strict parser must distinguish string scalars, empty strings, mappings, and prohibited YAML constructs without echoing values.
- Configured authentication names may intentionally override inherited credentials for that Copilot child.

### Neutral
- Existing snapshot, event, process-identity, argument, and completion schemas remain unchanged.
- Absent configuration retains current launch behavior.

## Related Issues

- [#17](https://github.com/jsburckhardt/soft-factory-runner/issues/17)

## References

- [Soft Factory Runner PRD](../../../PRD.md)
- [Prototype One Issue Run Orchestration](ADR-260811-prototype-one-run-orchestration.md)
- [Subprocess Execution](../core-components/CORE-COMPONENT-260810-subprocess-execution.md)
- [Copilot Child Environment Contract](../core-components/CORE-COMPONENT-260812-copilot-child-environment-contract.md)
