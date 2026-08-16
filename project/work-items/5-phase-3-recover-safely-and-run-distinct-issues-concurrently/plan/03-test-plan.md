# Test Plan: Integrate PR #33 with Post-Wait Safety and Release 0.1.3

## Test V-19: Candidate observation and refusal matrix on current main

- **Type:** Reconciliation domain/composition regression
- **Task:** T-16, T-17
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-8, AC-9, AC-10
- **Priority:** Critical

### Setup
Build v5 `running_rpiv` snapshots with exact lock/lease/worktree facts, strict successful result candidates, absent/active/unknown workers and RPIV processes, exact/absent/malformed/mismatched tmux, repeated terminal progress, and matching/divergent remote and PR facts.

### Steps
1. Reconcile each row twice and record reports, adapter calls, state bytes, events, launches, and destructive calls.
2. Exercise exact active RPIV as the precedence control.
3. Invoke resume for eligible and ineligible candidate rows.
4. Compare human and JSON result authority, decisions, actions, and remediation.

### Expected Result
Every boundary is explicit and observed at most once. Active RPIV remains `active_preserved`. Only exact inactive proof exposes `FINALIZATION_RECOVERY_AVAILABLE`; explicit resume keeps the attempt and launches no worker/RPIV. Unknown or contradiction blocks and preserves resources.

### Expected Evidence
Report snapshots, one-call counters, unchanged refusal bytes, zero unauthorized launches/removals, stable repeat traces, and equivalent human/JSON output.

## Test V-20: Combined post-wait reload and candidate recovery revision safety

- **Type:** Orchestration and persistence integration/fault injection
- **Task:** T-16, T-17
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-10
- **Priority:** Critical

### Setup
Use PR #35 held-wait fixtures with exact process identities and concurrent progress/result/diagnostic advances, plus PR #33 exited-process candidate fixtures. Instrument `RunStore.save`, process launch, event append, and snapshot replacement.

### Steps
1. Release held waits with zero and nonzero exits after concurrent evidence advances.
2. Cover missing, invalid, run/owner/worker/RPIV mismatch, terminal repeat, and second-advance-before-save rows.
3. Reconcile an already-exited strict-result state and resume finalization.
4. Inject event/snapshot failures around candidate `running_rpiv -> finalizing` and retry.

### Expected Result
Post-wait handling reloads and transitions only the exact current revision, preserves concurrent evidence, returns typed closed refusals, and treats terminal repeats idempotently. Candidate recovery remains a separate explicit path with no relaunch or attempt increment. Store races never overwrite newer history.

### Expected Evidence
Contiguous event/revision traces, preserved result/progress/diagnostic bytes, refusal reasons, zero stale fallback writes, exact launch counters, and deterministic replay results.

## Test V-21: Cleanup, merge-head, rendering, and architecture documentation

- **Type:** Safety, contract, and documentation regression
- **Task:** T-16, T-17, T-18
- **Acceptance Criteria:** AC-3, AC-6, AC-8, AC-9, AC-10
- **Priority:** Critical

### Setup
Provide candidate-only and persisted-completed states across open, merged, closed-unmerged, unavailable, and mismatched PR facts; exact/absent/malformed tmux; clean/dirty worktrees; and exact/ambiguous ownership. Load merged architecture and documentation.

### Steps
1. Invoke status, list, reconcile, clean, resume, attach, and logs twice.
2. Compare candidate-only cleanup traces with normal persisted-completion cleanup.
3. Verify merged source head, branch, ownership, and clean worktree gates.
4. Scan ADR/core-component text, decision records 163-171, docs, and documentation tests for both post-wait and candidate rules.

### Expected Result
Candidates, progress, tmux absence, or malformed tmux never authorize cleanup. Exact persisted completion plus merged source-head and ownership proof still permits guarded cleanup. Closed-unmerged and ambiguity preserve resources with actionable blockage. Architecture retains both contracts and unique historical IDs.

