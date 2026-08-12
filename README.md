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

## Quick start and control commands

```text
just run --help
just run doctor
just run doctor --json
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

## Official agent assets

Install one packaged official asset or the complete recommended set from the
target repository root:

```text
just run install agent soft-factory
just run install agent soft-factory-assessor
just run install skill soft-factory
just run install --recommended
```

The recommended batch installs the Operator at
`.agents/agents/soft-factory.agent.md`, the Assessor at
`.agents/agents/soft-factory-assessor.agent.md`, and the skill at
`.agents/skills/soft-factory/SKILL.md`. Strict `.agents/manifest.json` schema v1
records each asset’s type, name, package-coupled version, Runner protocol 1,
fixed destination, and catalog SHA-256 digest.

Sources are package-local under `assets/official/`; install performs no network
or subprocess operation. It validates protocol and integrity before writes,
preserves unrelated content, adopts identical unmanaged bytes, and is a stable
no-op after convergence. Differing bytes require exact prior manifest digest
proof; otherwise the complete batch refuses with no changes. Staged atomic
replacement writes the manifest last and either rolls back exactly or reports
uncertain rollback with direct remediation.

The Operator delegates explicit issue execution and every lifecycle operation
to Runner. The Assessor preserves the complete `soft-factory doctor --json`
readiness result as authoritative. Doctor’s canonical 24 checks and sole
`.github/agents/rpiv.agent.md` authority are unchanged. See
[`docs/phase-5-official-assets.md`](docs/phase-5-official-assets.md) for schema,
metadata, safety, errors, packaging, migration, and local deployment details.

## Repository readiness Doctor

Run `just run doctor` for complete human repository-readiness diagnostics or `just run doctor --json` for schema-version-1 automation output. Doctor reports exactly 24 ordered blocking prerequisites and exits `0` with `STATUS: READY` only when all pass; a complete blocked report exits `3` with `STATUS: NOT READY`, messages, and remediations. It is repository-only: it does not query, select, prioritize, or assess an issue. Product Doctor is distinct from ambient `harness doctor`, which diagnoses the engineering surface.

A Doctor-ready `.soft-factory/config.yml` declares protocol and safe repository roots. Existing configuration files must migrate to these fields; unknown keys at every supported mapping level—including unknown empty mappings—plus absolute/traversing/overlapping roots and unsupported protocol values fail readiness:

```yaml
protocol_version: 1
repository:
  worktree_root: .trees
  state_root: .soft-factory
execution:
  max_concurrent_runs: 2
```

The canonical `.github/agents/rpiv.agent.md` must declare `runner_protocol: 1` and `result_contract: agent-result-v1`. See [`docs/phase-4-repository-doctor.md`](docs/phase-4-repository-doctor.md) for all check IDs, schema, fixtures, timing, path safety, operations, and troubleshooting.

Every product run names one explicit positive issue number. Runner never queries for, queues, ranks, or selects a next issue. `run` creates new state only; existing state returns `RUN_EXISTS` and must be inspected with reconciliation or control commands. Human and JSON output derive from the same state, outcome code, reconciliation observation states/codes/facts, safe actions, control facts, and remediation; human control output includes the same shared report carried by JSON.

## Recovery and concurrency

New runs use revisioned `RunSnapshotV3` and replayable `TransitionEventV2` records. Reconciliation separately compares persisted state with issue locks, concurrency slot leases, filesystem paths, Git worktree/branch/HEAD/dirtiness, tmux identity, worker and RPIV process identity, strictly parsed identity-matching result artifacts, remote branch facts, and GitHub pull-request facts. Unknown or contradictory observations block launch, signaling, reuse, and cleanup.

A matching live RPIV process is identified by PID, process group, OS start token, resolved executable, exact arguments, cwd, launch time, and tmux pane lineage. It is preserved as `active_preserved`; reconcile and resume do not increment the attempt or launch a duplicate.

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
- [`docs/phase-5-official-assets.md`](docs/phase-5-official-assets.md) — official asset commands, manifest, integrity, transactions, authority, packaging, migration, and operations
- [`docs/phase-1-issue-run.md`](docs/phase-1-issue-run.md) — issue readiness, ownership, fetched base, AgentResultV1, and completion proof
- [`docs/phase-4-repository-doctor.md`](docs/phase-4-repository-doctor.md) — repository readiness checks, schema, configuration migration, fixtures, timing, and troubleshooting
- [`docs/phase-3-recovery-operations.md`](docs/phase-3-recovery-operations.md) — CLI, configuration, recovery, concurrency, stop, logs, cleanup, migration, operations, and deployment
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — RPIV contribution workflow
- [`.harness/engineering-harness.md`](.harness/engineering-harness.md) — deterministic harness governance
- [`project/`](project/) — architecture decisions, core-components, and work-item evidence
