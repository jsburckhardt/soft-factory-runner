# ADR-260817-invoking-tmux-context-targeting: Invoking Tmux Context Targeting

## Status

Accepted

## Context

Runner currently sends bare tmux commands to the default server and persists only session, window, pane, and cwd values. Window and pane identifiers are server-local, later commands have no durable server selector, and the subprocess environment deliberately omits invoking tmux variables. A run started from a valid client on a custom socket can therefore create or control an invisible or unrelated default-server window.

Issue #36 requires valid in-tmux starts to use the invoking server and current session, outside-tmux starts to use one deterministic repository-specific target, and every later lifecycle command to use the exact persisted target regardless of its ambient invocation context. Selection must reject malformed, stale, contradictory, nested, or ambiguous evidence before mutation, must never adopt an arbitrary same-name window, and must not retain or render the raw invoking tuple or server process identifier.

## Decision

Introduce a target-selection boundary before tmux mutation. When both `TMUX` and `TMUX_PANE` are present, parse them ephemerally with a closed grammar, discard the tuple server PID after structural validation, and make one bounded read-only query through the tuple socket. Accept only one result whose canonical socket, socket filesystem identity, session ID/name, window ID, and pane ID agree with the invoking pane and exactly one current session. Missing evidence means outside-tmux only. Partial, malformed, stale, nested, contradictory, or multiply credible evidence is an operational refusal; it never degrades to fallback.

For outside-tmux starts, derive a deterministic repository-specific socket selector and session name from the canonical owner/repository identity using a bounded collision-resistant token. Protect the standalone socket with repository ownership metadata and exact socket filesystem identity. Create it only when absent and atomically claimable; reuse it only when ownership metadata and observation agree. A same-name issue window always remains unknown ownership and blocks creation.

Persist new runs as `RunSnapshotV6` with a `TmuxTargetV2` containing selection mode, canonical explicit socket path, socket device/inode identity, session ID/name, window ID/name, pane ID, and cwd. Do not persist the raw `TMUX` tuple, `TMUX_PANE` evidence, tmux server PID, client identity, or unvalidated values. Continue to read snapshots v1-v5 as legacy inputs, but never infer a server selector for them or authorize tmux mutation until an explicit safe migration can prove one exact target.

Prefix every normal runtime tmux operation with `-S <persisted-socket>` and target immutable session/window/pane IDs after selection. Creation, observation, status, reconcile, resume, attach, logs, stop, cleanup, and process-lineage checks use the same target object. Reconciliation returns match only when socket filesystem, session, window, pane, and cwd all match in one bounded observation; nonzero means complete absence and malformed zero-exit evidence means unknown. Destructive or content-reading operations require that complete match. Cleanup kills the immutable window ID, attach selects the immutable pane, and no operation discovers or adopts resources by expected name.

Keep Doctor ordered 24 check IDs and private functional probe. Extend `command.tmux` with a bounded, value-free targeting classification that uses the same resolver: `invoking-valid`, `standalone-fallback`, or a closed invalid-context reason. Invoking checks are read-only through only the evidenced socket; fallback checks derive but do not create the standalone target. Doctor and repository-local isolated-socket fixtures compare before/after inventories and fail if any ambient or unrelated resource changes.

For Doctor targeting inventory only, treat one existing queried socket as stable absence when its single shell-free, explicit-`-S` `list-panes` query completes nonzero with zero stdout and one exact LF-terminated original-byte stderr record `no server running on <queried-socket>`. Require valid UTF-8, complete bounded stderr, and equal socket type/device/inode before and after that query; retain the unchanged socket identity in the ephemeral inventory so later deletion or replacement cannot compare equal. Do not broaden this classification to substring matches, alternate text, additional records or bytes, malformed output, timeout, stdout or stderr overflow, inaccessible identity, post-query identity loss, or replacement. Those outcomes remain typed unavailable proof. Never persist or render the matched record or queried path.

Classify this delivery as backward-compatible functionality under project policy and release it as `0.2.0` from `0.1.3`.

## Alternatives

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Continue bare tmux commands | No schema or adapter change | Custom-socket runs remain invisible and lifecycle commands can hit another server | Cannot satisfy exact server ownership |
| Persist only the socket path | Small durable change | A stopped and replaced server can reuse the path and local IDs | Does not prove complete server identity |
| Trust `TMUX` without querying `TMUX_PANE` | Minimal selection work | Stale, nested, and contradictory evidence can select the wrong session | Invoking evidence must resolve to one current session |
| Fall back whenever invoking evidence is invalid | Starts more runs | Converts malformed or hostile evidence into mutation authority | Only complete absence denotes outside tmux |
| Adopt an expected-name existing window | Convenient restart behavior | Names do not prove ownership and collide across servers | Existing zero-adoption policy is mandatory |
| Add a twenty-fifth Doctor check | Separates targeting from mechanics | Breaks the stable Doctor vocabulary | `command.tmux` already owns tmux readiness evidence |

## Consequences

### Positive
- Custom-socket runs remain visible in the invoking session and later commands converge on one target.
- Server-local identifier collisions cannot authorize cross-server observation or mutation.
- Outside-tmux behavior is deterministic without adopting a default or arbitrary existing server.
- Invalid context and Doctor evidence remain bounded, machine-readable, and value-free.

### Negative
- Snapshot, event, status, tmux port, fixture, and documentation contracts require coordinated migration.
- Exact socket filesystem identity can make a restarted server intentionally unavailable until a new owned run is selected.
- Real isolated-socket integration fixtures add local tmux process and cleanup complexity.

### Neutral
- Runner remains a short-lived local CLI with no daemon, network API, database, container, or deployment service.
- The root justfile remains validation authority and Doctor retains its 24 ordered check IDs.
- Existing process, completion, cleanup, strict byte parsing, and non-adoption rules remain in force.

## Related Issues

- [#36](https://github.com/jsburckhardt/soft-factory-runner/issues/36)
- [#40](https://github.com/jsburckhardt/soft-factory-runner/issues/40)

## References

- [Prototype One Issue Run Orchestration](ADR-260811-prototype-one-run-orchestration.md)
- [Prototype Three Recovery and Explicit Concurrency](ADR-260811-prototype-three-recovery-concurrency.md)
- [Tmux Identity Failure Recovery](ADR-260814-tmux-identity-failure-recovery.md)
- [Repository Doctor Readiness Architecture](ADR-260812-repository-doctor-readiness.md)
- [Exact Tmux Context Ownership](../core-components/CORE-COMPONENT-260817-exact-tmux-context-ownership.md)
