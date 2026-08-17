# Verification Summary — Issue #36

- **Work item:** `36-preserve-the-invoking-tmux-server-and-session-for-issue-windows`
- **Branch:** `feat/36-preserve-invoking-tmux-context`
- **Implementation commit:** `62ae5fd19429b42b8b862dd29b663dbbc62449ac`
- **Pull request:** https://github.com/jsburckhardt/soft-factory-runner/pull/37
- **Outcome:** Accepted

## Acceptance decisions

- **AC-1: Passed** — isolated custom-socket lifecycle proves exact window/pane and unchanged default server.
- **AC-2: Passed** — deterministic standalone tests prove stable same-repository and distinct cross-repository targets.
- **AC-3: Passed** — V6 persistence and V3 reconciliation require complete target identity.
- **AC-4: Passed** — all lifecycle commands use persisted selectors with human/JSON parity.
- **AC-5: Passed** — exact attach/log/status/cleanup tests preserve unrelated inventory.
- **AC-6: Passed** — arbitrary same-name windows are refused and never adopted.
- **AC-7: Passed** — twin-server identical-name isolation and exact cleanup pass.
- **AC-8: Passed** — invalid-context matrix refuses before mutation with unchanged state/server inventories.
- **AC-9: Passed** — only absent evidence selects fallback; collision remains preserved.
- **AC-10: Passed** — concurrent starts yield one owner; cleanup overlaps return whole target or absence.
- **AC-11: Passed** — repeated terminal actions are stable; absent/mismatched controls refuse without mutation.
- **AC-12: Passed** — sentinel scans and value-free evidence preserve tuple/PID/path/resource confidentiality.
- **AC-13: Passed** — Doctor uses explicit socket selectors and bounded actual session/window/pane/socket inventory. The default-server mutation regression keeps directory entries equal but detects the resource change.
- **AC-14: Passed** — repository-local isolated socket/session scenario evidence covers required behaviors without network or credentials.
- **AC-15: Passed** — user documentation covers invoking, fallback, later lifecycle contexts, refusals, confidentiality, non-adoption, and actual-resource Doctor proof.
- **AC-16: Passed** — harness and direct full gates passed with 26 suites and 587 tests.

## Validation

- `harness checks --json`: exit 0, status `ok`, full scope delegated to `just verify`; 26/26 suites and 587/587 tests passed.
- `just verify`: independent exit 0; lint, formatting, types, tests/coverage, build, and `git diff --check` passed. Coverage: 89.21% statements, 84.87% branches, 95.87% functions, 90.88% lines.
- npm package smoke: `soft-factory-runner-0.2.0.tgz` packed, installed into an isolated prefix, CLI `--help` passed, installed metadata reported 0.2.0, and all tarball/temp state was removed.
- Root justfile exposes `verify-focused` and `verify`.

## Doctor proof

Passed. `inventoryServerResources` executes read-only `tmux -S <socket> list-panes -a -F ...`, combines original-byte session/window/pane/name/cwd records with socket device/inode, and closes on timeout/failure/replacement/malformed/overflow. Bounds are 2,000 ms, 65,536 bytes, and 1,024 records. Only unchanged booleans render. The regression mutates the explicit default server while its socket-directory entries remain unchanged and requires `unrelatedUnchanged: false`.

## Architecture, documentation, release, and deletions

The complete diff against main was reviewed. ADR-260817, Decisions 131/134/172-179, and the four governing core-components agree with exact-target authority and V6/V3/V5. README, API/specification, configuration, usage, migration, architecture, operations, and deployment categories were reviewed; applicable docs match behavior, and non-applicable categories have explicit no-impact statements. Release surfaces are synchronized at 0.2.0. Exactly eight skill files are deleted, four lock entries removed, and live-reference/symlink scans are empty.

## Friction and retro harvest

- Generated verifier retro: `.harness/records/retro/2026-08-17/010-issue-36-rpiv-verifier.md` (schema 1.2, six observations, durable read-back succeeded before clearing six buffered entries).
- Harvest command returned exit 0/status `ok`, schema `harness.retro-insights/v1`, exact plan scope, 10 records, 38 entries, four agents, zero malformed/unsupported records, and zero pending observations.

## GitHub state at PR creation

All 16 Issue #36 acceptance checkboxes were checked; issue remains OPEN pending PR merge. Implementation branch was pushed without force and PR #37 was created with Conventional Commit title `feat(tmux): preserve invoking context ownership`.
