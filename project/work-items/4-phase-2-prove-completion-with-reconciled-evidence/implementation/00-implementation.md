# Implementation Evidence: Issue #4 Phase 2 Completion Proof

## Scope and completed tasks

- T-1 complete: strict `AgentResultV1`, ordered required AC extraction, snapshot v2, event-first persistence, legacy v1 reads, and explicit terminal contracts.
- T-2 complete: pure deterministic reconciliation with stable decision and mismatch codes.
- T-3 complete: owned result reads, bounded Git/GitHub completion adapters, worker finalization, persistence, rendering, and exit mapping.
- T-4 complete: deterministic successful reconciliation and false-completion fixtures through normal composition.
- T-5 complete: README/operator documentation, migration/troubleshooting guidance, documentation tests, and stage gates.

Task statuses are recorded as Complete in `plan/02-task-breakdown.md`.

## Acceptance evidence

### AC-1

`src/domain.ts` defines the versioned artifact containing issue, outcome, branch, full head SHA, pull request, acceptance results, validations, and completion time. `src/completion.ts` strictly parses the complete schema and rejects missing, malformed, unsupported, duplicate, invalid SHA/time, empty evidence, and extra-field variants. `src/orchestrator.ts` reads only `<owned-worktree>/.soft-factory/agent-result.json`. `src/completion.test.ts` and `src/orchestration.test.ts` exercise valid and invalid owned artifacts.

### AC-2

`src/domain.ts` defines `RunSnapshotV2` and schema-versioned transition events. `src/persistence.ts` appends each JSONL event before atomic snapshot replacement, reads valid v1/v2 snapshots, and rejects unknown schemas. Persistence fixtures prove append failure leaves the prior snapshot and replacement failure preserves the appended event.

### AC-3

The typed state model includes explicit `completed`, `failed`, `blocked`, `cancelled`, and `interrupted` terminals plus `finalizing`. Persistence tests round-trip all five terminals. Human/JSON rendering derives from common snapshot facts, and the worker returns success only for `completed`.

### AC-4

`reconcileCompletion` requires the full conjunction: owned issue/branch, result/local/remote SHA, selected remote/branch, open PR number/base/head/SHA/issue linkage, every persisted required AC verified with evidence, and passed `just verify-focused` plus `just verify`. `src/orchestration.test.ts` proves zero exit to `finalizing` to one completed terminal; `src/integration.test.ts` proves temporary Git local/remote observations and strict fake-`gh` PR-by-number parsing.

### AC-5

Zero-exit orchestration fixtures for missing, malformed, and unsupported artifacts persist `interrupted`, never `completed`, and do not request Git completion observations. CLI success mapping is limited to `completed`.

### AC-6

The parameterized reconciliation matrix independently rejects issue, branch, local SHA, remote identity/branch/SHA, PR number/state/base/head/SHA/issue linkage, acceptance missing/duplicate/unverified/empty evidence, and validation missing/duplicate/failed variants. Each result is `failed` with a stable mismatch code and is not completed.

### AC-7

The deterministic suite contains one complete golden conjunction, strict artifact rejection variants, every isolated false-completion comparison, incomplete observation and named non-success classifications, all terminal persistence round trips, write-failure ordering, temporary Git facts, and credential-free fake GitHub facts. There is no production test switch.

## Documentation evidence

- `README.md`: Phase 2 capability, owned artifact path, reconciliation conjunction, and false-completion classification.
- `docs/phase-1-issue-run.md`: setup/configuration, exact `AgentResultV1` schema, required AC/root validations, fresh observations, five terminal states, exit behavior, v1/v2 migration compatibility, persistence ordering, troubleshooting, fixture matrix, and Prototype 3 deferrals.
- `src/documentation.test.ts`: executable command examples and assertions for AC-1 through AC-7 documentation; stale Phase 1 completion-deferral claims are prohibited.
- Architecture explanation is supplied by `ADR-260811-prototype-two-completion-proof.md`, `CORE-COMPONENT-260811-completion-evidence-reconciliation.md`, and Decision Log entries 49-62.
- No API specification impact: the repository exposes a local CLI, not an HTTP API. No configuration option/default changed. Migration behavior is documented for readable v1 snapshots and explicit v2 evidence transitions. No deployment/runbook surface exists beyond the updated operator guide.

## Validation evidence

### Orientation

- `harness boot --json`: status `ok`; application exit 0; exact bootstrap signal observed; composed full checks exit 0 and status `ok`.
- Root `just --list`: exposes authoritative `verify-focused` and `verify` recipes.

### Focused

- Direct `just verify-focused`: passed after each T-1 through T-5 correction boundary; final run passed 5 suites and 76 tests with `git diff --check` clean.
- `harness checks --focused --json`: final status `ok`, scope `focused`, delegated command `just verify-focused`, exit code 0, 5 suites and 76 tests passed.

### Full

- Initial direct `just verify` reached `format-check` and identified 12 changed files requiring normalization; files were formatted and the complete command was rerun.
- Final direct `just verify`: passed lint, format-check, strict type-check, 5 suites/76 tests, coverage, build, and `git diff --check`.
- `harness checks --json`: status `ok`, scope `full`, delegated command `just verify`, exit code 0; all full stages passed.
- Separate `git diff --check`: exit code 0.

### Coverage

Final global Jest coverage: statements 91.07%, branches 85.71%, functions 97.84%, lines 92.54%. All values exceed the 80% architecture threshold.

## RPIV friction drain evidence

Durable schema-version-1.2 records were scaffolded, populated with every pending observation, and read back before clearing:

- `.harness/records/retro/2026-08-11/013-issue-4-rpiv-research.md` — 4 Research entries.
- `.harness/records/retro/2026-08-11/014-issue-4-rpiv-planner.md` — 1 Plan entry.
- `.harness/records/retro/2026-08-11/015-issue-4-rpiv-implementer.md` — 10 Implement entries.

Coordinator `rpiv` had no pending entries. Clear envelopes were status `ok` with counts 4, 1, and 10. Post-clear list envelopes for `rpiv`, `rpiv-research`, `rpiv-planner`, and `rpiv-implementer` were status `ok` with empty observation arrays.

## Changed surfaces

Product code: domain/result contracts, readiness extraction, persistence, reconciliation, ports, live adapters, worker orchestration, rendering, help, and CLI exit mapping. Tests: completion, orchestration, integration, documentation, and existing CLI contracts. Documentation/architecture/work-item artifacts and durable retro records are included. This record provides Implement-stage evidence only; acceptance remains owned by Verify.
