# Task Breakdown: Configure environment variables for Runner-launched Copilot processes

## Task T-1: Extend strict configuration and domain typing

- **Status:** Complete
- **Complexity:** High
- **Dependencies:** None
- **Acceptance Criteria:** AC-1, AC-4, AC-6, AC-11
- **Related ADRs:** ADR-260812-copilot-child-environment, ADR-260810-typescript-node-cli, ADR-260812-repository-doctor-readiness
- **Related Core-Components:** CORE-COMPONENT-260812-copilot-child-environment-contract, CORE-COMPONENT-260812-repository-doctor-contract, CORE-COMPONENT-260810-error-handling, CORE-COMPONENT-260810-development-standards

### Description
Extend `RunConfiguration` and `DEFAULT_CONFIGURATION` with a readonly `copilotEnvironment` map. Extend the strict shared parser to recognize exactly `copilot.environment.<NAME>`, preserve an explicit empty string, and distinguish accepted string scalars from mappings and prohibited YAML constructs. Reject duplicate/invalid names, non-string/nested values, aliases, anchors, merge keys, malformed syntax, and unsupported keys with `CONFIG_INVALID` messages that contain the field path and reason but no configured value. Keep absent and empty mappings equivalent to the current empty override and ensure Doctor consumes the same parser behavior.

### Acceptance Criteria
- AC-1 is met by the adopted `copilot.environment` mapping, required name grammar, string values, and explicit empty-string representation.
- AC-4 is met by empty-map defaults with no launch behavior change.
- AC-6 is met by complete pre-launch invalid-class rejection and value-free diagnostics.
- AC-11 is met for parser-owned valid, absent, empty, and invalid scenarios.

### Test Coverage
- Implement V-1 table tests in `src/config`-focused coverage for absent, empty, valid, and explicit-empty values.
- Implement V-2 table tests for duplicate/invalid names, non-string/nested values, aliases, anchors, merge keys, unsupported keys, and malformed lines.
- Assert error code, field identity, reason category, and absence of each unique secret sentinel from message, remediation, details, and rendered forms.
- Exercise Doctor compatibility parsing to prevent execution/Doctor schema drift.

### Expected Evidence
- Passing focused parser and Doctor compatibility test names for every input class.
- Typecheck evidence showing readonly environment data reaches `RunConfiguration` without widening to unknown values.
- Redacted test output listing field names and pass/fail only.

## Task T-2: Compose the typed Copilot launch environment

- **Status:** Complete
- **Complexity:** Medium
- **Dependencies:** T-1
- **Acceptance Criteria:** AC-2, AC-3, AC-4, AC-7, AC-8, AC-11
- **Related ADRs:** ADR-260812-copilot-child-environment, ADR-260811-prototype-one-run-orchestration
- **Related Core-Components:** CORE-COMPONENT-260812-copilot-child-environment-contract, CORE-COMPONENT-260811-issue-run-orchestration, CORE-COMPONENT-260810-subprocess-execution, CORE-COMPONENT-260810-structured-events

### Description
In `IssueRunService.runWorker`, build one fresh immutable launch map from parsed configured entries and apply Runner-generated `OTEL_RESOURCE_ATTRIBUTES` last. Pass the map only via the existing typed `ProcessPort.spawnCopilot` input. Preserve the exact Copilot executable, argument sequence, cwd, process identity, launch intent, and persisted schema. Keep `LiveProcessPort` shell-free; merge its existing `allowedEnvironment()` before explicit launch values. Do not mutate `process.env` or expose the map to generic command, Git, GitHub, tmux, worker, or Doctor execution.

### Acceptance Criteria
- AC-2 is met by observed configured variable names and unchanged Copilot argument ordering.
- AC-3 is met by deterministic inherited/configured/Runner-owned merge precedence.
- AC-4 is met by baseline-equivalent absent/empty launches.
- AC-7 is met by byte-for-byte literal values at a `shell: false` child boundary.
- AC-8 is met by zero propagation to non-Copilot subprocess adapters.
- AC-11 is met for launch, collision, literal, and isolation scenarios.

### Test Coverage
- Implement V-3 child-boundary recording for the five named telemetry variables, cwd, executable, and exact args.
- Implement V-4 inherited/configured and configured/Runner-owned collision cases plus shell metacharacter, command-substitution, and variable-reference literals.
- Implement V-5 tripwire tests for Git, `gh`, tmux, worker, Doctor, and generic commands.
- Assert snapshots/events keep generated resource attributes but contain no arbitrary configured map, name, or value.

### Expected Evidence
- Recorded `spawnCopilot` invocation showing expected variable names, exact args, and generated issue attributes.
- Collision matrix proving precedence without printing values.
- Non-Copilot tripwire operation trace with no configured names or values.

## Task T-3: Prove correction, concurrency, and confidentiality

- **Status:** Complete
- **Complexity:** High
- **Dependencies:** T-1, T-2
- **Acceptance Criteria:** AC-9, AC-10, AC-11, AC-12
- **Related ADRs:** ADR-260812-copilot-child-environment, ADR-260811-prototype-three-recovery-concurrency
- **Related Core-Components:** CORE-COMPONENT-260812-copilot-child-environment-contract, CORE-COMPONENT-260811-run-reconciliation-control, CORE-COMPONENT-260811-concurrent-run-admission, CORE-COMPONENT-260810-persistence-recovery, CORE-COMPONENT-260810-structured-events

