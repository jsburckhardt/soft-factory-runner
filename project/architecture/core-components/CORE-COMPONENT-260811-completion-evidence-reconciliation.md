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
- Require `just verify-focused` and `just verify` exactly once with status `passed`; permit additional uniquely named validations but never use them to replace either required root recipe.
- After Copilot exits zero, persist `finalizing` before reading completion evidence. A nonzero exit transitions directly to `failed` regardless of any artifact.
- Require result issue and branch to equal the owned run; result SHA to equal worktree HEAD; the selected remote branch to exist at that same SHA; and result pull-request number to identify one complete, open PR that closes the issue and has the expected base, head branch, and head SHA.
- Derive expected base from the persisted fetched-base proof and selected remote from that proof. Observe worktree HEAD and remote branch after RPIV exits; observe the PR by reported number with all required fields in one bounded query.
- Bound each finalization Git/GitHub command to 15 seconds. Do not poll or retry inside one finalization attempt; timeout, malformed output, missing branch/PR, truncation, or incomplete fields are incomplete proof.
- Transition to `completed` only when the valid succeeded result and every equality, acceptance, and validation check pass. Persist the validated result and normalized reconciliation facts used by the decision.
- Classify missing/malformed/unsupported result data or incomplete external proof as `interrupted`; classify valid unsuccessful outcomes by their outcome; classify contradictory identity, SHA, PR, acceptance, or validation facts as `failed`; retain pre-execution prerequisite and ownership conflicts as `blocked`.
- Expose `completed`, `failed`, `blocked`, `cancelled`, and `interrupted` as terminal states in typed snapshots plus human and JSON status. Reserve Runner-originated `cancelled` transitions for future explicit cancellation input.
- Write schema-versioned transition events append-only before atomically replacing the schema-versioned snapshot. If event append fails, leave the prior snapshot; if snapshot replacement fails, preserve the appended event for later reconciliation and never report completion from the failed operation.
- Read valid snapshot versions 1 and 2, reject unknown versions, and upgrade a legacy version 1 run only through an explicit version 2 transition. A legacy snapshot has no required-evidence set and is never completion proof.
- Keep result parsing and reconciliation policy in deterministic domain code; isolate filesystem, Git, and GitHub observations behind typed adapters using validated argument arrays and redacted bounded results.

### Interfaces
- `AgentResultV1` contains `schemaVersion: 1`, positive `issueNumber` and `prNumber`, `outcome`, `branch`, full `headSha`, `acceptanceCriteria[]` entries (`id`, `status`, nonempty `evidence[]`), `validations[]` entries (`command`, `status`), and ISO-8601 `completedAt`.
- `RequiredAcceptanceCriterionV1` contains the stable `id` and exact issue criterion `text`; `RequiredValidationV1` identifies each required root recipe.
- `CompletionGitFacts` contains fresh `localHeadSha`, `remote`, `remoteBranch`, and `remoteHeadSha`; absence remains explicit rather than synthesized.
- `CompletionPullRequestFacts` contains `number`, `state`, `baseBranch`, `headBranch`, `headSha`, `closesIssues`, and `complete`.
- `CompletionReconciliationV1` records each expected/observed comparison and its pass/fail result without credentials or raw command output.
- `RunSnapshotV2` stores required sets, finalization/result/reconciliation facts, all existing ownership and launch facts, terminal state, error, and update time.

### Expectations
- The same pure reconciliation input always yields the same terminal decision and mismatch code.
- No absent, stale, malformed, contradictory, or producer-controlled evidence can satisfy completion.
- Deterministic fixtures cover one completed path and separate rejections for missing/invalid artifacts, issue, branch, local/remote SHA, PR number/state/base/head/SHA/issue linkage, AC proof, validation proof, and incomplete observations.
- Human and JSON status report the same terminal state and safe reconciliation summary.

## Rationale

Completion is a security-like proof boundary: the producer's claim must be checked against Runner-owned expectations and independently observed systems. Strict schemas, complete conjunctions, bounded adapters, and fail-safe classifications make false success unrepresentable while preserving the existing layered TypeScript architecture.

## Usage Examples

```
Copilot exit 0 + valid succeeded result + local HEAD == remote branch SHA == PR head SHA
+ open PR closes issue and matches base/head + every required AC verified
+ just verify-focused passed + just verify passed -> completed

Copilot exit 0 + missing result -> interrupted
valid result + mismatched branch, SHA, PR, AC, or validation -> failed
```

## Integration Guidelines

- Capture required AC text during issue readiness and carry it into version 2 snapshots before RPIV launch.
- Add dedicated result-file, completion-Git, and completion-PR port methods rather than parsing terminal prose in orchestration.
- Use stable mismatch/error codes and include only redacted expected/observed facts in snapshots, events, and output.
- Update README and the issue-run operator guide to document the artifact schema, finalization flow, terminal meanings, troubleshooting, schema compatibility, and remaining Prototype 3 deferrals.
- Validate implementation through both direct `just verify-focused`/`just verify` and delegating `harness checks --focused --json`/`harness checks --json` boundaries.

## Exceptions

- None. Completion requires the full conjunction; unavailable evidence never degrades to success.

## Enforcement

- [x] Automated checks
- [x] Code review checklist
- [x] Test coverage requirements

## Related ADRs

- [ADR-260811-prototype-two-completion-proof](../ADR/ADR-260811-prototype-two-completion-proof.md)
- [ADR-260811-prototype-one-run-orchestration](../ADR/ADR-260811-prototype-one-run-orchestration.md)
- [ADR-260810-typescript-node-cli](../ADR/ADR-260810-typescript-node-cli.md)
