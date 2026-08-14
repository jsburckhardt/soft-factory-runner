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
| AC-14 | `fixtures/install/issue-27-scenarios.json` uniquely declares stable V3-V9 and V11 scenarios. Named Jest rows cover clean and recommended, repeat, old and dual destinations, adoption, upgrade, obsolete retirement, siblings, cleanup, refusal classes, and packed behavior. |
| AC-15 | V8 derives the fault count from each successful concrete transaction trace and faults every before/after boundary. A dedicated case covers the post-current-write and pre-old-retirement window. V9 covers uncertain rollback for every required plan shape. |
| AC-16 | V1 package inspection finds exactly the delivery-agent source and no assessor, skill, or reference source. V2 checks the actual trusted agent, and V11 repeats the static contract against packed bytes. |
| AC-17 | `README.md`, `docs/README.md`, `docs/phase-5-official-assets.md`, `PRD.md`, and live CLI help describe the one-agent package, exact install and invocation commands, destination, strict manifest, migration truth table, modification refusal, sibling preservation, empty-only cleanup, exact or uncertain rollback, and explicit no-API/service/deployment scope. V10 passes. |

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

No GitHub acceptance checkbox was changed. Verify independently owns final acceptance.
