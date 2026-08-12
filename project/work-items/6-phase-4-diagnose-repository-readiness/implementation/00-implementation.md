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
- Configuration validates scalar and mapping-only keys at every supported level, rejects top-level and nested unknown empty mappings, preserves known empty mappings/defaults, and requires safe normalized roots; Doctor requires explicit protocol 1. Canonical RPIV frontmatter now declares `runner_protocol: 1` and `result_contract: agent-result-v1`.
- `src/doctor-compatibility.test.ts` covers pass, metadata/protocol/result mismatch, invalid/unknown config, file collision, symlink escape, exact ignore probes, byte preservation, and reversible probe cleanup.

### AC-4 — Four runtime-safety checks

- `src/doctor-runtime.ts` separately reports numeric worktree ownership, recognized state readability, lock/lease interpretability, and required-path creation safety.
- Existing strict `parseSnapshot`, result parsing, and newly exported strict event/owner/lease guards are reused read-only. Unrelated names are ignored; recognized malformed records fail.
- Runtime tests prove empty and exact-owned passes, malformed recognized state/locks, unrelated-name handling, ownership mismatch preservation, snapshot/lock repository mismatch failure when discovery is unavailable plus a matching control, exact Git worktree inventory, exclusive probe collision handling, and unchanged recognized/unrelated bytes. Existing persistence suites retain v1-v3 schema coverage.

### AC-5 — Stable schema-v1 human/JSON parity

- `DOCTOR_CHECK_IDS` is asserted as 24 unique IDs in canonical order; all checks have `blocking: true`.
- `makeDoctorResult` rejects missing/reordered arrays and derives readiness from one typed result. `renderDoctor` derives both modes from that result.
- `src/doctor-cli.test.ts` normalizes and compares every field for all-pass and every isolated failure. Built ready and blocked human/JSON process outputs compare completely with their declared manifests, including repository facts, readiness, ordered status/blocking values, and every failure detail.

### AC-6 — Decisions, remediation, and exits

- Every one-check-failed variant produces `ready: false`, exact `STATUS: NOT READY`, nonempty prerequisite/remediation details, and exit 3; all-pass produces `ready: true`, exact `STATUS: READY`, and exit 0.
- Invalid Doctor grammar exits 2. Adapter uncertainty is complete failed report data rather than fail-fast omission.

### AC-7 — Repository-only boundary

- Doctor accepts no issue input and `runCli` dispatches it before constructing `IssueRunService`.
- Proxy tripwires in CLI and 24 isolated fixture executions throw on any issue-port access; all pass with zero issue API, issue parsing, prioritization, ownership, branch, worktree, or run creation calls.
- Help, README, docs index, Phase 3 operations, and the Phase 4 guide explicitly distinguish product Doctor from ambient `harness doctor` and prohibit issue selection or assessment.

### AC-8 — Complete ready and blocked fixtures

- `fixtures/doctor/ready.json` and `blocked.json` each declare schema, repository facts, readiness, ordered unique IDs, statuses, blocking values, and failure details where applicable.
- `src/doctor-integration.test.ts` validates both manifests before execution, repeats the controlled ready JSON run, and compares both built-process modes completely with the ready and blocked manifests.

### AC-9 — Pass/fail proof for every ID

- `fixtures/doctor/isolated-failures.json` names exactly one isolated failing variant per canonical ID.
- The parameterized acceptance test executes the ready witness and all 24 isolated input faults through the actual `DoctorService`, repository/authentication adapters, compatibility checks, runtime inventory, and normal CLI dispatch; no `StaticDoctor` or manufactured `DoctorResultV1` supplies matrix outcomes.
- The machine-checked 24-row matrix proves each real check passes in the ready composition and fails in its named fault composition with deterministic local filesystem and command dependencies and no live network, credentials, tmux, or Copilot dependency.

### AC-10 — Controlled built-process timing

