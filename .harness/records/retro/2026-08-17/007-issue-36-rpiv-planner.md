---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/36-preserve-invoking-tmux-context"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-17T05:50:56.576Z"
agent: "rpiv-planner"
plan_id: "36-preserve-the-invoking-tmux-server-and-session-for-issue-windows"
schema_version: "1.2"
retro_id: "2026-08-17T05:50:56Z-rpiv-planner-bb4f17"
started_at: "2026-08-17T05:30:53.650Z"
ended_at: "2026-08-17T05:51:30.000Z"
summary: "Plan completed the architecture consistency edits after one unavailable-runtime retry."
entries:
  - id: DL-001
    kind: difficulty
    description: "The repository environment has no python executable; architecture edit script failed before writing and must use python3."
    target: tooling
    severity: annoying
    workaround: "Used python3 for deterministic in-place text replacement."
    fp: "bb4f17370bc4"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-17T05:30:53.650Z"
---

# Retro — Issue 36 rpiv-planner

Durable drain of the repository-shared rpiv-planner observation buffer.
