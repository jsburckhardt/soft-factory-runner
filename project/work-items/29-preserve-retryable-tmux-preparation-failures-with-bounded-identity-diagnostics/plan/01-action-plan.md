# Action Plan: Preserve retryable tmux preparation failures with bounded identity diagnostics

## Feature
- **ID:** 29
- **Research Brief:** project/work-items/29-preserve-retryable-tmux-preparation-failures-with-bounded-identity-diagnostics/research/00-research.md

## ADRs Created
- Created: [ADR-260814-tmux-identity-failure-recovery](../../../architecture/ADR/ADR-260814-tmux-identity-failure-recovery.md)
- Relevant existing: [ADR-260811-prototype-one-run-orchestration](../../../architecture/ADR/ADR-260811-prototype-one-run-orchestration.md)
- Relevant existing: [ADR-260811-prototype-three-recovery-concurrency](../../../architecture/ADR/ADR-260811-prototype-three-recovery-concurrency.md)
- Relevant existing: [ADR-260811-engineering-harness-surface](../../../architecture/ADR/ADR-260811-engineering-harness-surface.md)

## Core-Components Created
- Created: [CORE-COMPONENT-260814-tmux-identity-diagnostics](../../../architecture/core-components/CORE-COMPONENT-260814-tmux-identity-diagnostics.md)
- Updated: [CORE-COMPONENT-260811-run-reconciliation-control](../../../architecture/core-components/CORE-COMPONENT-260811-run-reconciliation-control.md)
- Updated: [CORE-COMPONENT-260811-completion-evidence-reconciliation](../../../architecture/core-components/CORE-COMPONENT-260811-completion-evidence-reconciliation.md)
- Relevant existing: [CORE-COMPONENT-260810-subprocess-execution](../../../architecture/core-components/CORE-COMPONENT-260810-subprocess-execution.md)
- Relevant existing: [CORE-COMPONENT-260810-persistence-recovery](../../../architecture/core-components/CORE-COMPONENT-260810-persistence-recovery.md)
- Relevant existing: [CORE-COMPONENT-260810-issue-worktree-locking](../../../architecture/core-components/CORE-COMPONENT-260810-issue-worktree-locking.md)
- Relevant existing: [CORE-COMPONENT-260810-structured-events](../../../architecture/core-components/CORE-COMPONENT-260810-structured-events.md)
- Relevant existing: [CORE-COMPONENT-260810-error-handling](../../../architecture/core-components/CORE-COMPONENT-260810-error-handling.md)
- Relevant existing: [CORE-COMPONENT-260810-development-standards](../../../architecture/core-components/CORE-COMPONENT-260810-development-standards.md)
- Relevant existing: [CORE-COMPONENT-260806-project-command-interface](../../../architecture/core-components/CORE-COMPONENT-260806-project-command-interface.md)

## Settled Design Boundaries
- Measure stdout/stderr byte counts and parse tmux identities from original buffers before UTF-8 decoding; buffers are ephemeral adapter data and never durable evidence.
- Accept only horizontal-tab fields, LF records, and one optional final LF. Creation requires exact window/pane identifier grammars; observation additionally requires one nonempty valid UTF-8 cwd.
- Persist only `TmuxIdentityDiagnosticV1`: phase, exit code, original byte counts, at most eight logical record summaries, field counts capped at eight, and at most 32 value-free stdout tokens from the closed identifier/tab/CR/LF/backslash/other vocabulary.
- Empty stdout has zero logical records. Nonempty output removes at most one terminal LF for record counting, splits every remaining LF including empty segments, and counts fields as one plus horizontal tabs. Identifier tokens require a complete strict identifier run; all other nonspecial runs collapse to `other`.
- Add nullable latest diagnostic to `RunSnapshotV5`; read v1-v5, normalize v4 through an explicit revisioned transition, retain the TransitionEventV2 envelope, expose `ReconciliationReportV2` and status schema version 4, replace on a later failure, and clear only after valid create/observe identity proof.
- Carry create/observe parse failures as typed safe failures. Persist creation failure in `starting_tmux`; persist malformed zero-exit observation after the single collected pass without recollection. Nonzero observe remains absence; spawn/timeout remains generic unknown; nonzero create remains command failure with a bounded diagnostic.
- Require matching lock/lease, worktree path/registration/branch, fetched-base HEAD, staged/unstaged/untracked cleanliness, no persisted identity, and zero same-name candidates before `PREPARATION_RESUME_AVAILABLE`. Repeat only the name-absence precondition immediately before the one create attempt.
- Refuse every same-name candidate as unknown ownership without reading or adopting its identity, cwd, or process command. Retained diagnostics are non-authorizing and cannot contain another run data.
- Keep `LOG_NOT_FOUND` independent: a diagnostic is neither a transcript nor a persisted tmux identity. Human output reports malformed or ambiguous identity evidence and does not recommend a tmux upgrade.

