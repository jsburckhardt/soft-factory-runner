# Research Brief: Phase 2: Prove completion with reconciled evidence

## GitHub Issue
- **Issue:** #4
- **Title:** Phase 2: Prove completion with reconciled evidence
- **Work Item:** `project/work-items/4-phase-2-prove-completion-with-reconciled-evidence`

## Scope Classification
- **Scope Type:** issue

## Problem Statement

After single-issue execution works, prevent false success by requiring structured RPIV, Git, GitHub, and validation evidence before a run becomes completed.

## Acceptance Criteria

<!-- ACCEPTANCE_CRITERIA_START -->

**Core**
- [ ] RPIV produces a versioned result artifact containing issue, outcome, branch, head SHA, pull request, acceptance results, validations, and completion time.
- [ ] Runner records atomic versioned snapshots and append-only structured transition events.
- [ ] Runner exposes explicit completed, failed, blocked, cancelled, and interrupted terminal states.
- [ ] Completion requires matching local HEAD, remote branch, open pull request, expected base, head and SHA, verified acceptance criteria, and passed validations.

**Edge Cases**
- [ ] A zero Copilot exit status without a valid result artifact cannot produce completed.
- [ ] A mismatched issue, branch, SHA, pull request, acceptance result, or validation cannot produce completed.

**Verification**
- [ ] Deterministic fixtures prove both successful reconciliation and each false-completion rejection path.

<!-- ACCEPTANCE_CRITERIA_END -->

## Repository Findings

- GitHub Issue #4 is open, labeled `feature` and `in progress`, and contains one ordered marker-wrapped acceptance-criteria block with seven nonempty Markdown checkboxes. The criteria above preserve its Core, Edge Cases, and Verification order.
- No `project/work-items/4-*` directory existed at either resolution check. The issue title therefore resolves to the required stable path `project/work-items/4-phase-2-prove-completion-with-reconciled-evidence` under the naming rules in `project/README.md` and `CORE-COMPONENT-260806-rpiv-stage-contract.md`.
- `PRD.md` sections 29-36 define `finalizing` plus the five terminal states, atomic run snapshots, append-only JSONL transition events, a versioned RPIV result artifact, and the reconciliation facts required before `completed`. FR-014 and FR-017 through FR-022 restate persistence, process-exit capture, result validation, Git/GitHub reconciliation, and terminal-state requirements. Prototype 2 identifies this issue as the completion-proof increment.
- `docs/phase-1-issue-run.md` and `README.md` explicitly state the current boundary: a zero Copilot exit is `interrupted`, never `completed`; result artifacts, completion, and post-launch pull-request reconciliation are deferred.
- `src/domain.ts` defines schema version 1 snapshots and events. `RunState` currently contains preparation states plus `failed`, `blocked`, and `interrupted`; it has no `completed`, `cancelled`, or `finalizing`. `RunSnapshotV1` stores issue, branch, fetched-base proof, tmux identity, Copilot launch facts, error, and update time, but no result artifact, acceptance results, validations, or pull-request completion facts.
- `src/persistence.ts` `RunStore.save` atomically writes the snapshot and then appends a schema-versioned `TransitionEventV1`; `RunStore.load` validates only snapshot schema version 1 and the current state/field set. `src/live.ts` `NodeFilePort.atomicWrite` writes, synchronizes, and renames a temporary file, while `append` uses append-only filesystem writes.
- `src/orchestrator.ts` `IssueRunService.runWorker` captures the Copilot exit code and maps zero to `interrupted` with reason `completion-unproved`, and nonzero to `failed`. It does not read or validate an RPIV result artifact or observe post-run Git/GitHub completion facts. `src/index.ts` returns worker exit 0 for the current `interrupted` result.
- `src/ports.ts` exposes filesystem, readiness Git/GitHub, tmux, and Copilot boundaries. `GitPort` can prove the fetched base and create resources but cannot observe local worktree HEAD or the pushed remote issue branch. `GitHubPort.loadIssue` returns readiness issue facts only. `PullRequestFacts` in `src/domain.ts` contains PR number, head branch, and closing issues, but no base branch, head SHA, or explicit open-state completion record.
- `src/live.ts` `LiveGitHubPort.loadIssue` queries open pull requests for readiness and parses number, head ref, and closing issue references. `LiveGitPort` observes local branch existence and fetched refs, but the current interfaces do not expose the complete post-run evidence named by Issue #4. External commands already use argument arrays with `shell: false`, bounded execution where defined, redacted failures, and typed results.
- `src/orchestration.test.ts` currently proves that zero exit becomes `interrupted` and explicitly is not `completed`, while nonzero exit becomes `failed`. Its deterministic fixture records snapshot/event operations and readiness failures, but there are no current completion-reconciliation fixture cases. `src/integration.test.ts` covers exclusive ownership, malformed readiness evidence, and exact fetched-base ancestry; it does not exercise result-artifact or post-run PR reconciliation. `src/documentation.test.ts` asserts the current Phase 1 deferrals.
- The root `justfile` exposes `verify-focused` and `verify`; `package.json` fixes Node 22+, strict TypeScript build/type checking, Jest, ESLint, and Prettier. The accepted TypeScript CLI architecture and root command surface remain in force.

## Constraints

