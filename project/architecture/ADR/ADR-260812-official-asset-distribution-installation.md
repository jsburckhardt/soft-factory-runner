# ADR-260812-official-asset-distribution-installation: Official Asset Distribution and Installation

## Status

Accepted

## Context

Issue #7 requires Runner to install three official agent assets safely, repeatably, and without allowing installed agents to bypass Runner. The PRD defines destinations and a minimal manifest but leaves the asset source, integrity trust root, release coupling, protocol compatibility, batch semantics, collision policy, and Doctor relationship unspecified. Target repositories may commit `.agents/`, while Doctor already has an accepted 24-check contract with `.github/agents/rpiv.agent.md` as its sole RPIV asset authority.

## Decision

Ship the authoritative Operator Agent, Assessor Agent, and Soft Factory Skill bytes in the same npm package as the CLI under `assets/official/`. Add an explicit npm package file allowlist containing `dist/`, official assets, and required documentation. Compile an immutable catalog into Runner. Each entry identifies type, stable name, package-relative source, fixed `.agents/` destination, asset version, Runner protocol 1, and expected SHA-256 digest. The asset version equals the npm package version that ships those bytes. The compiled catalog is the integrity trust source; reject packaged bytes whose digest differs. Installation performs no network access or subprocess execution.

Use strict `.agents/manifest.json` schema version 1. Each installed entry records type, name, version, Runner protocol, destination, and SHA-256 digest. Package and asset version identify released bytes; protocol independently identifies compatibility. Reject every selected catalog entry not declaring exact supported Runner protocol 1 before any write.

Preflight an installation as one batch: validate all selected catalog entries and bytes, strictly parse the existing manifest, and classify every target before writing. An absent target is creatable. A target equal to desired bytes is idempotent and may be adopted into the manifest. A differing target is replaceable only when its current digest exactly matches the prior digest recorded for the same type, name, and destination; otherwise treat it as locally modified and refuse. Preserve all unrelated `.agents/` content. Missing, malformed, contradictory, or nonmatching ownership proof refuses the complete batch with actionable typed output and zero changes.

Apply a preflighted batch through same-volume temporary files, exact backups, and atomic renames, writing the manifest last. On a commit failure restore exact prior bytes and report any uncertain rollback as nonzero failure. `soft-factory install --recommended` is all-or-nothing across all three assets and the manifest. Individual `install agent <name>` and `install skill <name>` commands use the same engine.

Install the Operator at `.agents/agents/soft-factory.agent.md`, the Assessor at `.agents/agents/soft-factory-assessor.agent.md`, and the skill at `.agents/skills/soft-factory/SKILL.md`. Require the Operator to delegate explicit issue execution and the supported lifecycle commands to Runner and prohibit competing resources, direct state mutation, invariant bypass, and prose-based completion. Require the Assessor to treat the complete `soft-factory doctor --json` result as the only authoritative readiness decision and limit agent reasoning to explanation and remediation.

Do not add official assets or their manifest to the canonical Doctor conjunction. `.github/agents/rpiv.agent.md` remains the sole RPIV asset authority and no `.agents/` fallback is allowed. Installation provides the agent-facing experience; Doctor separately reports existing repository and runtime prerequisites.

## Alternatives

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Fetch a remote catalog during install | Independent asset releases | Adds network, trust bootstrap, retries, and availability failures | No remote authority exists and installation must remain local and deterministic |
| Trust catalog metadata without hashing bytes | Simpler implementation | Cannot detect package corruption or integrity-invalid fixtures | Does not satisfy integrity rejection |
| Install nonconflicting recommended assets after one collision | Some partial value | Produces mixed release and manifest state | Recommended installation must have deterministic no-change refusal |
| Replace every differing destination | Easy upgrades | Can destroy local changes | Only exact prior manifest digest proof authorizes replacement |
| Extend Doctor with official asset checks | One setup command | Changes an accepted 24-check vocabulary and creates alternate RPIV authority | Conflicts with the accepted Doctor decision |

## Consequences

### Positive
- A clean npm package contains all bytes and integrity expectations needed for offline installation.
- Recommended installation has deterministic all-or-nothing behavior.
- Manifest digests permit safe upgrades of unmodified old assets while preserving local edits.
- Official agents remain interfaces to Runner rather than a second control plane.

### Negative
- Official asset releases are coupled to Runner npm releases.
- Batch rollback and strict manifest handling add filesystem complexity.
- A locally edited manifest cannot prove safe replacement, so ambiguity refuses installation.

### Neutral
- Remote catalogs, signatures, and force or diff options remain future decisions.
- Doctor readiness meaning and canonical RPIV metadata remain unchanged.

## Related Issues

- [#7](https://github.com/jsburckhardt/soft-factory-runner/issues/7)

## References

- [Soft Factory Runner PRD](../../../PRD.md)
- [TypeScript and Node.js CLI](ADR-260810-typescript-node-cli.md)
- [Repository Doctor Readiness Architecture](ADR-260812-repository-doctor-readiness.md)
- [Official Asset Installation Contract](../core-components/CORE-COMPONENT-260812-official-asset-installation-contract.md)
