# Task Breakdown: Issue #29

Tasks are dependency-ordered. Every task carries stable acceptance IDs, explicit test coverage, application-documentation impact, expected evidence, and global architecture references.

## Task T-1: Implement original-byte identity parsing and bounded diagnostic construction

- **Status:** Completed
- **Completion Evidence:** `src/tmux-identity.ts`, command byte capture in `src/live.ts`, and `src/tmux-identity.test.ts` cover strict parsing, exact counts/caps, typed failures, and confidentiality; direct `just verify-focused` passed 22 suites/401 tests.
- **Complexity:** High
- **Dependencies:** None
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-9
- **Related ADRs:** ADR-260814-tmux-identity-failure-recovery; ADR-260811-prototype-one-run-orchestration; ADR-260810-typescript-node-cli
- **Related Core-Components:** CORE-COMPONENT-260814-tmux-identity-diagnostics; CORE-COMPONENT-260810-subprocess-execution; CORE-COMPONENT-260810-error-handling; CORE-COMPONENT-260810-development-standards

### Description
Extend `CommandResult`/`CommandExecutor` with ephemeral original stdout/stderr buffers and exact pre-decode byte counts while retaining decoded strings for unaffected adapters. Centralize one byte parser for tmux create and observe identities. Enforce horizontal tab, LF, one optional final LF, exact identifier grammars, valid nonempty observation cwd, and no partial-record acceptance. Build `TmuxIdentityDiagnosticV1` using the settled logical-record/field counting and closed 32-token signature rules. Return safe typed malformed failures; preserve nonzero observe as absence and nonzero create as command failure with diagnostic.

### Acceptance Criteria
- AC-1/AC-2: Valid create/observe bytes parse exactly and preserve current successful adapter behavior.
- AC-3: Every named malformed create/observe case fails without returning a partial identity.
- AC-4: Completed identity failures produce exact original byte counts and capped structural fields/tokens.
- AC-5: Raw bytes and values remain adapter-ephemeral and absent from safe error details.
- AC-9: Parser and command-boundary tests use controlled in-memory byte results only.

### Test Coverage
- V-1 valid transport/3.7b byte fixtures and optional-final-LF controls.
- V-2 complete twelve-case malformed matrix plus CRLF, invalid UTF-8, empty-field, and extra-final-LF controls.
- V-3 exact count/token/cap and secret/path sentinel assertions.

### Documentation Impact
No application documentation is edited in this task. T-6 documents the stabilized transport and diagnostic vocabulary; record any implementation divergence as a Plan return rather than documenting an unapproved behavior.

### Expected Evidence
- Byte fixture table showing exact `@1`, `%1`, `/tmp` values.
- Rejection matrix with stable `TMUX_IDENTITY_MALFORMED` outcomes and no returned identity.
- Exact diagnostic objects for empty, multi-record, CR/LF, backslash, identifier, and overflow inputs.
- Error/snapshot sentinel scan showing no raw buffers, field values, or arguments.

## Task T-2: Add v5 diagnostic persistence and common rendering

- **Status:** Completed
- **Completion Evidence:** `src/domain.ts`, `src/persistence.ts`, `src/reconciliation.ts`, `src/orchestrator.ts`, and `src/render.ts` implement v5 migration/replay/lifecycle and common rendering; persistence/reconciliation/recovery tests passed in the focused gate.
- **Complexity:** High
- **Dependencies:** T-1
- **Acceptance Criteria:** AC-4, AC-5, AC-6, AC-8, AC-9
- **Related ADRs:** ADR-260814-tmux-identity-failure-recovery; ADR-260811-prototype-three-recovery-concurrency
- **Related Core-Components:** CORE-COMPONENT-260814-tmux-identity-diagnostics; CORE-COMPONENT-260811-run-reconciliation-control; CORE-COMPONENT-260811-completion-evidence-reconciliation; CORE-COMPONENT-260810-persistence-recovery; CORE-COMPONENT-260810-structured-events; CORE-COMPONENT-260810-error-handling

### Description
Introduce strict `RunSnapshotV5` with nullable latest diagnostic; write new runs as v5, read v1-v5, normalize supported v4 through an explicit revisioned transition, and extend TransitionEventV2 replay to complete v5 snapshots. Introduce ReconciliationReportV2 and status schema version 4. Persist create failures while remaining `starting_tmux`; persist a malformed zero-exit observe diagnostic after the single collected pass. Replace on later failure, retain across rendering/absence, clear on accepted create/observe identity, and render safe common human/JSON meaning.

