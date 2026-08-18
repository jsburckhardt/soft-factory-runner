---
record_kind: "retro"
harness_version: "0.13.0"
branch: "fix/44-complete-live-cleanup-retries-after-tmux-removal"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-18T11:17:58.605Z"
agent: "rpiv-research"
plan_id: "44-complete-live-cleanup-retries-after-exact-tmux-target-removal"
schema_version: "1.2"
retro_id: "2026-08-18T11:17:58.605Z-rpiv-research-e52e429aed74"
started_at: "2026-08-18T10:10:22.204Z"
ended_at: "2026-08-18T11:17:58.605Z"
summary: "Persisted 3 concrete rpiv-research workflow friction observation(s) for Issue 44."
entries:
  - id: DL-001
    kind: difficulty
    description: "Repository search command rg is unavailable; used grep and targeted file inspection instead."
    target: tooling
    severity: degrading
    workaround: "Used grep and targeted file reads."
    suggested_encoding: "Provide a repository search recipe or install the documented search tool."
    fp: "e52e429aed74"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-18T10:10:22.204Z"
  - id: DL-002
    kind: difficulty
    description: "Requested live Sparkta snapshot, events, lock, lease, worktree, and tmux target were not mounted; only GitHub facts and issue-supplied runtime facts were available."
    target: tooling
    severity: degrading
    workaround: "Scoped research conclusions to repository and supplied facts."
    suggested_encoding: "Expose a read-only local runtime evidence inventory when live-state research is required."
    fp: "731fa4bff7f3"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-18T10:19:19.882Z"
  - id: DL-003
    kind: difficulty
    description: "Research artifact write failed because the python executable is unavailable; retried with the installed node runtime."
    target: tooling
    severity: degrading
    workaround: "Rewrote the artifact command with Node.js."
    suggested_encoding: "Document one guaranteed repository scripting runtime."
    fp: "472415ec8afe"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-18T10:24:28.425Z"
---

# Retro — Issue 44 rpiv-research

All pending observations were retained from the stage buffer.
