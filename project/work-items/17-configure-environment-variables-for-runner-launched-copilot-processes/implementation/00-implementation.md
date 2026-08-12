# Implementation Evidence: Issue 17

## Scope and status

Tasks T-1 through T-5 are implemented in dependency order and marked complete in the validated task breakdown. This record supplies redacted evidence for Verify; it does not claim final verification or acceptance.

## Acceptance evidence

| AC | Evidence |
| --- | --- |
| AC-1 | `RunConfiguration.copilotEnvironment`, frozen empty defaults, and strict `copilot.environment` parsing are implemented in `src/domain.ts` and `src/config.ts`. V-1 covers valid names, plain/quoted strings, and explicit empty strings. |
| AC-2 | `src/orchestration.test.ts` V-3 records the five planned telemetry variable names plus explicit-empty transport at `spawnCopilot`; executable, cwd, and the exact `--yolo --name issue-3 --agent rpiv --prompt Deliver issue #3` array are unchanged. |
| AC-3 | V-3 proves Runner-owned resource attributes replace a configured collision; V-4 proves configured entries replace allowlisted inherited collisions and preserves current issue attributes. |
| AC-4 | V-1 proves absent, blank, empty `copilot`, and empty `environment` defaults; V-3 compares absent and empty launch controls and finds only the pre-existing generated resource attribute. |
| AC-5 | README, issue-run, recovery, Doctor, and docs-index guidance is updated and held consistent by `src/documentation.test.ts` V-9. |
| AC-6 | V-2 rejects duplicate and invalid names, non-string and nested values, aliases, anchors, merge keys, unsupported keys, malformed lines, and indentation failures as `CONFIG_INVALID` before spawn. Assertions cover field, reason, and value-free message/remediation/details/human/JSON forms. |
| AC-7 | `LiveProcessPort` still uses argument-array spawn with `shell: false`. V-4 compares literal variable references, command-substitution syntax, backticks, spaces, quotes, semicolons, and URL metacharacters without expansion. |
| AC-8 | The fresh environment map is passed only to `ProcessPort.spawnCopilot`. V-5 verifies ambient state is unchanged, non-Copilot operation traces contain no configured name/value, and durable records contain no configured map. |
| AC-9 | V-6 records zero rejected spawns and null launch intent/Copilot facts, then one corrected spawn from a fresh configuration read with no stale value. |
| AC-10 | V-7 uses a barrier around two distinct issue launches. Captured maps are frozen, disjoint, unchanged after a later source edit, and carry issue-3 and issue-4 attributes respectively. |
| AC-11 | V-1 through V-8 execute deterministic parser, launch, precedence, isolation, correction, concurrency, and confidentiality scenarios through injected memory adapters without live Copilot, credentials, telemetry, or network access. |
| AC-12 | V-2 and V-8 compare unique values only in test-local child-boundary memory. V-5 through V-8 scan errors, human/JSON output, snapshots, event JSONL, retained-log categories, and scenario evidence with zero matches outside the boundary/config fixture. |
| AC-13 | Final focused and full harness envelopes returned `status: ok`, correct scopes/delegated commands, and exit code 0. Direct `just verify-focused` and `just verify` also exited 0. |

## Named validation scenarios

