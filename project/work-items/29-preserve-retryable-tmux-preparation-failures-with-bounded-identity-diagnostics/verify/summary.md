# Verification Summary — Issue #29

## Outcome

**Accepted product and acceptance criteria.** Exact product commit 2cd1601d8b1807841bf1da52e63a56ab74c07feb passed independent local validation and the required hosted Node 22, Node 24, and package-smoke checks. Issue #29 has all ten original criteria checked, PR #30 remains open, and no merge was attempted.

This summary supersedes the prior failed verdict without deleting it: earlier failed summaries, verifier retros, product/metadata commits, and hosted run links remain in Git and GitHub history. Only this summary and generated verifier retros 038/039 are prepared for the final metadata commit.

## Identity and scope

- Work item: 29-preserve-retryable-tmux-preparation-failures-with-bounded-identity-diagnostics
- Resolved action plan: project/work-items/29-preserve-retryable-tmux-preparation-failures-with-bounded-identity-diagnostics/plan/01-action-plan.md
- Branch: fix/29-tmux-preparation-diagnostics
- Base: f3ed01468b7859c07736f8fd9a7d4c6d97692658 (origin/main merge base)
- Exact Implement product commit: 2cd1601d8b1807841bf1da52e63a56ab74c07feb
- Product parent / prior remote head: 6f2656ef59fa20a7e0f9f8e68d6be79e7766a968
- Pull request: [#30](https://github.com/jsburckhardt/soft-factory-runner/pull/30), fix: preserve retryable tmux preparation failures, OPEN
- Complete branch diff at product head: 78 files, 9,754 insertions, 479 deletions

The exact handoff branch/SHA and clean tree were confirmed before inspection and validation. The complete origin/main...2cd1601 diff was reviewed across product, tests, fixtures, application documentation, ADRs, core-components, work-item evidence, retros, and prior verification history. All commits use Conventional Commit subjects and the required Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com> trailer.

## Final correction inspection

The correction removes global procfs enumeration. LiveDoctorProcessPort now:

- re-observes the exact managed foreground server identity before discovery;
- performs breadth-first traversal only through /proc/<managed-pid>/task/<pid>/children;
- caps traversal at 64 descendants and depth 8;
- rejects malformed/nonpositive/unsafe PIDs, duplicate/cyclic trees, bound overflow, unavailable managed-root facts, and malformed owned-descendant identities;
- treats only exact ENOENT for a disappearing descendant tree/identity as absence;
- filters candidates by exact physical executable, sole helper argument, physical cwd, launch interval, and managed-server descendant membership;
- retains PID, process group, start token, executable, arguments, cwd, and launch identity for exact pre-signal re-observation.

DoctorTmuxProbe marks helper creation as possible before awaiting new-session/new-window. Fallback discovery is skipped only before any helper-creating command was attempted; private kill-server and managed-server/workspace cleanup remain unconditional. The malformed-create regression proves recovery and exact signaling of an unrecorded issue helper.

## Acceptance decisions

| ID | Status | Independent evidence |
|---|---|---|
| AC-1 | Passed | src/tmux-identity.ts enforces one exact create/observe record, HT-only fields, LF-only transport with one optional final LF, strict window/pane IDs, and nonempty UTF-8 observe cwd. Parser and live-adapter tests passed. |
| AC-2 | Passed | Controlled bytes 40 31 09 25 31 0a and 40 31 09 25 31 09 2f 74 6d 70 0a parse as @1, %1, and /tmp; successful preparation/reconciliation regressions passed. |
| AC-3 | Passed | All twelve required malformed create/observe rows plus CRLF, invalid UTF-8, empty-field, and extra-LF controls reject without partial identity. |
| AC-4 | Passed | TmuxIdentityDiagnosticV1 retains phase, exit and original byte counts, capped 8-record/8-field summaries, capped 32-token signature, and truncation through RunSnapshotV5, reconciliation v2, and status v4; lifecycle and parser-backed PRD regressions passed. |
| AC-5 | Passed | Sentinel tests exclude raw output, paths/cwd, arguments, environment/field values, owner/run IDs, and other-run bytes. Human/docs identify malformed or ambiguous evidence and omit unsupported upgrade guidance. |
| AC-6 | Passed | Recovery tests prove exact lock/lease/path/registration/branch/fetched-HEAD/cleanliness plus zero same-name candidates permit exactly one create with no duplicate owned resources or RPIV launch. |
| AC-7 | Passed | Present and race-appearing same-name candidates remain unknown ownership, authorize no resume, preserve all resources/inventories, and trigger zero create/worker/RPIV calls. |
| AC-8 | Passed | LOG_NOT_FOUND remains bounded without identity/transcript; only exact preparation ownership exposes PREPARATION_RESUME_AVAILABLE and resume, while mismatch/unknown exposes no action. |
| AC-9 | Passed | Tests use temporary repositories and controlled byte/tmux/process/executable fixtures. Local root/harness gates and hosted Node 22/24 full verification all passed without credentials, external consumer access, ambient tmux, Sparkta, live Copilot, or network dependency. |
| AC-10 | Passed | Doctor private functional protocol, strict identities, structured failures, bounded cleanup, exact session/window observation, owned descendant recovery, and final absence matrices passed. Product-head Node 22, Node 24, and package smoke all succeeded. |

## Documentation review

**Passed.** Committed application documentation matches behavior and configuration:

- README: DoctorResultV2, functional command.tmux, strict identity transport, V5 recovery, configuration/no-impact boundaries.
- API/specification: no network API, OpenAPI, Swagger, webhook, or endpoint exists; no API update applies.
- Configuration: no correction option/default or configuration migration; private probe environment remains internal.
- Usage: issue-run, recovery/resume/refusal/logs, Doctor invocation, troubleshooting, and root validation commands are accurate.
- Migration: RunSnapshotV5/v4 normalization, Doctor schema-v2 consumer migration, ReconciliationReportV2, and status-v4 guidance match code.
- Architecture: ADR-260812, ADR-260814, relevant core-components, and Decisions 123–143 match the implementation. The final correction changes no architecture artifact and conforms to exact owned-tree cleanup.
- Operations/deployment: Phase 3 and Phase 4 runbooks accurately require private isolation, fail-closed cleanup, and preservation. No database, service, daemon, container, or remote deployment change applies.

No application documentation was changed by 2cd1601 because the correction narrows internal helper discovery to the already documented exact managed-server lineage contract without changing public setup, output, configuration, usage, migration, or operations.

## Validation results

| Gate | Result | Evidence |
|---|---|---|
| Root command interface | Passed | Root justfile exposes verify-focused and verify. |
| Targeted root validation | Passed | just verify-focused for Doctor tmux, Doctor integration, tmux identity, and documentation: 4 suites/108 tests; diff check passed. |
| Harness boot | Passed | status ok; exact bootstrap signal; composed full check passed 23 suites/456 tests. |
| Focused harness | Passed | status ok; delegated just verify-focused; 23 suites/456 tests; diff check passed. |
| Required final validation | Passed locally | Independent direct just verify: lint, Prettier, strict TypeScript, 23 suites/456 tests, build, and diff check. Coverage 88.90% statements, 84.01% branches, 95.42% functions, 90.50% lines. |
| Full harness | Passed | status ok; scope full; delegated just verify exit 0 with matching 23 suites/456 tests and coverage. |
| Resource/isolation audit | Passed | No matching Doctor workspace or process remained; affected product files contain no readdir/global proc scan; test dependencies remain controlled and credential-free. |
| Product-head hosted CI | Passed | [Run 31820144389](https://github.com/jsburckhardt/soft-factory-runner/actions/runs/31820144389), exact head 2cd1601d8b1807841bf1da52e63a56ab74c07feb. |
| Verify Node 22.x | Passed | [Job 94831163814](https://github.com/jsburckhardt/soft-factory-runner/actions/runs/31820144389/job/94831163814), full verification and clean-tree steps succeeded. |
| Verify Node 24.x | Passed | [Job 94831163735](https://github.com/jsburckhardt/soft-factory-runner/actions/runs/31820144389/job/94831163735), full verification and clean-tree steps succeeded. |
| Package smoke test | Passed | [Job 94831418656](https://github.com/jsburckhardt/soft-factory-runner/actions/runs/31820144389/job/94831418656), package build/inspect/install/CLI smoke succeeded. |

The metadata commit containing this file must pass the same three hosted checks before final closeout; its resulting run is external evidence and cannot be embedded in its own commit without creating another head.

## RPIV retro harvest

Verifier observations were persisted and read back before clear in:

- .harness/records/retro/2026-08-14/038-issue-29-rpiv-verifier.md — four observations covering unavailable search tooling, missing Runner publication binding, one static-audit shell retry, and one interpreter retry.
- .harness/records/retro/2026-08-14/039-issue-29-rpiv-verifier-final-harvest.md — one final dependency-free harvest parser retry.

The final pre-metadata command harness retro insights --plan 29-preserve-retryable-tmux-preparation-failures-with-bounded-identity-diagnostics --json returned exit 0 and status ok with schema harness.retro-insights/v1, the exact plan scope, 26 records, 92 entries, all four RPIV agents, all 92 dispositions kept, zero malformed records, zero unsupported versions, and buffer_pending 0.

## Issue, PR, and AgentResult state

- Issue #29: OPEN with all ten original acceptance criteria checked; criterion text was not changed.
- PR #30: OPEN on fix/29-tmux-preparation-diagnostics; no replacement PR and no merge.
- PR body: all AC-1 through AC-10 passed with evidence, documentation/architecture results, local/hosted validation, and retro harvest.
- AgentResultV1: not published. The repository-local Runner status interface returned STATE_NOT_FOUND for Issue #29, and no injected issue-bound no-clobber publish helper or snapshotted requiredFinalValidation binding exists in this resumed checkout. No Runner snapshot was read or changed, and the pre-existing candidate artifact was not modified. Publication must not be fabricated or bypass Runner ownership.
- Requested validation command: just verify; passed directly and in hosted Node 22/24 jobs. Because the Runner snapshot is absent, this cannot be asserted as an injected immutable requiredFinalValidation binding.

## Preserved hosted return history

Prior failures remain durable in earlier summary/retro commits and GitHub runs, including 31805586261, 31805718222, 31809715459, 31814521678, 31815331249, and 31816018556. The successful correction run 31820144389 supersedes their verdict while preserving every diagnostic and commit.
