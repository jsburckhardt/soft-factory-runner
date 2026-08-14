# Test Plan: Issue #29

All tests are repository-local, deterministic, credential-free, and isolated from Sparkta, live GitHub, live Copilot, ambient tmux resources, and consumer state. Controlled adapters/executables and temporary repositories provide all external facts. Root `just verify-focused` and `just verify` are mandatory direct validation boundaries.

Historical status: V-1 through V-10 were implemented and passed in commit `84f5cbe138f8e1653624d6a1c8750e2ccceb1036` for AC-1 through AC-9. V-11 through V-17 were later implemented and gate-passed through clean SHA `c58151adb48cfe8d1213f1004d627d5861cb5e05`, but independent Verify found that V-12 asserted operation order without proving the exact accepted Doctor pane-observation target.

Verification-return status: AC-1 through AC-9 passed independently; AC-10 remains failed. V-1 through V-17 remain historical evidence. V-18 through V-21 are planned correction tests and are not complete at Plan time.

## Test V-1: Exact tmux transport and controlled 3.7b bytes

- **Type:** Unit/live-adapter integration
- **Task:** T-1, T-4
- **Acceptance Criteria:** AC-1, AC-2, AC-9
- **Priority:** Critical

### Setup
Use `createLivePorts` with a byte-aware recording CommandRunner. Queue successful session/name preflight results, creation bytes `40 31 09 25 31 0a`, and observation bytes `40 31 09 25 31 09 2f 74 6d 70 0a`. Use only temporary cwd values and no external executable.

### Steps
1. Create and observe the controlled identity through the live tmux adapter path.
2. Repeat each result without the optional final LF.
3. Assert exact executable/argument arrays, horizontal-tab format strings, cwd, 15-second bound, and one command per adapter step.
4. Feed the resulting identity into the existing successful preparation/reconciliation fixture.

### Expected Result
Both permitted forms return exactly window `@1`, pane `%1`, and cwd `/tmp`; no alternate separator is accepted or required; successful preparation/reconciliation behavior and operation order remain unchanged.

### Expected Evidence
Hex-to-identity table, recorded command calls, exact identity assertions, and successful preparation/reconciliation trace with zero live service access.

## Test V-2: Complete malformed creation and observation matrix

- **Type:** Unit/table-driven live-adapter integration
- **Task:** T-1, T-4
- **Acceptance Criteria:** AC-1, AC-3, AC-9
- **Priority:** Critical

### Setup
Use the recording CommandRunner to return the six issue-specified creation outputs and six issue-specified observation outputs as original byte buffers with exit 0. Add bounded controls for CRLF, two final LFs, invalid UTF-8, empty cwd, embedded tab/LF, and partial identifiers.

### Steps
Invoke create or observe once per case; capture the typed error and any returned identity; inspect command counts.

### Expected Result
Every named case reports `TMUX_IDENTITY_MALFORMED` with malformed/ambiguous meaning, returns no partial identity, and performs no downstream remain-on-exit, pane-PID, worker, or RPIV operation. Nonzero observation is tested separately as absence, not folded into this matrix.

### Expected Evidence
Twelve required rows plus control rows showing input label, phase, exit, error code/message, returned identity `none`, and downstream call count zero.

## Test V-3: Bounded structural diagnostic and confidentiality

- **Type:** Unit/property/security regression
- **Task:** T-1, T-2, T-4
- **Acceptance Criteria:** AC-4, AC-5, AC-9
- **Priority:** Critical

### Setup
Construct original stdout/stderr buffers covering empty output, strict IDs, tabs, CR/LF, backslashes, invalid UTF-8, more than eight records, more than eight fields, more than 32 signature tokens, multibyte values, and unique secret/path/argument/environment/issue/owner/run sentinels.

### Steps
Generate diagnostics for create and observe failures; compare exact pre-decode byte lengths, record/field counts and truncation, token sequence and truncation; serialize errors/snapshots/events/reports/human/JSON/log results; scan every surface for sentinels and raw output fragments.

