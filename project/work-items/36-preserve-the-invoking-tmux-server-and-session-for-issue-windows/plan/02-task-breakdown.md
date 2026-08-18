# Task Breakdown: Issue #36 consistency correction

## Task T1: Reconcile global architecture contracts

- **Status:** Complete
- **Complexity:** Medium
- **Dependencies:** None
- **Acceptance Criteria:** AC-3, AC-4, AC-12, AC-15, AC-16
- **Related ADRs:** ADR-260817-invoking-tmux-context-targeting; ADR-260814-tmux-identity-failure-recovery
- **Related Core-Components:** CORE-COMPONENT-260817-exact-tmux-context-ownership; CORE-COMPONENT-260811-run-reconciliation-control; CORE-COMPONENT-260811-completion-evidence-reconciliation; CORE-COMPONENT-260814-tmux-identity-diagnostics

### Description
Keep `ADR-260817-invoking-tmux-context-targeting` and `CORE-COMPONENT-260817-exact-tmux-context-ownership` as the current authority. Correct the three older adopted components so new runs are `RunSnapshotV6`, legacy readers cover v1-v6 under versioned safety limits, current reconciliation is `ReconciliationReportV3`/schema v3, and current status is `StatusFactsV5`/schema v5. Update Decision Log decisions 131 and 134 in place. Preserve all IDs, statuses, and creation dates; create no new architecture artifact.

### Acceptance Criteria
- Every current global architecture statement agrees with V6/V3/V5 and complete exact-target authority (AC-3, AC-4).
- Confidentiality and non-authorizing legacy boundaries remain unchanged (AC-12).
- Architecture integration guidance points to the Issue #36 exact-target authority (AC-15).
- Decision Log reflects each modified component without introducing a duplicate or new decision (AC-16).

### Test Coverage
- Static scan of all adopted core-components and Decision Log current-contract decisions.
- Compare corrected statements with `src/domain.ts`, `src/reconciliation.ts`, `src/orchestrator.ts`, and persistence guards.
- Verify IDs, headings, statuses, related links, and Decision Log dates remain stable.

### Expected Evidence
- Architecture-only diff for exactly three core-components plus Decision Log.
- Zero stale current `new runs ... V5`, `ReconciliationReportV2`, or `status schema v4` claims in adopted contracts.
- Source-to-architecture schema matrix showing snapshot 6, report 3, status 5.

## Task T2: Correct current docs and documentation assertions

- **Status:** Complete
- **Complexity:** Medium
- **Dependencies:** T1
- **Acceptance Criteria:** AC-2, AC-3, AC-4, AC-6, AC-8, AC-9, AC-11, AC-12, AC-13, AC-15, AC-16
- **Verify-return correction:** Complete — README, PRD, Phase 4 Doctor guidance, and documentation assertions now describe actual explicit-selector tmux resource inventories rather than directory-entry evidence (AC-13, AC-15, AC-16).
- **Related ADRs:** ADR-260817-invoking-tmux-context-targeting; ADR-260812-repository-doctor-readiness
- **Related Core-Components:** CORE-COMPONENT-260817-exact-tmux-context-ownership; CORE-COMPONENT-260811-run-reconciliation-control; CORE-COMPONENT-260814-tmux-identity-diagnostics; CORE-COMPONENT-260815-package-semver-governance

### Description
Correct `README.md`, `PRD.md`, and `docs/phase-3-recovery-operations.md` where they describe the current reconciliation/status contract. Use unambiguous current names: `RunSnapshotV6`, `ReconciliationReportV3` with schema version 3, and `StatusFactsV5` with status schema version 5. Update `src/documentation.test.ts` so current-document assertions require V3/V5. Preserve valid references to `ReconciliationReportV2`, status v4, and `RunSnapshotV5` only when they explicitly describe compatibility or historical Issue #29 behavior. Do not edit historical work-item artifacts.

### Acceptance Criteria
- Current docs agree with runtime V6/V3/V5 and retain all Issue #36 operational behavior (AC-2, AC-3, AC-4, AC-6, AC-8, AC-9, AC-11, AC-13, AC-15).
- Documentation keeps raw invoking values and server PID confidential (AC-12, AC-15).
- Documentation tests fail on stale current labels and pass on intentional version-scoped history (AC-16).
- Release guidance continues to identify 0.2.0 without requesting another version change (AC-16).

### Test Coverage
- Focused `src/documentation.test.ts` assertions for the three corrected documents.
- Positive assertions for `ReconciliationReportV3`, schema v3, `StatusFactsV5`, and status schema v5.
- Section-scoped compatibility assertions proving old labels occur only in explicit legacy/history contexts.
- Cross-document checks for invoking selection, fallback, lifecycle context independence, refusal, confidentiality, Doctor, and non-adoption.

