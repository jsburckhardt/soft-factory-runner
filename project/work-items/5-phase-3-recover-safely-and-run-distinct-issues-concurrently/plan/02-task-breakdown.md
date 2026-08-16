# Task Breakdown: Integrate PR #33 with Post-Wait Safety and Release 0.1.3

## Implementation Protocol
Preserve `project/work-items/5-phase-3-recover-safely-and-run-distinct-issues-concurrently`. Run `harness instructions boot` before boot and `harness instructions checks` before checks. Use the root `justfile` as validation authority. Tasks T-1 through T-14 are historical; this integration starts at T-15. Do not rewrite existing commits, rebase, or force-push.

## Task T-15: Create the state-preserving merge baseline

- **Status:** Pending
- **Complexity:** Medium
- **Dependencies:** None
- **Acceptance Criteria:** AC-1, AC-10
- **Related ADRs:** ADR-260811-prototype-three-recovery-concurrency
- **Related Core-Components:** CORE-COMPONENT-260505-commit-standards; CORE-COMPONENT-260806-rpiv-stage-contract; CORE-COMPONENT-260811-engineering-harness-interface

### Description
Commit the updated research and Plan artifacts as a conventional documentation commit so the dirty planning state is not mixed into conflict handling. Fetch normally, verify `origin/main` resolves to `61ac7dd21ce02709ba714353c61dfb67a05e390d`, and merge with `git merge --no-ff origin/main`. Preserve the PR #33 lineage, PR #35 merge/history, and all artifact creation dates. Confirm Git reports exactly the five researched content conflicts. Never use rebase, force-push, history replacement, or a choose-one-side bulk resolution.

### Acceptance Criteria
- AC-1: The integrated tree retains PR #33 reconciliation inputs while receiving the post-wait baseline.
- AC-10: Git history contains a normal two-parent integration merge and no rewritten commit.

### Test Coverage
Run V-23 merge/history assertions and inspect the conflict set before editing. Compare `git merge-base`, merge parents, and changed paths.

### Expected Evidence
The verified main SHA, pre-merge clean status, exact five-path conflict list, merge commit parents, and a no-rebase/no-force history trace.

## Task T-16: Resolve all five conflicts and reconcile architecture

- **Status:** Pending
- **Complexity:** Extra Large
- **Dependencies:** T-15
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-6, AC-8, AC-9, AC-10
- **Related ADRs:** ADR-260811-prototype-three-recovery-concurrency; ADR-260812-rpiv-integration-completion-contract; ADR-260814-tmux-identity-failure-recovery
- **Related Core-Components:** CORE-COMPONENT-260810-persistence-recovery; CORE-COMPONENT-260811-run-reconciliation-control; CORE-COMPONENT-260811-completion-evidence-reconciliation; CORE-COMPONENT-260811-owned-resource-cleanup; CORE-COMPONENT-260814-tmux-identity-diagnostics

### Description
Resolve `docs/README.md` by describing release 0.1.3, post-wait reload safety, candidate recovery, tmux transport, and the 0.1.2 upgrade path. Resolve both core-components by keeping every current post-wait exact reload, identity, typed refusal, terminal-idempotence, and current-revision rule alongside every PR #33 candidate classification, bounded query, explicit relaunch-free resume, and cleanup non-authorization rule. Resolve `src/documentation.test.ts` with an accurate combined Issue #5/#34 label and both assertion groups. Resolve `DECISION-LOG.md` by preserving records 1-167 byte-for-byte and adding the PR #33 decisions as 168-171 with original 2026-08-15 dates:

- 168: Permit result-candidate finalization recovery only after exact inactive proof.
- 169: Expose strict running-result candidates without bypassing unknown or contradictory boundaries.
- 170: Use candidate head and PR only for bounded completion observations.
- 171: Prohibit cleanup from result candidates or absent and malformed tmux evidence.

Retain the auto-merged ADR and owned-cleanup updates. Do not create or rename architecture artifacts.

### Acceptance Criteria
- AC-1: Candidate observations and current-state reload each retain their full proof boundary.
- AC-2: Exact active RPIV and exact awaited RPIV paths remain duplicate-launch safe.
- AC-3: Recovery and post-wait refusals remain stable and renderable.
- AC-6, AC-8, AC-9: Candidate facts cannot weaken exact merged cleanup or refusal behavior.
- AC-10: Architecture and decision IDs are unique, complete, and historically stable.

### Test Coverage
Run V-19 through V-21 and V-23. Add decision-log uniqueness/sequence checks and conflict-marker scans. Review the merged ADR/core text against records 163-171.

### Expected Evidence
Zero conflict markers; exactly one record for each ID 1-171; unchanged records 163-167; combined architecture clauses; and source/docs tests proving both contracts.

## Task T-17: Validate combined recovery, controls, cleanup, and concurrency

- **Status:** Pending
- **Complexity:** Extra Large
- **Dependencies:** T-16
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10
- **Related ADRs:** ADR-260811-prototype-three-recovery-concurrency; ADR-260812-rpiv-integration-completion-contract
- **Related Core-Components:** CORE-COMPONENT-260810-issue-worktree-locking; CORE-COMPONENT-260810-persistence-recovery; CORE-COMPONENT-260811-run-reconciliation-control; CORE-COMPONENT-260811-completion-evidence-reconciliation; CORE-COMPONENT-260811-concurrent-run-admission; CORE-COMPONENT-260811-owned-resource-cleanup

