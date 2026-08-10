# CORE-COMPONENT-260810-structured-events: Structured Events

## Status

Adopted

## Purpose

Provide machine-readable, append-friendly observations of Runner lifecycle transitions without treating terminal prose as evidence.

## Scope

Run transition events, operational diagnostics, persisted JSONL event history, and human or JSON status rendering.

## Definition

### Rules
- Every lifecycle transition records a schema version, timestamp, run ID, issue number, prior state, next state, and reason.
- Event records MUST be structured before they are rendered for humans.
- Event history MUST be append-only.
- Credentials and known secret formats MUST be redacted before persistence or display.
- Human output and JSON output MUST derive from the same structured facts.

### Interfaces
- Versioned event records serialized as one JSON object per JSONL line.
- Rendering adapters consume event records without changing their meaning.

### Expectations
- Agents can consume structured output without parsing terminal prose.
- Event records distinguish persisted state from observed runtime state.

## Rationale

Structured events support deterministic recovery, diagnostics, and evidence while preserving useful human output.

## Usage Examples

```json
{"schemaVersion":1,"runId":"owner-repo-123","issueNumber":123,"from":null,"to":"validating_issue","reason":"run-created","at":"2026-08-10T02:00:00Z"}
```

## Integration Guidelines

- Define event schemas with the state model.
- Redact before serialization, not after persistence.
- Add context fields without embedding unstructured command output in core event fields.

## Exceptions

- Ephemeral developer diagnostics may be plain text when they are not persisted or used as completion evidence.

## Enforcement

- [x] Automated checks
- [x] Code review checklist
- [x] Test coverage requirements

## Related ADRs

- [ADR-260810-typescript-node-cli](../ADR/ADR-260810-typescript-node-cli.md)

