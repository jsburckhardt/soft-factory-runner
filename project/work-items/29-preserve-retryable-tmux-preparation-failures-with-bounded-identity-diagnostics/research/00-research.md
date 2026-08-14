# Research Brief: Preserve retryable tmux preparation failures with bounded identity diagnostics

## GitHub Issue
- **Issue:** #29
- **Title:** Preserve retryable tmux preparation failures with bounded identity diagnostics
- **Work Item:** `project/work-items/29-preserve-retryable-tmux-preparation-failures-with-bounded-identity-diagnostics`

## Scope Classification
- **Scope Type:** issue

## Problem Statement

A retained run can remain at `starting_tmux` after tmux window creation returns identity output that Runner rejects during `resume`. The current adapter accepts partial creation and observation records, emits generic upgrade advice for a malformed creation identity, and retains no bounded structural account of the failed output for a later repository-owned `status` or `reconcile` call. Recovery must remain retryable only under exact ownership, preserve every existing lock, lease, branch, worktree, process, and unknown tmux resource safety rule, and avoid exposing raw command or consumer data.

The external consumer incident establishes only that a malformed identity was reported. The exact incident output is unavailable. Supplied isolated evidence shows that current source and the packed 0.1.0 artifact pass real horizontal tabs, tmux 3.7b returns the expected tab-separated creation and observation bytes, and even fast-exit panes return identity before disappearing. Those facts do not support a tmux-version incompatibility or a particular alternate separator as the incident cause.

## Acceptance Criteria

<!-- ACCEPTANCE_CRITERIA_START -->
- [ ] Creation accepts exactly one nonempty record with exactly two fields representing one `^@[0-9]+$` window ID and one `^%[0-9]+$` pane ID; observation accepts exactly one nonempty record with exactly three fields representing those two IDs and one nonempty cwd. The accepted transport permits only the documented record terminator and field separator, including an optional final line terminator, and rejects additional records or fields.
- [ ] Controlled tmux 3.7b fixtures with creation bytes `40 31 09 25 31 0a` and observation bytes `40 31 09 25 31 09 2f 74 6d 70 0a` produce the exact identities `@1`, `%1`, and `/tmp` and preserve the existing successful preparation/reconciliation behavior.
- [ ] The bounded malformed matrix rejects creation outputs `empty`, `@1\n`, `@1<TAB>%1<TAB>extra\n`, `@1<TAB>%1\n@2<TAB>%2\n`, `1<TAB>%1\n`, and `@1<TAB>1\n`; it also rejects observation outputs `empty`, `@1<TAB>%1\n`, `@1<TAB>%1<TAB>/tmp<TAB>extra\n`, `@1<TAB>%1<TAB>/tmp\n@2<TAB>%2<TAB>/tmp\n`, `1<TAB>%1<TAB>/tmp\n`, and `@1<TAB>1<TAB>/tmp\n`. Each case reports malformed or ambiguous identity output rather than accepting a partial record.
- [ ] A creation or observation identity failure exposes a retained structural diagnostic through the next repository-owned JSON status or reconciliation result: command phase (`create` or `observe`), exit code, stdout/stderr byte counts, record count capped at 8 with a truncation flag, per-record field counts capped at 8 with truncation flags, and a structural token signature capped at 32 tokens that distinguishes IDs, horizontal tabs, CR/LF, backslashes, and other byte runs without retaining their values.
- [ ] Retained identity diagnostics never contain raw stdout or stderr, cwd/path components, command arguments, environment values, field values, issue/owner/run identifiers, or bytes from an `other` run; human output identifies malformed or ambiguous tmux identity evidence and does not recommend upgrading a tmux version already demonstrated to emit the supported format.
- [ ] After a failed creation parse with no remaining same-name tmux window, a `starting_tmux` fixture whose lock, lease, branch, worktree path/registration/HEAD/cleanliness still match can resume with exactly one new window-creation attempt and then continue the existing preparation transition when valid identity output is returned; lock, lease, branch, worktree, window, worker, and RPIV-launch call counts prove that no duplicate owned resources are created.
- [ ] If any same-name tmux window is present while the snapshot has no persisted tmux identity, resume keeps the existing unknown-ownership refusal and leaves snapshot ownership fields, lock, lease, Git worktree tuple, tmux inventory, worker processes, and RPIV launches unchanged; the change does not infer or adopt ownership from a name, cwd, or process command.
- [ ] `LOG_NOT_FOUND` remains a bounded logs outcome when no persisted tmux identity/transcript exists and does not change reconciliation: matching preparation ownership authorizes only `PREPARATION_RESUME_AVAILABLE` and its existing `resume` action, while mismatched or unknown ownership still authorizes no resume.
- [ ] Credential-free tests use temporary repositories and controlled command/tmux/process adapters or executables, never access the external consumer repository, and pass through the existing `just verify-focused` and `just verify` recipes.
<!-- ACCEPTANCE_CRITERIA_END -->

