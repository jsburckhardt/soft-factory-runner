# Test Plan: Phase 3 Recovery and Explicit Concurrency

## Test V-1: Versioned persistence, event replay, and interruption safety

- **Type:** Unit and persistence fault injection
- **Task:** T-1
- **Acceptance Criteria:** AC-1, AC-3, AC-10
- **Priority:** Critical

### Setup
Use an in-memory `FilePort` with ordered traces and failure injection for append, atomic replace, event reads, enumeration, log writes, and compare-and-delete. Provide valid v1, v2, and v3 snapshots plus v1 and v2 event histories.

### Steps
1. Round-trip every v3 lifecycle/control/cleanup field and both older supported snapshot versions.
2. Save transitions and assert event-v2 append precedes snapshot-v3 replacement.
3. Leave one and several contiguous v2 events ahead of the snapshot and load/replay them.
4. Present malformed, truncated, wrong-run, duplicate-revision, noncontiguous, conflicting, and legacy-v1-ahead histories.
5. Enumerate mixed snapshot/lock/lease/log names and compare-and-delete matching and replacement owner records.
6. Repeat every fault case with identical inputs and compare normalized results.

### Expected Result
Only a complete contiguous identity-matching v2 chain advances the materialized snapshot. Invalid or legacy-ahead history produces a stable non-success and no mutation. Event append failure preserves the old snapshot; replacement failure leaves replayable history. Enumeration is strict and sorted downstream, and compare-and-delete never removes nonmatching content.

### Expected Evidence
- Jest cases and ordered event/snapshot traces.
- Serialized revision chain with complete resulting snapshot payloads.
- Repeat-run equality and unchanged replacement-file assertions.

## Test V-2: Full persisted-versus-observed reconciliation matrix

- **Type:** Pure domain contract test
- **Task:** T-2, T-3
- **Acceptance Criteria:** AC-1, AC-2, AC-10
- **Priority:** Critical

### Setup
Build immutable inputs containing persisted snapshot/history plus separate lock, filesystem, Git branch/worktree, tmux, worker/RPIV process, result artifact, remote Git, and GitHub observations. Generate match, absent, mismatch, unknown, and not-applicable variants for each boundary.

### Steps
1. Reconcile the all-matching active input twice.
2. Vary one observation class at a time and record decision, activity, safe actions, and diagnostics.
3. Inject timeout/malformed adapter outcomes as unknown rather than absent.
4. Verify all observation collectors are called at most once in one attempt.
5. Compare normalized reports and confirm no input mutation.

### Expected Result
Every report contains all applicable required boundaries separately and yields the same result for the same input. Exact active identity permits only preservation. Unknown or contradiction never authorizes launch, signal, reuse, attach, or cleanup.

### Expected Evidence
- Table-driven Jest output for every boundary/class pair.
- Complete redacted `ReconciliationReportV1` fixture.
- Adapter call-count and safe-action assertions.

## Test V-3: Restart process preservation and resume decision table

- **Type:** Orchestration and process identity test
- **Task:** T-2, T-3, T-5
- **Acceptance Criteria:** AC-2, AC-3, AC-10
- **Priority:** Critical

### Setup
Use a fake process tree keyed by PID, process group, start token, executable, args, cwd, launch time, and tmux lineage. Add launch counters and interruption hooks before spawn, after spawn, before identity persistence, after persistence, during wait, and during finalization.

### Steps
1. Reconcile and resume an exact active process repeatedly.
2. Reuse the PID with a different start token and vary each other identity field separately.
3. Recover launch intent with exactly one matching pane descendant, zero candidates, and multiple candidates.
4. Exercise resume for partial preparation, interrupted execution without result, interrupted finalization with result, completed, failed, blocked, cancelled, and legacy-unmigratable states.
5. Repeat all interruption boundaries and count spawn/adoption/attempt changes.

### Expected Result
Exact active process returns `active_preserved`, does not increment attempt, and launches zero processes. Exactly one interrupted-launch candidate is adopted once. Mismatch, unknown, or multiple candidates block. Resume follows the accepted action table and cannot bypass completion proof.

