# Action Plan: Preserve retryable tmux preparation failures with bounded identity diagnostics

## Feature
- **ID:** 29
- **Research Brief:** project/work-items/29-preserve-retryable-tmux-preparation-failures-with-bounded-identity-diagnostics/research/00-research.md
- **Scope Type:** issue
- **Re-entry Baseline:** Commit `84f5cbe138f8e1653624d6a1c8750e2ccceb1036` implements and evidences AC-1 through AC-9 only. AC-10 was added later and is not claimed by that commit.

## ADRs Created
- Created in the original Plan: [ADR-260814-tmux-identity-failure-recovery](../../../architecture/ADR/ADR-260814-tmux-identity-failure-recovery.md)
- Updated in this AC-10 Plan re-entry, preserving its original basename: [ADR-260812-repository-doctor-readiness](../../../architecture/ADR/ADR-260812-repository-doctor-readiness.md)
- Relevant existing and unchanged for AC-10: [ADR-260811-prototype-one-run-orchestration](../../../architecture/ADR/ADR-260811-prototype-one-run-orchestration.md)
- Relevant existing and unchanged for AC-10: [ADR-260811-prototype-three-recovery-concurrency](../../../architecture/ADR/ADR-260811-prototype-three-recovery-concurrency.md)
- Relevant existing: [ADR-260811-engineering-harness-surface](../../../architecture/ADR/ADR-260811-engineering-harness-surface.md)

No new ADR file was created during re-entry. The tmux identity ADR remains unchanged because AC-10 consumes its exact grammar without changing issue-run identity, persistence, or recovery behavior.

## Core-Components Created
- Created in the original Plan: [CORE-COMPONENT-260814-tmux-identity-diagnostics](../../../architecture/core-components/CORE-COMPONENT-260814-tmux-identity-diagnostics.md)
- Updated in this AC-10 Plan re-entry, preserving its original basename: [CORE-COMPONENT-260812-repository-doctor-contract](../../../architecture/core-components/CORE-COMPONENT-260812-repository-doctor-contract.md)
- Updated in the original Plan: [CORE-COMPONENT-260811-run-reconciliation-control](../../../architecture/core-components/CORE-COMPONENT-260811-run-reconciliation-control.md)
- Updated in the original Plan: [CORE-COMPONENT-260811-completion-evidence-reconciliation](../../../architecture/core-components/CORE-COMPONENT-260811-completion-evidence-reconciliation.md)
- Relevant existing: [CORE-COMPONENT-260810-subprocess-execution](../../../architecture/core-components/CORE-COMPONENT-260810-subprocess-execution.md)
- Relevant existing: [CORE-COMPONENT-260810-development-standards](../../../architecture/core-components/CORE-COMPONENT-260810-development-standards.md)
- Relevant existing: [CORE-COMPONENT-260806-project-command-interface](../../../architecture/core-components/CORE-COMPONENT-260806-project-command-interface.md)
- Relevant existing: [CORE-COMPONENT-260811-engineering-harness-interface](../../../architecture/core-components/CORE-COMPONENT-260811-engineering-harness-interface.md)

No new core-component file was created during re-entry. The tmux identity core-component remains unchanged because the Doctor probe reuses, but does not broaden, the accepted byte grammar and value-free diagnostic contract.

## Architecture Re-entry Decisions
- **Decision 135:** Strengthen `command.tmux` with an isolated functional readiness probe while preserving 24 IDs.
- **Decision 136:** Run Doctor tmux probes on managed foreground servers with private sockets and configurations.
- **Decision 137:** Prove tmux readiness through session, window, pane, identity, observation, and cleanup operations.
- **Decision 138:** Reserve final 2500ms of the Doctor deadline for awaited tmux cleanup.
- **Decision 139:** Parse Doctor tmux identities from capped original bytes and reject truncation.
- **Decision 140:** Emit DoctorResultV2 with versioned value-free tmux failure evidence.
- **Decision 141:** Cap each Doctor command output stream at 4096 retained bytes.
- **Decision 142:** Clean every tmux probe path by exact ownership and verify all resources absent.
- **Decision 143:** Isolate tmux probe workspaces under exclusive operating-system temporary directories.

