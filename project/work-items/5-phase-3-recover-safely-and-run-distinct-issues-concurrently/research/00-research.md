# Research Brief: Phase 3: Recover safely and run distinct issues concurrently

## GitHub Issue
- **Issue:** #5
- **Title:** Phase 3: Recover safely and run distinct issues concurrently
- **Work Item:** `project/work-items/5-phase-3-recover-safely-and-run-distinct-issues-concurrently`

## Scope Classification
- **Scope Type:** issue

## Problem Statement

After evidence-based completion works, make runs recoverable after interruption while preserving ownership, uncommitted work, and isolation across concurrent issues.

A newly reported interruption leaves persisted state at `running_rpiv` although worker and RPIV processes are absent, mutable progress is terminal `succeeded`, and an immutable successful result names PR #12. Lock, lease, worktree, and Git ownership agree, but status is blocked as `RECONCILIATION_UNKNOWN`: tmux is `TMUX_IDENTITY_MALFORMED`, progress is `PROGRESS_REPEATED`, and result is `RESULT_UNEXPECTED`. The remote branch exists at a different head, while GitHub is `PULL_REQUEST_NOT_RECORDED` because no PR/result was accepted into persisted state, despite the user seeing the PR.

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

- GitHub Issue #5 contains one marker-delimited structured acceptance-criteria block with ten ordered checked Markdown criteria. Exactly one existing `project/work-items/5-*` directory resolves to the path above; its name is preserved.
- `src/reconciliation.ts` `collectReconciliation` computes `resultExpected` only from persisted `finalizing`, persisted `completed`, or an already persisted `finalization.result`. A strict result found while persisted state is `running_rpiv` is therefore `RESULT_UNEXPECTED`; its successful outcome and PR #12 are not adopted.
- The same function derives `pullRequestNumber` only from `persisted.finalization.result.prNumber`. Without an accepted persisted result, GitHub is `not_applicable`/`PULL_REQUEST_NOT_RECORDED`; neither the visible PR nor the artifact's `prNumber` supplies query authority.
- `completionHead` also reads only `persisted.finalization.result.headSha`. When absent, a present remote branch is `REMOTE_BRANCH_MATCH` regardless of SHA, and a registered worktree on the expected branch can be `GIT_WORKTREE_MATCH` regardless of HEAD. Outside `starting_tmux`, worktree cleanliness is not part of that Git match. The reported different remote head therefore does not become contradictory proof in this state.
- `src/integration.ts` `classifyProgress` returns `PROGRESS_REPEATED` when current parsed progress has the same sequence and structured content as `snapshot.progress`; `progressObservation` keeps its terminal phase. `collectReconciliation` renders this as a mismatch, but `buildReconciliationReport` excludes progress from authorizing unknown/mismatch entries. It cannot change activity, decisions, safe actions, completion, recovery, or cleanup.
- `buildReconciliationReport` checks authorizing unknowns before mismatches and before the `running_rpiv` inactive-process branch. `collectTmuxObservation` maps malformed zero-exit tmux output to unknown. Thus `TMUX_IDENTITY_MALFORMED` selects `RECONCILIATION_UNKNOWN`; `RESULT_UNEXPECTED` remains an additional diagnostic.
- If tmux later matches, `RESULT_UNEXPECTED` still selects `RECONCILIATION_MISMATCH` before interrupted-run handling. Without that mismatch, absent RPIV reaches `RUN_INTERRUPTED` only when lock, lease, filesystem, Git, tmux, and worker facts satisfy `exactActiveOwnership`. A null worker identity is `not_applicable`; a recorded but absent worker does not satisfy the conjunction.
- `src/orchestrator.ts` `resume` accepts only `FINALIZATION_RETRY_AVAILABLE`, `RUN_INTERRUPTED`, or exact partial-preparation decisions. It refuses this blocked report and does not infer finalization from terminal progress, a successful artifact, or an externally visible PR.
- Commit `d7a0685` introduced the result expectation, persisted-PR lookup, remote-head fallback, unknown-before-mismatch ordering, and conservative recovery behavior. Later integration commits made progress non-authorizing; inspected history shows no later change to `RESULT_UNEXPECTED` or `PULL_REQUEST_NOT_RECORDED` behavior.
- Current `main`/`origin/main` is `84e4cac`, package version `0.1.1`. That commit changed normal and Doctor tmux create/observe formats from HT to shared printable vertical-bar framing in `src/tmux-identity.ts`, `src/live.ts`, and `src/doctor-tmux.ts`. It addresses the known non-UTF8 tmux client sanitization that changed an HT-delimited create record into a six-byte zero-exit record with no HT.
- Current observation accepts only `@<digits>|%<digits>|<nonempty-valid-UTF8-cwd><LF>`, followed by exact ID/cwd equality in `LiveTmuxPort.observe`. Legacy HT, sanitized underscore, missing/extra LF, CRLF, malformed IDs, invalid cwd, and alternate framing remain `TMUX_IDENTITY_MALFORMED`. Valid later observation clears the diagnostic; malformed evidence remains unknown and non-authorizing.
- Therefore `84e4cac` addresses the locale-dependent transport cause only if the executing Runner uses 0.1.1 and tmux returns the new exact grammar. It does not reinterpret actually malformed output, infer ownership, adopt result/PR, change `running_rpiv`, or alter report precedence. The incident's bounded diagnostic and executing package version are unavailable, so its exact tmux cause is unconfirmed.
- Existing tests encode the separate behavior: `src/reconciliation.test.ts` excludes progress from authorization and blocks each authorizing unknown/mismatch; `src/orchestration.test.ts` renders terminal `PROGRESS_REPEATED`; `src/recovery-control.test.ts` persists one-pass malformed tmux diagnostics; `src/tmux-identity.test.ts` covers portable client states and rejects HT/sanitized forms. No inspected fixture combines all reported facts in one scenario.