### Expected Result
The diagnostic contains only schema, phase, integer exit, exact byte counts, capped numeric summaries, truncation flags, and the closed value-free token vocabulary. Empty stdout reports zero records. Every cap is enforced. No prohibited sentinel, raw stderr/stdout, field value, path component, argument, environment value, run identity, hash, byte value, or other-run data appears.

### Expected Evidence
Exact diagnostic JSON fixtures, cap boundary table (8/9 records, 8/9 fields, 32/33 tokens), original-byte versus decoded-length assertions, and zero-match sentinel scan.

## Test V-4: RunSnapshotV5 lifecycle, migration, and one-pass exposure

- **Type:** Persistence/reconciliation/CLI integration
- **Task:** T-2, T-5
- **Acceptance Criteria:** AC-4, AC-5, AC-6, AC-9
- **Priority:** Critical

### Setup
Create strict v1-v5 snapshots and TransitionEventV1/V2 histories in memory/temporary files. Provide a `starting_tmux` v5 fixture and an exact persisted tmux fixture whose one observation returns malformed successful output. Instrument snapshot/event writes and observation counts.

### Steps
1. Load every supported version and reject unsupported/malformed variants.
2. Normalize v4 to v5 through one revisioned event; replay an event-ahead v5 snapshot.
3. Persist create failure, then inspect next status/reconcile JSON and human output.
4. Replace with a later diagnostic, call status without success, return observation absence, then accept valid create/observe identity.
5. For malformed observe, collect once, persist the diagnostic, and return the report without recollection.

### Expected Result
New writes are v5; v1-v5 remain readable under existing limits; TransitionEventV2 carries v5; latest diagnostic retains across rendering/absence, replaces on later failure, and clears only on valid identity. ReconciliationReportV2/status v4 expose common safe facts. Malformed observe performs exactly one tmux observation. No output recommends upgrading tmux.

### Expected Evidence
Version/migration/replay table, serialized revision/event sequence, retain/replace/clear snapshots, observation count `1`, paired human/JSON captures, and no-upgrade-advice scan.

## Test V-5: Exact zero-candidate preparation resume

- **Type:** Orchestration/recovery integration
- **Task:** T-3, T-5
- **Acceptance Criteria:** AC-2, AC-6, AC-8, AC-9
- **Priority:** Critical

### Setup
Use a temporary repository or complete controlled Git fixture with a v5 `starting_tmux` snapshot after a retained create parse failure. Match owner lock, slot lease, branch, worktree path/registration, HEAD to fetched-base advertised SHA, and all three cleanliness flags false. Return zero same-name candidates, then valid creation identity and worker identity. Record all resource/process calls.

### Steps
1. Reconcile and assert only `PREPARATION_RESUME_AVAILABLE`/`resume`.
2. Invoke resume once.
3. Repeat with HEAD mismatch and each staged/unstaged/untracked flag set separately.
4. Inspect transition order and counts for lock, lease, branch, worktree, name observation/recheck, creation, remain-on-exit, worker identify, and RPIV launch.

### Expected Result
The exact fixture performs one new window creation and continues the existing `running_rpiv` preparation transition without replacing ownership or creating branch/worktree/lock/lease/RPIV duplicates. Every HEAD/dirtiness mismatch authorizes no resume and creates nothing.

### Expected Evidence
Safe-action matrix, one successful ordered trace, persisted transition sequence, and exact counts: existing lock/lease/branch/worktree unchanged, one create, one worker identity, zero RPIV launch by the resume command.

## Test V-6: Same-name unknown ownership refusal

- **Type:** Recovery/safety integration
- **Task:** T-3, T-5
- **Acceptance Criteria:** AC-7, AC-9
- **Priority:** Critical

### Setup
Start from the same `starting_tmux` fixture without persisted tmux identity. Configure name-only observation to report one or more same-name windows without returning identities/cwd/process data. Add a race case where reconciliation first sees zero but the immediate pre-create check sees present. Snapshot every owned and tmux/process inventory before invocation.

### Steps
Run reconcile and resume for present-at-reconciliation and appeared-before-create cases; compare snapshots, lock, lease, Git tuple, tmux inventory, workers, and RPIV launch counts before/after.

