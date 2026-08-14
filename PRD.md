# Soft Factory Runner — Product Requirements Document

```yaml
prd_id: PRD-SFR-001
title: Soft Factory Runner
status: draft
version: 0.3.0
repository: jsburckhardt/soft-factory-runner
related_repository: jsburckhardt/soft-factory
implementation_language: TypeScript
runtime: Node.js
execution_surface: tmux
workspace_isolation: Git worktrees
persistence: JSON snapshots + JSONL event logs
```

---

# 1. Executive Summary

**Soft Factory Runner** is a local-first command-line application for safely running autonomous software-delivery workflows against explicit GitHub issues.

A user provides an issue number:

```bash
soft-factory run --issue 123
```

Runner then:

1. validates the repository;
2. validates the issue;
3. acquires exclusive ownership of the issue;
4. creates an isolated Git branch and worktree;
5. creates a visible tmux execution window;
6. launches the repository-defined RPIV agent;
7. tracks execution state;
8. receives a structured result from RPIV;
9. reconciles the result against Git and GitHub;
10. reaches an explicit terminal state.

Runner itself is **not an AI agent**.

Runner is deterministic application code.

Humans may operate the complete Runner CLI, while the official Delivery Agent may perform only one validated issue dispatch.

The product therefore separates three responsibilities:

```text
Human
  │
  ├── direct CLI
  │      │
  │      ▼
  │   Runner
  │
  └── Soft Factory Delivery Agent
            │
            ▼
          Runner
            │
            ▼
           RPIV
            │
            ▼
     Software Delivery
```

Runner provides one installation mechanism for the sole official Soft Factory delivery agent. Both forms run the same convergence:

```bash
soft-factory install agent soft-factory
soft-factory install --recommended
```

The package publishes only `assets/official/soft-factory.agent.md`, installs it at `.github/agents/soft-factory.agent.md`, and keeps strict schema-v1 ownership at `.agents/manifest.json`. Removed assessor and skill selectors are unsupported; their historical records are accepted only as exact digest retirement proof. Repository readiness remains grounded in `soft-factory doctor [--json]` and its canonical 24 checks.

---

# 2. Product Vision

Make autonomous issue delivery as simple as:

```text
Deliver issue 123 using Soft Factory.
```

The installed Delivery Agent should know how to dispatch exactly one explicitly selected issue through Runner.

Runner should know how to safely operate the delivery process.

RPIV should know how to engineer the solution.

The developer should not need to manually:

* create branches;
* create worktrees;
* create tmux windows;
* construct Copilot commands;
* keep track of running agents;
* determine whether an agent genuinely finished;
* reconstruct execution after interruption.

---

# 3. Core Product Model

```text
┌───────────────────────────────────────┐
│ Human                                 │
│ "Deliver issue 123"                   │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│ Soft Factory Delivery Agent           │
│ Dispatches one explicit issue only    │
└───────────────────┬───────────────────┘
                    │
                    │ CLI
                    ▼
┌───────────────────────────────────────┐
│ Soft Factory Runner                   │
│                                       │
│ Deterministic control plane           │
│                                       │
│ - validation                          │
│ - locking                             │
│ - worktrees                           │
│ - tmux                                │
│ - state                               │
│ - recovery                            │
│ - reconciliation                     │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│ RPIV                                  │
│                                       │
│ Research                              │
│ Plan                                  │
│ Implement                             │
│ Verify                                │
│ Commit                                │
│ Push                                  │
│ Create PR                             │
└───────────────────┬───────────────────┘
                    │
                    ▼
             Pull Request
```

The Delivery Agent is optional.

A human can always directly run:

```bash
soft-factory run --issue 123
```

---

# 4. Product Principles

## 4.1 Deterministic outside, agentic inside

Runner owns operational control.

RPIV owns software engineering.

The Delivery Agent owns only the validated natural-language request for one explicit issue dispatch.

These responsibilities must remain separate.

---

## 4.2 Explicit work only

Runner does not select issues.

There is intentionally no:

```bash
soft-factory run --next
```

Runner must always receive an explicit issue:

```bash
soft-factory run --issue 123
```

Issue selection and prioritisation belong to:

* the human;
* another agent;
* a project-management system;
* an external orchestrator.

Runner's responsibility begins when it receives a concrete issue number.

---

## 4.3 Visible automation

RPIV execution must remain visible.

tmux is a first-class execution and observation surface.

A developer should be able to run:

```bash
soft-factory attach 123
```

and immediately observe the relevant agent session.

---

## 4.4 Issue isolation

Each active issue owns:

* one local lock;
* one branch;
* one Git worktree;
* one tmux window;
* one run record.

Parallel issues must not share these resources.

---

## 4.5 Evidence over prose

Runner must never treat model prose as proof of completion.

The following are insufficient by themselves:

```text
"Done!"
"Implementation complete."
"All tests passed."
```

A zero Copilot exit status is also insufficient.

Completion requires structured and independently observable evidence.

---

## 4.6 Agent-friendly interfaces

