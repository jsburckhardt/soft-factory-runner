# Phase 3 recovery and concurrency operations

## Runtime and command surface

Runner is a short-lived local CLI. Install Node.js 22+, Git, `gh`, tmux, Copilot CLI, and `just`; authenticate tools outside Runner state. There is no long-running daemon, network service/API deployment, background scheduler, force-clean path, or evidence purge. Run the checkout without global binary linkage:

```text
just setup
just build
just run --help
```

| Command | Purpose | JSON | Success and non-success |
| --- | --- | --- | --- |
| `just run instructions [--json]` | Read deterministic IntegrationContractV1 without mutation | yes | Valid repository/configuration is 0; syntax is 2; invalid configuration is nonzero. |
| `just run run --issue <positive-integer> [--json]` | Create one new explicitly requested run | yes | New run is 0; `RUN_EXISTS`, ownership, or capacity refusal is nonzero. |
| `just run reconcile <positive-integer> [--json]` | Replay history and produce the shared report | yes | Safe report is 0; blocked contradiction/unknown is nonzero. |
| `just run resume <positive-integer> [--json]` | Apply the resume decision table | yes | Continued/no-op is 0; refused terminal or ambiguous state is nonzero. |
| `just run stop <positive-integer> [--json]` | Stop one exact RPIV process group | yes | Stopped/already-stopped is 0; identity ambiguity or a process still active after escalation is nonzero. |
| `just run clean <positive-integer> [--json]` | Explicit guarded cleanup | yes | Complete/already-cleaned is 0; dirty, active, unknown, partial, or blocked is nonzero. |
| `just run list [--json]` | Numerically list the union of snapshots, locks, leases, and logs | yes | Inventory is 0; malformed durable state is nonzero. |
| `just run status <positive-integer> [--json]` | Reconcile and render one issue | yes | A readable report is 0; missing/invalid state is nonzero. |
| `just run attach <positive-integer>` | Attach only to the exact recorded tmux target | no | Exact target is 0; absent/mismatch is nonzero. |
| `just run logs <positive-integer> [--json]` | Read retained attempts and exact live pane capture | yes | Available evidence is 0; no evidence or ambiguous target is nonzero. |

Syntax errors exit 2. Operational evidence errors exit 3. Ownership, capacity, blocked reconciliation, resume, stop, and cleanup refusals exit 4. Human and JSON renderings derive from one categorical public view and agree on schema version, issue, persisted state, activity, decision/outcome, eligibility, safe actions, cleanup-category progress, refusal, remediation, and exit meaning. Neither embeds the reconciliation report or exposes raw observation facts, socket/session/window/pane selectors, cwd, process identifiers, private persisted objects, or unrelated-resource values. Unchanged inputs are idempotent.

## Configuration and explicit admission

`.soft-factory/config.yml` remains a simple mapping:

```yaml
repository:
  remote: origin
  base_branch: main
execution:
  max_concurrent_runs: 2
branch_types:
  feature: feat
rpiv:
  prompt: "Deliver issue #{issue}"
  final_validation: just verify
```

### Copilot environment during new and resumed launches

`copilot.environment` is the sole Copilot child-variable mapping. Names match `[A-Za-z_][A-Za-z0-9_]*`; values are string scalars, and `""` is an explicit empty string. For example:

```yaml
copilot:
  environment:
    COPILOT_OTEL_ENABLED: "true"
    OTEL_EXPORTER_OTLP_ENDPOINT: "https://collector.example.invalid"
    OPTIONAL_EMPTY: ""
```

Absent `copilot`, absent `environment`, and an empty environment mapping preserve the existing allowed child environment. Runner reads current configuration for each new or resumed launch and captures one immutable per-launch map. Concurrent issue launches therefore keep separate configured values and separate `project.name`/`issue.id` resource attributes even when the file changes between reads. A configuration rejection occurs before launch intent and Copilot spawn; after correcting the file, invoke the eligible launch or resume path again for a fresh read. No hidden retry occurs.