### Expected Result
Present-at-reconciliation authorizes no resume. Appeared-before-create returns `RESOURCE_OWNERSHIP_UNKNOWN`. Both preserve every resource byte/fact, perform zero window creation and zero worker/RPIV launches, and never inspect or adopt candidate identity, cwd, or process command.

### Expected Evidence
Before/after inventory equality, safe-action/refusal codes, name-only call trace, zero create/worker/RPIV counts, and proof that no candidate detail entered diagnostics or output.

## Test V-7: Observe semantics, LOG_NOT_FOUND, and authorization independence

- **Type:** Reconciliation/logs/CLI matrix
- **Task:** T-2, T-3, T-5
- **Acceptance Criteria:** AC-4, AC-5, AC-8, AC-9
- **Priority:** Critical

### Setup
Prepare fixtures for zero-exit malformed observe, nonzero observe, prior retained diagnostic, exact/unknown/mismatched preparation ownership, no persisted tmux identity, and no retained transcript. Use controlled tmux/process adapters and temporary state only.

### Steps
1. Reconcile malformed zero-exit observe and inspect unknown diagnostic.
2. Reconcile nonzero observe and inspect absence with no new/replaced diagnostic.
3. Invoke logs with diagnostic but no identity/transcript.
4. Build exact, unknown, and mismatched preparation reports and compare decisions/safe actions.

### Expected Result
Malformed successful observe is unknown and retained; nonzero is absence and does not fabricate or replace diagnostic facts. Logs returns bounded `LOG_NOT_FOUND`. Exact preparation permits only `resume`; unknown/mismatch permits none. The diagnostic itself never changes authorization.

### Expected Evidence
Observe outcome table, retained diagnostic before/after comparison, LOG_NOT_FOUND human/JSON output, and decision/safe-action equality with diagnostic present versus absent.

## Test V-8: Application documentation and stale-guidance contract

- **Type:** Documentation regression
- **Task:** T-6
- **Acceptance Criteria:** AC-1, AC-5, AC-6, AC-7, AC-8, AC-9
- **Priority:** High

### Setup
Read README, PRD, docs index, issue-run guide, recovery operations guide, architecture links, troubleshooting/migration sections, justfile, and CLI help through `src/documentation.test.ts`.

### Steps
Assert exact HT/LF/optional-final-LF and identifier language; diagnostic shape/caps/prohibited data/lifetime; v5/report/status migration; zero-candidate retry proof; same-name unknown refusal; one-pass observation; LOG_NOT_FOUND independence; credential-free fixture policy; direct root recipes; no network API/deployment impact. Scan for stale tmux-upgrade advice.

### Expected Result
All affected guidance matches executable contracts and architecture; links resolve; no upgrade recommendation or raw/value-bearing diagnostic example remains; unaffected configuration/API/deployment surfaces are explicitly bounded.

### Expected Evidence
Passing documentation suite, required phrase/link table, and zero-match stale-guidance scan.

## Test V-9: Direct focused validation boundary

- **Type:** Focused quality gate
- **Task:** T-7
- **Acceptance Criteria:** AC-9
- **Priority:** Critical

### Setup
Completed implementation and documentation with controlled fixtures only. Confirm no test configuration references Sparkta, credentials, network endpoints, or ambient tmux resources.

### Steps
Run direct root `just verify-focused` with the Issue #29 relevant suites/arguments supported by the recipe; retain command and `git diff --check` output.

### Expected Result
The root recipe exits 0; all targeted parser, persistence, reconciliation, recovery, CLI, and documentation tests pass without external access; diff check passes.

### Expected Evidence
Exact direct command transcript, suite/test counts, exit 0, fixture-isolation audit, and diff-check result.

## Test V-10: Direct full repository validation boundary

- **Type:** Full quality gate
- **Task:** T-7
- **Acceptance Criteria:** AC-9
- **Priority:** Critical

### Setup
Completed implementation/documentation after V-9, with the root justfile unchanged as command authority and no live credentials or consumer resources.

### Steps
Run direct root `just verify`; retain lint, Prettier, TypeScript, Jest coverage, build, and `git diff --check` output.

