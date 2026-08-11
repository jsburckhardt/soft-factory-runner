# Issue run and Phase 2 completion proof

Runner validates and exclusively owns one explicit GitHub issue, creates its branch and worktree from a proven fetched base, launches RPIV visibly through tmux, and independently reconciles completion evidence. Runner controls operational facts; RPIV controls software-engineering decisions.

## Prerequisites and commands

Install Node.js 22+, Git, GitHub CLI (`gh`), tmux, Copilot CLI, `just`, and the ambient engineering harness. Authenticate external tools without placing credentials in configuration, snapshots, events, result artifacts, or output.

Use the root command surface:

```text
just setup
just build
just run --help
just run run --issue <positive-integer> [--json]
just run status <positive-integer> [--json]
just run attach <positive-integer>
```

`internal run-agent` is private. Root `just verify-focused` and `just verify` are the project validation authority. Harness checks delegate to those recipes but are not product completion evidence.

## Configuration and readiness

Runner reads optional `.soft-factory/config.yml`:

```yaml
repository:
  remote: origin
  base_branch: main
branch_types:
  feature: feat
rpiv:
  prompt: "Deliver issue #{issue}"
```

Remote precedence is `repository.remote`, Git `remote.pushDefault`, the current branch remote, then an unambiguous sole remote. `repository.base_branch` must equal the advertised default branch. The default `feature: feat` mapping is available, and exactly one issue label must map to an allowed Conventional Commit type.

Before ownership, the issue must be open, unblocked, conflict-free, and contain exactly one `ACCEPTANCE_CRITERIA_START`/`ACCEPTANCE_CRITERIA_END` block with nonempty checkboxes. Runner assigns ordered IDs `AC-1` through `AC-n` and persists each exact criterion text. GitHub and tmux observations are bounded to 15 seconds; fetch and advertised-HEAD operations are bounded to 30 seconds.

After readiness, Runner exclusively creates `.soft-factory/locks/<issue>.lock`, fetches the selected remote, and persists `FetchedBaseProofV1` before creating `<type>/<issue>-<slug>` and `.trees/<issue>`. Existing unowned resources, including `/workspaces/soft-factory-runner/.trees/3`, are preserved and blocked with `RESOURCE_OWNERSHIP_UNKNOWN`. For Issue 3, telemetry remains `project.name=jsburckhardt-soft-factory-runner,issue.id=issue-3`.

## RPIV result artifact

After implementation and validation, RPIV writes only this owned path:

```text
<owned-worktree>/.soft-factory/agent-result.json
```

The strict `AgentResultV1` schema is:

```json
{
  "schemaVersion": 1,
  "issueNumber": 4,
  "outcome": "succeeded",
  "branch": "feat/4-prove-completion",
  "headSha": "0123456789abcdef0123456789abcdef01234567",
  "prNumber": 14,
  "acceptanceCriteria": [
    { "id": "AC-1", "status": "verified", "evidence": ["test:completion"] }
  ],
  "validations": [
    { "command": "just verify-focused", "status": "passed" },
    { "command": "just verify", "status": "passed" }
  ],
  "completedAt": "2026-08-11T12:00:00.000Z"
}
```

All fields are required. Issue and PR numbers are positive; the SHA is full hexadecimal; IDs and commands are unique and nonempty; each acceptance entry has nonempty evidence; and completion time is ISO-8601. Outcomes are `succeeded`, `failed`, `blocked`, `cancelled`, or `interrupted`. Only `succeeded` is completion-eligible.

## Finalization and false-completion protection

A nonzero Copilot exit becomes `failed` and cannot be overridden by an artifact. A zero exit first persists `finalizing`; it is never sufficient by itself. Runner then reads the owned artifact and makes one bounded fresh observation of:

- worktree `HEAD` and the selected remote issue-branch SHA;
- the reported pull request by number, including open state, expected base, head branch, head SHA, and closing-issue links;
- every Runner-owned required acceptance ID as `verified` with evidence;
- exactly one passed `just verify-focused` and `just verify` result.

