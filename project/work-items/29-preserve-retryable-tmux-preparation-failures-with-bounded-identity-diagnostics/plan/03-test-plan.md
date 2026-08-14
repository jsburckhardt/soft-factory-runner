# Test Plan: Issue #29

All tests are repository-local, deterministic, credential-free, and isolated from Sparkta, live GitHub, live Copilot, ambient tmux resources, and consumer state. Controlled adapters/executables and temporary repositories provide all external facts. Root `just verify-focused` and `just verify` are mandatory direct validation boundaries.

## Test V-1: Exact tmux transport and controlled 3.7b bytes

- **Type:** Unit/live-adapter integration
- **Task:** T-1, T-4
- **Acceptance Criteria:** AC-1, AC-2, AC-9
- **Priority:** Critical

### Setup
Use `createLivePorts` with a byte-aware recording CommandRunner. Queue successful session/name preflight results, creation bytes `40 31 09 25 31 0a`, and observation bytes `40 31 09 25 31 09 2f 74 6d 70 0a`. Use only temporary cwd values and no external executable.

### Steps
1. Create and observe the controlled identity through the live tmux adapter path.
2. Repeat each result without the optional final LF.
3. Assert exact executable/argument arrays, horizontal-tab format strings, cwd, 15-second bound, and one command per adapter step.
4. Feed the resulting identity into the existing successful preparation/reconciliation fixture.

### Expected Result
Both permitted forms return exactly window `@1`, pane `%1`, and cwd `/tmp`; no alternate separator is accepted or required; successful preparation/reconciliation behavior and operation order remain unchanged.

### Expected Evidence
Hex-to-identity table, recorded command calls, exact identity assertions, and successful preparation/reconciliation trace with zero live service access.

## Test V-2: Complete malformed creation and observation matrix

- **Type:** Unit/table-driven live-adapter integration
- **Task:** T-1, T-4
- **Acceptance Criteria:** AC-1, AC-3, AC-9
- **Priority:** Critical

### Setup
Use the recording CommandRunner to return the six issue-specified creation outputs and six issue-specified observation outputs as original byte buffers with exit 0. Add bounded controls for CRLF, two final LFs, invalid UTF-8, empty cwd, embedded tab/LF, and partial identifiers.

### Steps
Invoke create or observe once per case; capture the typed error and any returned identity; inspect command counts.

### Expected Result
Every named case reports `TMUX_IDENTITY_MALFORMED` with malformed/ambiguous meaning, returns no partial identity, and performs no downstream remain-on-exit, pane-PID, worker, or RPIV operation. Nonzero observation is tested separately as absence, not folded into this matrix.

### Expected Evidence
Twelve required rows plus control rows showing input label, phase, exit, error code/message, returned identity `none`, and downstream call count zero.

## Test V-3: Bounded structural diagnostic and confidentiality

- **Type:** Unit/property/security regression
- **Task:** T-1, T-2, T-4
- **Acceptance Criteria:** AC-4, AC-5, AC-9
- **Priority:** Critical

### Setup
Construct original stdout/stderr buffers covering empty output, strict IDs, tabs, CR/LF, backslashes, invalid UTF-8, more than eight records, more than eight fields, more than 32 signature tokens, multibyte values, and unique secret/path/argument/environment/issue/owner/run sentinels.

### Steps
Generate diagnostics for create and observe failures; compare exact pre-decode byte lengths, record/field counts and truncation, token sequence and truncation; serialize errors/snapshots/events/reports/human/JSON/log results; scan every surface for sentinels and raw output fragments.

### Expected Result
The diagnostic contains only schema, phase, integer exit, exact byte counts, capped numeric summaries, truncation flags, and the closed value-free token vocabulary. Empty stdout reports zero records. Every cap is enforced. No prohibited sentinel, raw stderr/stdout, field value, path component, argument, environment value, run identity, hash, byte value, or other-run data appears.

### Expected Evidence
Exact diagnostic JSON fixtures, cap boundary table (8/9 records, 8/9 fields, 32/33 tokens), original-byte versus decoded-length assertions, and zero-match sentinel scan.

## Test V-4: RunSnapshotV5 lifecycle, migration, and one-pass exposure

- **Type:** Persistence/reconciliation/CLI integration
- **Task:** T-2, T-5
- **Acceptance Criteria:** AC-4, AC-5, AC-6, AC-9
- **Priority:** Critical

