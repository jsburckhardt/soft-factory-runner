# Phase 4 repository Doctor

`soft-factory doctor [--json]` is the product authority for deciding whether the current repository can safely run Soft Factory. Use the root command surface:

```text
just run doctor
just run doctor --json
```

Doctor is repository-only. It does not accept an issue number, call issue APIs, inspect acceptance criteria, prioritize backlog work, queue work, select an issue, or assess issue-specific implementation readiness. The ambient `harness doctor` is different: it diagnoses the engineering harness and is neither called by nor a runtime dependency of product Doctor.

## Ordered blocking checks

Every invocation emits exactly these 24 checks in this order. Every check is blocking; missing, malformed, contradictory, timed-out, or ambiguous evidence fails safely and includes a concrete message and remediation.

| ID | Prerequisite and remediation category |
| --- | --- |
| `repository.git-membership` | Current path belongs to a Git worktree; run from the target repository. |
| `repository.primary-worktree` | Git discovers the primary worktree; repair worktree metadata. |
| `repository.git-common-directory` | Git discovers an absolute common directory; repair Git metadata. |
| `repository.github-identity` | Exactly one owner/repository comes from GitHub remotes; remove remote ambiguity. |
| `repository.default-branch` | The selected remote HEAD names a branch; repair it with `git remote set-head <remote> --auto`. |
| `command.git` | `git` is an executable on PATH; install or correct PATH. |
| `command.gh` | `gh` is an executable on PATH; install or correct PATH. |
| `command.tmux` | `tmux` is executable and completes the isolated private functional protocol with proved cleanup; install/repair tmux or correct the named operation/cleanup failure. |
| `command.node` | `node` is an executable on PATH; install Node.js 22+ or correct PATH. |
| `command.copilot` | `copilot` is an executable on PATH; install or correct PATH. |
| `authentication.github-cli` | `gh auth status --hostname <discovered-host>` succeeds; authenticate that host. |
| `authentication.copilot-cli` | `copilot --version` succeeds; repair/install/authenticate Copilot CLI. |
| `compatibility.rpiv-agent` | Canonical `.github/agents/rpiv.agent.md` is readable; install the asset. |
| `compatibility.runner-protocol` | Configuration and RPIV metadata both declare protocol 1; migrate both declarations. |
| `compatibility.configuration` | `.soft-factory/config.yml` uses the strict known schema; fix syntax or unknown keys. |
| `compatibility.worktree-root` | Configured worktree root is physically safe; correct path, collision, or symlink issues. |
| `compatibility.state-root-writable` | A reversible exclusive probe proves state-root writability; restore permissions and inspect collisions. |
| `compatibility.trees-ignored` | Git proves a representative worktree-root descendant ignored; add a complete ignore rule. |
| `compatibility.runtime-state-ignored` | Git proves a representative state-root descendant ignored; add a complete ignore rule. |
| `compatibility.result-contract` | RPIV declares `agent-result-v1`; install compatible metadata. |
| `runtime.trees-ownership` | Every numeric worktree has matching path, Git registration, issue, run, owner, snapshot, lock, and repository; snapshot/lock repository disagreement fails even when repository discovery is unavailable; reconcile but preserve unknown resources. |
| `runtime.state-readable` | Recognized snapshots, events, logs, and result artifacts parse/read strictly; preserve and repair or migrate malformed records. |
| `runtime.locks-interpretable` | Recognized owner locks and slot leases parse strictly; preserve and repair malformed records. |
| `runtime.required-paths-creatable` | Exclusive reversible probes prove safe creation under validated ancestors; restore permissions or resolve collisions. |

A dependency failure never omits a later check. It becomes its own failed record with safe remediation.

## Shared human and JSON semantics

Human and JSON rendering consume the same strict `DoctorResultV2`. Human output contains repository facts, one line for every ID/status/blocking value, failure message/remediation lines, and exactly one final line:

```text
STATUS: READY
STATUS: NOT READY
```

READY exits 0. A complete NOT READY report exits 3. Invalid command syntax exits 2; an internal invariant failure exits 1. Failed prerequisites are report data, not fail-fast CLI errors.

JSON uses schema version `2`:

```json
{
  "schemaVersion": 2,
  "ready": false,
  "repository": { "github": "owner/repository", "defaultBranch": "main" },
  "checks": [
    {
      "id": "command.copilot",
      "status": "failed",
      "blocking": true,
      "message": "Copilot CLI is not executable on PATH.",
      "remediation": "Install the Copilot CLI and add it to PATH."
    }
  ]
}
```

