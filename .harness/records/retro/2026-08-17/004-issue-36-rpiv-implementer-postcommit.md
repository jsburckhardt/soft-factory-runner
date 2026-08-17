---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/36-preserve-invoking-tmux-context"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-17T02:08:29.332Z"
agent: "rpiv-implementer"
plan_id: "36-preserve-the-invoking-tmux-server-and-session-for-issue-windows"
schema_version: "1.2"
retro_id: "2026-08-17T02:08:30Z-rpiv-implementer-5cf5e6233458"
started_at: "2026-08-17T02:06:53.891Z"
ended_at: "2026-08-17T02:08:30Z"
summary: "Post-commit validation found and corrected a deletion-proof test that depended on the uncommitted diff rather than durable Git history."
entries:
  - id: DL-001
    kind: difficulty
    description: "Post-commit full validation showed the deletion proof test depended on an uncommitted diff; changed it to verify each absent path's committed deletion history."
    target: project
    severity: degrading
    workaround: "Resolve each constructed deleted path through Git history and require the latest touching commit to report a deletion."
    suggested_encoding: "Repository deletion proofs should validate durable committed history rather than only the working-tree diff."
    fp: "5cf5e6233458"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-17T02:06:53.891Z"
---

# Retro — Issue 36 post-commit implementation

The corrected proof remains literal-free on live deleted names while validating committed deletion history.
