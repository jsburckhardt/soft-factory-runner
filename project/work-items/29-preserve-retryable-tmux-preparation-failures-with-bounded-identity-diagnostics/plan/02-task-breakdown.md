# Task Breakdown: Issue #29

Tasks are dependency-ordered. Every task carries stable acceptance IDs, explicit test coverage, application-documentation impact, expected evidence, and global architecture references.

Re-entry baseline: T-1 through T-7 are completed by commit `84f5cbe138f8e1653624d6a1c8750e2ccceb1036` and retain AC-1 through AC-9 evidence. T-8 through T-12 are planned only for the later AC-10 addition; no AC-10 implementation or evidence is attributed to the baseline commit.

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

## Task T-8: Add bounded Doctor probe infrastructure and schema-v2 evidence

- **Status:** Planned
- **Complexity:** High
- **Dependencies:** T-1 and T-7 completed baseline
- **Acceptance Criteria:** AC-9, AC-10
- **Related ADRs:** ADR-260812-repository-doctor-readiness; ADR-260814-tmux-identity-failure-recovery; ADR-260810-typescript-node-cli
- **Related Core-Components:** CORE-COMPONENT-260812-repository-doctor-contract; CORE-COMPONENT-260814-tmux-identity-diagnostics; CORE-COMPONENT-260810-subprocess-execution; CORE-COMPONENT-260810-development-standards

### Description
Introduce the reusable infrastructure settled for Doctor AC-10 before implementing tmux operations. Extend Doctor command and managed-server results with original buffers capped at 4096 retained bytes per stream, exact pre-decode total counts, and truncation flags while draining overflow. Add injected private-workspace, managed foreground-process, exact process-observation, event-driven socket-readiness, clock/deadline, and token seams. Replace detached aggregate `Promise.race` behavior with one absolute 9000ms controller, a 6500ms operation cutoff, and awaited cleanup milestones at 7000ms kill-server cancellation, 7250ms post-kill wait, 7750ms SIGTERM wait, 8250ms SIGKILL wait, and 9000ms final absence proof. Define `DoctorResultV2`, `DoctorCheckResultV2`, closed `DoctorTmuxProbeEvidenceV1` enums/cleanup states, and deterministic human/JSON rendering without altering the 24 check IDs or exit behavior.

### Acceptance Criteria
- AC-10: Original bytes and byte counts are available for exact tmux parsing; truncation, operation, timeout, and cleanup facts are representable in versioned structured evidence.
- AC-10: The aggregate controller cannot resolve while a managed probe, client cancellation, or probe cleanup remains unsettled.
- AC-10: Evidence and rendering cannot contain raw output, IDs, PIDs, paths, names, arguments, environment values, helper values, hashes, or byte values.
- AC-9: Every new boundary is injectable and testable with temporary roots, virtual clocks, and controlled commands/processes without live tmux or network access.

### Test Coverage
- V-11 schema-v2, evidence-enum, byte-count, cap, redaction, and human/JSON parity tests.
- V-14 virtual-time operation-cutoff, aggregate-cancellation, managed-process settlement, and cleanup-reserve tests.
- V-16/V-17 direct focused/full gates after all dependent work.

### Documentation Impact
No application documentation is edited in this task. T-11 owns the schema-v1 to schema-v2 automation migration, output caps, aggregate timing, and cleanup documentation after interfaces stabilize. Any deviation from the accepted ADR/core-component requires a Plan return.

### Expected Evidence
- Exact 4095/4096/4097-byte stream fixtures with total counts, retained-buffer sizes, and truncation states.
- Strict accepted/rejected `DoctorResultV2` and `DoctorTmuxProbeEvidenceV1` fixtures.
- Paired human/JSON normalization showing identical safe evidence.
- Virtual timeline proving no report precedes probe cleanup settlement and no managed promise survives the result.
- Sentinel scan across result, error, rendered output, and test artifacts with zero prohibited values.

## Task T-9: Implement the isolated foreground tmux readiness probe and unconditional cleanup

