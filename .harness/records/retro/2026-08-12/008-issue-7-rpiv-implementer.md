---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/7-install-and-operate-official-agent-assets"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-12T03:22:08.010Z"
agent: "rpiv-implementer"
plan_id: "7-phase-5-install-and-operate-official-agent-assets"
schema_version: "1.2"
retro_id: "2026-08-12T03:22:08Z-rpiv-implementer-91141d5d8024"
started_at: "2026-08-12T03:03:51.081Z"
ended_at: "2026-08-12T03:23:20.895Z"
summary: "Implementation completed with recorded editing-tool retries, cumulative assertion repairs, and lint/format fixes exposed by authoritative validation."
entries:
  - id: DL-001
    kind: difficulty
    description: "The environment does not provide apply_patch, so repository file creation must use another non-redirection editing method."
    target: tooling
    severity: annoying
    workaround: "Used direct UTF-8 writes through python3."
    suggested_encoding: "Provide a deterministic patch/edit verb in the standard implementation environment."
    fp: "91141d5d8024"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T03:03:51.081Z"
  - id: CONF-001
    kind: confusion
    description: "The advertised python command is unavailable (only python3 is installed), causing a second file-creation retry."
    target: tooling
    severity: annoying
    workaround: "Invoked python3 explicitly."
    suggested_encoding: "Align tool documentation with the executable installed in the image."
    fp: "9697bb52fc3a"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T03:04:17.867Z"
  - id: DL-002
    kind: difficulty
    description: "Focused validation exposed a stale cumulative help assertion pinned to Phase 4 after the planned Phase 5 help update; the assertion must advance with the cumulative interface."
    target: project
    severity: annoying
    workaround: "Updated the cumulative help assertion to Phase 5 and reran focused validation."
    suggested_encoding: "Derive phase labels from one exported help-version constant."
    fp: "d77e07184c7c"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T03:08:06.996Z"
  - id: DL-003
    kind: difficulty
    description: "A scripted test insertion used an incorrectly escaped marker and failed without changing files, requiring a simpler literal replacement retry."
    target: tooling
    severity: annoying
    workaround: "Located the literal insertion point and retried with simpler quoting."
    suggested_encoding: "Prefer a structured edit tool over quoted source-marker replacement."
    fp: "0306a63ca5a4"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T03:13:35.215Z"
  - id: DL-004
    kind: difficulty
    description: "Focused documentation checks were semantically correct but three exact phrase assertions crossed Markdown line wraps or added an unsupported adjacency, requiring less layout-brittle assertions."
    target: project
    severity: annoying
    workaround: "Asserted stable semantic fragments that do not depend on Markdown wrapping."
    suggested_encoding: "Use structured documentation markers for machine-checked contracts."
    fp: "6789ec3ca17b"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T03:17:04.268Z"
  - id: DL-005
    kind: difficulty
    description: "The full gate exposed three strict ESLint issues that focused Jest does not cover: one require-style fixture read and two unused destructuring bindings."
    target: project
    severity: annoying
    workaround: "Replaced require with a typed import and constructed explicit objects without unused bindings."
    suggested_encoding: "Include lint in a fast implementation feedback recipe or expose a focused static-check recipe."
    fp: "afcede7f1b7f"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T03:19:18.503Z"
  - id: DL-006
    kind: difficulty
    description: "After lint repair, the next full-gate stage exposed Prettier drift across the newly added TypeScript files; focused validation did not run formatting."
    target: project
    severity: annoying
    workaround: "Applied the prescribed Prettier write remediation and reran the full gate."
    suggested_encoding: "Include format checking in a fast implementation feedback recipe or add a root formatting-fix recipe."
    fp: "9d1422a2315d"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T03:19:55.707Z"
  - id: DL-007
    kind: difficulty
    description: "The first retro verification script incorrectly searched for escaped quote characters and failed despite valid read-back content; retrying with literal YAML fields."
    target: tooling
    severity: annoying
    workaround: "Retried verification against literal schema-version and plan-id fields."
    suggested_encoding: "Provide a schema-validating retro closeout command that checks pending observation coverage."
    fp: "66a4334ac1ad"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T03:23:15.634Z"
---

# Retro — Issue 7 Implement

Durable Implement-stage friction captured before implementation closeout.
