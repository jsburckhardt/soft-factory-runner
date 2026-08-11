# Action Plan: Phase 2: Prove completion with reconciled evidence

## Feature
- **ID:** 4
- **Research Brief:** `project/work-items/4-phase-2-prove-completion-with-reconciled-evidence/research/00-research.md`

## ADRs Created
- `ADR-260811-prototype-two-completion-proof` — replaces the Prototype 1 completion deferral with bounded result/Git/GitHub finalization while retaining Prototype 3 stop and recovery deferrals.

## Core-Components Created
- `CORE-COMPONENT-260811-completion-evidence-reconciliation` — defines the reusable result schema, required proof sets, reconciliation conjunction, persistence ordering, compatibility, classifications, and fixture contract.

## Acceptance Criteria
- **AC-1:** RPIV produces a versioned result artifact containing issue, outcome, branch, head SHA, pull request, acceptance results, validations, and completion time.
- **AC-2:** Runner records atomic versioned snapshots and append-only structured transition events.
- **AC-3:** Runner exposes explicit completed, failed, blocked, cancelled, and interrupted terminal states.
- **AC-4:** Completion requires matching local HEAD, remote branch, open pull request, expected base, head and SHA, verified acceptance criteria, and passed validations.
- **AC-5:** A zero Copilot exit status without a valid result artifact cannot produce completed.
- **AC-6:** A mismatched issue, branch, SHA, pull request, acceptance result, or validation cannot produce completed.
- **AC-7:** Deterministic fixtures prove both successful reconciliation and each false-completion rejection path.

## Acceptance Coverage
| AC | Implementation tasks | Tests / validation | Expected evidence |
|---|---|---|---|
| AC-1 | T-1, T-3, T-5 | V-1, V-6, V-7 | Strict `AgentResultV1` parser tests; owned-worktree artifact fixture; documented schema; green direct and harness boundaries |
| AC-2 | T-1, T-3, T-4, T-5 | V-2, V-3, V-7 | Snapshot v2/event JSONL assertions, event-before-snapshot failure traces, valid v1 load and unknown-version rejection |
| AC-3 | T-1, T-3, T-5 | V-2, V-6, V-7 | Compile-time state union plus persisted and human/JSON fixtures for all five terminal states |
| AC-4 | T-2, T-3, T-4, T-5 | V-3, V-5, V-6, V-7 | Completed fixture containing every passed comparison and matching live-boundary Git/PR parsed facts |
| AC-5 | T-2, T-3, T-4, T-5 | V-1, V-4, V-6, V-7 | Zero-exit missing/malformed/unsupported artifact cases end interrupted and never completed |
| AC-6 | T-2, T-3, T-4, T-5 | V-4, V-5, V-6, V-7 | Parameterized mismatch matrix ends failed/not completed with stable reason codes |
| AC-7 | T-4, T-5 | V-3, V-4, V-5, V-7 | Deterministic operation traces and one case per success, invalid artifact, mismatch, and incomplete-proof path |

Coverage proof: AC-1 through AC-7 each map to at least one implementation task, deterministic test or validation, and concrete inspectable evidence. No criterion is uncovered.

## Implementation Tasks
1. **T-1 — Define result, snapshot v2, required-proof, and terminal contracts** (AC-1, AC-2, AC-3): extend `src/domain.ts`, issue-criteria extraction, strict result parsing, `src/persistence.ts`, and typed errors; preserve v1 reads and change transition persistence to event-before-snapshot.
2. **T-2 — Implement pure completion reconciliation and classification** (AC-4, AC-5, AC-6): add a deterministic finalizer that checks every owned expectation and returns stable completed/failed/blocked/cancelled/interrupted decisions without external commands.
3. **T-3 — Integrate owned result and fresh Git/GitHub evidence** (AC-1, AC-2, AC-3, AC-4, AC-5, AC-6): extend ports/live adapters and `runWorker` to persist `finalizing`, collect bounded proof, persist normalized evidence, and render terminal outcomes.
4. **T-4 — Build deterministic success and false-completion fixtures** (AC-2, AC-4, AC-5, AC-6, AC-7): extend unit/integration fixtures for successful completion, every mismatch, incomplete evidence, schema compatibility, and persistence failures.
5. **T-5 — Update application documentation and validate both command boundaries** (AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7): update `README.md`, replace the stale Phase 1 completion sections in `docs/phase-1-issue-run.md` (or rename/add a Phase 2 guide with links), update `src/documentation.test.ts`, then run direct root recipes and delegating harness checks. AC-2 and AC-7 are also documented and validated by the final full gates.
