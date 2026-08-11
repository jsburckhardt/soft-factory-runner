# Implementation: Phase 1 run one issue

## Scope

Implemented GitHub Issue #3 on `feat/3-run-isolated-visible` within the preserved work item `3-phase-1-run-one-issue-in-an-isolated-visible-environment`. T-1 through T-7 are marked complete in `plan/02-task-breakdown.md`. This record provides implementation evidence for Verify; it does not make a final acceptance claim.

## Completed tasks

- **T-1 — CLI, domain, configuration, adapters:** added strict `run --issue`, `status`, `attach`, and private worker parsing; stable typed errors; owner-qualified identity normalization; minimal YAML configuration; common human/JSON rendering; and typed filesystem, Git, GitHub, tmux, subprocess, clock, and ID ports.
- **T-2 — Readiness and fetched-base proof:** added complete issue checks, marker-wrapped checkbox validation, blocker and PR conflict classification, bounded external adapters, deterministic branch-type mapping, remote precedence, fetch, advertised HEAD/tracking equality, and `FetchedBaseProofV1`.
- **T-3 — Ownership, persistence, branch, worktree:** added exclusive lock creation, owner/run identities, fully validated atomic `RunSnapshotV1`, append-only events, unknown-resource preservation, proof-before-branch ordering, and exact-SHA branch/worktree preparation.
- **T-4 — Visible worker and Copilot:** added deterministic tmux session/window preparation rooted at the isolated worktree, a pane-visible worker startup marker, exact Copilot argument/environment construction, bounded process execution, and zero/nonzero exit classification without `completed`.
- **T-5 — Status and attach:** added shared persisted/observed status facts, human and JSON output, exact recorded tmux identity verification, and interactive issue-only attach.
- **T-6 — Deterministic proof:** added declarative credential-free recording fixtures, failure tables, same-issue contention, real exclusive-filesystem concurrency, temporary local Git fetched-base/ancestry/worktree integration, exact trace/multiplicity checks, and ambient `.trees/3` non-access proof.
- **T-7 — Documentation:** added the Phase 1 command/configuration/state/ownership/telemetry/troubleshooting/fixture/deferral guide, root usage, docs indexing, harness-governance alignment, and executable documentation assertions.

## Acceptance evidence

### AC-1 — Validate repository and issue before unnecessary side effects

- `IssueRunService.run` calls Git repository discovery, reads configuration, loads GitHub facts, and executes `prepareIssue` before `RunStore.acquire` or any branch/worktree/tmux/process call.
- `src/orchestration.test.ts` checks nonexistent, closed, blocked, AC-invalid, pagination-incomplete, type-invalid, and conflicting issue paths and asserts no `lock:create` operation.
- The complete fixture trace places `git:discover` and `github:issue` before the one lock and all owned operations.

### AC-2 — One complete owned resource set

- `src/orchestration.test.ts` records exactly one exclusive lock, branch creation, worktree creation, tmux window, run snapshot stream, and Copilot launch.
- The parsed lock/snapshot/events carry one owner/run identity; `src/integration.test.ts` confirms one branch, worktree, and window under barrier-released contention.

### AC-3 — Fetch and prove latest remote default HEAD

- `proveFetchedBase` fetches the resolved remote, reads advertised symbolic HEAD, requires configured-base agreement, reads the fetched tracking ref, and requires exact SHA equality.
- The deterministic trace asserts `git:fetch:origin` precedes the proof snapshot write, which precedes branch creation. Failure scenarios for configured-base disagreement, absent tracking ref, and SHA mismatch create no branch/worktree.
- The temporary Git integration proves advertised and tracking SHA equal the known remote default tip.

### AC-4 — Allowed mapped branch from exact proof SHA

- The default `feature: feat` mapping creates `feat/3-phase-1-run-one-issue`; absent and ambiguous mappings block.
- The trace captures `git:create-branch:feat/3-phase-1-run-one-issue:<40-character-proven-sha>`.
- The real temporary Git test resolves both the branch and worktree `HEAD` to the exact `advertisedHeadSha`, without using a local default-branch ref.

### AC-5 — Visible RPIV in isolated worktree

- The tmux trace is `sf-jsburckhardt-soft-factory-runner:3`, cwd `/tmp/soft-factory-fixture/.trees/3`, command `soft-factory internal run-agent --issue 3`.
- `workerStartupMarker(3)` is exactly `Soft Factory RPIV worker issue-3 starting.` and the live worker/Copilot inherit pane stdio.
- Status observes the recorded `%3` pane while the run is represented as `running_rpiv`.

