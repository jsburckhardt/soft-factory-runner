# Implementation Notes: Issue #29

## Scope and status

Implemented tasks T-1 through T-12 in dependency order on `fix/29-tmux-preparation-diagnostics` without changing the accepted ADR or core-component contracts. Final acceptance remains owned by Verify.

AC-1 through AC-9 were implemented and committed before the Doctor requirement in baseline commit `84f5cbe138f8e1653624d6a1c8750e2ccceb1036`, from Plan/architecture baseline `1fe98fc865ea78dac196ddf05622749feba83ce4`. AC-10 was researched and planned separately in `26e16a4a617fbbddaf5dc822d4c1c906a37c8566`; tasks T-8 through T-12 below are the new Doctor implementation and do not use the AC-1–AC-9 commit as AC-10 evidence. The exact post-baseline implementation commit is recorded in the Implement handoff because a commit cannot embed its own final SHA.

## Completed tasks

| Task | Concrete evidence |
|---|---|
| T-1 | `src/tmux-identity.ts` and original-buffer capture in `src/live.ts`; strict parser, diagnostic, and adapter tests in `src/tmux-identity.test.ts`. |
| T-2 | RunSnapshotV5, ReconciliationReportV2, status v4, strict persistence/replay/migration, lifecycle, and common rendering in domain, persistence, reconciliation, orchestration, and render modules. |
| T-3 | Exact fetched-HEAD/cleanliness preparation proof, name-only presence observation, same-name refusal, and immediate pre-create race recheck. |
| T-4 | Byte-aware live-port tests for exact arguments, 15-second bounds, valid/malformed output, nonzero semantics, caps, and confidentiality. |
| T-5 | Recovery, persistence, orchestration, integration, one-pass, resource-count, refusal, logs, and human/JSON regression coverage. |
| T-6 | Updated README, PRD, docs index, issue-run guide, recovery guide, RPIV integration guide, and documentation assertions. |
| T-7 | Direct focused/full root validation and composed focused/full harness checks completed with successful final results. |
| T-8 | Strict DoctorResultV2/value-free evidence, 4096-byte original stream caps/counts, injected lifecycle seams, and one aggregate cancellation controller. |
| T-9 | Dedicated private foreground tmux probe with exact `-D/-S/-f` protocol, strict identity parsing, compound process ownership, unconditional bounded cleanup, and final absence proof. |
| T-10 | Functional `command.tmux` integration into the unchanged 24 IDs; schema-v2 manifests/rendering; protocol-aware built READY plus nonfunctional/malformed NOT READY fixtures. |
| T-11 | README, PRD, docs index/Doctor guide, migration/troubleshooting, and V-15 documentation assertions updated. |
| T-12 | Fresh targeted, direct focused/full, and harness focused/full validation completed after fixing recorded lint/format friction. |

## Acceptance evidence

### AC-1
- **Product:** `src/tmux-identity.ts` accepts one create record with exact `^@[0-9]+$` and `^%[0-9]+$` fields, or one observe record with those identifiers and a nonempty valid UTF-8 cwd. Parsing permits HT fields, LF records, and one optional final LF only.
- **Tests:** `src/tmux-identity.test.ts` exercises both final-LF forms, exact live-adapter calls, extra fields/records, alternate terminators, and invalid controls.
- **Documentation:** README, PRD, `docs/phase-1-issue-run.md`, and `docs/phase-3-recovery-operations.md` state the exact grammar and transport; `src/documentation.test.ts` enforces it.
- **Command evidence:** targeted documentation validation passed 25/25 tests; direct focused validation passed 401/401 tests.

### AC-2
- **Product:** create and observe adapters parse original command buffers before string decoding and continue into the existing preparation/reconciliation paths with typed `@1`, `%1`, and `/tmp` identity.
- **Tests:** exact tmux 3.7b creation bytes `40 31 09 25 31 0a` and observation bytes `40 31 09 25 31 09 2f 74 6d 70 0a` are asserted in `src/tmux-identity.test.ts`; successful preparation continuity is covered by orchestration/recovery tests.
- **Documentation:** the exact fixture and supported format are described in the issue-run and recovery guides.
- **Command evidence:** parser, orchestration, reconciliation, and recovery suites passed in both direct root gates.

### AC-3
- **Product:** malformed zero-exit create/observe output raises safe `TMUX_IDENTITY_MALFORMED` without a partial identity.
- **Tests:** table-driven create and observe matrices cover all twelve required cases plus CRLF, extra final LF, invalid UTF-8, empty cwd, extra fields, and partial identifiers through the live adapter boundary.
- **Documentation:** application guidance explicitly classifies empty, partial, extra-record/field, CR/CRLF, and invalid UTF-8 output as malformed or ambiguous.
- **Command evidence:** `src/tmux-identity.test.ts` passed as part of 22 focused and full suites.

### AC-4
- **Product:** `TmuxIdentityDiagnosticV1` records only phase, exit code, original stdout/stderr byte counts, capped 8-record/8-field summaries, and a capped 32-token closed structural signature. RunSnapshotV5, TransitionEventV2, ReconciliationReportV2, and status v4 persist and expose the latest diagnostic.
- **Tests:** exact empty/original-byte/token assertions, 8/9 and 32/33 cap boundaries, strict v5 round-trip/replay, v4 migration, replace/retain/clear lifecycle, and one-observation persistence are covered in tmux identity, persistence, reconciliation, and recovery tests.
- **Documentation:** README, PRD, docs index, issue-run, recovery, and RPIV integration guides describe the bounded schema and v5 compatibility.
- **Command evidence:** direct full coverage reported 100% statements/branches/functions/lines for `tmux-identity.ts`; all persistence and recovery suites passed.

