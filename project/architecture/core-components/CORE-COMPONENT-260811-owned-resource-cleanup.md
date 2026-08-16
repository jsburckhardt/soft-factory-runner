# CORE-COMPONENT-260811-owned-resource-cleanup: Owned Resource Cleanup

## Status

Adopted

## Purpose

Provide one fail-safe contract for stopping or removing Runner-owned resources without discarding work, acting on ambiguous ownership, or confusing a merged pull-request source head with its merge commit.

## Scope

This component applies to automatic merged cleanup, explicit `clean`, cleanup progress, GitHub merge facts, Git worktree cleanliness and registration, tmux removal, concurrency and issue-lock release, retained evidence, and cleanup refusal output. Process signaling follows the run reconciliation and control component.

## Definition

### Rules
- Authorize cleanup only for a non-active terminal run after snapshot, event, issue lock, lease if present, process, tmux, Git branch, worktree registration, path, HEAD, cleanliness, result, remote, and GitHub ownership facts have a deterministic reconciled classification.
- Prohibit an unpersisted recovery-candidate result, terminal progress, a proved-absent tmux target, or malformed tmux evidence from authorizing cleanup. Candidate-driven finalization must first complete and persist the normal completion conjunction; cleanup still requires its own exact tmux and ownership proof.
- Refuse every destructive action when the run is active; the worktree is dirty; any required observation is unknown; or ownership, path, branch, commit, lock, lease, tmux, process, result, or pull-request facts are mismatched or ambiguous. Dirtiness includes staged, unstaged, and untracked files.
- Interpret a merged head as the immutable pull-request source head. Require the expected PR number, `MERGED` state, nonempty merge time, expected source branch, and source head SHA equal to the already verified run commit. Record merge-commit SHA only as informational and do not require a deleted remote issue branch.
- On the next reconciliation-capable command, automatically clean only when merged-head and ownership proof passes and the owned worktree is clean. Remove the worktree registration and directory without force, release an exact inactive slot if present, and compare-and-delete the exact issue lock last.
- Treat an open expected PR as pending with no cleanup. Treat a closed-unmerged PR, missing merge fact, unavailable GitHub fact, or ambiguous merge or ownership evidence as actionable blocked cleanup while preserving the worktree and the previously proved completed run state.
- Let explicit `clean` remove the exact terminal tmux window after transcript capture in addition to the guarded worktree, slot, and lock operations. Automatic merged cleanup retains tmux. Neither cleanup mode removes the local issue branch, snapshot, events, or retained transcripts.
- Persist cleanup intent and per-resource progress before and after every destructive step. On retry, accept an absent resource only when a prior successful step for the same owner and run records its removal; otherwise classify absence as unknown or mismatched and stop.
- Order explicit cleanup as final transcript capture, exact tmux-window removal, non-forced worktree removal, exact inactive lease release, and exact issue-lock release. Verify each completed operation before advancing.
- Return structured human and JSON cleanup facts with stable refusal code, expected and observed safe facts, completed steps, remaining resources, and remediation. Every refusal and partial cleanup is nonzero.

### Interfaces
- `MergedPullRequestFactsV1` contains PR number, state, merged time, source branch, source head SHA, optional merge-commit SHA, issue linkage, and completeness.
- `CleanupFactsV1` contains mode, owner and run identity, intent, ordered step states, worktree dirtiness, merge comparisons, blockage, and update time.
- Git adapters expose exact worktree registration facts, branch and HEAD observation, porcelain dirtiness including untracked files, non-forced worktree removal, and post-removal verification.
- GitHub adapters expose immutable source-head and merge facts even when the remote source branch was deleted.
- Tmux, admission, and file adapters expose exact removal plus compare-and-delete behavior.

### Expectations
- No dirty, active, unknown, mismatched, or ambiguously owned worktree is removed.
- A merged PR with matching source branch and source head, clean exact worktree, and complete ownership proof removes the worktree and issue lock once.
- A squash or merge commit may differ from the recorded source head without blocking when the immutable source head matches.
- Closed-unmerged and incomplete merge observations leave every worktree byte intact and identify the missing or contradictory proof.
- Repeating cleanup after a recorded partial success resumes at the first unproved step without deleting an unrelated replacement resource.

## Rationale

Cleanup is destructive and must use stronger proof than path names or terminal state. Comparing the immutable PR source head preserves the verified issue commit across GitHub merge strategies, while stepwise progress and compare-and-delete operations make partial failures safely retryable.

## Usage Examples

```
MERGED + expected source branch/SHA + clean exact worktree -> remove worktree, release exact lock
CLOSED without merge -> CLEANUP_MERGE_NOT_PROVED, preserve worktree
terminal + untracked file -> CLEANUP_DIRTY_WORKTREE, preserve worktree
automatic merged cleanup -> retain tmux, branch, snapshot, events, and logs
```

## Integration Guidelines

How should other parts of the system integrate with this component?

- Build cleanup authorization from the shared reconciliation report rather than issuing ad hoc observations.
- Persist comparison facts and progress before reporting any resource as removed.
- Keep automatic and explicit cleanup modes distinct in domain types and output.
- Use temporary repositories and fake GitHub/tmux/process adapters to prove every refusal and partial-step retry.
- Document merge-head meaning, non-forced removal, evidence retention, blocked remediation, and operational triggers.

## Exceptions

Under what circumstances is it acceptable to deviate from this component rules?

- None. Prototype 3 provides no force-clean or evidence-purge bypass.

## Enforcement

How is compliance with this component verified?

- [x] Automated checks
- [x] Code review checklist
- [x] Test coverage requirements

## Related ADRs

- [ADR-260811-prototype-three-recovery-concurrency](../ADR/ADR-260811-prototype-three-recovery-concurrency.md)
- [ADR-260811-prototype-two-completion-proof](../ADR/ADR-260811-prototype-two-completion-proof.md)
