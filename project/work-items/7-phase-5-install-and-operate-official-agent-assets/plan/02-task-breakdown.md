# Task Breakdown: Phase 5: Install and operate official agent assets

## Task T-1: Package the official catalog and governed agent assets

- **Status:** Completed
- **Complexity:** High
- **Dependencies:** None
- **Acceptance Criteria:** AC-1, AC-2, AC-4, AC-5, AC-6, AC-8
- **Related ADRs:** ADR-260812-official-asset-distribution-installation, ADR-260810-typescript-node-cli, ADR-260812-repository-doctor-readiness
- **Related Core-Components:** CORE-COMPONENT-260812-official-asset-installation-contract, CORE-COMPONENT-260812-repository-doctor-contract, CORE-COMPONENT-260810-development-standards

### Description
Add package-owned Operator, Assessor, and skill source bytes under `assets/official/`; a closed typed catalog with stable identities, fixed destinations, package-version asset versions, protocol 1, and SHA-256 digests; and an explicit npm package file allowlist. Write the Operator and Assessor contracts so their permitted reasoning cannot claim Runner-owned operational authority. Resolve source paths in both `tsx` development and compiled npm execution without network access.

### Acceptance Criteria
- AC-1: Catalog entries map all three assets to the exact PRD `.agents/` destinations.
- AC-2: Every entry exposes version, protocol, destination, and digest metadata for manifest recording.
- AC-4: Catalog validation rejects unsupported protocol and packaged-byte digest mismatch before writes.
- AC-5: Operator content delegates explicit issue execution and all current lifecycle operations to Runner.
- AC-6: Assessor content names complete `soft-factory doctor --json` output as authoritative readiness.
- AC-8: Both agent assets explicitly prohibit direct invariant bypass and expose machine-checkable contracts.

### Test Coverage
- Implement V-1 package/catalog inspection, V-7 Operator contract checks, and V-8 Assessor plus Doctor-authority checks.
- Assert `npm pack --dry-run --json` includes every catalog source and excludes repository-only runtime state.
- Assert catalog uniqueness, fixed destinations, package-version equality, protocol 1, and actual SHA-256 equality.

### Expected Evidence
- Tracked official asset files and typed catalog diff.
- Passing V-1, V-7, and V-8 Jest assertions with catalog and contract snapshots.
- npm dry-run file listing proving published availability of all three source files.

## Task T-2: Implement strict manifest planning and transactional installation

- **Status:** Completed
- **Complexity:** High
- **Dependencies:** T-1
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-7
- **Related ADRs:** ADR-260812-official-asset-distribution-installation
- **Related Core-Components:** CORE-COMPONENT-260812-official-asset-installation-contract, CORE-COMPONENT-260810-error-handling, CORE-COMPONENT-260810-development-standards

### Description
Create strict manifest-v1 parsing and deterministic serialization plus an `AssetInstallationService` that validates catalog bytes and protocol, reads all selected targets, and produces a complete plan before mutation. Classify absent, desired-match, manifest-proved prior version, and unsafe local collision states. Apply staged same-volume writes with exact backups, atomic target replacement, manifest-last commit, rollback, and cleanup through typed filesystem and asset-source ports. Preserve unrelated `.agents/` content and stable catalog ordering.

### Acceptance Criteria
- AC-1: A clean plan and commit create the three fixed asset targets under `.agents/`.
- AC-2: Recommended selection is one batch and writes strict ordered manifest metadata for all three assets.
- AC-3: Desired matches are no-op outcomes; differing targets require exact prior manifest digest proof or refuse without changes.
- AC-4: Protocol, integrity, manifest, path, and rollback ambiguity produce typed actionable non-success outcomes.
- AC-7: Clean, repeat, local modification, incompatibility, and recommended inputs return deterministic plans, traces, and bytes.

### Test Coverage
- Implement V-2 through V-5 with temporary repositories and injectable asset/filesystem faults.
- Cover clean install, repeat with write tripwires, adoption of identical unmanaged bytes, safe upgrade from manifest-proved prior digest, modified target refusal, malformed manifest refusal, protocol mismatch, digest mismatch, failure at each commit step, exact rollback, and uncertain rollback.
- Compare pre/post recursive file hashes and operation traces; run each declared fixture twice.

### Expected Evidence
- Unit tests for strict manifest parse/serialize and pure installation planning.
- Integration traces proving complete preflight precedes mutation and manifest replacement occurs last.
- Hash inventories proving idempotency, zero changes on refusal, exact rollback, and unrelated file preservation.

## Task T-3: Integrate install commands and actionable rendering

- **Status:** Completed
- **Complexity:** Medium
- **Dependencies:** T-2
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4
- **Related ADRs:** ADR-260812-official-asset-distribution-installation, ADR-260810-typescript-node-cli
- **Related Core-Components:** CORE-COMPONENT-260812-official-asset-installation-contract, CORE-COMPONENT-260810-error-handling, CORE-COMPONENT-260810-structured-events

