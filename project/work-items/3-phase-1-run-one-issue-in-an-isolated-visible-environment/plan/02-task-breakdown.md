# Task Breakdown: Phase 1 Issue Run

Tasks are ordered by dependency. Implement records completion and AC evidence in `project/work-items/3-phase-1-run-one-issue-in-an-isolated-visible-environment/implementation/00-implementation.md` and validates through root `justfile` recipes.

## Task T-1: Establish CLI, domain, configuration, and adapter seams

- **Status:** Complete
- **Complexity:** Large
- **Dependencies:** None
- **Acceptance Criteria:** AC-1, AC-8, AC-10
- **Related ADRs:** ADR-260810-typescript-node-cli; ADR-260811-prototype-one-run-orchestration
- **Related Core-Components:** CORE-COMPONENT-260810-development-standards; CORE-COMPONENT-260810-error-handling; CORE-COMPONENT-260810-subprocess-execution; CORE-COMPONENT-260811-issue-run-orchestration

### Description
Replace bootstrap-only dispatch with strict parsing for `run --issue <positive-integer>`, `status <issue>`, `attach <issue>`, and the private internal worker. Define named TypeScript domain exports for repository identity, issue readiness, states, owned resources, fetched-base proof, status facts, and stable error codes. Add explicit application composition and typed ports for Git, GitHub, tmux, subprocess, filesystem, clock, and ID generation. Resolve minimal Runner/Git configuration precedence and one shared human/JSON rendering boundary without introducing a production test switch.

### Acceptance Criteria
- AC-1 input and read-only validation can complete before any owned-resource adapter operation.
- AC-8 malformed commands and issue values return non-zero stable actionable errors.
- AC-10 adapters expose operational facts only; no interface asks Runner to select or implement a software solution.

### Test Coverage
- Unit-test every exported parser, normalizer, configuration resolver, state/error mapping, and renderer.
- Assert zero adapter calls for malformed CLI input and deterministic owner-qualified project normalization.
- Run `just verify-focused` for the new modules and preserve the 80% global thresholds for full validation.

### Expected Evidence
- Focused Jest report and coverage lines for all exported behavior.
- Parser/error snapshots, adapter interface types, and a call trace proving malformed input has no side effects.
- Implementation note listing command grammar and configuration precedence.

## Task T-2: Implement repository, issue, conflict, and fetched-base readiness

- **Status:** Complete
- **Complexity:** Large
- **Dependencies:** T-1
- **Acceptance Criteria:** AC-1, AC-3, AC-4, AC-8, AC-10
- **Related ADRs:** ADR-260811-prototype-one-run-orchestration
- **Related Core-Components:** CORE-COMPONENT-260505-commit-standards; CORE-COMPONENT-260810-error-handling; CORE-COMPONENT-260810-subprocess-execution; CORE-COMPONENT-260811-issue-run-orchestration

