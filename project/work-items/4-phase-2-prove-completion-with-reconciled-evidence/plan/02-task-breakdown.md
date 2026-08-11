# Task Breakdown: Phase 2 Completion Proof

## Task T-1: Define result, persistence, and terminal contracts

- **Status:** Complete
- **Complexity:** High
- **Dependencies:** None
- **Acceptance Criteria:** AC-1, AC-2, AC-3
- **Related ADRs:** ADR-260811-prototype-two-completion-proof; ADR-260810-typescript-node-cli
- **Related Core-Components:** CORE-COMPONENT-260811-completion-evidence-reconciliation; CORE-COMPONENT-260810-persistence-recovery; CORE-COMPONENT-260810-structured-events; CORE-COMPONENT-260810-error-handling

### Description
Extend `src/domain.ts` with strict result/reconciliation facts, required AC text, snapshot v2, `finalizing`, and all five terminal states. Extract ordered criterion text during readiness and persist the immutable required AC and validation sets. Add a strict parser for `<worktree>/.soft-factory/agent-result.json`. Update `src/persistence.ts` to append versioned events before atomic snapshot replacement, load valid v1/v2 snapshots, upgrade only on explicit v2 transitions, and reject unknown schemas. Add stable artifact/proof mismatch codes in `src/errors.ts`.

### Acceptance Criteria
- AC-1 is met by a strict schema-version-1 artifact contract containing every named field.
- AC-2 is met by versioned event-before-atomic-snapshot writes and validated v1/v2 reads.
- AC-3 is met by typed `completed`, `failed`, `blocked`, `cancelled`, and `interrupted` terminals plus `finalizing`.

### Test Coverage
Unit-test valid/invalid/unsupported artifacts, ISO time, SHA, uniqueness, required evidence, ordered criteria extraction, every state, v1 compatibility, v2 round trips, unknown versions, event append failure, and snapshot replacement failure.

### Expected Evidence
- Focused Jest output for parser/domain/persistence tests.
- Serialized v2 snapshot and JSONL event fixtures showing schema versions and ordering.
- Failure traces proving append failure leaves the prior snapshot and legacy v1 never proves completion.

## Task T-2: Implement pure completion reconciliation

- **Status:** Complete
- **Complexity:** High
- **Dependencies:** T-1
- **Acceptance Criteria:** AC-4, AC-5, AC-6
- **Related ADRs:** ADR-260811-prototype-two-completion-proof
- **Related Core-Components:** CORE-COMPONENT-260811-completion-evidence-reconciliation; CORE-COMPONENT-260810-error-handling; CORE-COMPONENT-260810-issue-worktree-locking

### Description
Create a pure domain reconciliation function/service. Compare result issue/branch/SHA/PR to the owned snapshot; local HEAD and selected remote branch SHA; complete open PR number/base/head/SHA/closing-issue facts; every persisted required AC; and required `just verify-focused`/`just verify` validations. Return normalized comparison evidence and stable classifications: complete conjunction only to completed, missing/malformed/incomplete proof to interrupted, contradiction or failed proof to failed, and valid non-success result outcomes to their named terminal.

### Acceptance Criteria
- AC-4 is met only by the full equality and passed-proof conjunction.
- AC-5 is met because zero exit alone and absent/invalid artifacts cannot reach completed.
- AC-6 is met because each named mismatch returns failed/not completed with a specific code.

### Test Coverage
Table-test every comparison independently, duplicate/missing/failed AC and validation entries, incomplete observations, valid non-success outcomes, and a golden successful input. Assert deterministic output and no mutation.

### Expected Evidence
- Reconciliation test matrix with one passing conjunction and one isolated failure per comparison.
- Snapshots/comparison objects showing exact expected/observed facts and stable codes.

## Task T-3: Integrate finalization adapters, orchestration, persistence, and rendering

- **Status:** Complete
- **Complexity:** High
- **Dependencies:** T-1, T-2
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6
- **Related ADRs:** ADR-260811-prototype-two-completion-proof; ADR-260811-prototype-one-run-orchestration
- **Related Core-Components:** CORE-COMPONENT-260811-completion-evidence-reconciliation; CORE-COMPONENT-260811-issue-run-orchestration; CORE-COMPONENT-260810-subprocess-execution; CORE-COMPONENT-260810-structured-events

### Description
Extend `FilePort`, `GitPort`, and `GitHubPort` with owned result reads, fresh worktree HEAD/remote branch SHA, and complete PR-by-number facts. Implement bounded live Git/`gh` commands with argument arrays, 15-second limits, strict parsing, and redaction. Update `IssueRunService.runWorker` to persist `finalizing` after zero exit, gather facts, reconcile, persist result/comparisons and the terminal event/snapshot, while nonzero exits remain failed. Update `src/index.ts` exit mapping and `src/render.ts` so human/JSON status expose identical terminal and safe proof summaries.

