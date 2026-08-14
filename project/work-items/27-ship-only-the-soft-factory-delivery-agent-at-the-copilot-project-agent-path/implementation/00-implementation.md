# Implementation Evidence: Issue 27

## Scope and task completion

- Work item: `project/work-items/27-ship-only-the-soft-factory-delivery-agent-at-the-copilot-project-agent-path`
- Branch: `feat/27-single-soft-factory-agent`
- Plan base: `ed57ab37434f916c3a7a9339518e975c19a55434`
- Completed in dependency order: T1, T2, T3, T4, T5, T6, T7.
- The task breakdown marks T1 through T7 complete only after focused or full evidence was available.
- Final acceptance remains owned by Verify.

## Implementation summary

- Contracted the selectable catalog and recommended set to `agent:soft-factory` at `.github/agents/soft-factory.agent.md`.
- Added a separate four-pair, stable-rank ownership vocabulary for current and historical manifest proof.
- Rebuilt convergence as one cross-root, manifest-last transaction that installs, adopts, upgrades, retires proved legacy files, removes only eligible empty directories, and restores exact pre-invocation bytes and path kinds after caught faults.
- Added explicit retirement outcomes and complete uncertain-rollback affected-path evidence.
- Finalized the delivery-only APS Copilot agent with qualified terminal tools, strict pre-terminal issue validation, instructions-before-Doctor ordering, ready-only dispatch, unchanged applicable Runner output, no retry or status query, and separate dispatch and ticket-completion facts.
- Removed the tracked assessor and skill product sources, narrowed CLI selectors and npm publication, and replaced stale install fixtures with the Issue 27 V3-V9/V11 scenario catalog.

## Acceptance evidence

| AC | Concrete implementation and validation evidence |
|---|---|
| AC-1 | `src/official-assets.ts` exposes one current identity and destination; `src/command.ts` recommends the same identity; tracked assessor and skill sources are deleted. V1 in `src/official-assets.test.ts` and V11 in `src/asset-cli.test.ts` prove one packaged and installable asset. The dry-run package official inventory is exactly `assets/official/soft-factory.agent.md`. |
| AC-2 | `assets/official/soft-factory.agent.md` has exact VS Code frontmatter tools `execute/runInTerminal` and `execute/getTerminalOutput`, required booleans/target, ordered APS sections, and Runner-only resource prohibitions. V2 mutation-sensitive checks in `src/official-assets.test.ts` pass. |
| AC-3 | The agent validates exactly one canonical positive base-10 issue before the first terminal `USE`, calls instructions before Doctor, gates the single run on explicit readiness, preserves each applicable result unchanged, and separates dispatch from completion with `unknown` default. V2 process-index, forbidden-command, and mutation checks pass. |
| AC-4 | V3 and V11 run individual and recommended installation through the same one-agent convergence. Independent digest proof reports source, installed file, catalog, and manifest digest `a77899dbd3d4d3e3d89a637b736f80690334363908b6d593d9742579924c8cad`, destination `.github/agents/soft-factory.agent.md`, one manifest entry, and `allEqual: true`. |
| AC-5 | `parseCommand` accepts only the current individual and recommended forms; V1 and V11 prove removed assessor and skill selectors return `CLI_INVALID` and exit 2. `just run --help` advertises only current install forms and the new destination. |
| AC-6 | V4 `migrates matching old bytes and retires an absent stale old entry` proves both historical old-agent outcomes converge to trusted current bytes and one current entry. |
| AC-7 | V4 dual-destination rows prove desired current adoption and recorded older-current upgrade; separate modified-old and unproved-current rows return `ASSET_LOCAL_MODIFIED`, zero mutations, and exact inventory equality. |
| AC-8 | V5 proves matching assessor and skill retirement, stale absent-entry retirement, modified assessor and skill refusal, and byte/inode preservation for an untracked skill sibling. |
| AC-9 | V5 records deepest-first removal of `.agents/skills/soft-factory` then `.agents/skills`, preserves nonempty sibling directories, and does not delete a directory for an absent stale file. |
| AC-10 | The closed parser and V6 reject malformed, unsupported, duplicate, contradictory, unstable, unrecorded, modified, collision, and symlink states with stable typed errors, `noChanges: true`, literal `No files changed`, empty mutation traces, and exact inventories. |
| AC-11 | V4 and V7 prove desired current bytes retain their inode, exact current-digest proof authorizes upgrade, and current convergence combines atomically with all proved obsolete retirements. |
| AC-12 | V8 injects before and after every concrete mutation for clean, migration, adoption-plus-retirement, upgrade-plus-retirement, and retirement-only plans and compares complete inventories. V9 forces reverse restoration failure and proves `ASSET_ROLLBACK_UNCERTAIN`, no no-change claim, complete planned paths, and restore-before-retry remediation. |
| AC-13 | V3, V4, V5, and V7 repeat successful states under mutation tripwires; results are `ASSETS_UP_TO_DATE` with one current entry, unchanged inode where applicable, no obsolete files, and no new legacy directories. |
| AC-14 | `fixtures/install/issue-27-scenarios.json` uniquely declares stable V3-V9 and V11 scenarios. The executable V5 case `executes declared unrelated-content-preservation across both managed roots` binds the declared scenario and independently proves byte, inode, and exact path preservation for files under `.github/agents`, `.agents/agents`, and `.agents/skills` during successful convergence. |
| AC-15 | V8 derives the fault count from each successful concrete transaction trace and faults every before/after boundary. A dedicated case covers the post-current-write and pre-old-retirement window. V9 covers uncertain rollback for every required plan shape. |
| AC-16 | V1 package inspection finds exactly the delivery-agent source and no assessor, skill, or reference source. V2 checks the actual trusted agent, and V11 repeats the static contract against packed bytes. |
| AC-17 | Current PRD delivery-agent surfaces now authorize exactly one validated issue dispatch: strict input rejection before tools, instructions before Doctor, ready-only direct run, unchanged applicable Runner output, separate dispatch/completion facts, and no lifecycle commands. V10 slices PRD §§15–17, asserts the command order and required clauses, rejects every lifecycle command form in that surface, and rejects stale Operator/lifecycle authorization phrases across the PRD. |

