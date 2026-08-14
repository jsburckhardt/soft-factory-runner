# Research Brief: Ship only the Soft Factory delivery agent at the Copilot project-agent path

## GitHub Issue
- **Issue:** #27
- **Title:** Ship only the Soft Factory delivery agent at the Copilot project-agent path
- **Work Item:** project/work-items/27-ship-only-the-soft-factory-delivery-agent-at-the-copilot-project-agent-path

## Scope Classification
- **Scope Type:** core_component

## Problem Statement
The published npm surface currently installs three official assets beneath `.agents/`, while the accepted product surface is one APS-structured `soft-factory` delivery agent at `.github/agents/soft-factory.agent.md`. Existing repositories can contain strict ownership metadata, missing or modified legacy files, both old and new destinations, and unrelated sibling content, so the contract change must preserve trustworthy ownership and avoid partial cross-root mutation.

The retained agent must dispatch exactly one explicitly selected issue through Runner as the sole control plane. The issue identifies `assets/official/theoutsideone.agent.md` as stronger behavioral reference material for input rejection, instructions-before-Doctor ordering, exact structured output, and the distinction between dispatch acceptance and issue completion.

## Acceptance Criteria
<!-- ACCEPTANCE_CRITERIA_START -->

**Core**
- [ ] The published official catalog, recommended installation set, and npm package contain exactly one consumable official asset: the `soft-factory` agent; the assessor agent and Soft Factory skill are absent from published sources, catalog selection, and recommended installation.
- [ ] The packaged agent has the APS section order and tag-newline structure, Copilot-compatible terminal tools, and statically asserted directives that make explicit-issue delivery its primary goal while prohibiting competing worktree, lock, state, process, cleanup, and completion paths.
- [ ] Before any terminal command, the agent rejects missing, multiple, nonpositive, fractional, signed, or otherwise invalid issue input; for valid input it reads `soft-factory instructions --json` before `soft-factory doctor --json`, dispatches only when Doctor reports ready, preserves exact structured Runner output, and never equates dispatch acceptance with issue completion.
- [ ] Individual and recommended installation converge the agent to `.github/agents/soft-factory.agent.md`, with installed bytes identical to trusted packaged bytes and current version, protocol, destination, and SHA-256 ownership metadata recorded in `.agents/manifest.json`.
- [ ] Removed assessor and skill selectors are rejected as unsupported, and user-facing help and documentation advertise only the remaining agent and current destination.

**Migration and safety**
- [ ] A valid prior manifest plus matching official bytes at `.agents/agents/soft-factory.agent.md` migrates the agent to the new destination and retires the old owned file; a prior entry whose old file is absent installs the current agent at the new destination and retires the stale entry.
- [ ] When both agent destinations exist, migration succeeds only if old bytes match recorded ownership and new bytes are either current desired bytes or bytes matching a valid recorded current-destination digest; modified old bytes or any unproved differing new bytes refuse the complete operation before mutation.
- [ ] Valid prior entries for the removed assessor and skill are retired with their files only when present bytes match their recorded digests; absent owned files retire stale entries, modified owned files refuse the complete operation, and untracked skill-directory siblings are preserved.
- [ ] Legacy directories are removed only when empty after proven file retirement; non-empty directories and unrelated content remain unchanged.
- [ ] Unsafe path indirection, malformed metadata, duplicate or contradictory ownership, and unproved destination collisions return actionable stable errors with `No files changed` evidence.
- [ ] A new destination containing current desired bytes is adopted without rewriting it; a new destination with valid recorded older owned bytes is upgraded in place; proven obsolete legacy files and entries retire in the same atomic operation.
- [ ] Every mutating clean install, migration, adoption-plus-retirement, upgrade, and retirement-only operation spans `.github/` and `.agents/` atomically: failure either restores the exact pre-invocation tree or reports uncertain rollback with every affected path and direct remediation.
- [ ] Repeating any successful clean installation or migration is a stable no-op with one current manifest entry, no obsolete official files, and no empty legacy directories created by Runner.