Unknown repository facts are `null`. Every entry has `id`, `status`, and `blocking`. Only failed entries have nonempty `message` and `remediation`. Ordered IDs, status, blocking, readiness, repository facts, messages, remediations, and optional evidence have identical meaning in human and JSON modes.

A failed functional tmux check may add strict `DoctorTmuxProbeEvidenceV1` under `evidence`. It carries only its own schema version and kind, a closed operation/reason, exit/timeout facts, exact stdout/stderr byte counts and truncation booleans, an optional bounded value-free `TmuxIdentityDiagnosticV1`, and `not-created`/`absent`/`present`/`unknown` states for server, pane processes, socket, and workspace. Human output renders those same fields deterministically. Evidence never includes raw bytes or text, IDs, PIDs, paths, names, argument/environment/helper values, hashes, or byte values.

### Doctor result schema migration

Automation consumers and stored manifests that required `schemaVersion: 1` must migrate to strict `DoctorResultV2` and require `schemaVersion: 2`. Keep the same exact ordered 24 IDs, all-blocking readiness conjunction, repository facts, and exits. Accept optional `evidence` only on failed checks and validate its exact closed shape; do not reinterpret or silently upgrade schema-v1 documents. The tracked ready, blocked, and isolated-failure manifests are schema v2. This output migration does not migrate configuration, run snapshots, issue-run state, data, or deployment.

## Configuration and metadata migration

Doctor requires `.soft-factory/config.yml`:

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
execution:
  max_concurrent_runs: 1
copilot:
  environment:
    COPILOT_OTEL_ENABLED: "true"
    OPTIONAL_EMPTY: ""
```

`repository.remote`, `repository.base_branch`, branch mappings, prompt, and concurrency retain their existing behavior. The roots default to `.trees` and `.soft-factory`, but `protocol_version` has no inferred default for Doctor. Existing configuration files must add `protocol_version: 1`; unknown scalar keys and unknown empty mapping keys are rejected at every supported mapping level. Known empty `repository`, `rpiv`, `execution`, `branch_types`, `copilot`, and `copilot.environment` mappings retain documented defaults. This is a configuration compatibility migration, not a data migration.

Doctor uses the same strict `copilot.environment` parser as issue execution. Names must match `[A-Za-z_][A-Za-z0-9_]*`; values must be string scalars, including explicit empty `""`. An absent mapping or empty environment mapping adds no overrides. Duplicate/invalid names, non-string/nested values, aliases, anchors, merge keys, unsupported keys, malformed lines, and bad indentation fail `compatibility.configuration` with field/reason diagnostics with no value included.

Doctor validates only compatibility: it never launches Copilot or passes configured entries to its own `git`, `gh`, tmux, Node, Copilot usability, or generic probes. At issue launch, Runner reads the current file fresh, applies allowlisted inherited values, then configuration, then Runner-owned current-issue `OTEL_RESOURCE_ATTRIBUTES`, and transports strings literally with `shell: false`. Configured names and values are not persisted or rendered. Correct the file and rerun Doctor or the eligible launch explicitly; there is no cache or hidden retry. This additive mapping changes no Doctor result schema, run snapshot, API, data, or deployment contract and has no migration requirement when absent.

Both roots must be normalized repository-relative paths, distinct and non-overlapping, contained lexically and physically by the primary worktree, and separate from the Git common directory. Absolute paths, traversal, empty segments, files, symlink escape, and Git metadata collisions fail.

Canonical `.github/agents/rpiv.agent.md` frontmatter must contain:

```yaml
name: rpiv
runner_protocol: 1
result_contract: agent-result-v1
```

No fallback `.agents/` path or prose inference is accepted.

## Safe bounded observations

Doctor resolves `git`, `gh`, `tmux`, `node`, and `copilot` directly from PATH with executable checks. External calls use executable/argument arrays with `shell: false`, a noncredential environment allowlist, redacted output, one attempt, and a maximum 2000 ms (2-second timeout) per command or managed-process wait. Independent probes run concurrently where safe. There is no polling or hidden retry.

### Isolated functional tmux proof

Executable discovery alone cannot pass `command.tmux`. Doctor creates an exclusive mode-0700 workspace under the physical operating-system temporary directory, with private `HOME`, `XDG_CONFIG_HOME`, and `TMPDIR`, an empty mode-0600 tmux configuration, and a mode-0600 inert Node helper. It starts the discovered absolute executable as the directly managed foreground process `tmux -D -S <private-socket> -f <empty-config>` with no command. Every client invocation begins with the exact same private `-S <private-socket>` selector. Doctor never reads tmux environment variables, inherited user configuration, credentials, or the ambient/default tmux server.

After one event-driven socket wait, the no-retry functional sequence is:

1. create a detached private session, dashboard window, and helper;
2. prove `has-session` and an exact one-line dashboard window-name listing;
3. locate the dashboard pane PID, then require compound process-group/start-token/executable/arguments/cwd identity and managed-server lineage;
4. create one detached issue window with exact original bytes `#{window_id}|#{pane_id}<LF>` and the strict shared parser;
5. set `remain-on-exit` on that exact window;
6. identify the issue helper with the same compound and lineage proof;
7. make one formatted `list-panes` observation using `#{window_id}|#{pane_id}|#{pane_current_path}<LF>`, strictly parse only the first two separators, retain the cwd remainder unchanged, and require equal IDs plus the physical workspace cwd; and
8. remove the exact issue window.

