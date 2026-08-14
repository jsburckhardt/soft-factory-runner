# Implementation Notes: Issue #29

## Scope and status

Implemented tasks T-1 through T-7 in dependency order on `fix/29-tmux-preparation-diagnostics` without changing the accepted ADR or core-component contracts. The implementation is ready for the Verify stage; final acceptance remains owned by Verify.

Plan and architecture baseline: `1fe98fc865ea78dac196ddf05622749feba83ce4`.

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

## Documentation evidence

- `README.md`: exact byte transport, bounded retained diagnostic, v5/report/status versions, preparation retry/refusal, logs independence, and no configuration/API/deployment change.
- `PRD.md`: executable tmux model, diagnostic confidentiality/caps, preparation authorization, and persisted schema compatibility.
- `docs/README.md`: current schema and recovery-document index wording.
- `docs/phase-1-issue-run.md`: exact identity transport and preparation ownership contract.
- `docs/phase-3-recovery-operations.md`: migration, one-pass observation, retry/race refusal, troubleshooting, LOG_NOT_FOUND, controlled fixtures, and no-impact guidance.
- `docs/rpiv-integration-contract.md`: RunSnapshotV5 and v4/v5 compatibility references.
- `src/documentation.test.ts`: 25 passing documentation assertions, including stale-upgrade rejection.
- **API no impact:** no network API, OpenAPI/Swagger contract, or public command grammar changed; no API specification or API migration note is applicable.
- **Configuration no impact:** no option, default, or configuration workflow changed; no configuration migration is required.
- **Deployment/operations:** no daemon, service, database, container, or deployment procedure changed. Local recovery and troubleshooting instructions were updated where runtime operator behavior changed.
- **Architecture:** no architecture document changed during Implement; implementation conforms to the Plan-committed ADR, core-components, and decisions 123 through 134.

## Validation results

- `just verify-focused src/documentation.test.ts`: exit 0; 1 suite and 25 tests passed; diff check passed.
- Direct `just verify-focused`: exit 0; 22 suites and 401 tests passed; `git diff --check` passed.
- `harness checks --focused --json`: `status: ok`, delegated `just verify-focused`, delegated exit code 0; 22 suites and 401 tests passed.
- First direct `just verify`: exit 1 at lint due one stale unused import; corrected and recorded as DL-005.
- Second direct `just verify`: exit 1 at format-check for 11 changed TypeScript files; formatted and recorded as DL-006.
- Final direct `just verify`: exit 0; lint, Prettier, strict TypeScript, 22 suites/401 tests, build, and diff check passed. Global coverage: 88.66% statements, 85.04% branches, 94.62% functions, 90.23% lines.
- `harness checks --json`: `status: ok`, delegated `just verify`, delegated exit code 0; the same lint/format/type/test/coverage/build/diff boundary passed.

## Harness friction drain

- `rpiv`: zero pending observations; no retro record created.
- `rpiv-research`: 6 observations persisted and read back in `.harness/records/retro/2026-08-14/014-issue-29-rpiv-research.md`; schema 1.2, matching agent/plan, 6 kept dispositions; clear envelope `status: ok`, `cleared: 6`.
- `rpiv-planner`: 4 observations persisted and read back in `.harness/records/retro/2026-08-14/016-issue-29-rpiv-planner.md`; schema 1.2, matching agent/plan, 4 kept dispositions; clear envelope `status: ok`, `cleared: 4`.
- `rpiv-implementer`: 6 observations persisted and read back in `.harness/records/retro/2026-08-14/015-issue-29-rpiv-implementer.md`; schema 1.2, matching agent/plan, 6 kept dispositions; clear envelope `status: ok`, `cleared: 6`.
- Post-clear JSON listings for all four agents returned `status: ok` and empty observation arrays.

## Divergence and blockers

No architecture or Plan divergence remains. The migration regression and validation failures described above were corrected within the accepted contract. No blocker remains for Verify handoff.