### Acceptance Criteria
- AC-4: The next JSON status/reconciliation result exposes every required bounded field.
- AC-5: Snapshot, event, report, error, logs, and rendering contain no prohibited values; human output has no upgrade advice.
- AC-6: A create parse failure leaves a revisioned retryable `starting_tmux` snapshot with lock/lease retained.
- AC-8: A retained diagnostic remains distinct from tmux identity/transcript and does not satisfy logs.
- AC-9: Persistence/replay/migration tests are deterministic and filesystem-local.

### Test Coverage
- V-4 v1-v5 parse/replay, v4-to-v5 transition, retain/replace/clear, event-before-snapshot, report/status schemas, and one-pass persistence tests.
- V-7 malformed-observe versus nonzero-absence behavior and LOG_NOT_FOUND independence.
- V-3 durable/rendered sentinel scan.

### Documentation Impact
No application documentation is edited in this task. T-6 owns schema migration, output, retention, and troubleshooting documentation after types and behavior stabilize.

### Expected Evidence
- Serialized RunSnapshotV5 and TransitionEventV2 with a bounded diagnostic and no raw data.
- Migration table for v1-v5 and v4 normalization revision/event proof.
- JSON status/reconcile and human captures derived from the same diagnostic.
- Observation-call trace proving diagnostic persistence without a second tmux observation.

## Task T-3: Tighten preparation reconciliation and resume authorization

- **Status:** Completed
- **Completion Evidence:** `src/reconciliation.ts`, `src/live.ts`, and `src/orchestrator.ts` enforce exact preparation proof, name-only refusal, and the immediate pre-create recheck; recovery-control tests passed in the focused gate.
- **Complexity:** High
- **Dependencies:** T-1, T-2
- **Acceptance Criteria:** AC-6, AC-7, AC-8, AC-9
- **Related ADRs:** ADR-260814-tmux-identity-failure-recovery; ADR-260811-prototype-three-recovery-concurrency; ADR-260811-prototype-one-run-orchestration
- **Related Core-Components:** CORE-COMPONENT-260814-tmux-identity-diagnostics; CORE-COMPONENT-260811-run-reconciliation-control; CORE-COMPONENT-260810-issue-worktree-locking; CORE-COMPONENT-260811-concurrent-run-admission

### Description
Add a bounded name-only tmux presence port that returns no candidate identity/cwd. For `starting_tmux`, require matching lock and lease, exact path/registration/branch, HEAD equal to persisted fetched-base advertised SHA, no staged/unstaged/untracked changes, no persisted tmux identity, and zero same-name candidates before `PREPARATION_RESUME_AVAILABLE`. Use the single report for authorization and repeat only name absence immediately before one create attempt. Any same-name candidate remains unknown ownership with no adoption or downstream launch.

### Acceptance Criteria
- AC-6: Exact clean zero-candidate preparation permits one create and the existing running transition without duplicate owned resources.
- AC-7: Any same-name candidate refuses resume and preserves all persisted/observed resources and processes.
- AC-8: Exact preparation authorizes only resume; HEAD, dirtiness, lock, lease, Git, or tmux-name unknown/mismatch authorizes nothing.
- AC-9: Name, Git, and call-count controls use temporary/controlled adapters only.

### Test Coverage
- V-5 zero-candidate retry, HEAD equality, cleanliness dimensions, one-pass report, action precondition recheck, and resource call counts.
- V-6 same-name candidate and race-appeared candidate preservation matrix.
- V-7 preparation safe-action matrix and LOG_NOT_FOUND.

### Documentation Impact
No application documentation is edited in this task. T-6 documents exact resume proof and the unchanged no-adoption rule.

### Expected Evidence
- Reconciliation matrix for exact, absent, mismatch, and unknown preparation facts.
- One successful trace with one name observation, one immediate pre-create check, one `new-window`, and no duplicate lock/lease/branch/worktree.
- Refusal traces with zero create/worker/RPIV calls and byte-identical owned state.

## Task T-4: Cover live tmux adapter and diagnostic boundaries

- **Status:** Completed
- **Completion Evidence:** `src/tmux-identity.test.ts` exercises byte-aware `createLivePorts` fixtures, exact arguments/timeouts, malformed matrices, bounds, exit semantics, and sentinels without live tmux; the focused gate passed.
- **Complexity:** Medium
- **Dependencies:** T-1, T-2
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-9
- **Related ADRs:** ADR-260814-tmux-identity-failure-recovery; ADR-260811-prototype-one-run-orchestration
- **Related Core-Components:** CORE-COMPONENT-260814-tmux-identity-diagnostics; CORE-COMPONENT-260810-subprocess-execution; CORE-COMPONENT-260810-development-standards

