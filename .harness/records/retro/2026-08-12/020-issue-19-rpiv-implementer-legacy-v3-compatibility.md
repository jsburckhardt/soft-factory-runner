---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/19-rpiv-progress-and-instructions"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-12T11:12:52.808Z"
agent: "rpiv-implementer"
plan_id: "19-define-rpiv-progress-final-result-ownership-and-integration-instructions"
schema_version: "1.2"
retro_id: "2026-08-12T11:12:52Z-rpiv-implementer-41b6c4129ca4"
started_at: "2026-08-12T10:57:25.212Z"
ended_at: "2026-08-12T11:12:52.808Z"
summary: "Repairing completed V3 result compatibility required command fallbacks, explicit fixture backtracking, one failed scripted edit retry, and a full-gate formatting retry before all targeted and repository gates passed."
entries:
  - id: DL-001
    kind: difficulty
    description: "Repository inspection commands using rg failed with exit 127 because ripgrep is unavailable; retried searches with grep."
    target: tooling
    severity: annoying
    workaround: "Repeated repository searches with grep."
    suggested_encoding: "Expose one guaranteed repository search command or document grep as the available fallback."
    fp: "b7f420359da2"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T10:57:25.212Z"
  - id: DL-002
    kind: difficulty
    description: "The first scripted source edit failed with exit 127 because only python3, not python, is installed; retried without changing files."
    target: tooling
    severity: annoying
    workaround: "Retried the deterministic edit with python3."
    suggested_encoding: "Align documented executable availability with the shell image or expose a harness edit verb."
    fp: "f87a8666168e"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T11:01:51.589Z"
  - id: DL-003
    kind: difficulty
    description: "The first targeted compatibility run failed 11 tests because existing V2/V3 fixtures embedded the post-v4 AgentResult shape; backtracked fixtures to explicit base-valid legacy results."
    target: project
    severity: degrading
    workaround: "Introduced typed historical AgentResult fixtures and reran migration, completion, and recovery suites."
    suggested_encoding: "Keep a canonical base-version V2/V3 completed snapshot fixture that is parsed by the historical schema."
    fp: "7a7a22ee3949"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T11:03:54.146Z"
  - id: DL-004
    kind: difficulty
    description: "A scripted test-organization edit failed with a Python syntax error before writing; retried with line-based edits and verified the surrounding braces."
    target: tooling
    severity: annoying
    workaround: "Used a smaller line-based edit and read back the modified test block."
    suggested_encoding: "Provide a structured repository edit verb with syntax validation before file replacement."
    fp: "5493439c5c3e"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T11:05:57.192Z"
  - id: DL-005
    kind: difficulty
    description: "The first full harness gate failed at format-check for four edited TypeScript files; applied repository Prettier formatting and reran the prescribed full gate."
    target: tooling
    severity: annoying
    workaround: "Formatted the named files with the repository Prettier installation and reran full harness and direct validation."
    suggested_encoding: "Expose a root justfile formatting recipe alongside format-check."
    fp: "41b6c4129ca4"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T11:10:34.155Z"
---

# Retro — Issue 19 completed V3 result compatibility correction

The structured entries preserve every pending implementer observation captured during this correction cycle.
