# Action Plan: Phase 4: Diagnose repository readiness

## Feature
- **ID:** 6
- **Research Brief:** `project/work-items/6-phase-4-diagnose-repository-readiness/research/00-research.md`

## ADRs Created
- [`ADR-260812-repository-doctor-readiness`](../../../architecture/ADR/ADR-260812-repository-doctor-readiness.md) — fixes the complete check set, protocol and asset authorities, path safety, all-blocking policy, exit behavior, and timing budget.

## Core-Components Created
- [`CORE-COMPONENT-260812-repository-doctor-contract`](../../../architecture/core-components/CORE-COMPONENT-260812-repository-doctor-contract.md) — defines the ordered 24-check result, shared rendering, bounded adapters, safe probes, and fixture obligations.

## Acceptance Criteria
- **AC-1:** `soft-factory doctor` evaluates and reports every repository check defined by PRD Section 19: Git repository membership, primary-worktree discovery, Git common-directory discovery, GitHub owner/repository discovery, and default-branch discovery.
- **AC-2:** `soft-factory doctor` evaluates and reports every required-command and authentication check defined by PRD Section 19: availability of `git`, `gh`, `tmux`, `node`, and `copilot`, GitHub CLI authentication, and Copilot CLI usability.
- **AC-3:** `soft-factory doctor` evaluates and reports every Soft Factory compatibility check defined by PRD Section 19: RPIV agent availability, supported Runner protocol availability, valid Runner configuration, valid worktree root, writable state root, ignored `.trees/` and Runner runtime-state paths, and RPIV result-artifact contract availability.
- **AC-4:** `soft-factory doctor` evaluates and reports every runtime-safety check defined by PRD Section 19: absence of invalid `.trees` ownership conflicts, readable state files, interpretable locks, and safe creation of required paths.
- **AC-5:** Every Section 19 check has a stable identifier and an explicit blocking classification, and `soft-factory doctor --json` represents the same check set, `passed` or `failed` outcomes, and blocking classifications as human output in schema version `1`, with a top-level `ready` boolean, repository GitHub and default-branch fields, and a checks array whose entries contain `id`, `status`, and `blocking`; failed entries also contain `message` and `remediation`.
- **AC-6:** If any blocking check fails, human output reports `STATUS: NOT READY`, JSON reports `"ready": false`, and every failed blocking check identifies the failed prerequisite and a concrete corrective action; if all blocking checks pass, human output reports `STATUS: READY` and JSON reports `"ready": true`.
- **AC-7:** Doctor does not select an issue, prioritize backlog work, or assess issue-specific implementation readiness.
- **AC-8:** Configured ready and blocked repository fixtures define their expected result for every reported check, and automated verification proves that human and JSON modes report the same check outcomes and readiness decision for each fixture.
- **AC-9:** Configured fixtures exercise both passing and failing outcomes for every repository, required-command, authentication, compatibility, and runtime-safety check.
- **AC-10:** On the configured ready repository fixture with external network responses controlled by the verification environment, elapsed wall-clock time from Doctor invocation through process exit is at most ten seconds.

## Acceptance Coverage

| AC | Implementation tasks | Tests / validation | Expected evidence |
|---|---|---|---|
| AC-1 | T-1, T-2, T-5 | V-1; `just verify-focused -- src/doctor.test.ts src/doctor-integration.test.ts` | Five ordered repository check records and ready/blocked fixture assertions |
| AC-2 | T-2, T-5 | V-2; adapter argument/timeout tests | Seven command/authentication records, shell-free traces, redacted failures |
| AC-3 | T-1, T-3, T-5, T-7 | V-3; config/metadata/ignore/path matrix | Eight compatibility records plus protocol, asset, config, and ignore evidence |
| AC-4 | T-4, T-5 | V-4; disk-backed state/lock/ownership/probe fixtures | Four runtime-safety records and zero unauthorized mutation proof |
| AC-5 | T-1, T-5 | V-5; typed human/JSON parity test | Schema-v1 JSON snapshots and normalized renderer parity for all 24 IDs |
| AC-6 | T-5 | V-6; all-pass and each-failure decision table | Exact READY/NOT READY lines, booleans, failure messages/remediations, exits 0/3 |
| AC-7 | T-1, T-5, T-7 | V-7; issue-port tripwire and documentation assertions | Zero issue API calls and repository-scoped usage documentation |
| AC-8 | T-6 | V-8; ready/blocked manifest-driven CLI tests | Fixture manifests with 24 expected entries and mode-parity comparisons |
| AC-9 | T-2, T-3, T-4, T-6 | V-9; 24-ID pass/fail coverage table | Machine-checked matrix showing pass and fail fixture names for every ID |
| AC-10 | T-2, T-5, T-6 | V-10; built-process monotonic wall-clock test | Controlled ready CLI exit measurement `<= 10,000 ms` and timeout-budget tests |

Coverage proof: AC-1 through AC-10 each has implementation ownership, deterministic validation, and concrete evidence above. No plan artifact is written with an unmapped criterion.

## Implementation Tasks

1. **T-1 — Define Doctor contracts and compatibility configuration** (AC-1, AC-3, AC-5, AC-7): add the closed check/result types, dependency table, protocol/root configuration, RPIV metadata parsing contract, and Doctor-specific typed failures.
2. **T-2 — Implement bounded repository, executable, and authentication adapters** (AC-1, AC-2, AC-9, AC-10): add shell-free PATH, Git/default-branch, `gh auth`, and Copilot usability observations with redaction and Doctor budgets.
3. **T-3 — Implement Soft Factory compatibility checks** (AC-3, AC-9): validate canonical RPIV metadata, protocol 1, strict configuration, contained roots, Git ignore evidence, writability, and result-contract declaration.
4. **T-4 — Implement conservative runtime-safety inventory** (AC-4, AC-9): inspect recognized state and locks strictly, reconcile `.trees` ownership, and perform reversible required-path probes without touching owned resources.
5. **T-5 — Add Doctor service, CLI dispatch, rendering, and exits** (AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-10): always assemble all 24 checks into one result and render both modes from it.
6. **T-6 — Build manifest-driven pass/fail and timing fixtures** (AC-8, AC-9, AC-10): define complete ready/blocked expectations, isolated failures for every ID, parity checks, mutation tripwires, and built-process timing.
7. **T-7 — Update application and operator documentation; run project boundaries** (AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10): update help, README, docs index, configuration and operations guidance, metadata, documentation assertions, then run root and harness validation without making harness a runtime dependency.
