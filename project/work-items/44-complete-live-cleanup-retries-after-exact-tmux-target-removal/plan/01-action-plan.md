# Action Plan: Complete live cleanup retries after exact tmux target removal

## Feature
- **ID:** 44
- **Research Brief:** project/work-items/44-complete-live-cleanup-retries-after-exact-tmux-target-removal/research/00-research.md

## ADRs Created
- None. Amended `ADR-260814-tmux-identity-failure-recovery` and `ADR-260817-invoking-tmux-context-targeting` to replace broad nonzero-as-absence behavior with exact checkpoint-gated classification, unchanged socket identity, and a stable retry cwd.

## Core-Components Created
- None. Amended `CORE-COMPONENT-260814-tmux-identity-diagnostics`, `CORE-COMPONENT-260817-exact-tmux-context-ownership`, `CORE-COMPONENT-260811-owned-resource-cleanup`, `CORE-COMPONENT-260811-run-reconciliation-control`, and `CORE-COMPONENT-260815-package-semver-governance`.
- Updated `project/architecture/ADR/DECISION-LOG.md` decisions 126 and 199-208.

## Acceptance Criteria

### AC-1
When a persisted same-owner/run cleanup checkpoint proves the exact tmux target was removed, a post-removal response in the bounded `can't find pane`, `can't find window`, or `can't find session` missing-target categories is reported as complete absence only when the observed tmux server/socket identity remains unchanged.

### AC-2
From the observed state where tmux and worktree are completed and lease and lock remain, retry releases the exact remaining lease and lock and reports `CLEANUP_COMPLETED`; subsequent cleanup reports idempotent completion without repeating a completed removal.

### AC-3
The local branch, snapshot, events, and logs remain present through retry and idempotent completion, including retained terminal evidence captured before tmux removal.

### AC-4
Human and JSON results agree on eligibility, outcome, completed and remaining resource categories, refusal, remediation, and exit meaning without exposing socket paths, tmux identifiers, working directories, process identifiers, raw external-command output, or unrelated-resource values.

### AC-5
A finite, inspectable inventory of repository-produced package metadata, local packed and installed artifact evidence, official-asset metadata, fixtures, release guidance, and cleanup documentation consistently reports 0.2.1-beta.3 without publication or production access; all dependency declarations and resolved dependency metadata remain unchanged from main at issue start.

### AC-6
Target absence before a same-owner/run exact tmux removal checkpoint remains unproved and refuses cleanup without changing tmux, worktree, lease, lock, run state, or unrelated resources.

### AC-7
Changed or unavailable server/socket identity, replacement or mismatched targets, malformed or truncated responses, and finite nonzero tmux response categories other than the three accepted missing-target categories refuse further cleanup mutation.

### AC-8
A bounded failure or interruption while releasing the remaining lease or lock preserves truthful completed/remaining categories and a safe retry; retry reaches the same final state as uninterrupted cleanup, with each authorized resource removed at most once.

### AC-9
Controlled cleanup/retry, cleanup/status, and cleanup/reconcile overlaps finish within 30 seconds; each read reports either the complete persisted tmux target match or that target’s complete absence, and after the overlap settles cleanup, status, and reconcile agree that the exact target is absent and cleanup is completed. Finite inventories of unrelated tmux resources, worktrees, leases, locks, runs, and replacements remain byte-identical.

### AC-10
A repository-local full cleanup/retry fixture using the real live tmux adapter reproduces the exact post-removal missing-target response for an owned remain-on-exit dead window and proves remaining lease/lock release, retained evidence, idempotence, and isolated teardown without credentials, network access, or ambient tmux mutation. Inspectable matrix evidence separately proves zero mutation and redacted output for pre-checkpoint absence; changed or unavailable server/socket identity; replacement or mismatch; malformed or truncated responses; and every tested nonaccepted nonzero response category.

