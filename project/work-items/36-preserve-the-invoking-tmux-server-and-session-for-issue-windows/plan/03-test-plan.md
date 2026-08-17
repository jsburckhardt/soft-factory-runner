# Test Plan: Preserve the invoking tmux server and session for issue windows

## Test V1: Custom-socket invoking context visibility

- **Type:** Local isolated-socket integration
- **Task:** T1, T2, T5
- **Acceptance Criteria:** AC-1
- **Priority:** Critical

### Setup
Start an isolated custom-socket tmux server/session and a separately isolated default-server tripwire. Invoke one run from a client/pane on the custom socket with repository-local fake Git/GitHub/Copilot dependencies and snapshot every server inventory.

### Steps
1. Capture complete custom and default inventories.
2. Invoke `run` with valid `TMUX`/`TMUX_PANE` evidence.
3. Query the selected socket/session once with the production identity format.
4. Capture all inventories and unconditionally clean owned fixtures.

### Expected Result
Exactly one Runner-owned issue window/pane exists in the invoking current session; persisted identity equals the bounded query; no same-run window exists on the default server.

### Expected Evidence
Explicit `-S` command trace, selected session/window/pane record, default-server before/after equality, v6 snapshot, and cleanup proof.

## Test V2: Deterministic standalone fallback and non-adoption

- **Type:** Unit plus isolated integration matrix
- **Task:** T1, T2, T5
- **Acceptance Criteria:** AC-2, AC-6, AC-9
- **Priority:** Critical

### Setup
Provide no invoking evidence for two sequential clean runs of one repository, runs for two distinct repository identities including a legacy-normalization collision pair, and a fallback target containing an unowned expected-name window.

### Steps
1. Derive fallback target twice for the same repository and once per distinct repository.
2. Exercise atomic ownership creation/reuse with exact socket identity.
3. Place an expected-name collision and attempt the run.
4. Compare all target and state inventories.

### Expected Result
Same-repository derivations match; distinct identities differ; absence never contacts an arbitrary/default server; the expected-name window is preserved and the run refuses before creation/adoption.

### Expected Evidence
Target derivation table, ownership metadata assertions, explicit contacted-socket ledger, collision refusal code, and byte-identical collision inventory.

## Test V3: V6 persistence and lifecycle context parity

- **Type:** Persistence, reconciliation, and CLI contract
- **Task:** T1, T3, T5
- **Acceptance Criteria:** AC-3, AC-4
- **Priority:** Critical

### Setup
Create strict v6 fixtures for exact, absent, each-field mismatch, and malformed observation. Invoke status/reconcile/resume plus renderer paths from original tmux context, another socket/session, and no tmux context.

### Steps
1. Round-trip v6 snapshots and complete transition events.
2. Change socket filesystem, session, window, pane, and cwd fields independently.
3. Execute each lifecycle observation in all three ambient contexts.
4. Normalize human and JSON facts for comparison.

### Expected Result
Only complete target equality authorizes action. Ambient context never changes the selected socket. Every human/JSON pair agrees on match, absence, mismatch, or unknown. Legacy v1-v5 data never invents a selector.

### Expected Evidence
Persistence fixtures, complete equality decision table, per-context command traces, renderer equivalence snapshots, and legacy refusal assertions.

## Test V4: Exact lifecycle action and twin-server isolation

- **Type:** Local isolated-socket lifecycle integration
- **Task:** T2, T3, T5
- **Acceptance Criteria:** AC-4, AC-5, AC-7, AC-11
- **Priority:** Critical

### Setup
Start two isolated servers with identical session/window names and intentionally equal-looking local IDs where the fixture supports them. Persist one exact target per run and distinct pane transcripts.

### Steps
1. Run status, attach, logs, stop, and explicit cleanup against each persisted target from three ambient contexts.
2. Assert attach/capture use pane ID and cleanup uses immutable window ID on the persisted socket.
3. Clean the first run and inventory both servers.
4. Repeat absent stop/cleanup and invoke attach/logs/resume against absent and mismatched fixtures.

### Expected Result
Each action observes or mutates only its persisted server. Logs contain only the selected transcript. First cleanup removes only its window. Repeats are stable when absence is proved; attach/logs/resume refusals are nonzero with zero mutation.

