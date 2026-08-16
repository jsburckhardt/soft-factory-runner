---
record_kind: "retro"
harness_version: "0.13.0"
branch: "fix/5-reconcile-successful-terminal-result"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-15T22:29:38.979Z"
agent: "rpiv-research"
plan_id: "5-phase-3-recover-safely-and-run-distinct-issues-concurrently"
schema_version: "1.2"
retro_id: "2026-08-15T22:29:38Z-rpiv-research-issue5"
started_at: "2026-08-15T21:58:42Z"
ended_at: "2026-08-15T22:29:50Z"
summary: "Research completed with portable command fallbacks and corrected one path-transcription mistake without changing findings."
entries:
  - id: DL-001
    kind: difficulty
    description: "Repository investigation command failed because ripgrep is unavailable; used recursive grep fallback."
    target: tooling
    severity: annoying
    workaround: "Used recursive grep with bounded patterns."
    suggested_encoding: "Expose a repository search command with a portable fallback."
    fp: "61cd18b73a3b"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-15T21:58:42.493Z"
  - id: CONF-001
    kind: confusion
    description: "A prior repository file listing showed issue-31 work-item artifacts, but a later direct lookup found the directory absent; continued using commit history and current source."
    target: project
    severity: annoying
    workaround: "Rechecked the exact directory name and current source."
    suggested_encoding: "Prefer copying resolved paths from deterministic file search output."
    fp: "609c21feaa95"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-15T22:00:23.850Z"
  - id: INS-001
    kind: insight
    description: "Correction to CONF-001: the lookup omitted the '-under-semver-governance' suffix; repository listing was consistent and the friction was my path transcription error."
    target: project
    severity: annoying
    workaround: "Corrected the path and retained the accurate repository finding."
    suggested_encoding: "Expose resolved work-item paths as machine-readable context."
    fp: "7f14d49e15dd"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-15T22:00:54.650Z"
  - id: DL-002
    kind: difficulty
    description: "Research artifact write command failed because the 'python' executable is unavailable; retried with the installed python3 executable."
    target: tooling
    severity: annoying
    workaround: "Retried with python3."
    suggested_encoding: "Use python3 explicitly in repository examples."
    fp: "82f0c4443ee6"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-15T22:01:55.716Z"
---

# Retro — Issue 5 rpiv-research

All pending rpiv-research observations were preserved before clearing the transient buffer.
