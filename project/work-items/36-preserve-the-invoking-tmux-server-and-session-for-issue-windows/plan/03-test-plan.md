# Test Plan: Issue #36 consistency correction

## Test V1: Global architecture schema consistency

- **Type:** Static architecture validation
- **Task:** T1
- **Acceptance Criteria:** AC-3, AC-4, AC-12, AC-15, AC-16
- **Priority:** Critical

### Setup
Load every current ADR, adopted core-component, and Decision Log entry; use source schema declarations/emissions as the executable reference.

### Steps
1. Compare current architecture claims with `RunSnapshotV6`, reconciliation schema 3, and status schema 5.
2. Scan adopted contracts for unscoped current V5/V2/V4 claims.
3. Verify the three corrected component IDs/statuses/dates and all ADRs remain unchanged.
4. Verify Decision Log decisions 131 and 134 state the corrected current contract and no duplicate decision was added.

### Expected Result
All current global contracts agree with source and Issue #36 authority; compatibility statements remain safe; no new artifact or decision is introduced.

### Expected Evidence
Architecture diff, schema matrix, stale-label scan, and stable ID/date report.

## Test V2: Current documentation and assertion consistency

- **Type:** Documentation regression
- **Task:** T2
- **Acceptance Criteria:** AC-2, AC-3, AC-4, AC-6, AC-8, AC-9, AC-11, AC-12, AC-13, AC-15, AC-16
- **Priority:** Critical

### Setup
Load `README.md`, `PRD.md`, `docs/phase-3-recovery-operations.md`, related current guides, and `src/documentation.test.ts`.

### Steps
1. Assert current recovery text names `RunSnapshotV6`, `ReconciliationReportV3`/schema v3, and `StatusFactsV5`/status schema v5.
2. Run the focused documentation test.
3. Confirm all AC-15 behaviors remain present: invoking context, fallback, later contexts, invalid/stale outcomes, confidentiality, and non-adoption.
4. Classify remaining old labels as explicit compatibility/history; leave historical work-item artifacts unchanged.

### Expected Result
Current docs and tests agree with runtime schemas without weakening operational guidance or rewriting historical evidence.

### Expected Evidence
Documentation test exit 0, occurrence classification, changed-document inventory, and AC-15 coverage matrix.

## Test V3: Runtime schema emission and compatibility

- **Type:** Unit and persistence contract
- **Task:** T2, T3
- **Acceptance Criteria:** AC-3, AC-4, AC-16
- **Priority:** Critical

### Setup
Use production domain, persistence, reconciliation, and orchestrator paths with existing v1-v6 fixtures.

### Steps
1. Assert new snapshots emit schema version 6 and strict v1-v6 readers remain available.
2. Assert reconciliation reports emit schema version 3.
3. Assert status facts emit schema version 5.
4. Assert old imported type aliases do not change serialized versions and legacy snapshots cannot invent complete selectors.

### Expected Result
Executable contracts are V6/V3/V5 and compatibility aliases/inputs do not misrepresent or authorize current target identity.

### Expected Evidence
Focused reconciliation/recovery test transcript, serialized fixture excerpts, and alias-versus-wire-version note.

## Test V4: Exact-target behavioral regression suite

- **Type:** Focused repository-local behavioral validation
- **Task:** T3
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15, AC-16
- **Priority:** Critical

### Setup
Use existing repository-controlled tmux adapters and isolated sockets/sessions with no credentials, network, or ambient-server dependency.

### Steps
1. Run custom-socket and standalone fallback tests.
2. Run lifecycle context, complete equality, twin-server, cleanup, and non-adoption tests.
3. Run malformed/stale/contradictory context, repeated absence, concurrency overlap, confidentiality, and Doctor matrices.
4. Run the repository focused validation recipe and map assertions to AC-1 through AC-15.

### Expected Result
Delivered Issue #36 behavior remains unchanged and passing; selected/unrelated inventories obey all acceptance criteria; no production-code edit is needed.

### Expected Evidence
Focused exit-0 transcript, AC-indexed test map, before/after inventories, refusal/sentinel results, and production-source no-change diff.

## Test V5: Full validation, stale-contract scan, and 0.2.0 release preservation

- **Type:** Repository quality gate
- **Task:** T3, T4
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15, AC-16
- **Priority:** Critical

### Setup
Complete the documentation/test correction. Exclude only explicitly documented compatibility references and historical work-item artifacts from the current-contract scan.

### Steps
1. Verify authoritative package, lock, official-asset, fixture/manifest, test, and current-doc surfaces remain 0.2.0.
2. Prove dependency metadata and production source are unchanged.
3. Scan live current contracts for stale new-run V5, reconciliation V2/schema v2, and status schema v4 claims.
4. Run `git diff --check` and final root `just verify`; assemble the AC-indexed Implement evidence.

### Expected Result
All current contracts use V6/V3/V5, release remains synchronized at 0.2.0, full validation passes, and every AC has inspectable evidence.

### Expected Evidence
Version matrix, no-churn/no-product-code diff, classified stale-label report, full exit-0 transcript, and `implementation/00-implementation.md` AC matrix.
