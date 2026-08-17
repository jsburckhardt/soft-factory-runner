# Task Breakdown: Preserve the invoking tmux server and session for issue windows

## Task T1: Model and resolve exact tmux targets

- **Status:** Completed
- **Complexity:** High
- **Dependencies:** None
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-6, AC-8, AC-9, AC-12
- **Related ADRs:** ADR-260817-invoking-tmux-context-targeting; ADR-260814-tmux-identity-failure-recovery
- **Related Core-Components:** CORE-COMPONENT-260817-exact-tmux-context-ownership; CORE-COMPONENT-260810-persistence-recovery; CORE-COMPONENT-260810-error-handling; CORE-COMPONENT-260810-subprocess-execution

### Description
Add a pure selection domain and typed adapter seam that captures `TMUX`/`TMUX_PANE` only at command entry, strictly distinguishes complete absence from invalid evidence, validates one invoking socket/pane/session through one bounded read-only query, and derives an atomically owned deterministic standalone socket/session for absence. Add closed refusal reasons and deterministic collision-resistant repository tokens. Introduce `TmuxTargetV2`, `PaneLineageV2`, `RunSnapshotV6`, compatible v1-v5 readers, complete v2 event support, strict parsing, and non-authorizing legacy behavior. The raw tuple, pane evidence, server PID, invalid values, and unrelated inherited environment must never enter serializable objects.

### Acceptance Criteria
- Valid invoking evidence resolves exactly one canonical socket filesystem identity and current session without mutation (AC-1).
- Fallback derivation repeats for one repository and separates distinct repository identities, including legacy-normalization collisions (AC-2, AC-9).
- V6 state persists complete selected socket/session/window/pane identity while v1-v5 never infer missing server authority (AC-3).
- Same-name, malformed, stale, partial, nested, contradictory, and ambiguous inputs return typed nonzero refusals before ownership or tmux mutation (AC-6, AC-8, AC-9).
- No raw context tuple, server PID, invalid sentinel, or unrelated inherited value is serializable or rendered (AC-12).

### Test Coverage
- Unit tables for exact absence, partial presence, closed tuple/pane grammar, stopped socket, cross-socket pane, session contradiction, nested/multiple credible targets, timeout, and malformed zero-exit output.
- Deterministic fallback repeat/distinct/collision tests and ownership-record mismatch tests.
- Strict v6 snapshot/event round trips, unknown-field rejection, v1-v5 compatibility reads, and legacy mutation refusal.
- Sentinel scans of errors, selections, snapshots, events, and render-ready facts.

### Expected Evidence
- Resolver call ledger showing one bounded read-only command or zero commands for fallback.
- Golden v6 snapshot/event fixtures containing complete selected identity and no raw/PID fields.
- Matrix of closed refusal codes with unchanged state and target inventories.
- Equal/different standalone target derivation assertions for required repository cases.

## Task T2: Route all tmux operations through persisted exact selectors

- **Status:** Completed
- **Complexity:** High
- **Dependencies:** T1
- **Acceptance Criteria:** AC-1, AC-3, AC-4, AC-5, AC-6, AC-7, AC-9, AC-11
- **Related ADRs:** ADR-260817-invoking-tmux-context-targeting; ADR-260811-prototype-one-run-orchestration; ADR-260814-tmux-identity-failure-recovery
- **Related Core-Components:** CORE-COMPONENT-260817-exact-tmux-context-ownership; CORE-COMPONENT-260814-tmux-identity-diagnostics; CORE-COMPONENT-260810-subprocess-execution

### Description
Refactor `TmuxPort`, `LiveTmuxPort`, command construction, and injected test adapters so create, name observation, exact observation, pane PID, remain-on-exit, capture, restart, remove, and attach all receive a selected/persisted target and prepend the explicit `-S` selector. Create in the invoking session ID; create/reuse only a proved owned fallback session. Observe complete identity in one strict original-byte record. Use immutable IDs for pane and window operations, omit ambient tmux variables from all children, and remove every bare normal-runtime tmux command. Preserve same-name refusal and require exact match before content or mutation.

