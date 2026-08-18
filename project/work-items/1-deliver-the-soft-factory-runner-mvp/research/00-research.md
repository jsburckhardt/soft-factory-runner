# Research Brief: Deliver the Soft Factory Runner MVP

## GitHub Issue
- **Issue:** #1
- **Title:** Deliver the Soft Factory Runner MVP
- **Work Item:** project/work-items/1-deliver-the-soft-factory-runner-mvp

## Scope Classification
- **Scope Type:** issue

## Problem Statement
GitHub Issue #1 is the MVP delivery epic. Following checkout recovery, the current requested documentation delta is for `PRD.md` Section 27 to include the exact one-line command `OTEL_RESOURCE_ATTRIBUTES="project.name=<project>,issue.id=issue-<number>" copilot --yolo`. The Research-stage artifact must reflect the current repository state without changing product documentation.

## Acceptance Criteria
**Core**
- [ ] Every MVP phase is represented by a linked child feature in delivery order.
- [ ] Together, the child features cover PRD functional requirements FR-001 through FR-029 and acceptance criteria AC-001 through AC-020, including AC-011A and AC-018A.
- [ ] The delivered product accepts only explicit issue numbers and does not select or prioritize backlog work.

**Verification**
- [ ] The epic task list links every child feature and reflects its GitHub completion state.

## Repository Findings
- GitHub Issue #1 is titled “Deliver the Soft Factory Runner MVP,” is labeled `epic`, and contains one marker-wrapped, structured acceptance-criteria block with the four unchecked criteria reproduced above. Its delivery-order checklist links #8 and #2 through #7 and marks each complete.
- Exactly one issue-number-prefixed work-item directory exists: `project/work-items/1-deliver-the-soft-factory-runner-mvp/`. The recovered path already contains Research, Plan, Implement, and Verify artifacts and must remain stable (`project/work-items/README.md`).
- `PRD.md` Section 27 currently contains the generic telemetry value, but it is split across a shell continuation: the environment assignment ends with `\`, followed by `copilot --yolo --name "issue-<number>" --agent rpiv -p "Deliver issue #<number>"` on the next line (`PRD.md:1087-1120`). The exact requested one-line command is not present.
- The recovered implementation and verification records describe and accept the earlier, different delta: generalize concrete values while preserving the complete continued invocation (`project/work-items/1-deliver-the-soft-factory-runner-mvp/implementation/00-implementation.md`; `project/work-items/1-deliver-the-soft-factory-runner-mvp/verify/summary.md`). The current request therefore supersedes the recovered Research brief’s description of the pending delta.
- Runtime launch behavior is separate from the PRD shell presentation. `IssueRunService.runWorker` builds Copilot arguments as `--yolo`, `--name`, `--agent rpiv`, and `--prompt`, and passes an explicit environment to `ProcessPort.spawnCopilot` (`src/orchestrator.ts`, `IssueRunService.runWorker`; `src/ports.ts`, `ProcessPort`).
- `composeCopilotLaunchEnvironment` applies Runner-owned `OTEL_RESOURCE_ATTRIBUTES`, and `LiveProcessPort.spawnCopilot` invokes the executable and argument array with `shell: false` (`src/orchestrator.ts`, `composeCopilotLaunchEnvironment`; `src/live.ts`, `LiveProcessPort.spawnCopilot`).
- Existing orchestration tests assert the generated telemetry value and complete Copilot argument array (`src/orchestration.test.ts`, the launch-input and configured-environment cases). `docs/phase-1-issue-run.md` likewise states that the executable and argument order include `--name`, `--agent rpiv`, and `--prompt`.

## Constraints
- This Research rerun may update only `project/work-items/1-deliver-the-soft-factory-runner-mvp/research/00-research.md`; `PRD.md`, application source, tests, architecture artifacts, and plans remain unchanged at this stage.
- The requested documentation string is exact and one-line: `OTEL_RESOURCE_ATTRIBUTES="project.name=<project>,issue.id=issue-<number>" copilot --yolo`.
- The GitHub Issue acceptance criteria must remain verbatim and in issue order; they concern epic delivery rather than the newly requested Section 27 wording.
- The existing work-item directory is the sole issue #1 path and must be reused without rename or duplication (`project/work-items/README.md`; Decision Log decisions 24-25).
- Existing runtime contracts require Runner-generated telemetry to be applied last and require shell-free Copilot execution with the established argument array. A documentation-only wording delta does not itself alter those contracts (`ADR-260812-copilot-child-environment`; `CORE-COMPONENT-260812-copilot-child-environment-contract`; `CORE-COMPONENT-260810-subprocess-execution`).
- Runner accepts explicit issue numbers and does not select backlog work (`CORE-COMPONENT-260811-concurrent-run-admission`; Decision Log decisions 66 and 73), consistent with the issue-level acceptance criterion.

## Relevant ADRs and Core-Components
- `project/architecture/ADR/ADR-260812-copilot-child-environment.md` — generated `OTEL_RESOURCE_ATTRIBUTES` remains final in the Copilot child environment and the executable/argument array remains unchanged.
- `project/architecture/ADR/ADR-260811-prototype-one-run-orchestration.md` — defines normalized repository telemetry and deterministic explicit-issue orchestration.
- `project/architecture/core-components/CORE-COMPONENT-260812-copilot-child-environment-contract.md` — governs environment composition, literal transport, and shell-free launch.
- `project/architecture/core-components/CORE-COMPONENT-260811-issue-run-orchestration.md` — requires the complete RPIV Copilot argument array and generated resource attributes.
- `project/architecture/core-components/CORE-COMPONENT-260810-subprocess-execution.md` — requires executable/argument-array subprocess execution rather than shell interpolation.
- `project/architecture/core-components/CORE-COMPONENT-260811-concurrent-run-admission.md` — preserves explicit issue selection and prohibits automatic issue selection.
- `project/architecture/ADR/DECISION-LOG.md` registers these accepted/adopted records and the applicable stable-path, launch-environment, subprocess, and explicit-issue decisions.

## Risks and Open Questions
- The exact requested one-line command ends at `copilot --yolo`, while current PRD prose, runtime code, user documentation, architecture contracts, and tests include additional required RPIV arguments. The intended relationship between the shorter documentation line and the complete runtime invocation is not stated by Issue #1’s acceptance criteria.
- Issue #1’s acceptance criteria describe MVP epic completeness and explicit issue selection; none explicitly mention the Section 27 command. The user-requested delta is therefore narrower than, and not directly traceable to, the issue criteria.
- Recovered work-item records report the previous Section 27 change as accepted and shipped through PR #21, but the checked-out PRD still lacks the newly requested exact one-line string. Those records are historical context, not proof that the current delta is present.
