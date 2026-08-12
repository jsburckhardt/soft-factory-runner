# Action Plan: Phase 3: Recover safely and run distinct issues concurrently

## Feature
- **ID:** 5
- **Research Brief:** `project/work-items/5-phase-3-recover-safely-and-run-distinct-issues-concurrently/research/00-research.md`

## ADRs Created
- `project/architecture/ADR/ADR-260811-prototype-three-recovery-concurrency.md` — accepts the versioned recovery, exact process identity, command outcome, bounded stop, slot admission, evidence retention, merged-head, and guarded cleanup choices for Prototype 3.

## Core-Components Created
- `project/architecture/core-components/CORE-COMPONENT-260811-run-reconciliation-control.md` — shared snapshot/event replay, observation, process matching, recovery/control, and log-retention contract.
- `project/architecture/core-components/CORE-COMPONENT-260811-concurrent-run-admission.md` — shared explicit-issue concurrency configuration, atomic slot lease, and resource-isolation contract.
- `project/architecture/core-components/CORE-COMPONENT-260811-owned-resource-cleanup.md` — shared cleanup authorization, merged-source-head proof, refusal, progress, and evidence-retention contract.

## Acceptance Criteria
- **AC-1:** Reconciliation compares persisted state with locks, filesystem, Git, tmux, processes, result artifacts, remote state, and GitHub.
- **AC-2:** Restart reconciliation preserves a matching active RPIV process rather than launching a duplicate.
- **AC-3:** Resume, stop, clean, list, status, attach, and logs expose deterministic outcomes.
- **AC-4:** Distinct active issues receive distinct locks, branches, worktrees, tmux windows, and run records.
- **AC-5:** Configured concurrency limits are enforced without introducing automatic issue selection.
- **AC-6:** After the expected pull request is merged, Runner verifies the merged head against the recorded issue branch and commit before automatically removing the clean owned worktree and releasing its issue lock.
- **AC-7:** Stop requests graceful termination before bounded escalation and preserves worktree and terminal evidence.
- **AC-8:** Cleanup refuses active, dirty, unknown, mismatched, or ambiguously owned resources.
- **AC-9:** A closed-unmerged pull request or ambiguous merge or ownership evidence preserves the worktree and returns an actionable blocked result.
- **AC-10:** Repeatable interruption and concurrency fixtures reach deterministic outcomes with no duplicate owner or resource collision.

## Acceptance Coverage

| AC ID | Implementation tasks | Tests or validation | Expected evidence |
|---|---|---|---|
| AC-1 | T-1, T-2, T-3, T-9 | V-1, V-2, V-12 | A versioned snapshot/event replay trace and a structured report containing separate lock, filesystem, Git, tmux, process, result, remote, and GitHub observations; focused/full gate output. |
| AC-2 | T-2, T-3, T-5, T-9 | V-2, V-3, V-12 | Fixture report `active_preserved`, unchanged attempt and process identity, and process launch count zero on repeated reconcile/resume. |
| AC-3 | T-1, T-3, T-5, T-6, T-7, T-8, T-9 | V-1, V-4, V-7, V-8, V-11, V-12 | Parser and CLI matrices for every named command with stable state/code/exit status and equivalent human/JSON facts, plus documentation smoke output. |
| AC-4 | T-4, T-9 | V-5, V-12 | Barrier fixture showing two active issue numbers with disjoint lock, branch, worktree, tmux window/pane, run, event, and log identities. |
| AC-5 | T-4, T-8, T-9 | V-6, V-11, V-12 | Configuration tests and a limit-two race with exactly two admitted explicit issues, one `CONCURRENCY_LIMIT_REACHED`, no third downstream resource, and no issue-selection path. |
| AC-6 | T-2, T-7, T-8, T-9 | V-9, V-11, V-12 | Merged-PR source-head comparison facts; clean owned worktree registration/path and issue lock absent afterward; branch, tmux, snapshot, events, and logs retained. |
| AC-7 | T-2, T-6, T-8, T-9 | V-7, V-11, V-12 | Ordered signal/wait transcript proving `SIGTERM` before optional `SIGKILL`, 10-second and 5-second bounds, cancelled facts, worktree presence, pane evidence, and retained log. |
| AC-8 | T-2, T-7, T-8, T-9 | V-8, V-10, V-11, V-12 | Table-driven refusal evidence for active, staged, unstaged, untracked, unknown, mismatched, and ambiguous cases with zero destructive calls and preserved bytes. |
| AC-9 | T-2, T-3, T-7, T-8, T-9 | V-10, V-11, V-12 | Closed-unmerged, incomplete merge, and ownership ambiguity outputs with stable blocked codes/remediation, completed run state preserved where applicable, and worktree unchanged. |
| AC-10 | T-1, T-2, T-3, T-4, T-5, T-6, T-7, T-9 | V-1 through V-10, V-12 | Fixed repeated fault/barrier runs with identical normalized outcomes, one owner per issue, no duplicate launch, no slot over-admission, no path/window collision, and passing project gates. |