### AC-5
- **Product:** raw buffers remain command-adapter-ephemeral; typed errors, snapshots, events, reports, logs, human output, and JSON contain no raw stdout/stderr or value-bearing identity fields.
- **Tests:** sentinel scans cover command arguments, stderr, cwd/path, environment, issue/owner/run identity, and other-run bytes; rendering tests reject tmux-upgrade guidance.
- **Documentation:** affected guidance states the complete prohibited-data boundary and contains no tmux version-upgrade recommendation.
- **Command evidence:** confidentiality and documentation tests passed in focused/full gates; repository documentation stale-guidance scan is encoded in `src/documentation.test.ts`.

### AC-6
- **Product:** create parse failures persist a revisioned RunSnapshotV5 in `starting_tmux` with lock/lease/Git ownership retained. Exact clean fetched-base HEAD and zero same-name candidates authorize one create; valid identity continues the existing transition.
- **Tests:** `src/orchestration.test.ts` retains the initial failure; `src/recovery-control.test.ts` proves one zero-candidate create, one worker identity, zero duplicate lock/lease/branch/worktree operations, and zero RPIV launch by resume. HEAD and staged/unstaged/untracked mismatches refuse mutation.
- **Documentation:** issue-run and recovery guides list every ownership, Git HEAD, cleanliness, identity, and name-absence precondition.
- **Command evidence:** orchestration and recovery-control suites passed in the 401-test focused/full results.

### AC-7
- **Product:** name-only observation returns presence without candidate identity/cwd/process detail. A same-name candidate or candidate appearing at the action recheck returns unknown ownership and performs no create or adoption.
- **Tests:** recovery-control scenarios assert present-at-reconciliation and appeared-before-create refusal, byte/fact preservation, zero create, zero worker, and zero RPIV calls.
- **Documentation:** README, PRD, issue-run, and recovery guidance require preservation and prohibit name/cwd/identity/process-command adoption.
- **Command evidence:** same-name and race scenarios passed in direct and harness-delegated gates.

### AC-8
- **Product:** retained diagnostics remain non-authorizing and distinct from identity/transcripts. `LOG_NOT_FOUND` remains the bounded outcome without a persisted tmux identity or transcript; exact preparation authorizes only `resume`, while unknown/mismatch authorizes nothing.
- **Tests:** `src/recovery-control.test.ts` covers LOG_NOT_FOUND with a retained diagnostic, exact/mismatch/unknown decisions, nonzero observe absence, and retain/replace/clear one-pass behavior.
- **Documentation:** README and recovery guides state logs independence and the exact-only preparation action.
- **Command evidence:** recovery, integration, rendering, and documentation suites passed in all final gates.

### AC-9
- **Product/test isolation:** tests use in-memory byte results, controlled ports/executables, and temporary repository/state roots. No ambient tmux, Sparkta, consumer worktree, GitHub credential, Copilot process, or network service was accessed or mutated.
- **Tests:** V-1 through V-8 are represented by parser/live adapter, persistence, reconciliation, orchestration, recovery, integration, and documentation suites.
- **Documentation:** docs require controlled credential-free fixtures and preserve direct root recipes as validation authority.
- **Command evidence:** direct `just verify-focused` and direct `just verify` exited 0; focused/full harness JSON envelopes returned `status: ok` with delegated exit code 0.
- **Revised-stage reinforcement:** V-11 through V-17 use injected ports, virtual clocks, temporary private roots, controlled Unix-socket executables, and ambient-tmux/network/issue-port tripwires. Fresh direct and harness gates passed 23 suites/442 tests.

### AC-10
- **Product:** `src/doctor-tmux.ts` and `src/doctor-tmux-live.ts` create one mode-0700 physical OS-temp workspace, mode-0600 empty config/helper, and directly managed foreground `tmux -D -S <private-socket> -f <empty-config>` server with no command. Every client uses the exact private `-S`; the one-pass protocol proves session/dashboard creation, `has-session`, exact window list, compound helper identity/server lineage, strict original-byte create, `remain-on-exit`, strict one-pass observe/equality/physical cwd, and exact window removal.
- **Bounds and cleanup:** `src/doctor-adapters.ts` drains every stream, retains at most 4096 original bytes, and preserves exact total counts/truncation. `src/doctor-service.ts` owns one 6500ms aggregate functional cutoff. The probe awaits private kill-server, bounded 7250/7750/8250ms escalation milestones, and 9000ms final server/helper/socket/workspace absence; partial workspace setup ownership and managed-server identity-acquisition failures receive exact owned cleanup.
- **Schema/rendering:** `src/doctor.ts` defines strict `DoctorResultV2`, exact closed `DoctorTmuxProbeEvidenceV1`, and unchanged canonical 24 IDs. `src/doctor-render.ts` renders the same value-free operation/reason/bounds/cleanup facts in human and JSON modes. Failed `command.tmux` includes no raw bytes/text, IDs, PIDs, paths, names, arguments, environment/helper values, hashes, or byte values.
- **Tests:** `src/doctor-adapters.test.ts`, `src/doctor.test.ts`, and `src/doctor-cli.test.ts` cover 4095/4096/4097 caps, strict schema/evidence rejection, confidentiality, and human/JSON parity. `src/doctor-tmux.test.ts` covers exact order/arguments/modes, strict create/observe bytes, all operation failures, malformed/overflow/timeout/mismatch cases, setup/launch/socket/lineage failures, server/helper/workspace cleanup uncertainty, cutoff at server startup and every client boundary, wait bounds, and final absence. `src/doctor-integration.test.ts` proves injected and built READY, installed no-op/malformed NOT READY, deterministic parity, 24-row preservation, and controlled resource cleanup; `src/asset-doctor-regression.test.ts` preserves official-asset vocabulary.
- **Documentation:** README, PRD, docs index, and Phase 4 Doctor guide document the exact private sequence, 4096/2000ms bounds, 6500/7000/7250/7750/8250/9000ms timeline, 2500ms cleanup reserve, schema-v2 migration, value-free troubleshooting, ambient prohibition, and no unrelated migration. V-15 documentation assertions pass.
- **Command evidence:** targeted probe/integration/documentation validation passed 3 suites/67 tests. Final direct `just verify-focused` passed 23 suites/442 tests. Final direct `just verify` passed lint, format, strict type-check, 23 suites/442 tests, coverage above 80% in every global category, build, and diff check. Both harness JSON envelopes returned `status: ok` with delegated exit code 0.