Anything an installed agent is expected to reason about SHOULD have structured machine-readable output.

For example:

```bash
soft-factory doctor --json
soft-factory status 123 --json
```

Agents should consume Runner's state rather than reverse-engineering it from terminal prose.

---

# 5. Product Goals

## GOAL-001 — One-command issue execution

Starting delivery should require:

```bash
soft-factory run --issue 123
```

Runner handles the operational setup.

---

## GOAL-002 — Safe concurrent execution

Multiple distinct issues can run simultaneously without branch, filesystem, lock, or tmux collisions.

Target:

```text
0 isolation conflicts
```

---

## GOAL-003 — Recoverable execution

Every active run must be recoverable or deterministically classifiable after:

* Runner restart;
* shell restart;
* tmux client disconnect;
* Copilot termination;
* machine restart.

---

## GOAL-004 — Trustworthy completion

Every successful run records sufficient evidence to establish:

* issue;
* branch;
* worktree;
* final commit;
* verification;
* pull request.

---

## GOAL-005 — Easy repository onboarding

A user should be able to determine readiness with:

```bash
soft-factory doctor
```

An agent should be able to determine the same thing with:

```bash
soft-factory doctor --json
```

---

## GOAL-006 — Agent-operated Runner

Official Soft Factory agents should be capable of operating Runner without duplicating or bypassing its orchestration logic.

---

# 6. Non-Goals

Runner MVP is not:

* a backlog prioritisation engine;
* a general workflow engine;
* a project-management system;
* a distributed agent framework;
* a replacement for GitHub Issues;
* a replacement for Git;
* a replacement for tmux;
* a hosted multi-tenant service;
* an autonomous issue-selection agent;
* a PR merge bot;
* an automated deployment system.

Automated PR review and remediation are deferred.

---

# 7. Repository

Primary repository:

```text
jsburckhardt/soft-factory-runner
```

Related repository/template:

```text
jsburckhardt/soft-factory
```

The Runner repository contains the deterministic runtime.

Compatible target repositories contain RPIV and repository-specific engineering instructions.

---

# 8. Target Repository Layout

A compatible project may look like:

```text
my-project/
├── .git/
│
├── .github/
│   └── agents/
│       └── soft-factory.agent.md
│
├── .agents/
│   └── manifest.json
│
├── .trees/
│   ├── 123/
│   ├── 124/
│   └── 130/
│
├── .soft-factory/
│   ├── runs/
│   ├── events/
│   ├── locks/
│   ├── schemas/
│   └── config.yml
│
├── .github/
│   ├── agents/
│   │   └── rpiv.agent.md
│   └── ...
│
└── ...
```

`.trees/` and Runner runtime state MUST be excluded from Git.

`.agents/` MAY be committed.

---

# 9. CLI Experience

## 9.1 Run an issue

```bash
soft-factory run --issue 123
```

This is the primary product interaction.

---

## 9.2 Inspect execution

```bash
soft-factory list
soft-factory status 123
soft-factory status 123 --json
soft-factory attach 123
soft-factory logs 123
```

---

## 9.3 Control execution

```bash
soft-factory reconcile 123
soft-factory resume 123
soft-factory stop 123
soft-factory clean 123
```

---

## 9.4 Assess repository readiness

```bash
soft-factory doctor
soft-factory doctor --json
```

---

## 9.5 Install the official delivery agent

```bash
soft-factory install agent soft-factory
soft-factory install --recommended
```

Both forms run the same one-agent convergence.

---

# 10. Asset Installation

Runner distributes exactly one versioned official asset: `agent:soft-factory`. Trusted package-local bytes install at `.github/agents/soft-factory.agent.md`; no assessor or skill is current or consumable. The installed agent requires exactly one canonical issue, reads instructions before Doctor, dispatches only when ready, preserves applicable Runner output unchanged, and separates dispatch acceptance from Runner-proved ticket completion.

---

# 11. Recommended Installation

A new user should be able to run:

```bash
npm install -g soft-factory-runner

cd my-project

soft-factory install --recommended
```

Expected state is one delivery agent at `.github/agents/soft-factory.agent.md` and one manifest at `.agents/manifest.json`. Repeating installation performs zero mutations. Invoke delivery with `soft-factory run --issue 123 --json`.

---

# 12. Asset Manifest

Runner SHOULD maintain:

```text
.agents/manifest.json
```

Example:

```json
{
  "schemaVersion": 1,
  "assets": [
    {
      "type": "agent",
      "name": "soft-factory",
      "version": "1.0.0",
      "runnerProtocol": 1,
      "destination": ".github/agents/soft-factory.agent.md",
      "sha256": "<lowercase-sha256>"
    }
  ]
}
```

---

# 13. Installation Safety

Runner MUST NOT silently overwrite locally modified assets.

If no destination exists:

```text
✓ Installed soft-factory.agent.md
```

If the installed asset already matches:

```text
✓ Already up to date
```

If the local asset has been modified:

```text
Cannot update soft-factory.agent.md.

The installed file contains local modifications.

No files were changed.
```

