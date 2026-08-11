# ADR-260811-engineering-harness-surface: Engineering Harness Development Surface

## Status

Accepted

## Context

Soft Factory Runner centralizes project operations and RPIV validation in the root `justfile`, but it has no deterministic engineering-harness front door. A cold agent cannot discover repository-specific boot, harness governance, or harness-mediated focused and full checks. The locally available `@ai-substrate/engineering-harness` v0.13.0 provides structured command envelopes and repository-local extensions without requiring a product framework.

## Decision

Adopt `@ai-substrate/engineering-harness` v0.13.0 as an ambient, version-pinned development tool and as the deterministic agent-facing product-development surface. Do not add the harness CLI or the local investigation archive to the project npm dependencies.

Commit the generated and populated `.harness/` repository substrate, including canonical governance, versioned extensions, and agent briefings. Use harness extensions as the documented wrapper allowed by `CORE-COMPONENT-260806-project-command-interface`. Keep all raw project operating commands in the root `justfile`, keep `just verify-focused` and `just verify` as the RPIV entry points, and have harness boot and checks delegate to those recipes rather than duplicate their commands.

## Alternatives

What other options were considered? Why were they rejected?

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Keep the root `justfile` as the only agent surface | No new tool prerequisite | No structured boot, governance, injection map, or extension discovery | Does not satisfy the harness adoption outcome |
| Add the harness as a project npm dependency | npm provides local version resolution | Vendors an ambient engineering tool into the product dependency graph | Conflicts with upstream adoption guidance and the issue prerequisite |
| Duplicate npm commands inside harness extensions | Fewer indirect calls | Creates two command sources that can drift | Violates the adopted project command interface |

## Consequences

What becomes easier or harder as a result of this decision?

### Positive
- Cold agents get one self-describing front door for boot, checks, and governance.
- Harness output provides machine-readable status, errors, next actions, and evidence.
- The root `justfile` remains the single source of raw project commands.

### Negative
- Developers and agents must provide the pinned ambient harness CLI before using the repository.
- Tracked `.harness/` configuration must be maintained as harness and project commands evolve.

### Neutral
- The bootstrapped application remains a short-lived Node.js CLI without a service health endpoint.

## Related Issues

- [#2](https://github.com/jsburckhardt/soft-factory-runner/issues/2)

## References

- [TypeScript and Node.js CLI](ADR-260810-typescript-node-cli.md)
- [Project Command Interface](../core-components/CORE-COMPONENT-260806-project-command-interface.md)
- [Engineering harness repository](https://github.com/AI-Substrate/harness-engineering)
