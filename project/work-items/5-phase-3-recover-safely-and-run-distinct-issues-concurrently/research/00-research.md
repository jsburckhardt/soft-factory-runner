# Research Brief: Phase 3: Recover safely and run distinct issues concurrently

## GitHub Issue
- **Issue:** #5
- **Title:** Phase 3: Recover safely and run distinct issues concurrently
- **Work Item:** `project/work-items/5-phase-3-recover-safely-and-run-distinct-issues-concurrently`

## Scope Classification
- **Scope Type:** issue

## Problem Statement

Issue #5 requires deterministic, ownership-preserving recovery and isolated concurrent runs. PR #33 adds recovery for a strict successful terminal result left in `running_rpiv`, but it remains open and conflicting after PR #35 merged Issue #34 post-Copilot-wait state reload into `main`. The repository now needs both capabilities preserved on the current baseline, consistent architecture and documentation records, and a non-colliding patch release after `0.1.2`.

## Acceptance Criteria

<!-- ACCEPTANCE_CRITERIA_START -->

**Core**
- [x] Reconciliation compares persisted state with locks, filesystem, Git, tmux, processes, result artifacts, remote state, and GitHub.
- [x] Restart reconciliation preserves a matching active RPIV process rather than launching a duplicate.
- [x] Resume, stop, clean, list, status, attach, and logs expose deterministic outcomes.
- [x] Distinct active issues receive distinct locks, branches, worktrees, tmux windows, and run records.
- [x] Configured concurrency limits are enforced without introducing automatic issue selection.
- [x] After the expected pull request is merged, Runner verifies the merged head against the recorded issue branch and commit before automatically removing the clean owned worktree and releasing its issue lock.

**Edge Cases**
- [x] Stop requests graceful termination before bounded escalation and preserves worktree and terminal evidence.
- [x] Cleanup refuses active, dirty, unknown, mismatched, or ambiguously owned resources.
- [x] A closed-unmerged pull request or ambiguous merge or ownership evidence preserves the worktree and returns an actionable blocked result.

**Verification**
- [x] Repeatable interruption and concurrency fixtures reach deterministic outcomes with no duplicate owner or resource collision.

<!-- ACCEPTANCE_CRITERIA_END -->

## Repository Findings

