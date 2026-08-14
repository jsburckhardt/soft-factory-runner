---
record_kind: "retro"
harness_version: "0.13.0"
branch: "fix/29-tmux-preparation-diagnostics"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-14T10:04:42.385Z"
agent: "rpiv-research"
plan_id: "29-preserve-retryable-tmux-preparation-failures-with-bounded-identity-diagnostics"
schema_version: "1.2"
retro_id: "2026-08-14T08:57:18Z-rpiv-research-cbab219e"
started_at: "2026-08-14T08:57:18.762Z"
ended_at: "2026-08-14T10:04:42.385Z"
summary: "Research resolved the issue context and validation authority after bounded-read, command-discovery, stale-path, and runtime-availability friction; every workaround remained repository-local."
entries:
  - id: DL-001
    kind: difficulty
    description: "Decision-log full-file read exceeded the view limit and required bounded rereading."
    target: tooling
    severity: annoying
    workaround: "Reread the decision log in bounded ranges."
    suggested_encoding: "Document bounded-range reads for large project artifacts."
    fp: "cbab219eaca3"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T08:57:18.762Z"
  - id: INS-001
    kind: insight
    description: "An exact recipe grep missed parameterized verify-focused, so just --list was needed for proof."
    target: tooling
    workaround: "Used just --list to prove the parameterized root recipe."
    suggested_encoding: "Prefer just --list for recipe discovery and preserve direct root validation."
    fp: "1d26e28d327b"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T08:57:18.859Z"
  - id: DL-002
    kind: difficulty
    description: "A guessed historical work-item slug was stale, so the Research-format comparison used the resolved Issue 5 brief instead."
    target: project
    severity: annoying
    workaround: "Resolved an existing work item before selecting the comparison artifact."
    suggested_encoding: "Use work-item discovery rather than guessed historical slugs."
    fp: "138bdeb94f62"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T09:00:10.391Z"
  - id: DL-003
    kind: difficulty
    description: "The repository image lacks a python command alias, so the Research artifact write must retry with python3."
    target: infra
    severity: annoying
    workaround: "Retried the write with the installed python3 executable."
    suggested_encoding: "State the available Python executable in environment orientation."
    fp: "3d7969d8b0e6"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T09:02:46.722Z"
  - id: DL-004
    kind: difficulty
    description: "The available python3 lacks the standard json module, so acceptance comparison needs a shell or Node retry."
    target: infra
    severity: annoying
    workaround: "Used another repository-local runtime for structured comparison."
    suggested_encoding: "Ensure the advertised Python runtime includes its standard library or document Node fallback."
    fp: "6f0ce33469ee"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T09:03:35.436Z"
  - id: DL-005
    kind: difficulty
    description: "A parallel artifact read assumed more than 92 lines and required a bounded-range correction."
    target: tooling
    severity: annoying
    workaround: "Corrected the requested range to the actual artifact bounds."
    suggested_encoding: "Expose line counts before bounded parallel reads."
    fp: "a766d9493c5e"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T09:03:35.471Z"
---

# Retro — Issue 29 Research

Durable drain of all pending rpiv-research observations before implementation handoff.
