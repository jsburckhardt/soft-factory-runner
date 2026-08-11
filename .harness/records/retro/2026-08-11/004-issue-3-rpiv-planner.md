---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/3-run-isolated-visible"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-11T08:05:38.003Z"
agent: "rpiv-planner"
plan_id: "3-phase-1-run-one-issue-in-an-isolated-visible-environment"
schema_version: "1.2"
retro_id: "2026-08-11T08:05:38Z-rpiv-planner-999e9f506515"
started_at: "2026-08-11T07:22:36.621Z"
ended_at: "2026-08-11T08:05:38.003Z"
summary: "Plan resolved conflicting outer-branch evidence and retried unsupported GitHub metadata and interpreter-dependent artifact population."
entries:
  - id: "CONF-001"
    kind: "confusion"
    description: "Issue #3 branch evidence conflicts: user names issue/3-run-isolated-visible, while checkout is feat/3-run-isolated-visible and research records issue/. Planning must treat the outer RPIV checkout as non-Runner ownership and avoid relying on its branch label."
    target: "plan"
    severity: "degrading"
    workaround: "Defined the outer worktree as unknown and required Runner to preserve it."
    suggested_encoding: "Carry authoritative branch identity in RPIV handoff facts."
    fp: "999e9f506515"
    disposition: "kept"
    system:
      compound:
        status: "open"
        source: "agent-self"
        first_seen_at: "2026-08-11T07:22:36.621Z"
  - id: "DL-001"
    kind: "difficulty"
    description: "GitHub issue metadata inspection used unsupported closedByPullRequests field; gh exposed closedByPullRequestsReferences and required a corrected query."
    target: "tooling"
    workaround: "Retried with the field exposed by the installed gh version."
    suggested_encoding: "Probe supported gh JSON fields through a harness capability command."
    fp: "0fcb8b5ba336"
    disposition: "kept"
    system:
      compound:
        status: "open"
        source: "agent-self"
        first_seen_at: "2026-08-11T07:35:51.886Z"
  - id: "DL-002"
    kind: "difficulty"
    description: "Architecture artifact population retried because the environment has no python executable; switched to the available Node.js runtime after copied templates remained unchanged."
    target: "tooling"
    workaround: "Used Node.js to populate the copied architecture templates."
    suggested_encoding: "Advertise exact interpreter executable names in repository orientation."
    fp: "fe79734c4154"
    disposition: "kept"
    system:
      compound:
        status: "open"
        source: "agent-self"
        first_seen_at: "2026-08-11T07:37:07.507Z"
---

# Retro — Issue 3 Plan

Durable Plan observations captured before implementation commit.
