# CORE-COMPONENT-260811-issue-run-orchestration: Issue Run Orchestration

## Status

Adopted

## Purpose

Define the reusable deterministic contract that turns a validated GitHub issue into one safely owned, visible Phase 1 RPIV run while preserving proof across Git, persistence, tmux, status, attach, and tests.

## Scope

This component applies to `run`, `status`, `attach`, the internal RPIV worker, repository and issue readiness, fetched-base proof, branch/worktree preparation, run snapshots/events, tmux/Copilot launch, repository identity, and orchestration fixtures. It does not define completion reconciliation, restart recovery, resume, stop, cleanup, or multi-issue scheduling.

## Definition

### Rules
- Validate CLI issue syntax, repository identity and capabilities, issue existence, issue state, readiness metadata, acceptance criteria, blockers, and conflicting pull requests before creating locks, state directories, branches, worktrees, tmux resources, or Copilot processes.
- Require exactly one marker-wrapped acceptance-criteria block containing at least one criterion checkbox; reject missing, duplicate, malformed, or empty blocks actionably.
- Treat an issue as blocked when it has an open GitHub blocked-by relationship or a case-insensitive `blocked` label. Treat an open pull request as conflicting when it closes the issue or uses the planned issue branch. Query all required bounded pages and fail blocked when GitHub proof is incomplete, times out, or is ambiguous.
- Derive the branch type from exactly one configured issue-label mapping to an allowed Conventional Commit type. Provide a standard `feature` to `feat` mapping; reject absent or conflicting mappings instead of inferring intent from prose.
- Read optional Runner fields from `.soft-factory/config.yml` as `repository.remote` and `repository.base_branch`. Resolve the configured remote in this order: `repository.remote`, Git `remote.pushDefault`, current-branch remote, then an unambiguous sole remote. Reject a missing or ambiguous remote.
- Fetch the resolved remote before branch or worktree creation. After fetch, resolve the advertised remote HEAD branch and SHA, require an explicitly configured base branch to agree with that advertised branch, and require the fetched remote-tracking ref SHA to equal the advertised SHA.
- Persist fetched-base proof with remote name, default branch, advertised HEAD SHA, fetched tracking-ref SHA, fetch completion timestamp, and equality result before creating the branch. Create the branch from the proven commit SHA, never from a local branch name.
- Acquire ownership atomically after read-only readiness validation and before state, branch, worktree, tmux, or worker resources. Use an exclusive `.soft-factory/locks/<issue>.lock` owner record and permit exactly one winner under concurrent starts.
- Create or reuse a branch, worktree, window, or path only when the current lock, persisted run owner, and observed resource identity all agree. Otherwise block and preserve the resource. A matching `.trees/<issue>` path alone never proves ownership.
- Persist a schema-versioned atomic snapshot and append schema-versioned lifecycle events for every persisted transition. The snapshot includes owner/run IDs, repository identity, issue, state, branch type/name, worktree, tmux identities, Copilot launch facts, and fetched-base proof.
- Limit Prototype 1 states to preparation states, `running_rpiv`, and safe `failed`, `blocked`, or `interrupted` outcomes. Record Copilot exit zero as `interrupted` pending later completion proof and non-zero exit as `failed`; never report `completed` in this phase.
- Build the tmux issue window rooted at the isolated worktree and launch the internal worker there so RPIV output remains visible. The worker launches Copilot with argument arrays including exact `--name issue-<number>`, `--agent rpiv`, and the configured prompt.
- Compose every Copilot child environment under `CORE-COMPONENT-260812-copilot-child-environment-contract`, with Runner-generated `OTEL_RESOURCE_ATTRIBUTES=project.name=<normalized-project>,issue.id=issue-<number>` applied last. Normalize owner/repository by lowercasing, replacing each non-alphanumeric run with one hyphen, and trimming hyphens.
- Have `status <issue>` return persisted state and separately bounded observed tmux facts. Have `attach <issue>` accept only the issue number, load the owned snapshot, verify the recorded window still matches observation, and attach by recorded session/window identity; ambiguity blocks.
- Bound each GitHub or tmux readiness/observation call to 15 seconds, each fetch or remote-HEAD call to 30 seconds, and GitHub list traversal to 10 pages of 100 records. Timeout, truncation, malformed output, or incomplete proof produces a stable actionable typed failure.
- Compose orchestration through typed Git, GitHub, tmux, process, filesystem, clock, and ID interfaces. Tests may inject deterministic adapters only through application composition, never through production environment backdoors.
- Make the end-to-end fixture provide external facts and capture the complete operation trace from issue validation through visible RPIV launch. Runner must not choose an implementation approach, edit code, or interpret RPIV prose.

### Interfaces
- `RunIssueInput` carries an explicit positive issue number and repository start path.
- `RunSnapshotV1` carries state, owner/run identity, owned resources, `FetchedBaseProofV1`, and launch facts.
- `FetchedBaseProofV1` carries `remote`, `defaultBranch`, `advertisedHeadSha`, `trackingRefSha`, `fetchedAt`, and `matches`.
- Repository, GitHub, Git, tmux, subprocess, filesystem, clock, and ID ports return typed structured facts or stable domain errors.
- Human and JSON renderers consume the same status and error facts.

### Expectations
- Invalid readiness causes zero owned-resource operations; an unproved base causes zero branch/worktree operations.
- One valid start yields one lock, branch, worktree, run snapshot, tmux issue window, and RPIV launch.
- Two simultaneous starts yield one owner and one actionable ownership conflict.
- Command traces and persisted records are sufficient to prove ordering, exact ancestry, cwd, names, environment, and ownership.

## Rationale

The orchestration spans several powerful external tools, so correctness depends on one explicit sequence and shared identities rather than command prose. Structured proof and injectable ports satisfy existing locking, subprocess, persistence, event, and error contracts while keeping Phase 1 finite.

## Usage Examples

```
feature label -> feat/3-phase-1-run-one-issue -> proven remote SHA -> .trees/3
repository jsburckhardt/soft-factory-runner -> project jsburckhardt-soft-factory-runner
copilot --name issue-3 --agent rpiv ...
```

## Integration Guidelines

- Keep orchestration policy in domain services and external command construction/parsing in adapters.
- Persist proof before consuming it to create an owned resource.
- Render status and errors from typed facts rather than parsing terminal prose.
- Use temporary repository roots in fixtures so ambient RPIV worktrees cannot collide with test resources.
- Extend completion or recovery behavior only through a later Plan-stage architecture update.

## Exceptions

- None for Phase 1. Unknown ownership, remote state, readiness, or observation always blocks safely.

## Enforcement

- [x] Automated checks
- [x] Code review checklist
- [x] Test coverage requirements

## Related ADRs

- [ADR-260811-prototype-one-run-orchestration](../ADR/ADR-260811-prototype-one-run-orchestration.md)
- [ADR-260810-typescript-node-cli](../ADR/ADR-260810-typescript-node-cli.md)
- [ADR-260812-copilot-child-environment](../ADR/ADR-260812-copilot-child-environment.md)