Merge precedence is allowlisted inherited values, configured values, then Runner-owned `OTEL_RESOURCE_ATTRIBUTES` for the current issue. Values are literal under `shell: false`; `$VAR`, command substitutions, backticks, quotes, spaces, semicolons, and URL metacharacters are not evaluated or expanded. Configured entries are Copilot-only and never reach Git, `gh`, tmux, workers, Doctor, generic subprocesses, or ambient Runner state.

Duplicate/invalid names, non-string/nested values, aliases, anchors, merge keys, unsupported keys, malformed lines, and bad indentation return value-free `CONFIG_INVALID` field/reason diagnostics with no value included. Runner does not persist or render configured names or values in snapshots, events, launch intents, attempt logs, or human/JSON output. This additive option requires no change to existing configurations when overrides are unwanted; no migration applies to snapshots, events, results, APIs, data, or deployment.

`rpiv.final_validation` is absent-by-default `just verify` or one declared argument-free root `just <recipe>` other than focused validation. A missing root `justfile` prevents declaration proof for both the default and configured forms. It is validated and snapshotted before ownership; current configuration—including an invalid, empty, focused, changed, or undeclared current final-validation value—cannot block or alter an active, recovered, or normalized legacy run; supported legacy uses sole `just verify`. `execution.max_concurrent_runs` is a strict positive safe integer. It defaults to `1`; zero, negative, fractional, exponent, empty, and unsafe-integer values fail before issue ownership. Each active issue exclusively creates the lowest available `.soft-factory/concurrency/slots/<slot>.lock` after its issue lock and before snapshot, branch, worktree, tmux, or process creation.

Unknown leases consume capacity. An occupied, malformed, unknown, or stale lease consumes capacity. Reducing the configured limit below an occupied slot blocks new admission until exact inactive ownership can release that lease. At capacity, `CONCURRENCY_LIMIT_REACHED` names only the explicitly requested issue, removes only its just-created matching issue lock, creates no downstream resource, and does not queue, rank, query for, or automatically select another issue. Distinct active issues use distinct issue locks, branches, worktrees, tmux windows/panes, run snapshots, event histories, and log directories; only the repository tmux session is shared.

## Reconciliation and persisted history

New transitions use `RunSnapshotV6` and `TransitionEventV2`. A v6 snapshot preserves the v4 final-validation/integration binding and records monotonic revision, attempt, slot lease, launch intent, worker/RPIV process identity, stop, cleanup, log, and merged-PR facts. A v2 event records prior/resulting revision and the complete redacted resulting snapshot. Runner appends the event before atomically replacing the snapshot.

On load, only a complete, contiguous, issue/run-identity-matching v2 chain may advance an event-ahead snapshot. Malformed, truncated, duplicate-conflicting, wrong-run, noncontiguous, and legacy-v1-ahead histories return `STATE_HISTORY_INVALID` without inferred mutation. Repetition over unchanged bytes returns the same normalized result.

Every report keeps persisted facts separate from exactly one bounded observation of:

1. issue lock;
2. concurrency slot lease;
3. filesystem worktree path;
4. Git registration, branch, HEAD, staged/unstaged/untracked dirtiness;
5. tmux session/window/pane/cwd;
6. worker process identity;
7. RPIV process identity;
8. mutable RPIV progress phase and classification (non-authorizing);
9. strictly parsed result artifact identity, content, and snapshotted final-validation binding;
10. authoritative remote branch state; and
11. GitHub pull-request and immutable source-head facts; and
12. for `starting_tmux` without a persisted identity, name-only same-window presence with no candidate identity, cwd, or process detail.

Each boundary is `match`, `absent`, `mismatch`, `unknown`, or `not_applicable`. Timeout, malformed output, permission-denied process metadata, and unavailable commands are `unknown`, never inferred absence. Unknown takes precedence over mismatch. Unknown or contradiction never authorizes launch, signal, attach, reuse, or cleanup.

