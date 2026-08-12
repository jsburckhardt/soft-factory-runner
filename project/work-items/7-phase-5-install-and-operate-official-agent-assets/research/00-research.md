# Research Brief: Phase 5: Install and operate official agent assets

## GitHub Issue
- **Issue:** #7
- **Title:** Phase 5: Install and operate official agent assets
- **Work Item:** `project/work-items/7-phase-5-install-and-operate-official-agent-assets`

## Scope Classification
- **Scope Type:** issue

## Problem Statement
After deterministic readiness exists, provide a safe agent-facing experience without allowing installed agents to bypass Runner's deterministic control plane.

## Acceptance Criteria
**Core**
- [ ] Runner installs the Operator Agent, Assessor Agent, and Soft Factory Skill under .agents/.
- [ ] soft-factory install --recommended installs the complete recommended set and records version and protocol metadata.
- [ ] Reinstalling identical assets is idempotent, while locally modified assets are not silently overwritten.
- [ ] Incompatible or integrity-invalid assets are rejected with actionable output.
- [ ] The Operator Agent delegates explicit issue execution and lifecycle operations to Runner.
- [ ] The Assessor Agent treats soft-factory doctor --json as the authoritative readiness result.
**Verification**
- [ ] Clean, repeated, modified-local, incompatible, and recommended installation fixtures produce deterministic outcomes.
- [ ] Agent contract checks prove neither official agent bypasses Runner invariants.

## Repository Findings
- `PRD.md` sections 8-17, 43-45, and 46 define the target `.agents/agents`, `.agents/skills`, and `.agents/manifest.json` layout; `install agent`, `install skill`, and `install --recommended` grammar; safe refusal for local modifications; per-asset version and Runner-protocol metadata; and Operator/Assessor authority boundaries.
- `PRD.md` section 12 shows a schema-version-1 manifest carrying asset `type`, `name`, `version`, and `runnerProtocol`. No `.agents/manifest.json` exists in the current repository.
- `src/command.ts` (`parseCommand`, `HELP_TEXT`) exposes Doctor, explicit-issue run, and lifecycle/control commands, but no `install` command. `src/index.ts` (`runCli`) has no installation dispatch or service boundary.
- `src/index.test.ts` asserts the current strict public command grammar. `src/doctor-compatibility.test.ts`, `src/doctor-cli.test.ts`, `src/documentation.test.ts`, and `fixtures/doctor/` cover Doctor metadata, compatibility, rendering, and determinism; no installation or official-agent contract fixtures exist.
- `src/doctor.ts` defines `DOCTOR_PROTOCOL_VERSION = 1`, `DOCTOR_RESULT_CONTRACT = agent-result-v1`, and the ordered 24-check readiness model. `src/index.ts` returns exit 0 for READY and exit 3 for a complete NOT READY report, with human and JSON output derived from one result.
- `src/doctor-compatibility.ts` (`observeDoctorCompatibility`) reads only `.github/agents/rpiv.agent.md` for agent metadata and requires that file and `.soft-factory/config.yml` to declare Runner protocol 1. Current Doctor compatibility checks do not inspect the Operator Agent, Assessor Agent, Soft Factory Skill, or an official-asset manifest.
- `.github/agents/rpiv.agent.md` declares `runner_protocol: 1` and `result_contract: agent-result-v1`. Existing `.agents/` content consists of unrelated engineering-harness skills; there are no official Operator or Assessor agent files and no Soft Factory skill at the PRD paths.
- `package.json` distributes the `soft-factory-runner` npm package with the `soft-factory` executable, version `0.1.0`, and Node.js `>=22`; it declares no runtime dependencies or explicit package file list.
- `src/orchestrator.ts` (`IssueRunService`) already owns explicit issue execution and lifecycle operations. `PRD.md` section 49 assigns state, locks, processes, worktrees, tmux, evidence, and recovery to Runner while agents own reasoning.
- `justfile` exposes the required `verify-focused` and `verify` roots; `.harness/engineering-harness.md` confirms harness checks delegate to them and that the product remains a short-lived CLI.

