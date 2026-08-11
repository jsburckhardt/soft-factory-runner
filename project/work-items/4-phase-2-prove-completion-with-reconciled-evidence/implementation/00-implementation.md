# Implementation Evidence: Issue #4 Completion-Proof Correction

## Correction scope and completed tasks

This correction is built on existing implementation commit `002b0f8f5bb6604038cf5aa6160cd36727c70a4e` and includes the valid pending Plan and architecture correction. It does not amend the existing commit.

- T-6 complete: completion remote SHA now comes only from one post-exit `git ls-remote --refs <selected-remote> refs/heads/<issue-branch>` invocation from the repository root, with executable and argument array, `shell: false`, and a 15,000 ms bound. Readiness `trackingSha` remains cache-based and unchanged.
- T-7 complete: deterministic adapter cases cover exact invocation, bounds, valid, missing, failed, timed-out, malformed, truncated, duplicate, and wrong-ref responses. A temporary bare-remote fixture proves stale cache SHA A versus actual remote SHA B, failed reconciliation, persisted evidence, and a matching authoritative control.
- T-8 complete: README, operator guidance, and executable documentation assertions now identify the authoritative source and distinguish incomplete proof from valid divergence.
- T-3, T-4, and T-5 are recorded as complete with their T-6, T-7, and T-8 corrections. T-1 and T-2 remain preserved.

Task statuses are recorded in `plan/02-task-breakdown.md`. This correction preserves the previously passing AC-1, AC-2, AC-3, AC-5, and all existing behavior.

## Acceptance evidence

### AC-1

Preserved: `AgentResultV1` still carries issue, outcome, branch, head SHA, pull request, acceptance results, validations, and completion time. The owned artifact parser and existing artifact fixtures remain green in the 88-test suite.

### AC-2

Preserved: versioned event-first persistence and atomic snapshot replacement remain unchanged. The stale-cache fixture additionally inspects the terminal JSONL event and v2 snapshot, proving a divergent remote never writes `COMPLETION_PROVED`.

### AC-3

Preserved: completed, failed, blocked, cancelled, and interrupted remain explicit terminal states and existing persistence/rendering tests remain green.

### AC-4

`src/live.ts` now executes completion remote proof once as executable `git` with arguments `["ls-remote", "--refs", selectedRemote, "refs/heads/<issue-branch>"]`, repository-root cwd, `shell: false`, and timeout `15_000`. It accepts exactly one full-SHA/exact-ref row. Zero rows return missing proof; command failure, timeout, malformed/truncated SHA, duplicate rows, and wrong refs throw `COMPLETION_PROOF_INCOMPLETE`, which orchestration persists as interrupted. The orchestration trace asserts the one remote observation occurs after the Copilot process exits.

The successful authoritative control in `src/integration.test.ts` completes only after local result, local HEAD, actual remote advertisement, and PR SHA all equal SHA B.

### AC-5

Preserved: zero-exit missing, malformed, and unsupported artifacts remain interrupted and never request completion Git proof or produce completed.

### AC-6

`src/integration.test.ts` leaves `refs/remotes/origin/feat/4-proof` at SHA A while a second repository advances the bare remote branch to SHA B. The production live adapter observes B. Normal worker finalization with result/local/PR/cache SHA A persists failed with `RESULT_REMOTE_SHA_MISMATCH`; the event contains that code and excludes `COMPLETION_PROVED`. `src/orchestration.test.ts` independently proves valid remote divergence is failed while remote-query incompleteness is interrupted with `COMPLETION_PROOF_INCOMPLETE`.

### AC-7

The named temporary-repository fixture deterministically records cache A, actual remote B, adapter-observed B, a failed mismatch snapshot/event, unchanged stale cache, and a matching authoritative B control that completes. The adapter matrix separately covers exact command construction and every required incomplete-output class. Existing success and false-completion fixtures remain green.

## Documentation evidence

- `README.md` names the exact post-exit authoritative command, repository-root/15-second boundary, prohibition on completion use of `refs/remotes/...`, and incomplete-versus-divergent classifications.
- `docs/phase-1-issue-run.md` documents executable/argument-array/no-shell behavior, one record requirement, no fetch/poll/retry, readiness tracking separation, all incomplete cases, `RESULT_REMOTE_SHA_MISMATCH`, and the SHA A/SHA B fixture plus matching control.
- `src/documentation.test.ts` requires the exact command and all classifications while rejecting the stale tracking-ref freshness claim.
- Architecture explanation was corrected in `CORE-COMPONENT-260811-completion-evidence-reconciliation.md` and Decision Log decision 63; the corrected action plan, task breakdown, and test plan are included.
- No API, configuration, migration, deployment, or additional runbook contract changed. The root `justfile` remains authoritative and unchanged.

