# Task Breakdown: Issue #19

Tasks are dependency-ordered. Every task carries explicit acceptance, test, evidence, and architecture obligations.

## Task T-1: Model and snapshot the authoritative final validation

- **Status:** Complete
- **Complexity:** High
- **Dependencies:** None
- **Acceptance Criteria:** AC-3, AC-4, AC-10, AC-11, AC-17
- **Related ADRs:** ADR-260812-rpiv-integration-completion-contract; ADR-260811-prototype-two-completion-proof
- **Related Core-Components:** CORE-COMPONENT-260812-rpiv-integration-handoff; CORE-COMPONENT-260811-completion-evidence-reconciliation; CORE-COMPONENT-260810-persistence-recovery; CORE-COMPONENT-260806-project-command-interface

### Description
Extend configuration, domain, readiness, launch binding, and versioned persistence. Implement `rpiv.final_validation` exactly as architected: absent defaults to `just verify`; an explicit value is one argument-free `just <recipe>` declared by the root justfile; empty, malformed, undeclared, shell-shaped, or focused values fail before ownership. Introduce v4 snapshots with one immutable requirement and deterministic v1-v3 normalization.

### Acceptance Criteria
- Configuration parsing and recipe validation occur before lock/lease/state creation.
- New and resumed runs use only the persisted requirement; current configuration cannot alter an active run.
- Supported legacy records use sole `just verify`; malformed/unsupported records remain non-authorizing.
- No Copilot environment key or value enters the snapshot or failure output.

### Test Coverage
- Unit tables for absent/configured/empty/invalid grammar and root-recipe lookup.
- Orchestration traces proving zero ownership writes on invalid configuration.
- Persistence/recovery tests for v1-v4 and mid-run configuration changes.

### Expected Evidence
- Config parser assertions and operation traces.
- Serialized v4 snapshots showing one requirement.
- Legacy normalization and unchanged active/recovered snapshot diffs.

## Task T-2: Expose the versioned integration instructions command

- **Status:** Complete
- **Complexity:** Medium
- **Dependencies:** T-1
- **Acceptance Criteria:** AC-1, AC-2, AC-11, AC-13, AC-17
- **Related ADRs:** ADR-260812-rpiv-integration-completion-contract
- **Related Core-Components:** CORE-COMPONENT-260812-rpiv-integration-handoff; CORE-COMPONENT-260810-structured-events; CORE-COMPONENT-260810-error-handling

### Description
Add strict `instructions [--json]` parsing, `IntegrationContractV1`, shared human/JSON rendering, current new-run effective validation facts, all path/schema/atomicity/phase/result/legacy/failure rules, and cumulative help. Keep the command read-only and repository-scoped.

### Acceptance Criteria
- Human and JSON output encode the same complete facts and schema version.
- Repeated unchanged calls are equivalent; unsupported forms retain `CLI_INVALID` exit 2.
- Missing/empty/malformed/stale/mismatch/conflict classifications and legacy behavior are documented by executable facts.
- Output excludes configured Copilot environment names and values.

### Test Coverage
- Parser/dispatch/render equivalence and deterministic repetition tests.
- Golden fact assertions for every contract section and progress/result classification.
- Invalid config and unsupported syntax negative controls.

### Expected Evidence
- Parsed JSON `IntegrationContractV1` plus matching human assertions.
- Repeated-output comparison and exit/stderr captures.
- Mutation-spy proof of zero locks/state/resources.

## Task T-3: Implement atomic RPIV progress publication and observation

- **Status:** Complete
- **Complexity:** High
- **Dependencies:** T-1
- **Acceptance Criteria:** AC-7, AC-12, AC-13, AC-15, AC-16, AC-17
- **Related ADRs:** ADR-260812-rpiv-integration-completion-contract; ADR-260811-prototype-three-recovery-concurrency
- **Related Core-Components:** CORE-COMPONENT-260812-rpiv-integration-handoff; CORE-COMPONENT-260811-run-reconciliation-control; CORE-COMPONENT-260810-persistence-recovery; CORE-COMPONENT-260810-issue-worktree-locking

### Description
Add strict `RpivStatusV1`, injected phase-publication helper, typed file port, last-accepted progress facts, and deterministic classification for missing, empty, malformed, incomplete, unsupported, mismatched, stale, regressed, repeated, conflicting, late, and valid progress. Use same-directory synced atomic replacement.