### Description
Implement read-only repository discovery and issue readiness before ownership. Require an existing open issue; one nonempty marker-wrapped checkbox block; no open blocked-by relationships or `blocked` label; and no open PR closing the issue or using the planned branch. Resolve intended branch type from exactly one configured label mapping (`feature` to `feat` for Issue #3). Enforce bounded complete GitHub queries. After ownership is available from T-3 orchestration, resolve the configured remote, fetch it, discover advertised HEAD, compare its SHA to the fetched tracking ref, and return `FetchedBaseProofV1`. Keep proof logic isolated so T-3 can persist it before branch/worktree creation.

### Acceptance Criteria
- AC-1 repository and issue checks occur before owned-resource creation.
- AC-3 fetch occurs before branch/worktree calls; unproved latest base blocks actionably.
- AC-4 the selected type is allowed and reflects the unambiguous configured issue label.
- AC-8 every named invalid category, timeout, pagination gap, and ambiguity has a stable non-zero outcome and remediation.
- AC-10 readiness makes deterministic operational classifications only.

### Test Coverage
- Table-test invalid syntax/nonexistent issue, closed state, open blocker, blocked label, closing-PR conflict, planned-branch conflict, missing/duplicate/malformed/empty AC blocks, ambiguous type labels, timeout, malformed response, and incomplete pagination.
- Test remote precedence, missing/ambiguous remotes, fetch failure, missing symbolic HEAD, configured-base disagreement, missing tracking ref, and SHA mismatch.
- Assert failed proof has zero branch/worktree calls and successful proof contains both equal SHAs and fetch timestamp.

### Expected Evidence
- Table-driven Jest output naming every invalid category and stable code/remediation.
- Ordered adapter transcript with fetch and proof before resource creation.
- Serialized `FetchedBaseProofV1` fixture for the amended Issue #3 facts.

## Task T-3: Implement atomic ownership, persisted state, branch, and worktree

- **Status:** Complete
- **Complexity:** Large
- **Dependencies:** T-1, T-2
- **Acceptance Criteria:** AC-2, AC-3, AC-4, AC-7, AC-9, AC-10
- **Related ADRs:** ADR-260811-prototype-one-run-orchestration
- **Related Core-Components:** CORE-COMPONENT-260810-issue-worktree-locking; CORE-COMPONENT-260810-persistence-recovery; CORE-COMPONENT-260810-structured-events; CORE-COMPONENT-260810-error-handling; CORE-COMPONENT-260811-issue-run-orchestration

### Description
Acquire `.soft-factory/locks/<issue>.lock` with exclusive-create semantics after read-only readiness. Create a schema-versioned owner/run identity, atomic `RunSnapshotV1`, and append-only transition events. Integrate T-2 fetched proof, persist it before invoking branch creation, create the Conventionally typed branch from the exact SHA, and add `.trees/<issue>`. Re-observe resources under lock and block without mutation when any existing branch, path, registered worktree, lock, or snapshot lacks matching ownership. Explicitly preserve the ambient outer `.trees/3` collision; fixtures use temporary roots.

### Acceptance Criteria
- AC-2 one successful run owns exactly one lock, branch, isolated worktree, and run record before tmux preparation.
- AC-3 snapshot proof precedes branch/worktree calls and proof failure creates neither.
- AC-4 branch creation consumes the proven SHA and allowed mapped type.
- AC-7 state snapshots provide the authoritative persisted half of status.
- AC-9 concurrent acquisition has exactly one winner and one downstream resource set.
- AC-10 all ownership decisions derive from supplied recorded/observed facts.

### Test Coverage
- Unit-test exclusive creation, atomic snapshot replacement, schema validation, event append order, and error cleanup/release rules.
- Use a barrier-controlled real filesystem concurrency test with two starts and assert one winner.
- Test unknown directory, registered outer worktree, existing branch, mismatched snapshot, and stale/ambiguous lock preservation with no modify/remove calls.
- Integration-test branch parent SHA and worktree registration against a temporary local Git fixture.

### Expected Evidence
- Two-start result showing one owner and one `ISSUE_ALREADY_OWNED` error.
- Filesystem listing and parsed lock/snapshot/event records with one owner identity.
- Git proof that branch parent/start SHA equals `advertisedHeadSha`; trace showing no mutation of unknown `.trees/3`.

## Task T-4: Implement visible tmux worker and exact Copilot launch

- **Status:** Complete
- **Complexity:** Large
- **Dependencies:** T-3
- **Acceptance Criteria:** AC-2, AC-5, AC-6, AC-10
- **Related ADRs:** ADR-260811-prototype-one-run-orchestration
- **Related Core-Components:** CORE-COMPONENT-260810-subprocess-execution; CORE-COMPONENT-260810-issue-worktree-locking; CORE-COMPONENT-260810-persistence-recovery; CORE-COMPONENT-260810-structured-events; CORE-COMPONENT-260811-issue-run-orchestration

### Description
Create/reconcile the normalized repository tmux session and one owned issue-number window rooted at the isolated worktree. Launch the internal worker visibly in that pane. Have the worker invoke Copilot through validated argv with `--yolo`, exact `--name issue-<number>`, `--agent rpiv`, and configured prompt, while setting the exact normalized OTEL resource attributes. Persist tmux IDs and launch facts, append transitions, and record worker exit: non-zero as failed and zero as interrupted pending Prototype 2 completion proof.

### Acceptance Criteria
- AC-2 one successful preparation records exactly one owned tmux window.
- AC-5 the RPIV worker and visible output run from the isolated worktree pane.
- AC-6 every Copilot call has exact issue name and OTEL attributes using the normalized owner/repository identity.
- AC-10 Runner passes the issue prompt to RPIV and never performs implementation work itself.

### Test Coverage
- Unit-test tmux session/window names, validated argv, cwd, environment allowlist, pane IDs, and launch-state persistence.
- Parameterize multiple repositories/issues and multiple launch attempts to assert exact OTEL and `--name` on every Copilot call.
- Test tmux/window conflict, launch failure, non-zero exit, and zero-exit interrupted classification.
- Adapter integration test captures a pane-visible startup marker and command transcript.

### Expected Evidence
- Captured tmux call with worktree cwd, session/window/pane identity, and internal-worker command.
- Captured Copilot argv/environment showing exact `issue-3` and `project.name=jsburckhardt-soft-factory-runner,issue.id=issue-3`.
- Snapshot/events showing `running_rpiv` and bounded exit outcomes without `completed`.

## Task T-5: Implement current status and issue-only attach

- **Status:** Complete
- **Complexity:** Medium
- **Dependencies:** T-3, T-4
- **Acceptance Criteria:** AC-5, AC-7, AC-10
- **Related ADRs:** ADR-260811-prototype-one-run-orchestration
- **Related Core-Components:** CORE-COMPONENT-260810-structured-events; CORE-COMPONENT-260810-persistence-recovery; CORE-COMPONENT-260810-error-handling; CORE-COMPONENT-260811-issue-run-orchestration

### Description
Implement `status <issue>` and JSON output from a common structured result containing persisted state plus separately labeled bounded tmux observation. Implement `attach <issue>` so the issue number loads the owned snapshot, verifies the observed session/window/pane identity, and calls tmux attach/select without requiring user tmux IDs. Block missing, malformed, mismatched, timed-out, or ambiguous state; do not perform recovery or relaunch.

### Acceptance Criteria
- AC-5 status can show the recorded visible issue window while RPIV is running.
- AC-7 status reports current persisted and observed facts; attach resolves and verifies the correct target from only the issue number.
- AC-10 inspection and attachment do not interpret RPIV output or make implementation decisions.

### Test Coverage
- Test each Phase 1 state in human and JSON rendering from identical facts.
- Test issue-only happy-path attach and missing snapshot/window, mismatched owner/IDs, timeout, malformed tmux output, and ambiguous observations.
- Assert status/attach never launch, recover, clean, or modify run resources.

### Expected Evidence
- Human and JSON status golden outputs carrying the same state and observation.
- Attach adapter trace from issue 3 to the recorded session/window/pane with no caller-supplied tmux ID.
- Stable actionable errors for every missing/ambiguous target case.

## Task T-6: Build deterministic full orchestration proof

- **Status:** Complete
- **Complexity:** Large
- **Dependencies:** T-1, T-2, T-3, T-4, T-5
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10
- **Related ADRs:** ADR-260810-typescript-node-cli; ADR-260811-prototype-one-run-orchestration
- **Related Core-Components:** CORE-COMPONENT-260810-development-standards; CORE-COMPONENT-260810-error-handling; CORE-COMPONENT-260810-issue-worktree-locking; CORE-COMPONENT-260810-subprocess-execution; CORE-COMPONENT-260810-persistence-recovery; CORE-COMPONENT-260810-structured-events; CORE-COMPONENT-260811-issue-run-orchestration

### Description
Create declarative fixture builders and deterministic adapters through normal application composition. Drive the real CLI/application orchestration from Issue #3 facts in a temporary repository root and capture the complete ordered operation trace. Prove validation, ownership, fetch/latest-base equality, typed branch/worktree, visible tmux worker, exact Copilot telemetry/name, state/status/attach, invalid matrices, and concurrency. The fixture supplies external facts only; it exposes no callback for Runner to choose implementation content.

### Acceptance Criteria
- AC-1 through AC-9 are demonstrated in one coherent fixture suite plus focused edge-case tests.
- AC-10 the end-to-end path is deterministic, credential-free, repeatable, and contains no Runner implementation-decision interface.

### Test Coverage
- Execute V-1 through V-11 from the test plan, including the complete end-to-end transcript and real temporary filesystem/Git boundaries where safe.
- Assert exact operation multiplicity and order, no ambient `.trees/3` access, no shell interpolation, and no unexpected external call.
- Run `just verify-focused`, then `just verify`; meet at least 80% statements, branches, functions, and lines.

### Expected Evidence
- End-to-end fixture transcript with one lock/branch/worktree/run/window/Copilot launch and exact ordering.
- Repeat-run deterministic snapshots after normalizing only controlled clock/ID values.
- Focused and full validation output, coverage summary, and `git diff --check` success.

## Task T-7: Document Phase 1 commands, contracts, and deferrals

- **Status:** Complete
- **Complexity:** Medium
- **Dependencies:** T-1, T-2, T-3, T-4, T-5, T-6
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10
- **Related ADRs:** ADR-260811-prototype-one-run-orchestration
- **Related Core-Components:** CORE-COMPONENT-260806-rpiv-stage-contract; CORE-COMPONENT-260806-project-command-interface; CORE-COMPONENT-260811-issue-run-orchestration

### Description
Add `docs/phase-1-issue-run.md` covering prerequisites, command syntax, minimal configuration and remote/default precedence, feature-label type mapping, state files, fetched-base proof, lock/resource names, tmux visibility, exact telemetry, status/attach, all actionable blockers, outer worktree collision behavior, and deterministic fixture usage. Update `docs/README.md` and root `README.md` links/examples. State plainly that completion proof, recovery, resume, stop, clean, post-launch PR reconciliation, and scheduling are deferred.

### Acceptance Criteria
- AC-1 through AC-10 have discoverable operator or contributor documentation matching implemented behavior and evidence commands.
- Documentation never implies that Phase 1 reports completed or safely reuses unknown resources.

### Test Coverage
- Add documentation assertions or CLI help golden tests for command examples and stable error/remediation names where practical.
- Execute every safe documented command against the deterministic fixture or temporary repository.
- Include documentation review in `just verify-focused` and `just verify` handoff evidence.

### Expected Evidence
- Committed `docs/phase-1-issue-run.md`, updated documentation indexes, and exact CLI help output.
- Checklist mapping every AC to its documented behavior and troubleshooting entry.
- Implementation note recording documentation validation and later-phase deferrals.