Migration recognizes only the exact current destination and three historical identity-destination pairs. Matching old operator bytes migrate; absent old files retire stale metadata. Matching assessor and skill files retire, while modified or unproved bytes refuse the complete operation with `No files changed`. Skill siblings and unrelated content are preserved, and legacy directories are removed only when a proved retirement leaves them empty. There is no force option.

Mutations span `.github/` and `.agents/` in one manifest-last transaction. Failure restores exact bytes and path kinds or reports `ASSET_ROLLBACK_UNCERTAIN` with every affected path and restore-before-retry remediation.

---

# 14. Asset Versioning

Each official asset must have a version and compatible Runner protocol.

Conceptually:

```yaml
name: soft-factory
type: agent
version: 1.0.0
runner_protocol: 1
```

Runner must not silently install incompatible assets.

Package-local bytes MUST match the compiled SHA-256 digest. The exact npm allowlist excludes every other `assets/official/` path. The product adds no API, service, daemon, webhook, container, configuration-default, or deployment change.

---

# 15. Soft Factory Delivery Agent

The sole official agent is an optional natural-language adapter for exactly one explicitly selected GitHub issue dispatch through Runner. Its primary goal is delivery of that one issue; it is not a general Runner operator or lifecycle control plane.

Example caller request:

```text
Deliver issue 123 using Soft Factory.
```

Before any terminal use, the Delivery Agent requires exactly one canonical positive base-10 issue number matching `[1-9][0-9]*`. It rejects missing, multiple, zero or nonpositive, signed, fractional, leading-zero, unsafe-range, and otherwise invalid issue input.

For valid input it invokes only these direct JSON commands, in this order:

1. `soft-factory instructions --json`
2. `soft-factory doctor --json`
3. `soft-factory run --issue <number> --json`, only when Doctor explicitly reports ready

The agent stops after an instructions failure, a non-ready Doctor result, or the single run result. It does not retry or query status.

---

# 16. Delivery Agent Contract

The Delivery Agent MUST:

* use Runner as the sole operational and completion authority;
* preserve the applicable structured instructions, Doctor, or run output unchanged and byte-for-byte, without summary or reinterpretation;
* report dispatch acceptance separately from issue completion;
* keep completion `unknown` unless the applicable Runner output explicitly reports completion;
* leave worktrees, locks, state, snapshots, events, logs, tmux windows, processes, cleanup, and completion decisions to Runner.

The Delivery Agent MUST NOT:

* install assets or invoke any lifecycle, status-follow-up, resource-inspection, control, cleanup, internal, or direct RPIV command;
* select, rank, queue, infer, or combine issues;
* implement the issue instead of RPIV;
* create, inspect, alter, or delete Runner-owned worktrees, locks, leases, state, results, logs, tmux resources, or processes;
* infer completion from dispatch acceptance, prose, terminal output, or process exit;
* override, weaken, retry, or reinterpret a structured Runner result.

The complete Runner CLI remains available to humans and deterministic Runner workflows, but the official Delivery Agent is authorized only for the one validated dispatch sequence above.

---

# 17. Delivery Agent Readiness Boundary

The Delivery Agent reads `soft-factory instructions --json` before `soft-factory doctor --json` and dispatches only when the complete Doctor result explicitly reports ready. It never independently infers readiness and does not replace, reinterpret, or weaken Doctor. The removed Assessor is not a current catalog or package asset.

---
# 18. Repository Doctor

Runner MUST provide:

```bash
soft-factory doctor
```

for humans and:

```bash
soft-factory doctor --json
```

for tools and agents.

---

# 19. Doctor Checks

## Repository

Verify:

* current path belongs to Git repository;
* primary worktree is discoverable;
* Git common directory is discoverable;
* GitHub owner/repository is discoverable;
* default branch is discoverable.

---

## Required commands

Verify:

```text
git
gh
tmux
node
copilot
```

---

## Authentication

Verify where practical:

* GitHub CLI authenticated;
* Copilot CLI usable.

---

## Soft Factory compatibility

Verify:

* RPIV agent exists;
* supported Runner protocol exists;
* Runner configuration is valid;
* worktree root is valid;
* state root is writable;
* `.trees/` is ignored;
* Runner runtime state is ignored;
* RPIV result-artifact contract is available.

---

## Runtime safety

Verify:

* no invalid existing `.trees` ownership conflicts;
* state files are readable;
* locks are interpretable;
* required paths can be created safely.

---

# 20. Doctor Human Output

Example:

```text
Soft Factory Runner

Repository
  ✓ Git repository
  ✓ GitHub: jsburckhardt/example
  ✓ Default branch: main

Dependencies
  ✓ git
  ✓ gh
  ✓ tmux
  ✓ node
  ✓ copilot

Authentication
  ✓ GitHub authenticated
  ✓ Copilot available

Soft Factory
  ✓ RPIV agent
  ✓ protocol version 1
  ✓ .trees ignored
  ✓ runtime state ignored
  ✗ RPIV result contract

STATUS: NOT READY

Blocking issues: 1

RPIV does not expose the required Runner result contract.
```

