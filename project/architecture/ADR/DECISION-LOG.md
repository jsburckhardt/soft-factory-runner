# Decision Log

This file is the single registry of all architectural decisions and core-components in the project. Every new or modified ADR or core-component **must** be recorded here.

## ADRs

| ID | Title | Status | Date |
|----|-------|--------|------|
| ADR-260810-typescript-node-cli | TypeScript and Node.js CLI | Accepted | 2026-08-10 |
| ADR-260811-engineering-harness-surface | Engineering Harness Development Surface | Accepted | 2026-08-11 |
| ADR-260811-prototype-one-run-orchestration | Prototype One Issue Run Orchestration | Accepted | 2026-08-11 |
| ADR-260811-prototype-two-completion-proof | Prototype Two Completion Proof | Accepted | 2026-08-11 |
| ADR-260811-prototype-three-recovery-concurrency | Prototype Three Recovery and Explicit Concurrency | Accepted | 2026-08-11 |
| ADR-260812-repository-doctor-readiness | Repository Doctor Readiness Architecture | Accepted | 2026-08-12 |

## Core-Components

| ID | Title | Status | Date |
|----|-------|--------|------|
| CORE-COMPONENT-260505-commit-standards | Commit Standards | Adopted | 2026-05-05 |
| CORE-COMPONENT-260806-rpiv-stage-contract | RPIV Stage Contract | Adopted | 2026-08-06 |
| CORE-COMPONENT-260806-project-command-interface | Project Command Interface | Adopted | 2026-08-06 |
| CORE-COMPONENT-260806-agent-executable-acceptance-criteria | Agent-Executable Acceptance Criteria | Adopted | 2026-08-06 |
| CORE-COMPONENT-260806-architecture-artifact-naming | Architecture Artifact Naming | Adopted | 2026-08-06 |
| CORE-COMPONENT-260810-structured-events | Structured Events | Adopted | 2026-08-10 |
| CORE-COMPONENT-260810-error-handling | Error Handling | Adopted | 2026-08-10 |
| CORE-COMPONENT-260810-persistence-recovery | Persistence and Recovery | Adopted | 2026-08-10 |
| CORE-COMPONENT-260810-subprocess-execution | Subprocess Execution | Adopted | 2026-08-10 |
| CORE-COMPONENT-260810-issue-worktree-locking | Issue and Worktree Locking | Adopted | 2026-08-10 |
| CORE-COMPONENT-260810-development-standards | Development Standards | Adopted | 2026-08-10 |
| CORE-COMPONENT-260811-engineering-harness-interface | Engineering Harness Interface | Adopted | 2026-08-11 |
| CORE-COMPONENT-260811-issue-run-orchestration | Issue Run Orchestration | Adopted | 2026-08-11 |
| CORE-COMPONENT-260811-completion-evidence-reconciliation | Completion Evidence Reconciliation | Adopted | 2026-08-11 |
| CORE-COMPONENT-260811-run-reconciliation-control | Run Reconciliation and Control | Adopted | 2026-08-11 |
| CORE-COMPONENT-260811-concurrent-run-admission | Concurrent Run Admission | Adopted | 2026-08-11 |
| CORE-COMPONENT-260811-owned-resource-cleanup | Owned Resource Cleanup | Adopted | 2026-08-11 |
| CORE-COMPONENT-260812-repository-doctor-contract | Repository Doctor Contract | Adopted | 2026-08-12 |

## Decisions

Short, actionable statements derived from ADRs and core-components. More than one decision can originate from a single source.

