# Task Breakdown: Add the generic observable Copilot launch example

## Task T-1: Add the exact generic launch line to PRD guidance

- **Status:** Completed
- **Complexity:** Small
- **Dependencies:** None
- **Acceptance Criteria:** AC-1
- **Related ADRs:** ADR-260812-copilot-child-environment; ADR-260811-prototype-one-run-orchestration
- **Related Core-Components:** CORE-COMPONENT-260812-copilot-child-environment-contract; CORE-COMPONENT-260811-issue-run-orchestration; CORE-COMPONENT-260806-project-command-interface; CORE-COMPONENT-260806-rpiv-stage-contract

### Description
Edit only `PRD.md`. Add this exact text as one physical line in Section 27 RPIV Execution or its directly related Observability launch guidance:

```text
OTEL_RESOURCE_ATTRIBUTES="project.name=<project>,issue.id=issue-<number>" copilot --yolo
```

Keep the edit adjacent to launch or telemetry guidance and add only enough context to make clear that this is a generic one-line observability example. Preserve the existing multiline production example, including its `--name`, `--agent`, and prompt arguments. Do not implement the broader progress, final-result, instructions, status/list, recovery, or validation-contract criteria from Issue #19. Do not edit application code, test code, ADRs, core-components, or the decision log.

### Acceptance Criteria
- **AC-1:** `PRD.md` contains the exact one-line generic launch command `OTEL_RESOURCE_ATTRIBUTES="project.name=<project>,issue.id=issue-<number>" copilot --yolo` in the appropriate observability/launch guidance.

### Test Coverage
- Run V-1 to require an exact full-line literal match and inspect its neighboring heading and prose.
- Run V-2 with the existing root `just verify` recipe to execute lint, format checking, type checking, tests, build, and `git diff --check`.

### Expected Evidence
- Output from `grep -Fnx` showing the exact command as a single `PRD.md` line.
- Context output showing the line under relevant RPIV execution or Observability guidance and distinguishing it from the complete production invocation.
- A zero exit and successful output from `just verify`.
- A focused diff showing only the intended `PRD.md` documentation change during implementation.
