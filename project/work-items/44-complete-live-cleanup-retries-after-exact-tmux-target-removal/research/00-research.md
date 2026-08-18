# Research Brief: Complete live cleanup retries after exact tmux target removal

## GitHub Issue
- **Issue:** #44
- **Title:** Complete live cleanup retries after exact tmux target removal
- **Work Item:** project/work-items/44-complete-live-cleanup-retries-after-exact-tmux-target-removal

## Scope Classification
- **Scope Type:** issue

## Problem Statement

After 0.2.1-beta.2 cleanup, an exactly owned tmux window and worktree can be absent while same-owner/run cleanup progress marks those steps complete and leaves the lease and lock remaining. A post-removal tmux observation can become unknown instead of proved absence, removing cleanup eligibility and blocking release of the exact remaining resources despite durable cleanup checkpoints.

## Acceptance Criteria


**Core**
- [ ] When a persisted same-owner/run cleanup checkpoint proves the exact tmux target was removed, a post-removal response in the bounded `can't find pane`, `can't find window`, or `can't find session` missing-target categories is reported as complete absence only when the observed tmux server/socket identity remains unchanged.
- [ ] From the observed state where tmux and worktree are completed and lease and lock remain, retry releases the exact remaining lease and lock and reports `CLEANUP_COMPLETED`; subsequent cleanup reports idempotent completion without repeating a completed removal.
- [ ] The local branch, snapshot, events, and logs remain present through retry and idempotent completion, including retained terminal evidence captured before tmux removal.
- [ ] Human and JSON results agree on eligibility, outcome, completed and remaining resource categories, refusal, remediation, and exit meaning without exposing socket paths, tmux identifiers, working directories, process identifiers, raw external-command output, or unrelated-resource values.
- [ ] A finite, inspectable inventory of repository-produced package metadata, local packed and installed artifact evidence, official-asset metadata, fixtures, release guidance, and cleanup documentation consistently reports 0.2.1-beta.3 without publication or production access; all dependency declarations and resolved dependency metadata remain unchanged from main at issue start.

**Edge Cases**
- [ ] Target absence before a same-owner/run exact tmux removal checkpoint remains unproved and refuses cleanup without changing tmux, worktree, lease, lock, run state, or unrelated resources.
- [ ] Changed or unavailable server/socket identity, replacement or mismatched targets, malformed or truncated responses, and finite nonzero tmux response categories other than the three accepted missing-target categories refuse further cleanup mutation.
- [ ] A bounded failure or interruption while releasing the remaining lease or lock preserves truthful completed/remaining categories and a safe retry; retry reaches the same final state as uninterrupted cleanup, with each authorized resource removed at most once.
- [ ] Controlled cleanup/retry, cleanup/status, and cleanup/reconcile overlaps finish within 30 seconds; each read reports either the complete persisted tmux target match or that target’s complete absence, and after the overlap settles cleanup, status, and reconcile agree that the exact target is absent and cleanup is completed. Finite inventories of unrelated tmux resources, worktrees, leases, locks, runs, and replacements remain byte-identical.

**Verification**
- [ ] A repository-local full cleanup/retry fixture using the real live tmux adapter reproduces the exact post-removal missing-target response for an owned remain-on-exit dead window and proves remaining lease/lock release, retained evidence, idempotence, and isolated teardown without credentials, network access, or ambient tmux mutation. Inspectable matrix evidence separately proves zero mutation and redacted output for pre-checkpoint absence; changed or unavailable server/socket identity; replacement or mismatch; malformed or truncated responses; and every tested nonaccepted nonzero response category.
- [ ] Focused and full repository validation commands exit successfully with inspectable evidence mapped to the accepted diagnostic categories, pre-checkpoint refusal, remaining-step failures and retries, idempotence, overlaps, unrelated-resource invariants, confidentiality, 0.2.1-beta.3 finite version inventory, local package evidence, and dependency declarations and resolved metadata unchanged from main at issue start.


## Repository Findings

