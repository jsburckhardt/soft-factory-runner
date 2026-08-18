---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/36-preserve-invoking-tmux-context"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-17T05:50:56.237Z"
agent: "rpiv-research"
plan_id: "36-preserve-the-invoking-tmux-server-and-session-for-issue-windows"
schema_version: "1.2"
retro_id: "2026-08-17T05:50:56Z-rpiv-research-b829ae"
started_at: "2026-08-17T05:16:52.745Z"
ended_at: "2026-08-17T05:51:30.000Z"
summary: "Research completed the consistency audit after deterministic tool and file-writing retries, preserving all four captured observations."
entries:
  - id: DL-001
    kind: difficulty
    description: "Repository-wide search initially failed because rg is unavailable; used grep/find fallback."
    target: tooling
    severity: annoying
    workaround: "Used grep and find for the repository-wide audit."
    fp: "b829ae852cfe"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-17T05:16:52.745Z"
  - id: DL-002
    kind: difficulty
    description: "Documentation audit fallback using python failed because python is unavailable; retried with python3."
    target: tooling
    severity: annoying
    workaround: "Retried the audit script with python3."
    fp: "d5155f2e3c98"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-17T05:18:39.755Z"
  - id: DL-003
    kind: difficulty
    description: "Base64 research-brief write produced corrupted trailing content; inspected the file and backtracked to rewrite it safely."
    target: tooling
    severity: degrading
    workaround: "Inspected the corrupted artifact and rewrote it with a safer method."
    fp: "b94f65272029"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-17T05:25:05.037Z"
  - id: DL-004
    kind: difficulty
    description: "Acceptance comparison via python3 failed because the environment could not import the standard json module; retried with Node."
    target: tooling
    severity: annoying
    workaround: "Used Node to compare the acceptance data."
    fp: "be9e7b18fe89"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-17T05:26:20.091Z"
---

# Retro — Issue 36 rpiv-research

Durable drain of the repository-shared rpiv-research observation buffer.