- The integration fixture builds `dist/index.js`, creates local fake `git`, `gh`, `tmux`, `node`, and `copilot` executables, controls all network-like responses, and measures monotonic wall-clock time immediately before spawn through process exit.
- Three controlled ready built-process invocations (two JSON, one human) each assert `elapsedMs <= 10,000`, exit 0, READY, and 24 passed checks. Product constants remain 2,000 ms per external probe and 9,000 ms aggregate.
- The final affected-suite command completed 6 suites/31 tests in 10.846 s; the integration suite itself completed in 5.330 s while including build, three ready processes, two blocked processes, actual-check matrix, complete manifest parity, and cleanup work.

## Documentation evidence

- **README/setup/usage:** `README.md` adds Doctor commands, prerequisite behavior, 24-check/exit summary, repository-only boundary, configuration migration, metadata, and guide link.
- **Configuration/migration:** `README.md`, `docs/phase-1-issue-run.md`, and `docs/phase-4-repository-doctor.md` document `protocol_version`, safe roots/defaults, scalar and empty-mapping unknown-key rejection, canonical RPIV metadata, and the compatibility migration. No persisted-data migration is introduced.
- **Operations:** `docs/phase-4-repository-doctor.md` documents all IDs/remediation categories, schema/parity/exits, bounds/redaction, safe probes, fail-safe snapshot/lock repository matching without discovery, actual-check fixture composition, complete manifest comparisons, timing, and troubleshooting. `docs/phase-3-recovery-operations.md` adds the preflight cross-reference.
- **Documentation map:** `docs/README.md` and README documentation links include Phase 4.
- **Architecture:** adopted ADR, core-component, and `DECISION-LOG.md` entries are included unchanged from Plan boundaries.
- **API/deployment:** no network API, daemon, endpoint, container, or deployment contract changed; the guide records that API specification/API migration is not applicable and local short-lived CLI operations remain unchanged.
- **Executable proof:** `src/documentation.test.ts` asserts commands, all IDs, schema/exits, migration, metadata, bounds, fixtures, no-issue boundary, no harness dependency, API no-impact, and help output.

## Validation evidence

### Orientation

- `harness boot --json`: status `ok`; application exit 0; exact bootstrap signal observed; composed full checks exit 0/status `ok`; baseline 149 tests passed.

### Focused task gates

- T-1 through T-7 each ended with direct `just verify-focused` exit 0 and `harness checks --focused --json` status `ok`, delegated command `just verify-focused`, exit 0.
- Final harness focused gate: 14 suites, 178 tests passed, `git diff --check` passed.
- Final affected-suite command is recorded in the correction evidence below: 6 suites, 31 tests, 10.846 s, nested diff check passed.
- `just run --help`: exit 0 and shows `soft-factory doctor [--json]` plus the repository-only statement.

### Full gates

- Direct `just verify`: exit 0 after fixes; lint, Prettier check, strict typecheck, 14 suites/178 tests, build, and diff check passed.
- Global coverage: **87.03% statements, 83.04% branches, 92.19% functions, 88.93% lines**, all at or above 80%.
- `harness checks --json`: status `ok`; scope `full`; delegated command `just verify`; exit 0; 14 suites/178 tests; same coverage; build and diff check passed.
- Standalone `git diff --check`: exit 0.

## Harness friction records

Pending buffers were listed as JSON, every observation was preserved in a schema-1.2 record with `plan_id: 6-phase-4-diagnose-repository-readiness` and `disposition: kept`, each record was read back before clearing, and post-clear lists were empty:

- `.harness/records/retro/2026-08-12/001-issue-6-rpiv-research.md` — 2 Research observations; clear envelope status `ok`, `cleared: 2`.
- `.harness/records/retro/2026-08-12/003-issue-6-rpiv-planner.md` — 1 Plan observation; clear envelope status `ok`, `cleared: 1`.
- `.harness/records/retro/2026-08-12/002-issue-6-rpiv-implementer.md` — 11 initial Implement observations; clear envelope status `ok`, `cleared: 11`.
- `.harness/records/retro/2026-08-12/004-issue-6-rpiv-implementer-correction.md` — 3 correction Implement observations; read back before clear envelope status `ok`, `cleared: 3`.
- Coordinator `rpiv` buffer contained zero observations and remained empty; no synthetic retro was created.

## Verification correction cycle for rejected SHA `9cebcceb63b91ae3c451b5944b2396f3920892a8`

