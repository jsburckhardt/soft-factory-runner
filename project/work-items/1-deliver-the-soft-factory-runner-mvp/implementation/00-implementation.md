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

## Verify Correction Cycle
- Verify rejected commit `0b0001aff67c013c50c6c2c58d475219f2b5c730` after `src/integration.test.ts` observed the dirty fixture path as existing but not registered, with `branch: null`; the other 246 tests passed.
- `harness boot --json` reproduced the same single failure: Node created the fixture beneath `TMPDIR=/var/folders/...`, while `git worktree list --porcelain` reported the equivalent canonical macOS path beneath `/private/var/folders/...`. The adapter correctly requires an exact registered-path match, so the alias mismatch produced `registered: false` and no branch.
- The fixture cleanup completed normally and no repository-local stale fixture remained. The PRD-only implementation did not cause the failure; therefore no product behavior, test, architecture, or unrelated file was changed.
- Canonicalizing `TMPDIR` with `realpath` before invoking the unchanged root recipes made Node and Git use the same path spelling and restored repeatable focused and full validation in this checkout.

## Documentation Evidence
- Updated `PRD.md` Section 27 so its launch usage example uses generic project and issue placeholders.
- This correction cycle changes only implementation evidence and its required harness retro record. No README, API, configuration, migration, architecture, runbook, deployment, or usage update is required because runtime behavior, contracts, setup, and supported workflows are unchanged.

## Validation Evidence
- TEST-1: Section 27 excerpt inspection passed.
- TEST-2: exact launch block and argument comparison passed (count: 1).
- TEST-3: product diff inventory contained only `PRD.md`; architecture diff was empty; `git diff --check` passed.
- Correction `just verify-focused`: passed with canonical `TMPDIR`; 19 suites and 247 tests passed, including `src/integration.test.ts`.
- Correction `harness checks --focused --json`: status `ok`, scope `focused`, delegated command `just verify-focused`, exit code 0.
- Correction `just verify`: passed with canonical `TMPDIR`; lint, formatting, type-check, 19 suites/247 tests, coverage, build, and diff hygiene completed.
- Correction `harness checks --json`: status `ok`, scope `full`, delegated command `just verify`, exit code 0.

## Harness Friction Records
- `.harness/records/retro/2026-08-12/014-issue-1-rpiv-planner.md`
- `.harness/records/retro/2026-08-12/014-issue-1-rpiv-implementer.md`
- `.harness/records/retro/2026-08-12/015-issue-1-rpiv-implementer.md`

Implementation correction evidence is ready for independent Verify-stage review; final acceptance remains owned by Verify.
