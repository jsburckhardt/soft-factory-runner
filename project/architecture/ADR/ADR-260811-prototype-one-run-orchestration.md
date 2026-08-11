# ADR-260811-prototype-one-run-orchestration: Prototype One Issue Run Orchestration

## Status

Accepted

## Context

Prototype 1 must turn one explicit GitHub issue into an exclusively owned branch, worktree, visible tmux window, and RPIV process. Existing contracts establish strict TypeScript, typed subprocesses, atomic ownership, persistence, events, and safe ambiguity handling, but they do not settle the fetched-base proof, repository identity, readiness bounds, collision with an unknown existing `.trees/<issue>` worktree, or the depth of Phase 1 state. Those choices must be deterministic and testable without letting Runner make software implementation decisions.

## Decision

Adopt a layered command/domain/adapter design governed by `CORE-COMPONENT-260811-issue-run-orchestration`. The command layer parses `run`, `status`, `attach`, and the internal worker command; a deterministic orchestration service owns sequencing and state; typed adapters isolate Git, GitHub, tmux, Copilot, filesystem, clock, and ID generation.

For `run`, complete read-only repository and issue readiness checks first, then acquire atomic issue ownership, fetch and prove the remote default tip, persist that proof, and only then create the typed branch and worktree. Treat an existing branch, worktree, tmux window, or path as unusable unless recorded and observed ownership agree. In particular, the outer RPIV worktree at `.trees/3` is unknown to Runner when no matching Runner lock and snapshot exist, so Runner must block without modifying it; deterministic fixtures use a temporary repository root.

Resolve the remote from explicit Runner configuration, Git remote configuration, or an unambiguous sole remote. Discover the advertised default branch after fetch and require any configured base branch to agree. A fetched-base proof records remote, branch, advertised HEAD SHA, fetched tracking-ref SHA, fetch completion time, and equality; branch creation uses the proven SHA directly.

Use the owner-qualified GitHub repository identity as the source identity. Normalize it for telemetry and tmux by lowercasing, replacing each run of non-alphanumeric characters with one hyphen, and trimming hyphens. Thus `jsburckhardt/soft-factory-runner` becomes `jsburckhardt-soft-factory-runner`. Derive the branch type only from one unambiguous configured issue-label mapping to an allowed Conventional Commit type; the standard `feature` mapping selects `feat` for Issue #3.

Bound Phase 1 to snapshots, required append-only transition events, worker exit capture, `status`, and `attach`. A zero Copilot exit is recorded as `interrupted` pending the completion-proof protocol in Prototype 2; non-zero exit is `failed`. Do not implement result-artifact completion, restart recovery, resume, stop, cleanup, PR reconciliation after launch, multiple-issue scheduling, or automatic stale-resource recovery in this phase.

Use dependency-injected production adapters and a deterministic end-to-end fixture composition. The fixture supplies repository and issue facts and captures external operations; Runner chooses only operational transitions, resource names, and commands, while RPIV remains responsible for implementation choices.

## Alternatives

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Start from the local default branch | Simple Git commands | Can create work from stale state | Violates fetched-base proof requirements |
| Reuse matching `.trees/<issue>` paths by name | Convenient in the current checkout | Path names do not establish ownership | Violates fail-safe ownership contracts |
| Infer branch type from issue prose | No readiness metadata needed | Makes a semantic implementation choice inside Runner | Runner must remain deterministic and non-agentic |
| Run live GitHub, tmux, and Copilot in end-to-end tests | High fidelity | Nondeterministic, credentialed, and destructive | Repository tests require safe repeatable evidence |
| Implement full recovery and completion now | Richer lifecycle | Expands beyond Prototype 1 | Deferred to later prototypes by the PRD |

## Consequences

### Positive
- Branch ancestry has durable, reproducible fetched-remote proof.
- Unknown outer worktrees and ambiguous runtime resources are preserved safely.
- Telemetry, tmux, status, and attach share one deterministic repository identity.
- Core orchestration is testable without live GitHub, tmux, or Copilot.

### Negative
- Issue metadata and repository remote configuration must be unambiguous before a run can start.
- A successful RPIV process does not produce a completed Runner state in Phase 1.
- Existing resources block Prototype 1 rather than being recovered automatically.

### Neutral
- The current development checkout is implementation context, not a reusable Runner-owned worktree.
- Later prototypes may extend state and reconciliation without changing Phase 1 ownership rules.

## Related Issues

- [#3](https://github.com/jsburckhardt/soft-factory-runner/issues/3)

## References

- [Soft Factory Runner PRD](../../../PRD.md)
- [Issue and Worktree Locking](../core-components/CORE-COMPONENT-260810-issue-worktree-locking.md)
- [Prototype One Issue Run Orchestration](../core-components/CORE-COMPONENT-260811-issue-run-orchestration.md)
