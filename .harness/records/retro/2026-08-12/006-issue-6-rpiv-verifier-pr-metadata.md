---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/6-diagnose-repository-readiness"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-12T02:30:18.168Z"
agent: "rpiv-verifier"
plan_id: "6-phase-4-diagnose-repository-readiness"
schema_version: "1.2"
retro_id: "2026-08-12T02:30:18Z-rpiv-verifier-a78d296598c4"
started_at: "2026-08-12T02:29:18.227Z"
ended_at: "2026-08-12T02:30:18.168Z"
summary: "Pull request metadata required read-back correction and one safer command retry before final publication."
entries:
  - id: DL-001
    kind: difficulty
    description: "PR body read-back exposed generated metadata typos and required one correction before closeout."
    target: doc
    severity: annoying
    workaround: "Corrected the generated PR body and read it back again before final publication."
    suggested_encoding: "Add deterministic PR-body validation for malformed table rows and known command names."
    fp: "9640acc74a20"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T02:29:18.227Z"
  - id: DL-002
    kind: difficulty
    description: "A PR metadata correction command was blocked because shell backticks in Python replacement text were treated as unsafe expansion, requiring a safer retry."
    target: tooling
    severity: annoying
    workaround: "Retried with character-code construction so the shell command contained no backtick expansion."
    suggested_encoding: "Provide a first-class metadata file edit operation that does not pass Markdown through a shell."
    fp: "b1bca816d1ad"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T02:29:38.631Z"
---

# Retro — Issue 6 rpiv-verifier PR metadata

Durable read-back-before-clear drain of the final PR publication observations.
