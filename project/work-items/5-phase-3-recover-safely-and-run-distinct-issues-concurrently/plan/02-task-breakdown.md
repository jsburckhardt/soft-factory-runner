# Task Breakdown: Phase 3 Recovery and Explicit Concurrency

## Execution Protocol

Before T-1, run `harness instructions boot`, `harness boot --json`, and inspect the returned status and next action. During implementation, run focused tests through `harness instructions checks`, `harness checks --focused --json`, and direct `just verify-focused` at task boundaries. T-9 runs direct `just verify` and `harness checks --json`. Record implementation, AC evidence, documentation evidence, command envelopes, and the final commit in `project/work-items/5-phase-3-recover-safely-and-run-distinct-issues-concurrently/implementation/00-implementation.md`.

## Task T-1: Add revisioned recovery persistence and domain contracts

- **Status:** Completed
- **Complexity:** Large
- **Dependencies:** None
- **Acceptance Criteria:** AC-1, AC-3, AC-10
- **Related ADRs:** ADR-260811-prototype-three-recovery-concurrency; ADR-260811-prototype-two-completion-proof
- **Related Core-Components:** CORE-COMPONENT-260811-run-reconciliation-control; CORE-COMPONENT-260810-persistence-recovery; CORE-COMPONENT-260810-structured-events; CORE-COMPONENT-260810-error-handling

### Description
Define `RunSnapshotV3`, `TransitionEventV2`, revision/attempt/process/admission/stop/cleanup/log/merge facts, observation/report types, and stable error/outcome codes. Extend `RunStore` and `FilePort` for strict snapshot/event/lock/lease/log enumeration, event history loading, contiguous v2 replay, atomic retained-log writes, and owner-content compare-and-delete. Preserve valid v1/v2 reads, event-before-snapshot ordering, and explicit safe migration; never infer a complete state from legacy-ahead or malformed history.

### Acceptance Criteria
- AC-1: Persisted facts and observed facts have separate typed fields for every required reconciliation boundary.
- AC-3: Store operations return deterministic typed outcomes suitable for every control command.
- AC-10: Fault injection at event append, snapshot replacement, replay, and compare-and-delete boundaries is repeatable and cannot produce two owners or an unhistoried accepted state.
- Valid v1/v2 snapshots remain readable, unknown versions remain rejected, and only a proved transition writes v3.

### Test Coverage
- Implement V-1 store/schema/replay tests for contiguous event-ahead recovery, no-op replay, malformed/truncated/conflicting history, legacy compatibility, strict enumeration, and compare-and-delete identity.
- Supply T-3 with pure persisted-state fixtures for V-2.
- Run `just verify-focused -- src/completion.test.ts src/recovery-persistence.test.ts` or the final equivalent paths.

### Expected Evidence
- Focused Jest output naming v1/v2 compatibility, v3 round trip, contiguous replay, refusal matrix, and event-before-snapshot failure cases.
- Serialized fixture showing one revision sequence and complete redacted resulting snapshot in each v2 event.
- Trace proving compare-and-delete leaves nonmatching replacement files unchanged.

## Task T-2: Expand typed observation and control adapters

- **Status:** Completed
- **Complexity:** Extra Large
- **Dependencies:** T-1
- **Acceptance Criteria:** AC-1, AC-2, AC-6, AC-7, AC-8, AC-9, AC-10
- **Related ADRs:** ADR-260811-prototype-three-recovery-concurrency; ADR-260810-typescript-node-cli; ADR-260811-prototype-two-completion-proof
- **Related Core-Components:** CORE-COMPONENT-260811-run-reconciliation-control; CORE-COMPONENT-260811-owned-resource-cleanup; CORE-COMPONENT-260810-subprocess-execution; CORE-COMPONENT-260810-issue-worktree-locking; CORE-COMPONENT-260811-completion-evidence-reconciliation

### Description
Expand filesystem, Git, GitHub, tmux, and process ports plus live adapters. Add strict lock/lease reads and enumeration; worktree registration/branch/HEAD/dirtiness and non-forced removal; PR merged time/source head/merge commit facts; tmux pane PID/lineage/remain-on-exit/capture/removal; and process spawn identity, process-tree observation, bounded wait, and exact group signaling. Use executable/argument arrays, current redaction rules, bounded calls, and explicit unknown facts. Keep the GitHub source-head query valid after remote branch deletion.

