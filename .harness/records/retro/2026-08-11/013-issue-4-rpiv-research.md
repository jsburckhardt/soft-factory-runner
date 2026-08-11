---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/4-prove-completion"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-11T12:55:03.005Z"
agent: "rpiv-research"
plan_id: "4-phase-2-prove-completion-with-reconciled-evidence"
schema_version: "1.2"
retro_id: "2026-08-11T12:55:03Z-rpiv-research-db13c82d84a3"
started_at: "2026-08-11T12:21:05.173Z"
ended_at: "2026-08-11T12:55:03.005Z"
summary: "Research completed after bounded-read and missing-command retries; all four observations are retained for tooling improvement."
entries:
  - id: DL-001
    kind: difficulty
    description: "AGENTS.md exceeded the view tool size limit and required targeted ranged reads."
    target: tooling
    severity: annoying
    workaround: "Read the file in targeted ranges."
    suggested_encoding: "Expose large-file section maps before reads."
    fp: "db13c82d84a3"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-11T12:21:05.173Z"
  - id: DL-002
    kind: difficulty
    description: "PRD.md exceeded the view tool size limit and required targeted ranged reads."
    target: tooling
    severity: annoying
    workaround: "Read the PRD in targeted ranges."
    suggested_encoding: "Expose large-file section maps before reads."
    fp: "5b0384f60847"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-11T12:21:51.492Z"
  - id: DL-003
    kind: difficulty
    description: "The repository environment lacks rg, so planned symbol and PRD searches failed and required grep retries."
    target: tooling
    severity: annoying
    workaround: "Retried searches with grep."
    suggested_encoding: "Provide ripgrep or advertise grep as the available search command."
    fp: "a9dee26f6199"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-11T12:22:14.445Z"
  - id: DL-004
    kind: difficulty
    description: "The research artifact write failed because python is unavailable; retrying with the installed python3 executable."
    target: tooling
    severity: annoying
    workaround: "Retried artifact generation with python3."
    suggested_encoding: "Advertise the installed interpreter name in orientation."
    fp: "1cc4d10f360f"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-11T12:24:51.587Z"
---

# Retro — Issue 4 Research

Durable Research-stage observations drained before implementation commit.