- Issue #44 has a marker-delimited Acceptance Criteria section with 11 ordered Markdown checkboxes under Core, Edge Cases, and Verification. The criteria above preserve the fetched checkbox text and order verbatim.
- The requested branch `fix/44-complete-live-cleanup-retries-after-tmux-removal` is clean at `b5028be`, equal to `main` and `origin/main` at research start. It contains no Issue #44 implementation diff.
- No existing `project/work-items/44-*` directory existed. The work-item path uses the exact GitHub title converted to lowercase ASCII kebab-case.
- The live Sparkta run state was not mounted under `/workspaces`, `/home`, or `/tmp`; no run 7 snapshot or event history was found. The issue-supplied facts are a persisted `completed` run; tmux and worktree completed; lease and lock remaining; lease not held; absent worktree and window; and a complete persisted custom socket/session/window/pane/cwd target. Those private values could not be independently read and are not reproduced here.
- Independently reachable `jsburckhardt/sparkta` facts show Issue #7 OPEN with six checked criteria and PR #15 OPEN at head `ffdfaeb1b6ca88b6053a0f2877d7fda8012b9237`. Persisted Runner state `completed` is distinct from current GitHub issue and PR state.
- `src/live.ts:LiveTmuxPort.observe` first checks the persisted socket filesystem identity, then runs one 15-second `tmux -S <socket> list-panes -t <pane> -F <exact-format>` command from `target.cwd`. If the command completes with any nonzero exit, the adapter returns `null`; it does not inspect stderr, distinguish missing pane/window/session from other nonzero outcomes, or recheck socket identity after the query.
- `src/live.ts:CommandExecutor.run` surfaces spawn and timeout failures as `EXTERNAL_COMMAND_FAILED`, but returns an ordinary `CommandResult` for a completed nonzero process. Because `LiveTmuxPort.observe` uses the persisted worktree cwd, an observation after that directory was removed can fail during spawn and surface `EXTERNAL_COMMAND_FAILED`. This is a source-supported inference; unavailable Sparkta state prevented confirming that exact live path.
- Before this brief, no application source, test, documentation, or architecture text contained the exact `can't find pane`, `can't find window`, or `can't find session` diagnostic strings. The existing adapter has no finite missing-target diagnostic vocabulary.
- `src/reconciliation.ts:collectTmuxObservation` maps adapter `null` to `absent:TMUX_ABSENT` and typed adapter failures to `unknown`. `buildCompletedReport` blocks on any non-GitHub unknown or mismatch before offering `explicit_clean`, which explains `CLEANUP_OWNERSHIP_UNPROVED` when the live observation is `EXTERNAL_COMMAND_FAILED`.
- `src/reconciliation.ts:canCleanup` accepts tmux absence only after same-owner/run completed tmux progress or an exact started checkpoint. `cleanupResourceIdentity` binds the tmux checkpoint to the JSON-serialized persisted `TmuxTargetV2`, including socket filesystem identity and complete selectors.
- `src/orchestrator.ts:IssueRunService.clean` reconciles before entering cleanup. `performCleanup` orders `tmux`, `worktree`, `lease`, and `lock`, skips completed steps, and persists started and completed checkpoints. With tmux/worktree proved complete, its remaining mutation path is lease then lock; after all four steps it records no remaining steps, while a subsequent explicit clean returns `CLEANUP_ALREADY_COMPLETED` before removal calls.
- `CleanupFactsV1` in `src/domain.ts` and `src/persistence.ts:isCleanupFacts` persist mode, owner/run identity, ordered completed and remaining steps, exact started checkpoints, blocked code, and timestamps. Event-before-snapshot persistence and contiguous event replay remain the recovery boundary.
- `IssueRunService.performCleanup` captures and redacts terminal content before the tmux started checkpoint and removal, merges the retained log reference, and persists `cleanup-terminal-log-retained`. Cleanup does not remove the local branch, snapshot, events, or logs. `src/render.ts` projects categorical cleanup and retained-evidence views without serializing target, process, log-path, or raw observation values.
- `src/recovery-control.test.ts` covers retries with `ControlTmux`, whose absent observation is always `null`; it does not classify original-byte tmux stderr. Its real-tmux fixture covers uninterrupted dead-window cleanup, retention, idempotence, and isolated resources, but does not begin from the supplied state where tmux/worktree are complete and lease/lock remain. The repository has no coverage of the three accepted missing-target response categories.
- Issue #42 history (`9c9c63e`, `feaec34`, `0bf6b4b`) introduced exact dead-pane observation, same-owner/run started checkpoints, categorical rendering, retained evidence, and retry coverage. Its verification reports 647 passing tests at 0.2.1-beta.2, but the live fixture did not exercise the post-worktree-removal partial state now reported by Issue #44.
- Current finite release surfaces report `0.2.1-beta.2`: package and root lock metadata, `OFFICIAL_ASSET_VERSION`, fixtures/assertions, README/docs, ADR, decision log, and semver governance. No `0.2.1-beta.3` release surface exists. Since the issue branch equals main at issue start, dependency declarations and resolved dependency metadata are currently unchanged from main.

## Constraints

