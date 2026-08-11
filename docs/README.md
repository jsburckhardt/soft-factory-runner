# Documentation

Soft Factory Runner is a TypeScript and Node.js CLI for deterministic orchestration of visible, isolated, and recoverable RPIV issue delivery.

The product contract currently lives in [`PRD.md`](../PRD.md). Application documentation added during RPIV delivery belongs here, including:

- CLI usage and command references
- configuration and schema references
- architecture explanations
- recovery and operational runbooks
- installation, migration, and deployment guidance

Autonomous development starts with `harness instructions` and the canonical governance contract at [`.harness/engineering-harness.md`](../.harness/engineering-harness.md). Use `harness boot --json` before product work, focused/full `harness checks` while working, and direct root `justfile` validation at RPIV boundaries. The ambient harness v0.13.0 is an external prerequisite, not an npm dependency.

## Guides

- [Phase 1 issue run](phase-1-issue-run.md) — commands, configuration, fetched-base proof, ownership, state, visible tmux/RPIV, exact telemetry, status/attach, troubleshooting, deterministic fixture evidence, and later-phase deferrals

For architecture decisions, shared behavioral contracts, and work-item artifacts, see [`project/`](../project/).
