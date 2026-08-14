# Issue run and Phase 2 completion proof

Runner validates and exclusively owns an explicit GitHub issue, creates its branch and worktree from a proven fetched base, launches RPIV visibly through tmux, and independently reconciles completion evidence. Phase 3 recovery, explicit concurrency, stop, logs, and cleanup extend this contract without weakening it; see [the recovery operations guide](phase-3-recovery-operations.md). Runner controls operational facts; RPIV controls software-engineering decisions.

## Prerequisites and commands

Install Node.js 22+, Git, GitHub CLI (`gh`), tmux, Copilot CLI, `just`, and the ambient engineering harness. Authenticate external tools without placing credentials in configuration, snapshots, events, result artifacts, or output.

Use the root command surface:

```text
just setup
just build
just run --help
just run run --issue <positive-integer> [--json]
just run status <positive-integer> [--json]
just run attach <positive-integer>
```

`internal run-agent` is private. Root `just verify-focused` and `just verify` are the project validation authority. Harness checks delegate to those recipes but are not product completion evidence.

## Configuration and readiness

Runner reads optional `.soft-factory/config.yml` for issue execution, while repository Doctor requires the file and protocol declaration. Configuration parsing is strict and rejects unknown scalar keys and unknown empty mapping keys at every supported mapping level; known empty mappings retain documented defaults. Existing files migrate by adding `protocol_version` and safe repository roots:

```yaml
protocol_version: 1
repository:
  remote: origin
  base_branch: main
  worktree_root: .trees
  state_root: .soft-factory
branch_types:
  feature: feat
rpiv:
  prompt: "Deliver issue #{issue}"
  final_validation: just verify
```

### Copilot-only launch environment

The only configurable child mapping is `copilot.environment`:

```yaml
copilot:
  environment:
    COPILOT_OTEL_ENABLED: "true"
    COPILOT_OTEL_EXPORTER_TYPE: "otlp"
    OTEL_EXPORTER_OTLP_ENDPOINT: "https://collector.example.invalid"
    OTEL_SERVICE_NAME: "soft-factory-rpiv"
    OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT: "false"
    OPTIONAL_EMPTY: ""
```

Environment names must match `[A-Za-z_][A-Za-z0-9_]*`; values must be string scalars, with `""` preserving an explicit empty string. Quote text that YAML would otherwise interpret as a boolean, number, or null. Runner passes each string literally through the Copilot argument-array spawn with `shell: false`, without shell evaluation, command substitution, or implicit variable expansion. The executable and argument order remain shell-free; Runner appends the redacted `IntegrationLaunchV1` binding to the RPIV prompt.

Every new or resumed launch parses the then-current file into a fresh immutable map before launch intent or spawn. Existing allowlisted inherited entries are applied first, configured entries second, and Runner-owned `OTEL_RESOURCE_ATTRIBUTES=project.name=<normalized-project-name>,issue.id=issue-<number>` last. Therefore configuration overrides inherited collisions while current-issue resource attributes always win. Absent `copilot`, absent `environment`, and an empty environment mapping all add no entries.

Strict parsing rejects duplicate/invalid names, non-string/nested values, aliases, anchors, merge keys, unsupported keys, and malformed syntax before Copilot starts. Errors expose the field and reason with no value included. A corrected later invocation is read fresh; rejected data is not cached. Configured names and values cross only `ProcessPort.spawnCopilot`: they do not alter Git, `gh`, tmux, the Runner worker, Doctor, generic commands, or ambient `process.env`, and they are absent from snapshots, events, launch intents, retained logs, and human/JSON rendering.

Existing configuration remains valid when the mapping is absent. This additive option changes no persisted schema, result contract, API, deployment model, or data; no migration is required.

Doctor requires normalized repository-relative, non-overlapping roots contained physically by the primary worktree; absolute paths, traversal, file or Git-common-directory collisions, and symlink escape fail safely. See [the Phase 4 repository Doctor guide](phase-4-repository-doctor.md).

Remote precedence is `repository.remote`, Git `remote.pushDefault`, the current branch remote, then an unambiguous sole remote. `repository.base_branch` must equal the advertised default branch. The default `feature: feat` mapping is available, and exactly one issue label must map to an allowed Conventional Commit type.

Before ownership, the issue must be open, unblocked, conflict-free, and contain exactly one `ACCEPTANCE_CRITERIA_START`/`ACCEPTANCE_CRITERIA_END` block with nonempty checkboxes. Runner assigns ordered IDs `AC-1` through `AC-n` and persists each exact criterion text. GitHub and tmux observations are bounded to 15 seconds; fetch and advertised-HEAD operations are bounded to 30 seconds.

After readiness, Runner exclusively creates `.soft-factory/locks/<issue>.lock`, fetches the selected remote, and persists `FetchedBaseProofV1` before creating `<type>/<issue>-<slug>` and `.trees/<issue>`. Existing unowned resources, including `/workspaces/soft-factory-runner/.trees/3`, are preserved and blocked with `RESOURCE_OWNERSHIP_UNKNOWN`. For Issue 3, telemetry remains `project.name=jsburckhardt-soft-factory-runner,issue.id=issue-3`.

