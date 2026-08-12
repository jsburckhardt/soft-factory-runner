---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/5-recover-and-run-concurrently"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-11T15:09:13.977Z"
agent: "rpiv-research"
plan_id: "5-phase-3-recover-safely-and-run-distinct-issues-concurrently"
schema_version: "1.2"
retro_id: "2026-08-11T15:09:13Z-rpiv-research-f76d7e4c"
started_at: "2026-08-11T14:08:52.119Z"
ended_at: "2026-08-11T15:09:13.977Z"
summary: "Research completed with four retained observations covering unavailable search/write commands, bounded-read retries, and the cross-file process-identity inference that shaped the recovery plan."
entries:
  - id: DL-001
    kind: difficulty
    description: "Repository investigation commands using rg failed because ripgrep is not installed; retrying symbol and test searches with grep."
    target: tooling
    severity: degrading
    workaround: "Retried repository searches with grep."
    suggested_encoding: "Expose a harness-backed repository search verb or install the documented search tool."
    fp: "f76d7e4cc7c2"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-11T14:08:52.119Z"
  - id: DL-002
    kind: difficulty
    description: "Artifact creation failed because the python executable is unavailable; retrying the same write with python3."
    target: tooling
    severity: degrading
    workaround: "Retried artifact creation with python3."
    suggested_encoding: "Standardize the documented Python executable or provide a harness file-write verb."
    fp: "a941f23cada5"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-11T14:16:27.538Z"
  - id: DL-003
    kind: difficulty
    description: "Large AGENTS and Git history reads exceeded tool output limits, requiring force-read, ranged, and concise-stat retries to obtain the required repository evidence."
    target: tooling
    severity: degrading
    workaround: "Used ranged file reads and concise Git statistics."
    suggested_encoding: "Provide bounded sections and concise history evidence through a repository-inspection command."
    fp: "0e0aca04b484"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-11T14:18:06.500Z"
  - id: INS-001
    kind: insight
    description: "Process-duplication risk required cross-file inference: RunSnapshotBase stores no process identity, ProcessPort cannot observe one, and runWorker launches for any running_rpiv snapshot with tmux facts."
    target: project
    workaround: "Mapped the combined snapshot, port, and worker behavior into the Plan process-identity contract."
    suggested_encoding: "Keep process identity and no-duplicate launch covered by one executable reconciliation fixture."
    fp: "f1e5aae2690a"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-11T14:18:18.611Z"
---

# Retro — Issue 5 Research

All pending Research observations were preserved from the stage buffer before it was cleared.
