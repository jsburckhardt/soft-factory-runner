# CORE-COMPONENT-260815-package-semver-governance: Package Semantic Versioning Governance

## Status

Adopted

## Purpose

Define one project-wide Semantic Versioning contract for classifying delivery changes, selecting the next Runner package version, synchronizing every authoritative release surface, and giving users verifiable upgrade guidance. This prevents a code or package change from being delivered without the correct major, minor, or patch version.

## Scope

This component applies to Runner code and npm package deliveries, `package.json`, the root package entries in `package-lock.json`, the official-asset catalog, generated installed manifests, package and installation fixtures, packed and installed npm metadata, current user documentation, and the repository instruction contract. It does not change third-party dependency versions, publish to a registry, create a release service, or require one release commit per source commit.

## Definition

### Rules

- Use a valid Semantic Versioning 2.0.0 `MAJOR.MINOR.PATCH` value for every Runner package delivery.
- Classify every code or package change before delivery and select one release increment from the highest-impact included change.
- Increment PATCH for a backward-compatible defect correction or internal maintenance that adds no functionality.
- Increment MINOR for backward-compatible functionality.
- Increment MAJOR for an incompatible public-contract change when the current MAJOR is at least 1.
- Increment MINOR for an incompatible pre-1.0 public-contract change while the package remains in initial development. Set `1.0.0` only when a delivery explicitly establishes the stable public contract.
- Record the selected change class and exact version in the delivery work item.
- Keep `package.json`, the top-level and root-package `package-lock.json` values, the official-asset catalog version, current fixtures, generated installed-manifest metadata, packed and installed package metadata, and current user documentation exactly agreed.
- Preserve all third-party dependency versions and ranges during a release-only version update.
- Document how an existing user upgrades or reinstalls the exact delivered package version, confirms the installed package version, and reconverges package-coupled official asset metadata.
- Keep `AGENTS.md` instructions APS-compliant: use one absolute `You MUST` command per line, state major/minor/patch assignment explicitly, preserve unrelated content and order, and omit workflow or control-flow prose.
- Classify the locale-compatible tmux identity correction as a backward-compatible defect fix and release it as `0.1.1`.

### Interfaces

- `package.json` and the top-level and root-package entries in `package-lock.json` are the authoritative npm package version inputs.
- `OFFICIAL_ASSET_VERSION` couples official asset and newly generated manifest metadata to the package release.
- `npm pack --dry-run --json`, a temporary `npm pack`, and a temporary clean `npm install` expose inspectable packed and installed version metadata.
- The root `just verify-focused` and `just verify` recipes remain the delivery validation authority.
- `AGENTS.md` carries the mandatory pre-delivery version-assignment instructions for humans and agents.

### Expectations

- All authoritative product surfaces produce the same exact package version.
- Packed and installed evidence distinguishes the delivered version from the previous version.
- Release-only updates do not change the dependency graph, lockfile dependency metadata, or package file inventory.
- Documentation names the current version and gives copyable upgrade, reinstall, confirmation, and official-asset reconvergence guidance.

## Rationale

Semantic Versioning gives consumers a stable change signal, but the specification leaves pre-1.0 increment policy to the project. The explicit initial-development rule preserves PATCH for backward-compatible corrections, uses MINOR for incompatible pre-1.0 contract changes, and reserves `1.0.0` for an explicit stability commitment. Finite synchronization and package proof prevent stale lock, asset, manifest, fixture, packed, installed, or documentation values from misrepresenting a delivery.

## Usage Examples

```
backward-compatible defect correction: 0.1.0 -> 0.1.1
backward-compatible feature:           0.1.1 -> 0.2.0
incompatible pre-1.0 contract change:  0.2.0 -> 0.3.0
incompatible stable contract change:   1.4.2 -> 2.0.0
```

## Integration Guidelines

- Determine the highest-impact change class before editing release metadata.
- Update only the finite authoritative Runner version surfaces; distinguish dependency versions from root package entries.
- Generate packed, installed, and official-asset manifest evidence in repository-controlled temporary prefixes without publication or network services.
- Keep upgrade and reinstall guidance consistent with the finite package inventory.
- Update `AGENTS.md` only during Implement while preserving unrelated instruction content and order.

## Exceptions

- No release may omit a version classification or leave authoritative surfaces disagreeing.
- Third-party dependency versions equal to an old Runner version are not Runner release surfaces and must not be rewritten.
- Registry publication is out of scope unless a separate delivery work item authorizes it.

## Enforcement

- [x] Automated checks
- [x] Code review checklist
- [x] Test coverage requirements

## Related ADRs

- [ADR-260810-typescript-node-cli](../ADR/ADR-260810-typescript-node-cli.md)
- [ADR-260812-official-asset-distribution-installation](../ADR/ADR-260812-official-asset-distribution-installation.md)
