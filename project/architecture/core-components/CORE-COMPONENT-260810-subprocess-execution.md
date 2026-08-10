# CORE-COMPONENT-260810-subprocess-execution: Subprocess Execution

## Status

Adopted

## Purpose

Execute Git, GitHub CLI, tmux, Copilot, and other external commands without shell-injection risks or loss of operational evidence.

## Scope

All child processes started by Runner, including long-running RPIV workers and short-lived validation or reconciliation commands.

## Definition

### Rules
- Commands MUST use executable and argument arrays rather than shell interpolation whenever possible.
- Arguments derived from users, issues, configuration, or repository metadata MUST be validated.
- Execution results MUST capture exit status, termination signal, and redacted output needed for diagnosis.
- Cancellation MUST request graceful termination before a bounded escalation.
- Long-running process identity MUST be persisted or otherwise observable for reconciliation.
- Secrets MUST NOT be written to logs, snapshots, or events.

### Interfaces
- A subprocess adapter accepts executable, arguments, working directory, environment allowlist, and cancellation policy.
- The adapter returns a typed result or typed execution error.

### Expectations
- Core state logic can be tested with a fake subprocess adapter.
- Shell behavior does not vary command meaning unexpectedly.

## Rationale

Runner coordinates powerful local tools with partly external inputs. A single execution boundary centralizes safety, observability, and testing.

## Usage Examples

```ts
await processes.run("git", ["worktree", "list", "--porcelain"], {
  cwd: repositoryRoot,
});
```

## Integration Guidelines

- Keep command-specific parsing in the owning adapter.
- Pass only required environment variables.
- Apply timeouts only where the product contract defines a bounded operation.

## Exceptions

- A shell may be used for an unavoidable platform command only when arguments are static and the exception is documented and tested.

## Enforcement

- [x] Automated checks
- [x] Code review checklist
- [x] Test coverage requirements

## Related ADRs

- [ADR-260810-typescript-node-cli](../ADR/ADR-260810-typescript-node-cli.md)

