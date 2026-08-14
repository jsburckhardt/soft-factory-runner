# CORE-COMPONENT-260812-official-asset-installation-contract: Official Asset Installation Contract

## Status

Adopted

## Purpose

Define one reusable safety, compatibility, integrity, migration, retirement, transaction, output, and delivery-agent contract for the sole official asset installation surface.

## Scope

This component applies to the packaged official catalog and bytes, `install agent`, `install --recommended`, closed legacy ownership recognition, `.agents/manifest.json`, `.github/agents/soft-factory.agent.md`, legacy retirement, cross-root rollback, installer rendering, deterministic fixtures, npm packaging, help, and consumer documentation. It does not change issue orchestration, Runner lifecycle invariants, RPIV completion authority, or the canonical Doctor check set.

## Definition

### Rules
- Distribute exactly one consumable official asset, `agent:soft-factory`, from package source `assets/official/soft-factory.agent.md` to `.github/agents/soft-factory.agent.md` with package-coupled version, Runner protocol 1, and compiled lowercase SHA-256 digest.
- Publish `dist/`, the exact delivery-agent source file, and required documentation through an explicit npm file allowlist. Exclude assessor, skill, sibling, and reference files without deleting unrelated workspace files. Installation MUST remain local, no-network, and subprocess-free.
- Support exactly `install agent soft-factory` and `install --recommended`; both select the sole current agent and reconcile every recognized legacy record. Reject assessor and skill selectors through stable unsupported CLI behavior.
- Keep strict `.agents/manifest.json` schema version 1. Final successful state MUST contain one ordered current entry recording type, name, package version, Runner protocol 1, `.github/agents/soft-factory.agent.md`, and the trusted desired digest.
- Parse migration ownership only for current `agent:soft-factory` at `.github/agents/soft-factory.agent.md`, legacy `agent:soft-factory` at `.agents/agents/soft-factory.agent.md`, legacy `agent:soft-factory-assessor` at `.agents/agents/soft-factory-assessor.agent.md`, and legacy `skill:soft-factory` at `.agents/skills/soft-factory/SKILL.md`, in that stable rank.
- Require exact manifest fields, supported schema and protocol, nonempty version, lowercase 64-character digest, and unique destination. Permit duplicate `agent:soft-factory` identity only for one exact old-destination record plus one exact current-destination record. Reject every other duplicate, contradiction, unsupported identity or destination, unsafe path, unknown field, malformed value, or unstable order before mutation.
- Verify desired package bytes and protocol before mutation eligibility. Treat an absent current destination as installable, desired current bytes as adoptable without rewrite, and differing current bytes as upgradeable only when they match a valid current-destination recorded digest.
- Retire a recognized legacy entry with an absent file as stale metadata. Retire a present legacy file and entry only when file SHA-256 equals its recorded digest. Refuse the complete operation when a recorded legacy file differs or a legacy destination is present without exact ownership proof.
- Require old and current agent destination classifications to pass together when both exist. Permit desired current bytes or valid older current-owned bytes to combine with proved old-agent and obsolete-asset retirement in one operation.
- Preserve all unrecognized files and directories. Remove only known legacy ancestor directories made eligible by a file retired in the same operation, deepest first and only while empty. Never recursively remove them, remove nonempty directories, remove a directory for an absent stale file, or remove `.agents/`.
- Preflight selected source integrity, the complete recognized manifest, every current and legacy path kind and digest, root containment, parent path kinds, collisions, and the final plan before mutation. Symlink or other indirection under `.github/` or `.agents/` MUST fail safe.
- Execute clean installation, migration, adoption-plus-retirement, upgrade, and retirement-only plans as one cross-root transaction. Use destination-local staged files and reversible backups, apply the current agent, retire proved legacy files, remove eligible empty directories, and atomically replace the manifest last.
- On any mutation failure, restore exact prior bytes, path absence, and eligible directory existence in reverse order. Return a stable exact-rollback filesystem failure when restoration is proved. Return `ASSET_ROLLBACK_UNCERTAIN` when proof fails, listing every planned affected path and direct restore-before-retry remediation.
- Return typed stable installation codes, the sole current asset outcome, explicit legacy retirement outcomes, changed state, safe paths, and actionable remediation. Preflight refusal MUST be nonzero and include `No files changed`; uncertain rollback MUST never claim no change.
- Repeating any successful operation with unchanged inputs MUST perform zero mutations, retain one current manifest entry, leave no proved obsolete official files, and create no legacy directory.
- Require the installed agent to use APS section order and tag-newline form with VS Code Copilot frontmatter tools `execute/runInTerminal` and `execute/getTerminalOutput`, `user-invocable: true`, `disable-model-invocation: false`, and `target: vscode`.
- Require the agent to reject missing, multiple, nonpositive, signed, fractional, leading-zero, or otherwise invalid issue input before terminal use. For one valid issue, require instructions before Doctor and dispatch only after ready Doctor output.
- Require direct `soft-factory ... --json` invocations without wrappers, chaining, retry, status follow-up, lifecycle commands, direct RPIV invocation, or resource inspection. Preserve exact instructions failure, non-ready Doctor, or run output as applicable, and keep dispatch acceptance separate from issue completion.
- Keep `.github/agents/rpiv.agent.md` as the sole Doctor RPIV authority. The delivery agent and `.agents/manifest.json` MUST NOT add, remove, satisfy, or replace any canonical Doctor check.

