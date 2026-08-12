# Research Brief: Phase 3: Recover safely and run distinct issues concurrently

## GitHub Issue
- **Issue:** #5
- **Title:** Phase 3: Recover safely and run distinct issues concurrently
- **Work Item:** `project/work-items/5-phase-3-recover-safely-and-run-distinct-issues-concurrently`

## Scope Classification
- **Scope Type:** issue

## Problem Statement

After evidence-based completion works, make runs recoverable after interruption while preserving ownership, uncommitted work, and isolation across concurrent issues.

## Acceptance Criteria

<!-- ACCEPTANCE_CRITERIA_START -->

**Core**
- [ ] Reconciliation compares persisted state with locks, filesystem, Git, tmux, processes, result artifacts, remote state, and GitHub.
- [ ] Restart reconciliation preserves a matching active RPIV process rather than launching a duplicate.
- [ ] Resume, stop, clean, list, status, attach, and logs expose deterministic outcomes.
- [ ] Distinct active issues receive distinct locks, branches, worktrees, tmux windows, and run records.
- [ ] Configured concurrency limits are enforced without introducing automatic issue selection.
- [ ] After the expected pull request is merged, Runner verifies the merged head against the recorded issue branch and commit before automatically removing the clean owned worktree and releasing its issue lock.

**Edge Cases**
- [ ] Stop requests graceful termination before bounded escalation and preserves worktree and terminal evidence.
- [ ] Cleanup refuses active, dirty, unknown, mismatched, or ambiguously owned resources.
- [ ] A closed-unmerged pull request or ambiguous merge or ownership evidence preserves the worktree and returns an actionable blocked result.

**Verification**
- [ ] Repeatable interruption and concurrency fixtures reach deterministic outcomes with no duplicate owner or resource collision.

<!-- ACCEPTANCE_CRITERIA_END -->

## Repository Findings

- GitHub Issue #5 is labeled `feature` and `in progress`. Its body contains exactly one `ACCEPTANCE_CRITERIA_START`/`ACCEPTANCE_CRITERIA_END` block with ten ordered, nonempty Markdown checkboxes.
- No `project/work-items/5-*` directory existed at either pre-creation resolution. `project/README.md`, `project/work-items/README.md`, and `CORE-COMPONENT-260806-rpiv-stage-contract` therefore resolve the title to the canonical stable work-item path shown above.
- `PRD.md` sections 37 through 41 and FR-021 through FR-026 define the recovery, duplicate prevention, stop, cleanup, merged-PR, explicit concurrency, and concurrency-limit problem surface. Prototype 3 identifies restart recovery, resume, stop, clean, multiple simultaneous issues, and limits as the next product increment.
- `src/command.ts` `parseCommand` and `HELP_TEXT` expose only `run`, `status`, `attach`, and the private worker. `src/index.ts` `runCli` dispatches only those commands. There is no current `resume`, `stop`, `clean`, `list`, or `logs` behavior.
- `src/domain.ts` defines snapshot schema version 2, five terminal states, owned branch/worktree/tmux/Copilot facts, and completion facts. `RunSnapshotBase` does not record a process identifier or signature, attempt number, stop status, cleanup status, or resource-reconciliation observations.
- `src/persistence.ts` `RunStore` can exclusively create a lock, check snapshot existence, append an event before atomically replacing a snapshot, and load snapshot versions 1 or 2. It does not read or validate lock records, read or reconcile event history, enumerate runs, or release runtime resources.
- `src/orchestrator.ts` `IssueRunService.run` performs read-only readiness, acquires an issue lock, and creates a new resource set. When a snapshot exists after a new lock is acquired, it throws `RESOURCE_OWNERSHIP_UNKNOWN` before the main blocking-error persistence block, leaving the new lock for manual reconciliation.
- `IssueRunService.runWorker` launches Copilot whenever a version-2 snapshot is `running_rpiv` and has a tmux identity. Neither the service nor `LiveProcessPort` can observe or match an already-running Copilot process, so reinvoking the worker can launch a duplicate.
- `IssueRunService.status` observes only the recorded tmux target. `attach` requires exact recorded and observed session, window, pane, and cwd equality. Status facts do not include lock, filesystem, Git, process, result-artifact, remote, or GitHub observations.
- `src/ports.ts` currently has creation and limited observation boundaries for files, Git, GitHub, tmux, and Copilot. It has no file enumeration/removal, Git dirtiness or worktree-removal observation, tmux log/stop/removal operation, or process identity observation/termination operation.
- `src/live.ts` `LiveTmuxPort.observe` checks pane identity and cwd but not the pane process. `LiveProcessPort.runCopilot` inherits terminal IO and waits for exit without persisting a child PID or exposing signal control. `CommandExecutor` separately applies timeout, `SIGTERM`, and one-second `SIGKILL` escalation to bounded short-lived commands.
- `src/live.ts` `LiveGitHubPort.loadPullRequest` queries PR number, state, base, head branch, PR head SHA, and closing issues. `CompletionPullRequestFacts` has no merge-commit or separate merge-proof field. `src/completion.ts` currently requires the PR state to be `OPEN`; it does not classify post-merge cleanup.
- `src/config.ts` `RunConfiguration` supports repository remote/base branch, branch type mappings, and the RPIV prompt. The PRD-documented `execution.max_concurrent_runs` setting is not parsed.
- `src/render.ts` renders one run or one status result from structured facts. It has no retained-run listing or terminal-log output surface.
- Existing source tests cover same-issue contention, exclusive lock creation, one-issue orchestration, completion reconciliation, and event-before-snapshot persistence failures. They do not currently exercise distinct-issue concurrency, restart reconciliation, stop, cleanup, list/logs, concurrency limits, or merged-PR cleanup.
- Git history shows Phase 1 introduced the command/domain/adapter orchestration in commit `0fb5bbc`, and Phase 2 extended it with completion proof and event-first snapshot version 2 in `b7d036b`, the current `origin/main` baseline. `README.md` and `docs/phase-1-issue-run.md` explicitly defer all Issue #5 behavior to Prototype 3.

