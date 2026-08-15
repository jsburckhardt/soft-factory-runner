# ADR-260814-tmux-identity-failure-recovery: Tmux Identity Failure Recovery

## Status

Accepted

## Context

Runner creates a tmux window before it can persist the returned window and pane identities. Malformed creation or observation output must remain value-free, non-authorizing evidence, and a creation retry remains safe only under the exact lock, lease, Git, worktree, name-absence, and one-attempt proof adopted for Issue #29.

The original decision relied on horizontal tab by itself as the field separator. Issue #31 demonstrates that tmux 3.7b sanitizes that control byte for a non-UTF8 command client, producing a complete zero-exit, six-byte, LF-terminated creation record with no tab. Normal issue-window creation and observation and the isolated Doctor probe use the same transport, so the fix must be one closed byte grammar that does not depend on tmux client UTF8 mode.

## Decision

Keep original-byte parsing and the existing typed failure boundary, but replace control-byte field framing with printable ASCII vertical bar (`|`, byte `0x7c`). Emit that same format from normal `LiveTmuxPort` create/observe and Doctor create/observe. Do not add a sanitized-output alternative, infer separators, or require ambient locale, `TMUX`, or tmux `-u` to decode identity.

The closed accepted records are:

- create: `@<digits>|%<digits><LF>`, where the first identifier matches `^@[0-9]+$` and the second matches `^%[0-9]+$`;
- observe: `@<digits>|%<digits>|<cwd><LF>`, where `<cwd>` is nonempty valid UTF-8 and contains no NUL, CR, or LF.

Exactly one terminal LF is required. A missing terminal LF, any interior LF, any additional terminator, and any CR or CRLF is malformed. Creation requires exactly one vertical bar and rejects any additional separator. Observation finds only the first two vertical bars, validates the two preceding identifiers as whole fields, and retains every remaining cwd byte exactly. A vertical bar inside an arbitrary valid UTF-8 cwd is therefore cwd data, not a fourth field. Missing framing, empty or invalid ID fields, empty or invalid cwd, structural bytes that attempt another printable or control separator, and appended records are malformed.

Require observed window and pane IDs to match the exact creation IDs and require observed cwd to match expected cwd at the owning normal or Doctor boundary. Keep nonzero observation as absence and malformed zero-exit observation as unknown.

Keep `TmuxIdentityDiagnosticV1` schema version 1, the eight-record, eight-field, and 32-token caps, and the value-free confidentiality boundary. Count vertical-bar bytes for field summaries, add `vertical_bar` to the closed signature vocabulary, and retain `horizontal_tab` to classify rejected legacy/control-separator bytes in old and new diagnostics. Never persist raw bytes, byte values, identities, cwd, or command context.

Preserve `RunSnapshotV5`, one-pass reconciliation, exact ownership and lineage, zero-adoption, zero-same-name retry authorization, the immediate name-absence recheck, and the single creation-attempt bound. An identity or diagnostic never authorizes ownership, adoption, retry, signaling, or cleanup.

## Alternatives

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Keep HT and force `tmux -u` | Smaller parser change | Converts every client to UTF-8 mode and retains control-byte framing | Does not prove the transport in both client modes |
| Accept both HT and sanitized underscore | Appears compatible with the incident | Underscore is ordinary printable data and sanitization is not a stable identity protocol | Would accept ambiguous or partial identity evidence |
| Escape or length-prefix every field | Fully self-describing framing | More complex format and cwd copying/decoding | Strict ID grammars make the first two printable separators unambiguous |
| Split observation on every vertical bar | Simple generic split | Rejects or alters a valid cwd containing the delimiter | Violates exact cwd retention |

## Consequences

### Positive
- Printable framing survives both tmux client modes without permissive sanitized-output acceptance.
- Creation and observation share one finite grammar across normal and Doctor paths.
- Arbitrary valid UTF-8 cwd containing vertical bar round-trips without escaping.

### Negative
- HT-delimited output and the previously optional terminal-LF form become invalid.
- Fixtures and documentation must migrate coherently and model non-UTF8 control-byte sanitization.

### Neutral
- Locale configuration, run snapshots, Doctor check IDs, timing, cleanup milestones, and public service boundaries do not change.

## Related Issues

- [#29](https://github.com/jsburckhardt/soft-factory-runner/issues/29)
- [#31](https://github.com/jsburckhardt/soft-factory-runner/issues/31)

## References

- [Prototype Three Recovery and Explicit Concurrency](ADR-260811-prototype-three-recovery-concurrency.md)
- [Repository Doctor Readiness Architecture](ADR-260812-repository-doctor-readiness.md)
- [Tmux Identity Diagnostics](../core-components/CORE-COMPONENT-260814-tmux-identity-diagnostics.md)
- [tmux 3.7b source](https://github.com/tmux/tmux/tree/3.7b)
