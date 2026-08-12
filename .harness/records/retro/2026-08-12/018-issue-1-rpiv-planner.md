---
record_kind: "retro"
harness_version: "0.13.0"
branch: "copilot-fix"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-12T12:07:59.085Z"
agent: "rpiv-planner"
plan_id: "1-deliver-the-soft-factory-runner-mvp"
schema_version: "1.2"
retro_id: "2026-08-12T12:00:16Z-rpiv-planner-0aed2822b739"
started_at: "2026-08-12T12:00:16.755Z"
ended_at: "2026-08-12T12:02:22.199Z"
summary: "Planning retried malformed artifact writing and corrected command-forwarding and shell-safety issues discovered during dry runs."
entries:
  - id: DL-001
    kind: difficulty
    description: "The first bulk base64 plan write failed because the generated command payload was malformed; no files were written and the write must be retried with smaller verified payloads."
    target: tooling
    severity: degrading
    workaround: "Retried with smaller independently verified file payloads."
    suggested_encoding: "Provide a structured multi-file artifact writer."
    fp: "0aed2822b739"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T12:00:16.755Z"
  - id: INS-001
    kind: insight
    description: "Dry-running TEST-3 exposed an extra npm separator when forwarding a standalone double dash through the just test recipe; omit that separator so Jest receives runInBand correctly."
    target: plan
    severity: annoying
    workaround: "Passed Jest arguments directly through the variadic just test recipe."
    suggested_encoding: "Add a root recipe example for forwarding test arguments."
    fp: "72f49c4a6399"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T12:02:15.178Z"
  - id: DL-002
    kind: difficulty
    description: "The first friction-capture retry was blocked because Markdown-style backticks in the description were interpreted as unsafe shell command substitution; retrying with plain text succeeded."
    target: tooling
    severity: annoying
    workaround: "Used plain text in the observation description."
    suggested_encoding: "Document safe quoting for harness observation text."
    fp: "3a6ce5ae22ff"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T12:02:22.199Z"
---

# Retro — Issue 1 Plan

Preserves all pending Plan observations for the Issue 1 implementation handoff.