- GitHub Issue #5 has one marker-delimited structured Markdown acceptance-criteria block containing the ten ordered checked criteria above. Exactly one `project/work-items/5-*` directory exists, so its established name is reused.
- The checked-out branch is `fix/5-reconcile-successful-terminal-result` at `98eea5c`, matching PR #33 head. GitHub reports PR #33 OPEN, `CONFLICTING`, and `DIRTY`. Its merge base is `84e4cac`; current `main` is `61ac7dd`, the merge commit for PR #35.
- PR #33 changes `src/reconciliation.ts` to stage process and strict-result observations before candidate-keyed Git, fresh-remote, and GitHub observations. `RESULT_RECOVERY_CANDIDATE` remains unaccepted; only exact inactive ownership and candidate proof expose `FINALIZATION_RECOVERY_AVAILABLE` with `retry_finalization`.
- PR #33 changes the `src/orchestrator.ts` resume path to persist `running_rpiv -> finalizing` and invoke existing strict finalization without a worker/RPIV launch or attempt increment. `src/domain.ts` adds result-authority and safe-action vocabulary, while `src/render.ts` distinguishes recovery-candidate query authority from persisted completion authority.
- PR #35 merged Issue #34 at `61ac7dd`. Current `src/orchestrator.ts` reloads durable state after `process.wait()` and delegates to `handlePostWait`; `src/post-wait.ts` requires exact run, owner, worker, and awaited RPIV identities, handles exact terminal state idempotently, and defines closed refusal reasons `missing`, `invalid`, `run_mismatch`, `owner_mismatch`, `worker_mismatch`, `rpiv_mismatch`, and `state_advanced`. `RunStore.save` remains the final revision compare-and-append boundary.
- The two application changes enter through distinct conditions but converge on durable state and `finalize`: post-wait handling requires the exact active awaited worker/RPIV identities, while candidate recovery requires RPIV absence and worker absence or no recorded worker. A synthetic `git merge-tree --write-tree main HEAD` auto-merges `src/orchestrator.ts` with both `handlePostWait` and candidate-resume logic present. `src/reconciliation.ts`, `src/post-wait.ts`, `src/domain.ts`, and `src/render.ts` have no textual merge conflict.
- PR #33 and PR #35 overlap on 15 paths: `README.md`, `docs/README.md`, `docs/phase-3-recovery-operations.md`, `docs/phase-5-official-assets.md`, `package.json`, `package-lock.json`, `project/architecture/ADR/ADR-260811-prototype-three-recovery-concurrency.md`, `project/architecture/ADR/DECISION-LOG.md`, `project/architecture/core-components/CORE-COMPONENT-260811-completion-evidence-reconciliation.md`, `project/architecture/core-components/CORE-COMPONENT-260811-run-reconciliation-control.md`, `src/asset-cli.test.ts`, `src/documentation.test.ts`, `src/official-assets.test.ts`, `src/official-assets.ts`, and `src/orchestrator.ts`.
- The synthetic merge has exactly five content conflicts: `docs/README.md`; `project/architecture/ADR/DECISION-LOG.md`; `project/architecture/core-components/CORE-COMPONENT-260811-completion-evidence-reconciliation.md`; `project/architecture/core-components/CORE-COMPONENT-260811-run-reconciliation-control.md`; and `src/documentation.test.ts`. The other ten overlapping paths auto-merge.
- The `docs/README.md` conflict is one current-release sentence: current `main` foregrounds the current release and tmux transport, while PR #33 adds candidate-recovery, unknown-before-mismatch, and cleanup-non-authorization wording. The two core-component conflicts place current post-wait reload/refusal/idempotence clauses against PR #33 candidate classification/resume clauses. The test conflict is the describe label for Issue #34 versus the stale Issue #31 label on PR #33.
- `project/architecture/ADR/DECISION-LOG.md` has a true identifier collision. Current `main` uses decisions 163-167 for post-wait reload, exact identity, typed refusal, terminal idempotence, and exact-revision finalization/failure. PR #33 independently uses 163-166 for candidate finalization recovery, bounded candidate observations, and cleanup non-authorization.
- `README.md`, `docs/phase-3-recovery-operations.md`, `docs/phase-5-official-assets.md`, and `ADR-260811-prototype-three-recovery-concurrency.md` auto-merge with both subject areas represented. This proves textual combination only, not combined behavior or documentation consistency.
- Current `main` and PR #33 both carry `0.1.2` in `package.json`, both root package-lock entries, `OFFICIAL_ASSET_VERSION`, package/install fixtures, and current documentation. Those identical edits auto-merge but are semantically stale: `main` already released `0.1.2`. Current guides describe the `0.1.1` to `0.1.2` local pack/install/reconvergence path.
- Current-main Issue #34 artifacts record 24 suites and 592 tests for PR #35. PR #33 records 23 suites and 566 tests for its older baseline and adds candidate cases in `src/recovery-control.test.ts` and `src/reconciliation.test.ts`. No combined checkout was validated during this Research stage.
- PR #33 metadata and verification text remain tied to the old base, release `0.1.2`, implementation commit `5122131`, and pre-merge suite counts even though its current head is `98eea5c`. Git history shows PR #33 and PR #35 diverged from `84e4cac`; no force-push or integration commit is present.

## Constraints

