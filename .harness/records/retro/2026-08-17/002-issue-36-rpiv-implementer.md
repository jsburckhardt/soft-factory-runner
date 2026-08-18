---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/36-preserve-invoking-tmux-context"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-17T02:02:14.584Z"
agent: "rpiv-implementer"
plan_id: "36-preserve-the-invoking-tmux-server-and-session-for-issue-windows"
schema_version: "1.2"
retro_id: "2026-08-17T02:02:30Z-rpiv-implementer-issue36"
started_at: "2026-08-17T01:09:07.856Z"
ended_at: "2026-08-17T02:02:30Z"
summary: "Issue 36 implementation completed with concrete tooling and validation backtracking preserved from the transient observation buffer."
entries:
  - id: DL-001
    kind: difficulty
    description: "Repository inspection commands expected ripgrep, but rg is unavailable; used grep instead."
    target: tooling
    severity: annoying
    workaround: "Used the recorded fallback or repaired the identified validation failure, then reran the authoritative check."
    suggested_encoding: "Keep deterministic tracked-file searches and full lint/format/type gates available earlier in focused workflows."
    fp: "ba12c6463e2a"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-17T01:09:07.856Z"
  - id: DL-002
    kind: difficulty
    description: "The planned repository edit command failed because python is unavailable; retried with Node.js."
    target: tooling
    severity: annoying
    workaround: "Used the recorded fallback or repaired the identified validation failure, then reran the authoritative check."
    suggested_encoding: "Keep deterministic tracked-file searches and full lint/format/type gates available earlier in focused workflows."
    fp: "f18aff82e77a"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-17T01:09:07.856Z"
  - id: DL-003
    kind: difficulty
    description: "Focused validation exposed v5-to-v6 narrowing, strict guard, and missing error-code updates; backtracked to repair types before tests."
    target: project
    severity: degrading
    workaround: "Used the recorded fallback or repaired the identified validation failure, then reran the authoritative check."
    suggested_encoding: "Keep deterministic tracked-file searches and full lint/format/type gates available earlier in focused workflows."
    fp: "35db6d146fb9"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-17T01:09:07.856Z"
  - id: CONF-001
    kind: confusion
    description: "Focused validation after Doctor fixture update narrowed remaining failures to human renderer evidence omission, Doctor probe evidence guard rejection, and isolated observe parsing."
    target: project
    workaround: "Used the recorded fallback or repaired the identified validation failure, then reran the authoritative check."
    suggested_encoding: "Keep deterministic tracked-file searches and full lint/format/type gates available earlier in focused workflows."
    fp: "b37b56351dfe"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-17T01:09:07.856Z"
  - id: DL-004
    kind: difficulty
    description: "The environment does not provide apply_patch; edits require repository-local Node filesystem transforms."
    target: tooling
    severity: annoying
    workaround: "Used the recorded fallback or repaired the identified validation failure, then reran the authoritative check."
    suggested_encoding: "Keep deterministic tracked-file searches and full lint/format/type gates available earlier in focused workflows."
    fp: "50ea5e278216"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-17T01:09:07.856Z"
  - id: DL-005
    kind: difficulty
    description: "First full validation exposed three stale imports left by the v6/exact-target refactor; focused Jest and diff checks did not run ESLint."
    target: project
    severity: annoying
    workaround: "Used the recorded fallback or repaired the identified validation failure, then reran the authoritative check."
    suggested_encoding: "Keep deterministic tracked-file searches and full lint/format/type gates available earlier in focused workflows."
    fp: "4bdb2f38298d"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-17T01:09:07.856Z"
---

# Retro — Issue 36 implementation

All pending rpiv-implementer observations were preserved before the stage buffer was cleared.
