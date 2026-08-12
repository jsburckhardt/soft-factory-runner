# ADR-260811-prototype-three-recovery-concurrency: Prototype Three Recovery and Explicit Concurrency

## Status

Accepted

## Context

Prototype 2 can prove completion for one owned issue, but the persisted snapshot does not identify a live process, event history cannot repair an event-ahead-of-snapshot failure, and Runner has no recovery, control, cleanup, enumeration, log, or repository-wide admission behavior. Issue #5 requires safe interruption recovery and explicitly requested concurrent issues without weakening existing ownership and completion proof.

The architecture must settle process identity, the active-run counting boundary, event replay, resume outcomes, bounded stop escalation, terminal evidence retention, merged-head meaning, automatic cleanup scope, and transient observation behavior. These choices cross locks, files, Git, tmux, processes, result artifacts, remote Git, and GitHub and must remain deterministic when facts are absent, contradictory, or unavailable.

## Decision

Extend the existing command/domain/adapter architecture with one reconciliation and control plane governed by `CORE-COMPONENT-260811-run-reconciliation-control`, atomic admission governed by `CORE-COMPONENT-260811-concurrent-run-admission`, and destructive operations governed by `CORE-COMPONENT-260811-owned-resource-cleanup`.

Introduce `RunSnapshotV3` with a monotonic revision, attempt number, concurrency lease, worker and RPIV process identities, launch intent, stop facts, cleanup facts, retained-log references, and merged-pull-request cleanup facts. Introduce `TransitionEventV2` with the prior and resulting revisions plus the complete redacted resulting snapshot. Continue reading valid snapshot versions 1 and 2 and event version 1, but upgrade them only through an explicit version 3 reconciliation transition. Replay only a contiguous, identity-matching version 2 event chain ahead of the snapshot; malformed, conflicting, legacy-ahead, or noncontiguous history blocks mutation.

Represent each external observation as `match`, `absent`, `mismatch`, `unknown`, or `not_applicable` in one structured reconciliation report. Each reconciliation attempt performs one bounded observation per required lock, filesystem, Git, tmux, process, result, remote, and GitHub boundary without polling or hidden retry. Unavailable observations remain `unknown`; they never authorize launch, signaling, reuse, or cleanup. Human and JSON command output derive from the same report and stable outcome code.

Identify a long-running worker and RPIV process by positive PID, process-group ID, OS process start token, resolved executable, exact argument vector, cwd, launch time, and recorded tmux pane lineage. A process matches only when every available identity field and pane lineage agree, preventing PID reuse. Persist launch intent before spawn and process identity immediately after spawn. If interruption occurs between those writes, adopt exactly one observed pane descendant matching the launch intent; zero candidates means absent and multiple or incomplete candidates mean ambiguous. Preserve an exact active match without launching another process.

Define command behavior as follows:

- `reconcile`, `status`, `list`, `attach`, `logs`, `resume`, `stop`, `clean`, and an existing-state `run` begin from the same reconciliation policy. `list` enumerates the union of run, lock, admission, and retained-log records in numeric issue order.
- `run --issue` creates only a new explicitly named issue run. Existing state is reconciled and returned as `RUN_EXISTS`; it is never treated as permission to relaunch.
- `resume` preserves a matching active process without incrementing the attempt. It continues an exactly owned partial preparation, retries finalization without RPIV when completion input exists, or increments the attempt and launches in the same owned worktree for an interrupted execution with no completion input. It is an idempotent no-op for `completed` and refuses `failed`, `blocked`, `cancelled`, legacy-unmigratable, mismatched, and ambiguous states.
- `status` and `list` may persist reconciliation transitions and perform eligible automatic merged cleanup. `attach` requires an exact recorded tmux target. `logs` returns redacted retained attempt transcripts and, when exact and live, a bounded current pane capture.
- `stop` signals only an exact matching RPIV process group, requests `SIGTERM`, waits at most 10 seconds, then sends `SIGKILL` and waits at most 5 additional seconds. It records whether escalation occurred, persists `cancelled`, captures terminal output before and after signaling, and preserves the worktree and tmux evidence. A terminal or already absent process returns an idempotent already-stopped outcome; ambiguity blocks all signals.

Retain one redacted terminal transcript per attempt at `.soft-factory/logs/<issue>/<attempt>.log`. Capture the bounded tmux history before and after stop and before explicit tmux cleanup, mark truncation explicitly, cap each retained transcript at 2 MiB, and keep snapshots, events, and transcripts after cleanup. Configure issue panes to remain after process exit. No Prototype 3 command purges retained evidence.

