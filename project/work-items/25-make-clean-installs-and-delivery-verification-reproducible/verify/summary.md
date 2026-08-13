# Verification Summary — Issue #25

- Work item: `project/work-items/25-make-clean-installs-and-delivery-verification-reproducible`
- Branch: `fix/25-reproducible-clean-install-ci`
- Implement handoff: `ade6b91260889e02287a43a972b77463db531c08`
- Implementation content: `3b9a2061352b51e8d2411962d301f3daa2ce8bba`
- Base: `e6a4c3c9414a48dd47617e2ff78fe2b2f5856f33`
- Pull request: https://github.com/jsburckhardt/soft-factory-runner/pull/26

## Independent acceptance decisions

| ID | Status | Evidence |
|---|---|---|
| AC-1 | Passed locally; final hosted proof required | Two local Node 24 clean setup/full-verification cycles passed without dependency drift; Implement recorded two isolated cycles on Node 22 and 24. The final PR matrix is the independent hosted runtime proof. |
| AC-2 | Passed definition review; final hosted proof required | Workflow includes PR, main push, and manual triggers, read-only contents, cancellation by PR/ref, Ubuntu 24.04, and Node 22.x/24.x. |
| AC-3 | Passed locally; final hosted proof required | Independent package smoke packed 65 allowlisted files, included dist/index.js, installed with omit-dev, and produced exact CLI output at exit 0. |
| AC-4 | Passed | Bare just exited 0 and listed the root recipes. |
| AC-5 | Passed | Exact 10/10 configured/locked feature parity; Node included, Azure excluded, all resolved/integrity digests immutable and equal. |
| AC-6 | Passed | Direct jest-util@29.7.0 resolution and repeated 21-suite/327-test coverage runs without missing-module failure. |
| AC-7 | Passed | Repeated setup/full verification succeeded; package.json and package-lock.json SHA-256 values remained unchanged. |
| AC-8 | Passed | Workflow named steps and shell semantics propagate nonzero for verification, whitespace, dirtiness, package allowlist/bin, install, and CLI contract failures. |
| AC-9 | Passed locally; final hosted proof required | Captured setup hashes, clean status, direct/harness validation, suite totals, coverage, workflow checks, and package smoke. |
| AC-10 | Passed | js-yaml and Prettier checks confirmed every required trigger, matrix/check step, and six immutable action pins. |

## Validation

- Root recipes expose `verify-focused` and `verify`.
- Required final validation snapshot: `just verify`.
- Direct `just verify`: passed independently twice; 21 suites and 327 tests passed; coverage was 88.04% statements, 83.48% branches, 94.44% functions, and 89.65% lines.
- `harness checks --json`: status `ok`, delegated `just verify`, exit code 0.
- Repeated `just setup`: passed and preserved package hashes `a738c0688ebb623e0d5e562c5970babc9e954e133ef71c2dcb22891d5c7ae988` and `3758958784e35fdef68812b7818272e3151df81c39c6a2cd2331b56548503126`.
- Workflow YAML: js-yaml parse/assertions and Prettier check passed.
- Devcontainer lock: feature parity and immutable digest assertions passed.
- Package smoke: 65 files, zero unexpected paths, declared bin present, production-only install passed, exact CLI output passed.
- Final GitHub-hosted checks are intentionally confirmed after this verifier-owned metadata commit is pushed; the PR and immutable result carry the final-head outcome.

## Scope, architecture, and documentation

The complete base-to-handoff diff contains only the explicitly planned devcontainer lock, workflow, dependency state, root command interface, RPIV artifacts, and generated retro records. No unrelated code, test, ADR, core-component, or decision-log change exists. The implementation conforms to the registered TypeScript/npm, command-interface, harness, development-standard, and official-package contracts.

Application documentation passed independent review. README, CONTRIBUTING, docs index, official package guide, API applicability, configuration, usage, migration, architecture, operations, and deployment statements remain accurate. No application documentation change is required because product/API/runtime behavior is unchanged and CI is delivery verification.

## Verifier friction and harvest

- Generated verifier retros: `.harness/records/retro/2026-08-13/005-issue-25-rpiv-verifier.md` , `.harness/records/retro/2026-08-13/006-issue-25-rpiv-verifier-postcommit.md`, , `.harness/records/retro/2026-08-13/007-issue-25-rpiv-verifier-publication.md`, and `.harness/records/retro/2026-08-13/008-issue-25-rpiv-verifier-result-publication.md`
- Publication binding discovery: Runner status and the strict no-clobber publication attempt returned `STATE_NOT_FOUND` because no coordinator-bound Runner snapshot exists in this checkout; no immutable result was created or replaced.
- Verifier commit attribution: commit `8403183c061ea988de19a5e941971cfc83c75832` succeeded in degraded harness-buffered mode; trace2 attribution remains deferred in the harness-named buffer.
- Read-back-before-clear: passed for the two initial entries and the post-commit entry; both clear envelopes returned status `ok` (2 then 1 cleared).
- Harvest command: `harness retro insights --plan 25-make-clean-installs-and-delivery-verification-reproducible --json`
- Harvest: status `ok`, schema `harness.retro-insights/v1`, 7 records, 25 entries, agents rpiv-research/rpiv-planner/rpiv-implementer/rpiv-verifier, 0 malformed, 0 unsupported, 0 pending buffer entries.