### Expected Evidence
- Launch/adoption count trace and persisted compound identity.
- Full resume state/code/exit matrix.
- Repeated interruption summary with no duplicate matching process.

## Test V-4: Deterministic recovery and control CLI surface

- **Type:** CLI unit and composition test
- **Task:** T-3, T-5, T-6, T-7, T-8
- **Acceptance Criteria:** AC-3
- **Priority:** Critical

### Setup
Compose `runCli` with deterministic ports and fixture reports for active, interrupted, terminal, cleaned, blocked, and missing states. Capture human and JSON outputs without invoking ambient GitHub, tmux, or Copilot.

### Steps
1. Parse and dispatch valid and invalid forms of reconcile, resume, stop, clean, list, status, attach, logs, run, and the private worker.
2. Invoke every command twice over unchanged facts and compare normalized outcomes.
3. Verify numeric list ordering across orphan snapshot, lock, lease, and log records.
4. Compare state, outcome code, safe actions, observations, remediation, and cleanup progress in human and JSON rendering.
5. Verify stable nonzero exits for syntax, blocked, interrupted, and failed operations.

### Expected Result
Every named command has strict grammar and a deterministic typed outcome. Human and JSON renderings preserve the same meaning. Repetition is idempotent, and list/status do not infer success from tmux or process presence.

### Expected Evidence
- Parser/dispatch matrix and representative output snapshots.
- Human/JSON semantic comparison assertions.
- Stable exit-code and numeric-order traces.

## Test V-5: Distinct active issues receive distinct resources

- **Type:** Concurrency integration fixture
- **Task:** T-4, T-9
- **Acceptance Criteria:** AC-4, AC-10
- **Priority:** Critical

### Setup
Use a temporary repository root, real exclusive file creation, two ready explicit issue fixtures, configured capacity 2, barrier-released readiness, and recording Git/tmux/process adapters.

### Steps
1. Start both distinct issues concurrently at the barrier.
2. Allow both to reach active `running_rpiv` with leases.
3. Collect lock, branch, worktree, tmux session/window/pane, snapshot, event, log, owner, and run identities.
4. Repeat the fixture 20 times with fresh temporary roots.

### Expected Result
Both explicit issues are admitted and each has one owner/resource set. Locks, branches, worktrees, windows, panes, run/event records, and log paths are pairwise distinct; only the documented repository tmux session is shared. No repetition collides.

### Expected Evidence
- Set-disjointness assertions and operation traces for each issue.
- Twenty-run summary with two owners, two slots, and zero collisions per run.
- Temporary-root proof that ambient worktrees and tmux are untouched.

## Test V-6: Concurrency limits and explicit selection

- **Type:** Configuration and admission race integration test
- **Task:** T-4, T-8, T-9
- **Acceptance Criteria:** AC-5, AC-10
- **Priority:** Critical

### Setup
Provide configurations for absent limit, valid limits 1 and 2, invalid numeric forms, unknown/stale leases, and an occupied slot above a reduced limit. Use three explicitly numbered ready issues and real exclusive lease files with barriers.

### Steps
1. Verify absent configuration defaults to one and invalid forms fail before ownership.
2. Start three explicit issues concurrently with capacity two.
3. Assert retry of slot candidates after an exclusive-create loss.
4. Test unknown/stale lease occupancy, exact inactive release, and reduced-limit blocking.
5. Search traces and public grammar for any automatic issue query, queue, ranking, or next-selection action.
6. Repeat race cases 20 times.

### Expected Result
No run set exceeds configured capacity. At limit two, exactly two explicit issues are admitted and one gets `CONCURRENCY_LIMIT_REACHED`; the loser has no downstream resources and no leftover just-created issue lock. Unknown leases and unsafe reductions block conservatively. No issue is auto-selected.

### Expected Evidence
- Lease/lock filesystem assertions and downstream side-effect counts.
- Twenty-run slot maximum and winner-count summary.
- CLI/config tests proving explicit issue input and absence of selection behavior.

