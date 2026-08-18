# CORE-COMPONENT-260817-exact-tmux-context-ownership: Exact Tmux Context Ownership

## Status

Adopted

## Purpose

Define one reusable target-selection, persistence, command-routing, reconciliation, confidentiality, concurrency, Doctor, and test contract so Runner creates and controls an issue window only on its exact selected tmux server and session.

## Scope

This component applies to invoking-context capture, standalone fallback, `TmuxTargetV2`, `RunSnapshotV6`, events, tmux ports and adapters, run preparation, status, reconcile, resume, attach, logs, stop, cleanup, process pane lineage, Doctor `command.tmux`, rendering, isolated-socket fixtures, and operator documentation. It does not authorize arbitrary server/session/window adoption, retain raw context evidence, add polling, change completion authority, or add a network service.

## Definition

### Rules
- Treat exactly absent `TMUX` and `TMUX_PANE` as outside-tmux fallback. Treat partial presence or any malformed, stale, nested, contradictory, or ambiguous evidence as refusal before lock, snapshot, standalone ownership, server, session, window, pane, or process mutation.
- Parse invoking values only at the command boundary with a closed grammar. Use the tuple socket and pane locator only for one bounded validation query; require one canonical socket, socket filesystem identity, current session ID/name, window ID, and pane ID. Never use or retain the tuple server PID as identity.
- Derive fallback socket and session names deterministically from canonical owner/repository identity with a bounded collision-resistant token. Keep repositories with distinct identities on distinct targets even when legacy normalization collides.
- Create or reuse a fallback server/session only when atomic repository ownership metadata, canonical socket path, socket filesystem identity, and observed session agree. Never interpret missing invoking evidence as permission to inspect or adopt another server.
- Refuse any pre-existing expected-name issue window unless the current run already persists and exactly observes its complete `TmuxTargetV2`. Name, cwd, command, pane PID, or partial identity never establishes ownership.
- Persist `TmuxTargetV2` with mode, canonical socket path, socket device/inode, session ID/name, window ID/name, pane ID, and cwd in `RunSnapshotV6` and complete v2 transition events. Keep v1-v5 readable but non-authorizing for tmux mutation without an explicit proved migration.
- Prefix every runtime tmux client command with `-S` and the persisted socket. Address lifecycle operations by immutable session/window/pane IDs, not ambient context or names. Omit inherited `TMUX`, `TMUX_PANE`, and unrelated environment entries from child commands.
- Observe the complete target once per reconciliation boundary with a closed record containing socket/session/window/pane selectors, current cwd, and strict pane-dead flag. Return live match only for complete identity and cwd equality. Return exact dead only for complete selector equality, dead=true, empty current cwd, and complete persisted cwd; return complete absence for a nonzero exact-target query and unknown for malformed zero-exit or unavailable proof. Never mix fields from separate observations.
- Allow attach, live logs, resume, and stop lineage only from a complete live match. Allow explicit cleanup from a complete live match or exact dead observation only after all independent cleanup facts agree. Capture only the exact pane, attach/select only a live exact pane, and remove only the immutable window ID on the persisted socket. Dead-pane status alone never authorizes mutation.
- Make repeated absent stop/cleanup idempotent only when terminal state or same-owner cleanup progress already proves the absence. Refuse attach, logs, resume, or unproved cleanup on absent, mismatched, or unknown targets without tmux mutation.
- Preserve same-issue atomic admission before target mutation. During cleanup/status or cleanup/reconcile overlap, serialize durable ownership/progress and use one atomic tmux observation so each result contains either one complete pre-cleanup target or complete absence.
- Keep raw `TMUX`/`TMUX_PANE` values, raw resolver output, server PID, client data, inherited unrelated values, and malformed sentinels ephemeral. Never include them in snapshots, events, diagnostics, logs, human output, or JSON output. Render only closed mode/reason enums and bounded counts. Also exclude persisted socket paths, session/window/pane identifiers, working directories, process identifiers, and unrelated-resource values from every public human or JSON status, reconciliation, control, and cleanup view.
- Preserve Doctor 24 ordered IDs and private mechanics probe. Add a read-only `command.tmux` targeting classification using the shared resolver, never mutate an invoking or fallback target, and prove before/after ambient and unrelated inventories unchanged.
- Treat a missing socket during targeting inventory as one stable empty inventory. Do not invoke tmux, create the socket/server, or convert absence into a targeting failure.
- For Doctor targeting inventory only, classify an existing queried socket as stable absence when one explicit-`-S` query completes nonzero with zero stdout and exact original-byte stderr `no server running on <queried-socket><LF>`. Require complete bounded stderr, valid UTF-8, and equal socket type/device/inode before and after; include that identity in ephemeral comparison so deletion or replacement cannot compare equal.
- Treat every other timeout, nonzero exit, malformed or additional stderr, stdout or stderr overflow, malformed inventory, inaccessible identity, post-query identity loss, and device/inode replacement as typed unavailable proof. Convert that failure only at the `command.tmux` targeting boundary, preserve every completed non-tmux observation, and expose only the closed value-free targeting classification.
- Execute each targeting inventory once with an explicit `-S` selector and a 2000 ms limit. Drain both command streams while retaining at most 65,536 bytes from each, reject a 65,537th stdout or stderr byte, cap accepted inventories at 1,024 LF-terminated records, and keep all inventory and classification bytes and values ephemeral.
- Use isolated repository-local sockets, sessions, deterministic barriers, and machine-observable inventories for custom-socket, fallback, collision, invalid-context, repeated, overlap, and cleanup proof. Require no credentials, network, Sparkta installation, or ambient default server.

