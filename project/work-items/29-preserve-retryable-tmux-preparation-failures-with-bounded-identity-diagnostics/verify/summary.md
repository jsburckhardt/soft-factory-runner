# Verification Summary — Issue #29

## Outcome

**Failed — return to Implement.** Product/test correction commit `eca87ade5c65a8054a1c49b4849a5ed57189cc53` and handoff head `49c1cef8ceab9efb77c05c571e7f5dc1e2d1a4a9` passed independent local validation, but PR CI run `31814521678` failed the root `just verify` recipe on both Node 22 and Node 24. Each job failed 6 tests in `src/doctor-integration.test.ts`; Package smoke was skipped. AC-9 and AC-10 therefore remain failed, all Issue #29 criteria remain unchecked, and no AgentResultV1 was published.

No application code, tests, fixtures, application documentation, architecture artifact, or implementation commit was modified by Verify. Verify generated only this summary and verifier retros `.harness/records/retro/2026-08-14/035-issue-29-rpiv-verifier.md` and `.harness/records/retro/2026-08-14/036-issue-29-rpiv-verifier-final-return.md`.

## Identity and scope

- Work item: `29-preserve-retryable-tmux-preparation-failures-with-bounded-identity-diagnostics`
- Resolved action plan: `project/work-items/29-preserve-retryable-tmux-preparation-failures-with-bounded-identity-diagnostics/plan/01-action-plan.md`
- Branch: `fix/29-tmux-preparation-diagnostics`
- Base: `f3ed01468b7859c07736f8fd9a7d4c6d97692658` (`origin/main`)
- Product/test correction commit: `eca87ade5c65a8054a1c49b4849a5ed57189cc53`
- Hosted product handoff head: `49c1cef8ceab9efb77c05c571e7f5dc1e2d1a4a9`
- Pull request: [#30](https://github.com/jsburckhardt/soft-factory-runner/pull/30), `fix: preserve retryable tmux preparation failures`, OPEN and MERGEABLE before verifier metadata publication

The exact Implement handoff branch, SHA, clean tree, three-commit order, and zero-behind/three-ahead relation were confirmed before validation. All branch commits use Conventional Commit subjects and the required Copilot co-author trailer. The complete `origin/main...49c1cef` diff contains 75 files, 256 hunks, 9,028 additions, and 479 deletions; it has no binary, submodule, symlink, secret, prohibited-path, or out-of-scope file change.

## Acceptance Decisions

| ID | Status | Independent evidence |
|---|---|---|
| AC-1 | Passed | Exact one-record HT/LF create and observe grammar remains enforced; parser/live-adapter regressions passed. |
| AC-2 | Passed | Required tmux 3.7b bytes still parse as `@1`, `%1`, and `/tmp`; successful preparation/reconciliation regressions passed. |
| AC-3 | Passed | All twelve required malformed outputs remain strict failures without partial identity. |
| AC-4 | Passed | RunSnapshotV5/status/reconcile retain only capped 8-record, 8-field, 32-token value-free structure; persistence and documentation parser regressions passed. |
| AC-5 | Passed | Confidentiality tests and documentation exclude raw output, paths, arguments, field values, ownership identities, other-run bytes, and unsupported upgrade advice. |
| AC-6 | Passed | Exact preparation ownership plus zero same-name candidates permits one create with no duplicate owned resource or launch. |
| AC-7 | Passed | Same-name candidates remain unknown and non-authorizing; ownership and inventories remain unchanged. |
| AC-8 | Passed | `LOG_NOT_FOUND` and exact-only preparation resume authorization remain unchanged. |
| AC-9 | **Failed** | Local root validation passed, but both supported hosted root `just verify` jobs failed 1 suite and 6 tests, so portable configured-validation proof is absent. |
| AC-10 | **Failed** | Hosted controlled readiness reported `spawnObserved: true`, two stable reads, and true identity-category booleans, yet Product Doctor returned `helper-stop` / `process-identity-unknown` in READY, delayed, timeout, nonfunctional, malformed-create, and malformed-observe cases. Cleanup identity proof is not portable. |

## Fixture and product inspection

The `eca87ad` correction changes only `src/doctor-integration.test.ts` plus work-item/retro evidence. Production source is byte-identical to `33eecb8` for this correction. The fake readiness barrier is test-only, bounded to 1000 ms with 10 ms sampling, requires two identical complete compound snapshots, and checks the requested physical executable, exact sole helper argument, exact cwd, direct server parent, positive process group, and numeric start token. Its snapshot signature remains ephemeral; emitted diagnostics contain only closed categories, booleans, bounded counts, and bounds.

The delayed test requires three non-authorizing reads followed by two stable reads. The timeout test refuses the helper, returns no pane PID to Product Doctor, and stops the child. Equivalent physical executable aliases remain accepted and `/bin/sh` remains a genuinely distinct refused executable. Product Doctor still performs one process identity observation and one pane observation with no retry; session/window pane targeting, private socket/configuration/environment, original-byte parsing, identity/cwd equality, and exact ownership cleanup remain unchanged.

The hosted result proves that the fixture barrier does not mask the remaining mismatch: every controlled readiness fact shown by the failed jobs passed, while Product Doctor independently failed its helper cleanup identity proof.

## Documentation and architecture

**Passed.** README, PRD, docs index, Phase 1, Phase 3, Phase 4, and the RPIV integration contract match the committed behavior and migration/configuration boundaries. RunSnapshotV5, DoctorResultV2, strict identity grammar, private tmux protocol, usage, troubleshooting, and operations are accurate. No OpenAPI/Swagger, network API, database, service, container, or remote deployment update applies.

ADR-260812, ADR-260814, related core-components, and Decisions 123–143 remain authoritative and aligned. The latest correction changes no ADR, core-component, decision-log, application documentation, configuration, API, migration, deployment, or production source.

## Validation Results

| Gate | Result | Evidence |
|---|---|---|
| Root command interface | Passed | Root `justfile` exposes `verify-focused` and `verify`. |
| Focused fixture regression | Passed locally | `just verify-focused src/doctor-integration.test.ts`: 1/1 suite and 9/9 tests; diff check passed. |
| Independent direct required validation | Passed locally | `just verify`: exit 0; lint, Prettier, strict types, 23/23 suites, 447/447 tests, build, and diff check passed. Coverage: 88.90% statements, 83.99% branches, 95.42% functions, 90.50% lines. |
| `harness checks --json` | Passed locally | Exit 0; envelope `status: ok`, `scope: full`, delegated `just verify`, delegated exit 0, 23 suites and 447 tests. |
| Isolation/resource audit | Passed locally | No controlled Doctor workspaces, helpers, or private servers remained; ambient development tmux process identities were unchanged; changed source/tests add no Sparkta, credential, consumer, or external network dependency. |
| PR CI Node 22 | **Failed** | [Job 94812869754](https://github.com/jsburckhardt/soft-factory-runner/actions/runs/31814521678/job/94812869754): 1 failed suite, 6 failed tests, 441 passed; common final evidence `helper-stop` / `process-identity-unknown`. |
| PR CI Node 24 | **Failed** | [Job 94812869657](https://github.com/jsburckhardt/soft-factory-runner/actions/runs/31814521678/job/94812869657): identical 1 failed suite, 6 failed tests, 441 passed. |
| Package smoke | **Skipped** | [Job 94813132978](https://github.com/jsburckhardt/soft-factory-runner/actions/runs/31814521678/job/94813132978) skipped after matrix failure. |

Hosted product run: https://github.com/jsburckhardt/soft-factory-runner/actions/runs/31814521678

The metadata-only verifier head `25274a0b1e40c45faca943cc05eddf6f21bcd2ed` automatically reran [CI 31815331249](https://github.com/jsburckhardt/soft-factory-runner/actions/runs/31815331249). [Node 22 job 94815510545](https://github.com/jsburckhardt/soft-factory-runner/actions/runs/31815331249/job/94815510545) and [Node 24 job 94815510641](https://github.com/jsburckhardt/soft-factory-runner/actions/runs/31815331249/job/94815510641) each repeated 1 failed suite, 6 failed tests, and 441 passed tests; [Package smoke 94815736925](https://github.com/jsburckhardt/soft-factory-runner/actions/runs/31815331249/job/94815736925) was skipped.

## CI return history

1. [Run 31805586261](https://github.com/jsburckhardt/soft-factory-runner/actions/runs/31805586261) at product head `8ffd7eaf6910c1ee179553609e0721bd9d7fdddc`: Node 22 and Node 24 each failed four of 444 built Doctor integration tests at `process-identity-unknown`; Package smoke skipped.
2. [Run 31805718222](https://github.com/jsburckhardt/soft-factory-runner/actions/runs/31805718222) at first failure-metadata head `95330573569e5459c7ac9dd6eded22fbbc63f189`: the unchanged product repeated the same four-of-444 Node 22/24 failures; Package smoke skipped.
3. [Run 31809715459](https://github.com/jsburckhardt/soft-factory-runner/actions/runs/31809715459) at corrected product head `33eecb8c4f5fe13d37f86aac1cba1b8434253579`: both supported jobs again failed four of 445 tests at `process-identity-unknown`; Package smoke skipped.
4. [Run 31814521678](https://github.com/jsburckhardt/soft-factory-runner/actions/runs/31814521678) at handoff head `49c1cef8ceab9efb77c05c571e7f5dc1e2d1a4a9`, containing test correction `eca87ad`: both supported jobs failed six of 447 tests because cleanup replaced intended outcomes with `helper-stop` / `process-identity-unknown`; Package smoke skipped.
5. [Run 31815331249](https://github.com/jsburckhardt/soft-factory-runner/actions/runs/31815331249) at failure-metadata head `25274a0b1e40c45faca943cc05eddf6f21bcd2ed`: both jobs repeated the same six-of-447 failure and Package smoke skipped; this head changed only the verification summary and verifier retro.

## RPIV Retro Harvest

The first verifier drain persisted observations `DL-001` through `DL-005` in `.harness/records/retro/2026-08-14/035-issue-29-rpiv-verifier.md`. Exact historical CI backtracking and the automatic metadata rerun were subsequently persisted as `DL-001` and `COORD-001` in `.harness/records/retro/2026-08-14/036-issue-29-rpiv-verifier-final-return.md`. Both schema 1.2 records were read back with matching plan/agent, exact fingerprints, and kept dispositions before their respective agent-scoped clears. The final post-clear buffer has zero observations.

`harness retro insights --plan 29-preserve-retryable-tmux-preparation-failures-with-bounded-identity-diagnostics --json` returned exit 0, `status: ok`, schema `harness.retro-insights/v1`, 23 records, 82 entries, all four RPIV agents, 82 kept dispositions, zero malformed/unsupported records, and `buffer_pending: 0`.

## Issue, PR, and publication

Issue #29 retains all ten original criteria unchecked. PR #30 remains the existing PR; no duplicate was created and no merge was attempted. Its Conventional Commit title remains valid. The PR body was not changed to claim acceptance after hosted failure.

No accepted green product head or successful final verification metadata head exists. No AgentResultV1 was published because AC-9/AC-10 and snapshotted `just verify` hosted proof failed; additionally, no Issue #29-specific injected no-clobber publication binding was available. Any unrelated pre-existing artifact remains unchanged.
