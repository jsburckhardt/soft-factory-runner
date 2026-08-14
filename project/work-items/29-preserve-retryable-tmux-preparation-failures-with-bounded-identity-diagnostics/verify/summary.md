# Verification Summary — Issue #29

## Outcome

**Failed — return to Implement.** Local acceptance evidence passed, but PR #30 reran the root `just verify` recipe on Node 22 and Node 24 and both jobs failed the controlled Doctor built-process integration suite. AC-9 and AC-10 therefore lack portable passing evidence and are failed.

No application code, tests, fixtures, or application documentation were modified by Verify.

## Identity

- Work item: `29-preserve-retryable-tmux-preparation-failures-with-bounded-identity-diagnostics`
- Branch: `fix/29-tmux-preparation-diagnostics`
- Base: `f3ed01468b7859c07736f8fd9a7d4c6d97692658` (`origin/main`)
- Verified product commit: `8ffd7eaf6910c1ee179553609e0721bd9d7fdddc`
- Pushed verification metadata commit: `95330573569e5459c7ac9dd6eded22fbbc63f189`
- Pull request: [#30](https://github.com/jsburckhardt/soft-factory-runner/pull/30), `fix: preserve retryable tmux preparation failures`

The verifier resolved exactly one action plan at this work-item path and confirmed the Implement handoff branch, product SHA, and clean tree before verification.

## Acceptance Decisions

| ID | Status | Independent evidence |
|---|---|---|
| AC-1 | Passed | `src/tmux-identity.ts` enforces one nonempty LF-terminated-or-final record and exact HT field counts; strict create/observe grammar tests pass. |
| AC-2 | Passed | Controlled tmux 3.7b bytes parse exactly as `@1`, `%1`, and `/tmp`; adapter and reconciliation regressions pass. |
| AC-3 | Passed | The complete required malformed create/observe matrices reject partial, extra-field, multi-record, and invalid-ID output. |
| AC-4 | Passed | Bounded 8-record/8-field/32-token value-free diagnostics persist through RunSnapshotV5 and repository-owned status/reconcile JSON with parser, persistence, reporter, and CLI coverage. |
| AC-5 | Passed | Tests exclude raw values, paths, arguments, environment/ownership identifiers, and other-run bytes; guidance contains no unsupported upgrade claim. |
| AC-6 | Passed | Exact matching preparation ownership with zero same-name candidates permits one replacement creation without duplicate resources or launches. |
| AC-7 | Passed | Same-name candidates remain unknown and non-authorizing, with ownership and resource state unchanged. |
| AC-8 | Passed | `LOG_NOT_FOUND` and preparation-only resume authorization remain bounded and unchanged. |
| AC-9 | **Failed** | Independent local `just verify` passed, but both PR CI root `just verify` jobs failed: 1 suite and 4 tests failed in `src/doctor-integration.test.ts` on Node 22 and Node 24. Portable configured-validation proof is absent. |
| AC-10 | **Failed** | Exact source and unit-level correction evidence passes locally, but canonical CI makes the controlled ready Doctor process exit 3 and changes nonfunctional/malformed fixture evidence to `process-identity-unknown`. The required functional-probe behavior is not proved across the supported matrix. |

Because every criterion no longer passes, all ten Issue #29 acceptance checkboxes were restored to unchecked without changing criterion text.

## Blocking CI Evidence

GitHub Actions run `31805718222` at pushed head `95330573569e5459c7ac9dd6eded22fbbc63f189` failed both `Verify (Node 22.x)` and `Verify (Node 24.x)` jobs while invoking the root `just verify` recipe.

Each job reported 22 passed suites, 1 failed suite, 440 passed tests, and 4 failed tests. `src/doctor-integration.test.ts` failed:

1. the controlled ready human/JSON built process returned status 3 instead of 0;
2. nonfunctional cleanup evidence returned `process-identity-unknown` instead of `socket-unavailable`;
3. malformed-create cleanup evidence returned `process-identity-unknown` instead of `malformed-output`;
4. malformed-observe cleanup evidence returned `process-identity-unknown` instead of `malformed-output`.

A diagnostic local rerun, `just verify-focused src/doctor-integration.test.ts`, passed 1/1 suite and 7/7 tests. This confirms an environment-sensitive code/test portability defect rather than supplying the missing CI proof. Verify did not repair it.

## Diff, Architecture, and Documentation

The complete `f3ed014...8ffd7ea` product diff was reviewed: 64 files, 7,826 insertions, and 465 deletions. Scope, ADR, core-component, commit-message, and trailer review passed. The exact Doctor correction uses `${workspace.sessionName}:${workspace.issueWindowName}` for `list-panes` and reserves `creation.paneId` for PID `display-message`; ADR-260812 and ADR-260814 remain authoritative.

Application documentation review passed. README, PRD Section 33, Phase 1/3/4, and the RPIV integration contract match the committed interfaces. The complete normalization sentence and parser-valid current schemaVersion 5 example are covered by `src/documentation.test.ts`, with asset v1, Doctor v2, snapshot v5, and AgentResult v1 kept distinct. No applicable API/OpenAPI, database, container, service, or deployment update is missing.

## Validation Results

| Gate | Result | Evidence |
|---|---|---|
| Harness boot | Passed | JSON envelope returned `status: ok`; delegated full-check exit was zero. |
| Independent direct `just verify` | Passed locally | Exit 0; 23/23 suites and 444/444 tests; coverage 88.90% statements, 83.99% branches, 95.42% functions, 90.50% lines. |
| Focused correction gate | Passed locally | Doctor tmux, tmux identity, and documentation: 3/3 suites, 89/89 tests. |
| Diagnostic Doctor integration rerun | Passed locally | 1/1 suite, 7/7 tests. |
| PR CI Node 22 root `just verify` | **Failed** | 1/23 suites and 4/444 tests failed in `src/doctor-integration.test.ts`. |
| PR CI Node 24 root `just verify` | **Failed** | Same four controlled built-process failures. |

Overall configured validation is failed.

## RPIV Retro Harvest

Verifier observations were persisted and read back before buffer clear:

- `.harness/records/retro/2026-08-14/025-issue-29-rpiv-verifier.md`
- `.harness/records/retro/2026-08-14/026-issue-29-rpiv-verifier-final-harvest.md`
- `.harness/records/retro/2026-08-14/027-issue-29-rpiv-verifier-ci-return.md`

The final retro envelope returned `status: ok`, schema `harness.retro-insights/v1`, 14 records, 61 entries, four RPIV agents, 61 retained dispositions, no malformed or unsupported records, and `buffer_pending: 0`.

## Publication

No AgentResultV1 was published. Acceptance and final validation failed, and no Issue #29-specific injected no-clobber publication binding was exposed. The unrelated pre-existing Issue #25 candidate remains unchanged.
