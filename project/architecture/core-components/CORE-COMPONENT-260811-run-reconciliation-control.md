# CORE-COMPONENT-260811-run-reconciliation-control: Run Reconciliation and Control

## Status

Adopted

## Purpose

Provide one reusable contract for reconstructing a run from durable and observed facts and for exposing safe, deterministic recovery and control commands without duplicate RPIV launch or lost terminal evidence.

## Scope

This component applies to snapshot and event recovery, lock and resource observation, process matching, result and remote observation, `reconcile`, `resume`, `status`, `list`, `attach`, `logs`, `stop`, command rendering, and deterministic interruption fixtures. Cleanup authorization and concurrency admission are delegated to their dedicated components.

## Definition

### Rules
- Persist new runs as `RunSnapshotV3` with monotonic revision, attempt, lease, launch intent, worker and RPIV process identity, stop, cleanup, log, and merge facts. Append `TransitionEventV2` containing prior revision, resulting revision, and the complete redacted resulting snapshot before atomic snapshot replacement.
- Read valid snapshot versions 1 through 3 and event versions 1 and 2. Upgrade legacy records only through an explicit version 3 reconciliation transition. Replay only a contiguous, run-identity-matching version 2 chain ahead of the snapshot; refuse malformed, conflicting, legacy-ahead, or noncontiguous history.
- Reconcile persisted state separately against issue lock, filesystem, Git branch and worktree, tmux session/window/pane, worker and RPIV process, result artifact, remote branch, and GitHub pull request facts. Classify every observation as `match`, `absent`, `mismatch`, `unknown`, or `not_applicable`.
- Perform one bounded observation per external boundary per reconciliation attempt. Do not poll or retry internally. Unknown or contradictory facts must not authorize resource reuse, process launch, signaling, or cleanup.
- Match a process only by PID, process-group ID, OS start token, resolved executable, exact arguments, cwd, launch time, and recorded tmux pane lineage. Persist launch intent before spawn and process identity immediately after spawn. Adopt only one unambiguous pane descendant matching an interrupted launch intent.
- Preserve one matching active RPIV process and return `active_preserved` without spawning or incrementing the attempt. Block when candidates are multiple, identity is incomplete, or observation is unavailable.
- Make `run` new-run only. Reconcile existing same-issue state as `RUN_EXISTS` without launching. Make `resume` continue exact partial preparation, retry finalization without RPIV when completion input exists, or increment the attempt for an interrupted execution with no completion input. Treat completed as an idempotent no-op and refuse failed, blocked, cancelled, unmigratable, mismatched, or ambiguous runs.
- Make `status`, `list`, `reconcile`, `attach`, `logs`, `resume`, `stop`, `clean`, and existing-state `run` consume the same reconciliation report. Sort `list` by issue number over the union of snapshots, locks, slot leases, and retained logs. Derive human and JSON meaning from the same structured facts.
- Require an exact tmux identity for attach. Return retained redacted attempt transcripts from logs and include a bounded live pane capture only when the target still matches.
- Stop only an exact matching RPIV process group. Send `SIGTERM`, wait no more than 10 seconds, send `SIGKILL` only if still active, and wait no more than 5 further seconds. Persist cancelled state and stop facts, preserve worktree and tmux, and block signaling on ambiguity.
- Configure issue panes to remain after process exit. Capture redacted tmux history before and after stop and before tmux cleanup into `.soft-factory/logs/<issue>/<attempt>.log`, cap each transcript at 2 MiB with explicit truncation, and retain logs, snapshots, and events after cleanup.
- Preserve the existing completion-proof conjunction and terminal state meanings. Store control or cleanup blockage separately when the run was already proved completed.

### Interfaces
- `RunSnapshotV3` extends existing ownership and completion facts with `revision`, `attempt`, `admission`, `launchIntent`, `workerProcess`, `rpivProcess`, `stop`, `cleanup`, `logs`, and merged-pull-request reconciliation facts.
- `TransitionEventV2` contains schema version, run and issue identity, prior and resulting revisions, transition reason, timestamp, and complete resulting `RunSnapshotV3`.
- `ProcessIdentityV1` contains PID, process-group ID, OS start token, resolved executable, exact args, cwd, launch time, and pane lineage.
- `ReconciliationReportV1` contains persisted revision, normalized observations for every boundary, decision code, active classification, safe actions, and redacted diagnostics.
- Process adapters expose spawn identity, process and process-tree observation, bounded wait, and exact process-group signaling. Tmux adapters expose identity observation, bounded pane capture, remain-on-exit setup, attach, and window removal.
- File and store adapters expose strict enumeration, lock reads, event reads, atomic writes, compare-and-delete, retained-log reads/writes, and version validation.

### Expectations
- Repeating a reconciliation with unchanged inputs returns the same report and makes no duplicate transition.
- Event replay either proves one complete latest snapshot or makes mutation unavailable.
- Reinvoking recovery while the recorded RPIV process remains active performs zero process launches.
- A stopped run retains both its owned worktree and inspectable terminal transcript.
- Observation failures produce stable actionable non-success outcomes and never become inferred absence.

## Rationale

Recovery and control all answer the same question: whether durable ownership agrees with current reality. One typed report prevents command-specific guesses, while compound process identity and revisioned event replay close the two interruption windows that current snapshots cannot resolve. Explicit one-pass observations keep retries under operator control.

## Usage Examples

```
running_rpiv + exact process identity and pane lineage -> active_preserved, launch count 0
interrupted + valid result + no process -> retry finalization, launch count 0
interrupted + no result + exact owned resources -> attempt + 1, launch once
active + stop -> SIGTERM, bounded wait, optional SIGKILL, cancelled, retain worktree and logs
```

## Integration Guidelines

How should other parts of the system integrate with this component?

- Keep pure report construction and command decision tables in domain modules; keep OS, Git, GitHub, tmux, and filesystem details in typed adapters.
- Read and reconcile history before deciding whether a snapshot may be upgraded or mutated.
- Persist transition intent and identity before exposing success from launch, stop, or recovery.
- Add stable typed errors and outcome codes for every refusal and map nonsuccess to nonzero CLI results.
- Test each command through shared fixtures that can interrupt every persistence and process boundary.

## Exceptions

Under what circumstances is it acceptable to deviate from this component rules?

- None. Unknown state may be retried by a later explicit command but may not be guessed within the current attempt.

## Enforcement

How is compliance with this component verified?

- [x] Automated checks
- [x] Code review checklist
- [x] Test coverage requirements

## Related ADRs

- [ADR-260811-prototype-three-recovery-concurrency](../ADR/ADR-260811-prototype-three-recovery-concurrency.md)
- [ADR-260811-prototype-two-completion-proof](../ADR/ADR-260811-prototype-two-completion-proof.md)
