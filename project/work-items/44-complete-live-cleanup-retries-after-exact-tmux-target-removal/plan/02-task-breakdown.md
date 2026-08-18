# Task Breakdown: Complete live cleanup retries after exact tmux target removal

## Task T-1: Add bounded live tmux missing-target classification

- **Status:** Completed
- **Complexity:** High
- **Dependencies:** None
- **Acceptance Criteria:** AC-1, AC-6, AC-7, AC-10
- **Related ADRs:** ADR-260814-tmux-identity-failure-recovery; ADR-260817-invoking-tmux-context-targeting
- **Related Core-Components:** CORE-COMPONENT-260814-tmux-identity-diagnostics; CORE-COMPONENT-260817-exact-tmux-context-ownership; CORE-COMPONENT-260810-subprocess-execution

### Description
Replace `LiveTmuxPort.observe` broad nonzero-to-null behavior with a typed original-byte result. Accept only complete, untruncated, zero-stdout, single-LF selector-bound `can't find pane/window/session` records; compare socket type/device/inode before and after. Carry all other exits, malformed/truncated streams, spawn/timeouts, selector mismatches, and identity loss as value-free non-authorizing categories. Add an observation execution cwd supplied from the existing repository root so retry does not spawn from the removed worktree.

### Acceptance Criteria
- AC-1: The three bounded categories are distinguishable and identity-stable.
- AC-6: A category alone does not claim authorized absence.
- AC-7: Every nonaccepted/error/replacement row remains refusal evidence.
- AC-10: The real adapter exposes the actual post-removal category without ambient mutation.

### Test Coverage
Add adapter-level original-byte tables for all accepted categories and strict near misses, stdout/stderr truncation, extra records, malformed UTF-8, selector mismatch, socket loss/replacement, nonzero alternatives, spawn failure, and timeout. Assert one command, a 15-second bound, explicit `-S`, repository-root cwd, complete stream draining, and no raw-value persistence/rendering.

### Expected Evidence
- Typed category table with exact accepted/rejected row counts.
- Recorded command arguments, cwd, timeout, byte counts, and before/after socket identity outcomes.
- Sentinel scan proving no raw stderr, target, path, PID, or unrelated value escapes.

## Task T-2: Gate absence and resume exact remaining cleanup

- **Status:** Completed
- **Complexity:** High
- **Dependencies:** T-1
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-6, AC-7, AC-8, AC-9, AC-10
- **Related ADRs:** ADR-260811-prototype-three-recovery-concurrency; ADR-260814-tmux-identity-failure-recovery; ADR-260817-invoking-tmux-context-targeting
- **Related Core-Components:** CORE-COMPONENT-260811-owned-resource-cleanup; CORE-COMPONENT-260811-run-reconciliation-control; CORE-COMPONENT-260810-persistence-recovery; CORE-COMPONENT-260817-exact-tmux-context-ownership

### Description
Extend the tmux observation/reconciliation contract so a bounded missing-target category becomes `TMUX_ABSENT` only when `CleanupFactsV1` belongs to the current owner/run and contains the exact target-bound tmux started or completed checkpoint, with unchanged socket identity. Preserve unknown/mismatch precedence otherwise. From tmux/worktree completed and lease/lock remaining, skip those completed steps, compare-delete the exact lease then lock, persist each event-before-snapshot transition, and finish with no remaining steps.

### Acceptance Criteria
- AC-1: Checkpoint plus unchanged identity is the sole accepted post-removal absence path.
- AC-2: Retry releases only lease and lock, then idempotently reports completion.
- AC-3: Evidence resources remain retained throughout.
- AC-6/AC-7: Unproved and uncertain rows mutate nothing.
- AC-8: Remaining-step failures preserve safe retry truth and at-most-once mutation.
- AC-9/AC-10: Shared report and real adapter converge under overlap and retry.

