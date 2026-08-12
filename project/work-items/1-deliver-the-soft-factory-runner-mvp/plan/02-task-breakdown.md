# Task Breakdown: Document the Generic RPIV Copilot Launch

## Task T-1: Replace the concrete Section 27 launch values

- **Status:** Ready
- **Complexity:** XS
- **Dependencies:** None
- **Acceptance Criteria:** AC-1, AC-2, AC-3
- **Related ADRs:** ADR-260812-copilot-child-environment; ADR-260811-prototype-one-run-orchestration
- **Related Core-Components:** CORE-COMPONENT-260812-copilot-child-environment-contract; CORE-COMPONENT-260811-issue-run-orchestration; CORE-COMPONENT-260810-subprocess-execution; CORE-COMPONENT-260806-rpiv-stage-contract

### Description
Edit only the fenced launch example in `PRD.md` Section 27. Replace `jsburckhardt-example` with `<project>` and every example issue number with `<number>`. Keep the OTEL assignment immediately before the complete existing Copilot invocation, including the continuation layout, `--yolo`, `--name`, `--agent rpiv`, `-p`, and prompt. Do not implement or alter runtime behavior, tests, other product documentation, or architecture artifacts.

### Acceptance Criteria
- **AC-1:** The launch block begins with the exact generic prefix `OTEL_RESOURCE_ATTRIBUTES="project.name=<project>,issue.id=issue-<number>"`.
- **AC-2:** The immediately following command remains exactly `copilot --yolo --name "issue-<number>" --agent rpiv -p "Deliver issue #<number>"`.
- **AC-3:** The only product-file modification is the Section 27 example in `PRD.md`; Plan artifacts remain stage evidence rather than product changes.

### Test Coverage
- Run TEST-1 to compare the complete rendered block and adjacency (AC-1).
- Run TEST-2 to compare the argument sequence and all placeholders (AC-2).
- Run TEST-3 to inspect the path- and hunk-scoped diff (AC-3).
- Run TEST-4 for whitespace and repository regression checks (AC-1, AC-2, AC-3).

### Expected Evidence
- A Section 27 excerpt containing the exact two-line generic launch block.
- A `git diff -- PRD.md` hunk changing only concrete example values to placeholders.
- A product-file diff inventory containing only `PRD.md`.
- Successful `git diff --check` and `just verify` outputs.

## Task T-2: Validate the documentation-only patch

- **Status:** Blocked until T-1
- **Complexity:** S
- **Dependencies:** T-1
- **Acceptance Criteria:** AC-1, AC-2, AC-3
- **Related ADRs:** ADR-260812-copilot-child-environment; ADR-260811-prototype-one-run-orchestration
- **Related Core-Components:** CORE-COMPONENT-260812-copilot-child-environment-contract; CORE-COMPONENT-260811-issue-run-orchestration; CORE-COMPONENT-260810-subprocess-execution; CORE-COMPONENT-260806-rpiv-stage-contract

### Description
Execute the test plan after T-1. Validate the exact documentation block without adding permanent test code, inspect the complete product diff, and run the repository quality gate. If validation exposes a content or scope defect, return to T-1 and correct only `PRD.md`.

### Acceptance Criteria
- **AC-1:** Exact inspection proves the generic OTEL prefix is directly before Copilot.
- **AC-2:** Exact inspection proves all required arguments and generic issue substitutions are retained.
- **AC-3:** Git inspection proves no product file other than `PRD.md` changed and no architecture artifact changed.

### Test Coverage
- Execute TEST-1 and TEST-2 as targeted content validation.
- Execute TEST-3 as scope validation.
- Execute TEST-4 as full regression validation.

### Expected Evidence
- Captured output from all TEST-1 through TEST-4 steps.
- A clean whitespace report and successful full quality-gate exit.
- Final diff showing one Section 27 documentation hunk and no architecture changes.
