# CORE-COMPONENT-260811-completion-evidence-reconciliation: Completion Evidence Reconciliation

## Status

Adopted

## Purpose

Prevent false completion by defining one reusable, cross-cutting contract for the RPIV result handoff, finalization evidence, terminal classification, persistence, rendering, and deterministic fixtures.

## Scope

This component applies after RPIV process exit to result-artifact parsing, run snapshots and events, local and remote Git observation, GitHub pull-request observation, acceptance and validation proof, terminal-state selection, CLI/status rendering, and fixture adapters. It does not add restart recovery, resume, stop mechanics, cleanup, merged-PR cleanup, or scheduling.

## Definition

### Rules
- Read the result only from `<owned-worktree>/.soft-factory/agent-result.json`; require strict schema version 1 with no missing required field and reject unsupported versions safely.
- Require `issueNumber`, `outcome`, `branch`, `headSha`, `prNumber`, ordered acceptance results, validation results, and parseable `completedAt`; validate positive numbers, full Git SHA syntax, unique nonempty IDs/commands, supported statuses, and redacted evidence.
- Permit result outcomes `succeeded`, `failed`, `blocked`, `cancelled`, and `interrupted`; only `succeeded` is eligible for completion, while other valid outcomes map to their named terminal state.
- Derive the immutable required acceptance set at readiness by assigning `AC-1` through `AC-n` to the issue's ordered marker-wrapped criteria and persist both each ID and preserved criterion text in snapshot version 2.
- Require every persisted required AC ID exactly once with status `verified` and at least one nonempty evidence reference; reject duplicate, missing, unknown-only, or non-verified required results.
- Require exactly one persisted final-validation command. For new v4, v5, or v6 snapshots use the validated `rpiv.final_validation` value; for supported legacy v1/v2/v3 snapshots normalize to `just verify` without consulting current configuration. Never require or interpret `just verify-focused` as completion proof.
- After Copilot exits zero, reload and identity-check the current durable snapshot under `CORE-COMPONENT-260811-run-reconciliation-control`, then persist `finalizing` from that exact current revision before reading completion evidence. A nonzero exit transitions directly from the exact reloaded revision to `failed` regardless of any artifact. Missing, invalid, mismatched, or concurrently advanced state refuses post-wait handling instead of invoking finalization or writing a fallback failure.
- For recovery only, permit a strict successful result found at the owned immutable path while persisted state remains `running_rpiv` to act as an unaccepted observation candidate after issue, branch, acceptance-set, and final-validation binding checks. Use its head SHA and PR number solely to key one bounded candidate-head local Git, fresh remote, and GitHub query. Do not persist the result or declare completion during observation.
- Require explicit resume plus the run-reconciliation inactive safety conjunction before moving a recovery candidate into `finalizing`. Existing finalization then revalidates and persists evidence through event-before-snapshot ordering. Candidate data never bypasses local, fresh remote, open-PR, acceptance, or final-validation proof and never authorizes cleanup.
- Require result issue and branch to equal the owned run; result SHA to equal worktree HEAD; the selected remote branch to exist at that same SHA; and result pull-request number to identify one complete, open PR that closes the issue and has the expected base, head branch, and head SHA.
- Derive expected base from the persisted fetched-base proof and selected remote from that proof. Observe worktree HEAD after RPIV exits. Define fresh remote issue-branch evidence as the result of one post-exit `git ls-remote --refs <selected-remote> refs/heads/<issue-branch>` invocation from the repository root; never use a local `refs/remotes/...` tracking ref or a pre-finalization fetch as remote completion evidence. Observe the PR by reported number with all required fields in one bounded query.
- Invoke the remote query as the exact executable/argument array `git`, `ls-remote`, `--refs`, selected remote, and exact `refs/heads/<issue-branch>`, with no shell and a 15-second timeout. Accept only one output record containing a full SHA and that exact ref. Do not poll or retry inside one finalization attempt.
- Classify a successful remote query with no record as missing incomplete proof. Classify command failure, timeout, malformed or truncated output, duplicate records, or a different returned ref as malformed incomplete proof. Persist these cases as `interrupted` with `COMPLETION_PROOF_INCOMPLETE`; classify one valid freshly advertised SHA that differs from result/local/PR SHA as contradictory proof and `failed` with `RESULT_REMOTE_SHA_MISMATCH`.
- Bound every other finalization Git/GitHub command to 15 seconds. Do not poll or retry inside one finalization attempt; timeout, malformed output, missing PR, truncation, or incomplete fields are incomplete proof.
- Transition to `completed` only when the valid succeeded result, every equality and acceptance check, and `requiredFinalValidation` command/status/evidence binding to the snapshot pass. Ignore supplementary focused-validation evidence. Persist the validated result and normalized reconciliation facts used by the decision.
- Classify missing/malformed/unsupported result data or incomplete external proof as `interrupted`; classify valid unsuccessful outcomes by their outcome; classify contradictory identity, SHA, PR, acceptance, or validation facts as `failed`; retain pre-execution prerequisite and ownership conflicts as `blocked`.
- Expose `completed`, `failed`, `blocked`, `cancelled`, and `interrupted` as terminal states in typed snapshots plus human and JSON status. Reserve Runner-originated `cancelled` transitions for future explicit cancellation input.
- Write schema-versioned transition events append-only before atomically replacing the schema-versioned snapshot. If event append fails, leave the prior snapshot; if snapshot replacement fails, preserve the appended event for later reconciliation and never report completion from the failed operation.
- Read valid snapshot versions 1 through 6 and reject unknown versions. New runs use v6 while preserving the v4 single required-final-validation contract unchanged. Supported v1/v2/v3 snapshots retain `just verify` as their sole final validation and never read later configuration; ignore persisted focused requirements. A v1 snapshot still requires an explicit migration that proves its missing acceptance set.
- Keep result parsing and reconciliation policy in deterministic domain code; isolate filesystem, Git, and GitHub observations behind typed adapters using validated argument arrays and redacted bounded results.