Creation and observation use printable vertical bars as the only structural separators and require exactly one terminal LF. This same closed grammar works in controlled UTF-8 and non-UTF8 tmux client states without ambient locale, `TMUX`, or `tmux -u`. Observation permits vertical bars inside a nonempty valid UTF-8 cwd because only the first two separators are structural. HT, sanitized/inferred forms, alternate separators, CR/CRLF, invalid cwd, extra/partial create fields, and multiple records fail. Every server/client stdout and stderr stream is drained, counts all original bytes before decoding, and retains at most 4096 bytes. A 4097th byte fails as truncated even though only the cap is retained. No retained or rendered evidence contains a probe value.

One 9-second aggregate deadline controller starts with Doctor. It cancels active functional work and starts no new functional operation at 6500 ms. Cleanup reserves the remaining 2500 ms: request private `kill-server` by 7000 ms, finish its post-request wait by 7250 ms, finish exact-identity `SIGTERM` waits by 7750 ms, finish exact-identity `SIGKILL` waits by 8250 ms, and complete final proof by 9000 ms. Every individual command and wait remains bounded by 2000 ms. Success, setup/launch failure, nonzero exit, malformed/truncated output, identity/cwd mismatch, timeout, cancellation, and aggregate expiry all await the same unconditional cleanup.

Cleanup signals only the directly owned server handle or still-matching compound helper identities descended from that server; PIDs are locators, never sole authority, and no process-name signaling is allowed. It removes only the exclusive workspace and then proves server, pane helpers, private socket, configuration/helper files through workspace removal, and workspace absent. Missing or uncertain cleanup overrides functional success. Doctor cannot render or return while owned probe work or cleanup remains unsettled.

Other writability and required-path probes use exclusive tokenized resources under validated ancestors. Doctor removes only exact resources it created and treats cleanup uncertainty as failure. It never creates issue state, acquires/deletes locks, creates/removes branches or worktrees, edits snapshots/events/results, calls issue APIs, or removes/signals unrelated resources. Unrelated filenames are ignored; malformed recognized versioned files fail.

## Deterministic fixtures and timing

Tracked manifests are:

- `fixtures/doctor/ready.json` — all 24 checks passed, READY;
- `fixtures/doctor/blocked.json` — all 24 checks failed with details, NOT READY;
- `fixtures/doctor/isolated-failures.json` — one named failing variant for every ID.

`src/doctor-integration.test.ts` validates manifest completeness/order/uniqueness and executes all 24 isolated input faults through the actual `DoctorService`, repository/authentication adapters, compatibility checks, and runtime inventory. The machine-checked 24-row pass/fail matrix proves every real check passes in the ready composition and fails in its named fault composition; no manufactured prebuilt Doctor result supplies this proof. Issue-port tripwires remain active, and controlled local fake Git, gh, Node, and Copilot dependencies require no credentials or network. READY uses either an injected passing probe or a protocol-aware temporary Unix-socket executable that accepts only the private foreground/client sequence and owns controlled helper children; an installed no-op, malformed create, malformed observe, or cleanup-uncertain variant remains NOT READY. Tests never contact live/default tmux. Explicit UTF-8 and non-UTF8 rows derive output from each actual `-F` argument, reproduce the six-byte zero-stderr/no-HT creation record, repeat deterministically, enumerate the full malformed create/observe matrix, and overlap two private probes with distinct servers, helper lineages, sockets, and workspaces before proving complete absence. The ready and blocked built-process fixtures compare both normalized human and parsed JSON output completely with their declared manifests—including repository facts, readiness, ordered statuses/blocking, and every failure message/remediation—repeat ready JSON for determinism, and verify no fixture mutation. Monotonic timing starts immediately before spawning the built CLI and includes process exit; the controlled ready fixture must exit in at most 10,000 ms while the product deadline remains 9,000 ms.

