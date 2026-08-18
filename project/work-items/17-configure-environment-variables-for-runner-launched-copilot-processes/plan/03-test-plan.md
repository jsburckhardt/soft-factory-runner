# Test Plan: Configure environment variables for Runner-launched Copilot processes

Architecture under test: `ADR-260812-copilot-child-environment`, `CORE-COMPONENT-260812-copilot-child-environment-contract`, updated `CORE-COMPONENT-260811-issue-run-orchestration`, and the existing subprocess, error, persistence, concurrency, Doctor, development, command, and harness contracts referenced by the task breakdown.

## Test V-1: Parse absent, empty, valid, and explicit-empty mappings

- **Type:** Unit / configuration
- **Task:** T-1
- **Acceptance Criteria:** AC-1, AC-4, AC-11
- **Priority:** Critical

### Setup
Use table-driven calls to the shared `parseConfiguration` with no file, blank text, empty `copilot`, empty `copilot.environment`, valid names, quoted/plain string scalars, and an explicitly empty `""` value.

### Steps
1. Parse every case without external tools.
2. Compare `copilotEnvironment` keys and exact values at the parser boundary.
3. Compare absent and empty results with `DEFAULT_CONFIGURATION`.

### Expected Result
Valid names and literal strings are retained, explicit empty remains `""`, and absent/empty mappings produce an empty readonly map without changing other defaults.

### Expected Evidence
Named Jest rows report field names and pass/fail only; assertions prove AC-1 and AC-4 behavior without printing values.

## Test V-2: Reject every invalid class without value disclosure

- **Type:** Unit / negative security
- **Task:** T-1
- **Acceptance Criteria:** AC-6, AC-11, AC-12
- **Priority:** Critical

### Setup
Generate a unique secret sentinel per case for duplicate name, invalid name, numeric/boolean/null or other non-string scalar, nested value, alias, anchor, merge key, unsupported key, malformed line, and indentation failure.

### Steps
1. Parse each invalid document through the shared execution/Doctor parser.
2. Assert `CONFIG_INVALID`, the relevant field path, and a stable reason.
3. Assert no spawn call and scan error message, remediation, details, human rendering, and JSON rendering for every sentinel.

### Expected Result
Every class fails before Copilot launch; diagnostics identify field and reason and contain no configured value.

### Expected Evidence
A redacted invalid-class matrix and zero-spawn count; sentinel scan reports zero matches.

## Test V-3: Observe configured names and unchanged Copilot command

- **Type:** Orchestration integration with fake process port
- **Task:** T-2
- **Acceptance Criteria:** AC-2, AC-4, AC-11
- **Priority:** Critical

### Setup
Use the deterministic issue fixture with a fake `ProcessPort`, five uniquely valued named telemetry variables, valid completion inputs, and separate absent/empty control runs.

### Steps
1. Start and execute the worker through normal application composition.
2. Capture executable, args, cwd, and environment at `spawnCopilot`.
3. Compare the configured variable names and exact `--yolo --name issue-<number> --agent rpiv --prompt "Deliver issue #<number>"` sequence.
4. Compare absent/empty controls with the prior baseline.

### Expected Result
All named variables reach every configured Copilot child; command and baseline behavior remain unchanged.

### Expected Evidence
Redacted boundary record containing variable names, exact argument array, issue identity, and pass status.

## Test V-4: Enforce precedence and literal transport

- **Type:** Unit / live-adapter boundary
- **Task:** T-2
- **Acceptance Criteria:** AC-3, AC-7, AC-11
- **Priority:** Critical

### Setup
Provide allowlisted inherited and configured collisions, a configured `OTEL_RESOURCE_ATTRIBUTES` collision, and values containing `$VAR`, `$(command)`, backticks, spaces, quotes, semicolons, and URL metacharacters. Use an argument-recording fake executable or spawn seam with no shell/network.

### Steps
1. Capture the final child environment.
2. Compare inherited/configured collisions and Runner-owned telemetry.
3. Compare every literal byte with its configured input.
4. Assert `shell: false` and unchanged executable/args.

### Expected Result
Configured values override inherited values, Runner telemetry overrides configuration, and metacharacters arrive unchanged with no evaluation or expansion.

### Expected Evidence
Precedence matrix and literal-comparison pass/fail records containing names but not sentinel values.

## Test V-5: Isolate all non-Copilot subprocess environments

- **Type:** Adapter isolation
- **Task:** T-2
- **Acceptance Criteria:** AC-8, AC-11
- **Priority:** High

### Setup
Instrument generic command, Git, GitHub CLI, tmux, worker, and Doctor subprocess fakes while configuring distinctive Copilot-only names.

### Steps
1. Exercise issue readiness, resource preparation, launch, reconciliation, and Doctor paths.
2. Record environment key sets for every subprocess boundary.
3. Assert configured names occur only in the Copilot spawn record.

### Expected Result
No non-Copilot subprocess receives a configured Copilot variable and ambient `process.env` remains unchanged.

### Expected Evidence
Boundary-by-boundary key-name report and zero prohibited propagation assertions.

## Test V-6: Recover from rejected configuration using a fresh read

- **Type:** Orchestration correction
- **Task:** T-3
- **Acceptance Criteria:** AC-9, AC-11, AC-12
- **Priority:** Critical

