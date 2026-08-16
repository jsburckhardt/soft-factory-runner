# Action Plan: Integrate PR #33 with Post-Wait Safety and Release 0.1.3

## Feature
- **ID:** 5
- **Research Brief:** `project/work-items/5-phase-3-recover-safely-and-run-distinct-issues-concurrently/research/00-research.md`

## ADRs Created
- No new ADR. Merge PR #33 changes into `ADR-260811-prototype-three-recovery-concurrency` without renaming it or changing its 2026-08-11 creation date. Preserve the current post-wait reload decisions and add strict candidate-recovery behavior.

## Core-Components Created
- No new core-component. Merge PR #33 rules into `CORE-COMPONENT-260811-run-reconciliation-control`, `CORE-COMPONENT-260811-completion-evidence-reconciliation`, and `CORE-COMPONENT-260811-owned-resource-cleanup` without renaming them or changing their 2026-08-11 creation dates.
- Update `project/architecture/ADR/DECISION-LOG.md`: retain records 163-167 exactly and renumber the four PR #33 records to 168-171, retaining their 2026-08-15 dates.

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
| AC-1 | T-15, T-16, T-17 | V-19, V-20, V-21, V-24 | Combined reports and call counters cover every persisted and observed boundary once. |
| AC-2 | T-16, T-17 | V-19, V-20, V-21, V-24 | Active and post-wait fixtures show one launch; candidate resume shows zero new launches and no attempt increment. |
| AC-3 | T-16, T-17, T-18 | V-19, V-20, V-22, V-24 | Shared human/JSON outcomes and command regressions remain deterministic. |
| AC-4 | T-17 | V-22, V-24 | Distinct-issue barrier traces show disjoint locks, branches, worktrees, windows, and records. |
| AC-5 | T-17 | V-22, V-24 | Capacity race admits only configured explicit issues and selects none automatically. |
| AC-6 | T-16, T-17 | V-21, V-22, V-24 | Cleanup occurs only after persisted completion and exact merged source-head and ownership proof. |
| AC-7 | T-17 | V-22, V-24 | Signal trace proves SIGTERM, bounded wait, conditional SIGKILL, and retained evidence. |
| AC-8 | T-16, T-17 | V-19, V-21, V-22, V-24 | Candidate, malformed tmux, active, dirty, unknown, and mismatched rows perform zero destructive calls. |
| AC-9 | T-16, T-17 | V-19, V-21, V-22, V-24 | Closed-unmerged and ambiguous rows preserve resources and return actionable blockage. |
| AC-10 | T-15, T-16, T-17, T-19 | V-19 through V-24 | Repeated combined fixtures, merge proof, and full gate show no duplicate owner, launch, or collision. |

Coverage proof: all ten criteria preserve issue order and exact GitHub text. Every AC maps to implementation, combined regression validation, and concrete evidence before these artifacts are written.

## Implementation Tasks
1. **T-15 — Create the state-preserving merge baseline** (`AC-1`, `AC-10`). Commit current research/Plan artifacts, fetch and verify `origin/main` at `61ac7dd`, then integrate it with `git merge --no-ff origin/main`; never rebase, reset away history, force-push, or alter PR #35 commits.
2. **T-16 — Resolve the five conflicts and preserve both contracts** (`AC-1`, `AC-2`, `AC-3`, `AC-6`, `AC-8`, `AC-9`, `AC-10`). Resolve only `docs/README.md`, `DECISION-LOG.md`, both conflicting core-components, and `src/documentation.test.ts`; retain post-wait reload/refusal/idempotence and candidate classification/resume/cleanup non-authorization.
3. **T-17 — Add combined recovery and historical regressions** (`AC-1` through `AC-10`). Exercise candidate recovery beside post-wait current-state handling, revision races, command controls, cleanup, stop, and concurrency.
4. **T-18 — Synchronize release, docs, package, and tarball state** (`AC-3`, `AC-8`, `AC-9`). Classify the integration as PATCH `0.1.3`; update only authoritative Runner version surfaces and current guidance, preserve dependencies, and remove any stale repository or pack-workspace `0.1.2` tarball.
5. **T-19 — Run authoritative validation and prepare Implement handoff** (`AC-1` through `AC-10`). Run focused checks while iterating, root `just verify` as final authority, package dry-run and temporary pack/install proof, diff/history checks, and record exact commits/evidence without claiming stale PR #33 counts.
