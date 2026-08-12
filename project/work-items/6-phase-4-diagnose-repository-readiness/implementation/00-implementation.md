# Implementation Notes: Issue #6 — Phase 4 repository readiness Doctor

## Scope and completed tasks

Implementation completed T-1 through T-7 in dependency order. Each task is marked `Completed` in `plan/02-task-breakdown.md`.

- **T-1:** Added the closed 24-ID Doctor schema, blocking/result contracts, dependency table, strict configuration fields, RPIV metadata parser, and Doctor error categories.
- **T-2:** Added direct PATH resolution and bounded shell-free repository, GitHub authentication, and Copilot usability adapters with a 2,000 ms per-call limit, environment allowlist, redaction, concurrency, and no retries.
- **T-3:** Added canonical RPIV/config/protocol/result-contract checks, lexical and physical root containment, Git ignore proof, and reversible state-root probes.
- **T-4:** Added read-only recognized state/lock/runtime inventory, exact numeric-worktree ownership reconciliation, and exclusive reversible required-path probes.
- **T-5:** Added `doctor [--json]` parsing, repository-only dispatch before issue-service construction, complete service assembly, shared human/JSON rendering, and exits 0/3/2.
- **T-6:** Added tracked ready/blocked/24-isolated-failure manifests, matrix/parity/tripwire fixtures, controlled built-process execution, determinism, and monotonic timing assertions.
- **T-7:** Updated help, RPIV metadata, README, docs index, configuration/migration guidance, Phase 1 and Phase 3 cross-references, the Phase 4 operations guide, and executable documentation assertions.

## Acceptance evidence

### AC-1 — Five repository checks

- `src/doctor.ts` fixes the five ordered `repository.*` IDs.
- `observeDoctorRepository` independently records membership, primary worktree, common directory, one GitHub identity, and default branch; dependency failures remain explicit records.
- `src/doctor-adapters.test.ts` verifies exact bounded Git argument arrays and independent failure behavior; `fixtures/doctor/*.json` and `src/doctor-integration.test.ts` prove all five in complete reports.

### AC-2 — Commands, authentication, and usability

- `resolveDoctorExecutables` checks executable/access status for `git`, `gh`, `tmux`, `node`, and `copilot` directly from PATH.
- Authentication uses exact `gh auth status --hostname <host>` and `copilot --version` argument arrays with `shell: false`, 2,000 ms, one attempt, allowlisted environment, bounded redacted output, and concurrent independent probes.
- Adapter tests prove present/absent, non-executable, nonzero, timeout, argument, host, redaction, and no-retry behavior for all seven IDs.

### AC-3 — Eight compatibility checks

- `src/doctor-compatibility.ts` emits separate RPIV asset, protocol, strict configuration, worktree-root, writable-state-root, trees-ignore, runtime-state-ignore, and result-contract observations.
- Configuration requires known keys and safe normalized roots; Doctor requires explicit protocol 1. Canonical RPIV frontmatter now declares `runner_protocol: 1` and `result_contract: agent-result-v1`.
- `src/doctor-compatibility.test.ts` covers pass, metadata/protocol/result mismatch, invalid/unknown config, file collision, symlink escape, exact ignore probes, byte preservation, and reversible probe cleanup.

### AC-4 — Four runtime-safety checks

- `src/doctor-runtime.ts` separately reports numeric worktree ownership, recognized state readability, lock/lease interpretability, and required-path creation safety.
- Existing strict `parseSnapshot`, result parsing, and newly exported strict event/owner/lease guards are reused read-only. Unrelated names are ignored; recognized malformed records fail.
- Runtime tests prove empty and exact-owned passes, malformed recognized state/locks, unrelated-name handling, ownership mismatch preservation, exact Git worktree inventory, exclusive probe collision handling, and unchanged recognized/unrelated bytes. Existing persistence suites retain v1-v3 schema coverage.

### AC-5 — Stable schema-v1 human/JSON parity

- `DOCTOR_CHECK_IDS` is asserted as 24 unique IDs in canonical order; all checks have `blocking: true`.
- `makeDoctorResult` rejects missing/reordered arrays and derives readiness from one typed result. `renderDoctor` derives both modes from that result.
- `src/doctor-cli.test.ts` normalizes and compares every field for all-pass and every isolated failure. Built ready/blocked human and JSON process outputs also compare equal.

### AC-6 — Decisions, remediation, and exits

- Every one-check-failed variant produces `ready: false`, exact `STATUS: NOT READY`, nonempty prerequisite/remediation details, and exit 3; all-pass produces `ready: true`, exact `STATUS: READY`, and exit 0.
- Invalid Doctor grammar exits 2. Adapter uncertainty is complete failed report data rather than fail-fast omission.

### AC-7 — Repository-only boundary

- Doctor accepts no issue input and `runCli` dispatches it before constructing `IssueRunService`.
- Proxy tripwires in CLI and 24 isolated fixture executions throw on any issue-port access; all pass with zero issue API, issue parsing, prioritization, ownership, branch, worktree, or run creation calls.
- Help, README, docs index, Phase 3 operations, and the Phase 4 guide explicitly distinguish product Doctor from ambient `harness doctor` and prohibit issue selection or assessment.

### AC-8 — Complete ready and blocked fixtures

