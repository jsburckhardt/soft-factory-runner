# Phase 5 official delivery-agent installation and migration

Soft Factory Runner ships exactly one consumable official asset: the APS `soft-factory` delivery agent. Installation is a local, short-lived, no-network CLI operation. It does not fetch a remote catalog, invoke a subprocess, start a daemon, or contact a service.

## Commands and current layout

Run either supported form from the target repository root:

```text
just run install agent soft-factory
just run install --recommended
```

Published-package consumers use the equivalent commands:

```text
soft-factory install agent soft-factory
soft-factory install --recommended
soft-factory run --issue <number> --json
```

Both install forms perform the same complete convergence. The sole current source is `assets/official/soft-factory.agent.md`, and trusted bytes converge to `.github/agents/soft-factory.agent.md`. Ownership remains in `.agents/manifest.json`. The removed assessor and skill selectors are unsupported CLI syntax and are mentioned below only as closed legacy migration identities.

The installed Copilot project agent requires exactly one canonical positive issue number before terminal use, runs `soft-factory instructions --json` before `soft-factory doctor --json`, dispatches only from a ready Doctor result, and then runs exactly one `soft-factory run --issue <number> --json`. It makes no retry or status query, embeds the applicable Runner output unchanged, and reports dispatch acceptance separately from ticket completion. Completion remains `unknown` unless Runner explicitly reports it. Runner remains the sole authority for worktrees, locks, state, processes, cleanup, and completion.

## Package, catalog, and integrity

The current catalog and recommended set contain only `agent:soft-factory`. Catalog metadata records `type`, `name`, package-relative `source`, fixed `destination`, package-coupled `version`, `runnerProtocol`, and lowercase SHA-256 `sha256`. Protocol 1 and the compiled digest are the integrity trust source.

`package.json` uses an explicit npm `files` allowlist for `dist/`, the exact `assets/official/soft-factory.agent.md` source, `README.md`, and `docs/`. It does not publish any other `assets/official/` path. In particular, retired sources and local comparison material such as `assets/official/theoutsideone.agent.md` are excluded without deleting local files. Inspect this boundary with `npm pack --dry-run --json` through repository validation.

Runner reads the package-local source and verifies protocol and SHA-256 before mutation. `ASSET_PROTOCOL_INCOMPATIBLE`, `ASSET_INTEGRITY_INVALID`, and `ASSET_CATALOG_INVALID` refuse with `No files changed`. Reinstall a compatible trusted package before retrying; there is no remote fallback.

### Upgrade or reinstall 0.2.1-beta.3 as stable 0.2.1

The current package and official-asset catalog version is stable **0.2.1**, promoted from 0.2.1-beta.3 with no functional or dependency changes. It includes the backward-compatible PATCH correction for checkpoint-gated cleanup retry after exact tmux target removal. Strict dead state is non-authorizing and public control output remains categorical and confidential. This repository proves a local npm tarball and does not claim registry publication; `soft-factory` has no `--version` command. From the stable 0.2.1 checkout, build and pack, then install that exact tarball over a 0.2.1-beta.3 prefix:

```text
just build
mkdir -p /tmp/soft-factory-runner-0.2.1
npm pack --json --pack-destination /tmp/soft-factory-runner-0.2.1
PREFIX="${SOFT_FACTORY_PREFIX:-$HOME/.local/soft-factory-runner}"
npm install --ignore-scripts --no-audit --no-fund --omit=dev --prefix "$PREFIX" /tmp/soft-factory-runner-0.2.1/soft-factory-runner-0.2.1.tgz
node -p "require('$PREFIX/node_modules/soft-factory-runner/package.json').version"
```

The final command must print `0.2.1`. To force a clean reinstall in the same dedicated prefix, first run `npm uninstall --prefix "$PREFIX" soft-factory-runner`, then repeat the local-tarball install. Do not use or document a nonexistent `--version` command.

After the package is installed, run the installed CLI from each target repository and inspect package-coupled ownership metadata:

```text
"$PREFIX/node_modules/.bin/soft-factory" install --recommended
node -p "require('./.agents/manifest.json').assets.map(({version}) => version).join(',')"
```

The generated manifest must contain one current `0.2.1` entry. An exact schema-v1 manifest still naming 0.2.1-beta.3 is historical ownership input only: digest-proved current bytes reconverge its metadata to 0.2.1, and a repeat returns `ASSETS_UP_TO_DATE`.

## Strict manifest schema version 1

The final manifest is always one current entry:

```json
{
  "schemaVersion": 1,
  "assets": [
    {
      "type": "agent",
      "name": "soft-factory",
      "version": "0.2.1",
      "runnerProtocol": 1,
      "destination": ".github/agents/soft-factory.agent.md",
      "sha256": "<lowercase-64-character-sha256>"
    }
  ]
}
```

