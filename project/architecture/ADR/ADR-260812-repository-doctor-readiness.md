# ADR-260812-repository-doctor-readiness: Repository Doctor Readiness Architecture

## Status

Accepted

## Context

Issue #6 requires one repository-scoped Doctor command to report every PRD Section 19 prerequisite without fail-fast information loss. Existing run readiness discovers only the facts needed to start an explicit issue and uses longer, sequential bounds. The product has no Doctor result model, protocol authority, complete configuration paths, blocking table, or exit behavior. These choices must remain deterministic, safe around owned resources, and independent of issue selection and the ambient engineering harness.

## Decision

Add `soft-factory doctor [--json]` as a repository-scoped command backed by a deterministic Doctor service and typed adapters. The service evaluates all 24 Section 19 checks, identified by the stable IDs defined in `CORE-COMPONENT-260812-repository-doctor-contract`. Every check is blocking because each names a prerequisite for safely running Soft Factory. A check that is unavailable, malformed, contradictory, timed out, or otherwise ambiguous fails rather than being omitted or inferred as safe.

Adopt Runner protocol version 1. `.soft-factory/config.yml` must expose `protocol_version: 1`; unsupported or absent protocol data fails its dedicated check. The installed RPIV asset authority is `.github/agents/rpiv.agent.md`, whose frontmatter must declare `runner_protocol: 1` and `result_contract: agent-result-v1`. The RPIV-agent, Runner-protocol, and result-contract checks remain separate. Do not search fallback `.agents/` locations or infer compatibility from prose.

Extend repository configuration with `repository.worktree_root` and `repository.state_root`, defaulting to `.trees` and `.soft-factory`. Both must be normalized repository-relative paths contained by the primary worktree, distinct from each other and from the Git common directory, and free of symlink escape or file collisions. Doctor validates ignore coverage with `git check-ignore --no-index` against representative descendants. It validates writability and required-path creation with exclusive, tokenized, reversible probes, removing only probe resources that it created; it never creates issue state, selects an issue, acquires ownership, or mutates recognized Runner records.

Inspect recognized snapshots, events, owner locks, slot leases, logs, and result-contract paths according to their existing versioned parsers. Ignore unrelated filenames, but fail malformed recognized records. Treat every numeric `.trees/<issue>` path or registered issue worktree without matching interpretable snapshot and lock ownership as a blocking conflict. Human and JSON output derive from one `DoctorResultV1`; failed checks carry actionable message and remediation. READY exits 0, NOT READY exits 3, and invalid Doctor syntax exits 2.

Use shell-free executable/argument arrays and redacted structured results. Run independent probes concurrently where safe, perform no hidden retry or polling, cap each external probe at 2 seconds, and enforce a 9-second aggregate Doctor deadline so controlled ready-fixture process execution can exit within 10 seconds. Timeout is a failed check and does not suppress the remaining check entries.

## Alternatives

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Reuse fail-fast run readiness | Less new code | Omits checks after the first failure and couples Doctor to issue execution | Cannot report the complete Section 19 check set |
| Treat some checks as informational | More repositories may appear ready | No source identifies an optional prerequisite | Readiness must fail safe, so all named prerequisites block |
| Infer protocol and result support from agent prose | No asset metadata changes | Unstable and not machine-verifiable | Explicit versioned metadata is deterministic |
| Search `.agents/` and `.github/agents/` | Supports multiple layouts | Makes installation authority ambiguous | This repository installs RPIV at one known path |
| Invoke shell scripts or the ambient harness | Easy command discovery | Adds injection risk and a non-product runtime dependency | Existing subprocess and harness boundaries prohibit it |
| Use 15-30 second sequential probe bounds | Reuses current constants | Cannot prove the required 10-second controlled fixture | Doctor needs its own aggregate budget |

## Consequences

### Positive
- One complete typed result is authoritative for human and automation callers.
- Protocol, asset, path, ownership, and state ambiguity block with exact remediation.
- Controlled adapters can prove every check in both pass and fail states within the timing bound.

### Negative
- RPIV metadata and repository configuration gain mandatory compatibility fields.
- Doctor needs dedicated filesystem, executable, ignore, authentication, and usability observations.
- The 2-second probe budget may expose slow local authentication tooling as NOT READY.

### Neutral
- Existing issue execution and completion contracts remain unchanged.
- The ambient `harness doctor` remains a separate development-surface diagnostic.

## Related Issues

- [#6](https://github.com/jsburckhardt/soft-factory-runner/issues/6)

## References

- [Soft Factory Runner PRD](../../../PRD.md)
- [TypeScript and Node.js CLI](ADR-260810-typescript-node-cli.md)
- [Prototype Three Recovery and Explicit Concurrency](ADR-260811-prototype-three-recovery-concurrency.md)
- [Repository Doctor Contract](../core-components/CORE-COMPONENT-260812-repository-doctor-contract.md)