### Interfaces
- `AgentResultV1` contains `schemaVersion: 1`, positive `issueNumber` and `prNumber`, `outcome`, `branch`, full `headSha`, `acceptanceCriteria[]`, supplementary unique `validations[]`, `requiredFinalValidation` with exact command, `passed` status, and nonempty evidence, plus ISO-8601 `completedAt`.
- `RequiredAcceptanceCriterionV1` contains the stable `id` and exact issue criterion `text`; `RequiredFinalValidationV1` identifies the one snapshotted root recipe.
- `CompletionGitFacts` contains `localHeadSha`, selected `remote`, selected `remoteBranch`, and `remoteHeadSha`; `remoteHeadSha` is populated only from the post-exit authoritative `ls-remote --refs` query, and absence remains explicit rather than synthesized.
- `CompletionPullRequestFacts` contains `number`, `state`, `baseBranch`, `headBranch`, `headSha`, `closesIssues`, and `complete`.
- `CompletionReconciliationV1` records each expected/observed comparison and its pass/fail result without credentials or raw command output.
- `RunSnapshotV6` stores the v5 completion evidence and diagnostic facts unchanged while adding complete `TmuxTargetV2` authority. Legacy schemas remain explicit compatibility inputs and never invent missing selectors.

### Expectations
- The same pure reconciliation input always yields the same terminal decision and mismatch code.
- No absent, stale, malformed, contradictory, or producer-controlled evidence can satisfy completion.
- Accepted progress, result, and retained diagnostic facts present at post-wait reload remain unchanged and ordered through finalization or failure. A matching cached remote-tracking ref is irrelevant when the freshly advertised branch differs.
- Deterministic fixtures create cache/remote divergence by retaining an old local remote-tracking SHA while advancing the bare remote branch, then prove the live adapter observes the advanced SHA and reconciliation rejects the stale result with `RESULT_REMOTE_SHA_MISMATCH`.
- Deterministic fixtures cover one completed path and separate rejections for missing/invalid artifacts, issue, branch, local/remote SHA, PR number/state/base/head/SHA/issue linkage, AC proof, validation proof, and incomplete observations.
- Human and JSON status report the same terminal state and safe reconciliation summary.

## Rationale

Completion is a security-like proof boundary: the producer's claim must be checked against Runner-owned expectations and independently observed systems. Strict schemas, complete conjunctions, bounded adapters, and fail-safe classifications make false success unrepresentable while preserving the existing layered TypeScript architecture.

## Usage Examples

```
Copilot exit 0 + valid succeeded result + local HEAD == post-exit `git ls-remote --refs` branch SHA == PR head SHA
+ open PR closes issue and matches base/head + every required AC verified
+ snapshotted required final validation passed with evidence -> completed

Copilot exit 0 + missing result -> interrupted
valid result + mismatched branch, SHA, PR, AC, or validation -> failed
```

## Integration Guidelines

- Capture required AC text and the one validated final-validation recipe before ownership, persist them in v6, and inject the same binding into RPIV launch instructions.
- Add dedicated result-file, completion-Git, and completion-PR port methods rather than parsing terminal prose in orchestration. Keep readiness `trackingSha` separate from completion `remoteBranchSha`; implement the latter only with the authoritative remote query.
- Test the remote adapter through normal composition with an argument-recording fake Git executable for bounds/parsing and temporary repositories for stale-cache divergence; do not add a production test switch.
- Use stable mismatch/error codes and include only redacted expected/observed facts in snapshots, events, and output.
- Update README and the issue-run operator guide to document the artifact schema, finalization flow, terminal meanings, troubleshooting, schema compatibility, and remaining Prototype 3 deferrals.
- Use `just verify-focused` only for implementation feedback. Validate final completion against the snapshotted recipe and run repository proof through root `just verify`; harness checks remain delegates, not completion evidence.

## Exceptions

- None. Completion requires the full conjunction; unavailable evidence never degrades to success.

## Enforcement

- [x] Automated checks
- [x] Code review checklist
- [x] Test coverage requirements

## Related ADRs

- [ADR-260812-rpiv-integration-completion-contract](../ADR/ADR-260812-rpiv-integration-completion-contract.md)
- [ADR-260811-prototype-two-completion-proof](../ADR/ADR-260811-prototype-two-completion-proof.md)
- [ADR-260811-prototype-one-run-orchestration](../ADR/ADR-260811-prototype-one-run-orchestration.md)
- [ADR-260810-typescript-node-cli](../ADR/ADR-260810-typescript-node-cli.md)
- [ADR-260817-invoking-tmux-context-targeting](../ADR/ADR-260817-invoking-tmux-context-targeting.md)
