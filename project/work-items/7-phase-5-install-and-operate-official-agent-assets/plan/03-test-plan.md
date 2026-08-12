# Test Plan: Phase 5: Install and operate official agent assets

## Test V-1: Catalog integrity and npm package contents

- **Type:** Unit and package inspection
- **Task:** T-1, T-4
- **Acceptance Criteria:** AC-1, AC-2, AC-4
- **Priority:** Critical

### Setup
Build Runner, load the compiled official catalog, and obtain `npm pack --dry-run --json` output from the repository without publishing or network access.

### Steps
1. Assert exactly the Operator, Assessor, and skill identities exist once in stable order.
2. Assert fixed source and `.agents/` destination paths, package-version asset versions, and protocol 1.
3. Hash every packaged source and compare lowercase SHA-256 with the compiled catalog.
4. Assert the npm file list includes `dist/` and every official source and excludes runtime state.

### Expected Result
The closed catalog and npm tarball contain all and only the intended installable sources; metadata is complete and every digest matches.

### Expected Evidence
Catalog assertion output, three digest comparisons, and saved normalized npm dry-run file list.

## Test V-2: Clean and recommended installation

- **Type:** Service and built-CLI integration
- **Task:** T-2, T-3, T-4
- **Acceptance Criteria:** AC-1, AC-2, AC-7
- **Priority:** Critical

### Setup
Create an empty temporary target repository containing one unrelated `.agents/skills/local/SKILL.md` tripwire. Load the clean and recommended tracked fixture declarations.

### Steps
1. Run the recommended command through application composition and then through the built CLI.
2. Enumerate files, bytes, modes, structured result, operation trace, and manifest JSON.
3. Compare all facts with the declared fixture and verify the unrelated tripwire is unchanged.
4. Repeat from an identical fresh setup and compare normalized outputs and final hashes.

### Expected Result
Exactly three official targets and manifest v1 are created; every entry records type, name, version, protocol, destination, and digest in catalog order; both runs are identical.

### Expected Evidence
Fixture matrix row, CLI exit 0 output, manifest snapshot, operation trace with manifest last, and recursive hash inventory.

## Test V-3: Repeated installation and identical-byte adoption

- **Type:** Deterministic integration
- **Task:** T-2, T-3, T-4
- **Acceptance Criteria:** AC-3, AC-7
- **Priority:** Critical

### Setup
Use one repository produced by V-2 and a second repository with desired asset bytes already present but no matching manifest entries. Enable write tripwires after setup.

### Steps
1. Re-run recommended install on the fully installed repository twice.
2. Install each matching unmanaged target and record permitted manifest adoption.
3. Compare target inode metadata or write-port calls, asset bytes, manifest bytes after convergence, result statuses, and operation traces.

### Expected Result
Installed desired bytes are never rewritten; repeated converged runs are stable up-to-date no-ops; matching unmanaged bytes can be recorded without replacing target content.

### Expected Evidence
Zero asset-write trace, before/after target hashes, stable up-to-date result snapshots, and converged manifest snapshot.

## Test V-4: Local modification refusal, safe upgrade, and rollback

- **Type:** Safety and fault-injection integration
- **Task:** T-2, T-4
- **Acceptance Criteria:** AC-3, AC-7
- **Priority:** Critical

### Setup
Create variants with one target modified after installation, one old target still matching its recorded manifest digest, and fault-injection points at every staged commit and rollback operation.

### Steps
1. Run recommended install against the locally modified variant and hash the complete tree before and after.
2. Run an upgrade catalog against the manifest-proved unmodified old target.
3. Inject each commit failure, verify exact restoration, and separately inject restoration uncertainty.
4. Repeat every variant and compare normalized result and operation traces.

### Expected Result
A local modification refuses the entire batch with no changed byte; an exact prior digest permits upgrade; commit failure restores all prior bytes; uncertain rollback returns typed non-success and remediation.

### Expected Evidence
Complete pre/post hashes, zero-write collision trace, safe-upgrade manifest transition, rollback traces, stable error codes, and repeated fixture equality.

## Test V-5: Compatibility, integrity, and manifest rejection

- **Type:** Negative service and CLI integration
- **Task:** T-1, T-2, T-3, T-4
- **Acceptance Criteria:** AC-4, AC-7
- **Priority:** Critical

### Setup
Create controlled catalogs or source ports with protocol mismatch and SHA-256 mismatch plus manifests with unsupported schema, malformed JSON, duplicate identities, unsafe destinations, and contradictory digest ownership.

