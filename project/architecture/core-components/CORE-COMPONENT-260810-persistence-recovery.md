# CORE-COMPONENT-260810-persistence-recovery: Persistence and Recovery

## Status

Adopted

## Purpose

Preserve enough durable state and history to classify or recover every run after process, shell, tmux, or machine interruption.

## Scope

Run snapshots, transition events, schema versions, reconciliation, resume behavior, and runtime state directories.

## Definition

### Rules
- Run snapshots MUST be versioned and written atomically.
- Transition events MUST be versioned and appended to JSONL history.
- Persisted state and observed runtime state MUST remain distinct inputs to reconciliation.
- Recovery handlers MUST be idempotent where practical.
- Reconciliation MUST preserve a matching active process rather than launch a duplicate.
- Unknown or contradictory state MUST produce a safe blocked or interrupted result.

### Interfaces
- `.soft-factory/runs/<issue>.json` stores the latest atomic snapshot.
- `.soft-factory/events/<issue>.jsonl` stores append-only transition history.
- Reconciliation adapters observe filesystem, Git, GitHub, tmux, processes, locks, and result artifacts.

### Expectations
- Interrupted runs reach deterministic outcomes.
- Partial snapshot writes never replace the last valid snapshot.

## Rationale

Durable facts and idempotent reconciliation are required to survive real-world interruption without duplicating work or claiming false success.

## Usage Examples

```text
persisted running_rpiv + matching live pane/process -> preserve and report active
persisted running_rpiv + no process + no result -> interrupted
```

## Integration Guidelines

- Write temporary snapshot content, synchronize as required, then atomically rename.
- Validate schema versions before using persisted data.
- Record every reconciliation-driven transition as an event.

## Exceptions

- None.

## Enforcement

- [x] Automated checks
- [x] Code review checklist
- [x] Test coverage requirements

## Related ADRs

- [ADR-260810-typescript-node-cli](../ADR/ADR-260810-typescript-node-cli.md)

