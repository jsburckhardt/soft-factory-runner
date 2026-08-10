# CORE-COMPONENT-260810-development-standards: Development Standards

## Status

Adopted

## Purpose

Establish consistent TypeScript coding, commit, and testing practices for maintainable deterministic Runner behavior.

## Scope

Application source, tests, configuration, commits, and validation performed by humans and agents.

## Definition

### Rules
- TypeScript strict mode MUST remain enabled.
- Code MUST satisfy the project ESLint and Prettier configurations.
- Modules SHOULD prefer named exports.
- Asynchronous code SHOULD use async/await and explicit error propagation.
- Commits MUST follow `CORE-COMPONENT-260505-commit-standards`.
- Exported behavior MUST have unit coverage, with external systems isolated behind testable adapters.
- Global statement, branch, function, and line coverage MUST remain at or above 80%.

### Interfaces
- The root `justfile` exposes setup, operation, focused validation, and full validation.
- Jest organizes tests with `describe` and `it`; tests may be co-located or placed in `__tests__`.

### Expectations
- `just verify-focused` supports implementation feedback.
- `just verify` runs the complete configured quality gate.

## Rationale

Strict types and repeatable validation reduce ambiguity in state-machine, persistence, and adapter code while keeping standards executable by RPIV.

## Usage Examples

```text
just verify-focused src/state/run-state.test.ts
just verify
```

## Integration Guidelines

- Add validation only through root `justfile` recipes and supporting project configuration.
- Keep tests deterministic and independent of live GitHub, tmux, or Copilot services unless explicitly integration-scoped.
- Preserve the existing commit standards contract rather than duplicating it.

## Exceptions

- Generated files may be excluded from lint, formatting, and coverage when their generator is the verified source of truth.

## Enforcement

- [x] Automated checks
- [x] Code review checklist
- [x] Test coverage requirements

## Related ADRs

- [ADR-260810-typescript-node-cli](../ADR/ADR-260810-typescript-node-cli.md)

