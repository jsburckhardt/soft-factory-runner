---
record_kind: "retro"
harness_version: "0.13.0"
branch: "copilot-fix"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-12T10:01:13.173Z"
agent: "rpiv-implementer"
plan_id: "1-deliver-the-soft-factory-runner-mvp"
schema_version: "1.2"
retro_id: "2026-08-12T10:01:13Z-rpiv-implementer-33b2dade1b93"
started_at: "2026-08-12T09:48:09.627Z"
ended_at: "2026-08-12T10:01:13.173Z"
summary: "Implementation completed after recovering persisted planning evidence and resolving dependency, interpreter, and macOS temporary-path validation friction."
entries:
  - id: DL-001
    kind: difficulty
    description: "Full validation under the canonical TMPDIR workaround deleted the active checkout, including untracked Plan artifacts and the RPIV observation buffer. The tracked repository was recovered at the original base commit from origin, but the untracked work-item artifacts cannot be reconstructed exactly."
    target: tooling
    severity: blocking
    workaround: "Recovered the tracked checkout and retried after Research and Plan evidence had been committed."
    suggested_encoding: "Encode deterministic dependency setup and canonical temporary-path handling in the harness."
    fp: "33b2dade1b93"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T09:48:09.627Z"
  - id: DL-002
    kind: difficulty
    description: "Harness boot failed because dependencies were not installed and tsc was unavailable; root setup was required."
    target: tooling
    severity: degrading
    workaround: "Ran the root setup recipe before retrying harness boot."
    suggested_encoding: "Encode deterministic dependency setup and canonical temporary-path handling in the harness."
    fp: "0f041d74f37f"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T09:52:18.111Z"
  - id: DL-003
    kind: difficulty
    description: "After root setup, harness boot reached full checks but Jest coverage failed because ts-jest could not resolve jest-util."
    target: tooling
    severity: degrading
    workaround: "Restored the missing ignored top-level jest-util link from the installed Jest tree."
    suggested_encoding: "Encode deterministic dependency setup and canonical temporary-path handling in the harness."
    fp: "c268b17356b2"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T09:53:34.072Z"
  - id: DL-004
    kind: difficulty
    description: "Harness boot full checks reached tests but unrelated real Git integration cases timed out and lost worktree registration; retry was needed without source changes."
    target: tooling
    severity: degrading
    workaround: "Retried validation without changing product source."
    suggested_encoding: "Encode deterministic dependency setup and canonical temporary-path handling in the harness."
    fp: "6bffd08a5f46"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T09:55:42.176Z"
  - id: DL-005
    kind: difficulty
    description: "The planned one-off file edit initially assumed a python executable, but this environment only provided Node; the edit was retried with Node."
    target: tooling
    severity: degrading
    workaround: "Used the available Node runtime for the deterministic text replacement."
    suggested_encoding: "Encode deterministic dependency setup and canonical temporary-path handling in the harness."
    fp: "962f6f71dec2"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T09:57:36.806Z"
  - id: DL-006
    kind: difficulty
    description: "Focused validation consistently failed because macOS TMPDIR used /var while Git reported canonical /private/var worktree paths; validation needed a canonical TMPDIR environment."
    target: tooling
    severity: degrading
    workaround: "Ran root and harness validation with TMPDIR canonicalized to /private/var."
    suggested_encoding: "Encode deterministic dependency setup and canonical temporary-path handling in the harness."
    fp: "e1c91bfea4fe"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T09:58:35.811Z"
---

# Retro — Issue 1 RPIV Implementer

Tracked implementation-stage friction drained before implementation handoff.
