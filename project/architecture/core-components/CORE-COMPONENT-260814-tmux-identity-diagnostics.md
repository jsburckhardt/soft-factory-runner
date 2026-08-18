# CORE-COMPONENT-260814-tmux-identity-diagnostics: Tmux Identity Diagnostics

## Status

Adopted

## Purpose

Define one portable parsing, bounded-diagnostic, persistence, rendering, and retry-safety contract for tmux identities returned during creation and reconciliation. The contract prevents permissive partial parsing, remains invariant across tmux UTF8 and non-UTF8 client modes, and preserves useful failure structure without retaining command, path, secret, field, or other-run values.

## Scope

This component applies to command-result byte capture, normal `LiveTmuxPort` creation and observation, isolated Doctor creation and observation, shared identity parsing, typed failures, `RunSnapshotV6` and `TransitionEventV2` persistence, reconciliation/status/control rendering, preparation resume, deterministic fixtures, and operator documentation. It does not authorize tmux adoption, change process identity, retain pane output, add polling, inherit ambient locale or tmux state, or inspect an external consumer repository.

## Definition

### Rules

- Parse identity stdout from original bytes before decoding; measure byte counts before UTF-8 conversion.
- Emit printable ASCII vertical bar (`|`, byte `0x7c`) as the only structural field separator for normal and Doctor create and observe commands.
- Accept creation only as `@<digits>|%<digits><LF>` with whole-field `^@[0-9]+$` and `^%[0-9]+$` grammars.
- Accept observation only as `@<digits>|%<digits>|<cwd><LF>`. Find the first two vertical bars only and retain every remaining cwd byte, including any vertical bar, exactly.
- Require cwd to be nonempty valid UTF-8 with no NUL, CR, or LF. Require the observed IDs and cwd to equal the expected creation IDs and cwd at the owning boundary.
- Require exactly one terminal LF. Reject empty output, absent or extra create fields, missing observation framing, empty or invalid IDs, empty or invalid cwd, missing or extra terminators, interior LF, CR/CRLF, multiple records, and printable or control bytes used as unsupported structural separators.
- Treat a vertical bar after the second observation separator as cwd data rather than an extra field. Never split or normalize cwd content after that separator.
- Keep original stdout/stderr bytes ephemeral inside command and tmux adapters. Never place raw output, cwd/path components, command arguments, environment values, field values, issue/owner/run identifiers, hashes, byte values, or bytes from another run in durable or rendered diagnostics.
- Define `TmuxIdentityDiagnosticV1` with `schemaVersion: 1`, phase, integer exit code, original stdout/stderr byte counts, capped record summary, capped per-record field summaries, and a capped stdout structural signature.
- Cap record count at eight and retain at most eight record summaries. Cap each separator-derived field count at eight. Cap signature tokens at 32. Mark every exceeded cap with its existing truncation flag.
- Count zero logical records for empty stdout. Otherwise remove at most the one terminal LF for diagnostic counting, split on every remaining LF, and include empty segments. Count vertical bars for field summaries.
- Tokenize only as `window_id`, `pane_id`, `vertical_bar`, `horizontal_tab`, `carriage_return`, `line_feed`, `backslash`, or `other`. Preserve `horizontal_tab` for rejected legacy/control transport and persisted diagnostic compatibility. Collapse each contiguous other-byte run to one token and retain no run length or value.
- Continue to read the legacy schema-v1 tokens `window_id`, `pane_id`, `horizontal_tab`, `carriage_return`, `line_feed`, `backslash`, or `other`; add `vertical_bar` without invalidating an already-persisted diagnostic.
- Derive a diagnostic for a completed create command that exits nonzero or has malformed identity output. Keep nonzero creation as `EXTERNAL_COMMAND_FAILED`; use `TMUX_IDENTITY_MALFORMED` for rejected zero-exit identity output.
- Classify exact-target nonzero observation from original bytes. Accept only a completed, untruncated result with zero stdout and exactly one LF-terminated stderr record in the `can't find pane`, `can't find window`, or `can't find session` category whose strict identifier equals the corresponding persisted selector. Return that bounded category to reconciliation without raw bytes or values.
- Treat every other nonzero observation, malformed or truncated response, extra stdout/stderr record, mismatched selector, spawn failure, and timeout as non-authorizing unknown evidence. A missing-target category becomes absence only at the same-owner/run exact-checkpoint and unchanged-socket reconciliation boundary.
- Persist only the latest diagnostic in nullable `RunSnapshotV6.tmuxIdentityDiagnostic`. Replace it on a later identity failure for the same owned run. Clear it only after valid create or observe identity proof.
- Persist a creation parse failure as a revisioned `starting_tmux` transition while preserving exact lock, lease, branch, and worktree ownership. Persist malformed observation after the one collected reconciliation pass without a second observation.
- Keep diagnostics non-authorizing and distinct from logs. Retained identity evidence alone never authorizes ownership, retry, adoption, signaling, or cleanup and never satisfies `logs`.
- Authorize `starting_tmux` retry only when exact lock/lease, worktree path/registration/branch, fetched-base HEAD, cleanliness, no persisted identity, and zero same-name candidates are proved. Repeat name absence immediately before one create attempt.
- Refuse any same-name resource without persisted identity. Preserve it without inspecting or inferring ownership from name, cwd, pane identity, or process command.
- Perform at most one observation at each reconciliation boundary per invocation, with no polling or hidden retry. Read socket type/device/inode before and after a potentially accepted missing-target query and reject identity loss or replacement.

