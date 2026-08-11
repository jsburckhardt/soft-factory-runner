---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/3-run-isolated-visible"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-11T08:38:49.496Z"
agent: "rpiv-implementer"
plan_id: "3-phase-1-run-one-issue-in-an-isolated-visible-environment"
schema_version: "1.2"
retro_id: "2026-08-11T08:38:49Z-rpiv-implementer-80c644cca131"
started_at: "2026-08-11T08:28:38Z"
ended_at: "2026-08-11T08:39:00Z"
summary: "The Issue #3 correction tightened live GitHub proof parsing and repaired repository-local command documentation; three concrete tooling/editing retries were worked around without changing architecture or scope."
entries:
  - id: DL-001
    kind: difficulty
    description: "The expected repository search utility rg was unavailable (exit 127), requiring grep fallback during correction audit."
    target: tooling
    severity: annoying
    workaround: "Used grep with bounded file and pattern arguments to complete the parser and documentation audit."
    suggested_encoding: "Expose a repository search recipe or document grep as the guaranteed fallback in the harness briefing."
    fp: "80c644cca131"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-11T08:30:57.310Z"
  - id: DL-002
    kind: difficulty
    description: "The correction edit command assumed a python executable, but only python3 is available; the edit did not apply and had to be retried."
    target: tooling
    severity: annoying
    workaround: "Retried the unchanged edit with the available python3 executable and reviewed the resulting file."
    suggested_encoding: "Document python3, rather than python, in repository-local agent editing examples."
    fp: "1c3990afa634"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-11T08:33:09.832Z"
  - id: DL-003
    kind: difficulty
    description: "The first scripted parser replacement matched the return-type brace instead of the function end and left the old blocker body duplicated; review caught it before validation and required a surgical cleanup."
    target: tooling
    severity: annoying
    workaround: "Inspected the edited range, removed only the duplicated legacy body, formatted the file, and ran targeted validation."
    suggested_encoding: "Prefer syntax-aware edits or anchor structural replacements to complete function boundaries instead of the first closing brace."
    fp: "2bca7b76d34f"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-11T08:34:07.684Z"
---

# Retro — Issue 3 Implement correction cycle

Correction-cycle observations were persisted after focused and full validation and before clearing the transient Implement buffer.
