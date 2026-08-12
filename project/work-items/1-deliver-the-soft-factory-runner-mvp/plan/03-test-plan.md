# Test Plan: Complete Issue 1 Epic Evidence and Section 27 Launch Example

## Test TEST-1: Validate epic delivery order and completion

- **Type:** GitHub metadata validation
- **Task:** T-1, T-3
- **Acceptance Criteria:** AC-1, AC-4
- **Priority:** Critical

### Setup
Run from the repository root with `gh` authenticated for `jsburckhardt/soft-factory-runner`.

### Steps
1. Run `gh issue view 1 --repo jsburckhardt/soft-factory-runner --json number,title,state,labels,body`.
2. Run `for issue in 8 2 3 4 5 6 7; do gh issue view "$issue" --repo jsburckhardt/soft-factory-runner --json number,title,state,url; done`.
3. Confirm the delivery checklist is exactly `#8, #2, #3, #4, #5, #6, #7` in that order and every marker is checked.
4. Confirm every child reference resolves to its reported URL and every live child state is `CLOSED`.

### Expected Result
Issue #1 links all seven MVP children in delivery order, its task markers report completion, and live GitHub state reports all seven children closed.

### Expected Evidence
- Issue #1 JSON containing the ordered checked checklist.
- Seven child JSON records containing number, title, URL, and `CLOSED` state.

## Test TEST-2: Validate child coverage of PRD requirements

- **Type:** Traceability validation
- **Task:** T-1, T-3
- **Acceptance Criteria:** AC-2
- **Priority:** Critical

### Setup
Run from the repository root with `PRD.md` and authenticated `gh` access.

### Steps
1. Run `test "$(grep -Ec '^## FR-(00[1-9]|0[12][0-9])' PRD.md)" -eq 29`.
2. Run `test "$(grep -Ec '^## AC-(00[1-9]|01[0-9]|020|011A|018A)$' PRD.md)" -eq 22`.
3. Run `for issue in 8 2 3 4 5 6 7; do gh issue view "$issue" --repo jsburckhardt/soft-factory-runner --json number,title,body,state; done`.
4. Build the Implement evidence crosswalk assigning every FR-001 through FR-029 and every AC-001 through AC-020, including AC-011A and AC-018A, to supporting text from at least one child scope.
5. Confirm the crosswalk has 29 FR rows and 22 AC rows with no missing ID.

### Expected Result
The PRD declares the complete requested ID sets and every ID maps to delivered scope in child issues #8 and #2 through #7.

### Expected Evidence
- Exit-0 ID count commands.
- A complete 29-row FR and 22-row AC child-feature crosswalk with child numbers and supporting text.

## Test TEST-3: Validate explicit-issue-only behavior

- **Type:** Integration and documentation validation
- **Task:** T-1, T-3
- **Acceptance Criteria:** AC-3
- **Priority:** Critical

### Setup
Use the existing deterministic suites through the root `justfile`.

### Steps
1. Run `just test --runInBand src/integration.test.ts src/reconciliation.test.ts src/doctor-integration.test.ts src/documentation.test.ts src/official-assets.test.ts`.
2. Confirm the tested CLI and fixtures accept explicit issue identities only, admission never selects or queues another issue, Doctor does not inspect or select issues, and official agent contracts delegate explicit issue execution to Runner.

### Expected Result
All targeted suites pass with no backlog selection, ranking, queueing, or prioritization behavior.

### Expected Evidence
- Exit-0 output from the root `just test` recipe naming all targeted suites.
- Relevant passing assertion names or source references for each explicit-issue prohibition.

## Test TEST-4: Verify the exact one-line Section 27 fence

- **Type:** Static documentation validation
- **Task:** T-2, T-3
- **Acceptance Criteria:** AC-5
- **Priority:** Critical

### Setup
Complete T-2 and run from the repository root.

### Steps
1. Run `test "$(awk '/The internal worker then launches:/{seen=1;next} seen && /^```bash$/{fence=1;next} fence && /^```$/{exit} fence{print}' PRD.md)" = 'OTEL_RESOURCE_ATTRIBUTES="project.name=<project>,issue.id=issue-<number>" copilot --yolo'`.
2. Run `awk '/The internal worker then launches:/{seen=1;next} seen && /^```bash$/{fence=1;next} fence && /^```$/{exit} fence{print}' PRD.md` and capture the output.

### Expected Result
The assertion exits 0 only when the complete launch-fence body is exactly the requested command on one line, with no continuation or additional argument.

### Expected Evidence
- Exit-0 exact-body assertion.
- Printed fence body equal to `OTEL_RESOURCE_ATTRIBUTES="project.name=<project>,issue.id=issue-<number>" copilot --yolo`.

## Test TEST-5: Validate product diff scope

- **Type:** Change-scope validation
- **Task:** T-2, T-3
- **Acceptance Criteria:** AC-5
- **Priority:** Critical

### Setup
Complete T-2. Treat Research, Plan, and Implement artifacts in the preserved work-item path as expected stage evidence.

### Steps
1. Run `git diff -- PRD.md` and inspect every hunk.
2. Run `git diff --name-only -- . ':(exclude)project/work-items/1-deliver-the-soft-factory-runner-mvp/**'`.
3. Run `git status --short`.
4. Confirm the only product path is `PRD.md`, its only hunk replaces the Section 27 launch-fence body, and `src/`, tests, other documentation, and `project/architecture/` are unchanged.

### Expected Result
Only the requested Section 27 fence changes among product files.

### Expected Evidence
- One narrowly scoped `PRD.md` hunk.
- Product path inventory containing only `PRD.md`.
- Status output proving no implementation or architecture artifact changed.

## Test TEST-6: Run root repository validation

- **Type:** Focused and full regression
- **Task:** T-3
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5
- **Priority:** High

### Setup
Complete TEST-1 through TEST-5 and remain at the repository root.

### Steps
1. Run `just verify-focused`.
2. Run `just verify`.
3. If either recipe fails, capture the exact failure, return to the owning task, and rerun the failed check followed by both root recipes.

### Expected Result
Both root recipes exit 0 without requiring any out-of-scope product change.

### Expected Evidence
- Successful `just verify-focused` output.
- Successful `just verify` output covering lint, format, type-check, Jest tests and coverage, build, and diff checking.