## Documentation evidence

- `README.md`: exact byte transport, bounded retained diagnostic, v5/report/status versions, preparation retry/refusal, logs independence, and no configuration/API/deployment change.
- `PRD.md`: executable tmux model, diagnostic confidentiality/caps, preparation authorization, and persisted schema compatibility.
- `docs/README.md`: current schema and recovery-document index wording.
- `docs/phase-1-issue-run.md`: exact identity transport and preparation ownership contract.
- `docs/phase-3-recovery-operations.md`: migration, one-pass observation, retry/race refusal, troubleshooting, LOG_NOT_FOUND, controlled fixtures, and no-impact guidance.
- `docs/rpiv-integration-contract.md`: RunSnapshotV5 and v4/v5 compatibility references.
- `src/documentation.test.ts`: baseline stale-upgrade assertions plus new V-15 Doctor sequence/schema/migration/stale-guidance checks; final suite passed 27 tests.
- **AC-10 README/PRD:** functional rather than executable-only tmux readiness, private protocol, bounds, cleanup, DoctorResultV2 migration, and no-impact statement.
- **AC-10 docs index/Doctor guide:** exact private sequence/formats, value-free evidence, aggregate milestones, controlled fixtures, safe troubleshooting, and schema-v1 consumer migration.
- **API no impact:** no network API, OpenAPI/Swagger contract, or public command grammar/check-ID set changed; no API specification or API migration note is applicable.
- **Configuration no impact:** the AC-10 Doctor probe adds no option, default, or configuration workflow; no configuration migration is required.
- **Deployment/operations:** no daemon, service, database, container, or deployment procedure changed; no run snapshot, issue-run tmux, or data migration applies. Local recovery and troubleshooting instructions were updated where runtime operator behavior changed.
- **Architecture:** no architecture document changed during Implement; implementation conforms to the Plan-committed ADR, core-components, and decisions 123 through 143.

## Validation results

- `just verify-focused src/documentation.test.ts`: exit 0; 1 suite and 25 tests passed; diff check passed.
- Direct `just verify-focused`: exit 0; 22 suites and 401 tests passed; `git diff --check` passed.
- `harness checks --focused --json`: `status: ok`, delegated `just verify-focused`, delegated exit code 0; 22 suites and 401 tests passed.
- First direct `just verify`: exit 1 at lint due one stale unused import; corrected and recorded as DL-005.
- Second direct `just verify`: exit 1 at format-check for 11 changed TypeScript files; formatted and recorded as DL-006.
- Final direct `just verify`: exit 0; lint, Prettier, strict TypeScript, 22 suites/401 tests, build, and diff check passed. Global coverage: 88.66% statements, 85.04% branches, 94.62% functions, 90.23% lines.
- `harness checks --json`: `status: ok`, delegated `just verify`, delegated exit code 0; the same lint/format/type/test/coverage/build/diff boundary passed.

### Revised AC-10 validation (post-`84f5cbe`)

- Targeted `just verify-focused src/doctor-tmux.test.ts src/doctor-integration.test.ts src/documentation.test.ts`: exit 0; 3 suites/67 tests; diff check passed.
- Fresh direct `just verify-focused`: exit 0; 23 suites/442 tests; `git diff --check` passed.
- `harness checks --focused --json`: exit 0 JSON envelope with `status: ok`, delegated `just verify-focused`, delegated exit 0, 23 suites/442 tests.
- Direct full attempts first exposed ESLint control-flow/unused bindings and then Prettier drift; both were corrected and retained as resumed Implement friction. A broad edit briefly broke a narrow parser catch and the required focused rerun caught it before the final gate.
- Final direct `just verify`: exit 0; lint, Prettier, strict TypeScript, 23 suites/442 tests, build, and diff check passed. Global coverage: 88.90% statements, 83.99% branches, 95.42% functions, 90.50% lines.
- `harness checks --json`: exit 0 JSON envelope with `status: ok`, delegated `just verify`, delegated exit 0, and matching lint/format/type/test/coverage/build/diff results.
- Controlled post-test inventory found no `soft-factory-doctor-*` roots. Earlier exact failed-test roots were enumerated and removed; subsequent integrated and full runs left none.

## Harness friction drain

