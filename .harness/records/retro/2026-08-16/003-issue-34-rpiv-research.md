---
record_kind: "retro"
harness_version: "0.13.0"
branch: "fix/34-reload-current-run-state-after-copilot-exits"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-16T04:48:35.000Z"
agent: "rpiv-research"
plan_id: "34-reload-current-run-state-after-copilot-exits"
schema_version: "1.2"
retro_id: "2026-08-16T04:48:35Z-rpiv-research-34reload"
started_at: "2026-08-16T04:09:20.340Z"
ended_at: "2026-08-16T04:48:35.000Z"
summary: "Research completed with local command fallbacks and an explicit proof limitation because the referenced production run state was unavailable."
entries:
  - id: DL-001
    kind: difficulty
    description: "Repository search command rg was unavailable, requiring fallback to grep."
    target: tooling
    severity: annoying
    workaround: "Used bounded grep and direct file reads."
    suggested_encoding: "Expose an available fast repository search command in harness instructions."
    fp: "a5d36b538ebb"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-16T04:09:20.340Z"
  - id: DL-002
    kind: difficulty
    description: "Fallback recursive grep traversed a repository socket and emitted a device error, requiring narrower searches."
    target: tooling
    severity: annoying
    workaround: "Restricted searches to tracked source and documentation paths."
    suggested_encoding: "Provide a tracked-file search helper that excludes sockets and generated paths."
    fp: "871c019b088c"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-16T04:09:39.429Z"
  - id: DL-003
    kind: difficulty
    description: "Production run 453ac411-970e-479e-8f08-16d6781a037f snapshot and event files were not present locally or committed, so exact revision payloads could only be corroborated by Issue 34, source behavior, and Sparkta PR 13 artifacts."
    target: project
    severity: degrading
    workaround: "Recorded the unavailable proof and triangulated repository-local source, issue, and PR evidence."
    suggested_encoding: "Attach redacted production snapshot/event evidence to defect work items when runtime state is external."
    fp: "5fab7c07c850"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-16T04:12:55.777Z"
  - id: DL-004
    kind: difficulty
    description: "The repository has python3 but no python alias, so the first research artifact write command failed and required retry with the available runtime."
    target: tooling
    severity: annoying
    workaround: "Retried with python3."
    suggested_encoding: "Advertise python3 explicitly in the environment runtime inventory."
    fp: "a5c12f3670ce"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-16T04:16:01.234Z"
---

# Retro — Issue 34 Research

All four pending Research observations are retained with their concrete workarounds and proof implications.
