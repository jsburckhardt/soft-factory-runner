# CORE-COMPONENT-260814-tmux-identity-diagnostics: Tmux Identity Diagnostics

## Status

Adopted

## Purpose

Define one reusable parsing, bounded-diagnostic, persistence, rendering, and retry-safety contract for tmux identities returned during creation and reconciliation. This prevents permissive partial parsing and preserves useful failure structure without retaining command, path, secret, field, or other-run values.

## Scope

This component applies to command-result byte capture, tmux creation and observation adapters, identity parsing, typed failures, RunSnapshotV5 and TransitionEventV2 persistence, reconciliation/status/control rendering, preparation resume, logs independence, deterministic fixtures, and operator documentation. It does not authorize tmux adoption, change process identity, retain pane output, add polling, or inspect the external consumer repository.

## Definition

### Rules

- Parse identity stdout from original bytes before decoding; byte counts MUST be measured before UTF-8 conversion.
- Creation MUST accept exactly one nonempty record with two fields matching `^@[0-9]+$` and `^%[0-9]+$`. Observation MUST accept exactly one nonempty record with those identifiers and one nonempty valid UTF-8 cwd field.
- Use only horizontal tab (`0x09`) as the field separator and LF (`0x0a`) as the record terminator. Permit exactly one optional final LF. Reject CR/CRLF, interior LF, empty required fields, extra records/fields, invalid UTF-8, and partial identifiers.
- Keep original stdout/stderr bytes ephemeral inside command and tmux adapters. MUST NOT place raw output, cwd/path components, command arguments, environment values, field values, issue/owner/run identifiers, hashes, byte values, or bytes from another run in durable or rendered diagnostics.
- Define `TmuxIdentityDiagnosticV1` with `schemaVersion: 1`, phase, integer exit code, original stdout/stderr byte counts, capped record summary, capped per-record field summaries, and a capped stdout structural signature.
- Cap record count at eight with `truncated`; retain at most eight record summaries. Cap each field count at eight with its own `truncated`. Cap signature tokens at 32 with `truncated`.
- Count zero logical records for empty stdout. Otherwise remove at most one terminal LF for counting, split on every remaining LF, count every resulting segment including empty segments, and define each record field count as one plus its horizontal-tab count before applying caps.
- Emit `window_id` or `pane_id` only when an entire nonseparator byte run matches its strict identifier grammar; tokenize all other nonspecial contiguous bytes as `other`.
- Tokenize only as `window_id`, `pane_id`, `horizontal_tab`, `carriage_return`, `line_feed`, `backslash`, or `other`. Collapse each contiguous other-byte run to one `other` token and retain no run length or value.
- Derive a diagnostic for a completed create command that exits nonzero or has malformed/ambiguous identity output. Keep nonzero creation as `EXTERNAL_COMMAND_FAILED`; use `TMUX_IDENTITY_MALFORMED` for rejected zero-exit identity output.
- Treat a nonzero observation as target absence and do not create or replace an identity diagnostic. Treat malformed/ambiguous zero-exit observation as unknown with `TMUX_IDENTITY_MALFORMED` and its bounded diagnostic. Treat spawn/timeout failures as existing external-command unknowns without invented byte facts.
- Persist only the latest diagnostic in nullable `RunSnapshotV5.tmuxIdentityDiagnostic`. Replace it on a later identity failure for the same owned run. Clear it only after accepting a valid create or observe identity; rendering or absence MUST NOT clear it.
- Persist a creation parse failure as a revisioned `starting_tmux` transition while preserving exact lock, lease, branch, and worktree ownership. Persist a malformed observation after the one collected reconciliation pass without a second external observation.
- Expose the diagnostic through `ReconciliationReportV2`, status schema version 4, control reports, and human output derived from the same facts. Human output MUST identify retained malformed or ambiguous tmux identity evidence and MUST NOT recommend a tmux upgrade.
- Authorize a `starting_tmux` retry only when lock/lease match; worktree path, registration, branch, fetched-base HEAD, and cleanliness match; no identity is persisted; and one name-only observation proves zero same-name windows.
- Refuse resume when any same-name window exists without persisted identity. Preserve it and MUST NOT infer ownership from name, cwd, pane identity, or process command. The create adapter MUST repeat the name-only absence precondition immediately before its sole create attempt.
- Keep identity diagnostics non-authorizing and distinct from logs. With no persisted tmux identity or transcript, `LOG_NOT_FOUND` remains unchanged.
- Perform at most one observation at each reconciliation boundary per invocation, with no polling or hidden retry. A later operator invocation is the only retry.

