# Documentation

Soft Factory Runner is a local, short-lived TypeScript CLI for explicit, isolated, recoverable RPIV issue delivery.

Current local package release: **0.2.1-beta.3**, a backward-compatible prerelease PATCH correction for checkpoint-gated cleanup retry after exact tmux target removal. Explicit cleanup still refuses a live match and pre-checkpoint absence; only one exact pane/window/session missing-target category with unchanged socket authority and same-owner/run removal progress permits remaining lease/lock release. Prerelease history remains truthful: 0.2.1-beta.0 addresses missing unrelated servers, 0.2.1-beta.1 unchanged stale sockets, 0.2.1-beta.2 guarded dead-pane cleanup, and 0.2.1-beta.3 interrupted post-removal retry. Explicit cleanup refuses a live match. The expanded exact-target lifecycle record remains invariant across controlled UTF-8 and non-UTF8 tmux client states and keeps socket/session/window/pane selectors, `pane_dead`, and cwd internal. The recovery guide documents transcript retention, exact started checkpoints, idempotent retries, categorical confidential output, isolated proof, and the deferred non-gating Sparkta operator handoff. Local package evidence uses no registry publication.

## Guides

- [RPIV integration, progress, and completion handoff](rpiv-integration-contract.md) — deterministic instructions, `rpiv.final_validation`, RunSnapshotV5 compatibility, progress/result schemas, atomic publication, coordinator gate, status/list, redaction, migration, API applicability, and local deployment.

- [Phase 5 official delivery-agent installation and migration](phase-5-official-assets.md) — one-agent commands and Copilot destination, strict manifest v1, closed legacy migration, sibling preservation, cross-root rollback, Runner/Doctor authority, exact npm packaging, and local deployment.

- [Phase 4 repository Doctor](phase-4-repository-doctor.md) — all 24 blocking repository-readiness checks, DoctorResultV2 human/JSON semantics, private functional tmux proof, value-free evidence, configuration and metadata, safe probes, deterministic fixtures, timing, schema migration, and troubleshooting.
- [Issue run and completion proof](phase-1-issue-run.md) — readiness, configuration, fetched-base proof, ownership, visible RPIV launch, `AgentResultV1`, authoritative remote proof, and terminal-state semantics.
- [Phase 3 recovery and concurrency operations](phase-3-recovery-operations.md) — complete CLI reference, JSON/exit behavior, concurrency configuration, reconciliation, resume, bounded stop, retained logs, guarded cleanup, RunSnapshotV5 migration, bounded tmux identity diagnostics, zero-candidate preparation retry, troubleshooting, and local deployment limitations.

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

Runner exposes no network API, service endpoint, daemon, or container deployment. API reference documentation is therefore not applicable. The tmux identity recovery change adds no configuration option or default and requires no configuration migration; it adds no API specification, network behavior, database/data migration, container, deployment, or runtime-service procedure. The Doctor functional tmux probe likewise changes no configuration, run snapshot, issue-run tmux behavior, API, database, service, container, or deployment procedure; only schema-v1 Doctor automation consumers migrate to strict `DoctorResultV2`. Automatic merged cleanup occurs only on a later reconciliation-capable CLI invocation.

For architecture and work-item evidence, see [`project/`](../project/).

Exact tmux ownership is documented in the Phase 1, Phase 3, and Phase 4 guides. Release 0.2.0 selects a valid invoking custom socket/current session or a deterministic owned standalone fallback, persists complete v6 identity, routes all lifecycle operations by explicit selectors, and refuses malformed, stale, ambiguous, nested, mismatched, or same-name resources without adoption. Legacy v1-v5 state remains readable but non-authorizing when selectors are incomplete. No network API, configuration default, database, service, container, or deployment procedure changes.
