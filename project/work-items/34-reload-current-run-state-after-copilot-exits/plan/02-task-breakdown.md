# Task Breakdown: Reload Current Run State After Copilot Exits

## Task T-1: Define the typed post-wait decision boundary

- **Status:** Complete
- **Complexity:** Medium
- **Dependencies:** None
- **Acceptance Criteria:** AC-1, AC-4, AC-5, AC-6, AC-9
- **Related ADRs:** ADR-260811-prototype-three-recovery-concurrency
- **Related Core-Components:** CORE-COMPONENT-260810-error-handling; CORE-COMPONENT-260810-persistence-recovery; CORE-COMPONENT-260811-run-reconciliation-control

### Description
Add a stable `POST_WAIT_STATE_REFUSED` error and closed reason vocabulary for missing, invalid, run mismatch, owner mismatch, worker mismatch, RPIV mismatch, and state advanced. Implement a pure classifier that compares complete worker and awaited RPIV identities, not PID alone, and distinguishes exact active handling from exact already-terminal idempotence. Wrap strict post-wait load failures without losing safe cause information.

### Acceptance Criteria
- AC-1 identity fields are compared before any post-wait transition.
- AC-4 and AC-9 failures return stable machine-readable reasons with zero mutation or relaunch.
- AC-5 maps a save-time noncontiguous advance to `state_advanced`.
- AC-6 recognizes an exact terminal snapshot as an existing outcome without requiring a cleared active RPIV field.

### Test Coverage
Unit matrix for all classifier outcomes; CLI JSON and human error rendering; exact compound identity inequality for every field; missing/invalid load conversion.

### Expected Evidence
Focused Jest results and JSON snapshots showing each closed reason, exact exit 3, no secret/raw cause leakage, and zero store/spawn calls after refusal.

## Task T-2: Refactor worker post-wait persistence

- **Status:** Complete
- **Complexity:** High
- **Dependencies:** T-1
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6
- **Related ADRs:** ADR-260811-prototype-three-recovery-concurrency; ADR-260812-rpiv-integration-completion-contract
- **Related Core-Components:** CORE-COMPONENT-260811-run-reconciliation-control; CORE-COMPONENT-260811-completion-evidence-reconciliation; CORE-COMPONENT-260812-rpiv-integration-handoff; CORE-COMPONENT-260810-structured-events

### Description
Capture pre-wait run/owner/worker identity and the spawned process identity, await once, reload with strict history replay, classify, and derive `finalizing` or `failed` only from the reloaded snapshot. Preserve all current fields by spreading current state. Refactor exception scopes so a post-wait load/classification/save refusal is returned directly and cannot enter the stale `copilot-launch-failed` fallback. Preserve `RunStore.save` as the final revision guard. Return an exact terminal snapshot without releasing a lease or appending another event.

### Acceptance Criteria
- AC-1 reload is traceably after wait and before transition.
- AC-2 zero and nonzero paths append contiguous current revisions and observed exit facts.
- AC-3 all accepted evidence fields survive byte-equivalently except required appended run-state facts.
- AC-4/AC-5 refuse without fallback save.
- AC-6 repeated/already-terminal handling is a no-op.

### Test Coverage
Worker service tests for active zero/nonzero, post-wait load errors, every mismatch, terminal no-op, and save race; persistence assertions cover event-before-snapshot order and contiguous revision replay.

### Expected Evidence
Operation traces, before/after snapshots, event ledgers, and launch/save counts proving one launch, one required exit transition, no stale fallback, and preserved evidence.

## Task T-3: Add bounded concurrent regression fixtures

- **Status:** Complete
- **Complexity:** High
- **Dependencies:** T-2
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9
- **Related ADRs:** ADR-260811-prototype-three-recovery-concurrency; ADR-260812-rpiv-integration-completion-contract
- **Related Core-Components:** CORE-COMPONENT-260810-development-standards; CORE-COMPONENT-260811-run-reconciliation-control; CORE-COMPONENT-260811-completion-evidence-reconciliation; CORE-COMPONENT-260812-rpiv-integration-handoff