### Setup
Create strict v1-v5 snapshots and TransitionEventV1/V2 histories in memory/temporary files. Provide a `starting_tmux` v5 fixture and an exact persisted tmux fixture whose one observation returns malformed successful output. Instrument snapshot/event writes and observation counts.

### Steps
1. Load every supported version and reject unsupported/malformed variants.
2. Normalize v4 to v5 through one revisioned event; replay an event-ahead v5 snapshot.
3. Persist create failure, then inspect next status/reconcile JSON and human output.
4. Replace with a later diagnostic, call status without success, return observation absence, then accept valid create/observe identity.
5. For malformed observe, collect once, persist the diagnostic, and return the report without recollection.

### Expected Result
New writes are v5; v1-v5 remain readable under existing limits; TransitionEventV2 carries v5; latest diagnostic retains across rendering/absence, replaces on later failure, and clears only on valid identity. ReconciliationReportV2/status v4 expose common safe facts. Malformed observe performs exactly one tmux observation. No output recommends upgrading tmux.

### Expected Evidence
Version/migration/replay table, serialized revision/event sequence, retain/replace/clear snapshots, observation count `1`, paired human/JSON captures, and no-upgrade-advice scan.

## Test V-5: Exact zero-candidate preparation resume

- **Type:** Orchestration/recovery integration
- **Task:** T-3, T-5
- **Acceptance Criteria:** AC-2, AC-6, AC-8, AC-9
- **Priority:** Critical

### Setup
Use a temporary repository or complete controlled Git fixture with a v5 `starting_tmux` snapshot after a retained create parse failure. Match owner lock, slot lease, branch, worktree path/registration, HEAD to fetched-base advertised SHA, and all three cleanliness flags false. Return zero same-name candidates, then valid creation identity and worker identity. Record all resource/process calls.

### Steps
1. Reconcile and assert only `PREPARATION_RESUME_AVAILABLE`/`resume`.
2. Invoke resume once.
3. Repeat with HEAD mismatch and each staged/unstaged/untracked flag set separately.
4. Inspect transition order and counts for lock, lease, branch, worktree, name observation/recheck, creation, remain-on-exit, worker identify, and RPIV launch.

### Expected Result
The exact fixture performs one new window creation and continues the existing `running_rpiv` preparation transition without replacing ownership or creating branch/worktree/lock/lease/RPIV duplicates. Every HEAD/dirtiness mismatch authorizes no resume and creates nothing.

### Expected Evidence
Safe-action matrix, one successful ordered trace, persisted transition sequence, and exact counts: existing lock/lease/branch/worktree unchanged, one create, one worker identity, zero RPIV launch by the resume command.

## Test V-6: Same-name unknown ownership refusal

- **Type:** Recovery/safety integration
- **Task:** T-3, T-5
- **Acceptance Criteria:** AC-7, AC-9
- **Priority:** Critical

### Setup
Start from the same `starting_tmux` fixture without persisted tmux identity. Configure name-only observation to report one or more same-name windows without returning identities/cwd/process data. Add a race case where reconciliation first sees zero but the immediate pre-create check sees present. Snapshot every owned and tmux/process inventory before invocation.

### Steps
Run reconcile and resume for present-at-reconciliation and appeared-before-create cases; compare snapshots, lock, lease, Git tuple, tmux inventory, workers, and RPIV launch counts before/after.

### Expected Result
Present-at-reconciliation authorizes no resume. Appeared-before-create returns `RESOURCE_OWNERSHIP_UNKNOWN`. Both preserve every resource byte/fact, perform zero window creation and zero worker/RPIV launches, and never inspect or adopt candidate identity, cwd, or process command.

### Expected Evidence
Before/after inventory equality, safe-action/refusal codes, name-only call trace, zero create/worker/RPIV counts, and proof that no candidate detail entered diagnostics or output.

## Test V-7: Observe semantics, LOG_NOT_FOUND, and authorization independence

- **Type:** Reconciliation/logs/CLI matrix
- **Task:** T-2, T-3, T-5
- **Acceptance Criteria:** AC-4, AC-5, AC-8, AC-9
- **Priority:** Critical

### Setup
Prepare fixtures for zero-exit malformed observe, nonzero observe, prior retained diagnostic, exact/unknown/mismatched preparation ownership, no persisted tmux identity, and no retained transcript. Use controlled tmux/process adapters and temporary state only.