---

# 21. Doctor JSON Output

Example:

```json
{
  "schemaVersion": 1,
  "ready": false,
  "repository": {
    "github": "jsburckhardt/example",
    "defaultBranch": "main"
  },
  "checks": [
    {
      "id": "git",
      "status": "passed",
      "blocking": true
    },
    {
      "id": "tmux",
      "status": "passed",
      "blocking": true
    },
    {
      "id": "rpiv-result-contract",
      "status": "failed",
      "blocking": true,
      "message": "Required RPIV result contract was not detected.",
      "remediation": "Install or update the repository Soft Factory integration."
    }
  ]
}
```

The schema must be versioned.

---

# 22. Issue Execution

Primary command:

```bash
soft-factory run --issue 123
```

Execution pipeline:

```text
validate repository
        ↓
validate issue
        ↓
acquire lock
        ↓
prepare branch
        ↓
prepare worktree
        ↓
prepare tmux session
        ↓
prepare issue window
        ↓
launch RPIV
        ↓
observe RPIV
        ↓
load result artifact
        ↓
validate result
        ↓
reconcile Git
        ↓
reconcile GitHub
        ↓
terminal state
```

---

# 23. Issue Readiness

Before autonomous execution, Runner MUST verify:

* issue exists;
* issue is open;
* issue satisfies required readiness conventions;
* issue includes required acceptance criteria;
* issue is not explicitly blocked;
* another active local run does not own the issue;
* no conflicting active PR exists;
* repository doctor blocking checks pass.

Failure must occur before unnecessary side effects whenever possible.

---

# 24. Issue Locking

Each active issue has one local lock.

Example:

```text
.soft-factory/locks/123.lock
```

Lock acquisition must be atomic.

If two Runner processes execute:

```bash
soft-factory run --issue 123
```

simultaneously:

```text
one process succeeds
one process receives a clear conflict
```

There must never be two active local owners.

---

# 25. Worktree Model

Issue branches follow the same type taxonomy as Conventional Commits:

```text
<type>/<issue-number>-<short-slug>
```

`<type>` must be one of the Conventional Commit types allowed by the repository's
commit standard, and should match the intended implementation commit and pull
request title type.

Default worktree:

```text
.trees/<issue-number>
```

For issue `123`:

```text
branch:   feat/123-add-run-command
worktree: .trees/123
```

Before creating a new issue branch or worktree, Runner must fetch the configured
remote and verify that the local default branch matches the latest remote default
branch. Runner must create the issue branch from that verified remote default
branch, not from a stale local branch. If synchronization cannot be proven,
Runner must stop with an actionable blocked result.

Runner must verify existing worktree ownership before reuse.

Runner must never remove or modify an unknown directory merely because its path matches `.trees/<issue>`.

---

# 26. tmux Model

Each repository owns one deterministic tmux session.

Example:

```text
sf-jsburckhardt-example
```

Each issue owns one window.

Example:

```text
session: sf-jsburckhardt-example

0: dashboard
1: 123
2: 124
3: 130
```

The issue window must start in:

```text
.trees/123
```

---

# 27. RPIV Execution

The issue window launches an internal Runner command:

```bash
soft-factory internal run-agent --issue 123
```

The internal worker then launches:

```bash
OTEL_RESOURCE_ATTRIBUTES="project.name=jsburckhardt-example,issue.id=issue-123" \
  copilot --yolo --name "issue-123" --agent rpiv -p "Deliver issue #123"
```

Runner MUST set `OTEL_RESOURCE_ATTRIBUTES` for each Copilot process using the
resolved repository name and issue number:

```text
project.name=<project>,issue.id=issue-<number>
```

These attributes identify telemetry from concurrent repositories and issues
without requiring agents to infer execution context.

The internal worker exists so Runner can reliably capture:

* process start;
* process exit;
* exit code;
* result path;
* terminal markers.

The full terminal experience remains visible through tmux.

---

# 28. Attach

A user should only need the issue number:

```bash
soft-factory attach 123
```

Runner resolves:

* repository session;
* issue window;
* pane.

The user does not need to know tmux IDs.

---

# 29. State Model

```text
validating_issue
        ↓
acquiring_lock
        ↓
preparing_worktree
        ↓
starting_tmux
        ↓
running_rpiv
        ↓
finalizing
   ┌────┼─────┬────────┬───────────┐
   ↓    ↓     ↓        ↓           ↓
completed failed blocked cancelled interrupted
```

---

# 30. State Definitions

### `validating_issue`

Repository and issue checks are executing.

### `acquiring_lock`

Runner is acquiring exclusive local issue ownership.

### `preparing_worktree`

Branch and worktree are being created or reconciled.

### `starting_tmux`

Repository session and issue window are being prepared.

### `running_rpiv`

RPIV is actively executing.

### `finalizing`

Runner is validating result, Git, verification, and GitHub evidence.

### `completed`

A verified PR exists for the expected issue, branch, and SHA.

### `failed`

Execution ran but failed.

### `blocked`

