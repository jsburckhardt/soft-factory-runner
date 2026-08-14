---
record_kind: "retro"
harness_version: "0.13.0"
branch: "fix/29-tmux-preparation-diagnostics"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-14T15:07:36.332Z"
agent: "rpiv-implementer"
plan_id: "29-preserve-retryable-tmux-preparation-failures-with-bounded-identity-diagnostics"
schema_version: "1.2"
retro_id: "2026-08-14T15:07:36.332Z-rpiv-implementer-3581e615"
started_at: "2026-08-14T15:07:18.168Z"
ended_at: "2026-08-14T15:07:36.332Z"
summary: "One final evidence-edit command failed safely before writing because its shell separator was encoded incorrectly; the edit was rerun separately."
entries:
  - id: DL-001
    kind: difficulty
    description: "A final evidence-update command encoded the shell separator as literal backslash-n, which appended n plus the next command to Python source and caused a SyntaxError before writing."
    target: "implementation-evidence"
    severity: annoying
    workaround: "Run the Python edit and diff check as separate tool calls instead of embedding an escaped separator."
    suggested_encoding: "Prefer separate tool calls for sequential evidence edits and validation."
    fp: "3581e615c0b7"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T15:07:18.168Z"
---

# Retro — Issue #29 final evidence command

Durable drain of the final Implement evidence-edit observation. Existing verifier records and summaries remain untouched.
