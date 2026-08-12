# Test Plan: Add the generic observable Copilot launch example

## Test V-1: Inspect exact launch text and documentation context

- **Type:** Documentation inspection
- **Task:** T-1
- **Acceptance Criteria:** AC-1
- **Priority:** Required

### Setup
Use the implementation worktree after the surgical `PRD.md` edit. The required literal is:

```text
OTEL_RESOURCE_ATTRIBUTES="project.name=<project>,issue.id=issue-<number>" copilot --yolo
```

### Steps
1. Run `grep -Fnx 'OTEL_RESOURCE_ATTRIBUTES="project.name=<project>,issue.id=issue-<number>" copilot --yolo' PRD.md`.
2. Require exactly one matching output line so the required text is present on one physical line without extra characters.
3. Inspect the containing Section 27 RPIV Execution or Observability subsection and several neighboring lines, for example with the same literal and `grep -FnC 4`.
4. Inspect the existing concrete launch example and confirm that its `--name`, `--agent`, and prompt arguments remain unchanged.
5. Inspect `git diff -- PRD.md` and confirm the change is limited to the generic example and minimal explanatory context.

### Expected Result
`PRD.md` has exactly one exact full-line match. Its surrounding text makes it generic observability/launch guidance and does not present it as the complete production argument contract. Existing concrete launch guidance remains intact.

### Expected Evidence
- Numbered exact-match output from `grep -Fnx`.
- Captured neighboring heading and prose.
- Focused `PRD.md` diff.

## Test V-2: Run the existing full repository validation

- **Type:** Repository validation
- **Task:** T-1
- **Acceptance Criteria:** AC-1
- **Priority:** Required

### Setup
Install repository dependencies and provide `just` as required by the project command interface.

### Steps
1. Run `just verify` from the repository root.
2. Retain the command exit code and summary output.

### Expected Result
The existing full validation recipe exits zero, including lint, format checking, type checking, Jest coverage, build, and `git diff --check`.

### Expected Evidence
- Successful `just verify` output and zero exit status.
