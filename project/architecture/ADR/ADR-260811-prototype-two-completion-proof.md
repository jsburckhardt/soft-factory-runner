# ADR-260811-prototype-two-completion-proof: Prototype Two Completion Proof

## Status

Accepted

## Context

Prototype 1 deliberately maps a zero Copilot exit to `interrupted` because Runner cannot independently prove RPIV completion. Issue #4 requires Prototype 2 to consume a structured RPIV handoff, reconcile it with fresh Git and GitHub observations, persist the decision, and expose the complete terminal vocabulary. The result schema, required acceptance and validation sets, compatibility with Phase 1 snapshots, failure classifications, and observation bounds must be settled before implementation.

## Decision

Extend the existing layered command/domain/adapter architecture with a deterministic finalization service governed by `CORE-COMPONENT-260811-completion-evidence-reconciliation`. After Copilot exits zero, transition to `finalizing`, load and strictly validate `.soft-factory/agent-result.json` schema version 1, then compare it with the owned run, fresh local and remote Git facts, and one complete open pull-request observation. Transition to `completed` only when every required comparison succeeds.

Derive required acceptance IDs positionally from the issue's ordered marker-wrapped checkbox list (`AC-1` through `AC-n`) captured at readiness. Require successful result entries for every derived ID. Use the root command authority as the required validation set: `just verify-focused` and `just verify` must each appear once as passed validation entries. Harness checks remain an independent development and RPIV boundary, not product completion evidence.

Treat absent or malformed result data and incomplete external observations as `interrupted`; treat a valid but unsuccessful result, contradictory identity/evidence, or failed validation as `failed`; preserve readiness and ownership conflicts as `blocked`. Add `cancelled` as a persisted and rendered terminal state reserved for an explicit operator-cancellation signal; stop/control behavior remains deferred to Prototype 3. A nonzero Copilot exit remains `failed` and cannot be overridden by an artifact.

Introduce snapshot schema version 2 for the required acceptance set and finalization/result/reconciliation facts. Continue to read valid Phase 1 version 1 snapshots as legacy snapshots; they cannot become `completed` without a version 2 finalization transition. Append each transition event before atomically replacing its snapshot so an append failure cannot leave an unhistoried `completed` snapshot. Unknown schema versions remain safely rejected.

## Alternatives

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Trust Copilot exit zero or RPIV prose | Minimal integration | Permits false completion | Violates completion invariants and Issue #4 |
| Let each run declare its own required criteria and validations | Flexible | RPIV could omit inconvenient proof | Required sets must come from Runner-owned inputs |
| Make harness envelopes product completion evidence | Structured checks | Couples runtime behavior to an ambient development tool | Root `justfile` owns project commands and harness is not a product dependency |
| Retry GitHub indefinitely for eventual consistency | May hide propagation delays | Nondeterministic and can hang finalization | Bounded incomplete proof must fail safely |
| Implement stop and recovery with terminal states | Completes more of the PRD | Expands into Prototype 3 | Issue #4 requires representation, not control-plane expansion |

## Consequences

### Positive
- Completion becomes a deterministic conjunction of RPIV, Git, GitHub, acceptance, and validation proof.
- Required evidence cannot be weakened by the producer of the result artifact.
- Phase 1 snapshots remain readable without being mistaken for completed runs.

### Negative
- RPIV integration must emit the exact versioned artifact and validation command identities.
- Transient remote or GitHub incompleteness ends the attempt as interrupted rather than silently succeeding.
- Event-before-snapshot persistence may leave an event ahead of the snapshot after a snapshot write failure; later recovery must reconcile that history.

### Neutral
- Prototype 3 still owns restart recovery, resume, stop, cleanup, and merged-PR cleanup.
- Existing branch, worktree, lock, tmux, subprocess, and root-command contracts remain in force.

## Related Issues

- [#4](https://github.com/jsburckhardt/soft-factory-runner/issues/4)

## References

- [Soft Factory Runner PRD](../../../PRD.md)
- [Prototype One Issue Run Orchestration](ADR-260811-prototype-one-run-orchestration.md)
- [Completion Evidence Reconciliation](../core-components/CORE-COMPONENT-260811-completion-evidence-reconciliation.md)
