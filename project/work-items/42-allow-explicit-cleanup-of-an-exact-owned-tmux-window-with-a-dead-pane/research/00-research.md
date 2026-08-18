# Research Brief: Allow explicit cleanup of an exact owned tmux window with a dead pane

## GitHub Issue
- **Issue:** #42
- **Title:** Allow explicit cleanup of an exact owned tmux window with a dead pane
- **Work Item:** project/work-items/42-allow-explicit-cleanup-of-an-exact-owned-tmux-window-with-a-dead-pane

## Scope Classification
- **Scope Type:** issue

## Problem Statement
A completed, inactive Runner run can retain an exactly identified tmux window because `remain-on-exit` leaves its pane dead. Tmux preserves the pane and transcript but reports an empty current working-directory field. The current exact-target parser rejects that record as unavailable proof, reconciliation reports tmux unknown, and explicit cleanup is refused even when independent ownership and inactivity facts agree. Dead-pane evidence must not independently become ownership authority or weaken retention, refusal, confidentiality, interruption, concurrency, or version contracts.

## Acceptance Criteria

**Core**
- [ ] For an inactive terminal run with an exact issue lock; an expected-path worktree registered at the expected branch and HEAD with no staged, unstaged, or untracked changes; the exact recorded lease when present; matching persisted result evidence for completed runs; no active worker or RPIV process; and one persisted socket/session/window/pane/working-directory identity that exactly matches a remain-on-exit window whose pane is dead, reconciliation reports explicit cleanup as available rather than treating the pane's historical process identity as active, mismatched, or unknown.
- [ ] Explicit cleanup of that state exits successfully, makes the final captured transcript available through retained logs, removes the exact owned dead window and clean owned worktree, releases the exact recorded lease when present, and releases the exact issue lock; each resource is observed present before its cleanup and absent afterward, while the local branch, snapshots, events, and retained logs remain present.
- [ ] Dead-pane state alone never authorizes mutation. A live pane or active recorded process, nonterminal run, dirty worktree, unproved absence, incomplete identity, malformed or unavailable observation, ownership mismatch, or same-name/replacement resource returns the existing documented refusal outcome and remediation with no tmux, worktree, lease, lock, or run-state mutation and no change to unrelated-resource inventories.
- [ ] Automatic merged cleanup continues to retain tmux evidence. For explicit cleanup, human and JSON results agree on eligibility, outcome code, completed and remaining tmux/worktree/lease/lock categories, refusal reason, remediation, and exit meaning; output excludes socket paths, session/window/pane identifiers, working directories, process identifiers, and unrelated-resource values.
- [ ] Package manifest, root lock metadata, official-asset metadata, package and installation fixtures, packed metadata, locally installed metadata, and version-bearing current release and user guidance identified by a finite repository search all report 0.2.1-beta.2; comparison with the target-branch merge base shows no third-party dependency change, and local package evidence requires no registry fetch or publication.

**Edge Cases**
- [ ] A finite matrix has these outcomes: an exact dead pane with all Core ownership facts permits explicit cleanup; a live pane or active process refuses; an already-absent window with same-owner/run completed tmux-cleanup evidence treats only the tmux removal as complete and continues eligible remaining cleanup; that same state after all owned cleanup is idempotently successful; an absent window without completed tmux-cleanup evidence refuses; malformed, unavailable, incomplete, or mismatched identity proof refuses; and an unrelated same-name window refuses. Every refusal has the no-mutation outcome defined in Core.
- [ ] An interruption after each authorized resource removal followed by retry reaches the same final resource states as uninterrupted cleanup, with each resource removed at most once; an unrelated replacement introduced before retry refuses without mutation. In one controlled clean/status overlap and one clean/reconcile overlap, each command finishes within 30 seconds, cleanup removes each authorized owned resource exactly once, and the read command reports either one complete matching socket/session/window/pane/working-directory observation or complete absence for that target, never fields mixed across those states.
- [ ] Finite before/after evidence proves the exact owned dead window, clean owned worktree, recorded lease when present, and exact issue lock transition from present to absent. Only the inventories of unrelated sessions/windows/panes, unrelated worktrees, unrelated locks/leases/runs, and retained evidence are required to remain byte-identical before and after; the complete tmux or resource inventory is not required to remain unchanged.