## Constraints

- `CORE-COMPONENT-260810-persistence-recovery` requires versioned atomic snapshots, append-only versioned events, persisted and observed state as separate reconciliation inputs, idempotent recovery where practical, preservation of a matching active process, and safe `blocked` or `interrupted` outcomes for unknown or contradictory state.
- `CORE-COMPONENT-260810-issue-worktree-locking` requires atomic per-issue ownership, one resource set per active issue, distinct resources across distinct issues, agreement among lock, snapshot, and observed ownership before reuse or cleanup, and refusal to clean active, dirty, unknown, mismatched, or ambiguous resources.
- `CORE-COMPONENT-260810-subprocess-execution` requires validated executable/argument arrays, typed redacted results, observable long-running process identity, graceful cancellation before bounded escalation, and no secrets in snapshots, events, or logs.
- `CORE-COMPONENT-260810-structured-events` and `CORE-COMPONENT-260810-error-handling` require versioned redacted lifecycle facts, append-only history, common human/JSON meaning, stable actionable typed failures, nonzero nonsuccess outcomes, and fail-safe ambiguity handling.
- `ADR-260811-prototype-one-run-orchestration` and `CORE-COMPONENT-260811-issue-run-orchestration` keep orchestration deterministic behind typed external-system adapters, preserve fetched-base and ownership proof, bound external observations, and prohibit interpretation of RPIV prose.
- `ADR-260811-prototype-two-completion-proof` and `CORE-COMPONENT-260811-completion-evidence-reconciliation` require strict result, Git, GitHub, acceptance, and validation comparisons before `completed`; event-before-snapshot ordering; safe legacy snapshot handling; missing proof as `interrupted`; and contradictory proof as `failed`. Recovery and merged-PR cleanup cannot weaken these invariants.
- `PRD.md` state invariants prohibit duplicate local owners and shared issue resources, require preservation of uncommitted work and terminal output, require explicit issue selection, and permit merged-PR cleanup only after merge, branch, commit, worktree, and ownership facts reconcile.
- `ADR-260810-typescript-node-cli`, `CORE-COMPONENT-260810-development-standards`, and `package.json` constrain the application to strict TypeScript on Node.js 22+, typed external boundaries, deterministic isolation from live systems, and the configured quality gates.
- `CORE-COMPONENT-260806-project-command-interface`, `CORE-COMPONENT-260811-engineering-harness-interface`, and `.harness/engineering-harness.md` preserve root `justfile` command authority and keep the ambient harness a development surface rather than a product dependency.