| # | Decision | Source | Date |
|---|----------|--------|------|
| 1 | Enforce Conventional Commits v1.0.0 on every commit message | CORE-COMPONENT-260505-commit-standards | 2026-05-05 |
| 2 | Require Conventional Commits format on PR titles | CORE-COMPONENT-260505-commit-standards | 2026-05-05 |
| 3 | Require the configured Copilot Co-authored-by trailer on AI-authored commits | CORE-COMPONENT-260505-commit-standards | 2026-05-05 |
| 4 | Require the RPIV implementer to commit implementation before verification | CORE-COMPONENT-260505-commit-standards | 2026-08-06 |
| 5 | Create the issue feature branch before RPIV Research starts | CORE-COMPONENT-260806-rpiv-stage-contract | 2026-08-06 |
| 6 | Assign stable AC IDs and prove task, validation, and evidence coverage | CORE-COMPONENT-260806-rpiv-stage-contract | 2026-08-06 |
| 7 | Use root justfile recipes for Implement and Verify validation by default | CORE-COMPONENT-260806-rpiv-stage-contract | 2026-08-06 |
| 8 | Restrict Verify to acceptance decisions, GitHub updates, push, and PR creation | CORE-COMPONENT-260806-rpiv-stage-contract | 2026-08-06 |
| 9 | Route verification defects to Implement or Plan by ownership | CORE-COMPONENT-260806-rpiv-stage-contract | 2026-08-06 |
| 10 | Define project operating commands as root justfile recipes | CORE-COMPONENT-260806-project-command-interface | 2026-08-06 |
| 11 | Use the root justfile as the default command interface | CORE-COMPONENT-260806-project-command-interface | 2026-08-06 |
| 12 | Provide the just command runner in project development environments | CORE-COMPONENT-260806-project-command-interface | 2026-08-06 |
| 13 | Prohibit standalone verification config that duplicates the root justfile | CORE-COMPONENT-260806-project-command-interface | 2026-08-06 |
| 14 | Require Implement and Verify to run independent stage-boundary validation | CORE-COMPONENT-260806-rpiv-stage-contract | 2026-08-06 |
| 15 | Require verify-focused and verify recipes in bootstrapped projects | CORE-COMPONENT-260806-project-command-interface | 2026-08-06 |
| 16 | Require acceptance criteria to be bounded, observable, and executable by configured agents | CORE-COMPONENT-260806-agent-executable-acceptance-criteria | 2026-08-06 |
| 17 | Require acceptance evidence to use safe, repeatable repository capabilities | CORE-COMPONENT-260806-agent-executable-acceptance-criteria | 2026-08-06 |
| 18 | Identify unavailable human or external prerequisites instead of encoding impossible agent tasks | CORE-COMPONENT-260806-agent-executable-acceptance-criteria | 2026-08-06 |
| 19 | Name architecture artifacts with their UTC creation date and descriptive slug | CORE-COMPONENT-260806-architecture-artifact-naming | 2026-08-06 |
| 20 | Use the full date-and-slug basename as the architecture artifact ID | CORE-COMPONENT-260806-architecture-artifact-naming | 2026-08-06 |
| 21 | Preserve artifact creation dates and distinguish same-day records by slug | CORE-COMPONENT-260806-architecture-artifact-naming | 2026-08-06 |
| 22 | Write implementation evidence to implementation/00-implementation.md | CORE-COMPONENT-260806-rpiv-stage-contract | 2026-08-06 |
| 23 | Require Implement to update affected application documentation and Verify to inspect it | CORE-COMPONENT-260806-rpiv-stage-contract | 2026-08-06 |
| 24 | Store RPIV artifacts under stable `project/work-items/<issue-number>-<short-description>/` paths | CORE-COMPONENT-260806-rpiv-stage-contract | 2026-08-07 |
| 25 | Reuse an existing same-issue work-item directory before creating a new artifact path | CORE-COMPONENT-260806-rpiv-stage-contract | 2026-08-07 |
| 26 | Build and distribute Runner as a strict TypeScript Node.js CLI through npm without selecting an application framework at bootstrap | ADR-260810-typescript-node-cli | 2026-08-10 |
| 27 | Derive human and machine output from versioned, redacted, append-only structured lifecycle events | CORE-COMPONENT-260810-structured-events | 2026-08-10 |
| 28 | Represent expected failures with stable typed codes and fail safe when ownership or state is ambiguous | CORE-COMPONENT-260810-error-handling | 2026-08-10 |
| 29 | Persist atomic versioned snapshots and append-only events, then reconcile them against observed runtime state | CORE-COMPONENT-260810-persistence-recovery | 2026-08-10 |
| 30 | Execute external tools through a typed adapter using validated argument arrays and redacted results | CORE-COMPONENT-260810-subprocess-execution | 2026-08-10 |
| 31 | Acquire atomic per-issue ownership and modify or clean resources only when recorded and observed ownership agree | CORE-COMPONENT-260810-issue-worktree-locking | 2026-08-10 |
| 32 | Enforce strict TypeScript, configured static checks, Conventional Commits, deterministic tests, and at least 80% coverage | CORE-COMPONENT-260810-development-standards | 2026-08-10 |
| 33 | Adopt engineering harness v0.13.0 as the ambient agent-facing development surface | ADR-260811-engineering-harness-surface | 2026-08-11 |
| 34 | Preserve root justfile command ownership behind delegating harness extensions | ADR-260811-engineering-harness-surface | 2026-08-11 |
| 35 | Require harness boot to start the application and compose full checks | CORE-COMPONENT-260811-engineering-harness-interface | 2026-08-11 |
| 36 | Expose focused and full harness checks through root justfile delegation | CORE-COMPONENT-260811-engineering-harness-interface | 2026-08-11 |
| 37 | Commit harness governance, extension briefings, and cold-agent injection cues | CORE-COMPONENT-260811-engineering-harness-interface | 2026-08-11 |
| 38 | Capture stage-identified RPIV friction in shared buffers and clear only after durable retro read-back | CORE-COMPONENT-260811-engineering-harness-interface | 2026-08-11 |
| 39 | Require Verify to validate the plan-scoped RPIV friction harvest before publishing closeout evidence | CORE-COMPONENT-260811-engineering-harness-interface | 2026-08-11 |
| 40 | Separate deterministic run orchestration from typed external-system adapters | ADR-260811-prototype-one-run-orchestration | 2026-08-11 |
| 41 | Defer completion reconciliation and recovery beyond Prototype 1 | ADR-260811-prototype-one-run-orchestration | 2026-08-11 |
| 42 | Require fetched remote HEAD and tracking SHA equality before branch creation | CORE-COMPONENT-260811-issue-run-orchestration | 2026-08-11 |
| 43 | Create issue branches from the proven SHA and mapped Conventional Commit type | CORE-COMPONENT-260811-issue-run-orchestration | 2026-08-11 |
| 44 | Block resource reuse unless lock, snapshot, and observed ownership agree | CORE-COMPONENT-260811-issue-run-orchestration | 2026-08-11 |
| 45 | Normalize owner-qualified repository names consistently for telemetry and tmux | CORE-COMPONENT-260811-issue-run-orchestration | 2026-08-11 |
| 46 | Persist Phase 1 snapshots and events without reporting unproved completion | CORE-COMPONENT-260811-issue-run-orchestration | 2026-08-11 |
| 47 | Bound readiness queries and block incomplete or ambiguous external proof | CORE-COMPONENT-260811-issue-run-orchestration | 2026-08-11 |
| 48 | Inject deterministic fixture adapters without exposing production test backdoors | CORE-COMPONENT-260811-issue-run-orchestration | 2026-08-11 |
| 49 | Finalize zero-exit RPIV runs through strict result, Git, and GitHub reconciliation | ADR-260811-prototype-two-completion-proof | 2026-08-11 |
| 50 | Derive required acceptance IDs from ordered issue criteria | ADR-260811-prototype-two-completion-proof | 2026-08-11 |
| 51 | Require passed `just verify-focused` and `just verify` result entries | ADR-260811-prototype-two-completion-proof | 2026-08-11 |
| 52 | Read legacy snapshots without accepting them as completion proof | ADR-260811-prototype-two-completion-proof | 2026-08-11 |
| 53 | Read only strict versioned results from the owned worktree artifact path | CORE-COMPONENT-260811-completion-evidence-reconciliation | 2026-08-11 |
| 54 | Persist exact required acceptance texts before launching RPIV | CORE-COMPONENT-260811-completion-evidence-reconciliation | 2026-08-11 |
| 55 | Require every acceptance result verified with nonempty evidence | CORE-COMPONENT-260811-completion-evidence-reconciliation | 2026-08-11 |
| 56 | Require local, remote, and open pull-request facts to match the result | CORE-COMPONENT-260811-completion-evidence-reconciliation | 2026-08-11 |
| 57 | Bound finalization observations without polling or retrying | CORE-COMPONENT-260811-completion-evidence-reconciliation | 2026-08-11 |
| 58 | Prohibit completed unless every completion comparison passes | CORE-COMPONENT-260811-completion-evidence-reconciliation | 2026-08-11 |
| 59 | Classify missing proof as interrupted and contradictory proof as failed | CORE-COMPONENT-260811-completion-evidence-reconciliation | 2026-08-11 |
| 60 | Expose all five terminal states in typed snapshots and status output | CORE-COMPONENT-260811-completion-evidence-reconciliation | 2026-08-11 |
| 61 | Append transition events before atomically replacing snapshots | CORE-COMPONENT-260811-completion-evidence-reconciliation | 2026-08-11 |
| 62 | Isolate completion observations behind typed deterministic adapters | CORE-COMPONENT-260811-completion-evidence-reconciliation | 2026-08-11 |
| 63 | Query issue-branch tips with bounded `git ls-remote --refs`, never tracking refs | CORE-COMPONENT-260811-completion-evidence-reconciliation | 2026-08-11 |
| 64 | Use revisioned v3 snapshots and replayable v2 events for deterministic recovery | ADR-260811-prototype-three-recovery-concurrency | 2026-08-11 |
| 65 | Match RPIV processes by compound OS identity and tmux pane lineage | ADR-260811-prototype-three-recovery-concurrency | 2026-08-11 |
| 66 | Enforce atomic concurrency slots while requiring explicit issue selection | ADR-260811-prototype-three-recovery-concurrency | 2026-08-11 |
| 67 | Verify merged PR source heads before automatic worktree and lock cleanup | ADR-260811-prototype-three-recovery-concurrency | 2026-08-11 |
| 68 | Reconcile locks, filesystem, Git, tmux, processes, results, remote, and GitHub once | CORE-COMPONENT-260811-run-reconciliation-control | 2026-08-11 |
| 69 | Stop exact processes with 10-second graceful and 5-second escalation bounds | CORE-COMPONENT-260811-run-reconciliation-control | 2026-08-11 |
| 70 | Replay only contiguous v2 events and retain bounded attempt logs through cleanup | CORE-COMPONENT-260811-run-reconciliation-control | 2026-08-11 |
| 71 | Require one atomic slot lease for every active run within configured capacity | CORE-COMPONENT-260811-concurrent-run-admission | 2026-08-11 |
| 72 | Count unknown leases as occupied and block admission during unsafe limit reductions | CORE-COMPONENT-260811-concurrent-run-admission | 2026-08-11 |
| 73 | Keep per-issue resources distinct without selecting issues automatically | CORE-COMPONENT-260811-concurrent-run-admission | 2026-08-11 |
| 74 | Require inactive, clean, exactly owned resources before non-forced cleanup | CORE-COMPONENT-260811-owned-resource-cleanup | 2026-08-11 |
| 75 | Verify merged PR source branch and SHA before automatic owned-resource cleanup | CORE-COMPONENT-260811-owned-resource-cleanup | 2026-08-11 |
| 76 | Retain branches, snapshots, events, logs, and automatic-cleanup tmux evidence | CORE-COMPONENT-260811-owned-resource-cleanup | 2026-08-11 |
| 77 | Evaluate all 24 repository Doctor prerequisites as blocking checks | ADR-260812-repository-doctor-readiness | 2026-08-12 |
| 78 | Require Runner protocol 1 in configuration and RPIV asset metadata | ADR-260812-repository-doctor-readiness | 2026-08-12 |
| 79 | Restrict Doctor path probes to reversible repository-contained resources | ADR-260812-repository-doctor-readiness | 2026-08-12 |
| 80 | Return exit 3 for complete NOT READY Doctor reports | ADR-260812-repository-doctor-readiness | 2026-08-12 |
| 81 | Emit the ordered 24-ID Doctor check vocabulary without omissions | CORE-COMPONENT-260812-repository-doctor-contract | 2026-08-12 |
| 82 | Derive Doctor human and JSON output from one versioned result | CORE-COMPONENT-260812-repository-doctor-contract | 2026-08-12 |
| 83 | Fail Doctor checks on missing, malformed, contradictory, or ambiguous proof | CORE-COMPONENT-260812-repository-doctor-contract | 2026-08-12 |
| 84 | Prohibit Doctor from selecting or inspecting GitHub issues | CORE-COMPONENT-260812-repository-doctor-contract | 2026-08-12 |
| 85 | Bound Doctor probes to 2 seconds and aggregate execution to 9 seconds | CORE-COMPONENT-260812-repository-doctor-contract | 2026-08-12 |
