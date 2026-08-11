# Research Brief: Phase 1: Run one issue in an isolated visible environment

## GitHub Issue
- **Issue:** #3
- **Title:** Phase 1: Run one issue in an isolated visible environment
- **Work Item:** `project/work-items/3-phase-1-run-one-issue-in-an-isolated-visible-environment`

## Scope Classification
- **Scope Type:** issue

## Problem Statement

After harness adoption, prove the core path from an explicit GitHub issue to one visible RPIV execution with exclusive ownership and basic observable state.

## Acceptance Criteria

<!-- ACCEPTANCE_CRITERIA_START -->

**Core**
- [ ] soft-factory run --issue <number> validates the repository and issue before unnecessary side effects.
- [ ] A valid issue receives one lock, issue branch, isolated worktree, run record, and tmux window.
- [ ] Before creating the issue branch or worktree, Runner fetches the configured remote, verifies the latest remote default-branch commit, and blocks with actionable output when that base cannot be proven.
- [ ] The issue branch is created from that verified remote default branch and uses an allowed Conventional Commit type matching the intended change.
- [ ] RPIV runs visibly in the issue window from its isolated worktree.
- [ ] Every launched Copilot process receives `OTEL_RESOURCE_ATTRIBUTES=project.name=<project>,issue.id=issue-<number>` using the resolved repository name and explicit issue number, and is launched with `--name issue-<number>`.
- [ ] Status reports the current run state, and attach resolves the correct window using only the issue number.
- [ ] Invalid, closed, blocked, conflicting, or acceptance-criteria-incomplete issues fail with actionable output.

**Edge Cases**
- [ ] Two simultaneous starts for the same issue produce exactly one local owner.

**Verification**
- [ ] An end-to-end fixture proves issue-to-worktree-to-tmux-to-RPIV orchestration without requiring implementation decisions from Runner.

<!-- ACCEPTANCE_CRITERIA_END -->

## Repository Findings

- GitHub Issue #3 is OPEN. Its one marker-wrapped acceptance-criteria block contains ten ordered checkboxes: eight Core, one Edge Cases, and one Verification. This supersedes the eight-criterion version in the prior handoff.
- Exactly one `project/work-items/3-*` directory resolves: `project/work-items/3-phase-1-run-one-issue-in-an-isolated-visible-environment`. `project/work-items/README.md` requires reuse of this stable path and preservation of its name.
- Git resolves `origin` to `https://github.com/jsburckhardt/soft-factory-runner.git` and `origin/HEAD` to `origin/main`. `FETCH_HEAD`, `origin/main`, `HEAD`, and the `HEAD` merge-base with `origin/main` all resolve to `e3b4284e6f7d068535b062cdd5a1cd3bfff523c6`; `HEAD...origin/main` is `0 0`, and `origin/main` is an ancestor of `HEAD`. The fetched remote-default tip and current checkout are therefore identical at research time.
- The active branch is `feat/3-run-isolated-visible`. `PRD.md` section 25 and `project/architecture/core-components/CORE-COMPONENT-260505-commit-standards.md` allow `feat` and identify it for new user-visible functionality, matching this feature issue.
- `PRD.md` sections 22-25 define repository validation, issue validation, atomic ownership, and branch/worktree preparation in that order. Section 25, FR-010, and AC-011A require fetching the configured remote, proving the latest remote default-branch commit, creating the typed issue branch from that verified commit, and blocking before worktree creation if proof fails.
- `PRD.md` section 27 specifies each Copilot launch with `OTEL_RESOURCE_ATTRIBUTES=project.name=<project>,issue.id=issue-<number>` and `copilot --name issue-<number> --agent rpiv ...`. Installed Copilot CLI 1.0.79 exposes `-n, --name <name>`, `--agent`, `--prompt`, `--yolo`, and `-C`.
- `PRD.md` sections 26-31 define one repository tmux session, an issue-numbered window rooted in `.trees/<issue>`, visible RPIV, issue-only attach resolution, basic run states, and one-owner/resource invariants. Sections 33-34 place snapshots and append-only events under `.soft-factory/`; `.gitignore` excludes `.soft-factory/` and `.trees/`.
- `src/index.ts` exports only `projectName` and `main()`. `main()` prints the fixed bootstrap line; it has no command parsing or run, status, attach, Git, GitHub, tmux, persistence, or Copilot behavior.
- `src/index.test.ts` covers only `projectName` and the exact bootstrap output. No orchestration source or fixture support exists under `src/`.
- `package.json` maps the `soft-factory` binary to `dist/index.js`, requires Node 22 or newer, and has no runtime dependencies. `tsconfig.json` enables strict TypeScript, ES2022, and Node16 module resolution; the root `justfile` remains the run and validation command surface.
- `docs/README.md` points application behavior to `PRD.md`; no separate run/status/attach command reference or operational runbook exists. `.harness/engineering-harness.md` describes a short-lived bootstrap CLI with no persistent product runtime or product interaction sensors.

## Constraints