### Expected Evidence
Zero-remove refusal traces, positive exact-cleanup trace, preserved resource hashes, human/JSON snapshots, architecture clause assertions, and unique decision-log sequence through 171.

## Test V-22: Historical Phase 3 control and concurrency regressions

- **Type:** Full behavior regression matrix
- **Task:** T-17
- **Acceptance Criteria:** AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10
- **Priority:** Critical

### Setup
Reuse existing recovery-control, reconciliation, orchestration, persistence, completion, publication-concurrency, tmux, and command integration fixtures.

### Steps
1. Repeat same-issue and distinct-issue barrier races under configured capacity.
2. Exercise resume, stop, clean, list, status, attach, and logs.
3. Exercise SIGTERM, bounded 10-second wait, conditional SIGKILL, 5-second wait, and transcript retention.
4. Run merged-cleanup and every dirty/active/unknown/mismatch/ambiguity refusal row.

### Expected Result
Distinct explicit issues own disjoint resources; capacity never over-admits or selects issues. Active recovery does not duplicate a process. Stop remains bounded and evidence-preserving. Cleanup retains exact positive and fail-safe negative behavior.

### Expected Evidence
Barrier inventories, owner/lease/launch counters, signal timeline, retained transcript assertions, command outcome snapshots, and cleanup refusal matrix.

## Test V-23: Merge history, PATCH 0.1.3, package, and tarball proof

- **Type:** Git history, release metadata, packaging, and documentation validation
- **Task:** T-15, T-16, T-18
- **Acceptance Criteria:** AC-3, AC-8, AC-9, AC-10
- **Priority:** Critical

### Setup
Use the integrated branch, pre-change dependency inventory, and a clean temporary pack/install prefix. Do not publish to a registry.

### Steps
1. Verify the integration commit has PR #33 and `61ac7dd` ancestry/two parents and no rewritten history.
2. Assert 0.1.3 across package, two root lock entries, official catalog, fixtures, generated manifest, packed metadata, installed metadata, and current docs.
3. Assert third-party ranges/lock metadata and package inventory have no unintended churn.
4. Run `npm pack --dry-run --json`, temporary pack/install, installed-version check, and official-asset reconvergence.
5. Verify guidance upgrades from 0.1.2 and no `soft-factory-runner-0.1.2.tgz` remains in the repository or controlled pack workspace.
6. Scan for conflict markers and run `git diff --check`.

### Expected Result
History is merged normally. The backward-compatible correction is uniformly 0.1.3, dependencies are unchanged, packed/installed/manifest metadata agrees, guidance is executable, and stale 0.1.2 package artifacts are absent.

### Expected Evidence
Merge-parent/ancestry output, exact version inventory, lock/dependency diff, pack JSON, installed package JSON, generated manifest, tarball inventory, documentation assertions, and clean diff scan.

## Test V-24: Authoritative combined validation and acceptance audit

- **Type:** Stage-boundary full validation
- **Task:** T-17, T-19
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10
- **Priority:** Critical

### Setup
Complete T-15 through T-18, read harness check instructions, and ensure no unresolved conflict or stale generated artifact remains.

### Steps
1. Run focused suites while correcting failures.
2. Run root `just verify` as the authoritative final gate.
3. Optionally run delegated harness focused/full checks as supplementary evidence.
4. Audit AC-1 through AC-10 against V-19 through V-23 and implementation evidence.
5. Inspect final status, commit graph, coverage, package/tarball state, and friction records.

### Expected Result
All lint, formatting, strict type-check, tests, coverage, build, and diff checks pass. Coverage remains at least 80%. Every AC has implementation, combined validation, and evidence. The tree is clean and ready for Verify.

### Expected Evidence
Root `just verify` output with actual suite/test counts, coverage summary, optional harness envelopes, AC audit, clean `git status`, commit SHAs/graph, package inventory, and harness retro record paths.
