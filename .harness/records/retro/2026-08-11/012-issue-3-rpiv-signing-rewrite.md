---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/3-run-isolated-visible"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-11T11:43:08.676Z"
agent: "rpiv"
plan_id: "3-phase-1-run-one-issue-in-an-isolated-visible-environment"
schema_version: "1.2"
retro_id: "2026-08-11T11:43:08Z-rpiv-34eedf1d8bb0"
started_at: "2026-08-11T11:40:36Z"
ended_at: "2026-08-11T11:43:08Z"
summary: "Re-signed all Issue #3 pull request commits after the shared repository signing key became available and repaired rewritten SHA references."
entries:
  # One block per observation. id = <PREFIX>-<3+ digits>. Any uppercase prefix is valid;
  # DL/MW/GFT/INS/COORD/SUGG/CONF/WIN are the recommended per-kind defaults, and run-scoped
  # prefixes (e.g. VF- for a flow worker's own numbering) are equally fine.
  # kind in difficulty | magic-wand | gift | insight | coordination | improvement-suggestion | confusion | win
  - id: DL-001
    kind: difficulty
    description: "The required apply_patch editing command was unavailable, so the commit-rewrite metadata fix required a verified exact sed replacement."
    target: tooling
    severity: annoying
    workaround: "Used an exact sed replacement and inspected the resulting diff before amending."
    suggested_encoding: "Expose apply_patch consistently in CLI sessions that require patch-only edits."
    fp: "34eedf1d8bb0"
    disposition: kept                        # 1.2 (optional) drain outcome: fixed-now|task|plan|diffs|command|kept|declined|deferred
                                             #   drain-time decision; distinct from system.compound.status (long-horizon lifecycle)
    system:
      compound:                             # CONVENTION (open 'system' object), not a schema field
        status: open                        # open | suggested | encoded | wontfix | stale | dismissed
        source: agent-self                  # user | agent-self
        first_seen_at: "2026-08-11T11:42:21.250Z"
---

# Retro — Issue #3 signing rewrite

<!-- Optional human narrative. The structured `entries` above are the durable signal. -->
