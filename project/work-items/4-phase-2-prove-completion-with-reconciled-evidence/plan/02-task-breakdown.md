# Task Breakdown: Phase 2 Completion Proof

Correction cycle: preserve verified T-1/T-2 and the passing portions of T-3/T-4/T-5. T-6 through T-8 own the failed remote-proof, deterministic-divergence, and documentation boundaries.

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

- **Status:** Complete (corrected by T-6)
- **Complexity:** High
- **Dependencies:** T-1, T-2
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6
- **Related ADRs:** ADR-260811-prototype-two-completion-proof; ADR-260811-prototype-one-run-orchestration
- **Related Core-Components:** CORE-COMPONENT-260811-completion-evidence-reconciliation; CORE-COMPONENT-260811-issue-run-orchestration; CORE-COMPONENT-260810-subprocess-execution; CORE-COMPONENT-260810-structured-events

### Description
Extend `FilePort`, `GitPort`, and `GitHubPort` with owned result reads, fresh worktree HEAD, authoritative remote issue-branch advertisement as corrected by T-6, and complete PR-by-number facts. Implement bounded live Git/`gh` commands with argument arrays, 15-second limits, strict parsing, and redaction. Update `IssueRunService.runWorker` to persist `finalizing` after zero exit, gather facts, reconcile, persist result/comparisons and the terminal event/snapshot, while nonzero exits remain failed. Update `src/index.ts` exit mapping and `src/render.ts` so human/JSON status expose identical terminal and safe proof summaries.

### Acceptance Criteria
- AC-1 artifact is consumed only from the owned worktree.
- AC-2 every finalizing/terminal transition has an append-only event and atomic v2 snapshot.
- AC-3 all five terminals load and render explicitly with noncompleted outcomes nonzero where applicable.
- AC-4 only matching Git/GitHub and complete result proof persists completed; completion remote evidence must use the post-exit authoritative query defined by the governing core-component, never `refs/remotes/...`.
- AC-5 and AC-6 never return a completed CLI/status result for missing, invalid, or contradictory proof.

### Test Coverage
Fixture-test worker traces, path selection, operation ordering, terminal persistence/rendering, nonzero exit precedence, missing artifact, adapter timeout/malformed/missing facts, strict fake-`gh` parsing, and exact Git ref commands.

### Expected Evidence
- Deterministic trace from Copilot exit through `finalizing` to terminal persistence.
- Human/JSON snapshots for completed, failed, blocked, cancelled, and interrupted.
- Adapter tests showing bounded commands and rejection of incomplete facts.

## Task T-4: Prove success and every false-completion path deterministically

- **Status:** Complete (corrected by T-7)
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

- **Status:** Complete (corrected by T-8)
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

## Task T-6: Implement authoritative remote issue-branch observation

- **Status:** Complete
- **Complexity:** Medium
- **Dependencies:** T-1, T-2, T-3
- **Acceptance Criteria:** AC-4, AC-6
- **Related ADRs:** ADR-260811-prototype-two-completion-proof; ADR-260810-typescript-node-cli
- **Related Core-Components:** CORE-COMPONENT-260811-completion-evidence-reconciliation; CORE-COMPONENT-260810-subprocess-execution; CORE-COMPONENT-260810-error-handling

### Description
Preserve readiness `trackingSha`, local-HEAD observation, PR observation, orchestration, persistence, and reconciliation. Correct only the completion remote source: `GitPort.remoteBranchSha` must make one post-Copilot-exit authoritative query from the repository root using executable `git`, arguments `["ls-remote", "--refs", selectedRemote, "refs/heads/<issue-branch>"]`, `shell: false`, and timeout `15_000`. It must not read `refs/remotes/...`, perform an implicit fetch, poll, or retry. Strictly accept one `<full-sha><whitespace><exact-ref>` record. A successful zero-record response is missing proof; nonzero exit, timeout, malformed/truncated output, duplicate rows, or wrong refs are malformed/incomplete proof and become `interrupted` with `COMPLETION_PROOF_INCOMPLETE`. A single valid advertised SHA that differs from result/local/PR evidence proceeds to reconciliation and becomes `failed` with `RESULT_REMOTE_SHA_MISMATCH`.

### Acceptance Criteria
- AC-4 is met only when the selected issue branch is observed from the remote itself after RPIV exits and that SHA matches the full completion conjunction.
- AC-6 is met because a stale matching tracking ref is not read and a valid differing authoritative SHA cannot produce completed.

