# Research Brief: Configure environment variables for Runner-launched Copilot processes

## GitHub Issue
- **Issue:** #17
- **Title:** Configure environment variables for Runner-launched Copilot processes
- **Work Item:** `project/work-items/17-configure-environment-variables-for-runner-launched-copilot-processes`

## Scope Classification
- **Scope Type:** issue

## Problem Statement
Runner-launched Copilot processes receive a restricted environment and Runner-generated `OTEL_RESOURCE_ATTRIBUTES`, but not exporter variables from the controlling tmux environment. `.soft-factory/config.yml` currently cannot add literal, confidential variables specifically to Copilot children while retaining per-issue telemetry and unchanged behavior when configuration is absent.

## Acceptance Criteria
**Core**
- [ ] `.soft-factory/config.yml` exposes one documented Copilot child-environment mapping whose names match `[A-Za-z_][A-Za-z0-9_]*` and whose scalar string values, including an explicitly empty string, are added to every Runner-launched Copilot process.
- [ ] The observed Copilot child receives configured variables such as `COPILOT_OTEL_ENABLED`, `COPILOT_OTEL_EXPORTER_TYPE`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_NAME`, and `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT` with the existing `copilot --yolo --name issue-<number> --agent rpiv --prompt "Deliver issue #<number>"` argument sequence.
- [ ] Configured values override same-name values from the existing allowed environment, except `OTEL_RESOURCE_ATTRIBUTES` always equals Runner-generated `project.name=<normalized-project-name>,issue.id=issue-<number>` for the current launch.
- [ ] An absent or empty Copilot child-environment mapping preserves the existing allowed launch environment and command behavior.
- [ ] User-facing configuration documentation identifies the mapping and states the name/value rules, both precedence rules, literal-value behavior, defaults, and validation failures consistently with Runner behavior.
**Edge Cases**
- [ ] Duplicate names, invalid names, non-string values, nested values, aliases, merge keys, and unsupported keys are rejected before Copilot launch; the error identifies the invalid field and reason without including its value.
- [ ] Configured values are passed literally without shell evaluation, command substitution, or implicit variable expansion.
- [ ] Configured Copilot variables do not alter the environment of Runner-launched Git, `gh`, `tmux`, or other non-Copilot subprocesses.
- [ ] A later launch reads the then-current valid configuration, while a rejected configuration launches no Copilot process and does not affect a subsequent valid launch.
- [ ] Concurrent distinct-issue launches cannot exchange configured values or generated attributes; each child receives its own configuration snapshot and only its current normalized `project.name` and `issue.id`.
**Verification**
- [ ] Deterministic repository evidence exercises absent and empty mappings, valid and explicitly empty values, inherited/configured/Runner-owned collisions, every listed invalid-input class, literal metacharacters, configuration correction, and two concurrent distinct-issue launches without live Copilot, credentials, telemetry infrastructure, or network access.
- [ ] Verification compares unique sentinel values at the Copilot child boundary but reports only variable names and pass/fail results; the sentinel values are absent from fixture-produced human and JSON output, errors, persisted snapshots, transition events, and retained attempt logs for successful and rejected launches.
- [ ] `just verify-focused` and `just verify` pass, and RPIV evidence identifies each named verification scenario and its result without exposing configured values.

## Repository Findings
- `src/config.ts` (`parseConfiguration`, `DEFAULT_CONFIGURATION`) is a line-oriented strict YAML subset. Its known mappings are `repository`, `rpiv`, `execution`, and `branch_types`; a Copilot environment mapping is currently rejected by `validateKnownKeys`. `src/domain.ts` (`RunConfiguration`) has no child-environment field.
- The parser stores scalar entries in a `Map`, rejects duplicate full keys, enforces two-space mapping levels, strips unquoted comments, and removes surrounding double quotes. `optional` collapses missing and empty parsed values for existing fixed options.
- Existing parser errors can disclose values: unsupported syntax includes the raw line, while branch, numeric, and path failures include the value (`src/config.ts`). This conflicts with value-free diagnostics for confidential environment configuration.
- `src/orchestrator.ts` (`IssueRunService.runWorker`, `configuration`) reads `.soft-factory/config.yml` before each new Copilot launch and preserves the argument array `--yolo --name issue-<number> --agent rpiv --prompt <rendered-prompt>`.
- `runWorker` computes `otelResourceAttributes` from persisted repository identity and the current issue, then calls `ProcessPort.spawnCopilot` with only `OTEL_RESOURCE_ATTRIBUTES`. `LaunchIntentV1` and `CopilotLaunchFacts` persist generated resource attributes but no general environment (`src/domain.ts`, `src/ports.ts`).
- `src/live.ts` (`allowedEnvironment`) copies only `PATH`, home/config/token variables, shell/terminal data, and `TMPDIR`. `LiveProcessPort.spawnCopilot` uses `shell: false` and `{ ...allowedEnvironment(), ...input.environment }`, so explicit launch values already override inherited allowlisted names.
- Generic `CommandExecutor.run` and `runInherited` use only `allowedEnvironment()` for Git, `gh`, tmux, and other commands. The per-launch environment is confined to `spawnCopilot`; current code does not mutate `process.env` (`src/live.ts`).
- `IssueRunService.resume` starts another internal worker for an interrupted attempt; that worker re-enters `runWorker` and rereads configuration. A worker identity may be persisted before parsing, but parse failure precedes launch-intent persistence and `spawnCopilot` for a new launch (`src/orchestrator.ts`).
- Distinct runs have issue-specific locks, leases, worktrees, tmux windows/panes, snapshots, events, and process identities. Each `runWorker` holds configuration and generated attributes in local variables (`src/admission.ts`, `src/orchestrator.ts`).
- `src/orchestration.test.ts` currently records Copilot args, cwd, and `OTEL_RESOURCE_ATTRIBUTES`; `src/integration.test.ts` and recovery fixtures use credential-free process fakes. Existing coverage has no arbitrary Copilot variables, environment precedence, literal metacharacters, confidential values, or cross-issue environment isolation.
- `README.md`, `docs/phase-1-issue-run.md`, `docs/phase-3-recovery-operations.md`, and `docs/phase-4-repository-doctor.md` document configuration but no Copilot child-environment mapping. Run execution and Doctor share `parseConfiguration` through `src/doctor-compatibility.ts`.
- `PRD.md` sections 27, 42, and Observability require exact generated `OTEL_RESOURCE_ATTRIBUTES`. Its broad example includes a `copilot` mapping, while implemented documentation uses `rpiv.prompt`; no child-environment mapping is defined.
- `harness boot --json` succeeded: the expected CLI signal was observed, all 18 suites and 213 tests passed, coverage exceeded 80%, and the full checks envelope was `ok`.

## Constraints
- Issue #17 has one marker-bounded structured Markdown block with 13 unchecked criteria; the criteria above are verbatim and in issue order.
- `.soft-factory/config.yml` remains strict and shared by run execution and Doctor. Unknown or malformed configuration fails safe (`src/config.ts`, `CORE-COMPONENT-260812-repository-doctor-contract`).
- Names match exactly `[A-Za-z_][A-Za-z0-9_]*`; values are scalar strings, with explicit empty distinct from absence. Every listed invalid-input class must fail before Copilot spawn without disclosing its value.
- Secrets cannot enter errors, snapshots, events, retained logs, or human/JSON output (`CORE-COMPONENT-260810-error-handling`, `CORE-COMPONENT-260810-structured-events`, `CORE-COMPONENT-260810-subprocess-execution`).
- Copilot execution remains shell-free and array-based; configured strings remain literal (`src/live.ts`, `CORE-COMPONENT-260810-subprocess-execution`).
- Configured names override inherited allowlisted names, but Runner owns final `OTEL_RESOURCE_ATTRIBUTES`. Absent or empty mapping retains current launch behavior.
- Configuration applies only at `spawnCopilot`; Git, `gh`, tmux, workers, Doctor probes, and other subprocess environments remain unchanged.
- Every new or resumed launch reads current valid configuration. Recovery still preserves an exact active process rather than duplicating it (`CORE-COMPONENT-260810-persistence-recovery`, `CORE-COMPONENT-260811-run-reconciliation-control`).
- Telemetry normalization remains lowercase owner/repository with non-alphanumeric runs replaced by `-`, trimmed edges, and current explicit issue ID (`src/domain.ts`, `CORE-COMPONENT-260811-issue-run-orchestration`).
- Existing argument order, typed adapter boundary, per-issue ownership, concurrency limits, and root `justfile` authority remain in force.

## Relevant ADRs and Core-Components
- `ADR-260810-typescript-node-cli` — strict TypeScript/Node.js and typed external boundaries.
- `ADR-260811-prototype-one-run-orchestration` — deterministic Copilot launch, adapter separation, and normalized telemetry identity.
- `ADR-260811-prototype-three-recovery-concurrency` — exact process identity, no duplicate active launch, and concurrent issue isolation.
- `ADR-260812-repository-doctor-readiness` — strict shared configuration and redacted shell-free subprocess handling.
- `CORE-COMPONENT-260810-subprocess-execution` — environment allowlist, validated array execution, redaction, and no secret persistence.
- `CORE-COMPONENT-260811-issue-run-orchestration` — launch arguments, generated telemetry, typed adapters, and operation traces.
- `CORE-COMPONENT-260811-run-reconciliation-control` and `CORE-COMPONENT-260810-persistence-recovery` — launch identity and relaunch constraints.
- `CORE-COMPONENT-260811-concurrent-run-admission` — distinct per-issue resources.
- `CORE-COMPONENT-260812-repository-doctor-contract` — strict known configuration and fail-safe validation.
- `CORE-COMPONENT-260810-error-handling` and `CORE-COMPONENT-260810-structured-events` — actionable failures and pre-persistence redaction.
- `CORE-COMPONENT-260810-development-standards` and `CORE-COMPONENT-260806-agent-executable-acceptance-criteria` — strict typing, deterministic isolation, coverage, and repository-executable evidence.

## Risks and Open Questions
- The issue does not name the mapping. Existing docs use `rpiv`; the PRD has a broader unimplemented `copilot` example. The authoritative public field name is unresolved.
- The hand-written parser lacks full YAML type semantics. Empty strings, tags, aliases, anchors, merge keys, and nesting reach differing generic errors, some exposing raw lines.
- Existing `optional` semantics collapse explicit empty to absence, unlike the required child-environment distinction.
- `CORE-COMPONENT-260811-issue-run-orchestration` currently describes the Copilot child environment only in terms of generated `OTEL_RESOURCE_ATTRIBUTES`; Issue #17 broadens that environment while retaining Runner ownership. This accepted wording needs Plan-stage review.
- Snapshots retain generated attributes but not arbitrary environment. Confidentiality prohibits persisted configured values, while recovery and concurrency still need non-secret proof against duplicate or cross-issue launch; no such environment proof is defined.
- Copilot inherits terminal stdio and could print environment-derived content. The responsibility boundary for arbitrary Copilot output versus Runner-produced output is unspecified.
- Parse failure can occur after worker identity persistence. No Copilot launches, but post-correction state and operator-visible behavior are unspecified beyond allowing a later valid launch.
- Valid names can collide with allowlisted authentication names such as `GH_TOKEN`, `GITHUB_TOKEN`, and `COPILOT_GITHUB_TOKEN`; criteria define precedence and confidentiality but no narrower name policy.
- Configuration documentation is duplicated across README and three guides, creating consistency risk.
