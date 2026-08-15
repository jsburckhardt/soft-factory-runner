---
record_kind: "retro"
harness_version: "0.13.0"
branch: "fix/31-portable-tmux-identity"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-15T02:12:44.494Z"
agent: "rpiv-planner"
plan_id: "31-support-locale-compatible-tmux-identities-and-release-0-1-1-under-semver-governance"
schema_version: "1.2"
retro_id: "2026-08-15T02:12:44.494Z-rpiv-planner-2c3e8f8c9c57"
started_at: "2026-08-15T00:52:12.899Z"
ended_at: "2026-08-15T02:13:45.179Z"
summary: "Persisted 6 concrete Issue #31 Plan friction observations before implementation handoff; every entry is retained with disposition kept."
entries:
  - id: "DL-001"
    kind: "difficulty"
    description: "The repository lacks rg, so three planned source searches failed and require grep-based retries."
    fp: "2c3e8f8c9c57"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-15T00:52:12.899Z"
  - id: "DL-002"
    kind: "difficulty"
    description: "Broad version grep hit the special .devcontainer/.tmux-shared path, so exact tracked inventory needs a git-grep retry."
    fp: "01d0af388081"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-15T00:56:28.233Z"
  - id: "DL-003"
    kind: "difficulty"
    description: "Architecture writes failed because only python3/node are installed under expected tool names; retrying with node file writes."
    fp: "aedba73e3e31"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-15T01:04:37.779Z"
  - id: "DL-004"
    kind: "difficulty"
    description: "A Doctor architecture grep used unescaped interval braces and failed, requiring fixed-string retries before editing."
    fp: "7713b9e077bc"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-15T01:08:01.053Z"
  - id: "DL-005"
    kind: "difficulty"
    description: "The first coverage validator undercounted final task/test blocks because JavaScript regex lacks a \\Z anchor; coverage needs a corrected retry."
    fp: "d14f952803d0"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-15T01:13:58.466Z"
  - id: "COORD-001"
    kind: "coordination"
    description: "Direct focused validation failed because a documentation test pins the pre-Plan tmux token sentence; Plan must preserve truthful legacy wording while Implement updates the assertion."
    fp: "2f0fb8512740"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-15T01:15:57.401Z"
---

# Retro — Issue #31 Plan friction

Generated from the repository-shared pending observation buffer before implementation notes were written.