- `rpiv`: zero pending observations; no retro record created.
- `rpiv-research`: 6 observations persisted and read back in `.harness/records/retro/2026-08-14/014-issue-29-rpiv-research.md`; schema 1.2, matching agent/plan, 6 kept dispositions; clear envelope `status: ok`, `cleared: 6`.
- `rpiv-planner`: 4 observations persisted and read back in `.harness/records/retro/2026-08-14/016-issue-29-rpiv-planner.md`; schema 1.2, matching agent/plan, 4 kept dispositions; clear envelope `status: ok`, `cleared: 4`.
- `rpiv-implementer`: 6 observations persisted and read back in `.harness/records/retro/2026-08-14/015-issue-29-rpiv-implementer.md`; schema 1.2, matching agent/plan, 6 kept dispositions; clear envelope `status: ok`, `cleared: 6`.
- Post-clear JSON listings for all four agents returned `status: ok` and empty observation arrays.

### Revised AC-10 drain

- `rpiv`: listing envelope `status: ok`, zero pending; no new retro created.
- `rpiv-research`: 7 observations persisted and read back in `.harness/records/retro/2026-08-14/017-issue-29-rpiv-research.md`; schema 1.2, matching agent/plan, all entries retained with `disposition: kept`; clear envelope `status: ok`, `cleared: 7`.
- `rpiv-planner`: 8 observations, including `CONF-001`, persisted and read back in `.harness/records/retro/2026-08-14/018-issue-29-rpiv-planner.md`; schema 1.2, matching agent/plan, all kept; clear envelope `status: ok`, `cleared: 8`.
- `rpiv-implementer`: 9 observations persisted and read back in `.harness/records/retro/2026-08-14/019-issue-29-rpiv-implementer.md`; schema 1.2, matching agent/plan, all kept; clear envelope `status: ok`, `cleared: 9`.
- The first safe commit exposed one additional trailer confusion. It was persisted/read back in `.harness/records/retro/2026-08-14/020-issue-29-rpiv-implementer-commit-trailer.md` with schema 1.2, matching agent/plan, and `disposition: kept`; its clear envelope returned `status: ok`, `cleared: 1` before recommit.
- Post-clear JSON listings for all four agents returned exit 0, `status: ok`, and empty observation arrays; the Implement buffer was also re-cleared after the trailer observation.

## Verify-return documentation correction

- **Returned defect:** Verify stopped before acceptance testing because PRD Section 12 incorrectly showed the unrelated official asset manifest as schema v2. Commit `717dfec4521a886cdd145c4593399922985d7131` was not amended.
- **Application documentation:** `PRD.md` Section 12 now again shows strict `.agents/manifest.json` `schemaVersion: 1`, matching product code, README, the official-asset ADR, and its core-component. PRD Section 21 remains the strict `DoctorResultV2` `schemaVersion: 2` example. No other application documentation changed.
- **Regression test:** the existing V10 documentation test now slices both PRD sections and asserts asset manifest v1/not-v2 and Doctor result v2/not-v1, preventing another global schema-replacement regression.
- **Acceptance mapping:** this correction reinforces AC-9 controlled validation and AC-10 documentation accuracy while preserving the unchanged official-asset contract; AC-1 through AC-8 product behavior is unaffected.
- **Documentation no-impact rationale:** no README, API, configuration, usage workflow, run-state/data/database migration, explanatory architecture, service, container, deployment, or operational procedure changed. No ADR/core-component change was needed.
- **Targeted validation:** final `just verify-focused src/documentation.test.ts` exited 0 with 1 suite/27 tests and diff check passed.
- **Focused validation:** final direct `just verify-focused` exited 0 with 23 suites/442 tests and diff check passed; `harness checks --focused --json` returned `status: ok`, delegated exit 0, and 23 suites/442 tests.
- **Full validation:** the first direct full attempt exposed only Prettier drift in `src/documentation.test.ts`; after formatting, final direct `just verify` exited 0 with lint, format, strict types, 23 suites/442 tests, 88.90% statements/83.99% branches/95.42% functions/90.50% lines, build, and diff check. `harness checks --json` returned `status: ok` with delegated exit 0 and matching results.
- **Implement friction drain:** two correction observations were persisted and read back in `.harness/records/retro/2026-08-14/021-issue-29-rpiv-implementer-verify-return.md` with schema 1.2, matching agent/plan, and `disposition: kept`; the clear envelope returned `status: ok`, `cleared: 2`. Coordinator, Research, Plan, and Implement listings then returned empty arrays.
- **Verifier ownership preserved:** `rpiv-verifier` remained untouched with exactly `DL-001` and `COORD-001` buffered for resumed Verify; Implement neither recorded, drained, nor cleared them.

## Divergence and blockers

No architecture or Plan divergence was required. AC-10 conforms to the revised Doctor ADR/core-component and decisions 135–143 while leaving the tmux identity architecture unchanged. All implementation/validation friction was corrected within the accepted contract; no blocker remains for Verify handoff.

## Verification-return target and persistence-documentation correction (T-13 through T-15)

The correction Plan at `971eb223c0c44ffac125c09d8c5f340c88d90d47` required no architecture change. ADR-260812 decisions 135–143 remain authoritative; no ADR, core-component, or decision-log file changed. This section records only the post-`c58151adb48cfe8d1213f1004d627d5861cb5e05` correction. It does not rewrite the AC-1 through AC-9 baseline or claim independent AC-10 acceptance.

### Completed correction tasks

