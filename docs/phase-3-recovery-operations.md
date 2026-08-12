# Phase 3 recovery and concurrency operations

## Runtime and command surface

Runner is a short-lived local CLI. Install Node.js 22+, Git, `gh`, tmux, Copilot CLI, and `just`; authenticate tools outside Runner state. There is no long-running daemon, network service/API deployment, background scheduler, force-clean path, or evidence purge. Run the checkout without global binary linkage:

```text
just setup
just build
just run --help
```

| Command | Purpose | JSON | Success and non-success |
| --- | --- | --- | --- |
| `just run run --issue <positive-integer> [--json]` | Create one new explicitly requested run | yes | New run is 0; `RUN_EXISTS`, ownership, or capacity refusal is nonzero. |
| `just run reconcile <positive-integer> [--json]` | Replay history and produce the shared report | yes | Safe report is 0; blocked contradiction/unknown is nonzero. |
| `just run resume <positive-integer> [--json]` | Apply the resume decision table | yes | Continued/no-op is 0; refused terminal or ambiguous state is nonzero. |
| `just run stop <positive-integer> [--json]` | Stop one exact RPIV process group | yes | Stopped/already-stopped is 0; identity ambiguity or a process still active after escalation is nonzero. |
| `just run clean <positive-integer> [--json]` | Explicit guarded cleanup | yes | Complete/already-cleaned is 0; dirty, active, unknown, partial, or blocked is nonzero. |
| `just run list [--json]` | Numerically list the union of snapshots, locks, leases, and logs | yes | Inventory is 0; malformed durable state is nonzero. |
| `just run status <positive-integer> [--json]` | Reconcile and render one issue | yes | A readable report is 0; missing/invalid state is nonzero. |
| `just run attach <positive-integer>` | Attach only to the exact recorded tmux target | no | Exact target is 0; absent/mismatch is nonzero. |
| `just run logs <positive-integer> [--json]` | Read retained attempts and exact live pane capture | yes | Available evidence is 0; no evidence or ambiguous target is nonzero. |

Syntax errors exit 2. Operational evidence errors exit 3. Ownership, capacity, blocked reconciliation, resume, stop, and cleanup refusals exit 4. Human and JSON renderings preserve the same schema version, issue, persisted state, outcome code, activity, boundary observation states/codes/facts, safe actions, control facts, cleanup progress, remediation, and exit meaning. Human control output embeds the same shared reconciliation report carried by JSON. Unchanged inputs are idempotent.

## Configuration and explicit admission

`.soft-factory/config.yml` remains a simple mapping:

```yaml
repository:
  remote: origin
  base_branch: main
execution:
  max_concurrent_runs: 2
branch_types:
  feature: feat
rpiv:
  prompt: "Deliver issue #{issue}"
```

`execution.max_concurrent_runs` is a strict positive safe integer. It defaults to `1`; zero, negative, fractional, exponent, empty, and unsafe-integer values fail before issue ownership. Each active issue exclusively creates the lowest available `.soft-factory/concurrency/slots/<slot>.lock` after its issue lock and before snapshot, branch, worktree, tmux, or process creation.

Unknown leases consume capacity. An occupied, malformed, unknown, or stale lease consumes capacity. Reducing the configured limit below an occupied slot blocks new admission until exact inactive ownership can release that lease. At capacity, `CONCURRENCY_LIMIT_REACHED` names only the explicitly requested issue, removes only its just-created matching issue lock, creates no downstream resource, and does not queue, rank, query for, or automatically select another issue. Distinct active issues use distinct issue locks, branches, worktrees, tmux windows/panes, run snapshots, event histories, and log directories; only the repository tmux session is shared.

## Reconciliation and persisted history

New transitions use `RunSnapshotV3` and `TransitionEventV2`. A v3 snapshot records monotonic revision, attempt, slot lease, launch intent, worker/RPIV process identity, stop, cleanup, log, and merged-PR facts. A v2 event records prior/resulting revision and the complete redacted resulting snapshot. Runner appends the event before atomically replacing the snapshot.

On load, only a complete, contiguous, issue/run-identity-matching v2 chain may advance an event-ahead snapshot. Malformed, truncated, duplicate-conflicting, wrong-run, noncontiguous, and legacy-v1-ahead histories return `STATE_HISTORY_INVALID` without inferred mutation. Repetition over unchanged bytes returns the same normalized result.

Every report keeps persisted facts separate from exactly one bounded observation of:

