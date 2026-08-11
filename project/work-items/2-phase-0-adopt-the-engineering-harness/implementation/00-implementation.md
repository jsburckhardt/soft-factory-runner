# Implementation Evidence: Phase 0: Adopt the engineering harness

## Scope and commits

- Issue: #2
- Branch: `issue/2-adopt-engineering-harness`
- Preserved work-item path: `project/work-items/2-phase-0-adopt-the-engineering-harness/`
- Clean-room implementation commit: `6610afff221c7cc8b752e2bae4515b291757fbdf`
- Product source behavior: unchanged (`git diff origin/main -- src` produced no diff, exit 0).
- Local archive: excluded only through repository-local Git metadata; absent from `git ls-files` and absent from package dependencies.

## Completed tasks

- **T-1:** Provisioned canonical governance, official `boot`/`checks` extension scaffolds, briefings, and nested transient ignores. `harness init` rerun returned `created:false`; the governance SHA-256 remained `c1ea6725009cc5b4165310a7310ed6fce6e534792a7d4aa8f1dd705d61a05562` before and after that pre-population idempotence check.
- **T-2:** Added `just boot`; implemented argument-array delegation, five-minute deadlines, 12,000-character bounded outputs, stable error codes/next actions, exact smoke-signal validation, and full-check composition.
- **T-3:** Populated BIO governance/injection map, injected CLI-managed commit guidance, and aligned cold-agent, user, contributor, architecture, and repository-map documentation. A managed-block rerun returned `action:unchanged`, exit 0, with identical AGENTS.md checksum.
- **T-4:** Exercised the implementation commit from an isolated checkout without reused dependencies or harness runtime state.

## Acceptance evidence

| AC | Concrete implementation and observed evidence |
|---|---|
| **AC-1** | Ambient `harness --version` returned `0.13.0` (exit 0). V-1 doctor returned exit 0; Node/runtime/core layers were healthy, both extensions loaded with 0 failures/conflicts, quality-gate and commit-guidance layers were healthy, and conventions were empty. The top-level `degraded` status was only the separately recorded machine attribution/capture condition below. |
| **AC-2** | V-2/V-7 followed `AGENTS.md` → `harness instructions` → `.harness/engineering-harness.md` → verb briefings. `git ls-files .harness` listed governance, both extension entries/briefings, `.harness/.gitignore`, and `.harness/temp/.gitignore`; no archive or transient report/record/telemetry file was tracked. |
| **AC-3** | V-3 `harness boot --json` returned exit 0/status `ok`; application stage reported command `just boot`, exit 0, `signalObserved:true`, and the exact bootstrap signal. Its composed stage reported command `harness checks --json`, exit 0/status `ok`, scope `full`, delegation `just verify`. |
| **AC-4** | V-4 focused envelope returned status `ok`, scope `focused`, delegation `just verify-focused`, exit 0. V-5 full envelope returned status `ok`, scope `full`, delegation `just verify`, exit 0. Per-verb help/briefings documented both modes; `just --list` retained `verify-focused` and `verify`; both direct recipes exited 0. |
| **AC-5** | `AGENTS.md`, three RPIV agent definitions, README, CONTRIBUTING, docs index, LLM map, governance, and briefings consistently identify harness orientation/boot/checks and preserve direct RPIV root validation. Managed commit guidance is CLI-owned and idempotent. |
| **AC-6** | V-6 checked out `6610afff221c7cc8b752e2bae4515b291757fbdf` into `/tmp/soft-factory-runner-issue2-clean`; setup, readiness, boot, focused/full harness checks, and both direct recipes all exited 0. Final `git status --short` was empty. |

## V-1 through V-7 command results

