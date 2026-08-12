# Test Plan: Issue #19

All tests are repository-local and deterministic. Root `justfile` recipes remain authoritative; no live credentials or services are required.

## Test V-1: Instructions command parity and syntax

- **Type:** CLI/unit
- **Task:** T-2
- **Acceptance Criteria:** AC-1, AC-2, AC-11, AC-13, AC-17
- **Priority:** Critical

### Setup
Use fixed configuration/root-justfile fixtures and mutation spies.

### Steps
Invoke human and JSON instructions twice; compare normalized facts; try extra args/options and invalid configuration.

### Expected Result
One IntegrationContractV1 drives equivalent deterministic output; invalid forms use CLI_INVALID/2; no ownership mutation occurs.

### Expected Evidence
Human/JSON captures, equality assertion, exit/stderr table, zero-mutation trace.

## Test V-2: Final-validation grammar and snapshot lifecycle

- **Type:** Unit/integration
- **Task:** T-1
- **Acceptance Criteria:** AC-3, AC-10, AC-11, AC-17
- **Priority:** Critical

### Setup
Fixture root justfiles with default, custom, missing, focused, and malformed recipe configurations.

### Steps
Parse every value class; start/recover runs; change configuration after snapshot; start a later run.

### Expected Result
Exactly one valid command is snapshotted pre-ownership; active/recovered requirements remain fixed; later run uses current valid value.

### Expected Evidence
Parser matrix, operation trace, serialized snapshots, before/after requirement comparison.

## Test V-3: Focused validation is completion-neutral

- **Type:** Unit/metamorphic
- **Task:** T-5
- **Acceptance Criteria:** AC-4, AC-14, AC-18
- **Priority:** Critical

### Setup
One valid completion input bound to the snapshotted final validation.

### Steps
Repeat reconciliation with focused validation absent, passed, failed, and unrelated supplementary entries.

### Expected Result
All completion decisions and required comparisons are identical.

### Expected Evidence
Four normalized reconciliation objects and equality assertion.

## Test V-4: Strict result publication and coordinator gate

- **Type:** Agent-contract/integration
- **Task:** T-5
- **Acceptance Criteria:** AC-5, AC-6, AC-14, AC-16, AC-18
- **Priority:** Critical

### Setup
Fake Verify/PR and Runner helper adapters with owned run binding and fault injection.

### Steps
Exercise every schema/identity/evidence mismatch, PR ordering, publish faults, existing destination, local validator, and coordinator exit.

### Expected Result
Only post-PR valid result is atomically installed; coordinator zero follows validation; failures preserve destination and exit nonzero.

### Expected Evidence
Ordered trace, error-code table, destination hashes, coordinator exits.

## Test V-5: RPIV progress transition and classification matrix

- **Type:** Unit/property
- **Task:** T-3
- **Acceptance Criteria:** AC-7, AC-12, AC-13
- **Priority:** Critical

### Setup
Fixed run/attempt clock and prior accepted progress for each phase.

### Steps
Generate valid progression plus missing, zero-byte, malformed, incomplete, unsupported, stale, mismatched, regressed, repeated, conflicting, and late artifacts.

### Expected Result
Every input has the documented stable classification; only valid forward progress updates the accepted fact.

### Expected Evidence
Complete input/classification/accepted-fact matrix.

## Test V-6: Status/list phase and safety separation

- **Type:** CLI/integration
- **Task:** T-4
- **Acceptance Criteria:** AC-8, AC-12, AC-13, AC-17
- **Priority:** High

### Setup
Snapshots across operational states with each progress observation class.

### Steps
Invoke status/list human and JSON; compare phase, state, report, activity, safe actions, and cleanup eligibility.

### Expected Result
Phase is separately observed; unusable progress is unknown; operational and authorization facts remain unchanged.

### Expected Evidence
Cross-product captures and safe-action equality report.

## Test V-7: Atomic progress and result concurrency

- **Type:** Filesystem/concurrency
- **Task:** T-3,T-5
- **Acceptance Criteria:** AC-6, AC-7, AC-15
- **Priority:** Critical

### Setup
Temporary same-volume directory, deterministic barriers, simultaneous readers/writers, and failure hooks.

### Steps
Interrupt each publication step and race progress writers, result publishers, and readers.

### Expected Result
Readers see prior/new complete progress; immutable result has one no-clobber winner; no partial/mixed identity or overwritten valid result appears.

### Expected Evidence
Read corpus, winner count, hashes, temporary cleanup inventory.

## Test V-8: Persistence compatibility and recovery boundaries

- **Type:** Persistence/integration
- **Task:** T-1,T-4
- **Acceptance Criteria:** AC-10, AC-11, AC-12, AC-14
- **Priority:** Critical

### Setup
Valid v1-v4, malformed, unsupported, event-ahead, and changed-config fixtures.

### Steps
Load/reconcile/resume each fixture and inspect normalized requirement, completion, progress, and safe actions.

### Expected Result
Supported legacy uses sole just verify without later config; malformed/unsupported fails safe; progress cannot authorize recovery.

### Expected Evidence
Migration table, reconciliation codes, zero-unauthorized-action traces.

## Test V-9: Redaction and ownership sentinel scan

- **Type:** Security regression
- **Task:** T-1,T-2,T-3,T-4,T-5,T-7
- **Acceptance Criteria:** AC-16, AC-18
- **Priority:** Critical

### Setup
Configure unique Copilot environment name/value sentinels and run all positive/error paths.

### Steps
Scan instructions, progress, result, status/list, errors, snapshots, events, launch facts, logs, and docs outputs.

### Expected Result
Neither configured names nor values appear; ownership identity remains issue/run/branch bound.

### Expected Evidence
Zero-match scan and identity comparison report.

## Test V-10: Canonical and official asset delegation

- **Type:** Contract/package
- **Task:** T-6
- **Acceptance Criteria:** AC-9, AC-18
- **Priority:** High

### Setup
Canonical `.github` agents, packaged official bytes, catalog, and temporary install target.

### Steps
Assert discovery/delegation phrases, prohibit bypasses, inspect package, install/reinstall, and verify digests.

### Expected Result
RPIV uses instructions and handoff helpers; Operator/Assessor/Skill remain delegated; package/install integrity passes.

### Expected Evidence
Contract assertion output, tarball listing, digest and install traces.

## Test V-11: Repository-local integration matrix

- **Type:** End-to-end fixture
- **Task:** T-8
- **Acceptance Criteria:** AC-17, AC-18
- **Priority:** Critical

### Setup
Credential-free temporary repositories and fake GitHub/tmux/Copilot/process adapters.

### Steps
Run default/custom, active/recovered config change, focused forms, Research-to-terminal, PR/publication/validator, status/list, and all negative controls.

### Expected Result
Every required positive and negative scenario yields the expected exit, output, artifact, and unchanged-ownership facts.

### Expected Evidence
Named scenario matrix with operation traces and artifact snapshots.

## Test V-12: Authoritative repository verification

- **Type:** Full quality gate
- **Task:** T-8
- **Acceptance Criteria:** AC-19
- **Priority:** Critical

### Setup
Completed implementation, clean feature worktree, root justfile unchanged as authority.

### Steps
Run `just verify` and retain lint, format, type, test, coverage, build, and diff-check output.

### Expected Result
Command exits 0 and global statements/branches/functions/lines remain at least 80%. 

### Expected Evidence
Full command transcript, exit 0, coverage summary, clean diff check.
