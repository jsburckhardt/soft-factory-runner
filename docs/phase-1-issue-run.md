# Phase 1 issue run

Phase 1 proves one explicit GitHub issue can be validated, exclusively owned, placed on a branch and worktree created from a proven fetched base, and launched visibly through tmux into RPIV. Runner orchestrates operational facts; RPIV makes all software-engineering decisions.

## Prerequisites

Install Node.js 22+, Git, GitHub CLI (`gh`), tmux, Copilot CLI, `just`, and the ambient engineering harness. Authenticate `gh` and Copilot without writing credentials into Runner configuration or state. Run commands inside a Git worktree whose common repository has one unambiguous GitHub identity.

Build and inspect the CLI through root recipes:

```text
just setup
just build
just run --help
```

The no-argument command retains the harness bootstrap signal. Product syntax is strict:

```text
soft-factory run --issue <positive-integer> [--json]
soft-factory status <positive-integer> [--json]
soft-factory attach <positive-integer>
```

`internal run-agent` is private and is started by the owned tmux window.

## Configuration

Runner reads optional `.soft-factory/config.yml`. The runtime directory is ignored by Git. Supported Phase 1 fields are:

```yaml
repository:
  remote: origin
  base_branch: main
branch_types:
  feature: feat
rpiv:
  prompt: "Deliver issue #{issue}"
```

Remote precedence is `repository.remote`, Git `remote.pushDefault`, the current branch remote, then an unambiguous sole remote. The optional `repository.base_branch` must equal the remote advertised default branch. The standard `feature: feat` mapping is present by default; exactly one issue label must map to an allowed Conventional Commit type. Runner does not infer intent from issue prose.

The owner-qualified GitHub repository is normalized by lowercasing, replacing non-alphanumeric runs with `-`, and trimming `-`. For example, `jsburckhardt/soft-factory-runner` becomes `jsburckhardt-soft-factory-runner`.

## Readiness and side-effect order

Before any owned resource is created, Runner proves the repository and issue facts. The issue must:

- exist and be open;
- contain exactly one ordered `ACCEPTANCE_CRITERIA_START`/`ACCEPTANCE_CRITERIA_END` block with at least one nonempty Markdown checkbox;
- have no case-insensitive `blocked` label or open blocked-by relationship;
- have exactly one configured intent label mapping;
- have no open pull request that closes the issue or uses its planned branch;
- have complete, non-malformed GitHub evidence within the 10-page, 100-record page bound.

GitHub and tmux observations are bounded to 15 seconds. Fetch and advertised-HEAD operations are bounded to 30 seconds. Timeout, truncation, malformed output, missing pages, or ambiguity blocks safely.

After readiness, Runner atomically creates `.soft-factory/locks/<issue>.lock`. Under that ownership it fetches the selected remote, reads the advertised HEAD branch and SHA, reads the fetched tracking-ref SHA, and requires exact equality. `FetchedBaseProofV1` is persisted before branch or worktree creation. The branch is `<type>/<issue>-<slug>` and is created directly from `advertisedHeadSha`, never from a local default-branch name.

## Ownership and files

One active issue owns one lock, run snapshot, typed branch, worktree, and tmux window:

```text
.soft-factory/locks/<issue>.lock
.soft-factory/runs/<issue>.json
.soft-factory/events/<issue>.jsonl
.trees/<issue>
sf-<normalized-project>:<issue>
```

Locks use exclusive creation. Snapshots are schema-versioned atomic replacements. Events are schema-versioned append-only JSONL transitions. Existing paths, branches, registered worktrees, snapshots, or tmux windows are reused only when lock, recorded, and observed ownership agree. Phase 1 does not reconcile existing resources, so unknown resources block and are never modified or removed.

This rule includes an outer RPIV checkout such as `/workspaces/soft-factory-runner/.trees/3`: its matching path does not establish Runner ownership. The deterministic tests create temporary repository roots and never reuse or modify that ambient worktree.

## Visible RPIV and telemetry

Runner creates the repository tmux session and one issue-number window rooted at `.trees/<issue>`. The pane visibly starts:

```text
soft-factory internal run-agent --issue <issue>
```

The worker starts Copilot with validated argument arrays, not shell interpolation:

```text
copilot --yolo --name issue-<issue> --agent rpiv --prompt "Deliver issue #<issue>"
```

Every launch receives exactly:

```text
OTEL_RESOURCE_ATTRIBUTES=project.name=<normalized-owner-repository>,issue.id=issue-<issue>
```