**Verification**
- [ ] A repository-local isolated tmux scenario creates an exactly owned remain-on-exit window, lets its pane process exit, preserves inspectable terminal output, completes explicit cleanup, and then returns that output from retained logs. Two runs with controlled clocks and identities produce equal outcome codes, tmux/worktree/lease/lock transitions, retained-evidence inventories, and unrelated-resource inventories without credentials, network access, ambient/default tmux mutation, or external project state.
- [ ] Direct root just verify-focused and just verify both exit successfully, with inspectable criterion-to-evidence results covering the finite matrix, each interruption point, both overlaps, exact owned-resource present-to-absent transitions, unrelated and retained-evidence inventory byte equality, the enumerated version inventory, and the merge-base dependency diff.

## Repository Findings

- GitHub Issue #42 contains one marker-delimited `Acceptance Criteria` section with 10 ordered Markdown checkboxes grouped as Core, Edge Cases, and Verification. The criteria above preserve fetched checkbox text and order verbatim. No prior `project/work-items/42-*` directory existed, so the exact title-derived lowercase ASCII path was resolved.
- The requested branch is at `17da370`, equal to `origin/main`; merge base is `17da3705afd6511fa9b6434cfcb48ca7f5edc156`, with no current dependency diff.
- `src/live.ts:LiveTmuxPort.setRemainOnExit` enables `remain-on-exit`. `capturePane` redacts and captures the persisted pane before cleanup, and `removeWindow` addresses the immutable window through the persisted explicit socket.
- `LiveTmuxPort.observe` queries `src/tmux-target.ts:TMUX_INVOKING_CONTEXT_FORMAT`: socket, session ID/name, window ID/name, pane ID, and `pane_current_path`, but no `pane_dead`. `parseInvokingContextRecord` rejects empty cwd with `TMUX_CONTEXT_REFUSED` reason `unavailable-proof`.
- A transient isolated host probe created a remain-on-exit pane and let its shell exit. Tmux reported `pane_dead=1`, exact IDs, empty `pane_current_path`, retained start command, dead status 0, and capturable output. Empty current cwd is normal dead-pane presentation on the installed tmux, not proof that the persisted target is absent.
- `src/reconciliation.ts:collectTmuxObservation` catches the parser refusal as `unknown:TMUX_CONTEXT_REFUSED`. `canExplicitCleanup` accepts tmux only as a complete match or absent after same-owner/run recorded tmux completion. `buildCompletedReport` consequently returns `CLEANUP_OWNERSHIP_UNPROVED`; independent process absence cannot override unknown tmux proof.
- Worker/RPIV observations are separate. Cleanup requires worker absent/not-applicable and RPIV absent. Process matching remains compound across PID, process group, start token, executable, exact arguments, cwd, launch time, and pane lineage (`src/reconciliation.ts`, `src/domain.ts:ProcessIdentityV1`).
- `src/orchestrator.ts:clean` rejects active runs, staged/unstaged/untracked dirtiness, legacy snapshots, and reports lacking `explicit_clean`. `performCleanup` orders transcript capture/tmux removal, non-forced worktree removal, lease release, and lock release; it re-reconciles, observes absence, persists owner/run-bound progress, and retains branch, snapshot, events, and logs.
- Automatic merged cleanup omits tmux and requires exact merged source-head facts. `docs/phase-3-recovery-operations.md` and `CORE-COMPONENT-260811-owned-resource-cleanup` retain tmux, branch, snapshots, events, and logs automatically.
- Existing retries accept absence only after same-owner/run progress marks the step complete. `src/recovery-control.test.ts` covers event-ahead snapshot failures after completed steps, at-most-once removal, replacement refusal, idempotence, and fake clean/status and clean/reconcile overlaps. `src/tmux-context.test.ts` covers live isolated sockets, same names on separate servers, exact removal, unrelated inventory preservation, and whole-target-or-absence overlap.
- A narrower interruption window remains: `performCleanup` verifies resource absence before persisting the corresponding completed transition. Interruption after removal/verification but before event append leaves only started progress; retry treats absence as unproved and refuses. Existing failure fixtures inject during the completed transition, whose appended event can be replayed.
- `src/tmux-identity.ts` is a separate strict original-byte parser for LF-terminated create/observe records with bounded value-free diagnostics. It does not parse the seven-field invoking/dead-pane record. `src/tmux-identity.test.ts` covers its closed grammar.
- Current rendering does not meet Issue #42 confidentiality: `src/render.ts:renderReport` serializes observation facts into human output; JSON serializes the full report/persisted snapshot; `renderRun` prints worktree/session/window; and `renderAttach` prints pane identity. Exact persisted socket/cwd/process and tmux values are structurally reachable.
- Docs and code differ on explicit eligibility: the recovery guide says cleanup authority comes only from accepted persisted completion, while `canExplicitCleanup` and `src/recovery-control.test.ts` permit exact inactive terminal `interrupted` cleanup when result is absent/not-applicable. Issue #42 says inactive terminal and requires result evidence only for completed runs.
- Live Sparkta GitHub facts were independently observed: Issue #7 is OPEN with six checked criteria; PR #15 is OPEN, closes #7, uses `feat/7-run-repeated-prototype-0-generation-trials`, and reports head `ffdfaeb1b6ca88b6053a0f2877d7fda8012b9237`; `git ls-remote --refs` reports the same head. The request reports completed persisted v6 invoking identity (session `$0`, window `@2`, pane `%7`, exact cwd), matching result/remote/PR, absent worker/RPIV, and a dead remain-on-exit pane with empty current command/cwd, plus `TMUX_CONTEXT_REFUSED` and `CLEANUP_OWNERSHIP_UNPROVED`. Sparkta state was not mounted and no responsive local custom server correlated to those IDs, so persisted/status details remain supplied live facts rather than independently read artifacts.
- Current version surfaces report `0.2.1-beta.1`: `package.json`, both root `package-lock.json` entries, `src/official-assets.ts:OFFICIAL_ASSET_VERSION`, package/install assertions in `src/asset-cli.test.ts` and `src/official-assets.test.ts`, and current guidance in `README.md`, `docs/README.md`, `docs/phase-4-repository-doctor.md`, and `docs/phase-5-official-assets.md`. Tests inspect packed and local installed metadata without claiming publication.
- Relevant history: `262e2b6`, `89ad0f6`, `0abe9f1`, `d7a0685` (recovery/cleanup); `5122131`, `dbc1734`, `1f59974` (candidate/post-wait recovery); `a99941f`, `1c4dc1d`, `79973cf` (v6 exact tmux context).

