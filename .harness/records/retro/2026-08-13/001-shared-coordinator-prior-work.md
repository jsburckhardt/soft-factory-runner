---
record_kind: retro
harness_version: 0.13.0
branch: fix/25-reproducible-clean-install-ci
repo: 'https://github.com/jsburckhardt/soft-factory-runner.git'
created_at: '2026-08-13T03:31:13.806Z'
agent: rpiv
plan_id: repository-shared-prior-work
schema_version: '1.2'
retro_id: '2026-08-13T03:32:45Z-rpiv-10f39684271c'
started_at: '2026-08-12T01:10:48.813Z'
ended_at: '2026-08-13T03:32:45.000Z'
summary: Drained two pre-existing repository-shared coordinator observations from prior work without attributing them to issue 25.
entries:
  - id: DL-001
    kind: difficulty
    description: 'Root full validation scans generated dist files inside the active .trees/5 worktree, so harness boot fails on delivered worktree build output before the previous worktree is cleaned up.'
    target: tooling
    severity: degrading
    workaround: Preserved for the owning prior-work context; issue 25 did not alter that worktree lifecycle.
    fp: 10f39684271c
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: '2026-08-12T01:10:48.813Z'
  - id: DL-002
    kind: difficulty
    description: 'Copilot launches from detached tool shells received OTEL_RESOURCE_ATTRIBUTES but not COPILOT_OTEL_ENABLED or OTLP exporter settings; Runner allowedEnvironment also strips those tmux-provided telemetry variables, so issue traces can be silently absent.'
    target: tooling
    severity: degrading
    workaround: Preserved for follow-up by the original coordinator context; no issue 25 workaround was claimed.
    fp: 51481e761f1a
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: '2026-08-12T03:53:02.311Z'
    suggested_encoding: Add a validated Copilot telemetry environment pass-through and a launch diagnostic that reports exporter enablement without exposing secrets.
---

# Retro — repository-shared-prior-work

Original coordinator provenance is preserved; this record is not attributed to issue 25.