For `running_rpiv` only after RPIV is proved absent and the worker is absent or not recorded, one strict successful result whose issue, branch, ordered acceptance set, and snapshotted final-validation binding match is reported as the unaccepted `RESULT_RECOVERY_CANDIDATE`. Its head and PR number key exactly one candidate-head worktree, fresh remote, and open-PR observation; they are query inputs, not persisted completion or ownership proof. A matching active RPIV takes precedence and remains `active_preserved`. Mutable progress remains non-authorizing, including terminal `PROGRESS_REPEATED`.

## Process identity and resume decisions

A long-running process matches only when positive PID, process-group ID, OS start token, resolved executable, exact argument vector, cwd, launch time, and tmux pane lineage all agree. Equal PID with a changed start token is a mismatch. Runner persists launch intent before spawn and full identity immediately after spawn. If interrupted between those writes, exactly one matching pane descendant is adopted; zero is absent and multiple/incomplete candidates are blocked. A matching active process yields `active_preserved`, leaves attempt unchanged, and launches zero processes.

| Persisted/reconciled state | Resume outcome |
| --- | --- |
| Exact active process | `ACTIVE_PRESERVED`; no launch and no attempt change. |
| Exact partial preparation | Continue only when lock/lease, worktree path/registration/branch, fetched-base advertised HEAD, staged/unstaged/untracked cleanliness, no persisted tmux identity, and zero same-name candidates all match. The adapter rechecks name absence immediately before one creation attempt. |
| `running_rpiv` with `FINALIZATION_RECOVERY_AVAILABLE` | Only explicit `resume` persists `running_rpiv -> finalizing`, leaves attempt unchanged, launches no worker/RPIV, and invokes strict finalization. Exact or proved-absent tmux is allowed for this transition only. |
| `finalizing`, or interrupted with a valid result | Retry completion finalization without RPIV. |
| Interrupted execution, no result, exact inactive resources | Increment attempt once and restart the worker in the same owned worktree/tmux pane. |
| `completed` | `COMPLETED_NOOP`. |
| `failed`, `blocked`, `cancelled`, legacy-unmigratable, unknown, mismatched, or ambiguous | `RESUME_REFUSED`; preserve resources. |

Completion requires strict AgentResultV1, local Git, fresh remote, GitHub PR, acceptance, and the one snapshotted evidence-bound final validation. Focused validation evidence is completion-neutral. Recovery cannot infer completion from progress, process, tmux presence, tmux absence, or malformed tmux. Malformed tmux remains unknown; candidate Git/remote/PR contradiction fails closed with no transition, launch, or cleanup.

### Post-wait current-state guard

After a Copilot wait resolves, Runner reloads the strict current snapshot/history before deriving an exit transition. The current run ID, owner ID, complete worker identity, and complete RPIV identity must match the pre-wait run and exact awaited process. Zero exit starts finalization and nonzero exit records failure only from that latest revision, preserving all concurrently accepted progress, immutable result, and retained diagnostic facts.

`POST_WAIT_STATE_REFUSED` carries exactly one closed reason: `missing`, `invalid`, `run_mismatch`, `owner_mismatch`, `worker_mismatch`, `rpiv_mismatch`, or `state_advanced`. The last reason means a second writer won between reload and the store's guarded save; its newer event and snapshot remain authoritative. Every refusal performs no stale fallback save, lease release, relaunch, result replacement, or diagnostic overwrite. Exact already-terminal state is idempotent and returns its existing outcome without adding an exit or terminal event. Operators should preserve bytes and history, inspect the reason, restore exact identity where possible, and retry only through an explicit eligible command.

