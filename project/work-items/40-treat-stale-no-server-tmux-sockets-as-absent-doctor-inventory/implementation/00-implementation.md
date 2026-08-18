# Implementation Evidence: Issue 40

## Scope and status

Implemented T1-T5 on `fix/40-treat-stale-no-server-tmux-sockets-as-absent`. Repository implementation and validation are complete; final acceptance remains owned by Verify. Sparkta operational acceptance is explicitly deferred.

## Completed tasks

- **T1:** Added independently bounded stdout/stderr capture and exact original-byte stale no-server classification with stable socket identity.
- **T2:** Added a repeated 14-row Doctor matrix covering strict success, failure preservation, ordered 24 checks, human/JSON parity, confidentiality, and deterministic equality.
- **T3:** Added two repository-local live-equivalent repetitions using a real isolated custom tmux server and a real stale Unix socket entry, with exact cleanup.
- **T4:** Synchronized package, lock, official asset, package/install assertions, README, docs index, Doctor guide, and official-assets guide to `0.2.1-beta.1`.
- **T5:** Ran focused/full harness and direct gates and assembled this AC evidence index.

## Acceptance evidence

- **AC-1:** `src/live.ts` accepts only nonzero, zero-stdout, exact `no server running on <queried-socket>\n` stderr after equal pre/post identity. `src/doctor-integration.test.ts` stale row proves `invoking-valid`, null reason, and true/true unchanged facts.
- **AC-2:** The stale Doctor row proves `owner/repo`, `main`, `DOCTOR_CHECK_IDS` in exact order with 24 unique entries, and passing git, gh, tmux, node, Copilot, GitHub-authentication, and Copilot-authentication checks.
- **AC-3:** Every Doctor matrix row compares normalized human output and parsed JSON to the same result and scans both renderings for supplied socket, session, pane, error-sentinel, and identity values.
- **AC-4:** `src/issue-38-tmux-inventory.test.ts` covers exact stale success plus spoofed path, additional/missing/malformed stderr, nonempty stdout, stderr overflow, timeout, generic nonzero, invalid UTF-8, 65,537 stdout bytes, 1,025 records, EACCES, identity loss, and replacement. `src/doctor-integration.test.ts` maps the finite closed matrix so only stale succeeds; all other rows are value-free `invalid-context`/`unavailable-proof` false/false while completed non-tmux checks pass.
- **AC-5:** Every Doctor matrix row runs twice with equal complete results. Unit evidence retains stale identity. The live-equivalent fixture compares custom inventory and stale socket device/inode before/after, limits Doctor traces to `display-message`/`list-panes`, repeats the scenario twice, and proves equal projections.
- **AC-6:** `src/tmux-context.test.ts` starts a real isolated custom server, creates a real stale Unix socket by exact helper termination, proves custom query exit 0 and stale query exit 1 with zero stdout and exact stderr, obtains `invoking-valid` true/true evidence, then removes the exact scenario root on both repetitions.
- **AC-7:** `README.md`, `docs/README.md`, `docs/phase-4-repository-doctor.md`, and `docs/phase-5-official-assets.md` identify `0.2.1-beta.1` as a backward-compatible PATCH correction and distinguish exact unchanged stale absence from arbitrary live-server nonzero, malformed, timeout, overflow, EACCES, loss, and replacement.
- **AC-8:** `package.json`, both root lock values, `OFFICIAL_ASSET_VERSION`, package/install tests, packed metadata, installed metadata, and current docs report `0.2.1-beta.1`. A local Node comparison reported `dependency-sections=unchanged third-party-lock-metadata=unchanged`. Offline dry-run pack, pack, isolated `npm install --offline --ignore-scripts --no-audit --no-fund --omit=dev`, installed help, 24-check Doctor JSON smoke, official asset install, generated manifest check, and exact temporary-root cleanup succeeded. No network, dependency update, or publication command was used.
- **AC-9:** Final `harness checks --focused --json`, direct `just verify-focused`, `harness checks --json`, and direct `just verify` all exited successfully. Final suite: 27 suites, 623 tests.

## Documentation evidence

- `README.md`: release/upgrade paths and exact stale-socket Doctor behavior.
- `docs/README.md`: current release summary and no-mutation distinction.
- `docs/phase-4-repository-doctor.md`: strict original-byte classifier, unavailable-proof boundaries, and preservation behavior.
- `docs/phase-5-official-assets.md`: beta.1 package/install/reconvergence guidance and correction summary.
- Architecture amendments remain in `ADR-260817-invoking-tmux-context-targeting`, `CORE-COMPONENT-260817-exact-tmux-context-ownership`, and Decisions 183-184; implementation stayed within those contracts.
- No API, configuration, database/data migration, service, container, deployment, or operational-runbook change applies. Sparkta acceptance remains deferred and untouched.

## Validation evidence

- Focused harness: final status `ok`; delegated `just verify-focused`; 27 suites / 623 tests.
- Direct focused: exit 0; 27 suites / 623 tests.
- Full harness: final status `ok`; delegated `just verify`; lint, format, types, 27 suites / 623 tests, coverage, build, and diff check passed.
- Direct full: exit 0; lint, format, types, 27 suites / 623 tests, coverage, build, and diff check passed.
- Corrected retries retained in retro: concurrent exclusive-fixture gate interference, one documentation assertion, unsupported package-smoke flags/cleanup, and full-gate formatting.

## Harness friction records

- `.harness/records/retro/2026-08-18/007-issue-40-plan.md`
- `.harness/records/retro/2026-08-18/008-issue-40-rpiv.md`
- `.harness/records/retro/2026-08-18/009-issue-40-rpiv-research.md`
- `.harness/records/retro/2026-08-18/010-issue-40-rpiv-implementer.md`
