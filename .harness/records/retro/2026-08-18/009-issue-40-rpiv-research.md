---
record_kind: retro
harness_version: 0.13.0
branch: fix/40-treat-stale-no-server-tmux-sockets-as-absent
repo: https://github.com/jsburckhardt/soft-factory-runner.git
created_at: 2026-08-18T03:56:46.208Z
agent: rpiv-research
plan_id: 40-treat-stale-no-server-tmux-sockets-as-absent-doctor-inventory
schema_version: 1.2
retro_id: 2026-08-18T03:56:46Z-rpiv-research-fa956762ea67
started_at: 2026-08-18T03:17:48Z
ended_at: 2026-08-18T03:56:46Z
summary: Issue 40 research could not replay the absent external Sparkta context and retried artifact creation with the available Python executable.
entries:
  - id: DL-001
    kind: difficulty
    description: Requested live Sparkta workspace and both tmux socket paths were absent, so supplied beta.0 incident facts could not be replayed locally; global soft-factory is 0.1.0.
    target: project
    severity: degrading
    workaround: Used controlled repository-local evidence and deferred Sparkta operational acceptance.
    suggested_encoding: Preserve an explicit external-acceptance handoff when incident resources are unavailable.
    fp: fa956762ea67
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: 2026-08-18T03:17:48.233Z
  - id: DL-002
    kind: difficulty
    description: Research artifact creation retried because the environment has no python executable; Node.js is the available local writer.
    target: tooling
    severity: annoying
    workaround: Used Node.js to write the research artifact.
    suggested_encoding: Prefer an explicit repository file-edit surface over assumed interpreter aliases.
    fp: 50cd86981408
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: 2026-08-18T03:22:52.397Z
---

# Retro — Issue 40 Research