## Acceptance Criteria
- **AC-1:** Creation accepts exactly one nonempty record with exactly two fields representing one `^@[0-9]+$` window ID and one `^%[0-9]+$` pane ID; observation accepts exactly one nonempty record with exactly three fields representing those two IDs and one nonempty cwd. The accepted transport permits only the documented record terminator and field separator, including an optional final line terminator, and rejects additional records or fields.
- **AC-2:** Controlled tmux 3.7b fixtures with creation bytes `40 31 09 25 31 0a` and observation bytes `40 31 09 25 31 09 2f 74 6d 70 0a` produce the exact identities `@1`, `%1`, and `/tmp` and preserve the existing successful preparation/reconciliation behavior.
- **AC-3:** The bounded malformed matrix rejects creation outputs `empty`, `@1\n`, `@1<TAB>%1<TAB>extra\n`, `@1<TAB>%1\n@2<TAB>%2\n`, `1<TAB>%1\n`, and `@1<TAB>1\n`; it also rejects observation outputs `empty`, `@1<TAB>%1\n`, `@1<TAB>%1<TAB>/tmp<TAB>extra\n`, `@1<TAB>%1<TAB>/tmp\n@2<TAB>%2<TAB>/tmp\n`, `1<TAB>%1<TAB>/tmp\n`, and `@1<TAB>1<TAB>/tmp\n`. Each case reports malformed or ambiguous identity output rather than accepting a partial record.
- **AC-4:** A creation or observation identity failure exposes a retained structural diagnostic through the next repository-owned JSON status or reconciliation result: command phase (`create` or `observe`), exit code, stdout/stderr byte counts, record count capped at 8 with a truncation flag, per-record field counts capped at 8 with truncation flags, and a structural token signature capped at 32 tokens that distinguishes IDs, horizontal tabs, CR/LF, backslashes, and other byte runs without retaining their values.
- **AC-5:** Retained identity diagnostics never contain raw stdout or stderr, cwd/path components, command arguments, environment values, field values, issue/owner/run identifiers, or bytes from an `other` run; human output identifies malformed or ambiguous tmux identity evidence and does not recommend upgrading a tmux version already demonstrated to emit the supported format.
- **AC-6:** After a failed creation parse with no remaining same-name tmux window, a `starting_tmux` fixture whose lock, lease, branch, worktree path/registration/HEAD/cleanliness still match can resume with exactly one new window-creation attempt and then continue the existing preparation transition when valid identity output is returned; lock, lease, branch, worktree, window, worker, and RPIV-launch call counts prove that no duplicate owned resources are created.
- **AC-7:** If any same-name tmux window is present while the snapshot has no persisted tmux identity, resume keeps the existing unknown-ownership refusal and leaves snapshot ownership fields, lock, lease, Git worktree tuple, tmux inventory, worker processes, and RPIV launches unchanged; the change does not infer or adopt ownership from a name, cwd, or process command.
- **AC-8:** `LOG_NOT_FOUND` remains a bounded logs outcome when no persisted tmux identity/transcript exists and does not change reconciliation: matching preparation ownership authorizes only `PREPARATION_RESUME_AVAILABLE` and its existing `resume` action, while mismatched or unknown ownership still authorizes no resume.
- **AC-9:** Credential-free tests use temporary repositories and controlled command/tmux/process adapters or executables, never access the external consumer repository, and pass through the existing `just verify-focused` and `just verify` recipes.