### Expected Result
The command exits 0; all suites pass; statements, branches, functions, and lines remain at least 80%; build and diff check pass; no Sparkta or live external access occurs.

### Expected Evidence
Full direct `just verify` transcript, exit 0, suite/test totals, coverage table, build result, diff-check result, and external-access audit.

## Test V-11: Doctor schema-v2, byte caps, structured evidence, and confidentiality

- **Type:** Unit/schema/security regression
- **Task:** T-8, T-10
- **Acceptance Criteria:** AC-9, AC-10
- **Priority:** Critical

### Setup
Use controlled `DoctorCommandRunner`, workspace, clock, and renderer fixtures. Generate client and managed-server stdout/stderr at 4095, 4096, and 4097 retained-byte boundaries with different decoded and original byte lengths. Build every closed `DoctorTmuxProbeEvidenceV1` operation/reason/cleanup state with unique raw-output, path, socket, session, window, pane, PID, argument, environment, token, credential, issue/run, and Sparkta sentinels.

### Steps
1. Capture capped original buffers while draining/counting complete streams and assert exact byte counts/truncation.
2. Reject parsing or functional success whenever either stream is truncated.
3. Construct valid and invalid `DoctorResultV2` and tmux evidence shapes; reject unknown/missing/reordered schema facts.
4. Render paired human/JSON READY and NOT READY results and normalize every field.
5. Serialize results, errors, evidence, messages, and human output and scan for all sentinels and raw fragments.

### Expected Result
The runner retains no more than 4096 bytes per stream, reports truthful total counts and truncation, and never accepts a truncated functional result. Doctor schema version is 2 with the same exact 24 ordered IDs. Tmux evidence is versioned, bounded, value-free, actionable by operation/reason/cleanup state, and identical in human/JSON meaning. No prohibited value appears.

### Expected Evidence
Exact cap table, strict schema rejection table, normalized human/JSON fixtures, complete operation/reason enum coverage, and zero-match sentinel report.

## Test V-12: Successful isolated functional tmux readiness sequence

- **Type:** Adapter/service/built-CLI integration
- **Task:** T-9, T-10
- **Acceptance Criteria:** AC-9, AC-10
- **Priority:** Critical

### Setup
Create a temporary repository Doctor fixture and a protocol-aware controlled tmux executable or injected managed-process composition. The fake supports a directly managed foreground `-D` server, a unique full `-S` socket, alternate `-f` configuration, session/window/pane state, exact format output, remain-on-exit, pane PID, kill-window, and kill-server. Snapshot an ambient/default-server tripwire before invocation. Use no credentials, network, Copilot, live tmux, Sparkta, or consumer path.

### Steps
1. Run `DoctorService` and the built `soft-factory doctor --json` path.
2. Assert creation of one mode-0700 workspace and mode-0600 empty config/helper under the controlled OS temporary root.
3. Assert the exact foreground command and that every client call uses the same absolute executable and private `-S` socket.
4. Assert the ordered session/dashboard, has-session, list-windows, dashboard pane PID, new-window format, remain-on-exit, issue pane PID, list-panes format, equality/cwd, and kill-window sequence.
5. Return exact accepted create/observe original bytes, locate both helper processes by pane PID, and prove compound process identities before cleanup signaling.
6. Inspect final process/server/session/window/pane/socket/file/workspace inventories and compare the ambient tripwire.

### Expected Result
`command.tmux` passes and the complete 24-row report is READY/exit 0 only after every operation and cleanup passes. Exact creation/observation bytes satisfy the shared grammar and identity/cwd equality. Ambient tmux is untouched, and no probe resource remains.

### Expected Evidence
Exact argument/order trace, byte-to-parse assertions, mode/environment assertions, READY schema-v2 output, equal ambient before/after snapshot, and empty final probe inventory.

## Test V-13: Nonfunctional, malformed, bounded-failure, and cleanup matrix

- **Type:** Table-driven adapter/service safety integration
- **Task:** T-9, T-10
- **Acceptance Criteria:** AC-9, AC-10
- **Priority:** Critical

