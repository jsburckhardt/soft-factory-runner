# Implementation Notes: Generic RPIV Copilot Launch

## Issue
- GitHub Issue #1
- Work item: `1-deliver-the-soft-factory-runner-mvp`
- Tasks completed: T-1, T-2

## Acceptance Evidence

### AC-1 — Generic prefix
- Updated the PRD Section 27 launch block to begin exactly with `OTEL_RESOURCE_ATTRIBUTES="project.name=<project>,issue.id=issue-<number>" \`.
- TEST-1 inspection showed this prefix directly adjacent to the continued Copilot command.

### AC-2 — Required invocation contract
- Preserved the immediately following invocation exactly as `copilot --yolo --name "issue-<number>" --agent rpiv -p "Deliver issue #<number>"`.
- TEST-2 exact comparison reported `exact-launch-block-count=1`; no runtime source or architecture contract changed.

### AC-3 — PRD-only product change
- TEST-3 product-path inventory reported only `PRD.md`.
- The PRD diff contains one hunk in Section 27; `src/` and `project/architecture/` are unchanged.
- Work-item task evidence and harness retro records are non-product implementation artifacts.

## Documentation Evidence
- Updated `PRD.md` Section 27 so its launch usage example uses generic project and issue placeholders.
- No README, API, configuration, migration, architecture, runbook, or deployment update is required: this patch changes only the existing PRD launch example and does not alter runtime behavior, contracts, setup, configuration, or operational procedures.

## Validation Evidence
- TEST-1: Section 27 excerpt inspection passed.
- TEST-2: exact launch block and argument comparison passed (count: 1).
- TEST-3: product diff inventory contained only `PRD.md`; architecture diff was empty; `git diff --check` passed.
- `just verify-focused`: passed for T-1 and T-2; 19 suites and 247 tests passed on the final focused runs.
- `harness checks --focused --json`: status `ok`, delegated command `just verify-focused`, exit code 0.
- `just verify`: passed; lint, formatting, type-check, 19 suites/247 tests, coverage, build, and diff hygiene completed.
- `harness checks --json`: status `ok`, delegated command `just verify`, exit code 0.
- On macOS, final validation used a canonical `TMPDIR=/private/var/...` so Git worktree paths matched fixture inputs.

## Harness Friction Records
- `.harness/records/retro/2026-08-12/014-issue-1-rpiv-planner.md`
- `.harness/records/retro/2026-08-12/014-issue-1-rpiv-implementer.md`

Implementation evidence is ready for independent Verify-stage review; final acceptance remains owned by Verify.
