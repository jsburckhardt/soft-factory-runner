# Action Plan: Complete Issue 1 Epic Evidence and Section 27 Launch Example

## Feature
- **ID:** 1
- **Research Brief:** project/work-items/1-deliver-the-soft-factory-runner-mvp/research/00-research.md

## ADRs Created
- None. Reuse `ADR-260811-prototype-one-run-orchestration`, `ADR-260811-prototype-three-recovery-concurrency`, and `ADR-260812-copilot-child-environment` without modification.

## Core-Components Created
- None. Reuse `CORE-COMPONENT-260806-rpiv-stage-contract`, `CORE-COMPONENT-260806-project-command-interface`, `CORE-COMPONENT-260811-concurrent-run-admission`, `CORE-COMPONENT-260811-issue-run-orchestration`, `CORE-COMPONENT-260812-copilot-child-environment-contract`, and `CORE-COMPONENT-260810-subprocess-execution` without modification.

## Acceptance Criteria
- **AC-1:** Every MVP phase is represented by a linked child feature in delivery order.
- **AC-2:** Together, the child features cover PRD functional requirements FR-001 through FR-029 and acceptance criteria AC-001 through AC-020, including AC-011A and AC-018A.
- **AC-3:** The delivered product accepts only explicit issue numbers and does not select or prioritize backlog work.
- **AC-4:** The epic task list links every child feature and reflects its GitHub completion state.
- **AC-5:** PRD Section 27 includes exactly the one-line fenced command `OTEL_RESOURCE_ATTRIBUTES="project.name=<project>,issue.id=issue-<number>" copilot --yolo`.

## Acceptance Coverage

| Acceptance Criterion | Implementation Tasks | Tests or Validation | Expected Evidence |
|---|---|---|---|
| AC-1 | T-1, T-3 | TEST-1, TEST-6 | Issue #1 JSON showing ordered checked links `#8, #2, #3, #4, #5, #6, #7`; seven child title/URL/state records; passing root gates |
| AC-2 | T-1, T-3 | TEST-2, TEST-6 | Passing PRD ID counts and an Issue #8/#2-#7 crosswalk covering FR-001-FR-029 and AC-001-AC-020 plus AC-011A and AC-018A; passing root gates |
| AC-3 | T-1, T-3 | TEST-3, TEST-6 | Passing explicit-issue integration/documentation suites and assertions prohibiting queueing, ranking, or selection; passing root gates |
| AC-4 | T-1, T-3 | TEST-1, TEST-6 | Checked Issue #1 task list and live GitHub JSON showing all seven linked children CLOSED; passing root gates |
| AC-5 | T-2, T-3 | TEST-4, TEST-5, TEST-6 | Exact one-line Section 27 fence body, one scoped PRD hunk, product path inventory containing only `PRD.md`, and passing root gates |

Coverage proof: every AC-1 through AC-5 maps to dependency-ordered implementation work, executable validation, and concrete inspectable evidence.

## Implementation Tasks
1. **T-1 - Validate epic delivery evidence (AC-1, AC-2, AC-3, AC-4).** Query Issue #1 and child issues #8 and #2 through #7. Prove delivery order, links, checked completion markers, live CLOSED states, complete PRD requirement/acceptance coverage, and explicit-issue-only product behavior. Record the command outputs and a concise requirement crosswalk in Implement evidence. Do not edit GitHub or product files.
2. **T-2 - Replace only the Section 27 launch fence (AC-5).** In `PRD.md` Section 27, replace only the fenced body immediately following “The internal worker then launches:” with the exact single line `OTEL_RESOURCE_ATTRIBUTES="project.name=<project>,issue.id=issue-<number>" copilot --yolo`. Remove the continuation and additional Copilot arguments from that fence only. Do not alter prose, runtime code, tests, other documentation, or architecture artifacts.
3. **T-3 - Validate epic and documentation evidence (AC-1, AC-2, AC-3, AC-4, AC-5).** After T-1 and T-2, execute TEST-1 through TEST-6 from the repository root, inspect the final diff, and run `just verify-focused` and `just verify`. On failure, return to the owning task and rerun the failed check; do not broaden product scope.