### Description
Extend the existing injected `CommandRunner` integration seam so tests supply original buffers for tmux commands. Add byte-exact valid and malformed tables, output-bound overflow cases, exit semantics, invalid UTF-8, and sentinels. Assert executable/argument arrays and 15-second bounds without executing live tmux.

### Acceptance Criteria
- AC-1/AC-2/AC-3: The live adapter path, not only a pure helper, proves exact acceptance and rejection.
- AC-4: Adapter failures carry the exact bounded diagnostic to the typed boundary.
- AC-5: Command arguments, stderr content, cwd values, and sentinels do not enter diagnostics.
- AC-9: No test invokes live tmux, GitHub, Copilot, credentials, or Sparkta.

### Test Coverage
- V-1 and V-2 through `createLivePorts(RecordingCommandRunner)`.
- V-3 cap and confidentiality tests at the adapter/error boundary.

### Documentation Impact
No direct documentation edits. T-6 cites the proven byte fixtures and controlled adapter boundary.

### Expected Evidence
- Recorded exact `tmux new-window`/`list-panes` arguments and timeouts.
- Adapter-level valid and malformed matrices.
- Diagnostic cap/truncation snapshots and sentinel zero-match report.

## Task T-5: Prove recovery, ownership preservation, logs independence, and one-pass behavior

- **Status:** Completed
- **Completion Evidence:** `src/recovery-control.test.ts`, `src/recovery-persistence.test.ts`, `src/orchestration.test.ts`, and `src/integration.test.ts` prove retry/refusal, one-pass lifecycle, resource counts, logs independence, and human/JSON surfaces; the focused gate passed.
- **Complexity:** High
- **Dependencies:** T-2, T-3, T-4
- **Acceptance Criteria:** AC-2, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9
- **Related ADRs:** ADR-260814-tmux-identity-failure-recovery; ADR-260811-prototype-three-recovery-concurrency
- **Related Core-Components:** CORE-COMPONENT-260814-tmux-identity-diagnostics; CORE-COMPONENT-260811-run-reconciliation-control; CORE-COMPONENT-260811-concurrent-run-admission; CORE-COMPONENT-260810-issue-worktree-locking; CORE-COMPONENT-260810-structured-events

### Description
Extend orchestration, recovery-control, reconciliation, persistence, and CLI fixtures. Cover initial/resumed create failure retention, zero-candidate retry, same-name refusal, HEAD/dirtiness mismatch, malformed observe retention, nonzero observe absence, diagnostic lifecycle, successful preparation/reconciliation continuity, LOG_NOT_FOUND, human/JSON parity, and all lock/lease/Git/tmux/worker/RPIV call-count invariants.

### Acceptance Criteria
- AC-2: Valid bytes still reach the existing running and reconciliation path.
- AC-4/AC-5: Next status/reconcile exposes only bounded retained structure with one-pass evidence.
- AC-6: Retry completes exactly one creation and no duplicate resource operation.
- AC-7: Unknown same-name state leaves every named resource and ownership field unchanged.
- AC-8: Logs and preparation authorization remain independent and exact.
- AC-9: Fixtures use temporary repositories/fakes and assert no external consumer access.

### Test Coverage
- V-4 through V-7, including CLI human/JSON paths.
- Regression coverage for active preservation, process launch counts, event order, and existing successful preparation.

### Documentation Impact
No direct application documentation edits. Produce behavior/output evidence consumed by T-6 documentation assertions.

### Expected Evidence
- Named scenario matrix with persisted revisions, report codes, safe actions, exits, and traces.
- Before/after resource inventories and exact operation counts.
- LOG_NOT_FOUND output with retained diagnostic still present in status/reconcile.
- Human/JSON parity assertions and no-upgrade-advice scan.

## Task T-6: Update affected operator and schema documentation