- **T-13 / V-18:** `src/doctor-tmux.ts` now issues pane observation as private-socket `list-panes -t ${workspace.sessionName}:${workspace.issueWindowName} -F #{window_id}<HT>#{pane_id}<HT>#{pane_current_path}`. The issue-pane PID `display-message` remains targeted by parsed `creation.paneId`. `src/doctor-tmux.test.ts` selects each operation separately and compares its complete executable, argument vector, cwd, exact private environment, `shell: false`, and 2000ms timeout. Existing protocol, one-pass, failure, cutoff, confidentiality, and awaited-cleanup matrices remain passing.
- **T-14 / V-19:** `docs/phase-1-issue-run.md` now contains the exact planned v1-v3 and v4 normalization sentence. The regression slices only `## Persistence and status` through `## Troubleshooting`, requires the complete sentence, and rejects the stale malformed phrase in that slice.
- **T-14 / V-20:** PRD Section 33 now states that new runs write `RunSnapshotV5` and v1-v4 are compatibility inputs migrated only through supported explicit transitions. Its first JSON object has the exact 30 required top-level V5 keys and a complete bound `IntegrationLaunchV1`. The production `parseSnapshot` accepts and returns the example unchanged. Section-scoped evidence proves top-level schemas `{asset: 1, doctor: 2, snapshot: 5, result: 1}` while permitting nested schema-v1 integration/proof objects.
- **T-15 / V-21:** all targeted, root, harness, isolation, resource, diff, and evidence boundaries below completed. Final acceptance remains owned by Verify.

### Corrected acceptance evidence

#### AC-4
- **Product/documentation:** the persisted product contract remains unchanged; PRD Section 33 now accurately represents all `RunSnapshotV5` fields, including nullable `tmuxIdentityDiagnostic`, revision/recovery facts, final-validation binding, integration launch, and progress.
- **Test:** `src/documentation.test.ts` compares the exact top-level key set, validates nested launch identity/path/command bindings, and invokes production `parseSnapshot(JSON.stringify(example), 123)` with exact equality.
- **Command evidence:** targeted documentation validation passed 1 suite/29 tests; V-21 passed the persistence-aware documentation regression within 3 suites/89 tests; final focused/full gates passed 23 suites/444 tests.

#### AC-9
- **Product/test isolation:** the correction uses only the existing controlled Doctor adapter and repository-local documentation parser. No live tmux, ambient/default tmux selector, Sparkta/consumer path, credential, GitHub/Copilot process, or network endpoint was accessed. A changed-test sentinel scan found no forbidden external dependency; the post-test `/tmp` inventory contained no `soft-factory-doctor-*`, `doctor-actual-check-*`, or `doctor-built-*` root.
- **Documentation:** the Phase 1 and PRD assertions are bounded by exact section headings. No global schema replacement or broad negative schema assertion is used.
- **Command evidence:** direct targeted, focused, and full root recipes exited 0 after the recorded formatting correction; both harness envelopes returned `status: ok` with the expected scope/delegated recipe and delegated exit code 0.

#### AC-10
- **Product:** Doctor pane observation now matches `LiveTmuxPort.observe` exactly by targeting the owned session/window, while the Runner-equivalent pane PID lookup still targets `%1` through the parsed pane ID. Private `-S`, strict original-byte parsing/equality/cwd proof, one observation, operation order, bounds, value-free evidence, unconditional cleanup, and final absence behavior did not change.
- **Test:** V-18 compares the one pane-observe call with `-t session-<controlled>:issue-<controlled>` and separately compares the issue-pane-identify call with `-t %1`; it rejects `%1` in pane-observe. The complete 33-test Doctor protocol/failure/cutoff/cleanup suite and broader Doctor integration regressions pass.
- **Documentation:** existing Doctor guidance already described the accepted Runner-equivalent session/window target, so T-13 required no Doctor documentation change. The only application-document changes are the T-14 Phase 1 and PRD snapshot corrections.
- **Command evidence:** targeted Doctor validation passed 1 suite/33 tests; combined V-21 passed 3 suites/89 tests; final focused/full validation passed all 23 suites/444 tests.

### Documentation evidence and no-impact rationale

- Changed application documentation: `docs/phase-1-issue-run.md` (exact normalization semantics) and PRD Section 33 (parser-valid V5 example and compatibility statement).
- Regression coverage: `src/documentation.test.ts` section extraction, exact wording, exact top-level/nested keys, schema-family tuple, and production parser equality.
- No README, Doctor guide, recovery guide, API reference/specification, configuration instruction/default, deployment/runbook, or architecture document needed correction.
- No API, configuration, public command grammar, data/database migration, service, container, deployment, normal issue-run runtime, or operational-procedure behavior changed. No migration note beyond the corrected existing snapshot compatibility wording is applicable.

### Correction validation results

- T-13 targeted `just verify-focused src/doctor-tmux.test.ts`: exit 0; 1 suite/33 tests; diff check passed.
- T-13 root `just verify-focused`: exit 0; 23 suites/442 tests; diff check passed.
- T-14 targeted `just verify-focused src/documentation.test.ts`: exit 0; 1 suite/29 tests; production V5 parser assertion passed; diff check passed.
- T-14 root `just verify-focused`: exit 0; 23 suites/444 tests; diff check passed.
- V-21 targeted `just verify-focused src/doctor-tmux.test.ts src/tmux-identity.test.ts src/documentation.test.ts`: exit 0; 3 suites/89 tests; diff check passed.
- Final direct `just verify-focused`: exit 0; 23 suites/444 tests; diff check passed.
- `harness checks --focused --json`: process exit 0; envelope `status: ok`, `scope: focused`, delegated `just verify-focused`, delegated exit code 0; 23 suites/444 tests.
- First direct `just verify`: exit 1 at Prettier for `src/documentation.test.ts`; no tests ran. The file was formatter-normalized and the gate was rerun.
- Corrected direct `just verify`: exit 0; lint, Prettier, strict TypeScript, 23 suites/444 tests, build, and diff check passed. Global coverage was 88.90% statements, 83.99% branches, 95.42% functions, and 90.50% lines.
- `harness checks --json`: process exit 0; envelope `status: ok`, `scope: full`, delegated `just verify`, delegated exit code 0 with matching 23 suites/444 tests and coverage.
- Final resource inventory: no controlled Doctor workspace/socket roots remained. `git diff --check` passed.