## Settled AC-10 Doctor Probe Contract
- Preserve exactly 24 ordered blocking check IDs. `command.tmux` now means executable presence plus one successful functional probe and proved cleanup; no twenty-fifth ID is added.
- Create one mode-0700 `mkdtemp` workspace under the physical OS temporary directory after parent and socket-length validation. Create a mode-0600 empty tmux configuration and mode-0600 long-lived Node helper. Derive unique socket/session/window names from the private token and never render their values.
- Start the discovered absolute tmux executable as a directly managed foreground server with `-D -S <private-socket> -f <empty-config>`. Every client uses the same executable and `-S <private-socket>`. Use private HOME/XDG/TMPDIR values and omit all `TMUX*`, credentials, and unrelated inherited variables.
- Wait once for socket readiness through an event-driven bounded seam, then run one no-retry sequence: detached session/dashboard plus helper; `has-session`; exact dashboard `list-windows`; positive dashboard pane PID; detached `new-window -P -F #{window_id}\t#{pane_id}` plus helper; strict creation parse; `remain-on-exit`; positive pane PID; one `list-panes -F #{window_id}\t#{pane_id}\t#{pane_current_path}`; strict observation parse and equality/cwd proof; exact `kill-window`.
- Treat this as the minimum preparation-readiness sequence. Interactive attach, capture, and interrupted respawn remain contextual operations covered by injected issue-run adapter tests, not by Doctor.
- Treat dashboard and issue pane PIDs only as ephemeral locators; capture compound process-group/start-token/executable/arguments/cwd identity before fallback signaling, and never authorize by PID alone. Cleanup also enumerates exact private-helper argument/cwd/launch/server-lineage candidates so a helper created before PID acceptance is still owned and removed without process-name matching.
- Count bytes before decoding, retain at most 4096 bytes per client or managed-server stream while draining/counting overflow, expose truncation, and reject a truncated functional result. Reuse the existing strict create/observe parser. Raw output, IDs, PIDs, paths, names, arguments, environment, and helper output stay ephemeral.
- Emit `DoctorResultV2` while preserving the 24 IDs, repository facts, status/blocking semantics, readiness conjunction, exits 0/3/2, messages, and remediations. Functional failures add value-free `DoctorTmuxProbeEvidenceV1`: the closed architecture-defined operation/reason enums, exit/timeout, byte counts/truncation, optional `TmuxIdentityDiagnosticV1`, and cleanup states `not-created|absent|present|unknown` for server/panes/socket/workspace. Human output renders the same facts.
- Keep every client command and managed-process wait at or below 2000ms. Use one 9000ms absolute Doctor deadline, a 6500ms operation cutoff, and a final 2500ms cleanup reserve. At cutoff cancel active probe work and start no new operation. Enforce absolute cleanup milestones: kill-server 7000ms, post-kill wait 7250ms, SIGTERM wait 7750ms, SIGKILL wait 8250ms, and removal/final absence verification 9000ms; then await the cleanup `finally` and return no detached evaluation promise.
- On every success/failure/timeout/cancellation path, request private-socket `kill-server`, wait for the directly managed server, escalate only its exact identity from SIGTERM to SIGKILL, terminate only still-matching recorded dashboard and issue helpers, remove the exclusively owned tree after process cleanup, and verify server/helpers/socket/workspace absent. Cleanup uncertainty fails `command.tmux` even after functional success.
- Migrate Doctor manifests, consumers, human/JSON parity tests, README, PRD, docs index, Doctor guide, operations/troubleshooting, and documentation assertions from executable-only/schema-v1 wording. No Runner configuration, run snapshot, issue-run tmux targeting, network API, database, service, container, or deployment migration is introduced.

