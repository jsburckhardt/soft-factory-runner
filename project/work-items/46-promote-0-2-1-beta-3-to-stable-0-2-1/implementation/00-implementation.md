# Implementation Notes: Stable 0.2.1

## Scope and status

Implemented GitHub Issue #46 as a release-only promotion from `0.2.1-beta.3` to stable `0.2.1` against immutable baseline `1a3ed0006383cdfe9a7073ab2d5da5dd625435a5`. No tag, GitHub release, or npm publication was created. These notes provide Implement-stage evidence only; final acceptance remains owned by Verify.

## Completed tasks

- [x] T-1 — inventoried governed current surfaces, fixed the immutable baseline, captured empty local/remote tag and GitHub release inventories, and established the PR-only boundary.
- [x] T-2 — synchronized package, root-lock, official-asset, fixture/assertion, and current user-guidance surfaces at `0.2.1` while preserving historical prerelease statements.
- [x] T-3 — packed locally, installed the exact tarball into a clean isolated prefix, converged the installed official asset into an isolated target, inspected metadata, and removed all isolated artifacts.
- [x] T-4 — ran harness and direct focused/full gates, classified the complete diff, persisted and cleared RPIV observations, and prepared the committed Verify handoff.

## Acceptance evidence

### AC-1 — stable current surfaces and historical preservation

- Finite current inventory: `package.json=0.2.1`, `package-lock.json#version=0.2.1`, `package-lock.json#packages[""].version=0.2.1`, and `OFFICIAL_ASSET_VERSION=0.2.1`.
- Updated package/install fixture and assertion surfaces in `src/asset-cli.test.ts`, `src/official-assets.test.ts`, `src/issue-36-repository.test.ts`, `src/issue-42-repository.test.ts`, and `src/documentation.test.ts`.
- Updated current guidance in `README.md`, `docs/README.md`, `docs/phase-3-recovery-operations.md`, `docs/phase-4-repository-doctor.md`, and `docs/phase-5-official-assets.md`.
- `git diff --quiet` against the baseline for `project/architecture/` and Issue #44 historical work-item records exited 0. Historical beta.0-beta.3 narrative remains asserted by repository tests.

### AC-2 — dependency invariance

- Deep comparisons against the immutable baseline reported equal `dependencies`, `devDependencies`, `optionalDependencies`, and `peerDependencies` declarations.
- Removing the root package entry from both lock package maps produced 453 non-root entries and exact deep equality.
- The lockfile diff contains only the top-level package version and `packages[""].version` promotion.

### AC-3 — no functional change

- The only non-test product-source diff is the package-coupled `OFFICIAL_ASSET_VERSION` literal changing from `0.2.1-beta.3` to `0.2.1`.
- Remaining application changes are current version fixtures/assertions and documentation. Asset bytes, SHA-256, protocol, destination, ownership, package allowlist, behavior, and dependencies are unchanged.
- The complete baseline-to-working-tree classification contains only package/root-lock metadata, version assertions, current documentation, work-item evidence, and RPIV retro records; no promotion-specific functional repair was required.

### AC-4 — publication boundary

- Before and after implementation, local tags, remote tags, and `gh release list --limit 100` were empty.
- No tag, GitHub release, npm publication, or production-access command was run. Delivery remains PR-only pending Verify.

### AC-5 — repository-local package and clean installation

- Isolated build and pack exits: `just build=0`; `npm pack --json --pack-destination <isolated>=0`.
- Pack JSON identity: `soft-factory-runner@0.2.1`; filename `soft-factory-runner-0.2.1.tgz`; 73 files; packed size 146,922 bytes; unpacked size 661,788 bytes.
- Exact tarball SHA-256: `48dba071ceb87164a759c87433efb2978738c2df16ea25bbe96df23ad9bd6832`.
- Packed `package/package.json` reported `soft-factory-runner` version `0.2.1`.
- Clean local install used the exact tarball with `--offline --ignore-scripts --no-audit --no-fund --omit=dev`; exit 0; installed metadata reported version `0.2.1` and no runtime dependencies.
- Installed `soft-factory install --recommended` exited 0 and generated schema-v1 manifest metadata with one `agent:soft-factory` entry at version `0.2.1`, protocol 1, destination `.github/agents/soft-factory.agent.md`, and unchanged digest `a77899dbd3d4d3e3d89a637b736f80690334363908b6d593d9742579924c8cad`.
- The isolated package, npm cache, prefix, and target root were recursively removed; a follow-up search found no `issue-46-package-*` directory and Git status showed no package artifact.

### AC-6 — focused and full gates

