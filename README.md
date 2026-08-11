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

Phase 2 can run one explicit ready issue in an exclusively owned visible environment and prove its completion through reconciled evidence. From a repository checkout, use the root recipe; `just setup`/`just build` do not globally install or link `soft-factory`:

```text
just build
just run --help
just run run --issue 3
just run status 3 --json
just run attach 3
```

The run fetches and proves the configured remote default HEAD before creating `feat/3-...` and `.trees/3`. Unknown resources are preserved and every Copilot launch is issue-named and telemetry-scoped. After a zero exit, Runner reads `<owned-worktree>/.soft-factory/agent-result.json`, observes local `HEAD`, and obtains authoritative remote proof with one post-exit, 15-second `git ls-remote --refs <selected-remote> refs/heads/<issue-branch>` query from the repository root. Completion never reads a local `refs/remotes/...` cache. It reports `completed` only when issue, branch, authoritative SHA, PR, acceptance, and required root-validation proof all match. A missing record, query failure, timeout, malformed/truncated/duplicate record, or wrong ref becomes `interrupted` with `COMPLETION_PROOF_INCOMPLETE`; a valid divergent remote SHA becomes `failed` with `RESULT_REMOTE_SHA_MISMATCH`. See [`docs/phase-1-issue-run.md`](docs/phase-1-issue-run.md) for the `AgentResultV1` schema, five terminal states, snapshot compatibility, troubleshooting, deterministic fixture matrix, and remaining Prototype 3 deferrals.

Feature behavior is defined in [`PRD.md`](PRD.md) and delivered through GitHub issues and the RPIV pipeline.

## Documentation

- [`PRD.md`](PRD.md) — product requirements, scope, requirements, and staged MVP evolution
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — pipeline workflow, how to contribute via GitHub Issues, and where artifacts belong
- [`AGENTS.md`](AGENTS.md) — agent definitions, guardrails, and pipeline specification
- [`docs/`](docs/) — application documentation, including the [issue-run and Phase 2 completion guide](docs/phase-1-issue-run.md)
- [`project/`](project/) — architecture decisions, core-components, and human-readable work-item artifacts