**Verification and documentation**
- [ ] Deterministic automated cases cover clean individual and recommended installation, repeat installation, matching legacy migration, absent legacy agent, both-destination states, current-destination adoption and upgrade, modified legacy refusal, new-destination collision, malformed or contradictory ownership, obsolete-file retirement, untracked skill siblings, empty-directory cleanup, and unrelated-content preservation.
- [ ] Fault-injection cases cover every mutation boundary for clean install, cross-root migration including the window after the new file is written but before the old file retires, adoption-plus-retirement, and retirement-only operations.
- [ ] Package inspection proves the distributable contains the remaining agent and excludes assessor and skill sources; static agent checks prove APS structure, exact-input rejection directives, instructions-before-Doctor order, exact Runner-result preservation, and dispatch-versus-completion distinction.
- [ ] Consumer documentation explains the one-agent package, exact install and invocation commands, `.github/agents/soft-factory.agent.md` destination, legacy migration outcomes, local-modification refusal, sibling preservation, and rollback remediation without claiming an API, service, or deployment change.

<!-- ACCEPTANCE_CRITERIA_END -->

## Repository Findings
- Issue #27 contains one marker-bounded structured Markdown acceptance block with 17 unchecked criteria in three ordered groups. The criteria above preserve the issue wording and order verbatim.
- The protected working-tree baseline contains preliminary modifications to `assets/official/soft-factory.agent.md`, `src/official-agent-contracts.ts`, `src/official-assets.ts`, and `src/official-assets.test.ts`; untracked `assets/official/theoutsideone.agent.md`; and unrelated untracked `soft-factory-runner-0.1.0.tgz`. Research did not overwrite, revert, inspect, or package the tarball.
- `src/official-assets.ts` exposes `OFFICIAL_ASSET_CATALOG` as three entries: the operator at `.agents/agents/soft-factory.agent.md`, the assessor at `.agents/agents/soft-factory-assessor.agent.md`, and the skill at `.agents/skills/soft-factory/SKILL.md`. The preliminary catalog edit changes only the operator digest; it does not change the three-entry catalog or destinations.
- `package.json` publishes the broad `assets/official/` directory. A current `npm pack --dry-run --json` inventory includes `soft-factory.agent.md`, `soft-factory-assessor.agent.md`, `soft-factory/SKILL.md`, and the untracked `theoutsideone.agent.md`. `src/official-assets.test.ts` requires every catalog source to be present but does not reject extra files under that directory; `.github/workflows/ci.yml` likewise accepts every path below `assets/official/`.
- `src/command.ts` accepts the three existing individual selectors and builds `install --recommended` from all three identities. `HELP_TEXT` advertises all three and says installation is beneath `.agents/`. `src/index.ts::runCli` passes the parsed selection directly to the installer.
- `src/asset-manifest.ts::parseAssetManifest` accepts only schema version 1 entries whose identity and exact destination exist in the supplied current catalog, rejects duplicate identities or destinations, and requires current catalog order. A catalog narrowed to one identity or moved to the new destination would therefore reject otherwise well-formed historical assessor, skill, or old-destination operator entries before `AssetInstallationService` can inspect their owned files.
- `src/asset-installation.ts::AssetInstallationService` already verifies package SHA-256 and protocol before mutation, strictly preflights manifest and destination path kinds, adopts desired bytes without rewriting, upgrades differing bytes only from an exact recorded digest, commits the manifest last, and distinguishes exact rollback from uncertain rollback. Its result statuses are limited to `installed`, `adopted`, `upgraded`, and `up-to-date`.
- The same service constrains every managed absolute path to `.agents/`, stages transactions at `.agents/.install-<id>`, and models every planned target change with non-null desired bytes. Successful operations do not retire files or remove legacy directories; file and directory removals in this module are rollback cleanup only. Final manifest construction preserves every unselected prior entry, so an individual current install does not retire other managed identities.
- `src/asset-installation.test.ts` covers the current three-asset clean, repeat, adoption, safe-upgrade, collision, strict-manifest, path-indirection, and rollback behavior. Its current fault matrix addresses the four existing target-or-manifest rename boundaries, not retirement or cross-root mutation. `src/asset-cli.test.ts`, `src/official-assets.test.ts`, and `src/documentation.test.ts` assert the current three selectors, three destinations, and three-asset recommended set.
- `src/asset-doctor-regression.test.ts` proves installation does not alter the ordered 24-check Doctor conjunction: `.github/agents/rpiv.agent.md` remains the sole RPIV readiness asset, and `.agents/manifest.json` is ignored by Doctor.
- `README.md`, `docs/README.md`, `docs/phase-5-official-assets.md`, and `PRD.md` currently advertise three assets and the legacy `.agents/` destinations. The PRD also names all three as functional requirements. The issue therefore conflicts with the current published documentation and established global asset contract rather than adding an isolated feature.
- `harness boot --json` completed with the expected short-lived CLI signal and full checks status `ok`; all 21 suites and 328 tests passed in the preliminary dirty context. This confirms consistency with the currently asserted contract, not satisfaction of the new issue criteria.

