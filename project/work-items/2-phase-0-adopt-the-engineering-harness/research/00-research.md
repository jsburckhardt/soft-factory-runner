# Research Brief: Phase 0: Adopt the engineering harness

## GitHub Issue
- **Issue:** #2
- **Title:** Phase 0: Adopt the engineering harness
- **Work Item:** `project/work-items/2-phase-0-adopt-the-engineering-harness`

## Scope Classification
- **Scope Type:** issue

## Problem Statement

Establish the deterministic engineering harness from https://github.com/AI-Substrate/harness-engineering before product implementation. Use the locally available npm package and preserve the repository root justfile contract.

## Acceptance Criteria

**Core**
- [ ] The locally available @ai-substrate/engineering-harness CLI reports a healthy installation for this repository.
- [ ] Repository-local harness governance and adoption artifacts are committed and discoverable by a cold agent session.
- [ ] A harness boot command starts the current application from a known state and returns inspectable success or failure evidence.
- [ ] Focused and full repository validation are discoverable through the harness while just verify-focused and just verify remain valid RPIV entry points.
- [ ] Repository instructions direct autonomous agents to use the harness as the deterministic product-development surface.

**Verification**
- [ ] Harness readiness, boot, focused validation, and full validation complete successfully from a clean checkout.

## Repository Findings

- `src/index.ts` is a minimal synchronous CLI: `main()` writes one bootstrap line and exits. There is no service, health endpoint, or persistent runtime state.
- `src/index.test.ts` covers the exported name and exact output. `jest.config.cjs` enforces 80% global coverage; the current suite reports 100%.
- `package.json` declares Node `>=22` and npm scripts for Jest, ESLint, Prettier, TypeScript, build, and run. The harness package also requires Node `>=22`; this environment uses Node `22.23.2`.
- The root `justfile` exposes setup, run, test, lint, format-check, type-check, build, verify-focused, and verify. Focused validation runs Jest plus `git diff --check`; full validation runs all configured checks and build. `just --list` discovers both RPIV recipes, and both passed at the research baseline.
- `README.md`, `docs/README.md`, `AGENTS.md`, `CONTRIBUTING.md`, and `LLM.txt` direct users and agents to the root justfile and RPIV. No tracked file mentions the engineering harness, `harness boot`, or `harness checks`.
- No `.harness/` substrate is tracked. The only tracked skills are under `.github/skills/agnostic-prompt-standard/`; no engineering-harness skill is present.
- The untracked `ai-substrate-engineering-harness-0.13.0.tgz` identifies `@ai-substrate/engineering-harness` v0.13.0, exposes `harness` and `engh`, and includes `eng-harness-flow` and the harnessability assessment skill.
- `harness` is not globally on PATH. Running the supplied package through `npm exec` reports v0.13.0 and returns structured envelopes. `harness help --json` reports no repository extensions.
- `harness instructions` defines statuses `ok`, `degraded`, `unconfigured`, and `error`, corresponding exit codes 0, 0, 2, and 1, and `next_action` for non-ok status.
- `harness doctor --json` currently returns `degraded`: no extensions, checks, or boot verbs; no harness commit guidance in `AGENTS.md`; and environment-specific capture, git-ai PATH, and attribution warnings. Doctor wrote transient `.harness/temp/gitai-collector.json`; the generated directory was removed after inspection.
- Packaged `package/skills/eng-harness-flow/references/governance-doc.md` names `.harness/engineering-harness.md` as the sole governance location and describes Boot, Interact, Observe, signals, evidence paths, injection map, back-pressure gaps, and maturity content.
- Packaged `package/skills/eng-harness-flow/references/stages/adopt.md` treats the CLI as an ambient global tool, not a repository dependency, and identifies tracked `.harness/` substrate, cold-agent cues, checks, and checks-composing boot as adoption concerns.
- The packaged installer supports project-local `github-copilot`. Package documentation says project installs are recorded in `.harness/skills.lock.json` and includes several skills.

## Constraints

- `CORE-COMPONENT-260806-project-command-interface` keeps raw operating commands in root justfile recipes, keeps the justfile as the default interface, permits only a delegating documented wrapper, and requires stable verify-focused and verify recipes.
- `CORE-COMPONENT-260806-rpiv-stage-contract` requires root-justfile validation by default and preservation of the stable work-item path.
- `CORE-COMPONENT-260810-development-standards` requires strict TypeScript, ESLint, Prettier, deterministic Jest coverage, and at least 80% coverage.
- `ADR-260810-typescript-node-cli` fixes strict TypeScript on active Node LTS, npm distribution, Jest, ESLint, Prettier, and no bootstrap framework.
- `CORE-COMPONENT-260806-agent-executable-acceptance-criteria` requires safe, repeatable, repository-accessible, independently verifiable outcomes and surfaced unavailable prerequisites.
- Packaged guidance requires Node `>=22`, treats the CLI as global, reserves `.harness/engineering-harness.md` as canonical, and separates transient `.harness/temp/` from committed harness artifacts.
- Packaged `package/README.md` states first-use doctor may install git-ai and detected-agent hooks unless opt-outs are set; inspection also observed a transient repository write.
- The local archive is untracked investigation input, not a work-item artifact. No competing `project/work-items/2-*` existed; the preserved path is `project/work-items/2-phase-0-adopt-the-engineering-harness/`.

## Relevant ADRs and Core-Components

- `project/architecture/ADR/ADR-260810-typescript-node-cli.md` — current application and quality-tool stack.
- `project/architecture/core-components/CORE-COMPONENT-260806-project-command-interface.md` — root justfile and stable validation interface.
- `project/architecture/core-components/CORE-COMPONENT-260806-rpiv-stage-contract.md` — RPIV ownership, work-item paths, and validation boundaries.
- `project/architecture/core-components/CORE-COMPONENT-260810-development-standards.md` — static checks, tests, and coverage.
- `project/architecture/core-components/CORE-COMPONENT-260806-agent-executable-acceptance-criteria.md` — inspectable, repeatable acceptance outcomes.
- `project/architecture/core-components/CORE-COMPONENT-260505-commit-standards.md` — existing commit and AI co-author rules relevant to the doctor commit-guidance warning.
- `project/architecture/ADR/DECISION-LOG.md` records these as Accepted or Adopted; decisions 7, 10–15, 24–26, and 32 are active constraints.

## Risks and Open Questions

- Healthy installation is ambiguous: packaged guidance says a fresh consumer may return top-level `degraded` with exit 0, while the issue asks for healthy. Current doctor output mixes repository and machine-level findings.
- Clean-checkout reproducibility has an external-tool boundary. The archive is untracked while the CLI is defined as ambient/global; assumed clean-checkout prerequisites remain unresolved.
- First-run doctor can alter user hooks and collector configuration. Opt-outs and git-ai PATH warnings can vary independently of tracked repository state.
- Project-local Copilot skill installation shares `.github/skills/` with APS and may invoke `npx skills`; coexistence, lock state, offline behavior, and cold-session discovery remain unverified.
- The application exits immediately. The lifecycle, interaction, and observation meaning of starting it from a known state is unresolved.
- Packaged governance expects Boot, Interact, Observe, evidence paths, and checks composition. Their applicability to the one-line CLI without introducing product behavior is unresolved.
- No tracked extensions, governance, injection map, or harness skills exist at baseline, so repository-local harness readiness, boot, focused validation, and full validation are unavailable.