## Validation evidence

### Focused

- Direct `just verify-focused`: exit 0; 21 suites passed, 352 tests passed; `git diff --check` passed.
- `harness checks --focused --json`: status `ok`, scope `focused`, delegated command `just verify-focused`, exit code 0; 21 suites and 351 tests passed at that checkpoint. A later direct run includes the fixture-catalog test for 352 total.
- Earlier focused feedback exposed stale help documentation and was corrected before any task was marked complete.

### Full

- First direct `just verify` reached `format-check` and identified nine changed TypeScript files. The configured Prettier formatter was applied to only those files.
- Retried direct `just verify`: exit 0. Lint, format check, strict type check, 21 test suites, 352 tests, coverage, build, and diff check passed. Global coverage was 88.13% statements, 83.66% branches, 94.37% functions, and 89.73% lines.
- `harness checks --json`: status `ok`, scope `full`, delegated command `just verify`, exit code 0; all full stages passed.
- `src/asset-doctor-regression.test.ts` passed in the full suite, retaining the canonical 24-check Doctor authority and ignoring the official-asset manifest.

## Package inventory and digest proof

- `npm pack --dry-run --json` returned 63 entries and included `dist/index.js`.
- Exact `assets/official/` inventory: `assets/official/soft-factory.agent.md`.
- Assessor source present in package: false.
- Skill source present in package: false.
- `assets/official/theoutsideone.agent.md` present in package: false.
- Source, installed, catalog, and manifest SHA-256 are all `a77899dbd3d4d3e3d89a637b736f80690334363908b6d593d9742579924c8cad`.

## Documentation evidence

- README: current setup/usage, one-agent install forms, invocation, destination, manifest, migration/refusal/preservation/rollback summary, and Doctor authority.
- Docs index: one-agent guide description and current local commands.
- Phase 5 guide: complete consumer, migration, safety, package, troubleshooting, no-configuration-default, no-API, no-service, and no-deployment contract.
- PRD: current product model, repository layout, commands, manifest, safety, functional requirements, acceptance examples, prototype, and user journey now describe one delivery agent. Historical assessor/skill language remains only where explicitly identified as removed migration context.
- CLI help: only `install agent soft-factory` and `install --recommended`, with `.github/agents/soft-factory.agent.md` and `.agents/manifest.json` semantics.
- API documentation: no API specification exists or is required because the change introduces no network API contract.
- Configuration documentation: no option or default changed; the Phase 5 guide explicitly records that no configuration migration is required.
- Architecture documentation: the accepted ADR, core-component, and decision log were updated by Plan commit `ed57ab37434f916c3a7a9339518e975c19a55434`; implementation required no deviation or further architecture edit.
- Operational/deployment documentation: installation remains one local short-lived CLI invocation; the guide explicitly states no service, daemon, webhook, container, or deployment change.