### Correction friction drain and verifier ownership

- `rpiv` and `rpiv-research` list envelopes returned exit 0, `status: ok`, and no pending observations; no records or clears were needed.
- Five `rpiv-planner` observations were persisted in `.harness/records/retro/2026-08-14/022-issue-29-rpiv-planner.md`; read-back proved schema 1.2, matching plan/agent, all five IDs/fingerprints, and `disposition: kept`. The agent-scoped clear returned exit 0, `status: ok`, `cleared: 5`; the post-clear list was empty.
- Four `rpiv-implementer` observations were persisted in `.harness/records/retro/2026-08-14/023-issue-29-rpiv-implementer.md`; read-back proved schema 1.2, matching plan/agent, all four IDs/fingerprints, and `disposition: kept`. The agent-scoped clear returned exit 0, `status: ok`, `cleared: 4`; the post-clear list was empty.
- One post-evidence `rpiv-implementer` observation was persisted and read back in `.harness/records/retro/2026-08-14/024-issue-29-rpiv-implementer-evidence-eof.md`; schema 1.2, plan/agent, ID/fingerprint, and `disposition: kept` all matched. Its agent-scoped clear returned exit 0, `status: ok`, and `cleared: 1`.
- No command listed, drained, cleared, or rewrote `rpiv-verifier`. The user-reported verifier observations `DL-001`, `COORD-001`, `DL-002`, and `INS-001` remain owned by resumed Verify and were not used as Implement evidence.

## PR CI portability return implementation

This correction is committed on top of local verification-return metadata HEAD `e739aeab458fd34823c7703936d5c7b77840e5a5`; it does not amend or rewrite remote PR head `95330573569e5459c7ac9dd6eded22fbbc63f189` or prior product SHA `8ffd7eaf6910c1ee179553609e0721bd9d7fdddc`. Final acceptance and publication remain owned by Verify.

### Root cause and bounded correction

- The built protocol fake published `child.pid` immediately after `child_process.spawn` returned. A targeted run reproduced the CI symptom locally: the first built READY process exited 3, while an unchanged rerun of the retained fixture passed. Canonicalizing the expected executable alone did not remove that failure, disproving the lexical-path hypothesis as the sole cause. The portable failure was a fixture launch-readiness race: slower CI scheduling allowed Doctor to inspect a helper before the fake had awaited its `spawn` milestone, and Doctor correctly refused the transitional compound identity.
- The fake now launches the exact executable in Doctor's tmux command rather than substituting its own ambient `process.execPath`, awaits the child `spawn` event, and keeps its private protocol connection allow-half-open until the response is written. Its test trace records only value-free booleans proving exact/physical executable, one exact helper argument, workspace cwd, and foreground-server parent relationship before PID publication.
- The live boundary now resolves `process.execPath` once with native realpath semantics. The same physical path is passed to `new-session` and `new-window` and compared exactly with kernel-resolved `/proc/<pid>/exe`. This closes the latent lexical-versus-physical alias gap without basename matching or path broadening.
- No ownership proof was weakened: PID, process group, start token, exact physical executable, exact sole helper argument, physical cwd, launch interval, and foreground-server lineage remain required. `sameIdentity` and exact pre-signal rechecks are unchanged; unknown identity remains refusal. Private `-S`, exact session/window observation target, byte caps, deadlines, cleanup milestones, 24 checks, DoctorResultV2, and value-free evidence are unchanged.

### AC evidence

#### AC-1 through AC-8

- No product, test, persistence, documentation, or validation-contract behavior for AC-1 through AC-8 changed. Their independently verified baseline evidence remains in the preceding sections and prior commits.

#### AC-9

- **Product/test isolation:** All new coverage uses injected identities, two temporary executable symlinks, and the existing private protocol-aware built fixture. It invokes no ambient/default tmux, Sparkta path, credential, live GitHub/Copilot process, or network endpoint.
- **Regression:** `src/doctor-tmux.test.ts` resolves two lexical aliases to the same physical Node executable and accepts that exact identity, then resolves `/bin/sh` as a genuinely different executable and proves refusal with `process-identity-unknown`.
- **Built portability:** `src/doctor-integration.test.ts` awaits helper spawn settlement and proves exact value-free executable/argument/cwd/parent facts for all six helpers across the three READY human/JSON built runs. The ready case also passed three consecutive targeted stress reruns.
- **Command evidence:** Targeted validation passed 2 suites/41 tests. Direct and harness focused/full gates passed 23 suites/445 tests.

#### AC-10