Parse `execution.max_concurrent_runs` as a strict positive safe integer and default it to 1. Every active issue holds one atomic repository slot lease under `.soft-factory/concurrency/slots/`. Acquire the issue lock after read-only readiness, then claim the lowest available configured slot by exclusive creation before creating downstream resources. If no slot is available, compare-and-delete only the just-created matching issue lock. Unknown or stale leases count as occupied until reconciliation proves exact ownership and inactivity; a configured limit reduction with any occupied slot above the new limit blocks new admission. Release a slot only after a persisted non-active outcome and exact lease-owner comparison. This supplies an atomic limit while preserving explicit issue selection.

Treat the immutable pull-request source head as the merged head: GitHub must report the expected PR as `MERGED` with nonempty merge time, expected head branch, and source `headSha` equal to the commit already verified for the completed run. The merge-commit SHA is retained as informational because merge and squash strategies may change it, and remote branch existence is not required after merge. A completed run is eligible for automatic cleanup on the next reconciliation-capable command only after these merge facts and all lock, snapshot, process, tmux, Git registration, branch, worktree path, HEAD, cleanliness, and ownership facts reconcile.

Automatic merged cleanup removes only the clean owned worktree registration and directory, releases any exact stale slot, and releases the exact issue lock last; it retains tmux and durable evidence. Explicit `clean` may also remove the exact terminal tmux window after transcript capture. Destructive steps persist intent and per-resource progress before and after each operation so retries accept absence only when a prior successful owned step records it. Neither mode removes the local branch. Active, dirty, unknown, mismatched, incomplete, or ambiguous facts refuse cleanup. Observe RPIV progress under CORE-COMPONENT-260812-rpiv-integration-handoff only as non-authorizing diagnostics; progress never changes completion or cleanup proof. A closed-unmerged PR or incomplete merge proof preserves resources and persists an actionable blocked cleanup result without rewriting a previously proved completed run state.

## Alternatives

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Match only PID or tmux pane | Small schema and simple observation | PID reuse and stale panes can impersonate the run | Does not prove one live RPIV identity safely |
| Ignore event history and trust the snapshot | Minimal persistence change | Loses a committed transition after snapshot replacement failure | Cannot recover the documented event-ahead failure |
| Count active snapshots before launch | Easy to query | Distinct starts can race above the limit | The limit needs an atomic admission boundary |
| Use one global admission mutex | Serializes counting | A stale global mutex blocks all issues and needs another recovery protocol | Fixed atomic slots isolate failures and preserve per-issue ownership |
| Poll and retry unavailable observations | May hide transient failures | Makes outcomes timing dependent and can delay control indefinitely | Operator retries must remain explicit and bounded |
| Compare the GitHub merge commit | Available after merge | It differs from the issue head under squash or merge commits | The criterion concerns the recorded issue branch commit |
| Remove tmux and all evidence automatically after merge | Reclaims more resources | Destroys terminal evidence and exceeds the required automatic scope | Automatic cleanup must preserve diagnosability |

## Consequences

### Positive
- Restart and command behavior share one deterministic, inspectable reconciliation report.
- Exact process matching prevents duplicate launch and unsafe signaling after PID reuse.
- Atomic leases enforce concurrency without selecting issues automatically.
- Event-ahead failures can be replayed when the history chain proves the complete next snapshot.
- Merged cleanup is safe with deleted remote branches and varying merge strategies.

### Negative
- Snapshot and event payloads become larger and require explicit version migration.
- Conservative unknown observations and stale leases can block progress until an operator restores proof.
- Status and list are reconciliation-capable and may perform narrowly scoped automatic merged cleanup.
- Process observation needs platform-specific typed adapters for start tokens, process groups, and lineage.

### Neutral
- The five terminal run states remain unchanged; final-validation proof follows ADR-260812-rpiv-integration-completion-contract.
- Local issue branches, snapshots, events, logs, and terminal tmux evidence remain after automatic cleanup.
- Runner remains a short-lived CLI; automatic cleanup occurs on the next reconciliation-capable invocation, not in a daemon.

## Related Issues

- [#5](https://github.com/jsburckhardt/soft-factory-runner/issues/5)

## References

- [Soft Factory Runner PRD](../../../PRD.md)
- [RPIV Integration and Completion Contract](ADR-260812-rpiv-integration-completion-contract.md)
- [Prototype Two Completion Proof](ADR-260811-prototype-two-completion-proof.md)
- [Persistence and Recovery](../core-components/CORE-COMPONENT-260810-persistence-recovery.md)
- [Issue and Worktree Locking](../core-components/CORE-COMPONENT-260810-issue-worktree-locking.md)
- [Subprocess Execution](../core-components/CORE-COMPONENT-260810-subprocess-execution.md)
