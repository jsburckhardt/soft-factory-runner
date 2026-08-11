---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/5-recover-and-run-concurrently"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-11T15:09:14.093Z"
agent: "rpiv-implementer"
plan_id: "5-phase-3-recover-safely-and-run-distinct-issues-concurrently"
schema_version: "1.2"
retro_id: "2026-08-11T15:09:14Z-rpiv-implementer-ff93eb6d"
started_at: "2026-08-11T14:41:22.240Z"
ended_at: "2026-08-11T15:09:14.093Z"
summary: "Implementation completed with five retained observations covering the python3 retry, isolated-test fake drift, a stale Phase 2 observation-count assertion, and lint/format failures that only the full gate exposed."
entries:
  - id: DL-001
    kind: difficulty
    description: "The advertised python command was unavailable while editing; the environment only provides python3, requiring an immediate retry."
    target: tooling
    severity: degrading
    workaround: "Retried the file edit with python3."
    suggested_encoding: "Align the advertised Python command with the environment or add a deterministic file-edit harness verb."
    fp: "ff93eb6de23b"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-11T14:41:22.240Z"
  - id: INS-001
    kind: insight
    description: "Focused validation exposed that ts-jest isolated transpilation did not type-check expanded test fakes; missing FilePort.list surfaced only as repeated runtime failures."
    target: project
    workaround: "Updated every test fake to implement the expanded typed ports and confirmed with the root type-check/full gate."
    suggested_encoding: "Include test sources in a dedicated strict type-check or make focused checks compose it."
    fp: "765ea3c5e64e"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-11T14:50:34.547Z"
  - id: DL-002
    kind: difficulty
    description: "A Phase 2 fixture asserted one remote observation, but shared Phase 3 status/attach reconciliation intentionally added bounded remote observations; the stale call-count proof required boundary-specific updating."
    target: project
    severity: degrading
    workaround: "Updated the fixture to count the finalization, status, and attach observation attempts explicitly."
    suggested_encoding: "Name per-command observation-count assertions so shared reconciliation additions identify affected proof directly."
    fp: "3e0853fff106"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-11T15:03:00.077Z"
  - id: DL-003
    kind: difficulty
    description: "The first full gate failed on six strict unused-symbol lint errors in new adapters/tests, despite focused Jest and diff checks passing; full lint caught proof not exercised by focused mode."
    target: project
    severity: degrading
    workaround: "Removed unused imports and omitted unused implementation parameters before rerunning the full gate."
    suggested_encoding: "Compose lint or a fast lint subset into the focused gate."
    fp: "361255da69b0"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-11T15:06:33.043Z"
  - id: DL-004
    kind: difficulty
    description: "After lint repair, the second full gate reached format-check and reported 17 TypeScript files needing Prettier; focused validation does not expose formatting drift."
    target: project
    severity: degrading
    workaround: "Applied the prescribed Prettier write and reran format-check and the complete full gate."
    suggested_encoding: "Add a root formatting recipe and compose format-check into focused validation when practical."
    fp: "b2b08d18cdd5"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-11T15:07:14.252Z"
---

# Retro — Issue 5 Implement

All pending Implement observations were preserved from the stage buffer before it was cleared.
