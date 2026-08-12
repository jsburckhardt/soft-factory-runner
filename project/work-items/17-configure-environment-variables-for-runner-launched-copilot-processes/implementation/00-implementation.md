# Implementation Evidence: Issue 17

## Scope and status

Tasks T-1 through T-5 are implemented in dependency order and marked complete in the validated task breakdown. This record supplies redacted evidence for Verify; it does not claim final verification or acceptance.

### Verify-return follow-up

Follow-up task T-6 is complete after recovery of the removed implementation checkout. PRD section 27 now adds exactly one generic one-line invocation while preserving the complete concrete Runner command, and `src/documentation.test.ts` holds both forms stable. T-1 through T-5 evidence below is retained as historical implementation evidence; no Issue #17 runtime code or behavior changed.

## Acceptance evidence

| AC | Evidence |
| --- | --- |
| AC-1 | `RunConfiguration.copilotEnvironment`, frozen empty defaults, and strict `copilot.environment` parsing are implemented in `src/domain.ts` and `src/config.ts`. V-1 covers valid names, plain/quoted strings, and explicit empty strings. |
| AC-2 | `src/orchestration.test.ts` V-3 records the five planned telemetry variable names plus explicit-empty transport at `spawnCopilot`; executable, cwd, and the exact `--yolo --name issue-3 --agent rpiv --prompt Deliver issue #3` array are unchanged. |
| AC-3 | V-3 proves Runner-owned resource attributes replace a configured collision; V-4 proves configured entries replace allowlisted inherited collisions and preserves current issue attributes. |
| AC-4 | V-1 proves absent, blank, empty `copilot`, and empty `environment` defaults; V-3 compares absent and empty launch controls and finds only the pre-existing generated resource attribute. |
| AC-5 | README, issue-run, recovery, Doctor, and docs-index guidance is updated and held consistent by `src/documentation.test.ts` V-9. Follow-up V-11 proves PRD section 27 contains exactly one generic one-line invocation and preserves the complete concrete Runner command. |
| AC-6 | V-2 rejects duplicate and invalid names, non-string and nested values, aliases, anchors, merge keys, unsupported keys, malformed lines, and indentation failures as `CONFIG_INVALID` before spawn. Assertions cover field, reason, and value-free message/remediation/details/human/JSON forms. |
| AC-7 | `LiveProcessPort` still uses argument-array spawn with `shell: false`. V-4 compares literal variable references, command-substitution syntax, backticks, spaces, quotes, semicolons, and URL metacharacters without expansion. |
| AC-8 | The fresh environment map is passed only to `ProcessPort.spawnCopilot`. V-5 verifies ambient state is unchanged, non-Copilot operation traces contain no configured name/value, and durable records contain no configured map. |
| AC-9 | V-6 records zero rejected spawns and null launch intent/Copilot facts, then one corrected spawn from a fresh configuration read with no stale value. |
| AC-10 | V-7 uses a barrier around two distinct issue launches. Captured maps are frozen, disjoint, unchanged after a later source edit, and carry issue-3 and issue-4 attributes respectively. |
| AC-11 | V-1 through V-8 execute deterministic parser, launch, precedence, isolation, correction, concurrency, and confidentiality scenarios through injected memory adapters without live Copilot, credentials, telemetry, or network access. |
| AC-12 | V-2 and V-8 compare unique values only in test-local child-boundary memory. V-5 through V-8 scan errors, human/JSON output, snapshots, event JSONL, retained-log categories, and scenario evidence with zero matches outside the boundary/config fixture. |
| AC-13 | Final focused and full harness envelopes returned `status: ok`, correct scopes/delegated commands, and exit code 0. Direct `just verify-focused` and `just verify` also exited 0. The T-6 follow-up reran both direct recipes and both harness delegates successfully with 19 suites and 248 tests. |
| AC-14 | `PRD.md` section 27, bounded by `# 27. RPIV Execution` and `# 28. Attach`, contains exactly one standalone line equal to `OTEL_RESOURCE_ATTRIBUTES="project.name=<project>,issue.id=issue-<number>" copilot --yolo`; targeted V-11 passed. |
| AC-15 | `src/documentation.test.ts` now isolates section 27 with both headings, splits only that extract into lines, and asserts exactly one whole-line equality for the generic invocation. `TMPDIR=/private/tmp just verify-focused src/documentation.test.ts -t "V-11 PRD section 27"` passed the named section-scoped assertion. |
| AC-16 | The same bounded V-11 assertion retains the complete concrete `issue-123` invocation. Historical scoped review of `bea0df5^..bea0df5` shows the behavior/documentation follow-up surfaces were only `PRD.md` and `src/documentation.test.ts`; `git diff bea0df5^..bea0df5 -- src ':!src/documentation.test.ts' project/architecture` is empty. This correction changes no production source, PRD text, or architecture artifact. |

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
| V-11 | Passed | PRD section 27 contains the exact generic invocation on one line exactly once, and the complete concrete Runner command remains unchanged. |

