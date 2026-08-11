# Test Plan: Phase 1 Issue Run

All automated tests are deterministic and credential-free. Temporary roots isolate fixtures from `/workspaces/soft-factory-runner/.trees/3`. Implement runs focused checks during tasks and the full root `just verify` gate before handoff.

## Test V-1: CLI and side-effect ordering

- **Type:** Unit / orchestration
- **Task:** T-1, T-2
- **Acceptance Criteria:** AC-1, AC-8
- **Priority:** Critical

### Setup
Compose the application with recording adapters and valid/invalid command inputs.

### Steps
1. Invoke malformed commands, zero/negative/non-numeric issues, a repository failure, and an issue failure.
2. Invoke one valid readiness path.
3. Compare the ordered adapter calls to the owned-resource operation set.

### Expected Result
Invalid input returns a stable non-zero actionable error. Repository and issue readiness precede lock/state/branch/worktree/tmux/Copilot operations; invalid paths perform none of those avoidable side effects.

### Expected Evidence
Jest table output, CLI error snapshots, and an adapter transcript whose first owned-resource call follows all read-only checks.

## Test V-2: Complete issue-readiness failure matrix

- **Type:** Unit / adapter contract
- **Task:** T-2
- **Acceptance Criteria:** AC-1, AC-8
- **Priority:** Critical

### Setup
Build GitHub fixtures for nonexistent, closed, blocked, conflicting, and AC-incomplete issues, plus bounded-query failures.

### Steps
1. Test nonexistent and closed issues.
2. Test an open blocked-by relationship and case-insensitive `blocked` label.
3. Test an open PR closing the issue and an open PR using the planned branch.
4. Test missing, duplicate, malformed, and empty marker-wrapped checkbox blocks.
5. Test ambiguous type labels, timeout, malformed response, and incomplete pagination.

### Expected Result
Every case fails non-zero with a distinct stable code or structured detail and a concrete remediation. No lock or downstream resource is created. Closed/merged unrelated PRs do not conflict.

### Expected Evidence
Named table rows for every category, expected error/remediation snapshots, complete pagination assertions, and a zero-owned-operation counter.

## Test V-3: Fetched latest-base proof and actionable blocking

- **Type:** Unit / integration
- **Task:** T-2, T-3
- **Acceptance Criteria:** AC-3, AC-8
- **Priority:** Critical

### Setup
Provide temporary local remotes and recording Git adapters for each remote/default resolution outcome.

### Steps
1. Exercise explicit Runner remote, `remote.pushDefault`, current-branch remote, and sole-remote precedence.
2. Fetch, resolve advertised HEAD branch/SHA, and inspect the fetched tracking SHA.
3. Exercise fetch failure, ambiguous remote, missing HEAD, configured-base disagreement, absent tracking ref, SHA mismatch, timeout, and malformed output.
4. Inspect branch/worktree call counts.

### Expected Result
Only equal advertised and tracking SHAs produce `FetchedBaseProofV1`. Every unproved base blocks actionably before branch/worktree creation.

### Expected Evidence
Serialized proof with remote/default/two SHAs/fetchedAt/matches, Git command trace, and zero branch/worktree calls for each failed case.

## Test V-4: Conventional branch type and exact ancestry

- **Type:** Git integration
- **Task:** T-2, T-3
- **Acceptance Criteria:** AC-3, AC-4
- **Priority:** Critical

### Setup
Create a temporary remote whose default tip is known, an Issue #3 fixture with `feature`, and the configured allowed-type map.

### Steps
1. Complete fetched-base proof.
2. Start branch preparation.
3. Inspect branch name and resolve its commit SHA/merge-base.
4. Test absent, disallowed, and conflicting type mappings.

### Expected Result
The branch is `feat/3-<deterministic-slug>`, starts exactly at the proven remote SHA, and uses no local default-branch ref. Invalid intent mappings block.

### Expected Evidence
Branch command argv, `git rev-parse`/merge-base output, and error snapshots for rejected type mappings.

## Test V-5: Owned resource set and unknown outer-worktree protection

- **Type:** Filesystem / Git integration
- **Task:** T-3, T-4
- **Acceptance Criteria:** AC-2, AC-3, AC-4
- **Priority:** Critical

### Setup
Use one clean temporary repository and fixtures for existing directory, registered worktree, branch, lock, snapshot, and tmux mismatches. Include the ambient-style `.trees/3` path without Runner ownership.

### Steps
1. Run the clean valid fixture through tmux preparation.
2. Count lock, branch, worktree, snapshot, and window resources.
3. Run each unknown/mismatched resource fixture.
4. Compare pre/post filesystem and Git observations.

### Expected Result
The clean run has exactly one complete owned set. Unknown resources block without modification/removal; fetched proof is persisted before branch/worktree creation.

### Expected Evidence
Resource inventory, parsed lock/snapshot/events, operation-order trace, and unchanged checksums/listings for unknown `.trees/3` fixtures.

## Test V-6: Atomic same-issue concurrency

- **Type:** Concurrency integration
- **Task:** T-3, T-6
- **Acceptance Criteria:** AC-9, AC-2
- **Priority:** Critical

### Setup
Use a temporary real filesystem lock path, two application instances, a start barrier, and shared recording downstream adapters.

### Steps
1. Release both `run --issue 3` calls simultaneously after readiness.
2. Await both bounded results.
3. Inspect lock owner and downstream operation multiplicity.
4. Repeat enough times to expose scheduling variation without using sleeps as proof.

### Expected Result
Exactly one invocation owns the lock and creates one downstream resource set; the other returns actionable `ISSUE_ALREADY_OWNED`. No duplicate owner appears.

