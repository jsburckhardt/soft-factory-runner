# Action Plan: Document the Generic RPIV Copilot Launch

## Feature
- **ID:** 1
- **Research Brief:** project/work-items/1-deliver-the-soft-factory-runner-mvp/research/00-research.md

## ADRs Created
- None. Reuse `ADR-260812-copilot-child-environment` and `ADR-260811-prototype-one-run-orchestration` without modification.

## Core-Components Created
- None. Reuse `CORE-COMPONENT-260812-copilot-child-environment-contract`, `CORE-COMPONENT-260811-issue-run-orchestration`, `CORE-COMPONENT-260810-subprocess-execution`, and `CORE-COMPONENT-260806-rpiv-stage-contract` without modification.

## Acceptance Criteria
- **AC-1 — generic prefix**
  - Operational interpretation: In PRD Section 27, show `OTEL_RESOURCE_ATTRIBUTES="project.name=<project>,issue.id=issue-<number>"` immediately before the Copilot invocation.
- **AC-2 — preservation of required arguments/contracts**
  - Operational interpretation: Preserve the complete invocation as `copilot --yolo --name "issue-<number>" --agent rpiv -p "Deliver issue #<number>"`; do not change runtime shell-free execution or existing architecture contracts.
- **AC-3 — PRD-only product change**
  - Operational interpretation: Change only the Section 27 example in `PRD.md`; Plan-stage artifacts are the only non-product files created.

## Acceptance Coverage

| Acceptance Criterion | Implementation Tasks | Tests or Validation | Expected Evidence |
|---|---|---|---|
| AC-1 | T-1, T-2 | TEST-1 exact Section 27 block inspection; TEST-4 full regression gate | Section 27 excerpt showing the generic OTEL prefix directly adjacent to the invocation; passing `just verify` output |
| AC-2 | T-1, T-2 | TEST-2 exact argument/placeholder comparison; TEST-4 full regression gate | Exact invocation text retaining `--yolo`, `--name`, `--agent rpiv`, `-p`, and the issue prompt; passing `just verify` output |
| AC-3 | T-1, T-2 | TEST-3 path-scoped Git diff review; TEST-4 full regression gate | Product diff lists only `PRD.md` and its sole hunk is in Section 27; passing `git diff --check`/`just verify` output |

Coverage proof: AC-1 through AC-3 each map to implementation, finite validation, and inspectable evidence. No criterion is uncovered.

## Implementation Tasks
1. **T-1 — Replace the concrete Section 27 launch values (AC-1, AC-2, AC-3).** Edit only the existing launch example in `PRD.md`: substitute `<project>` and `<number>` in the OTEL attributes, Copilot name, and prompt while preserving line order and every required Copilot argument. Do not modify application source, tests, or architecture artifacts.
2. **T-2 — Validate content, scope, and regressions (AC-1, AC-2, AC-3).** Inspect the exact Section 27 block, prove the argument sequence, prove the product diff is PRD-only, run `git diff --check`, and run `just verify`.