### Interfaces
- `InvokingTmuxEvidenceV1` is an ephemeral command-boundary input containing optional raw `TMUX` and `TMUX_PANE`; it is never serializable.
- `TmuxSelectionV1` is either one validated invoking target, one deterministic owned fallback target, or a typed refusal with a closed value-free reason.
- `TmuxTargetV2` carries selection mode, canonical socket selector and filesystem identity, session ID/name, window ID/name, pane ID, and cwd.
- `TmuxPort` accepts a selected or persisted target for create, name-presence, observe, pane PID, remain-on-exit, capture, restart, remove, and attach operations; no runtime method may infer the server from ambient state.
- `RunSnapshotV6`, `TransitionEventV2`, `PaneLineageV2`, `ReconciliationReportV3`, and `StatusFactsV5` carry or compare the exact target while keeping confidential values out of rendering.
- `DoctorTmuxTargetingEvidenceV1` exposes only mode or closed refusal reason, bounded/timed-out facts, and before/after unchanged booleans.

### Expectations
- A valid custom-socket invocation creates one owned window in the invoking current session and creates none on the default server.
- Repeated clean fallback runs for one repository derive equal server/session names; distinct repository identities derive distinct targets.
- Two servers with identical names and local IDs remain disjoint through every lifecycle command and cleanup.
- Every invalid-context matrix row exits nonzero before mutation with byte-identical run and server inventories.
- Human and JSON rendering agree on match, absence, mismatch, and refusal without exposing target paths or evidence values.
- A valid custom-socket Doctor run with the unrelated/default socket absent samples that absence before and after as equal empty inventory, never invokes or creates the absent server, and retains completed repository, command, and authentication observations.
- A valid custom-socket Doctor run with an existing unrelated stale socket and the exact no-server result classifies the invoking target as valid, compares unchanged stale identity, and creates, deletes, or mutates no socket entry or tmux server.
- Every genuine targeting-inventory failure is value-free and bounded, fails only `command.tmux`, and leaves completed non-tmux observations and repository facts unchanged.
- Concurrent and repeated operations never mutate outside the persisted server/session and never produce a mixed target.

## Rationale

Tmux window and pane IDs are only unique within one server, while ambient variables are untrusted transport evidence rather than durable authority. A validated explicit socket plus socket filesystem identity and immutable tmux IDs supplies the complete target needed for safe recovery. One shared contract keeps selection, persistence, lifecycle routing, Doctor classification, confidentiality, and isolated evidence from drifting.

## Usage Examples

```
valid TMUX + TMUX_PANE -> one read-only exact query -> invoking TmuxTargetV2
no TMUX and no TMUX_PANE -> deterministic repository-owned standalone target
partial/stale/contradictory evidence -> TMUX_CONTEXT_REFUSED, zero mutation
persisted exact target + complete observation match -> lifecycle action eligible
same names on another socket -> mismatch/irrelevant, never adopted
```

## Integration Guidelines

- Capture invoking evidence before applying the generic subprocess environment allowlist, then immediately convert it to a typed selection or refusal.
- Centralize selector derivation, strict parsing, socket canonicalization, filesystem identity, and complete equality.
- Route every tmux argument vector through one helper that prepends the persisted `-S` selector.
- Version persistence and output schemas explicitly; preserve legacy readers without inventing missing server identity.
- Extend controlled adapters with real local isolated-socket integration tests and unconditional exact cleanup.
- Update README, issue-run, recovery, Doctor, docs index, PRD, help/schema examples, and troubleshooting together.

## Exceptions

- None. Ambient fallback after invalid evidence, PID authority, implicit default-server commands, partial target matching, same-name adoption, raw-value retention, and cross-server mutation are prohibited.

## Enforcement

- [x] Automated checks
- [x] Code review checklist
- [x] Test coverage requirements

## Related ADRs

- [ADR-260817-invoking-tmux-context-targeting](../ADR/ADR-260817-invoking-tmux-context-targeting.md)
- [ADR-260814-tmux-identity-failure-recovery](../ADR/ADR-260814-tmux-identity-failure-recovery.md)
- [ADR-260812-repository-doctor-readiness](../ADR/ADR-260812-repository-doctor-readiness.md)
- [ADR-260811-prototype-three-recovery-concurrency](../ADR/ADR-260811-prototype-three-recovery-concurrency.md)
