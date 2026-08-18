---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/36-preserve-invoking-tmux-context"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-17T02:02:14.416Z"
agent: "rpiv-research"
plan_id: "36-preserve-the-invoking-tmux-server-and-session-for-issue-windows"
schema_version: "1.2"
retro_id: "2026-08-17T02:02:30Z-rpiv-research-issue36"
started_at: "2026-08-17T00:45:30.130Z"
ended_at: "2026-08-17T02:02:30Z"
summary: "Issue 36 research completed with concrete tooling and validation backtracking preserved from the transient observation buffer."
entries:
  - id: DL-001
    kind: difficulty
    description: "Repository reference search failed because ripgrep (rg) is not installed; using git grep and grep instead."
    target: tooling
    severity: annoying
    workaround: "Used the recorded fallback or repaired the identified validation failure, then reran the authoritative check."
    suggested_encoding: "Keep deterministic tracked-file searches and full lint/format/type gates available earlier in focused workflows."
    fp: "938f1c734680"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-17T00:45:30.130Z"
  - id: DL-002
    kind: difficulty
    description: "Research artifact write command failed because python is unavailable; retrying with the installed python3 executable."
    target: tooling
    severity: annoying
    workaround: "Used the recorded fallback or repaired the identified validation failure, then reran the authoritative check."
    suggested_encoding: "Keep deterministic tracked-file searches and full lint/format/type gates available earlier in focused workflows."
    fp: "3cbe64b033cf"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-17T00:45:30.130Z"
  - id: CONF-001
    kind: confusion
    description: "Acceptance validation with python3 unexpectedly failed because the standard-library json module was unavailable; backtracking to Node.js validation."
    target: tooling
    workaround: "Used the recorded fallback or repaired the identified validation failure, then reran the authoritative check."
    suggested_encoding: "Keep deterministic tracked-file searches and full lint/format/type gates available earlier in focused workflows."
    fp: "93594b902733"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-17T00:45:30.130Z"
---

# Retro — Issue 36 research

All pending rpiv-research observations were preserved before the stage buffer was cleared.
