# CORE-COMPONENT-260811-concurrent-run-admission: Concurrent Run Admission

## Status

Adopted

## Purpose

Enforce a repository-wide active-run limit atomically while preserving explicit issue selection, per-issue exclusivity, and distinct resources for simultaneous issues.

## Scope

This component applies to configuration, issue-lock acquisition rollback, concurrency slot leases, active classification, admission and release, resource naming, run listing, and same-issue or distinct-issue race fixtures. It does not schedule or select issues.

## Definition

### Rules
- Parse `execution.max_concurrent_runs` as a strict positive safe integer and default it to 1. Reject invalid configuration before ownership or resource creation.
- Require every active run to own one atomic slot lease at `.soft-factory/concurrency/slots/<slot>.lock`. Lease records contain schema version, slot, issue, repository, owner, run, acquisition time, and configured limit.
- After read-only readiness, atomically acquire the issue lock, then claim the lowest available configured slot by exclusive creation before creating a snapshot, branch, worktree, tmux window, or process. If capacity is unavailable, compare-and-delete only the just-created exact issue lock.
- Treat an occupied, malformed, unknown, stale, or unobservable lease as consuming capacity. Release it only after a non-active outcome is durably persisted and lease, lock, snapshot, owner, run, and process observations agree.
- Block all new admission after a configured limit reduction while any occupied slot number exceeds the new limit. Once no above-limit lease remains, exclusive creation among slots 1 through the limit is the atomic admission boundary.
- Keep same-issue exclusivity independent of capacity. A same-issue race has one issue-lock winner; a distinct-issue race has no more winners than slots.
- Derive branch, worktree, tmux window, run record, event record, log directory, and issue lock from the explicit issue identity and verify that distinct active issues share none of those resources. Sharing the repository tmux session is permitted; issue windows and panes remain distinct.
- Never infer, queue, rank, or select an issue. Capacity failure returns a stable actionable `CONCURRENCY_LIMIT_REACHED` outcome for the explicitly requested issue.
- Include lease observations in reconciliation, status, and numerically sorted list output without treating a lease alone as proof of a healthy active process.

### Interfaces
- Configuration exposes `execution.max_concurrent_runs` as `maxConcurrentRuns`.
- `ConcurrencyLeaseV1` identifies one slot, issue, repository, owner, run, configured limit, and acquisition time.
- Admission storage exposes exclusive create, strict lease enumeration, read, and compare-and-delete operations.
- Reconciliation exposes lease state separately from process activity and terminal run state.

### Expectations
- Concurrent starts cannot create more active resource sets than the configured limit.
- Two configured slots permit two explicitly requested distinct issues with separate resources.
- A third explicit start at a limit of two creates no branch, worktree, tmux window, run snapshot, or process and does not leave its newly acquired issue lock.
- Unknown leases reduce availability rather than permitting over-admission.
- Releasing one exact inactive lease makes one slot available without changing any other issue.

## Rationale

Counting snapshots is racy across separate CLI processes. Fixed lease files use the filesystem exclusive-create primitive already required for issue ownership, making admission deterministic without introducing a scheduler or global stale mutex.

## Usage Examples

```
max_concurrent_runs: 2
issue 123 -> slot 1, lock 123, branch 123, worktree 123, window 123
issue 124 -> slot 2, lock 124, branch 124, worktree 124, window 124
issue 130 -> CONCURRENCY_LIMIT_REACHED, no downstream resources
```

## Integration Guidelines

How should other parts of the system integrate with this component?

- Resolve and validate configuration before issue lock or slot operations.
- Use the same owner and run IDs in issue lock, lease, snapshot, and events.
- Persist terminal or interrupted classification before exact lease release.
- Exercise admission races with real exclusive filesystem creation and deterministic barriers.
- Keep output explicit about requested issue, configured limit, occupied slots, and remediation.

## Exceptions

Under what circumstances is it acceptable to deviate from this component rules?

- None. Capacity never authorizes automatic issue selection or weakened ownership checks.

## Enforcement

How is compliance with this component verified?

- [x] Automated checks
- [x] Code review checklist
- [x] Test coverage requirements

## Related ADRs

- [ADR-260811-prototype-three-recovery-concurrency](../ADR/ADR-260811-prototype-three-recovery-concurrency.md)
- [ADR-260811-prototype-one-run-orchestration](../ADR/ADR-260811-prototype-one-run-orchestration.md)
