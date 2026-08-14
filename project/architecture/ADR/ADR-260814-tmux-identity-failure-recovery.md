# ADR-260814-tmux-identity-failure-recovery: Tmux Identity Failure Recovery

## Status

Accepted

## Context

Runner creates a tmux window before it can persist the returned window and pane identities. The live adapter currently parses decoded strings permissively, cannot report original byte counts, and loses malformed creation or observation structure before a later repository-owned status or reconciliation call. A malformed creation during `resume` can therefore leave an exactly owned run at `starting_tmux` without enough safe evidence to explain the failure. Retrying remains safe only when the issue lock, concurrency lease, branch, worktree registration/path/HEAD/cleanliness, and absence of any same-name tmux window are all proved without adopting resources by name.

The accepted recovery architecture also requires one bounded observation per reconciliation attempt, strict versioned persistence, common human/JSON meaning, and preservation of unknown tmux resources. The supplied tmux 3.7b fixtures prove the existing horizontal-tab and LF format, so changing separators or recommending a tmux upgrade is unsupported.

## Decision

Parse tmux creation and observation identity output from the original stdout bytes before UTF-8 decoding. Extend the typed command result with ephemeral original stdout/stderr bytes and byte counts while retaining decoded strings for existing adapters. Raw bytes remain inside the command/tmux adapter boundary and are never placed in errors, snapshots, events, logs, reconciliation facts, or rendered output.

Accept creation only as one nonempty record containing exactly `^@[0-9]+$`, horizontal tab, and `^%[0-9]+$`. Accept observation only as one nonempty record containing those two identifiers plus one nonempty, valid UTF-8 cwd field. Horizontal tab (`0x09`) is the only field separator, LF (`0x0a`) is the only record terminator, and exactly one optional final LF is allowed. Reject CR, CRLF, additional records or fields, empty required fields, invalid UTF-8, and partial identifiers as malformed or ambiguous identity output.

For every completed create command and every zero-exit observation whose identity cannot be accepted, derive `TmuxIdentityDiagnosticV1` from the original bytes. It records phase (`create` or `observe`), exit code, original stdout/stderr byte counts, a logical record count capped at eight plus truncation, up to eight per-record field counts capped at eight plus per-record truncation, and an stdout-only signature capped at 32 tokens plus truncation. Signature tokens are the closed value-free vocabulary `window_id`, `pane_id`, `horizontal_tab`, `carriage_return`, `line_feed`, `backslash`, and `other`; contiguous other bytes collapse to one token and no token records a value, path, byte value, hash, or run identity. A nonzero observation remains absence and produces no identity diagnostic. Spawn failures and timeouts remain external-command unknowns because no completed result exists. A nonzero creation remains an external-command failure but retains its bounded create diagnostic.

Introduce `RunSnapshotV5` with one nullable latest tmux identity diagnostic. New runs write v5; supported v4 snapshots normalize through an explicit revisioned transition, and versions 1 through 5 remain readable under their existing safety limits. Retain `TransitionEventV2` because its revision-chain envelope is unchanged, while extending its complete resulting-snapshot union to v5. Expose the diagnostic explicitly through `ReconciliationReportV2` and status schema version 4. The diagnostic is replaced by a later identity failure for the same owned run, is not cleared merely by rendering or by an absence result, and is cleared only after a valid creation or observation identity is accepted. Append-only events may retain earlier already-bounded diagnostic revisions.

Route adapter identity failures as typed safe failures to the orchestration/reconciliation boundary. A creation failure at `starting_tmux` persists the diagnostic in the same preparation state and preserves the lock and lease instead of converting the run to a terminal state. A malformed successful observation becomes an unknown tmux observation carrying the same diagnostic; the owning service persists that diagnostic after the single collected observation pass and returns the report without polling or recollecting. Human rendering says that retained tmux identity evidence was malformed or ambiguous and never recommends upgrading tmux.

Authorize `PREPARATION_RESUME_AVAILABLE` for `starting_tmux` only when lock and lease match, the worktree path and registration match, the branch matches, HEAD equals the persisted fetched-base advertised SHA, staged/unstaged/untracked cleanliness is proved, no tmux identity is persisted, and one bounded name-only observation reports zero same-name windows. `resume` consumes that one report, then permits exactly one create attempt; the create adapter repeats its same-name precondition immediately before mutation to close the action race. Any same-name window is unknown ownership, authorizes no resume, is never inspected for cwd/process/identity adoption, and is preserved unchanged.

Keep diagnostics independent of logs and authorization. With no persisted tmux identity or transcript, `logs` still returns `LOG_NOT_FOUND`. A retained diagnostic neither authorizes nor blocks an otherwise exact action; current lock, lease, Git, tmux-name, process, and result observations alone determine safe actions. All repository fixtures remain credential-free and avoid live consumer systems.

## Alternatives

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Parse decoded strings and reconstruct byte counts | Small command-result change | Invalid or multibyte UTF-8 makes original lengths and structure unrecoverable | Acceptance requires original byte counts and byte classes |
| Persist redacted raw stdout/stderr | Rich incident evidence | Redaction cannot prove removal of paths, values, secrets, or other-run data | Durable evidence must be structural and value-free |
| Add an optional diagnostic field to RunSnapshotV4 | Less migration code | Changes a strict persisted schema without changing its version | Violates versioned persistence semantics |
| Retry whenever `starting_tmux` has no persisted identity | Simple recovery | A created-but-unparsed same-name window could be duplicated or adopted unsafely | Retry requires zero candidates and exact ownership proof |
| Treat every nonzero tmux observation as malformed output | Uniform diagnostic path | tmux already uses nonzero to report an absent target | Absence and malformed successful output require distinct recovery semantics |
| Poll until tmux identity becomes parseable | May hide transient output | Weakens one-pass reconciliation and makes recovery timing-dependent | Operator retries must remain explicit |

## Consequences

### Positive
- Later status and reconciliation expose useful bounded structure without retaining command or consumer data.
- Preparation retry distinguishes a disappeared failed window from an unknown surviving same-name window.
- Original byte counts and separators remain exact even for invalid UTF-8.
- Existing one-pass reconciliation and `LOG_NOT_FOUND` semantics remain intact.

### Negative
- Command results temporarily carry raw byte buffers inside the adapter boundary.
- Snapshot, status, reconciliation, event validation, rendering, and legacy migration gain another versioned shape.
- Reconciliation needs a name-only tmux observation when `starting_tmux` has no persisted identity.

### Neutral
- Valid tmux 3.7b tab/LF output and successful preparation behavior do not change.
- A valid identity followed by a disappearing worker remains governed by existing process-observation recovery.
- Unknown same-name windows continue to require operator resolution rather than automatic adoption.

## Related Issues

- [#29](https://github.com/jsburckhardt/soft-factory-runner/issues/29)

## References

- [Prototype Three Recovery and Explicit Concurrency](ADR-260811-prototype-three-recovery-concurrency.md)
- [Prototype One Issue Run Orchestration](ADR-260811-prototype-one-run-orchestration.md)
- [Tmux Identity Diagnostics](../core-components/CORE-COMPONENT-260814-tmux-identity-diagnostics.md)
- [Run Reconciliation and Control](../core-components/CORE-COMPONENT-260811-run-reconciliation-control.md)
- [Subprocess Execution](../core-components/CORE-COMPONENT-260810-subprocess-execution.md)
