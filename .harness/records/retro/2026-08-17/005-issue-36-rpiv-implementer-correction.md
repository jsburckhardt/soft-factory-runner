---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/36-preserve-invoking-tmux-context"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-17T02:52:41.647Z"
agent: "rpiv-implementer"
plan_id: "36-preserve-the-invoking-tmux-server-and-session-for-issue-windows"
schema_version: "1.2"
retro_id: "2026-08-17T02:52:41Z-rpiv-implementer-0266817bd5b9"
started_at: "2026-08-17T02:28:24.467Z"
ended_at: "2026-08-17T02:52:41.647Z"
summary: "The one correction cycle replaced missing acceptance proof, corrected live attach and Doctor inventory behavior, repaired stale v6 documentation, and passed focused/full validation after concrete environment, fixture, documentation, and formatting retries."
entries:
  - id: DL-001
    kind: difficulty
    description: "Repository environment exposes python3 but not the python command used for a source edit retry."
    target: tooling
    severity: annoying
    workaround: "Retried source edits with python3."
    suggested_encoding: "Document or expose one stable scripting interpreter command."
    fp: "1f4da646754d"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-17T02:28:24.467Z"
  - id: DL-002
    kind: difficulty
    description: "The available python3 runtime unexpectedly lacks the standard json module, requiring a Node-based fixture edit retry."
    target: tooling
    severity: annoying
    workaround: "Used Node JSON parsing for the fixture edit."
    suggested_encoding: "Provide a harness JSON edit utility or a complete Python runtime."
    fp: "b45d40943a68"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-17T02:31:43.547Z"
  - id: DL-003
    kind: difficulty
    description: "Focused validation exposed stale documentation assertions and new isolated fixture failures after v6 evidence expansion; inspect and backtrack each failure."
    target: project
    severity: degrading
    workaround: "Inspected bounded failures, updated v6 assertions, and corrected fixture cleanup."
    suggested_encoding: "Keep v6 documentation examples and assertions under one generated schema fixture."
    fp: "6ef533188091"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-17T02:36:30.988Z"
  - id: DL-004
    kind: difficulty
    description: "Targeted correction validation found list-panes session scoping, stale standalone socket cleanup, and an incomplete v6 PRD example; each required a specific fixture/doc retry."
    target: project
    severity: degrading
    workaround: "Used all-pane inventory, removed stale socket files, and completed the documented v6 target."
    suggested_encoding: "Add reusable isolated tmux inventory and cleanup helpers."
    fp: "2e21faba6949"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-17T02:38:47.937Z"
  - id: DL-005
    kind: difficulty
    description: "Full harness validation failed only on Prettier for four correction files; formatter repair and full-gate retry were required."
    target: tooling
    severity: degrading
    workaround: "Formatted the four named files and reran harness and direct full validation."
    suggested_encoding: "Expose a root just formatting repair recipe beside format-check."
    fp: "0266817bd5b9"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-17T02:48:22.442Z"
---

# Retro — Issue 36 Implement correction

Scaffolded by `harness record retro --slug issue-36-rpiv-implementer-correction --json`; every pending Implement observation is preserved above.
