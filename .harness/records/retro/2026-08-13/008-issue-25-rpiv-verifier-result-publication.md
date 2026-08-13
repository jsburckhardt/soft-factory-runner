---
record_kind: "retro"
harness_version: "0.13.0"
branch: "fix/25-reproducible-clean-install-ci"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-13T03:54:34.917Z"
agent: "rpiv-verifier"
plan_id: "25-make-clean-installs-and-delivery-verification-reproducible"
schema_version: "1.2"
retro_id: "2026-08-13T03:54:07Z-rpiv-verifier-fc67de2e471c"
started_at: "2026-08-13T03:54:07.500Z"
ended_at: "2026-08-13T03:54:34.917Z"
summary: "The strict no-clobber AgentResultV1 publication attempt failed safely because this checkout has no coordinator-injected Runner snapshot binding."
entries:
  - id: COORD-001
    kind: coordination
    description: "Immutable AgentResultV1 publication through the repository Runner helper failed with STATE_NOT_FOUND because no bound Runner snapshot exists; the helper preserved the absent destination and instructed use of coordinator injection."
    target: tooling
    severity: blocking
    workaround: "Preserved the destination, retained the candidate as ignored transient state, and reported the coordinator binding requirement rather than bypassing the helper."
    suggested_encoding: "Always inject a callable bound publication helper into Verify-stage environments, including direct API stage invocations."
    fp: "fc67de2e471c"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-13T03:54:07.500Z"
---

# Retro — Issue 25 immutable result publication

Publication failed safely and no immutable destination artifact was clobbered or created.