### Interfaces

- `CommandResult` exposes decoded stdout/stderr plus ephemeral original buffers and exact byte counts.
- `TmuxIdentityDiagnosticV1` exposes only bounded numeric counts, truncation flags, phase, exit code, and the closed value-free token vocabulary.
- `TmuxPort` exposes exact create/observe operations plus bounded name-only presence observation.
- Normal and Doctor adapters import one shared transport format and parser rather than duplicating delimiter grammar.
- Typed tmux identity failures carry a safe diagnostic to orchestration and Doctor without raw command details.
- `RunSnapshotV6`, `TransitionEventV2`, `ReconciliationReportV3`, and status schema version 5 preserve the existing bounded diagnostic lifecycle while exact target authority remains governed by `CORE-COMPONENT-260817-exact-tmux-context-ownership`.

### Expectations

- The finite accepted creation form is `@1|%1<LF>`; the finite accepted observation form is `@1|%1|/tmp<LF>`, with arbitrary valid UTF-8 cwd suffix bytes retained exactly.
- A controlled non-UTF8 tmux client sanitizer changes the former HT format but leaves the printable vertical-bar records unchanged.
- UTF-8 and non-UTF8 client-state matrix rows each create exactly one identity and observe those exact IDs and expected cwd, then repeat with the same resource inventory.
- Empty, missing-field, extra-create-field, multi-record, malformed-ID, empty/invalid-cwd, terminator, unsupported-printable-separator, and unsupported-control-separator matrices fail without partial acceptance.
- Bounded sentinel scans find no raw output or values in errors, snapshots, events, reports, logs, Doctor evidence, or human/JSON output.
- Overlapping distinct normal flows and overlapping Doctor probes return only their own identities and leave disjoint or absent resource inventories.
- A finite nonzero matrix accepts only the three exact selector-bound missing-target categories after checkpoint proof and refuses every other row without mutation or value disclosure.

## Rationale

A printable ASCII delimiter is stable under both tmux client output modes, while strict identifier prefixes make the first two boundaries unambiguous. Parsing only those boundaries avoids escaping or modifying cwd. One shared original-byte parser and one closed value-free diagnostic vocabulary prevent normal, Doctor, persistence, and rendering behavior from drifting.

## Usage Examples

```
valid create bytes:  @1|%1<LF>                 -> window @1, pane %1
valid observe bytes: @1|%1|/tmp/a|b<LF>        -> cwd /tmp/a|b
legacy HT bytes:     @1<TAB>%1<LF>             -> TMUX_IDENTITY_MALFORMED
same-name candidate: present                   -> RESOURCE_OWNERSHIP_UNKNOWN, no create
```

## Integration Guidelines

- Centralize format constants, byte parsing, and diagnostic construction so normal and Doctor paths cannot drift.
- Preserve raw buffers only until typed identity or bounded diagnostic construction completes.
- Model tmux client mode and control-byte sanitization in repository-controlled fixtures rather than using ambient locale or live tmux.
- Persist identity failures through event-before-snapshot storage and reuse one collected report per command.
- Preserve exact creation/observation equality, ownership, lineage, retry, cleanup, and confidentiality contracts.
- Update README, issue-run, recovery, Doctor, fixture, and troubleshooting documentation together.

## Exceptions

- None. HT framing, inferred or sanitized alternate forms, raw-output retention, same-name adoption, hidden retry, and value-bearing signatures are prohibited.

## Enforcement

- [x] Automated checks
- [x] Code review checklist
- [x] Test coverage requirements

## Related ADRs

- [ADR-260814-tmux-identity-failure-recovery](../ADR/ADR-260814-tmux-identity-failure-recovery.md)
- [ADR-260812-repository-doctor-readiness](../ADR/ADR-260812-repository-doctor-readiness.md)
- [ADR-260811-prototype-three-recovery-concurrency](../ADR/ADR-260811-prototype-three-recovery-concurrency.md)
- [ADR-260817-invoking-tmux-context-targeting](../ADR/ADR-260817-invoking-tmux-context-targeting.md)
