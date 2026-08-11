# Task Breakdown: Phase 0: Adopt the engineering harness

## Task T-1: Provision the tracked harness substrate

- **Status:** Complete
- **Complexity:** Medium
- **Dependencies:** None
- **Acceptance Criteria:** AC-1, AC-2
- **Related ADRs:** ADR-260811-engineering-harness-surface, ADR-260810-typescript-node-cli
- **Related Core-Components:** CORE-COMPONENT-260811-engineering-harness-interface, CORE-COMPONENT-260806-project-command-interface, CORE-COMPONENT-260806-agent-executable-acceptance-criteria, CORE-COMPONENT-260810-development-standards

### Description
- Confirm ambient `harness` is v0.13.0 without adding it to `package.json` or committing the local archive.
- Run idempotent harness initialization and official extension scaffolding for `checks` and `boot`; preserve generated extension layout and complete it in T-2.
- Track `.harness/engineering-harness.md`, extension entries, extension briefings, and the nested ignore convention for `.harness/temp/`; exclude transient reports, records, telemetry, and scratch state unless explicitly required evidence.
- Define repository-owned readiness as compatible Node, healthy core layers, required extensions loaded without conflict/failure, protected transient paths, and discoverable verbs. Retain machine-level doctor warnings separately instead of hiding them.

### Acceptance Criteria
- **AC-1:** The locally available @ai-substrate/engineering-harness CLI reports a healthy installation for this repository.
- **AC-2:** Repository-local harness governance and adoption artifacts are committed and discoverable by a cold agent session.

### Test Coverage
- Run V-1 to assert the pinned version, structured doctor envelope, required loaded extensions, repository convention health, and verb discovery.
- Run the tracked-artifact portion of V-7 to ensure required substrate is committed and transient/package inputs are absent.
- Re-run initialization to prove it does not clobber populated governance.

### Expected Evidence
- Version and doctor JSON excerpts with exit codes and repository-owned layer assessment.
- `git ls-files .harness` manifest showing governance, extension entries, briefings, and transient ignore rules only.
- Idempotent initialization result with `created: false` and unchanged governance checksum.

## Task T-2: Implement delegating boot and validation verbs

- **Status:** Complete
- **Complexity:** High
- **Dependencies:** T-1
- **Acceptance Criteria:** AC-1, AC-3, AC-4
- **Related ADRs:** ADR-260811-engineering-harness-surface, ADR-260810-typescript-node-cli
- **Related Core-Components:** CORE-COMPONENT-260811-engineering-harness-interface, CORE-COMPONENT-260806-project-command-interface, CORE-COMPONENT-260806-rpiv-stage-contract, CORE-COMPONENT-260810-development-standards, CORE-COMPONENT-260810-error-handling, CORE-COMPONENT-260810-subprocess-execution

### Description
- Add a root `justfile` boot recipe that establishes a known state by building and then starting the current short-lived CLI through existing project scripts. Keep every raw operating command in this root recipe and leave existing recipes intact.
- Implement `harness checks` with a discoverable focused selector. Full mode delegates to `just verify`; focused mode delegates to `just verify-focused`. Return bounded stdout, selected scope, delegated command, and exit metadata.
- Implement `harness boot` to invoke the root boot recipe, verify the expected application result, then compose `harness checks --json` in full mode. Aggregate both stages into an `ok` envelope only when both pass; otherwise return a stable error and actionable next action.
- Complete boot/checks briefings so callers understand deterministic output, judgment required, and failure caveats. Do not change `src/` behavior or duplicate npm commands in extensions.

### Acceptance Criteria
- **AC-1:** The locally available @ai-substrate/engineering-harness CLI reports a healthy installation for this repository.
- **AC-3:** A harness boot command starts the current application from a known state and returns inspectable success or failure evidence.
- **AC-4:** Focused and full repository validation are discoverable through the harness while just verify-focused and just verify remain valid RPIV entry points.

### Test Coverage
- Run V-3 against `harness boot --json`, asserting app and composed-check stages, exact bootstrap signal, and envelope/exit behavior.
- Run V-4 and V-5 for harness-focused, harness-full, and direct RPIV recipe compatibility.
- Inspect extension source for argument-array execution, bounded output, timeout, stable error code, and non-`ok` next action.