- **Product:** Doctor launches the private helpers with one canonical physical Node executable and accepts only the identical kernel-resolved executable plus all pre-existing compound identity and lineage facts. A different executable is still refused before protocol continuation.
- **Built outcomes:** READY reaches the complete protocol and exits 0; nonfunctional reaches `socket-unavailable`; malformed create and observe reach `malformed-output`, rather than collapsing to `process-identity-unknown`. Existing cleanup assertions continue to require absent/not-created server/helpers/socket and absent workspace.
- **Confidentiality:** New traces contain only closed boolean readiness facts; no executable, path, PID, argument, cwd, process token, or raw command value is rendered or persisted in Doctor evidence.
- **Command evidence:** Direct full validation and the full harness delegate passed lint, format, strict TypeScript, 23 suites/445 tests, build, diff check, and coverage above 80% in every category.

### Documentation evidence and no-impact rationale

No application documentation changed. The correction implements the already documented and architected physical executable identity and settled helper readiness behavior; public Doctor output, command sequence, 24-check schema, evidence schema, setup, configuration, usage, troubleshooting, migration, API, data/database, service, container, deployment, and normal issue-run behavior do not change. ADR-260812, CORE-COMPONENT-260812, and decisions 135-143 remain unchanged and authoritative.

### Validation evidence

- Targeted `npx jest --runInBand src/doctor-tmux.test.ts src/doctor-integration.test.ts`: exit 0; 2 suites/41 tests.
- Built READY stress regression: three consecutive targeted runs exited 0; each passed 1 suite/1 selected test.
- Direct `just verify-focused`: exit 0; 23 suites/445 tests; `git diff --check` passed.
- `harness checks --focused --json`: process exit 0; envelope `status: ok`, `scope: focused`, delegated `just verify-focused`, delegated exit code 0; 23 suites/445 tests.
- Direct `just verify`: exit 0; lint, Prettier, strict TypeScript, 23 suites/445 tests, build, and diff check passed. Coverage: 88.90% statements, 83.99% branches, 95.42% functions, 90.50% lines.
- `harness checks --json`: process exit 0; envelope `status: ok`, `scope: full`, delegated `just verify`, delegated exit code 0; matching 23 suites/445 tests and coverage.
- Isolation/resource proof: final `soft-factory-doctor-*`, `doctor-ready-process-*`, and `doctor-executable-identity-*` workspace inventory was empty; matching process inventory was empty. Nine helpers retained only by failed debugging runs were removed after fixed-PID compound executable/argv/cwd/start-token rechecks, and the empty inventory was read again. No ambient tmux, Sparkta, credential, network, or live Copilot operation was invoked.

### Friction drain

- `rpiv`, `rpiv-research`, and `rpiv-planner` had zero pending entries. `rpiv-implementer` had five entries (`DL-001`, `INS-001`, `DL-002`, `INS-002`, `DL-003`).
- All five Implement entries were persisted in `.harness/records/retro/2026-08-14/028-issue-29-rpiv-implementer.md`; read-back proved schema 1.2, matching plan/agent, every ID/fingerprint, and `disposition: kept`. Agent-scoped clear envelopes all returned exit 0 and `status: ok`; Implement cleared 5 and the other allowed buffers cleared 0. Post-clear lists for all four allowed agents were empty.
- No command listed, drained, cleared, or rewrote `rpiv-verifier`. Existing verifier retro records and verification summaries remain untouched; the user-reported final verifier harvest remains 14 records/61 entries with pending zero.

## Repeated hosted-CI return: stable controlled helper readiness

This fixture/evidence correction is implemented on top of verification-return metadata HEAD `a2023f7485aece20668b75e30b594416b2bf4a0f`. It preserves remote PR head `33eecb8c4f5fe13d37f86aac1cba1b8434253579` and all prior commits; no reset, amend, push, issue edit, or PR edit was performed. Final acceptance and hosted publication remain owned by Verify.

### Exact race and correction

- CI run `31809715459` failed the same four built Doctor cases on Node 22 and Node 24 after `33eecb8`, while local direct/harness validation passed 445 tests. This disproved `ChildProcess` `spawn` plus one immediate procfs read as a portable stable-identity barrier. `spawn` proves launch initiation, not that a second process can safely consume a stable compound `/proc/<pid>` snapshot.
- The controlled fake now waits at most 1000 ms, checking every 10 ms. It publishes a pane PID only after two consecutive identical snapshots prove the requested executable physical path, exact sole helper argument, exact cwd, direct server parent, positive process group, and numeric start token. The snapshot signature is ephemeral; only booleans, closed categories, bounded counts, and cap values enter test diagnostics.
- A deterministic delayed mode keeps `spawnObserved: true` while making the first three identity checks non-authorizing. Both dashboard and issue helpers then require at least five attempts: three delayed checks followed by two identical accepted snapshots. A timeout mode keeps spawn successful but forces the executable category non-authorizing until the 1000 ms cap, terminates the exact child, returns command failure, and never publishes a pane PID.
- The fake also awaits exact helper termination on `kill-window`, `kill-server`, and server signals, with fixture-local SIGTERM/SIGKILL settlement bounds. This prevents failed assertions from orphaning controlled helpers.
- Production source is unchanged in this correction. The canonical physical executable behavior from `33eecb8` remains, as do Doctor single-observation semantics, PID/PGID/start-token/executable/argument/cwd/launch-window/server-lineage requirements, exact pre-signal identity checks, unknown refusal, private socket isolation, command order, byte caps, deadlines, cleanup, 24 checks, and DoctorResultV2.

### Acceptance evidence

#### AC-1 through AC-8

No product, parser, persistence, recovery, logs, documentation, or validation-contract behavior changed. Prior independently passed evidence remains authoritative.

#### AC-9

