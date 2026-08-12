# Task Breakdown: Phase 4: Diagnose repository readiness

## Task T-1: Define Doctor contracts and compatibility configuration

- **Status:** Completed
- **Complexity:** High
- **Dependencies:** None
- **Acceptance Criteria:** AC-1, AC-3, AC-5, AC-7
- **Related ADRs:** ADR-260812-repository-doctor-readiness; ADR-260810-typescript-node-cli
- **Related Core-Components:** CORE-COMPONENT-260812-repository-doctor-contract; CORE-COMPONENT-260810-error-handling; CORE-COMPONENT-260810-structured-events

### Description
- Add a dedicated Doctor domain module with the closed ordered `DoctorCheckId` vocabulary, `DoctorCheckResultV1`, `DoctorResultV1`, repository facts, dependency relationships, and pure readiness aggregation.
- Extend strict configuration with required `protocol_version: 1` plus `repository.worktree_root` and `repository.state_root` defaults and validations. Reject unknown configuration keys so configuration validity is meaningful.
- Define parsable RPIV frontmatter metadata `runner_protocol: 1` and `result_contract: agent-result-v1`; update the installed `.github/agents/rpiv.agent.md` metadata without changing stage behavior.
- Add stable Doctor adapter/result errors without routing individual failed prerequisites through the existing fail-fast CLI error renderer.

### Acceptance Criteria
- **AC-1:** The model contains separate repository IDs for all five repository checks.
- **AC-3:** Protocol, configuration, roots, RPIV asset, ignore, writable state, and result contract remain distinct typed checks.
- **AC-5:** The result type requires all schema-v1 fields and the canonical ordered 24-ID set with explicit blocking values.
- **AC-7:** No Doctor input or port includes an issue number or issue query capability.

### Test Coverage
- Unit-test ID order/uniqueness, dependency completion, all-pass readiness, one-failure readiness, nullable repository facts, strict protocol/root parsing, unknown keys, traversal/absolute/overlap cases, and RPIV metadata schemas.
- Compile-time and runtime fixtures must reject missing check entries and unsupported protocol/result metadata.

### Expected Evidence
- Passing `doctor` and configuration unit suites.
- Snapshot or exact-array assertion of 24 unique IDs in canonical order.
- Tests proving configuration and metadata failures map to their dedicated check rather than aborting the report.

## Task T-2: Implement bounded repository, executable, and authentication adapters

- **Status:** Completed
- **Complexity:** High
- **Dependencies:** T-1
- **Acceptance Criteria:** AC-1, AC-2, AC-9, AC-10
- **Related ADRs:** ADR-260812-repository-doctor-readiness; ADR-260811-prototype-one-run-orchestration
- **Related Core-Components:** CORE-COMPONENT-260812-repository-doctor-contract; CORE-COMPONENT-260810-subprocess-execution; CORE-COMPONENT-260810-error-handling

### Description
- Add Doctor-specific Git observations that independently report membership, primary worktree, common directory, GitHub identity, and default branch without collapsing failures into `REPOSITORY_INVALID`.
- Resolve `git`, `gh`, `tmux`, `node`, and `copilot` directly from PATH with executable/access checks and no shell.
- Execute bounded, redacted argument arrays for GitHub authentication on the discovered host and Copilot usability; keep presence separate from authentication/usability.
- Share a 9-second aggregate deadline, cap each external probe at 2 seconds, run independent probes concurrently, perform one attempt, and convert timeout/launch/parse uncertainty into failed check observations.

### Acceptance Criteria
- **AC-1:** All five repository checks return independent typed observations, including dependency-failure observations.
- **AC-2:** Five command checks and two authentication/usability checks are always represented.
- **AC-9:** Each adapter supports deterministic injected pass and fail outcomes for its checks.
- **AC-10:** Bounds and safe concurrency leave the built ready fixture within ten seconds.

### Test Coverage
- Unit-test exact executables, argument arrays, cwd, host, environment allowlist, no-shell flag, timeout, redaction, PATH edge cases, default-branch parsing, GitHub URL forms, malformed output, nonzero exits, launch failures, and timeouts.
- Use fake executables and temporary Git repositories; never require ambient credentials, network, tmux, or Copilot.

### Expected Evidence
- Argument-recording adapter assertions and redacted result snapshots.
- Timeout tests proving no retries and completion of the full check array.
- Controlled fake-command traces with no shell invocation.

## Task T-3: Implement Soft Factory compatibility checks

- **Status:** Completed
- **Complexity:** High
- **Dependencies:** T-1, T-2
- **Acceptance Criteria:** AC-3, AC-9
- **Related ADRs:** ADR-260812-repository-doctor-readiness; ADR-260811-prototype-two-completion-proof
- **Related Core-Components:** CORE-COMPONENT-260812-repository-doctor-contract; CORE-COMPONENT-260811-completion-evidence-reconciliation; CORE-COMPONENT-260810-subprocess-execution

