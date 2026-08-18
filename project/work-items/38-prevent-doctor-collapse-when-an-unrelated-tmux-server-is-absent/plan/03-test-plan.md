# Test Plan: Issue #38

## Test V1: Architecture amendment consistency

- **Type:** Static architecture validation
- **Task:** T1, T2
- **Acceptance Criteria:** AC-1, AC-4
- **Priority:** Critical

### Setup
Load the amended exact-tmux component, every relevant ADR/core-component, and Decision Log decisions 180-182.

### Steps
1. Verify the component ID, status, title, and creation date are unchanged.
2. Verify explicit absence, genuine-failure containment, stream draining, 2,000 ms, 65,536-byte, and 1,024-record rules.
3. Verify decisions 180-182 are imperative, actionable, sourced, dated, and consistent with the amendment.
4. Confirm no new ADR or core-component exists and no unrelated architecture file changed.

### Expected Result
The in-place amendment closes the previously implicit inventory contract without changing accepted architecture identity or introducing a new artifact.

### Expected Evidence
Architecture diff, stable metadata check, and Decision Log rows 180-182.

## Test V2: Bounded inventory adapter matrix

- **Type:** Unit and fault-injection validation
- **Task:** T1
- **Acceptance Criteria:** AC-1, AC-4
- **Priority:** Critical

### Setup
Use injected command, filesystem identity, clock, and stream seams. Prepare one absent socket and existing selected sockets for each genuine failure.

### Steps
1. Run absence, 2,001 ms timeout, nonzero exit, malformed output, 65,537-byte, 1,025-record, `EACCES`, post-query identity-loss, and device/inode-change rows.
2. Assert absence invokes no tmux command and returns stable empty inventory.
3. Assert every other row returns typed `unavailable-proof` without raw values.
4. Assert one explicit `-S` attempt, `shell: false`, 2,000 ms, continued draining/counting, retained stdout at most 65,536 bytes, and accepted records at most 1,024.

### Expected Result
Only complete absence is unchanged inventory; every genuine failure is bounded, typed, value-free, and cannot create or target an absent server.

### Expected Evidence
Nine-row result/command matrix, retained-versus-total byte counters, timeout/cancellation trace, and sentinel scan.

## Test V3: Doctor preservation and human/JSON parity

- **Type:** Service and rendering integration
- **Task:** T2, T3
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-6
- **Priority:** Critical

### Setup
Inject controlled observations for `owner/repo`, `main`, successful git/gh/tmux/node/Copilot, successful GitHub/Copilot authentication, and deterministic compatibility/runtime outcomes.

### Steps
1. Run the valid custom-socket plus absent-default composition.
2. Run every genuine inventory failure through `DoctorService`, not only the low-level adapter.
3. Assert repository facts, 24 exact ordered checks, seven named passes, and only `command.tmux` targeting failure where applicable.
4. Normalize human output and compare it with JSON for facts, readiness, checks, and evidence meaning.
5. Repeat the successful controlled run and deep-compare complete results.

### Expected Result
Expected targeting failures never reach generic all-check collapse; core success and both render modes preserve the contract deterministically.

### Expected Evidence
Ordered result snapshots, seven-pass table, no-generic-collapse assertion, normalized mode equality, and two-run deep equality.

## Test V4: Invoking-context refusal and confidentiality matrix

- **Type:** Contract and security regression
- **Task:** T2, T3
- **Acceptance Criteria:** AC-3, AC-4, AC-5
- **Priority:** Critical

### Setup
Supply unique sentinel values in partial evidence, non-absolute tuple, absent selected socket, two-record response, and contradictory session/pane response.

### Steps
1. Run each row through full Doctor human and JSON paths.
2. Assert reasons respectively equal `partial-evidence`, `malformed-evidence`, `stale-server`, `ambiguous-session`, and `contradictory-target`.
3. Assert refusal occurs before mutation and all completed non-tmux observations remain unchanged.
4. Scan output, results, errors, traces, and retained artifacts for every sentinel, raw inventory, selector, identity, tuple, PID, session/window/pane name, and cwd.

### Expected Result
Existing machine classifications remain stable, no mutation occurs, and no confidential value crosses the result boundary.

### Expected Evidence
Five-row reason/mutation table and zero-match sentinel scan for both render modes.

## Test V5: Repository-local isolated real custom-server proof

- **Type:** Live-equivalent local integration
- **Task:** T3
- **Acceptance Criteria:** AC-1, AC-2, AC-6, AC-7
- **Priority:** Critical