### Description
Extend `Command`, `parseCommand`, cumulative help, `runCli`, and live composition for exactly `install agent soft-factory`, `install agent soft-factory-assessor`, `install skill soft-factory`, and `install --recommended`. Add stable installer error codes and exits plus structured batch outcomes rendered for humans. Retain strict rejection of unknown names/options and preserve all existing Doctor and lifecycle dispatch behavior.

### Acceptance Criteria
- AC-1: Each individual command installs only its selected official asset at the fixed destination.
- AC-2: Recommended dispatch selects all three and reports version/protocol metadata recorded in manifest v1.
- AC-3: Repeat output is stable and local collision output states that no files changed.
- AC-4: Incompatible and integrity-invalid selections return nonzero stable codes, safe context, and direct remediation.

### Test Coverage
- Implement V-6 parser, dispatch, rendering, exit, and existing-command regression tests.
- Exercise the built CLI against temporary local fixture repositories without network services.
- Assert actionable human output and machine-readable typed error rendering contain no raw file content or secrets.

### Expected Evidence
- Passing command grammar table for every valid and invalid install form.
- Built-process stdout, stderr, and exit snapshots for installed, up-to-date, collision, incompatible, and integrity-invalid outcomes.
- Existing Doctor and lifecycle CLI suites remain green.

## Task T-4: Add deterministic installation and agent-contract verification

- **Status:** Completed
- **Complexity:** High
- **Dependencies:** T-1, T-2, T-3
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8
- **Related ADRs:** ADR-260812-official-asset-distribution-installation, ADR-260812-repository-doctor-readiness
- **Related Core-Components:** CORE-COMPONENT-260812-official-asset-installation-contract, CORE-COMPONENT-260812-repository-doctor-contract, CORE-COMPONENT-260810-development-standards

### Description
Add tracked installation scenario manifests for clean, repeated, modified-local, incompatible, integrity-invalid, and recommended cases. Build one deterministic fixture driver through normal application composition, with operation capture and fault injection only in test adapters. Add static semantic contract checks over the packaged agent bytes and a Doctor regression proving its exact 24 IDs, result meaning, and canonical RPIV path are unchanged.

### Acceptance Criteria
- AC-1 and AC-2: Fixture declarations and actual output prove exact installed set, paths, and metadata.
- AC-3 and AC-4: Fixture declarations prove idempotent/no-change/refusal classifications and actionable errors.
- AC-5 and AC-6: Agent checks prove required Runner and Doctor delegations.
- AC-7: Every required scenario runs twice with identical normalized result, operation trace, and filesystem inventory.
- AC-8: Contract checks fail on removal of required delegation or addition of forbidden bypass language; Doctor stays unchanged.

### Test Coverage
- Implement and centralize V-1 through V-8 in Jest suites and tracked `fixtures/install/` scenario manifests.
- Verify fixtures are complete, uniquely named, stable ordered, immutable during runs, local-only, and independent of ambient `.agents/` content.
- Keep global statements, branches, functions, and lines at or above 80 percent.

### Expected Evidence
- Machine-checked scenario matrix mapping every fixture to expected code, asset status, write trace, and final hashes.
- Mutation-tripwire tests for forbidden agent authority and every install write phase.
- Passing Doctor exact-vocabulary regression and coverage report at or above policy.

## Task T-5: Document installation, metadata, safety, and operations

- **Status:** Completed
- **Complexity:** Medium
- **Dependencies:** T-3, T-4
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6
- **Related ADRs:** ADR-260812-official-asset-distribution-installation, ADR-260812-repository-doctor-readiness
- **Related Core-Components:** CORE-COMPONENT-260812-official-asset-installation-contract, CORE-COMPONENT-260806-project-command-interface, CORE-COMPONENT-260811-engineering-harness-interface, CORE-COMPONENT-260806-rpiv-stage-contract

### Description
Update README, docs index, cumulative CLI help assertions, and a Phase 5 installation operations guide. Document individual and recommended commands, exact layout, manifest schema, package/version/protocol relationship, integrity source, all-or-nothing behavior, idempotency, collision and rollback remediation, agent authority boundaries, unchanged Doctor authority, npm packaging, and the short-lived local/no-network-service deployment boundary.

### Acceptance Criteria
- AC-1 and AC-2: Usage and schema documentation show exact assets, destinations, recommended set, version, protocol, and digest fields.
- AC-3 and AC-4: Operations guidance explains no-op, safe upgrade proof, local collision, integrity/protocol rejection, no-change guarantee, and remediation.
- AC-5 and AC-6: Documentation states Operator delegation and authoritative Doctor JSON semantics without creating new control paths.

### Test Coverage
- Extend documentation assertions to require all commands, paths, metadata fields, safety semantics, error categories, authority boundaries, and root validation recipes.
- Run V-9 through `just verify-focused` during implementation and `just verify` before handoff; optionally inspect harness delegates only after direct root recipes.

### Expected Evidence
- Documentation diff with working root `just run` examples and no unsupported network/API/deployment claim.
- Passing documentation tests and help smoke test.
- Complete `just verify-focused` and `just verify` logs covering AC-1 through AC-8.
