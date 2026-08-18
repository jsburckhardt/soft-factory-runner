---
record_kind: "retro"
harness_version: "0.13.0"
branch: "fix/42-clean-exact-owned-dead-pane-window"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-18T09:19:50.091Z"
agent: "rpiv-implementer"
plan_id: "42-allow-explicit-cleanup-of-an-exact-owned-tmux-window-with-a-dead-pane"
schema_version: "1.2"
retro_id: "2026-08-18T09:19:50Z-rpiv-implementer-398aea05d608"
started_at: "2026-08-18T09:01:00.805Z"
ended_at: "2026-08-18T09:19:50.091Z"
summary: "Corrected stale current documentation after the Verify documentation gate, updated executable documentation contracts, and reran package plus direct and harness validation."
entries:
  - id: DL-001
    kind: difficulty
    description: "Repository search retried with grep because the expected rg executable is unavailable."
    target: tooling
    severity: annoying
    workaround: "Used repository-local grep searches to enumerate current documentation claims."
    suggested_encoding: "Expose a documented repository search helper or include ripgrep in the development environment."
    fp: "11b18e7ece13"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-18T09:01:00.805Z"
  - id: DL-002
    kind: difficulty
    description: "Documentation edit helper retried with Node because the expected python executable is unavailable."
    target: tooling
    severity: annoying
    workaround: "Used the available python3 executable for deterministic exact-text edits."
    suggested_encoding: "Document python3 rather than python as the available repository scripting runtime."
    fp: "3f9dd73e3e06"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-18T09:05:15.693Z"
  - id: COORD-001
    kind: coordination
    description: "Focused validation initially failed because two documentation tests still asserted pre-correction wording; updated them to the expanded record and preserved cleanup terminology."
    target: doc
    severity: annoying
    workaround: "Inspected each failed assertion, restored still-current cleanup terms, and changed stale observation assertions to the expanded exact-target contract."
    suggested_encoding: "Keep current lifecycle observation assertions separate from scoped historical identity-diagnostic assertions."
    fp: "398aea05d608"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-18T09:09:12.100Z"
---

# Retro — Issue 42 documentation-gate correction

The structured entries preserve all concrete Implement-stage friction observed during this correction.