## Test V-7: Graceful stop, bounded escalation, and evidence retention

- **Type:** Control orchestration and process adapter test
- **Task:** T-2, T-6, T-9
- **Acceptance Criteria:** AC-3, AC-7, AC-10
- **Priority:** Critical

### Setup
Use a deterministic fake clock/process controller, exact active process identity, remain-on-exit tmux target, pane captures, and a worktree sentinel. Add graceful, unresponsive, already-exited, mismatched, unknown, and persistence-failure scenarios.

### Steps
1. Stop a process that exits after SIGTERM before 10 seconds.
2. Stop one that remains active through 10 seconds and exits after SIGKILL within 5 seconds.
3. Stop already absent/terminal state twice.
4. Attempt stop with PID reuse, pane mismatch, multiple candidates, and unknown process observation.
5. Inject failures around pre/post capture and stop-fact persistence, then retry.
6. Inspect worktree, tmux, log, snapshot, event, and lease facts.

### Expected Result
SIGTERM always precedes optional SIGKILL and the waits respect accepted bounds. Exact successful stops persist cancelled facts and release only exact inactive capacity while preserving worktree and terminal evidence. Already-stopped is idempotent. Ambiguity sends no signal.

### Expected Evidence
- Timestamped signal/wait/capture traces for graceful and escalated paths.
- Cancelled snapshot/event and retained redacted attempt transcript.
- Worktree sentinel and tmux identity still present; mismatch scenarios show zero signals.

## Test V-8: Cleanup refusal and partial-step retry matrix

- **Type:** Destructive-safety integration test
- **Task:** T-2, T-7, T-9
- **Acceptance Criteria:** AC-3, AC-8, AC-10
- **Priority:** Critical

### Setup
Create temporary owned worktrees and variants that are active, staged, unstaged, untracked, unknown, mismatched by branch/path/HEAD/lock/lease/tmux/process, ambiguously owned, or observation-incomplete. Instrument tmux removal, Git worktree removal, lease deletion, and lock deletion. Add failures after each persisted cleanup step.

### Steps
1. Invoke explicit clean for every refusal variant.
2. Compare worktree bytes, registration, tmux, lease, and lock before and after.
3. Run one eligible cleanup while failing after each step, then retry from recorded progress.
4. Replace a previously removed resource with a different owner before retry.
5. Repeat each normalized scenario.

### Expected Result
Every unsafe variant returns a stable actionable nonzero refusal and performs zero unauthorized destructive operations. Eligible partial cleanup resumes only after matching recorded progress and refuses an unrelated replacement. Output names completed and remaining steps deterministically.

### Expected Evidence
- Refusal table with code, remediation, and zero remove/delete counts.
- Pre/post worktree hash and registration assertions.
- Partial-progress event/snapshot and retry traces for each ordered step.

## Test V-9: Positive merged-PR automatic cleanup

- **Type:** Git and GitHub reconciliation integration test
- **Task:** T-2, T-7, T-9
- **Acceptance Criteria:** AC-6, AC-10
- **Priority:** Critical

### Setup
Create a completed v3 run with verified result commit, clean exact owned worktree, exact lock, retained transcript, and terminal tmux. Fake the expected PR as MERGED with nonempty merge time, matching source branch/SHA, a different informational merge-commit SHA, and a deleted remote source branch.

### Steps
1. Invoke status, list, and explicit reconcile separately on fresh copies to trigger automatic reconciliation.
2. Verify source head comparisons against recorded branch and commit.
3. Record cleanup intent/progress and operation order.
4. Inspect Git worktree registration/path, issue lock, slot, local branch, tmux, snapshot, events, and logs.
5. Invoke reconciliation again.

### Expected Result
Each trigger automatically removes the clean owned worktree and releases exact slot/issue lock once. Deleted remote branch and differing merge commit do not block because immutable PR source head matches. Automatic mode retains local branch, tmux, snapshot, events, and logs; repetition is already-cleaned/idempotent.

### Expected Evidence
- Merged-source-head comparison report and GitHub parser facts.
- Ordered cleanup trace with absent worktree registration/path and lock after success.
- Retention and second-invocation idempotency assertions.

