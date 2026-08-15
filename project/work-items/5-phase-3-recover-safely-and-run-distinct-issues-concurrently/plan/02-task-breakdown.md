# Task Breakdown: Phase 3 Interrupted Finalization Recovery Correction

## Implementation Protocol
Run `harness instructions boot` before Implement boot and `harness instructions checks` before checks. Preserve the updated research brief. Record task, AC, architecture, test, SemVer, package, documentation, and command evidence in the existing implementation handoff. Tasks T-1 through T-9 are historical completed delivery; this correction starts at T-10.

## Task T-10: Encode recovery-candidate domain policy

- **Status:** Completed
- **Complexity:** Large
- **Dependencies:** None
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-8, AC-9, AC-10
- **Related ADRs:** ADR-260811-prototype-three-recovery-concurrency; ADR-260812-rpiv-integration-completion-contract; ADR-260814-tmux-identity-failure-recovery
- **Related Core-Components:** CORE-COMPONENT-260811-run-reconciliation-control; CORE-COMPONENT-260811-completion-evidence-reconciliation; CORE-COMPONENT-260812-rpiv-integration-handoff; CORE-COMPONENT-260814-tmux-identity-diagnostics

### Description
Add an explicit unaccepted recovery-candidate representation/code for a strict successful `AgentResultV1` found at the owned path while persisted state is `running_rpiv` and RPIV is absent and the worker is absent or not recorded. Require issue, branch, ordered acceptance set, and snapshotted final-validation binding before candidate use. Define `FINALIZATION_RECOVERY_AVAILABLE` and its exact conjunction. Keep progress excluded from authorization and keep candidate data out of persisted finalization and cleanup facts.

### Acceptance Criteria
- AC-1: Result, local Git, remote, and GitHub comparisons can use a validated candidate without hiding any boundary.
- AC-2: Exact active RPIV still takes precedence and is preserved.
- AC-3: Candidate-ready, unknown, mismatch, and ineligible outcomes have stable codes/actions/exits.
- AC-8 and AC-9: Candidate or progress alone cannot authorize cleanup or erase contradictory PR/ownership facts.
- AC-10: Equal domain inputs produce equal reports and no mutation.

### Test Coverage
Implement V-13 and the pure-policy portions of V-14 through V-16. Cover malformed, failed, wrong issue/branch, AC/binding mismatch, repeated terminal progress, active RPIV, absent process, and every authorizing unknown/mismatch.

### Expected Evidence
Table-driven domain snapshots showing candidate classification, unchanged persisted result/progress, exact decision precedence, safe actions, and zero mutation.

## Task T-11: Stage candidate-aware reconciliation observations and precedence

- **Status:** Completed
- **Complexity:** Extra Large
- **Dependencies:** T-10
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-6, AC-8, AC-9, AC-10
- **Related ADRs:** ADR-260811-prototype-three-recovery-concurrency; ADR-260814-tmux-identity-failure-recovery
- **Related Core-Components:** CORE-COMPONENT-260810-persistence-recovery; CORE-COMPONENT-260810-issue-worktree-locking; CORE-COMPONENT-260811-run-reconciliation-control; CORE-COMPONENT-260811-completion-evidence-reconciliation; CORE-COMPONENT-260811-owned-resource-cleanup; CORE-COMPONENT-260814-tmux-identity-diagnostics

### Description
Refactor collection into deterministic stages: parse/classify the result once, derive candidate query keys only after strict eligibility, then observe candidate-head worktree Git, fresh remote branch, and the candidate PR once each. Retain parallelism only among independent boundaries. Candidate values are query inputs, not trusted proof. Preserve one-pass tmux diagnostics and unknown-before-mismatch precedence. Allow exact or proved-absent tmux only for the candidate finalization action; malformed remains unknown, mismatch remains contradictory, and neither absent nor malformed tmux enters cleanup authority.

### Acceptance Criteria
- AC-1: Composite reports include lock, lease, filesystem, candidate-head Git, tmux, worker/RPIV, progress, result, remote, and candidate-number GitHub facts.
- AC-2: Active process reports never enter candidate recovery.
- AC-3: Status/list/reconcile render the same candidate and blockage semantics without hidden retry.
- AC-6, AC-8, AC-9: Cleanup still reads only persisted completion/expected-PR authority and refuses candidate-only or tmux-unproved states.
- AC-10: Every boundary call count is at most one and repeated reports/traces are identical.

### Test Coverage
Implement collector/composition V-13 through V-16, including the reported all-facts fixture: `running_rpiv`, no processes, terminal repeated progress, strict successful PR result, malformed or absent tmux, and divergent remote head.

### Expected Evidence
A complete redacted report proving PR lookup is no longer suppressed, remote divergence is visible, malformed tmux selects `RECONCILIATION_UNKNOWN`, candidate mismatch cannot mutate, and every adapter call count is bounded to one.

## Task T-12: Resume candidate finalization without relaunch or inferred ownership