### Acceptance Criteria
- AC-1: Every required external system has one bounded typed observation with malformed, timeout, absent, and success classifications.
- AC-2: Process observations expose every compound identity field and pane lineage needed to prevent PID reuse and duplicate launch.
- AC-6: Git and GitHub adapters expose clean exact worktree and immutable merged source-head facts without requiring a remote issue branch.
- AC-7: Process/tmux adapters support ordered graceful termination, bounded escalation, remain-on-exit, and redacted capture.
- AC-8 and AC-9: Destructive adapter calls require exact targets and expose enough facts for fail-safe refusal.
- AC-10: Adapter fakes and temporary-resource fixtures record complete call order without live credentials, ambient tmux, or ambient Copilot.

### Test Coverage
- Implement adapter-focused portions of V-2, V-3, V-7, V-8, V-9, and V-10.
- Add command-runner tests for exact argument arrays, cwd, timeouts, malformed output, process start-token/PID reuse, signal order, and no-force worktree removal.
- Extend temporary Git and fake `gh` integration tests for dirtiness, source-head merge facts, deleted source refs, and divergent merge commit.

### Expected Evidence
- Argument-recording traces for process, tmux, Git, and GitHub calls including timeout and shell settings.
- Temporary Git fixtures showing staged/unstaged/untracked detection and non-forced removal only after clean ownership proof.
- Process fixture facts demonstrating that equal PID with a different start token is a mismatch.
- GitHub parser facts containing `MERGED`, merged time, source branch/SHA, and informational merge-commit SHA.

## Task T-3: Implement the shared reconciliation engine and run inventory

- **Status:** Completed
- **Complexity:** Extra Large
- **Dependencies:** T-1, T-2
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-9, AC-10
- **Related ADRs:** ADR-260811-prototype-three-recovery-concurrency; ADR-260811-prototype-two-completion-proof
- **Related Core-Components:** CORE-COMPONENT-260811-run-reconciliation-control; CORE-COMPONENT-260810-error-handling; CORE-COMPONENT-260810-structured-events; CORE-COMPONENT-260811-completion-evidence-reconciliation

### Description
Build a pure reconciliation policy plus orchestration collector that loads/replays state, performs one bounded observation per applicable boundary, normalizes each fact as match/absent/mismatch/unknown/not-applicable, classifies active/inactive/blocked/interrupted, and returns safe actions and one stable code. Enumerate the union of run, lock, lease, and log records in numeric issue order. Route status, list, reconcile, attach, logs, and existing-state run through the report so command-specific code cannot infer safety differently.

### Acceptance Criteria
- AC-1: One report carries lock, filesystem, Git, tmux, worker/RPIV process, result, remote, and GitHub observations separately from the persisted snapshot.
- AC-2: An exact active match yields `active_preserved`; zero launch is the only permitted action.
- AC-3: Repeated status/list/reconcile/attach/log evaluation over unchanged facts returns the same state/code/facts and idempotent persistence.
- AC-9: Closed-unmerged or ambiguous merge/ownership facts produce blocked cleanup detail without erasing a proved completed state.
- AC-10: Repeated matrix inputs are pure and issue inventory ordering is stable regardless of filesystem enumeration order.

### Test Coverage
- Implement V-2 as a table-driven pure matrix across every observation class and lifecycle state.
- Implement inventory and shared-command portions of V-4, including orphan lock/lease/log records, malformed names, sorted output, and unchanged-input idempotency.
- Assert one call per bounded external observation and no calls to launch, signal, attach, or remove when the report omits that safe action.

### Expected Evidence
- Snapshot of a complete `ReconciliationReportV1` with all required boundary keys and redacted facts.
- Jest matrix proving stable decision codes for exact, absent, mismatched, unknown, and ambiguous combinations.
- Trace showing repeated exact-active reconciliation preserves revision/attempt and performs zero launch operations.

## Task T-4: Enforce atomic explicit-issue concurrency admission

- **Status:** Completed
- **Complexity:** Large
- **Dependencies:** T-1, T-2, T-3
- **Acceptance Criteria:** AC-4, AC-5, AC-10
- **Related ADRs:** ADR-260811-prototype-three-recovery-concurrency; ADR-260811-prototype-one-run-orchestration
- **Related Core-Components:** CORE-COMPONENT-260811-concurrent-run-admission; CORE-COMPONENT-260810-issue-worktree-locking; CORE-COMPONENT-260811-issue-run-orchestration; CORE-COMPONENT-260810-persistence-recovery

### Description
Parse `execution.max_concurrent_runs` with default 1, implement exclusive slot leases and exact release, and integrate admission between issue-lock acquisition and downstream resources. Retry configured slot candidates after an exclusive-create race, refuse unknown/stale capacity and unsafe limit reduction, and roll back only the just-created matching issue lock when no slot is available. Preserve issue-derived branch/worktree/window/run/event/log identities and the intentionally shared repository tmux session.

