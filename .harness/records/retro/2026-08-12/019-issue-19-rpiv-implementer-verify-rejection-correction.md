---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/19-rpiv-progress-and-instructions"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-12T10:37:10.909Z"
agent: "rpiv-implementer"
plan_id: "19-define-rpiv-progress-final-result-ownership-and-integration-instructions"
schema_version: "1.2"
retro_id: "2026-08-12T10:37:10Z-rpiv-implementer-b29e1a325ace"
started_at: "2026-08-12T10:18:21.811Z"
ended_at: "2026-08-12T10:37:10.909Z"
summary: "Correcting the rejected Issue 19 implementation required command fallbacks, focused and full validation retries, fixture backtracking, and one production resume-binding repair exposed by the stricter V4 parser."
entries:
  - id: DL-001
    kind: difficulty
    description: "Repository inspection commands failed because rg is unavailable; use grep instead."
    target: tooling
    severity: annoying
    workaround: "Repeated repository searches with grep."
    suggested_encoding: "Expose one guaranteed repository search command or document grep as the available fallback."
    fp: "5aa5908936fc"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T10:18:21.811Z"
  - id: DL-002
    kind: difficulty
    description: "The documented python edit path was unavailable in the repository shell; retry edits with Node.js."
    target: tooling
    severity: annoying
    workaround: "Used Node.js scripts for deterministic file edits."
    suggested_encoding: "Align documented executable availability with the shell image or expose a harness edit verb."
    fp: "820f9cb69eba"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T10:22:21.210Z"
  - id: DL-003
    kind: difficulty
    description: "The new terminal-progress integration test expected cleanup eligibility, but completed fixture reconciliation remained blocked by another ownership fact; inspect the report and assert progress invariance against its actual baseline."
    target: project
    severity: annoying
    workaround: "Modeled the worker exit explicitly before completed reconciliation and reran the focused test."
    suggested_encoding: "Provide a completed-run fixture helper that settles all process identities before status reconciliation."
    fp: "96c5e80de7e7"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T10:25:40.467Z"
  - id: DL-004
    kind: difficulty
    description: "Focused harness exposed a TypeScript narrowing error in the new V4 binding guard and existing integration fixtures without root justfiles; add typed predicates and seed declared verify recipes in new-run fixtures."
    target: project
    severity: degrading
    workaround: "Added typed predicates, local narrowing, and explicit root justfiles to every new-run integration fixture."
    suggested_encoding: "Centralize a valid new-run repository fixture that always includes the root command contract."
    fp: "d3b6f1e14588"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T10:29:28.261Z"
  - id: DL-005
    kind: difficulty
    description: "The second focused harness retry exposed a resume path that increments V4 attempt without refreshing IntegrationLaunchV1; repair the persisted launch binding before relying on strict V4 parsing."
    target: project
    severity: degrading
    workaround: "Rebuilt IntegrationLaunchV1 with the next attempt, shared resume time, persisted validation, exact paths, and cleared progress."
    suggested_encoding: "Construct attempt and integration-launch changes through one domain transition helper."
    fp: "85a7d4a21e0a"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T10:31:38.026Z"
  - id: DL-006
    kind: difficulty
    description: "Full harness lint rejected unnecessary backtick escapes in documentation assertions and an unused destructured legacy field in the V4 fixture; clean both and retry the full gate."
    target: tooling
    severity: annoying
    workaround: "Removed the escapes and explicitly consumed the discarded legacy field."
    suggested_encoding: "Run lint in focused feedback or provide a focused static-check recipe."
    fp: "ac473bb4df38"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T10:34:11.795Z"
  - id: DL-007
    kind: difficulty
    description: "The full harness retry passed lint but format-check identified five edited TypeScript files; apply the formatter named by the gate and rerun full validation."
    target: tooling
    severity: annoying
    workaround: "Applied Prettier to the five named files and reran the full gate."
    suggested_encoding: "Expose a root justfile formatting recipe alongside format-check."
    fp: "29352ed8ba03"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T10:34:44.664Z"
  - id: DL-008
    kind: difficulty
    description: "The direct repository-local Prettier binary path was absent even though npm scripts resolve it; retry the formatter through npm exec."
    target: tooling
    severity: annoying
    workaround: "Invoked the installed formatter through npm exec."
    suggested_encoding: "Add a root formatting recipe so agents never need to resolve workspace binary layout."
    fp: "b29e1a325ace"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T10:35:00.971Z"
---

# Retro — Issue 19 Verify rejection correction

The structured entries preserve every pending implementer observation captured during this correction cycle.
