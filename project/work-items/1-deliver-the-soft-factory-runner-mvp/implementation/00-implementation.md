# Implementation Notes: Issue 1 Epic Evidence and Section 27 Launch Example

## Scope

- Issue: #1
- Work item: `1-deliver-the-soft-factory-runner-mvp`
- Completed tasks: T-1, T-2, T-3
- Product edit: only `PRD.md` Section 27
- Runtime and architecture source: unchanged

## Acceptance Evidence

| ID | Evidence |
|---|---|
| AC-1 | `gh issue view 1` reported the checked delivery list in exact order `#8, #2, #3, #4, #5, #6, #7`. Child queries resolved all seven issue URLs and reported every child `CLOSED`. |
| AC-2 | PRD inventory commands returned `FR_COUNT=29 AC_COUNT=22`. The 29-row FR and 22-row AC crosswalks below map every required ID, including AC-011A and AC-018A, to closed child scope. |
| AC-3 | The targeted integration, reconciliation, Doctor, documentation, and official-asset suites passed 54 of 54 tests through the root `just test` recipe with coverage disabled for the partial-suite retry. Full `just verify` then passed all 247 tests with global coverage above 80 percent. Source contracts prove explicit issue admission and prohibit selection, ranking, and queueing. |
| AC-4 | Issue #1 live JSON showed checked child markers in delivery order; child JSON showed `CLOSED` for #8 and #2 through #7 with canonical URLs. No GitHub checkbox was edited. |
| AC-5 | Static extraction printed exactly `OTEL_RESOURCE_ATTRIBUTES="project.name=<project>,issue.id=issue-<number>" copilot --yolo`. The product diff contains one Section 27 hunk and the product path inventory contains only `PRD.md`. |

## Live Child Evidence

| Order | Issue | State | URL |
|---:|---:|---|---|
| 1 | #8 | CLOSED | https://github.com/jsburckhardt/soft-factory-runner/issues/8 |
| 2 | #2 | CLOSED | https://github.com/jsburckhardt/soft-factory-runner/issues/2 |
| 3 | #3 | CLOSED | https://github.com/jsburckhardt/soft-factory-runner/issues/3 |
| 4 | #4 | CLOSED | https://github.com/jsburckhardt/soft-factory-runner/issues/4 |
| 5 | #5 | CLOSED | https://github.com/jsburckhardt/soft-factory-runner/issues/5 |
| 6 | #6 | CLOSED | https://github.com/jsburckhardt/soft-factory-runner/issues/6 |
| 7 | #7 | CLOSED | https://github.com/jsburckhardt/soft-factory-runner/issues/7 |

## Functional Requirement Crosswalk

| PRD ID | Child | Supporting delivered scope |
|---|---:|---|
| FR-001 | #6 | Doctor repository discovery checks |
| FR-002 | #6 | Deterministic repository readiness report |
| FR-003 | #7 | Official agent installation |
| FR-004 | #7 | Official skill installation |
| FR-005 | #7 | Recommended complete asset set |
| FR-006 | #7 | Modified local asset overwrite protection |
| FR-007 | #3 | Explicit `run --issue <number>` execution |
| FR-008 | #3 | Issue readiness validation before side effects |
| FR-009 | #3 | Atomic issue ownership lock |
| FR-010 | #3 | Fetched remote base, typed branch, and worktree |
| FR-011 | #3 | Deterministic repository tmux session |
| FR-012 | #3 | Owned per-issue tmux window |
| FR-013 | #3 | Visible RPIV launch |
| FR-014 | #4 | Atomic snapshots and append-only transition events |
| FR-015 | #5 | List, status, attach, and logs lifecycle inspection |
| FR-016 | #5 | Deterministic structured status and reconciliation outcomes |
| FR-017 | #4 | RPIV exit capture without false completion |
| FR-018 | #4 | Versioned RPIV result validation |
| FR-019 | #4 | Local and remote Git reconciliation |
| FR-020 | #4 | Pull-request identity and SHA reconciliation |
| FR-021 | #5 | Merged-head proof and safe automatic cleanup |
| FR-022 | #4 | Explicit terminal run states |
| FR-023 | #5 | Restart reconciliation and duplicate prevention |
| FR-024 | #5 | Graceful stop with bounded escalation |
| FR-025 | #5 | Conservative owned-resource cleanup |
| FR-026 | #5 | Explicit concurrency limit without scheduling |
| FR-027 | #7 | Operator Agent asset |
| FR-028 | #7 | Assessor Agent asset |
| FR-029 | #7 | Soft Factory Skill asset |