- **Status:** Planned
- **Complexity:** High
- **Dependencies:** T-8
- **Acceptance Criteria:** AC-9, AC-10
- **Related ADRs:** ADR-260812-repository-doctor-readiness; ADR-260814-tmux-identity-failure-recovery; ADR-260811-prototype-one-run-orchestration
- **Related Core-Components:** CORE-COMPONENT-260812-repository-doctor-contract; CORE-COMPONENT-260814-tmux-identity-diagnostics; CORE-COMPONENT-260810-subprocess-execution; CORE-COMPONENT-260810-error-handling

### Description
Implement one dedicated Doctor tmux probe rather than routing through default-server `LiveTmuxPort`. Create and validate the exclusive mode-0700 OS-temp workspace and mode-0600 empty config/helper; start the discovered executable as a directly managed `-D -S <socket> -f <config>` foreground server; and require every client call to include the exact private `-S` selector and private noncredential environment. Run one event-driven socket wait and the settled no-retry sequence: session/dashboard creation, `has-session`, exact window-name list, positive dashboard pane PID, formatted issue-window creation, strict create parse, remain-on-exit, positive pane PID, one formatted pane observation, strict identity/cwd equality, and issue-window removal.

Treat returned dashboard and issue pane PIDs only as locators and record ephemeral compound process-group/start-token/executable/arguments/cwd identity before fallback signaling; never signal by PID alone. During cleanup, union recorded helpers with exact private-helper argument/workspace/launch/server-lineage candidates to cover creation before PID acceptance without process-name matching.

Own one `finally` path for success, launch failure, nonzero command, malformed/truncated bytes, identity/cwd mismatch, timeout, cancellation, and aggregate expiry. Request private `kill-server`, wait and escalate only the exact managed server, stop only still-matching recorded helper identities, remove only the exclusively owned tree after process cleanup, and verify server/helpers/socket/workspace absent. Any uncertain cleanup overrides functional success.

### Acceptance Criteria
- AC-10: A pass proves every settled session/window/pane/identity/observation/remain-on-exit/removal operation on the unique private server.
- AC-10: Creation and observation parse original bytes under the existing strict grammar, produce equal IDs, and observe the physical workspace cwd without retaining any value.
- AC-10: Every command carries the private socket selector; private configuration and environment prevent default-server and ambient-configuration contact.
- AC-10: Every path finishes with zero probe session, window, pane, helper, server, socket, config, helper file, or workspace, or fails with explicit cleanup uncertainty.
- AC-9: Tests use protocol-aware controlled executables/adapters and never invoke ambient/default tmux, Sparkta, credentials, Copilot, or live network.

### Test Coverage
- V-12 exact successful command/order/arguments, byte identity, equality, and final inventory test.
- V-13 table-driven operation, malformed output, overflow, timeout, cleanup-failure, and residual-resource matrix.
- V-14 aggregate cutoff/cancellation during server startup, every client boundary, and cleanup.
- V-16/V-17 direct focused/full gates.

### Documentation Impact
No application documentation is edited in this task. T-11 documents the final functional sequence, private isolation, timing, output, cleanup, and troubleshooting behavior. The issue-run tmux documentation is not changed unless implementation alters its existing 15-second/default-server contract, which this task prohibits.

### Expected Evidence
- Ordered trace beginning with foreground `-D -S -f`, followed only by `-S` client calls matching the settled sequence.
- Exact create and observe byte fixtures with parsed-equality/cwd assertions and no value-bearing retained output.
- Before/after ambient tripwire inventory proving zero default/named-server calls or mutations.
- Per-scenario resource ledger proving managed server/helper exits and socket/workspace absence after success and every injected failure.
- Cleanup escalation trace that signals only exact recorded process identities and never uses name-based process termination.

## Task T-10: Integrate strengthened command.tmux and migrate Doctor fixtures

- **Status:** Planned
- **Complexity:** High
- **Dependencies:** T-9
- **Acceptance Criteria:** AC-9, AC-10
- **Related ADRs:** ADR-260812-repository-doctor-readiness; ADR-260812-official-asset-distribution-installation; ADR-260814-tmux-identity-failure-recovery
- **Related Core-Components:** CORE-COMPONENT-260812-repository-doctor-contract; CORE-COMPONENT-260812-official-asset-installation-contract; CORE-COMPONENT-260814-tmux-identity-diagnostics; CORE-COMPONENT-260810-structured-events