## Test V-10: Closed-unmerged and ambiguous cleanup blockage

- **Type:** Negative GitHub and ownership integration test
- **Task:** T-3, T-7, T-9
- **Acceptance Criteria:** AC-8, AC-9, AC-10
- **Priority:** Critical

### Setup
Clone the completed clean fixture from V-9 and vary PR state OPEN, CLOSED-unmerged, missing merge time, missing/incomplete PR, source branch mismatch, source SHA mismatch, unavailable GitHub, dirty worktree, lock mismatch, and ownership ambiguity.

### Steps
1. Run each reconciliation-capable automatic-cleanup trigger.
2. Capture cleanup outcome, run state, stable code, comparison facts, and remediation.
3. Hash worktree contents and inspect registration/lock before and after.
4. Repeat each case with identical facts.

### Expected Result
OPEN is pending with no cleanup. CLOSED-unmerged and every ambiguous/incomplete/mismatched merge or ownership case is actionable blocked and non-destructive. The worktree and lock remain, and an already proved completed run state is not rewritten as failed or uncompleted.

### Expected Evidence
- Negative matrix with stable blocked codes and remediation.
- Unchanged worktree hash/registration/lock and zero destructive call assertions.
- Repeated normalized output equality.

## Test V-11: CLI, configuration, recovery, and operations documentation

- **Type:** Documentation contract and safe command smoke test
- **Task:** T-8
- **Acceptance Criteria:** AC-3, AC-5, AC-6, AC-7, AC-8, AC-9
- **Priority:** High

### Setup
Read README, docs index, issue-run guide, and Phase 3 operations guide through the documentation Jest suite. Build the CLI and use root `just run` with help and safe missing-state issue numbers.

### Steps
1. Assert docs list every public command and JSON form plus stable state/code/exit semantics.
2. Assert configuration docs cover strict limit parsing, default, leases, reductions, and explicit selection.
3. Assert recovery, resume, stop bounds, log retention, cleanup refusal, merged source-head, closed-unmerged, partial retry, and no-force behavior.
4. Assert snapshot/event migration and retained evidence are documented.
5. Assert installation/deployment notes explain the local short-lived CLI, external tools, no daemon, and next-invocation automatic trigger; mark network API docs not applicable.
6. Execute help and safe missing-state status/resume/stop/clean/logs commands through `just run`.

### Expected Result
Documentation matches implemented grammar and architecture, contains executable root-recipe examples, removes delivered Phase 3 deferrals, and gives actionable operator guidance without claiming a service deployment or force bypass.

### Expected Evidence
- Passing documentation Jest tests naming each required subject.
- Captured help and safe command smoke output through the root justfile.
- Documentation impact list in implementation evidence.

## Test V-12: Full project and harness quality gates

- **Type:** Stage-boundary validation
- **Task:** T-9
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10
- **Priority:** Critical

### Setup
Complete T-1 through T-9, ensure no live product resources or credentials are required, read `harness instructions checks`, and inspect the implementation evidence catalog.

### Steps
1. Run `harness checks --focused --json` and direct `just verify-focused` during final fixture iteration.
2. Run direct `just verify` as the authoritative full RPIV boundary.
3. Run `harness checks --json` and confirm it delegates to `just verify`.
4. Inspect lint, formatting, strict type checking, Jest results, statement/branch/function/line coverage, build, and `git diff --check`.
5. Cross-check every AC ID against its named tests and recorded evidence and verify README/guide changes.

### Expected Result
All direct and delegating gates pass, every coverage dimension remains at least 80 percent, existing completion/readiness behavior remains green, and each AC has reproducible repository evidence. No test depends on ambient GitHub, tmux, Copilot, or destructive current-worktree operations.

### Expected Evidence
- Successful direct focused/full command logs.
- Successful focused/full harness JSON envelopes with delegated recipe names.
- Jest/coverage summary, build result, diff hygiene, AC evidence table, documentation evidence, clean-tree proof, and implementation commit SHA.
