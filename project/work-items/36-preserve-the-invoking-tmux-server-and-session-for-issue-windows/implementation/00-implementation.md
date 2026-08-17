# Implementation Notes: Issue #36 Verify-return correction

## Scope

Resolved the final Verify return for AC-13 and AC-15 within the accepted Issue #36 tmux-targeting contracts. Doctor no longer treats directory entries as tmux inventory evidence. It now compares bounded, original-byte inventories of actual server resources through explicit socket selectors while rendering only the existing value-free booleans. Release surfaces remain `0.2.0`; no ADR, core-component, configuration, API, migration, deployment, or dependency change was required.

## Completed Tasks

- [x] T1 — Prior schema/architecture consistency correction remains complete and unchanged.
- [x] T2 — Corrected README, PRD, Phase 4 Doctor guidance, and documentation assertions to describe actual tmux-resource inventory proof.
- [x] T3 — Added the live explicit-server inventory adapter and a real custom-socket/default-server regression that fails under directory-entry inventory logic.
- [x] T4 — Refreshed AC evidence, drained Implement friction, and passed the required focused/full harness and direct root gates.

## Actual Tmux Inventory Evidence

- `src/live.ts` implements `TmuxPort.inventoryServerResources` as one read-only `tmux -S <socket> list-panes -a -F ...` query. The ephemeral inventory contains socket device/inode and original bytes for every session/window/pane identity, name, and cwd record.
- Each query is bounded to 2,000 ms, 65,536 bytes, and 1,024 records. Missing sockets have a closed absence encoding; socket replacement, malformed records, command failure, and overflow cannot produce unchanged resource proof.
- `src/doctor-service.ts` uses the structurally parseable invoking custom socket plus the explicit default socket. For fallback or structurally unusable evidence, it uses the explicit default socket plus the same deterministic standalone selector used by live target selection. It never creates a server while inventorying.
- Raw socket paths, resource records, names, identities, and cwd values remain ephemeral. `DoctorTmuxTargetingEvidenceV1` still emits only mode/reason, bounds, `inventoryMeasured`, `ambientUnchanged`, and `unrelatedUnchanged`.
- `src/tmux-context.test.ts` starts isolated custom and explicit default servers, adds a window to the existing default server during classification, proves the socket-directory entries remain exactly equal, and requires `unrelatedUnchanged: false` while `ambientUnchanged: true`. The prior directory-entry implementation would report both unchanged and therefore fails this regression.

## Acceptance Evidence

- **AC-1:** Existing `src/tmux-context.test.ts`, `src/orchestration.test.ts`, and `src/issue-36-repository.test.ts` custom-socket creation proof remains passing.
- **AC-2:** Existing deterministic standalone and distinct-repository target tests remain passing.
- **AC-3:** Existing snapshot-v6 and reconciliation-v3 persistence/equality tests remain passing; this correction changes no persisted schema.
- **AC-4:** Existing persisted-target lifecycle and status-v5 human/JSON parity tests remain passing.
- **AC-5:** Existing exact attach, capture, status non-mutation, and cleanup tests remain passing.
- **AC-6:** Existing same-name collision refusal and zero-adoption tests remain passing.
- **AC-7:** Existing twin-server isolation and cleanup inventory tests remain passing.
- **AC-8:** Existing invalid-context matrix remains non-mutating; Doctor now measures actual resources for parseable selectors and default/standalone resources when no safe invoking selector exists.
- **AC-9:** Existing absence-only fallback and preserved collision tests remain passing.
- **AC-10:** Existing one-owner and bounded overlap tests remain passing.
- **AC-11:** Existing repeated absence/refusal tests remain passing.
- **AC-12:** New inventories remain ephemeral and render no selector/resource values; the regression scans evidence for both isolated socket paths, and existing sentinel suites remain passing.
- **AC-13:** `src/live.ts`, `src/doctor-service.ts`, and the new `src/tmux-context.test.ts` regression prove actual before/after custom/default or default/standalone server inventories. The regression mutates a real unrelated server without changing directory entries and observes `unrelatedUnchanged: false`.
- **AC-14:** The new proof is repository-local, uses isolated sockets/sessions and no credentials or network, and unconditionally kills both servers/removes its temporary tree.
- **AC-15:** `README.md`, `PRD.md`, and `docs/phase-4-repository-doctor.md` now state the exact selectors, resources, bounds, confidentiality boundary, and why directory entries are insufficient. Existing invoking/fallback/lifecycle/refusal/non-adoption guidance remains intact; `src/documentation.test.ts` enforces the corrected claims.
- **AC-16:** Final harness/direct focused and full gates each exited 0 with 26 suites and 587 tests passing. This is implementation evidence for independent Verify, not a final acceptance claim.

## Documentation Evidence

- `README.md`: user-facing Doctor behavior now names actual custom/default or default/standalone resource inventories, bounds, and ephemeral values.
- `PRD.md`: acceptance contract explicitly rejects directory entries as inventory proof.
- `docs/phase-4-repository-doctor.md`: operational detail documents exact `-S`/`list-panes -a` queries, selector matrix, bounds, failure behavior, and confidentiality.
- `src/documentation.test.ts`: requires the actual-resource, explicit-selector, directory-gap, and byte-bound statements.
- No README setup command, API contract, configuration option/default, migration, usage command, runtime deployment, or architecture contract changed.

## Validation

- `harness checks --focused --json`: first run exposed an unrelated temporary Git clone `maintenance.lock` failure; clean retry status `ok`, delegated `just verify-focused`, exit 0, 26 suites/587 tests.
- `just verify-focused`: final exit 0, 26 suites/587 tests; `git diff --check` passed.
- `harness checks --json`: first run exposed lint-forbidden test assertions; after explicit adapter guards, retry status `ok`, delegated `just verify`, exit 0; lint, formatting, types, coverage tests, build, and diff check passed.
- `just verify`: final exit 0; lint, formatting, types, 26 suites/587 tests with coverage, build, and diff check passed.

## Harness Friction Records

- `.harness/records/retro/2026-08-17/009-issue-36-rpiv-implementer-verify-return.md` preserves all six new Implement observations as schema 1.2 with matching agent and plan IDs. It was read back before the successful clear envelope (`status: ok`, `cleared: 6`).
- Coordinator, Research, and Plan buffers were empty; no synthetic records were created.

Implementation is prepared for independent Verify review and does not claim final verification or acceptance.