### Setup
Use the same controlled temporary composition with fault injection at workspace/config/helper creation, foreground launch, socket readiness, every client command, create parse, remain-on-exit, pane PID, observe parse, ID equality, cwd equality, kill-window, kill-server, managed wait, SIGTERM, SIGKILL, process observation, socket removal, tree removal, and final absence verification. Include absent executable, installed no-op executable, malformed create/observe bytes, nonzero exits, output overflow, and timeout variants. Include failures immediately after each helper starts but before its pane PID is accepted, and require exact helper-argument/cwd/launch/server-lineage candidate recovery. Faults may require fallback cleanup, but the controlled fixture must permit final exact cleanup before the report returns.

### Steps
1. Execute one variant per failure boundary with operation/process/workspace call counters.
2. Assert `command.tmux` failed, complete report exit 3, stable message/remediation, and exact evidence operation/reason/command facts.
3. For malformed identity variants, compare the optional bounded `TmuxIdentityDiagnosticV1` and reject all raw values.
4. Assert no retry or second identity observation and no operation after the first functional failure except cleanup.
5. Assert kill-server failure still triggers exact managed-process escalation and final resource absence.
6. Compare ambient/default tripwires and final server/session/window/pane/helper/socket/file/workspace inventories.

### Expected Result
Every installed-but-nonfunctional, malformed, timed-out, overflowed, mismatched, or cleanup-degraded variant is NOT READY with structured actionable value-free evidence. No variant contacts ambient tmux, retries, accepts partial proof, leaks values, or returns before all controlled probe resources are absent.

### Expected Evidence
Named failure table with operation/reason/exit/timeout/count/truncation/identity-structure/cleanup facts, call-count traces, sentinel scan, equal ambient snapshots, and empty final inventories for every row.

## Test V-14: Per-command, aggregate-deadline, cancellation, and awaited cleanup coordination

- **Type:** Virtual-time concurrency/lifecycle integration
- **Task:** T-8, T-9, T-10
- **Acceptance Criteria:** AC-9, AC-10
- **Priority:** Critical

### Setup
Use injected monotonic clock, scheduler, managed foreground process, cancellable client runner, socket waiter, process observer, and workspace adapter. Place a controlled stall at server startup, socket wait, each client operation, and each cleanup operation. Record timestamps, cancellation, signals, promise settlement, and result emission.

### Steps
1. Assert every external command and managed wait receives at most 2000ms.
2. Advance to 6500ms while each selected operation is active; assert cancellation, no later functional scheduling, and cleanup entry.
3. Exercise successful cleanup and fallback against absolute milestones: kill-server by 7000ms, post-kill wait by 7250ms, SIGTERM by 7750ms, SIGKILL by 8250ms, and final absence proof by 9000ms.
4. Assert the Doctor result appears only after the probe `finally`, process waits, socket/tree absence checks, and evaluation settlement.
5. Assert total controlled wall time is at most 9000ms and built READY remains at most 10000ms.

### Expected Result
The 6500ms cutoff always preserves 2500ms for cleanup. No probe operation, client, managed server, helper, timer, or evaluation promise survives result emission. Aggregate timeout yields a complete 24-row NOT READY result with cleanup-coordinated tmux evidence and no residual resource.

### Expected Evidence
Virtual timeline for each stall point, per-call timeout table, cancellation/signal trace, promise-settlement ledger, final resource inventory, and built-process timing record.

## Test V-15: Doctor manifests, canonical vocabulary, built CLI, and application documentation migration

- **Type:** Manifest/CLI/documentation regression
- **Task:** T-10, T-11
- **Acceptance Criteria:** AC-9, AC-10
- **Priority:** High

### Setup
Read `fixtures/doctor/ready.json`, `blocked.json`, `isolated-failures.json`, README, PRD Doctor/tmux sections, docs index, Phase 4 Doctor guide, architecture links, decision log, official-asset regression, justfile, and CLI help through controlled tests. Build the CLI and use only temporary process fixtures with protocol-aware fake tmux behavior.

