# Implementation: Phase 5 install and operate official agent assets

## Scope and status

Issue #7 was implemented on `feat/7-install-and-operate-official-agent-assets`
within the accepted official-asset distribution and installation architecture.
Tasks T-1 through T-5 are complete in dependency order. This record provides
implementation evidence for Verify; it does not claim final acceptance.

## Completed tasks

- **T-1:** Added the package-local three-asset closed catalog, immutable SHA-256
  metadata, protocol-1/version metadata, explicit npm publication allowlist,
  official Operator/Assessor/skill bytes, and machine-checked authority clauses.
- **T-2:** Added strict manifest-v1 parsing/serialization, complete preflight,
  idempotent/adoption/safe-upgrade planning, collision refusal, same-volume
  staging, target replacement, manifest-last commit, exact rollback, and typed
  uncertain-rollback handling.
- **T-3:** Added the four exact install command forms, structured service
  dispatch, human rendering, stable installer errors/exits, and cumulative help
  without changing prior Doctor or lifecycle grammar.
- **T-4:** Added tracked install scenario declarations, deterministic repeated
  service/built-CLI tests, package inspection, fault injection, contract
  mutation tests, and unchanged Doctor authority/vocabulary regression tests.
- **T-5:** Updated README, docs index, cumulative help/documentation assertions,
  and the Phase 5 operations guide.

## Acceptance evidence

| Acceptance ID | Concrete implementation and executable evidence |
|---|---|
| **AC-1** | `src/official-assets.ts` defines exactly three fixed destinations; `src/asset-installation.test.ts` V-2 clean/recommended tests prove creation under `.agents/`; `src/asset-cli.test.ts` proves individual selection and the built recommended CLI; `src/official-assets.test.ts` proves catalog/package inclusion. |
| **AC-2** | `AssetInstallationService` commits all three recommended entries as one batch and serializes strict `.agents/manifest.json` schema v1 in catalog order with type, name, package version `0.1.0`, Runner protocol 1, destination, and SHA-256. V-2 compares the parsed manifest with the catalog and proves manifest-last ordering. |
| **AC-3** | V-3 proves repeated converged installs have zero mutation calls and preserve the target inode, while identical unmanaged bytes are adopted without target replacement. V-4 proves differing bytes require exact prior manifest digest proof, safe upgrades succeed, and local modifications return `ASSET_LOCAL_MODIFIED` with identical pre/post inventories and no writes. |
| **AC-4** | V-5 injects unsupported protocol, digest mismatch, malformed/unsupported/duplicate/unsafe manifests, symlink ambiguity, commit failure, and uncertain rollback. It proves stable typed codes, actionable remediation, pre-mutation refusal where applicable, and unchanged inventories. Built-package copies in `src/asset-cli.test.ts` prove nonzero protocol/integrity CLI behavior without production fault flags. |
| **AC-5** | `assets/official/soft-factory.agent.md` delegates explicit `run --issue` and doctor/list/status/attach/logs/reconcile/resume/stop/clean operations to Runner. V-7 in `src/official-assets.test.ts` checks every delegation and worktree/lock/state/process/cleanup/completion/invariant prohibition against the catalog-loaded bytes, with removal and forbidden-marker mutations. |
| **AC-6** | `assets/official/soft-factory-assessor.agent.md` requires exactly `soft-factory doctor --json`, the complete result, preserved `ready`, and explanation/remediation-only reasoning. V-8 mutation checks reject removed authority and bypass markers. `src/asset-doctor-regression.test.ts` proves canonical Doctor authority remains separate. |
| **AC-7** | Six tracked declarations under `fixtures/install/` cover clean, repeated, modified-local, incompatible, integrity-invalid, and recommended scenarios. V-2 through V-5 run required cases twice or across parameterized deterministic variants and compare results, operation traces, inode/write facts, and recursive hash inventories; transaction tests inject every recommended commit rename plus pre/post-rename and rollback uncertainty. |
| **AC-8** | V-7/V-8 machine-check both official agents and mutation failures. `src/asset-doctor-regression.test.ts` asserts the exact ordered 24 Doctor IDs, readiness conjunction, no `.agents/` RPIV fallback, and no `.agents/manifest.json` authority; existing Doctor/lifecycle suites remain green. |