- Required boot orientation: `harness boot --json` status `ok`, application exit 0 with exact bootstrap signal, composed full checks exit 0, 29 suites and 670 tests.
- T-1 `just verify-focused`: exit 0, 29 suites, 670 tests.
- T-2 `just verify-focused`: exit 0, 29 suites, 670 tests.
- T-3 `just verify-focused`: exit 0, 29 suites, 670 tests.
- T-4 `harness checks --focused --json`: status `ok`, delegated `just verify-focused`, exit 0, 29 suites, 670 tests.
- T-4 direct `just verify-focused`: exit 0, 29 suites, 670 tests.
- First `harness checks --json` attempt failed at root `format-check` for two edited tests; Prettier normalized only those tests. The retry returned status `ok`, delegated `just verify`, exit 0, 29 suites and 670 tests.
- Direct `just verify`: exit 0; lint, format check, type check, 29 suites/670 tests, coverage, build, and diff hygiene passed. Coverage was 89.6% statements, 85.57% branches, 95.88% functions, and 91.26% lines.

## Documentation evidence

- `README.md`: current stable identity, beta.3-to-stable upgrade/reinstall commands, exact local tarball path, installed-version confirmation, and manifest reconvergence now use `0.2.1`.
- `docs/README.md`: current release is stable `0.2.1` while the beta.0-beta.3 history remains explicit.
- `docs/phase-3-recovery-operations.md`: deferred local operator handoff now names the packed stable `0.2.1` tarball; operational safeguards are unchanged.
- `docs/phase-4-repository-doctor.md`: historical beta release records remain and a stable `0.2.1` no-behavior-change statement was added.
- `docs/phase-5-official-assets.md`: upgrade/reinstall, packed filename, version confirmation, generated manifest example, and historical beta.3 ownership reconvergence now distinguish stable `0.2.1` from prerelease input.
- API documentation: no impact; the CLI still exposes no network API or service contract.
- Configuration documentation: no impact; no option, default, or grammar changed.
- Migration documentation: the package/official-asset upgrade and reconvergence guidance above is the applicable migration note; no data/schema migration changed.
- Architecture documentation: no contract change; ADRs, core-components, and `DECISION-LOG.md` remain unchanged, so no return to Plan was required.
- Deployment/operations: local npm/Node operation remains unchanged apart from selecting the stable tarball; no daemon, container, registry, or production procedure changed.

## Harness friction records

- `.harness/records/retro/2026-08-20/001-issue-46-rpiv-research.md` — 13 observations.
- `.harness/records/retro/2026-08-20/002-issue-46-rpiv-implementer.md` — 7 observations.
- `.harness/records/retro/2026-08-20/003-issue-46-rpiv-planner.md` — 2 observations.
- Durable read-back confirmed every pending ID, description, fingerprint, and first-seen timestamp before clearing. All coordinator, Research, Plan, and Implement buffers then reported zero pending entries.
- `harness retro insights --plan 46-promote-0-2-1-beta-3-to-stable-0-2-1 --json` returned status `ok`: 3 records, 22 entries, 3 agents, 0 malformed records, and 0 pending buffer entries.

## CI correction after Verify

- PR #47 CI at head `a5f4b681db0d2e5e71de367f88e72ee24a5c6747` exposed baseline-aware diff hygiene that the working-tree-only root recipe did not detect: one extra EOF blank line in each of `plan/01-action-plan.md` and `plan/02-task-breakdown.md`.
- Removed only those two extra EOF blank lines. Product behavior, version surfaces, dependencies, package evidence, documentation contracts, and Verify’s accepted summary remain unchanged.
- Direct `git diff --check 1a3ed0006383cdfe9a7073ab2d5da5dd625435a5` exited 0 after the correction.
- `harness checks --focused --json` returned status `ok`, delegated `just verify-focused`, exited 0, and reported 29 suites/670 tests.
- Direct `just verify-focused` exited 0 with 29 suites/670 tests and diff hygiene passing.
- `harness checks --json` returned status `ok`, delegated `just verify`, exited 0, and reported 29 suites/670 tests.
- Direct `just verify` exited 0; lint, formatting, type checking, 29 suites/670 tests, coverage, build, and diff hygiene passed.
- Documentation impact: no application documentation changed because this correction affects only Plan artifact EOF whitespace; no setup, API, configuration, usage, migration, architecture, operations, or deployment behavior changed.
- New Implement friction was persisted at `.harness/records/retro/2026-08-20/005-issue-46-rpiv-implementer.md`, read back completely, and then cleared from the transient buffer.