### Acceptance Criteria
- One custom-socket run creates/queries only on the invoking socket/session and leaves default-server inventory empty for the run (AC-1).
- Every lifecycle adapter call uses the persisted socket and immutable IDs regardless of caller context (AC-3, AC-4).
- Attach selects the exact pane, logs capture the exact pane, and cleanup kills only the exact window ID (AC-5, AC-7).
- Existing same-name windows in invoking or fallback targets are preserved and never adopted (AC-6, AC-9).
- Absent/mismatched attach, logs, and resume paths perform zero tmux mutation; repeated proved-absent stop/cleanup is stable (AC-11).

### Test Coverage
- Argument-vector assertions requiring `tmux -S <selected>` on every runtime method and banning bare commands.
- Controlled parser tests for complete target records, malformed output, nonzero absence, and socket-filesystem mismatch.
- Twin-server equal-name/equal-local-ID tests for attach, capture, restart, stop lineage, and immutable window removal.
- Context matrix for original session, other socket/session, and no ambient tmux.

### Expected Evidence
- Complete adapter command trace with explicit selectors and immutable target IDs.
- Before/after inventories for selected, default, and unrelated servers.
- Exact pane transcript fixture and attach/remove target assertions.
- Zero-call mutation traces for same-name, absent, and mismatch refusals.

## Task T3: Integrate exact target reconciliation and lifecycle concurrency

- **Status:** Completed
- **Complexity:** High
- **Dependencies:** T1, T2
- **Acceptance Criteria:** AC-3, AC-4, AC-5, AC-7, AC-10, AC-11, AC-12
- **Related ADRs:** ADR-260817-invoking-tmux-context-targeting; ADR-260811-prototype-three-recovery-concurrency
- **Related Core-Components:** CORE-COMPONENT-260817-exact-tmux-context-ownership; CORE-COMPONENT-260811-run-reconciliation-control; CORE-COMPONENT-260811-concurrent-run-admission; CORE-COMPONENT-260811-owned-resource-cleanup; CORE-COMPONENT-260810-issue-worktree-locking

### Description
Thread `TmuxTargetV2` through preparation, launch intent, process pane lineage, status, reconcile, resume, attach, logs, stop, and cleanup. Upgrade report/status schemas explicitly. Build one complete observation classification without field mixing; authorize actions only on full equality. Preserve same-issue lock/lease ordering before target mutation. Coordinate cleanup intent/progress and one-pass observations so status/reconcile overlap reports a whole old target or complete absence. Keep idempotence tied to terminal state or same-owner cleanup progress, not inferred absence.

### Acceptance Criteria
- Shared reconciliation compares socket filesystem, session, window, pane, and cwd and gates every lifecycle action (AC-3, AC-4).
- Human and JSON outputs derive from identical complete match/absence/mismatch facts in all invocation contexts (AC-4).
- Stop, logs, attach, and cleanup act only on complete matches and preserve the other server inventory (AC-5, AC-7).
- Same-issue starts yield one owner/window; cleanup overlaps never expose mixed target identity (AC-10).
- Repeated proved-absent terminal operations are idempotent; unproved absent/mismatch actions refuse without mutation (AC-11).
- Target facts rendered or retained for control never disclose prohibited invoking values (AC-12).

### Test Coverage
- Pure report matrix changing each target field independently, with unknown-before-mismatch precedence and no destructive safe actions.
- CLI human/JSON parity for exact, absent, mismatched, and malformed target outcomes.
- Deterministic same-issue start barrier plus cleanup/status and cleanup/reconcile barriers.
- Repeated stop/cleanup and absent/mismatched attach/logs/resume operation traces.
- Process lineage tests requiring the v2 socket/session/pane target.

### Expected Evidence
- Reconciliation decision table and renderer snapshots.
- Barrier ledger proving one owner/window and whole-target-or-absence overlap results.
- Cleanup progress/event sequence and unchanged unrelated inventories.
- Idempotent repeated output and zero unauthorized calls.

## Task T4: Extend Doctor with safe target classification