### Setup
Prepare an owned run ready for its worker, an invalid configuration containing a secret sentinel, mutable fixture file storage, and spawn/launch-intent counters.

### Steps
1. Invoke worker launch with invalid configuration.
2. Assert parse failure occurs before launch intent and Copilot spawn.
3. Replace configuration with a valid distinct sentinel.
4. Invoke the eligible later launch path and capture its environment.
5. Scan rejected and successful artifacts/output for both sentinels.

### Expected Result
The rejected attempt launches nothing and leaves no secret residue; the later attempt reads only current valid configuration and launches once.

### Expected Evidence
Ordered read/intent/spawn trace (`0` rejected, `1` corrected), current-name pass status, and zero sentinel matches.

## Test V-7: Isolate two concurrent distinct-issue launch snapshots

- **Type:** Deterministic concurrency integration
- **Task:** T-3
- **Acceptance Criteria:** AC-10, AC-11, AC-12
- **Priority:** Critical

### Setup
Use one temporary repository, capacity two, a synchronization barrier, two distinct issues, two time-ordered configuration versions with unique sentinels, and fake Copilot processes. Use no credentials, live tmux/Copilot, telemetry, or network.

### Steps
1. Admit both issues; let issue A read configuration A and pause after snapshot creation.
2. Replace the file with configuration B; let issue B read it and pause after snapshot creation.
3. Release both launches concurrently and record immutable environment maps.
4. Assert each map has only its own sentinel, the same normalized project, and its own issue ID.
5. Mutate the source file again and prove neither captured map changes.

### Expected Result
The two children exchange neither configured values nor generated attributes; each snapshot remains local and immutable.

### Expected Evidence
Issue-keyed redacted isolation matrix, two spawn records, and zero cross-sentinel matches.

## Test V-8: Execute complete scenario and confidentiality matrix

- **Type:** Acceptance / artifact leak scan
- **Task:** T-3
- **Acceptance Criteria:** AC-11, AC-12
- **Priority:** Critical

### Setup
Aggregate V-1 through V-7 fixtures with one unique sentinel per named scenario. Collect fixture-produced human/JSON output, errors, snapshots, event JSONL, and retained attempt logs for successful and rejected launches.

### Steps
1. Execute absent, empty, valid, explicit-empty, both collision classes, all invalid classes, literal metacharacters, correction, and two-issue concurrency.
2. At the child boundary, compare exact values in test-local memory only.
3. Scan every collected Runner artifact and rendering for every sentinel.
4. Emit a scenario ledger containing only scenario name, variable name, AC IDs, and result.

### Expected Result
Every required scenario passes deterministically without external services; no sentinel appears outside test-local child-boundary comparisons.

### Expected Evidence
Complete redacted scenario ledger and zero-match scan by human output, JSON output, error, snapshot, event, and log category.

## Test V-9: Verify user-facing documentation consistency

- **Type:** Documentation contract
- **Task:** T-4
- **Acceptance Criteria:** AC-5
- **Priority:** High

### Setup
Load README, docs index, issue-run guide, recovery guide, and Doctor guide through `src/documentation.test.ts`.

### Steps
1. Assert `copilot.environment` and the valid example are documented.
2. Assert name/string/explicit-empty rules, inherited/configured/Runner-owned precedence, literal behavior, defaults, invalid classes, value-free errors, Copilot-only scope, and fresh-read behavior.
3. Assert no stale contradictory environment statement or real secret appears.

### Expected Result
All user-facing surfaces consistently describe actual Runner behavior and migration impact.

### Expected Evidence
Passing named documentation assertions and reviewable docs diff.

## Test V-10: Pass direct root and delegating harness validation

- **Type:** Repository quality gate
- **Task:** T-5
- **Acceptance Criteria:** AC-13
- **Priority:** Critical

### Setup
Complete T-1 through T-4, read `harness instructions checks`, and ensure the working tree contains only intended issue/architecture/implementation changes.

### Steps
1. Run focused relevant suites via `just verify-focused`.
2. Run `just verify` directly.
3. Run `harness checks --focused --json` and `harness checks --json`.
4. Record V-1 through V-10 outcomes and AC mappings in implementation evidence.
5. Scan captured evidence for all configured sentinels.

### Expected Result
Both direct root recipes and both delegating harness checks succeed; coverage remains at least 80%; evidence names every scenario and exposes no value.

### Expected Evidence
Successful direct command results, structured `ok` harness envelopes, coverage summary, and redacted AC/scenario ledger.


## Test V-11: Preserve generic and concrete PRD Copilot invocations

- **Type:** Documentation regression
- **Task:** T-6
- **Acceptance Criteria:** AC-5, AC-13
- **Priority:** High

### Steps
1. Load PRD section 27 through `src/documentation.test.ts`.
2. Assert exactly one line equals `OTEL_RESOURCE_ATTRIBUTES="project.name=<project>,issue.id=issue-<number>" copilot --yolo`.
3. Assert the complete concrete Runner command remains unchanged.
4. Run the focused and full root validation recipes.

### Expected Result
The generic operator-facing invocation is explicit and singular, the concrete Runner command is preserved, and no Issue #17 runtime behavior changes.

### Expected Evidence
Passing named documentation assertion plus focused and full validation results mapped to AC-5 and AC-13.