## Validation evidence

### Orientation

- `harness instructions`, `.harness/engineering-harness.md`, and boot/check/commit briefings were read before product work.
- `harness boot --json`: status `ok`; application exit 0; exact bootstrap signal observed; composed full checks status `ok`, exit 0. Baseline before correction was 5 suites and 76 tests.
- `just --list`: exit 0 and exposes `verify-focused` and `verify`.

### Focused

- T-6 direct `just verify-focused`: exit 0; 5 suites and 86 tests passed; diff check passed.
- T-7 direct `just verify-focused`: exit 0; 5 suites and 87 tests passed; diff check passed.
- T-8 direct `just verify-focused`: exit 0; 5 suites and 88 tests passed; diff check passed.
- Final `harness checks --focused --json`: status `ok`, scope `focused`, delegated command `just verify-focused`, exit code 0; 5 suites and 89 tests passed.
- Final direct `just verify-focused`: exit 0; 5 suites and 89 tests passed; diff check passed.

### Full

- First direct `just verify`: failed at authoritative `format-check` because `src/integration.test.ts` required Prettier normalization; the file was formatted and validation retried.
- Second direct `just verify`: reached type-check and failed because the injected `CommandRunner` did not yet expose inherited execution needed by live tmux composition; the interface and recorder were aligned, focused validation passed, and full validation was retried.
- A later exact-SHA tightening rerun found formatting changes in the parser and new test case; both files were normalized before the final successful retry.
- Final direct `just verify`: exit 0; lint, format-check, strict type-check, 5 suites/89 tests, coverage, build, and diff check all passed.
- Final `harness checks --json`: status `ok`, scope `full`, delegated command `just verify`, exit code 0; all full stages passed with 5 suites/89 tests.
- Separate `git diff --check`: exit code 0.

### Test totals and coverage

Final Jest total: 5 suites, 89 tests, 0 snapshots. Global coverage: statements 92.32%, branches 86.00%, functions 98.92%, lines 93.85%. Every metric exceeds the 80% architecture threshold.

## RPIV friction drain and read-back

All required JSON envelopes returned status `ok` with exit code 0.

- Coordinator `rpiv`: 0 pending observations; post-drain list empty.
- Research `rpiv-research`: 0 pending observations; post-drain list empty.
- Plan correction `rpiv-planner`: 3 observations persisted to `.harness/records/retro/2026-08-11/017-issue-4-rpiv-planner-correction.md`. Durable read-back confirmed schema version 1.2, matching plan and agent, and all INS-001/DL-001/DL-002 entries before clear. Clear count was 3; post-clear list empty.
- Implement correction `rpiv-implementer`: 6 observations persisted to `.harness/records/retro/2026-08-11/016-issue-4-rpiv-implementer-correction.md`. Durable read-back confirmed schema version 1.2, matching plan and agent, and all DL-001 through DL-006 entries before clear. Clear count was 6. Two later exact-SHA/formatting retries were persisted separately to `.harness/records/retro/2026-08-11/018-issue-4-rpiv-implementer-final-correction.md`; durable read-back confirmed schema version 1.2, matching plan/agent, and both DL-001/DL-002 entries before clear count 2. Final post-clear list was empty.
- Verifier `rpiv-verifier`: deliberately untouched. Its three failed-verification observations DL-001, DL-002, and CONF-001 remain pending for the next Verify closeout.

The three generated correction retro records are included in the correction commit. Attribution delivery is not preclaimed here; the measured `harness commit` outcome is reported in the Implement handoff.

## Changed surfaces

Product adapter: `src/live.ts`. Deterministic tests: `src/integration.test.ts`, `src/orchestration.test.ts`, and `src/documentation.test.ts`. Application documentation: `README.md` and `docs/phase-1-issue-run.md`. Plan/architecture: corrected Issue #4 plan artifacts, completion core-component, and decision 63. Evidence: this implementation record and the three correction retro records.

This record provides Implement-stage evidence only. Final acceptance remains owned by Verify.
