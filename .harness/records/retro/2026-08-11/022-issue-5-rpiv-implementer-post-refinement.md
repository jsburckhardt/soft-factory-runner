---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/5-recover-and-run-concurrently"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-11T15:19:37.410Z"
agent: "rpiv-implementer"
plan_id: "5-phase-3-recover-safely-and-run-distinct-issues-concurrently"
schema_version: "1.2"
retro_id: "2026-08-11T15:19:37Z-rpiv-implementer-d2d0ab48"
started_at: "2026-08-11T15:17:26.092Z"
ended_at: "2026-08-11T15:19:37.410Z"
summary: "A post-validation safety refinement produced one retained strict-type observation; control-flow narrowing made a redundant completed-state comparison invalid, and the condition was removed before final direct and harness gates passed."
entries:
  - id: DL-001
    kind: difficulty
    description: "A post-refinement full type check found a control-flow-narrowing error: the terminal cleanup branch compared against completed after the completed branch had already returned."
    target: project
    severity: degrading
    workaround: "Removed the unreachable comparison, centralized completed cleanup proof, and reran focused, direct full, and harness checks."
    suggested_encoding: "Keep terminal-state decision branches exhaustive so strict narrowing identifies unreachable policy conditions earlier."
    fp: "d2d0ab48e2ff"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-11T15:17:26.092Z"
---

# Retro — Issue 5 Implement post-refinement

The post-refinement observation was preserved from the Implement buffer before it was cleared.
