# Test Plan: Phase 2 Completion Proof

## Test V-1: Strict result artifact contract

- **Type:** Unit / schema
- **Task:** T-1, T-3
- **Acceptance Criteria:** AC-1, AC-5
- **Priority:** Critical

### Setup
Create in-memory owned-worktree files for one valid `AgentResultV1` and variants missing each required field, malformed, unsupported-versioned, duplicate, invalid-SHA, invalid-time, and empty-evidence data.

### Steps
1. Parse each artifact through the production parser and owned path resolution.
2. Assert the valid artifact preserves issue, outcome, branch, SHA, PR, acceptance, validations, and completion time.
3. Run zero-exit finalization against every invalid or absent artifact.

### Expected Result
The valid artifact is typed; every invalid/absent artifact is rejected and zero exit ends interrupted, never completed.

### Expected Evidence
Focused Jest case names, parser error codes, and terminal snapshots for missing/malformed/version-invalid artifacts.

## Test V-2: Versioned persistence and explicit terminals

- **Type:** Unit / persistence
- **Task:** T-1, T-3, T-4
- **Acceptance Criteria:** AC-2, AC-3
- **Priority:** Critical

### Setup
Use recording and disk file ports with v1/v2 snapshots, all five terminal states, append failure, and atomic-write failure injection.

### Steps
1. Load valid v1 and v2 snapshots and reject unknown schemas.
2. Persist transitions and assert event append precedes snapshot replacement.
3. Inject each write failure and inspect retained files.
4. Render completed, failed, blocked, cancelled, and interrupted through human and JSON status.

### Expected Result
Snapshots/events are versioned; history is append-only; no append failure creates an unhistoried completed snapshot; all five terminals are explicit and consistently rendered.

### Expected Evidence
Serialized run/event files, ordered operation traces, failure assertions, and terminal rendering snapshots.

## Test V-3: Successful full reconciliation

- **Type:** Deterministic end-to-end fixture
- **Task:** T-2, T-3, T-4
- **Acceptance Criteria:** AC-2, AC-4, AC-7
- **Priority:** Critical

### Setup
Compose recording adapters with a zero Copilot exit, valid succeeded artifact, persisted Issue #4 criteria, matching local/remote SHA, complete open PR closing issue #4 with expected base/head/SHA, verified AC-1..AC-7 evidence, and passed required recipes.

### Steps
1. Run worker finalization through normal application composition.
2. Capture operation trace, transition events, v2 snapshot, and status output.
3. Re-run the pure reconciler with identical facts.

### Expected Result
Runner enters finalizing then completed exactly once; every comparison is true; output is deterministic; snapshot and event evidence agree.

### Expected Evidence
Golden operation trace, completed snapshot/reconciliation object, JSONL transitions, and matching human/JSON status.

## Test V-4: False-completion rejection matrix

- **Type:** Parameterized unit / orchestration fixture
- **Task:** T-2, T-3, T-4
- **Acceptance Criteria:** AC-5, AC-6, AC-7
- **Priority:** Critical

### Setup
Clone the successful fixture and independently alter: absent/invalid artifact; issue; branch; result/local/remote SHA; PR number/state/base/head/SHA/closing issue; AC missing/duplicate/unverified/empty evidence; validation missing/duplicate/failed; valid failed/blocked/cancelled/interrupted outcomes.

### Steps
1. Execute each isolated case after Copilot exit zero.
2. Assert terminal state and stable reason.
3. Assert no case persists or renders completed.

### Expected Result
Missing/malformed/incomplete proof is interrupted; contradictory or failed proof is failed; valid named non-success outcomes map explicitly; none completes.

### Expected Evidence
A named table row for every false-completion path with expected state/code and a global `state !== completed` assertion.

## Test V-5: Live Git and GitHub proof boundaries

- **Type:** Integration / adapter contract
- **Task:** T-3, T-4
- **Acceptance Criteria:** AC-4, AC-6, AC-7
- **Priority:** High

### Setup
Use temporary Git repositories/remotes and fake credential-free `gh` executables returning complete and malformed PR-by-number JSON.

### Steps
1. Observe worktree HEAD and remote branch SHA after a fixture push.
2. Parse a matching open PR and each missing/malformed/mismatched required field.
3. Assert executable/argument arrays, 15-second bounds, redacted failures, and explicit absent facts.

### Expected Result
Only complete matching fresh facts can feed completion; malformed, missing, closed, or mismatched facts reject deterministically without shell interpolation.

### Expected Evidence
Temporary-Git SHA assertions, captured `git`/`gh` argument arrays, and fake-CLI rejection test output.

## Test V-6: Documentation and public status contract

- **Type:** Documentation / CLI contract
- **Task:** T-3, T-5
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7
- **Priority:** High

### Setup
Update README, operator guide, troubleshooting, examples, and documentation assertions for Phase 2.

### Steps
1. Run `src/documentation.test.ts`.
2. Inspect documented artifact fields, persistence, terminal states, completion conjunction, rejection rules, fixture matrix, and remaining deferrals.
3. Compare human and JSON status examples against application rendering.

### Expected Result
Application documentation covers AC-1 through AC-7 accurately, contains no active stale Phase 1 completion deferral, and public status examples match code.

### Expected Evidence
Passing documentation tests and reviewed diffs for `README.md` and the issue-run guide.

## Test V-7: Direct and harness validation boundaries

- **Type:** Repository quality gate
- **Task:** T-4, T-5
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7
- **Priority:** Critical

### Setup
Install project dependencies and use the ambient configured harness; keep root `justfile` recipes unchanged as raw command authority.

### Steps
1. Run `just verify-focused` during implementation.
2. Run `harness checks --focused --json` and retain its delegating envelope.
3. Run `just verify` before handoff.
4. Run `harness checks --json` and retain its delegating envelope.
5. Confirm coverage is at least 80% for statements, branches, functions, and lines and run `git diff --check`.

### Expected Result
Both direct root-recipe and harness-delegated focused/full boundaries pass; all AC-1..AC-7 tests and quality checks are green.

### Expected Evidence
Four successful command results/envelopes, Jest coverage summary, build/type/lint/format results, and clean diff-check output recorded in `implementation/00-implementation.md`.
