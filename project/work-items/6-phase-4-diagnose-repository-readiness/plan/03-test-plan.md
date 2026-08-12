# Test Plan: Phase 4: Diagnose repository readiness

## Test V-1: Repository check completeness

- **Type:** Unit and disk-backed integration
- **Task:** T-1, T-2, T-5
- **Acceptance Criteria:** AC-1
- **Priority:** Critical

### Setup
Create temporary non-repository, primary-worktree, linked-worktree, malformed/ambiguous remote, and controlled-default-branch repositories with fake bounded Git commands.

### Steps
1. Invoke Doctor for each fixture through application composition.
2. Assert the ordered repository IDs are membership, primary worktree, common directory, GitHub identity, and default branch.
3. Fail each observation independently and assert all five entries remain present with concrete remediation.

### Expected Result
Every repository prerequisite has its own deterministic passed/failed result; no repository failure aborts the complete report.

### Expected Evidence
Five-ID assertions, temporary-repository command traces, and failure snapshots for each repository ID.

## Test V-2: Required commands, authentication, and usability

- **Type:** Adapter contract
- **Task:** T-2, T-5
- **Acceptance Criteria:** AC-2
- **Priority:** Critical

### Setup
Supply controlled PATH directories and argument-recording fake `git`, `gh`, `tmux`, `node`, and `copilot` executables. Provide configurable auth/version exits, output, launch errors, malformed output, and delays.

### Steps
1. Exercise each executable as present and absent/non-executable.
2. Exercise GitHub authentication and Copilot usability as success, nonzero, timeout, and launch failure.
3. Assert exact argument arrays, discovered host, cwd, 2-second bound, shell false, redaction, and no retry.
4. Assert all seven IDs remain in every report.

### Expected Result
Five presence checks and two authentication/usability checks report independently through bounded shell-free adapters.

### Expected Evidence
Seven-ID matrix, recorded command specs, timeout counts of one, and redacted failure outputs.

## Test V-3: Soft Factory compatibility matrix

- **Type:** Unit and filesystem/Git integration
- **Task:** T-1, T-3
- **Acceptance Criteria:** AC-3
- **Priority:** Critical

### Setup
Create temporary repositories with variants of `.soft-factory/config.yml`, `.github/agents/rpiv.agent.md`, root paths, symlinks, permissions, and `.gitignore`; use controlled `git check-ignore --no-index`.

### Steps
1. Test RPIV existence, `runner_protocol: 1`, strict configuration, worktree root, state writability, both ignore checks, and `agent-result-v1` separately.
2. Exercise absent/wrong protocol and result metadata, unknown config keys, path escape/overlap/file/symlink cases, nonwritable probes, ignore negation, and probe cleanup failure.
3. Assert eight compatibility entries always appear and probes preserve fixture bytes.

### Expected Result
All eight Section 19 compatibility checks are explicit and fail safe on missing or ambiguous evidence.

### Expected Evidence
Eight-ID pass/fail table, exact ignore command traces, and before/after filesystem manifests.

## Test V-4: Runtime-safety inventory and reversible probes

- **Type:** Disk-backed integration
- **Task:** T-4, T-5
- **Acceptance Criteria:** AC-4
- **Priority:** Critical

### Setup
Build fixtures containing valid and malformed recognized v1-v3 snapshots/events, owner locks, slot leases, unrelated files, numeric `.trees` paths, Git worktree registrations, permission failures, and exclusive probe collisions.

### Steps
1. Verify valid exact ownership, readable state, interpretable locks, and path probes pass.
2. Isolate unknown/mismatched worktree ownership, unreadable/malformed/unsupported state, malformed locks, create failure, and cleanup failure.
3. Hash files before and after; record every filesystem/Git mutation call.

### Expected Result
Four runtime checks are always reported; ambiguity fails, unrelated names are ignored, and no owned resource or unrelated byte changes.

### Expected Evidence
Four-ID result matrix, strict parser assertions, unchanged hashes, and operation trace limited to exact temporary probe create/remove.

## Test V-5: Human and JSON schema parity

- **Type:** Renderer contract
- **Task:** T-1, T-5
- **Acceptance Criteria:** AC-5
- **Priority:** Critical

### Setup
Construct complete typed all-pass, mixed-failure, dependency-failure, null-repository, and escaped-message Doctor results.

### Steps
1. Render each result in human and JSON modes.
2. Parse schema-v1 JSON and normalize human check lines and failure details.
3. Compare ordered IDs, statuses, blocking values, readiness, repository fields, messages, and remediations.
4. Assert failures alone contain nonempty message/remediation and every entry has `blocking: true`.

### Expected Result
Both modes represent the same complete 24-check meaning from one typed result; JSON has every required schema-v1 field.

### Expected Evidence
Golden outputs, JSON schema assertions, and zero semantic parity diffs.

## Test V-6: Readiness decisions, remediation, and exits

- **Type:** Service and CLI integration
- **Task:** T-5
- **Acceptance Criteria:** AC-6
- **Priority:** Critical

### Setup
Use one all-pass manifest and parameterized manifests with each blocking ID failed.

