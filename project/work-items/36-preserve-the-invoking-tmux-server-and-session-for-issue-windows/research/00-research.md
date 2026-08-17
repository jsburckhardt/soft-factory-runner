# Research Brief: Preserve the invoking tmux server and session for issue windows

## GitHub Issue
- **Issue:** #36
- **Title:** Preserve the invoking tmux server and session for issue windows
- **Work Item:** project/work-items/36-preserve-the-invoking-tmux-server-and-session-for-issue-windows

## Scope Classification
- **Scope Type:** issue

## Problem Statement
Issue #36 delivered v6 persisted tmux targeting so that a valid in-tmux run uses the invoking server/current session, an outside-tmux run uses a deterministic repository-owned standalone target, and later lifecycle commands use the complete persisted identity. The user-authorized Research correction pass covers current documentation that still names the pre-Issue #36 reconciliation and status schemas instead of the implemented reconciliation report schema v3 and status schema v5.

## Acceptance Criteria

**Core**
- [ ] From a valid client on a non-default socket, one run creates one Runner-owned issue window in that clients current server and session; a bounded local query through the same socket/session returns its exact window and pane, and no same-run window exists on the default server.
- [ ] Outside tmux, a run selects the documented standalone target deterministically: two sequential clean runs for the same repository resolve the same server/session naming behavior, while runs for two differently named repositories resolve distinct session targets.
- [ ] The selected server/socket, session, window, and pane identity is persisted, and reconciliation authorizes a lifecycle action only when the observed target matches that complete identity.
- [ ] Status, reconcile, resume, attach, logs, stop, and cleanup use only the persisted exact target when invoked from the original session, another tmux context, or outside tmux; for each invocation context, human and JSON results agree whether that target matched, was absent, or mismatched.
- [ ] Cleanup removes only the exactly owned issue window, attach selects only its exact window and pane, logs contain only its transcript, and status does not change either the selected or an unrelated tmux inventory.
- [ ] Target selection never adopts, repurposes, or infers ownership of an arbitrary pre-existing window, including one with the expected name.

**Edge Cases**
- [ ] With two isolated servers containing identical session and window names, each persisted run is observed and controlled only on its own server; after one run is stopped and cleaned, its exact issue window is absent and the other servers complete inventory is unchanged.
- [ ] A finite matrix containing malformed invoking evidence, evidence for a stopped server, nested or contradictory evidence naming more than one credible target, and evidence that cannot resolve to exactly one current session exits nonzero with a machine-readable refusal before tmux mutation; the run-state inventory and every isolated server inventory are byte-for-byte unchanged in each row.
- [ ] Absence of invoking evidence is treated only as outside-tmux fallback, not as permission to use an arbitrary existing server; an existing expected-name window in the fallback target is preserved and refused rather than adopted.
- [ ] Two simultaneous starts for one issue produce exactly one owner and one issue window; one bounded overlap of cleanup with status and one with reconciliation each reports either the complete pre-cleanup target or its complete absence, without mixed target identities or mutation outside the owned server/session.
- [ ] Repeating stop or cleanup after the owned target is absent reports the same terminal or absent outcome without tmux mutation; attach, logs, and resume with an absent or mismatched target exit nonzero without tmux mutation.
- [ ] Sentinel values placed in malformed invoking evidence and unrelated inherited environment entries are absent from human output, JSON output, snapshots, events, diagnostics, and retained logs; the raw invoking-context tuple and its server process identifier are not retained or rendered.

**Verification**
- [ ] Doctor/readiness evidence distinguishes valid in-tmux targeting, outside-tmux fallback, and every invalid-context matrix row through bounded checks whose before/after inventories prove that ambient and unrelated tmux resources are unchanged.
- [ ] Repeatable repository-local evidence uses isolated sockets and sessions plus machine-observable inventories to prove custom-socket visibility, fallback determinism, persisted lifecycle consistency, collision isolation, finite refusals, repeated/concurrent outcomes, and cleanup that removes the exact owned window while leaving all unrelated inventory unchanged, without credentials or network access.
- [ ] User documentation explains in-tmux behavior, standalone fallback, lifecycle behavior across later invocation contexts, invalid/stale target outcomes, the raw-value confidentiality boundary, and non-adoption of arbitrary windows.
- [ ] The focused and full repository verification commands pass with inspectable evidence mapped to these criteria.