### Steps
1. Execute each selected batch with operation capture enabled.
2. Assert validation finishes before the first mutation operation.
3. Check stable code, nonzero exit, safe path context, and direct remediation for each variant.
4. Compare complete filesystem hashes and rerun each case for determinism.

### Expected Result
Every incompatible, integrity-invalid, or ambiguous manifest case refuses before mutation with a stable actionable outcome; no target or manifest changes.

### Expected Evidence
Negative-case table of code, exit, remediation, zero-write trace, unchanged hashes, and repeat equality.

## Test V-6: Strict CLI grammar, dispatch, rendering, and regressions

- **Type:** Unit and built-process CLI
- **Task:** T-3, T-4
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4
- **Priority:** High

### Setup
Build the CLI and prepare temporary clean, installed, collision, incompatible, and integrity-invalid fixture repositories.

### Steps
1. Parse and dispatch every supported individual and recommended install form.
2. Reject unknown asset types, names, options, missing values, and mixed recommended arguments.
3. Capture built-process stdout, stderr, and exit status for each fixture.
4. Run existing Doctor and lifecycle command grammar and rendering suites unchanged.

### Expected Result
Only documented grammar is accepted; dispatch selects the correct batch; success, no-op, and actionable failure meanings are stable; all prior commands retain behavior.

### Expected Evidence
Grammar table, built-process snapshots, stable typed error JSON or human rendering assertions, and existing CLI regression results.

## Test V-7: Operator delegates all Runner operations

- **Type:** Official agent contract check
- **Task:** T-1, T-4
- **Acceptance Criteria:** AC-5, AC-8
- **Priority:** Critical

### Setup
Load the exact packaged Operator Agent bytes through the official catalog rather than a test-only copy.

### Steps
1. Assert explicit issue execution maps to `soft-factory run --issue <number>` and never issue selection.
2. Assert the current `doctor`, `list`, `status`, `attach`, `logs`, `reconcile`, `resume`, `stop`, and `clean` command allowlist is complete.
3. Assert explicit prohibitions cover manual worktrees, locks, state writes, process control, cleanup, completion inference, and invariant override.
4. Use mutation cases that remove one required delegation or prohibition and prove the checker fails.

### Expected Result
The Operator acts only through Runner for lifecycle operations and cannot document a competing implementation or operational path.

### Expected Evidence
Passing command/prohibition matrix and failing mutation-case identifiers tied to the packaged digest.

## Test V-8: Assessor readiness authority and Doctor invariance

- **Type:** Official agent and architecture regression check
- **Task:** T-1, T-4
- **Acceptance Criteria:** AC-6, AC-8
- **Priority:** Critical

### Setup
Load the packaged Assessor Agent, canonical `.github/agents/rpiv.agent.md`, Doctor constants, and ready/blocked Doctor fixtures.

### Steps
1. Assert the Assessor invokes exactly `soft-factory doctor --json` for authoritative readiness.
2. Assert it consumes the complete result, preserves `ready`, and limits reasoning to explanation and remediation.
3. Assert it prohibits independent READY inference, issue assessment, and bypass of failed or incomplete Doctor output.
4. Assert Doctor still emits exactly the same ordered 24 IDs and reads only the canonical RPIV path, not `.agents/manifest.json` or installed official assets.
5. Mutate each required authority or prohibition assertion and prove contract failure.

### Expected Result
The Assessor cannot replace Doctor readiness, neither agent bypasses Runner invariants, and installation does not change canonical Doctor semantics.

### Expected Evidence
Assessor authority matrix, mutation failures, exact 24-ID snapshot, and adapter/path tripwires proving no `.agents/` Doctor fallback.

## Test V-9: Root validation and acceptance evidence reconciliation

- **Type:** Full repository validation
- **Task:** T-4, T-5
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8
- **Priority:** Critical

### Setup
Complete implementation and documentation with no live GitHub, remote catalog, credentials, daemon, or network service required. Keep the root `justfile` unchanged as validation authority unless a necessary recipe change is made there first.

### Steps
1. Run targeted install, packaging, contract, Doctor regression, CLI, and documentation suites through `just verify-focused`.
2. Run `just verify` for lint, formatting, strict type checking, all Jest coverage, build, and diff checks.
3. Reconcile each AC ID against V-1 through V-8 evidence and record paths/results in implementation handoff.
4. If harness checks are used, run them only as delegates after direct root recipes and retain their structured envelopes separately.

### Expected Result
Both root recipes pass, coverage stays at or above 80 percent, docs match implementation, no network runtime dependency is introduced, and every AC has reproducible evidence.

### Expected Evidence
Successful root recipe logs, coverage summary, clean `git diff --check`, built CLI/package inspection, documentation assertions, and AC-1 through AC-8 evidence table.
