# CORE-COMPONENT-260811-engineering-harness-interface: Engineering Harness Interface

## Status

Adopted

## Purpose

Provide a deterministic, self-describing boot and validation surface that cold agents can discover while preserving the root `justfile` as project command authority.

## Scope

This component applies to tracked `.harness/` governance, extensions and briefings; root `justfile` delegation; structured harness output; and repository instructions. It does not make the ambient harness CLI a product dependency or replace RPIV stage ownership.

## Definition

### Rules
- The repository MUST target ambient `@ai-substrate/engineering-harness` v0.13.0 and MUST NOT commit the CLI package, archive, npm dependency, or transient state.
- Harness governance, extension implementations, and extension briefings MUST be tracked and describe current behavior honestly.
- Raw setup, run, build, and validation commands MUST remain in root `justfile` recipe bodies; harness extensions MUST delegate to those recipes.
- `harness checks` MUST expose full validation through `just verify` and focused validation through `just verify-focused`.
- `harness boot` MUST start the short-lived application from a built known state through a root recipe, capture its result, compose full checks, and return an inspectable envelope.
- Automation MUST evaluate JSON envelope fields and exit codes rather than scrape human prose.
- Agent instructions MUST direct cold agents to harness instructions, boot, and checks while retaining RPIV stage-boundary `just` commands.

### Interfaces
- `harness instructions`, `harness help --json`, and per-verb briefings provide discovery.
- `harness doctor --json` reports CLI, repository convention, and extension readiness.
- `harness boot --json` reports application-start and composed full-check evidence.
- `harness checks --focused --json` and `harness checks --json` expose focused and full validation.
- `just verify-focused` and `just verify` remain direct RPIV validation interfaces.

### Expectations
- A clean checkout is operable after setup when the pinned ambient CLI and development tools are available.
- Successful envelopes identify delegated commands and bounded output; failures include a stable error, non-zero exit, and next action.
- `.harness/temp/` and runtime evidence remain ignored or transient unless intentionally tracked.

## Rationale

Harness extensions add structured discovery and evidence without moving command ownership away from the existing language-agnostic `justfile`. A thin tracked substrate is reproducible and discoverable, while an ambient CLI avoids coupling product dependencies to development orchestration.

## Usage Examples

```
harness instructions
harness doctor --json
harness boot --json
harness checks --focused --json
harness checks --json
just verify-focused
just verify
```

## Integration Guidelines

How should other parts of the system integrate with this component?

- Change raw operating behavior in the root `justfile` first, then update the delegating harness extension and briefing.
- Keep boot suitable for the current application shape; do not invent a persistent service for the short-lived CLI.
- Record host-flow injection points in harness governance and reinforce them in `AGENTS.md` and repository maps.
- Preserve transient harness paths through ignore rules and inspect `git status` after harness commands.

## Exceptions

Under what circumstances is it acceptable to deviate from this component's rules?

- A newer harness version requires a superseding ADR and coordinated governance and clean-checkout evidence updates.
- Machine-level attribution or telemetry warnings may leave doctor globally degraded only when every repository-owned layer is healthy and the warning plus remediation is retained in evidence.

## Enforcement

How is compliance with this component verified?

- [x] Automated checks
- [x] Code review checklist
- [x] Test coverage requirements

## Related ADRs

- [ADR-260811-engineering-harness-surface](../ADR/ADR-260811-engineering-harness-surface.md)
- [ADR-260810-typescript-node-cli](../ADR/ADR-260810-typescript-node-cli.md)
