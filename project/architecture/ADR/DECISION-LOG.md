# Decision Log

This file is the single registry of all architectural decisions and core-components in the project. Every new or modified ADR or core-component **must** be recorded here.

## ADRs

| ID | Title | Status | Date |
|----|-------|--------|------|
| ADR-260810-typescript-node-cli | TypeScript and Node.js CLI | Accepted | 2026-08-10 |
| ADR-260811-engineering-harness-surface | Engineering Harness Development Surface | Accepted | 2026-08-11 |
| ADR-260811-prototype-one-run-orchestration | Prototype One Issue Run Orchestration | Accepted | 2026-08-11 |
| ADR-260811-prototype-two-completion-proof | Prototype Two Completion Proof | Superseded by ADR-260812-rpiv-integration-completion-contract | 2026-08-11 |
| ADR-260811-prototype-three-recovery-concurrency | Prototype Three Recovery and Explicit Concurrency | Accepted | 2026-08-11 |
| ADR-260812-repository-doctor-readiness | Repository Doctor Readiness Architecture | Accepted | 2026-08-12 |
| ADR-260812-official-asset-distribution-installation | Official Asset Distribution and Installation | Accepted | 2026-08-12 |
| ADR-260812-copilot-child-environment | Copilot Child Environment Configuration | Accepted | 2026-08-12 |
| ADR-260812-rpiv-integration-completion-contract | RPIV Integration and Completion Contract | Accepted | 2026-08-12 |
| ADR-260814-tmux-identity-failure-recovery | Tmux Identity Failure Recovery | Accepted | 2026-08-14 |

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
| CORE-COMPONENT-260812-official-asset-installation-contract | Official Asset Installation Contract | Adopted | 2026-08-12 |
| CORE-COMPONENT-260812-copilot-child-environment-contract | Copilot Child Environment Contract | Adopted | 2026-08-12 |
| CORE-COMPONENT-260812-rpiv-integration-handoff | RPIV Integration Handoff | Adopted | 2026-08-12 |
| CORE-COMPONENT-260814-tmux-identity-diagnostics | Tmux Identity Diagnostics | Adopted | 2026-08-14 |
| CORE-COMPONENT-260815-package-semver-governance | Package Semantic Versioning Governance | Adopted | 2026-08-15 |

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
| 8 | Require Verify to decide acceptance, create the PR, and publish the bound result | CORE-COMPONENT-260806-rpiv-stage-contract | 2026-08-12 |
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
| 51 | Use the current RPIV integration contract instead of fixed completion recipes | ADR-260812-rpiv-integration-completion-contract | 2026-08-12 |
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
| 86 | Package official agent assets with the Runner npm release | ADR-260812-official-asset-distribution-installation | 2026-08-12 |
| 87 | Verify packaged asset bytes against compiled SHA-256 catalog digests | ADR-260812-official-asset-distribution-installation | 2026-08-12 |
| 88 | Apply recommended asset installation as one all-or-nothing batch | ADR-260812-official-asset-distribution-installation | 2026-08-12 |
| 89 | Preserve the canonical Doctor check set and RPIV asset authority | ADR-260812-official-asset-distribution-installation | 2026-08-12 |
| 90 | Require manifest digest proof before replacing differing installed assets | CORE-COMPONENT-260812-official-asset-installation-contract | 2026-08-12 |
| 91 | Delegate official delivery-agent dispatch exclusively to Runner commands | CORE-COMPONENT-260812-official-asset-installation-contract | 2026-08-14 |
| 92 | Retire legacy assessor and skill only with exact manifest ownership proof | CORE-COMPONENT-260812-official-asset-installation-contract | 2026-08-14 |
| 93 | Use `copilot.environment` for configured Copilot child variables | ADR-260812-copilot-child-environment | 2026-08-12 |
| 94 | Apply configured values after inherited values and Runner telemetry last | ADR-260812-copilot-child-environment | 2026-08-12 |
| 95 | Keep configured Copilot environment values out of durable Runner records | ADR-260812-copilot-child-environment | 2026-08-12 |
| 96 | Validate Copilot environment names and string values before every launch | CORE-COMPONENT-260812-copilot-child-environment-contract | 2026-08-12 |
| 97 | Pass literal immutable environment maps only through `spawnCopilot` | CORE-COMPONENT-260812-copilot-child-environment-contract | 2026-08-12 |
| 98 | Isolate configured Copilot environments from other subprocesses and concurrent issues | CORE-COMPONENT-260812-copilot-child-environment-contract | 2026-08-12 |
| 99 | Prohibit configured values in Runner errors, output, persistence, and logs | CORE-COMPONENT-260812-copilot-child-environment-contract | 2026-08-12 |
| 100 | Compose Copilot child environments under the dedicated launch contract | CORE-COMPONENT-260811-issue-run-orchestration | 2026-08-12 |
| 101 | Supersede fixed two-recipe completion proof with the RPIV integration completion contract | ADR-260811-prototype-two-completion-proof | 2026-08-12 |
| 102 | Treat RPIV progress as non-authorizing recovery evidence | ADR-260811-prototype-three-recovery-concurrency | 2026-08-12 |
| 103 | Require Verify to publish the bound final result after pull-request creation | CORE-COMPONENT-260806-rpiv-stage-contract | 2026-08-12 |
| 104 | Require one snapshotted final-validation binding and ignore focused validation for completion | CORE-COMPONENT-260811-completion-evidence-reconciliation | 2026-08-12 |
| 105 | Read RunSnapshotV1-V4 and expose progress separately without granting recovery or cleanup actions | CORE-COMPONENT-260811-run-reconciliation-control | 2026-08-12 |
| 106 | Use `rpiv.final_validation` for one argument-free root justfile recipe | ADR-260812-rpiv-integration-completion-contract | 2026-08-12 |
| 107 | Default absent final-validation configuration to `just verify` | ADR-260812-rpiv-integration-completion-contract | 2026-08-12 |
| 108 | Persist one final validation unchanged through execution and recovery | ADR-260812-rpiv-integration-completion-contract | 2026-08-12 |
| 109 | Normalize supported legacy completion validation to sole `just verify` | ADR-260812-rpiv-integration-completion-contract | 2026-08-12 |
| 110 | Publish versioned RPIV progress atomically at every phase transition | CORE-COMPONENT-260812-rpiv-integration-handoff | 2026-08-12 |
| 111 | Report missing or invalid progress as unknown without inferring phase | CORE-COMPONENT-260812-rpiv-integration-handoff | 2026-08-12 |
| 112 | Publish immutable AgentResultV1 only after pull-request creation | CORE-COMPONENT-260812-rpiv-integration-handoff | 2026-08-12 |
| 113 | Require coordinator result validation before successful RPIV exit | CORE-COMPONENT-260812-rpiv-integration-handoff | 2026-08-12 |
| 114 | Derive human and JSON integration instructions from IntegrationContractV1 | CORE-COMPONENT-260812-rpiv-integration-handoff | 2026-08-12 |
| 115 | Install the sole official agent at `.github/agents/soft-factory.agent.md` | ADR-260812-official-asset-distribution-installation | 2026-08-14 |
| 116 | Keep official asset ownership metadata in `.agents/manifest.json` | ADR-260812-official-asset-distribution-installation | 2026-08-14 |
| 117 | Publish only the delivery-agent source from the official asset directory | ADR-260812-official-asset-distribution-installation | 2026-08-14 |
| 118 | Apply official asset migrations and retirements as one rollback-protected transaction | ADR-260812-official-asset-distribution-installation | 2026-08-14 |
| 119 | Recognize only enumerated current and legacy identity-destination ownership records | CORE-COMPONENT-260812-official-asset-installation-contract | 2026-08-14 |
| 120 | Retire legacy files only when bytes match their recorded manifest digests | CORE-COMPONENT-260812-official-asset-installation-contract | 2026-08-14 |
| 121 | Require qualified Copilot terminal tools and validate one issue before terminal use | CORE-COMPONENT-260812-official-asset-installation-contract | 2026-08-14 |
| 122 | Run instructions before Doctor and preserve exact dispatch output without claiming completion | CORE-COMPONENT-260812-official-asset-installation-contract | 2026-08-14 |
| 123 | Use original command bytes for tmux identity parsing and pre-decode byte counts | ADR-260814-tmux-identity-failure-recovery | 2026-08-14 |
| 124 | Persist only bounded value-free tmux identity structure in RunSnapshotV5 | ADR-260814-tmux-identity-failure-recovery | 2026-08-14 |
| 125 | Retry starting_tmux creation only after exact clean fetched-HEAD ownership and zero same-name candidates | ADR-260814-tmux-identity-failure-recovery | 2026-08-14 |
| 126 | Treat nonzero tmux observation as absence and malformed zero-exit output as unknown | ADR-260814-tmux-identity-failure-recovery | 2026-08-14 |
| 127 | Require exact vertical-bar-framed LF-terminated tmux identity records and strict identifier grammars | CORE-COMPONENT-260814-tmux-identity-diagnostics | 2026-08-15 |
| 128 | Cap tmux identity diagnostics at eight records, eight fields, and 32 tokens | CORE-COMPONENT-260814-tmux-identity-diagnostics | 2026-08-14 |
| 129 | Retain the latest tmux identity diagnostic until valid identity proof clears it | CORE-COMPONENT-260814-tmux-identity-diagnostics | 2026-08-14 |
| 130 | Prohibit raw tmux output and field values in durable identity diagnostics | CORE-COMPONENT-260814-tmux-identity-diagnostics | 2026-08-14 |
| 131 | Read RunSnapshotV1-V5 and persist new runs as revisioned RunSnapshotV5 | CORE-COMPONENT-260811-run-reconciliation-control | 2026-08-14 |
| 132 | Authorize preparation resume only with exact clean fetched-HEAD ownership and zero same-name candidates | CORE-COMPONENT-260811-run-reconciliation-control | 2026-08-14 |
| 133 | Preserve one-pass reconciliation while persisting returned tmux identity failure diagnostics | CORE-COMPONENT-260811-run-reconciliation-control | 2026-08-14 |
| 134 | Preserve v4 completion evidence unchanged within RunSnapshotV5 | CORE-COMPONENT-260811-completion-evidence-reconciliation | 2026-08-14 |
| 135 | Strengthen `command.tmux` with an isolated functional readiness probe while preserving 24 IDs | ADR-260812-repository-doctor-readiness | 2026-08-14 |
| 136 | Run Doctor tmux probes on managed foreground servers with private sockets and configurations | ADR-260812-repository-doctor-readiness | 2026-08-14 |
| 137 | Prove tmux readiness through session, window, pane, identity, observation, and cleanup operations | ADR-260812-repository-doctor-readiness | 2026-08-14 |
| 138 | Reserve final 2500ms of the Doctor deadline for awaited tmux cleanup | ADR-260812-repository-doctor-readiness | 2026-08-14 |
| 139 | Parse Doctor tmux identities from capped original bytes and reject truncation | CORE-COMPONENT-260812-repository-doctor-contract | 2026-08-14 |
| 140 | Emit DoctorResultV2 with versioned value-free tmux failure evidence | CORE-COMPONENT-260812-repository-doctor-contract | 2026-08-14 |
| 141 | Cap each Doctor command output stream at 4096 retained bytes | CORE-COMPONENT-260812-repository-doctor-contract | 2026-08-14 |
| 142 | Clean every tmux probe path by exact ownership and verify all resources absent | CORE-COMPONENT-260812-repository-doctor-contract | 2026-08-14 |
| 143 | Isolate tmux probe workspaces under exclusive operating-system temporary directories | CORE-COMPONENT-260812-repository-doctor-contract | 2026-08-14 |
| 144 | Use printable vertical bars for tmux identity framing in every client mode | ADR-260814-tmux-identity-failure-recovery | 2026-08-15 |
| 145 | Require exactly one terminal LF on every tmux identity record | ADR-260814-tmux-identity-failure-recovery | 2026-08-15 |
| 146 | Parse observation cwd as every byte after the second vertical bar | ADR-260814-tmux-identity-failure-recovery | 2026-08-15 |
| 147 | Prohibit HT and inferred sanitized tmux identity transport forms | ADR-260814-tmux-identity-failure-recovery | 2026-08-15 |
| 148 | Share one strict tmux identity parser across normal and Doctor paths | CORE-COMPONENT-260814-tmux-identity-diagnostics | 2026-08-15 |
| 149 | Preserve bounded value-free tmux diagnostics without raw identity values | CORE-COMPONENT-260814-tmux-identity-diagnostics | 2026-08-15 |
| 150 | Keep tmux identity evidence non-authorizing for ownership and retry | CORE-COMPONENT-260814-tmux-identity-diagnostics | 2026-08-15 |
| 151 | Validate tmux transport in controlled UTF-8 and non-UTF8 client states | CORE-COMPONENT-260814-tmux-identity-diagnostics | 2026-08-15 |
| 152 | Assign package versions by the highest-impact Semantic Versioning change | CORE-COMPONENT-260815-package-semver-governance | 2026-08-15 |
| 153 | Increment pre-1.0 minor versions for incompatible public-contract changes | CORE-COMPONENT-260815-package-semver-governance | 2026-08-15 |
| 154 | Synchronize package, lock, asset, manifest, fixture, and documentation versions | CORE-COMPONENT-260815-package-semver-governance | 2026-08-15 |
| 155 | Prohibit dependency churn during release-only package version updates | CORE-COMPONENT-260815-package-semver-governance | 2026-08-15 |
| 156 | Require upgrade guidance to confirm the delivered package version | CORE-COMPONENT-260815-package-semver-governance | 2026-08-15 |
| 157 | Release the backward-compatible tmux correction as version 0.1.1 | CORE-COMPONENT-260815-package-semver-governance | 2026-08-15 |
| 158 | Use portable vertical-bar identity framing in the isolated Doctor probe | ADR-260812-repository-doctor-readiness | 2026-08-15 |
| 159 | Preserve all 24 Doctor checks while changing tmux identity framing | ADR-260812-repository-doctor-readiness | 2026-08-15 |
| 160 | Require Doctor create and observe to use the shared identity grammar | CORE-COMPONENT-260812-repository-doctor-contract | 2026-08-15 |
| 161 | Verify Doctor transport in both controlled tmux client modes | CORE-COMPONENT-260812-repository-doctor-contract | 2026-08-15 |
| 162 | Prove overlapping Doctor probes clean distinct isolated resources | CORE-COMPONENT-260812-repository-doctor-contract | 2026-08-15 |
| 163 | Permit result-candidate finalization recovery only after exact inactive proof | ADR-260811-prototype-three-recovery-concurrency | 2026-08-15 |
| 164 | Expose strict running-result candidates without bypassing unknown or contradictory boundaries | CORE-COMPONENT-260811-run-reconciliation-control | 2026-08-15 |
| 165 | Use candidate head and PR only for bounded completion observations | CORE-COMPONENT-260811-completion-evidence-reconciliation | 2026-08-15 |
| 166 | Prohibit cleanup from result candidates or absent and malformed tmux evidence | CORE-COMPONENT-260811-owned-resource-cleanup | 2026-08-15 |