## Strict tmux identity transport and diagnostics

Runner parses original command bytes before UTF-8 decoding. Creation accepts exactly one nonempty record with exactly two horizontal tab (`HT`, byte `09`) fields: a window ID matching `^@[0-9]+$` and a pane ID matching `^%[0-9]+$`. Observation accepts exactly one nonempty record with those IDs and a third nonempty valid UTF-8 cwd field. LF (byte `0a`) is the only record terminator and one optional final LF is permitted. CR/CRLF, invalid UTF-8 cwd, empty required fields, extra fields, multiple records, and partial identifiers are malformed or ambiguous.

For completed create failures and malformed zero-exit observations, `TmuxIdentityDiagnosticV1` retains only `phase`, exit code, original stdout/stderr byte counts, record count and up to 8 record field summaries with field counts capped at 8, truncation flags, and up to 32 value-free tokens from `window_id`, `pane_id`, `horizontal_tab`, `carriage_return`, `line_feed`, `backslash`, and `other`. It never stores raw stdout/stderr, cwd/path components, command arguments, environment or field values, issue/owner/run identifiers, hashes/byte values, or another run data. Nonzero observation remains target absence and creates no diagnostic; spawn/timeout failures retain no invented byte facts.

The latest diagnostic is replaced by a later identity failure, survives rendering and absence, and clears only after valid create/observe identity proof. Human output calls it malformed or ambiguous and gives no tmux-version recommendation.

## RPIV result artifact

After acceptance, the snapshotted final validation, final-head push, and pull-request creation, the Verifier commits and pushes the required verification summary and verifier retro records, then independently confirms that the pull request points at the resulting final head. Only after that confirmation does the Verifier publish this immutable owned path through the injected Runner helper:

```text
<owned-worktree>/.soft-factory/agent-result.json
```

The strict `AgentResultV1` schema is:

```json
{
  "schemaVersion": 1,
  "issueNumber": 4,
  "outcome": "succeeded",
  "branch": "feat/4-prove-completion",
  "headSha": "0123456789abcdef0123456789abcdef01234567",
  "prNumber": 14,
  "acceptanceCriteria": [
    { "id": "AC-1", "status": "verified", "evidence": ["test:completion"] }
  ],
  "validations": [
    { "command": "just verify-focused", "status": "passed" }
  ],
  "requiredFinalValidation": {
    "command": "just verify",
    "status": "passed",
    "evidence": ["validation transcript"]
  },
  "completedAt": "2026-08-11T12:00:00.000Z"
}
```

All fields are required. Issue and PR numbers are positive; the SHA is full hexadecimal; IDs and commands are unique and nonempty; each acceptance entry has nonempty evidence; and completion time is ISO-8601. Outcomes are `succeeded`, `failed`, `blocked`, `cancelled`, or `interrupted`. Only `succeeded` is completion-eligible.

## Finalization and false-completion protection

A nonzero Copilot exit becomes `failed` and cannot be overridden by an artifact. A zero exit first persists `finalizing`; it is never sufficient by itself. Runner then reads the owned artifact and makes one bounded fresh observation of:

- worktree `HEAD` and the selected remote issue-branch SHA from one authoritative `git ls-remote --refs <selected-remote> refs/heads/<issue-branch>` query;
- the reported pull request by number, including open state, expected base, head branch, head SHA, and closing-issue links;
- every Runner-owned required acceptance ID as `verified` with evidence;
- one passed evidence-bound `requiredFinalValidation` matching the run snapshot. Supplementary focused evidence is completion-neutral.

`completed` requires the complete conjunction: result issue and branch match the owned run; result SHA equals local HEAD, remote branch SHA, and PR head SHA; the open PR number/base/head match and closes the issue; all required acceptance and validation proof passes. Additional producer claims cannot replace a required fact.

Remote completion proof runs once after RPIV exits, from the repository root, with executable `git`, argument array `ls-remote`, `--refs`, the selected remote, and exact issue-branch ref, no shell, and a 15-second timeout. It does not fetch, poll, or retry and never reads `refs/remotes/...`; readiness `FetchedBaseProofV1.trackingRefSha` remains separate cache-based ancestry proof. Exactly one full-SHA/exact-ref record is authoritative. Zero records are missing proof. Query failure, timeout, malformed or truncated output, duplicate records, and a wrong ref are incomplete proof and persist `interrupted` with `COMPLETION_PROOF_INCOMPLETE`. One valid advertised SHA that differs from result/local/PR evidence persists `failed` with `RESULT_REMOTE_SHA_MISMATCH`.

A missing, malformed, unsupported, timed-out, or incomplete result/Git/GitHub observation becomes `interrupted`. A valid unsuccessful result maps to its named terminal. A contradictory issue, branch, SHA, PR, acceptance result, or validation becomes `failed` with a stable comparison code. No rejection path persists or renders `completed`.

## Persistence and status