### AC-11
Focused and full repository validation commands exit successfully with inspectable evidence mapped to the accepted diagnostic categories, pre-checkpoint refusal, remaining-step failures and retries, idempotence, overlaps, unrelated-resource invariants, confidentiality, 0.2.1-beta.3 finite version inventory, local package evidence, and dependency declarations and resolved metadata unchanged from main at issue start.

## Acceptance Coverage

| AC | Implementation tasks | Tests / validation | Expected evidence |
|---|---|---|---|
| AC-1 | T-1, T-2 | V-1, V-2, V-7 | Three accepted original-byte categories, matching selectors, exact checkpoint, and unchanged before/after socket identity produce `TMUX_ABSENT`. |
| AC-2 | T-2, T-4 | V-3, V-7 | Partial-state retry trace releases lease then lock only, returns `CLEANUP_COMPLETED`, then `CLEANUP_ALREADY_COMPLETED`. |
| AC-3 | T-2, T-4 | V-3, V-7 | Before/after branch, snapshot, event, log, and retained-terminal marker inventory remains present and byte-stable. |
| AC-4 | T-3, T-4 | V-4 | Parsed JSON and human projections agree; forbidden-value sentinel scan is empty. |
| AC-5 | T-5, T-6 | V-8, V-9 | Finite beta.3 inventory, dry-run/packed/installed metadata, official manifest, docs, and main-relative dependency comparison. |
| AC-6 | T-1, T-2, T-4 | V-2 | Pre-checkpoint missing-target rows return refusal with zero mutation and byte-identical owned/unrelated inventories. |
| AC-7 | T-1, T-2, T-4 | V-1, V-2 | Changed/unavailable socket, replacement, mismatch, malformed/truncated, spawn/timeout, and nonaccepted nonzero matrix all refuse. |
| AC-8 | T-2, T-4 | V-5 | Lease/lock failure and event/snapshot interruption rows preserve categories, retry safely, and show one compare-delete per resource. |
| AC-9 | T-2, T-4 | V-6 | Three barrier-controlled overlaps complete under 30 seconds with whole-target-or-absence reads and unchanged unrelated inventories. |
| AC-10 | T-1, T-2, T-4 | V-2, V-7 | Real isolated tmux fixture reproduces post-removal stderr, retries remaining resources, retains evidence, repeats idempotently, and tears down exactly. |
| AC-11 | T-4, T-5, T-6 | V-1 through V-9 | Focused and full gate logs plus an AC-indexed evidence manifest cover all requested categories. |

Coverage proof: every AC-1 through AC-11 has at least one implementation task, one test or validation entry, and one concrete expected-evidence artifact.

## Implementation Tasks

1. **T-1 — Add bounded live tmux missing-target classification (AC-1, AC-6, AC-7, AC-10).** Return a typed, value-free category from original bytes; bind category identifiers to persisted selectors; verify socket identity before/after; run retry observation from the repository root rather than a removed worktree.
2. **T-2 — Gate absence and resume remaining cleanup (AC-1, AC-2, AC-3, AC-6, AC-7, AC-8, AC-9, AC-10).** Resolve absence only with same-owner/run exact checkpoint proof, preserve complete/remaining truth, and continue lease then lock without replaying tmux/worktree removals.
3. **T-3 — Keep public cleanup projections equivalent and confidential (AC-4, AC-6, AC-7, AC-8).** Derive human/JSON eligibility, outcome, categories, refusal, remediation, and exit meaning from one categorical view.
4. **T-4 — Build deterministic unit, matrix, overlap, and real-adapter fixtures (AC-1, AC-2, AC-3, AC-4, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11).** Cover exact categories, refusals, replacement/error paths, partial retries, idempotence, retention, isolation, and confidentiality.
5. **T-5 — Synchronize prerelease 0.2.1-beta.3 and operator documentation (AC-5, AC-11).** Update finite package/asset/fixture/docs surfaces, cleanup guidance, and a visible but deferred non-gating Sparkta recovery handoff.
6. **T-6 — Run package and repository gates and assemble evidence (AC-5, AC-11).** Prove dependencies unchanged from main, inspect local pack/install outputs, run focused/full validation, and map outputs to every AC.