Tmux transport follows the [issue-run guide](phase-1-issue-run.md) in UTF-8 and non-UTF8 client states. Window creation retains the historical diagnostic grammar `@<digits>|%<digits><LF>`. Current lifecycle observation uses one internal record: `<socket-path>|<session-id>|<session-name>|<window-id>|<window-name>|<pane-id>|<pane-dead>|<cwd><LF>`. The canonical socket and immutable session/window/pane selectors must equal the persisted target. `pane-dead` is exactly `0` or `1`; live requires `0` plus exact nonempty cwd, while dead requires `1`, empty current cwd, and complete persisted cwd. Exactly one terminal LF is required, and only cwd may contain additional vertical bars after the first seven separators. Alternate separators, malformed selectors/dead flags/cwd, and malformed framing are rejected. Malformed identity evidence yields a bounded `TmuxIdentityDiagnosticV1` with original byte counts, at most 8 records/fields, and at most 32 closed value-free structural tokens. Raw output, exact-target values, and other-run bytes remain internal and are never rendered. A later failure replaces the diagnostic; absence/rendering retains it; valid identity proof clears it. Malformed zero-exit observation is unknown; nonzero observation remains absence. Each reconciliation collects only one whole-target observation and never recollects after persisting the returned diagnostic.

Any same-name candidate without a persisted identity produces unknown ownership, no resume action, no create/worker/RPIV operation, and no adoption from name, cwd, identity, or process command. A candidate that appears during the action race is refused by the immediate name-only recheck. The diagnostic is non-authorizing: identical ownership observations produce identical safe actions whether it is present or absent.

## Stop, terminal evidence, and logs

`stop` begins from the shared report and signals only an exact RPIV process group. Operation order is:

1. bounded redacted pane capture;
2. `SIGTERM`;
3. wait at most 10 seconds;
4. only if still active, `SIGKILL`;
5. wait at most 5 additional seconds;
6. final bounded capture;
7. only after inactivity is proved, persist stop facts and `cancelled`, then release the exact inactive slot;
8. if the process remains active after both waits, return `STOP_PROCESS_STILL_ACTIVE` nonzero and retain its process identity, running state, issue lock, slot lease, worktree, tmux, and logs.

Already absent or terminal is idempotent. PID reuse, pane mismatch, multiple candidates, or unknown observation sends no signal. Stop never removes the worktree or tmux target. Issue panes use remain-on-exit. Attempt transcripts live at `.soft-factory/logs/<issue>/<attempt>.log`, are redacted, capped at 2 MiB with an explicit truncation marker, and retained with snapshots/events through cleanup. `logs` returns retained attempts and includes current pane capture only for an exact live target. A retained tmux identity diagnostic is not a transcript or persisted tmux identity; with neither identity nor transcript, `LOG_NOT_FOUND` remains unchanged.

## Explicit and automatic cleanup

Cleanup authorization comes only from the complete independent Core conjunction in the shared report. For a completed run that includes matching persisted result evidence; interrupted terminal outcomes keep the existing result-not-applicable rules. An unaccepted recovery candidate, mutable progress, pre-checkpoint or otherwise unproved tmux absence, or malformed tmux never authorizes cleanup, including when candidate PR facts look merged. The sole absence exception is a retry after the same-owner/run exact tmux started or completed checkpoint with unchanged socket identity; that proof authorizes only resuming the remaining guarded cleanup steps without replaying tmux removal. Both modes require an inactive terminal run plus exact lock, recorded lease when present, snapshot, independently absent worker/RPIV processes, tmux, Git registration/branch/path/HEAD, result when required, and ownership observations. One strict remain-on-exit dead-pane record is cleanup-compatible only when its socket/session/window/pane selectors exactly equal the persisted target, `pane_dead` is `1`, current cwd is empty, and persisted cwd is complete. Dead state and historical pane process fields never authorize ownership, attach, live logs, resume, stop lineage, or mutation. Dirtiness includes staged, unstaged, and untracked files. Active, dirty, absent-unproved, unknown, mismatched, incomplete, or ambiguous resources return a stable refusal with zero unauthorized remove/delete calls. There is no `--force` bypass.