## Repository Findings

- GitHub Issue #29 contains exactly one marker-delimited acceptance-criteria block with nine ordered Markdown checkboxes. It has no labels, assignees, or milestone. No existing `project/work-items/29-*` directory was present, so the current title resolves to the work-item path above.
- The supplied incident facts are consistent with the checked-in transport strings: `src/live.ts` `LiveTmuxPort.createIssueWindow` passes `#{window_id}\t#{pane_id}`, and `LiveTmuxPort.observe` passes `#{window_id}\t#{pane_id}\t#{pane_current_path}`. Inspection of `soft-factory-runner-0.1.0.tgz` shows the same strings and parser in `package/dist/live.js`. The supplied tmux 3.7b byte probes and fast-exit result are external evidence only; no Sparkta repository, worktree, tmux, or `.soft-factory` state was accessed.
- `src/live.ts` `LiveTmuxPort.createIssueWindow` currently applies `created.stdout.trim().split("\t")`, destructures only the first two fields, and validates only that both are nonempty. It therefore does not enforce one record, exactly two fields, or the `@` and `%` identifier grammars. Its malformed case uses `EXTERNAL_COMMAND_FAILED` with the remediation `Upgrade tmux and retry after preserving existing resources.`
- `src/live.ts` `LiveTmuxPort.observe` trims output, filters empty newline-delimited rows, requires one row, then destructures the first three tab-delimited fields without field-count, identifier, or nonempty-cwd validation. Extra fields are ignored. A nonzero observation exit returns `null`, while a malformed row throws `TMUX_TARGET_MISMATCH`.
- `src/live.ts` `CommandExecutor` accumulates `Buffer` chunks but converts them to UTF-8 strings before returning `CommandResult`. `CommandResult` carries exit code, signal, stdout, and stderr. `commandFailure` retains a redacted stderr string for immediate error rendering, while malformed tmux identity errors currently retain no command structure or output metadata.
- `src/orchestrator.ts` `IssueRunService.prepareResources` persists `starting_tmux` before calling `TmuxPort.createIssueWindow`. A valid identity is persisted only later with the `running_rpiv` transition after remain-on-exit, pane PID, and worker identity succeed. A creation parse failure during `resume` propagates without a new transition, leaving the persisted snapshot at `starting_tmux` with `tmux: null`.
- `src/live.ts` `LiveTmuxPort.createIssueWindow` lists existing window names before creation and throws `RESOURCE_OWNERSHIP_UNKNOWN` when the issue window name already exists. It does not adopt the window. `src/orchestrator.ts` reaches this same adapter path when resuming `starting_tmux` with no persisted tmux identity.
- `src/reconciliation.ts` `collectReconciliation` marks tmux `TMUX_NOT_RECORDED` and does not call `observe` when the snapshot has no tmux identity. Observation exceptions are collapsed by the local `observe` helper to `unknown` facts with only the error code. No current reconciliation fact carries retained identity-failure structure.
- `src/reconciliation.ts` `buildReconciliationReport` evaluates unknown or mismatched authorizing observations before the preparation decision. For preparation states, a clean report with matching lock and lease yields only `PREPARATION_RESUME_AVAILABLE` and `resume`. The Git observation requires path, registration, and branch agreement, but `completionHead` is null during preparation and cleanliness is not part of that match; `prepareResources` does not re-observe the worktree after entry at `starting_tmux`.
- `src/orchestrator.ts` `logs` first consumes the shared reconciliation report, reads only persisted log references, and captures a live pane only when `attach` is safe and `snapshot.tmux` exists. With no retained log and no exact persisted tmux identity it returns `LOG_NOT_FOUND`; it does not alter reconciliation authorization.
- `src/domain.ts` `RunSnapshotBase.error` stores only code and message. `RunSnapshotV4`, `ReconciliationObservationsV1`, and `ReconciliationReportV1` have no identity-diagnostic field. `src/persistence.ts` validates snapshots and complete event-carried snapshots strictly, and `src/render.ts` serializes status/reconciliation from those typed facts.
- Existing tests use controlled ports rather than consumer resources. `src/orchestration.test.ts` `RecordingTmux`, `src/recovery-control.test.ts` `ControlTmux`, and `src/integration.test.ts` `CountingTmux` return already structured identities. Current resume coverage includes active preservation, interrupted restart, and mismatch refusal, but no `starting_tmux` creation-parse retry. `src/live.ts` is excluded from coverage as a live adapter, although `createLivePorts` accepts an injected `CommandRunner` and existing integration tests use that boundary for other command parsing.
- Git history shows the tmux format and permissive identity parser originated in `0fb5bbc` (`feat(runner): run one issue in an isolated visible environment`). Commit `d7a0685` (`feat(runner): recover safely and run distinct issues concurrently (#14)`) introduced the current preparation resume and reconciliation behavior. Later commits changed adjacent launch and integration contracts but did not tighten this tmux parser.
- `docs/phase-1-issue-run.md` and `docs/phase-3-recovery-operations.md` document exact ownership, fail-safe ambiguity, one-pass reconciliation, retryable partial preparation, retained logs, `LOG_NOT_FOUND`, and credential-free controlled fixtures. `PRD.md` defines tmux as the visible execution surface, one owned issue window per run, `starting_tmux`, structured status, recovery, and preservation of unknown tmux resources.
- The root `justfile` declares both `verify-focused *args` and `verify`; `just --list` exposes both recipes. `.harness/engineering-harness.md` maps focused and full harness checks to those recipes. Required `harness boot --json` completed with the expected application signal and an `ok` full-check envelope on the research baseline.

