# Research Brief: Make clean installs and delivery verification reproducible

## GitHub Issue
- **Issue:** #25
- **Title:** Make clean installs and delivery verification reproducible
- **Work Item:** `project/work-items/25-make-clean-installs-and-delivery-verification-reproducible`

## Scope Classification
- **Scope Type:** issue

## Problem Statement
The repository can pass full verification in a previously hydrated worktree while coverage collection fails after a pristine install because `jest-util` is unavailable. Setup can mutate dependency state, and the repository lacks independent delivery automation covering clean Node.js 22/24 verification and the installed npm CLI artifact. Command discovery and the devcontainer feature lock also do not consistently reflect the declared repository surface.

## Acceptance Criteria
**Core**
- [ ] In a clean Linux checkout with package-registry access and no installed dependencies, `just setup` uses the committed dependency state without changing it, and `just verify` passes the complete discovered test suite and coverage collection on Node.js 22 and Node.js 24.
- [ ] Pull requests, pushes to the default branch, and manual dispatch each run clean setup and full verification for Node.js 22 and Node.js 24 with read-only repository permissions; a newer run for the same workflow and pull-request number or Git ref cancels an older in-progress run.
- [ ] Delivery checks prove that the built package contains only the publish set declared by the package manifest, includes its declared CLI entry point, installs without development dependencies, and exits successfully with the existing CLI contract output when run from the installed package.
- [ ] Bare `just` invocation lists the available project recipes and exits successfully.
- [ ] The development-container feature lock has exactly one entry for every configured feature, including Node.js, no entry for an unconfigured feature, and an immutable resolved reference and integrity digest for every entry.

**Edge Cases**
- [ ] Clean verification does not depend on an accidentally available or previously installed transitive package; coverage collection completes without the observed missing-module failure.
- [ ] Repeating `just setup` and `just verify` in the same checkout remains successful and leaves committed dependency state unchanged.
- [ ] Automated delivery exits nonzero with inspectable output if full verification fails, verification changes tracked content, committed changes contain whitespace errors, package contents exceed the manifest publish set, package installation fails, or the installed CLI violates its existing output contract.

**Verification**
- [ ] Captured command output and clean-tree status provide repeatable repository-local evidence of clean setup, the discovered passing test count, successful full verification, and unchanged committed dependency state.
- [ ] The repository-inspectable delivery definition covers every required trigger, Node.js version, clean-tree check, whitespace check, and package check, and pins third-party automation to immutable revisions.

## Repository Findings
- Issue #25 contains exactly one marker-bounded structured Markdown acceptance-criteria block with 10 unchecked criteria. The criteria above preserve the checkbox text and issue order verbatim.
- Immediately before Research created this brief, branch `fix/25-reproducible-clean-install-ci` was at `e6a4c3c9414a48dd47617e2ff78fe2b2f5856f33b` with no staged changes. The pre-Research dirty scope was exactly four modified tracked files (`.devcontainer/devcontainer-lock.json`, `justfile`, `package-lock.json`, and `package.json`) plus untracked `.github/workflows/ci.yml`. Research preserved those changes and added only this brief.
- The root `justfile` remains command authority. Its dirty diff adds a default recipe delegating to `just --list` and changes `setup` from `npm install` to `npm ci --include=dev`. `verify` runs lint, format check, type check, the Jest coverage command, build, and `git diff --check`.
- `package.json` declares Node.js `>=22`, the `soft-factory` executable at `dist/index.js`, and the npm `files` publish set `dist/`, `assets/official/`, `README.md`, and `docs/`. It has no production `dependencies`; its dirty diff adds `jest-util@^29.7.0` as a root dev dependency.
- The current `package-lock.json` is lockfile v3 with 454 package entries, a root `jest-util` declaration, and a top-level `jest-util@29.7.0` resolution. Relative to `HEAD`, the lock diff is 200 additions and 2,300 deletions and reduces entries from 600 to 454. The committed lock already had a top-level transitive `jest-util` and 20 nested `jest-util` paths, but no root manifest declaration.
- `jest.config.cjs` collects coverage from application TypeScript and enforces 80% global branch, function, line, and statement thresholds. There are 21 tracked co-located `src/*.test.ts` files. `src/official-assets.test.ts` currently builds and inspects `npm pack --dry-run --json` for included official assets and excluded runtime/repository state.
- `src/index.ts` defines the no-argument installed-CLI contract as exit 0 with `Soft Factory Runner is bootstrapped. Product commands will be delivered through RPIV.`; `src/index.test.ts` asserts that exact output. The package manifest maps the executable to the same compiled module.
- Untracked `.github/workflows/ci.yml` declares pull-request, `main` push, and manual-dispatch triggers. GitHub reports `main` as the repository default branch. Workflow permissions are read-only, concurrency groups by workflow and pull-request number or ref with cancellation enabled, and verification uses an Ubuntu 24.04 matrix for Node.js 22.x and 24.x.
- The workflow pins checkout, Node setup, and just setup actions to full commit SHAs. Its verify job runs `just setup`, `just verify`, committed-range whitespace checks, and a porcelain clean-tree check. Its dependent package job builds, creates an npm tarball, filters package paths, requires `dist/index.js`, installs the tarball with `--omit=dev`, and compares the installed `soft-factory` output with the existing exact CLI contract.
- `.devcontainer/devcontainer.json` configures 10 features. The current lock also has exactly those 10 keys, including `ghcr.io/devcontainers/features/node:1`; every lock entry has a digest-qualified resolved reference and integrity digest. The dirty diff removes unconfigured Azure CLI and adds configured Node.js.
- `README.md`, `CONTRIBUTING.md`, `docs/README.md`, and `.harness/engineering-harness.md` identify the root recipes as authoritative and require Node.js 22+, just, and the ambient harness. `docs/phase-5-official-assets.md` documents the explicit npm publish allowlist and local package inspection boundary.