## Files changed and deleted

- Product/runtime: `assets/official/soft-factory.agent.md`, `src/official-assets.ts`, `src/asset-manifest.ts`, `src/asset-installation.ts`, `src/asset-live.ts`, `src/asset-render.ts`, `src/command.ts`, `src/official-agent-contracts.ts`, `package.json`, `.github/workflows/ci.yml`.
- Tests/fixtures: `src/official-assets.test.ts`, `src/asset-installation.test.ts`, `src/asset-cli.test.ts`, `src/documentation.test.ts`, `fixtures/install/issue-27-scenarios.json`; six obsolete prior fixture declarations deleted.
- Documentation: `README.md`, `docs/README.md`, `docs/phase-5-official-assets.md`, `PRD.md`.
- Product sources deleted: `assets/official/soft-factory-assessor.agent.md`, `assets/official/soft-factory/SKILL.md`.
- RPIV evidence: this file, task status, and the retro records below.

## Harness friction drain evidence

All records use schema version 1.2, agent identity matching the drained buffer, plan ID `27-ship-only-the-soft-factory-delivery-agent-at-the-copilot-project-agent-path`, and `disposition: kept` for every observation. Each record was read back and every pending ID plus description was verified before the successful clear envelope.

| Agent | Pending verified | Retro record | Clear evidence |
|---|---:|---|---|
| `rpiv` | 2 | `.harness/records/retro/2026-08-14/001-issue-27-rpiv.md` | status `ok`, cleared 2 |
| `rpiv-research` | 11 | `.harness/records/retro/2026-08-14/002-issue-27-rpiv-research.md` | status `ok`, cleared 11 |
| `rpiv-planner` | 2 | `.harness/records/retro/2026-08-14/002-issue-27-rpiv-planner.md` | status `ok`, cleared 2 |
| `rpiv-implementer` | 10 | `.harness/records/retro/2026-08-14/003-issue-27-rpiv-implementer.md` | status `ok`, cleared 10 |
| `rpiv-implementer` package retry | 1 | `.harness/records/retro/2026-08-14/004-issue-27-rpiv-implementer-post-drain.md` | status `ok`, cleared 1 |
| `rpiv-implementer` notes setup | 1 | `.harness/records/retro/2026-08-14/005-issue-27-rpiv-implementer-notes-setup.md` | status `ok`, cleared 1 |

## Protected working-tree proof

| Path | Before SHA-256 | After SHA-256 | Intended status |
|---|---|---|---|
| `assets/official/theoutsideone.agent.md` | `149f0bc7bbdc85ca9fa9a0b7dfa11ae58839311de78696ba29a6099e756695c3` | `149f0bc7bbdc85ca9fa9a0b7dfa11ae58839311de78696ba29a6099e756695c3` | byte-identical, untracked, uncommitted, excluded from npm package |
| `soft-factory-runner-0.1.0.tgz` | `cbca56b3c27e5ced504cf9cea974c2e4b9ec93de805ad98b2b779768a59da06d` | `cbca56b3c27e5ced504cf9cea974c2e4b9ec93de805ad98b2b779768a59da06d` | byte-identical, untracked, uncommitted |


## Verification Return Correction — 2026-08-14

Verify returned exactly two defects to Implement:

1. AC-14 lacked an executable test for the declared `unrelated-content-preservation` fixture scenario.
2. AC-17 migration documentation inaccurately implied that legacy bytes move to the current destination.

Surgical correction evidence:

- Added one V5 installation test that reads the tracked scenario declaration, creates unrelated files at `.github/agents/unrelated.agent.md`, `.agents/agents/unrelated.agent.md`, and `.agents/skills/unrelated/SKILL.md`, performs successful convergence, and independently asserts each file remains at the exact path with byte-identical content and unchanged inode.
- Corrected only the Phase 5 migration outcome sentence. It now distinguishes installation of trusted current packaged bytes from independent retirement of digest-proved legacy bytes.
- Added coupled documentation assertions for both required clauses and a negative assertion against the former move wording.
- No runtime source behavior, package contract, configuration, API, architecture, or deployment behavior changed.

Validation results:

