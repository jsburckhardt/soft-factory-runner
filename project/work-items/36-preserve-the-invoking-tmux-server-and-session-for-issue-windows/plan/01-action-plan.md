# Action Plan: Preserve the invoking tmux server and session for issue windows

## Feature
- **ID:** 36
- **Research Brief:** project/work-items/36-preserve-the-invoking-tmux-server-and-session-for-issue-windows/research/00-research.md
- **Branch:** `feat/36-preserve-invoking-tmux-context`
- **Release:** `0.2.0` from `0.1.3` — backward-compatible functionality requires a MINOR increment under `CORE-COMPONENT-260815-package-semver-governance`.

## ADRs Created
- `ADR-260817-invoking-tmux-context-targeting` — new global decision for validated invoking selection, deterministic owned fallback, complete persisted target identity, Doctor classification, and release class. Existing ADR creation dates are unchanged; no existing ADR was edited.

## Core-Components Created
- `CORE-COMPONENT-260817-exact-tmux-context-ownership` — new global cross-cutting contract for selection, persistence, explicit socket routing, lifecycle authorization, confidentiality, concurrency, Doctor, and isolated evidence. Existing core-component creation dates are unchanged; no existing core-component was edited.

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

| AC | Implementation tasks | Tests / validation | Expected evidence | Documentation | Relevant architecture |
|---|---|---|---|---|---|
| AC-1 | T1, T2, T5 | V1, V8, V12 | Explicit custom `-S` trace; exact session/window/pane inventory; default-server absence | README; phase-1; PRD | ADR-260817; CC-260817; ADR-260811-prototype-one-run-orchestration |
| AC-2 | T1, T5, T6 | V2, V8, V9 | Repeated equal target derivation and distinct-repository target ledger | README; phase-1; phase-3 | ADR-260817; CC-260817; CC-260815-package-semver-governance |
| AC-3 | T1, T3 | V3, V8 | Strict v6 snapshot/event round trip and complete equality decision table | phase-1; phase-3; PRD schema | ADR-260817; CC-260817; CC-260810-persistence-recovery |
| AC-4 | T2, T3, T5 | V3, V4, V8 | Context matrix traces and byte-equivalent human/JSON classifications | README; phase-3 | ADR-260817; CC-260817; CC-260811-run-reconciliation-control |
| AC-5 | T2, T3, T5 | V4, V8 | Exact pane capture/attach/window-ID removal traces and unchanged inventories | phase-3 | CC-260817; CC-260811-owned-resource-cleanup |
| AC-6 | T1, T2, T5 | V2, V5 | Same-name collision refusal with zero create/select/capture/remove calls | README; phase-1; phase-3 | ADR-260817; CC-260817; CC-260814-tmux-identity-diagnostics |
| AC-7 | T2, T3, T5 | V4, V8 | Twin-server equal-local-ID inventories before/after stop and clean | phase-3 | ADR-260817; CC-260817; CC-260811-owned-resource-cleanup |
| AC-8 | T1, T4, T5 | V5, V7, V8 | Closed refusal codes, nonzero exits, byte-identical state/server inventories | phase-1; phase-4; troubleshooting | ADR-260817; CC-260817; CC-260810-error-handling |
| AC-9 | T1, T2, T5 | V2, V5 | Fallback-only absence proof and preserved expected-name window inventory | README; phase-1 | ADR-260817; CC-260817; CC-260814-tmux-identity-diagnostics |
| AC-10 | T3, T5 | V6, V8 | Barrier race ledger: one owner/window and whole-target-or-absence reports | phase-3 | CC-260817; CC-260811-concurrent-run-admission; CC-260810-issue-worktree-locking |
| AC-11 | T2, T3, T5 | V4, V6 | Repeated terminal/absence outputs and zero mutation traces for refusals | phase-3 troubleshooting | CC-260817; CC-260811-run-reconciliation-control; CC-260811-owned-resource-cleanup |
| AC-12 | T1, T3, T4, T5 | V5, V7, V8 | Sentinel scan across every rendered/durable/log artifact; no tuple/PID fields | README; phase-1; phase-3; phase-4 | ADR-260817; CC-260817; CC-260810-structured-events |
| AC-13 | T4, T5 | V7, V8 | Doctor `command.tmux` mode/reason evidence, bounds, and unchanged inventories | phase-4; docs index | ADR-260817; CC-260817; ADR-260812-repository-doctor-readiness; CC-260812-repository-doctor-contract |
| AC-14 | T5 | V1-V8, V12 | Repeatable isolated-socket scenario manifest with exact cleanup and no network/credentials | phase-1; phase-3; phase-4 | CC-260817; CC-260806-agent-executable-acceptance-criteria |
| AC-15 | T6 | V9, V12 | Documentation assertions for all required behavior, migration, and confidentiality | README; docs index; phase-1; phase-3; phase-4; PRD | ADR-260817; CC-260817; CC-260806-rpiv-stage-contract |
| AC-16 | T5, T7, T8, T9 | V8, V10, V11, V12 | AC evidence index; zero stale skill references; synchronized 0.2.0 package proof; passing just recipes | README; docs index; phase-5 upgrade guidance | CC-260806-project-command-interface; CC-260815-package-semver-governance; CC-260817 |