- `PRD.md` state invariants prohibit treating tmux presence, agent prose, or Copilot exit zero as success. `completed` requires a valid result artifact plus matching Git and GitHub evidence.
- The PRD completion comparison requires expected issue and branch identity, worktree HEAD, remote branch existence, an open PR with expected base/head/SHA, verified required acceptance criteria, and passed required validations. Contradictory or incomplete facts cannot be represented as success.
- `CORE-COMPONENT-260810-persistence-recovery` requires versioned atomic snapshots, versioned append-only JSONL history, separation of persisted and observed runtime facts, schema validation, and safe blocked or interrupted classification for unknown or contradictory state.
- `CORE-COMPONENT-260810-structured-events` requires every transition to include schema version, timestamp, run ID, issue number, prior state, next state, and reason; human and JSON output must derive from the same redacted structured facts.
- `CORE-COMPONENT-260810-error-handling` requires stable typed error codes, nonzero CLI outcomes, explicit terminal-state mapping, preserved causes, actionable redacted context, and fail-safe handling of ambiguity.
- `CORE-COMPONENT-260810-subprocess-execution` requires validated executable/argument arrays, typed exit/signal/output facts, persisted or observable long-running identity, bounded cancellation behavior, and no secrets in result, snapshot, event, or display data.
- `CORE-COMPONENT-260810-issue-worktree-locking` requires one owned resource set and permits resource observation, reuse, modification, or cleanup only when recorded and observed ownership agree.
- `ADR-260811-prototype-one-run-orchestration` and `CORE-COMPONENT-260811-issue-run-orchestration` define the current layered command/domain/adapter boundary and explicitly defer completion reconciliation beyond Phase 1. They also require deterministic adapters through normal application composition and forbid production test backdoors or interpretation of RPIV prose.
- `ADR-260810-typescript-node-cli` and `CORE-COMPONENT-260810-development-standards` require a strict TypeScript Node.js CLI, strongly typed adapter/state contracts, deterministic isolation of external systems, configured static checks, and at least 80% global statement, branch, function, and line coverage.
- `CORE-COMPONENT-260806-project-command-interface` and `CORE-COMPONENT-260811-engineering-harness-interface` keep raw project commands in the root `justfile`, preserve direct `just verify-focused` and `just verify` boundaries, and keep the ambient harness outside product dependencies.

## Relevant ADRs and Core-Components

- `project/architecture/ADR/ADR-260810-typescript-node-cli.md` — accepted runtime, distribution, typed-boundary, and quality-tool constraints.
- `project/architecture/ADR/ADR-260811-prototype-one-run-orchestration.md` — accepted current orchestration separation and explicit deferral of completion proof.
- `project/architecture/ADR/ADR-260811-engineering-harness-surface.md` — accepted development surface and root-command delegation boundary.
- `project/architecture/core-components/CORE-COMPONENT-260811-issue-run-orchestration.md` — current Phase 1 state, persistence, worker-exit, adapter, and fixture contract; completion reconciliation is outside its stated scope.
- `project/architecture/core-components/CORE-COMPONENT-260810-persistence-recovery.md` — snapshot, event, schema, and persisted-versus-observed reconciliation contract.
- `project/architecture/core-components/CORE-COMPONENT-260810-structured-events.md` — structured transition and common rendering contract.
- `project/architecture/core-components/CORE-COMPONENT-260810-error-handling.md` — terminal classification and fail-safe typed-error contract.
- `project/architecture/core-components/CORE-COMPONENT-260810-subprocess-execution.md` — external Git, GitHub, Copilot, and validation execution boundary.
- `project/architecture/core-components/CORE-COMPONENT-260810-issue-worktree-locking.md` — owned-resource and ambiguity constraints.
- `project/architecture/core-components/CORE-COMPONENT-260810-development-standards.md` — strict TypeScript, deterministic adapter coverage, and quality thresholds.
- `project/architecture/core-components/CORE-COMPONENT-260806-rpiv-stage-contract.md` and `CORE-COMPONENT-260806-agent-executable-acceptance-criteria.md` — RPIV artifact/evidence boundaries and ordered, executable acceptance criteria.
- `project/architecture/core-components/CORE-COMPONENT-260806-project-command-interface.md` and `CORE-COMPONENT-260811-engineering-harness-interface.md` — root validation authority and harness delegation.
- `project/architecture/ADR/DECISION-LOG.md` registers all of the above as Accepted or Adopted. Decisions 27-32 and 40-48 are directly relevant, especially atomic persistence, structured events, safe ambiguity, typed subprocesses, deterministic composition, and the explicit Phase 1 completion deferral.

## Risks and Open Questions

- The exact versioned result-artifact schema and compatibility behavior are not established in source or an adopted architecture contract; the PRD provides an example and default path, while Issue #4 names required semantic fields.
- The repository currently has no representation of which acceptance criteria and validation commands are required for a specific run, so the source of the complete required sets is unresolved.
- Current GitHub facts are sufficient for pre-run conflict detection but lack expected base and head SHA facts needed by the issue. The exact relationship by which a pull request proves the expected issue is also not fully specified by the issue text.
- Current Git facts prove the starting remote default tip but do not expose post-run local HEAD and remote issue-branch SHA through `GitPort`; incomplete, stale, or eventually consistent remote observations are therefore an unresolved operational risk.
- `RunStore.save` performs snapshot replacement before event append. A failure between those operations can leave the latest snapshot without its corresponding transition event, and current code has no reconciliation behavior for that partial outcome.
- Existing snapshot loading accepts only schema version 1. Compatibility or migration behavior for already persisted Phase 1 runs is unspecified.
- `cancelled` is required as an explicit terminal state, but stop/cancellation control remains deferred to Prototype 3 in `PRD.md` and the Phase 1 documentation. The intended classification boundary for cancellation in this issue is unclear.
- Existing tests and documentation encode zero-exit `interrupted` and the absence of `completed`; those current contracts will become stale wherever Issue #4 changes externally observable behavior.
- Live completion evidence depends on authenticated GitHub and remote Git observations. The repository currently fails readiness safely on malformed or incomplete GitHub data, but post-run completion query bounds and incomplete-proof classification are not specified in the issue.