- Targeted `just verify-focused src/asset-installation.test.ts src/documentation.test.ts`: exit 0; 2 suites, 60 tests.
- `harness checks --focused --json`: status `ok`; delegated `just verify-focused`; 21 suites, 353 tests.
- Direct `just verify-focused`: exit 0; 21 suites, 353 tests; diff check passed.
- Direct `just verify`: exit 0; lint, format, type check, 21 suites, 353 tests, coverage, build, and diff check passed.
- `harness checks --json`: status `ok`; delegated `just verify`; exit 0; 21 suites, 353 tests.
- Package dry-run remains 63 entries with exact official inventory `assets/official/soft-factory.agent.md`; protected reference and tarball are absent.

Friction drain:

- `.harness/records/retro/2026-08-14/006-issue-27-rpiv-implementer-verify-return.md` records one `rpiv-implementer` coordination observation.
- The record was read back and verified for schema 1.2, matching agent and plan ID, observation ID/description, and `disposition: kept` before `harness observe --clear` returned status `ok` with `cleared: 1`.
- `.harness/records/retro/2026-08-14/007-issue-27-rpiv-implementer-correction-evidence.md` records the later evidence-authoring retry; it was independently read back with the same schema/identity/entry checks before a second successful `cleared: 1` envelope.

Changed correction files are limited to `src/asset-installation.test.ts`, `src/documentation.test.ts`, `docs/phase-5-official-assets.md`, T5/T6/T7 evidence in `plan/02-task-breakdown.md`, this implementation evidence, and generated retro records.


## Second Verification Return Correction — 2026-08-14

Verify returned the remaining AC-17 defect: PRD §§15–16 still described the official agent as a general lifecycle operator.

Surgical documentation correction:

- Renamed current PRD Operator references to Delivery Agent where they identify the packaged official agent.
- Replaced PRD §§15–17 with the exact delivery-only contract: exactly one canonical explicit issue, pre-terminal rejection of every invalid input class, direct instructions then Doctor then ready-only run, no retry or status query, unchanged applicable structured output, dispatch acceptance separate from completion, and completion `unknown` unless Runner explicitly reports it.
- Removed current authorization for install, list, status, attach, logs, reconcile, resume, stop, clean, internal, direct RPIV, and resource manipulation. Runner lifecycle commands remain documented only as capabilities of the human-facing deterministic CLI, not the official agent.
- Aligned the executive model, product vision, core model, product principles, AC-019, Prototype 5 success criterion, recommended user journey, product boundary, success metric, and final product definition with the same one-dispatch boundary.
- No runtime source, packaged agent bytes, package metadata, API, configuration, architecture, or deployment behavior changed.

Regression evidence:

- V10 test `locks every current PRD official-agent surface to delivery-only dispatch` extracts PRD §§15–17, requires all delivery-only clauses and command ordering, proves exactly one run command, rejects every lifecycle command form in that surface, and rejects stale authorization phrases globally.
- Targeted `just verify-focused src/documentation.test.ts`: exit 0; 1 suite and 22 tests.
- `harness checks --focused --json`: status `ok`; delegated `just verify-focused`; 21 suites and 354 tests.
- Direct `just verify-focused`: exit 0; 21 suites and 354 tests.
- Direct `just verify`: exit 0; lint, format, type check, 21 suites and 354 tests, coverage, build, and diff check passed.
- `harness checks --json`: status `ok`; delegated `just verify`; exit 0; 21 suites and 354 tests.
- Package dry-run remains 63 entries with exact official inventory `assets/official/soft-factory.agent.md` and excludes both protected files.

Friction drain:

- `.harness/records/retro/2026-08-14/008-issue-27-rpiv-implementer-second-verify-return.md` contains both pending `rpiv-implementer` observations with schema 1.2, matching plan and agent identity, and `disposition: kept`.
- The record was read back and checked against both pending IDs/descriptions before `harness observe --clear` returned status `ok` with `cleared: 2`.
- `.harness/records/retro/2026-08-14/009-issue-27-rpiv-implementer-second-return-evidence.md` records the two subsequent evidence read-back observations; it was independently read back against both IDs/descriptions before a second successful `cleared: 2` envelope.

Changed files are limited to `PRD.md`, `src/documentation.test.ts`, T6/T7 evidence in `plan/02-task-breakdown.md`, this implementation evidence, and the generated retro record.

No GitHub acceptance checkbox was changed. Verify independently owns final acceptance.
