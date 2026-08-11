# Action Plan: Phase 1: Run one issue in an isolated visible environment

## Feature
- **ID:** 3
- **Research Brief:** `project/work-items/3-phase-1-run-one-issue-in-an-isolated-visible-environment/research/00-research.md`

## ADRs Created
- `ADR-260811-prototype-one-run-orchestration` — adopts the layered Prototype 1 orchestration, fetched-base proof, safe outer-worktree handling, deterministic identity, fixture boundary, state depth, and explicit later-phase deferrals.

## Core-Components Created
- `CORE-COMPONENT-260811-issue-run-orchestration` — defines reusable sequencing, readiness, remote proof, ownership, persistence, tmux/Copilot, telemetry, status/attach, bounded observation, and fixture contracts.

## Acceptance Criteria
- **AC-1:** `soft-factory run --issue <number>` validates the repository and issue before unnecessary side effects.
- **AC-2:** A valid issue receives one lock, issue branch, isolated worktree, run record, and tmux window.
- **AC-3:** Before creating the issue branch or worktree, Runner fetches the configured remote, verifies the latest remote default-branch commit, and blocks with actionable output when that base cannot be proven.
- **AC-4:** The issue branch is created from that verified remote default branch and uses an allowed Conventional Commit type matching the intended change.
- **AC-5:** RPIV runs visibly in the issue window from its isolated worktree.
- **AC-6:** Every launched Copilot process receives `OTEL_RESOURCE_ATTRIBUTES=project.name=<project>,issue.id=issue-<number>` using the resolved repository name and explicit issue number, and is launched with `--name issue-<number>`.
- **AC-7:** Status reports the current run state, and attach resolves the correct window using only the issue number.
- **AC-8:** Invalid, closed, blocked, conflicting, or acceptance-criteria-incomplete issues fail with actionable output.
- **AC-9:** Two simultaneous starts for the same issue produce exactly one local owner.
- **AC-10:** An end-to-end fixture proves issue-to-worktree-to-tmux-to-RPIV orchestration without requiring implementation decisions from Runner.

## Acceptance Coverage

| AC | Implementation tasks | Tests / validation | Expected evidence |
|---|---|---|---|
| AC-1 | T-1, T-2, T-6, T-7 | V-1, V-2, V-10, V-12; focused/full root validation | Adapter trace shows repository and issue checks precede the first owned-resource operation; actionable CLI snapshots and documentation |
| AC-2 | T-3, T-4, T-6, T-7 | V-5, V-7, V-10, V-11, V-12 | One lock owner record, typed branch/worktree calls, atomic run snapshot, one tmux window, lifecycle events, end-to-end trace |
| AC-3 | T-2, T-3, T-6, T-7 | V-3, V-4, V-10, V-12 | Ordered trace of fetch, advertised HEAD and tracking-ref equality, persisted `FetchedBaseProofV1`, and zero branch/worktree calls on proof failure |
| AC-4 | T-2, T-3, T-6, T-7 | V-4, V-10, V-12 | Branch call uses the exact proven SHA and `feat` selected from the configured `feature` label mapping; Git ancestry assertion |
| AC-5 | T-4, T-6, T-7 | V-7, V-10, V-12 | Captured tmux window/worker command rooted at the isolated worktree and visible pane output marker |
| AC-6 | T-4, T-6, T-7 | V-8, V-10, V-12 | Captured Copilot argv contains exact `--name issue-3`; child environment has the exact normalized OTEL string on every launch |
| AC-7 | T-3, T-5, T-6, T-7 | V-9, V-10, V-11, V-12 | Human/JSON status snapshots from common facts and attach call resolved from issue 3 to the recorded verified tmux target |
| AC-8 | T-1, T-2, T-6, T-7 | V-1, V-2, V-3, V-12 | Table-driven non-zero results and stable codes/remediation for invalid, nonexistent, closed, blocked, conflicting, malformed/missing/empty AC, timeout, pagination, and ambiguous proof cases; zero avoidable side effects |
| AC-9 | T-3, T-6, T-7 | V-6, V-10, V-12 | Barrier-controlled concurrent test records one exclusive-lock winner, one `ISSUE_ALREADY_OWNED` result, and one downstream resource set |
| AC-10 | T-1 through T-7 | V-10, plus V-1 through V-9 and V-11/V-12 supporting checks | Deterministic fixture transcript from issue facts through branch/worktree/tmux/Copilot, proving no live credentials and no Runner code-editing or solution-selection behavior |

