# Documentation

Soft Factory Runner is a local, short-lived TypeScript CLI for explicit, isolated, recoverable RPIV issue delivery.

## Guides

- [Issue run and completion proof](phase-1-issue-run.md) — readiness, configuration, fetched-base proof, ownership, visible RPIV launch, `AgentResultV1`, authoritative remote proof, and terminal-state semantics.
- [Phase 3 recovery and concurrency operations](phase-3-recovery-operations.md) — complete CLI reference, JSON/exit behavior, concurrency configuration, reconciliation, resume, bounded stop, retained logs, guarded cleanup, schema migration, troubleshooting, and local deployment limitations.

Use only root `justfile` recipes for local operation and project validation:

```text
just --list
just run --help
just verify-focused
just verify
```

Autonomous development begins with `harness instructions` and [`.harness/engineering-harness.md`](../.harness/engineering-harness.md). The ambient harness v0.13.0 delegates to root recipes and is not a product dependency.

Runner exposes no network API, service endpoint, daemon, or container deployment. API reference documentation is therefore not applicable. Automatic merged cleanup occurs only on a later reconciliation-capable CLI invocation.

For architecture and work-item evidence, see [`project/`](../project/).
