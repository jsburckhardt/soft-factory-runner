# Research Brief: Deliver the Soft Factory Runner MVP

## GitHub Issue
- **Issue:** #1
- **Title:** Deliver the Soft Factory Runner MVP
- **Work Item:** project/work-items/1-deliver-the-soft-factory-runner-mvp

## Scope Classification
- **Scope Type:** core_component

## Problem Statement
`PRD.md` must document a Copilot launch beginning with `OTEL_RESOURCE_ATTRIBUTES="project.name=<project>,issue.id=issue-<number>" copilot --yolo`.

## Acceptance Criteria
- [ ] Every MVP phase is represented by a linked child feature in delivery order.
- [ ] Together, the child features cover PRD functional requirements FR-001 through FR-029 and acceptance criteria AC-001 through AC-020, including AC-011A and AC-018A.
- [ ] The delivered product accepts only explicit issue numbers and does not select or prioritize backlog work.
- [ ] The epic task list links every child feature and reflects its GitHub completion state.

## Repository Findings
- `PRD.md` Section 27 already shows an environment-prefixed Copilot launch with concrete example values.
- The same section defines the generic value as `project.name=<project>,issue.id=issue-<number>`.
- The runtime preserves `--yolo`, `--name`, `--agent rpiv`, and the issue prompt as separate shell-free process arguments.
- Existing tests cover generated OTEL attributes and the complete Copilot argument list.

## Constraints
- Limit the change to the Section 27 launch example in `PRD.md`.
- Preserve all existing Copilot arguments while replacing concrete values with the requested placeholders.
- The environment prefix is documentation syntax; runtime process execution remains shell-free.

## Relevant Architecture
- `ADR-260812-copilot-child-environment`
- `ADR-260811-prototype-one-run-orchestration`
- `CORE-COMPONENT-260812-copilot-child-environment-contract`
- `CORE-COMPONENT-260811-issue-run-orchestration`
- `CORE-COMPONENT-260810-subprocess-execution`

## Risks
- Showing only `copilot --yolo` would omit required RPIV launch arguments, so the example must retain the complete invocation.