- Cleanup authority remains bound to the same persisted owner/run, exact v6 target and socket filesystem identity, exact worktree/lease/lock identities, terminal inactivity, and required result evidence. Unproved absence, unknowns, mismatches, replacements, malformed data, and unavailable proof remain non-authorizing.
- The accepted absence boundary is narrower than current behavior: only the three issue-listed missing-target categories after an exact same-owner/run tmux checkpoint and unchanged server/socket identity qualify. Other finite nonzero results must remain refusals.
- Observation remains one-pass and bounded. Existing ADRs and core-components prohibit polling, hidden retries, partial records, mixed observations, ambient target inference, same-name adoption, or raw diagnostic retention.
- Cleanup order remains tmux, worktree, lease, lock. Worktree removal is non-forced; lease and lock release use exact compare-and-delete semantics; completed removals must not repeat.
- Terminal evidence is retained before tmux removal. Local branch, snapshot, append-only events, and retained logs remain after retry and idempotent completion; there is no purge or force-clean path.
- Human and JSON output derive from the same categorical public view and exclude socket paths, tmux selectors, cwd, process identities, raw external output, private persisted objects, and unrelated-resource values.
- Socket replacement or unavailability remains refusal. Current source performs only a pre-query identity check on the nonzero path, while Issue #44 requires unchanged identity across accepted absence.
- Runner remains a short-lived local Node.js CLI with bounded subprocesses and no daemon, network service, database, production access, registry publication, or ambient tmux mutation.
- Release surfaces must synchronize at exactly `0.2.1-beta.3` while third-party dependency declarations and resolved metadata remain identical to main at issue start.

## Relevant ADRs and Core-Components

- `ADR-260811-prototype-three-recovery-concurrency` — revisioned snapshots/events, one-pass reconciliation, explicit retry, ordered cleanup, and retained evidence.
- `ADR-260814-tmux-identity-failure-recovery` — bounded value-free diagnostics and the existing broad decision that nonzero target observation means absence.
- `ADR-260817-invoking-tmux-context-targeting` — complete v6 target authority, explicit socket routing, same-owner/run checkpoints, no adoption, and whole-target-or-absence reads.
- `CORE-COMPONENT-260811-owned-resource-cleanup` — exact cleanup conjunction, ordered steps, at-most-once checkpoints, replacement refusal, retention, and categorical output.
- `CORE-COMPONENT-260811-run-reconciliation-control` — shared one-pass report, unknown/mismatch refusal, event replay, dead-target classification, public view models, and logs.
- `CORE-COMPONENT-260810-persistence-recovery` — atomic versioned snapshots, append-only history, persisted/observed separation, and idempotent recovery.
- `CORE-COMPONENT-260814-tmux-identity-diagnostics` — closed byte parsing, bounded confidential diagnostics, and non-authorizing failure evidence.
- `CORE-COMPONENT-260817-exact-tmux-context-ownership` — immutable socket/session/window/pane equality, explicit `-S` commands, stable absence, confidentiality, and overlap constraints.
- `CORE-COMPONENT-260815-package-semver-governance` — finite synchronized prerelease surfaces, local package metadata, and no dependency churn or publication claim.
- `project/architecture/ADR/DECISION-LOG.md` registers the relevant records; decisions 64, 70, 74-76, 123-130, 163-198 govern recovery, tmux observation, cleanup checkpoints, confidentiality, retention, and current beta.2 release constraints.

## Risks and Open Questions

- The live Sparkta snapshot, events, lock, lease, worktree, retained logs, installed package, and exact tmux command result were unavailable, so the supplied partial state and `EXTERNAL_COMMAND_FAILED` outcome remain externally reported rather than independently reproduced.
- The issue reports a completed nonzero missing-target response as `EXTERNAL_COMMAND_FAILED`, while current `CommandExecutor` returns completed nonzero results and `LiveTmuxPort.observe` broadly maps them to absence. The observed difference may involve the removed cwd, timeout/spawn behavior, a different installed artifact, or another unavailable live condition.
- Current nonzero handling is broader than Issue #44 and has no post-query socket identity check; a nonaccepted tmux failure or concurrent server replacement can currently be indistinguishable from absence after a checkpoint.
- The repository does not define exact original-byte framing, locale/version bounds, stdout requirements, or truncation limits for the three accepted tmux stderr categories.
- Existing fake-adapter retry coverage cannot establish how the live adapter classifies original stderr, and the real fixture does not reproduce the supplied completed-tmux/worktree state.
- The persisted checkpoint contains confidential exact target values; the unavailable Sparkta state prevented independent inspection of persistence and rendered-output confidentiality for that specific run.
- `0.2.1-beta.3` is absent from current release surfaces, and semver governance documents beta.2 specifically but does not separately state the next prerelease increment semantics.