`completed` requires the complete conjunction: result issue and branch match the owned run; result SHA equals local HEAD, remote branch SHA, and PR head SHA; the open PR number/base/head match and closes the issue; all required acceptance and validation proof passes. Additional producer claims cannot replace a required fact.

A missing, malformed, unsupported, timed-out, or incomplete result/Git/GitHub observation becomes `interrupted`. A valid unsuccessful result maps to its named terminal. A contradictory issue, branch, SHA, PR, acceptance result, or validation becomes `failed` with a stable comparison code. No rejection path persists or renders `completed`.

## Persistence and status

New runs use atomic `RunSnapshotV2` files at `.soft-factory/runs/<issue>.json`. Every transition first appends a schema-versioned JSONL event to `.soft-factory/events/<issue>.jsonl`, then atomically replaces the snapshot. An event append failure leaves the prior snapshot; a snapshot replacement failure leaves the appended event for later recovery and never reports completion from the failed write.

Valid Phase 1 `RunSnapshotV1` files remain readable. Unknown versions are rejected, and a legacy snapshot is not completion proof or implicitly upgraded. Only an explicit version 2 transition can carry required evidence.

The explicit terminal states are:

- `completed` — every result, Git, GitHub, acceptance, and validation comparison passed;
- `failed` — process failure, contradictory proof, failed proof, or a valid failed result;
- `blocked` — prerequisite/ownership conflict or a valid blocked result;
- `cancelled` — a valid RPIV cancellation result; operator cancellation control is deferred;
- `interrupted` — absent, malformed, unsupported, or incomplete proof, or a valid interrupted result.

Human and `--json` status derive from the same snapshot facts and expose the same state and safe reconciliation summary. Worker and command success is returned only for `completed`; noncompleted terminal outcomes are nonzero.

## Troubleshooting

| Code | Meaning | Operator action |
| --- | --- | --- |
| `ISSUE_ALREADY_OWNED`, `RESOURCE_OWNERSHIP_UNKNOWN` | Ownership cannot be proven | Preserve resources and inspect status. |
| `STATE_NOT_FOUND`, `STATE_INVALID` | Snapshot is absent, malformed, or unsupported | Preserve it and migrate with a supported version. |
| `RESULT_MISSING`, `RESULT_INVALID`, `RESULT_VERSION_UNSUPPORTED` | Owned result proof is absent or invalid | Emit one strict schema-version-1 artifact. |
| `COMPLETION_PROOF_INCOMPLETE` | Git or GitHub completion facts are unavailable or malformed | Restore the named observation and start a new bounded attempt. |
| `RESULT_*_MISMATCH`, `PR_*_MISMATCH` | Identity, branch, SHA, or PR evidence contradicts the run | Reconcile the exact expected and observed facts. |
| `AC_*_MISMATCH`, `VALIDATION_*_MISMATCH` | Required acceptance or root validation proof failed | Correct evidence and rerun RPIV validation. |
| `TMUX_TARGET_MISSING`, `TMUX_TARGET_MISMATCH` | Attach target is absent or contradictory | Preserve resources and inspect status. |
| `EXTERNAL_COMMAND_FAILED` | Git, tmux, filesystem, or Copilot failed | Use redacted diagnostics to repair the tool. |

## Deterministic evidence fixtures

`src/completion.test.ts` proves strict artifact parsing, successful pure reconciliation, every isolated mismatch, all terminal states, v1/v2 compatibility, and event-before-snapshot failure behavior. `src/orchestration.test.ts` proves the operation trace from zero exit through `finalizing` to `completed` and invalid-artifact interruption. `src/integration.test.ts` uses temporary Git roots and fake credential-free `gh` executables to prove local/remote SHA and complete PR parsing through normal application composition. Coverage remains at least 80% for statements, branches, functions, and lines.

Run:

```text
just verify-focused
just verify
harness checks --focused --json
harness checks --json
```

## Remaining Prototype 3 deferrals

Restart recovery, resume, stop mechanics, cleanup, automatic stale-resource recovery, merged-PR cleanup, and multiple-issue scheduling remain deferred. `cancelled` is representable, but Runner-originated cancellation control is not implemented. Tmux presence, Copilot exit status, and RPIV prose are never completion evidence.