### Steps
1. Invoke human and JSON Doctor for all-pass and each failure.
2. Assert exact `STATUS: READY`, `ready: true`, and exit 0 for all pass.
3. Assert exact `STATUS: NOT READY`, `ready: false`, and exit 3 for every failure case.
4. Assert each failed entry identifies the prerequisite and concrete corrective action; assert invalid syntax exits 2.

### Expected Result
Readiness is exactly the conjunction of all blocking checks, with actionable complete reports and stable exits.

### Expected Evidence
Decision-table results for 25 cases, exact status lines/booleans, nonempty remediation assertions, and exit-code records.

## Test V-7: Repository-only boundary and no issue selection

- **Type:** Boundary and documentation test
- **Task:** T-1, T-5, T-7
- **Acceptance Criteria:** AC-7
- **Priority:** Critical

### Setup
Compose Doctor with issue/GitHub issue methods replaced by throwing tripwires and seed backlog-like issue data that must remain inaccessible.

### Steps
1. Run ready and blocked Doctor modes.
2. Assert zero issue-number input, issue API calls, issue parsing, prioritization, branch planning, lock acquisition, or run creation.
3. Assert help, README, and Phase 4 guide state the repository-only boundary and distinguish ambient `harness doctor`.

### Expected Result
Doctor diagnoses only repository readiness and cannot select, rank, or assess an issue.

### Expected Evidence
Zero-call tripwire counters, zero owned-resource operation trace, and passing documentation assertions.

## Test V-8: Ready and blocked fixture manifests

- **Type:** End-to-end fixture contract
- **Task:** T-6
- **Acceptance Criteria:** AC-8
- **Priority:** Critical

### Setup
Define ready and blocked manifests with schema, repository fields, readiness, and all 24 expected check entries. Route controlled adapters through normal application composition and the built CLI.

### Steps
1. Validate manifest completeness, order, uniqueness, and failure details before invoking Doctor.
2. Run human and JSON modes for both fixtures.
3. Compare each output with its manifest and compare normalized human meaning with JSON.
4. Repeat to prove deterministic results and no fixture mutation.

### Expected Result
Both configured fixtures declare and produce every check, and human/JSON outcomes and readiness decisions are identical.

### Expected Evidence
Tracked manifests, four captured outputs, semantic parity reports, repeat-run equality, and unchanged fixture manifests.

## Test V-9: Every-check pass/fail coverage

- **Type:** Parameterized acceptance matrix
- **Task:** T-2, T-3, T-4, T-6
- **Acceptance Criteria:** AC-9
- **Priority:** Critical

### Setup
Index fixture manifests by canonical `DoctorCheckId`; include the ready fixture and one isolated failing variant for every ID across repository, command, authentication, compatibility, and runtime-safety categories.

### Steps
1. Generate a matrix mapping each of 24 IDs to at least one passing and one failing fixture.
2. Fail validation on a missing ID, duplicate ID, absent pass, or absent fail.
3. Execute every variant and compare actual status, readiness, details, and side-effect trace to the manifest.

### Expected Result
All 24 checks have deterministic positive and negative proof with no live external dependency.

### Expected Evidence
Machine-checked 24-row pass/fail matrix and passing parameterized suite naming both fixture witnesses per ID.

## Test V-10: Controlled ready-fixture process timing

- **Type:** Built-process performance acceptance
- **Task:** T-2, T-5, T-6
- **Acceptance Criteria:** AC-10
- **Priority:** Critical

### Setup
Build the CLI, create the complete ready repository fixture, prepend controlled local fake external commands to PATH, and control all network-like responses without credentials or internet access.

### Steps
1. Record monotonic time immediately before spawning the built `soft-factory doctor --json` process.
2. Wait for process exit and record elapsed wall-clock milliseconds.
3. Assert exit 0, `ready: true`, 24 passed checks, elapsed `<= 10,000 ms`, and no process survives.
4. Separately inject delays to prove 2-second per-probe and 9-second aggregate timeout behavior still emits 24 checks and NOT READY.

### Expected Result
The controlled ready invocation completes through process exit within ten seconds; timeout paths remain bounded and complete.

### Expected Evidence
Build output, process command/environment manifest, monotonic elapsed measurement, exit/result capture, and timeout-bound assertions.

## Test V-11: Documentation and delivery quality gates

- **Type:** Documentation, regression, and project validation
- **Task:** T-7
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10
- **Priority:** High

### Setup
Complete all implementation and documentation updates, including README, docs index, Phase 1 cross-reference, Phase 4 guide, CLI help, RPIV metadata, and documentation assertions.

### Steps
1. Run Doctor documentation/help smoke tests and inspect every AC-specific assertion.
2. Run `just verify-focused` during implementation and `just verify` before handoff.
3. Run `harness checks --focused --json` and `harness checks --json`; inspect envelope status, delegated command, exit, and evidence.
4. Confirm global statement/branch/function/line coverage remains at least 80 percent, `git diff --check` passes, root justfile remains command authority, and product dependencies do not include the harness.

### Expected Result
All behavior, fixtures, timing, boundaries, and affected application documentation pass root and harness validation without changing product scope.

### Expected Evidence
Passing documentation tests, focused/full root logs, successful harness JSON envelopes, coverage summary, diff-check output, and dependency inspection.