## Validation results

- Pre-implementation `harness boot --json`: `status: ok`; application exit 0, exact bootstrap signal observed, composed full checks exit 0.
- Final focused harness: `status: ok`, scope `focused`, delegated command `just verify-focused`, exit 0; 19 suites and 247 tests passed.
- Final direct focused: `just verify-focused` exit 0; 19 suites and 247 tests passed; `git diff --check` passed.
- Final full harness: `status: ok`, scope `full`, delegated command `just verify`, exit 0; lint, formatting, types, tests, coverage, build, and diff check passed.
- Final direct full: `just verify` exit 0; 19 suites and 247 tests passed; lint, formatting, typecheck, build, and diff check passed.
- Coverage: statements 87.67%, branches 82.32%, functions 93.99%, lines 89.44%; every metric exceeds 80%.

## Follow-up validation results

- Focused documentation regression: `just verify-focused src/documentation.test.ts` exited 0; 1 suite and 20 tests passed.
- Final direct focused: `just verify-focused` exited 0; 19 suites and 248 tests passed; `git diff --check` passed.
- Final focused harness: `status: ok`, scope `focused`, delegated command `just verify-focused`, exit code 0; 19 suites and 248 tests passed.
- Final direct full: `just verify` exited 0 after the formatting correction; lint, formatting, typecheck, 19 suites/248 tests, coverage, build, and diff check passed.
- Final full harness: `status: ok`, scope `full`, delegated command `just verify`, exit code 0.
- Coverage remained statements 87.67%, branches 82.32%, functions 93.99%, and lines 89.44%.
- Validation used a canonical macOS temporary-directory path so Git worktree observations compared canonical paths; this changed no repository file or product behavior.

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
| PRD execution contract | `PRD.md` section 27 adds exactly `OTEL_RESOURCE_ATTRIBUTES="project.name=<project>,issue.id=issue-<number>" copilot --yolo` as one line while retaining the existing concrete Runner invocation. |
| Consistency proof | `src/documentation.test.ts` V-9 passed all named cross-guide assertions and qualifies the previous generated-telemetry-only wording. |

## Harness friction drain

- Coordinator `rpiv`: 0 pending observations; buffer remained empty.
- `rpiv-research`: 3 observations persisted and read back in `.harness/records/retro/2026-08-12/011-issue-17-rpiv-research.md`, then 3 cleared.
- `rpiv-planner`: 3 observations persisted and read back in `.harness/records/retro/2026-08-12/010-issue-17-rpiv-planner.md`, then 3 cleared.
- `rpiv-implementer`: 11 observations persisted and read back in `.harness/records/retro/2026-08-12/012-issue-17-rpiv-implementer.md`, then 11 cleared.
- Read-back checks confirmed schema 1.2, matching agent and plan ID, every pending fingerprint, and `disposition: kept`. Final JSON list envelopes for all four agents returned `status: ok`, zero observations, and exit code 0.
- Harness Doctor remained degraded only for machine-level capture/collector readiness; every repository-owned layer was healthy. The commit path uses `harness commit` and its attribution outcome is reported at handoff.

### Verify-return follow-up drain

