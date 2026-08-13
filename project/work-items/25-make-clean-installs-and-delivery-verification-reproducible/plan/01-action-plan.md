# Action Plan: Make clean installs and delivery verification reproducible

## Feature
- **ID:** 25
- **Research Brief:** project/work-items/25-make-clean-installs-and-delivery-verification-reproducible/research/00-research.md
- **Delivery Mode:** Capture and deliver the existing dirty-tree implementation; do not redesign, replace, or expand it.

## ADRs Created

None. The existing changes apply ADR-260810-typescript-node-cli, ADR-260811-engineering-harness-surface, and ADR-260812-official-asset-distribution-installation. They implement established npm/Jest, root-command, harness, and package-distribution boundaries rather than create a new architectural choice.

## Core-Components Created

None. CORE-COMPONENT-260806-project-command-interface, CORE-COMPONENT-260810-development-standards, CORE-COMPONENT-260811-engineering-harness-interface, and CORE-COMPONENT-260812-official-asset-installation-contract already govern the implemented behavior. No architecture or DECISION-LOG.md change is required.

## Existing Implementation Scope

Preserve and review exactly the current changes: explicit jest-util runtime support and regenerated package-lock.json; deterministic just setup and bare just discovery; synchronized devcontainer feature lock; and the existing ci.yml definition for PR/main/manual triggers, Node 22/24 clean verification, immutable actions, least privilege, concurrency, timeouts, whitespace/clean-tree checks, and npm package build/install/CLI smoke. Implementation may fill only directly required documentation or evidence gaps. Any product, configuration, test-helper, recipe, or workflow redesign is out of scope and must return to Plan.

## Acceptance Criteria

- **AC-1:** In a clean Linux checkout with package-registry access and no installed dependencies, `just setup` uses the committed dependency state without changing it, and `just verify` passes the complete discovered test suite and coverage collection on Node.js 22 and Node.js 24.
- **AC-2:** Pull requests, pushes to the default branch, and manual dispatch each run clean setup and full verification for Node.js 22 and Node.js 24 with read-only repository permissions; a newer run for the same workflow and pull-request number or Git ref cancels an older in-progress run.
- **AC-3:** Delivery checks prove that the built package contains only the publish set declared by the package manifest, includes its declared CLI entry point, installs without development dependencies, and exits successfully with the existing CLI contract output when run from the installed package.
- **AC-4:** Bare `just` invocation lists the available project recipes and exits successfully.
- **AC-5:** The development-container feature lock has exactly one entry for every configured feature, including Node.js, no entry for an unconfigured feature, and an immutable resolved reference and integrity digest for every entry.
- **AC-6:** Clean verification does not depend on an accidentally available or previously installed transitive package; coverage collection completes without the observed missing-module failure.
- **AC-7:** Repeating `just setup` and `just verify` in the same checkout remains successful and leaves committed dependency state unchanged.
- **AC-8:** Automated delivery exits nonzero with inspectable output if full verification fails, verification changes tracked content, committed changes contain whitespace errors, package contents exceed the manifest publish set, package installation fails, or the installed CLI violates its existing output contract.
- **AC-9:** Captured command output and clean-tree status provide repeatable repository-local evidence of clean setup, the discovered passing test count, successful full verification, and unchanged committed dependency state.
- **AC-10:** The repository-inspectable delivery definition covers every required trigger, Node.js version, clean-tree check, whitespace check, and package check, and pins third-party automation to immutable revisions.

## Acceptance Coverage

| AC | Existing implementation review tasks | Tests or validation | Expected evidence |
|---|---|---|---|
| AC-1 | T-1, T-3, T-4 | V-1, V-8, V-9, V-10 | Clean Node 22/24 setup and full-verification logs, Jest totals/coverage, unchanged dependency files |
| AC-2 | T-2, T-4 | V-4, V-10 | Static workflow trigger/matrix/security/concurrency report and post-push hosted job URLs |
| AC-3 | T-2, T-3 | V-6, V-10 | Existing package-step pack inventory, bin presence, omit-dev install, exact CLI output and exit 0 |
| AC-4 | T-1, T-3 | V-2 | Bare just exit 0 and current recipe listing |
| AC-5 | T-2, T-3 | V-3 | Exact feature-key equality and immutable digest report |
| AC-6 | T-1, T-3, T-4 | V-1, V-8, V-9 | Direct jest-util lock resolution and clean coverage without missing-module failure |
| AC-7 | T-1, T-4 | V-8, V-9 | Two successful setup/verify cycles and unchanged dependency hashes |
| AC-8 | T-2, T-3 | V-4, V-7 | Failure-path trace showing nonzero propagation and inspectable named-step output |
| AC-9 | T-3, T-4 | V-5, V-8, V-9, V-10 | Captured commands, suite totals, coverage, hashes, diff checks, and status |
| AC-10 | T-2, T-3 | V-4 | Repository-inspectable workflow report with full-SHA pins and every required check |

Coverage is complete: every AC maps to review of the existing implementation, validation, and concrete evidence.

## Implementation Tasks

1. **T-1 — Review the existing dependency and command changes (AC-1, AC-4, AC-6, AC-7, AC-9).** Validate the current package manifest/lock and justfile diff as implemented, including the broad lock regeneration. Do not regenerate or alter them unless review proves a directly acceptance-blocking defect.
2. **T-2 — Review the existing devcontainer and CI delivery definition (AC-2, AC-3, AC-5, AC-8, AC-10).** Statically inspect the current lock synchronization and ci.yml behavior, including its existing inline package smoke. Do not replace it with new recipes, helpers, or workflow design.
3. **T-3 — Capture local validation and fill only required evidence/documentation gaps (AC-1, AC-3, AC-4, AC-5, AC-6, AC-8, AC-9, AC-10).** Run focused checks and safe local package/static validation against current files. Change documentation only if needed to accurately describe the already-implemented behavior.
4. **T-4 — Produce clean-runtime and handoff proof for the existing implementation (AC-1, AC-2, AC-6, AC-7, AC-9).** Run Node 22/24 clean and repeat proof where available, then full harness/direct gates and prepare the unchanged current scope for evidence, commit, and post-push CI verification.