Runner cannot safely proceed because of a prerequisite or conflict.

### `cancelled`

The operator intentionally stopped execution.

### `interrupted`

Runtime state became unavailable or ambiguous before successful completion.

---

# 31. State Invariants

1. One issue has at most one active local run.

2. One active run has one lock.

3. One active run owns one branch.

4. One active run owns one worktree.

5. One active run owns one tmux execution window.

6. tmux presence does not establish workflow success.

7. Copilot exit code zero does not establish workflow success.

8. Agent prose does not establish workflow success.

9. `completed` requires a valid RPIV result artifact.

10. `completed` requires matching Git evidence.

11. `completed` requires matching GitHub evidence.

12. cleanup must not silently discard uncommitted changes.

13. a new issue worktree must be based on the latest verified remote default branch.

14. branch types must conform to the repository's Conventional Commit type taxonomy.

15. a merged pull request triggers cleanup only after branch, pull request, merge, and worktree ownership are reconciled.

16. installed agents cannot override these invariants.

---

# 32. Runtime Files

```text
.soft-factory/
├── runs/
│   ├── 123.json
│   └── 124.json
├── events/
│   ├── 123.jsonl
│   └── 124.jsonl
├── locks/
│   ├── 123.lock
│   └── 124.lock
└── schemas/
```

---

# 33. Run Snapshot

Example:

```json
{
  "schemaVersion": 1,
  "runId": "jsburckhardt-example-123-20260810T090000+1000",
  "repository": "jsburckhardt/example",
  "issueNumber": 123,
  "state": "running_rpiv",
  "attempt": 1,
  "baseBranch": "main",
  "branch": "feat/123-add-run-command",
  "worktreePath": ".trees/123",
  "tmux": {
    "sessionName": "sf-jsburckhardt-example",
    "windowName": "123",
    "windowId": "@7",
    "paneId": "%12"
  },
  "copilot": {
    "agent": "rpiv",
    "prompt": "Deliver issue #123",
    "permissionMode": "yolo",
    "exitCode": null
  },
  "result": null,
  "error": null
}
```

Snapshot writes MUST be atomic.

---

# 34. Transition Events

Example:

```json
{"at":"2026-08-10T09:00:00+10:00","issue":123,"from":null,"to":"validating_issue","reason":"run-created"}
{"at":"2026-08-10T09:00:02+10:00","issue":123,"from":"validating_issue","to":"acquiring_lock","reason":"issue-ready"}
```

Event history MUST be append-only JSONL.

---

# 35. RPIV Result Artifact

RPIV must write a structured completion artifact.

Default:

```text
.soft-factory/agent-result.json
```

Example:

```json
{
  "schemaVersion": 1,
  "issueNumber": 123,
  "outcome": "succeeded",
  "branch": "feat/123-add-run-command",
  "headSha": "abc123def456",
  "prNumber": 456,
  "acceptanceCriteria": [
    {
      "id": "AC-1",
      "status": "verified",
      "evidence": [
        "tests/example.test.ts"
      ]
    }
  ],
  "validations": [
    {
      "command": "npm test",
      "status": "passed"
    }
  ],
  "completedAt": "2026-08-10T09:55:00+10:00"
}
```

This artifact is the formal handoff between RPIV and Runner.

---

# 36. Completion Reconciliation

A successful RPIV artifact is necessary but not sufficient.

Runner must verify:

```text
result issue == expected issue
result branch == expected branch
result SHA == worktree HEAD

branch exists remotely

PR exists
PR is open
PR base == expected base
PR head == expected branch
PR SHA == expected SHA

required acceptance criteria == verified
required validations == passed
```

Only then may Runner transition to:

```text
completed
```

---

# 37. Recovery

Runner provides:

```bash
soft-factory reconcile 123
soft-factory resume 123
```

Reconciliation compares persisted state with:

* filesystem;
* issue lock;
* Git branch;
* Git worktree;
* tmux session;
* tmux pane;
* running process;
* result artifact;
* remote Git state;
* GitHub pull request.

---

# 38. Duplicate Prevention After Restart

If persisted state says:

```text
running_rpiv
```

and Runner discovers that the expected tmux pane and Copilot process still exist, Runner must preserve the existing process.

It must not launch another RPIV instance.

---

# 39. Stop

```bash
soft-factory stop 123
```

Runner should:

1. request graceful termination;
2. escalate only after timeout;
3. record cancellation;
4. preserve the worktree;
5. preserve terminal output.

---

# 40. Clean

```bash
soft-factory clean 123
```

Cleanup may remove owned:

* tmux window;
* worktree registration;
* worktree directory;
* issue lock.

Cleanup must refuse when:

* the run is active;
* worktree ownership is unclear;
* the worktree contains uncommitted changes;
* recorded ownership does not match observed resources.

Runner must also reconcile completed runs with GitHub. When the expected pull
request is closed as merged and its merged head matches the recorded issue branch
and verified commit, Runner should automatically perform the same guarded cleanup
for the owned worktree and issue lock. A closed but unmerged pull request must not
trigger automatic cleanup. Failure to prove merge or ownership must preserve the
worktree and return an actionable blocked result.

