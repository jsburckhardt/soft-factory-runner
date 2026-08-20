# Task Breakdown: Stable 0.2.1

## [x] T-1: Establish immutable release scope and baseline guards

- Dependencies: none
- Acceptance criteria: AC-1, AC-2, AC-3, AC-4
- Architecture: package semver governance, RPIV stage contract,
  TypeScript/npm ADR

Inventory current governed version surfaces, classify the delivery as stable
patch `0.2.1`, separate current guidance from historical beta records, define
the immutable dependency and diff baseline, and record the PR-only publication
boundary.

Test coverage: V-1, V-2, V-3, V-4.

Expected evidence: baseline SHA, finite version inventory, dependency snapshot,
allowed-diff classification, and tag/release inventories.

## [x] T-2: Synchronize current version surfaces

- Dependencies: T-1
- Acceptance criteria: AC-1, AC-2, AC-3
- Architecture: package semver governance, npm CLI ADR, official asset
  distribution and installation contracts

Update only current package metadata, the two root-project lockfile version
fields, official-asset package version metadata, current package/install
fixtures and assertions, and current user release/install/manifest guidance.
Preserve historical beta records, functional behavior, dependencies, package
inventory, asset bytes, digest, protocol, destination, and ownership.

Test coverage: V-1, V-2, V-3.

Expected evidence: synchronized `0.2.1` inventory, historical-record comparison,
root-only lock change proof, and classified behavior-safe diff.

## [x] T-3: Prove local package and isolated installation

- Dependencies: T-2
- Acceptance criteria: AC-1, AC-2, AC-5
- Architecture: package semver governance and official asset installation
  contract

Build and pack into an isolated directory. Install the exact generated tarball
into a separate clean prefix using no scripts, audit, funding, registry, or
development dependencies. Inspect packed and installed package metadata and
run installed recommended asset convergence in an isolated target to inspect
generated manifest metadata.

Test coverage: V-5.

Expected evidence: pack JSON, exact tarball path and digest, inventory, packed
version, installed version, manifest version, and command exit statuses.

## [x] T-4: Execute gates and prepare Verify handoff

- Dependencies: T-2, T-3
- Acceptance criteria: AC-3, AC-4, AC-6
- Architecture: RPIV stage contract, project command interface, development
  standards, engineering harness interface, RPIV completion ADR

Run `harness checks --focused --json`, `just verify-focused`,
`harness checks --json`, and `just verify`. Confirm the full result executes at
least 29 suites and 670 tests. Recheck the diff, dependencies, tags, releases,
and repository state. Drain required RPIV observations, record evidence, and
commit through `harness commit`. Do not tag or publish.

Test coverage: V-3, V-4, V-6.

Expected evidence: four successful gates, test counts, final comparisons,
unchanged publication inventories, implementation notes, commit SHA, and clean
handoff.