## Constraints

- Dead-pane status is corroborating lifecycle evidence only. Existing architecture prohibits pane state, names, cwd, commands, PID, process lineage, result candidates, malformed evidence, or absence alone from authorizing mutation.
- Cleanup remains gated by shared reconciliation and exact independent lock, lease when present, worktree path/registration/branch/HEAD/cleanliness, required result, process inactivity, persisted v6 target, and same-owner/run progress. Unknown/contradictory facts fail closed; there is no force or same-name adoption.
- `TmuxTargetV2` authority remains canonical socket path plus device/inode, session ID/name, immutable window ID/name, pane ID, and cwd. Lifecycle actions use the persisted explicit socket and immutable IDs.
- Observation remains bounded and one-pass: no polling, hidden retry, partial records, mixed observations, or unavailable-to-absent inference.
- Raw invoking tuples, socket values, server PID, malformed sentinels, cwd, process IDs, and unrelated values remain ephemeral and unrendered.
- Cleanup ordering, non-forced worktree removal, compare-delete lease/lock release, before/after observation, owner/run progress, local branch retention, and snapshot/event/log retention remain mandatory. Automatic cleanup continues to omit tmux removal.
- Concurrency remains explicit per issue with atomic issue lock and optional exact lease. Unknown leases occupy capacity; overlaps cannot mix target fields or mutate unrelated resources; replacements cannot compare equal.
- Snapshots v1-v6 remain readable; legacy missing-selector records remain non-authorizing. New state is `RunSnapshotV6`, events v2, reconciliation schema v3, and status schema v5.
- Requested release is exactly `0.2.1-beta.2`. Package, root lock, asset/generated manifest, fixtures, packed/installed metadata, and current guidance are synchronized surfaces; third-party dependencies and package inventory are not Runner-version replacements.
- Runner remains a short-lived local CLI with no daemon, network API, database, service, container, or deployment change. Local package proof does not imply registry publication.

