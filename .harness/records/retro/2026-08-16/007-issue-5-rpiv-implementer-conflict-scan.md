---
record_kind: "retro"
harness_version: "0.13.0"
branch: "fix/5-reconcile-successful-terminal-result"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-16T12:15:19.775Z"
agent: "rpiv-implementer"
plan_id: "5-phase-3-recover-safely-and-run-distinct-issues-concurrently"
schema_version: "1.2"
retro_id: "2026-08-16T12:15:19Z-rpiv-implementer-07e4c6e4d7d0"
started_at: "2026-08-16T12:15:10Z"
ended_at: "2026-08-16T12:15:19Z"
summary: "A broad final conflict-marker scan crossed dependency and special-file boundaries, so implementation retried against tracked source files only."
entries:
  - id: DL-001
    kind: difficulty
    description: "A repository-wide conflict-marker scan included dependency documentation and a special tmux socket, producing noisy false positives and requiring a tracked-source-only retry."
    target: tooling
    severity: annoying
    workaround: "Limit the scan to git ls-files output."
    suggested_encoding: "Provide a harness conflict-marker check over tracked text files."
    fp: "07e4c6e4d7d0"
    disposition: kept
    system:
      compound: { status: open, source: agent-self, first_seen_at: "2026-08-16T12:15:10.274Z" }
---

# Retro — Issue #5 final conflict scan

The tracked-source retry excluded dependency and special-file noise.
