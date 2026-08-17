---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/36-preserve-invoking-tmux-context"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-17T05:50:56.705Z"
agent: "rpiv-implementer"
plan_id: "36-preserve-the-invoking-tmux-server-and-session-for-issue-windows"
schema_version: "1.2"
retro_id: "2026-08-17T05:50:56Z-rpiv-implementer-4ba538"
started_at: "2026-08-17T05:39:58.956Z"
ended_at: "2026-08-17T05:51:30.000Z"
summary: "Implement corrected current documentation and assertions, with one expected preflight failure and two unavailable-tool retries before all focused and full gates passed."
entries:
  - id: DL-001
    kind: difficulty
    description: "Pre-implementation harness boot reached the exact CLI signal but composed full checks failed on the known stale documentation contract before T2 edits."
    target: tooling
    severity: annoying
    workaround: "Applied the planned documentation assertion correction and reran focused and full validation successfully."
    fp: "4ba538402d87"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-17T05:39:58.956Z"
  - id: DL-002
    kind: difficulty
    description: "Repository search recipes assumed ripgrep, but rg is unavailable; equivalent current-contract scans must use grep/find instead."
    target: tooling
    severity: annoying
    workaround: "Used grep and find for equivalent current-contract scans."
    fp: "4e8bc1dfac36"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-17T05:41:13.930Z"
  - id: DL-003
    kind: difficulty
    description: "The first scripted edit attempt used python, but this Node repository image has no python executable; implementation retried with Node."
    target: tooling
    severity: annoying
    workaround: "Used Node for deterministic in-place text replacement."
    fp: "33172d1c1fbd"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-17T05:42:32.925Z"
---

# Retro — Issue 36 rpiv-implementer

Durable drain of the repository-shared rpiv-implementer observation buffer.