For Issue 3 this is `project.name=jsburckhardt-soft-factory-runner,issue.id=issue-3`, and the Copilot session name is exactly `issue-3`. Runner passes the delivery prompt to RPIV; no Runner adapter can select a solution, edit code, or interpret RPIV prose.

## State, status, and attach

Phase 1 persists preparation states, `running_rpiv`, and safe `blocked`, `failed`, or `interrupted` outcomes. A nonzero Copilot exit is `failed`. A zero Copilot exit is **`interrupted`**, never `completed`, because Phase 1 has no result-artifact completion proof.

`status <issue>` loads the atomic snapshot and reports persisted state separately from a bounded tmux observation. `--json` renders the same structured facts used by human output. `attach <issue>` loads the snapshot, observes and exactly verifies session/window/pane/cwd, then attaches. The caller supplies no tmux identifiers. Missing, malformed, timed-out, mismatched, or ambiguous observations block without launch, recovery, cleanup, or mutation.

## Troubleshooting

| Code | Meaning | Operator action |
|---|---|---|
| `CLI_INVALID` | Unsupported syntax or issue value | Use `soft-factory --help` and a positive integer. |
| `REPOSITORY_INVALID` | Git/common-directory/GitHub identity proof failed | Repair repository remotes and Git state. |
| `CONFIG_INVALID` | Unsupported YAML shape or branch type | Use only documented fields and allowed commit types. |
| `ISSUE_NOT_FOUND`, `ISSUE_CLOSED` | Issue cannot run | Select an existing open issue. |
| `ISSUE_BLOCKED` | Label or open dependency blocks work | Resolve blockers and remove the label. |
| `ACCEPTANCE_CRITERIA_INVALID` | Marker block is missing, duplicate, malformed, or empty | Restore one nonempty checkbox block. |
| `ISSUE_TYPE_UNMAPPED`, `ISSUE_TYPE_AMBIGUOUS` | Intent mapping is absent or conflicting | Leave exactly one mapped label. |
| `ISSUE_CONFLICT` | An open PR closes the issue or owns the branch | Reconcile the PR before retrying. |
| `GITHUB_PROOF_INCOMPLETE` | Query timed out, truncated, paginated incompletely, or malformed | Restore complete GitHub evidence and retry. |
| `REMOTE_MISSING`, `REMOTE_AMBIGUOUS` | Remote selection is not deterministic | Set `repository.remote`. |
| `REMOTE_FETCH_FAILED`, `REMOTE_HEAD_MISSING` | Fetch/default HEAD proof failed | Repair access and remote default configuration. |
| `BASE_BRANCH_CONFLICT`, `BASE_TRACKING_MISSING`, `BASE_SHA_MISMATCH` | Latest fetched base is unproved | Correct base/refspecs or retry after propagation. |
| `ISSUE_ALREADY_OWNED` | Another start won the exclusive lock | Inspect status and preserve the owner. |
| `RESOURCE_OWNERSHIP_UNKNOWN` | Existing resource ownership does not agree | Preserve and reconcile manually. |
| `STATE_NOT_FOUND`, `STATE_INVALID` | Snapshot is absent or unsupported | Preserve state; start once or migrate with a supported version. |
| `TMUX_TARGET_MISSING`, `TMUX_TARGET_MISMATCH` | Attach proof failed | Inspect status and reconcile without cleanup. |
| `EXTERNAL_COMMAND_FAILED` | Git, tmux, filesystem, or Copilot failed | Use redacted diagnostics and repair the named tool. |

Errors are nonzero, stable, actionable, and available as structured JSON where the command supports `--json`.

## Deterministic evidence fixture

The credential-free suite injects declarative GitHub/tmux/process facts through normal application composition and uses temporary filesystem and Git roots:

```text
just verify-focused
just verify
```

`src/orchestration.test.ts` proves the full Issue 3 operation transcript, exact multiplicity/order, status/attach, failures, names, and telemetry. `src/integration.test.ts` proves barrier-released exclusive ownership and exact temporary Git ancestry/worktree registration. Fixtures expose operational facts only; there is no production test switch or implementation-decision callback.

## Phase 1 deferrals

Phase 1 intentionally does not provide result artifacts, `completed`, restart recovery, resume, stop, clean, automatic stale-resource recovery, post-launch pull-request reconciliation, or multiple-issue scheduling. These require later Plan-stage contracts. Do not interpret tmux presence, Copilot exit zero, or agent prose as completion evidence.
