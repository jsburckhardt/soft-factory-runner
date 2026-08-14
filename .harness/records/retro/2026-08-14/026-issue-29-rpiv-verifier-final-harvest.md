---
record_kind: "retro"
harness_version: "0.13.0"
branch: "fix/29-tmux-preparation-diagnostics"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-14T13:35:31.720Z"
agent: "rpiv-verifier"
plan_id: "29-preserve-retryable-tmux-preparation-failures-with-bounded-identity-diagnostics"
schema_version: "1.2"
retro_id: "2026-08-14T13:35:31.720Z-rpiv-verifier-cb6cf8dd"
started_at: "2026-08-14T13:35:21.052Z"
ended_at: "2026-08-14T13:35:31.720Z"
summary: "The final post-drain retro harvest required one concrete diagnostic parser retry, which was persisted before the verifier buffer was cleared again."
entries:
  - id: DL-001
    kind: difficulty
    description: "The compact final retro-harvest diagnostic failed because the available python3 could not import its standard json module; the successful full harness harvest had to be retried with Node for concise extraction."
    target: "tooling"
    severity: annoying
    workaround: "Parse the harness JSON envelope with node instead of python3."
    suggested_encoding: "Add a compact summary option to harness retro insights."
    fp: "cb6cf8dd90dd"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T13:35:21.052Z"
---

# Retro — Issue #29 rpiv-verifier final harvest

Durable drain of the final harvest retry observed after the first verifier buffer clear.