- Coordinator `rpiv`, `rpiv-research`, and `rpiv-planner` each had zero pending observations.
- `rpiv-implementer` had five concrete observations. All five were persisted with schema 1.2, matching plan/agent identity, fingerprints, and `disposition: kept` in `.harness/records/retro/2026-08-12/014-issue-17-rpiv-implementer-follow-up.md`, read back, then cleared with a successful JSON envelope reporting `cleared: 5`.

## Verify-return validation investigation

- The smallest retry, `just verify-focused src/integration.test.ts -t "observes staged, unstaged, and untracked dirtiness and refuses forced worktree removal"`, reproduced the reported assertion with the default macOS `TMPDIR`: Git reported the canonical `/private/var/...` worktree while the fixture requested the aliased `/var/...` path.
- Repeating that same root recipe with `TMPDIR` resolved through `fs.realpathSync(os.tmpdir())` passed: 1 selected test passed and 20 were skipped. This isolates the condition to fixture path representation, not Issue #17 production behavior.
- No unrelated production or test code changed. PRD section 27 still contains the generic invocation exactly once and retains the complete concrete Runner command; the 20-test documentation suite passed within the focused/full gates.
- Canonical-temp direct `just verify-focused` passed 19 suites and 248 tests. A later full-gate run was terminated by host signal 11 after five Jest suites; one explicit retry of `just verify` passed lint, formatting, typecheck, 19 suites/248 tests, coverage, build, and diff checks.
- Canonical-temp `harness checks --focused --json` and `harness checks --json` both returned `status: ok`, the expected scope/delegated command, and exit code 0. Coverage remained statements 87.67%, branches 82.32%, functions 93.99%, and lines 89.44%.
- These results refresh AC-5 and AC-13 evidence only; all prior AC-1 through AC-12 behavior evidence remains unchanged. Final acceptance remains owned by Verify.

## Verify-return validation friction drain

- Coordinator `rpiv`, `rpiv-research`, and `rpiv-planner` had zero pending observations.
- Implementer observations, including the signal-11 full-gate retry, were persisted with schema 1.2 and matching plan/agent identity in `.harness/records/retro/2026-08-12/015-issue-17-rpiv-implementer-validation-return.md`.
- Retro read-back preserved every pending observation ID/fingerprint with `disposition: kept`; buffers were cleared only after persistence.

## Architecture and plan conformance

Implementation stays within the accepted child-environment ADR and core-component boundaries. Application persistence schemas and Copilot argument order are unchanged. No architecture or plan deviation occurred. Final acceptance remains owned by Verify.

## Restored PR head safe-TMPDIR validation resume

