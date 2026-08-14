# Verification Summary — Issue #29

## Identity

- Work item: `29-preserve-retryable-tmux-preparation-failures-with-bounded-identity-diagnostics`
- Branch: `fix/29-tmux-preparation-diagnostics`
- Base: `f3ed01468b7859c07736f8fd9a7d4c6d97692658` (`origin/main`)
- Verified product commit: `8ffd7eaf6910c1ee179553609e0721bd9d7fdddc`
- Pull request: [#30](https://github.com/jsburckhardt/soft-factory-runner/pull/30), `fix: preserve retryable tmux preparation failures`
- Outcome: accepted; AC-1 through AC-10 passed independently

The verifier resolved exactly one action plan at this work-item path and confirmed the Implement handoff branch, product SHA, and clean tree before verification.

## Acceptance Decisions

| ID | Status | Independent evidence |
|---|---|---|
| AC-1 | Passed | `src/tmux-identity.ts` enforces one nonempty LF-terminated-or-final record and exact HT field counts for create and observe; `src/tmux-identity.test.ts` proves the strict transport and ID grammar. |
| AC-2 | Passed | Controlled tmux 3.7b bytes `40 31 09 25 31 0a` and `40 31 09 25 31 09 2f 74 6d 70 0a` parse exactly as `@1`, `%1`, `/tmp`; adapter and reconciliation tests preserve the successful path. |
| AC-3 | Passed | The complete required create and observe malformed matrices reject empty, incomplete, extra-field, multi-record, and invalid-ID output without accepting a partial identity. |
| AC-4 | Passed | Identity diagnostics retain phase, exit code, byte counts, capped 8-record/8-field shape, capped 32-token value-free signatures, and truncation flags through RunSnapshotV5 and status/reconcile JSON; parser, persistence, reporter, and CLI tests cover the path. |
| AC-5 | Passed | Tests prove diagnostics exclude raw output, paths, arguments, environment and field values, ownership identifiers, and other-run bytes; human guidance identifies malformed/ambiguous evidence without unsupported upgrade advice. |
| AC-6 | Passed | Reconciliation and orchestration authorize one replacement creation only for exact matching preparation ownership and zero same-name candidates; call-count tests prove no duplicate owned resource or launch. |
| AC-7 | Passed | Same-name candidates without persisted identity remain unknown and non-authorizing; tests prove snapshot, lock, lease, worktree, tmux inventory, workers, and launches remain unchanged. |
| AC-8 | Passed | `LOG_NOT_FOUND` stays bounded without identity/transcript; matching preparation ownership exposes only `PREPARATION_RESUME_AVAILABLE`, while mismatched and unknown ownership expose no resume. |
| AC-9 | Passed | Tests use temporary repositories, fake executables, injected ports, and a private local Unix socket. No Sparkta, ambient/default tmux, credentials, live network/GitHub/Copilot, consumer state, or protected package/diff change is used. Both configured root recipes pass. |
| AC-10 | Passed | Doctor uses an isolated `-D -S -f /dev/null` server, exact `${workspace.sessionName}:${workspace.issueWindowName}` targeting for `list-panes`, and `creation.paneId` only for pane PID `display-message`; byte/deadline bounds, DoctorResultV2, cleanup, and the 24-ID contract are covered by exact command, failure, timeout, and isolation tests. |

All ten GitHub acceptance checkboxes were updated only after these decisions passed; Issue #29 now has ten checked and zero unchecked criteria.

## Diff, Scope, and Architecture

The complete `f3ed014...8ffd7ea` branch diff was reviewed: 64 files, 7,826 insertions, and 465 deletions. Source, tests, fixtures, documentation, architecture records, work-item evidence, and every commit were inspected. No package manifest, lockfile, root justfile, agent definition, credential, secret, or unrelated protected file changed.

Scope and architecture pass. ADR-260812 remains authoritative for the private disposable Doctor server and exact Runner-equivalent session/window observation target. ADR-260814 remains authoritative for strict tmux identity parsing, bounded diagnostics, persistence, and retry safety. The final correction needs no new architecture decision. The tmux adapter, orchestrator, state-store, CLI, and Doctor core-component contracts remain aligned. Every implementation commit uses a Conventional Commit message and the required Copilot co-author trailer.

The correction was inspected directly: `src/doctor-tmux.ts` now targets `${workspace.sessionName}:${workspace.issueWindowName}` for `list-panes`; the issue-pane PID query still targets `creation.paneId`. Private socket/config isolation, output caps, deadlines, ownership and cleanup, value-free evidence, DoctorResultV2, and all 24 diagnostic IDs remain intact.

## Application Documentation

**Passed.** README, PRD Section 33, `docs/phase-1-issue-run.md`, Phase 3, Phase 4, and `docs/rpiv-integration-contract.md` are accurate for the committed behavior and configuration.

- The Phase 1 migration text contains the complete v1-v3/v4-to-v5 normalization sentence and scoped regression.
- The current schemaVersion 5 PRD snapshot example is complete, is extracted by `src/documentation.test.ts`, and is accepted unchanged by production `parseSnapshot`.
- Asset v1, DoctorResultV2, RunSnapshotV5, and AgentResultV1 are checked separately.
- README/Phase 3/Phase 4 cover bounded value-free diagnostics, exact retry behavior, private Doctor operation, failure evidence, and cleanup.
- API/OpenAPI, database, service, container, and deployment documentation have no applicable surface change beyond the recorded no-impact statements. Doctor schema-v1 consumers must migrate to V2 as documented.

No missing, stale, inaccurate, or inconclusive application documentation remains.

## Validation

| Gate | Result | Evidence |
|---|---|---|
| Harness boot | Passed | JSON envelope returned `status: ok`; bootstrap and delegated full-check exit were zero. |
| `just verify` | Passed | Independent direct root invocation exited 0: 23/23 suites and 444/444 tests. Coverage was 88.90% statements, 83.99% branches, 95.42% functions, and 90.50% lines. Lint, format, type-check, build, and diff check passed. |
| Focused correction gate | Passed | `just verify-focused src/doctor-tmux.test.ts src/tmux-identity.test.ts src/documentation.test.ts` passed 3/3 suites and 89/89 tests. |
| Isolation audit | Passed | No residual Doctor workspace roots; controlled fixtures avoid ambient/default tmux, Sparkta, credentials, live services, consumer state, and external repositories. |
| Root command interface | Passed | Root `justfile` exposes both `verify-focused` and `verify`; root recipes were the validation source. |

## RPIV Retro Harvest

Verifier observations were persisted and read back before each buffer clear:

- `.harness/records/retro/2026-08-14/025-issue-29-rpiv-verifier.md`
- `.harness/records/retro/2026-08-14/026-issue-29-rpiv-verifier-final-harvest.md`

The final `harness retro insights --plan 29-preserve-retryable-tmux-preparation-failures-with-bounded-identity-diagnostics --json` envelope returned `status: ok` and schema `harness.retro-insights/v1`: 13 records, 60 entries, four RPIV agents, 60 retained dispositions, no malformed or unsupported records, and `buffer_pending: 0`.

## Publication Note

The session exposed no Issue #29-specific injected no-clobber result command or run binding. A pre-existing Issue #25 candidate was preserved unchanged. Immutable AgentResultV1 publication therefore remains contingent on coordinator injection of the Issue #29 binding and must not overwrite the unrelated artifact.