## Repository Findings

- Issue #36 still contains one marker-delimited `Acceptance Criteria` block with 16 ordered Markdown checkboxes grouped as Core, Edge Cases, and Verification. The criteria above preserve the fetched text and order verbatim.
- The requested branch `feat/36-preserve-invoking-tmux-context` is active at `1c4dc1d`, and exactly one `project/work-items/36-*` directory exists. The existing directory name was preserved.
- `src/domain.ts:ReconciliationReportV3` declares `schemaVersion: 3`, and `src/reconciliation.ts:report` emits 3. `src/domain.ts:StatusFacts` declares `schemaVersion: 5`, and `src/orchestrator.ts:status` emits 5. `src/reconciliation.test.ts` and `src/recovery-control.test.ts` assert these v3/v5 runtime values.
- `src/domain.ts` retains the compatibility type alias `ReconciliationReportV2 = ReconciliationReportV3`, and several call sites still import the alias. This name does not change the emitted report schema version of 3.
- `src/domain.ts:RunSnapshotV6` and `src/persistence.ts:isSnapshot` show that new runs use `schemaVersion: 6` while strict v1-v5 readers remain. `src/tmux-target.ts:TmuxTargetV2` persists selection mode, canonical socket path, socket device/inode, session ID/name, window ID/name, pane ID, and cwd.
- `src/tmux-target.ts:deriveStandaloneTmuxTarget` derives a stable SHA-256-based socket and session from `repository.nameWithOwner`, while `src/live.ts:LiveTmuxPort` validates the invoking socket/session and prefixes runtime tmux commands with `-S <socket>`. Lifecycle methods target the persisted session/window/pane identity.
- Current Issue #36 behavior text in `README.md`, `docs/phase-1-issue-run.md`, `docs/phase-3-recovery-operations.md`, `docs/phase-4-repository-doctor.md`, `docs/README.md`, and `PRD.md` agrees on valid invoking-context selection, deterministic standalone fallback, explicit persisted-socket routing, complete target equality, refusal/confidentiality, and v6 snapshot compatibility.
- Three current user-facing schema claims are stale: `README.md:137` says reconciliation schema v2 and status schema v4; `PRD.md:1305` says `ReconciliationReportV2` and status schema v4; and `docs/phase-3-recovery-operations.md:148` says `ReconciliationReportV2` and status schema v4. These contradict the emitted v3/v5 schemas.
- `src/documentation.test.ts:370-376` still requires `ReconciliationReportV2` and `status schema v4` to appear in the combined user documentation. This assertion pins the pre-Issue #36 labels even though the same test file later asserts `RunSnapshotV6` documentation.
- Additional stale architecture claims remain in older but still `Adopted` core-components: `CORE-COMPONENT-260811-run-reconciliation-control.md` states new runs/`RunSnapshotV5` and `ReconciliationReportV2`; `CORE-COMPONENT-260811-completion-evidence-reconciliation.md` states new runs use v5; and `CORE-COMPONENT-260814-tmux-identity-diagnostics.md` states `RunSnapshotV5`, `ReconciliationReportV2`, and status schema v4. `project/architecture/ADR/DECISION-LOG.md` decision 131 also states that new runs persist V5. The latest `ADR-260817-invoking-tmux-context-targeting.md` and `CORE-COMPONENT-260817-exact-tmux-context-ownership.md` accurately record `RunSnapshotV6`, `ReconciliationReportV3`, and `StatusFactsV5`.
- Historical work-item plans, research, implementation, and verification summaries contain prior-version labels but are bound to their stage/issue history and are not current product contracts.