### Expected Evidence
Per-iteration winner/loser results, one parsed owner record, and counters equal to one for branch/worktree/run/window/launch.

## Test V-7: Visible tmux-to-RPIV execution

- **Type:** Adapter integration
- **Task:** T-4, T-5
- **Acceptance Criteria:** AC-2, AC-5
- **Priority:** Critical

### Setup
Provide a fake tmux process boundary that models session/window/pane observations and captures pane startup/output while using a temporary worktree.

### Steps
1. Prepare the repository session and issue window.
2. Launch the internal worker in the issue pane.
3. Observe pane cwd, command, identity, and startup marker.
4. Query status while the worker is active.

### Expected Result
One issue window is rooted in the isolated worktree; the internal worker and RPIV launch remain represented in the visible pane; status reports the active observation.

### Expected Evidence
Tmux argv/cwd transcript, session/window/pane facts, captured pane-visible marker, and running status snapshot.

## Test V-8: Exact Copilot name and telemetry on every launch

- **Type:** Unit / property table
- **Task:** T-4
- **Acceptance Criteria:** AC-6
- **Priority:** Critical

### Setup
Parameterize owner/repository strings, issue numbers, and repeated Copilot launches through a recording process adapter.

### Steps
1. Normalize each owner-qualified repository.
2. Trigger every launch path.
3. Inspect each Copilot argv and child environment.
4. Assert ambient OTEL values cannot alter the exact child value.

### Expected Result
Every invocation contains exact `--name issue-<number>` and exact `OTEL_RESOURCE_ATTRIBUTES=project.name=<normalized-project>,issue.id=issue-<number>`; Issue #3 resolves to `jsburckhardt-soft-factory-runner` and `issue-3`.

### Expected Evidence
Parameterized launch records and exact-equality assertions for argv and environment on every call.

## Test V-9: Status and issue-only attach resolution

- **Type:** Unit / adapter integration
- **Task:** T-5
- **Acceptance Criteria:** AC-7, AC-5
- **Priority:** High

### Setup
Create snapshots for every Phase 1 state and matching/mismatching tmux observations.

### Steps
1. Render human and JSON status for each state.
2. Invoke `attach 3` without tmux identifiers against a matching snapshot/window.
3. Exercise absent/malformed snapshot, absent/mismatched window/pane, timeout, and ambiguous observation.
4. Inspect all mutation/launch counters.

### Expected Result
Status renderers share identical structured facts. Attach resolves and verifies the recorded target using only issue 3. Ambiguity blocks without launch, cleanup, or recovery.

### Expected Evidence
Human/JSON golden files, attach transcript naming the recorded target, stable failure snapshots, and zero forbidden-operation counters.

## Test V-10: Deterministic issue-to-RPIV end-to-end fixture

- **Type:** End-to-end fixture
- **Task:** T-6
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-9, AC-10
- **Priority:** Critical

### Setup
Compose the normal CLI/application with declarative Issue #3 GitHub facts, controlled clock/IDs, temporary repository/filesystem, and deterministic GitHub/tmux/process adapters. Do not use live credentials or ambient `.trees/3`.

### Steps
1. Invoke `run --issue 3` with the `feature` label and ten valid criteria.
2. Capture validation, ownership, fetch/proof, snapshot, branch/worktree, tmux, worker, and Copilot operations.
3. Invoke status and attach with issue 3.
4. Repeat with identical controlled inputs and compare normalized records.
5. Inspect fixture interfaces for any code-editing, solution-selection, or prose-interpretation hook.

### Expected Result
The trace proves the complete ordered path and exact resource multiplicity, ancestry, cwd, telemetry/name, status, and attach behavior. Repeated runs are deterministic. Runner only orchestrates; RPIV receives the delivery prompt and owns implementation decisions.

### Expected Evidence
Checked-in expected transcript/golden snapshot, deterministic comparison, resource counters, and interface assertion showing no implementation-decision capability.

## Test V-11: Snapshot, events, and bounded Phase 1 exits

- **Type:** Persistence / state unit test
- **Task:** T-3, T-4, T-5
- **Acceptance Criteria:** AC-2, AC-7, AC-10
- **Priority:** High

### Setup
Use controlled clock/IDs, atomic filesystem instrumentation, and worker exit fixtures.

### Steps
1. Drive every preparation transition through `running_rpiv`.
2. Interrupt snapshot replacement before rename and inspect the prior file.
3. Exit Copilot non-zero and zero in separate runs.
4. Query status and inspect events.

### Expected Result
Snapshots remain schema-versioned and atomic; events are ordered append-only records. Non-zero exit is failed, zero exit is interrupted pending Prototype 2, and no path reports completed.

### Expected Evidence
Parsed snapshot/event sequences, interrupted-write proof retaining the last valid snapshot, and status snapshots for both exit outcomes.

## Test V-12: Documentation and full quality gate

- **Type:** Documentation / regression
- **Task:** T-7
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10
- **Priority:** High

### Setup
Build the CLI and deterministic fixture after updating root and application documentation.

### Steps
1. Verify documented run/status/attach/help commands against the fixture.
2. Check configuration precedence, base proof, type mapping, telemetry, blockers, ownership, outer-worktree behavior, state limits, and fixture guidance against implementation.
3. Confirm completion/recovery/resume/stop/clean/scheduling are marked deferred.
4. Run `just verify-focused` and `just verify`.

### Expected Result
Documentation matches Phase 1 behavior and all safe examples execute. Lint, format, type, tests/coverage, build, and diff checks pass with at least 80% global coverage.

### Expected Evidence
Documentation review checklist mapped to AC-1 through AC-10, command transcripts, full gate output, coverage summary, and clean `git diff --check`.
