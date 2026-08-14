---
record_kind: retro
harness_version: 0.13.0
branch: feat/27-single-soft-factory-agent
repo: https://github.com/jsburckhardt/soft-factory-runner.git
created_at: 2026-08-14T08:13:06.439Z
agent: rpiv-verifier
plan_id: 27-ship-only-the-soft-factory-delivery-agent-at-the-copilot-project-agent-path
schema_version: '1.2'
retro_id: 2026-08-14T08:13:06.439Z-rpiv-verifier-013
started_at: 2026-08-14T08:12:46.463Z
ended_at: 2026-08-14T08:13:06.439Z
summary: Acceptance and pull-request publication succeeded, but immutable Runner result publication was blocked because this checkout has no bound v4 run snapshot or injected helper binding.
entries:
  - id: COORD-001
    kind: coordination
    description: >-
      Immutable AgentResultV1 publication through the documented Runner helper failed with STATE_NOT_FOUND because no bound v4 Runner snapshot or injected helper binding exists.
    target: tooling
    workaround: Preserved the pre-existing candidate and absent destination, retained the verified PR, and returned the publication blocker to the coordinator rather than bypassing Runner ownership.
    suggested_encoding: Inject the IntegrationLaunchV1 binding and exact helper command into verifier sessions or provide a read-only bound-publication harness verb.
    fp: f29171c0629f
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: 2026-08-14T08:12:46.463Z
---

# Retro — Issue 27 immutable publication blocker

The verifier did not create or modify a Runner snapshot and did not bypass the no-clobber helper.
