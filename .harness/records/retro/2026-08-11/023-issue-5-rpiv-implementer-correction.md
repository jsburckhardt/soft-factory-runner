---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/5-recover-and-run-concurrently"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-11T15:56:02.417Z"
agent: "rpiv-implementer"
plan_id: "5-phase-3-recover-safely-and-run-distinct-issues-concurrently"
schema_version: "1.2"
retro_id: "2026-08-11T15:56:02Z-rpiv-implementer-5fbf1509"
started_at: "2026-08-11T15:34:55.118Z"
ended_at: "2026-08-11T15:56:02.417Z"
summary: "The Issue #5 correction cycle resolved verifier-owned safety gaps with targeted fixtures, then passed focused and full direct and harness gates after concrete tooling, fixture, formatting, and lint retries."
entries:
  - id: DL-001
    kind: difficulty
    description: "Harness doctor reported degraded git-ai collection because a global trace2 configuration disables hooks; use the required verified-or-named harness commit path."
    target: tooling
    severity: degrading
    workaround: "Proceed with harness commit and evaluate its explicit attribution outcome."
    fp: "aee619a4be9b"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-11T15:34:55.118Z"
  - id: DL-002
    kind: difficulty
    description: "The repository environment lacks ripgrep, so six parallel source-inspection searches failed with exit 127 and had to be retried with grep."
    target: tooling
    severity: annoying
    workaround: "Use grep -nE for repository searches."
    suggested_encoding: "Include a tracked search helper or ripgrep in the development environment."
    fp: "94ec11dd93b2"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-11T15:36:07.163Z"
  - id: DL-003
    kind: difficulty
    description: "The advertised python command is unavailable in this repository image, so the first scripted source-edit attempt failed with exit 127 and had to be rewritten in Node.js."
    target: tooling
    severity: annoying
    workaround: "Use Node.js scripts for deterministic file edits."
    fp: "23af423dea07"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-11T15:40:44.458Z"
  - id: DL-004
    kind: difficulty
    description: "A Node.js scripted render edit failed before changing files because nested template literals broke shell quoting; the edit had to be retried with line-array replacement."
    target: tooling
    severity: annoying
    workaround: "Avoid nested template literals in node -e edits and replace bounded source regions with joined line arrays."
    fp: "3ad437a0382d"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-11T15:44:55.778Z"
  - id: DL-005
    kind: difficulty
    description: "The first correction-focused test run failed because the remediation parameter was inserted on buildCompletedReport instead of report, and pure reconciliation fixtures lacked the new lease boundary."
    target: project
    severity: annoying
    workaround: "Move the parameter to the report helper and update all exact-observation fixtures with lease facts."
    fp: "38a753bc61b7"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-11T15:45:50.759Z"
  - id: DL-006
    kind: difficulty
    description: "The cleanup fault-injection run failed because its atomic-write hook attempted to JSON-parse retained log content; scope the hook to the run snapshot path before parsing."
    target: project
    severity: annoying
    workaround: "Gate snapshot replacement injection on /runs/5.json and leave log writes untouched."
    fp: "a3b78e09ee5c"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-11T15:50:02.880Z"
  - id: DL-007
    kind: difficulty
    description: "The first style boundary failed only on Prettier drift in four edited TypeScript files while strict type-check passed; formatting must be corrected before the next focused gate."
    target: project
    severity: annoying
    workaround: "Format the four named files, then rerun root just format-check and focused validation."
    fp: "de6a8866f66b"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-11T15:53:04.901Z"
  - id: DL-008
    kind: difficulty
    description: "The first direct full gate stopped at lint: four test-only non-null assertions and one type-only helper violated ESLint even though focused tests, formatting, and type-check passed."
    target: project
    severity: annoying
    workaround: "Replace nullable merge spreads with an explicit complete-merge fixture helper and use imported report types instead of a type-only function."
    fp: "6ce7da1e6235"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-11T15:54:25.948Z"
---

# Retro — Issue #5 implementation correction

This correction retro preserves the concrete implementation-cycle retries. Verifier-owned observations were intentionally not listed, drained, or cleared.