## Relevant ADRs and Core-Components

- `ADR-260811-prototype-three-recovery-concurrency` — one-pass reconciliation, exact process identity, interruption, cleanup ordering, retained evidence, and concurrency.
- `ADR-260814-tmux-identity-failure-recovery` — strict identity grammar, malformed/absence classification, diagnostics, and non-authorizing evidence.
- `ADR-260817-invoking-tmux-context-targeting` — v6 complete target authority, explicit routing, equality, legacy limits, confidentiality, and overlap behavior.
- `CORE-COMPONENT-260811-owned-resource-cleanup` — cleanup conjunction, order/progress, replacement refusal, retention, and automatic/explicit separation.
- `CORE-COMPONENT-260811-run-reconciliation-control` — snapshot/event recovery, process/result observations, shared report, one-pass control, and logs.
- `CORE-COMPONENT-260810-persistence-recovery` — atomic snapshots, append-only events, persisted/observed separation, and interruption safety.
- `CORE-COMPONENT-260814-tmux-identity-diagnostics` — closed parser and bounded value-free diagnostics.
- `CORE-COMPONENT-260817-exact-tmux-context-ownership` — complete target match, explicit socket lifecycle, no adoption, proved absence, confidentiality, and whole-target concurrency.
- `CORE-COMPONENT-260815-package-semver-governance` — synchronized release surfaces, PATCH policy, local package evidence, and no dependency churn.
- `project/architecture/ADR/DECISION-LOG.md` registers these records; decisions 64-76, 123-157, and 163-184 govern the relevant boundaries.

## Risks and Open Questions

- Empty current cwd is a valid dead-pane presentation, but the parser treats it as unavailable and does not collect `pane_dead`; no current application model represents a dead target observation.
- The request reports empty terminal command and cwd, while the runtime target format observes cwd but not command. The source/schema of the reported command field is unavailable locally.
- Sparkta snapshot/events/progress/logs/lock/lease/worktree/process facts were unavailable. GitHub/remote facts match, but complete cleanup conjunction and status could not be independently reproduced against that run.
- Interruption proof does not cover a stop between successful absence verification and append of completed-step progress; current behavior appears retry-blocking there.
- Overlap coverage uses 1-second fake and 2-second live bounds; Issue #42 uses 30 seconds and binds exactly-once cleanup plus retained/unrelated inventories.
- Existing output exposes exact values; confidentiality interacts with human/JSON parity, diagnostics, attach/run rendering, and remediation.
- Completion-only cleanup documentation conflicts with code/test behavior for other terminal states; Issue #42 does not settle authority for all non-completed terminal outcomes.
- Current release is prerelease `0.2.1-beta.1`; semver governance mainly gives stable-version examples. Issue #42 mandates `0.2.1-beta.2`, but prerelease increment semantics are not separately documented.
- No application test currently models an exact persisted dead pane with empty current cwd; existing live tests cover live equality/removal/overlap, while strict identity tests reject empty cwd.
