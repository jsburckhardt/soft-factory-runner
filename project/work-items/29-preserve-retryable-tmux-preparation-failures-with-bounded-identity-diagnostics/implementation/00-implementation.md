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

## Divergence and blockers

No architecture or Plan divergence was required. AC-10 conforms to the revised Doctor ADR/core-component and decisions 135–143 while leaving the tmux identity architecture unchanged. All implementation/validation friction was corrected within the accepted contract; no blocker remains for Verify handoff.
