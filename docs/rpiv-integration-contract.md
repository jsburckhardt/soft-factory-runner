# RPIV integration, progress, and completion handoff

## Contract discovery and command grammar

Run the short-lived CLI from the repository root:

```text
just run instructions
just run instructions --json
```

Only `soft-factory instructions [--json]` is accepted. Extra arguments and options return `CLI_INVALID` with exit 2. Human and JSON forms are deterministic renderings of one `IntegrationContractV1` schema version 1. The command reads only the repository root `justfile` and `.soft-factory/config.yml`; it creates no lock, lease, run state, worktree, process, or other ownership resource. Canonical and installed agents must discover this contract from Runner instead of duplicating an operational path.

## One snapshotted final validation

The optional configuration key is `rpiv.final_validation`:

```yaml
rpiv:
  prompt: "Deliver issue #{issue}"
  final_validation: just verify
```

When absent, the value is exactly `just verify`. An explicit value must match one argument-free `just <recipe>`, where the recipe matches `[A-Za-z][A-Za-z0-9_-]*` and is declared by the root `justfile`. A missing root `justfile` prevents declaration proof for both the default and a configured recipe. Missing declaration proof, empty values, mappings, extra whitespace or arguments, shell-shaped text, non-string values, undeclared recipes, and `just verify-focused` return value-free `CONFIG_INVALID` before lock, lease, snapshot, or owned-resource creation.

Each new `RunSnapshotV5` preserves the v4 binding and stores exactly one `requiredFinalValidation`. Runner injects the same immutable command into `IntegrationLaunchV1`; execution, recovery, and completion use that persisted value even when the current `rpiv.final_validation` is changed, empty, malformed, focused, or undeclared; those paths do not validate or adopt the current value for that run. A later new run snapshots the then-current valid value. Supported v1-v3 snapshots deterministically normalize to sole `just verify` and never consult later configuration. A completed v2/v3 snapshot may contain the exact historical AgentResult shape without `requiredFinalValidation`; Runner accepts that shape only at the version-aware legacy persistence/recovery boundary, requires its one `just verify` validation to have passed, and deterministically derives the v4 binding before explicit v5 normalization. Any legacy focused-validation entry remains supplementary only. Current AgentResultV1 publication and v4/v5 snapshot parsing still require the strict new shape; malformed, unsupported, or non-passing legacy results remain non-authorizing. A v1 record still cannot complete without a supported migration proving its absent acceptance set.

`just verify-focused` remains useful implementation feedback. Its absence, pass, failure, duplication, or appearance as supplementary `validations[]` diagnostics never changes completion. The root `justfile` remains command authority.

## Injected launch and ownership

Every new or resumed attempt receives an `IntegrationLaunchV1` containing run ID, attempt, issue, branch, exact owned paths, the snapshotted final validation, and Runner helper invocations. V4 persistence strictly cross-checks launch run ID, attempt, issue, branch, both exact worktree artifact paths, and final validation against the containing snapshot; contradictory persistence is `STATE_INVALID`, and helpers perform no action at forged paths. RPIV must not read or alter Runner snapshots, events, locks, leases, process facts, recovery decisions, or cleanup facts.

Runner owns operational state and post-exit Git/GitHub reconciliation. RPIV owns phase publication, and the Verifier owns final-result publication after verification and pull-request creation. Configured Copilot environment names and values are excluded from the launch binding, instructions, progress, result, snapshots, events, status/list, helper errors, and retained Runner logs.

## Mutable RPIV progress

RPIV publishes through the injected helper to:

```text
<owned-worktree>/.soft-factory/rpiv-status.json
```

Strict `RpivStatusV1` has exactly `schemaVersion`, `runId`, `attempt`, `issueNumber`, `branch`, `sequence`, `phase`, `status`, and `updatedAt`. Phases advance `research -> plan -> implement -> verify -> terminal`. Nonterminal status is `running`; terminal status is one of `succeeded`, `failed`, `blocked`, `cancelled`, or `interrupted`. Publish each phase start and every terminal outcome. Before every nonzero return—including Research, Plan, Implement, Verify, handoff, helper, and exception paths—the coordinator attempts terminal `failed` publication, preserves the original error, and appends a redacted publication failure when that attempt also fails.

The helper derives identity and a monotonic sequence, writes a complete same-directory exclusive temporary file, syncs it, closes it, atomically replaces the mutable destination, syncs the directory, and cleans temporary bytes. Readers observe the prior or new complete document.