---

# 41. Concurrency

Runner supports explicit concurrent issue execution.

Example:

```bash
soft-factory run --issue 123
soft-factory run --issue 124
soft-factory run --issue 130
```

Configuration:

```yaml
execution:
  max_concurrent_runs: 3
```

Concurrency does not imply automatic issue selection.

Each issue must still be explicitly requested.

---

# 42. Configuration

Example:

```yaml
protocol_version: 1

repository:
  base_branch: main
  worktree_root: .trees
  state_root: .soft-factory

branching:
  pattern: "{type}/{issue_number}-{short_slug}"
  allowed_types:
    - feat
    - fix
    - docs
    - style
    - refactor
    - perf
    - test
    - build
    - ci
    - chore
    - revert

tmux:
  session_pattern: sf-{owner}-{repository}
  window_pattern: "{issue_number}"
  retain_terminal_windows: true

copilot:
  agent: rpiv
  prompt: "Deliver issue #{issue_number}"
  permission_mode: yolo
  require_yolo_acknowledgement: true
  otel_resource_attributes: "project.name={project},issue.id=issue-{issue_number}"

execution:
  max_concurrent_runs: 3
  result_path: .soft-factory/agent-result.json

completion:
  require_pr: true
  require_all_acceptance_criteria_verified: true
```

There is intentionally no issue-selection section.

---

# 43. Functional Requirements

## FR-001 — Discover repository

Runner MUST discover the repository, Git common directory, GitHub owner/repository, default branch, configuration, and protocol version.

---

## FR-002 — Assess repository readiness

Runner MUST expose:

```bash
soft-factory doctor
soft-factory doctor --json
```

---

## FR-003 — Install the official delivery agent

Runner MUST install only `agent:soft-factory` at `.github/agents/soft-factory.agent.md`.

---

## FR-004 — Retire closed historical ownership

Runner MUST recognize only enumerated historical records and retire files only with exact digest proof while preserving siblings.

---

## FR-005 — Install recommended assets

Runner SHOULD support:

```bash
soft-factory install --recommended
```

---

## FR-006 — Protect modified assets

Runner MUST NOT silently overwrite locally modified installed assets.

---

## FR-007 — Explicit issue execution

Runner MUST support:

```bash
soft-factory run --issue <number>
```

Runner MUST NOT automatically select the next issue.

---

## FR-008 — Validate issue readiness

Runner MUST validate the issue before autonomous execution.

---

## FR-009 — Acquire issue ownership

Runner MUST acquire an atomic local issue lock.

---

## FR-010 — Prepare worktree

Runner MUST fetch the configured remote, verify the latest remote default branch,
create a Conventionally typed issue branch from that verified commit, and create
or safely reconcile the expected worktree. Runner MUST block rather than create a
worktree from a stale or unverified base.

---

## FR-011 — Prepare tmux session

Runner MUST create or reuse the deterministic repository tmux session.

---

## FR-012 — Prepare issue window

Runner MUST create one owned tmux window for the issue.

---

## FR-013 — Run visible RPIV execution

Runner MUST launch the configured RPIV agent visibly inside tmux.

---

## FR-014 — Persist state

Runner MUST maintain atomic run snapshots and append-only transition events.

---

## FR-015 — Inspect active runs

Runner MUST provide:

```text
list
status
attach
logs
```

---

## FR-016 — Provide structured status

Runner SHOULD expose:

```bash
soft-factory status <issue> --json
```

for agent consumption.

---

## FR-017 — Detect RPIV completion

Runner MUST capture the RPIV process exit status.

---

## FR-018 — Validate RPIV result

Runner MUST validate the versioned result artifact.

---

## FR-019 — Reconcile Git

Runner MUST ensure reported branch and SHA match local and remote Git state.

---

## FR-020 — Reconcile GitHub

Runner MUST verify that the expected PR exists and matches the expected issue, base branch, head branch, and commit.

---

## FR-021 — Reconcile merged pull requests

Runner MUST detect when the expected pull request is closed as merged, verify the
merged head against the recorded issue branch and commit, and safely remove the
owned worktree and issue lock. Runner MUST preserve the worktree when the pull
request is closed without merge or when merge or ownership evidence is ambiguous.

---

## FR-022 — Explicit terminal states

Every run MUST reach:

```text
completed
failed
blocked
cancelled
interrupted
```

---

## FR-023 — Reconcile interrupted execution

Runner MUST safely reconcile persisted runs after restart.

---

## FR-024 — Stop execution

Runner SHOULD support graceful cancellation.

---

## FR-025 — Clean resources

Runner SHOULD safely clean owned terminal-run resources.

---

## FR-026 — Limit concurrency

Runner MUST enforce configured concurrent-run limits.

---

## FR-027 — Provide the delivery agent

The current catalog and recommended set MUST contain exactly the Soft Factory delivery agent.

---

## FR-028 — Reject removed selectors

Assessor and skill install selectors MUST return stable unsupported CLI behavior.