## Constraints

- The accepted architecture separates deterministic orchestration and reconciliation policy from typed external-system adapters. Tmux command construction and parsing remain at the adapter boundary; persisted and observed facts remain distinct.
- Every external observation is bounded and performed once per reconciliation attempt. Existing recovery contracts prohibit hidden polling or retry and require later operator invocation for another observation.
- Unknown, unavailable, malformed, mismatched, or ambiguously owned resources cannot authorize launch, reuse, attach, signaling, or cleanup. A same-name window without persisted identity remains unknown ownership and must be preserved.
- Matching ownership spans the issue lock, concurrency lease, snapshot owner/run, worktree, branch, and runtime observations. Recovery must not replace ownership or duplicate the branch, worktree, tmux window, worker, or RPIV launch.
- Snapshots are versioned and atomic; transition events are append-only and written before snapshot replacement. Any retained fact exposed by later status/reconciliation is constrained by strict persistence validation and event replay.
- Human and JSON output derive from the same structured facts. Stable typed failures, nonzero refusal outcomes, actionable remediation, and fail-safe ambiguity are existing contracts.
- External command results must use validated argument arrays and retain only redacted diagnostic information. Credentials, command arguments, environment values, paths, raw output, and other run data must not enter snapshots, events, logs, or rendered diagnostics.
- The current command boundary exposes decoded strings, not original output buffers. Original byte lengths and byte classes cannot be assumed recoverable from those strings for arbitrary non-UTF-8 output.
- Core logic remains strict TypeScript on Node.js 22+ with external systems isolated behind adapters. Repository fixtures are deterministic and credential-free; the external consumer and live consumer state are outside the repository validation boundary.
- Root `justfile` recipes remain the project validation authority. The harness delegates to `just verify-focused` and `just verify` and does not replace them.