Run acceptance and project gates only through root recipes and their harness delegates:

```text
just verify-focused
harness checks --focused --json
just verify
harness checks --json
```

## Operations and troubleshooting

1. Run Doctor from the intended repository worktree before starting issue execution.
2. Read all failures; fixing the first does not make omitted checks appear because none are omitted.
3. Restore command PATH/authentication, strict configuration/metadata, ignore coverage, path permissions, or exact runtime ownership named by each remediation.
4. Preserve malformed or ambiguously owned state and worktrees. Use existing reconciliation/control commands rather than manual destructive cleanup.
5. Rerun Doctor explicitly after correction; Doctor does not retry internally.

| Symptom | Action |
| --- | --- |
| Repository fields are `null` | Repair Git membership, remotes, and remote HEAD. |
| Auth probe times out | Repair slow local CLI/auth configuration; each call is capped at 2 seconds. |
| Configuration fails after upgrade | Add protocol/root keys and remove unknown, absolute, traversing, or overlapping values. |
| Ignore checks fail | Add rules covering descendants of both configured roots and check for negation rules. |
| Ownership or state fails | Preserve resources and reconcile exact snapshot/lock/Git identities; do not force-delete. |
| `command.tmux` executable is absent | Install tmux or correct PATH, then rerun Doctor. |
| Functional tmux operation fails or is malformed | Use the value-free operation/reason, bounds, and remediation; repair the local tmux installation. Do not inspect or mutate an ambient server. |
| Tmux probe cleanup is uncertain | Stop. Preserve unrelated tmux state, repair the named local prerequisite, and rerun Doctor; never use name-wide/PID-only destruction. |
| Product and harness results differ | Remember `soft-factory doctor` checks repository runtime readiness; `harness doctor` checks the development surface. |

Runner remains a short-lived local CLI with no daemon, network API, service endpoint, container, or deployment change. No API specification or API migration is applicable. The functional tmux readiness change adds no configuration option/default or configuration migration, run snapshot or issue-run tmux change, database/data migration, runtime service, container, or deployment procedure. Only schema-v1 Doctor output consumers migrate to `DoctorResultV2`. Operational deployment remains local npm/Node execution through the root `justfile` interface.

Doctor configuration compatibility recognizes the optional `rpiv.final_validation` issue-run contract. Its exact declared-recipe grammar, pre-ownership rejection, snapshot semantics, legacy behavior, and separation from Doctor readiness are documented in [the RPIV integration guide](rpiv-integration-contract.md). Doctor remains repository-readiness authority and does not infer RPIV progress or completion.

## Exact tmux targeting evidence

The canonical `command.tmux` check keeps the private bounded mechanics probe and adds value-free target classification from the shared resolver. Its mode is exactly `invoking-valid`, `standalone-fallback`, or `invalid-context`; invalid evidence carries one closed reason. Before and after resolver classification, Doctor runs read-only `list-panes -a` through explicit `-S` selectors and captures actual session, window, and pane records plus socket device/inode identity. Valid or structurally parseable invoking evidence compares that custom server with the explicit default server; fallback or structurally unusable evidence compares the explicit default server with the deterministic standalone selector without creating it. Each inventory command is capped at 2 seconds, 1,024 records, and 65,536 bytes. Doctor computes `inventoryMeasured`, `ambientUnchanged`, and `unrelatedUnchanged` from those ephemeral byte comparisons and fails readiness if either differs. Directory entries are not inventory proof: a new window on an existing socket changes the resource inventory even though the socket directory is unchanged. Doctor does not create fallback resources or mutate selected, ambient, or unrelated servers. Human and JSON output carry the same classification and never include socket paths, resource IDs/names/cwds, raw `TMUX` tuples, server PIDs, malformed sentinels, or unrelated environment values. Invalid context makes Doctor NOT READY with a nonzero result while retaining the same ordered 24 check IDs.