### Description
Extend deterministic memory and temporary-repository fixtures so each launch reads current configuration immediately before intent/spawn. Prove an invalid configuration causes no Copilot spawn and a corrected configuration can launch later without stale parser state. Use a synchronization barrier for two distinct issues with different sentinels and repository/issue identities; capture immutable maps at the typed boundary and prove no cross-issue exchange. Add a reusable test-only confidentiality assertion that scans Runner-produced human/JSON output, safe errors, snapshots, event JSONL, and retained attempt logs for all sentinels while reporting only variable names and pass/fail results.

### Acceptance Criteria
- AC-9 is met by fresh-read correction evidence and zero rejected spawn.
- AC-10 is met by two disjoint concurrent launch snapshots and exact per-issue telemetry.
- AC-11 is met by the complete deterministic scenario matrix without live services.
- AC-12 is met by boundary comparisons plus comprehensive sentinel-absence scans.

### Test Coverage
- Implement V-6 invalid-then-corrected launch test, including launch-intent/spawn counts and no stale values.
- Implement V-7 barrier-controlled distinct-issue launch test with unique sentinels and normalized project/issue assertions.
- Implement V-8 named scenario matrix and scan all successful/rejected Runner artifacts and renderings.
- Keep fixture evidence credential-free, network-free, Copilot-free, and telemetry-infrastructure-free.

### Expected Evidence
- Operation trace proving configuration read ordering and spawn count `0` then `1`.
- Concurrent fixture result listing issue IDs, variable names, and isolated pass status only.
- Sentinel scan result showing zero matches in every required artifact class.

## Task T-4: Document the public configuration contract

- **Status:** Complete
- **Complexity:** Medium
- **Dependencies:** T-1, T-2
- **Acceptance Criteria:** AC-5
- **Related ADRs:** ADR-260812-copilot-child-environment, ADR-260812-repository-doctor-readiness
- **Related Core-Components:** CORE-COMPONENT-260812-copilot-child-environment-contract, CORE-COMPONENT-260806-rpiv-stage-contract, CORE-COMPONENT-260812-repository-doctor-contract

### Description
Update `README.md`, `docs/phase-1-issue-run.md`, `docs/phase-3-recovery-operations.md`, `docs/phase-4-repository-doctor.md`, and the docs index where appropriate. Document `copilot.environment`, name and string-value grammar, explicit empty strings, literal behavior, inherited/configured/Runner-owned precedence, absent/empty defaults, value-free validation failures, Copilot-only scope, fresh launch reads, confidentiality boundary, and no snapshot/API/deployment migration. Add documentation assertions to hold duplicated guidance consistent.

### Acceptance Criteria
- AC-5 is met when all user-facing configuration surfaces consistently describe the adopted behavior and defaults.

### Test Coverage
- Implement V-9 documentation assertions for mapping name, examples, grammar, precedence, literal semantics, defaults, validation classes, Copilot-only scope, correction, and confidentiality.
- Assert stale statements that describe the environment as only `OTEL_RESOURCE_ATTRIBUTES` are removed or qualified.

### Expected Evidence
- Passing named documentation test with all required phrases and cross-guide consistency checks.
- Reviewable documentation diff containing no real credentials or sentinel values.

## Task T-5: Run direct and harness validation and record evidence

- **Status:** Complete
- **Complexity:** Medium
- **Dependencies:** T-1, T-2, T-3, T-4
- **Acceptance Criteria:** AC-13
- **Related ADRs:** ADR-260811-engineering-harness-surface, ADR-260812-copilot-child-environment
- **Related Core-Components:** CORE-COMPONENT-260806-project-command-interface, CORE-COMPONENT-260811-engineering-harness-interface, CORE-COMPONENT-260806-rpiv-stage-contract, CORE-COMPONENT-260810-development-standards

### Description
Run the focused environment/parser/orchestration/documentation suites through `just verify-focused`, then run `just verify`. Also run `harness checks --focused --json` and `harness checks --json` after reading the checks briefing. Record a redacted RPIV scenario ledger that names every V-1 through V-10 scenario and result, maps them back to AC-1 through AC-13, and never includes configured values.

### Acceptance Criteria
- AC-13 is met only when both direct root recipes pass and the evidence identifies every named scenario without exposing configured values.

### Test Coverage
- Execute V-10 direct focused/full recipes and delegating focused/full harness checks.
- Confirm coverage remains at least 80% for statements, branches, functions, and lines.
- Scan captured validation/evidence text for fixture sentinels before handoff.

### Expected Evidence
- Successful `just verify-focused` and `just verify` command results.
- Successful structured harness envelopes showing delegation to root recipes.
- Redacted AC/scenario ledger and coverage summary in `implementation/00-implementation.md`.


## Verify-return Follow-up Task T-6: Restore the explicit PRD invocation contract

- **Status:** Complete
- **Complexity:** Low
- **Dependencies:** T-4, T-5
- **Acceptance Criteria:** AC-5, AC-13

### Description
Preserve the completed T-1 through T-5 history. Update PRD section 27 with exactly the one-line generic invocation `OTEL_RESOURCE_ATTRIBUTES="project.name=<project>,issue.id=issue-<number>" copilot --yolo` while retaining the complete concrete Runner command. Add a focused `src/documentation.test.ts` regression assertion for both forms. Do not alter Issue #17 runtime behavior.

### Test Coverage
- Implement V-11 as a repository-documentation assertion that counts exactly one generic invocation line and matches the complete concrete command.
- Run root `just verify-focused` and `just verify`, plus their harness delegates, without changing product execution code.

### Expected Evidence
- PRD section 27 contains the exact generic line once and retains the concrete Runner command.
- Focused and full validation pass with the new documentation regression.