### Test Coverage
Add pure reconciliation checkpoint matrices, partial cleanup snapshots/events, exact resource identity mismatch/replacement rows, lease/lock compare-delete failures, event-ahead and snapshot-write interruptions, retries, repeated clean, and barrier-controlled shared-report calls.

### Expected Evidence
- Snapshot/event excerpts showing exact checkpoint identity and ordered completed/remaining steps.
- Mutation trace proving zero repeated tmux/worktree removal and one lease/lock compare-delete each.
- Refusal rows with byte-identical owned and unrelated inventories.

## Task T-3: Preserve equivalent confidential cleanup output

- **Status:** Completed
- **Complexity:** Medium
- **Dependencies:** T-2
- **Acceptance Criteria:** AC-4, AC-6, AC-7, AC-8
- **Related ADRs:** ADR-260811-prototype-three-recovery-concurrency; ADR-260814-tmux-identity-failure-recovery
- **Related Core-Components:** CORE-COMPONENT-260810-structured-events; CORE-COMPONENT-260810-error-handling; CORE-COMPONENT-260811-run-reconciliation-control; CORE-COMPONENT-260811-owned-resource-cleanup; CORE-COMPONENT-260817-exact-tmux-context-ownership

### Description
Project retry eligibility, outcome, exit meaning, completed/remaining categories, refusal, and remediation from one public categorical view. Include no missing-target raw bytes or persisted/observed private identities. Ensure partial lease/lock failures and pre-checkpoint or uncertain refusals render the same semantics in human and JSON forms.

### Acceptance Criteria
- AC-4: Human and JSON forms agree on every named field and reveal no forbidden values.
- AC-6/AC-7: Refusal and zero-mutation meaning are explicit and consistent.
- AC-8: Partial results truthfully identify completed and remaining resources plus retry remediation.

### Test Coverage
Parse JSON, normalize human output, compare semantic fields, and scan both outputs for socket paths, tmux IDs, cwd, PIDs, raw command output, persisted private objects, and unrelated sentinels across success, already-complete, partial, and every refusal family.

### Expected Evidence
- Human/JSON equivalence table for success, idempotence, partial, and refusal.
- Empty forbidden-sentinel scan with stable exit-code assertions.

## Task T-4: Add matrices, overlaps, and real-adapter cleanup retry proof

- **Status:** Completed
- **Complexity:** High
- **Dependencies:** T-1, T-2, T-3
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11
- **Related ADRs:** ADR-260811-prototype-three-recovery-concurrency; ADR-260814-tmux-identity-failure-recovery; ADR-260817-invoking-tmux-context-targeting
- **Related Core-Components:** CORE-COMPONENT-260810-development-standards; CORE-COMPONENT-260811-owned-resource-cleanup; CORE-COMPONENT-260811-run-reconciliation-control; CORE-COMPONENT-260814-tmux-identity-diagnostics; CORE-COMPONENT-260817-exact-tmux-context-ownership

### Description
Expand controlled fixtures into finite pre-clean, accepted-category, refusal, replacement, malformed/truncated, and nonaccepted-error matrices. Add lease/lock interruption retries and three overlap scenarios. Build a repository-local real tmux fixture that creates an isolated custom socket and remain-on-exit dead window, captures terminal evidence, removes the exact target/worktree, persists the supplied partial checkpoint state, observes the real missing-target response through the live adapter, releases only lease/lock, repeats idempotently, and tears down only fixture-owned resources.

### Acceptance Criteria
- AC-1/AC-2/AC-3: The full real path proves accepted absence, remaining release, and retention.
- AC-4/AC-6/AC-7: Matrices prove confidentiality and zero mutation for every refusal family.
- AC-8: Failure/retry rows converge with at-most-once mutation.
- AC-9: All overlaps settle in under 30 seconds with whole observations and unchanged unrelated inventories.
- AC-10/AC-11: Evidence is repository-local, inspectable, isolated, and runnable through validation gates.