### Acceptance Criteria
- AC-1 artifact is consumed only from the owned worktree.
- AC-2 every finalizing/terminal transition has an append-only event and atomic v2 snapshot.
- AC-3 all five terminals load and render explicitly with noncompleted outcomes nonzero where applicable.
- AC-4 only fresh matching Git/GitHub and complete result proof persists completed.
- AC-5 and AC-6 never return a completed CLI/status result for missing, invalid, or contradictory proof.

### Test Coverage
Fixture-test worker traces, path selection, operation ordering, terminal persistence/rendering, nonzero exit precedence, missing artifact, adapter timeout/malformed/missing facts, strict fake-`gh` parsing, and exact Git ref commands.

### Expected Evidence
- Deterministic trace from Copilot exit through `finalizing` to terminal persistence.
- Human/JSON snapshots for completed, failed, blocked, cancelled, and interrupted.
- Adapter tests showing bounded commands and rejection of incomplete facts.

## Task T-4: Prove success and every false-completion path deterministically

- **Status:** Complete
- **Complexity:** High
- **Dependencies:** T-1, T-2, T-3
- **Acceptance Criteria:** AC-2, AC-4, AC-5, AC-6, AC-7
- **Related ADRs:** ADR-260811-prototype-two-completion-proof
- **Related Core-Components:** CORE-COMPONENT-260811-completion-evidence-reconciliation; CORE-COMPONENT-260810-development-standards; CORE-COMPONENT-260811-issue-run-orchestration

### Description
Extend `src/orchestration.test.ts` and `src/integration.test.ts` through normal injected composition. Add one exact successful Issue #4-style reconciliation and separate cases for missing/malformed/version-invalid result; issue; branch; result/local/remote SHA; PR number/open/base/head/SHA/issue linkage; AC missing/duplicate/unverified/evidence; validation missing/duplicate/failed; incomplete observations; and persistence write failures. Keep temporary roots credential-free and assert no production test switch.

### Acceptance Criteria
- AC-2 persistence evidence remains versioned, atomic, append-only, and failure-safe.
- AC-4 successful fixture contains and passes every required comparison.
- AC-5 zero-exit artifact rejection paths are never completed.
- AC-6 every named mismatch is independently rejected.
- AC-7 deterministic fixtures cover success and the complete false-completion matrix.

### Test Coverage
Run focused orchestration/integration suites and inspect coverage for all new branches; maintain at least 80% statements, branches, functions, and lines.

### Expected Evidence
- Named parameterized case list and green Jest output.
- Coverage summary at or above all thresholds.
- Operation traces proving adapters were injected through application composition.

## Task T-5: Update operator documentation and run stage boundaries

- **Status:** Complete
- **Complexity:** Medium
- **Dependencies:** T-3, T-4
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7
- **Related ADRs:** ADR-260811-prototype-two-completion-proof; ADR-260811-engineering-harness-surface
- **Related Core-Components:** CORE-COMPONENT-260811-completion-evidence-reconciliation; CORE-COMPONENT-260806-rpiv-stage-contract; CORE-COMPONENT-260806-project-command-interface; CORE-COMPONENT-260811-engineering-harness-interface

### Description
Update `README.md` and `docs/phase-1-issue-run.md` or add/link a Phase 2 operator guide. Remove stale claims that result artifacts/completed/post-launch PR reconciliation remain deferred. Document artifact path/schema, required AC and root validation sources, finalization observations, five terminals, exit/error behavior, persistence compatibility, troubleshooting, deterministic fixtures, and remaining Prototype 3 deferrals. Update `src/documentation.test.ts`. Record implementation evidence in the work item's `implementation/00-implementation.md`. Validate direct root and harness delegation boundaries without changing root `justfile` command authority.

### Acceptance Criteria
- AC-1 through AC-7 are accurately represented in application documentation and documentation tests.
- Direct recipes remain validation authority; harness checks demonstrably delegate.
- No stale Prototype 1 false-completion statement remains in active documentation.

### Test Coverage
Run documentation tests, focused/full direct validation, focused/full harness checks, and `git diff --check`. Inspect README and operator-guide links and examples.

### Expected Evidence
- Documentation diff and passing `src/documentation.test.ts`.
- JSON envelopes from `harness checks --focused --json` and `harness checks --json`.
- Successful `just verify-focused`, `just verify`, and clean `git diff --check` outputs.
