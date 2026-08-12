# Action Plan: Phase 5: Install and operate official agent assets

## Feature
- **ID:** 7
- **Research Brief:** `project/work-items/7-phase-5-install-and-operate-official-agent-assets/research/00-research.md`

## ADRs Created
- [`ADR-260812-official-asset-distribution-installation`](../../../architecture/ADR/ADR-260812-official-asset-distribution-installation.md) — package-local catalog and integrity trust, release/protocol metadata, all-or-nothing mutation, collision policy, agent authority, and unchanged Doctor semantics.

## Core-Components Created
- [`CORE-COMPONENT-260812-official-asset-installation-contract`](../../../architecture/core-components/CORE-COMPONENT-260812-official-asset-installation-contract.md) — reusable catalog, manifest, transaction, output, fixture, and official-agent behavioral contract.

## Acceptance Criteria
- **AC-1:** Runner installs the Operator Agent, Assessor Agent, and Soft Factory Skill under .agents/.
- **AC-2:** soft-factory install --recommended installs the complete recommended set and records version and protocol metadata.
- **AC-3:** Reinstalling identical assets is idempotent, while locally modified assets are not silently overwritten.
- **AC-4:** Incompatible or integrity-invalid assets are rejected with actionable output.
- **AC-5:** The Operator Agent delegates explicit issue execution and lifecycle operations to Runner.
- **AC-6:** The Assessor Agent treats soft-factory doctor --json as the authoritative readiness result.
- **AC-7:** Clean, repeated, modified-local, incompatible, and recommended installation fixtures produce deterministic outcomes.
- **AC-8:** Agent contract checks prove neither official agent bypasses Runner invariants.

## Acceptance Coverage

| AC | Implementation tasks | Tests or validation | Expected evidence |
|---|---|---|---|
| AC-1 | T-1, T-2, T-3 | V-1, V-2, V-6, V-9 | Three fixed `.agents/` paths in a clean fixture; catalog and CLI assertions; full gate pass |
| AC-2 | T-1, T-2, T-3 | V-1, V-2, V-6, V-9 | Recommended result lists all assets; strict manifest records version, protocol, destination, and digest |
| AC-3 | T-2, T-3 | V-3, V-4, V-6, V-9 | Before/after hashes prove no repeat rewrite and no changes on local collision; typed remediation |
| AC-4 | T-1, T-2, T-3 | V-5, V-6, V-9 | Protocol and SHA-256 fault cases exit nonzero with stable codes and remediation; zero-write trace |
| AC-5 | T-1 | V-7, V-9 | Operator contract assertions cover explicit run and every supported lifecycle command plus prohibitions |
| AC-6 | T-1 | V-8, V-9 | Assessor contract assertion requires complete Doctor JSON authority and prohibits independent readiness override |
| AC-7 | T-2, T-4 | V-2, V-3, V-4, V-5, V-9 | Tracked scenario fixtures and repeated runs produce identical results, traces, and filesystem snapshots |
| AC-8 | T-1, T-4 | V-7, V-8, V-9 | Machine-checked allowlists, authority statements, bypass prohibitions, and unchanged Doctor vocabulary |

Coverage proof: every AC row names at least one implementation task, one executable test or root validation, and concrete inspectable evidence. The task breakdown and test plan retain these same mappings.

## Implementation Tasks
1. **T-1 — Package the official catalog and governed agent assets** (`AC-1`, `AC-2`, `AC-4`, `AC-5`, `AC-6`, `AC-8`): add three versioned assets, immutable SHA-256 catalog, explicit npm publication allowlist, and machine-checkable authority contracts.
2. **T-2 — Implement strict manifest planning and transactional installation** (`AC-1`, `AC-2`, `AC-3`, `AC-4`, `AC-7`): parse manifest v1, preflight digests/protocol/targets, classify idempotency and local changes, and apply or roll back one batch.
3. **T-3 — Integrate install commands and actionable rendering** (`AC-1`, `AC-2`, `AC-3`, `AC-4`): extend strict grammar, dispatch, typed errors, stable exits, help, and human results without changing existing commands.
4. **T-4 — Add deterministic installation and agent-contract verification** (`AC-1` through `AC-8`): implement tracked fixture manifests, fault-injected filesystem coverage, package inspection, contract checks, and Doctor non-regression.
5. **T-5 — Document installation, metadata, safety, and operations** (`AC-1`, `AC-2`, `AC-3`, `AC-4`, `AC-5`, `AC-6`): update cumulative docs and validate all acceptance evidence through root `justfile` recipes.
