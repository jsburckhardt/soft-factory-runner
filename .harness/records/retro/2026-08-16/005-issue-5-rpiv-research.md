---
record_kind: "retro"
harness_version: "0.13.0"
branch: "fix/5-reconcile-successful-terminal-result"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-16T12:13:07.302Z"
agent: "rpiv-research"
plan_id: "5-phase-3-recover-safely-and-run-distinct-issues-concurrently"
schema_version: "1.2"
retro_id: "2026-08-16T12:13:07Z-rpiv-research-9de7c33c40a8"
started_at: "2026-08-16T11:36:23Z"
ended_at: "2026-08-16T12:13:07Z"
summary: "Research required exact local merge-tree and Git-object inspection because GitHub conflict metadata, branch-local inventories, output bounds, missing ripgrep, and runtime command availability did not directly expose the required integration evidence."
entries:
  - id: DL-001
    kind: difficulty
    description: "GitHub PR metadata reports PR #33 as conflicting but does not enumerate conflicted paths; local merge-tree inspection is required for exact overlap proof."
    target: tooling
    severity: annoying
    fp: "9de7c33c40a8"
    disposition: kept
    system:
      compound: { status: open, source: agent-self, first_seen_at: "2026-08-16T11:36:23.622Z" }
  - id: DL-002
    kind: difficulty
    description: "The Issue #34 artifact inventory initially searched the checked-out stale PR #33 branch, where that main-only directory is absent; inspection had to backtrack to git ls-tree/show on main."
    target: project
    severity: annoying
    workaround: "Read the main tree directly with git ls-tree and git show."
    fp: "b7e787ade998"
    disposition: kept
    system:
      compound: { status: open, source: agent-self, first_seen_at: "2026-08-16T11:36:37.430Z" }
  - id: DL-003
    kind: difficulty
    description: "Bundled git-show/diff evidence exceeded tool output limits and was saved to temporary files, requiring targeted searches and ranged reads to recover source, docs, and architecture findings."
    target: tooling
    severity: annoying
    workaround: "Used targeted searches and ranged reads."
    fp: "05c305d5fbbd"
    disposition: kept
    system:
      compound: { status: open, source: agent-self, first_seen_at: "2026-08-16T11:37:07.865Z" }
  - id: DL-004
    kind: difficulty
    description: "The tool suggested ripgrep for oversized outputs, but rg is not installed in this repository environment; all five parallel searches failed and must be retried with grep."
    target: tooling
    severity: degrading
    workaround: "Retried all searches with grep."
    fp: "e2456f9d55fc"
    disposition: kept
    system:
      compound: { status: open, source: agent-self, first_seen_at: "2026-08-16T11:37:36.279Z" }
  - id: DL-005
    kind: difficulty
    description: "The first research brief write failed because the documented generic python command is unavailable; the repository environment provides python3 instead, requiring a write retry."
    target: tooling
    severity: annoying
    workaround: "Retried with the available runtime."
    fp: "33be2d6536b5"
    disposition: kept
    system:
      compound: { status: open, source: agent-self, first_seen_at: "2026-08-16T11:42:05.574Z" }
---

# Retro — Issue #5 integration Research

All five pending Research observations are preserved for Verify harvest.
