# CORE-COMPONENT-260812-repository-doctor-contract: Repository Doctor Contract

## Status

Adopted

## Purpose

Define the reusable cross-cutting contract for complete, deterministic, safe repository-readiness diagnostics shared by command parsing, domain policy, adapters, rendering, fixtures, and operator documentation.

## Scope

This component applies only to `soft-factory doctor [--json]`, Doctor configuration and RPIV metadata, repository and runtime-state observations, output, exit behavior, fixtures, and timing. It does not select or inspect issues, authorize run mutations, or replace the ambient engineering-harness Doctor.

## Definition

### Rules
- Emit exactly these stable blocking checks in this order: `repository.git-membership`, `repository.primary-worktree`, `repository.git-common-directory`, `repository.github-identity`, `repository.default-branch`, `command.git`, `command.gh`, `command.tmux`, `command.node`, `command.copilot`, `authentication.github-cli`, `authentication.copilot-cli`, `compatibility.rpiv-agent`, `compatibility.runner-protocol`, `compatibility.configuration`, `compatibility.worktree-root`, `compatibility.state-root-writable`, `compatibility.trees-ignored`, `compatibility.runtime-state-ignored`, `compatibility.result-contract`, `runtime.trees-ownership`, `runtime.state-readable`, `runtime.locks-interpretable`, and `runtime.required-paths-creatable`.
- Represent every check as `passed` or `failed` with `blocking: true`. Never omit a check because another check failed; dependency-blocked or ambiguous observations become failed entries with concrete safe remediation.
- Derive human and JSON forms from one `DoctorResultV1`. Set `ready` only when every blocking check passes. Human output prints every ID, outcome, blocking meaning, and failure details, then exactly `STATUS: READY` or `STATUS: NOT READY`.
- Emit JSON schema version 1 with top-level `schemaVersion`, `ready`, `repository.github`, `repository.defaultBranch`, and ordered `checks`. Each entry contains `id`, `status`, and `blocking`; each failure also contains nonempty `message` and `remediation`. Unknown repository fields are `null`, never invented.
- Exit 0 for READY, 3 for a complete NOT READY report, and 2 for invalid syntax. A failed prerequisite is report data, not a fail-fast CLI error.
- Resolve command presence directly from PATH without a shell. Check GitHub authentication with bounded redacted `gh auth status` for the discovered host and Copilot usability with bounded redacted `copilot --version`; presence and usability remain separate checks.
- Require `.soft-factory/config.yml` to parse strictly with `protocol_version: 1`, repository-relative `repository.worktree_root`, and repository-relative `repository.state_root`; default roots are `.trees` and `.soft-factory`. Reject unknown keys, unsupported protocol versions, absolute paths, traversal, overlap, file collisions, and symlink escape.
- Require `.github/agents/rpiv.agent.md` frontmatter to identify RPIV and declare `runner_protocol: 1` plus `result_contract: agent-result-v1`. Keep agent existence, protocol compatibility, and result-contract availability as separate checks.
- Prove `.trees/` and the complete configured state root ignored using representative descendant paths and shell-free `git check-ignore --no-index`; do not accept a parent assumption without Git evidence.
- Validate state readability with existing strict schema parsers for recognized snapshots, events, owner locks, and slot leases. Ignore unrelated filenames. Fail malformed or unsupported recognized files and preserve all bytes.
- Classify numeric `.trees/<issue>` directories and registered issue worktrees as safe only when path, Git registration where applicable, snapshot, and owner-lock identities agree. Unknown, malformed, mismatched, or incomplete ownership fails without modification.
- Probe state writability and required path creation only with exclusive randomized resources under validated repository-contained ancestors. Remove only exact resources created by the probe, report cleanup failure as failure, and never create or alter issue locks, snapshots, events, leases, logs, worktrees, branches, or configuration.
- Use typed shell-free adapters, redacted outputs, one attempt per observation, at most 2 seconds per external call, safe concurrency for independent probes, and a 9-second aggregate deadline. Preserve all 24 entries even when probes time out.
- Keep Doctor repository-scoped. It must not call issue APIs, parse issue acceptance criteria, inspect backlog priority, queue work, or assess implementation readiness.

### Interfaces
- `DoctorCheckId` is the closed ordered 24-ID vocabulary above.
- `DoctorCheckResultV1` contains `id`, `status`, `blocking`, and failure-only `message` plus `remediation`.
- `DoctorResultV1` contains schema version 1, readiness, nullable GitHub/default-branch facts, and the complete ordered checks array.
- Doctor ports expose bounded command resolution/execution, Git discovery/default/ignore/worktree facts, strict state inventory, RPIV metadata, and reversible filesystem probes.

### Expectations
- Ready and blocked fixtures declare the expected result for every check before invocation.
- The fixture matrix produces at least one passing and one failing outcome for each of the 24 IDs and verifies no issue-port call or owned-resource mutation.
- Human and JSON rendering preserve identical IDs, statuses, blocking values, readiness, repository facts, messages, and remediations.
- A controlled ready fixture exits the built CLI in at most 10 seconds wall-clock time.

## Rationale

Doctor spans command, Git, filesystem, authentication, compatibility, state, rendering, and test boundaries. A closed ordered result contract prevents drift, fail-fast omissions, accidental issue behavior, unsafe probes, and disagreement between human and machine output. Explicit metadata and conservative path rules turn previously implicit compatibility assumptions into reviewable evidence.

## Usage Examples

```
soft-factory doctor
soft-factory doctor --json

{"schemaVersion":1,"ready":false,"repository":{"github":null,"defaultBranch":null},"checks":[{"id":"repository.git-membership","status":"failed","blocking":true,"message":"Current path is not in a Git repository.","remediation":"Run Doctor from the target repository worktree."}]}
```

## Integration Guidelines

- Keep check policy and dependency completion in a pure Doctor service; adapters return typed observations rather than rendered prose.
- Reuse strict configuration and state parsers while adding non-mutating inventory entry points.
- Centralize the ordered check definitions so renderers and fixtures cannot define divergent check sets.
- Add a dedicated Doctor operations guide and update README, docs index, help text, configuration, RPIV metadata, and documentation assertions.
- Validate with root `just verify-focused` and `just verify`, then their `harness checks --focused --json` and `harness checks --json` delegates.

## Exceptions

- None. Missing or ambiguous proof never degrades to ready, and Doctor never selects an issue.

## Enforcement

- [x] Automated checks
- [x] Code review checklist
- [x] Test coverage requirements

## Related ADRs

- [ADR-260812-repository-doctor-readiness](../ADR/ADR-260812-repository-doctor-readiness.md)
- [ADR-260810-typescript-node-cli](../ADR/ADR-260810-typescript-node-cli.md)
