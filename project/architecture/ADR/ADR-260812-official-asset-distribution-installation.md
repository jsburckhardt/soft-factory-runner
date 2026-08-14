# ADR-260812-official-asset-distribution-installation: Official Asset Distribution and Installation

## Status

Accepted

## Context

Issue #7 established a package-local catalog of three official assets installed beneath `.agents/`. Issue #27 contracts that public surface to one APS delivery agent, moves its installed bytes to the Copilot project-agent path, and retires the assessor and skill. Existing consumers can hold strict schema-v1 ownership records, exact official bytes, missing files, local modifications, both old and new agent destinations, and unrelated siblings. The package source directory can also contain non-product reference material that must remain local without becoming consumable package content.

The change crosses `.github/` agent bytes and `.agents/manifest.json` ownership state. A current-catalog-only parser would reject the very historical records needed to prove safe migration, while independent writes could strand a partial installation. The retained agent must remain an APS prompt and use Runner as the sole control plane, but its supported behavior is now one explicit issue dispatch rather than general Runner lifecycle operation.

## Decision

Ship exactly one consumable official asset: `agent:soft-factory`, sourced from `assets/official/soft-factory.agent.md`, installed at `.github/agents/soft-factory.agent.md`, versioned with the npm package, compatible with Runner protocol 1, and verified against its compiled SHA-256 digest. Keep ownership metadata at strict schema-v1 `.agents/manifest.json`. Publish the source through an exact npm file allowlist entry instead of the broad `assets/official/` directory, so assessor, skill, sibling, and reference files are excluded without deleting unrelated local files.

Expose only `soft-factory install agent soft-factory` and `soft-factory install --recommended`; both perform the same one-agent convergence and complete recognized legacy retirement. Reject the removed assessor and skill selectors as unsupported CLI syntax. Recommended installation contains only the delivery agent.

Use the repository APS VS Code adapter form for the installed Copilot project agent: a YAML tool array containing `execute/runInTerminal` and `execute/getTerminalOutput`, followed by `user-invocable: true`, `disable-model-invocation: false`, and `target: vscode`. Do not use the generic `bash` tool alias. Preserve APS section order and tag-newline rules. Before any terminal use, require exactly one canonical positive base-10 issue number and reject missing, multiple, zero, negative, signed, fractional, leading-zero, or otherwise invalid issue input. For valid input, invoke direct commands without wrappers or chaining in this order: `soft-factory instructions --json`, then `soft-factory doctor --json`, then, only when Doctor reports ready, `soft-factory run --issue <number> --json`. Stop after a failed instructions result or non-ready Doctor result, preserve the applicable structured Runner output byte-for-byte in the response, make no retry or status call, and report dispatch acceptance separately from issue completion. Completion remains `unknown` unless the returned Runner result explicitly reports it. Prohibit install and all lifecycle, resource, state, process, cleanup, and direct RPIV alternatives.

Recognize manifest ownership through a closed migration catalog containing only these identity-destination pairs: current `agent:soft-factory` at `.github/agents/soft-factory.agent.md`; legacy `agent:soft-factory` at `.agents/agents/soft-factory.agent.md`; legacy `agent:soft-factory-assessor` at `.agents/agents/soft-factory-assessor.agent.md`; and legacy `skill:soft-factory` at `.agents/skills/soft-factory/SKILL.md`. Require exact schema-v1 fields, protocol 1, a nonempty version, a lowercase 64-character digest, unique destinations, and stable migration rank in that listed order. Permit the soft-factory identity twice only for the exact old-and-current destination bridge; reject every repeated pair, repeated destination, other duplicate identity, unsupported identity or destination, unsafe path, malformed field, and contradictory record before mutation. Serialize every successful final manifest to one current entry only.

Classify all recognized paths before mutation. At the old agent, assessor, or skill destination, a valid record plus absent file retires the stale record; a valid record plus bytes matching its digest retires both record and file; matching failure refuses the complete operation. A present legacy file without its exact record is unproved and also refuses. At the current destination, absence installs desired bytes, desired bytes are adopted without rewrite, and differing bytes are upgraded only when a valid current-destination record digest matches them; every other differing destination refuses. When both agent destinations exist, both rules must pass in the same preflight. A current destination already at desired bytes may coexist with and atomically retire proved legacy assets. A current destination with older proved bytes may be upgraded in that same operation. A converged current destination with remaining proved legacy assets is a retirement-only operation.

