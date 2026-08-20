---
record_kind: "retro"
harness_version: "0.13.0"
branch: "issue-46-stable-0.2.1"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-20T07:15:38.084Z"
agent: "rpiv-research"
plan_id: "46-promote-0-2-1-beta-3-to-stable-0-2-1"
schema_version: "1.2"
retro_id: "2026-08-20T07:15:38.084Z-rpiv-research-3ce36051ffb4"
started_at: "2026-08-20T06:35:25.202Z"
ended_at: "2026-08-20T07:16:13.780Z"
summary: "Issue 46 rpiv-research observations were drained after durable capture; all 13 concrete entries are retained for Verify harvest."
entries:
  - id: "DL-001"
    kind: "difficulty"
    description: "Research version-reference search could not use rg because the command is unavailable; must fall back to grep."
    target: "tooling"
    severity: "annoying"
    workaround: "Use recursive grep with explicit exclusions."
    suggested_encoding: "Provide rg in the development environment or expose a harness repository-search verb."
    fp: "3ce36051ffb4"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-20T06:35:25.202Z"
  - id: "DL-002"
    kind: "difficulty"
    description: "AGENTS.md exceeded the view tool size limit on the first read, requiring a line-count probe and ranged reads."
    target: "tooling"
    severity: "annoying"
    workaround: "Use wc -l, then read AGENTS.md in explicit line ranges."
    suggested_encoding: "Expose file size metadata in repository inventory output before read calls."
    fp: "f5dfe928083f"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-20T06:35:34.812Z"
  - id: "DL-003"
    kind: "difficulty"
    description: "Recursive version search included generated and dependency trees, overflowed tool output, returned exit 2, and triggered an automatic hidden /tmp output save; rerunning with scoped exclusions."
    target: "tooling"
    severity: "degrading"
    workaround: "Exclude node_modules, coverage, .harness, and .git; search governed source/documentation paths explicitly."
    suggested_encoding: "Provide a repository search verb with standard generated-tree exclusions and bounded output."
    fp: "c0e27190a5ba"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-20T06:35:47.557Z"
  - id: "CONF-001"
    kind: "confusion"
    description: "AGENTS.md revealed a mandatory harness boot step only after issue fetch and initial inventory; Research must backtrack to run the boot briefing and boot before continuing."
    target: "plan"
    severity: "degrading"
    workaround: "Pause repository evidence gathering, read harness boot instructions and engineering-harness documentation, then run boot."
    suggested_encoding: "Include mandatory boot in the top-level harness instructions briefing or enforce it automatically for RPIV initialization."
    fp: "9bd2e5b77844"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-20T06:36:03.669Z"
  - id: "DL-004"
    kind: "difficulty"
    description: "Broad version-surface grep exceeded the tool output limit, requiring targeted repository queries."
    target: "tooling"
    severity: "annoying"
    fp: "9e6f0be912ef"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-20T06:40:44.624Z"
  - id: "DL-005"
    kind: "difficulty"
    description: "Filesystem-wide version inventory hit .devcontainer/.tmux-shared with ENXIO and included generated coverage/dist files; tracked git grep was required."
    target: "tooling"
    severity: "annoying"
    fp: "cf80e221b16b"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-20T06:41:39.090Z"
  - id: "COORD-001"
    kind: "coordination"
    description: "The pre-existing untracked beta.3 tarball disappeared during read-only research after its SHA-256 was confirmed; no research command intentionally modified it."
    target: "project"
    severity: "blocking"
    fp: "fe1aac7298bd"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-20T06:41:50.646Z"
  - id: "DL-006"
    kind: "difficulty"
    description: "Combined version-surface inventory exceeded tool output limits and was truncated, requiring narrower follow-up searches."
    target: "tooling"
    severity: "annoying"
    fp: "d80e31019019"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-20T06:49:29.977Z"
  - id: "DL-007"
    kind: "difficulty"
    description: "A broad package-test grep also exceeded output limits, so research had to backtrack to named package governance test files and focused line ranges."
    target: "tooling"
    severity: "annoying"
    fp: "d9e34d306b2a"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-20T06:50:14.979Z"
  - id: "DL-008"
    kind: "difficulty"
    description: "AGENTS.md was read after initial repository inventory, revealing a required harness boot step had been missed; research backtracked to run the boot briefing and boot before continuing."
    target: "tooling"
    severity: "degrading"
    fp: "9351d66f4ec8"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-20T06:50:39.728Z"
  - id: "DL-009"
    kind: "difficulty"
    description: "Repository-wide publication-policy search was swamped by vendored agent skill material and truncated, requiring a narrower search over product and governance paths."
    target: "tooling"
    severity: "annoying"
    fp: "c07d1b8420dd"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-20T06:53:36.163Z"
  - id: "COORD-002"
    kind: "coordination"
    description: "The shared Research buffer contains an earlier blocking observation about a disappeared beta.3 tarball, but revised Issue #46 has removed tarball preservation and the user explicitly states its absence is not a blocker."
    target: "project"
    severity: "annoying"
    fp: "4b2957043da9"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-20T06:53:57.441Z"
  - id: "CONF-002"
    kind: "confusion"
    description: "No repository policy or automation authorizing GitHub tag or release creation was found; only local npm proof and no-registry-publication constraints are explicit, so publication permission remains unresolved."
    target: "plan"
    severity: "degrading"
    fp: "eced07f94f8c"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-20T06:54:19.289Z"
---

# Retro — Issue 46 rpiv-research

Durable pre-verification friction captured for the stable 0.2.1 promotion.
