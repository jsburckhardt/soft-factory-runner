# Action Plan: Configure environment variables for Runner-launched Copilot processes

## Feature
- **ID:** 17
- **Research Brief:** `project/work-items/17-configure-environment-variables-for-runner-launched-copilot-processes/research/00-research.md`

## ADRs Created
- `ADR-260812-copilot-child-environment` — adopts `copilot.environment`, fresh per-launch parsing, precedence, isolation, and non-persistence.

## Core-Components Created
- `CORE-COMPONENT-260812-copilot-child-environment-contract` — defines reusable parsing, launch, confidentiality, correction, concurrency, and evidence rules.
- Updated `CORE-COMPONENT-260811-issue-run-orchestration` to delegate Copilot child-environment composition to the new contract while retaining Runner-owned telemetry.

## Acceptance Criteria
- **AC-1:** `.soft-factory/config.yml` exposes one documented Copilot child-environment mapping whose names match `[A-Za-z_][A-Za-z0-9_]*` and whose scalar string values, including an explicitly empty string, are added to every Runner-launched Copilot process.
- **AC-2:** The observed Copilot child receives configured variables such as `COPILOT_OTEL_ENABLED`, `COPILOT_OTEL_EXPORTER_TYPE`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_NAME`, and `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT` with the existing `copilot --yolo --name issue-<number> --agent rpiv --prompt "Deliver issue #<number>"` argument sequence.
- **AC-3:** Configured values override same-name values from the existing allowed environment, except `OTEL_RESOURCE_ATTRIBUTES` always equals Runner-generated `project.name=<normalized-project-name>,issue.id=issue-<number>` for the current launch.
- **AC-4:** An absent or empty Copilot child-environment mapping preserves the existing allowed launch environment and command behavior.
- **AC-5:** User-facing configuration documentation identifies the mapping and states the name/value rules, both precedence rules, literal-value behavior, defaults, and validation failures consistently with Runner behavior.
- **AC-6:** Duplicate names, invalid names, non-string values, nested values, aliases, merge keys, and unsupported keys are rejected before Copilot launch; the error identifies the invalid field and reason without including its value.
- **AC-7:** Configured values are passed literally without shell evaluation, command substitution, or implicit variable expansion.
- **AC-8:** Configured Copilot variables do not alter the environment of Runner-launched Git, `gh`, `tmux`, or other non-Copilot subprocesses.
- **AC-9:** A later launch reads the then-current valid configuration, while a rejected configuration launches no Copilot process and does not affect a subsequent valid launch.
- **AC-10:** Concurrent distinct-issue launches cannot exchange configured values or generated attributes; each child receives its own configuration snapshot and only its current normalized `project.name` and `issue.id`.
- **AC-11:** Deterministic repository evidence exercises absent and empty mappings, valid and explicitly empty values, inherited/configured/Runner-owned collisions, every listed invalid-input class, literal metacharacters, configuration correction, and two concurrent distinct-issue launches without live Copilot, credentials, telemetry infrastructure, or network access.
- **AC-12:** Verification compares unique sentinel values at the Copilot child boundary but reports only variable names and pass/fail results; the sentinel values are absent from fixture-produced human and JSON output, errors, persisted snapshots, transition events, and retained attempt logs for successful and rejected launches.
- **AC-13:** `just verify-focused` and `just verify` pass, and RPIV evidence identifies each named verification scenario and its result without exposing configured values.
- **AC-14:** PRD section 27 contains the exact standalone generic invocation `OTEL_RESOURCE_ATTRIBUTES="project.name=<project>,issue.id=issue-<number>" copilot --yolo`.
- **AC-15:** A deterministic documentation test scoped to PRD section 27 proves the exact generic invocation is a standalone line.
- **AC-16:** The follow-up is documentation-only, retains the concrete complete invocation, and makes no production or architecture change.

## Acceptance Coverage

| AC | Implementation task(s) | Tests / validation | Expected evidence | Architecture |
|---|---|---|---|---|
| AC-1 | T-1 | V-1 | Parser assertions for valid names, scalar strings, and explicit empty value | ADR-260812-copilot-child-environment; CORE-COMPONENT-260812-copilot-child-environment-contract |
| AC-2 | T-2 | V-3 | Recorded typed child-boundary names and unchanged executable/argument array | ADR-260812-copilot-child-environment; CORE-COMPONENT-260811-issue-run-orchestration |
| AC-3 | T-2 | V-4 | Collision assertions proving inherited < configured < Runner-owned precedence | ADR-260812-copilot-child-environment; CORE-COMPONENT-260812-copilot-child-environment-contract |
| AC-4 | T-1, T-2 | V-1, V-3 | Baseline-equivalence assertions for absent and empty mappings | CORE-COMPONENT-260812-copilot-child-environment-contract |
| AC-5 | T-4 | V-9 | Documentation assertions across README and configuration/operations guides | ADR-260812-copilot-child-environment; CORE-COMPONENT-260806-rpiv-stage-contract |
| AC-6 | T-1 | V-2 | Invalid-class table proving pre-spawn rejection and value-free field/reason errors | CORE-COMPONENT-260812-copilot-child-environment-contract; CORE-COMPONENT-260810-error-handling |
| AC-7 | T-2 | V-4 | Metacharacter sentinel reaches child unchanged with shell-free spawn proof | CORE-COMPONENT-260812-copilot-child-environment-contract; CORE-COMPONENT-260810-subprocess-execution |
| AC-8 | T-2 | V-5 | Command-adapter tripwires prove non-Copilot environment remains allowlisted only | CORE-COMPONENT-260812-copilot-child-environment-contract; CORE-COMPONENT-260810-subprocess-execution |
| AC-9 | T-3 | V-6 | Invalid-to-corrected launch trace proves fresh read, zero rejected spawn, one valid spawn | ADR-260812-copilot-child-environment; CORE-COMPONENT-260811-run-reconciliation-control |
| AC-10 | T-3 | V-7 | Barrier fixture records disjoint issue maps and issue-correct generated attributes | ADR-260811-prototype-three-recovery-concurrency; CORE-COMPONENT-260811-concurrent-run-admission |
| AC-11 | T-1, T-2, T-3 | V-1 through V-8 | Named deterministic scenario matrix with no live external dependency | CORE-COMPONENT-260810-development-standards; CORE-COMPONENT-260806-agent-executable-acceptance-criteria |
| AC-12 | T-3 | V-2, V-8 | Sentinel scan of outputs, errors, snapshots, events, and logs reports names/results only | ADR-260812-copilot-child-environment; CORE-COMPONENT-260810-structured-events |
| AC-13 | T-5 | V-10 | Successful direct just and harness envelopes plus redacted scenario ledger | ADR-260811-engineering-harness-surface; CORE-COMPONENT-260806-project-command-interface |
| AC-14 | T-6 | V-11 | Section-27 extract showing the exact generic invocation as one standalone line | ADR-260811-prototype-one-run-orchestration; CORE-COMPONENT-260811-issue-run-orchestration |
| AC-15 | T-6 | V-11 | Passing deterministic section-27 assertion for exact line equality and a count of one | CORE-COMPONENT-260806-agent-executable-acceptance-criteria; CORE-COMPONENT-260810-development-standards |
| AC-16 | T-6 | V-11 | Section-27 concrete-command assertion and scoped diff proving no production or architecture change | ADR-260812-copilot-child-environment; CORE-COMPONENT-260812-copilot-child-environment-contract; CORE-COMPONENT-260806-rpiv-stage-contract |

Coverage proof: all AC-1 through AC-16 have at least one dependency-ordered implementation task, explicit test or validation, expected evidence, and governing architecture reference. AC-14 through AC-16 are jointly implemented by T-6 and independently evidenced by V-11; AC-1 through AC-13 remain unchanged.

## Implementation Tasks
1. **T-1 — Extend strict configuration and domain typing** (AC-1, AC-4, AC-6, AC-11): add `copilot.environment` parsing/defaults and value-free strict validation.
2. **T-2 — Compose the typed Copilot launch environment** (AC-2, AC-3, AC-4, AC-7, AC-8, AC-11): pass a fresh immutable map only through `spawnCopilot`, preserving arguments and telemetry ownership.
3. **T-3 — Prove correction, concurrency, and confidentiality** (AC-9, AC-10, AC-11, AC-12): extend deterministic orchestration/integration fixtures and leak scans.
4. **T-4 — Document the public configuration contract** (AC-5): align README and issue-run, recovery, and Doctor configuration guidance plus documentation assertions.
5. **T-5 — Run direct and harness validation and record evidence** (AC-13): execute focused/full root recipes and delegating harness checks, recording named redacted outcomes.
6. **T-6 — Restore the explicit PRD invocation contract after Verify return** (AC-5, AC-13, AC-14, AC-15, AC-16; depends on T-4 and T-5): retain the complete concrete Runner command, add the exact standalone generic invocation, lock section 27 with deterministic V-11 evidence, and prove the follow-up changes no production or architecture artifact. T-6 is complete only when V-11 and the scoped diff evidence prove AC-14 through AC-16 together.
