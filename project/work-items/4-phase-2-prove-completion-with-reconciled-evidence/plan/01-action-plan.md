# Action Plan: Phase 2: Prove completion with reconciled evidence

## Feature
- **ID:** 4
- **Research Brief:** `project/work-items/4-phase-2-prove-completion-with-reconciled-evidence/research/00-research.md`
- **Correction Basis:** Verification of `feat/4-prove-completion` at `002b0f8f5bb6604038cf5aa6160cd36727c70a4e` found that completion read a cached remote-tracking ref. Preserve the passing AC-1, AC-2, AC-3, and AC-5 contracts and correct AC-4, AC-6, AC-7, and the operator claim.

## ADRs Created
- None in this correction. `ADR-260811-prototype-two-completion-proof` remains governing and already requires fresh remote Git evidence through the completion-reconciliation core-component.

## Core-Components Created
- No new core-component. `CORE-COMPONENT-260811-completion-evidence-reconciliation` is updated to define the authoritative remote query, classifications, and cache-divergence fixture contract. Decision Log record 63 registers the change.

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
| AC-1 | T-1, T-3, T-5 | V-1, V-6, V-7 | Preserved strict `AgentResultV1` parser and owned-worktree fixtures; documented schema; green direct and harness boundaries |
| AC-2 | T-1, T-3, T-4, T-5 | V-2, V-3, V-7 | Preserved snapshot v2/event JSONL assertions, failure traces, compatibility evidence, and full gates |
| AC-3 | T-1, T-3, T-5 | V-2, V-6, V-7 | Preserved typed state union and persisted human/JSON fixtures for all five terminals |
| AC-4 | T-2, T-3, T-4, T-5, T-6, T-7, T-8 | V-3, V-5, V-6, V-7, V-8 | Exact bounded `ls-remote --refs` invocation; strict output/classification cases; completed fixture using authoritative evidence; stale-cache divergence rejected |
| AC-5 | T-2, T-3, T-4, T-5 | V-1, V-4, V-6, V-7 | Preserved zero-exit missing/malformed/unsupported artifact cases ending interrupted, never completed |
| AC-6 | T-2, T-3, T-4, T-5, T-6, T-7, T-8 | V-4, V-5, V-6, V-7, V-8 | Preserved mismatch matrix plus valid fresh-remote divergence ending failed with `RESULT_REMOTE_SHA_MISMATCH`; no stale cache can prove completion |
| AC-7 | T-4, T-5, T-7, T-8 | V-3, V-4, V-5, V-7, V-8 | Preserved success/rejection fixtures plus deterministic actual-remote-versus-stale-tracking-cache proof and full validation output |

Coverage proof: AC-1 through AC-7 each map to implementation work, deterministic tests or validation, and inspectable evidence. Correction-specific AC-4, AC-6, and AC-7 coverage proves the evidence source, malformed/missing behavior, and stale-cache divergence before artifacts are written.

## Implementation Tasks
1. **T-1 — Define result, snapshot v2, required-proof, and terminal contracts** (Complete; AC-1, AC-2, AC-3): preserve the verified schema, persistence, compatibility, and terminal contracts.
2. **T-2 — Implement pure completion reconciliation and classification** (Complete; AC-4, AC-5, AC-6): preserve the full conjunction and stable mismatch codes.
3. **T-3 — Integrate owned result and Git/GitHub evidence** (Complete except corrected by T-6; AC-1, AC-2, AC-3, AC-4, AC-5, AC-6): retain orchestration and replace only the non-authoritative remote evidence source.
4. **T-4 — Build deterministic success and false-completion fixtures** (Complete except corrected by T-7; AC-2, AC-4, AC-5, AC-6, AC-7): preserve all passing fixtures and add the missing cache-divergence path.
5. **T-5 — Update application documentation and validate command boundaries** (Complete except corrected by T-8; AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7): preserve correct documentation and validation contracts while correcting the unsupported freshness claim.
6. **T-6 — Replace cached issue-branch proof with authoritative remote observation** (Pending; AC-4, AC-6): keep readiness `trackingSha` unchanged, but make completion `remoteBranchSha` execute once after RPIV exit as `git ls-remote --refs <selected-remote> refs/heads/<issue-branch>` from the repository root, with an argument array, no shell, and a 15-second bound. Accept exactly one full-SHA/exact-ref record. Return missing proof for zero records; classify nonzero exit, timeout, malformed/truncated/duplicate/wrong-ref output as `COMPLETION_PROOF_INCOMPLETE`/`interrupted`; classify a valid differing SHA as `RESULT_REMOTE_SHA_MISMATCH`/`failed`.
7. **T-7 — Prove authoritative remote parsing and stale-cache divergence** (Pending; depends on T-6; AC-4, AC-6, AC-7): add deterministic adapter cases for exact invocation and every incomplete classification, then use temporary repositories to leave `refs/remotes/<remote>/<branch>` at SHA A while the actual remote advances to SHA B. Prove the live adapter returns B and normal reconciliation rejects result/local/cache SHA A as failed and never completed.
8. **T-8 — Correct operator guidance and revalidate the repository boundaries** (Pending; depends on T-6 and T-7; AC-4, AC-6, AC-7): amend README/operator-guide text and documentation assertions to name the authoritative query and classifications, remove any implication that a tracking ref is fresh evidence, update implementation evidence, and run focused/full direct and harness-delegated checks plus `git diff --check` without changing root command authority.