- Restored baseline: branch `copilot-fix`, commit `cdac69f47c23dad4510f656d2d1fb434d089f5c7`, tracking `origin/pr-22`, with a clean tree before validation.
- Cleanup inspection confirmed `src/integration.test.ts` creates disposable Git fixtures under `os.tmpdir()` and recursively removes only each fixture parent. The default macOS `TMPDIR` is the `/var/folders/...` alias while this checkout resolves under `/private/var/folders/...`; `/private/tmp` resolves canonically to itself and is outside the checkout.
- Canonical safe invocation: `TMPDIR=/private/tmp just verify-focused` and `TMPDIR=/private/tmp just verify`. No root recipe or product behavior changed.
- Targeted cleanup proof: `TMPDIR=/private/tmp just verify-focused src/integration.test.ts -t "observes staged, unstaged, and untracked dirtiness and refuses forced worktree removal"` passed 1 selected test with 20 skipped. The checkout and restored HEAD remained present afterward.
- V-11 command proof: `TMPDIR=/private/tmp just verify-focused src/documentation.test.ts -t invocations` passed the exact generic/concrete PRD regression. The generic line remained present exactly once after full validation.
- Focused proof: direct `TMPDIR=/private/tmp just verify-focused` passed 19 suites and 248 tests; `TMPDIR=/private/tmp harness checks --focused --json` returned `status: ok`, scope `focused`, delegated command `just verify-focused`, and exit code 0.
- Full proof: direct `TMPDIR=/private/tmp just verify` passed lint, formatting, typecheck, 19 suites/248 tests, coverage, build, and diff check. Coverage remained statements 87.67%, branches 82.32%, functions 93.99%, and lines 89.44%. `TMPDIR=/private/tmp harness checks --json` returned `status: ok`, scope `full`, delegated command `just verify`, and exit code 0.
- Checkout persistence proof succeeded after the targeted cleanup test, complete focused gate, direct full gate, and harness full gate; each check found `.git` and the exact restored HEAD. The generic invocation also remained exactly once after the direct full gate.
- Hidden setup/backtracking: the restored checkout had no dependencies. Ambient npm 11 `just setup` produced an unusable Jest tree, so `package-lock.json` was restored and the committed dependencies were reinstalled with npm 10.9.2 before successful validation. No tracked dependency file changed.
- Documentation impact: this resume changes implementation evidence and the generated RPIV retro only. README, API, configuration, usage, migration, architecture, operations, and deployment contracts remain unchanged because no application behavior or public contract changed.
- New friction record: `.harness/records/retro/2026-08-12/019-issue-17-rpiv-implementer-safe-tmpdir-resume.md`; all four observations were read back under schema 1.2 and cleared only after persistence.
- AC evidence impact: AC-5 and AC-13 receive refreshed PRD regression and safe validation evidence. Existing AC-1 through AC-12 implementation evidence remains unchanged. Final acceptance remains owned by Verify.

## Corrected AC-14 through AC-16 implementation resume

- **V-11 evidence:** `src/documentation.test.ts` now names a dedicated `V-11 PRD section 27 Copilot invocations` block, finds the exact section-27 and section-28 headings, slices only that bounded text, proves one exact standalone generic line, and proves the complete concrete Runner invocation remains in the same section.
- **Targeted result:** `TMPDIR=/private/tmp just verify-focused src/documentation.test.ts -t "V-11 PRD section 27"` exited 0; the named section-27 assertion passed, with 1 suite passing and 20 tests reported (11 selected by the V-11 pattern, 9 skipped).
- **Root and harness results:** canonical `TMPDIR=/private/tmp` direct focused and full recipes passed 19 suites and 248 tests. Focused and full harness envelopes both returned `status: ok`, delegated respectively to `just verify-focused` and `just verify`, and reported exit code 0. Full coverage remained statements 87.67%, branches 82.32%, functions 93.99%, and lines 89.44%.
- **Scoped AC-16 proof:** the original documentation follow-up commit `bea0df5` changed the behavior-bearing surfaces only in `PRD.md` and `src/documentation.test.ts`; excluding the documentation regression test leaves no `src/` production diff, and `project/architecture/` has no diff. The current correction changes the three Plan files, the section-scoped documentation regression test, implementation evidence, and RPIV retros; it does not change PRD, production code, architecture, or the verifier summary.
- **Documentation-impact decision:** no application-documentation update is required in this correction. PRD section 27 already contains both required invocations, and Runner setup, behavior, API, configuration, usage, migration, architecture, operations, and deployment contracts are unchanged. The affected evidence documentation is this implementation record plus the corrected Plan artifacts; the test change strengthens documentation-regression proof only.
- **Checkout persistence:** after targeted V-11, direct focused, focused harness, direct full, and full harness validation, `.git` remained present and `git rev-parse HEAD` remained `e2710594489f5c6b8fe3a9d00983613e07b1cc65` before the correction commit.
- **Friction records:** pending planner and implementer observations were persisted and read back under schema 1.2 in `.harness/records/retro/2026-08-12/021-issue-17-rpiv-planner-acceptance-coverage.md` and `.harness/records/retro/2026-08-12/021-issue-17-rpiv-implementer-acceptance-coverage.md`, then cleared through successful JSON envelopes. Coordinator and Research buffers were empty.

These corrections provide explicit implementation evidence for AC-14, AC-15, and AC-16 while preserving all prior AC-1 through AC-13 evidence. Final acceptance remains owned by Verify.
