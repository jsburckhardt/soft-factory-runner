# CORE-COMPONENT-260812-official-asset-installation-contract: Official Asset Installation Contract

## Status

Adopted

## Purpose

Define one reusable safety, compatibility, integrity, manifest, output, and behavioral contract for every official asset installation command and fixture.

## Scope

This component applies to the packaged official catalog and bytes, `install agent`, `install skill`, `install --recommended`, `.agents/manifest.json`, destination mutation, installer rendering, official Operator and Assessor content, fixtures, npm packaging, and documentation. It does not change issue orchestration, Runner lifecycle invariants, the RPIV result contract, or the canonical Doctor check set.

## Definition

### Rules
- Distribute all official asset bytes under package `assets/official/` and compile the authoritative type, name, source, destination, package-version asset version, Runner protocol 1, and SHA-256 digest catalog into Runner.
- Publish `dist/` and official assets through an explicit npm package file allowlist; installation MUST be local and MUST NOT fetch a catalog, access the network, or invoke a subprocess.
- Support exactly `agent soft-factory`, `agent soft-factory-assessor`, and `skill soft-factory`; map them to the three fixed PRD destinations beneath `.agents/`.
- Verify every selected packaged byte digest and exact Runner protocol compatibility before inspecting mutation eligibility or writing files. Integrity or compatibility ambiguity MUST refuse the complete selected batch.
- Parse `.agents/manifest.json` strictly as schema version 1. Record each managed asset type, name, version, Runner protocol, normalized destination, and lowercase SHA-256 digest in stable catalog order.
- Treat absent destinations as installable and desired-byte matches as idempotent. Replace differing bytes only when their current digest equals the prior manifest digest for the same type, name, and destination.
- Treat missing, malformed, duplicate, contradictory, unsupported, or nonmatching manifest proof for a differing target as a local-modification collision. Refuse with zero changes and preserve every unrelated `.agents/` path.
- Preflight all selected assets and the manifest before mutation. Apply staged same-volume files with exact backups and atomic renames, commit the manifest last, and restore prior bytes on failure. Report uncertain rollback as nonzero failure.
- Make `install --recommended` one all-or-nothing batch containing both official agents, the skill, and manifest update. Repeated unchanged installation MUST produce the same filesystem and stable up-to-date outcome.
- Return typed stable installation codes, selected asset outcomes, safe paths, actionable remediation, and explicit nonzero exits for syntax, collision, integrity, compatibility, manifest, or filesystem failures. Human and JSON meaning MUST derive from the same structured result if JSON output is exposed.
- Require the Operator Agent to invoke Runner for explicit `run --issue` and supported `doctor`, `list`, `status`, `attach`, `logs`, `reconcile`, `resume`, `stop`, and `clean` operations; prohibit direct worktree, lock, state, process, cleanup, and completion decisions.
- Require the Assessor Agent to invoke `soft-factory doctor --json`, preserve its complete result as authoritative, and never independently upgrade NOT READY or incomplete output to READY.
- Keep `.github/agents/rpiv.agent.md` as the sole Doctor RPIV authority. Official `.agents/` assets and `.agents/manifest.json` MUST NOT add, remove, satisfy, or replace any canonical Doctor check.

### Interfaces
- `OfficialAssetCatalogEntry` exposes type, name, source, destination, version, runner protocol, and expected SHA-256 digest.
- `AssetManifestV1` exposes `schemaVersion: 1` and ordered managed asset entries with destination and installed digest.
- `AssetInstallationService` accepts a repository root plus selected catalog identities and returns a typed batch result without rendered prose.
- Filesystem and asset-source ports expose strict reads, digest inputs, exclusive temporary creation, atomic replacement, exact restoration, and cleanup for deterministic tests.
- CLI grammar exposes `install agent <name>`, `install skill <name>`, and `install --recommended` through the existing command and rendering boundaries.

### Expectations
- Clean installation creates exactly three official files and one manifest without touching unrelated content.
- Repeat installation performs no asset rewrite and yields byte-identical output state.
- One modified selected target causes recommended installation to change no selected target or manifest byte.
- Protocol mismatch, digest mismatch, malformed manifest, collision, and injected commit failure each produce stable actionable non-success evidence.
- Package inspection proves all catalog sources ship in the npm tarball and their digests match the compiled catalog.
- Contract checks prove both official agents delegate authority to Runner and contain no documented bypass path.

## Rationale

The installer mutates potentially committed user files and the installed agents can suggest destructive-capable operations. A single fail-safe contract prevents command-specific collision rules, partial recommended releases, unverified package bytes, and agent guidance that competes with the deterministic control plane. Packaged assets avoid a new network trust and availability boundary.

## Usage Examples

```
soft-factory install --recommended
# absent targets -> install all three, then manifest
# all desired digests -> already up to date, no rewrites
# one target differs without matching prior manifest digest -> refuse all, change nothing

soft-factory doctor --json
# Assessor explains this complete result; it does not replace its ready value
```

## Integration Guidelines

- Keep catalog and installation policy in deterministic domain modules; isolate package path and filesystem operations behind typed adapters.
- Reuse Runner protocol 1 as exported by the Doctor domain without making installation part of Doctor readiness.
- Generate or verify catalog SHA-256 values in repository validation and inspect `npm pack --dry-run --json` through a focused package test.
- Test transaction ordering and rollback with temporary repositories and fault-injecting filesystem adapters, never production flags.
- Update cumulative help, README, docs index, an installation operations guide, and package publication guidance.
- Validate through root `just verify-focused` and `just verify`; harness delegates remain secondary evidence.

## Exceptions

- None for MVP. No force overwrite, partial recommended install, network fallback, unsigned alternate catalog, or Doctor fallback is permitted.

## Enforcement

- [x] Automated checks
- [x] Code review checklist
- [x] Test coverage requirements

## Related ADRs

- [ADR-260812-official-asset-distribution-installation](../ADR/ADR-260812-official-asset-distribution-installation.md)
- [ADR-260812-repository-doctor-readiness](../ADR/ADR-260812-repository-doctor-readiness.md)
- [ADR-260810-typescript-node-cli](../ADR/ADR-260810-typescript-node-cli.md)