### Expected Evidence
Per-server before/after inventories, action argument traces, transcript comparison, repeated outcome snapshots, and zero-call refusal ledgers.

## Test V5: Invalid context, same-name, and confidentiality matrix

- **Type:** Table-driven unit and CLI security regression
- **Task:** T1, T2, T3, T5
- **Acceptance Criteria:** AC-6, AC-8, AC-9, AC-12
- **Priority:** Critical

### Setup
Build finite rows for partial/malformed tuple and pane evidence, stopped socket, cross-socket pane, nested/contradictory credible targets, zero/multiple current sessions, timeout, malformed zero-exit response, absent fallback, and expected-name collisions. Place unique sentinels in malformed and unrelated environment values.

### Steps
1. Snapshot run state and every isolated server before each row.
2. Execute human and JSON command forms.
3. Compare exit/code/meaning and mutation traces.
4. Scan errors, outputs, snapshots, events, diagnostics, logs, and serialized test evidence for all sentinels, raw tuple fields, and server PID.

### Expected Result
Every invalid row exits nonzero with a closed machine code before mutation and never falls back. Same-name resources are preserved. All inventories remain byte-identical. No prohibited value appears on any durable or rendered surface.

### Expected Evidence
Row-by-row refusal manifest, before/after byte comparison, zero mutation trace, human/JSON normalized parity, and complete sentinel scan report.

## Test V6: Same-issue and cleanup overlap concurrency

- **Type:** Deterministic barrier concurrency
- **Task:** T3, T5
- **Acceptance Criteria:** AC-10, AC-11
- **Priority:** Critical

### Setup
Use real exclusive lock creation and barriers around target selection/window creation, cleanup/window removal, status observation, and reconcile observation.

### Steps
1. Start two same-issue runs simultaneously.
2. Overlap one cleanup with status and separately with reconcile at the observation/removal boundary.
3. Repeat terminal stop/cleanup after absence.
4. Inventory selected and unrelated servers after every overlap.

### Expected Result
Exactly one start owns one window. Each overlap returns either one complete pre-cleanup identity or complete absence, never mixed fields. No operation mutates another server/session. Repeated proved-absent operations remain stable.

### Expected Evidence
Barrier trace, owner/window counts, whole-record report snapshots, cleanup progress/event ordering, and unchanged unrelated inventories.

## Test V7: Doctor targeting classification and isolation

- **Type:** Doctor service and isolated-process integration
- **Task:** T4, T5
- **Acceptance Criteria:** AC-8, AC-12, AC-13
- **Priority:** Critical

### Setup
Retain the private Doctor mechanics probe and construct valid invoking, no-evidence fallback, and every invalid resolver row using isolated sockets. Add ambient/default/unrelated mutation tripwires and sentinel values.

### Steps
1. Run Doctor human and JSON forms for every mode/row.
2. Assert exact 24-ID order and inspect `command.tmux` targeting evidence.
3. Check one-pass/time bounds and private cleanup milestones.
4. Compare all before/after inventories and scan rendered evidence.

### Expected Result
Doctor distinguishes `invoking-valid`, `standalone-fallback`, and each closed invalid reason without changing the 24 IDs. Invalid rows are NOT READY/nonzero. All checks are bounded, all unrelated inventories are unchanged, and evidence is value-free.

### Expected Evidence
Updated Doctor fixture manifests, normalized human/JSON equality, command/timing ledger, private cleanup states, unchanged booleans/inventories, and sentinel scan.

## Test V8: AC-indexed repository-local isolated scenario suite

- **Type:** Focused acceptance integration suite
- **Task:** T5, T9
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11, AC-12, AC-13, AC-14, AC-16
- **Priority:** Critical

### Setup
Compose all isolated fixtures under repository-controlled temporary roots with explicit sockets/configurations, no credential variables, network tripwires, deterministic helpers, and unconditional cleanup.

### Steps
1. Execute every scenario in the AC ledger twice where repetition is relevant.
2. Validate each ledger member points to machine-observable assertions.
3. Verify all owned processes, sockets, sessions, windows, workspaces, and files are absent or intentionally retained afterward.
4. Run the focused root recipe for the suite.