### Test Coverage
Add adapter-focused tests that capture the executable, exact argument array, repository-root cwd, no-shell execution, and 15-second bound. Cover one valid exact row, zero rows, command failure, timeout, malformed/full-SHA failures, truncation, duplicate rows, and wrong-ref output. Assert incomplete cases persist `interrupted`/`COMPLETION_PROOF_INCOMPLETE`, while valid SHA divergence reaches `failed`/`RESULT_REMOTE_SHA_MISMATCH`.

### Expected Evidence
- Source diff showing `remoteBranchSha` uses only `ls-remote --refs` while readiness `trackingSha` remains cache-based for its separate purpose.
- Captured adapter command request and named parser/classification test rows.
- Terminal snapshots/events proving no incomplete or divergent case persists `COMPLETION_PROVED`.

## Task T-7: Add deterministic stale-cache divergence proof

- **Status:** Complete
- **Complexity:** Medium
- **Dependencies:** T-6
- **Acceptance Criteria:** AC-4, AC-6, AC-7
- **Related ADRs:** ADR-260811-prototype-two-completion-proof
- **Related Core-Components:** CORE-COMPONENT-260811-completion-evidence-reconciliation; CORE-COMPONENT-260811-issue-run-orchestration; CORE-COMPONENT-260810-development-standards

### Description
Extend integration fixtures through normal application composition. Create a temporary bare remote and subject repository at issue-branch SHA A, fetch so the subject has `refs/remotes/<remote>/<branch>` at A, then advance the actual remote branch to SHA B from a second working repository without fetching the subject. Assert the local tracking ref remains A, call the production live `remoteBranchSha`, and assert it observes B. Feed result/local/PR SHA A plus observed remote SHA B through normal finalization or the production reconciler and require `failed` with `RESULT_REMOTE_SHA_MISMATCH`, never `completed`. Also retain a matching authoritative-remote success fixture so the correction does not make completion impossible.

### Acceptance Criteria
- AC-4 is met by a success fixture whose remote equality comes from the actual remote advertisement.
- AC-6 is met by proving cached SHA A cannot override authoritative remote SHA B.
- AC-7 is met by a deterministic named fixture that distinguishes cache state from remote state and rejects the divergence.

### Test Coverage
Run the temporary-Git divergence fixture, matching authoritative success fixture, and orchestration terminal assertions repeatedly without network credentials or a production test switch. Assert the subject tracking ref remains stale throughout and verify the final reconciliation code and event/snapshot state.

### Expected Evidence
- Fixture trace containing cache SHA A, actual remote SHA B, live-adapter observed SHA B, and `RESULT_REMOTE_SHA_MISMATCH`.
- Failed/not-completed snapshot plus JSONL terminal event, with no `COMPLETION_PROVED` event.
- Green focused integration/orchestration output and maintained coverage thresholds.

## Task T-8: Correct documentation and validate correction boundaries

- **Status:** Complete
- **Complexity:** Low
- **Dependencies:** T-6, T-7
- **Acceptance Criteria:** AC-4, AC-6, AC-7
- **Related ADRs:** ADR-260811-prototype-two-completion-proof; ADR-260811-engineering-harness-surface
- **Related Core-Components:** CORE-COMPONENT-260811-completion-evidence-reconciliation; CORE-COMPONENT-260806-project-command-interface; CORE-COMPONENT-260811-engineering-harness-interface

### Description
Correct `README.md`, `docs/phase-1-issue-run.md`, and `src/documentation.test.ts` so “fresh remote branch” explicitly means one post-exit bounded `git ls-remote --refs` query and never a remote-tracking cache. Document missing/malformed/timeout as interrupted incomplete proof and valid remote-SHA divergence as failed mismatch. Update `implementation/00-implementation.md` with correction evidence. Preserve all previously passing AC-1, AC-2, AC-3, and AC-5 behavior and keep root `justfile` recipes authoritative.

### Acceptance Criteria
- AC-4 documentation names the authoritative remote source and complete matching requirement accurately.
- AC-6 documentation states that stale-cache/remote divergence rejects completion with the stable mismatch classification.
- AC-7 documentation and evidence identify the deterministic divergence fixture.

### Test Coverage
Update documentation assertions to require `git ls-remote --refs`, prohibit completion use of `refs/remotes/`, and require the divergence classification. Run the correction suites, `just verify-focused`, `harness checks --focused --json`, `just verify`, `harness checks --json`, and `git diff --check`.

### Expected Evidence
- Reviewed README/operator-guide/documentation-test diff with no unsupported freshness claim.
- Passing documentation and cache-divergence test names.
- Successful direct and harness-delegated focused/full outputs, coverage at or above 80%, and clean diff check.