### Steps
1. Assert all manifests emit schema version 2 and the exact unchanged 24 IDs in canonical order.
2. Execute the existing one-failure-per-ID matrix and additional functional tmux variants through actual Doctor composition.
3. Compare complete built human/JSON READY and NOT READY results, exits 0/3, evidence parity, determinism, and timing.
4. Assert official assets still depend on the unchanged canonical check set and no new authority/fallback exists.
5. Assert docs state strengthened `command.tmux`, exact sequence/formats, private isolation, caps, 2000/6500/7000/7250/7750/8250/9000 timing, schema-v2 migration, structured evidence, cleanup, and direct root boundaries.
6. Scan for stale executable-only, no-op READY, schema-v1 automation, asynchronous-cleanup, ambient/default-server, or destructive remediation guidance.

### Expected Result
Tracked manifests, actual Doctor checks, built CLI output, official-asset vocabulary, and application documentation agree with the accepted global architecture. The check count stays 24, schema migration is explicit, and no unrelated configuration/run-state/API/database/service/container/deployment change is claimed.

### Expected Evidence
Manifest diff, complete 24-row plus tmux-variant matrix, built human/JSON captures, official-asset regression result, documentation phrase/link table, and zero-match stale-guidance scan.

## Test V-16: Fresh direct focused validation boundary

- **Type:** Focused quality gate
- **Task:** T-12
- **Acceptance Criteria:** AC-9, AC-10
- **Priority:** Critical

### Setup
Complete AC-10 implementation, fixtures, and documentation. Audit test setup for temporary unique roots, controlled executable/process/workspace/clock seams, ambient tmux tripwires, and no Sparkta, credentials, network, live Copilot, or consumer resources.

### Steps
Run direct root `just verify-focused` with repository-supported arguments when useful, ensuring all Issue #29, Doctor, documentation, and official-asset regression suites execute; retain `git diff --check` evidence.

### Expected Result
The direct root recipe exits 0. Relevant suites prove schema, successful functional readiness, failure/cleanup matrices, aggregate coordination, docs, compatibility, and baseline AC-1 through AC-9 regression without external access.

### Expected Evidence
Exact direct command transcript, suite/test totals, exit 0, diff-check result, fixture-isolation audit, and final resource-inventory summary.

## Test V-17: Fresh direct full repository validation boundary

- **Type:** Full quality gate
- **Task:** T-12
- **Acceptance Criteria:** AC-9, AC-10
- **Priority:** Critical

### Setup
Successful V-16 result with root justfile unchanged as command authority and no live credentials, Sparkta, network, Copilot, consumer, or ambient tmux dependency.

### Steps
Run direct root `just verify`; retain lint, Prettier, strict TypeScript, Jest coverage, build, and `git diff --check` output. Audit final test cleanup and worktree status.

### Expected Result
The direct root recipe exits 0; all suites pass; statement, branch, function, and line coverage remain at least 80 percent; build and diff checks pass; no probe resources or external access remain.

### Expected Evidence
Full direct command transcript, exit 0, suite/test totals, coverage table, build/diff results, cleanup/isolation audit, and clean implementation handoff proof.

## Test V-18: Exact Runner-equivalent Doctor pane observation target

- **Type:** Unit/protocol/safety regression
- **Task:** T-13
- **Acceptance Criteria:** AC-9, AC-10
- **Priority:** Critical

### Setup
Use the existing controlled `DoctorTmuxProbe` fixture with private workspace names, socket, environment, accepted creation bytes `@1<TAB>%1<LF>`, accepted observation bytes, helper identities, and complete cleanup. Use no live tmux, ambient server, credential, network, Copilot, Sparkta, or consumer state.

### Steps
1. Run the successful protocol once and select the single recorded `pane-observe` command rather than relying only on operation order.
2. Assert its complete argument vector equals `[-S, <private-socket>, list-panes, -t, <sessionName>:<issueWindowName>, -F, #{window_id}<HT>#{pane_id}<HT>#{pane_current_path>]` and assert the absolute executable, workspace cwd, private environment, `shell: false`, and timeout at most 2000ms.
3. Select the single issue-pane-identify `display-message` call and assert its target remains parsed pane ID `%1` with format `#{pane_pid}`.
4. Assert no pane-observe call targets `%1` or another pane ID, every client retains the same private socket, and exactly one observation occurs.
5. Rerun successful equality/cwd proof, each pane-observe failure variant, cutoff/cancellation, unconditional cleanup, confidentiality, ambient tripwires, and final inventory assertions.

