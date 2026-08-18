---
record_kind: "retro"
harness_version: "0.13.0"
branch: "fix/42-clean-exact-owned-dead-pane-window"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-18T07:48:52.170Z"
agent: "rpiv-research"
plan_id: "42-allow-explicit-cleanup-of-an-exact-owned-tmux-window-with-a-dead-pane"
schema_version: "1.2"
retro_id: "2026-08-18T07:48:52Z-rpiv-research-issue42"
started_at: "2026-08-18T06:23:19.155Z"
ended_at: "2026-08-18T07:48:52.492Z"
summary: "Research established the exact dead-pane problem and deferred external Sparkta work while adapting to missing repository search and Python tooling."
entries:
  - id: DL-001
    kind: difficulty
    description: "Repository search command failed because ripgrep is not installed; using grep instead."
    target: tooling
    severity: annoying
    workaround: "Used grep/find for finite repository searches."
    suggested_encoding: "Expose repository-safe search/edit/serialized validation helpers through the harness or root command surface."
    fp: "40182693e079"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-18T06:23:19.155Z"
  - id: DL-002
    kind: difficulty
    description: "Live Sparkta issue 7 repository and persisted Runner state were not mounted locally; GitHub issue facts were reachable, but local status and exact tmux pane could not be independently correlated."
    target: tooling
    severity: annoying
    workaround: "Kept Sparkta inspection as a deferred non-gating operator handoff."
    suggested_encoding: "Expose repository-safe search/edit/serialized validation helpers through the harness or root command surface."
    fp: "7fc4965505d0"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-18T06:25:40.746Z"
  - id: DL-003
    kind: difficulty
    description: "Research brief write attempt failed because only python3 is installed; retrying with the available interpreter without output redirection."
    target: tooling
    severity: annoying
    workaround: "Retried with the available runtime."
    suggested_encoding: "Expose repository-safe search/edit/serialized validation helpers through the harness or root command surface."
    fp: "54ec955617bd"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-18T06:35:02.434Z"
  - id: DL-004
    kind: difficulty
    description: "Second research write attempt found the available python3 lacks even the standard json module; switching to Node.js for artifact creation."
    target: tooling
    severity: annoying
    workaround: "Inspected available runtimes and changed the artifact editing approach."
    suggested_encoding: "Expose repository-safe search/edit/serialized validation helpers through the harness or root command surface."
    fp: "891591696ce2"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-18T06:38:46.784Z"
  - id: DL-005
    kind: difficulty
    description: "Generated brief initially retained literal interpolation placeholders because braces were escaped; corrected the acceptance criteria and session identity before validation."
    target: tooling
    severity: annoying
    workaround: "Read back and corrected every interpolation placeholder."
    suggested_encoding: "Expose repository-safe search/edit/serialized validation helpers through the harness or root command surface."
    fp: "2d9b0bbf4f51"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-18T06:40:30.600Z"
  - id: INS-001
    kind: insight
    description: "Correction to DL-004: after inspecting the incomplete Python installation, artifact creation used python3 os/pathlib rather than Node.js."
    target: tooling
    workaround: "Recorded the corrected runtime provenance."
    suggested_encoding: "Expose repository-safe search/edit/serialized validation helpers through the harness or root command surface."
    fp: "28de4bb0c3a7"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-18T06:41:06.142Z"
---

# Retro — Issue 42 rpiv-research

All pending observations were preserved from the transient stage buffer.
