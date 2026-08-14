---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/27-single-soft-factory-agent"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-14T07:47:07.204Z"
agent: "rpiv-implementer"
plan_id: "27-ship-only-the-soft-factory-delivery-agent-at-the-copilot-project-agent-path"
schema_version: "1.2"
retro_id: "2026-08-14T07:47:26.921Z-rpiv-implementer-issue27-second-verify-return"
started_at: "2026-08-14T07:39:35.375Z"
ended_at: "2026-08-14T07:47:26.921Z"
summary: "Second Verify return identified stale PRD lifecycle authorization; Implement aligned all current delivery-agent surfaces and added a scoped regression contract."
entries:
  - id: COORD-001
    kind: coordination
    description: "Second Verify return found stale PRD sections that still authorized lifecycle commands for the official agent despite the delivery-only architecture."
    target: "project"
    workaround: "Rewrite every current PRD delivery-agent surface and add scoped regression assertions without changing runtime behavior."
    fp: "442612098e6c"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T07:39:35.375Z"
  - id: DL-001
    kind: difficulty
    description: "The first PRD regression-test insertion failed because nested template and Markdown backticks broke shell quoting; the PRD wording edit succeeded separately."
    target: "tooling"
    severity: "annoying"
    workaround: "Build the test block with placeholder delimiters and replace them after construction."
    fp: "dc09fcf7868f"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T07:41:35.230Z"
---

# Retro — Issue 27 second verification return

The correction changed only PRD current-surface language, documentation regression assertions, task/evidence notes, and this durable record.
