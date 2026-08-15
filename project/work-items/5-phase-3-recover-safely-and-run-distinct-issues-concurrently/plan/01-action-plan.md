# Action Plan: Phase 3 Interrupted Finalization Recovery Correction

## Feature
- **ID:** 5
- **Research Brief:** `project/work-items/5-phase-3-recover-safely-and-run-distinct-issues-concurrently/research/00-research.md`

## ADRs Created
- No new ADR. Updated `ADR-260811-prototype-three-recovery-concurrency` in place, preserving its 2026-08-11 creation date, to define strict result-candidate recovery.

## Core-Components Created
- No new core-component. Updated the existing global contracts `CORE-COMPONENT-260811-run-reconciliation-control`, `CORE-COMPONENT-260811-completion-evidence-reconciliation`, and `CORE-COMPONENT-260811-owned-resource-cleanup` in place, preserving their creation dates.

## Relevant Architecture
- `ADR-260811-prototype-three-recovery-concurrency`
- `ADR-260812-rpiv-integration-completion-contract`
- `ADR-260814-tmux-identity-failure-recovery`
- `CORE-COMPONENT-260810-persistence-recovery`
- `CORE-COMPONENT-260810-issue-worktree-locking`
- `CORE-COMPONENT-260811-run-reconciliation-control`
- `CORE-COMPONENT-260811-completion-evidence-reconciliation`
- `CORE-COMPONENT-260811-owned-resource-cleanup`
- `CORE-COMPONENT-260812-rpiv-integration-handoff`
- `CORE-COMPONENT-260814-tmux-identity-diagnostics`
- `CORE-COMPONENT-260815-package-semver-governance`

## Decisions
- Treat a strict successful result found during `running_rpiv` with absent worker and RPIV as an unaccepted recovery candidate.
- Use candidate head and PR number only to key one bounded worktree, fresh-remote, and GitHub observation.
- Preserve unknown-before-mismatch precedence; malformed tmux remains unknown and authorizes no mutation.
- Permit only explicit finalization recovery when all candidate proof matches and tmux is exact or proved absent.
- Keep terminal progress diagnostic-only and prohibit candidate, absent tmux, or malformed tmux evidence from cleanup authority.
- Record these commitments as decision-log records 163-166.

## SemVer Assignment
- **Change class:** backward-compatible defect correction.
- **Delivery version:** `0.1.2` from current `0.1.1` (PATCH).
- Synchronize all package, lock, official-asset, manifest/fixture, packed/installed metadata, and current documentation surfaces without dependency churn.

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
| AC-1 | T-10, T-11, T-14 | V-13, V-14, V-15, V-18 | Composite reports show every boundary, candidate-keyed remote/PR observations, one call per boundary, and full-gate output. |
| AC-2 | T-11, T-12, T-14 | V-14, V-17, V-18 | Exact-active regression has zero launch; candidate recovery also has zero launch and unchanged attempt. |
| AC-3 | T-10, T-11, T-12, T-13, T-14 | V-13 through V-18 | Stable human/JSON decisions and exits for candidate-ready, unknown, mismatch, resumed finalization, and unchanged controls. |
| AC-4 | T-14 | V-17, V-18 | Existing distinct-issue barrier fixture remains green with disjoint resources. |
| AC-5 | T-14 | V-17, V-18 | Existing capacity race remains green with no automatic selection or over-admission. |
| AC-6 | T-11, T-14 | V-16, V-17, V-18 | Merged cleanup still requires persisted completed result/head proof; candidate paths perform zero cleanup. |
| AC-7 | T-14 | V-17, V-18 | Existing bounded signal ordering and retained-evidence fixtures remain green. |
| AC-8 | T-10, T-11, T-12, T-14 | V-13, V-15, V-16, V-18 | Malformed/absent tmux and candidate-only states show zero destructive calls and preserved resources. |
| AC-9 | T-11, T-14 | V-15, V-16, V-17, V-18 | Closed/unproved PR and contradictory candidate facts remain actionable, blocked, and non-destructive. |
| AC-10 | T-11, T-12, T-14 | V-13 through V-18 | Repeated composite scenarios have identical reports/traces, no duplicate process, no collision, and passing gates. |

Coverage proof: all ten criteria preserve their issue order and exact text and each maps to implementation, deterministic validation, and concrete evidence before artifact creation.

## Implementation Tasks
1. **T-10 — Encode recovery-candidate domain policy** (`AC-1`, `AC-2`, `AC-3`, `AC-8`, `AC-9`, `AC-10`).
2. **T-11 — Stage candidate-aware reconciliation observations and precedence** (`AC-1`, `AC-2`, `AC-3`, `AC-6`, `AC-8`, `AC-9`, `AC-10`).
3. **T-12 — Resume candidate finalization without relaunch or inferred ownership** (`AC-2`, `AC-3`, `AC-8`, `AC-10`).
4. **T-13 — Update rendering, operator guidance, and release metadata to 0.1.2** (`AC-3`, `AC-8`, `AC-9`).
5. **T-14 — Add the composite incident fixture and run full regression/release proof** (`AC-1` through `AC-10`).