Explicit `clean` refuses a live `TMUX_MATCH`; only an exact dead-pane observation plus every independent Core fact can make it eligible. Once eligible, it captures and retains the final transcript before removing the exact dead window, then removes the clean worktree with non-forced `git worktree remove`, releases the exact inactive slot when present, and compare-deletes the exact issue lock last. Before each destructive call Runner observes that exact resource present and persists a same-owner/run started checkpoint bound to its immutable identity; this durable same-owner/run record identifies the same owner and run. Afterward it verifies absence and persists completion. A retry treats absence as completed only after that exact checkpoint or completed progress, never repeats a proved removal, and refuses without mutation if proof is missing, contradictory, or identifies a replacement. Already-completed exact cleanup is idempotently successful. The local branch, snapshot, events, and logs remain. Public output reports only categorical completed steps and remaining steps for tmux, worktree, lease, and lock plus outcome/refusal/remediation.

Automatic merged cleanup runs on the next reconciliation-capable `status`, `list`, or `reconcile`; there is no daemon. Merged head means the immutable PR source head. The expected PR must be `MERGED`, have nonempty merge time, use the recorded issue branch, report source `headSha` equal to the commit already verified at completion, and close the issue. The merge-commit SHA is informational and may differ under merge or squash. A deleted remote issue branch does not block this proof.

Automatic mode never removes tmux, including a dead pane. It removes only the clean exact worktree registration/path, exact inactive slot, and exact issue lock last. It retains tmux, local branch, snapshot, events, and logs. An OPEN PR is pending. A CLOSED-unmerged PR, missing merge time, source branch/SHA mismatch, unavailable GitHub, dirty worktree, lock mismatch, or ownership ambiguity preserves every worktree byte and returns `CLEANUP_MERGE_NOT_PROVED` or the named ownership refusal without rewriting a proved `completed` state.

## Migration and upgrade notes

- Valid `RunSnapshotV1` through `RunSnapshotV6` remain readable; unknown versions are rejected. Completed v2/v3 records use an exact historical AgentResult parser only at the legacy boundary: one persisted passed `just verify` entry becomes the deterministic v4 `requiredFinalValidation` preserved unchanged in v5, focused entries remain supplementary, and current configuration is never read. The historical result shape remains invalid for current publication and v4/v5 snapshots; malformed, unsupported, missing, or failed legacy completion data is rejected.
- Legacy snapshots do not contain the complete v4/v5 integration binding. They are never silently treated as v4 or v5 and cannot resume, stop, or clean until an explicit reconciliation transition proves migration.
- Existing version-1 events remain append-only history. A v2 event ahead of a legacy snapshot is not replayed because the prior revision cannot be proved.
- New runs write schema v6 and event v2. Supported exact v4/v5 snapshots normalize only through explicit revisioned transitions that preserve the v5 diagnostic and add complete exact-target authority; v1-v3 continue through the existing explicit v4 transition first and remain non-authorizing without exact selectors. `ReconciliationReportV3` with schema version 3 and `StatusFactsV5` with status schema version 5 expose the latest diagnostic separately from authorization. No destructive data migration or purge is performed.
- `execution.max_concurrent_runs` defaults to 1, preserving prior single-run behavior. Configure a higher strict value only after inspecting current leases; unsafe reductions block rather than evict.
- Candidate finalization recovery adds decision and rendering fields but no configuration option/default, network API, data migration, service, container, or deployment change. Existing v5 records remain readable but require an explicit proved exact-target migration before tmux mutation.
- Tmux identity recovery changes persisted schema and local CLI rendering but adds no configuration option/default and requires no configuration migration. It adds no network API contract, server, daemon, database, container, or deployment procedure; there is no deployment change. API migration is not applicable.

## Troubleshooting

