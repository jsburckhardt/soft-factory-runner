# Implementation Evidence: Issue #25

## Scope

Reviewed and delivered the implementation already present in the dirty working tree. No product behavior, ADR, core-component contract, test helper, validation recipe, or CI design was added beyond that supplied scope.

## Completed Tasks

- T-1 — Complete: reviewed `package.json`, regenerated `package-lock.json`, and root `justfile` behavior.
- T-2 — Complete: reviewed `.devcontainer/devcontainer-lock.json` and `.github/workflows/ci.yml` structure, security, and failure propagation.
- T-3 — Complete: captured focused, static, package, and documentation evidence.
- T-4 — Complete: captured isolated Node 22/24 repeated clean-install proof and full handoff gates.

## Acceptance Evidence

### AC-1

Isolated Linux containers ran two cycles of `just setup` and `just verify` from checkouts with no `node_modules`. Node `v22.23.2` with npm `10.9.8` and Node `v24.19.0` with npm `11.17.0` each passed both cycles. Every cycle discovered 21 passing suites and 327 passing tests with coverage totals 88.04% statements, 83.48% branches, 94.44% functions, and 89.65% lines.

### AC-2

Static js-yaml validation proved `pull_request`, `push` on `main`, and `workflow_dispatch`; read-only `contents`; cancellation grouped by workflow plus PR number or ref; Ubuntu 24.04; Node `22.x` and `24.x`; `just setup`; `just verify`; and job timeouts. Actual GitHub-hosted runs remain pending push or PR and are not claimed by Implement.

### AC-3

Local package smoke built the package, packed 65 files, found zero paths outside `README.md`, `package.json`, `assets/official/`, `dist/`, and `docs/`, and confirmed `dist/index.js`. The tarball installed into an empty prefix with `--omit=dev --ignore-scripts --no-audit --no-fund`. Installed `soft-factory` exited 0 with exact output `Soft Factory Runner is bootstrapped. Product commands will be delivered through RPIV.` Temporary package state was removed.

### AC-4

Bare `just` exited 0 and listed `boot`, `build`, `default`, `format-check`, `lint`, `run`, `setup`, `test`, `type-check`, `verify`, and `verify-focused`.

### AC-5

Static comparison found 10 configured devcontainer feature keys and 10 lock keys with exact equality. Node is present, Azure CLI is absent, and every entry has matching immutable `@sha256:<64 hex>` resolution and `sha256:<64 hex>` integrity values.

### AC-6

`npm ls jest-util --all` resolved direct root `jest-util@29.7.0` and deduplicated Jest consumers to 29.7.0. Clean Node 22 and Node 24 coverage completed twice without a missing-module failure.

### AC-7

Both runtimes passed two setup and verify cycles. Before and after dependency hashes matched: `package.json` `a738c0688ebb623e0d5e562c5970babc9e954e133ef71c2dcb22891d5c7ae988`; `package-lock.json` `3758958784e35fdef68812b7818272e3151df81c39c6a2cd2331b56548503126`. Isolated checkout status also matched its pre-cycle baseline.

### AC-8

Workflow failure paths are fail-closed: `just verify` runs as its own named step; whitespace uses `git diff --check`; dirty state prints status then exits 1; package allowlist and missing-bin checks throw; npm install propagates nonzero under the default bash shell; exact CLI comparison returns nonzero on mismatch. The package job depends on all matrix verification jobs, so it cannot run after verification failure.

### AC-9

Repository-local evidence includes exact runtime/npm versions, two-cycle test and coverage totals, unchanged dependency hashes, baseline status equality, direct and harness gates, package inventory, CLI output, and `git diff --check` success.

### AC-10

Prettier and installed js-yaml parsed the workflow. Static assertions proved all required triggers, matrix values, permissions, concurrency, timeouts, verify/package dependency, whitespace and clean-tree steps, package checks, and six action references pinned to full 40-character commit SHAs.

## Validation Results

- `harness boot --json`: status `ok`; application exit 0; exact bootstrap signal observed; composed full checks status `ok`.
- `harness checks --focused --json`: status `ok`; delegated `just verify-focused`; 21 suites and 327 tests passed.
- Direct `just verify-focused`: passed; 21 suites and 327 tests.
- Node 22 isolated repeat proof: two setup/full-verify cycles passed with unchanged hashes/status.
- Node 24 isolated repeat proof: two setup/full-verify cycles passed with unchanged hashes/status.
- Workflow Prettier/js-yaml assertions: passed.
- Devcontainer lock parity/digest assertions: passed.
- Local package allowlist/build/install/CLI smoke: passed; 65 files, zero unexpected, exit 0, exact output.
- `harness checks --json`: final rerun status `ok`; delegated `just verify`; 21 suites and 327 tests passed with coverage above thresholds.
- Direct `just verify`: passed independently; 21 suites and 327 tests with coverage above thresholds.
- `git diff --check`: passed.

One earlier full harness attempt failed because temporary isolated checkouts under `.harness/temp` were traversed by ESLint. The temporary proof directories were removed, the reason was recorded as friction, and the full harness gate then passed. This was fixture leakage, not an implementation defect.

## Documentation Evidence

No application-documentation change was required. Existing `README.md`, `CONTRIBUTING.md`, `docs/README.md`, `docs/phase-5-official-assets.md`, and `.harness/engineering-harness.md` already describe Node 22+, root `justfile` authority, setup/validation commands, package allowlist behavior, and harness delegation accurately.

- README: no impact; setup is already documented through `just setup` rather than duplicated npm internals.
- API: no impact; no API contract or service behavior changed.
- Configuration: no impact; no product configuration option or default changed. The devcontainer lock only synchronizes declared features.
- Usage examples: no impact; supported product workflows and interfaces are unchanged.
- Migration: no impact; no breaking, data, API, or configuration migration exists.
- Architecture: no impact; implementation remains within the cited ADR and core-component contracts.
- Operations: no impact; runtime procedures are unchanged.
- Deployment: no impact; no service or deployment model was added. GitHub Actions is delivery verification, with hosted execution pending push or PR.

## Harness Friction Records

- `.harness/records/retro/2026-08-13/001-shared-coordinator-prior-work.md` — pre-existing coordinator observations, explicitly not attributed to issue 25.
- `.harness/records/retro/2026-08-13/002-issue-25-rpiv-planner.md`
- `.harness/records/retro/2026-08-13/003-issue-25-rpiv-research.md`
- `.harness/records/retro/2026-08-13/004-issue-25-rpiv-implementer.md`

All four records were read back before their successful JSON-envelope clears. Final acceptance and hosted CI evidence remain owned by Verify.