### Acceptance Criteria
- AC-4: Two admitted distinct issues have disjoint locks, branches, worktrees, tmux windows/panes, run/event records, and log paths.
- AC-5: Active leases never exceed the valid configured limit; limit failure names only the explicitly requested issue and creates no queue or selector.
- AC-10: Same-issue and distinct-issue barriers always produce one owner per issue, no over-admission, no resource collision, and exact rollback for a capacity loser.
- Invalid, zero, negative, fractional, and unsafe-integer configuration fails before ownership.

### Test Coverage
- Implement V-5 with two distinct barrier-released issues and explicit set-disjointness assertions.
- Implement V-6 for default 1, configured 2, third-start refusal, concurrent slot races, unknown lease occupancy, exact terminal release, and lower-limit blocking.
- Use the real exclusive filesystem primitive in temporary roots plus in-memory traces for downstream side-effect counts.

### Expected Evidence
- Barrier result with two successful issues in slots 1 and 2 and unique resource sets.
- Third-start result `CONCURRENCY_LIMIT_REACHED`, absent third snapshot/branch/worktree/window/process, and absent rolled-back issue lock.
- Repeated race summary proving maximum occupied slots never exceeds configuration and no issue was inferred or selected.

## Task T-5: Integrate no-duplicate launch and deterministic resume

- **Status:** Completed
- **Complexity:** Extra Large
- **Dependencies:** T-3, T-4
- **Acceptance Criteria:** AC-2, AC-3, AC-10
- **Related ADRs:** ADR-260811-prototype-three-recovery-concurrency; ADR-260811-prototype-one-run-orchestration; ADR-260811-prototype-two-completion-proof
- **Related Core-Components:** CORE-COMPONENT-260811-run-reconciliation-control; CORE-COMPONENT-260810-subprocess-execution; CORE-COMPONENT-260811-issue-run-orchestration; CORE-COMPONENT-260811-completion-evidence-reconciliation

### Description
Refactor worker launch into intent, spawn-identity, wait, and finalization transitions. Persist intent before spawn and compound identity immediately after spawn. Reconcile and adopt exactly one matching pane descendant if identity persistence was interrupted. Implement the accepted resume decision table for partial preparation, active preservation, interrupted finalization, interrupted execution, completed no-op, and nonresumable terminal/ambiguous states while retaining the same owned worktree.

### Acceptance Criteria
- AC-2: Reconcile and resume preserve a matching active process with unchanged attempt and launch count zero.
- AC-3: Every resume state produces the accepted deterministic action, stable code, persisted transition, and nonzero refusal where applicable.
- AC-10: Interruptions before spawn, after spawn/before identity save, after identity save, during wait, and during finalization never create a second matching process.
- Existing completion proof remains the only route to completed.

### Test Coverage
- Implement V-3 with exact active, PID-reuse mismatch, single-candidate adoption, multiple candidates, unavailable observation, and repeated resume.
- Extend V-4 with the full resume command matrix and human/JSON equivalence.
- Inject failures around each launch persistence boundary and assert process launch/adoption counts and attempt transitions.

### Expected Evidence
- Trace `launchIntent -> spawn identity -> identity event/snapshot -> wait` for a normal attempt.
- Interrupted-launch fixture showing one adopted PID/start token and no second spawn.
- Resume matrix output covering partial preparation, finalization retry without RPIV, new interrupted attempt, completed no-op, and typed refusals.

## Task T-6: Implement bounded stop and retained terminal evidence

- **Status:** Completed
- **Complexity:** Large
- **Dependencies:** T-3, T-5
- **Acceptance Criteria:** AC-3, AC-7, AC-10
- **Related ADRs:** ADR-260811-prototype-three-recovery-concurrency
- **Related Core-Components:** CORE-COMPONENT-260811-run-reconciliation-control; CORE-COMPONENT-260810-subprocess-execution; CORE-COMPONENT-260810-error-handling; CORE-COMPONENT-260810-structured-events

### Description
Implement stop from the shared report. Capture bounded redacted pane history, signal only the exact RPIV process group with SIGTERM, wait 10 seconds, optionally signal SIGKILL, wait 5 seconds, capture final pane history, persist stop facts and cancelled state, and release only an exact inactive concurrency lease. Preserve the worktree and remain-on-exit tmux target. Make terminal/already-absent stop idempotent and unknown/mismatch stop non-signaling.