## Relevant ADRs and Core-Components

- `ADR-260810-typescript-node-cli` — strict TypeScript/Node.js CLI and typed external boundaries.
- `ADR-260811-prototype-one-run-orchestration` — deterministic tmux orchestration, bounded observation, and unknown-resource preservation.
- `ADR-260811-prototype-three-recovery-concurrency` — one-pass reconciliation, exact partial-preparation resume, duplicate prevention, retained logs, and explicit retries.
- `ADR-260811-engineering-harness-surface` — root command authority behind delegating harness checks.
- `CORE-COMPONENT-260810-structured-events` — structured redacted lifecycle facts and common human/JSON meaning.
- `CORE-COMPONENT-260810-error-handling` — stable actionable failures and fail-safe ambiguity.
- `CORE-COMPONENT-260810-persistence-recovery` — atomic versioned persistence, persisted/observed separation, and idempotent recovery.
- `CORE-COMPONENT-260810-subprocess-execution` — typed argument-array execution, redacted results, and diagnostic evidence constraints.
- `CORE-COMPONENT-260810-issue-worktree-locking` — exact ownership before reuse and preservation of unknown tmux/worktree resources.
- `CORE-COMPONENT-260810-development-standards` — strict TypeScript, adapter-isolated deterministic coverage, and root quality gates.
- `CORE-COMPONENT-260811-issue-run-orchestration` — tmux preparation sequence, typed ports, bounds, status, and fixture isolation.
- `CORE-COMPONENT-260811-run-reconciliation-control` — shared report, exact preparation resume, one-pass observations, logs, and no duplicate launch.
- `CORE-COMPONENT-260811-concurrent-run-admission` — exact lease ownership and distinct issue resource sets.
- `CORE-COMPONENT-260806-project-command-interface` — required root `verify-focused` and `verify` recipes.
- `CORE-COMPONENT-260811-engineering-harness-interface` — harness delegation and direct RPIV validation interfaces.
- `project/architecture/ADR/DECISION-LOG.md` registers all listed artifacts as Accepted or Adopted; decisions 27 through 31, 34 through 38, 40, 44, 47 through 48, and 64 through 73 are the directly relevant recorded constraints.

## Risks and Open Questions

- The exact incident stdout, stderr, exit code, pane transcript, and command transcript are unavailable. Research cannot distinguish empty, malformed, ambiguous, or otherwise unexpected incident output or reproduce the original byte structure.
- Supplied controlled evidence confirms valid horizontal-tab behavior on tmux 3.7b for current source and packed 0.1.0. A tmux-version recommendation or alternate-separator assumption would therefore be unsupported.
- Window creation precedes identity parsing. On failure, a window may still exist without a persisted identity; fast-exit behavior may instead leave no same-name window. These states have different existing ownership outcomes, and names, cwd, or process commands cannot resolve ownership.
- The documented field separator and terminator are implicit in source format strings and supplied byte fixtures; repository operator documentation does not separately define whether any transport beyond horizontal tab, LF, and an optional final LF is supported.
- UTF-8 decoding at the command boundary can change the relationship between original bytes and string length when output contains invalid or multibyte sequences. The acceptance requirement names byte counts, while current repository types retain only decoded strings.
- A valid identity from a fast-exit pane does not guarantee that pane or worker identity remains observable during the following preparation steps. Existing process-observation failure behavior remains a separate recovery boundary.
- Current preparation reconciliation does not compare worktree HEAD or cleanliness before authorizing `PREPARATION_RESUME_AVAILABLE`. The issue requires those facts to match for the retry case, while mismatch and unknown behavior must remain non-authorizing.
- The required lifetime after the next status/reconciliation response, replacement behavior after a later identity failure, and clearing behavior after successful preparation are not specified by current persistence or documentation contracts.
- Observation currently maps nonzero tmux exit to absence and maps thrown malformed output to unknown with only a code. Without the exact incident output, the relative occurrence of command failure, absence, and malformed successful output remains unknown.