### Acceptance Criteria
- Coordinator publishes Research, Plan, Implement, Verify starts and terminal/failure outcomes with monotonic identity-bound facts.
- Readers see only a prior or new complete document under competing writes.
- Progress never changes immutable results, completion reconciliation, activity, ownership, process, recovery, or cleanup authorization.
- Late/regressed/conflicting/repeated facts preserve prior accepted progress and result decisions.

### Test Coverage
- Pure schema/transition/freshness/classification tables.
- Fault-injected write steps, simultaneous reader/writer, and competing producer tests.
- Recovery/control safe-action invariance tests with every progress class.

### Expected Evidence
- Complete phase sequence and classification matrices.
- Atomic read samples with no parseable partials or mixed identity.
- Before/after reconciliation snapshots showing unchanged result and safe actions.

## Task T-4: Render separately observed RPIV phase in status and list

- **Status:** Complete
- **Complexity:** Medium
- **Dependencies:** T-3
- **Acceptance Criteria:** AC-8, AC-12, AC-13, AC-17
- **Related ADRs:** ADR-260811-prototype-three-recovery-concurrency
- **Related Core-Components:** CORE-COMPONENT-260812-rpiv-integration-handoff; CORE-COMPONENT-260811-run-reconciliation-control; CORE-COMPONENT-260810-structured-events

### Description
Extend reconciliation/status/list types and renderers with a non-authorizing progress observation, phase, classification, and last-accepted facts while preserving operational state including `running_rpiv`. Update list inventory composition and schema versions deliberately.

### Acceptance Criteria
- Human and JSON status/list expose equivalent phase and classification facts.
- Absent or unusable progress renders phase `unknown`; operational state is never translated into a phase.
- Progress differences do not alter decision code, activity, safe actions, completion, or cleanup eligibility.

### Test Coverage
- Status/list render parity for every phase and unknown.
- Running/terminal operational-state cross-product with absent/invalid/late progress.
- Numerically sorted list and reconciliation regression tests.

### Expected Evidence
- Human/JSON captures for status and list.
- Cross-product expected-result table proving operational-state preservation.
- Safe-action and cleanup traces unchanged by progress.

## Task T-5: Publish and validate immutable AgentResultV1 at the RPIV boundary

- **Status:** Complete
- **Complexity:** High
- **Dependencies:** T-1,T-3
- **Acceptance Criteria:** AC-4, AC-5, AC-6, AC-12, AC-14, AC-15, AC-16, AC-17
- **Related ADRs:** ADR-260812-rpiv-integration-completion-contract; ADR-260811-prototype-two-completion-proof
- **Related Core-Components:** CORE-COMPONENT-260812-rpiv-integration-handoff; CORE-COMPONENT-260811-completion-evidence-reconciliation; CORE-COMPONENT-260806-rpiv-stage-contract; CORE-COMPONENT-260810-error-handling

### Description
Extend strict AgentResultV1 with `requiredFinalValidation` command/status/evidence binding, keep supplementary validations diagnostic-only, add no-clobber atomic publication and local validation helpers, inject exact run binding, and update coordinator/Verifier contracts. Verify publishes only after acceptance, snapshotted validation, push, and PR creation; coordinator validates before zero exit.

### Acceptance Criteria
- Result identity covers issue, branch, final head, PR, outcome, AC evidence, final validation evidence, and completion time.
- Focused evidence pass/fail/absent never changes completion comparisons.
- Publication never replaces an existing destination; valid identical publication is idempotent and all failures are nonzero/redacted.
- Coordinator local validation precedes zero exit; Runner still owns post-exit Git/GitHub completion reconciliation.

### Test Coverage
- Strict parser and mismatch table for every required field and binding.
- Focused evidence four-way metamorphic completion test.
- Verifier ordering and coordinator exit tests using deterministic agent-contract fixtures.
- No-clobber/fault/concurrency publication tests.

### Expected Evidence
- AgentResultV1 examples and parser error-code matrix.
- Operation trace: PR creation -> publication -> coordinator validation -> zero exit.
- Destination hashes proving unchanged valid result after every failure.

## Task T-6: Align canonical and packaged integration guidance

- **Status:** Complete
- **Complexity:** Medium
- **Dependencies:** T-2,T-5
- **Acceptance Criteria:** AC-1, AC-5, AC-6, AC-7, AC-9, AC-11, AC-17
- **Related ADRs:** ADR-260812-rpiv-integration-completion-contract; ADR-260812-official-asset-distribution-installation
- **Related Core-Components:** CORE-COMPONENT-260812-rpiv-integration-handoff; CORE-COMPONENT-260806-rpiv-stage-contract; CORE-COMPONENT-260812-official-asset-installation-contract

