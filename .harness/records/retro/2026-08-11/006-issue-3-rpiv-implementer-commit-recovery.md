---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/3-run-isolated-visible"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-11T08:12:39.825Z"
agent: "rpiv-implementer"
plan_id: "3-phase-1-run-one-issue-in-an-isolated-visible-environment"
schema_version: "1.2"
retro_id: "2026-08-11T08:12:39Z-rpiv-implementer-168a78193f93"
started_at: "2026-08-11T08:11:35.287Z"
ended_at: "2026-08-11T08:12:39.825Z"
summary: "A second direct harness commit failed and the prescribed collector installation could not safely replace machine-wide trace2 configuration."
entries:
  - id: "DL-001"
    kind: "difficulty"
    description: "The second harness commit retry failed identically after a connected probe with git exit 128 and no buffer, so the required commit path remains blocked pending harness or git-ai socket remediation."
    target: "tooling"
    severity: "blocking"
    workaround: "Inspected harness doctor and preserved the staged implementation for a documented buffered-and-named retry."
    suggested_encoding: "Re-probe the socket during commit and fall back to a named buffer when commit-time ingress fails."
    fp: "168a78193f93"
    disposition: "kept"
    system:
      compound:
        status: "open"
        source: "agent-self"
        first_seen_at: "2026-08-11T08:11:35.287Z"
  - id: "DL-002"
    kind: "difficulty"
    description: "The prescribed collector install remained degraded and refused because replacing the global trace2 section would be machine-wide and destructive; commit recovery must use the harness documented buffered-and-named mode instead."
    target: "tooling"
    severity: "blocking"
    workaround: "Declined destructive global replacement and selected the documented local plain-file trace target for a named buffered commit."
    suggested_encoding: "Offer a repository-scoped harness command that forces buffered commit mode without global trace2 mutation."
    fp: "365e842ca4a9"
    disposition: "kept"
    system:
      compound:
        status: "open"
        source: "agent-self"
        first_seen_at: "2026-08-11T08:12:19.539Z"
---

# Retro — Issue 3 Implement commit recovery

Durable evidence for the second failed commit and safe recovery selection.
