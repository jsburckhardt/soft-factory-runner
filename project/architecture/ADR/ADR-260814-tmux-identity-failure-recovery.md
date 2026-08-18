# ADR-260814-tmux-identity-failure-recovery: Tmux Identity Failure Recovery

## Status

Accepted

## Context

Runner creates a tmux window before it can persist the returned window and pane identities. Malformed creation or observation output must remain value-free, non-authorizing evidence, and a creation retry remains safe only under the exact lock, lease, Git, worktree, name-absence, and one-attempt proof adopted for Issue #29.

The original decision relied on horizontal tab by itself as the field separator. Issue #31 demonstrates that tmux 3.7b sanitizes that control byte for a non-UTF8 command client, producing a complete zero-exit, six-byte, LF-terminated creation record with no tab. Normal issue-window creation and observation and the isolated Doctor probe use the same transport, so the fix must be one closed byte grammar that does not depend on tmux client UTF8 mode.

Issue #44 demonstrates that treating every completed nonzero exact-target observation as absence is too broad and that retrying from a removed worktree can fail before the remaining lease and lock are released. The safe boundary must distinguish a checkpoint-proved removal from pre-checkpoint absence and every unrelated nonzero failure.

## Decision

Keep original-byte parsing and the existing typed failure boundary, but replace control-byte field framing with printable ASCII vertical bar (`|`, byte `0x7c`). Emit that same format from normal `LiveTmuxPort` create/observe and Doctor create/observe. Do not add a sanitized-output alternative, infer separators, or require ambient locale, `TMUX`, or tmux `-u` to decode identity.

The closed accepted records are:

- create: `@<digits>|%<digits><LF>`, where the first identifier matches `^@[0-9]+$` and the second matches `^%[0-9]+$`;
- observe: `@<digits>|%<digits>|<cwd><LF>`, where `<cwd>` is nonempty valid UTF-8 and contains no NUL, CR, or LF.

Exactly one terminal LF is required. A missing terminal LF, any interior LF, any additional terminator, and any CR or CRLF is malformed. Creation requires exactly one vertical bar and rejects any additional separator. Observation finds only the first two vertical bars, validates the two preceding identifiers as whole fields, and retains every remaining cwd byte exactly. A vertical bar inside an arbitrary valid UTF-8 cwd is therefore cwd data, not a fourth field. Missing framing, empty or invalid ID fields, empty or invalid cwd, structural bytes that attempt another printable or control separator, and appended records are malformed.

Require observed window and pane IDs to match the exact creation IDs and require observed cwd to match expected cwd at the owning normal or Doctor boundary. For exact-target lifecycle observation, replace broad nonzero-as-absence behavior with checkpoint-gated classification. Accept only a completed, untruncated command with zero stdout and exactly one LF-terminated original-byte stderr record in the `can't find pane`, `can't find window`, or `can't find session` category whose strict identifier equals the corresponding persisted selector. Treat that classification as complete absence only when same-owner/run cleanup progress contains the exact tmux started or completed checkpoint and socket type/device/inode match both before and after the query. Treat pre-checkpoint missing-target responses, socket identity loss or replacement, spawn failure, timeout, malformed or truncated streams, extra bytes or records, mismatched selectors, and every other nonzero result as non-authorizing refusal evidence.

Run retry observations from a stable existing repository directory rather than the removed persisted worktree cwd. Keep each observation one-pass and bounded; do not poll, hide retries, or retain raw diagnostics.

Keep `TmuxIdentityDiagnosticV1` schema version 1, the eight-record, eight-field, and 32-token caps, and the value-free confidentiality boundary. Count vertical-bar bytes for field summaries, add `vertical_bar` to the closed signature vocabulary, and retain `horizontal_tab` to classify rejected legacy/control-separator bytes in old and new diagnostics. Never persist raw bytes, byte values, identities, cwd, or command context.

Preserve `RunSnapshotV5`, one-pass reconciliation, exact ownership and lineage, zero-adoption, zero-same-name retry authorization, the immediate name-absence recheck, and the single creation-attempt bound. An identity or diagnostic never authorizes ownership, adoption, retry, signaling, or cleanup.

## Alternatives

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Keep HT and force `tmux -u` | Smaller parser change | Converts every client to UTF-8 mode and retains control-byte framing | Does not prove the transport in both client modes |
| Accept both HT and sanitized underscore | Appears compatible with the incident | Underscore is ordinary printable data and sanitization is not a stable identity protocol | Would accept ambiguous or partial identity evidence |
| Escape or length-prefix every field | Fully self-describing framing | More complex format and cwd copying/decoding | Strict ID grammars make the first two printable separators unambiguous |
| Split observation on every vertical bar | Simple generic split | Rejects or alters a valid cwd containing the delimiter | Violates exact cwd retention |
| Keep every nonzero observation as absence | Small adapter change | Accepts unrelated failures and server replacement as removal proof | Absence must be exact, bounded, checkpoint-gated, and identity-stable |
| Accept missing-target text before cleanup checkpoint | Makes stale runs look recoverable | Cannot prove Runner removed the persisted target | Pre-checkpoint absence remains non-authorizing |

## Consequences

### Positive
- Printable framing survives both tmux client modes without permissive sanitized-output acceptance.
- Creation and observation share one finite grammar across normal and Doctor paths.
- Arbitrary valid UTF-8 cwd containing vertical bar round-trips without escaping.

### Negative
- HT-delimited output and the previously optional terminal-LF form become invalid.
- Exact-target nonzero handling now requires original-byte category parsing, before/after socket identity, and cleanup checkpoint context.
- Fixtures and documentation must migrate coherently and model non-UTF8 control-byte sanitization.

### Neutral
- Locale configuration, run snapshot schema, Doctor check IDs, timing, cleanup milestones, and public service boundaries do not change.
- The correction is released locally as `0.2.1-beta.3`; visible Sparkta recovery remains a deferred operator action after repository proof.

## Related Issues

- [#29](https://github.com/jsburckhardt/soft-factory-runner/issues/29)
- [#31](https://github.com/jsburckhardt/soft-factory-runner/issues/31)
- [#44](https://github.com/jsburckhardt/soft-factory-runner/issues/44)

## References

- [Prototype Three Recovery and Explicit Concurrency](ADR-260811-prototype-three-recovery-concurrency.md)
- [Repository Doctor Readiness Architecture](ADR-260812-repository-doctor-readiness.md)
- [Tmux Identity Diagnostics](../core-components/CORE-COMPONENT-260814-tmux-identity-diagnostics.md)
- [tmux 3.7b source](https://github.com/tmux/tmux/tree/3.7b)
