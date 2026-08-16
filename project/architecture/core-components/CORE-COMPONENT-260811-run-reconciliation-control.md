# CORE-COMPONENT-260811-run-reconciliation-control: Run Reconciliation and Control

## Status

Adopted

## Purpose

Provide one reusable contract for reconstructing a run from durable and observed facts and for exposing safe, deterministic recovery and control commands without duplicate RPIV launch or lost terminal evidence.

## Scope

This component applies to snapshot and event recovery, lock and resource observation, process matching, result and remote observation, `reconcile`, `resume`, `status`, `list`, `attach`, `logs`, `stop`, command rendering, and deterministic interruption fixtures. Cleanup authorization and concurrency admission are delegated to their dedicated components.

## Definition

### Rules
- Persist new runs as `RunSnapshotV5` with the v4 monotonic revision, attempt, lease, launch, process, stop, cleanup, log, merge, final-validation, integration, and progress facts plus one nullable latest `TmuxIdentityDiagnosticV1`. Append `TransitionEventV2` containing prior revision, resulting revision, and the complete redacted resulting `RunSnapshotV3`, `RunSnapshotV4`, or `RunSnapshotV5` before atomic snapshot replacement.
- Read valid snapshot versions 1 through 5 and event versions 1 and 2. Keep v1 readable but non-completable without its missing acceptance input; upgrade eligible v2/v3 records through the existing explicit v4 normalization and normalize supported v4 records only through an explicit revisioned v5 transition. Replay only a contiguous, run-identity-matching version 2 chain whose resulting snapshots are valid v3, v4, or v5 records; refuse malformed, conflicting, legacy-ahead, or noncontiguous history.
- Reconcile persisted state separately against issue lock, filesystem, Git branch and worktree including preparation HEAD/cleanliness, exact tmux session/window/pane or name-only presence when no identity is recorded, worker and RPIV process, result artifact, remote branch, and GitHub pull request facts. Classify every observation as `match`, `absent`, `mismatch`, `unknown`, or `not_applicable` and expose the latest bounded tmux identity diagnostic separately.
- Perform one bounded observation per external boundary per reconciliation attempt. Do not poll or retry internally. Persist a returned malformed tmux observation diagnostic after that one pass without recollecting. Unknown or contradictory facts must not authorize resource reuse, process launch, signaling, or cleanup.
- Match a process only by PID, process-group ID, OS start token, resolved executable, exact arguments, cwd, launch time, and recorded tmux pane lineage. Persist launch intent before spawn and process identity immediately after spawn. Adopt only one unambiguous pane descendant matching an interrupted launch intent.
- Preserve one matching active RPIV process and return `active_preserved` without spawning or incrementing the attempt. Block when candidates are multiple, identity is incomplete, or observation is unavailable.
- When persisted state is `running_rpiv` and RPIV is proved absent and the worker is absent or not recorded, classify a strict successful identity- and binding-matching immutable result as `RESULT_RECOVERY_CANDIDATE`. Use its head SHA and PR number only to collect the dependent worktree, fresh remote, and GitHub observations once; do not persist or accept the result during collection.
- Return `FINALIZATION_RECOVERY_AVAILABLE` with only `retry_finalization` when lock, lease, filesystem, candidate-head Git, result candidate, fresh remote, and GitHub identity match; RPIV is absent and the worker is absent or not recorded; and tmux is exact or proved absent. Unknown or mismatched tmux and every other unknown or contradiction retain normal blocking precedence. Tmux absence on this path authorizes neither ownership nor cleanup.
- After waiting for Copilot, reload the current snapshot and permit post-exit mutation only for a valid v5 `running_rpiv` snapshot whose run ID, owner ID, complete worker identity, and complete RPIV process identity equal the pre-wait run and the exact awaited process. Compare complete structured identities, never PID alone.
- Return `POST_WAIT_STATE_REFUSED` with a closed reason for missing, invalid, run-mismatched, owner-mismatched, worker-mismatched, RPIV-mismatched, or concurrently advanced state. Preserve the original typed cause safely and perform no fallback terminal transition, relaunch, ownership release, or accepted-evidence mutation.
- Treat an exact already-terminal current run as an idempotent existing outcome after run, owner, and worker identity checks. Do not append launch, exit, finalization, lease-release, or terminal transitions, and do not change progress, result, or diagnostic facts.
- Derive the observed zero- or nonzero-exit transition only from the reloaded snapshot. Let the store reject any second advance between reload and save; translate that noncontiguous refusal without overwriting or renumbering newer history.
- Make `run` new-run only. Reconcile existing same-issue state as `RUN_EXISTS` without launching. Make `resume` continue partial `starting_tmux` preparation only when lock/lease, path/registration/branch, fetched-base HEAD, staged/unstaged/untracked cleanliness, and zero same-name tmux candidates are proved; enter `finalizing` without launch or attempt increment for `FINALIZATION_RECOVERY_AVAILABLE`; retry finalization without RPIV when accepted completion input exists; or increment the attempt for an interrupted execution with no completion input. Treat completed as an idempotent no-op and refuse failed, blocked, cancelled, unmigratable, mismatched, unknown-name, or ambiguous runs.
- Make `status`, `list`, `reconcile`, `attach`, `logs`, `resume`, `stop`, `clean`, and existing-state `run` consume the same reconciliation report. Sort `list` by issue number over the union of snapshots, locks, slot leases, and retained logs. Derive human and JSON meaning from the same structured facts.
- Require an exact tmux identity for attach. Return retained redacted attempt transcripts from logs and include a bounded live pane capture only when the target still matches.
- Stop only an exact matching RPIV process group. Send `SIGTERM`, wait no more than 10 seconds, send `SIGKILL` only if still active, and wait no more than 5 further seconds. Persist cancelled state and stop facts, preserve worktree and tmux, and block signaling on ambiguity.
- Configure issue panes to remain after process exit. Capture redacted tmux history before and after stop and before tmux cleanup into `.soft-factory/logs/<issue>/<attempt>.log`, cap each transcript at 2 MiB with explicit truncation, and retain logs, snapshots, and events after cleanup.
- Preserve terminal state meanings and the single snapshotted final-validation proof governed by ADR-260812-rpiv-integration-completion-contract. Store control or cleanup blockage separately when the run was already proved completed.
- Observe RPIV progress with its strict classification, last-accepted fact, and phase, but exclude progress from activity, safe-action, result, completion, recovery, signaling, and cleanup authorization.