### Expected Evidence
- Boot JSON containing known-state command, exact application stdout, application exit status, composed checks verdict, and overall `ok` status.
- Focused/full help and briefing output plus successful harness and direct `just` validation transcripts.
- Diff proving raw commands remain in the root `justfile` and `src/` is unchanged.

## Task T-3: Inject governance and cold-agent instructions

- **Status:** Complete
- **Complexity:** Medium
- **Dependencies:** T-2
- **Acceptance Criteria:** AC-2, AC-4, AC-5
- **Related ADRs:** ADR-260811-engineering-harness-surface
- **Related Core-Components:** CORE-COMPONENT-260811-engineering-harness-interface, CORE-COMPONENT-260806-project-command-interface, CORE-COMPONENT-260806-rpiv-stage-contract, CORE-COMPONENT-260505-commit-standards, CORE-COMPONENT-260806-agent-executable-acceptance-criteria

### Description
- Populate canonical governance with exact boot, checks, health/smoke, interact, observe, signals, evidence paths, back-pressure gaps, honest maturity, and the RPIV lifecycle injection map.
- Update `AGENTS.md` so cold autonomous sessions start with `harness instructions`, use boot before product work, use focused/full harness checks during work, and still execute direct root `justfile` validation at RPIV boundaries.
- Use the CLI-managed commit-guidance injection rather than hand-authoring its managed block, preserving the existing commit-standard contract.
- Align `README.md`, `docs/README.md`, `CONTRIBUTING.md`, `LLM.txt`, and applicable project indexes so humans and agents can locate governance and commands without conflicting command ownership.

### Acceptance Criteria
- **AC-2:** Repository-local harness governance and adoption artifacts are committed and discoverable by a cold agent session.
- **AC-4:** Focused and full repository validation are discoverable through the harness while just verify-focused and just verify remain valid RPIV entry points.
- **AC-5:** Repository instructions direct autonomous agents to use the harness as the deterministic product-development surface.

### Test Coverage
- Run V-2 from only tracked cold-session cues and confirm a caller reaches instructions, boot, focused checks, full checks, governance, and direct RPIV recipes.
- Run V-7 static instruction/governance checks and verify no stale statement says the root `justfile` is the default product-development surface for agents.
- Re-run managed commit-guidance injection and assert an idempotent diff.

### Expected Evidence
- Cold-session command/discovery transcript and links followed.
- Documentation diff with consistent harness and RPIV boundary language.
- Completed governance sections/injection rows and doctor confirmation that commit guidance is present.

## Task T-4: Prove clean-checkout adoption and record evidence

- **Status:** Pending
- **Complexity:** Medium
- **Dependencies:** T-1, T-2, T-3
- **Acceptance Criteria:** AC-6
- **Related ADRs:** ADR-260811-engineering-harness-surface, ADR-260810-typescript-node-cli
- **Related Core-Components:** CORE-COMPONENT-260811-engineering-harness-interface, CORE-COMPONENT-260806-rpiv-stage-contract, CORE-COMPONENT-260806-project-command-interface, CORE-COMPONENT-260806-agent-executable-acceptance-criteria, CORE-COMPONENT-260810-development-standards

### Description
- Create an isolated checkout of the exact implementation commit with no reused `node_modules` or transient `.harness` state.
- Confirm external prerequisites explicitly: Node >=22, `just`, and ambient harness v0.13.0. Run project setup, readiness, boot, focused harness checks, full harness checks, and both direct RPIV recipes.
- Record per-AC evidence and documentation evidence in `implementation/00-implementation.md`; preserve the clean-checkout command transcript and final status. Do not commit the local archive or generated runtime state.

### Acceptance Criteria
- **AC-6:** Harness readiness, boot, focused validation, and full validation complete successfully from a clean checkout.

### Test Coverage
- Run V-6 end to end in the isolated checkout after `just setup`.
- Re-run V-1 through V-5 against that checkout where applicable.
- Assert final `git status --short` is empty and inspect ignored/transient harness paths.

### Expected Evidence
- Exact commit SHA, prerequisite versions, setup result, command sequence, exit codes, and JSON statuses.
- Successful direct `just verify-focused` and `just verify` results from the same checkout.
- Empty final tracked/untracked status and an implementation evidence table mapping AC-1 through AC-6.
