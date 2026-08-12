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
| `command.tmux` | `tmux` is an executable on PATH; install or correct PATH. |
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
| `runtime.trees-ownership` | Every numeric worktree has matching path, Git registration, issue, run, owner, snapshot, lock, and repository; reconcile but preserve unknown resources. |
| `runtime.state-readable` | Recognized snapshots, events, logs, and result artifacts parse/read strictly; preserve and repair or migrate malformed records. |
| `runtime.locks-interpretable` | Recognized owner locks and slot leases parse strictly; preserve and repair malformed records. |
| `runtime.required-paths-creatable` | Exclusive reversible probes prove safe creation under validated ancestors; restore permissions or resolve collisions. |

A dependency failure never omits a later check. It becomes its own failed record with safe remediation.

## Shared human and JSON semantics

Human and JSON rendering consume the same `DoctorResultV1`. Human output contains repository facts, one line for every ID/status/blocking value, failure message/remediation lines, and exactly one final line:

```text
STATUS: READY
STATUS: NOT READY
```

READY exits 0. A complete NOT READY report exits 3. Invalid command syntax exits 2; an internal invariant failure exits 1. Failed prerequisites are report data, not fail-fast CLI errors.

JSON uses schema version `1`:

```json
{
  "schemaVersion": 1,
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

Unknown repository facts are `null`. Every entry has `id`, `status`, and `blocking`. Only failed entries have nonempty `message` and `remediation`. Ordered IDs, status, blocking, readiness, repository facts, messages, and remediations have identical meaning in human and JSON modes.

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
```

`repository.remote`, `repository.base_branch`, branch mappings, prompt, and concurrency retain their existing behavior. The roots default to `.trees` and `.soft-factory`, but `protocol_version` has no inferred default for Doctor. Existing configuration files must add `protocol_version: 1`; unknown keys are now rejected. This is a configuration compatibility migration, not a data migration.

Both roots must be normalized repository-relative paths, distinct and non-overlapping, contained lexically and physically by the primary worktree, and separate from the Git common directory. Absolute paths, traversal, empty segments, files, symlink escape, and Git metadata collisions fail.

Canonical `.github/agents/rpiv.agent.md` frontmatter must contain:

```yaml
name: rpiv
runner_protocol: 1
result_contract: agent-result-v1
```

No fallback `.agents/` path or prose inference is accepted.

## Safe bounded observations

Doctor resolves `git`, `gh`, `tmux`, `node`, and `copilot` directly from PATH with executable checks. External calls use executable/argument arrays with `shell: false`, an environment allowlist, redacted bounded output, one attempt, and a 2-second timeout. Independent Git, authentication, compatibility, and ignore probes run concurrently where safe. There is no polling or hidden retry. The complete service has a 9-second aggregate deadline; timeout fails checks without suppressing the 24-entry result.

Writability and required-path probes use exclusive tokenized resources under validated ancestors. Doctor removes only exact resources it created and treats cleanup uncertainty as failure. It never creates issue state, acquires/deletes locks, creates/removes branches or worktrees, edits snapshots/events/results, signals processes, calls issue APIs, or removes unknown resources. Unrelated filenames are ignored; malformed recognized versioned files fail.

## Deterministic fixtures and timing

Tracked manifests are:

- `fixtures/doctor/ready.json` — all 24 checks passed, READY;
- `fixtures/doctor/blocked.json` — all 24 checks failed with details, NOT READY;
- `fixtures/doctor/isolated-failures.json` — one named failing variant for every ID.

`src/doctor-integration.test.ts` validates manifest completeness/order/uniqueness, executes the 24 isolated variants, builds a 24-row pass/fail matrix, trips on any issue-port access, and invokes both human and JSON modes through normal application composition. Controlled local fake Git, gh, tmux, Node, and Copilot executables require no credentials or network. The ready and blocked built-process fixtures compare normalized human meaning with JSON, repeat ready JSON for determinism, and verify no fixture mutation. Monotonic timing starts immediately before spawning the built CLI and includes process exit; the controlled ready fixture must exit in at most 10,000 ms while the product deadline remains 9,000 ms.

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
| Probe cleanup fails | Inspect only the named `.doctor-*` token and restore permissions before retrying. |
| Product and harness results differ | Remember `soft-factory doctor` checks repository runtime readiness; `harness doctor` checks the development surface. |

Runner remains a short-lived local CLI with no daemon, network API, service endpoint, container, or deployment change. No API specification or API migration is applicable. Operational deployment remains local npm/Node execution through the root `justfile` interface.