---

## FR-029 — Preserve migration content

Historical retirement MUST preserve untracked siblings and unrelated content and remove only empty eligible directories.

---

# 44. Acceptance Criteria

## AC-001

Given a compatible repository:

```bash
soft-factory doctor
```

shows all required readiness checks.

---

## AC-002

Given a repository with blockers, Doctor reports the blocking checks and actionable remediation.

---

## AC-003

```bash
soft-factory doctor --json
```

returns a valid versioned structured document.

---

## AC-004

`soft-factory install agent soft-factory` installs the sole agent at `.github/agents/soft-factory.agent.md` and records one current manifest entry.

---

## AC-005

`soft-factory install --recommended` converges to the same inventory and is a no-op when repeated.

---

## AC-006

Removed assessor and skill selectors are unsupported; exact historical ownership may retire only through complete safe convergence.

---

## AC-007

Installation refuses to silently overwrite locally modified assets.

---

## AC-008

Given issue `123` is ready:

```bash
soft-factory run --issue 123
```

creates exactly one compatible run.

---

## AC-009

No automatic next-issue command exists.

---

## AC-010

Two simultaneous attempts to start issue `123` result in exactly one local owner.

---

## AC-011

Distinct issues receive distinct branches, worktrees, locks, and tmux windows.

---

## AC-011A

A new issue branch uses an allowed Conventional Commit type and is created from
the latest fetched remote default-branch commit. Runner blocks worktree creation
when that base cannot be verified.

---

## AC-012

RPIV execution is visible inside the issue tmux window.

---

## AC-013

```bash
soft-factory attach 123
```

attaches to the correct issue without the user knowing tmux identifiers.

---

## AC-014

A zero Copilot exit code without a valid result artifact cannot result in `completed`.

---

## AC-015

A result artifact whose issue, branch, or SHA does not match the run cannot result in `completed`.

---

## AC-016

A pull request that does not match the expected branch and SHA cannot result in `completed`.

---

## AC-017

Runner can reconcile an existing active RPIV process after Runner restart without launching a duplicate.

---

## AC-018

Cleanup refuses to delete a worktree containing uncommitted work by default.

---

## AC-018A

After the expected pull request is merged, Runner removes its clean, owned
worktree and releases its issue lock. A closed-unmerged pull request or ambiguous
merge or ownership evidence leaves the worktree intact.

---

## AC-019

The Delivery Agent performs only the validated instructions, Doctor, and ready-only issue dispatch sequence; Runner remains authoritative and RPIV performs implementation.

---

## AC-020

The delivery agent treats Runner Doctor as the authoritative readiness result and never infers READY independently.

---
# 45. Non-Functional Requirements

## Reliability

* Snapshot writes must be atomic.
* Event history must be append-only.
* State handlers must be idempotent where possible.
* Unknown filesystem resources must never be removed automatically.
* Unknown tmux resources must never be killed automatically.
* Ambiguity must fail safe.

---

## Performance

Under normal conditions:

* `status` should return within 2 seconds;
* `list` should return within 2 seconds for 50 retained runs;
* repository validation should normally complete within 10 seconds excluding external network delays.

---

## Security

* `--yolo` requires explicit acknowledgement.
* Tokens must not be persisted.
* Known credential formats should be redacted from persisted logs.
* Shell commands should use argument arrays where possible.
* File path components must be validated.
* Issue numbers must be validated.
* Remote installed assets must have integrity protection.
* Agent assets must be version compatible.

---

## Maintainability

External systems should be isolated through adapters.

Example:

```text
GitAdapter
GitHubAdapter
TmuxAdapter
CopilotAdapter
FileSystemAdapter
AssetRegistryAdapter
```

Core state logic must be testable without invoking actual GitHub, tmux, or Copilot processes.

---

## Observability

Every transition records:

* timestamp;
* run ID;
* issue;
* previous state;
* next state;
* reason.

Every Copilot process receives:

```text
OTEL_RESOURCE_ATTRIBUTES=project.name=<project>,issue.id=issue-<number>
```

where `<project>` is the resolved repository name and `<number>` is the explicit
GitHub issue number for the run.

Runner must clearly distinguish:

```text
persisted state
observed runtime state
```

---

# 46. MVP Evolution

Runner should be delivered through progressively validating prototypes.

---

## Prototype 1 — Run one issue

Build only enough to prove:

```text
Issue → Worktree → tmux → RPIV
```

Deliver:

* `run --issue`;
* repository validation;
* issue validation;
* issue lock;
* branch;
* worktree;
* tmux session;
* issue window;
* RPIV invocation;
* basic run state;
* `status`;
* `attach`.

Success criterion:

> A developer can run one issue through RPIV in a visible isolated environment.

---

## Prototype 2 — Prove completion

Add:

* RPIV result artifact;
* JSON Schema validation;
* Git reconciliation;
* GitHub reconciliation;
* explicit terminal states;
* JSONL event log.

Success criterion:

> Runner can independently establish whether RPIV genuinely produced the correct PR.