### Setup
Create one isolated real custom tmux server and session in a temporary root. Set a dedicated default-server location and prove its socket/server absent. Use only controlled local command/auth adapters; install no credentials and prohibit network.

### Steps
1. Capture selected custom inventory and default absence before Doctor.
2. Run Doctor from valid invoking evidence twice with identical controlled inputs.
3. Capture both inventories after each run and tripwire any command against the absent default selector.
4. Assert `owner/repo`, `main`, seven named passes, ordered 24 checks, no generic all-check failure, equal runs, unchanged custom inventory, and default absence.
5. Kill only the owned custom server and remove the temporary tree in unconditional cleanup.

### Expected Result
The reported production composition succeeds locally and deterministically without creating/contacting the unrelated server, credentials, network, Sparkta, or ambient tmux.

### Expected Evidence
Before/mid/after inventory facts, absent-default tripwire count zero, equal Doctor results, no-network/no-credential proof, and exact cleanup report.

## Test V6: Documentation, version, and local package proof

- **Type:** Release and packaging validation
- **Task:** T4, T5
- **Acceptance Criteria:** AC-8, AC-9
- **Priority:** Critical

### Setup
Record the issue-base commit without fetching. Complete source/docs/version updates. Use temporary local package and installation directories.

### Steps
1. Run documentation and version-consistency tests for `0.2.1-beta.0` and required Doctor guidance.
2. Compare package dependency objects and lock dependency metadata with the issue base; permit only governed root package version changes.
3. Run `npm pack --dry-run --json`, build one local tarball, and inspect tarball package metadata.
4. Install the tarball into a clean prefix with `npm install --offline --ignore-scripts --no-audit --no-fund --omit=dev --prefix <temp> <tarball>`.
5. Inspect locally installed `package.json`, official catalog output, generated `.agents/manifest.json`, repeat convergence, and package file inventory.
6. Confirm the executed-command record contains no `npm publish`, registry URL, fetch, or network command.

### Expected Result
All governed, packed, and installed surfaces agree at `0.2.1-beta.0`; dependency metadata is unchanged; package proof is local and publication-free.

### Expected Evidence
Version matrix, dependency no-churn diff, dry-run JSON, tar metadata, installed metadata, generated manifest excerpt, repeat no-op, and command audit.

## Test V7: Direct root and harness validation gates

- **Type:** Repository quality gate
- **Task:** T1, T2, T3, T4, T5
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10
- **Priority:** Critical

### Setup
Complete implementation, package proof, documentation, and AC-indexed Implement evidence. Read `harness instructions checks --json` before harness checks.

### Steps
1. Run `just verify-focused` directly and retain complete output/exit status.
2. Run `harness checks --focused --json`; verify delegated command and focused scope.
3. Run `just verify` directly and retain complete output/exit status.
4. Run `harness checks --json`; verify delegated command and full scope.
5. Run `git diff --check` and validate the AC-1..AC-10 criterion-to-task-to-test-to-evidence index.

### Expected Result
Both direct recipes and both harness delegates exit successfully. Harness evidence supplements, never replaces, direct RPIV boundary proof; every AC has finite inspectable evidence.

### Expected Evidence
Four exit-0 transcripts/envelopes, diff-check output, exact changed paths, and complete AC evidence matrix.

## Test V8: Sparkta visible post-package and Issue #7 operational acceptance

- **Type:** Deferred external beta acceptance
- **Task:** T6
- **Acceptance Criteria:** AC-7, AC-9 (supplementary only)
- **Priority:** Post-RPIV beta gate

### Setup
Begin only after repository RPIV Implement and Verify accept AC-1 through AC-10. Use the exact locally packed beta tarball; do not access a registry or network. Prepare Sparkta custom tmux context and a visible right-hand pane.

### Steps
1. Confirm locally installed package metadata is `0.2.1-beta.0`.
2. In the visible right pane, prove default absence, run Doctor, and prove custom inventory unchanged/default absent afterward using value-free facts.
3. Reconverge the package-coupled official asset locally.
4. Invoke the visible project agent with one controlled issue and observe instructions-before-Doctor, ready-only run dispatch, no lifecycle bypass, and dispatch/completion separation.
5. Store this evidence in a separate post-RPIV beta report, not in repository implementation acceptance.

### Expected Result
The packaged beta works in the reported consumer shape and preserves the current Issue #7-derived operator flow. Failure blocks beta promotion but does not rewrite repository-local acceptance results.

### Expected Evidence
Visible-pane observation record, installed version, closed Doctor classification/unchanged booleans, asset reconvergence result, and separate official-agent dispatch trace with no raw tmux values.
