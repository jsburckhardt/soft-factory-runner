---
name: soft-factory
runner_protocol: 1
asset_contract: official-skill-v1
---

# Soft Factory Runner

Use the short-lived local `soft-factory` CLI as the sole operational interface.
Run `soft-factory instructions --json` to discover the Runner-owned RPIV integration contract. Run `soft-factory doctor --json` for authoritative repository readiness and use
`soft-factory run --issue <number>` only when a caller explicitly supplies the
issue. Delegate status, reconciliation, resume, stop, logs, attach, inventory,
and cleanup to their documented Runner commands. Never create a competing
worktree, lock, state, process, completion, or cleanup control path.