### Expected Result
Doctor uses the exact session/window target that `LiveTmuxPort.observe` uses while preserving pane-ID targeting only for the Runner-equivalent pane PID lookup. The strict original-byte observation and equality/cwd proof run once; every path remains bounded, value-free, isolated, and fully cleaned.

### Expected Evidence
Exact recorded command objects for pane observation and issue-pane PID lookup, call count one, passing protocol/failure/cutoff matrix, zero prohibited values, equal ambient before/after inventory, and no remaining server/helper/socket/workspace.

## Test V-19: Phase 1 persistence grammar and version semantics

- **Type:** Section-scoped application-documentation regression
- **Task:** T-14
- **Acceptance Criteria:** AC-9
- **Priority:** High

### Setup
Read `docs/phase-1-issue-run.md` in `src/documentation.test.ts`. Extract only the text from `## Persistence and status` up to but not including `## Troubleshooting`; fail if either boundary is absent or reversed.

### Steps
1. Assert the extracted section contains exactly: `Supported v1-v3 inputs normalize through v4 to sole just verify and never consult later configuration; supported v4 inputs preserve their snapshotted final validation while normalizing through an explicit revisioned v5 transition; malformed persistence fails safe.`
2. Assert that section does not contain `all supported inputs to sole`.
3. Assert the same section still says new runs use revisioned `RunSnapshotV5`, V1 remains compatibility-only, and explicit transitions are required.
4. Run only the documentation suite before the broader correction gates.

### Expected Result
The Phase 1 sentence is grammatical and architecture-accurate: v1-v3 normalize to the legacy sole validation, v4 preserves its own snapshotted final validation into v5, and unsupported/malformed state fails safe. Unrelated sections cannot satisfy the assertion.

### Expected Evidence
Section start/end indices, exact matched sentence, stale phrase absence in the slice, and passing targeted documentation result.

## Test V-20: Exact current PRD RunSnapshotV5 contract

- **Type:** Section-scoped schema/persistence/documentation regression
- **Task:** T-14
- **Acceptance Criteria:** AC-4, AC-9
- **Priority:** Critical

### Setup
In `src/documentation.test.ts`, extract PRD Sections 12, 21, 33, and 35 by their exact numbered headings and next-section boundaries. Parse the first fenced JSON object from each section. Import or invoke the production `parseSnapshot` validator for the Section 33 object.

### Steps
1. Assert Section 33 states that new runs write `RunSnapshotV5` and legacy versions are compatibility inputs only.
2. Parse its example and assert top-level `schemaVersion` is exactly 5.
3. Assert the exact required V5 top-level key set from `RunSnapshotV5`, including `ownerId`, revision/recovery facts, `requiredFinalValidation`, complete `integrationLaunch`, progress, and nullable `tmuxIdentityDiagnostic`; reject missing or extra example keys.
4. Assert the nested `IntegrationLaunchV1` identity, paths, final-validation binding, helper commands, and start facts agree with the enclosing snapshot.
5. Serialize the example and require `parseSnapshot(..., issueNumber)` to return the same V5 object.
6. Independently assert top-level schemas for Section 12 asset manifest v1, Section 21 Doctor result v2, Section 33 run snapshot v5, and Section 35 AgentResult v1. Do not infer top-level schema from repository-wide text or nested `schemaVersion` fields.

### Expected Result
PRD Section 33 contains a complete parser-accepted current V5 example and cannot imply that new runs write V1. Asset, Doctor, snapshot, result, and nested integration schemas remain correctly distinct.

### Expected Evidence
Extracted section headings and JSON objects, exact top-level key comparison, V5 production-parser round trip, schema tuple `{asset:1, doctor:2, snapshot:5, result:1}`, and passing documentation suite.