### Description
Keep PR #33 candidate tests and PR #35 `post-wait.ts`, unit tests, and orchestration race tests. Add a combined regression that advances progress/result/diagnostic state while Copilot wait is held, then proves an exact post-wait transition uses the current revision; separately prove restart reconciliation of an already-exited process exposes only candidate finalization and explicit resume launches no process. Cover event-before-snapshot failures, a second advance between reload/save, active precedence, malformed or absent tmux, remote/PR contradiction, normal completion, merged cleanup, bounded stop, shared command outputs, and distinct-issue capacity races.

### Acceptance Criteria
- AC-1 through AC-3: All boundaries and control commands produce deterministic shared reports.
- AC-4 and AC-5: Distinct explicit issues remain isolated under atomic capacity.
- AC-6 through AC-9: Cleanup and stop retain exact proof, bounds, evidence, and refusal behavior.
- AC-10: Repeated interruption and concurrency scenarios have no duplicate owner, launch, or collision.

### Test Coverage
Implement V-19 through V-22. Run focused candidate, post-wait, orchestration, reconciliation, documentation, package, and official-asset suites before the complete gate.

### Expected Evidence
Named Jest results; bounded adapter and launch counters; contiguous revision/event traces; signal order and retained logs; zero destructive calls on refusal; and disjoint concurrent resource inventories.

## Task T-18: Synchronize PATCH 0.1.3 and documentation/package state

- **Status:** Pending
- **Complexity:** Large
- **Dependencies:** T-16, T-17
- **Acceptance Criteria:** AC-3, AC-8, AC-9
- **Related ADRs:** ADR-260810-typescript-node-cli; ADR-260812-official-asset-distribution-installation
- **Related Core-Components:** CORE-COMPONENT-260811-owned-resource-cleanup; CORE-COMPONENT-260812-official-asset-installation-contract; CORE-COMPONENT-260815-package-semver-governance

### Description
Record a backward-compatible defect-integration PATCH from 0.1.2 to 0.1.3. Update `package.json`, only the top-level and root-package lock versions, `OFFICIAL_ASSET_VERSION`, current asset/package/install/generated-manifest fixtures, package filename expectations, README, docs index, recovery guide, and official-assets upgrade/reinstall/reconvergence guidance. Preserve third-party dependency ranges and lock metadata. Guidance must build and pack 0.1.3, upgrade from 0.1.2, confirm installed package and generated manifest at 0.1.3, and avoid claiming registry publication. Delete any stale `soft-factory-runner-0.1.2.tgz` from the repository and controlled pack workspace; create the 0.1.3 tarball only in a temporary destination and leave no tracked/root tarball.

### Acceptance Criteria
- AC-3: Current command and operator guidance agrees on 0.1.3 and combined outcomes.
- AC-8: Documentation retains candidate and malformed/absent-tmux cleanup prohibitions.
- AC-9: Blocked merge/ownership guidance remains actionable and non-destructive.

### Test Coverage
Run V-21 and V-23 documentation, release-inventory, package dry-run, temporary pack/install, manifest reconvergence, dependency-diff, package-inventory, and stale-artifact checks.

### Expected Evidence
Exact 0.1.3 surface inventory; only two root lock values changed; unchanged dependency graph; packed/installed/manifest metadata at 0.1.3; docs naming 0.1.2 as prior release; and no 0.1.2 tarball.

## Task T-19: Run final validation and produce Implement handoff

- **Status:** Pending
- **Complexity:** Medium
- **Dependencies:** T-15, T-16, T-17, T-18
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10
- **Related ADRs:** ADR-260811-prototype-three-recovery-concurrency
- **Related Core-Components:** CORE-COMPONENT-260806-project-command-interface; CORE-COMPONENT-260806-rpiv-stage-contract; CORE-COMPONENT-260810-development-standards; CORE-COMPONENT-260811-engineering-harness-interface; CORE-COMPONENT-260815-package-semver-governance

### Description
Run `just verify-focused` during correction and root `just verify` as final authority. Run the packaging checks in V-23, `git diff --check`, conflict-marker, status, commit-parent, and AC coverage checks. Drain Plan and Implement harness observations under the required read-back-before-clear process. Update implementation evidence with actual combined suite counts and commits; never retain stale 566/592-test claims as current evidence.

### Acceptance Criteria
Every AC has passing implementation, validation, and evidence, and the final branch contains a normal merge commit plus any conventional follow-up commits with a clean worktree.

### Test Coverage
Run V-24 and cross-check V-19 through V-23. Harness checks may supplement but never replace root `just verify`.

### Expected Evidence
Successful root gate with coverage at or above 80%; package proof; clean diff/status; merge-parent proof; final commit SHA; complete AC matrix; and durable friction record paths.

## Implement Handoff
1. Commit the updated research and Plan artifacts on `fix/5-reconcile-successful-terminal-result`.
2. Verify/fetch `origin/main` at `61ac7dd21ce02709ba714353c61dfb67a05e390d`.
3. Run `git merge --no-ff origin/main`; do not rebase or force-push.
4. Resolve exactly the five known conflicts as specified in T-16 and complete the normal merge commit.
5. Add combined regressions and PATCH 0.1.3 release synchronization in conventional follow-up commit(s).
6. Run V-19 through V-24, with root `just verify` authoritative.
7. Record merge SHA, final implementation SHA, clean-tree proof, AC evidence, docs/package/tarball proof, and Plan friction in `implementation/00-implementation.md` for Verify.