## Acceptance Coverage
| AC | Implementation tasks | Tests/validation | Expected inspectable evidence |
|---|---|---|---|
| AC-1 | T-1, T-4, T-6 | V-1, V-2, V-8 | Accepted/rejected byte tables, exact parsed identities, and documentation assertions |
| AC-2 | T-1, T-4, T-5 | V-1, V-5 | Hex-fixture results plus unchanged preparation/reconciliation trace |
| AC-3 | T-1, T-4 | V-2 | Twelve-case matrix with typed failure codes and zero partial identities |
| AC-4 | T-1, T-2, T-4, T-5 | V-3, V-4, V-7 | Exact bounded diagnostic JSON, v5 snapshot/event/report records, and one-pass traces |
| AC-5 | T-1, T-2, T-4, T-5, T-6 | V-3, V-4, V-7, V-8 | Sentinel zero-match scan and human/JSON output without raw/value-bearing fields or upgrade advice |
| AC-6 | T-2, T-3, T-5, T-6 | V-4, V-5, V-8 | Exact ownership tuple, one create call, transition sequence, and zero duplicate-resource counts |
| AC-7 | T-3, T-5, T-6 | V-6, V-8 | Unknown-ownership result plus before/after snapshots and zero mutation/launch calls |
| AC-8 | T-2, T-3, T-5, T-6 | V-7, V-8 | LOG_NOT_FOUND output and reconciliation safe-action matrix |
| AC-9 | T-1, T-2, T-3, T-4, T-5, T-6, T-7 | V-1 through V-10 | Temporary-root fixture inventory, no-network/credential assertions, focused/full command transcripts and coverage |

Coverage proof: all nine criteria have implementation tasks, finite tests or validation, and expected inspectable evidence. This matrix was completed before the three Plan artifacts were written.

## Implementation Tasks
- **T-1 — Implement original-byte identity parsing and bounded diagnostic construction** (AC-1, AC-2, AC-3, AC-4, AC-5, AC-9); depends on None. Extend the typed command boundary with ephemeral original buffers/counts, centralize strict create/observe parsing, generate exact capped summaries/signatures, and emit safe typed failures while preserving nonzero-observe absence semantics.
- **T-2 — Add v5 diagnostic persistence and common rendering** (AC-4, AC-5, AC-6, AC-8, AC-9); depends on T-1. Add RunSnapshotV5, strict validation/replay/migration, ReconciliationReportV2/status v4, latest-diagnostic replacement/clearing, single-pass observation persistence, and shared human/JSON rendering without raw values.
- **T-3 — Tighten preparation reconciliation and resume authorization** (AC-6, AC-7, AC-8, AC-9); depends on T-1,T-2. Add name-only tmux presence observation, exact fetched-base HEAD and cleanliness proof, zero-candidate-only resume, action-race name recheck, and unchanged same-name unknown refusal without adoption.
- **T-4 — Cover the live tmux adapter and diagnostic boundaries** (AC-1, AC-2, AC-3, AC-4, AC-5, AC-9); depends on T-1,T-2. Add controlled CommandRunner byte fixtures for valid 3.7b output, the complete malformed matrix, bounds, invalid UTF-8/CRLF controls, command outcomes, and secret/path sentinels.
- **T-5 — Prove recovery, ownership preservation, logs independence, and one-pass behavior** (AC-2, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9); depends on T-2,T-3,T-4. Extend recovery/orchestration fixtures with zero-candidate retry, same-name refusal, HEAD/dirtiness mismatches, retain/replace/clear lifecycle, call-count invariants, LOG_NOT_FOUND, and no duplicate or unauthorized operations.
- **T-6 — Update affected operator and schema documentation** (AC-1, AC-5, AC-6, AC-7, AC-8, AC-9); depends on T-2,T-3,T-5. Update README, PRD, docs index, issue-run guide, recovery operations, migration/troubleshooting text, and documentation assertions. State exact transport, diagnostic limits/redaction, v5 compatibility, retry/refusal proof, logs independence, credential-free validation, and no network API/deployment impact.
- **T-7 — Run authoritative focused and full repository validation** (AC-9); depends on T-1,T-2,T-3,T-4,T-5,T-6. Use root `just verify-focused` during implementation and finish with root `just verify`; retain lint, formatting, type, tests, coverage, build, and diff evidence. Harness checks may delegate but do not replace either direct boundary.

## Delivery Order and Boundaries
1. Establish byte-accurate parser/diagnostic types before persistence consumers.
2. Add v5 migration and rendering before changing authorization decisions.
3. Tighten one-pass reconciliation and resume, then prove adapter and recovery matrices.
4. Update affected application documentation after executable contracts stabilize.
5. Finish with direct root focused/full validation. All fixtures remain credential-free, temporary, and isolated from Sparkta and ambient tmux/GitHub/Copilot resources.