## Test V-21: Verification-return targeted, root, harness, and isolation gates

- **Type:** Targeted plus focused/full quality gate
- **Task:** T-13, T-14, T-15
- **Acceptance Criteria:** AC-4, AC-9, AC-10
- **Priority:** Critical

### Setup
Complete V-18 through V-20 with only controlled fixtures and temporary roots. Confirm no test references the external consumer, credentials, network services, live Copilot, or ambient/default tmux. Preserve the four existing verifier observations without listing, draining, clearing, or rewriting their bucket. Read `harness instructions checks` before invoking harness delegates.

### Steps
1. Run direct `just verify-focused src/doctor-tmux.test.ts src/tmux-identity.test.ts src/documentation.test.ts` and retain exact totals.
2. Inspect the controlled post-test resource inventory and ambient tripwires.
3. Run direct root `just verify-focused` and retain suite/test and diff-check evidence.
4. Run `harness checks --focused --json` and verify it delegates to the focused root recipe with exit 0.
5. Run direct root `just verify` and retain lint, format, strict type, all tests, coverage, build, and diff evidence.
6. Run `harness checks --json` and verify it delegates to full root verification with exit 0.
7. Run final `git diff --check`, inspect worktree state, and append actual correction evidence to implementation notes without claiming independent acceptance.

### Expected Result
Every command exits 0; coverage remains at least 80 percent for statements, branches, functions, and lines. Exact Doctor targeting, V5 documentation, Phase 1 grammar, prior AC-1 through AC-9 behavior, cleanup, isolation, and no-impact boundaries all pass. No probe resource or verifier-buffer mutation occurs.

### Expected Evidence
Targeted/focused/full direct transcripts, focused/full harness JSON envelopes, suite/test totals, coverage table, lint/format/type/build/diff results, exact Doctor target assertion, V5 parser proof, Phase 1 scoped assertion, empty resource inventory, isolation audit, clean correction handoff, and updated implementation evidence.

## Coverage Proof
| AC | Tests | Expected proof |
|---|---|---|
| AC-1 | V-1, V-2, V-8, V-17, V-21 | Existing exact transport/rejection/docs evidence plus fresh full regression |
| AC-2 | V-1, V-5, V-17, V-21 | Existing 3.7b identities and unchanged successful preparation/reconciliation plus fresh regression |
| AC-3 | V-2, V-17, V-21 | Existing complete malformed matrix with no partial identity plus fresh regression |
| AC-4 | V-3, V-4, V-7, V-17, V-20, V-21 | Existing retained fields/caps/persistence plus exact current V5 PRD parser proof and fresh gates |
| AC-5 | V-3, V-4, V-7, V-8, V-17, V-21 | Existing confidentiality/no-upgrade proof plus fresh regression |
| AC-6 | V-4, V-5, V-17, V-21 | Existing retryable state, exact proof, one create, and no duplicate resources plus fresh regression |
| AC-7 | V-6, V-8, V-17, V-21 | Existing same-name refusal, unchanged inventories, and no adoption plus fresh regression |
| AC-8 | V-5, V-7, V-8, V-17, V-21 | Existing `LOG_NOT_FOUND` and exact-only resume authorization plus fresh regression |
| AC-9 | V-1 through V-21 | Controlled temporary fixtures, scoped docs tests, targeted correction proof, direct focused/full gates, harness delegates, isolation audit, and untouched verifier buffers |
| AC-10 | V-11 through V-18, V-21 | Exact session/window `list-panes` target, retained pane-ID PID lookup, private functional trace, byte proof, bounded awaited cleanup, zero residual inventory, and refreshed gates |

Every AC has finite validation and expected inspectable evidence. Independent Verify accepted AC-1 through AC-9; V-20 strengthens AC-4 documentation proof and V-19 through V-21 refresh AC-9. Historical V-11 through V-17 do not prove the missed exact target: AC-10 requires planned V-18 and V-21 before Verify can decide acceptance. No test may use credentials, Sparkta, a live consumer, live network, live Copilot, or an ambient/default tmux server, and Plan/Implement must not drain verifier observations.
