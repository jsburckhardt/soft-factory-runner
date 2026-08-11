# Architecture

This directory contains all architectural documentation for the project.

## Structure

| Directory | Purpose |
|-----------|---------|
| `ADR/` | ADR template, active ADRs, and the decision log (`DECISION-LOG.md`). |
| `core-components/` | Core-component template and active core-component definitions |

## Key Concepts

### ADRs (Architecture Decision Records)
ADRs capture significant architectural decisions. They are **global** — not scoped to any single issue. Every ADR must be recorded in `ADR/DECISION-LOG.md`.

### Core-Components
Core-components define reusable, cross-cutting behavioral contracts. They are **global** and shared across all issues. Every core-component must be recorded in `ADR/DECISION-LOG.md`.

### Templates
Templates are read-only references — copy and rename them, don't edit them directly:
- `ADR/ADR-260101-template.md` — copy within `ADR/` and name the artifact `ADR-yymmdd-short-slug.md`
- `core-components/CORE-COMPONENT-260101-template.md` — copy within `core-components/` and name the artifact `CORE-COMPONENT-yymmdd-short-slug.md`

Use the UTC creation date for `yymmdd`. The full date-and-slug basename is the artifact ID, and the date remains unchanged after later edits.

## Adopted Development Surface

[`ADR-260811-engineering-harness-surface`](ADR/ADR-260811-engineering-harness-surface.md) adopts the ambient harness, and [`CORE-COMPONENT-260811-engineering-harness-interface`](core-components/CORE-COMPONENT-260811-engineering-harness-interface.md) defines its tracked governance, boot, checks, and cold-agent contract.
