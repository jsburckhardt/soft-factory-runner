# Phase 5 official asset installation and operations

Soft Factory Runner ships a closed catalog of three official assets in the same
npm package as the short-lived CLI. Installation is local, deterministic, and
no-network: it does not fetch a remote catalog, invoke a subprocess, start a
daemon, or contact a service.

## Commands and exact layout

From the target repository root, use the root command interface:

```text
just run install agent soft-factory
just run install agent soft-factory-assessor
just run install skill soft-factory
just run install --recommended
```

Only those names and forms are valid. `install --recommended` is one
all-or-nothing batch containing the complete recommended set:

| Type | Name | Installed destination |
|---|---|---|
| agent | `soft-factory` | `.agents/agents/soft-factory.agent.md` |
| agent | `soft-factory-assessor` | `.agents/agents/soft-factory-assessor.agent.md` |
| skill | `soft-factory` | `.agents/skills/soft-factory/SKILL.md` |

The installer preserves every unrelated `.agents/` path. Each individual
command selects only its named asset but uses the same manifest, integrity,
collision, and transaction policy as the recommended batch.

## Catalog, release metadata, and integrity

The npm package includes authoritative source bytes under `assets/official/`
and a compiled immutable catalog. Each catalog entry records `type`, `name`,
package-relative `source`, fixed `destination`, asset `version`,
`runnerProtocol`, and lowercase SHA-256 `sha256`. Asset version equals the npm
package version that released the bytes (currently `0.1.0`); Runner protocol 1
is an independent compatibility contract. The catalog digest, not remote or
installed metadata, is the integrity trust source.

Before inspecting mutation eligibility, Runner reads every selected
package-local source, requires exact protocol 1, and compares its SHA-256 with
the catalog. `ASSET_PROTOCOL_INCOMPATIBLE`, `ASSET_INTEGRITY_INVALID`, and
`ASSET_CATALOG_INVALID` refuse the entire selected batch with no writes. The
remediation is to install a compatible trusted `soft-factory-runner` package;
there is no remote fallback.

`package.json` uses an explicit npm `files` allowlist for `dist/`,
`assets/official/`, `README.md`, and `docs/`. Repository state, fixtures,
source tests, project evidence, `.agents/`, `.soft-factory/`, and `.harness/`
are not published runtime assets. Validate package contents without publishing
through the root verification recipes; the package test performs
`npm pack --dry-run --json` locally.

## Strict manifest v1

Managed metadata is written last to `.agents/manifest.json` in stable catalog
order. The only accepted schema is version 1:

```json
{
  "schemaVersion": 1,
  "assets": [
    {
      "type": "agent",
      "name": "soft-factory",
      "version": "0.1.0",
      "runnerProtocol": 1,
      "destination": ".agents/agents/soft-factory.agent.md",
      "sha256": "<lowercase-64-character-sha256>"
    }
  ]
}
```

Every entry must identify one closed-catalog asset once, use its exact safe
`.agents/` destination, declare protocol 1, and carry a valid digest. Unknown
fields, unsupported schema/protocol values, duplicate identities or
destinations, unsafe paths, malformed JSON, and unstable order are rejected as
`ASSET_MANIFEST_INVALID` or `ASSET_PATH_INVALID` before mutation.

## Idempotency, collision policy, and transaction safety

Runner preflights all selected sources, manifest metadata, paths, and target
bytes before the first mutation.

- An absent target is installed.
- Existing desired bytes are never rewritten. If unmanaged, they are adopted
  by recording metadata; once manifest bytes also converge, repeat output is
  `ASSETS_UP_TO_DATE` with `Changed: no` and zero writes.
- Differing bytes are upgraded only when their current SHA-256 exactly equals
  the prior manifest digest for the same type, name, and destination. This is
  the only safe upgrade proof.
- A differing target without that exact proof is a local collision.
  `ASSET_LOCAL_MODIFIED` refuses the complete selected batch, explicitly says
  `No files changed`, and preserves all local and unrelated bytes. Move the
  local file, restore its recorded official bytes, or remove the destination
  before retrying. There is no force option.
- Symlinks, directories at file destinations, malformed ownership, integrity
  mismatch, and protocol incompatibility fail safe with actionable paths and
  remediation and no writes.

After preflight, Runner creates same-volume staged files and exact backups,
atomically replaces selected targets in catalog order, and replaces the
manifest last. A commit failure rolls back every attempted path and removes
transaction resources. `ASSET_FILESYSTEM_FAILED` means exact restoration was
proved; correct permissions or space and retry. `ASSET_ROLLBACK_UNCERTAIN`
means restoration could not be proved: stop, inspect the listed `.agents/`
paths, restore them from version control, and only then retry. Recommended
installation never intentionally leaves a partial release.

## Operator, Assessor, and Doctor authority

The official Operator delegates explicit execution to
`soft-factory run --issue <number>`, discovers integration facts with `soft-factory instructions --json`, and delegates `doctor`, `list`, `status`,
`attach`, `logs`, `reconcile`, `resume`, `stop`, and `clean` to Runner. It does
not select issues or directly create worktrees, locks, state, tmux/process
resources, cleanup, completion decisions, or invariant overrides.

The official Assessor invokes exactly `soft-factory doctor --json`, consumes
the complete result, preserves its top-level `ready` value as authoritative,
and limits its reasoning to explanation and remediation. It cannot infer READY
independently, assess issues, or bypass failed or incomplete Doctor output.

Installation does not change Doctor. Product Doctor still emits exactly the
canonical 24 ordered blocking checks and reads only
`.github/agents/rpiv.agent.md` as RPIV authority. It does not inspect or fall
back to official `.agents/` assets or `.agents/manifest.json`.

## Migration, configuration, API, and deployment

Official-asset installation itself changes no configuration default. Runner now also supports `rpiv.final_validation` for issue runs; installed agents discover that separate contract through `soft-factory instructions --json`.
Existing repositories need no configuration migration. Repositories that
already have target files should commit or back them up before installation;
Runner adopts identical bytes but refuses differing bytes without exact prior
manifest proof. A pre-existing `.agents/manifest.json` must match strict schema
v1; repair or restore malformed metadata rather than deleting ownership proof
blindly.

The RPIV integration addition changes local CLI, configuration, and RunSnapshotV4 only. There is no network API contract, API specification, API migration, server,
container, webhook, or long-running deployment. Installation is a local,
short-lived CLI invocation and exits after a committed result or actionable
refusal. npm packaging is the only asset distribution boundary.

## Validation and troubleshooting

```text
just verify-focused
just verify
harness checks --focused --json
harness checks --json
```

Root `just verify-focused` and `just verify` are authoritative. Harness checks
are structured delegates and do not replace direct RPIV boundary validation.
For a refusal, retain the stable code, destination, `No files changed` claim,
and remediation; never expose or paste local asset bytes as diagnostics.

The Operator, Assessor, and Skill remain interfaces to Runner, not a competing control path. Their packaged bytes direct RPIV integration discovery to `soft-factory instructions --json`; catalog SHA-256 digests and package/install tests bind the updated bytes.
