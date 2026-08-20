# Research Brief: Promote 0.2.1-beta.3 to stable 0.2.1

## GitHub Issue

- Issue: #46
- Title: Promote 0.2.1-beta.3 to stable 0.2.1
- Work item: `project/work-items/46-promote-0-2-1-beta-3-to-stable-0-2-1`
- Scope type: `issue`
- Baseline commit: `1a3ed0006383cdfe9a7073ab2d5da5dd625435a5`

## Problem

The baseline package identifies as `0.2.1-beta.3`, and its full repository gate
passes 29 suites and 670 tests. The repository does not yet identify a stable
`0.2.1` delivery and has no Git tag or GitHub release. Issue #46 requires
promotion to stable `0.2.1` without unrelated functional changes or third-party
dependency churn. The revised issue does not require preserving a prerelease
tarball; absence of that untracked artifact is not a blocker.

## Acceptance Criteria

The issue contains exactly six structured criteria between its acceptance
criteria markers, reproduced verbatim and in issue order.

### Core

- [ ] Every current version surface within the repository's package-version governance scope reports exactly 0.2.1 with no prerelease identifier, including package and lock metadata, official-asset and generated-manifest metadata, package and installation fixtures, and current user documentation; historical delivery records remain unchanged.
- [ ] Compared with baseline commit `1a3ed0006383cdfe9a7073ab2d5da5dd625435a5`, third-party dependency declarations and resolved dependency entries are unchanged, apart from root-project version metadata required by the promotion.
- [ ] The delivery diff contains no functional change unless the stable-version promotion causes a reproducible repository-local gate failure; each such change is limited to that failure and has inspectable failing-before and passing-after evidence.

### Edge Cases

- [ ] No tag or GitHub release is created or published unless repository policy permits it and RPIV Verify has accepted every criterion. Any attempted publication must identify the verified commit as stable 0.2.1 and must stop with inspectable state evidence if an identifier conflicts or publication is incomplete.

### Verification

- [ ] A repository-local package run produces inspectable metadata for a new 0.2.1 artifact, and a clean local installation demonstrably sourced from that artifact reports 0.2.1 without registry publication or production access.
- [ ] The repository's root focused and full gates both exit successfully; the full result executes at least the baseline 29 suites and 670 tests and retains inspectable output.

## Repository Findings

- The active branch is `issue-46-stable-0.2.1`, and its starting `HEAD` equals
  the immutable issue baseline.
- Required harness boot passed, including the exact CLI bootstrap signal and
  the composed full gate with 29 passing suites and 670 passing tests.
- The root `justfile` exposes `verify-focused` and `verify`; these are the
  authoritative RPIV validation commands.
- Current authoritative version metadata is `0.2.1-beta.3` in `package.json`,
  both root-project version fields in `package-lock.json`, and
  `OFFICIAL_ASSET_VERSION` in `src/official-assets.ts`.
- `OFFICIAL_ASSET_VERSION` supplies the sole official catalog entry and the
  version in generated schema-v1 installation manifests.
- Current package and installation assertions occur in
  `src/asset-cli.test.ts`, `src/official-assets.test.ts`,
  `src/issue-36-repository.test.ts`, `src/issue-42-repository.test.ts`, and
  `src/documentation.test.ts`.
- Current user-facing release and installation guidance occurs in `README.md`,
  `docs/README.md`, `docs/phase-3-recovery-operations.md`,
  `docs/phase-4-repository-doctor.md`, and
  `docs/phase-5-official-assets.md`.
- Historical beta delivery records also contain `0.2.1-beta.3`, including
  accepted architecture records, the decision log, and prior work-item
  evidence. Those records describe historical deliveries rather than current
  package identity.
- `package.json#files` limits the npm package to `dist/`, the sole official
  agent, `README.md`, and `docs/`.
- Existing local package proof uses `npm pack --json`, installs the resulting
  tarball into an isolated prefix, reads packed and installed package metadata,
  and checks generated official-asset manifest metadata.
- Package identity is exposed through package metadata; the CLI has no
  `--version` command.
- There are no runtime dependencies. The package declares development
  dependencies, and `package-lock.json` has one root entry plus 453 non-root
  package entries.
- No Git tags or GitHub releases exist. CI has read-only content permissions
  and no publication job. Repository evidence does not authorize registry,
  tag, or GitHub release publication.

## Constraints

- Every current governed version surface must report exact stable `0.2.1`.
- Historical delivery records must remain truthful and unchanged.
- Third-party dependency declaration sections and every non-root resolved
  lockfile package entry must remain equivalent to the immutable baseline.
  Only root-project version metadata may change in dependency files.
- The delivery is release-only. Functional changes are prohibited unless the
  promotion causes a reproducible repository-local gate failure.
- Official asset source, destination, protocol, digest, ownership, transaction,
  and package-inventory contracts remain unchanged.
- Package proof is repository-local packing and clean local installation
  without registry publication, production access, or ambient artifacts.
- The root `justfile` remains validation authority. Harness checks supplement
  but do not replace direct RPIV boundary commands.
- Tag or GitHub release publication is conditional on repository policy and
  complete Verify acceptance; no inspected policy currently grants it.

## Relevant Architecture

- `CORE-COMPONENT-260815-package-semver-governance.md` defines synchronized
  package, lock, official-asset, manifest, fixture, packed, installed, and
  current-documentation version surfaces; dependency preservation; and the
  local package proof boundary.
- `ADR-260810-typescript-node-cli.md` establishes npm package distribution,
  Node.js, TypeScript, Jest, ESLint, and Prettier.
- `ADR-260812-official-asset-distribution-installation.md` couples official
  asset metadata to the package and requires local package installation.
- `CORE-COMPONENT-260812-official-asset-installation-contract.md` requires the
  generated manifest to contain the package version.
- `CORE-COMPONENT-260806-rpiv-stage-contract.md`,
  `CORE-COMPONENT-260810-development-standards.md`, and
  `ADR-260812-rpiv-integration-completion-contract.md` govern RPIV boundaries
  and focused/full validation.
- `DECISION-LOG.md` decisions 152-156 define Semantic Versioning assignment,
  synchronized surfaces, dependency preservation, and version confirmation;
  decisions 206-208 record the historical beta.3 delivery.
- No evidence requires a new ADR or core-component for Issue #46.

## Risks and Open Questions

- Current documentation interleaves current-release guidance with historical
  prerelease history, so indiscriminate replacement would corrupt history.
- The package semver core-component includes both durable governance and
  historical beta.3 statements; their roles must remain distinct.
- Existing dependency comparison uses a merge base with `origin/main`, while
  Issue #46 names an immutable baseline.
- Remote tag or release state can change before Verify.
- No repository policy authorizing tag or GitHub release creation was found.
- Local package commands must use isolated output so generated tarballs do not
  become ambient or committed evidence.

## Research Result

Research passed after validating the revised structured issue, repository
state, relevant architecture, version surfaces, dependency invariants, package
proof boundary, and publication constraints.