- **Status:** Completed
- **Complexity:** High
- **Dependencies:** T1, T2
- **Acceptance Criteria:** AC-8, AC-12, AC-13
- **Related ADRs:** ADR-260817-invoking-tmux-context-targeting; ADR-260812-repository-doctor-readiness
- **Related Core-Components:** CORE-COMPONENT-260817-exact-tmux-context-ownership; CORE-COMPONENT-260812-repository-doctor-contract; CORE-COMPONENT-260814-tmux-identity-diagnostics

### Description
Preserve DoctorResultV2, the exact ordered 24 check IDs, aggregate timing, and private functional probe. Add `DoctorTmuxTargetingEvidenceV1` to `command.tmux`, invoking the shared resolver in read-only mode. Report only `invoking-valid`, `standalone-fallback`, or a closed invalid reason plus bounds and unchanged booleans. Never create fallback resources or mutate/read outside the one evidenced socket. Compare ephemeral before/after inventories and keep all values, paths, IDs, raw tuple bytes, and server PID out of results.

### Acceptance Criteria
- Doctor distinguishes valid invoking, outside fallback, and each invalid matrix row with bounded machine-readable evidence (AC-13).
- Every invalid row is non-ready/nonzero and leaves run and isolated-server inventories byte-identical (AC-8, AC-13).
- Human and JSON Doctor evidence has identical value-free meaning and excludes every sentinel/raw tuple/server PID (AC-12, AC-13).
- Existing private mechanics, 24 IDs, cleanup milestones, and unrelated-resource isolation remain intact.

### Test Coverage
- Resolver classification matrix integrated through `command.tmux` and both renderers.
- Timing/call-count assertions and no-mutation tripwires for invoking/fallback/invalid modes.
- Existing private-probe, malformed transport, overlap, and cleanup suites as regression coverage.
- Sentinel and schema exactness scans for Doctor output/evidence.

### Expected Evidence
- Ordered 24-check Doctor fixtures carrying the new closed targeting evidence.
- Human/JSON normalized equality output.
- Before/after server inventory digests and private-probe cleanup trace.
- Deadline and one-pass call-count proof.

## Task T5: Build isolated-socket acceptance fixtures

- **Status:** Completed
- **Complexity:** High
- **Dependencies:** T1, T2, T3, T4
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11, AC-12, AC-13, AC-14
- **Related ADRs:** ADR-260817-invoking-tmux-context-targeting; ADR-260814-tmux-identity-failure-recovery; ADR-260812-repository-doctor-readiness
- **Related Core-Components:** CORE-COMPONENT-260817-exact-tmux-context-ownership; CORE-COMPONENT-260806-agent-executable-acceptance-criteria; CORE-COMPONENT-260810-development-standards

### Description
Create repeatable repository-local fixtures using temporary mode-restricted directories, explicit isolated tmux sockets/configs/sessions, deterministic helpers/barriers, unconditional exact cleanup, and machine-readable inventories. Cover custom-socket visibility/default absence, fallback derivation, persisted lifecycle calls from three ambient contexts, twin-server collisions, full invalid evidence, same-name refusal, same-issue race, cleanup overlaps, repeated absent behavior, and confidentiality. Prefer real local tmux integration for socket routing while retaining controlled protocol adapters for malformed bytes and deterministic faults. Require no credentials, network, Sparkta installation, or ambient default server.

### Acceptance Criteria
- The isolated suite directly proves every behavioral AC-1 through AC-13 and records an AC-indexed scenario ledger (AC-14).
- Every scenario verifies cleanup and byte-identical unrelated inventories, including failure paths (AC-5, AC-7, AC-8, AC-10, AC-13, AC-14).
- Fixture environment explicitly proves no credentials/network/ambient server dependence (AC-14).
- Repeated runs are deterministic and do not leak sentinel values (AC-12, AC-14).

### Test Coverage
- New focused unit/integration files plus existing orchestration, reconciliation, recovery, tmux identity, Doctor, documentation, and concurrency regression suites.
- Scenario manifest asserting at least one direct evidence member for every AC-1 through AC-14.
- Global coverage remains at least 80 percent for statements, branches, functions, and lines.