| Validation | Result | Redacted evidence |
| --- | --- | --- |
| V-1 | Passed | Named rows: absent file, blank file, empty `copilot`, empty `environment`, valid plain/quoted strings, explicit empty string; maps and results are frozen. |
| V-2 | Passed | Named rows cover duplicate name, invalid-name variants, numeric/boolean/null scalars, flow and block nesting, alias, anchor, merge key, unsupported key, malformed syntax, and indentation. Every rendered surface omitted test-local values. |
| V-3 | Passed | Boundary names: `COPILOT_OTEL_ENABLED`, `COPILOT_OTEL_EXPORTER_TYPE`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_NAME`, `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT`, and explicit-empty control. Exact executable/args/cwd and absent/empty baselines passed. |
| V-4 | Passed | Inherited/configured and configured/Runner-owned collision matrices passed. Literal metacharacter transport passed; child composition is frozen and unrelated ambient keys are omitted. |
| V-5 | Passed | Git, GitHub, tmux, worker, Doctor, and generic command paths have no typed access to the map; operation/durable tripwire scans passed and ambient environment was unchanged. |
| V-6 | Passed | Ordered correction trace: rejected configuration produced launch-intent count 0 and spawn count 0; corrected invocation produced spawn count 1 from current configuration. |
| V-7 | Passed | Barrier fixture captured two issue-keyed immutable maps, exact issue-local resource attributes, zero cross-value matches, and stability after a later configuration edit. |
| V-8 | Passed | Ledger covers absent, empty, valid, explicit-empty, both collision classes, every invalid class, literal metacharacters, correction, and concurrent issues. Human output, JSON output, errors, snapshots, events, retained attempt logs, and ledger categories each had zero value matches. |
| V-9 | Passed | Four named documentation assertions cover mapping/defaults, grammar/example, literal/precedence behavior, invalid classes/value-free diagnostics, fresh correction/confidentiality, and migration/API/deployment impact. |
| V-10 | Passed | `harness checks --focused --json`, direct `just verify-focused`, `harness checks --json`, and direct `just verify` all completed successfully. |

## Validation results

- Pre-implementation `harness boot --json`: `status: ok`; application exit 0, exact bootstrap signal observed, composed full checks exit 0.
- Final focused harness: `status: ok`, scope `focused`, delegated command `just verify-focused`, exit 0; 19 suites and 247 tests passed.
- Final direct focused: `just verify-focused` exit 0; 19 suites and 247 tests passed; `git diff --check` passed.
- Final full harness: `status: ok`, scope `full`, delegated command `just verify`, exit 0; lint, formatting, types, tests, coverage, build, and diff check passed.
- Final direct full: `just verify` exit 0; 19 suites and 247 tests passed; lint, formatting, typecheck, build, and diff check passed.
- Coverage: statements 87.67%, branches 82.32%, functions 93.99%, lines 89.44%; every metric exceeds 80%.

## Confidentiality evidence

- Unique configured test values are compared only at parser or typed Copilot child boundaries.
- V-2 scans safe errors and both renderers; V-5 scans non-Copilot traces and durable state; V-6 scans rejected/corrected state; V-7 scans concurrent state; V-8 scans all required artifact categories.
- Repository evidence and documentation scans found fixture values only in test-local source definitions, never in README, guides, this implementation record, Runner-produced output, errors, snapshots, events, or retained logs.
- Evidence reports variable/scenario names and pass/fail only; no configured test value is reproduced here.

## Documentation evidence

| Category | Evidence |
| --- | --- |
| README/setup/behavior | `README.md` adds the public mapping, example, defaults, validation, precedence, literal, scope, correction, confidentiality, and no-impact guidance. Tool installation and setup commands are unchanged. |
| Configuration reference | `docs/phase-1-issue-run.md`, `docs/phase-3-recovery-operations.md`, and `docs/phase-4-repository-doctor.md` define the same strict name/value contract and empty defaults. |
| Usage examples | README and all three affected guides include safe configuration examples with explicit empty strings and named telemetry variables. |
| Migration/upgrade | README and guides identify the option as additive: absent mappings need no migration; persisted schemas, result contracts, state/data, APIs, and deployment remain unchanged. |
| API reference/specification | No network API or API behavior changed, so no OpenAPI/Swagger update is applicable. This no-impact rationale is stated in user guidance. |
| Architecture explanation | Added `ADR-260812-copilot-child-environment.md` and `CORE-COMPONENT-260812-copilot-child-environment-contract.md`; updated issue-run orchestration and `DECISION-LOG.md` exactly as planned. |
| Operations/recovery | Recovery guidance documents fresh reads, rejected correction, concurrent snapshot isolation, no hidden retry, Copilot-only scope, and confidentiality. |
| Deployment | Runner remains a short-lived local CLI with no daemon, service, container, or deployment procedure change; no deployment update beyond the explicit no-impact note is required. |
| Documentation index | `docs/README.md` indexes the shared Copilot child configuration contract. |
| Consistency proof | `src/documentation.test.ts` V-9 passed all named cross-guide assertions and qualifies the previous generated-telemetry-only wording. |

## Harness friction drain

- Coordinator `rpiv`: 0 pending observations; buffer remained empty.
- `rpiv-research`: 3 observations persisted and read back in `.harness/records/retro/2026-08-12/011-issue-17-rpiv-research.md`, then 3 cleared.
- `rpiv-planner`: 3 observations persisted and read back in `.harness/records/retro/2026-08-12/010-issue-17-rpiv-planner.md`, then 3 cleared.
- `rpiv-implementer`: 11 observations persisted and read back in `.harness/records/retro/2026-08-12/012-issue-17-rpiv-implementer.md`, then 11 cleared.
- Read-back checks confirmed schema 1.2, matching agent and plan ID, every pending fingerprint, and `disposition: kept`. Final JSON list envelopes for all four agents returned `status: ok`, zero observations, and exit code 0.
- Harness Doctor remained degraded only for machine-level capture/collector readiness; every repository-owned layer was healthy. The commit path uses `harness commit` and its attribution outcome is reported at handoff.

## Architecture and plan conformance

Implementation stays within the accepted child-environment ADR and core-component boundaries. Application persistence schemas and Copilot argument order are unchanged. No architecture or plan deviation occurred. Final acceptance remains owned by Verify.


## Infrastructure-recovery follow-up

This section appends evidence for approved follow-up Tasks T-6 through T-8 after workspace recovery; all prior Issue #17 evidence above is preserved. It provides implementation evidence for Verify and does not claim final acceptance.

### Completed follow-up tasks

- **T-6 (follow-up T-1):** `PRD.md` now identifies the exact placeholder-based telemetry-and-command line as the canonical short/prefix form, shows the complete actual runtime suffix, and replaces stale `-p` with `--prompt`.
- **T-7 (follow-up T-2):** `src/documentation.test.ts` adds narrow V-11/V-12 assertions for both exact forms, their explanatory context, Runner-owned project/issue attributes, and absence of the stale prompt flag.
- **T-8 (follow-up T-3):** targeted and root validation passed; this evidence was appended after draining implementation friction.

### Follow-up acceptance evidence

| AC | Evidence |
| --- | --- |
| AC-2 | The PRD complete runtime form preserves `copilot --yolo --name issue-<number> --agent rpiv --prompt "Deliver issue #<number>"`; V-11 asserts that exact suffix. |
| AC-3 | Both PRD forms place Runner-owned `OTEL_RESOURCE_ATTRIBUTES="project.name=<project>,issue.id=issue-<number>"` before Copilot; V-12 asserts the generated project/issue context. |
| AC-5 | `PRD.md` explicitly labels the exact short line as the canonical short/prefix form and distinguishes it from the complete actual runtime launch. V-11/V-12 prevent stale `-p` and incomplete-context regressions. |

### Follow-up validation evidence

- **V-11 exact form/context:** `just verify-focused src/documentation.test.ts` passed with 21 documentation tests, including both new Issue #17 cases.
- **V-12 Issue #17 regressions:** exact canonical prefix, complete runtime suffix, Runner-owned attributes, and stale-flag rejection passed.
- **V-13 root recipes:** final `just verify-focused` passed 19 suites / 249 tests; final `just verify` passed lint, formatting, typecheck, 19 suites / 249 tests, coverage, build, and diff check. Coverage remained 87.67% statements, 82.32% branches, 93.99% functions, and 89.44% lines.
- Per the infrastructure-recovery instruction, no `harness checks` command was run. Root justfile recipes remained the authoritative validation boundary.
- Two pre-existing Darwin temporary-fixture path aliases surfaced during focused validation. `src/integration.test.ts` and `src/doctor-integration.test.ts` now canonicalize only their test-local temporary roots with `fs.realpath`; targeted regressions and the root suites passed, with no production behavior change.

### Follow-up documentation evidence

- **Changed user-visible documentation:** `PRD.md` now contains the requested canonical short/prefix line and the complete actual runtime launch form.
- **README/configuration/usage/migration/API/operations/deployment:** no update required because this follow-up clarifies an existing launch contract and changes no setup, configuration option/default, supported workflow, API, persisted data, runtime operation, or deployment procedure.
- **Architecture:** no ADR, core-component, or decision-log update was required or made; the clarification remains within the accepted child-environment and issue-run orchestration contracts.

### Follow-up harness friction record

- Seven concrete `rpiv-implementer` observations were persisted and read back in `.harness/records/retro/2026-08-12/014-issue-17-rpiv-implementer-recovery.md`, then cleared with a successful JSON envelope.
- Coordinator, Research, and Plan buffers each returned `status: ok` with zero pending observations.
