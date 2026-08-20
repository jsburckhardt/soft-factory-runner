---
record_kind: "retro"
harness_version: "0.13.0"
branch: "issue-46-stable-0.2.1"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-20T07:15:38.137Z"
agent: "rpiv-implementer"
plan_id: "46-promote-0-2-1-beta-3-to-stable-0-2-1"
schema_version: "1.2"
retro_id: "2026-08-20T07:15:38.137Z-rpiv-implementer-9b65652f8e6e"
started_at: "2026-08-20T07:04:11.184Z"
ended_at: "2026-08-20T07:16:14.623Z"
summary: "Issue 46 rpiv-implementer observations were drained after durable capture; all 7 concrete entries are retained for Verify harvest."
entries:
  - id: "DL-001"
    kind: "difficulty"
    description: "Repository-wide grep crossed .devcontainer/.tmux-shared and emitted a device error, requiring a tracked-files-only retry for finite version inventory."
    target: "tooling"
    severity: "annoying"
    fp: "9b65652f8e6e"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-20T07:04:11.184Z"
  - id: "DL-002"
    kind: "difficulty"
    description: "Combined tracked version-occurrence inventory exceeded the terminal output limit and was redirected by the tool, requiring scoped path-by-path queries."
    target: "tooling"
    severity: "annoying"
    fp: "e8e0f47f25a3"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-20T07:04:42.036Z"
  - id: "DL-003"
    kind: "difficulty"
    description: "The expected apply_patch editing helper is unavailable in this environment, so repository edits require a direct scripted file API instead."
    target: "tooling"
    severity: "annoying"
    fp: "e95071dfeb5d"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-20T07:06:27.249Z"
  - id: "DL-004"
    kind: "difficulty"
    description: "Python is not installed for the scripted-edit fallback after apply_patch was unavailable, requiring a second backtrack to the repository Node.js runtime."
    target: "tooling"
    severity: "annoying"
    fp: "dd0fc673faca"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-20T07:06:48.986Z"
  - id: "DL-005"
    kind: "difficulty"
    description: "The first Node.js scripted-edit attempt failed before writing because the helper used reserved identifier new; the edit must be retried with corrected syntax."
    target: "tooling"
    severity: "annoying"
    fp: "6a539eef3d66"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-20T07:07:03.590Z"
  - id: "INS-001"
    kind: "insight"
    description: "The combined documentation diff also exceeded the terminal output limit, confirming that review must stay file-scoped instead of using one aggregate diff."
    target: "tooling"
    severity: "annoying"
    fp: "ed6566b94202"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-20T07:07:48.303Z"
  - id: "DL-006"
    kind: "difficulty"
    description: "The first full harness gate failed at the root format-check because two edited test files needed Prettier normalization; focused Jest and diff hygiene did not expose formatting."
    target: "tooling"
    severity: "degrading"
    fp: "a6cb43f43c68"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-20T07:12:37.827Z"
---

# Retro — Issue 46 rpiv-implementer

Durable pre-verification friction captured for the stable 0.2.1 promotion.
