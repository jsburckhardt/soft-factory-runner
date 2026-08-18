---
record_kind: "retro"
harness_version: "0.13.0"
branch: "fix/38-prevent-doctor-collapse-when-unrelated-tmux-server-is-absent"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-18T02:54:44.422Z"
agent: "rpiv-implementer"
plan_id: "38-prevent-doctor-collapse-when-an-unrelated-tmux-server-is-absent"
schema_version: "1.2"
retro_id: "2026-08-18T02:54:44Z-rpiv-implementer-drain-correction"
started_at: "2026-08-18T02:54:35Z"
ended_at: "2026-08-18T02:54:44Z"
summary: "Harvest validation exposed unsupported flow-style entry parsing and triggered a block-style correction."
entries:
  - id: DL-001
    kind: difficulty
    description: "Retro harvest parsed the implementer record but omitted flow-style entries, requiring block-style YAML conversion and a second durable read-back."
    target: tooling
    severity: degrading
    workaround: "Converted every implementer entry to block-style YAML and reran plan-scoped harvest validation."
    suggested_encoding: "Have retro scaffold validation reject entry styles that the harvest reader will omit."
    fp: "4a0df7c30824"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-18T02:54:35.624Z"
---

# Retro — Issue 38 Implement Drain Correction

The correction was recorded before the new transient observation was cleared.