### Expected Result
The ledger supplies direct repeatable proof for AC-1 through AC-14 without credentials, network, Sparkta, or ambient tmux. Cleanup and unrelated-resource invariants hold in success and failure paths.

### Expected Evidence
AC-indexed JSON/Markdown ledger, focused exit-0 transcript, inventories, cleanup report, bounds, and no-network/no-credential tripwire output.

## Test V9: User documentation and schema contract

- **Type:** Documentation assertions and smoke tests
- **Task:** T6
- **Acceptance Criteria:** AC-2, AC-4, AC-6, AC-8, AC-9, AC-11, AC-12, AC-13, AC-15
- **Priority:** High

### Setup
Load README, docs index, phase-1/3/4/5 guides, PRD, architecture links, and CLI help. Extract the documented v6 example.

### Steps
1. Assert required invoking, fallback, lifecycle-context, invalid/stale, confidentiality, Doctor, repeated-absence, and non-adoption language.
2. Parse the documented v6 snapshot with production code.
3. Smoke-test help through `just run --help`.
4. Assert migration, 0.2.0, no API/service/deployment impact, and cross-document consistency.

### Expected Result
Documentation fully explains AC-15 and all linked operational details, examples parse, and no stale default-server or v5-new-run claims remain.

### Expected Evidence
Documentation test transcript, parsed example, help output, and document/requirement coverage list.

## Test V10: Intentional deletion and residual-reference proof

- **Type:** Repository inventory validation
- **Task:** T7, T9
- **Acceptance Criteria:** AC-16
- **Priority:** Critical

### Setup
Use Git tracked-file inventories and explicit exclusions for `.git`, dependencies, generated `dist`, coverage, and historical RPIV records. Parse `skills-lock.json` and enumerate symlinks.

### Steps
1. Assert the exact eight required `.agents/skills` paths remain deleted.
2. Assert four deleted skill keys are absent from `skills-lock.json`.
3. Search all live tracked/untracked product, configuration, agent, and skill content for deleted names and paths.
4. Inspect symlink targets and the final diff to ensure no restoration.

### Expected Result
All eight deletions remain, all four lock references are removed, JSON remains valid, and no live residual name/path reference or symlink exists. Historical research/plan mentions are explicitly classified as evidence, not live references.

### Expected Evidence
Exact deletion list, parsed lock key list, zero-live-reference output with exclusions, symlink inventory, and diff excerpt.

## Test V11: Semantic version 0.2.0 synchronization

- **Type:** Package/release integration
- **Task:** T8, T9
- **Acceptance Criteria:** AC-16
- **Priority:** High

### Setup
Prepare repository-local temporary pack and install directories. Snapshot dependency ranges, lock dependency metadata, and package inventory before the release-only edits.

### Steps
1. Assert package, lock root, official asset, fixtures, manifests, tests, and docs all select 0.2.0.
2. Run package dry-run, pack, and clean install; read installed metadata.
3. Generate/reconverge official assets and repeat for idempotence.
4. Compare dependency and package inventories and inspect 0.1.3-to-0.2.0 guidance.

### Expected Result
Every authoritative surface reports 0.2.0, the packed/installed package and generated manifest agree, repeat installation is up to date, and no dependency churn occurs.

### Expected Evidence
Version matrix, pack/install metadata, manifest output, idempotence result, dependency diff, and documentation assertion output.

## Test V12: Root focused and full verification

- **Type:** Repository quality gate
- **Task:** T5, T6, T7, T8, T9
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15, AC-16
- **Priority:** Critical

### Setup
Complete implementation, tests, documentation, deletions, reference cleanup, and release synchronization on the requested branch. Ensure temporary fixture resources are absent before and after validation.

### Steps
1. Run `just verify-focused` during implementation with relevant test filters as needed.
2. Run final `just verify` from the repository root.
3. Inspect coverage thresholds, `git diff --check`, final fixture cleanup, and AC evidence index.
4. Record exact outputs and final clean-tree/commit handoff facts.

### Expected Result
Both root-authority recipes pass; lint, formatting, types, tests, coverage, build, and diff checks succeed; every AC has inspectable evidence; no fixture resources leak.

### Expected Evidence
Focused and full exit-0 transcripts, coverage summary, build output, diff-check result, cleanup inventory, AC-1..AC-16 implementation matrix, and final commit SHA.