### Description
Update canonical RPIV coordinator and Verifier assets, packaged Operator/Assessor/Skill, official contract assertions/catalog digests as required, and integration guidance. Direct RPIV to `soft-factory instructions`; preserve Operator, Assessor, and Skill delegation to Runner without a competing control path.

### Acceptance Criteria
- RPIV coordinator/Verifier carry exact progress, publication, validation, timing, and failure duties.
- Official assets direct contract discovery to Runner and retain all existing delegation/prohibitions.
- Packaged catalog integrity and install transaction behavior remain valid.
- No agent is instructed to mutate Runner snapshots or infer completion.

### Test Coverage
- Canonical agent contract phrase/order tests.
- Official asset delegation, digest, package, clean-install, and repeated-install regressions.
- Negative scans for competing worktree/state/process/completion paths.

### Expected Evidence
- Agent-contract assertion report.
- Package tarball/catalog digest evidence.
- Installed asset byte checks and no-bypass scan.

## Task T-7: Document configuration, schemas, operations, compatibility, and safety

- **Status:** Complete
- **Complexity:** Medium
- **Dependencies:** T-2,T-4,T-5,T-6
- **Acceptance Criteria:** AC-1, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15, AC-16, AC-17
- **Related ADRs:** ADR-260812-rpiv-integration-completion-contract; ADR-260811-prototype-three-recovery-concurrency
- **Related Core-Components:** CORE-COMPONENT-260812-rpiv-integration-handoff; CORE-COMPONENT-260811-completion-evidence-reconciliation; CORE-COMPONENT-260811-run-reconciliation-control

### Description
Update README, docs index, issue-run and recovery guides, plus an integration-contract guide if useful. Cover exact command grammar, configuration and examples, v4 migration, legacy behavior, progress/result schemas and paths, terminal semantics, status/list output, atomicity, redaction, troubleshooting, local deployment boundaries, and no network API impact.

### Acceptance Criteria
- Documentation matches executable schemas, classifications, ordering, exits, defaults, and migration behavior.
- Root justfile remains command authority and focused validation is described only as an implementation aid.
- README and official guidance expose `instructions`; API/deployment/no-migration impacts are explicit.
- Documentation contains no Copilot environment names or values sourced from configuration.

### Test Coverage
- Documentation assertions for all required phrases, examples, command help, and links.
- Schema examples parsed through production parsers.
- Stale two-validation guidance and secret-sentinel scans.

### Expected Evidence
- Passing documentation test report and link/path inventory.
- Parsed example fixtures.
- Search evidence showing old completion conjunction removed from active guidance.

## Task T-8: Run integrated positive and negative verification matrices

- **Status:** Complete
- **Complexity:** High
- **Dependencies:** T-1,T-2,T-3,T-4,T-5,T-6,T-7
- **Acceptance Criteria:** AC-17, AC-18, AC-19
- **Related ADRs:** ADR-260812-rpiv-integration-completion-contract; ADR-260811-prototype-three-recovery-concurrency
- **Related Core-Components:** CORE-COMPONENT-260812-rpiv-integration-handoff; CORE-COMPONENT-260811-completion-evidence-reconciliation; CORE-COMPONENT-260811-run-reconciliation-control; CORE-COMPONENT-260810-development-standards

### Description
Compose repository-local fixtures spanning configuration, launch/recovery, phase publication, immutable result publication, coordinator validation, status/list, reconciliation, official assets, redaction, and write faults. Run focused checks during implementation and finish with authoritative root `just verify`.

### Acceptance Criteria
- Positive matrix covers default/custom validation, config changes, focused evidence forms, full phase sequence, PR-before-result, coordinator-before-zero, status/list, and instructions equivalence.
- Negative matrix covers every legacy, missing, empty, malformed, incomplete, stale, mismatch, conflict, unsupported, write, repeat, late, and concurrent class with unchanged ownership evidence.
- No fixture requires credentials, network, live services, or secrets.
- `just verify` passes with at least 80% global coverage and inspectable output.

### Test Coverage
- End-to-end deterministic fixture matrix and fault injection.
- Sentinel redaction scans across all durable/rendered surfaces.
- Root `just verify` including lint, format, types, tests, coverage, build, and diff check.

### Expected Evidence
- Named positive/negative matrix report with exits, outputs, artifacts, and traces.
- Coverage summary and redaction scan.
- Complete `just verify` transcript and exit 0.
