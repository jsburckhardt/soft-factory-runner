# CORE-COMPONENT-260810-error-handling: Error Handling

## Status

Adopted

## Purpose

Make operational failures explicit, classifiable, actionable, and safe for both humans and automated callers.

## Scope

CLI commands, state transitions, adapters, validation, reconciliation, persistence, and cleanup.

## Definition

### Rules
- Expected failures MUST use typed error categories with stable machine-readable codes.
- Errors MUST preserve their cause and include actionable context without exposing secrets.
- Ambiguous ownership, state, or filesystem conditions MUST fail safe.
- Errors MUST map to explicit non-zero CLI results and appropriate terminal run states.
- Catch blocks MUST either add meaningful context and rethrow or convert at an owned boundary; failures MUST NOT be swallowed.

### Interfaces
- Domain errors expose a stable code, safe message, optional cause, and structured details.
- The CLI boundary renders errors for humans or JSON consumers.

### Expectations
- Callers can distinguish failed, blocked, cancelled, and interrupted outcomes.
- Cleanup and reconciliation never present uncertainty as success.

## Rationale

Runner controls destructive-capable resources. Explicit errors prevent false completion and unsafe recovery behavior.

## Usage Examples

```text
WORKTREE_OWNERSHIP_AMBIGUOUS: Refusing cleanup because the recorded worktree does not match the observed registration.
```

## Integration Guidelines

- Define error codes alongside the owning domain.
- Keep low-level stderr available as redacted diagnostic detail.
- Test error-to-exit-code and error-to-state mappings.

## Exceptions

- Programmer invariant violations may terminate immediately after preserving safe diagnostic context.

## Enforcement

- [x] Automated checks
- [x] Code review checklist
- [x] Test coverage requirements

## Related ADRs

- [ADR-260810-typescript-node-cli](../ADR/ADR-260810-typescript-node-cli.md)