## Constraints
- The accepted TypeScript/Node.js architecture fixes npm as package manager, Jest as test runner, and npm package distribution with the `soft-factory` executable (`ADR-260810-typescript-node-cli`).
- Raw setup, operation, and validation commands remain in root `justfile` recipes; wrappers and automation delegate rather than duplicate that authority (`CORE-COMPONENT-260806-project-command-interface`, `ADR-260811-engineering-harness-surface`).
- Full verification retains strict TypeScript, ESLint, Prettier, deterministic Jest behavior, and at least 80% global coverage (`CORE-COMPONENT-260810-development-standards`).
- The harness is an ambient development prerequisite, not an npm product dependency, and its checks delegate to root recipes (`CORE-COMPONENT-260811-engineering-harness-interface`).
- npm publication is constrained by the explicit `files` allowlist and must continue to include compiled Runner and official asset bytes while excluding repository/runtime state (`ADR-260812-official-asset-distribution-installation`, `CORE-COMPONENT-260812-official-asset-installation-contract`).
- The existing CLI entry point and exact no-argument output are public package behavior in `package.json`, `src/index.ts`, and `src/index.test.ts`.
- The issue explicitly requires a clean Linux checkout with package-registry access. Repository operation additionally requires Node.js 22 or 24 and `just`; GitHub-hosted delivery depends on Actions and access to the pinned actions and npm registry.
- Setup and verification must not leave committed dependency state changed. The current working tree is intentionally dirty implementation context and must be preserved during later RPIV stages.

## Relevant ADRs and Core-Components
- `project/architecture/ADR/ADR-260810-typescript-node-cli.md` — accepted Node.js, TypeScript, npm, Jest, and npm CLI distribution boundary.
- `project/architecture/ADR/ADR-260811-engineering-harness-surface.md` — accepted root-recipe ownership with ambient harness delegation.
- `project/architecture/ADR/ADR-260812-official-asset-distribution-installation.md` — accepted npm publish allowlist and package-local official asset distribution.
- `project/architecture/core-components/CORE-COMPONENT-260806-project-command-interface.md` — adopted root `justfile`, recipe discovery, setup, and validation interface.
- `project/architecture/core-components/CORE-COMPONENT-260810-development-standards.md` — adopted complete quality gate and coverage floor.
- `project/architecture/core-components/CORE-COMPONENT-260811-engineering-harness-interface.md` — adopted delegating harness and clean-checkout expectations.
- `project/architecture/core-components/CORE-COMPONENT-260812-official-asset-installation-contract.md` — adopted package allowlist, compiled CLI/assets, and package inspection boundary.
- `project/architecture/core-components/CORE-COMPONENT-260806-agent-executable-acceptance-criteria.md` — adopted bounded, repository-executable acceptance and explicit prerequisite rules.
- `project/architecture/ADR/DECISION-LOG.md` registers all of these records and specifically preserves root command authority, npm CLI distribution, deterministic coverage, harness delegation, and packaged official assets.

## Risks and Open Questions
- No blocking repository ambiguity was identified. Package-registry access is an explicit issue prerequisite and remains external to the repository.
- Research did not execute pristine Node.js 22 and 24 installations; whether the current dependency and lock changes eliminate the reported clean coverage failure on both runtimes remains unobserved.
- The lockfile change is much broader than the single manifest addition, so the provenance and necessity of the deduplication from 600 to 454 entries remain unclear.
- Current lock resolutions use public Azure-backed npm feed URLs. Availability and compatibility with every clean execution environment are external unknowns.
- `.github/workflows/ci.yml` is untracked at the Research baseline, so GitHub cannot execute this definition until it becomes tracked and reaches a workflow-triggering ref.
- The package workflow path filter hard-codes roots corresponding to the current manifest publish set. Future manifest changes could create drift between those two declarations.
- The workflow uses `main`, which matches the current GitHub default branch; a later default-branch rename would make that trigger declaration stale.
- Existing package tests inspect a dry-run tarball, while installed-tarball behavior currently appears only in the untracked workflow. Repository-local behavior for that delivery boundary is therefore not yet independently observed in Research.