### Description
Start the functional probe after executable discovery and map its final observation, including cleanup, to the existing `command.tmux` row. Preserve exact 24-ID order, all-blocking conjunction, complete non-fail-fast reports, repository facts, and exits 0/3/2. Migrate renderers and strict ready/blocked/isolated manifests to `DoctorResultV2`; render value-free tmux evidence in human and JSON forms. Replace no-op READY tmux fixtures with protocol-aware controlled executables or injected probe adapters that model the foreground private socket contract without a production test switch. Add installed-but-nonfunctional, malformed-create, malformed-observe, and cleanup-uncertain readiness variants while preserving one pass/fail outcome for every canonical ID and the official-asset vocabulary regression.

### Acceptance Criteria
- AC-10: `command.tmux` passes only after executable presence, complete functional success, and proved cleanup; installed no-op or malformed implementations fail READY.
- AC-10: `soft-factory doctor --json` returns structured actionable `DoctorTmuxProbeEvidenceV1` for functional failure and no dynamic/prohibited values.
- AC-10: Human and JSON output derive from one schema-v2 result and agree on operation, reason, bounds, cleanup states, readiness, and remediation.
- AC-10: The check set remains exactly the same ordered 24 IDs and no official delivery-agent authority changes.
- AC-9: Built and service fixtures are credential-free, temporary, no-network, and ambient-tmux tripwired.

### Test Coverage
- V-11 schema-v2 construction/rendering and prohibited-value tests.
- V-12 integrated `DoctorService` and built READY success path.
- V-13 installed-but-nonfunctional/malformed/cleanup failure matrix with exit 3.
- V-14 complete-result and deadline behavior under controlled timeouts.
- V-15 strict manifest, 24-row matrix, official-asset vocabulary, built CLI, documentation, and migration tests.

### Documentation Impact
No application documentation is edited in this task. It produces final executable/result examples for T-11. Record any unplanned check-ID, schema-field, command-grammar, configuration, or default-server change as an architecture divergence rather than silently updating fixtures.

### Expected Evidence
- `DOCTOR_CHECK_IDS` and official-asset regression remain exact 24-row matches.
- Ready fixture can pass only with a complete private functional trace; the former no-op executable returns NOT READY.
- Schema-v2 manifest diff and normalized human/JSON parity including structured tmux failure evidence.
- Failure matrix naming operation/reason/exit/timeout/byte/truncation/cleanup facts and exit 3.
- Issue-port, network, credential, Sparkta, Copilot, and ambient-tmux tripwires remain untouched.

## Task T-11: Update Doctor application documentation and migration guidance

- **Status:** Planned
- **Complexity:** Medium
- **Dependencies:** T-10
- **Acceptance Criteria:** AC-9, AC-10
- **Related ADRs:** ADR-260812-repository-doctor-readiness; ADR-260814-tmux-identity-failure-recovery; ADR-260811-engineering-harness-surface
- **Related Core-Components:** CORE-COMPONENT-260812-repository-doctor-contract; CORE-COMPONENT-260814-tmux-identity-diagnostics; CORE-COMPONENT-260806-project-command-interface; CORE-COMPONENT-260810-development-standards

### Description
During Implement, update README, PRD Doctor sections, docs index, `docs/phase-4-repository-doctor.md`, Doctor troubleshooting/schema migration guidance, tracked fixture descriptions, and `src/documentation.test.ts`. State that the exact 24 IDs remain while `command.tmux` now proves the private foreground sequence; document `-D/-S/-f` isolation, exact creation/observation formats, 4096-byte stream caps, 2000ms per-command/wait bound, 6500ms cutoff, cleanup milestones at 7000/7250/7750/8250ms, 2500ms total cleanup reserve, `DoctorResultV2`, value-free evidence, unconditional cleanup, and ambient-tmux prohibition. Mark schema-v1 automation consumers/manifests for schema-v2 migration. State that no configuration, run snapshot, issue-run tmux behavior, network API, database, service, container, or deployment migration applies.