- **Deterministic isolation:** Changes are confined to `src/doctor-integration.test.ts`, work-item evidence, and the Implement retro. The fixture uses only temporary roots, a private local Unix socket, requested local executables, and procfs for its exact owned child. No ambient/default tmux, Sparkta path, credential, network endpoint, or live Copilot process is used.
- **Regression:** Delayed and timeout modes prove bounded synchronization/refusal. Existing equivalent physical aliases remain accepted and a truly distinct executable remains refused as `process-identity-unknown`.
- **Validation:** Targeted, stress, direct focused/full, and harness focused/full validation all exited zero with 23 suites/447 tests in repository gates.

#### AC-10

- **Fixture readiness:** Pane PID publication now follows two stable exact compound snapshots, not only `spawn`. The 1000 ms/10 ms fixture barrier is test synchronization only and cannot retry or broaden production Doctor observation.
- **Value-free failure proof:** Built assertions expose status, Doctor operation/reason, readiness outcome/failure category, spawn boolean, attempts/stable reads, 1000/10/2 bounds, and six identity-category booleans. Hosted failures can no longer stop at opaque `expect(status).toBe(0)` without showing controlled readiness and Doctor classification.
- **Outcome matrix:** READY exits 0 after both helpers become stable; nonfunctional reaches `socket-ready`/`socket-unavailable`; malformed create reaches `window-create`/`malformed-output`; malformed observe reaches `pane-observe`/`malformed-output`; readiness timeout reaches `session-create`/`nonzero-exit` without returning a PID.
- **Preserved safety:** Production one-pass observation, exact identity and lineage proof, session/window target, private `-S`, original-byte parsing, caps, aggregate/cleanup milestones, final absence proof, and value-free product evidence are unchanged.

### Documentation evidence and no-impact rationale

No application documentation changed because public setup, behavior, output, schemas, configuration, usage, troubleshooting, migration, API, data/database, service, container, deployment, operations, and architecture contracts are unchanged. ADR-260812, CORE-COMPONENT-260812, and decisions 135-143 remain authoritative.

### Validation evidence

- `harness boot --json`: process exit 0, envelope `status: ok`; application exit 0 with the exact bootstrap signal and composed baseline full checks 23 suites/445 tests.
- Targeted `npx jest --runInBand src/doctor-integration.test.ts`: exit 0; 1 suite/9 tests.
- Repeated READY stress: three selected-suite invocations exited 0; each ran the READY test containing three built processes, for nine stress-process passes.
- Direct `just verify-focused`: exit 0; 23 suites/447 tests; diff check passed.
- `harness checks --focused --json`: process exit 0; envelope `status: ok`, `scope: focused`, delegated `just verify-focused`, delegated exit 0; 23 suites/447 tests.
- Direct `just verify`: exit 0; lint, Prettier, strict TypeScript, 23 suites/447 tests, build, and diff check passed. Coverage was 88.90% statements, 83.99% branches, 95.42% functions, and 90.50% lines.
- `harness checks --json`: process exit 0; envelope `status: ok`, `scope: full`, delegated `just verify`, delegated exit 0; matching 23 suites/447 tests and coverage.
- Isolation/resource audit: final `soft-factory-doctor-*`, `doctor-ready-process-*`, and `doctor-executable-identity-*` directory inventories were empty; the matching process inventory was empty. Static changed-fixture scanning found no Sparkta, credential, network, or ambient tmux dependency. Product source and verifier-owned records/summaries had zero diff.

### Friction drain

- `rpiv`, `rpiv-research`, and `rpiv-planner` each had zero pending observations. `rpiv-implementer` had `DL-001`, `DL-002`, and `INS-001`.
- All three Implement observations were persisted and read back in `.harness/records/retro/2026-08-14/030-issue-29-rpiv-implementer-second-ci-return.md`, with schema 1.2, matching plan/agent, every ID/fingerprint, and `disposition: kept`. Agent-scoped clear envelopes returned exit 0 and `status: ok`; Implement cleared 3 and each other allowed buffer cleared 0.
- No command listed, drained, cleared, or rewrote `rpiv-verifier`. Existing verifier records and `verify/summary.md` remain untouched; the user-reported verifier pending count remains zero.
- One post-evidence `rpiv-implementer` observation was persisted and read back in `.harness/records/retro/2026-08-14/031-issue-29-rpiv-implementer-second-ci-evidence-eof.md`; schema 1.2, matching plan/agent, ID/fingerprint, and `disposition: kept` matched. Its agent-scoped clear returned exit 0, `status: ok`, and `cleared: 1`; the post-clear list was empty.
- One final `rpiv-implementer` command-shape observation was persisted and read back in `.harness/records/retro/2026-08-14/032-issue-29-rpiv-implementer-commit-guidance.md`; schema 1.2, matching plan/agent, ID/fingerprint, and `disposition: kept` matched. Its agent-scoped clear returned exit 0, `status: ok`, and `cleared: 1`; the post-clear list was empty.
- One final `rpiv-implementer` evidence-edit observation was persisted and read back in `.harness/records/retro/2026-08-14/033-issue-29-rpiv-implementer-final-evidence-command.md`; schema 1.2, matching plan/agent, ID/fingerprint, and `disposition: kept` matched. Its agent-scoped clear returned exit 0, `status: ok`, and `cleared: 1`.
- One post-commit `rpiv-implementer` evidence-review observation was persisted and read back in `.harness/records/retro/2026-08-14/034-issue-29-rpiv-implementer-final-evidence-review.md`; schema 1.2, matching plan/agent, ID/fingerprint, and `disposition: kept` matched. Its agent-scoped clear returned exit 0, `status: ok`, and `cleared: 1`.
