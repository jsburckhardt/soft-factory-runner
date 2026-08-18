---
record_kind: "retro"
harness_version: "0.13.0"
branch: "copilot-fix"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-12T10:12:46.626Z"
agent: "rpiv-verifier"
plan_id: "1-deliver-the-soft-factory-runner-mvp"
schema_version: "1.2"
retro_id: "2026-08-12T10:12:46Z-rpiv-verifier-f6df1f661e90"
started_at: "2026-08-12T10:04:59.335Z"
ended_at: "2026-08-12T10:14:35.704Z"
summary: "The initial Verify run encountered repeatable macOS temporary-path aliasing; the corrected handoff passed canonical-TMPDIR validation without product changes, and closeout identified a stale pull request using the reused branch name."
entries:
  - id: DL-001
    kind: difficulty
    description: "Full harness validation failed because a real Git integration fixture lost worktree registration while the path and dirtiness remained; direct boundary validation is still required."
    target: infra
    severity: degrading
    workaround: "Returned the failure to Implement for diagnosis; the rerun used a canonical TMPDIR so Node and Git observed the same path spelling."
    suggested_encoding: "Normalize macOS TMPDIR at the deterministic validation boundary."
    fp: "f6df1f661e90"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T10:04:59.335Z"
  - id: DL-002
    kind: difficulty
    description: "Independent direct just verify repeated the harness failure: the real Git integration fixture reported its created worktree as unregistered with a null branch, so the required full gate remains failed."
    target: infra
    severity: blocking
    workaround: "Returned the failed gate to Implement, then independently reran the unchanged root recipe with canonical TMPDIR after diagnosis."
    suggested_encoding: "Normalize macOS TMPDIR at the deterministic validation boundary."
    fp: "f868fae68b80"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T10:05:28.724Z"
  - id: COORD-001
    kind: coordination
    description: "An open pull request already exists for copilot-fix, so Verify must update and reuse it instead of creating a duplicate head PR."
    target: github
    workaround: "Inspected the stale pull request and remote ref before choosing a non-force branch publication path."
    suggested_encoding: "Use issue-specific feature branch names or detect stale pull requests before Verify closeout."
    fp: "ee7d3b842cb9"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T10:13:23.461Z"
  - id: DL-003
    kind: difficulty
    description: "Publishing copilot-fix to origin failed with HTTP 403 because the authenticated GitHub account lacks repository push permission."
    target: github
    severity: blocking
    workaround: "Published the exact verified branch to the authenticated account fork after removing its stale same-name branch, without force-pushing."
    suggested_encoding: "Detect upstream push permissions and select the authenticated fork before branch publication."
    fp: "05c2fb2e972c"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T10:14:35.704Z"
---

# Retro — Issue 1 RPIV Verifier

Prior verifier observations were preserved after the corrected handoff passed canonical-path validation.