### Expected Evidence
- Machine-readable scenario ledger, command traces, before/after inventories, and cleanup results.
- Repeat-run equality output and bounded timing results.
- Coverage report and no-network/no-credential tripwire results.
- AC-1..AC-14 evidence index suitable for implementation notes.

## Task T6: Update user and schema documentation

- **Status:** Completed
- **Complexity:** Medium
- **Dependencies:** T1, T2, T3, T4
- **Acceptance Criteria:** AC-2, AC-4, AC-6, AC-8, AC-9, AC-11, AC-12, AC-13, AC-15
- **Related ADRs:** ADR-260817-invoking-tmux-context-targeting; ADR-260812-repository-doctor-readiness
- **Related Core-Components:** CORE-COMPONENT-260817-exact-tmux-context-ownership; CORE-COMPONENT-260806-rpiv-stage-contract; CORE-COMPONENT-260815-package-semver-governance

### Description
Update README, `docs/README.md`, phase-1 issue run, phase-3 recovery, phase-4 Doctor, phase-5 release guidance, PRD, CLI help, schema examples, migration notes, troubleshooting, and documentation tests. Explain valid in-tmux selection, deterministic owned standalone fallback, complete persisted target, later invocation context independence, invalid/stale/nested/ambiguous refusal, same-name non-adoption, repeated absence, confidentiality, Doctor classification, legacy v1-v5 limits, and local/no-service boundaries.

### Acceptance Criteria
- Documentation covers every behavior required by AC-15 and links operational outcomes to commands and stable refusal classes.
- Fallback naming/ownership, lifecycle invocation contexts, same-name refusal, repeated absence, and Doctor evidence are explicit (AC-2, AC-4, AC-6, AC-8, AC-9, AC-11, AC-13).
- Raw tuple/server PID and malformed/unrelated value confidentiality is explicit (AC-12).
- Schema/release migration text agrees with v6, status/report updates, and 0.2.0.

### Test Coverage
- Documentation assertions for all required phrases, command forms, schema versions, confidentiality, no-adoption, and no API/deployment change.
- Parse the documented v6 example with production persistence parser.
- CLI help smoke tests through the root justfile.

### Expected Evidence
- Documentation test output and changed-file inventory.
- Parsed documented v6 fixture.
- Reviewer-ready documentation impact list covering README/API/configuration/usage/migration/architecture/operations/deployment applicability.

## Task T7: Preserve intentional deletions and remove stale skill references

- **Status:** Completed
- **Complexity:** Low
- **Dependencies:** None
- **Acceptance Criteria:** AC-16
- **Related ADRs:** ADR-260811-engineering-harness-surface
- **Related Core-Components:** CORE-COMPONENT-260811-engineering-harness-interface; CORE-COMPONENT-260806-rpiv-stage-contract

### Description
Preserve the eight intentional deletions exactly: `.agents/skills/eng-harness-in-a-box/SKILL.md`, `.agents/skills/plan-0-v2-constitution/SKILL.md`, `.agents/skills/plan-v2-extract-domain/SKILL.md`, `.agents/skills/validate-v2/SKILL.md`, and `.agents/skills/validate-v2/references/{artifact-checks.md,contract-and-forward-compatibility.md,examples.md,record-template.md}`. Remove the four stale lock entries named `eng-harness-in-a-box`, `plan-0-v2-constitution`, `plan-v2-extract-domain`, and `validate-v2`. Do not restore or recreate deleted files. Verify tracked/live content and symlinks with explicit exclusions for `.git`, dependencies, generated `dist`, coverage, and historical RPIV records that intentionally document the deletion.

### Acceptance Criteria
- Git continues to report all eight paths deleted and none recreated.
- `skills-lock.json` contains no entry for any of the four deleted skills and remains valid schema/version JSON.
- No live product/configuration/agent/skill/symlink content references any deleted name or path; only historical research/plan evidence may name them.
- Root focused/full validation includes inspectable reference-removal proof (AC-16).