### Agent Comparison Findings
- Both `assets/official/soft-factory.agent.md` and `assets/official/theoutsideone.agent.md` use the APS section sequence `instructions`, `constants`, `formats`, `runtime`, `triggers`, `processes`, and `input`, and both prohibit direct Runner resource manipulation.
- The packaged agent declares only `bash`; the reference declares Copilot terminal tools `execute/runInTerminal` and `execute/getTerminalOutput` plus project-agent metadata.
- The packaged agent states that one positive issue is required, but its process performs only an in-process positive assertion after routing and also exposes issue-free lifecycle actions. The reference explicitly rejects missing, multiple, nonpositive, fractional, signed, and invalid input before terminal use.
- `assets/official/soft-factory.agent.md::deliver-issue` invokes Doctor before instructions. The reference invokes instructions before Doctor and dispatches only from a ready Doctor result.
- The packaged process derives commands and reformats `RUN_RESULT` plus an additional status result into `DELIVERY_RESULT`. The reference runs the direct JSON dispatch command and requires the exact structured Doctor or Runner result without retry or reinterpretation.
- The packaged agent exposes `operate-run` and the complete lifecycle command set. The reference limits its operation to one dispatch and explicitly prohibits install, status, reconcile, resume, stop, clean, attach, and logs.
- The packaged instructions prohibit prose-based completion inference, but its output contract has no explicit dispatch-accepted versus ticket-completion fields. The reference represents both separately and requires completion to remain `unknown` when Runner does not report it.
- Preliminary checks in `src/official-agent-contracts.ts` and `src/official-assets.test.ts` assert APS section ordering, `bash`, lifecycle processes, selected phrases, and tag-newline shape. They do not assert pre-terminal invalid-input categories, instructions-before-Doctor process order, exact raw Runner-result preservation, or separate dispatch and completion facts.

## Constraints
- `CORE-COMPONENT-260812-official-asset-installation-contract` explicitly governs the catalog, packaged bytes, selectors, recommended set, strict manifest, installer, fixtures, agent behavior, npm packaging, and documentation. It currently mandates three assets beneath `.agents/`; Issue #27 changes this reusable global contract, which supports `core_component` classification.
- `ADR-260812-official-asset-distribution-installation` fixes package-local trusted bytes, compiled SHA-256 metadata, package-version coupling, Runner protocol 1, no network or subprocess installation, complete preflight, manifest-last transaction behavior, and preservation of unrelated content. It also currently fixes the three identities and destinations.
- Manifest ownership proof remains strict: malformed, duplicate, contradictory, unsupported, unsafe, or digest-mismatched evidence must fail safe. Existing desired bytes are adoptable, while replacement authority comes only from matching recorded ownership.
- `CORE-COMPONENT-260810-error-handling` requires stable typed codes, nonzero failure results, actionable safe context, preserved causes, and fail-safe handling of ownership or filesystem ambiguity.
- `ADR-260812-repository-doctor-readiness` and `src/asset-doctor-regression.test.ts` keep the canonical RPIV readiness authority at `.github/agents/rpiv.agent.md`; the delivery-agent destination does not replace that file or add an official-asset manifest check to Doctor.
- `ADR-260812-rpiv-integration-completion-contract`, `CORE-COMPONENT-260812-rpiv-integration-handoff`, and `CORE-COMPONENT-260811-completion-evidence-reconciliation` reserve completion for Runner reconciliation against strict result, Git, remote, pull-request, acceptance, and final-validation proof. Agent dispatch output cannot authorize completion.
- `ADR-260810-typescript-node-cli` retains the strict TypeScript, Node.js, npm-package, and `soft-factory` executable boundary. Root `justfile` recipes remain the repository command authority.
- The accepted issue requires one atomic outcome across `.github/` agent bytes and `.agents/manifest.json` ownership state, including proven retirements and empty-directory cleanup, while preserving unrelated content and reporting all uncertain rollback paths.
- Consumer documentation remains for a local short-lived CLI and npm package. The issue explicitly excludes any API, service, or deployment claim.
- The preliminary tracked and untracked user changes are immutable Research context. The only permitted project artifact for this stage is this brief.