- `ADR-260811-prototype-three-recovery-concurrency`, `CORE-COMPONENT-260811-run-reconciliation-control`, and `CORE-COMPONENT-260810-persistence-recovery` require persisted/observed separation, compound process identity, contiguous revisions, one bounded observation per boundary, no hidden retry, active-process preservation, and fail-safe unknown or contradictory outcomes.
- Current `main` adds the applicable post-wait contract: terminal transition state must be strictly reloaded and exact-matched to run, owner, worker, and awaited RPIV identities; missing, invalid, mismatched, already-terminal, or concurrently advanced state retains its closed behavior.
- `ADR-260812-rpiv-integration-completion-contract` and `CORE-COMPONENT-260811-completion-evidence-reconciliation` keep Runner authoritative over strict result, local head, fresh remote, PR identity, ordered acceptance set, and snapshotted final validation. Progress, an unaccepted candidate, or external PR visibility alone cannot establish completion.
- `CORE-COMPONENT-260811-owned-resource-cleanup` and `CORE-COMPONENT-260810-issue-worktree-locking` prohibit cleanup from candidate, active, dirty, unknown, mismatched, or ambiguous facts. Automatic cleanup still requires accepted persisted completion and exact merged source-head and ownership proof.
- `CORE-COMPONENT-260811-concurrent-run-admission` preserves atomic slot leases, explicit issue selection, and distinct per-issue resources; recovery cannot weaken those boundaries.
- `CORE-COMPONENT-260815-package-semver-governance` and `AGENTS.md` classify backward-compatible defect corrections as PATCH and require all authoritative release surfaces to agree without third-party dependency churn. With current `main` at `0.1.2`, the user-mandated next patch is `0.1.3` across package, root lock entries, official-asset catalog, fixtures, packed/installed and generated-manifest metadata, and current user guidance.
- `project/architecture/ADR/DECISION-LOG.md` requires every ADR or core-component change to be recorded; current decision numbers 163-167 cannot be lost or duplicated by the colliding PR #33 records.
- The state-gold constraint requires preserving PR #33 recovery capability and PR #35 history/artifacts on current `main`, without force-push. The established Issue #5 work-item directory name must remain unchanged.

## Relevant ADRs and Core-Components

- `project/architecture/ADR/ADR-260811-prototype-three-recovery-concurrency.md` — recovery/concurrency policy, strict result candidates, one-pass observation, exact process identity, and non-authorizing unknowns.
- `project/architecture/ADR/ADR-260812-rpiv-integration-completion-contract.md` — immutable result handoff and Runner completion authority.
- `project/architecture/ADR/ADR-260814-tmux-identity-failure-recovery.md` — strict tmux identity transport and non-authorizing malformed output.
- `project/architecture/core-components/CORE-COMPONENT-260810-persistence-recovery.md` — atomic snapshots, contiguous event history, and persisted/observed separation.
- `project/architecture/core-components/CORE-COMPONENT-260810-issue-worktree-locking.md` — per-issue exclusivity and exact ownership.
- `project/architecture/core-components/CORE-COMPONENT-260811-run-reconciliation-control.md` — candidate classification, post-wait reload/refusal, shared reports, idempotence, and duplicate-launch prevention.
- `project/architecture/core-components/CORE-COMPONENT-260811-completion-evidence-reconciliation.md` — strict completion conjunction and exact reloaded revision.
- `project/architecture/core-components/CORE-COMPONENT-260811-owned-resource-cleanup.md` — candidate non-authorization and merged-source-head cleanup proof.
- `project/architecture/core-components/CORE-COMPONENT-260811-concurrent-run-admission.md` — atomic capacity and distinct issue resources.
- `project/architecture/core-components/CORE-COMPONENT-260815-package-semver-governance.md` — patch classification and synchronized release surfaces.
- `project/architecture/ADR/DECISION-LOG.md` — current `main` registers post-wait decisions 163-167, while PR #33 collides with older 163-166 records.

## Risks and Open Questions

- The synthetic merge proves textual compatibility for auto-merged source hunks, not behavioral compatibility. No combined build or runtime proof exists for candidate recovery alongside post-wait reload and concurrent evidence updates.
- Both paths reach `finalize` and `RunStore.save`; exact revision behavior across explicit recovery, post-wait handling, and concurrent progress/result/diagnostic writes remains an integration risk.
- The five content conflicts contain distinct required contracts and cannot safely be treated as choose-one-side conflicts. Decision-log IDs are globally ambiguous until reconciled.
- Identical `0.1.2` edits can merge cleanly while leaving package, fixture, packed/install, manifest, and documentation surfaces semantically stale relative to current `main`.
- PR #33 is open and its published verification metadata is stale relative to `61ac7dd`, `0.1.3`, and the combined repository state.
- Issue #5 criteria describe the broader Prototype 3 capability. PR disposition, release `0.1.3`, repacking, and state-gold history/document reconciliation are request context, not additional GitHub Issue #5 acceptance criteria.