1. issue lock;
2. concurrency slot lease;
3. filesystem worktree path;
4. Git registration, branch, HEAD, staged/unstaged/untracked dirtiness;
5. tmux session/window/pane/cwd;
6. worker process identity;
7. RPIV process identity;
8. strictly parsed result artifact identity and content;
9. authoritative remote branch state; and
10. GitHub pull-request and immutable source-head facts.

Each boundary is `match`, `absent`, `mismatch`, `unknown`, or `not_applicable`. Timeout, malformed output, permission-denied process metadata, and unavailable commands are `unknown`, never inferred absence. Unknown or contradiction never authorizes launch, signal, attach, reuse, or cleanup.

## Process identity and resume decisions

A long-running process matches only when positive PID, process-group ID, OS start token, resolved executable, exact argument vector, cwd, launch time, and tmux pane lineage all agree. Equal PID with a changed start token is a mismatch. Runner persists launch intent before spawn and full identity immediately after spawn. If interrupted between those writes, exactly one matching pane descendant is adopted; zero is absent and multiple/incomplete candidates are blocked. A matching active process yields `active_preserved`, leaves attempt unchanged, and launches zero processes.

| Persisted/reconciled state | Resume outcome |
| --- | --- |
| Exact active process | `ACTIVE_PRESERVED`; no launch and no attempt change. |
| Exact partial preparation | Continue fetched-base/worktree/tmux preparation under the same owner. |
| `finalizing`, or interrupted with a valid result | Retry completion finalization without RPIV. |
| Interrupted execution, no result, exact inactive resources | Increment attempt once and restart the worker in the same owned worktree/tmux pane. |
| `completed` | `COMPLETED_NOOP`. |
| `failed`, `blocked`, `cancelled`, legacy-unmigratable, unknown, mismatched, or ambiguous | `RESUME_REFUSED`; preserve resources. |

Completion still requires the full Phase 2 `AgentResultV1`, local Git, fresh remote, GitHub PR, acceptance, and root-validation conjunction. Recovery cannot infer completion from process or tmux presence.

## Stop, terminal evidence, and logs

`stop` begins from the shared report and signals only an exact RPIV process group. Operation order is:

1. bounded redacted pane capture;
2. `SIGTERM`;
3. wait at most 10 seconds;
4. only if still active, `SIGKILL`;
5. wait at most 5 additional seconds;
6. final bounded capture;
7. only after inactivity is proved, persist stop facts and `cancelled`, then release the exact inactive slot;
8. if the process remains active after both waits, return `STOP_PROCESS_STILL_ACTIVE` nonzero and retain its process identity, running state, issue lock, slot lease, worktree, tmux, and logs.

Already absent or terminal is idempotent. PID reuse, pane mismatch, multiple candidates, or unknown observation sends no signal. Stop never removes the worktree or tmux target. Issue panes use remain-on-exit. Attempt transcripts live at `.soft-factory/logs/<issue>/<attempt>.log`, are redacted, capped at 2 MiB with an explicit truncation marker, and retained with snapshots/events through cleanup. `logs` returns retained attempts and includes current pane capture only for an exact live target.

## Explicit and automatic cleanup

Cleanup authorization comes only from the shared report. Both modes require an inactive terminal run plus exact lock, snapshot, process, tmux, Git registration/branch/path/HEAD, result, and ownership observations. Dirtiness includes staged, unstaged, and untracked files. Active, dirty, absent-unproved, unknown, mismatched, incomplete, or ambiguous resources return a stable refusal with zero unauthorized remove/delete calls. There is no `--force` bypass.

Explicit `clean` records intent and progress, captures the transcript, removes the exact terminal tmux window, removes the clean worktree with non-forced `git worktree remove`, releases an exact inactive slot, and compare-deletes the exact issue lock last. It never removes the local branch, snapshot, events, or logs. Progress is persisted before and after each step. Progress records include the same owner and run. A retry accepts absence only after that same-owner/run record proves the step completed; an absent unrecorded resource or any unrelated replacement blocks. Output identifies completed steps, remaining steps, and remediation.

Automatic merged cleanup runs on the next reconciliation-capable `status`, `list`, or `reconcile`; there is no daemon. Merged head means the immutable PR source head. The expected PR must be `MERGED`, have nonempty merge time, use the recorded issue branch, report source `headSha` equal to the commit already verified at completion, and close the issue. The merge-commit SHA is informational and may differ under merge or squash. A deleted remote issue branch does not block this proof.