### Interfaces
- `RunSnapshotV5` carries every v4 ownership, recovery, final-validation, integration-launch, and progress fact plus nullable `tmuxIdentityDiagnostic`; supported v4 input normalizes with that field set to null.
- `TransitionEventV2` contains schema version, run and issue identity, prior and resulting revisions, transition reason, timestamp, and a complete resulting `RunSnapshotV3`, `RunSnapshotV4`, or `RunSnapshotV5` for supported history replay.
- `ProcessIdentityV1` contains PID, process-group ID, OS start token, resolved executable, exact args, cwd, launch time, and pane lineage.
- `PostWaitRefusalReasonV1` is the closed machine-readable reason vocabulary `missing`, `invalid`, `run_mismatch`, `owner_mismatch`, `worker_mismatch`, `rpiv_mismatch`, and `state_advanced`.
- `ReconciliationReportV2` contains persisted revision, normalized observations for every boundary including non-authorizing progress, the latest bounded tmux identity diagnostic, decision code, active classification, safe actions, and redacted diagnostics.
- Process adapters expose spawn identity, process and process-tree observation, bounded wait, and exact process-group signaling. Tmux adapters expose identity observation, bounded pane capture, remain-on-exit setup, attach, and window removal.
- File and store adapters expose strict enumeration, lock reads, event reads, atomic writes, compare-and-delete, retained-log reads/writes, and version validation.

### Expectations
- Repeating a reconciliation with unchanged inputs returns the same report and makes no duplicate transition.
- Repeating post-wait handling after a terminal outcome returns that outcome with byte-equivalent accepted evidence and no appended event.
- Event replay either proves one complete latest snapshot or makes mutation unavailable.
- Reinvoking recovery while the recorded RPIV process remains active performs zero process launches.
- A stopped run retains both its owned worktree and inspectable terminal transcript.
- Observation failures produce stable actionable non-success outcomes and never become inferred absence, except the established nonzero tmux target observation that means absence; malformed zero-exit identity output remains unknown and retains bounded structure.
- Missing or unusable progress reports phase unknown without changing operational state or safe actions.

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
- Integrate tmux identity parsing, retention, name-only refusal, and preparation proof through `CORE-COMPONENT-260814-tmux-identity-diagnostics`.

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
- [ADR-260812-rpiv-integration-completion-contract](../ADR/ADR-260812-rpiv-integration-completion-contract.md)
- [ADR-260811-prototype-two-completion-proof](../ADR/ADR-260811-prototype-two-completion-proof.md)
- [ADR-260814-tmux-identity-failure-recovery](../ADR/ADR-260814-tmux-identity-failure-recovery.md)