### Test Coverage
- JSON parse and exact-key assertions for `skills-lock.json`.
- `git diff --name-status --diff-filter=D` exact eight-path assertion.
- `git grep`/tracked-file and symlink inventory scans with declared exclusions and explicit historical-artifact allowance.

### Expected Evidence
- Exact eight-line deletion inventory.
- Four removed lock-entry diff and parsed remaining-key list.
- Zero-live-reference scan transcript with exclusion policy.

## Task T8: Release backward-compatible functionality as 0.2.0

- **Status:** Completed
- **Complexity:** Medium
- **Dependencies:** T6, T7
- **Acceptance Criteria:** AC-16
- **Related ADRs:** ADR-260817-invoking-tmux-context-targeting; ADR-260812-official-asset-distribution-installation
- **Related Core-Components:** CORE-COMPONENT-260815-package-semver-governance; CORE-COMPONENT-260812-official-asset-installation-contract

### Description
Apply the project SemVer policy: Issue #36 adds backward-compatible functionality, so increment MINOR from 0.1.3 to 0.2.0. Synchronize `package.json`, top-level/root package lock entries, `OFFICIAL_ASSET_VERSION`, current package/install fixtures, manifest expectations, documentation tests, README/docs current-release text, and exact 0.1.3-to-0.2.0 upgrade/reinstall/confirmation/reconvergence guidance. Preserve all dependency versions, ranges, and package inventory except intentional source/doc additions.

### Acceptance Criteria
- Every authoritative Runner and official-asset release surface equals 0.2.0.
- Packed and clean-installed metadata report 0.2.0; generated official manifest reports 0.2.0.
- Upgrade guidance starts at 0.1.3 and confirms 0.2.0 without claiming registry publication or a nonexistent version command.
- Third-party dependency metadata is unchanged and release evidence passes root validation (AC-16).

### Test Coverage
- Version synchronization unit tests, `npm pack --dry-run --json`, temporary pack/install metadata, and official asset reconvergence/idempotence tests.
- Lockfile dependency-diff and package-inventory checks.
- Documentation assertions for exact upgrade/reinstall commands.

### Expected Evidence
- Version surface matrix with all entries at 0.2.0.
- Packed filename/metadata and temporary install output.
- Dependency/package inventory diff proving no churn.
- Generated manifest and repeated `ASSETS_UP_TO_DATE` result.

## Task T9: Execute root validation and prepare Implement handoff

- **Status:** Completed
- **Complexity:** Medium
- **Dependencies:** T3, T5, T6, T7, T8
- **Acceptance Criteria:** AC-16
- **Related ADRs:** ADR-260817-invoking-tmux-context-targeting
- **Related Core-Components:** CORE-COMPONENT-260817-exact-tmux-context-ownership; CORE-COMPONENT-260806-project-command-interface; CORE-COMPONENT-260806-rpiv-stage-contract; CORE-COMPONENT-260505-commit-standards

### Description
Run the root `justfile` validation authority, capture focused feedback and final full proof, and write `implementation/00-implementation.md` with task completion, AC-1..AC-16 evidence, isolated inventory proof, documentation impact, deletion/reference proof, version synchronization, and concrete friction harvest. Inspect the complete diff and commit implementation using Conventional Commits and the required Copilot trailer before Verify handoff.

### Acceptance Criteria
- `just verify-focused` and `just verify` pass from the completed tree with inspectable outputs (AC-16).
- Implementation notes map each AC to exact test/evidence paths and include all deletion, reference, documentation, release, and cleanup proof.
- The implementation commit is clean, conventional, and includes the required trailer; handoff identifies branch, commit SHA, and final validation.

### Test Coverage
- Run `just verify-focused` during implementation and `just verify` as final authority.
- Inspect coverage thresholds, `git diff --check`, clean status, commit format/trailer, and AC evidence completeness.
- Optionally run harness delegated checks only as supplementary structured feedback after reading their instructions.

### Expected Evidence
- Focused/full command transcripts with exit 0.
- Completed `implementation/00-implementation.md` AC matrix.
- Clean-tree status, implementation commit SHA, Conventional Commit subject, and trailer.
- Implement-to-Verify handoff naming `just verify` as the snapshotted final validation.