Automatic mode removes only the clean exact worktree registration/path, exact inactive slot, and exact issue lock last. It retains tmux, local branch, snapshot, events, and logs. An OPEN PR is pending. A CLOSED-unmerged PR, missing merge time, source branch/SHA mismatch, unavailable GitHub, dirty worktree, lock mismatch, or ownership ambiguity preserves every worktree byte and returns `CLEANUP_MERGE_NOT_PROVED` or the named ownership refusal without rewriting a proved `completed` state.

## Migration and upgrade notes

- Valid `RunSnapshotV1` and `RunSnapshotV2` remain readable; unknown versions are rejected.
- Legacy snapshots do not contain revision, process, lease, stop, cleanup, or log proof. They are never silently treated as v3 and cannot resume, stop, or clean until an explicit reconciliation transition proves migration.
- Existing version-1 events remain append-only history. A v2 event ahead of a legacy snapshot is not replayed because the prior revision cannot be proved.
- New runs write schema v3 and event v2. No destructive data migration or purge is performed.
- `execution.max_concurrent_runs` defaults to 1, preserving prior single-run behavior. Configure a higher strict value only after inspecting current leases; unsafe reductions block rather than evict.
- This release adds CLI and configuration behavior but no network API contract. API migration is not applicable.

## Troubleshooting

| Code | Meaning | Action |
| --- | --- | --- |
| `RUN_EXISTS` | `run` found existing state | Use status/reconcile/resume; do not relaunch. |
| `STATE_HISTORY_INVALID` | Event replay is malformed, conflicting, or noncontiguous | Preserve files and restore one complete identity-matching chain. |
| `RECONCILIATION_UNKNOWN`, `RECONCILIATION_MISMATCH` | A required observation is unavailable or contradictory | Repair the named boundary and explicitly retry. |
| `PROCESS_IDENTITY_MISMATCH`, `PROCESS_IDENTITY_AMBIGUOUS` | PID/start token/command/cwd/pane proof disagrees | Preserve processes and panes; never signal or launch by PID alone. |
| `CONCURRENCY_LIMIT_REACHED` | All configured slots are occupied | Wait for one exact inactive run; request issues explicitly. |
| `CONCURRENCY_STATE_UNKNOWN` | Malformed/stale or above-limit lease blocks admission | Restore prior limit or reconcile exact lease ownership. |
| `STOP_REFUSED` | Exact signal target is unproved | Inspect status and retained logs; do not kill by name. |
| `STOP_PROCESS_STILL_ACTIVE` | The exact RPIV process survived SIGTERM 10 seconds and SIGKILL 5 seconds | Keep ownership/capacity intact, inspect retained logs, and retry only while exact identity remains observable. |
| `CLEANUP_ACTIVE`, `CLEANUP_DIRTY_WORKTREE`, `CLEANUP_OWNERSHIP_UNPROVED` | Cleanup safety conjunction failed | Stop safely or reconcile/preserve the named resource. |
| `CLEANUP_MERGE_NOT_PROVED` | PR is closed-unmerged or merge/source proof is incomplete | Preserve worktree; restore exact GitHub evidence or use explicit clean only when otherwise eligible. |
| `LOG_NOT_FOUND` | No retained attempt or exact live capture exists | Inspect snapshot attempt/log references and tmux identity. |

## Validation and deterministic fixtures

Use direct root recipes and their harness delegates:

```text
harness checks --focused --json
just verify-focused
just verify
harness checks --json
```

Repository fixtures use temporary roots, exclusive file creation, fixed clocks/IDs, fake `gh`/tmux/process adapters, and no ambient credentials, Copilot, or tmux resources. They repeat interruption and three-explicit-issue capacity races, assert no duplicate launch or owner, verify disjoint resource identities, exercise graceful/escalated/still-active stop ordering, inject snapshot failure after every cleanup step, retry from durable same-owner progress, refuse unrelated replacements, and prove cleanup retention/refusal.


## Repository readiness preflight

Before issue execution, run `just run doctor` or `just run doctor --json` to inspect all repository-scoped prerequisites without selecting an issue or mutating owned run resources. A NOT READY report exits 3 and keeps all 24 checks visible. See [Phase 4 repository Doctor](phase-4-repository-doctor.md). This product command is distinct from ambient `harness doctor`, which inspects the development harness rather than Runner repository compatibility.