Migration parsing recognizes only this closed stable-rank vocabulary:

| Rank | Identity | Destination | Final role |
|---:|---|---|---|
| 0 | `agent:soft-factory` | `.agents/agents/soft-factory.agent.md` | legacy retirement proof |
| 1 | `agent:soft-factory` | `.github/agents/soft-factory.agent.md` | sole current entry |
| 2 | `agent:soft-factory-assessor` | `.agents/agents/soft-factory-assessor.agent.md` | legacy retirement proof |
| 3 | `skill:soft-factory` | `.agents/skills/soft-factory/SKILL.md` | legacy retirement proof |

Every entry has exact fields, a nonempty version, protocol 1, and a lowercase digest. Only the exact old/current agent bridge may repeat an identity. Malformed JSON, unknown fields, unsupported schema or protocol, duplicate or contradictory ownership, unsafe paths, and unstable order return `ASSET_MANIFEST_INVALID` or `ASSET_PATH_INVALID` with `No files changed`.

## Finite migration behavior

| Observed state | Convergence outcome |
|---|---|
| Current destination absent | Install trusted bytes and current metadata. A stale current entry does not block recreation. |
| Current bytes equal desired bytes | Adopt without rewriting and normalize metadata. |
| Current bytes differ but match their recorded current digest | Upgrade to desired bytes. |
| Current bytes differ without proof | `ASSET_LOCAL_MODIFIED`; no mutation. |
| Matching old operator bytes plus its record | Install trusted current packaged bytes at the current destination and independently retire the digest-proved old owned file. |
| Old operator record but absent old file | Install current bytes and retire stale metadata without deleting a pre-existing directory. |
| Both agent destinations | Require old digest proof and require current bytes to be desired or current-digest-proved; otherwise refuse all mutation. |
| Matching historical assessor or skill | Retire the record and file in the same transaction. |
| Absent historical assessor or skill | Retire stale metadata only. |
| Modified or unproved legacy bytes | Refuse the complete operation with `ASSET_LOCAL_MODIFIED` and `No files changed`. |
| Converged current bytes plus proved obsolete assets | Perform one adoption-plus-retirement or retirement-only transaction. |
| Successful operation repeated | `ASSETS_UP_TO_DATE`, one current entry, and zero mutations. |

Only digest-proved legacy files can be removed. An untracked sibling beside historical `SKILL.md` is preserved byte-for-byte. Known legacy ancestors are considered deepest first and removed only when a file retired in that operation leaves them empty. Nonempty directories, unrelated content under `.github/` or `.agents/`, and `.agents/` itself remain unchanged. There is no force option.

## Atomic transaction and rollback

Runner preflights package bytes, the complete manifest, all recognized path kinds and digests, root containment, parent kinds, destination collisions, final manifest bytes, empty-directory eligibility, and every affected path before the first mutation. Symlink or other indirection beneath either managed root fails safe.

Mutating clean installation, migration, adoption-plus-retirement, upgrade, and retirement-only plans use same-volume staged files and reversible backups. Runner applies the current destination, retires proved legacy files, removes only eligible empty directories, and replaces the manifest last. Every create, stage, backup, rename, retirement, directory removal, manifest replacement, and cleanup boundary is rollback-protected.

`ASSET_FILESYSTEM_FAILED` means the exact pre-invocation path kinds and bytes were restored. Correct permissions or available space, then retry. `ASSET_ROLLBACK_UNCERTAIN` never claims no change: stop, inspect every listed path across `.github/` and `.agents/`, restore each path from version control or backup, and retry only after restoration is proved. Output lists bounded paths and never local file bytes.

## Doctor, API, configuration, and deployment scope

Official-agent installation does not alter the canonical 24 ordered Doctor checks. `.github/agents/rpiv.agent.md` remains the sole RPIV readiness authority; Doctor does not inspect `.github/agents/soft-factory.agent.md` or `.agents/manifest.json` as readiness input.

This contraction changes local package contents, CLI selector behavior, current destination, and schema-v1 ownership contents. It changes no Runner configuration option or default and requires no configuration migration. It introduces no network API contract or API specification, service endpoint, daemon, webhook, container, background process, or deployment change. npm remains the distribution boundary, and each install is one local short-lived CLI invocation.

## Validation and troubleshooting

```text
harness checks --focused --json
just verify-focused
harness checks --json
just verify
```

Root `just verify-focused` and `just verify` remain authoritative. Harness checks are structured delegates. For refusal evidence, retain the stable code, safe paths, `No files changed` fact when applicable, and direct remediation; never paste local asset bytes.