## Acceptance Criteria
- **AC-1:** Creation accepts exactly one nonempty record with exactly two fields representing one `^@[0-9]+$` window ID and one `^%[0-9]+$` pane ID; observation accepts exactly one nonempty record with exactly three fields representing those two IDs and one nonempty cwd. The accepted transport permits only the documented record terminator and field separator, including an optional final line terminator, and rejects additional records or fields.
- **AC-2:** Controlled tmux 3.7b fixtures with creation bytes `40 31 09 25 31 0a` and observation bytes `40 31 09 25 31 09 2f 74 6d 70 0a` produce the exact identities `@1`, `%1`, and `/tmp` and preserve the existing successful preparation/reconciliation behavior.
- **AC-3:** The bounded malformed matrix rejects creation outputs `empty`, `@1\n`, `@1<TAB>%1<TAB>extra\n`, `@1<TAB>%1\n@2<TAB>%2\n`, `1<TAB>%1\n`, and `@1<TAB>1\n`; it also rejects observation outputs `empty`, `@1<TAB>%1\n`, `@1<TAB>%1<TAB>/tmp<TAB>extra\n`, `@1<TAB>%1<TAB>/tmp\n@2<TAB>%2<TAB>/tmp\n`, `1<TAB>%1<TAB>/tmp\n`, and `@1<TAB>1<TAB>/tmp\n`. Each case reports malformed or ambiguous identity output rather than accepting a partial record.
- **AC-4:** A creation or observation identity failure exposes a retained structural diagnostic through the next repository-owned JSON status or reconciliation result: command phase (`create` or `observe`), exit code, stdout/stderr byte counts, record count capped at 8 with a truncation flag, per-record field counts capped at 8 with truncation flags, and a structural token signature capped at 32 tokens that distinguishes IDs, horizontal tabs, CR/LF, backslashes, and other byte runs without retaining their values.
- **AC-5:** Retained identity diagnostics never contain raw stdout or stderr, cwd/path components, command arguments, environment values, field values, issue/owner/run identifiers, or bytes from an `other` run; human output identifies malformed or ambiguous tmux identity evidence and does not recommend upgrading a tmux version already demonstrated to emit the supported format.
- **AC-6:** After a failed creation parse with no remaining same-name tmux window, a `starting_tmux` fixture whose lock, lease, branch, worktree path/registration/HEAD/cleanliness still match can resume with exactly one new window-creation attempt and then continue the existing preparation transition when valid identity output is returned; lock, lease, branch, worktree, window, worker, and RPIV-launch call counts prove that no duplicate owned resources are created.
- **AC-7:** If any same-name tmux window is present while the snapshot has no persisted tmux identity, resume keeps the existing unknown-ownership refusal and leaves snapshot ownership fields, lock, lease, Git worktree tuple, tmux inventory, worker processes, and RPIV launches unchanged; the change does not infer or adopt ownership from a name, cwd, or process command.
- **AC-8:** `LOG_NOT_FOUND` remains a bounded logs outcome when no persisted tmux identity/transcript exists and does not change reconciliation: matching preparation ownership authorizes only `PREPARATION_RESUME_AVAILABLE` and its existing `resume` action, while mismatched or unknown ownership still authorizes no resume.
- **AC-9:** Credential-free tests use temporary repositories and controlled command/tmux/process adapters or executables, never access the external consumer repository, and pass through the existing `just verify-focused` and `just verify` recipes.
- **AC-10:** `soft-factory doctor --json` reports tmux ready only after a bounded functional probe on a uniquely isolated tmux server proves the session/window/pane operations and exact identity/observation formats Runner requires; an installed but nonfunctional or malformed tmux fails readiness with structured actionable evidence, while success and failure both leave ambient tmux servers untouched and no probe session, window, pane, process, socket, or temporary file behind.

## Acceptance Coverage
| AC | Implementation tasks | Tests/validation | Expected inspectable evidence |
|---|---|---|---|
| AC-1 | T-1, T-4, T-6 | V-1, V-2, V-8 | Commit `84f5cbe`: accepted/rejected byte tables, exact parsed identities, and documentation assertions |
| AC-2 | T-1, T-4, T-5 | V-1, V-5 | Commit `84f5cbe`: hex-fixture results plus unchanged preparation/reconciliation trace |
| AC-3 | T-1, T-4 | V-2 | Commit `84f5cbe`: twelve-case matrix with typed failure codes and zero partial identities |
| AC-4 | T-1, T-2, T-4, T-5 | V-3, V-4, V-7 | Commit `84f5cbe`: exact bounded diagnostic JSON, v5 snapshot/event/report records, and one-pass traces |
| AC-5 | T-1, T-2, T-4, T-5, T-6 | V-3, V-4, V-7, V-8 | Commit `84f5cbe`: sentinel zero-match scan and human/JSON output without prohibited fields or upgrade advice |
| AC-6 | T-2, T-3, T-5, T-6 | V-4, V-5, V-8 | Commit `84f5cbe`: exact ownership tuple, one create call, transition sequence, and zero duplicate-resource counts |
| AC-7 | T-3, T-5, T-6 | V-6, V-8 | Commit `84f5cbe`: unknown-ownership result, equal before/after inventories, and zero mutation/launch calls |
| AC-8 | T-2, T-3, T-5, T-6 | V-7, V-8 | Commit `84f5cbe`: `LOG_NOT_FOUND` output and reconciliation safe-action matrix |
| AC-9 | T-1 through T-12 | V-1 through V-17 | Existing 401-test evidence plus new fixture-isolation audit and fresh direct focused/full root-gate transcripts |
| AC-10 | T-8, T-9, T-10, T-11, T-12 | V-11 through V-17 | Exact private-socket command trace, byte-format proof, schema-v2 failure evidence, deadline/cleanup traces, zero residual inventory, docs, and direct gates |