| Code | Meaning | Action |
| --- | --- | --- |
| `RUN_EXISTS` | `run` found existing state | Use status/reconcile/resume; do not relaunch. |
| `STATE_HISTORY_INVALID` | Event replay is malformed, conflicting, or noncontiguous | Preserve files and restore one complete identity-matching chain. |
| `FINALIZATION_RECOVERY_AVAILABLE` | An unaccepted result candidate has exact inactive ownership and completion-eligible observations | Invoke explicit `resume`; expect no attempt increment or process launch. |
| `FINALIZATION_RECOVERY_INELIGIBLE` | Candidate proof is incomplete without a contradiction | Preserve all resources, restore the named exact proof, and explicitly retry. |
| `RECONCILIATION_UNKNOWN`, `RECONCILIATION_MISMATCH` | A required observation is unavailable or contradictory | Repair the named boundary and explicitly retry. |
| `PROCESS_IDENTITY_MISMATCH`, `PROCESS_IDENTITY_AMBIGUOUS` | PID/start token/command/cwd/pane proof disagrees | Preserve processes and panes; never signal or launch by PID alone. |
| `CONCURRENCY_LIMIT_REACHED` | All configured slots are occupied | Wait for one exact inactive run; request issues explicitly. |
| `CONCURRENCY_STATE_UNKNOWN` | Malformed/stale or above-limit lease blocks admission | Restore prior limit or reconcile exact lease ownership. |
| `STOP_REFUSED` | Exact signal target is unproved | Inspect status and retained logs; do not kill by name. |
| `STOP_PROCESS_STILL_ACTIVE` | The exact RPIV process survived SIGTERM 10 seconds and SIGKILL 5 seconds | Keep ownership/capacity intact, inspect retained logs, and retry only while exact identity remains observable. |
| `CLEANUP_ACTIVE`, `CLEANUP_DIRTY_WORKTREE`, `CLEANUP_OWNERSHIP_UNPROVED` | Cleanup safety conjunction failed | Stop safely or reconcile/preserve the named resource. |
| `CLEANUP_MERGE_NOT_PROVED` | PR is closed-unmerged or merge/source proof is incomplete | Preserve worktree; restore exact GitHub evidence or use explicit clean only when otherwise eligible. |
| `POST_WAIT_STATE_REFUSED` | Post-wait state is missing, invalid, identity-mismatched, or advanced after reload | Preserve newer history/evidence, inspect the closed reason, and reconcile exact ownership before an explicit retry. |
| `TMUX_IDENTITY_MALFORMED` | Completed creation or zero-exit observation returned malformed or ambiguous identity evidence | Inspect only the bounded structural diagnostic; preserve resources and explicitly retry under exact proof. |
| `RESOURCE_OWNERSHIP_UNKNOWN` | A same-name tmux candidate exists without persisted identity | Preserve every candidate; do not inspect or adopt by name, cwd, identity, or process command. |
| `LOG_NOT_FOUND` | No retained attempt or exact live capture exists; a diagnostic alone is not a log | Inspect snapshot attempt/log references and persisted tmux identity. |

## Validation and deterministic fixtures

Use direct root recipes and their harness delegates:

```text
harness checks --focused --json
just verify-focused
just verify
harness checks --json
```

Public human and JSON status/reconcile/control output is projected from one categorical view. It reports eligibility, decision/outcome, exit meaning, cleanup categories, refusal, and remediation without socket paths, session/window/pane IDs, cwd, process IDs, private persisted objects, or unrelated-resource values.

Repository fixtures use temporary roots, exclusive file creation, fixed clocks/IDs, fake `gh`/byte-aware tmux/process adapters, and no ambient credentials, Copilot, or tmux resources. They repeat interruption and three-explicit-issue capacity races, assert no duplicate launch or owner, verify disjoint resource identities, exercise graceful/escalated/still-active stop ordering, inject snapshot failure after every cleanup step, retry from durable same-owner progress, refuse unrelated replacements, and prove cleanup retention/refusal, the exact six-byte no-HT record, explicit UTF-8/non-UTF8 repeats, normal and Doctor overlap isolation, full malformed matrices, diagnostic caps/confidentiality, one-pass lifecycle, zero-candidate retry, HEAD/cleanliness refusal, same-name action races, call-count invariants, and `LOG_NOT_FOUND` independence.


