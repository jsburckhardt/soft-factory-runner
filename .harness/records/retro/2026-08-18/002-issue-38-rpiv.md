---
record_kind: "retro"
harness_version: "0.13.0"
branch: "fix/38-prevent-doctor-collapse-when-unrelated-tmux-server-is-absent"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-18T02:48:56.987Z"
agent: "rpiv"
plan_id: "38-prevent-doctor-collapse-when-an-unrelated-tmux-server-is-absent"
schema_version: "1.2"
retro_id: "2026-08-18T02:48:56Z-rpiv-4172942cf934"
started_at: "2026-08-18T01:07:22Z"
ended_at: "2026-08-18T02:48:56Z"
summary: "Coordinator friction was limited to a stale inherited PATH in a deferred external Sparkta context."
entries:
  - id: DL-001
    kind: difficulty
    description: "Sparkta tmux run-shell inherited a stale PATH and could not resolve a newly installed global soft-factory binary"
    target: infra
    severity: annoying
    workaround: "Kept external Sparkta acceptance deferred and used repository-local package proof only."
    suggested_encoding: "Pass an explicit package-local binary path to external tmux acceptance commands."
    fp: "4172942cf934"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-18T01:07:22.799Z"
---

# Retro — Issue 38 Coordinator

The observation is retained without performing deferred Sparkta acceptance.
