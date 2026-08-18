# Verification Summary: Issue #38

- **Work item:** `38-prevent-doctor-collapse-when-an-unrelated-tmux-server-is-absent`
- **Branch:** `fix/38-prevent-doctor-collapse-when-unrelated-tmux-server-is-absent`
- **Implementation commit:** `e6141c988b7040577af5bc5c055c6e7f9ec61720`
- **Base:** `28c96f09bff3b62eefebc32fb504f6405ba6d39f`
- **Pull request:** https://github.com/jsburckhardt/soft-factory-runner/pull/39
- **Outcome:** Accepted

## Acceptance Decisions

- **AC-1 — Passed:** absent socket returned stable empty inventory with no tmux command; explicit 2,000 ms, 65,536-byte retention, and 1,024-record limits are implemented and tested.
- **AC-2 — Passed:** controlled integration retained `owner/repo`, `main`, 24 unique ordered checks, and seven named prerequisite passes.
- **AC-3 — Passed:** normalized human and parsed JSON results matched readiness, facts, checks, and value-free targeting classification.
- **AC-4 — Passed:** absence and eight genuine failure rows passed; genuine failures produce value-free `unavailable-proof` and service tests contain failure to `command.tmux`.
- **AC-5 — Passed:** partial, malformed, stale, ambiguous, and contradictory invoking-context classifications are covered with pre-mutation refusal and confidentiality assertions.
- **AC-6 — Passed:** repeated controlled results and real custom-server classifications are equal; inventories remain unchanged and default absent.
- **AC-7 — Passed:** independent targeted rerun used a real isolated custom tmux socket, observed zero default-selector calls, unchanged custom inventory, absent default before/after, and exact cleanup.
- **AC-8 — Passed:** release, Doctor, troubleshooting, usage, upgrade, operational, and architecture documentation matches committed behavior.
- **AC-9 — Passed:** all governed, packed, installed, catalog, fixture, and manifest surfaces report `0.2.1-beta.0`; dependency metadata is unchanged; package proof was offline and publication-free.
- **AC-10 — Passed:** all direct root and harness validation gates passed with finite AC evidence.

## Validation Results

- `just verify-focused`: passed; 27 suites, 602 tests.
- `harness checks --focused --json`: status `ok`, focused scope, delegated `just verify-focused`, exit 0.
- `harness checks --json`: status `ok`, full scope, delegated `just verify`, exit 0.
- Independent `just verify`: passed lint, format, typecheck, 27 suites/602 tests with coverage, build, and diff check.
- Targeted regression/failure rerun: 13 tests passed across real custom socket, absence, genuine inventory failures, Doctor preservation, and before/after containment; the real invalid-context matrix also passed separately.
- Full diff, Conventional Commit, required Co-authored-by trailer, Decisions 180-182, and amended core-component compliance passed.

## Package and Documentation Evidence

Offline dry-run and repeated local pack produced `soft-factory-runner-0.2.1-beta.0.tgz`. Packed and isolated installed metadata were `0.2.1-beta.0` with zero runtime dependencies. Installed help, first/repeat official-asset convergence, schema-v1 manifest version, and isolated NOT READY Doctor smoke (exit 3, 24 unique checks) passed. Temporary package/install/consumer state was removed. No dependency, registry publication, fetch, or network operation occurred.

Changed application documentation (README, docs index, Doctor guide, official-assets guide) accurately covers release/version, behavior, usage, upgrade/reinstall, troubleshooting, migration applicability, architecture, and operational installation. No network API/specification, configuration/default, database/data, service, container, or deployment impact applies.

## RPIV Retro Harvest

Verifier observations were read back into `.harness/records/retro/2026-08-18/006-issue-38-rpiv-verifier.md` before clearing. Final `harness.retro-insights/v1` harvest for the exact plan reported status ok, 6 records, 15 entries, 5 agents, no malformed or unsupported records, and zero pending observations.

## Procedural Notes

Two concrete verifier retries were retained in the verifier retro: correcting the installed-Doctor PATH isolation and replacing an unavailable Python metadata writer with Node.js. Neither indicated an application defect.