Legacy runs use v1-v3 compatibility records; new runs use revisioned `RunSnapshotV5` files at `.soft-factory/runs/<issue>.json`. Every transition first appends a schema-versioned JSONL event to `.soft-factory/events/<issue>.jsonl`, then atomically replaces the snapshot. An event append failure leaves the prior snapshot; a snapshot replacement failure leaves the appended event for later recovery and never reports completion from the failed write.

Valid Phase 1 `RunSnapshotV1` files remain readable. Unknown versions are rejected, and a legacy snapshot is not completion proof or implicitly upgraded. Only an explicit proved versioned transition can carry required evidence; Supported v1-v3 inputs normalize through v4 and supported v4 inputs normalize through an explicit revisioned v5 transition; all supported inputs to sole `just verify` and never consult later configuration; malformed persistence fails safe.

The explicit terminal states are:

- `completed` — every result, Git, GitHub, acceptance, and validation comparison passed;
- `failed` — process failure, contradictory proof, failed proof, or a valid failed result;
- `blocked` — prerequisite/ownership conflict or a valid blocked result;
- `cancelled` — a valid RPIV cancellation result or an operator stop whose bounded signal sequence proved the exact process inactive;
- `interrupted` — absent, malformed, unsupported, or incomplete proof, or a valid interrupted result.

Human and `--json` status derive from the same snapshot and reconciliation facts and expose equivalent state, outcome, safe-action, observation state/code/facts, and remediation meaning. Worker and command success is returned only for `completed`; noncompleted terminal outcomes are nonzero.

## Troubleshooting

| Code | Meaning | Operator action |
| --- | --- | --- |
| `ISSUE_ALREADY_OWNED`, `RESOURCE_OWNERSHIP_UNKNOWN` | Ownership cannot be proven | Preserve resources and inspect status. |
| `STATE_NOT_FOUND`, `STATE_INVALID` | Snapshot is absent, malformed, or unsupported | Preserve it and migrate with a supported version. |
| `RESULT_MISSING`, `RESULT_INVALID`, `RESULT_VERSION_UNSUPPORTED` | Owned result proof is absent or invalid | Emit one strict schema-version-1 artifact. |
| `COMPLETION_PROOF_INCOMPLETE` | Git or GitHub completion facts are unavailable or malformed | Restore the named observation and start a new bounded attempt. |
| `RESULT_*_MISMATCH`, `PR_*_MISMATCH` | Identity, branch, SHA, or PR evidence contradicts the run | Reconcile the exact expected and observed facts. |
| `AC_*_MISMATCH`, `RESULT_FINAL_VALIDATION_MISMATCH` | Required acceptance or root validation proof failed | Correct evidence and rerun RPIV validation. |
| `TMUX_IDENTITY_MALFORMED` | Creation or zero-exit observation returned malformed or ambiguous identity structure | Inspect the bounded value-free diagnostic; preserve unknown resources and explicitly retry only after exact ownership is proved. |
| `TMUX_TARGET_MISSING`, `TMUX_TARGET_MISMATCH` | Attach target is absent or contradictory | Preserve resources and inspect status. |
| `EXTERNAL_COMMAND_FAILED` | Git, tmux, filesystem, or Copilot failed | Use redacted diagnostics to repair the tool. |

## Deterministic evidence fixtures

`src/completion.test.ts` proves strict artifact parsing, successful pure reconciliation, every isolated mismatch, all terminal states, v1/v2 compatibility, and event-before-snapshot failure behavior. `src/orchestration.test.ts` proves the operation trace from zero exit through `finalizing` to `completed` and invalid-artifact interruption. `src/tmux-identity.test.ts` proves exact tmux 3.7b bytes, malformed matrices, byte/count caps, and sentinel confidentiality through a controlled command adapter. `src/integration.test.ts` uses temporary Git roots, an argument-recording command adapter, and fake credential-free `gh` executables. Its named stale-cache divergence fixture leaves `refs/remotes/origin/<issue-branch>` at SHA A while a second repository advances the actual remote to SHA B, proves the live adapter observes B, rejects stale result/local/PR SHA A with `RESULT_REMOTE_SHA_MISMATCH`, and retains a matching authoritative control that completes. Coverage remains at least 80% for statements, branches, functions, and lines.

Run:

```text
just verify-focused
just verify
harness checks --focused --json
harness checks --json
```

## Phase 3 continuation

Restart reconciliation, deterministic resume, bounded stop, guarded cleanup, retained logs, merged-source-head automatic cleanup, and atomic explicit-issue concurrency are now delivered through the shared v3 recovery contract. They preserve the fetched-base and completion conjunction described above. Tmux presence, Copilot exit status, and RPIV prose remain insufficient completion evidence.

Use [`phase-3-recovery-operations.md`](phase-3-recovery-operations.md) for the full command grammar, separately observed RPIV progress, `execution.max_concurrent_runs`, process identity, schema-v1/v2 migration, stop bounds, cleanup refusal categories, automatic trigger, and retained-resource behavior.

For the authoritative integration command, progress classifications, no-clobber result publication, coordinator gate, v5/v4 migration, API applicability, and deployment boundaries, see [the RPIV integration guide](rpiv-integration-contract.md).