- `PRD.md` sections 22-25 require validation before avoidable side effects, atomic lock acquisition before downstream owned resources, and exactly one recorded lock, branch, worktree, run record, and tmux window per active issue.
- `PRD.md` section 25 and FR-010 require a configured-remote fetch and proof of the latest remote default-branch commit before branch or worktree creation. The issue branch must start at that verified commit rather than a stale local branch, and inability to prove it must block with actionable output.
- `PRD.md` section 25, its configuration example, and `CORE-COMPONENT-260505-commit-standards` constrain branch names to `<type>/<issue-number>-<short-slug>` using an allowed Conventional Commit type matched to intended work. `feat` is allowed and is the documented type for new functionality.
- `PRD.md` section 27 requires every Copilot process to receive the resolved project and explicit issue telemetry attributes and the exact issue-scoped session name through `--name issue-<number>`.
- `CORE-COMPONENT-260810-issue-worktree-locking` requires atomic ownership, one owned resource set, matching recorded and observed ownership before reuse, and no modification of unknown resources.
- `CORE-COMPONENT-260810-subprocess-execution` requires validated executable/argument arrays, typed redacted results, explicit working directory and environment, observable long-running identity, and no persisted secrets.
- `CORE-COMPONENT-260810-persistence-recovery`, `CORE-COMPONENT-260810-structured-events`, and `CORE-COMPONENT-260810-error-handling` require versioned atomic snapshots, append-only transitions, persisted/observed-state separation, common structured status facts, stable typed failures, non-zero outcomes, and fail-safe ambiguity handling.
- `ADR-260810-typescript-node-cli` and `CORE-COMPONENT-260810-development-standards` fix a strict TypeScript/Node.js npm CLI, named exports, deterministic external-system boundaries, Jest, and at least 80% global coverage.
- `CORE-COMPONENT-260806-project-command-interface` and `CORE-COMPONENT-260811-engineering-harness-interface` preserve root `justfile` command authority and keep the ambient harness outside product dependencies.
- `CORE-COMPONENT-260806-rpiv-stage-contract` limits Research to findings, constraints, relevant architecture, and risks and requires this existing work-item path to remain stable.

## Relevant ADRs and Core-Components

- `project/architecture/ADR/ADR-260810-typescript-node-cli.md` — accepted application runtime, distribution, and quality-tool boundary.
- `project/architecture/ADR/ADR-260811-engineering-harness-surface.md` — accepted ambient development-harness and root-command delegation boundary.
- `project/architecture/core-components/CORE-COMPONENT-260505-commit-standards.md` — allowed Conventional Commit taxonomy, including `feat` for new functionality.
- `project/architecture/core-components/CORE-COMPONENT-260810-issue-worktree-locking.md` — exclusive issue ownership and isolated resources.
- `project/architecture/core-components/CORE-COMPONENT-260810-subprocess-execution.md` — Git, GitHub, tmux, and Copilot process boundary.
- `project/architecture/core-components/CORE-COMPONENT-260810-persistence-recovery.md` — run snapshots, events, and observed-state reconciliation.
- `project/architecture/core-components/CORE-COMPONENT-260810-structured-events.md` — lifecycle and status facts.
- `project/architecture/core-components/CORE-COMPONENT-260810-error-handling.md` — actionable typed failures and fail-safe ambiguity handling.
- `project/architecture/core-components/CORE-COMPONENT-260810-development-standards.md` — strict TypeScript and deterministic quality constraints.
- `project/architecture/core-components/CORE-COMPONENT-260806-project-command-interface.md` and `CORE-COMPONENT-260811-engineering-harness-interface.md` — root recipe authority and harness delegation.
- `project/architecture/core-components/CORE-COMPONENT-260806-rpiv-stage-contract.md` and `CORE-COMPONENT-260806-agent-executable-acceptance-criteria.md` — stable Research boundaries and structured criterion rules.
- `project/architecture/ADR/DECISION-LOG.md` records these artifacts as Accepted or Adopted; decisions 1, 5, 16, 24-39 are relevant.

## Risks and Open Questions

- The checkout at `/workspaces/soft-factory-runner/.trees/3` is already a registered outer RPIV development worktree for Issue #3 on `feat/3-run-isolated-visible`. Its path matches the `PRD.md` default runtime path, but no Runner lock or run record establishes Runner ownership; path and branch matching alone cannot authorize reuse.
- The PRD requires proof of the latest remote default-branch commit, but the section 33 run snapshot example records `baseBranch` without a base commit SHA or fetch provenance. The durable shape of fetched-base proof is unspecified.
- The configured remote, remote default branch, and repository identity are discoverable here, but no tracked Runner protocol or configuration exists outside the `PRD.md` example. Precedence between a configured base branch and discovered remote default branch is not stated.
- Telemetry normalization is unclear. `PRD.md` sections 27 and 44 say resolved repository name, while the example transforms `jsburckhardt/example` into `jsburckhardt-example`; owner qualification and character normalization are not explicit.
- Readiness conventions beyond state, marker-wrapped criteria, blocker relationships, local ownership, conflicting PR, and repository checks are not fully enumerated. The meaning of conflicting PR is also not fully defined.
- The end-to-end fixture must avoid requiring implementation decisions from Runner, but the repository has no Runner adapters, fixture contract, or documented boundary between controlled and live GitHub, tmux, and Copilot behavior.
- The development harness has no product sensor for tmux windows, Copilot process names or environments, or issue-to-worktree association, so harness boot/check output alone cannot establish those runtime facts.