## PRD Acceptance Crosswalk

| PRD ID | Child | Supporting delivered scope |
|---|---:|---|
| AC-001 | #6 | Ready Doctor fixture and complete check set |
| AC-002 | #6 | Blocked Doctor output with remediation |
| AC-003 | #6 | Human and JSON Doctor parity |
| AC-004 | #7 | Operator Agent installation |
| AC-005 | #7 | Assessor Agent installation |
| AC-006 | #7 | Soft Factory Skill installation |
| AC-007 | #7 | Modified asset overwrite refusal |
| AC-008 | #3 | Ready explicit issue creates one owned run |
| AC-009 | #3 | No automatic next-issue command or backlog selection |
| AC-010 | #3 | Same-issue race has exactly one owner |
| AC-011 | #5 | Distinct concurrent issues use distinct resources |
| AC-011A | #3 | Allowed typed branch from proven fetched default tip |
| AC-012 | #3 | RPIV remains visible in the issue window |
| AC-013 | #3 | Attach resolves the explicit issue window |
| AC-014 | #4 | Zero Copilot exit cannot falsely complete |
| AC-015 | #4 | Mismatched result artifact cannot complete |
| AC-016 | #4 | Mismatched pull request cannot complete |
| AC-017 | #5 | Restart preserves matching active process |
| AC-018 | #5 | Dirty worktree cleanup refusal |
| AC-018A | #5 | Merged clean worktree cleanup with ambiguity refusal |
| AC-019 | #7 | Operator delegates execution to Runner |
| AC-020 | #7 | Assessor treats Doctor JSON as authoritative |

## Test Results

| Test | Result and evidence |
|---|---|
| TEST-1 | Exit 0. Issue #1 had checked links in exact delivery order; seven canonical child records were `CLOSED`. |
| TEST-2 | Exit 0. ID inventory reported 29 FR headings and 22 AC headings; complete crosswalks are above. |
| TEST-3 | Planned root command ran all five requested suites and all 54 tests passed, but exited 1 because partial-suite coverage was below the global 80 percent threshold. Retry through `TMPDIR=/private/tmp just test --runInBand --coverage=false ...` exited 0 with 5 suites and 54 tests passed. Full validation supplied global coverage proof. |
| TEST-4 | Exit 0. Awk-only exact-body assertion printed the requested single line. |
| TEST-5 | Exit 0. `git diff -- PRD.md` showed one launch-fence hunk; product inventory showed only `PRD.md`; no `src/`, tests, other application documentation, or architecture changes exist. |
| TEST-6 focused | `TMPDIR=/private/tmp just verify-focused` exited 0: 19 suites and 247 tests passed; `git diff --check` passed. |
| TEST-6 full | `TMPDIR=/private/tmp just verify` exited 0: lint, formatting, type-check, 19 suites and 247 tests, global coverage, build, and diff check passed. Coverage was 87.67 percent statements, 82.32 percent branches, 93.99 percent functions, and 89.44 percent lines. |

## Documentation Evidence

- Updated `PRD.md` Section 27 because AC-5 changes the documented launch example.
- README, API references, configuration guides, usage guides, migration notes, architecture explanations, runbooks, and deployment instructions require no update: runtime behavior, setup, contracts, configuration, supported workflows, APIs, deployment, and operations are unchanged.
- No ADR or core-component contract changed. The one-line PRD example is intentionally documentation-only and runtime launch arguments remain governed by the existing architecture.

## Validation Setup and Retry Evidence

- Initial focused validation could not find Jest before dependency setup.
- The root `just setup` recipe installed dependencies, but npm did not hoist the `ts-jest` peer `jest-util`; a transient root link to the already installed Jest utility package enabled validation without tracked dependency or product changes.
- The exact-fence assertion was rewritten without command substitution after shell-security blocked the planned spelling.
- These concrete retries are preserved in the generated retro records below.

## Harness Friction Records

- `.harness/records/retro/2026-08-12/017-issue-1-rpiv-research.md`
- `.harness/records/retro/2026-08-12/018-issue-1-rpiv-planner.md`
- `.harness/records/retro/2026-08-12/019-issue-1-rpiv-implementer.md`

Implementation evidence is prepared for independent Verify-stage review. Final acceptance remains owned by Verify.