**Coverage proof:** AC-1 through AC-10 each have at least one dependency-ordered implementation task, explicit automated validation, and concrete inspectable evidence. No criterion is unmapped.

## Architecture and Scope Resolutions

- **Fetched-base proof and sequencing:** parse and perform read-only repository/issue readiness first; atomically acquire ownership; fetch the resolved remote; compare advertised remote HEAD SHA with the fetched tracking ref; persist proof; then create the branch from that SHA and add the worktree. Proof failure records an actionable blocked outcome and performs no branch/worktree operation.
- **Configured remote/default:** read optional `.soft-factory/config.yml` fields `repository.remote` and `repository.base_branch`; use that remote, then Git `remote.pushDefault`, current-branch remote, or an unambiguous sole remote. Discover advertised HEAD after fetch; configured `base_branch` must agree. Missing, conflicting, truncated, or timed-out evidence blocks.
- **Outer `.trees/3` collision:** the ambient RPIV worktree has no matching Runner lock/snapshot owner and is therefore unknown. Production Runner blocks and preserves it. Tests and the end-to-end fixture use temporary repository roots and never reuse ambient `.trees/3`.
- **Telemetry project name:** normalize the owner-qualified repository (`jsburckhardt/soft-factory-runner`) to lowercase hyphenated `jsburckhardt-soft-factory-runner`; set the exact child OTEL value and exact `--name issue-3` for every Copilot launch.
- **Readiness/conflicting PR bounds:** reject nonexistent/closed issues, open blockers, a `blocked` label, missing/malformed/duplicate/empty AC blocks, and open PRs that close the issue or use its planned branch. Limit GitHub lists to 10 pages of 100, GitHub/tmux calls to 15 seconds, and fetch/remote-HEAD calls to 30 seconds; timeout, truncation, or incomplete evidence blocks safely.
- **Fixture/adapters:** isolate Git, GitHub, tmux, subprocess, filesystem, clock, and ID ports. A declarative deterministic fixture supplies external facts and captures operations through normal application composition, with no production test switch.
- **Prototype 1 state:** implement versioned atomic snapshots and required transition events through `running_rpiv`; worker non-zero exit becomes `failed`, zero exit becomes `interrupted` until Prototype 2 proves completion. Status reports persisted and observed facts separately. Defer result artifacts, completed-state reconciliation, restart recovery, resume/stop/clean, post-launch PR reconciliation, and scheduling.

## Implementation Tasks

1. **T-1 — Establish CLI, domain, configuration, and adapter seams (AC-1, AC-8, AC-10).** Replace the bootstrap-only dispatch with strict `run --issue`, `status <issue>`, `attach <issue>`, and internal-worker parsing; define typed facts/errors, identity normalization, bounded adapter ports, configuration precedence, and shared renderers.
2. **T-2 — Implement read-only readiness and fetched-base proof (AC-1, AC-3, AC-4, AC-8, AC-10).** Validate repository/GitHub issue metadata and conflicts, map intended type from labels, resolve/fetch the remote, discover advertised default HEAD, and produce equality proof with stable failures.
3. **T-3 — Implement atomic ownership, persistence, branch, and worktree preparation (AC-2, AC-3, AC-4, AC-7, AC-9, AC-10).** Acquire an exclusive owner, write snapshots/events atomically, preserve unknown resources, persist proof before branch creation, and consume the exact SHA.
4. **T-4 — Implement visible tmux worker and exact Copilot launch (AC-2, AC-5, AC-6, AC-10).** Create one deterministic issue window in the worktree, start the internal worker visibly, launch RPIV with exact argv/environment, and capture exit state.
5. **T-5 — Implement current status and issue-only attach (AC-5, AC-7, AC-10).** Render persisted/observed status from shared facts and verify/attach the recorded tmux target using only the issue number.
6. **T-6 — Build deterministic unit, concurrency, integration, and end-to-end proof (AC-1 through AC-10).** Add declarative adapters/fixtures, exhaustive failure tables, ordering assertions, barrier-controlled lock contention, and a complete orchestration trace while maintaining at least 80% global coverage.
7. **T-7 — Document Phase 1 operation and boundaries (AC-1 through AC-10).** Add command/configuration/state/telemetry/ownership/troubleshooting guidance under `docs/`, update documentation indexes and root usage, explain unknown outer-worktree blocking, and clearly defer later recovery/completion behavior.