Coverage proof: all 16 ordered acceptance criteria have implementation tasks, executable validation, expected evidence, documentation scope, and architecture references before these plan artifacts were written.

## Implementation Tasks
1. **T1 — Model and resolve exact tmux targets (AC-1, AC-2, AC-3, AC-6, AC-8, AC-9, AC-12):** add ephemeral invoking-evidence parsing, deterministic repository-owned fallback derivation, typed refusals, `TmuxTargetV2`/pane lineage, and strict v6 persistence without raw tuple/PID retention.
2. **T2 — Route every tmux operation through the persisted socket and immutable IDs (AC-1, AC-3, AC-4, AC-5, AC-6, AC-7, AC-9, AC-11):** change `TmuxPort` and `LiveTmuxPort`, eliminate bare runtime tmux commands, preserve exact attach/capture/restart/remove behavior, and refuse same-name resources.
3. **T3 — Integrate exact targets with orchestration, reconciliation, concurrency, and cleanup (AC-3, AC-4, AC-5, AC-7, AC-10, AC-11, AC-12):** use complete one-pass target equality and durable progress so lifecycle context and overlaps cannot mix identities.
4. **T4 — Extend Doctor with safe target classification (AC-8, AC-12, AC-13):** preserve 24 IDs/private probe while adding bounded read-only invoking/fallback/refusal evidence and unchanged-inventory proof.
5. **T5 — Build isolated-socket acceptance fixtures (AC-1 through AC-14):** add protocol/unit and local tmux integration matrices for visibility, fallback, collisions, lifecycle contexts, refusals, concurrency, idempotence, confidentiality, and cleanup.
6. **T6 — Update user and schema documentation (AC-2, AC-4, AC-6, AC-8, AC-9, AC-11, AC-12, AC-13, AC-15):** update README, docs index, phase 1/3/4 guides, PRD, help/schema examples, migration, and troubleshooting.
7. **T7 — Preserve intentional skill deletions and remove all stale references (AC-16):** retain all eight deleted `.agents/skills` paths, remove the four `skills-lock.json` entries, and prove zero residual live name/path references with tracked-file content and symlink scans excluding dependencies/generated output and the historical research/plan record.
8. **T8 — Release backward-compatible functionality as 0.2.0 (AC-16):** synchronize package/lock root versions, official asset version, package/install fixtures, manifests, tests, and exact 0.1.3-to-0.2.0 upgrade/reinstall guidance without dependency churn.
9. **T9 — Execute root validation and assemble Implement handoff (AC-16):** run focused and full root `justfile` recipes, map inspectable outputs to AC-1..AC-16, record documentation/deletion/version evidence, and commit the implementation with a Conventional Commit and required trailer.