### Acceptance Criteria
- AC-3: Stop and subsequent status/attach/logs return stable shared facts for graceful, escalated, already-stopped, and refused outcomes.
- AC-7: SIGTERM precedes any SIGKILL, waits are bounded as accepted, and worktree plus terminal evidence remain.
- AC-10: Repeated stop at every interruption point neither duplicates signals after recorded success nor loses owned evidence.
- Logs are redacted, capped at 2 MiB with explicit truncation, and retained by attempt.

### Test Coverage
- Implement V-7 with graceful exit before deadline, escalation, already exited, PID/start-token mismatch, capture failure, and interrupted persistence.
- Use a deterministic fake clock/process controller for exact timing and a disposable child process only for adapter-level signal verification.
- Assert no worktree/tmux removal calls and exact retained transcript source/truncation metadata.

### Expected Evidence
- Ordered graceful trace `capture -> SIGTERM -> wait -> cancelled -> capture` with no SIGKILL.
- Ordered escalation trace including SIGKILL only after the 10-second wait and completion within the additional 5-second bound.
- Filesystem facts showing the worktree, tmux identity, snapshot/events, and retained attempt log after stop.

## Task T-7: Implement guarded explicit and merged-PR cleanup

- **Status:** Completed
- **Complexity:** Extra Large
- **Dependencies:** T-3, T-4, T-6
- **Acceptance Criteria:** AC-3, AC-6, AC-8, AC-9, AC-10
- **Related ADRs:** ADR-260811-prototype-three-recovery-concurrency; ADR-260811-prototype-two-completion-proof
- **Related Core-Components:** CORE-COMPONENT-260811-owned-resource-cleanup; CORE-COMPONENT-260811-run-reconciliation-control; CORE-COMPONENT-260810-issue-worktree-locking; CORE-COMPONENT-260811-completion-evidence-reconciliation

### Description
Build cleanup authorization from the shared report. Persist intent/progress, capture logs before explicit tmux removal, remove clean exact worktrees without force, release exact inactive leases, and compare-and-delete the exact issue lock last. Extend completed-run reconciliation to compare expected PR number, MERGED state/time, immutable source branch and source head against the already verified commit. Automatic mode retains tmux; explicit mode may remove it. Both retain branch, snapshot, events, and logs and can resume only recorded partial steps.

### Acceptance Criteria
- AC-3: Clean returns deterministic completed, already-cleaned, partial, pending, or blocked output with completed/remaining steps.
- AC-6: Matching merged source head plus clean exact ownership removes worktree registration/path and issue lock automatically on the next reconciliation-capable command.
- AC-8: Active, staged, unstaged, untracked, unknown, mismatched, ambiguous, or incomplete resources produce zero unauthorized destructive calls.
- AC-9: Closed-unmerged and ambiguous merge/ownership preserve the worktree and return an actionable blocked cleanup result without changing proved completion.
- AC-10: Repeated partial cleanup resumes only recorded exact steps and never removes a replacement or unrelated resource.

### Test Coverage
- Implement V-8 refusal and partial-progress tables.
- Implement V-9 positive merged automatic cleanup, including deleted remote issue branch and differing informational merge commit.
- Implement V-10 closed-unmerged, open-pending, missing merge time, source branch/SHA mismatch, unavailable GitHub, dirty, and ownership ambiguity.
- Use temporary Git worktrees and exact pre/post path, registration, lock, tmux, branch, log, snapshot, and event assertions.

### Expected Evidence
- Positive cleanup trace with persisted intent/progress and verified order, ending with absent worktree registration/path and exact issue lock.
- Retention facts showing local branch, automatic-cleanup tmux, snapshots, events, and logs remain.
- Refusal table with stable codes/remediation, unchanged worktree bytes, and zero remove/delete calls.
- Partial retry trace proving absence is accepted only after the matching recorded successful step.

## Task T-8: Complete CLI, rendering, and operator documentation

- **Status:** Completed
- **Complexity:** Large
- **Dependencies:** T-5, T-6, T-7
- **Acceptance Criteria:** AC-3, AC-5, AC-6, AC-7, AC-8, AC-9
- **Related ADRs:** ADR-260811-prototype-three-recovery-concurrency; ADR-260810-typescript-node-cli
- **Related Core-Components:** CORE-COMPONENT-260811-run-reconciliation-control; CORE-COMPONENT-260811-concurrent-run-admission; CORE-COMPONENT-260811-owned-resource-cleanup; CORE-COMPONENT-260806-project-command-interface; CORE-COMPONENT-260806-rpiv-stage-contract