- **Status:** Completed
- **Complexity:** Large
- **Dependencies:** T-10, T-11
- **Acceptance Criteria:** AC-2, AC-3, AC-8, AC-10
- **Related ADRs:** ADR-260811-prototype-three-recovery-concurrency; ADR-260812-rpiv-integration-completion-contract
- **Related Core-Components:** CORE-COMPONENT-260810-persistence-recovery; CORE-COMPONENT-260811-run-reconciliation-control; CORE-COMPONENT-260811-completion-evidence-reconciliation; CORE-COMPONENT-260811-owned-resource-cleanup

### Description
Permit `resume` to consume only `FINALIZATION_RECOVERY_AVAILABLE`: persist `running_rpiv -> finalizing` event-before-snapshot, keep attempt unchanged, launch no worker/RPIV, and invoke the existing strict finalizer. On interruption, preserve replayable evidence and retry semantics. Refuse malformed tmux, result/remote/PR contradiction, active/unknown process, or ownership ambiguity without transition. Do not release lease or clean resources from the candidate path.

### Acceptance Criteria
- AC-2: Candidate finalization and exact-active reconciliation each launch zero processes.
- AC-3: Resume returns stable recovered/refused outcomes and uses existing completion terminal classifications.
- AC-8: Resume performs no cleanup and no tmux ownership inference.
- AC-10: Faults before/after transition persistence replay deterministically without duplicate finalization transition or launch.

### Test Coverage
Implement V-14 and V-15 orchestration/fault injection. Assert revision/event order, attempt/launch counters, idempotent retry, and blocked no-op behavior.

### Expected Evidence
Ordered event/snapshot trace, zero-launch counters, exact finalization observations, and unchanged resources for every refusal.

## Task T-13: Update rendering, operator guidance, and release metadata to 0.1.2

- **Status:** Completed
- **Complexity:** Medium
- **Dependencies:** T-10, T-11, T-12
- **Acceptance Criteria:** AC-3, AC-8, AC-9
- **Related ADRs:** ADR-260811-prototype-three-recovery-concurrency; ADR-260810-typescript-node-cli
- **Related Core-Components:** CORE-COMPONENT-260806-project-command-interface; CORE-COMPONENT-260811-run-reconciliation-control; CORE-COMPONENT-260811-owned-resource-cleanup; CORE-COMPONENT-260815-package-semver-governance

### Description
Render candidate/result-query authority separately from accepted persisted completion authority in human and JSON output. Document exact operator flow, precedence, no progress authorization, no cleanup inference from absent/malformed tmux, and remediation for divergent remote/PR facts. Assign PATCH `0.1.2` and synchronize package, lock, official assets/manifests/fixtures, packed/install metadata expectations, README current-version and upgrade/reinstall guidance without dependency changes.

### Acceptance Criteria
- AC-3: Human and JSON outputs carry equivalent candidate, boundary, safe-action, remediation, and exit meaning.
- AC-8: Documentation and output explicitly prohibit cleanup from candidate/progress/absent-or-malformed tmux.
- AC-9: Contradictory or unproved PR guidance preserves resources and requires explicit evidence repair/retry.

### Test Coverage
Implement V-16 and V-18 documentation/render/package assertions, packed/install smoke proof, lockfile dependency-diff guard, and `git diff --check`.

### Expected Evidence
Output snapshots, documentation tests, exact `0.1.2` synchronization inventory, pack/install metadata, upgrade confirmation commands, and no dependency churn.

## Task T-14: Add composite incident fixture and run full regression/release proof

- **Status:** Completed
- **Complexity:** Large
- **Dependencies:** T-10, T-11, T-12, T-13
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10
- **Related ADRs:** ADR-260811-prototype-three-recovery-concurrency; ADR-260812-rpiv-integration-completion-contract; ADR-260814-tmux-identity-failure-recovery
- **Related Core-Components:** CORE-COMPONENT-260811-run-reconciliation-control; CORE-COMPONENT-260811-concurrent-run-admission; CORE-COMPONENT-260811-owned-resource-cleanup; CORE-COMPONENT-260814-tmux-identity-diagnostics; CORE-COMPONENT-260815-package-semver-governance; CORE-COMPONENT-260810-development-standards

### Description
Build one reusable incident fixture and matrix over malformed versus absent/exact tmux, matching versus divergent local/remote/PR head, absent/unknown/active worker and RPIV, repeated terminal progress, and strict/invalid result. Repeat normalized outcomes and retain all historical interruption, concurrency, stop, completion, and cleanup suites. Run focused/full direct and harness gates and package proof.

### Acceptance Criteria
- AC-1 through AC-9: Each criterion retains at least one named passing test and implementation evidence.
- AC-10: Repetitions prove deterministic reports, one owner, zero duplicate launch, no collision, one observation per boundary, and zero unauthorized destruction.

### Test Coverage
Run V-13 through V-18, all existing V-1 through V-12 regressions, direct `just verify-focused`, direct authoritative `just verify`, and delegated focused/full harness checks after reading their instructions.

### Expected Evidence
Repeated scenario hashes/traces, full Jest and coverage summary at or above 80%, direct and harness command envelopes, package proof, documentation evidence, AC matrix, clean diff, and implementation commit SHA.
