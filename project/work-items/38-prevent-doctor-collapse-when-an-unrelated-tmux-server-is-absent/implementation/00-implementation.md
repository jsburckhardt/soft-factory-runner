# Implementation Notes: Issue #38

## Scope and task completion

- T1 completed: bounded one-attempt targeting inventory and typed unavailable proof.
- T2 completed: targeting failures remain inside `command.tmux` and preserve completed Doctor observations.
- T3 completed: deterministic matrices, repeat equality, confidentiality, and isolated real custom-server/default-absent proof.
- T4 completed: documentation and governed release surfaces synchronized to `0.2.1-beta.0`.
- T5 completed: offline package/install smoke and direct/harness gates.
- T6 remains explicitly deferred until post-RPIV operational acceptance; no Sparkta installation or Issue #7 operation was performed.

## Acceptance evidence

| Criterion | Implementation and evidence |
| --- | --- |
| AC-1 | `src/live.ts` returns zero-byte inventory on pre-query `ENOENT`, invokes no tmux command, and uses 2,000 ms/65,536-byte/1,024-record bounds. `src/issue-38-tmux-inventory.test.ts` proves repeated empty equality, zero calls, explicit selector, cap, and continued byte counting. `src/tmux-context.test.ts` proves the real default socket remains absent. |
| AC-2 | `src/doctor-service.ts` contains inventory failures at the targeting boundary. `src/doctor-integration.test.ts` retains `owner/repo`, `main`, all 24 canonical IDs once in order, and passing git/gh/tmux/node/Copilot/GitHub-auth/Copilot-auth outcomes for controlled success. |
| AC-3 | `src/doctor-integration.test.ts` normalizes human rendering and parses JSON rendering back to the same complete controlled result; targeting evidence remains closed and value-free. |
| AC-4 | `src/issue-38-tmux-inventory.test.ts` covers absent, timeout, nonzero, invalid UTF-8, 65,537 bytes, 1,025 records, EACCES, post-query identity loss, and replacement. Each genuine failure is `TMUX_CONTEXT_REFUSED`/`unavailable-proof` without sentinels; service tests prove only `command.tmux` fails. |
| AC-5 | Existing and extended `src/tmux-context.test.ts` cover `partial-evidence`, `malformed-evidence`, `stale-server`, `ambiguous-session`, and `contradictory-target`, zero mutation/query where required, and sentinel exclusion. `src/doctor-integration.test.ts` proves non-tmux preservation for targeting refusal. |
| AC-6 | `src/doctor-integration.test.ts` deep-compares two controlled Doctor results. `src/tmux-context.test.ts` deep-compares two live-equivalent classifications and byte-compares custom inventory while the default remains absent. |
| AC-7 | `src/tmux-context.test.ts` creates one isolated real custom server, records custom inventory before/after two runs, tripwires all commands against the absent derived default selector, proves default `ENOENT` before/after, and performs exact `finally` cleanup without credentials or network. |
| AC-8 | `README.md`, `docs/README.md`, `docs/phase-4-repository-doctor.md`, and `docs/phase-5-official-assets.md` document the backward-compatible PATCH correction, absent-server non-creation/non-targeting, and value-free genuine/invalid-context failures. `src/documentation.test.ts` asserts these statements. |
| AC-9 | `package.json`, root package-lock values, `src/official-assets.ts`, package/install assertions, README, and guides report `0.2.1-beta.0`. Diff from base `28c96f0` changes only the three Runner root version fields in package metadata and no dependency object/range/version. Offline dry-run/pack/install evidence reported packed, installed, and generated manifest version `0.2.1-beta.0`; no publication, registry, fetch, or network command ran. |
| AC-10 | Direct `just verify-focused` and `just verify` exited 0; harness focused/full JSON envelopes reported `status: ok`, scopes `focused`/`full`, delegated commands `just verify-focused`/`just verify`, and exit code 0. Full suite: 27 suites and 602 tests passed. |

## Package evidence

- `npm pack --dry-run --json`: package ID/version and filename were `soft-factory-runner@0.2.1-beta.0` and `soft-factory-runner-0.2.1-beta.0.tgz`.
- Temporary tar metadata: `packedVersion=0.2.1-beta.0`, dependency count 0.
- `npm install --offline --ignore-scripts --no-audit --no-fund --omit=dev`: installed metadata `0.2.1-beta.0`.
- Installed help rendered the supported command surface.
- Installed asset convergence returned `ASSETS_INSTALLED`, repeat returned `ASSETS_UP_TO_DATE`, and manifest had one `0.2.1-beta.0` asset.
- Installed controlled NOT READY Doctor smoke exited 3 with exactly 24 checks and `ready=false` using an isolated PATH with Node only.
- The tarball, prefix, consumer fixture, and temporary state were removed; no tarball remains in the repository.

## Documentation evidence

Changed application documentation: `README.md`, `docs/README.md`, `docs/phase-4-repository-doctor.md`, and `docs/phase-5-official-assets.md`. There is no API specification impact because Runner exposes no network API. There is no configuration/default, data/database, persisted-schema, deployment, container, service, or runtime procedure change. No migration is required beyond reinstalling/upgrading the exact local package and reconverging package-coupled official assets as documented. Architecture explanation was amended in `CORE-COMPONENT-260817-exact-tmux-context-ownership.md` with Decisions 180-182; implementation stayed within that accepted contract.

## Validation evidence

- Focused gates were run after T1, T2, T3, T4, and T5. Final focused direct result: 27 suites, 602 tests, exit 0. Focused harness envelopes: `status=ok`, `scope=focused`, `delegatedCommand=just verify-focused`, `exitCode=0`.
- First direct full attempt exposed formatting on six changed TypeScript files; formatting was applied and the retry passed.
- Final direct full result: lint, format, typecheck, 27 suites/602 tests with coverage, build, and diff check all passed; exit 0.
- Final harness full envelope: `status=ok`, `scope=full`, `delegatedCommand=just verify`, `exitCode=0`.

## Harness friction records

- `.harness/records/retro/2026-08-18/001-issue-38-plan.md`
- `.harness/records/retro/2026-08-18/002-issue-38-rpiv.md`
- `.harness/records/retro/2026-08-18/003-issue-38-rpiv-research.md`
- `.harness/records/retro/2026-08-18/004-issue-38-rpiv-implementer.md`
- `.harness/records/retro/2026-08-18/005-issue-38-rpiv-implementer-drain.md`

All coordinator, Research, Plan, and Implement buffers were read, persisted; plan-scoped harvest confirmed 5 records and 13 entries under schema 1.2 with the exact work-item `plan_id`, read back, and only then cleared successfully.

Implementation evidence is complete; independent final acceptance remains owned by Verify.
