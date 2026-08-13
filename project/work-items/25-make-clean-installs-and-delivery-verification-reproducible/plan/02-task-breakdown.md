# Task Breakdown: Make clean installs and delivery verification reproducible

## Task T-1: Review existing dependency and command changes

- **Status:** Complete
- **Complexity:** Medium
- **Dependencies:** None
- **Acceptance Criteria:** AC-1, AC-4, AC-6, AC-7, AC-9
- **Related ADRs:** ADR-260810-typescript-node-cli; ADR-260811-engineering-harness-surface
- **Related Core-Components:** CORE-COMPONENT-260806-project-command-interface; CORE-COMPONENT-260810-development-standards; CORE-COMPONENT-260811-engineering-harness-interface

### Description

Review the already-implemented package.json, package-lock.json, and justfile diff. Confirm the explicit jest-util declaration and root lock resolution are compatible with Jest 29.7, npm ci --include=dev consumes the committed lock, and bare just delegates to recipe listing. Reconcile the 2,300-line lock reduction with lock consistency and clean-install evidence. Preserve the current files; alter or regenerate them only if review finds a direct acceptance-blocking defect, and return to Plan before any scope expansion.

### Acceptance Criteria

- AC-1, AC-6, and AC-7 are supported by the current manifest/lock/setup implementation and clean/repeat proof.
- AC-4 is supported by the current default recipe.
- AC-9 evidence records exact dependency state and command results.

### Test Coverage

- Run V-1, V-2, V-8, and V-9.
- Compare package.json and package-lock.json hashes before and after setup/verify.
- Do not add new product code, recipes, or test helpers for this review.

### Expected Evidence

- Current focused diff and manifest/lock consistency report.
- Direct jest-util resolution and bare just transcript.
- Node 22/24 clean/repeat logs with Jest totals and coverage.
- Before/after dependency hashes and status.

## Task T-2: Review existing devcontainer and CI delivery definition

- **Status:** Complete
- **Complexity:** Medium
- **Dependencies:** T-1
- **Acceptance Criteria:** AC-2, AC-3, AC-5, AC-8, AC-10
- **Related ADRs:** ADR-260811-engineering-harness-surface; ADR-260812-official-asset-distribution-installation
- **Related Core-Components:** CORE-COMPONENT-260806-project-command-interface; CORE-COMPONENT-260811-engineering-harness-interface; CORE-COMPONENT-260812-official-asset-installation-contract; CORE-COMPONENT-260810-error-handling

### Description

Review the already-implemented devcontainer-lock correction and untracked ci.yml. Confirm exact feature parity, Node inclusion, Azure CLI removal, and immutable lock references. Inspect the existing workflow as written for all triggers, Node 22/24 clean setup/full verification through root just recipes, least privilege, cancellation, timeouts, full-SHA actions, committed whitespace, post-verification clean-tree enforcement, and its existing package build/allowlist/bin/omit-dev install/CLI smoke. Preserve the inline delivery implementation; do not move it into new recipes or helpers.

### Acceptance Criteria

- AC-2 and AC-10 are completely represented by the current workflow definition.
- AC-3 is completely represented by the current package job.
- AC-5 is completely represented by the current synchronized lock.
- Every AC-8 failure path propagates nonzero with inspectable step output.

### Test Coverage

- Run V-3, V-4, V-6, and V-7.
- Use static inspection and temporary local package directories; do not edit ci.yml to facilitate testing.
- Distinguish repository definition proof from GitHub-hosted execution proof.

### Expected Evidence

- Feature-key and immutable-digest report.
- Workflow fact and failure-path trace with line/step references.
- Local execution of the existing package commands with pack/install/CLI output.
- Explicit pending status for hosted CI until commit and push.

## Task T-3: Capture local proof and required documentation evidence

- **Status:** Complete
- **Complexity:** Medium
- **Dependencies:** T-1, T-2
- **Acceptance Criteria:** AC-1, AC-3, AC-4, AC-5, AC-6, AC-8, AC-9, AC-10
- **Related ADRs:** ADR-260810-typescript-node-cli; ADR-260811-engineering-harness-surface; ADR-260812-official-asset-distribution-installation
- **Related Core-Components:** CORE-COMPONENT-260806-rpiv-stage-contract; CORE-COMPONENT-260806-agent-executable-acceptance-criteria; CORE-COMPONENT-260810-development-standards; CORE-COMPONENT-260811-engineering-harness-interface

### Description

Validate the current implementation without redesign. Run harness checks --focused --json and direct just verify-focused, bare just, devcontainer/workflow static inspection, and a safe local reproduction of the existing package smoke in temporary directories. Inspect README, CONTRIBUTING, docs, and harness guidance for accuracy. Add documentation only when directly required to describe behavior already present; otherwise record a concrete no-impact rationale. Record results in implementation evidence, not new validation infrastructure.

### Acceptance Criteria

- Local proof addresses every assigned AC against the existing dirty diff.
- Root justfile remains setup and verification authority; the existing workflow remains unchanged unless defective.
- Documentation is accurate or has a per-document no-impact rationale.
- No unrelated product, configuration, CI, recipe, helper, or test change is introduced.

### Test Coverage

- Run V-2 through V-7.
- Capture focused harness and direct results independently.
- Inspect final status against the known implementation baseline.

### Expected Evidence

- Focused harness JSON and direct focused output.
- Bare just, static configuration/workflow, and local package-smoke transcripts.
- Documentation diff or no-impact rationale.
- Status showing only the accepted implementation, required docs/evidence, and work-item artifacts.

## Task T-4: Produce clean-runtime and handoff proof

- **Status:** Complete
- **Complexity:** High
- **Dependencies:** T-3
- **Acceptance Criteria:** AC-1, AC-2, AC-6, AC-7, AC-9
- **Related ADRs:** ADR-260810-typescript-node-cli; ADR-260811-engineering-harness-surface
- **Related Core-Components:** CORE-COMPONENT-260806-rpiv-stage-contract; CORE-COMPONENT-260810-development-standards; CORE-COMPONENT-260811-engineering-harness-interface

### Description

Use isolated Linux checkouts to run the existing implementation on Node 22 and Node 24, repeating setup/verify in each and preserving dependency hashes. At handoff run harness checks --json and direct just verify separately, plus local package/static checks, git diff --check, and expected-tree status. Write implementation evidence and commit the reviewed existing scope. Actual GitHub-hosted matrix proof is collected only after push; never claim it from local static inspection.

### Acceptance Criteria

- AC-1, AC-6, and AC-7 have both-runtime clean/repeat proof, or an explicit unavailable-runtime blocker pending the defined hosted matrix.
- AC-9 has complete local command and clean-state evidence.
- AC-2 has local definition proof and actual hosted proof only after push.
- Handoff contains no redesign or expansion beyond direct documentation/evidence gaps.

### Test Coverage

- Run V-8, V-9, and V-10.
- Required handoff gates are harness checks --json and direct just verify.
- Rerun V-6 after build for local package evidence without altering implementation files.

### Expected Evidence

- Isolated Node 22/24 logs for two cycles, runtime versions, Jest totals/coverage, and hashes.
- Full harness envelope and separate direct just output.
- Package/static reports, git diff --check, expected status, implementation evidence path, and commit SHA.
- Post-push run/job URLs, or an explicit pending external-proof note before push.
