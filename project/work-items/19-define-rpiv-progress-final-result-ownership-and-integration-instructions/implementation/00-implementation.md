# Implementation Notes: Issue 19

## Completed Tasks

- T-1 — Completed. Added the exact generic telemetry-enabled Copilot launch command to Section 27 of `PRD.md` while preserving the concrete production invocation and adjacent explanation.

## Acceptance Evidence

### AC-1

- `grep -Fnx` returned exactly one full-line match at `PRD.md:1105`:
  `OTEL_RESOURCE_ATTRIBUTES="project.name=<project>,issue.id=issue-<number>" copilot --yolo`
- The command is in a `bash` code fence under Section 27 RPIV Execution, introduced as generic observability launch guidance.
- `PRD.md:1108` clarifies that the complete production invocation retains the required name, agent, and prompt arguments.
- The existing concrete command at `PRD.md:1098-1099`, including `--name "issue-123"`, `--agent rpiv`, and `-p "Deliver issue #123"`, remains unchanged.
- The focused `PRD.md` diff contains only the generic launch example and its minimal explanatory context.

## Documentation Evidence

- Updated `PRD.md` Section 27 because T-1 changes observability/launch guidance.
- No README, API reference, configuration, usage-guide, migration, architecture, operational, or deployment updates are required: this is an example-only clarification and changes no setup, runtime behavior, contract, default, interface, or operational procedure.

## Validation Evidence

- Focused: `TMPDIR="/private${TMPDIR}" just verify-focused` — passed; 19 suites and 247 tests passed, followed by `git diff --check`.
- Full: `TMPDIR="/private${TMPDIR}" just verify` — passed; lint, format check, type check, 19 suites/247 tests with coverage, build, and `git diff --check` succeeded.
- V-1 exact/context inspection passed with one exact full-line match and preserved concrete production arguments.

## Harness Friction Records

- `.harness/records/retro/2026-08-12/015-issue-19-rpiv-research.md`
- `.harness/records/retro/2026-08-12/014-issue-19-rpiv-planner.md`
- `.harness/records/retro/2026-08-12/015-issue-19-rpiv-implementer.md`

Implementation evidence is recorded for Verify; final acceptance remains owned by Verify.