### Interfaces
- `OfficialAssetCatalogEntry` exposes the sole current type, name, source, destination, version, Runner protocol, and desired SHA-256 digest.
- `LegacyOfficialAssetRecord` is the closed identity-destination migration vocabulary and stable rank used only to parse ownership and plan retirement.
- `AssetManifestV1` exposes `schemaVersion: 1` and strict recognized ownership entries; the serializer emits only the current catalog entry after convergence.
- `AssetInstallationPlan` classifies current write or adoption, legacy file and entry retirements, eligible empty directories, final manifest bytes, and every affected path before mutation.
- `AssetInstallationResultV1` exposes the current agent status plus explicit `retired` or `stale-entry-retired` legacy outcomes, changed state, manifest path, and stable result code.
- `AssetInstallationService` accepts a repository root and the sole supported selection, then returns a typed result without rendered prose.
- Filesystem and asset-source ports expose strict path-kind reads, byte reads, destination-local exclusive staging, atomic rename, reversible retirement, empty-directory removal, exact restoration, and cleanup for deterministic tests.
- CLI grammar exposes `install agent soft-factory` and `install --recommended`; rendering exposes one current asset and any retirement outcomes without local bytes.

### Expectations
- Clean individual and recommended installation produce identical current agent bytes and one manifest entry across `.github/` and `.agents/`.
- Matching or absent old-agent ownership converges safely; both-destination states converge only when each destination has the required proof.
- Matching or absent assessor and skill ownership retires; modified or unproved legacy bytes refuse all mutation; skill siblings and unrelated content remain byte-identical.
- Desired current bytes keep inode and bytes during adoption; older proved current bytes upgrade; every other differing current destination refuses.
- Fault injection at every mutation boundary proves exact inventory restoration or an uncertain result naming every affected path, including the post-new-write and pre-old-retirement window.
- Package inspection finds the sole agent source and no assessor, skill, or local reference source.
- Static agent checks prove APS structure, exact Copilot frontmatter, invalid-input rejection before tools, instructions-before-Doctor order, ready-only dispatch, exact output preservation, and dispatch-versus-completion distinction.
- Documentation and help name only the current selector, destination, manifest, migration outcomes, safety, sibling preservation, and rollback remediation.

## Rationale

Installation can remove previously managed content and now spans two repository roots. A closed migration vocabulary keeps historical proof usable without turning arbitrary manifest entries into deletion authority. Complete preflight plus reversible, manifest-last compensation preserves the existing fail-safe ownership model. The repository APS adapter supplies the qualified Copilot terminal tools and frontmatter, while the accepted reference behavior narrows the agent to one explicit dispatch and prevents a second lifecycle control plane.

## Usage Examples

```
soft-factory install agent soft-factory
soft-factory install --recommended

# both commands converge to:
.github/agents/soft-factory.agent.md
.agents/manifest.json

# exact legacy digest -> retire in the same transaction
# modified or unproved legacy bytes -> refuse with No files changed
# repeated convergence -> ASSETS_UP_TO_DATE with zero mutations
```

## Integration Guidelines

- Separate current catalog selection from the closed legacy ownership parser; never make removed assets selectable.
- Model every write, retirement, directory removal, and manifest replacement in one immutable preflight plan.
- Record all planned affected paths before mutation so uncertain rollback output is complete.
- Use file inventory snapshots, mutation traces, inode checks, and deterministic fault ports; do not add production fault flags.
- Keep package publication assertions exact rather than accepting an entire asset directory.
- Update catalog, manifest parsing, transaction engine, renderer, command help, tracked fixtures, package checks, README, PRD, docs index, and operations guide together.
- Validate through root `just verify-focused` while implementing and root `just verify` before handoff; harness checks remain delegates.

## Exceptions

- None. No force overwrite, partial convergence, recursive legacy cleanup, broad package directory, alternate manifest, network fallback, generic shell tool, lifecycle-capable official agent, or Doctor fallback is permitted.

## Enforcement

- [x] Automated checks
- [x] Code review checklist
- [x] Test coverage requirements

## Related ADRs

- [ADR-260812-official-asset-distribution-installation](../ADR/ADR-260812-official-asset-distribution-installation.md)
- [ADR-260812-repository-doctor-readiness](../ADR/ADR-260812-repository-doctor-readiness.md)
- [ADR-260812-rpiv-integration-completion-contract](../ADR/ADR-260812-rpiv-integration-completion-contract.md)
- [ADR-260810-typescript-node-cli](../ADR/ADR-260810-typescript-node-cli.md)