- **Status:** Completed
- **Completion Evidence:** README, PRD, docs index, issue-run/recovery/RPIV guides, and `src/documentation.test.ts` document and enforce transport, diagnostics, migration, refusal, logs, and no-impact boundaries; the documentation suite passed 25 tests and the focused gate passed.
- **Complexity:** Medium
- **Dependencies:** T-2, T-3, T-5
- **Acceptance Criteria:** AC-1, AC-5, AC-6, AC-7, AC-8, AC-9
- **Related ADRs:** ADR-260814-tmux-identity-failure-recovery; ADR-260811-prototype-three-recovery-concurrency; ADR-260811-prototype-one-run-orchestration; ADR-260811-engineering-harness-surface
- **Related Core-Components:** CORE-COMPONENT-260814-tmux-identity-diagnostics; CORE-COMPONENT-260811-run-reconciliation-control; CORE-COMPONENT-260806-project-command-interface; CORE-COMPONENT-260810-development-standards

### Description
Update affected application documentation only during Implement: README, PRD, docs index, `docs/phase-1-issue-run.md`, `docs/phase-3-recovery-operations.md`, migration/troubleshooting tables, and `src/documentation.test.ts`. Document exact HT/LF transport, strict identity grammars, diagnostic shape/caps/redaction/lifetime, RunSnapshotV5/report/status compatibility, create/observe failure distinctions, exact preparation resume proof, same-name refusal, one-pass behavior, LOG_NOT_FOUND independence, direct root validation, and no network API/deployment impact. Remove the tmux-upgrade recommendation.

### Acceptance Criteria
- AC-1: Operator documentation states exact accepted transport and rejects extra records/fields.
- AC-5: Documentation states the full prohibited-data boundary and contains no version-upgrade advice.
- AC-6/AC-7: Recovery guidance distinguishes zero-candidate retry from same-name unknown preservation and lists exact Git/ownership proof.
- AC-8: Logs guidance keeps LOG_NOT_FOUND and diagnostics/reconciliation separate.
- AC-9: Validation guidance requires credential-free controlled fixtures and both direct root recipes.

### Test Coverage
- V-8 documentation phrase/link/schema/troubleshooting assertions and stale-guidance scans.
- V-9/V-10 ensure documented direct validation commands remain executable.

### Documentation Impact
This is the bounded documentation task. README, PRD, and existing issue-run/recovery guides are affected; configuration, public command grammar, network API, service, database, and deployment procedures are not changed. Record that no API specification or deployment migration is applicable.

### Expected Evidence
- Documentation diff and passing `src/documentation.test.ts` assertions.
- Search report showing exact transport/v5/retry/log guidance and no upgrade recommendation.
- Link/path check and explicit no-API/no-deployment-impact text.

## Task T-7: Run authoritative focused and full repository validation

- **Status:** Completed
- **Completion Evidence:** Direct `just verify-focused` passed 22 suites/401 tests with `git diff --check`; direct `just verify` passed lint, formatting, strict type-check, 22 suites/401 tests, 88.66% statements/85.04% branches/94.62% functions/90.23% lines, build, and diff check. Focused and full harness JSON envelopes returned `status: ok` and delegated exit code 0.
- **Complexity:** Medium
- **Dependencies:** T-1, T-2, T-3, T-4, T-5, T-6
- **Acceptance Criteria:** AC-9
- **Related ADRs:** ADR-260811-engineering-harness-surface; ADR-260810-typescript-node-cli
- **Related Core-Components:** CORE-COMPONENT-260806-project-command-interface; CORE-COMPONENT-260811-engineering-harness-interface; CORE-COMPONENT-260810-development-standards; CORE-COMPONENT-260814-tmux-identity-diagnostics

### Description
Run direct `just verify-focused` during implementation after targeted tests stabilize, then direct `just verify` before handoff. Harness checks may provide additional structured feedback but do not replace direct root boundaries. Retain command exits, suites, coverage, build, formatting, lint, type, and diff evidence; confirm tests use only temporary repositories/controlled adapters and no Sparkta path or credential access.

### Acceptance Criteria
- AC-9: Both direct root recipes exit zero with credential-free deterministic tests and at least 80% global statement/branch/function/line coverage.
- The root justfile remains the command authority and is not duplicated or weakened.
- The final implementation evidence identifies every AC and includes documentation evidence from T-6.

### Test Coverage
- V-9 direct `just verify-focused` with targeted Issue #29 suites.
- V-10 direct `just verify` full lint/format/type/test/coverage/build/diff boundary.

### Documentation Impact
Validation-only task; it edits no application documentation. It verifies the T-6 documentation changes and records any documentation failure as an Implement correction, not a waived impact.

### Expected Evidence
- `just verify-focused` transcript and exit 0.
- `just verify` transcript, 80%+ coverage summary, build result, and diff-check exit 0.
- Credential/network/external-path fixture audit and clean implementation handoff status.
