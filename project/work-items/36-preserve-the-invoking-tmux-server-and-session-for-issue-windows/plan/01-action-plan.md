# Action Plan: Issue #36 consistency correction

## Feature
- **ID:** 36
- **Research Brief:** project/work-items/36-preserve-the-invoking-tmux-server-and-session-for-issue-windows/research/00-research.md
- **Branch:** `feat/36-preserve-invoking-tmux-context`
- **Scope:** Plan-only consistency correction; implementation may change current docs/tests but must not redesign delivered tmux behavior.
- **Release:** Preserve and validate Issue #36 release `0.2.0`; this correction does not authorize another version increment.

## ADRs Created
- None. `ADR-260817-invoking-tmux-context-targeting` already records the controlling decision; no new architectural decision exists.

## Core-Components Created
- None. Correct the existing adopted schema references in `CORE-COMPONENT-260811-run-reconciliation-control`, `CORE-COMPONENT-260811-completion-evidence-reconciliation`, and `CORE-COMPONENT-260814-tmux-identity-diagnostics`; retain their IDs and creation dates. `CORE-COMPONENT-260817-exact-tmux-context-ownership` remains authoritative and unchanged.

## Acceptance Criteria
- **AC-1:** From a valid client on a non-default socket, one run creates one Runner-owned issue window in that clients current server and session; a bounded local query through the same socket/session returns its exact window and pane, and no same-run window exists on the default server.
- **AC-2:** Outside tmux, a run selects the documented standalone target deterministically: two sequential clean runs for the same repository resolve the same server/session naming behavior, while runs for two differently named repositories resolve distinct session targets.
- **AC-3:** The selected server/socket, session, window, and pane identity is persisted, and reconciliation authorizes a lifecycle action only when the observed target matches that complete identity.
- **AC-4:** Status, reconcile, resume, attach, logs, stop, and cleanup use only the persisted exact target when invoked from the original session, another tmux context, or outside tmux; for each invocation context, human and JSON results agree whether that target matched, was absent, or mismatched.
- **AC-5:** Cleanup removes only the exactly owned issue window, attach selects only its exact window and pane, logs contain only its transcript, and status does not change either the selected or an unrelated tmux inventory.
- **AC-6:** Target selection never adopts, repurposes, or infers ownership of an arbitrary pre-existing window, including one with the expected name.
- **AC-7:** With two isolated servers containing identical session and window names, each persisted run is observed and controlled only on its own server; after one run is stopped and cleaned, its exact issue window is absent and the other servers complete inventory is unchanged.
- **AC-8:** A finite matrix containing malformed invoking evidence, evidence for a stopped server, nested or contradictory evidence naming more than one credible target, and evidence that cannot resolve to exactly one current session exits nonzero with a machine-readable refusal before tmux mutation; the run-state inventory and every isolated server inventory are byte-for-byte unchanged in each row.
- **AC-9:** Absence of invoking evidence is treated only as outside-tmux fallback, not as permission to use an arbitrary existing server; an existing expected-name window in the fallback target is preserved and refused rather than adopted.
- **AC-10:** Two simultaneous starts for one issue produce exactly one owner and one issue window; one bounded overlap of cleanup with status and one with reconciliation each reports either the complete pre-cleanup target or its complete absence, without mixed target identities or mutation outside the owned server/session.
- **AC-11:** Repeating stop or cleanup after the owned target is absent reports the same terminal or absent outcome without tmux mutation; attach, logs, and resume with an absent or mismatched target exit nonzero without tmux mutation.
- **AC-12:** Sentinel values placed in malformed invoking evidence and unrelated inherited environment entries are absent from human output, JSON output, snapshots, events, diagnostics, and retained logs; the raw invoking-context tuple and its server process identifier are not retained or rendered.
- **AC-13:** Doctor/readiness evidence distinguishes valid in-tmux targeting, outside-tmux fallback, and every invalid-context matrix row through bounded checks whose before/after inventories prove that ambient and unrelated tmux resources are unchanged.
- **AC-14:** Repeatable repository-local evidence uses isolated sockets and sessions plus machine-observable inventories to prove custom-socket visibility, fallback determinism, persisted lifecycle consistency, collision isolation, finite refusals, repeated/concurrent outcomes, and cleanup that removes the exact owned window while leaving all unrelated inventory unchanged, without credentials or network access.
- **AC-15:** User documentation explains in-tmux behavior, standalone fallback, lifecycle behavior across later invocation contexts, invalid/stale target outcomes, the raw-value confidentiality boundary, and non-adoption of arbitrary windows.
- **AC-16:** The focused and full repository verification commands pass with inspectable evidence mapped to these criteria.

