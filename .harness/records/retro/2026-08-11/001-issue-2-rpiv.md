---
record_kind: "retro"
harness_version: "0.13.0"
branch: "issue/2-adopt-engineering-harness"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-11T06:31:59.873Z"
agent: "rpiv"
plan_id: "2-phase-0-adopt-the-engineering-harness"
schema_version: "1.2"
retro_id: "2026-08-11T06:13:31Z-rpiv-0f74fa266dc7"
started_at: "2026-08-11T06:13:31.998Z"
ended_at: "2026-08-11T06:32:49.469Z"
summary: "Wired stage-specific harness friction capture, durable draining, and validated closeout harvesting into the RPIV agent flow, preserving two validation-tooling frictions."
entries:
  - id: DL-001
    kind: difficulty
    description: "APS prompt lint helper assumed a python executable, but this workspace exposes only python3, so the first lint command silently skipped before a later command returned success."
    target: tooling
    severity: annoying
    workaround: "Rerun the structural lint with python3 and chain it with &&."
    suggested_encoding: "Use python3 explicitly in repository validation examples or provide a just recipe for APS prompt linting."
    fp: "0f74fa266dc7"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-11T06:13:31.998Z"
  - id: DL-002
    kind: difficulty
    description: "The retro harvest validation initially treated data.sources as a list, but harness v0.13.0 returns a structured object, so the jq proof failed before clearing the buffer."
    target: tooling
    severity: annoying
    workaround: "Inspect the envelope and validate the sources object fields instead."
    suggested_encoding: "Document the retro-insights JSON schema or add a stable repository validation helper."
    fp: "509a0ed60d73"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-11T06:32:42.125Z"
---

# Retro — Issue #2 RPIV friction integration

RPIV now owns capture, drain, and harvest lifecycle calls without requiring a separate Builder flow.