## Checkpoint-gated post-removal cleanup retry

After Runner has durably recorded the same-owner/run exact tmux started or completed checkpoint, a retry may classify exactly one complete, LF-terminated, selector-bound `can't find pane`, `can't find window`, or `can't find session` response as absence only when the socket type/device/inode remain unchanged before and after the bounded query. The query runs from the existing repository root, not the removed worktree. Pre-checkpoint absence, changed or unavailable socket authority, replacement or selector mismatch, malformed/truncated output, stdout data, timeout/spawn failure, and every other nonzero category refuse all mutation.

When tmux and worktree are already completed, retry skips both removals, compare-deletes only the exact remaining lease and lock in order, and reports `CLEANUP_COMPLETED`; a repeat reports `CLEANUP_ALREADY_COMPLETED` without another destructive operation. Lease/lock interruption preserves truthful completed and remaining categories for another explicit retry. Branch, snapshot, events, logs, and previously captured terminal evidence remain retained. Human and JSON forms derive eligibility, outcome, completed/remaining categories, refusal, remediation, and exit meaning from the same confidential categorical view.

## Deferred Sparkta stable 0.2.1 recovery handoff

This repository does not install into or inspect Sparkta during automated delivery. After local package and verification evidence is accepted, an operator may visibly install the locally packed 0.2.1 tarball in Sparkta, reconverge the official asset manifest, then inspect Sparkta Issue 7 through redacted status, reconcile, and logs output. Run explicit clean only when the delivered full conjunction reports eligibility for the persisted exact dead target; confirm retained transcript first and exact tmux/worktree/lease/lock absence afterward while branch, snapshots, events, and logs remain. Any mismatch, unavailable proof, replacement, unexpected activity, or refusal stops the procedure for escalation. No force-clean, credential automation, registry publication, network gate, or ambient/default tmux mutation is authorized.

## Repository readiness preflight

Before issue execution, run `just run doctor` or `just run doctor --json` to inspect all repository-scoped prerequisites without selecting an issue or mutating owned run resources. A NOT READY report exits 3 and keeps all 24 checks visible. See [Phase 4 repository Doctor](phase-4-repository-doctor.md). This product command is distinct from ambient `harness doctor`, which inspects the development harness rather than Runner repository compatibility.

## RPIV progress and final-result operations

Status and list display a separately observed RPIV phase and stable progress classification; unusable current progress is `unknown`, a byte-equivalent accepted current artifact may display its phase as `PROGRESS_REPEATED`, and no progress classification changes completion, activity, decision code, safe actions, cleanup eligibility, ownership, recovery, or process control. Verify publishes immutable AgentResultV1 only after PR creation, and the coordinator validates it before zero exit. See [RPIV integration, progress, and completion handoff](rpiv-integration-contract.md) for exact schemas, atomicity, classifications, helper ownership, redaction, and troubleshooting.

## Exact target recovery and repeated absence

Every tmux operation uses `tmux -S <persisted-socket>`; ambient tmux context at recovery time is irrelevant. One internal lifecycle observation contains the socket selector, session ID/name, immutable window ID/name, pane ID, strict `pane_dead`, and current cwd; the adapter also compares persisted socket filesystem identity. Readers see one complete matching target or complete absence, never mixed fields. Attach and logs require the live exact pane; explicit clean refuses live state and removes only the immutable window after exact-dead plus independent cleanup proof. A mismatch or unproved absence blocks mutation. Repeated cleanup is idempotent only after same-owner/run started or completed cleanup proof; unproved absence still refuses. A same-name session/window on either the selected or another server is never adopted.

Migration compatibility retains strict `RunSnapshotV1` through `RunSnapshotV5` readers and never silently treats an older record as a newer schema. New runs use `RunSnapshotV6` exact-target authority.
