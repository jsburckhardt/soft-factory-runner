# Documentation

Soft Factory Runner is a local, short-lived TypeScript CLI for explicit, isolated, recoverable RPIV issue delivery.

## Guides

- [RPIV integration, progress, and completion handoff](rpiv-integration-contract.md) — deterministic instructions, `rpiv.final_validation`, RunSnapshotV4 compatibility, progress/result schemas, atomic publication, coordinator gate, status/list, redaction, migration, API applicability, and local deployment.

- [Phase 5 official delivery-agent installation and migration](phase-5-official-assets.md) — one-agent commands and Copilot destination, strict manifest v1, closed legacy migration, sibling preservation, cross-root rollback, Runner/Doctor authority, exact npm packaging, and local deployment.

- [Phase 4 repository Doctor](phase-4-repository-doctor.md) — all 24 blocking repository-readiness checks, schema-v1 human/JSON semantics, configuration and metadata, safe probes, deterministic fixtures, timing, and troubleshooting.
- [Issue run and completion proof](phase-1-issue-run.md) — readiness, configuration, fetched-base proof, ownership, visible RPIV launch, `AgentResultV1`, authoritative remote proof, and terminal-state semantics.
- [Phase 3 recovery and concurrency operations](phase-3-recovery-operations.md) — complete CLI reference, JSON/exit behavior, concurrency configuration, reconciliation, resume, bounded stop, retained logs, guarded cleanup, schema migration, troubleshooting, and local deployment limitations.

## Copilot child configuration

The issue-run, recovery, and Doctor guides share one `copilot.environment` contract: strict string values and environment-name grammar, explicit empty strings, literal shell-free transport, inherited/configured/Runner-owned precedence, Copilot-only scope, fresh per-launch reads, value-free failures, and non-persistence. The mapping is additive and requires no data, API, persisted-schema, or deployment migration when absent.

Use only root `justfile` recipes for local operation and project validation:

```text
just --list
just run --help
just run install agent soft-factory
just run install --recommended
just run doctor [--json]
just run instructions [--json]
just verify-focused
just verify
```

Autonomous development begins with `harness instructions` and [`.harness/engineering-harness.md`](../.harness/engineering-harness.md). The ambient harness v0.13.0 delegates to root recipes and is not a product dependency.

Runner exposes no network API, service endpoint, daemon, or container deployment. API reference documentation is therefore not applicable. Automatic merged cleanup occurs only on a later reconciliation-capable CLI invocation.

For architecture and work-item evidence, see [`project/`](../project/).