All Plan tasks remain **Completed**; this implementation-owned correction changes no accepted Plan, ADR, or core-component contract.

1. **AC-3/configuration:** `src/config.ts` now records and validates mapping-only paths against the closed mapping vocabulary. `src/doctor.test.ts` directly rejects `unknown:` and nested `repository:` → `unknown:` empty mappings while proving known empty `repository`, `rpiv`, `execution`, and `branch_types` mappings retain defaults. The actual compatibility matrix also fails `compatibility.configuration` using an unknown empty mapping.
2. **AC-4/ownership:** `src/doctor-runtime.ts` now requires `snapshot.repository === owner.repository` before considering discovered repository identity. The named runtime regression proves a matching snapshot/lock passes with `repositoryIdentity: null`, while a mismatched lock repository fails with the same unavailable discovery input and preserves the worktree.
3. **AC-8/blocked manifest:** `fixtures/doctor/blocked.json` now declares the actual blocked built-process result. The blocked process test requires parsed JSON to equal the complete manifest and normalized human output to equal that same manifest, covering repository facts, readiness, all 24 ordered status/blocking records, and every message/remediation.
4. **AC-9/real checks:** `StaticDoctor` and prebuilt isolated results were removed. The 24 named variants now apply one controlled input fault apiece to real filesystem/command dependencies and execute actual `DoctorService` repository/authentication adapters, compatibility logic, runtime inventory, renderer, and CLI dispatch. The ready actual composition matches `ready.json`; each target ID is machine-checked as passed there and failed in its named variant.

### Correction documentation evidence

- `README.md` and `docs/phase-1-issue-run.md` now state that unknown empty mappings at every supported level are rejected while known empty mappings preserve defaults.
- `docs/phase-4-repository-doctor.md` documents fail-safe snapshot/lock repository mismatch without discovery, actual-check 24-variant composition without manufactured results, and complete ready/blocked manifest comparison in both modes.
- `src/documentation.test.ts` locks these corrected claims. No API, deployment, persisted-data migration, ADR, or core-component update is required because the correction conforms implementation and proof to the accepted contracts.

### Correction validation evidence

- Direct affected-suite gate: `just verify-focused -- src/doctor.test.ts src/index.test.ts src/doctor-compatibility.test.ts src/doctor-runtime.test.ts src/doctor-integration.test.ts src/documentation.test.ts` — exit 0; 6 suites, 31 tests; 10.846 s; diff check passed.
- Final unfiltered direct focused gate: `just verify-focused` — exit 0; 14 suites, 178 tests; 13.423 s; diff check passed.
- Harness focused gate: `harness checks --focused --json` — envelope `status: ok`, `scope: focused`, delegated `just verify-focused`, exit 0; 14 suites, 178 tests; 13.976 s.
- Direct full gate: `just verify` — exit 0; lint, formatting, strict types, 14 suites/178 tests, build, and diff check passed in 15.304 s test time. Coverage: **87.03% statements, 83.04% branches, 92.19% functions, 88.93% lines**.
- Harness full gate: `harness checks --json` — envelope `status: ok`, `scope: full`, delegated `just verify`, exit 0; 14 suites/178 tests; 17.777 s test time; same coverage and successful build/diff check.
- Built-process timing remains machine-enforced for two JSON and one human ready invocation, each measured monotonically from spawn through exit and each `<= 10,000 ms`; the corrected integration suite passed in 5.330 s during the final affected-suite run.

### Correction friction evidence

- `.harness/records/retro/2026-08-12/004-issue-6-rpiv-implementer-correction.md` preserves all three correction observations in schema 1.2 with the issue plan ID. The record was read back before `harness observe --clear --agent rpiv-implementer --json` reported `status: ok`, `cleared: 3`; post-clear coordinator, Research, Plan, and Implement lists were empty.

## Handoff caveats

- The repository intentionally ignores `.soft-factory/` runtime state, so a developer checkout without a local strict config can correctly report NOT READY; controlled acceptance fixtures provide deterministic READY/NOT READY evidence without committing runtime state or credentials.
- No GitHub acceptance checkboxes were changed. Final verification and acceptance remain owned by Verify.
