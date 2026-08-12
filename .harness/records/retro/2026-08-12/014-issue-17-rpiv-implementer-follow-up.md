---
record_kind: "retro"
harness_version: "0.13.0"
branch: "copilot-fix"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-12T10:02:53.471Z"
agent: "rpiv-implementer"
plan_id: "17-configure-environment-variables-for-runner-launched-copilot-processes"
schema_version: "1.2"
retro_id: "2026-08-12T10:02:53Z-rpiv-implementer-84f536300cde"
started_at: "2026-08-12T09:52:09.863Z"
ended_at: "2026-08-12T10:02:53.471Z"
summary: "The recovered checkout required dependency-installation backtracking under npm 11 and two formatting retries before the documentation-only follow-up passed focused and full validation."
entries:
  - id: "DL-001"
    kind: "difficulty"
    description: "Pre-implementation harness boot failed because the recovered checkout lacked installed npm dependencies and tsc was unavailable; root just setup was required."
    target: "tooling"
    severity: "annoying"
    workaround: "Ran the root setup recipe before retrying boot."
    suggested_encoding: "Have boot report the setup recipe explicitly when project binaries are absent."
    fp: "84f536300cde"
    disposition: "kept"
    system:
      compound:
        status: "open"
        source: "agent-self"
        first_seen_at: "2026-08-12T09:52:09.863Z"
  - id: "DL-002"
    kind: "difficulty"
    description: "After root just setup, npm rewrote package-lock optional peer entries and harness full checks failed coverage collection because root jest-util was missing; dependency installation needed backtracking to the committed lock."
    target: "tooling"
    severity: "degrading"
    workaround: "Restored the committed lock and replaced the npm 11 install."
    suggested_encoding: "Pin a supported npm major in project setup and clean-checkout automation."
    fp: "bae968679e04"
    disposition: "kept"
    system:
      compound:
        status: "open"
        source: "agent-self"
        first_seen_at: "2026-08-12T09:53:51.750Z"
  - id: "DL-003"
    kind: "difficulty"
    description: "The first dependency workaround changed the installed tree and focused validation then timed out in integration tests and misobserved a Git worktree; the workaround was discarded in favor of reinstalling with a compatible npm major."
    target: "tooling"
    severity: "degrading"
    workaround: "Removed node_modules and reinstalled the committed lock with npm 10.9.2."
    suggested_encoding: "Encode the compatible npm major in the root setup recipe."
    fp: "acc7e1c65e7b"
    disposition: "kept"
    system:
      compound:
        status: "open"
        source: "agent-self"
        first_seen_at: "2026-08-12T09:57:27.712Z"
  - id: "DL-004"
    kind: "difficulty"
    description: "The first full root validation failed only because the new documentation assertion did not satisfy Prettier line wrapping; the assertion was reformatted before rerunning validation."
    target: "tooling"
    severity: "annoying"
    workaround: "Reformatted the changed assertion and reran focused and full validation."
    suggested_encoding: "Expose an approved root formatting-write recipe for deterministic fixes."
    fp: "5adff5673de8"
    disposition: "kept"
    system:
      compound:
        status: "open"
        source: "agent-self"
        first_seen_at: "2026-08-12T10:00:26.311Z"
  - id: "CONF-001"
    kind: "confusion"
    description: "Prettier still rejected the manually wrapped assertion without showing the expected diff, so formatter stdout had to be inspected to discover that the constant assignment should remain on one line."
    target: "tooling"
    severity: "annoying"
    workaround: "Inspected formatter stdout and applied its exact line layout manually."
    suggested_encoding: "Add a root formatting-write or formatting-diff recipe."
    fp: "272acae97796"
    disposition: "kept"
    system:
      compound:
        status: "open"
        source: "agent-self"
        first_seen_at: "2026-08-12T10:01:09.316Z"
---

# Retro — Issue 17 Implement follow-up

Recovered implementation documentation and regression evidence after the prior checkout loss.
