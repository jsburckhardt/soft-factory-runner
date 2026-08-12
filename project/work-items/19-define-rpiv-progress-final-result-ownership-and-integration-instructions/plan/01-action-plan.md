# Action Plan: Add the generic observable Copilot launch example

## Feature
- **ID:** 19
- **Research Brief:** `project/work-items/19-define-rpiv-progress-final-result-ownership-and-integration-instructions/research/00-research.md`

## ADRs Created
- None. This bounded example-only clarification does not change architecture.
- Relevant existing ADRs: `ADR-260812-copilot-child-environment`, `ADR-260811-prototype-one-run-orchestration`.

## Core-Components Created
- None. This change adds no reusable cross-cutting behavior.
- Relevant existing core-components: `CORE-COMPONENT-260812-copilot-child-environment-contract`, `CORE-COMPONENT-260811-issue-run-orchestration`, `CORE-COMPONENT-260806-project-command-interface`, `CORE-COMPONENT-260806-rpiv-stage-contract`.

## Acceptance Criteria
- **AC-1:** `PRD.md` contains the exact one-line generic launch command `OTEL_RESOURCE_ATTRIBUTES="project.name=<project>,issue.id=issue-<number>" copilot --yolo` in the appropriate observability/launch guidance.

## Acceptance Coverage
| Acceptance Criterion | Implementation Task | Tests or Validation | Expected Evidence |
|---|---|---|---|
| AC-1 | T-1 | V-1 exact-line and surrounding-context inspection; V-2 `just verify` | One exact full-line match in `PRD.md`, context showing it as generic observability/launch guidance rather than the complete production argument contract, and successful full repository validation output |

Coverage proof: AC-1 has an implementation task, repository-local validation, and inspectable evidence. No unbounded Issue #19 behavior is included.

## Implementation Tasks
1. **T-1 — Add one contextualized generic launch line to `PRD.md` (AC-1).** Make a surgical documentation-only edit in Section 27 RPIV Execution or its directly related Observability launch guidance. Preserve the existing concrete production invocation and all runtime contracts. Present the required line verbatim on one physical line and use nearby prose to identify it as the generic telemetry-enabled launch form, not a replacement for the additional production arguments. Do not change source code, tests, architecture artifacts, or other Issue #19 contracts. Validate with V-1 and V-2.