## Documentation evidence

- **README/setup/usage:** `README.md` now lists all individual and recommended
  root-recipe examples, exact destinations, manifest metadata, local integrity,
  idempotency/collision/rollback behavior, and Operator/Assessor/Doctor authority.
- **Usage and operations:** `docs/phase-5-official-assets.md` documents commands,
  strict manifest v1, package/version/protocol relationships, catalog SHA-256
  trust, all-or-nothing safety, no-op/adoption/safe upgrade rules, stable error
  remediation, authority boundaries, packaging, and validation. `docs/README.md`
  indexes the guide and recommended command.
- **Packaging:** the operations guide documents the explicit `package.json`
  `files` allowlist and local `npm pack --dry-run --json` inspection; V-1 checks
  included and excluded paths.
- **Configuration:** no `.soft-factory/config.yml` option or default changed;
  the guide records the explicit no-configuration-migration rationale.
- **Migration:** the guide contains additive migration notes for pre-existing
  targets and strict manifests; there is no breaking API, data, or configuration
  migration.
- **API:** no network API or service contract exists or changed, so an API
  specification/update is not applicable; the guide records this rationale.
- **Architecture:** the accepted
  `ADR-260812-official-asset-distribution-installation.md`,
  `CORE-COMPONENT-260812-official-asset-installation-contract.md`, and decision
  log define the implemented contract. No architecture divergence occurred and
  no return to Plan was required.
- **Deployment/runbook:** the Phase 5 guide states the short-lived local CLI,
  no-network/no-subprocess install boundary and absence of daemon, server,
  webhook, container, or long-running deployment.
- **Executable docs proof:** `src/documentation.test.ts` asserts all commands,
  destinations, metadata fields, safety/error semantics, authority boundaries,
  package/deployment statements, root validation recipes, docs index, README,
  and cumulative Phase 5 help.

## Focused validation

Focused validation ran after each task. Final focused evidence:

- `just verify-focused` — passed; 18 suites, 213 tests, `git diff --check` clean.
- `harness checks --focused --json` — status `ok`, scope `focused`, delegated
  command `just verify-focused`, exit code 0; 18 suites and 213 tests passed.
- Earlier focused failures were repaired before task completion: the cumulative
  help phase assertion and line-wrap-sensitive documentation assertions were
  updated, then both direct and harness-focused gates passed.

## Full validation

- `just verify` — passed after repairing the lint and formatting findings it
  exposed; ESLint, Prettier check, strict TypeScript, Jest coverage, build, and
  `git diff --check` all succeeded. 18 suites and 213 tests passed. Global
  coverage: statements 87.91%, branches 82.96%, functions 93.35%, lines 89.60%.
- `harness checks --json` — status `ok`, scope `full`, delegated command
  `just verify`, exit code 0 with the same 18 suites, 213 tests, coverage gate,
  build, and diff hygiene.

## Harness friction and drain proof

All pre-verification RPIV buffers were inspected with successful JSON envelopes:

- `rpiv`: 0 pending observations; deterministic no-record inspection evidence.
- `rpiv-research`: 3 observations persisted and read back in
  `.harness/records/retro/2026-08-12/008-issue-7-rpiv-research.md`, then clear
  returned status `ok`, exit 0, `cleared: 3`.
- `rpiv-planner`: 2 observations persisted and read back in
  `.harness/records/retro/2026-08-12/007-issue-7-rpiv-planner.md`, then clear
  returned status `ok`, exit 0, `cleared: 2`.
- `rpiv-implementer`: 8 observations persisted and read back in
  `.harness/records/retro/2026-08-12/008-issue-7-rpiv-implementer.md`, then clear
  returned status `ok`, exit 0, `cleared: 8`.

Read-back checks required schema version 1.2, matching agent and plan ID,
`disposition: kept` for every entry, and every pending fingerprint. Final JSON
inspections returned empty observation arrays for all four agents. The three
tracked retro records are included with the implementation.
