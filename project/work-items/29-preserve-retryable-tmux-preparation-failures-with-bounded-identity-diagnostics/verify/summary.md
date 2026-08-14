# Verification Summary — Issue #29

## Outcome

**Failed — return to Implement.** Corrected product SHA `33eecb8c4f5fe13d37f86aac1cba1b8434253579` passed independent local validation, but PR CI run `31809715459` repeated the same four built Doctor failures on Node 22 and Node 24. AC-9 and AC-10 therefore remain failed. Package smoke was skipped and no accepted final metadata head or AgentResultV1 was produced.

No application code, tests, fixtures, application documentation, architecture artifact, or implementation commit was modified by Verify.

## Identity

- Work item: `29-preserve-retryable-tmux-preparation-failures-with-bounded-identity-diagnostics`
- Branch: `fix/29-tmux-preparation-diagnostics`
- Base: `f3ed01468b7859c07736f8fd9a7d4c6d97692658` (`origin/main`)
- Corrected product SHA and PR head: `33eecb8c4f5fe13d37f86aac1cba1b8434253579`
- Pull request: [#30](https://github.com/jsburckhardt/soft-factory-runner/pull/30), `fix: preserve retryable tmux preparation failures`, OPEN and MERGEABLE

Verify resolved exactly one action plan at `project/work-items/29-preserve-retryable-tmux-preparation-failures-with-bounded-identity-diagnostics/plan/01-action-plan.md` and confirmed the exact branch, product SHA, and clean tree before validation. All branch commits use Conventional Commit subjects and the required Copilot co-author trailer.

## Acceptance Decisions

| ID | Status | Independent evidence |
|---|---|---|
| AC-1 | Passed | Exact single-record HT/LF create and observe grammar remains enforced; parser and live-adapter regressions pass. |
| AC-2 | Passed | Required tmux 3.7b bytes still parse as `@1`, `%1`, and `/tmp`; preparation/reconciliation regressions pass. |
| AC-3 | Passed | All twelve required malformed cases reject extra, partial, multi-record, and invalid-ID output without partial identity. |
| AC-4 | Passed | RunSnapshotV5/status/reconcile retain only capped 8-record, 8-field, 32-token value-free structure; production parser and documentation regressions pass. |
| AC-5 | Passed | Confidentiality tests and documentation exclude raw output, paths, arguments, values, ownership identities, other-run bytes, and unsupported upgrade advice. |
| AC-6 | Passed | Exact preparation ownership plus zero same-name candidates permits one create with no duplicate lock, lease, branch, worktree, worker, or RPIV launch. |
| AC-7 | Passed | Same-name candidates remain unknown and non-authorizing; inventories and ownership remain unchanged. |
| AC-8 | Passed | `LOG_NOT_FOUND` and exact-only preparation resume authorization remain unchanged. |
| AC-9 | **Failed** | Local root validation passes, but both supported hosted root `just verify` jobs fail 1 suite and 4 tests; credential-free portable configured-validation proof is absent. |
| AC-10 | **Failed** | Node 22 and Node 24 make the first controlled READY built process exit 3 and return `process-identity-unknown` before nonfunctional/malformed fixtures reach `socket-unavailable` or `malformed-output`. Required portable functional-probe proof is absent. |

Issue #29 retains ten unchecked criteria with unchanged text.

## Correction and Safety Inspection

The complete `origin/main...33eecb8` branch diff and complete `9533057...33eecb8` correction were inspected for scope, ADR, and core-component compliance. The correction is bounded to Doctor product/tests plus work-item and retro evidence. No application documentation or architecture file changed in the correction.

The controlled fixture now uses `allowHalfOpen`, awaits helper `spawn`, launches the executable requested by Doctor, and records only value-free physical/exact executable, argument, cwd, and parent facts. Product resolves the helper executable once through `realpathSync.native`, launches that physical path, and compares it exactly with `/proc/<pid>/exe`. Source inspection confirms no basename or lexical broadening: executable, sole helper argument, cwd, server lineage, PID, PGID, start token, and pre-signal exact identity checks remain required. Distinct `/bin/sh`, identity/cwd mismatches, and lineage failure remain refusals in tests/source.

Private `-D/-S/-f` isolation, exact session/window `list-panes` targeting, pane-ID PID lookup, strict original-byte identity parsing, 4096-byte caps, 2000/6500/7000/7250/7750/8250/9000 ms bounds, unconditional exact cleanup, DoctorResultV2, and the ordered 24-ID contract remain intact. The repeated hosted failure means the proposed race/canonicalization correction is still not portable enough to accept.

## Documentation and Architecture

**Passed.** README, PRD, docs index, Phase 1, Phase 3, Phase 4, and the RPIV integration contract match the committed product contracts. RunSnapshotV5 and v4 migration, DoctorResultV2, private tmux behavior, strict identity grammar, recovery, diagnostics, usage, configuration, operations, and troubleshooting are covered and documentation tests pass. No API/OpenAPI, database, service, container, or deployment update applies. ADR-260812, ADR-260814, related core-components, and decisions 123-143 remain authoritative and aligned.

## Validation Results

| Gate | Result | Evidence |
|---|---|---|
| Root command interface | Passed | Root `justfile` exposes `verify-focused` and `verify`. |
| Independent direct `just verify` | Passed locally | Exit 0; lint, Prettier, strict types, 23/23 suites, 445/445 tests, build, and diff check passed. Coverage: 88.90% statements, 83.99% branches, 95.42% functions, 90.50% lines. |
| `harness checks --json` | Passed locally | Exit 0, envelope `status: ok`, `scope: full`, delegated `just verify`, delegated exit 0, 23 suites and 445 tests. |
| Isolation/resource audit | Passed locally | No controlled Doctor roots or helper processes remained; tests use temporary/injected executables and private local sockets, not ambient tmux, Sparkta, credentials, live Copilot, a consumer repository, or external network services. |
| PR CI Node 22 | **Failed** | Job `94797141447`; 1/23 suites and 4/445 tests failed in `src/doctor-integration.test.ts`. |
| PR CI Node 24 | **Failed** | Job `94797141332`; identical 1-suite/4-test failure. |
| Package smoke | **Skipped** | Job `94797352303` skipped after matrix failure. |

Hosted run: https://github.com/jsburckhardt/soft-factory-runner/actions/runs/31809715459

## RPIV Retro Harvest

Verifier observations were persisted and read back in `.harness/records/retro/2026-08-14/029-issue-29-rpiv-verifier-repeated-ci-return.md` before clearing two pending entries. Post-clear listing returned `status: ok` with zero observations.

`harness retro insights --plan 29-preserve-retryable-tmux-preparation-failures-with-bounded-identity-diagnostics --json` returned exit 0, `status: ok`, schema `harness.retro-insights/v1`, 16 records, 68 entries, four RPIV agents, 68 kept dispositions, zero malformed/unsupported records, and `buffer_pending: 0`.

## Publication

No AgentResultV1 was published. Acceptance and hosted final validation failed, final-head metadata CI was not started, and no Issue #29-specific injected no-clobber publication binding was available. The unrelated pre-existing Issue #25 candidate remained unchanged.
