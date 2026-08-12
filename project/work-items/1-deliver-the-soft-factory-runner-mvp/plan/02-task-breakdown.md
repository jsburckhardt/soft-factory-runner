# Task Breakdown: Complete Issue 1 Epic Evidence and Section 27 Launch Example

## Task T-1: Validate epic delivery evidence

- **Status:** Complete
- **Complexity:** S
- **Dependencies:** None
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4
- **Related ADRs:** ADR-260811-prototype-one-run-orchestration; ADR-260811-prototype-three-recovery-concurrency
- **Related Core-Components:** CORE-COMPONENT-260806-rpiv-stage-contract; CORE-COMPONENT-260811-concurrent-run-admission; CORE-COMPONENT-260811-issue-run-orchestration

### Description
Query current GitHub metadata for Issue #1 and linked children #8 and #2 through #7. Compare their scopes with the closed PRD FR-001 through FR-029 and AC-001 through AC-020 set, including AC-011A and AC-018A. Confirm repository tests and documentation enforce explicit issue input and prohibit automatic backlog selection. Record commands and a concise crosswalk in `implementation/00-implementation.md`; do not edit GitHub or product files.

### Acceptance Criteria
- **AC-1:** Every MVP phase is represented by a linked child feature in delivery order.
- **AC-2:** Together, the child features cover PRD functional requirements FR-001 through FR-029 and acceptance criteria AC-001 through AC-020, including AC-011A and AC-018A.
- **AC-3:** The delivered product accepts only explicit issue numbers and does not select or prioritize backlog work.
- **AC-4:** The epic task list links every child feature and reflects its GitHub completion state.

### Test Coverage
- Execute TEST-1 for ordered links, checked markers, URLs, and live child states (AC-1, AC-4).
- Execute TEST-2 for PRD ID completeness and child-feature traceability (AC-2).
- Execute TEST-3 through the root `justfile` for explicit-issue-only behavior (AC-3).
- Execute TEST-6 for repository regression proof (AC-1, AC-2, AC-3, AC-4).

### Expected Evidence
- Issue #1 JSON and seven child JSON records with title, URL, and CLOSED state.
- A 29-row FR and 22-row AC child-feature crosswalk, explicitly including AC-011A and AC-018A.
- Passing targeted root-recipe output for explicit issue behavior.

## Task T-2: Replace only the Section 27 launch fence

- **Status:** Complete
- **Complexity:** XS
- **Dependencies:** T-1
- **Acceptance Criteria:** AC-5
- **Related ADRs:** ADR-260812-copilot-child-environment
- **Related Core-Components:** CORE-COMPONENT-260812-copilot-child-environment-contract; CORE-COMPONENT-260810-subprocess-execution

### Description
Edit only the fenced code block immediately after “The internal worker then launches:” in `PRD.md` Section 27. Replace its current two-line continued body with exactly `OTEL_RESOURCE_ATTRIBUTES="project.name=<project>,issue.id=issue-<number>" copilot --yolo` on one line between the existing `bash` fence delimiters. Remove the backslash continuation and `--name`, `--agent`, prompt flag, and prompt only from this documentation fence. Leave all Section 27 prose, the resource-attribute text fence, runtime behavior, tests, other documentation, and architecture artifacts unchanged.

### Acceptance Criteria
- **AC-5:** PRD Section 27 includes exactly the one-line fenced command `OTEL_RESOURCE_ATTRIBUTES="project.name=<project>,issue.id=issue-<number>" copilot --yolo`.

### Test Coverage
- Execute TEST-4 to assert the complete fence body exactly (AC-5).
- Execute TEST-5 to prove the product diff contains only one Section 27 hunk in `PRD.md` (AC-5).
- Execute TEST-6 through the root `justfile` for regression proof (AC-5).

### Expected Evidence
- Printed Section 27 launch fence with exactly one body line and no continuation or extra arguments.
- `git diff -- PRD.md` showing one narrowly scoped fence replacement.
- Product diff inventory containing only `PRD.md`; no `src/`, test, other documentation, or architecture changes.

## Task T-3: Validate epic and documentation evidence

- **Status:** Complete
- **Complexity:** S
- **Dependencies:** T-1, T-2
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5
- **Related ADRs:** ADR-260811-prototype-one-run-orchestration; ADR-260811-prototype-three-recovery-concurrency; ADR-260812-copilot-child-environment
- **Related Core-Components:** CORE-COMPONENT-260806-rpiv-stage-contract; CORE-COMPONENT-260806-project-command-interface; CORE-COMPONENT-260811-concurrent-run-admission; CORE-COMPONENT-260811-issue-run-orchestration; CORE-COMPONENT-260812-copilot-child-environment-contract; CORE-COMPONENT-260810-subprocess-execution

### Description
Execute every test in `plan/03-test-plan.md` from the repository root after T-1 and T-2. Capture commands, exit status, and redacted output in `implementation/00-implementation.md`. Inspect the final diff for exact scope and run both root validation recipes. If any check fails, return to the owning task, make only an in-scope correction, and repeat the failed check plus both root recipes.

### Acceptance Criteria
- **AC-1:** Live evidence proves the ordered linked MVP children.
- **AC-2:** The PRD ID inventory and child crosswalk prove complete MVP coverage.
- **AC-3:** Executable repository tests prove explicit issue input without backlog selection or prioritization.
- **AC-4:** Live GitHub evidence proves the epic checklist and child completion states agree.
- **AC-5:** Exact extraction and diff inspection prove the requested one-line Section 27 fence and no broader product change.

### Test Coverage
- Execute TEST-1 through TEST-6 and capture evidence for every AC-* ID.
- Run `just verify-focused` and `just verify` from the repository root.

### Expected Evidence
- An AC-1 through AC-5 evidence table in `implementation/00-implementation.md`.
- Exact commands, exit codes, and redacted output for TEST-1 through TEST-6.
- Final diff inventory proving `PRD.md` Section 27 is the only product edit.
