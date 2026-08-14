---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/27-single-soft-factory-agent"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-14T06:41:58.072Z"
agent: "rpiv"
plan_id: "27-ship-only-the-soft-factory-delivery-agent-at-the-copilot-project-agent-path"
schema_version: "1.2"
retro_id: "2026-08-14T06:42:45.922Z-rpiv-issue27"
started_at: "2026-08-13T04:54:27.890Z"
ended_at: "2026-08-14T06:42:45.922Z"
summary: "Drained 2 pending rpiv observations for Issue 27 before implementation handoff."
entries:
  - id: CONF-001
    kind: confusion
    description: "Harness CLI advertised verb briefings, but 'harness instructions observe --json' returned unconfigured; the router documentation also prescribed unsupported kind 'command', while the CLI accepts a different enum."
    fp: "80a61b3172fa"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-13T04:54:27.890Z"
  - id: DL-001
    kind: difficulty
    description: "Skill invocation surface could not pass the required pre-coding hook argument, so the exact seam could not be expressed through the available Skill tool."
    target: "eng-harness-flow"
    severity: "degrading"
    suggested_encoding: "Allow skill invocations to carry validated arguments such as --hook pre-coding."
    fp: "23726c4bd015"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T06:07:49.381Z"
---

# Retro — Issue 27 rpiv

Pending observations were copied from the repository-shared stage buffer. The buffer is cleared only after this record is read back and checked.
