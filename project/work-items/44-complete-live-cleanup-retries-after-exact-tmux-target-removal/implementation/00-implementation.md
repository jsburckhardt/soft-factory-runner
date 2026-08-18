# Implementation Notes: Issue 44

## Status

Implementation tasks T-1 through T-6 are complete. This record provides implementation evidence for Verify and does not claim final acceptance.

## Completed Tasks

- [x] T-1 — Added typed, strict original-byte pane/window/session missing-target classification with unchanged before/after socket identity and repository-root retry cwd.
- [x] T-2 — Gated absence on exact same-owner/run tmux cleanup progress and resumed only uncompleted lease/lock steps.
- [x] T-3 — Unified confidential human/JSON cleanup eligibility, outcome, completed/remaining categories, refusal, remediation, and exit meaning.
- [x] T-4 — Added bounded adapter matrices, pre-checkpoint refusal, interruption retry, idempotence, retention, overlap, unrelated-resource, confidentiality, and real isolated tmux fixture coverage.
- [x] T-5 — Synchronized current release and operator surfaces at `0.2.1-beta.3`.
- [x] T-6 — Ran direct and harness focused/full gates plus offline dry-run, pack/install, and dependency comparison.

## Acceptance Evidence

- **AC-1:** `src/issue-44-live-cleanup.test.ts` accepts only exact selector-bound `missing_pane`, `missing_window`, and `missing_session` records after unchanged socket identity; `src/reconciliation.ts` converts typed missing evidence to `TMUX_ABSENT` only through `hasExactTmuxCleanupCheckpoint`.
- **AC-2:** `src/recovery-control.test.ts` test “retries only the remaining lease and lock…” starts with tmux/worktree completed, releases lease then lock, returns `CLEANUP_COMPLETED`, and repeats as `CLEANUP_ALREADY_COMPLETED` without another compare-delete.
- **AC-3:** The same retry test byte-compares retained branch, snapshot, events, log, and terminal marker; existing real-adapter cleanup fixture also verifies retained transcript evidence.
- **AC-4:** `src/render.ts` derives eligibility, exit meaning, completed/remaining resource categories, refusal, and remediation from one public categorical projection. Existing cleanup rendering tests scan human/JSON output for socket, selector, cwd, PID, owner/run, and unrelated sentinels.
- **AC-5:** `package.json`, root `package-lock.json`, `src/official-assets.ts`, finite tests, README, docs index, recovery guide, Doctor guide, and asset guide report `0.2.1-beta.3`. `npm pack --dry-run --json` reported beta.3 and 73 files; offline local pack/install reported packed and installed beta.3. Main-relative dependency declarations and non-root lock metadata compared equal.
- **AC-6:** Candidate and diagnostic lifecycle tests now classify pre-checkpoint missing-target evidence as `TMUX_MISSING_TARGET_UNPROVED` with no safe action; adapter categories alone do not authorize absence.
- **AC-7:** `src/issue-44-live-cleanup.test.ts` refuses selector mismatch, wrong case, missing LF, CRLF, extra records, invalid UTF-8, alternate nonzero, stdout data, truncation, and socket replacement as value-free `TMUX_TARGET_OBSERVATION_REFUSED`. Existing exact-target tests retain replacement/mismatch and unavailable-proof refusals.
- **AC-8:** Existing per-step snapshot/event interruption matrices plus started-checkpoint removal-return matrices cover lease and lock failures, safe retries, replacement refusal, final-state convergence, and one destructive operation per resource.
- **AC-9:** Barrier-controlled cleanup/status and cleanup/reconcile tests, publication concurrency tests, and the real isolated fixture complete under their bounded deadlines and preserve unrelated inventories.
- **AC-10:** The real tmux fixture in `src/recovery-control.test.ts` uses private owned/unrelated sockets and remain-on-exit terminal evidence; live post-removal observation now returns exact `missing_pane`, retry uses a stable existing cwd, cleanup retains evidence, repeats idempotently, and teardown kills only fixture-owned servers. The adapter matrix separately proves refusal/confidentiality rows.
- **AC-11:** Direct `just verify-focused` passed 29 suites/659 tests. Direct `just verify` passed lint, formatting, types, 29 suites/659 tests, coverage (89.54% statements, 85.43% branches, 95.88% functions, 91.19% lines), and build. Harness focused/full envelopes were `status: ok`, delegated to the corresponding root recipes, and exited 0.

## Documentation Evidence

- `README.md`: current beta.3 package, local upgrade/reinstall/manifest confirmation, release classification, and retained beta.2 history.
- `docs/README.md`: beta.3 behavior summary, pre-checkpoint refusal, exact categories, remaining-resource retry, and no-publication scope.
- `docs/phase-3-recovery-operations.md`: exact checkpoint/socket gate, stable cwd, refusal matrix, lease/lock retry, retention/idempotence, confidential projections, and deferred non-gating Sparkta handoff.
- `docs/phase-4-repository-doctor.md`: explicit no-impact statement for Doctor behavior.
- `docs/phase-5-official-assets.md`: beta.2-to-beta.3 local pack/install, confirmation, and reconvergence guidance.
- Architecture explanatory documentation was updated during Plan through Decisions 126 and 199–208; implementation stayed within those amended ADR/core-component contracts.
- No API reference or specification change: Runner remains a local CLI with no network API. No configuration/default, data migration, service, container, deployment, dependency, or production-operation change.

## Validation Evidence

- `harness boot --json`: `status: ok`; application exit 0; exact bootstrap signal observed; composed checks exit 0.
- `just verify-focused`: pass; 29 suites, 659 tests.
- `harness checks --focused --json`: `status: ok`, scope `focused`, delegated `just verify-focused`, exit 0.
- `just verify`: pass; lint, format, typecheck, 29 suites/659 tests, coverage above 80%, build, diff check.
- `harness checks --json`: `status: ok`, scope `full`, delegated `just verify`, exit 0.
- `npm pack --dry-run --json`: beta.3 tarball metadata, 73 files.
- Offline local pack/install: `soft-factory-runner-0.2.1-beta.3.tgz`; packed and installed metadata both beta.3; temporary prefix removed.
- Main merge base `b5028bee25cefe925bf1f4548c5dbdaa59eb199d`: dependency declarations unchanged; non-root resolved lock metadata unchanged.

## Harness Friction Records

- `.harness/records/retro/2026-08-18/021-issue-44-rpiv-implementer.md`
- `.harness/records/retro/2026-08-18/022-issue-44-rpiv-research.md`
- `.harness/records/retro/2026-08-18/023-issue-44-rpiv-planner.md`
- `.harness/records/retro/2026-08-18/024-issue-44-rpiv-implementer-socket-fixture.md`
- `.harness/records/retro/2026-08-18/025-issue-44-rpiv-implementer-full-gate.md`

All nonempty coordinator, Research, Plan, and Implement buffers were handled under the read-back-before-clear rule; the coordinator buffer was empty.
