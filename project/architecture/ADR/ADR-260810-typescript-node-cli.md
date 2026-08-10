# ADR-260810-typescript-node-cli: TypeScript and Node.js CLI

## Status

Accepted

## Context

Soft Factory Runner is a deterministic local CLI that coordinates Git, GitHub, tmux, Copilot, filesystem state, and distributed agent assets. Its state and result contracts are structured data, and its external integrations need strongly typed, testable boundaries.

## Decision

Implement Runner as a strict TypeScript application on the active Node.js LTS runtime. Distribute it as the npm package `soft-factory-runner` with the `soft-factory` executable. Use no application framework at bootstrap; introduce dependencies only through later RPIV decisions when product requirements justify them.

Use npm for package management, Jest for tests, ESLint for static analysis, Prettier for formatting checks, and the TypeScript compiler for builds and type checks.

## Alternatives

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| JavaScript on Node.js | Minimal compilation | Weaker contracts across state and adapter boundaries | Runner's reconciliation model benefits from compile-time types |
| Go | Single binaries and strong concurrency | Different distribution path from the PRD's npm installation experience | Conflicts with the selected product distribution model |
| TypeScript CLI framework | Faster command scaffolding | Premature framework constraints and dependency choice | Command design belongs to feature-level RPIV work |

## Consequences

### Positive
- State, configuration, adapter, and result contracts can be strongly typed.
- npm provides the installation flow specified by the PRD.
- Core logic can be tested independently of external commands.

### Negative
- Distribution requires compilation.
- Node.js must be available in development and target environments.

### Neutral
- CLI parsing and adapter libraries remain undecided until feature work requires them.

## Related Issues

- None; this is the foundational bootstrap decision.

## References

- [Soft Factory Runner PRD](../../../PRD.md)
- [Node.js documentation](https://nodejs.org/docs/latest/api/)
- [TypeScript documentation](https://www.typescriptlang.org/docs/)

