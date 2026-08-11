# Verification Summary — Issue #3

## Delivery

- **Work item:** `3-phase-1-run-one-issue-in-an-isolated-visible-environment`
- **Branch:** `feat/3-run-isolated-visible`
- **Initial implementation SHA:** `71327bb64d33f3dcd81d91b6689e10fb88728ddd`
- **Correction / verified implementation SHA:** `f4b0376b761ac1ae5c75e07658525d8fd853906f`
- **Pull request:** https://github.com/jsburckhardt/soft-factory-runner/pull/12
- **Issue update:** GitHub Issue #3 retained its current criterion text and markers; all ten accepted checkboxes were changed to checked.

## Independent Acceptance Decisions

- **AC-1 — Passed.** `IssueRunService.run` completes repository discovery, configuration read, GitHub issue loading, and issue preparation before atomic lock acquisition. Invalid-readiness tables and direct live-parser tests prove zero owned effects.
- **AC-2 — Passed.** The deterministic trace and real-filesystem integration establish exactly one lock, Conventionally typed branch, isolated worktree, schema-versioned run record/events, and tmux issue window.
- **AC-3 — Passed.** Fetch and advertised/tracking SHA equality occur before the persisted `FetchedBaseProofV1`, which precedes branch/worktree creation; unproved-base scenarios create neither resource.
- **AC-4 — Passed.** Current Issue #3 is open with the `feature` label; the configured mapping selects allowed type `feat`. Temporary Git integration proves branch and worktree `HEAD` equal the exact advertised/fetched remote SHA.
- **AC-5 — Passed.** The fixture creates issue window `3` rooted at the isolated `.trees/3`, invokes the private worker there, exposes the startup marker through pane stdio, and reports the recorded active tmux observation.
- **AC-6 — Passed.** Issue #3 launches `copilot --yolo --name issue-3 --agent rpiv --prompt ...` with exact `OTEL_RESOURCE_ATTRIBUTES=project.name=jsburckhardt-soft-factory-runner,issue.id=issue-3`; parameterized evidence proves the construction for another repository/issue.
- **AC-7 — Passed.** Human and JSON status derive from shared persisted/observed facts. `attach 3` resolves and verifies session, window, IDs, pane, and cwd using only the issue number; mismatch and absence block.
- **AC-8 — Passed.** Invalid syntax, nonexistent/closed issues, blocked labels/relationships, conflicting PRs, malformed/empty criteria, incomplete proof, and intent ambiguity fail with typed actionable errors before ownership. Correction tests compose `createLivePorts().github` with `IssueRunService` and prove malformed required PR, nested closing-issue, label, and blocker entries produce `GITHUB_PROOF_INCOMPLETE` with no lock, branch, worktree, or tmux window.
- **AC-9 — Passed.** Barrier-released real-filesystem starts yield one successful owner, one `ISSUE_ALREADY_OWNED`, one owner record, and one branch/worktree/window resource set.
- **AC-10 — Passed.** The credential-free normal composition supplies only declarative operational facts and proves the full issue-to-RPIV trace without a production test switch, implementation-decision interface, or access to the ambient development worktree.

## Scope and Architecture

**Passed.** The complete `origin/main...f4b0376b761ac1ae5c75e07658525d8fd853906f` diff contains 37 scoped files and was reviewed across product code, tests, application documentation, work-item artifacts, architecture records, harness governance, and retros. It conforms to ADR-260811 and the Issue Run Orchestration core-component: typed adapter separation, read-only readiness before ownership, fetched equality proof and exact-SHA branch creation, unknown-resource preservation, atomic snapshots/events, visible tmux worker, exact telemetry/name, bounded fail-safe evidence, issue-only status/attach, deterministic fixtures, and no unproved completion or deferred recovery scope. Both implementation commits are Conventional Commits and include the required Copilot co-author trailer.

## Documentation Verdict

- **README/setup — Passed.** Repository prerequisites and root recipe authority are accurate; setup/build correctly state that no global binary is linked.
- **Usage and CLI/API reference — Passed.** Executable checkout forms use `just run`; strict run/status/attach grammar, private worker, JSON/human status, and typed failures match the committed CLI. No HTTP API or specification is applicable.
- **Configuration — Passed.** `.soft-factory/config.yml`, exact keys, defaults, remote precedence, `feature: feat`, normalization, and prompt substitution match implementation.
- **Migration — Passed (no impact).** The additive command behavior preserves package/bin and no-argument bootstrap contracts; no data/schema migration is introduced.
- **Architecture explanation — Passed.** The accepted ADR, adopted core-component, Decision Log entries 40–48, and harness governance accurately describe implemented boundaries and deferrals.
- **Operations/runbook — Passed.** Prerequisites, time bounds, proof order, lock/state paths, unknown outer-worktree protection, tmux visibility, telemetry, status/attach, stable failures, fixtures, and Phase 1 deferrals are documented.
- **Deployment — Passed (no impact).** No hosted service, endpoint, daemon, schema deployment, or new runtime hosting procedure is introduced; local operation is fully covered by the guide.

## Validation Results

- `harness instructions`, `harness instructions checks`, `.harness/engineering-harness.md`: orientation completed; root recipes confirmed authoritative.
- `harness checks --json`: **passed**, envelope `status=ok`, full scope, delegated `just verify`, exit 0.
- Direct `just verify`: **passed** independently; ESLint, Prettier, strict TypeScript, 4 suites/36 tests, build, coverage, and diff hygiene passed. Coverage: 92.97% statements, 85.04% branches, 98.30% functions, 94.94% lines.
- `just verify-focused src/integration.test.ts src/documentation.test.ts`: **passed**, 2 suites/9 tests, including malformed live GitHub proof and executable documentation commands.
- Safe documented root commands: **passed expected outcomes** — help exit 0; invalid run exit 2 with `CLI_INVALID`; missing status and attach exit 3 with `STATE_NOT_FOUND`.
- `git diff --check origin/main...f4b0376b761ac1ae5c75e07658525d8fd853906f`: **passed**.

## RPIV Friction Drain and Harvest

- **Verifier records:** `.harness/records/retro/2026-08-11/010-issue-3-rpiv-verifier.md`; `.harness/records/retro/2026-08-11/011-issue-3-rpiv-verifier-signing.md`
- **Drain:** 3 `rpiv-verifier` observations were persisted across two schema 1.2 records with matching plan/agent identity and `disposition: kept`; each durable read-back succeeded before clear; clear envelopes returned `status=ok` with counts 2 and 1; follow-up list had zero observations.
- **Harvest command:** `harness retro insights --plan 3-phase-1-run-one-issue-in-an-isolated-visible-environment --json`
- **Harvest metadata:** `harness.retro-insights/v1`; generated `2026-08-11T08:58:37.610Z`; 11 records; 30 entries; one plan; 5 agents (`rpiv`, `rpiv-research`, `rpiv-planner`, `rpiv-implementer`, `rpiv-verifier`); 22 difficulties, 3 insights, 2 coordination entries, 2 confusions, 1 improvement suggestion; all 30 dispositions kept; 0 malformed records; 0 unsupported versions; 0 pending observations; 0 malformed pending observations.

## Final Verdict

All AC-1 through AC-10, documentation categories, scope, architecture, commit standards, and configured validation passed independently. Accepted and shipped in PR #12.
