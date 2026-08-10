# CORE-COMPONENT-260810-issue-worktree-locking: Issue and Worktree Locking

## Status

Adopted

## Purpose

Guarantee exclusive local ownership of each active issue and isolate concurrent issue delivery resources.

## Scope

Issue locks, branches, Git worktrees, tmux windows, run records, concurrency checks, reuse, and cleanup.

## Definition

### Rules
- Lock acquisition MUST be atomic, and one issue MUST have at most one active local owner.
- Each active issue owns exactly one run record, lock, branch, worktree, and tmux execution window.
- Distinct issues MUST NOT share owned resources.
- Existing resources MUST be reused only after recorded and observed ownership agree.
- Unknown directories, worktrees, tmux resources, or locks MUST NOT be modified or removed automatically.
- Cleanup MUST refuse active, dirty, mismatched, or ambiguously owned worktrees.

### Interfaces
- `.soft-factory/locks/<issue>.lock` represents local issue ownership.
- The run snapshot records the expected branch, worktree, tmux window, and ownership identity.

### Expectations
- Simultaneous starts for one issue produce exactly one owner.
- Concurrency limits do not weaken per-issue exclusivity.

## Rationale

Atomic ownership and strict resource matching prevent duplicate agents, branch collisions, and destructive cleanup.

## Usage Examples

```text
issue 123 -> issue/123 -> .trees/123 -> tmux window 123 -> one run record
```

## Integration Guidelines

- Acquire ownership before creating downstream resources.
- Release locks only through state-aware finalization or cleanup.
- Reconcile every existing resource before reuse.

## Exceptions

- None.

## Enforcement

- [x] Automated checks
- [x] Code review checklist
- [x] Test coverage requirements

## Related ADRs

- [ADR-260810-typescript-node-cli](../ADR/ADR-260810-typescript-node-cli.md)