## Constraints

- `ADR-260811-prototype-three-recovery-concurrency` and `CORE-COMPONENT-260811-run-reconciliation-control` require one bounded observation per boundary, no hidden retry, and no launch or mutation from unknown/contradictory facts.
- `CORE-COMPONENT-260810-persistence-recovery` keeps persisted and observed facts separate and fails safe. `CORE-COMPONENT-260810-issue-worktree-locking` prohibits reuse or cleanup until recorded and observed ownership agree.
- `ADR-260812-rpiv-integration-completion-contract`, `CORE-COMPONENT-260812-rpiv-integration-handoff`, and `CORE-COMPONENT-260811-completion-evidence-reconciliation` make progress non-authorizing and keep Runner's post-exit local Git, fresh remote, and GitHub reconciliation authoritative. A result claim alone is not completion.
- `CORE-COMPONENT-260811-owned-resource-cleanup` binds cleanup to the expected persisted PR number, source branch, verified source SHA, merge facts, inactive ownership, and cleanliness. A visible but unrecorded PR cannot authorize cleanup.
- `ADR-260814-tmux-identity-failure-recovery` and `CORE-COMPONENT-260814-tmux-identity-diagnostics` require strict original-byte vertical-bar framing, exact identity/cwd equality, one pass, bounded value-free diagnostics, and no inference from malformed evidence.
- A tmux transport correction removes only that unknown boundary. The unexpected result remains an authorizing contradiction, and process recovery remains subject to exact worker/RPIV ownership facts.
- `project/architecture/ADR/DECISION-LOG.md` decisions 29, 31, 56-59, 64-76, 102, 110-115, 123-134, and 144-151 register the applicable constraints.

## Relevant ADRs and Core-Components

- `project/architecture/ADR/ADR-260811-prototype-three-recovery-concurrency.md` — one-pass reconciliation, process preservation, deterministic control, and exact cleanup ownership.
- `project/architecture/ADR/ADR-260812-rpiv-integration-completion-contract.md` — immutable result handoff and Runner-authoritative post-exit completion.
- `project/architecture/ADR/ADR-260814-tmux-identity-failure-recovery.md` — portable strict tmux transport and non-authorizing malformed evidence.
- `project/architecture/core-components/CORE-COMPONENT-260810-persistence-recovery.md` — persisted/observed separation and fail-safe recovery.
- `project/architecture/core-components/CORE-COMPONENT-260810-issue-worktree-locking.md` — exact ownership before reuse or cleanup.
- `project/architecture/core-components/CORE-COMPONENT-260811-run-reconciliation-control.md` — report precedence, process identity, resume boundaries, and one-pass diagnostics.
- `project/architecture/core-components/CORE-COMPONENT-260811-completion-evidence-reconciliation.md` — strict result, Git, PR, acceptance, and validation conjunction.
- `project/architecture/core-components/CORE-COMPONENT-260811-owned-resource-cleanup.md` — persisted expected-PR and verified-source-head cleanup authority.
- `project/architecture/core-components/CORE-COMPONENT-260812-rpiv-integration-handoff.md` — repeated progress semantics and result ownership boundary.
- `project/architecture/core-components/CORE-COMPONENT-260814-tmux-identity-diagnostics.md` — current grammar, diagnostic lifecycle, and prohibited inference.

## Risks and Open Questions

- The incident's `TmuxIdentityDiagnosticV1`, exact Runner package/build path, and tmux client state are unavailable. It is unresolved whether this is the HT sanitization corrected by `84e4cac`, an older runtime, or another grammar violation.
- It is unclear whether persisted worker identity is null or recorded and absent. Current classification differs: null is `not_applicable`; recorded absence prevents `exactActiveOwnership` for `running_rpiv`.
- The interruption point is unrecorded. The facts are consistent with external work reaching terminal publication before Runner persisted `finalizing` or accepted the result, but repository evidence does not establish the failed boundary.
- Current reconciliation has no classification that treats a strict successful artifact as finalization input while state remains `running_rpiv`; it is always `RESULT_UNEXPECTED`. The run remains blocked after a tmux-only issue is removed.
- Without a persisted completion head, remote and worktree matching do not compare their heads to the artifact head; the divergent remote head is deferred rather than treated as completion contradiction.
- GitHub cannot corroborate the visible PR because its query key is exclusively the persisted result's PR number. The artifact's PR number is parsed but not used after `RESULT_UNEXPECTED`.
- Issue #5 criteria are checked, but this concrete interruption combination is not represented by one inspected fixture and exposes behavior not resolved by the existing Phase 3 closeout.