### Steps
1. Reconcile malformed zero-exit observe and inspect unknown diagnostic.
2. Reconcile nonzero observe and inspect absence with no new/replaced diagnostic.
3. Invoke logs with diagnostic but no identity/transcript.
4. Build exact, unknown, and mismatched preparation reports and compare decisions/safe actions.

### Expected Result
Malformed successful observe is unknown and retained; nonzero is absence and does not fabricate or replace diagnostic facts. Logs returns bounded `LOG_NOT_FOUND`. Exact preparation permits only `resume`; unknown/mismatch permits none. The diagnostic itself never changes authorization.

### Expected Evidence
Observe outcome table, retained diagnostic before/after comparison, LOG_NOT_FOUND human/JSON output, and decision/safe-action equality with diagnostic present versus absent.

## Test V-8: Application documentation and stale-guidance contract

- **Type:** Documentation regression
- **Task:** T-6
- **Acceptance Criteria:** AC-1, AC-5, AC-6, AC-7, AC-8, AC-9
- **Priority:** High

### Setup
Read README, PRD, docs index, issue-run guide, recovery operations guide, architecture links, troubleshooting/migration sections, justfile, and CLI help through `src/documentation.test.ts`.

### Steps
Assert exact HT/LF/optional-final-LF and identifier language; diagnostic shape/caps/prohibited data/lifetime; v5/report/status migration; zero-candidate retry proof; same-name unknown refusal; one-pass observation; LOG_NOT_FOUND independence; credential-free fixture policy; direct root recipes; no network API/deployment impact. Scan for stale tmux-upgrade advice.

### Expected Result
All affected guidance matches executable contracts and architecture; links resolve; no upgrade recommendation or raw/value-bearing diagnostic example remains; unaffected configuration/API/deployment surfaces are explicitly bounded.

### Expected Evidence
Passing documentation suite, required phrase/link table, and zero-match stale-guidance scan.

## Test V-9: Direct focused validation boundary

- **Type:** Focused quality gate
- **Task:** T-7
- **Acceptance Criteria:** AC-9
- **Priority:** Critical

### Setup
Completed implementation and documentation with controlled fixtures only. Confirm no test configuration references Sparkta, credentials, network endpoints, or ambient tmux resources.

### Steps
Run direct root `just verify-focused` with the Issue #29 relevant suites/arguments supported by the recipe; retain command and `git diff --check` output.

### Expected Result
The root recipe exits 0; all targeted parser, persistence, reconciliation, recovery, CLI, and documentation tests pass without external access; diff check passes.

### Expected Evidence
Exact direct command transcript, suite/test counts, exit 0, fixture-isolation audit, and diff-check result.

## Test V-10: Direct full repository validation boundary

- **Type:** Full quality gate
- **Task:** T-7
- **Acceptance Criteria:** AC-9
- **Priority:** Critical

### Setup
Completed implementation/documentation after V-9, with the root justfile unchanged as command authority and no live credentials or consumer resources.

### Steps
Run direct root `just verify`; retain lint, Prettier, TypeScript, Jest coverage, build, and `git diff --check` output.

### Expected Result
The command exits 0; all suites pass; statements, branches, functions, and lines remain at least 80%; build and diff check pass; no Sparkta or live external access occurs.

### Expected Evidence
Full direct `just verify` transcript, exit 0, suite/test totals, coverage table, build result, diff-check result, and external-access audit.

## Coverage Proof
| AC | Tests | Expected proof |
|---|---|---|
| AC-1 | V-1, V-2, V-8 | Exact accepted transport plus rejected extra/invalid structure and matching docs |
| AC-2 | V-1, V-5 | Exact 3.7b identities and unchanged successful preparation/reconciliation |
| AC-3 | V-2 | Complete required malformed matrix with no partial identity |
| AC-4 | V-3, V-4, V-7 | Required retained fields, exact caps, persistence/report exposure, and observe semantics |
| AC-5 | V-3, V-4, V-7, V-8 | Zero prohibited-data matches and no unsupported upgrade advice |
| AC-6 | V-4, V-5 | Retryable retained state, exact proof, one create, and no duplicate resources |
| AC-7 | V-6, V-8 | Same-name refusal, unchanged inventories, and no adoption |
| AC-8 | V-5, V-7, V-8 | LOG_NOT_FOUND plus exact-only resume authorization |
| AC-9 | V-1 through V-10 | Controlled temporary fixtures and both direct root gates |

Every AC has finite validation and expected inspectable evidence; no test requires credentials, Sparkta, a live consumer, or nondeterministic polling.
