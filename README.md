# Soft Factory Runner

[![APS version](https://img.shields.io/badge/APS-v1.2.2-blue?logo=github)](https://github.com/chris-buckley/agnostic-prompt-standard/releases/tag/v1.2.2)

Soft Factory Runner is a local-first TypeScript CLI for deterministic, isolated, recoverable RPIV delivery of explicitly selected GitHub issues. Runner owns operational state, locks, worktrees, tmux processes, recovery, and cleanup; RPIV owns software-engineering decisions.

## Development and installation

Install Node.js 22+, Git, GitHub CLI (`gh`), tmux, Copilot CLI, `just`, and ambient `@ai-substrate/engineering-harness` v0.13.0. The harness is an external development prerequisite, not an npm or runtime dependency.

```text
just setup
just build
harness instructions
harness boot --json
harness checks --focused --json
just verify-focused
just verify
```

The root `justfile` is command authority. `just setup` and `just build` do not globally install or link `soft-factory`; run the local CLI through `just run`. Harness checks delegate to root recipes and do not replace direct RPIV validation.

### Current package release and 0.1.3-to-0.2.0 upgrade

The current local npm package release is **0.2.0**, backward-compatible exact tmux-context functionality. This repository does not claim registry publication and the CLI has no `--version` command. Build and pack the checked-out release, then upgrade an existing 0.1.3 prefix or reinstall the same tarball:

```text
just build
mkdir -p /tmp/soft-factory-runner-0.2.0
npm pack --json --pack-destination /tmp/soft-factory-runner-0.2.0
PREFIX="${SOFT_FACTORY_PREFIX:-$HOME/.local/soft-factory-runner}"
npm install --ignore-scripts --no-audit --no-fund --omit=dev --prefix "$PREFIX" /tmp/soft-factory-runner-0.2.0/soft-factory-runner-0.2.0.tgz
node -p "require('$PREFIX/node_modules/soft-factory-runner/package.json').version"
```

The metadata command must print exactly `0.2.0`. For a clean reinstall, run `npm uninstall --prefix "$PREFIX" soft-factory-runner` before the same local-tarball install. From each target repository, reconverge package-coupled official assets and confirm the generated manifest:

```text
"$PREFIX/node_modules/.bin/soft-factory" install --recommended
node -p "require('./.agents/manifest.json').assets.map(({version}) => version).join(',')"
```

The manifest command must also print exactly `0.2.0`.

## Quick start and control commands

```text
just run --help
just run doctor
just run doctor --json
just run instructions
just run instructions --json
just run run --issue 5 --json
just run reconcile 5 --json
just run resume 5 --json
just run stop 5 --json
just run clean 5 --json
just run list --json
just run status 5 --json
just run attach 5
just run logs 5 --json
```

## RPIV integration contract

`just run instructions [--json]` deterministically reports the Runner-owned progress/result handoff. New runs require the root `justfile` to prove and snapshot one declared `rpiv.final_validation`, defaulting to `just verify`; a missing root file fails before ownership, and focused validation is implementation feedback only. RPIV publishes mutable `.soft-factory/rpiv-status.json`, while Verify publishes immutable no-clobber `.soft-factory/agent-result.json` only after PR creation, the tracked verification summary/retro commit is pushed, and the PR is independently confirmed at the final head. Runner binds the helper to those observed PR facts, and the coordinator validates that bound result before zero exit; every failure path first attempts terminal failed progress. Status/list report phase separately from operational state, and every progress classification remains diagnostic-only. See [`docs/rpiv-integration-contract.md`](docs/rpiv-integration-contract.md) for configuration grammar, schemas, classifications, atomicity, v6/v5/v4/legacy migration, redaction, troubleshooting, API applicability, and local deployment boundaries.

After Copilot exits, Runner reloads the strict current snapshot and requires the exact run, owner, worker, and awaited RPIV identity before using the latest revision for zero-exit finalization or nonzero failure. Concurrent progress, immutable result, and retained diagnostic facts survive unchanged. Missing, invalid, mismatched, or reload/save-raced state returns `POST_WAIT_STATE_REFUSED` with a closed reason and no stale fallback save, duplicate launch, result overwrite, or ownership release; exact terminal repeats are idempotent. Release 0.2.0 upgrades new run persistence to v6 for exact tmux targeting. Existing v1-v5 records remain readable but cannot authorize tmux mutation without a complete explicitly migrated target. There is no network API, configuration key/default, database migration, service, container, or deployment change.

## Official delivery agent

Soft Factory Runner publishes exactly one official asset. From the target repository root, both supported install forms run the same convergence:

```text
just run install agent soft-factory
just run install --recommended
```

The package-local source `assets/official/soft-factory.agent.md` installs byte-for-byte at `.github/agents/soft-factory.agent.md`; strict schema-v1 ownership remains at `.agents/manifest.json` with package version 0.2.0, Runner protocol 1, destination, and SHA-256. The npm allowlist names only that source, so assessor, skill, sibling, and local comparison files are not published. Removed assessor and skill selectors return `CLI_INVALID`.

Existing matching ownership at `.agents/agents/soft-factory.agent.md` migrates to the Copilot project-agent path; an absent old file retires stale metadata. Desired current bytes are adopted without rewrite, while older current bytes upgrade only with exact recorded digest proof. Matching historical assessor and skill files retire; modified or unproved bytes refuse the complete operation with `No files changed`. Untracked skill siblings and every unrelated file remain unchanged, and known legacy directories are removed only when proved retirement leaves them empty. Repeating a successful operation is a zero-mutation no-op.

Every mutation is one manifest-last transaction across `.github/` and `.agents/`. A caught failure either restores exact pre-invocation bytes and path kinds or returns `ASSET_ROLLBACK_UNCERTAIN` with every affected path; stop, inspect and restore all listed paths from version control or backup, then retry only after restoration.

Invoke the installed agent with an explicit canonical issue, for example `soft-factory run --issue 27 --json`. It reads `soft-factory instructions --json` before `soft-factory doctor --json`, dispatches only when Doctor is ready, preserves applicable Runner output unchanged, and separates dispatch acceptance from ticket completion. Runner remains the only authority for worktrees, locks, state, processes, cleanup, and completion. Doctor keeps its canonical 24 checks and sole `.github/agents/rpiv.agent.md` readiness authority.

See [`docs/phase-5-official-assets.md`](docs/phase-5-official-assets.md) for the closed migration vocabulary, both-destination rules, package inventory, errors, rollback, and no-API/service/deployment scope.

## Repository readiness Doctor

Run `just run doctor` for complete human repository-readiness diagnostics or `just run doctor --json` for strict `DoctorResultV2` (`schemaVersion: 2`) automation output. Doctor reports exactly 24 ordered blocking prerequisites and exits `0` with `STATUS: READY` only when all pass; a complete blocked report exits `3` with `STATUS: NOT READY`, messages, and remediations. It is repository-only: it does not query, select, prioritize, or assess an issue. Product Doctor is distinct from ambient `harness doctor`, which diagnoses the engineering surface.

The existing `command.tmux` row now proves function, not only executable presence. Doctor creates one private mode-0700 OS-temporary workspace with an empty mode-0600 configuration and helper, starts the discovered executable in the foreground as `tmux -D -S <private-socket> -f <empty-config>` with no command, and uses that private `-S` socket for every client operation. It proves session/dashboard creation, `has-session`, exact window listing, helper process ownership, strict original-byte window creation, `remain-on-exit`, one strict pane observation with equal IDs and physical cwd, and exact window removal. The shared printable-pipe transport works for explicit UTF-8 and non-UTF8 tmux client states without locale inheritance or `tmux -u`. Each stream retains at most 4096 bytes while counting all bytes; evidence is value-free. Functional work stops at 6500 ms, leaving 2500 ms for awaited cleanup and final server/helper/socket/workspace absence proof by 9000 ms. Doctor never contacts or destroys an ambient/default tmux server.

Schema-v1 Doctor automation consumers and tracked manifests must migrate to schema v2. The 24 IDs, readiness conjunction, and exits are unchanged; failed `command.tmux` may now include `DoctorTmuxProbeEvidenceV1` operation, reason, bounds, optional structural diagnostic, and cleanup states. This Doctor-only change adds no configuration option/default or configuration migration, run snapshot or issue-run tmux change, network API/specification, database/data migration, service, container, or deployment procedure.

A Doctor-ready `.soft-factory/config.yml` declares protocol and safe repository roots. Existing configuration files must migrate to these fields; unknown keys at every supported mapping level—including unknown empty mappings—plus absolute/traversing/overlapping roots and unsupported protocol values fail readiness:

```yaml
protocol_version: 1
repository:
  worktree_root: .trees
  state_root: .soft-factory
execution:
  max_concurrent_runs: 2
```

## Copilot child environment configuration

Configure literal variables for Runner-launched Copilot children under the single `copilot.environment` mapping:

```yaml
copilot:
  environment:
    COPILOT_OTEL_ENABLED: "true"
    COPILOT_OTEL_EXPORTER_TYPE: "otlp"
    OTEL_EXPORTER_OTLP_ENDPOINT: "https://collector.example.invalid"
    OTEL_SERVICE_NAME: "soft-factory-rpiv"
    OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT: "false"
    OPTIONAL_EMPTY: ""
```

Names must match `[A-Za-z_][A-Za-z0-9_]*`. Values must be string scalars; quote YAML booleans, numbers, and null-like text, and use `""` for an explicit empty string. Values are passed literally with `shell: false`: Runner performs no shell evaluation, command substitution, or variable expansion.

Each new or resumed Copilot launch reads the current file and creates a fresh immutable environment snapshot. The merge order is the existing allowlisted inherited environment, then `copilot.environment`, then Runner-owned `OTEL_RESOURCE_ATTRIBUTES=project.name=<normalized-project-name>,issue.id=issue-<number>`. Configured entries override inherited names, but cannot override Runner-owned resource attributes. An absent `copilot` mapping, absent `environment`, or empty environment mapping adds nothing and preserves prior behavior.

The mapping applies only to Copilot. It never changes Runner, Git, `gh`, tmux, worker, Doctor, or generic subprocess environments. Duplicate or invalid names, non-string or nested values, aliases, anchors, merge keys, unsupported keys, and malformed syntax fail before launch. Diagnostics identify only the field and reason, with no value included. A rejected launch leaves no cached environment; correct the file and explicitly retry to use the new configuration. Runner never writes configured names or values to snapshots, events, launch intents, retained logs, or human/JSON output. External Copilot output remains outside this Runner confidentiality boundary.

This option is additive. Existing files need no migration when no Copilot overrides are wanted. Copilot argument order remains shell-free and stable while the prompt carries the new redacted launch binding. Copilot environment configuration itself remains additive. RPIV integration binding is preserved in RunSnapshotV5 and the migration rules documented in the integration guide: valid completed v2/v3 snapshots with the historical pre-binding AgentResult remain readable and deterministically derive sole `just verify` from persisted proof without current configuration, while current v5 and AgentResult parsing stays strict. It adds no network API or deployment service.

The canonical `.github/agents/rpiv.agent.md` must declare `runner_protocol: 1` and `result_contract: agent-result-v1`. See [`docs/phase-4-repository-doctor.md`](docs/phase-4-repository-doctor.md) for all check IDs, schema, fixtures, timing, path safety, operations, and troubleshooting.

Every product run names one explicit positive issue number. Runner never queries for, queues, ranks, or selects a next issue. `run` creates new state only; existing state returns `RUN_EXISTS` and must be inspected with reconciliation or control commands. Human and JSON output derive from the same state, outcome code, reconciliation observation states/codes/facts, safe actions, control facts, and remediation; human control output includes the same shared report carried by JSON.

## Recovery and concurrency

New runs use revisioned `RunSnapshotV6` and replayable `TransitionEventV2` records. V6 adds complete persisted tmux server/session/window/pane authority while retaining the nullable `TmuxIdentityDiagnosticV1`; supported exact legacy records normalize only through explicit revisioned transitions, while v1-v5 remain readable under their versioned safety limits and cannot invent missing selectors. `ReconciliationReportV3` uses schema v3 and `StatusFactsV5` uses status schema v5. Reconciliation separately observes mutable RPIV progress and compares persisted state with issue locks, concurrency slot leases, filesystem paths, Git worktree/branch/HEAD/dirtiness, tmux identity, worker and RPIV process identity, strictly parsed identity-matching result artifacts, remote branch facts, and GitHub pull-request facts. Unknown or contradictory observations block launch, signaling, reuse, and cleanup.

A matching live RPIV process is identified by PID, process group, OS start token, resolved executable, exact arguments, cwd, launch time, and tmux pane lineage. It is preserved as `active_preserved`; reconcile and resume do not increment the attempt or launch a duplicate.

When `running_rpiv` has no RPIV and an absent or unrecorded worker, a strict successful identity-, acceptance-, and final-validation-bound result is only an unaccepted recovery candidate. Its head and PR number may key one bounded worktree, fresh-remote, and open-PR observation, but never authorize ownership or cleanup. Unknown facts take precedence over contradictions; malformed tmux stays unknown. Only `FINALIZATION_RECOVERY_AVAILABLE` permits explicit `resume` to persist `finalizing` and run strict finalization with no attempt increment or worker/RPIV launch. Progress, candidate facts, proved-absent tmux, and malformed tmux remain non-authorizing; contradictory candidate evidence preserves every resource and fails closed. Human and JSON reports distinguish `recovery_candidate` query authority from `persisted_completion`.

Tmux identity transport is strict and byte-based in both UTF-8 and non-UTF8 client states. Creation accepts exactly `@<digits>|%<digits><LF>`; observation accepts exactly `@<digits>|%<digits>|<cwd><LF>`. Exactly one terminal LF is required. The parser uses only the first two printable vertical bars, so every remaining valid UTF-8 cwd byte—including additional vertical bars—is retained unchanged; cwd must be nonempty and contain no NUL, CR, or LF. HT, inferred sanitized underscores, alternate separators, missing/extra terminators, invalid IDs/cwd, and multiple records are malformed or ambiguous. Runner retains only phase, exit code, original stdout/stderr byte counts, up to 8 record/field summaries, and up to 32 closed value-free structural tokens including `vertical_bar` and legacy-readable `horizontal_tab`; it never retains raw output, cwd/path components, command/environment/field values, run identities, hashes, or other-run bytes.

A `starting_tmux` run may resume window creation only when lock and lease match; worktree path, registration, branch, fetched-base HEAD, and staged/unstaged/untracked cleanliness match; no tmux identity is persisted; and one name-only observation finds zero same-name windows. The create adapter repeats only that name-absence check immediately before one attempt. Any same-name window remains unknown ownership and is never inspected or adopted by name, cwd, identity, or process command. A retained identity diagnostic is non-authorizing and is not a transcript: without a persisted identity or retained transcript, `logs` still returns `LOG_NOT_FOUND`. This recovery change adds no configuration option/default or migration, network API/specification, database/data migration, service, container, or deployment procedure.

Configure repository-wide explicit-run capacity in `.soft-factory/config.yml`:

```yaml
protocol_version: 1
repository:
  worktree_root: .trees
  state_root: .soft-factory
execution:
  max_concurrent_runs: 2
```

The value is a strict positive safe integer and defaults to `1`. Each active issue atomically owns one slot under `.soft-factory/concurrency/slots/`. Unknown leases consume capacity, unsafe limit reductions block admission, and a capacity loser returns `CONCURRENCY_LIMIT_REACHED` without downstream resources or a leftover just-created issue lock.

`stop` captures terminal history, sends `SIGTERM`, waits at most 10 seconds, then sends `SIGKILL` only when still active and waits at most 5 additional seconds. Cancellation and slot release occur only after inactivity is proved; if the exact process remains active after escalation, Runner returns `STOP_PROCESS_STILL_ACTIVE` while preserving process identity, ownership, capacity, worktree, and tmux. Redacted attempt logs are capped at 2 MiB and retained at `.soft-factory/logs/<issue>/<attempt>.log`.

After completion, Runner treats the immutable pull-request source head—not the merge commit—as merged-head proof. On the next `status`, `list`, or `reconcile`, a `MERGED` PR with a nonempty merge time, expected source branch, matching verified source SHA, clean exact worktree, and complete ownership proof triggers automatic non-forced removal of only the owned worktree and exact issue lock/slot. The local branch, tmux window, snapshot, events, and logs remain. Closed-unmerged, dirty, active, unknown, mismatched, or ambiguous facts preserve resources and return an actionable blocked outcome. There is no force-clean or evidence-purge command.

See [`docs/phase-3-recovery-operations.md`](docs/phase-3-recovery-operations.md) for command exits, resume decisions, migration, cleanup retry semantics, troubleshooting, and deployment limitations. See [`docs/phase-1-issue-run.md`](docs/phase-1-issue-run.md) for readiness, fetched-base, and completion-proof contracts.

## Documentation

- [`PRD.md`](PRD.md) — product requirements and staged MVP evolution
- [`docs/rpiv-integration-contract.md`](docs/rpiv-integration-contract.md) — RPIV instructions, final-validation configuration, progress/result schemas, migration, safety, and operations
- [`docs/phase-5-official-assets.md`](docs/phase-5-official-assets.md) — official asset commands, manifest, integrity, transactions, authority, packaging, migration, and operations
- [`docs/phase-1-issue-run.md`](docs/phase-1-issue-run.md) — issue readiness, ownership, fetched base, AgentResultV1, and completion proof
- [`docs/phase-4-repository-doctor.md`](docs/phase-4-repository-doctor.md) — repository readiness checks, schema, configuration migration, fixtures, timing, and troubleshooting
- [`docs/phase-3-recovery-operations.md`](docs/phase-3-recovery-operations.md) — CLI, configuration, recovery, concurrency, stop, logs, cleanup, migration, operations, and deployment
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — RPIV contribution workflow
- [`.harness/engineering-harness.md`](.harness/engineering-harness.md) — deterministic harness governance
- [`project/`](project/) — architecture decisions, core-components, and work-item evidence

## Exact tmux context ownership (0.2.0)

At command entry Runner reads only the complete pair `TMUX` and `TMUX_PANE`. A valid in-tmux invocation resolves the canonical custom socket, current session, window, pane, and cwd with one bounded read-only query. With both variables absent, Runner deterministically derives a repository-owned standalone socket/session; it never probes or adopts an ambient/default server. Partial, malformed, stale, cross-socket, nested, contradictory, or ambiguous evidence returns `TMUX_CONTEXT_REFUSED` before ownership or tmux mutation. Existing same-name windows are preserved, never adopted.

New `RunSnapshotV6` state persists the canonical socket path and filesystem device/inode plus immutable session, window, pane, and cwd identity. Status, reconcile, resume, stop, clean, attach, and logs always route with the persisted socket selector, regardless of the later caller's tmux context. Attach/capture target the pane ID and cleanup targets the window ID. Complete equality authorizes action; mismatch or unproved absence refuses. Proved-absent terminal stop/cleanup repeats are stable. Raw `TMUX` tuples, server PIDs, malformed values, and unrelated inherited environment values are never persisted or rendered.

Doctor retains its ordered 24 checks. `command.tmux` adds value-free targeting evidence classified as `invoking-valid`, `standalone-fallback`, or `invalid-context` with a closed reason. Doctor measures bounded before/after ambient and unrelated inventories, emits only value-free unchanged booleans, and performs no target mutation or standalone creation.

The local snapshot schema changes to v6; this is not a database or data migration and does not introduce a service, container, deployment, network API, or API specification.