### Description
- Check the canonical RPIV asset and parse its frontmatter separately for asset existence, protocol 1, and `agent-result-v1` contract.
- Validate configuration independently from protocol compatibility and apply defaults only for worktree/state roots, not for protocol declaration.
- Resolve roots lexically and physically against the primary worktree, reject escapes/symlink/file/overlap/common-directory collisions, and use reversible writability evidence.
- Prove ignore behavior for representative descendants of configured `.trees` and state roots using exact `git check-ignore --no-index` argument arrays.

### Acceptance Criteria
- **AC-3:** Exactly eight compatibility outcomes are emitted: RPIV agent, protocol, configuration, worktree root, state-root writable, trees ignored, runtime state ignored, and result contract.
- **AC-9:** Every compatibility ID has isolated passing and failing fixtures, including ambiguity and cleanup failure.

### Test Coverage
- Matrix tests for missing/malformed/wrong RPIV metadata, missing/wrong protocol, invalid YAML/unknown keys, root path classes, permissions, ignore negation, command timeout, and result-contract values.
- Assert probes remove only their tokenized resource and preserve pre-existing files byte-for-byte.

### Expected Evidence
- Eight-ID compatibility result assertions.
- Temporary-repository ignore and symlink containment tests.
- Before/after filesystem manifests proving no persistent probe artifact.

## Task T-4: Implement conservative runtime-safety inventory

- **Status:** Completed
- **Complexity:** High
- **Dependencies:** T-1, T-3
- **Acceptance Criteria:** AC-4, AC-9
- **Related ADRs:** ADR-260812-repository-doctor-readiness; ADR-260811-prototype-three-recovery-concurrency
- **Related Core-Components:** CORE-COMPONENT-260812-repository-doctor-contract; CORE-COMPONENT-260810-persistence-recovery; CORE-COMPONENT-260810-issue-worktree-locking; CORE-COMPONENT-260811-run-reconciliation-control

### Description
- Add read-only inventory entry points that apply existing strict parsers to recognized snapshots/events and owner/lease locks while ignoring unrelated filenames.
- Enumerate numeric `.trees/<issue>` directories and Git worktree registrations, then require exact path, issue, run, owner, snapshot, and lock agreement before classifying them safe.
- Validate required path creation with exclusive tokenized probes at validated ancestors, explicit cleanup, and no writes to recognized runtime paths.
- Return all four runtime-safety checks even when one inventory dependency fails; unknown ownership, unreadable data, malformed records, and cleanup failure are blocking failures.

### Acceptance Criteria
- **AC-4:** Separate checks report `.trees` ownership, state readability, lock interpretability, and safe path creation.
- **AC-9:** Each runtime check has pass and isolated fail fixtures, with ambiguity always failing safe.

### Test Coverage
- Disk-backed fixtures for valid v1-v3 snapshots/events, unsupported/malformed/truncated recognized records, unrelated files, valid/malformed owner and lease locks, registered/unregistered/unknown/mismatched worktrees, permissions, exclusive-create collision, and cleanup failure.
- Assert zero branch/worktree removal, lock acquisition/deletion, snapshot/event mutation, issue API calls, and unrelated file changes.

### Expected Evidence
- Four-ID runtime result assertions and strict parser cases.
- Operation traces proving read-only inventory plus exact probe create/remove only.
- Before/after hashes for all recognized and unrelated fixture files.

## Task T-5: Add Doctor service, CLI dispatch, rendering, and exits

- **Status:** Completed
- **Complexity:** High
- **Dependencies:** T-2, T-3, T-4
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-10
- **Related ADRs:** ADR-260812-repository-doctor-readiness; ADR-260810-typescript-node-cli
- **Related Core-Components:** CORE-COMPONENT-260812-repository-doctor-contract; CORE-COMPONENT-260810-structured-events; CORE-COMPONENT-260810-error-handling

### Description
- Parse only `doctor` and `doctor --json`, update help, compose Doctor ports separately from issue-run ports, and dispatch without constructing or invoking issue services.
- Evaluate dependency-aware checks without fail-fast omission and always normalize exactly 24 ordered results under the aggregate deadline.
- Render human and JSON from the same `DoctorResultV1`; include repository fields, every status/blocking value, and nonempty message/remediation for failures.
- Emit exact READY/NOT READY summary lines and map complete reports to exits 0/3 while preserving syntax exit 2 and internal invariant exit 1.

### Acceptance Criteria
- **AC-1, AC-2, AC-3, AC-4:** The command reports every category and named Section 19 prerequisite.
- **AC-5:** JSON is schema version 1 and normalized human/JSON facts are equal for all 24 checks.
- **AC-6:** Any failure yields NOT READY/false/exit 3 with corrective action; all pass yields READY/true/exit 0.
- **AC-7:** Doctor has no issue-selection side effect or issue-specific output.
- **AC-10:** Service and process respect the aggregate timing budget.