### Test Coverage
Use deterministic fakes for exhaustive rows and real local tmux only for the isolated accepted cleanup/retry path. Snapshot finite inventories for owned/unrelated tmux, worktrees, leases, locks, runs, replacements, branches, snapshots, events, and logs before/after. Use barriers rather than sleeps for overlaps and enforce a 30-second outer bound.

### Expected Evidence
- Named matrix output for every accepted and rejected category.
- Real adapter command/result category and cleanup transition trace.
- Before/after byte inventories, retained terminal marker, idempotence trace, overlap durations, and exact teardown proof.

## Task T-5: Synchronize beta.3 release surfaces and operations guidance

- **Status:** Completed
- **Complexity:** Medium
- **Dependencies:** T-1, T-2, T-3
- **Acceptance Criteria:** AC-5, AC-11
- **Related ADRs:** ADR-260810-typescript-node-cli; ADR-260814-tmux-identity-failure-recovery
- **Related Core-Components:** CORE-COMPONENT-260815-package-semver-governance; CORE-COMPONENT-260812-official-asset-installation-contract; CORE-COMPONENT-260806-rpiv-stage-contract

### Description
Set the finite current-release surfaces to `0.2.1-beta.3`: package/root lock metadata, official asset version, version fixtures/assertions, README/docs index, release and cleanup operations guidance. Document exact checkpoint-gated categories, refusal/remediation, partial lease/lock retry, retention, idempotence, overlap expectations, and local pack/install commands. Keep Sparkta recovery visible but explicitly deferred, manual, redacted, non-gating, and prohibited until repository verification is accepted.

### Acceptance Criteria
- AC-5: Every governed surface reports exactly beta.3 with no publication or production access and no dependency churn.
- AC-11: Documentation and finite inventory are exercised by repository tests and full validation.

### Test Coverage
Update repository/documentation tests to enumerate rather than broad-search release surfaces. Assert local tarball filename/metadata, clean-prefix installed metadata, generated official manifest version, old prerelease history, exact upgrade/reinstall guidance, cleanup behavior, and deferred Sparkta wording.

### Expected Evidence
- Finite path-to-version inventory containing only `0.2.1-beta.3` for current surfaces.
- Documentation assertions and local package/manifest metadata.
- Main-relative dependency declarations and third-party lock metadata equality report.

## Task T-6: Run full gates and assemble acceptance evidence

- **Status:** Completed
- **Complexity:** Medium
- **Dependencies:** T-4, T-5
- **Acceptance Criteria:** AC-5, AC-11
- **Related ADRs:** ADR-260811-engineering-harness-surface; ADR-260814-tmux-identity-failure-recovery
- **Related Core-Components:** CORE-COMPONENT-260806-project-command-interface; CORE-COMPONENT-260806-rpiv-stage-contract; CORE-COMPONENT-260811-engineering-harness-interface; CORE-COMPONENT-260815-package-semver-governance

### Description
Run focused tests while implementing, then direct root full validation. Exercise local `npm pack --dry-run --json`, temporary pack and clean-prefix install without registry publication/network/production access, dependency comparison against the issue-start main merge base, and an AC-indexed evidence review. Run harness checks only after reading the checks briefing; they delegate to the root recipes and do not replace them.

### Acceptance Criteria
- AC-5: Package and dependency proof is finite and inspectable.
- AC-11: Focused and full commands pass and every requested evidence family maps to AC-1 through AC-11.

### Test Coverage
Run targeted Jest paths for adapter/reconciliation/recovery/docs/package behavior, `just verify-focused`, `just verify`, package dry-run/pack/install checks, and optional delegating harness checks. Fail handoff on any uncovered AC, changed dependency metadata, stale release value, leaked sentinel, residual fixture resource, or nonzero gate.

### Expected Evidence
- Successful command envelopes/logs with test counts and coverage.
- Packed tarball and installed package metadata plus package file inventory.
- Dependency diff report and AC-1..AC-11 evidence index.
