# Soft Factory Runner

[![APS version](https://img.shields.io/badge/APS-v1.2.2-blue?logo=github)](https://github.com/chris-buckley/agnostic-prompt-standard/releases/tag/v1.2.2)

Soft Factory Runner is a local-first command-line application that deterministically runs autonomous software-delivery workflows against explicit GitHub issues.

Its goal is to safely coordinate isolated, visible, and recoverable RPIV executions, then reconcile their Git and GitHub outcomes using observable evidence. Runner controls state, locks, worktrees, tmux processes, and recovery; RPIV owns software engineering decisions.

## Development

Install Node.js 22 or newer, `just`, and ambient `@ai-substrate/engineering-harness` v0.13.0, then run `just setup`. The harness is an external development prerequisite and is not a project dependency.

Autonomous agents use the tracked engineering harness as the deterministic product-development surface:

```text
harness instructions
harness doctor --json
harness boot --json
harness checks --focused --json
harness checks --json
```

The root `justfile` remains command authority for humans and RPIV boundaries. Discover recipes with `just --list`; direct `just verify-focused` and `just verify` remain required validation entry points. See [`.harness/engineering-harness.md`](.harness/engineering-harness.md) for governance and evidence contracts.

Phase 1 can run one explicit ready issue in an exclusively owned visible environment:

```text
just build
soft-factory run --issue 3
soft-factory status 3 --json
soft-factory attach 3
```

The run fetches and proves the configured remote default HEAD before creating `feat/3-...` and `.trees/3`. Unknown resources are preserved, every Copilot launch is issue-named and telemetry-scoped, and a zero Copilot exit remains `interrupted` until a later completion protocol exists. See [`docs/phase-1-issue-run.md`](docs/phase-1-issue-run.md) for configuration, ownership, state, telemetry, troubleshooting, fixture evidence, and deferrals.

Feature behavior is defined in [`PRD.md`](PRD.md) and delivered through GitHub issues and the RPIV pipeline.

## Documentation

- [`PRD.md`](PRD.md) — product requirements, scope, requirements, and staged MVP evolution
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — pipeline workflow, how to contribute via GitHub Issues, and where artifacts belong
- [`AGENTS.md`](AGENTS.md) — agent definitions, guardrails, and pipeline specification
- [`docs/`](docs/) — application documentation, including the [Phase 1 issue-run guide](docs/phase-1-issue-run.md)
- [`project/`](project/) — architecture decisions, core-components, and human-readable work-item artifacts