### Interfaces

- `CommandResult` exposes decoded stdout/stderr for existing adapters plus ephemeral original byte buffers and exact byte counts.
- `TmuxIdentityDiagnosticV1` exposes only bounded numeric counts, truncation flags, phase, exit code, and the closed token vocabulary.
- `TmuxPort` exposes exact create/observe operations plus a bounded name-only presence observation that returns no candidate identity or cwd.
- Typed tmux identity failures carry a safe diagnostic to orchestration and reconciliation without raw command details.
- `RunSnapshotV5` adds `tmuxIdentityDiagnostic`; `TransitionEventV2` may carry a complete v5 resulting snapshot.
- `ReconciliationReportV2` and status schema version 4 expose the retained diagnostic separately from current tmux observation and safe actions.

### Expectations

- The tmux 3.7b creation bytes `40 31 09 25 31 0a` decode to `@1` and `%1`; observation bytes `40 31 09 25 31 09 2f 74 6d 70 0a` decode to those IDs and `/tmp`.
- Empty, short, extra-field, multi-record, malformed-window-ID, and malformed-pane-ID matrices fail for both create and observe without partial acceptance.
- Secret/path sentinel scans find no raw output or field values in errors, snapshots, events, reports, logs, or human/JSON output.
- A zero-candidate exact preparation retries one window creation and creates no duplicate lock, lease, branch, worktree, worker, or RPIV process.
- A same-name candidate causes zero create, worker, or RPIV launch calls and leaves every owned and unknown resource unchanged.

## Rationale

Tmux identity output crosses subprocess execution, parser, persistence, recovery, rendering, and testing boundaries. Original bytes are required for truthful counts and delimiter classification, while a closed value-free summary supplies operational evidence without turning command output into durable consumer data. Exact Git and name-absence proof preserves retryability without weakening unknown-resource safety or one-pass reconciliation.

## Usage Examples

```
valid create bytes:  @1<TAB>%1<LF>       -> window @1, pane %1
malformed bytes:     @1<TAB>%1<TAB>x<LF> -> TMUX_IDENTITY_MALFORMED
retained signature:  [window_id, horizontal_tab, pane_id, horizontal_tab, other, line_feed]
same-name candidate: present             -> RESOURCE_OWNERSHIP_UNKNOWN, no create
```

## Integration Guidelines

- Centralize byte parsing and diagnostic construction so creation and observation cannot drift.
- Preserve raw buffers only until typed identity or bounded diagnostic construction completes.
- Persist identity failures through the existing event-before-snapshot store and never mutate snapshots directly.
- Build preparation authorization from the shared reconciliation report, including fetched-base HEAD, dirtiness, and name-only tmux facts.
- Reuse one collected report per command; do not recollect after persisting an observation diagnostic.
- Update README, issue-run guidance, recovery operations, troubleshooting, schema migration notes, and documentation assertions together.
- Use temporary repositories and controlled command/tmux/process adapters; never use credentials, Sparkta, live GitHub, live Copilot, or ambient tmux resources.

## Exceptions

- None. Alternate separators, raw-output retention, same-name adoption, hidden retry, or value-bearing signatures are not permitted.

## Enforcement

- [x] Automated checks
- [x] Code review checklist
- [x] Test coverage requirements

## Related ADRs

- [ADR-260814-tmux-identity-failure-recovery](../ADR/ADR-260814-tmux-identity-failure-recovery.md)
- [ADR-260811-prototype-three-recovery-concurrency](../ADR/ADR-260811-prototype-three-recovery-concurrency.md)
- [ADR-260811-prototype-one-run-orchestration](../ADR/ADR-260811-prototype-one-run-orchestration.md)