Progress classifications are `PROGRESS_MISSING`, `PROGRESS_EMPTY`, `PROGRESS_INVALID`, `PROGRESS_REQUIRED_FIELD_MISSING`, `PROGRESS_VERSION_UNSUPPORTED`, `PROGRESS_IDENTITY_MISMATCH`, `PROGRESS_STALE`, `PROGRESS_REGRESSED`, `PROGRESS_REPEATED`, `PROGRESS_CONFLICT`, `PROGRESS_LATE`, and `PROGRESS_VALID`. Freshness binds run, attempt, issue, branch, launch time, observation time, sequence, phase, and status; there is no elapsed-age timeout. Same-sequence equal content is repeated, same-sequence different content conflicts, lower sequence/phase/time regresses, skipped or same-phase higher-sequence updates conflict, and post-terminal/result-acceptance/completion updates are late. Only `research` (or a failed terminal outcome) may be first; each running phase must be the exact next phase, and terminal success follows Verify. The helper classifies before writing or snapshot mutation. Every repeated, regressed, conflicting, stale, late, or identity-invalid update returns its stable nonzero code and preserves the prior accepted artifact/fact. Status and list derive phase only from the usable current artifact. Missing, empty, malformed, incomplete, unsupported, identity-mismatched, stale, regressed, conflicting, or late current progress displays phase `unknown` even when the snapshot retains an earlier `lastAccepted` phase; that retained fact is comparison history, never a display fallback. A currently present byte-equivalent accepted artifact remains usable and displays its phase while classified `PROGRESS_REPEATED`.

`status` and `list` expose RPIV phase and classification separately from persisted operational state such as `running_rpiv`. They never infer phase from operational state. Every progress classification, including `PROGRESS_REPEATED` and every unusable class, remains diagnostic-only: progress cannot alter completion, activity, decision code, safe actions, cleanup eligibility, ownership, recovery, process control, or replacement of a last accepted fact or immutable result.

## Immutable AgentResultV1

Only after acceptance succeeds, the snapshotted final validation passes, a pull request is created or updated, all tracked verification summary and verifier retro commits are finalized and pushed, and that pull request is independently confirmed to point at the resulting final head, the Verifier publishes through the injected no-clobber helper to:

```text
<owned-worktree>/.soft-factory/agent-result.json
```

`AgentResultV1` schema version 1 requires issue, branch, final head SHA, pull-request number, outcome, every ordered acceptance result with evidence, supplementary unique `validations[]`, completion time, and:

```json
{
  "requiredFinalValidation": {
    "command": "just verify",
    "status": "passed",
    "evidence": ["validation transcript or durable reference"]
  }
}
```

The command must equal the run snapshot, status must be `passed`, and evidence must be nonempty and redacted. Publication and validation independently query the one open pull request for the owned branch; its number, branch, base, issue linkage, and head must match the final local head. Candidate `prNumber` is never trusted and any mismatch is rejected before destination mutation. Missing, empty, malformed, required-field-incomplete, unsupported, issue/branch/head/PR/acceptance-mismatched, or final-validation-mismatched results remain noncompleted with safe recovery semantics.

Publication syncs a same-directory exclusive temporary file and installs it with a no-clobber atomic link or equivalent primitive, then syncs the directory and removes the temporary name. It never truncates, renames over, or replaces the destination. An existing byte-equivalent valid owned result is idempotent; every other collision or write/read-back failure is nonzero and preserves existing bytes.

After Verify returns, the coordinator invokes the injected local validator. It validates strict schema, identity, acceptance, final head, PR identity, and snapshotted validation binding without state mutation. No valid final artifact means no successful RPIV exit. Runner still independently reconciles local Git, the fresh remote branch, and GitHub after exit before declaring `completed`.

## Migration, operations, API, and deployment

New runs use `RunSnapshotV5`; v1-v5 remain supported compatibility inputs under the sole-`just verify` rule above. Supported v4 snapshots normalize only through an explicit revisioned v5 transition with a null tmux diagnostic. This is an in-place read/transition migration: do not hand-edit snapshots or result files and do not purge retained evidence. Configuration changes affect only later new runs.

There is no network API, OpenAPI/Swagger contract, server, daemon, webhook, database, container migration, or remote deployment change. Runner remains a repository-local CLI, and helpers operate only on exact owned paths. npm packaging remains the deployment boundary for official assets. Operator, Assessor, and Skill remain delegates to Runner; Doctor readiness remains a separate authority.

Troubleshooting starts with `instructions --json`, then `status --json`. Preserve all ambiguous files. Correct configuration before new ownership; active and supported legacy recovery ignore the current final-validation value and retain the snapshot; republish mutable progress only through its helper; never replace an immutable result; and return nonzero from RPIV when publication or coordinator validation fails.

## Deterministic validation

`src/integration-contract.test.ts` and the orchestration, completion, reconciliation, recovery, asset, and documentation suites cover default/custom configuration, active/recovered snapshot immutability, focused-evidence forms, complete phase/classification matrices, atomic/no-clobber writes, status/list separation, result ordering, pre-exit validation, redaction, legacy compatibility, and negative controls without credentials, live services, or network access.

Use the root gates:

```text
harness checks --focused --json
just verify-focused
harness checks --json
just verify
```
