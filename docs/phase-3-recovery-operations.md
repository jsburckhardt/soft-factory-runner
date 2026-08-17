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

Syntax errors exit 2. Operational evidence errors exit 3. Ownership, capacity, blocked reconciliation, resume, stop, and cleanup refusals exit 4. Human and JSON renderings preserve the same schema version, issue, persisted state, outcome code, activity, boundary observation states/codes/facts, safe actions, control facts, cleanup progress, remediation, and exit meaning. Human control output embeds the same shared reconciliation report carried by JSON. Unchanged inputs are idempotent.

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

Tmux creation/observation identity bytes follow the exact transport in the [issue-run guide](phase-1-issue-run.md) for both UTF-8 and non-UTF8 client states: creation is `@<digits>|%<digits><LF>`, observation is `@<digits>|%<digits>|<cwd><LF>`, and exactly one terminal LF is required. The first two printable vertical bars isolate the strict IDs; all remaining valid UTF-8 cwd bytes, including additional vertical bars, are retained unchanged. HT, sanitized/inferred forms, alternate separators, invalid IDs/cwd, and malformed framing are rejected. Malformed identity evidence yields a bounded `TmuxIdentityDiagnosticV1` with original byte counts, at most 8 records/fields, and at most 32 closed value-free structural tokens. Raw output, paths/cwd, arguments, environment/field values, issue/owner/run IDs, hashes/byte values, and other-run bytes are never retained. A later failure replaces it; absence/rendering retains it; valid identity proof clears it. Malformed zero-exit observation is unknown; nonzero observation remains absence. Each reconciliation collects only one observation and never recollects after persisting the returned diagnostic.

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

Cleanup authorization comes only from accepted persisted completion proof in the shared report. An unaccepted recovery candidate, mutable progress, proved-absent tmux, or malformed tmux never authorizes cleanup, including when candidate PR facts look merged. Both modes require an inactive terminal run plus exact lock, snapshot, process, tmux, Git registration/branch/path/HEAD, result, and ownership observations. Dirtiness includes staged, unstaged, and untracked files. Active, dirty, absent-unproved, unknown, mismatched, incomplete, or ambiguous resources return a stable refusal with zero unauthorized remove/delete calls. There is no `--force` bypass.

Explicit `clean` records intent and progress, captures the transcript, removes the exact terminal tmux window, removes the clean worktree with non-forced `git worktree remove`, releases an exact inactive slot, and compare-deletes the exact issue lock last. It never removes the local branch, snapshot, events, or logs. Progress is persisted before and after each step. Progress records include the same owner and run. A retry accepts absence only after that same-owner/run record proves the step completed; an absent unrecorded resource or any unrelated replacement blocks. Output identifies completed steps, remaining steps, and remediation.

Automatic merged cleanup runs on the next reconciliation-capable `status`, `list`, or `reconcile`; there is no daemon. Merged head means the immutable PR source head. The expected PR must be `MERGED`, have nonempty merge time, use the recorded issue branch, report source `headSha` equal to the commit already verified at completion, and close the issue. The merge-commit SHA is informational and may differ under merge or squash. A deleted remote issue branch does not block this proof.

Automatic mode removes only the clean exact worktree registration/path, exact inactive slot, and exact issue lock last. It retains tmux, local branch, snapshot, events, and logs. An OPEN PR is pending. A CLOSED-unmerged PR, missing merge time, source branch/SHA mismatch, unavailable GitHub, dirty worktree, lock mismatch, or ownership ambiguity preserves every worktree byte and returns `CLEANUP_MERGE_NOT_PROVED` or the named ownership refusal without rewriting a proved `completed` state.

## Migration and upgrade notes

- Valid `RunSnapshotV1` through `RunSnapshotV6` remain readable; unknown versions are rejected. Completed v2/v3 records use an exact historical AgentResult parser only at the legacy boundary: one persisted passed `just verify` entry becomes the deterministic v4 `requiredFinalValidation` preserved unchanged in v5, focused entries remain supplementary, and current configuration is never read. The historical result shape remains invalid for current publication and v4/v5 snapshots; malformed, unsupported, missing, or failed legacy completion data is rejected.
- Legacy snapshots do not contain the complete v4/v5 integration binding. They are never silently treated as v4 or v5 and cannot resume, stop, or clean until an explicit reconciliation transition proves migration.
- Existing version-1 events remain append-only history. A v2 event ahead of a legacy snapshot is not replayed because the prior revision cannot be proved.
- New runs write schema v6 and event v2. Supported exact v4/v5 snapshots normalize only through explicit revisioned transitions that preserve the v5 diagnostic and add complete exact-target authority; v1-v3 continue through the existing explicit v4 transition first and remain non-authorizing without exact selectors. ReconciliationReportV2 and status schema v4 expose the latest diagnostic separately from authorization. No destructive data migration or purge is performed.
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

Repository fixtures use temporary roots, exclusive file creation, fixed clocks/IDs, fake `gh`/byte-aware tmux/process adapters, and no ambient credentials, Copilot, or tmux resources. They repeat interruption and three-explicit-issue capacity races, assert no duplicate launch or owner, verify disjoint resource identities, exercise graceful/escalated/still-active stop ordering, inject snapshot failure after every cleanup step, retry from durable same-owner progress, refuse unrelated replacements, and prove cleanup retention/refusal, the exact six-byte no-HT record, explicit UTF-8/non-UTF8 repeats, normal and Doctor overlap isolation, full malformed matrices, diagnostic caps/confidentiality, one-pass lifecycle, zero-candidate retry, HEAD/cleanliness refusal, same-name action races, call-count invariants, and `LOG_NOT_FOUND` independence.


## Repository readiness preflight

Before issue execution, run `just run doctor` or `just run doctor --json` to inspect all repository-scoped prerequisites without selecting an issue or mutating owned run resources. A NOT READY report exits 3 and keeps all 24 checks visible. See [Phase 4 repository Doctor](phase-4-repository-doctor.md). This product command is distinct from ambient `harness doctor`, which inspects the development harness rather than Runner repository compatibility.

## RPIV progress and final-result operations

Status and list display a separately observed RPIV phase and stable progress classification; unusable current progress is `unknown`, a byte-equivalent accepted current artifact may display its phase as `PROGRESS_REPEATED`, and no progress classification changes completion, activity, decision code, safe actions, cleanup eligibility, ownership, recovery, or process control. Verify publishes immutable AgentResultV1 only after PR creation, and the coordinator validates it before zero exit. See [RPIV integration, progress, and completion handoff](rpiv-integration-contract.md) for exact schemas, atomicity, classifications, helper ownership, redaction, and troubleshooting.

## Exact target recovery and repeated absence

Every tmux operation uses `tmux -S <persisted-socket>`; ambient tmux context at recovery time is irrelevant. Observation compares the complete persisted socket filesystem identity, session, immutable window, pane, and cwd in one record. Attach and logs use the pane ID; clean removes only the immutable window ID. A mismatch or unproved absence blocks resume, attach, logs, stop, and cleanup before mutation. Once terminal state and exact observation prove absence, repeated stop/clean remains an idempotent no-op. A same-name session/window on either the selected or another server is never adopted.

Migration compatibility retains strict `RunSnapshotV1` through `RunSnapshotV5` readers and never silently treats an older record as a newer schema. New runs use `RunSnapshotV6` exact-target authority.