### Expected Evidence
- Four-file Implement diff: three documents and `src/documentation.test.ts`.
- Documentation test transcript and current-contract occurrence report.
- Requirement-to-document matrix for AC-15.

## Task T3: Re-run behavioral and schema proof

- **Status:** Complete
- **Complexity:** Medium
- **Dependencies:** T2
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15, AC-16
- **Verify-return correction:** Complete — the live tmux adapter inventories socket identity and original-byte session/window/pane records through bounded explicit `-S` queries; a real custom/default-server regression changes a window while directory entries stay equal and is detected (AC-13, AC-16).
- **Related ADRs:** ADR-260817-invoking-tmux-context-targeting; ADR-260814-tmux-identity-failure-recovery; ADR-260812-repository-doctor-readiness
- **Related Core-Components:** CORE-COMPONENT-260817-exact-tmux-context-ownership; CORE-COMPONENT-260811-run-reconciliation-control; CORE-COMPONENT-260811-owned-resource-cleanup; CORE-COMPONENT-260812-repository-doctor-contract; CORE-COMPONENT-260806-agent-executable-acceptance-criteria

### Description
Use existing product tests as regression proof because the research found implemented behavior correct. Confirm emitted schemas directly, then run focused documentation/schema and exact-target suites covering custom sockets, deterministic fallback, persisted lifecycle routing, collision isolation, refusal matrices, concurrency, cleanup, confidentiality, Doctor, and isolated inventories. Do not change product behavior in this correction. If a behavioral regression appears, record exact failure evidence and return to Plan before broadening scope.

### Acceptance Criteria
- Existing exact-target suites continue proving AC-1 through AC-14 without product-code edits.
- Runtime facts emit snapshot schema 6, reconciliation schema 3, and status schema 5 (AC-3, AC-4).
- Updated documentation is consistent and complete (AC-15).
- Focused validation exits zero and provides AC-indexed inspectable evidence (AC-16).

### Test Coverage
- `src/reconciliation.test.ts` and `src/recovery-control.test.ts` schema assertions.
- Existing tmux target, orchestration/lifecycle, Doctor, concurrency, cleanup, confidentiality, and isolated-socket suites.
- Documentation test from T2.
- Root `just verify-focused` with relevant filters/recipe as repository authority.

### Expected Evidence
- Focused exit-0 transcript and exact test-file list.
- AC-1..AC-15 evidence index linked to assertions/inventories.
- Source and runtime schema matrix.
- Confirmation that no `src/` production file changed.

## Task T4: Validate release and prepare Implement handoff

- **Status:** Complete
- **Complexity:** Low
- **Dependencies:** T3
- **Acceptance Criteria:** AC-16
- **Verify-return correction:** Complete — implementation evidence and required focused/full validation were refreshed for the AC-13/AC-15 return.
- **Related ADRs:** ADR-260817-invoking-tmux-context-targeting; ADR-260812-official-asset-distribution-installation
- **Related Core-Components:** CORE-COMPONENT-260815-package-semver-governance; CORE-COMPONENT-260812-official-asset-installation-contract; CORE-COMPONENT-260806-project-command-interface; CORE-COMPONENT-260806-rpiv-stage-contract

### Description
Validate rather than increment the delivered Issue #36 release. Confirm package, lock root, official asset, fixtures/manifests, tests, and current docs remain synchronized at 0.2.0; prove no dependency churn or publication claim. Scan live docs, tests, architecture, and Decision Log for stale current-contract labels while excluding explicitly classified compatibility references and historical work-item records. Run final `just verify` and write the Implement artifact with AC mappings and changed-path inventory.

### Acceptance Criteria
- All authoritative release surfaces remain 0.2.0; no new version bump is introduced.
- No dependency/version churn or product-code edit appears in the correction diff.
- Live current-contract labels are V6/V3/V5; intentional old-version references are explicitly scoped.
- `just verify` passes and Implement evidence maps AC-1 through AC-16 (AC-16).

### Test Coverage
- Version-surface and dependency diff checks already provided by package/release tests.
- Classified stale-label scan over current product/docs/tests/architecture.
- `git diff --check`, focused validation, and final root `just verify`.
- Implement artifact completeness check.

### Expected Evidence
- 0.2.0 version matrix and no-churn diff.
- Classified stale-label report with zero unscoped current contradictions.
- Full verification exit-0 transcript.
- `implementation/00-implementation.md` handoff listing exact changes and AC evidence.
