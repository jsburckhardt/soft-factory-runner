# Test Plan: Document the Generic RPIV Copilot Launch

## Test TEST-1: Verify the generic OTEL prefix and adjacency

- **Type:** Static documentation validation
- **Task:** T-1, T-2
- **Acceptance Criteria:** AC-1
- **Priority:** Critical

### Setup
Complete T-1 and remain at the repository root.

### Steps
1. Print PRD Section 27 from the `# 27. RPIV Execution` heading through the paragraph after the resource-attribute example.
2. Inspect the fenced launch block as one unit.
3. Confirm its first command line is exactly `OTEL_RESOURCE_ATTRIBUTES="project.name=<project>,issue.id=issue-<number>" \`.
4. Confirm the Copilot command is the immediately following continued line.

### Expected Result
The generic project and issue attributes prefix appears immediately before the complete Copilot invocation, with no intervening prose or command.

### Expected Evidence
- Captured Section 27 excerpt showing both adjacent lines.
- An exact-string comparison or reviewer annotation identifying the generic prefix.

## Test TEST-2: Verify preservation of the complete Copilot invocation

- **Type:** Static contract validation
- **Task:** T-1, T-2
- **Acceptance Criteria:** AC-2
- **Priority:** Critical

### Setup
Use the same Section 27 excerpt produced by TEST-1.

### Steps
1. Compare the invocation against `copilot --yolo --name "issue-<number>" --agent rpiv -p "Deliver issue #<number>"`.
2. Verify `--yolo`, `--name`, `--agent rpiv`, `-p`, and the full prompt each occur once and in the existing order.
3. Verify all three issue references use `<number>` and no concrete issue number remains in this launch block.
4. Confirm no runtime source or architecture contract was edited to realize this documentation change.

### Expected Result
The command retains the complete existing argument contract while using generic issue placeholders consistently.

### Expected Evidence
- Exact invocation comparison output or captured line.
- `git status --short`/diff evidence showing no `src/` or `project/architecture/` modifications.

## Test TEST-3: Verify PRD-only product scope

- **Type:** Change-scope validation
- **Task:** T-1, T-2
- **Acceptance Criteria:** AC-3
- **Priority:** Critical

### Setup
Exclude the expected RPIV work-item artifacts when classifying product files.

### Steps
1. Run `git diff -- PRD.md` and inspect every hunk.
2. Run `git diff --name-only -- . ":(exclude)project/work-items/1-deliver-the-soft-factory-runner-mvp/**"`.
3. Inspect `git status --short` for untracked or modified product and architecture paths.
4. Confirm the only product path is `PRD.md`, the only PRD hunk is in Section 27, and architecture paths are unchanged.

### Expected Result
Only the Section 27 launch example changes in the product; the three Plan files are the only expected work-item additions.

### Expected Evidence
- Product diff inventory containing only `PRD.md`.
- One narrowly scoped `PRD.md` hunk.
- Status output proving no architecture artifact modification.

## Test TEST-4: Run repository regression validation

- **Type:** Regression and quality gate
- **Task:** T-1, T-2
- **Acceptance Criteria:** AC-1, AC-2, AC-3
- **Priority:** High

### Setup
Complete TEST-1 through TEST-3 and retain the documentation-only patch.

### Steps
1. Run `git diff --check`.
2. Run `just verify`.
3. If either command fails, capture the exact failure, correct only an in-scope documentation defect, and rerun the failed validation.

### Expected Result
The patch has no whitespace errors and the complete configured repository quality gate passes without requiring runtime or test changes.

### Expected Evidence
- Successful `git diff --check` exit.
- Successful `just verify` output covering lint, format, type-check, tests, build, and final diff checking.