## Constraints

- This is a Research-only correction pass. The only project artifact that may change is this existing `research/00-research.md`; application code, tests, user documentation, plans, ADRs, core-components, and the Decision Log remain unchanged.
- Preserve the existing work-item directory name, fetched acceptance-criteria text/order, and `issue` scope classification.
- `RunSnapshotV6`, reconciliation report `schemaVersion: 3`, and status `schemaVersion: 5` are the current persisted/rendered contracts. V1-v5 snapshots remain readable compatibility inputs but do not authorize tmux mutation when complete selectors are missing.
- Issue #36 exact-target rules remain binding: only complete absence of both invoking variables selects standalone fallback; invalid, stale, nested, contradictory, or ambiguous evidence refuses before mutation; same-name windows are never adopted; and every lifecycle tmux call uses the persisted explicit socket and immutable IDs.
- The latest accepted `ADR-260817-invoking-tmux-context-targeting` and adopted `CORE-COMPONENT-260817-exact-tmux-context-ownership` are the current architecture authority for the v6 target. Decision Log decisions 172-179 record invoking/fallback selection, complete identity, explicit `-S` routing, lifecycle equality, confidentiality, and Doctor classification.
- Documentation assertions in `src/documentation.test.ts` still require the pre-Issue #36 schema labels. This is a current repository constraint during the authorized correction pass.
- Existing persistence, reconciliation, structured-event, confidentiality, one-pass observation, shared human/JSON, atomic ownership, and non-adoption rules remain in force.

## Relevant ADRs and Core-Components

- `ADR-260817-invoking-tmux-context-targeting` - current accepted v6 invoking-context, standalone fallback, complete target, legacy, confidentiality, Doctor, and release decision.
- `CORE-COMPONENT-260817-exact-tmux-context-ownership` - current adopted `TmuxTargetV2`, `RunSnapshotV6`, `ReconciliationReportV3`, `StatusFactsV5`, exact socket/ID routing, refusal, confidentiality, and Doctor contract.
- `ADR-260814-tmux-identity-failure-recovery` - preceding strict byte framing, one-pass absence/unknown, diagnostic, and zero-adoption decision.
- `CORE-COMPONENT-260814-tmux-identity-diagnostics` - preceding original-byte parsing, bounded value-free diagnostic, retry, and non-adoption contract.
- `CORE-COMPONENT-260811-run-reconciliation-control`, `CORE-COMPONENT-260811-completion-evidence-reconciliation`, and `CORE-COMPONENT-260811-owned-resource-cleanup` - shared reconciliation, persistence, and cleanup boundaries while retaining pre-Issue #36 schema text.
- `CORE-COMPONENT-260810-persistence-recovery`, `CORE-COMPONENT-260810-structured-events`, and `CORE-COMPONENT-260810-error-handling` - atomic versioned storage, shared rendering, and fail-safe boundaries.
- `project/architecture/ADR/DECISION-LOG.md` registers all of the above, with Issue #36 decisions 172-179 as the newest exact-target records.

## Risks and Open Questions

- The user-authorized pass names `PRD.md` and `docs/phase-3-recovery-operations.md` as known failures, but `README.md` has the same current-schema contradiction and `src/documentation.test.ts` pins the outdated labels.
- Older `Adopted` core-components and Decision Log decision 131 remain textually inconsistent with the newer accepted/adopted Issue #36 architecture. The repository does not explicitly mark those older schema statements as superseded beyond chronology and decisions 172-179.
- No additional contradiction was found in current tmux behavior documentation: the user guides and PRD agree on invoking-context selection, deterministic standalone derivation, explicit persisted socket and immutable ID routing, complete equality, refusal, confidentiality, and v6/v1-v5 compatibility.
- No external documentation was needed; repository source, tests, docs, ADRs, core-components, and the Decision Log were sufficient.