- `fixtures/doctor/ready.json` and `blocked.json` each declare schema, repository facts, readiness, ordered unique IDs, statuses, blocking values, and failure details where applicable.
- `src/doctor-integration.test.ts` validates both manifests before execution, repeats the controlled ready JSON run, and compares built-process human/JSON semantics for ready and blocked repositories.

### AC-9 — Pass/fail proof for every ID

- `fixtures/doctor/isolated-failures.json` names exactly one isolated failing variant per canonical ID.
- The parameterized acceptance test executes every variant through normal CLI composition and machine-checks a 24-row matrix with `ready` as the pass witness and each named variant as the fail witness.
- Adapter, compatibility, and runtime suites provide lower-level deterministic pass/fail evidence without live network, credentials, tmux, or Copilot dependencies.

### AC-10 — Controlled built-process timing

- The integration fixture builds `dist/index.js`, creates local fake `git`, `gh`, `tmux`, `node`, and `copilot` executables, controls all network-like responses, and measures monotonic wall-clock time immediately before spawn through process exit.
- Three controlled ready built-process invocations (two JSON, one human) each assert `elapsedMs <= 10,000`, exit 0, READY, and 24 passed checks. Product constants remain 2,000 ms per external probe and 9,000 ms aggregate.
- Exact focused acceptance command completed both suites in 6.506 s total; the integration suite itself completed in 5.98 s while including build, three ready processes, two blocked processes, manifest, matrix, parity, and cleanup work.

## Documentation evidence

- **README/setup/usage:** `README.md` adds Doctor commands, prerequisite behavior, 24-check/exit summary, repository-only boundary, configuration migration, metadata, and guide link.
- **Configuration/migration:** `README.md`, `docs/phase-1-issue-run.md`, and `docs/phase-4-repository-doctor.md` document `protocol_version`, safe roots/defaults, unknown-key rejection, canonical RPIV metadata, and the compatibility migration. No persisted-data migration is introduced.
- **Operations:** `docs/phase-4-repository-doctor.md` documents all IDs/remediation categories, schema/parity/exits, bounds/redaction, safe probes, runtime ownership/state handling, fixtures, timing, and troubleshooting. `docs/phase-3-recovery-operations.md` adds the preflight cross-reference.
- **Documentation map:** `docs/README.md` and README documentation links include Phase 4.
- **Architecture:** adopted ADR, core-component, and `DECISION-LOG.md` entries are included unchanged from Plan boundaries.
- **API/deployment:** no network API, daemon, endpoint, container, or deployment contract changed; the guide records that API specification/API migration is not applicable and local short-lived CLI operations remain unchanged.
- **Executable proof:** `src/documentation.test.ts` asserts commands, all IDs, schema/exits, migration, metadata, bounds, fixtures, no-issue boundary, no harness dependency, API no-impact, and help output.

## Validation evidence

### Orientation

- `harness boot --json`: status `ok`; application exit 0; exact bootstrap signal observed; composed full checks exit 0/status `ok`; baseline 149 tests passed.

### Focused task gates

- T-1 through T-7 each ended with direct `just verify-focused` exit 0 and `harness checks --focused --json` status `ok`, delegated command `just verify-focused`, exit 0.
- Final focused gate: 14 suites, 177 tests passed, `git diff --check` passed.
- Exact acceptance command `just verify-focused -- src/doctor.test.ts src/doctor-integration.test.ts`: exit 0; 2 suites, 8 tests passed; 6.506 s; nested diff check passed.
- `just run --help`: exit 0 and shows `soft-factory doctor [--json]` plus the repository-only statement.

### Full gates

- Direct `just verify`: exit 0 after fixes; lint, Prettier check, strict typecheck, 14 suites/177 tests, build, and diff check passed.
- Global coverage: **84.8% statements, 80.69% branches, 89.67% functions, 86.79% lines**, all at or above 80%.
- `harness checks --json`: status `ok`; scope `full`; delegated command `just verify`; exit 0; 14 suites/177 tests; same coverage; build and diff check passed.
- Standalone `git diff --check`: exit 0.

## Harness friction records

Pending buffers were listed as JSON, every observation was preserved in a schema-1.2 record with `plan_id: 6-phase-4-diagnose-repository-readiness` and `disposition: kept`, each record was read back before clearing, and post-clear lists were empty:

- `.harness/records/retro/2026-08-12/001-issue-6-rpiv-research.md` — 2 Research observations; clear envelope status `ok`, `cleared: 2`.
- `.harness/records/retro/2026-08-12/003-issue-6-rpiv-planner.md` — 1 Plan observation; clear envelope status `ok`, `cleared: 1`.
- `.harness/records/retro/2026-08-12/002-issue-6-rpiv-implementer.md` — 11 Implement observations; clear envelope status `ok`, `cleared: 11`.
- Coordinator `rpiv` buffer contained zero observations and remained empty; no synthetic retro was created.

## Handoff caveats

- The repository intentionally ignores `.soft-factory/` runtime state, so a developer checkout without a local strict config can correctly report NOT READY; controlled acceptance fixtures provide deterministic READY/NOT READY evidence without committing runtime state or credentials.
- No GitHub acceptance checkboxes were changed. Final verification and acceptance remain owned by Verify.