## Relevant ADRs and Core-Components
- `project/architecture/ADR/ADR-260812-official-asset-distribution-installation.md` — accepted package, catalog, destination, integrity, manifest, transaction, and official-agent authority decision that currently defines the three-asset surface.
- `project/architecture/core-components/CORE-COMPONENT-260812-official-asset-installation-contract.md` — adopted cross-cutting contract directly covering every product surface named by Issue #27.
- `project/architecture/ADR/ADR-260810-typescript-node-cli.md` — npm distribution, Node.js runtime, TypeScript boundaries, and the `soft-factory` executable.
- `project/architecture/ADR/ADR-260812-repository-doctor-readiness.md` — protocol 1 and unchanged canonical RPIV readiness authority at `.github/agents/rpiv.agent.md`.
- `project/architecture/ADR/ADR-260812-rpiv-integration-completion-contract.md` — Runner-owned integration and completion authority.
- `project/architecture/core-components/CORE-COMPONENT-260810-error-handling.md` — stable actionable failures and fail-safe ambiguity handling.
- `project/architecture/core-components/CORE-COMPONENT-260812-rpiv-integration-handoff.md` — exact Runner instructions, dispatch handoff, immutable result, and non-authorizing progress boundaries.
- `project/architecture/core-components/CORE-COMPONENT-260811-completion-evidence-reconciliation.md` — independently reconciled completion proof and prohibition on unproved completion.
- `project/architecture/ADR/DECISION-LOG.md` — registers the relevant artifacts and decisions 86 through 92 for package-local assets, digest trust, all-or-nothing installation, unchanged Doctor authority, ownership proof, operator delegation, and assessor authority.

## Risks and Open Questions
- The current manifest parser is coupled to current catalog identities and destinations. A direct catalog contraction or destination replacement would convert valid migration inputs into `ASSET_MANIFEST_INVALID` before ownership retirement can be evaluated.
- The current transaction and path model cannot represent successful deletion, empty legacy-directory retirement, or a `.github/` destination. Cross-root mutation and rollback therefore have no existing repository proof.
- The untracked reference agent is currently included by the npm allowlist and dry-run package inventory even though it is not a catalog entry. Whether it is intended to remain package-visible reference material is unresolved; its current location prevents the package checks from proving a one-agent published source surface.
- The preliminary packaged-agent changes pass current static checks while retaining Doctor-before-instructions order, broad lifecycle routing, inferred result fields, and `bash`. Passing baseline validation can therefore conceal disagreement with the accepted agent behavior.
- Current PRD, ADR, core-component, help, documentation, package checks, and tests consistently encode the former three-asset contract. Their consistency increases the risk that partial changes leave contradictory user-facing or architecture evidence.
- Strict duplicate-identity and exact-destination manifest rules interact with the issue scenarios where old and new paths coexist or current-destination ownership is recorded. The exact set of historical schema-v1 ownership states that must be recognized as valid remains unclear from repository artifacts.
- Atomic retirement spans modified-file refusal, absent-file stale-entry retirement, unrelated sibling preservation, and uncertain rollback path reporting. The current installer has no retirement outcome model, so behavior at those combined boundaries is unknown.
- No Research-stage blocker was identified. Repository evidence was sufficient; the package visibility of `theoutsideone.agent.md` and valid historical manifest-state boundaries remain open questions.