## Acceptance Coverage

| AC | Implementation tasks | Tests / validation | Expected evidence |
|---|---|---|---|
| AC-1 | T3 | V4, V5 | Custom-socket inventory and explicit-selector regression proof |
| AC-2 | T2, T3 | V2, V4, V5 | Correct fallback docs and deterministic derivation assertions |
| AC-3 | T1, T2, T3 | V1, V2, V3, V4, V5 | V6 persistence plus report-v3 complete-equality proof |
| AC-4 | T1, T2, T3 | V1, V2, V3, V4, V5 | Status-v5/report-v3 context and renderer parity evidence |
| AC-5 | T3 | V4, V5 | Exact attach/log/cleanup traces and unchanged inventories |
| AC-6 | T2, T3 | V2, V4, V5 | Non-adoption docs and collision refusal proof |
| AC-7 | T3 | V4, V5 | Twin-server before/after inventory proof |
| AC-8 | T2, T3 | V2, V4, V5 | Refusal matrix with nonzero codes and unchanged inventories |
| AC-9 | T2, T3 | V2, V4, V5 | Absence-only fallback and preserved collision evidence |
| AC-10 | T3 | V4, V5 | Deterministic one-owner and overlap regression evidence |
| AC-11 | T2, T3 | V2, V4, V5 | Repeated absence/refusal evidence with zero mutation |
| AC-12 | T1, T2, T3 | V1, V2, V4, V5 | Value-free architecture/docs and sentinel scan evidence |
| AC-13 | T2, T3 | V2, V4, V5 | Doctor classification and unchanged-inventory evidence |
| AC-14 | T3 | V4, V5 | Repository-local isolated-socket evidence index |
| AC-15 | T1, T2 | V1, V2, V5 | Cross-document behavior/schema coverage report |
| AC-16 | T1, T2, T3, T4 | V1-V5 | Focused/full exits, stale-label scan, release matrix, implementation handoff |

Coverage proof: all 16 criteria map to implementation work, validation, and expected evidence. The correction retains behavioral coverage for AC-1 through AC-14 while changing only stale global architecture, current user documentation, and documentation assertions.

## Implementation Tasks
1. **T1 — Reconcile global architecture contracts (AC-3, AC-4, AC-12, AC-15, AC-16):** retain the accepted Issue #36 ADR and adopted exact-target component; correct only the three older adopted components that still claim current V5/V2/V4 contracts; update Decision Log decisions 131 and 134 without changing artifact IDs or creation dates. Do not create an ADR/core-component.
2. **T2 — Correct current user documentation and documentation assertions (AC-2, AC-3, AC-4, AC-6, AC-8, AC-9, AC-11, AC-12, AC-13, AC-15, AC-16):** change current schema claims in `README.md`, `PRD.md`, and `docs/phase-3-recovery-operations.md` to `RunSnapshotV6`, `ReconciliationReportV3`/schema v3, and `StatusFactsV5`/status schema v5; update `src/documentation.test.ts` to require current labels while preserving intentional compatibility references and Issue #29 historical assertions where scoped.
3. **T3 — Re-run focused behavioral and schema proof (AC-1 through AC-16):** confirm source emits snapshot v6, report v3, and status v5; run documentation tests plus existing reconciliation, recovery-control, tmux-target/orchestration, Doctor, confidentiality, concurrency, and isolated-socket coverage. Treat any behavior defect as a Plan return rather than silently expanding this correction.
4. **T4 — Validate release and write Implement evidence (AC-16):** prove all authoritative release surfaces remain `0.2.0`, no release bump/dependency churn occurred, current live contracts have no stale new-run/report/status labels, historical work-item records remain untouched, and focused/full root validation passes with an AC-indexed handoff.
