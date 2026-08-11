# Test Plan: Phase 0: Adopt the engineering harness

## Test V-1: Harness version and repository readiness

- **Type:** Integration / contract
- **Task:** T-1, T-2
- **Acceptance Criteria:** AC-1, AC-2
- **Priority:** Critical

### Setup
Use repository root with Node >=22, `just`, and ambient `@ai-substrate/engineering-harness` v0.13.0. Remove only transient `.harness/temp/` contents before the run; do not alter tracked substrate.

### Steps
1. Run `harness --version` and require v0.13.0.
2. Run `harness doctor --json`, capture its exit code, and parse the envelope.
3. Require compatible node/core layers, protected transient conventions, loaded `boot` and `checks` extensions, zero extension failure/conflict, and no repository-owned remediation.
4. Run `harness help --json` and require both verbs. If top-level doctor is degraded only by machine attribution/telemetry, classify those rows separately and retain their `next_action`; do not count them as repository health failures.

### Expected Result
The pinned CLI executes successfully, all repository-owned readiness checks are healthy, required extensions load, and required verbs are discoverable. Any allowed machine-only degradation is explicit, actionable, and does not mask a repository failure.

### Expected Evidence
Version text, doctor/help JSON, process exit codes, asserted layer/extension names, and any separately classified machine warning.

## Test V-2: Cold-agent discovery path

- **Type:** Documentation / usability contract
- **Task:** T-1, T-3
- **Acceptance Criteria:** AC-2, AC-5
- **Priority:** High

### Setup
Start a fresh agent context with repository access but no prior conversation. Permit initial reads only of tracked cold-entry surfaces such as `AGENTS.md`, `README.md`, and `LLM.txt`.

### Steps
1. Follow tracked instructions from the cold-entry surface to `harness instructions` and `.harness/engineering-harness.md`.
2. Discover boot, focused checks, full checks, and per-verb briefings without reading implementation source first.
3. Identify where RPIV still requires `just verify-focused` and `just verify`.
4. Confirm all followed governance, extension, briefing, and instruction files appear in `git ls-files`.

### Expected Result
A cold agent reaches the deterministic harness development surface in one documented path, can identify all required operations, and understands that direct `just` recipes remain RPIV boundary gates.

### Expected Evidence
Ordered read/command transcript, resolved tracked paths, relevant instruction excerpts, and `git ls-files` manifest.

## Test V-3: Boot starts the current application and composes checks

- **Type:** End-to-end integration
- **Task:** T-2
- **Acceptance Criteria:** AC-3
- **Priority:** Critical

### Setup
Complete project setup and readiness. Preserve the current short-lived CLI behavior and run from repository root.

### Steps
1. Run `harness boot --json` and capture stdout, stderr, and exit code.
2. Parse the envelope rather than terminal prose.
3. Assert the root boot recipe built and started the application, application exit was zero, and captured stdout contains the exact bootstrap line expected by `src/index.test.ts`.
4. Assert boot composed full `harness checks`, captured its verdict, and returned overall `ok` only after both stages passed.
5. Review extension code to confirm every failure branch returns a stable error code, non-zero harness result, diagnostic details, and `next_action`.

### Expected Result
Boot deterministically starts the current CLI from a built state and emits inspectable application and full-check success evidence. Defined failure branches cannot present partial success as healthy.

### Expected Evidence
Complete boot JSON envelope, exit code, exact application output, per-stage command/status fields, composed checks result, and failure-contract review notes.

## Test V-4: Focused harness validation and direct RPIV entry point

- **Type:** Integration / regression
- **Task:** T-2, T-3
- **Acceptance Criteria:** AC-4
- **Priority:** Critical

### Setup
Use a configured repository with dependencies installed.

### Steps
1. Run the checks verb help/instructions and confirm the focused selector is documented.
2. Run `harness checks --focused --json`; require delegation to `just verify-focused` and an `ok` envelope.
3. Run `just verify-focused` directly and require success.
4. Confirm focused mode does not silently substitute the full command.

### Expected Result
Focused validation is discoverable and successful through harness, and the existing direct RPIV recipe remains independently successful.

### Expected Evidence
Help/briefing excerpt, focused JSON with selected scope/delegated command, and both exit-code transcripts.

## Test V-5: Full harness validation and direct RPIV entry point

- **Type:** Integration / regression
- **Task:** T-2, T-3
- **Acceptance Criteria:** AC-4
- **Priority:** Critical

### Setup
Use the same configured checkout as V-4.

### Steps
1. Run checks help/instructions and confirm full is documented as the default.
2. Run `harness checks --json`; require delegation to `just verify` and an `ok` envelope.
3. Run `just verify` directly and require success.
4. Inspect `just --list` and require unchanged `verify-focused` and `verify` recipes.

### Expected Result
Full validation is discoverable and successful through harness while both stable direct RPIV recipes remain listed and valid.

### Expected Evidence
Full-check JSON, direct full-validation transcript, `just --list` output, and exit codes.

## Test V-6: Clean-checkout adoption verification

- **Type:** Clean-room end-to-end
- **Task:** T-4
- **Acceptance Criteria:** AC-6
- **Priority:** Critical

### Setup
Create a temporary isolated checkout at the exact implementation commit, with no copied `node_modules`, `.harness/temp`, reports, records, or prior command outputs. Provide Node >=22, `just`, and ambient harness v0.13.0 as explicit external prerequisites.

### Steps
1. Record commit SHA and prerequisite versions; assert no harness package dependency and no tracked local archive.
2. Run `just setup`.
3. Run V-1 readiness, `harness boot --json`, `harness checks --focused --json`, and `harness checks --json` in that order.
4. Run `just verify-focused` and `just verify` directly.
5. Run `git status --short` and inspect ignored transient paths.

### Expected Result
Readiness, boot, focused validation, full validation, and both RPIV recipes exit successfully from the isolated checkout, and harness runtime activity leaves no untracked or modified repository files.

### Expected Evidence
Checkout SHA, prerequisite/version output, setup transcript, four harness JSON envelopes with exit codes, two direct recipe results, and empty final status.

## Test V-7: Tracked governance and architecture compliance audit

- **Type:** Static validation / review
- **Task:** T-1, T-3
- **Acceptance Criteria:** AC-2, AC-5
- **Priority:** High

### Setup
Inspect the final tracked diff and the decision log without relying on transient harness state.

### Steps
1. Verify governance contains populated Boot, Checks, Health, Interact, Observe, signals, evidence paths, injection map, back-pressure, and honest maturity sections.
2. Verify boot/checks implementations and briefings are tracked, and transient paths/package archive are not tracked.
3. Verify `AGENTS.md`, README/documentation indexes, and `LLM.txt` consistently direct agents to harness and preserve direct RPIV `just` validation.
4. Verify no raw npm/tool operating command was moved out of the root `justfile` or duplicated in harness extensions.
5. Verify ADR/core-component registry rows and decisions 33–37 in `DECISION-LOG.md` match the implementation.

### Expected Result
All adoption artifacts and instructions are tracked, architecture-compliant, mutually consistent, and discoverable; no forbidden dependency, archive, transient state, or duplicated raw command is present.

### Expected Evidence
Reviewed file manifest, grep/diff excerpts, architecture cross-reference checklist, and decision-log rows.

## Acceptance Coverage Summary

| AC | Tests |
|---|---|
| AC-1 | V-1 |
| AC-2 | V-1, V-2, V-7 |
| AC-3 | V-3 |
| AC-4 | V-4, V-5 |
| AC-5 | V-2, V-7 |
| AC-6 | V-6 |

Every AC ID is covered by executable validation and expected evidence.
