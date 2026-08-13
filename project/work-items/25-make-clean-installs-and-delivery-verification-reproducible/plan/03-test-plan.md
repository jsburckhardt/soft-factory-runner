# Test Plan: Make clean installs and delivery verification reproducible

This plan validates the implementation already present in the dirty tree. It does not require new product code, recipes, workflow helpers, or tests. Temporary copies and directories may be used for safe evidence; the implementation checkout must be preserved.

## Test V-1: Existing dependency and lock consistency

- **Type:** Static dependency review
- **Task:** T-1
- **Acceptance Criteria:** AC-1, AC-6, AC-7
- **Priority:** Critical

### Setup
Use the current package.json and regenerated package-lock.json before installation and record hashes.

### Steps
1. Compare root dependency declarations and require explicit compatible jest-util.
2. Confirm a usable root lock resolution and npm lock consistency.
3. Review the broad deduplication as generated dependency state rather than assuming correctness from diff size.

### Expected Result
Manifest and lock agree, jest-util is directly available to Jest coverage, and inspection changes no file.

### Expected Evidence
Version/resolution report, consistency exit, lock-diff review, and unchanged hashes.

## Test V-2: Existing bare just discovery

- **Type:** CLI smoke
- **Task:** T-1, T-3
- **Acceptance Criteria:** AC-4, AC-9
- **Priority:** High

### Setup
Run from repository root with the current justfile.

### Steps
Invoke bare just and capture status/stdout.

### Expected Result
Exit 0 and the current available recipe list is displayed.

### Expected Evidence
Command transcript and recipe listing.

## Test V-3: Existing devcontainer feature-lock synchronization

- **Type:** Static configuration review
- **Task:** T-2, T-3
- **Acceptance Criteria:** AC-5
- **Priority:** High

### Setup
Read the current devcontainer configuration and lock.

### Steps
1. Compare normalized configured and locked feature keys.
2. Require Node and confirm no unconfigured Azure CLI entry.
3. Validate digest-qualified resolved and SHA-256 integrity values for every lock entry.

### Expected Result
All ten configured features have exactly one immutable lock entry and no extra key.

### Expected Evidence
Key-set and digest report.

## Test V-4: Existing workflow structure and security

- **Type:** Workflow YAML static review
- **Task:** T-2, T-3
- **Acceptance Criteria:** AC-2, AC-8, AC-10
- **Priority:** Critical

### Setup
Inspect the current .github/workflows/ci.yml without modifying it.

### Steps
1. Confirm pull-request, main-push, and manual triggers.
2. Confirm Node 22.x/24.x matrix, just setup/verify, contents read, fail-fast false, PR/ref cancellation, and timeouts.
3. Confirm committed whitespace, post-verification clean tree, dependent package job, and every full-SHA action pin.
4. Trace shell and job dependency behavior to nonzero exits.

### Expected Result
The current workflow definition contains every required delivery and security fact and does not mask failures.

### Expected Evidence
Fact/line report and local-definition label; no claim of hosted execution.

## Test V-5: Focused repository validation

- **Type:** Existing quality gate
- **Task:** T-3
- **Acceptance Criteria:** AC-1, AC-6, AC-9
- **Priority:** High

### Setup
Preserve the known dirty implementation baseline.

### Steps
1. Run harness checks --focused --json.
2. Separately run direct just verify-focused.
3. Compare status with the baseline.

### Expected Result
Both focused interfaces pass independently and create no unintended tracked change.

### Expected Evidence
Harness JSON, direct command output with discovered tests, and status comparison.

## Test V-6: Existing local package smoke

- **Type:** Package integration review
- **Task:** T-2, T-3, T-4
- **Acceptance Criteria:** AC-3, AC-8, AC-9
- **Priority:** Critical

### Setup
Build through current root recipes and use temporary pack/install directories outside the checkout. Follow the commands already present in the package workflow step; do not add a recipe or helper.

### Steps
1. Run npm pack --json and apply the existing workflow allowlist check.
2. Confirm dist/index.js, matching the declared bin entry, is included.
3. Install the tarball with --omit=dev and existing safe npm flags into an empty prefix.
4. Run installed soft-factory and compare exact output/exit to the existing contract.

### Expected Result
Only the declared publish set plus required npm metadata is packed, the bin exists, install succeeds without dev dependencies, and CLI output is exact.

### Expected Evidence
Pack JSON, allowlist output, install log/tree, executable path, exact stdout/exit, and temporary cleanup.

## Test V-7: Existing delivery failure-path inspection

- **Type:** Static fail-closed validation
- **Task:** T-2, T-3
- **Acceptance Criteria:** AC-8, AC-10
- **Priority:** Critical

### Setup
Use current workflow text and shell semantics. Safe temporary command probes may be used, but no implementation file is changed.

### Steps
1. Trace a nonzero just verify result.
2. Trace a dirty post-verification status result.
3. Trace git diff --check for committed whitespace.
4. Trace the package allowlist exception, npm install failure, and exact CLI comparison failure.
5. Confirm each occurs in a named step with inspectable output and cannot be masked.

### Expected Result
All six issue failure classes necessarily make the owning job nonzero under the current implementation.

### Expected Evidence
Six-row failure-path table with workflow lines, shell exit mechanism, and output source; optional safe temporary probe transcripts.

## Test V-8: Node 22 clean and repeated verification

- **Type:** Clean-install integration
- **Task:** T-1, T-4
- **Acceptance Criteria:** AC-1, AC-6, AC-7, AC-9
- **Priority:** Critical

### Setup
Create an isolated clean Linux checkout containing the reviewed current changes, use Node 22 with registry access, ensure no node_modules, and hash dependency files.

### Steps
1. Run just setup and just verify.
2. Capture Jest suite/test totals, coverage, and absence of the jest-util failure.
3. Repeat both commands.
4. Recheck hashes and isolated-checkout status.

### Expected Result
Both cycles pass complete verification and leave committed dependency state unchanged.

### Expected Evidence
Runtime/npm versions, four command logs, Jest totals/coverage, before/after hashes, and status.

## Test V-9: Node 24 clean and repeated verification

- **Type:** Clean-install integration
- **Task:** T-1, T-4
- **Acceptance Criteria:** AC-1, AC-6, AC-7, AC-9
- **Priority:** Critical

### Setup
Repeat V-8 in an isolated Linux checkout with Node 24.

### Steps
Run both existing setup/verify cycles and all V-8 state comparisons.

### Expected Result
Node 24 produces the same clean and repeatable result.

### Expected Evidence
Runtime/npm versions, logs, totals/coverage, hashes, and status.

## Test V-10: Existing implementation handoff and hosted proof

- **Type:** Handoff and post-push validation
- **Task:** T-4
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-9
- **Priority:** Critical

### Setup
Complete scope review and evidence capture without expanding implementation.

### Steps
1. Run harness checks --json and separately run direct just verify.
2. Rerun existing local package/static checks, git diff --check, and expected-tree status.
3. Record implementation evidence and commit the existing reviewed scope.
4. After push, inspect Node 22/24 jobs and dependent package job. Record cancellation only if genuinely observed.

### Expected Result
Full local gates pass, the delivered commit preserves exact scope, and hosted proof is distinguished from local proof.

### Expected Evidence
Full harness envelope, direct just output with totals/coverage, package/static reports, diff/status, implementation evidence, commit SHA, and post-push run/job URLs. Before push, hosted execution remains explicitly pending.