### Test Coverage
- Strict parser tests for accepted/rejected grammar; service tests for dependency failures, deadline expiry, and complete order; renderer parity tests for all pass, mixed failures, null repository facts, escaping, and remediation; CLI dispatch/exit tests with an issue-port tripwire.

### Expected Evidence
- Human and JSON golden outputs generated from the same fixture result.
- Exit-code table tests and exact 24-entry assertions under failure.
- Tripwire proof of zero issue API calls and zero issue identifiers in output.

## Task T-6: Build manifest-driven pass/fail and timing fixtures

- **Status:** Completed
- **Complexity:** High
- **Dependencies:** T-5
- **Acceptance Criteria:** AC-8, AC-9, AC-10
- **Related ADRs:** ADR-260812-repository-doctor-readiness; ADR-260811-prototype-one-run-orchestration
- **Related Core-Components:** CORE-COMPONENT-260812-repository-doctor-contract; CORE-COMPONENT-260810-development-standards; CORE-COMPONENT-260811-engineering-harness-interface

### Description
- Create configured ready and blocked fixture manifests that declare all 24 expected IDs, statuses, blocking values, repository facts, readiness, and failure details before execution.
- Add one isolated failing variant per ID while retaining a passing observation for that same ID in another fixture; generate a checked pass/fail coverage table from manifests.
- Invoke human and JSON modes through normal application composition and the built process, normalize human facts, and compare exact semantic equality.
- Control all external responses locally and measure monotonic wall-clock time from built Doctor process spawn through exit; enforce `<= 10,000 ms` without weakening the product 9-second deadline.

### Acceptance Criteria
- **AC-8:** Ready and blocked manifests cover every reported check and both modes make the same decision and check outcomes.
- **AC-9:** Every one of the 24 IDs is observed passed and failed in deterministic fixtures.
- **AC-10:** The controlled ready built process exits within ten seconds.

### Test Coverage
- Manifest schema/completeness tests, duplicate/missing ID rejection, parity tests, 24 isolated-failure cases, fixture mutation tripwires, repeated deterministic runs, and timing tests using controlled fake Git/gh/Copilot commands.

### Expected Evidence
- Checked fixture manifests and generated 24-row pass/fail coverage assertion.
- Ready/blocked human and JSON outputs with semantic diff equal to zero.
- Recorded monotonic elapsed milliseconds at or below 10,000 and process exit 0.

## Task T-7: Update documentation and run delivery validation

- **Status:** Completed
- **Complexity:** Medium
- **Dependencies:** T-6
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10
- **Related ADRs:** ADR-260812-repository-doctor-readiness; ADR-260811-engineering-harness-surface
- **Related Core-Components:** CORE-COMPONENT-260812-repository-doctor-contract; CORE-COMPONENT-260806-project-command-interface; CORE-COMPONENT-260806-rpiv-stage-contract; CORE-COMPONENT-260811-engineering-harness-interface; CORE-COMPONENT-260810-development-standards

### Description
- Update CLI help, README quick start/prerequisites/documentation map, docs index, Phase 1 configuration cross-reference, and add `docs/phase-4-repository-doctor.md` covering all checks, IDs, blocking policy, schema, exits, protocol/asset metadata, root safety, ignored paths, fixtures, timing, troubleshooting, and the no-issue boundary.
- Update documentation tests so public commands, exact output fields/statuses, configuration migration, root recipes, and harness/product Doctor distinction cannot drift.
- Do not add or change raw validation recipes unless implementation introduces a genuinely missing project operation; keep root `justfile` authoritative.
- Implement must run focused suites through `just verify-focused`, then `just verify`, `harness checks --focused --json`, and `harness checks --json`; inspect JSON envelope status/exit and record evidence. The harness remains ambient and is not called by product Doctor.

### Acceptance Criteria
- **AC-1 through AC-4:** Documentation enumerates every named check and remediation category.
- **AC-5 and AC-6:** Documentation specifies schema 1, parity, readiness, failure fields, and exit behavior.
- **AC-7:** Documentation explicitly prohibits issue selection/prioritization/readiness assessment and distinguishes `harness doctor`.
- **AC-8 through AC-10:** Documentation names complete fixture manifests, pass/fail matrix, controlled network, and ten-second process bound.

### Test Coverage
- Documentation assertions plus help smoke tests; execute Doctor ready/blocked smoke fixtures through root `just run`.
- Run `just verify-focused`, `just verify`, `harness checks --focused --json`, and `harness checks --json`; preserve at least 80 percent global statements, branches, functions, and lines.

### Expected Evidence
- Committed README, docs index, Phase 1 cross-reference, Phase 4 guide, help text, RPIV metadata, and documentation tests.
- Passing focused/full root recipe output, successful harness envelopes, coverage summary, `git diff --check`, and no product dependency on harness.