---

## Prototype 3 — Survive reality

Add:

* reconciliation;
* restart recovery;
* resume;
* stop;
* clean;
* multiple simultaneous issues;
* concurrency limits.

Success criterion:

> Runner survives interruption and can safely operate several RPIV runs.

---

## Prototype 4 — Repository Doctor

Add:

```bash
soft-factory doctor
soft-factory doctor --json
```

Success criterion:

> Runner can deterministically determine whether a repository is prepared for Soft Factory.

---

## Prototype 5 — Agent Experience

Add `soft-factory install agent soft-factory` and `soft-factory install --recommended`. Deliver one Copilot project delivery agent, strict schema-v1 ownership, closed legacy retirement, package-coupled versioning, and safe manifest-last installation.

Success criterion:

> A user can install Runner and ask one delivery agent to dispatch exactly one explicit issue without weakening Runner authority.

---
# 47. Recommended User Journey

## Step 1

Install Runner:

```bash
npm install -g soft-factory-runner
```

---

## Step 2

Enter repository:

```bash
cd my-project
```

---

## Step 3

Install agent experience:

```bash
soft-factory install --recommended
```

Output:

```text
✓ Soft Factory delivery agent at .github/agents/soft-factory.agent.md
```

---

## Step 4

Assess repository:

```bash
soft-factory doctor
```

Output:

```text
Soft Factory Runner

✓ Git
✓ GitHub
✓ tmux
✓ Copilot
✓ RPIV
✓ result contract
✓ worktree configuration

READY
```

---

## Step 5

Use directly:

```bash
soft-factory run --issue 123
```

or tell an installed agent:

```text
Deliver issue 123 using Soft Factory.
```

---

## Step 6

The Delivery Agent performs its only authorized dispatch:

```bash
soft-factory run --issue 123 --json
```

Runner responds:

```text
Issue #123

✓ repository validated
✓ issue validated
✓ lock acquired
✓ branch feat/123-add-run-command
✓ worktree .trees/123
✓ tmux window 123
✓ RPIV started

State: running_rpiv

Attach:
soft-factory attach 123
```

---

## Step 7

RPIV performs:

```text
Research
   ↓
Plan
   ↓
Implement
   ↓
Verify
   ↓
Commit
   ↓
Push
   ↓
Create PR
```

---

## Step 8

Runner reconciles:

```text
✓ RPIV result valid
✓ acceptance criteria verified
✓ HEAD abc123def456
✓ branch pushed
✓ PR #456 verified

Issue #123

COMPLETED
PR #456
```

---

# 48. Deferred

The following are intentionally deferred:

* `run --next`;
* autonomous backlog selection;
* automated prioritisation;
* automated PR review;
* review-remediation loops;
* executing pull request merges;
* deployment;
* distributed workers;
* hosted Runner service;
* remote dashboard;
* cross-repository dependencies;
* arbitrary workflow definitions;
* general agent marketplace;
* arbitrary third-party asset installation;
* dynamic sub-agent routing;
* native Windows support outside WSL.

---

# 49. Product Boundary

The central architectural principle of Soft Factory Runner is:

> **Humans may operate the complete Runner CLI. The official Delivery Agent may perform only one validated issue dispatch. Runner remains deterministic.**

The responsibilities are:

```text
Delivery Agent
    │
    │ "Dispatch exactly this explicit issue through Runner."
    ▼

Runner
    │
    │ "What operational action happens next?"
    ▼

RPIV
    │
    │ "How should the software change be delivered?"
    ▼

Code + Verification + Pull Request
```

Runner must remain boring in the best possible way.

It owns:

```text
state
locks
processes
worktrees
tmux
evidence
recovery
```

RPIV owns software-engineering reasoning. The Delivery Agent only validates one explicit issue request and preserves the applicable Runner output.

This boundary should remain intact as the product evolves.

---

# 50. Success Metrics

| Metric                                        | Target |
| --------------------------------------------- | -----: |
| Duplicate active local runs for same issue    |      0 |
| Worktree collisions                           |      0 |
| tmux ownership collisions                     |      0 |
| False successful completions                  |      0 |
| Completed runs containing required evidence   |   100% |
| Recovery scenarios with deterministic outcome |   100% |
| Doctor checks available as structured data    |   100% |
| Delivery Agent bypassing Runner orchestration |      0 |
| Commands needed to start issue delivery       |      1 |

---

# 51. Final Product Definition

**Soft Factory Runner is the deterministic runtime for Soft Factory autonomous delivery.**

It receives an explicit issue.

It prepares a safe isolated environment.

It runs RPIV visibly.

It records what happens.

It survives interruption.

It verifies the result.

It exposes a stable CLI that humans can operate completely while the official Delivery Agent uses only the delivery-only dispatch sequence.

And it deliberately leaves software implementation to RPIV while the optional Delivery Agent handles only one explicit validated issue dispatch.

```text
Human
  ↓
Delivery Agent     ← optional
  ↓
Soft Factory Runner
  ↓
RPIV
  ↓
Pull Request
```