### AC-6 — Exact Copilot name and telemetry on every launch

- The captured invocation is `copilot --yolo --name issue-3 --agent rpiv --prompt Deliver issue #3`.
- The child environment contains exact `OTEL_RESOURCE_ATTRIBUTES=project.name=jsburckhardt-soft-factory-runner,issue.id=issue-3`.
- Parameterized repository/Issue 7 evidence proves the same exact construction (`--name issue-7`, `project.name=owner-repo-name,issue.id=issue-7`) for another launch; ambient OTEL is not copied.

### AC-7 — Current status and issue-only attach

- Human status and JSON status derive from one `StatusFacts` object and label persisted state separately from observed tmux identity.
- The fixture invokes `attach 3` with no tmux arguments and traces `tmux:attach:sf-jsburckhardt-soft-factory-runner:3:%3` only after exact session/window/window-id/pane-id/cwd equality.
- Missing, malformed, absent, and mismatched state/observations produce stable errors and no launch, cleanup, or recovery calls.

### AC-8 — Actionable invalid/blocked/conflicting failures

- Table-driven tests cover nonexistent, closed, blocked label, open blocker, closing-PR conflict, planned-branch conflict, missing/duplicate/reversed/empty AC blocks, incomplete evidence, unmapped/ambiguous type, remote missing/ambiguous, configured-base conflict, missing tracking ref, and SHA mismatch.
- Stable codes and remediation are rendered for human/JSON callers. The guide documents all Phase 1 codes, including timeout/truncation/malformed evidence under `GITHUB_PROOF_INCOMPLETE` and external execution failures.
- Invalid readiness has zero owned operations; unproved fetched base has zero branch/worktree operations.

### AC-9 — Exactly one simultaneous local owner

- The in-memory orchestration contention test yields one fulfilled run, one `ISSUE_ALREADY_OWNED`, one branch, and one tmux window.
- The real-filesystem test uses a two-arrival readiness barrier and `wx` exclusive creation. It parses one owner record and records counters of one branch, one worktree, and one window without sleep-based proof.

### AC-10 — Deterministic issue-to-RPIV fixture

- `src/orchestration.test.ts` composes the normal CLI/service with declarative Issue #3 facts, controlled clock/IDs, recording adapters, and `/tmp/soft-factory-fixture`; no live credentials or production test switch exists.
- The checked assertions cover ordered issue → lock → fetch/proof → snapshot → branch/worktree → tmux worker → exact Copilot → status → attach behavior and one-resource multiplicity.
- `src/integration.test.ts` supplies only operational facts and temporary filesystem/Git roots. Port interfaces expose no code-editing, solution-selection, prose-interpretation, or Runner implementation callback.
- The operation trace asserts no path contains `/workspaces/soft-factory-runner/.trees/3`.

## Validation evidence

### Orientation boot

- `harness boot --json`: envelope `status=ok`; application command `just boot`, exit 0, exact bootstrap signal observed; composed checks exit 0 and `status=ok`.

### Focused validation

- Final `harness checks --focused --json`: envelope `status=ok`, `scope=focused`, delegated `just verify-focused`, exit 0; 4 suites, 31 tests passed; `git diff --check` passed.
- Final direct `just verify-focused`: exit 0; 4 suites, 31 tests passed; `git diff --check` passed.
- Focused checks were also run after each implementation group. Failures and retries are retained in the Implement retro rather than hidden.

### Full validation

- Final `harness checks --json`: envelope `status=ok`, `scope=full`, delegated `just verify`, exit 0.
- Final direct `just verify`: exit 0 for ESLint, Prettier check, strict TypeScript, Jest coverage, build, and diff hygiene; 4 suites and 31 tests passed.
- Global coverage: **92.97% statements, 85.04% branches, 98.30% functions, 94.94% lines**, above the 80% thresholds.
- Separate final `git diff --check`: exit 0.

## Documentation evidence

