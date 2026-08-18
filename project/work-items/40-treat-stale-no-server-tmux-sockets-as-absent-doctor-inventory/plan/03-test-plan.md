# Test Plan: Issue 40

## Test V1: Strict inventory-result classifier

- **Type:** Unit
- **Task:** T1
- **Acceptance Criteria:** AC-1, AC-4
- **Priority:** Critical

### Setup
Inject socket identities and original-byte command results into `LiveTmuxPort`.

### Steps
Run exact stale no-server twice, then arbitrary nonzero, alternate/additional/malformed/overflow stderr, nonempty stdout, invalid UTF-8, NUL, CR, missing LF, 65,537 stdout bytes, 1,025 records, timeout, EACCES, post-query ENOENT, and replacement. Retain pre-query ENOENT.

### Expected Result
Only exact no-server with zero stdout and stable identity returns identity-bearing empty inventory; ENOENT is command-free; every uncertainty is value-free `unavailable-proof`.

### Expected Evidence
Row table, call arguments/bounds/caps/counts, identity reads, and negative scan.

## Test V2: Full Doctor stale row and 24-check preservation

- **Type:** Integration
- **Task:** T2
- **Acceptance Criteria:** AC-1, AC-2, AC-4
- **Priority:** Critical

### Setup
Controlled `owner/repo`, `main`, passing executable/auth observations, valid custom target, and injected inventory rows.

### Steps
Evaluate stale and required failure rows through `DoctorService`; compare IDs to `DOCTOR_CHECK_IDS` and inspect named checks.

### Expected Result
Stale is `invoking-valid`/null/true/true with facts and named passes. Others fail only `command.tmux` as `invalid-context`/`unavailable-proof` false/false while completed checks remain.

### Expected Evidence
Exact ordered 24 entries, occurrence counts, pass list, facts, and per-row evidence.

## Test V3: Human/JSON parity and confidentiality

- **Type:** Contract / security
- **Task:** T2
- **Acceptance Criteria:** AC-3
- **Priority:** Critical

### Setup
Supply unique socket paths, identities, pane inventory, stderr, observation/environment values, and sentinels.

### Steps
Render human and JSON; normalize readiness, facts, checks, mode/reason, and booleans; scan output, errors, and evidence.

### Expected Result
Projections are equal and no prohibited value occurs.

### Expected Evidence
Parity comparison and zero-match scan.

## Test V4: Repeated finite matrix and non-mutation

- **Type:** Integration / determinism
- **Task:** T2
- **Acceptance Criteria:** AC-4, AC-5
- **Priority:** Critical

### Setup
Closed required matrix plus timeout, EACCES, malformed/additional/overflow stderr, and post-query loss; instrument type/device/inode, live inventories, and mutations.

### Steps
Run every row twice and capture complete Doctor/resource projections before and after.

### Expected Result
Pairs are equal; only stale succeeds; identities/inventories are unchanged; create/delete/mutation lists are empty.

### Expected Evidence
Finite matrix, equality report, snapshots, and empty mutation trace.

## Test V5: Real custom server plus stale default entry

- **Type:** Live-equivalent repository integration
- **Task:** T3
- **Acceptance Criteria:** AC-5, AC-6
- **Priority:** Critical

### Setup
Exclusive root, isolated `TMUX_TMPDIR`, real custom server, and stale default Unix socket made by bind/close; controlled non-tmux observations and no credentials/network.

### Steps
Prove custom query success and stale exact no-server; snapshot resources; run full Doctor; snapshot; clean and prove absence; repeat once.

### Expected Result
Both bounded runs yield the Core result, Doctor mutates nothing, and all owned resources are absent after cleanup.

### Expected Evidence
Value-free byte-shape/exit facts, timings, result, pre/post equality, cleanup, and repeat proof.

## Test V6: Release and Doctor documentation

- **Type:** Documentation
- **Task:** T4
- **Acceptance Criteria:** AC-7, AC-8
- **Priority:** High

### Setup
README, docs index, Doctor guide, official-assets guide, and documentation tests.

### Steps
Assert current beta.1, backward-compatible correction, exact stale absence, unavailable-proof distinctions, and upgrade/reinstall/confirmation guidance. Permit beta.0 only as prior context.

### Expected Result
Current docs agree and never broaden arbitrary failures into absence.

### Expected Evidence
Documentation output and version inventory.

## Test V7: Offline package/version synchronization

- **Type:** Packaging / installation
- **Task:** T4
- **Acceptance Criteria:** AC-8
- **Priority:** Critical

### Setup
Local build, temporary pack destination/prefix, and baseline/final dependency metadata.

### Steps
Check manifest, both root lock values, asset catalog, fixtures; dry-run pack, local pack, inspect tar, install local tarball with npm `--offline --ignore-scripts --no-audit --no-fund --omit=dev`; inspect installed/generated metadata; audit commands; clean.

### Expected Result
Every surface is beta.1, dependencies are equal, offline operations pass, and no registry fetch/publish occurs.

### Expected Evidence
Version table, tar/installed/manifest metadata, dependency diff, command trace, and cleanup.

## Test V8: Direct project gates

- **Type:** Validation
- **Task:** T5
- **Acceptance Criteria:** AC-9
- **Priority:** Critical

### Setup
Implementation and evidence tests complete.

### Steps
Run `just verify-focused`, then `just verify` directly.

### Expected Result
Both exit 0; harness does not replace either.

### Expected Evidence
Commands, timestamps, statuses, and logs.

## Test V9: Harness gates and acceptance audit

- **Type:** Validation / harness
- **Task:** T5
- **Acceptance Criteria:** AC-9
- **Priority:** High

### Setup
Run `harness instructions checks` first.

### Steps
Run `harness checks --focused --json` and `harness checks --json`; audit AC-1–AC-9 task, validation, and evidence references.

### Expected Result
Harness envelopes succeed and no coverage cell is missing; V8 remains authoritative.

### Expected Evidence
Instruction/check envelopes and final evidence index.

## Test V10: Deferred Sparkta operational acceptance

- **Type:** Deferred external operational
- **Task:** Post-delivery operator handoff; not an implementation gate
- **Acceptance Criteria:** None; corroborates the incident after AC-1–AC-9
- **Priority:** Deferred

### Setup
Original Sparkta context, visible beta.1 tarball, and operator authorization.

### Steps
Record installed beta.0; uninstall; install beta.1; confirm metadata; run installed human/JSON Doctor; run `soft-factory run --issue 7 --json`; redact confidential values.

### Expected Result
Doctor reflects the correction and Issue 7 dispatch is visibly attempted under normal readiness authority. Environmental failure remains operational evidence, not repository proof.

### Expected Evidence
Redacted transcript of package transition, Doctor projections, and Issue 7 dispatch.