### Acceptance Criteria
- AC-10: Operator and automation guidance precisely matches the settled functional sequence, result schema, evidence, timing, isolation, and cleanup contract.
- AC-10: Troubleshooting distinguishes executable absence, nonfunctional/malformed operations, and cleanup uncertainty without exposing probe values or recommending ambient inspection/destruction.
- AC-9: Documentation requires temporary controlled fixtures and fresh direct `just verify-focused` plus `just verify` boundaries.

### Test Coverage
- V-15 documentation phrase/link/schema/fixture/troubleshooting assertions and stale executable-only/schema-v1 scans.
- V-16/V-17 execute and validate the documented direct root recipes.

### Documentation Impact
This is the sole AC-10 application-documentation task. README, PRD, docs index, Doctor operations/troubleshooting, schema migration text, and documentation assertions are affected. Phase-1/recovery text changes only if a cross-link must clarify that the Doctor probe does not change normal tmux behavior. API specification, configuration migration, run-state migration, database migration, and deployment procedures remain not applicable.

### Expected Evidence
- Documentation diff with exact sequence, caps, timing, cleanup, evidence, and schema-v2 migration text.
- Passing documentation suite with resolved links and fixture references.
- Stale-guidance scan showing no executable-only `command.tmux`, schema-v1 automation claim, no-op READY fixture, or asynchronous cleanup wording.
- Explicit no-configuration/no-run-state/no-API/no-database/no-service/no-container/no-deployment impact statement.

## Task T-12: Run fresh authoritative focused and full repository validation

- **Status:** Planned
- **Complexity:** Medium
- **Dependencies:** T-8, T-9, T-10, T-11
- **Acceptance Criteria:** AC-9, AC-10
- **Related ADRs:** ADR-260812-repository-doctor-readiness; ADR-260811-engineering-harness-surface; ADR-260810-typescript-node-cli
- **Related Core-Components:** CORE-COMPONENT-260812-repository-doctor-contract; CORE-COMPONENT-260811-engineering-harness-interface; CORE-COMPONENT-260806-project-command-interface; CORE-COMPONENT-260810-development-standards

### Description
After all AC-10 product, test, fixture, and documentation work stabilizes, run direct root `just verify-focused` and then direct root `just verify`. Harness checks may provide additional structured feedback but do not replace either command. Audit all new fixtures for temporary unique roots, controlled protocol-aware executables/adapters, ambient tmux tripwires, no Sparkta path, no credential reads, and no live network/Copilot. Preserve the complete command, timing, suite/test, coverage, build, diff, resource-inventory, and clean-tree evidence without rewriting the completed T-7 baseline history.

### Acceptance Criteria
- AC-9: Both fresh direct root recipes exit zero with credential-free deterministic fixtures and at least 80 percent statement/branch/function/line coverage.
- AC-10: Focused/full runs prove functional READY, installed-but-nonfunctional/malformed NOT READY, structured evidence, aggregate cleanup coordination, ambient isolation, and zero residual probe resources.
- AC-10: Final evidence distinguishes new implementation from commit `84f5cbe` and names the new implementation commit when available.

### Test Coverage
- V-16 direct `just verify-focused` over Issue #29, Doctor, documentation, and official-asset regression suites.
- V-17 direct `just verify` full lint, format, strict types, tests/coverage, build, and diff boundary.

### Documentation Impact
Validation-only task; it edits no application documentation. It verifies T-11 and records any documentation defect as an Implement correction, not as waived impact.

### Expected Evidence
- Fresh direct `just verify-focused` transcript and exit 0.
- Fresh direct `just verify` transcript, 80-percent-plus coverage table, build result, and diff-check exit 0.
- Per-test cleanup inventory and ambient-tmux/Sparkta/credential/network tripwire audit.
- Final implementation notes mapping AC-9 and AC-10 to product, tests, docs, commands, and the post-baseline implementation commit.
