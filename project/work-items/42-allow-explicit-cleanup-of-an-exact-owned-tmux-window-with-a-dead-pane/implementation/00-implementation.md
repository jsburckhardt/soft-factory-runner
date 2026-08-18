# Implementation Notes: Issue 42 exact owned dead-pane cleanup

## Scope and completed tasks

- T-1 through T-7 completed in dependency order.
- Implemented one strict LF-terminated exact-target tmux record with socket/session/window/pane selectors, strict pane-dead flag, conditional empty current cwd for dead panes, original-byte framing bounds, and closed malformed handling.
- Added independently gated exact-dead reconciliation, categorical confidential public views, transcript-first exact cleanup, owner/run-bound per-resource started checkpoints, verified absence, retry continuation, idempotence, replacement refusal, overlap proof, real isolated remain-on-exit proof, and the 0.2.1-beta.2 release surfaces.

## Acceptance evidence

- **AC-1:** `src/tmux-target.ts` and `src/live.ts` parse/observe one complete exact target as `TMUX_EXACT_DEAD`; `src/recovery-control.test.ts` proves only the full inactive lock/lease/clean-worktree/result/process conjunction exposes `explicit_clean`, without `attach`.
- **AC-2:** `IssueRunService.performCleanup` captures and retains the pane transcript before the tmux checkpoint/removal, then verifies tmux, worktree, lease, and lock absence. Guarded cleanup tests assert ordered capture/removal, retained evidence, exact present-to-absent transitions, and successful retained transcript content.
- **AC-3:** Strict parser rows reject invalid flags, framing, UTF-8, cwd state, duplicate records, and selector changes. Dead/live process refusal, dirtiness, ownership mismatch, malformed/unavailable proof, and replacement tests assert zero destructive calls; live/unknown mismatch behavior remains fail-closed.
- **AC-4:** `src/render.ts` projects status, reconcile, clean, attach, and errors through categorical views. Human/JSON sentinel matrices exclude socket paths, session/window/pane IDs, cwd, process IDs, owner/run IDs, and unrelated values. Automatic merged cleanup still has no tmux step and retains tmux evidence.
- **AC-5:** `src/issue-42-repository.test.ts` enumerates package, both root lock values, official asset, and current guidance at `0.2.1-beta.2`; package/install tests cover fixture, packed, installed, and manifest metadata. Merge-base dependency ranges and all non-root lock package metadata equal `17da3705afd6511fa9b6434cfcb48ca7f5edc156`.
- **AC-6:** The strict parser, reconciliation, and guarded cleanup matrices cover exact dead eligible, live/active refusal, checkpoint/completed tmux absence continuation, fully completed idempotence, unproved absence refusal, malformed/unavailable/incomplete/mismatch refusal, and same-name/replacement refusal with categorical outcome/remediation/exit assertions.
- **AC-7:** Post-removal interruption tests for tmux, worktree, lease, and lock persist exact resource checkpoints and converge on retry with each destructive adapter called once. Replacement tests refuse before further mutation. Controlled clean/status and clean/reconcile barriers finish within their bounds and expose a whole target or absence.
- **AC-8:** Cleanup tests split exact owned transitions from unrelated and retained inventories; exact resources become absent while branch, snapshot, events, logs, and unrelated sentinels remain unchanged. Refusal inventories remain unchanged.
- **AC-9:** `src/tmux-context.test.ts` runs the real isolated explicit-socket remain-on-exit scenario twice, waits only for the strict dead fixture barrier, captures `retained-dead-marker`, removes the exact window, reads retained output afterward, compares normalized evidence, and tears down its exact sockets/directories without ambient state, credentials, or network.
- **AC-10:** Harness and direct focused/full root gates passed with 28 suites and 643 tests. Criterion-addressable suites include strict dead records, guarded cleanup/checkpoints/confidentiality, overlaps, live proof, version inventory, dependency equality, package install, and documentation contracts.

## Documentation evidence

- `README.md`: current beta.2 local upgrade/install flow and exact dead-pane lifecycle/authority behavior.
- `docs/README.md`: current release summary, compatibility, and documentation routing.
- `docs/phase-3-recovery-operations.md`: cleanup conjunction, strict dead semantics, transcript/checkpoint ordering, retries, categorical confidentiality, validation, and deferred Sparkta Issue 7 operator handoff.
- `docs/phase-4-repository-doctor.md`: synchronized current release reference; Doctor behavior itself is unchanged.
- `docs/phase-5-official-assets.md`: beta.2 local-only pack/install/reinstall/manifest reconvergence guidance.
- Architecture documentation was amended under Decisions 185-197 in the existing ADR/core-component files. No API specification exists because Runner remains a local short-lived CLI; no configuration default, database/data migration, service, container, or deployment procedure changed. The only external operational action is explicitly deferred and non-gating.

## Validation evidence

- `harness boot --json`: status `ok`; application signal observed; application and composed checks exit 0 (baseline beta.1 orientation).
- `harness checks --focused --json`: final status `ok`, delegated `just verify-focused`, exit 0, 28 suites / 643 tests.
- `just verify-focused`: exit 0, 28 suites / 643 tests.
- `harness checks --json`: final status `ok`, delegated `just verify`, exit 0, all quality stages passed.
- `just verify`: exit 0; lint, format, typecheck, 28 suites / 643 tests with 89.40% statements and 85.48% branches, build, and diff check passed.
- Offline package smoke: dry-run, packed filename/version, installed package, and generated manifest all reported `0.2.1-beta.2`; `npm install --offline` used the local tarball and the temporary prefix/consumer were removed.

## Harness friction records

- `.harness/records/retro/2026-08-18/013-issue-42-rpiv-planner.md`
- `.harness/records/retro/2026-08-18/014-issue-42-rpiv-research.md`
- `.harness/records/retro/2026-08-18/015-issue-42-rpiv-implementer.md`

Implementation evidence is complete for Verify review; final acceptance remains owned by Verify.