Preserve every unrecognized file and directory. After a proved legacy file retirement, consider only its known legacy ancestor directories, deepest first, and remove each only when it is then empty. Never recursively remove a legacy directory, remove a nonempty directory, remove a directory only because a stale entry named an already absent file, or remove `.agents/`. This preserves untracked skill siblings and unrelated content.

Preflight package integrity, manifest structure, every recognized file kind and digest, path containment, parent path kinds, collisions, and the complete mutation plan before the first write. Reject symlink or other path indirection under either managed root. Apply every clean install, migration, adoption-plus-retirement, upgrade, and retirement-only plan as one rollback-protected cross-root transaction. Stage replacement bytes beside their destinations for same-volume renames, preserve exact prior bytes and existence, move proved retirements to reversible backups, remove eligible empty directories, and replace the manifest last. Faults at any create, stage, backup, rename, retirement, directory-removal, manifest, or transaction-cleanup boundary must either restore the exact pre-invocation tree or return `ASSET_ROLLBACK_UNCERTAIN` with every planned affected path and direct restore-before-retry remediation. Exact restoration returns a stable filesystem failure. All preflight refusals include `No files changed` evidence.

A successful repeat performs no writes, leaves one current manifest entry, leaves no proved obsolete official files, and creates no legacy directory. Keep the canonical Doctor check set and `.github/agents/rpiv.agent.md` authority unchanged; the delivery-agent destination does not become a Doctor fallback or readiness input.

## Alternatives

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Keep three consumable assets | Avoids migration and retirement work | Conflicts with the accepted one-agent product surface | Issue #27 explicitly retires assessor and skill |
| Move the manifest under `.github/` | Co-locates bytes and metadata | Breaks established ownership evidence and migration | The accepted manifest remains `.agents/manifest.json` |
| Parse only the new catalog | Small parser | Rejects valid historical ownership before it can be proved | Safe retirement requires a closed migration catalog |
| Delete every legacy-looking path | Rapid cleanup | Can destroy local modifications and untracked siblings | Only exact digest ownership may authorize retirement |
| Publish the whole official source directory | Simple package allowlist | Packages user reference and obsolete sources | The distributable must contain exactly one official asset |
| Keep generic `bash` and lifecycle routing in the agent | Reuses preliminary prompt behavior | Does not match repository APS Copilot tools or delivery-only scope | The project-agent contract requires qualified terminal tools and one dispatch |

## Consequences

### Positive
- Consumers receive one Copilot-discoverable delivery agent with a finite Runner-only dispatch contract.
- Historical ownership can authorize migration and retirement without authorizing unknown content removal.
- Cross-root failures have deterministic exact rollback or explicit uncertainty evidence.
- Package inspection can prove that local reference material is not distributed.

### Negative
- Manifest parsing and installation transactions must understand both current and closed legacy records.
- Cross-root compensation, reversible retirement, directory restoration, and fault injection increase implementation complexity.
- Any modified legacy official file blocks the complete convergence until the user resolves it.

### Neutral
- Asset version remains coupled to the npm package and Runner protocol remains 1.
- `.agents/manifest.json` remains schema version 1.
- Product Doctor, RPIV completion authority, network API, service, and deployment boundaries do not change.

## Related Issues

- [#7](https://github.com/jsburckhardt/soft-factory-runner/issues/7)
- [#27](https://github.com/jsburckhardt/soft-factory-runner/issues/27)

## References

- [Soft Factory Runner PRD](../../../PRD.md)
- [TypeScript and Node.js CLI](ADR-260810-typescript-node-cli.md)
- [Repository Doctor Readiness Architecture](ADR-260812-repository-doctor-readiness.md)
- [RPIV Integration and Completion Contract](ADR-260812-rpiv-integration-completion-contract.md)
- [Official Asset Installation Contract](../core-components/CORE-COMPONENT-260812-official-asset-installation-contract.md)
- [APS VS Code Copilot adapter](../../../.github/skills/agnostic-prompt-standard/platforms/vscode-copilot/adaptor.md)