### Description
Extend the repository-local process fake so spawn returns immediately but `wait` blocks on an explicit deferred gate. While held, publish research, plan, implement, verify, and terminal progress, preserve the immutable strict result, and drive one reconciliation that retains a bounded tmux diagnostic. Release as zero and nonzero in separate bounded cases. Add four exact identity mutation rows and a deterministic hook that advances the snapshot after reload but before save. Snapshot full durable bytes and parsed histories before release and after handling.

### Acceptance Criteria
- AC-7 zero case completes with all five progress transitions, retained diagnostic, one launch, and unchanged result.
- AC-8 nonzero case fails with observed exit while preserving even a pre-existing strict result.
- AC-9 matrix mutates run, owner, worker, and RPIV identities independently, plus one second-advance case.
- AC-1 through AC-6 invariants are asserted in each applicable fixture.

### Test Coverage
V-1 through V-7 in the test plan, including bounded gates with cleanup/finally so failures cannot hang; deep equality for evidence; exact event prior/resulting revisions and unique revision count.

### Expected Evidence
Named Jest cases, bounded completion, one launch count, refusal reason table, immutable result bytes, retained diagnostic equality, and complete ordered revision arrays.

## Task T-4: Update application documentation and release surfaces

- **Status:** Complete
- **Complexity:** Medium
- **Dependencies:** T-1, T-2
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6
- **Related ADRs:** ADR-260811-prototype-three-recovery-concurrency
- **Related Core-Components:** CORE-COMPONENT-260806-rpiv-stage-contract; CORE-COMPONENT-260811-run-reconciliation-control; CORE-COMPONENT-260815-package-semver-governance

### Description
Update README, `docs/phase-1-issue-run.md`, `docs/phase-3-recovery-operations.md`, docs index as needed, and documentation assertions. Explain reload timing, exact identities, closed refusal reasons, terminal idempotence, evidence preservation, and the reload/save race. State that no network API, configuration key/default, snapshot schema, database/data migration, service, container, or deployment procedure changes. Assign PATCH 0.1.2 and synchronize package JSON, both root lock entries, `OFFICIAL_ASSET_VERSION`, package/install fixtures, README/docs release guidance, and generated manifest expectations without changing dependency versions.

### Acceptance Criteria
- Documentation accurately covers AC-1 through AC-6 and operator remediation.
- Release classification is PATCH and every governed version surface is exactly 0.1.2.

### Test Coverage
Documentation tests assert required semantics and reject stale pre-reload claims. Package/asset tests and local pack/install metadata inventory assert 0.1.2 and unchanged dependencies.

### Expected Evidence
Documentation test output, finite version inventory, package dry-run/install metadata, lockfile dependency diff review, and no-impact statements for API/configuration/migration/deployment.

## Task T-5: Validate and record Implement handoff

- **Status:** Complete
- **Complexity:** Medium
- **Dependencies:** T-3, T-4
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9
- **Related ADRs:** ADR-260811-prototype-three-recovery-concurrency; ADR-260812-rpiv-integration-completion-contract
- **Related Core-Components:** CORE-COMPONENT-260806-project-command-interface; CORE-COMPONENT-260806-rpiv-stage-contract; CORE-COMPONENT-260811-engineering-harness-interface; CORE-COMPONENT-260815-package-semver-governance

### Description
Run affected tests through root `just verify-focused`, then root `just verify`. Review the complete branch diff, prove every AC mapping, record documentation and SemVer evidence in implementation notes, drain coordinator/Research/Plan/Implement harness buffers into durable retro records with read-back before clear, and commit using Conventional Commits with the required Copilot trailer.

### Acceptance Criteria
- AC-1 through AC-9 each have concrete implementation and validation evidence.
- Root validation passes, tree is clean, and handoff identifies exact commit SHA.

### Test Coverage
V-8 and V-9 plus the complete root quality gate; no direct raw npm command substitutes for the authoritative stage boundary.

### Expected Evidence
`just verify-focused` and `just verify` transcripts, coverage above 80%, `git diff --check`, plan-scoped retro paths, commit SHA, and clean `git status --short`.