Coverage proof: all ten acceptance IDs have at least one dependency-ordered implementation task, one deterministic test or validation entry, and one concrete expected evidence statement. No acceptance criterion depends on live credentials or destructive ambient resources.

## Implementation Tasks

1. **T-1 — Add revisioned recovery persistence and domain contracts** (`AC-1`, `AC-3`, `AC-10`): introduce v3 snapshots, replayable v2 events, strict legacy handling, enumeration, compare-and-delete, and retained-log storage while preserving event-before-snapshot ordering.
2. **T-2 — Expand typed observation and control adapters** (`AC-1`, `AC-2`, `AC-6`, `AC-7`, `AC-8`, `AC-9`, `AC-10`): add bounded lock/filesystem/Git/tmux/process/result/remote/GitHub facts, compound process identity, signaling, pane capture, merge facts, dirtiness, removal, and exact deletion boundaries.
3. **T-3 — Implement the shared reconciliation engine and run inventory** (`AC-1`, `AC-2`, `AC-3`, `AC-9`, `AC-10`): normalize persisted/observed facts, replay eligible history, classify activity and safe actions, enumerate issue records, and expose one deterministic report to every control command.
4. **T-4 — Enforce atomic explicit-issue concurrency admission** (`AC-4`, `AC-5`, `AC-10`): parse the limit, claim/release exact slot leases, roll back only a just-created issue lock on capacity failure, and preserve distinct issue resource identities.
5. **T-5 — Integrate no-duplicate launch and deterministic resume** (`AC-2`, `AC-3`, `AC-10`): persist launch intent/identity, adopt one matching interrupted launch, preserve active processes, and implement the architecture resume decision table.
6. **T-6 — Implement bounded stop and retained terminal evidence** (`AC-3`, `AC-7`, `AC-10`): perform exact process-group graceful/escalated stop, persist cancellation facts, and preserve pane/worktree/log evidence.
7. **T-7 — Implement guarded explicit and merged-PR cleanup** (`AC-3`, `AC-6`, `AC-8`, `AC-9`, `AC-10`): authorize cleanup from the shared report, compare immutable PR source head, persist step progress, perform non-forced removals, and refuse unsafe cases.
8. **T-8 — Complete CLI, rendering, and operator documentation** (`AC-3`, `AC-5`, `AC-6`, `AC-7`, `AC-8`, `AC-9`): wire public command grammar and stable exits, common human/JSON output, configuration/reference updates, recovery and operations runbook, migration notes, and Prototype 3 limitations.
9. **T-9 — Consolidate deterministic fixtures and stage validation** (`AC-1` through `AC-10`): add repeated interruption/concurrency compositions, documentation smoke checks, coverage assertions, direct root-recipe validation, and delegating harness evidence.