Coverage proof: all ten criteria have one or more implementation tasks, finite tests or validation, and expected inspectable evidence. AC-1 through AC-9 retain their original mappings and commit evidence; AC-10 is mapped only to planned work and must not be attributed to `84f5cbe`.

## Implementation Tasks
- **T-1 — Implement original-byte identity parsing and bounded diagnostic construction** (Completed; AC-1, AC-2, AC-3, AC-4, AC-5, AC-9). Evidence remains in `84f5cbe`.
- **T-2 — Add v5 diagnostic persistence and common rendering** (Completed; AC-4, AC-5, AC-6, AC-8, AC-9). Evidence remains in `84f5cbe`.
- **T-3 — Tighten preparation reconciliation and resume authorization** (Completed; AC-6, AC-7, AC-8, AC-9). Evidence remains in `84f5cbe`.
- **T-4 — Cover the live tmux adapter and diagnostic boundaries** (Completed; AC-1, AC-2, AC-3, AC-4, AC-5, AC-9). Evidence remains in `84f5cbe`.
- **T-5 — Prove recovery, ownership preservation, logs independence, and one-pass behavior** (Completed; AC-2, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9). Evidence remains in `84f5cbe`.
- **T-6 — Update affected operator and schema documentation for AC-1 through AC-9** (Completed; AC-1, AC-5, AC-6, AC-7, AC-8, AC-9). Evidence remains in `84f5cbe`.
- **T-7 — Run authoritative focused and full validation for the AC-1 through AC-9 baseline** (Completed; AC-9). Direct gates passed for `84f5cbe`; they must be rerun after AC-10.
- **T-8 — Add bounded Doctor probe infrastructure and schema-v2 evidence** (Planned; AC-9, AC-10); depends on completed T-1 and T-7. Add capped original-byte command results, managed foreground-process/workspace/deadline seams, `DoctorResultV2`, `DoctorTmuxProbeEvidenceV1`, and deterministic rendering contracts.
- **T-9 — Implement the isolated foreground tmux readiness probe and unconditional cleanup** (Planned; AC-9, AC-10); depends on T-8. Implement the exact private `-D/-S/-f` lifecycle, functional sequence, byte/equality proof, operation cutoff, cleanup escalation, and absence verification.
- **T-10 — Integrate strengthened `command.tmux` and migrate Doctor fixtures** (Planned; AC-9, AC-10); depends on T-9. Wire the probe into Doctor without changing the 24 IDs, migrate human/JSON/manifests, and add protocol-aware fake executable and adapter seams for success/failure matrices.
- **T-11 — Update Doctor application documentation and migration guidance** (Planned; AC-9, AC-10); depends on T-10. Update README, PRD, docs index, Doctor guide, troubleshooting, schema migration, and documentation assertions; state no configuration/run-state/API/deployment change.
- **T-12 — Run fresh authoritative focused and full repository validation** (Planned; AC-9, AC-10); depends on T-8, T-9, T-10, T-11. Run direct root `just verify-focused` and `just verify`, preserving isolation, timing, coverage, build, and diff evidence.

## Delivery Order and Boundaries
1. AC-1 through AC-9 remain completed history from `84f5cbe`; do not reopen or relabel that commit as AC-10 evidence.
2. Implement Doctor byte/process/workspace/deadline and schema seams before any live probe sequence.
3. Implement one private foreground probe and cleanup before integrating `command.tmux` or changing fixtures.
4. Migrate Doctor schema, renderers, manifests, controlled fake executables, and docs only after the executable contract stabilizes.
5. Use only temporary repositories and controlled adapters/executables. Never contact Sparkta, credentials, live network, Copilot, or any ambient/default tmux server.
6. Finish with fresh direct root `just verify-focused` and `just verify`; harness delegates do not replace either required boundary.
7. Stop after implementation planning in this stage. Do not edit product source, tests, or application documentation here.