## Relevant ADRs and Core-Components

- `project/architecture/ADR/ADR-260810-typescript-node-cli.md` — accepted runtime, distribution, and typed adapter boundary.
- `project/architecture/ADR/ADR-260811-prototype-one-run-orchestration.md` — current deterministic run orchestration and explicit Prototype 3 deferral.
- `project/architecture/ADR/ADR-260811-prototype-two-completion-proof.md` — current completion, persistence ordering, compatibility, and Prototype 3 boundary.
- `project/architecture/core-components/CORE-COMPONENT-260810-persistence-recovery.md` — restart reconciliation and duplicate-process prevention contract.
- `project/architecture/core-components/CORE-COMPONENT-260810-issue-worktree-locking.md` — exclusive issue ownership, resource isolation, and cleanup refusal rules.
- `project/architecture/core-components/CORE-COMPONENT-260810-subprocess-execution.md` — observable process identity and graceful bounded cancellation.
- `project/architecture/core-components/CORE-COMPONENT-260810-structured-events.md` — lifecycle history and shared structured output facts.
- `project/architecture/core-components/CORE-COMPONENT-260810-error-handling.md` — typed actionable failures and safe ambiguity handling.
- `project/architecture/core-components/CORE-COMPONENT-260811-issue-run-orchestration.md` — existing command/domain/adapter sequence and ownership facts.
- `project/architecture/core-components/CORE-COMPONENT-260811-completion-evidence-reconciliation.md` — strict completion proof and terminal classification invariants.
- `project/architecture/core-components/CORE-COMPONENT-260810-development-standards.md` — strict TypeScript and deterministic quality constraints.
- `project/architecture/core-components/CORE-COMPONENT-260806-rpiv-stage-contract.md` — Research scope and stable work-item path rules.
- `project/architecture/ADR/DECISION-LOG.md` registers these artifacts as Accepted or Adopted; decisions 27 through 32 and 40 through 63 are directly relevant.

## Risks and Open Questions

- The deterministic identity used to match a live RPIV process is unspecified. Current persisted facts identify Copilot arguments and a tmux pane but no stable process identity or start fact.
- The authoritative meaning of an active run for concurrency counting is unspecified when lock, snapshot, tmux, and process facts disagree or are unavailable.
- Event history may be ahead of the snapshot after an atomic snapshot replacement failure, while runtime state may also have advanced after interruption. `RunStore.load` currently ignores event history.
- The phrase merged head is ambiguous relative to the current PR head SHA and a GitHub merge commit. A merged PR may also have its remote issue branch deleted, so branch-ref availability cannot be assumed.
- The exact resource boundary for automatic merged-PR cleanup is not uniform: the issue criterion names the worktree and lock, while PRD section 40 also lists the tmux window for explicit cleanup.
- Terminal evidence after stop has no specified retention location, lifetime, or relationship to the `logs` command.
- Deterministic `resume` outcomes are unspecified for each terminal state, partially prepared state, and each mismatch among lock, tmux, process, and snapshot facts.
- Enforcing a repository-wide concurrency limit introduces a race across distinct issue starts; the required atomic counting boundary is not stated.
- The shared repository tmux session is intentional, but loss or ambiguity of that session can affect several otherwise isolated issue windows at once.
- Live GitHub, remote Git, tmux, and process observations can be transient or incomplete. Existing contracts require bounded fail-safe nonsuccess, while the issue requires deterministic resumable outcomes without specifying retry semantics.
