# Action Plan: Phase 0: Adopt the engineering harness

## Feature
- **ID:** 2
- **Research Brief:** `project/work-items/2-phase-0-adopt-the-engineering-harness/research/00-research.md`

## ADRs Created
- `ADR-260811-engineering-harness-surface` — adopt ambient engineering harness v0.13.0 as the agent-facing surface while preserving root `justfile` command ownership.

## Core-Components Created
- `CORE-COMPONENT-260811-engineering-harness-interface` — define tracked governance, boot, checks, envelope, and cold-agent integration contracts.

## Acceptance Criteria
- **AC-1:** The locally available @ai-substrate/engineering-harness CLI reports a healthy installation for this repository.
- **AC-2:** Repository-local harness governance and adoption artifacts are committed and discoverable by a cold agent session.
- **AC-3:** A harness boot command starts the current application from a known state and returns inspectable success or failure evidence.
- **AC-4:** Focused and full repository validation are discoverable through the harness while just verify-focused and just verify remain valid RPIV entry points.
- **AC-5:** Repository instructions direct autonomous agents to use the harness as the deterministic product-development surface.
- **AC-6:** Harness readiness, boot, focused validation, and full validation complete successfully from a clean checkout.

## Acceptance Coverage

| AC | Implementation tasks | Tests or validation | Expected evidence |
|---|---|---|---|
| AC-1 | T-1, T-2 | V-1 readiness and extension health | v0.13.0 version output plus doctor JSON showing required extensions loaded with no repository-owned failures; any machine-only degradation is identified separately |
| AC-2 | T-1, T-3 | V-1 readiness; V-2 cold-session discovery; V-7 tracked-artifact audit | `git ls-files` output for governance/extensions/briefings and a cold-session transcript reaching harness instructions and verbs from tracked cues |
| AC-3 | T-2 | V-3 boot integration | `harness boot --json` exit 0 with application command, exact bootstrap output, app exit status, and composed full-check verdict; error paths define stable code and next action |
| AC-4 | T-2, T-3 | V-4 focused validation; V-5 full validation and direct RPIV compatibility | Harness help/briefing exposes both scopes; successful harness envelopes and successful direct `just verify-focused` and `just verify` transcripts |
| AC-5 | T-3 | V-2 cold-session discovery; V-7 instruction audit | Tracked `AGENTS.md`, governance, README/docs, and repository map cues consistently name harness as the development surface and `just` as RPIV boundary validation |
| AC-6 | T-4 | V-6 clean-checkout end-to-end | Fresh-checkout transcript with setup, readiness, boot, focused checks, full checks, both direct RPIV recipes, exit codes, JSON verdicts, and clean status |

Coverage proof: every AC ID has one or more dependency-ordered implementation tasks, executable validation, and concrete expected evidence. No criterion is unmapped.

## Implementation Tasks
1. **T-1 — Provision the tracked harness substrate (AC-1, AC-2):** use the pinned ambient CLI to initialize never-clobbered governance and scaffold versioned checks/boot extensions; retain only repository artifacts and nested transient ignores.
2. **T-2 — Implement delegating boot and validation verbs (AC-1, AC-3, AC-4):** add a root `justfile` boot recipe for build-plus-run, make checks select focused or full root recipes, and make boot invoke the root boot recipe then compose full harness checks with structured evidence.
3. **T-3 — Inject harness governance and cold-agent instructions (AC-2, AC-4, AC-5):** populate the BIO governance contract and RPIV injection map, complete verb briefings, add managed commit guidance, and align agent/user documentation and repository maps.
4. **T-4 — Prove clean-checkout adoption and record evidence (AC-6):** validate the exact tracked implementation in an isolated fresh checkout with the pinned ambient CLI, preserving transcripts and a clean-tree result in implementation evidence.

Implementation must not change `src/` product behavior. The untracked investigation archive must remain uncommitted. Root `justfile` recipe bodies remain the only raw project command definitions, and `just verify-focused` plus `just verify` remain valid RPIV entry points.