### Description
Add strict public grammar and dispatch for `reconcile <issue>`, `resume <issue>`, `stop <issue>`, `clean <issue>`, `list`, `status <issue>`, `attach <issue>`, and `logs <issue>`, with `--json` where structured output applies. Render common reconciliation/control facts and stable exit codes. Update README quick start, `docs/README.md`, and the current issue-run guide; add a Phase 3 recovery/concurrency operations guide if clearer. Cover CLI reference, `execution.max_concurrent_runs`, explicit selection, usage, recovery decision table, stop/log retention, cleanup/merge proof, troubleshooting, schema v3 and v1/v2 migration, local-runtime installation/deployment expectations, and the no-daemon automatic-cleanup trigger. State that no network service/API deployment or force-clean path is introduced.

### Acceptance Criteria
- AC-3: Help and docs enumerate every required command, arguments, JSON form, state/code/exit meaning, idempotency, and remediation.
- AC-5: Configuration docs state strict positive integer syntax, default 1, slot behavior, limit reduction behavior, and no automatic issue selection.
- AC-6: Operations docs define merged head as immutable PR source head and identify automatic cleanup scope/trigger and retained resources.
- AC-7: Stop docs state graceful/escalation bounds and exact worktree/tmux/log retention.
- AC-8 and AC-9: Cleanup docs enumerate refusal categories, closed-unmerged behavior, blocked remediation, partial retry, and no force bypass.
- Documentation examples use root `justfile` commands and remain executable without global binary linkage.

### Test Coverage
- Implement V-4 parser/dispatch/render tests for all command forms, invalid forms, stable exit codes, sorted list, and human/JSON semantic equivalence.
- Implement V-11 documentation content and command smoke tests through `just run` against safe missing-state fixture issue numbers.
- Update stale Phase 2 deferral assertions so docs no longer claim delivered Phase 3 behavior is deferred.

### Expected Evidence
- CLI parser/dispatch Jest matrix and JSON snapshots containing stable schema version, outcome code, reconciliation, safe actions, and remediation.
- Documentation test output proving all command/config/recovery/cleanup/migration/deployment phrases and root recipe examples exist.
- Implementation record listing each changed README/guide path and documentation impact; API documentation marked not applicable because the product surface remains a CLI.

## Task T-9: Consolidate deterministic fixtures and stage validation

- **Status:** Completed
- **Complexity:** Large
- **Dependencies:** T-1, T-2, T-3, T-4, T-5, T-6, T-7, T-8
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10
- **Related ADRs:** ADR-260811-prototype-three-recovery-concurrency; ADR-260811-prototype-one-run-orchestration; ADR-260811-prototype-two-completion-proof
- **Related Core-Components:** CORE-COMPONENT-260811-run-reconciliation-control; CORE-COMPONENT-260811-concurrent-run-admission; CORE-COMPONENT-260811-owned-resource-cleanup; CORE-COMPONENT-260810-development-standards; CORE-COMPONENT-260811-engineering-harness-interface

### Description
Consolidate deterministic fixture builders for persisted state, event revisions, locks/leases, temporary Git worktrees, tmux/process identity, result/remote/GitHub facts, and fault barriers. Repeat the interruption and concurrency matrix with fixed inputs and compare normalized results/traces. Run the complete direct and harness validation surfaces, inspect global coverage at or above 80 percent, and record AC-by-AC and documentation evidence in the implementation handoff.

### Acceptance Criteria
- AC-1 through AC-9: Every criterion has at least one named passing V-test and concrete artifact/trace evidence in the implementation record.
- AC-10: Fixed repeated runs produce identical normalized reports and resource traces, one owner per issue, no duplicate launch, no over-capacity lease set, and no worktree/window collision.
- Existing Phase 1 and Phase 2 readiness/completion tests remain passing and no completion invariant is weakened.
- Direct root recipes and delegating harness checks both pass; transient harness evidence is handled under the adopted stage contract.

### Test Coverage
- Run V-1 through V-11, including a fixed repetition loop for interruption boundaries and same/distinct-issue barriers.
- Run `harness checks --focused --json` and direct `just verify-focused` during consolidation.
- Run direct `just verify`, then `harness checks --json`, and inspect lint, format, type, test, coverage, build, and diff-check results.

### Expected Evidence
- Repetition summary listing scenario count, identical outcome hashes or normalized snapshots, launch counts, owner counts, slot maxima, and collision checks.
- Passing `just verify-focused` and `just verify` output with statement, branch, function, and line coverage at or above 80 percent.
- Successful focused/full harness JSON envelopes naming their delegated root recipes.
- `implementation/00-implementation.md` with task completion, AC-1 through AC-10 evidence, documentation evidence, clean-tree proof, and implementation commit SHA.