| Validation | Exact command or assertion | Result |
|---|---|---|
| V-1 | `harness --version` | `0.13.0`, exit 0 |
| V-1 | `harness doctor --json` | exit 0; repository-owned layers healthy; extensions `boot`,`checks` loaded; no conventions |
| V-1 | `harness help --json` | exit 0; both verbs present with briefings |
| V-1 | `harness init` plus governance checksums | exit 0, `created:false`, unchanged checksum |
| V-2 | tracked cold-entry read/command path and `harness instructions boot/checks --json` | exits 0; operations and RPIV boundary recipes discovered |
| V-3 | `harness boot --json` | exit 0, status `ok`, exact application signal and composed full checks |
| V-4 | `harness checks --focused --json` | exit 0, status `ok`, focused → `just verify-focused` |
| V-4 | `just verify-focused` | exit 0 |
| V-5 | `harness checks --json` | exit 0, status `ok`, full → `just verify` |
| V-5 | `just verify` | exit 0 |
| V-5 | `just --list` | exit 0; `boot`, `verify-focused`, and `verify` listed |
| V-6 | `just setup` in isolated checkout | exit 0; 573 packages installed, 0 vulnerabilities |
| V-6 | readiness → boot → focused harness → full harness → direct focused → direct full | every command exit 0 |
| V-6 | `git status --short` after all clean-room commands | empty, assertion exit 0 |
| V-7 | tracked manifest, governance heading audit, instruction grep, decision 33–37 audit, raw-command grep, `git diff origin/main -- src` | all assertions exit 0; no raw npm/tool command in extensions; no source diff |

## Machine-only degradation

Doctor returned top-level `degraded` with exit 0 because two host-level rows were not healthy; no repository-owned row failed:

- `capture-liveness`: telemetry capture is off by default, so liveness cannot be measured. Next action says no repair is needed if intentional, or set `HARNESS_TELEMETRY_CAPTURE=1` to make it measurable.
- `gitai-collector`: host has git-ai v1.6.21 but global trace2 configuration prevented hook installation, so attribution collection is absent. Doctor names backup/removal of global trace2 keys or explicit collector installation as machine remediation.

The implementation commit itself used `harness commit` in `direct-verified` mode and reported its `refs/notes/ai` attribution note landed. These host warnings were retained rather than masked and do not indicate a repository extension, convention, command, or documentation failure.

## Focused validation evidence

`just verify-focused` was run after each dependency-ordered task and exited 0 each time:

- T-1: exit 0; 1 suite/2 tests passed; diff check passed.
- T-2: exit 0; 1 suite/2 tests passed; diff check passed.
- T-3: exit 0; 1 suite/2 tests passed; diff check passed.
- T-4: exit 0; 1 suite/2 tests passed; diff check passed.

## Full validation evidence

Final local `just verify` exited 0: ESLint, Prettier, strict typecheck, Jest with 100% statement/branch/function/line coverage, build, and diff check all passed. The same direct recipe also exited 0 in the isolated checkout.

## Documentation evidence

| Category | Evidence |
|---|---|
| README/setup | `README.md` documents Node 22+, `just`, ambient harness v0.13.0, `just setup`, and explicitly excludes the harness from project dependencies. |
| Usage/examples | `README.md`, `CONTRIBUTING.md`, `docs/README.md`, governance, and verb briefings document instructions, doctor, boot, focused/full checks, and direct RPIV recipes. |
| Agent instructions | `AGENTS.md` and relevant RPIV agent definitions orient cold sessions through harness JSON while retaining root validation; CLI-managed commit guidance is present. |
| Configuration | `.harness/engineering-harness.md`, extension entries/briefings, and nested ignore files document and encode current harness configuration and transient-state rules. No product configuration option or default changed. |
| API reference/specification | No impact: no product API or externally callable application contract changed; the new development verbs are self-described by harness help and tracked briefings. |
| Migration/upgrade | No migration required: `src/`, data, API, and product configuration are unchanged. The ambient CLI is an explicit external development prerequisite. |
| Architecture | ADR, core-component, decision log entries 33–37, and architecture/core-component indexes record command ownership and harness boundaries. |
| Operations/deployment | Governance documents boot, health/smoke, interaction, observation, evidence, and limitations. No deployment procedure changed because the application remains a short-lived CLI. |
| Repository maps | `LLM.txt`, `project/README.md`, `project/architecture/README.md`, and the core-component index expose the new artifacts to humans and agents. |

## Handoff boundary

This record provides Implement evidence only. Final acceptance and GitHub criterion updates remain owned by Verify.
