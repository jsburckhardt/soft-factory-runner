# Implementation Notes: Reload Current Run State After Copilot Exits

## Issue and release

- GitHub Issue: #34
- Work item: `34-reload-current-run-state-after-copilot-exits`
- Branch: `fix/34-reload-current-run-state-after-copilot-exits`
- Change class: backward-compatible defect correction
- Release: PATCH `0.1.2` from `0.1.1`
- Architecture: implementation follows updated ADR-260811 and the run-reconciliation/completion core-components; no architecture divergence occurred.

## Completed tasks

- [x] T-1 — Added `PostWaitRefusalReasonV1`, stable `POST_WAIT_STATE_REFUSED`, exact pure identity/current-state classification, terminal classification, and safe typed causes.
- [x] T-2 — Reloaded strict current state after wait, derived finalization/failure from that revision, isolated refusal from launch failure fallback, and retained the store revision guard.
- [x] T-3 — Added bounded held-wait zero/nonzero, identity matrix, missing/invalid, terminal idempotence, complete-history, evidence-preservation, and second-advance race coverage.
- [x] T-4 — Updated user/operator documentation and synchronized governed package surfaces to `0.1.2` without dependency churn.
- [x] T-5 — Ran focused/full harness and direct root validation, reviewed the diff, drained RPIV friction with durable read-back, and prepared the committed handoff.

## Acceptance evidence

- **AC-1:** `src/orchestrator.ts` awaits once, then `handlePostWait` performs `RunStore.load`; `src/post-wait.ts` requires exact run, owner, complete worker, and exact awaited RPIV identities before mutation. `post-wait.test.ts` varies every compound identity field.
- **AC-2:** `Issue 34 current post-wait state handling` covers zero exit to `completed` and exit 9 to `failed`; `expectContiguousHistory` proves unique prior/resulting revisions and latest event/snapshot equality.
- **AC-3:** Both held-wait rows advance all five RPIV phases and retain a malformed-tmux diagnostic while pending, then deep-compare progress/diagnostic facts and exact immutable result bytes after handling.
- **AC-4:** Four identity rows plus missing/invalid reload rows assert `POST_WAIT_STATE_REFUSED`, closed reasons, unchanged snapshot/event bytes where present, and exactly one launch. `renderError` proves stable JSON and human rendering without raw causes.
- **AC-5:** The deterministic second-read barrier advances through another `RunStore`; the stale save returns `state_advanced` with safe `STATE_HISTORY_INVALID` cause while exact newer snapshot/events remain unchanged.
- **AC-6:** A concurrent exact terminal transition is returned byte-for-byte after wait with unchanged event/snapshot bytes and one original launch; classifier coverage includes all five terminal states without requiring a cleared RPIV identity.
- **AC-7:** Named held-zero test publishes research, plan, implement, verify, terminal progress and retained diagnostic before releasing exit 0; it proves completed state, contiguous history, evidence equality, one launch, and no result overwrite.
- **AC-8:** Named held-nonzero test uses the same bounded progression, releases exit 9, and proves failed state/exit history, contiguous history, unchanged result/progress/diagnostic evidence, and one launch.
- **AC-9:** Parameterized run/owner/worker/RPIV mutation rows prove exact refusal reasons and unchanged newer bytes; the reload/save barrier proves `state_advanced` and no stale/fallback event.

## Documentation evidence

- `README.md`: current post-wait semantics, refusal/idempotence/evidence behavior, release `0.1.2`, local upgrade/reinstall and manifest confirmation, and explicit API/configuration/schema/data/deployment no-impact statement.
- `docs/phase-1-issue-run.md`: reload timing, full identity gate, latest-revision zero/nonzero behavior, closed refusal vocabulary, operator remediation, terminal no-op, deterministic fixtures, and migration/no-impact statement.
- `docs/phase-3-recovery-operations.md`: post-wait current-state guard, store race behavior, troubleshooting, and evidence-preserving retry guidance.
- `docs/README.md` and `docs/phase-5-official-assets.md`: current release and exact `0.1.1` to `0.1.2` local package/asset upgrade path.
- `src/documentation.test.ts`: executable assertions for post-wait terms, no-impact scope, and release guidance.
- API/configuration/migration/operations assessment: no network API/spec, configuration key/default, persisted schema, database/data, service, container, or deployment procedure changed; existing v5 state requires no migration. Runtime operator guidance changed and is documented above.
- Architecture documentation: Plan-updated ADR, decision-log records 163-167, and both affected core-components are included unchanged by Implement because implementation remained within their contracts.

## SemVer evidence

- `package.json`, top-level/root `package-lock.json`, and `OFFICIAL_ASSET_VERSION` are exactly `0.1.2`.
- Package and installation fixtures assert `0.1.2`; focused/full tests exercise dry-run pack, temporary pack/install metadata, and generated manifest version.
- `package-lock.json` changes only the two Runner root version values; third-party dependency entries/ranges did not change.
- README/docs identify `0.1.2` and provide exact local upgrade, reinstall, package metadata confirmation, and official-asset reconvergence commands.

## Validation evidence

### Focused

- `harness checks --focused --json`: final envelope `status: ok`, scope `focused`, delegated command `just verify-focused`, exit code 0; 24 suites and 592 tests passed.
- `just verify-focused`: 24 suites and 592 tests passed; `git diff --check` passed.
- Earlier task-boundary focused passes also passed after T-1 and T-2/T-3 (580 and 590 tests respectively).

### Full

- Initial `harness checks --json` exposed four formatting failures; files were formatted and the retry succeeded. This concrete retry is retained in the Implement retro.
- Final `harness checks --json`: envelope `status: ok`, scope `full`, delegated command `just verify`, exit code 0; 24 suites and 592 tests passed.
- Final direct `just verify`: lint, Prettier check, strict type-check, 24 suites/592 tests, coverage, build, and `git diff --check` passed.
- Coverage: statements 89.07%, branches 85.11%, functions 95.70%, lines 90.69%.

## Harness friction records

- `.harness/records/retro/2026-08-16/001-issue-34-rpiv-planner-post-wait-plan.md`
- `.harness/records/retro/2026-08-16/002-issue-34-rpiv-implementer.md`
- `.harness/records/retro/2026-08-16/003-issue-34-rpiv-research.md`

Coordinator and Plan buffers were empty at final drain. Research (4 entries) and Implement (6 entries) records were read back with schema 1.2, matching plan/agent, every pending observation, and `disposition: kept` before successful JSON clears. Final acceptance remains owned by Verify.