## Constraints
- The eight issue acceptance criteria are structured Markdown criteria and establish `.agents/` as the installation destination, deterministic outcomes, safe handling of local modifications, compatibility/integrity rejection, and non-bypass agent behavior.
- Existing Doctor architecture treats `.github/agents/rpiv.agent.md` as the sole RPIV asset authority and explicitly rejects `.agents/` fallback or prose inference (`ADR-260812-repository-doctor-readiness`, `CORE-COMPONENT-260812-repository-doctor-contract`, `docs/phase-4-repository-doctor.md`). Official `.agents/` assets cannot silently change that existing readiness meaning.
- Runner protocol 1 is already authoritative in `src/doctor.ts`, `.soft-factory/config.yml` compatibility, and RPIV frontmatter. Missing, malformed, unsupported, or contradictory compatibility proof fails safe.
- Expected operational failures must use stable typed codes, actionable remediation, non-zero CLI results, redacted context, and safe behavior under ambiguous filesystem state (`CORE-COMPONENT-260810-error-handling`; `src/errors.ts`).
- Runner remains a strict TypeScript Node.js CLI distributed through npm, with no framework selected and no current runtime dependencies (`ADR-260810-typescript-node-cli`; `package.json`).
- External commands, if involved by asset retrieval, are governed by typed executable/argument arrays, validated inputs, redacted results, and no secret persistence (`CORE-COMPONENT-260810-subprocess-execution`).
- Existing `.agents/` files may be committed and already contain unrelated local skills. Unknown or locally changed filesystem content must be preserved rather than treated as disposable (`PRD.md` sections 8 and 13; `CORE-COMPONENT-260810-error-handling`).
- Operator behavior must call Runner for explicit issue execution and the existing lifecycle surface (`doctor`, `run`, `list`, `status`, `attach`, `logs`, `reconcile`, `resume`, `stop`, `clean`) and must not create competing resources, bypass locks, write successful state, or infer completion from prose (`PRD.md` sections 15-16).
- Assessor readiness authority is the versioned `soft-factory doctor --json` result; Doctor remains repository-scoped and does not inspect or select issues (`CORE-COMPONENT-260812-repository-doctor-contract`; `docs/phase-4-repository-doctor.md`).
- Product operation and validation commands remain owned by the root `justfile`; the ambient harness is not a product dependency (`CORE-COMPONENT-260806-project-command-interface`, `CORE-COMPONENT-260811-engineering-harness-interface`).

## Relevant ADRs and Core-Components
- `ADR-260810-typescript-node-cli` — fixes the strict TypeScript/Node.js/npm CLI distribution boundary and identifies distributed agent assets as part of Runner context.
- `ADR-260811-prototype-one-run-orchestration` — keeps deterministic operational sequencing in Runner and implementation reasoning in RPIV.
- `ADR-260812-repository-doctor-readiness` — establishes protocol 1, canonical RPIV metadata at `.github/agents/rpiv.agent.md`, no `.agents/` fallback, and Doctor as deterministic readiness authority.
- `CORE-COMPONENT-260812-repository-doctor-contract` — defines the complete versioned Doctor JSON/human contract, compatibility checks, fail-safe behavior, and repository-only scope.
- `CORE-COMPONENT-260811-issue-run-orchestration` — defines explicit issue execution, Runner-owned resources/invariants, typed adapters, and the prohibition on Runner making implementation choices.
- `CORE-COMPONENT-260810-error-handling` — requires stable actionable typed failures and safe handling of ambiguous state.
- `CORE-COMPONENT-260810-subprocess-execution` — constrains any external retrieval boundary to validated shell-free, redacted typed execution.
- `CORE-COMPONENT-260810-development-standards` — requires strict TypeScript, deterministic isolated coverage, and the root validation surface.
- `CORE-COMPONENT-260806-project-command-interface` and `CORE-COMPONENT-260811-engineering-harness-interface` — preserve root `justfile` command authority and keep the harness outside product runtime dependencies.

## Risks and Open Questions
- The issue and PRD do not identify the authoritative packaged or remote asset source, catalog format, asset version values, or release coupling to package version `0.1.0`.
- The issue requires integrity-invalid assets to be rejected, while the PRD only states that remote assets should have integrity protection and names a checksum as an example; the authoritative integrity metadata and trust source are unspecified.
- The exact compatibility relationship among package version, per-asset version, Runner protocol 1, and the installed manifest is not fully specified beyond the PRD example fields.
- The recommended-set behavior when only one destination is locally modified or invalid is unspecified: the criteria require no silent overwrite and deterministic outcomes but do not state whether other assets or manifest metadata may change.
- Existing committed `.agents/` content creates collision and coexistence risk even though the official target paths are currently absent.
- Doctor currently validates only RPIV at `.github/agents/rpiv.agent.md`; whether installed official assets or their manifest affect Doctor readiness is unresolved and constrained by the accepted no-fallback Doctor decision.
- The required official agent and skill source text is absent from the repository, so contract wording, asset identity, and version metadata cannot yet be confirmed from repository artifacts.
- The phrase lifecycle operations is bounded by the current Runner command surface in the PRD, but future command additions could make installed agent guidance stale unless version compatibility remains explicit.
