---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/27-single-soft-factory-agent"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-14T06:41:58.168Z"
agent: "rpiv-research"
plan_id: "27-ship-only-the-soft-factory-delivery-agent-at-the-copilot-project-agent-path"
schema_version: "1.2"
retro_id: "2026-08-14T06:42:46.269Z-rpiv-research-issue27"
started_at: "2026-08-13T04:56:05.924Z"
ended_at: "2026-08-14T06:42:46.269Z"
summary: "Drained 11 pending rpiv-research observations for Issue 27 before implementation handoff."
entries:
  - id: DL-001
    kind: difficulty
    description: "AGENTS.md exceeded the view tool size limit and required line-ranged retries."
    severity: "annoying"
    fp: "db13c82d84a3"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-13T04:56:05.924Z"
  - id: DL-002
    kind: difficulty
    description: "AGENTS.md revealed a required harness boot step only after issue fetch and initial inventory, requiring backtracking before further research."
    severity: "degrading"
    fp: "5dd362e15fb7"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-13T04:56:28.091Z"
  - id: DL-003
    kind: difficulty
    description: "README.md and the combined source-symbol inventory exceeded output limits, requiring narrower file/range reads."
    severity: "annoying"
    fp: "ab4daac3d118"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-13T04:58:18.550Z"
  - id: CONF-001
    kind: confusion
    description: "The configured npm registry proxy returned E404 for soft-factory-runner, while GitHub has no releases or tags; public npm availability therefore remains unproved rather than conclusively absent."
    severity: "degrading"
    fp: "5510578f78ba"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-13T05:01:16.861Z"
  - id: DL-004
    kind: difficulty
    description: "The first research-artifact write failed because the environment exposes python3 but not the python command, requiring a concrete retry."
    severity: "annoying"
    fp: "f7e17bd997f0"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-13T05:05:08.231Z"
  - id: DL-005
    kind: difficulty
    description: "AGENTS.md revealed required harness boot and engineering-harness setup after initial issue/path inspection"
    fp: "b03268ff3239"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T05:38:01.155Z"
  - id: DL-006
    kind: difficulty
    description: "Broad documentation grep produced oversized output and required narrower section reads"
    fp: "daa3e17adcf2"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T05:41:52.480Z"
  - id: INS-001
    kind: insight
    description: "Current package check passed although npm dry-run includes untracked theoutsideone.agent.md, so exclusion proof is missing"
    fp: "69a357cedee6"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T05:41:52.518Z"
  - id: DL-007
    kind: difficulty
    description: "Research brief creation failed because the environment exposes python3 but no python executable; retry required"
    fp: "24b69548ae56"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T05:46:14.740Z"
  - id: CONF-002
    kind: confusion
    description: "Python3 verification unexpectedly lacked the standard json module after Python3 successfully wrote the brief; switched verifier runtime"
    fp: "4809d9ac05ac"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T05:47:29.137Z"
  - id: INS-002
    kind: insight
    description: "Scope classified core_component because the adopted official-asset core-component directly governs every changed catalog, installer, agent, package, and documentation surface"
    fp: "253c1621bfd1"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T05:47:59.251Z"
---

# Retro — Issue 27 rpiv-research

Pending observations were copied from the repository-shared stage buffer. The buffer is cleared only after this record is read back and checked.
