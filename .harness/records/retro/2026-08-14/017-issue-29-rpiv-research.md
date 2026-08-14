---
record_kind: "retro"
harness_version: "0.13.0"
branch: "fix/29-tmux-preparation-diagnostics"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-14T11:58:54.368Z"
agent: "rpiv-research"
plan_id: "29-preserve-retryable-tmux-preparation-failures-with-bounded-identity-diagnostics"
schema_version: "1.2"
retro_id: "2026-08-14T11:58:54.368Z-rpiv-research-caad3949"
started_at: "2026-08-14T10:16:44.349Z"
ended_at: "2026-08-14T11:58:54.368Z"
summary: "7 pending rpiv-research observations were drained after Issue #29 AC-10 implementation and validation."
entries:
  - id: DL-001
    kind: difficulty
    description: "Repository search attempted with rg, but rg is unavailable; retrying Doctor and tmux discovery with grep."
    severity: annoying
    fp: "caad3949dcee"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T10:16:44.349Z"
  - id: DL-002
    kind: difficulty
    description: "The local tmux man page is unavailable, so isolated-server semantics require a public upstream documentation lookup."
    severity: annoying
    fp: "70a88ebd5152"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T10:21:56.239Z"
  - id: DL-003
    kind: difficulty
    description: "The upstream tmux documentation pipeline ended with curl 23 when head closed early; retrying targeted sections without an early-closing pipe."
    severity: annoying
    fp: "ff0d1575fb64"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T10:22:52.209Z"
  - id: DL-004
    kind: difficulty
    description: "Targeted docs parsing used unavailable Python; first observation attempt was tool-blocked by punctuation, so this retry records both and switches parsing to Node.js."
    severity: annoying
    fp: "ff8391fc4ecd"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T10:23:17.926Z"
  - id: INS-001
    kind: insight
    description: "Research inference: Doctor command timeout controls only the spawned tmux client; the current runner exposes no server PID or cleanup handle, so timeout alone cannot prove isolated server cleanup."
    severity: degrading
    fp: "d6270ceb2913"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T10:25:35.061Z"
  - id: INS-002
    kind: insight
    description: "Research inference: Doctor's 9-second Promise.race clears only its timer and does not cancel evaluate, so an aggregate timeout does not itself prove that in-flight probe or cleanup work has stopped."
    severity: degrading
    fp: "c429094452c8"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T10:25:45.298Z"
  - id: INS-003
    kind: insight
    description: "Missing proof found: the built Doctor ready fixture uses a no-op tmux executable, so current readiness tests prove executable presence but no session, window, pane, format, observation, or cleanup behavior."
    severity: degrading
    fp: "251ad8436a09"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T10:26:21.391Z"
---

# Retro — Issue #29 rpiv-research

Durable pre-verification drain of the complete transient observation buffer.