- **README/setup/usage:** `README.md` now introduces `run`, `status`, and `attach`, fetched-base behavior, unknown-resource preservation, exact telemetry/session behavior, zero-exit interruption, and links the guide.
- **Application docs index:** `docs/README.md` indexes the Phase 1 guide.
- **Command/API contract:** `docs/phase-1-issue-run.md` documents strict CLI syntax, output modes, private worker ownership, stable errors, and issue-only attach. No HTTP/API specification exists or changed; the CLI contract is the affected API surface.
- **Configuration:** the guide documents `.soft-factory/config.yml`, exact `repository.remote` and `repository.base_branch` keys, precedence/defaults, `feature: feat`, and prompt substitution.
- **Operational/runbook:** the guide documents prerequisites, bounded calls, fetched proof, lock/state paths, tmux visibility, telemetry, status/attach, troubleshooting, ambient outer-worktree blocking, and credential-free fixture commands.
- **Architecture explanation:** the accepted Issue #3 ADR, core-component, and Decision Log entries 40-48 define the implemented boundaries. `.harness/engineering-harness.md` now distinguishes bootstrap coverage from Phase 1 product fixture evidence.
- **Migration:** no migration note is required because this is additive Phase 1 behavior, the package/bin contract is unchanged, and the no-argument bootstrap signal remains compatible.
- **Deployment:** no additional deployment guide is required because no service, endpoint, daemon, schema deployment, or runtime hosting procedure was introduced; local prerequisites and operation are in the Phase 1 guide.
- `src/documentation.test.ts` asserts exact commands, configuration identifiers, telemetry, outer-worktree protection, and all named deferrals.

### Task-to-document impact

- T-1: command/configuration and output contract sections.
- T-2: readiness, remote precedence, proof, and blocker troubleshooting sections.
- T-3: ownership, state files, unknown-resource and ambient-worktree sections.
- T-4: visible worker, exact Copilot argv/environment, and exit-state sections.
- T-5: status/attach and observation troubleshooting sections.
- T-6: deterministic evidence fixture section.
- T-7: root README, docs index, complete Phase 1 guide, and harness governance alignment.

## Architecture compliance

Implementation conforms to ADR-260811-prototype-one-run-orchestration, ADR-260810-typescript-node-cli, and all cited core-components. In particular it preserves Decisions 40-48: deterministic orchestration behind typed adapters; no completion/recovery scope; fetched equality proof; exact-SHA mapped branch; unknown-resource blocking; shared normalized identity; snapshots/events with no unproved completion; bounded fail-safe evidence; and injected fixtures without production backdoors. External commands use executable/argument arrays and redacted typed outcomes. No architecture or plan deviation was required.

## RPIV friction drain evidence

Read-back validated schema 1.2, exact plan identity, correct agent identity, `disposition: kept`, and every pending observation in:

- `.harness/records/retro/2026-08-11/002-issue-3-rpiv.md` — 1 coordinator entry.
- `.harness/records/retro/2026-08-11/003-issue-3-rpiv-research.md` — 6 Research entries.
- `.harness/records/retro/2026-08-11/004-issue-3-rpiv-planner.md` — 3 Plan entries.
- `.harness/records/retro/2026-08-11/004-issue-3-rpiv-implementer.md` — 7 Implement entries.
- `.harness/records/retro/2026-08-11/005-issue-3-rpiv-implementer-commit-retry.md` — 1 Implement entry recording the first failed harness commit socket attempt.
- `.harness/records/retro/2026-08-11/006-issue-3-rpiv-implementer-commit-recovery.md` — 2 Implement entries recording the identical second failure and the non-destructive buffered-mode recovery selection.
- `.harness/records/retro/2026-08-11/007-issue-3-rpiv-implementer-signing-recovery.md` — 2 Implement entries recording the failed Trace2-mode attempt and the SSH signing-agent root cause.

Only after read-back, clear envelopes returned `status=ok`, exit 0, and exact initial cleared counts 1/6/3/7. Follow-up list envelopes returned empty observations for all four agents. Commit-attempt observations were separately read back and cleared with `status=ok` counts 1, 2, and 2 before each next retry. The final `harness retro insights --plan 3-phase-1-run-one-issue-in-an-isolated-visible-environment --json` returned `status=ok`, 7 records, 22 entries, all 4 agents, and no malformed or unsupported records.

## Residual risks and deliberate limits

- Live readiness depends on a compatible authenticated `gh`/GitHub surface exposing blocked-by and closing-issue facts. Missing or incompatible evidence fails safely as `GITHUB_PROOF_INCOMPLETE`; deterministic tests use no credentials.
- Phase 1 deliberately blocks pre-existing resources rather than recovering them.
- Result-artifact completion, restart recovery, resume, stop, clean, post-launch PR reconciliation, and scheduling remain deferred. A zero Copilot exit remains `interrupted`.
