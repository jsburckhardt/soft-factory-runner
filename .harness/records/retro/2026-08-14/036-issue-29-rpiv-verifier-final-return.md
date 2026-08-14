---
record_kind: "retro"
harness_version: "0.13.0"
branch: "fix/29-tmux-preparation-diagnostics"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-14T15:39:15.389Z"
agent: "rpiv-verifier"
plan_id: "29-preserve-retryable-tmux-preparation-failures-with-bounded-identity-diagnostics"
schema_version: "1.2"
retro_id: "2026-08-14T15:39:15.389Z-rpiv-verifier-4afe98b4"
started_at: "2026-08-14T15:38:41.293Z"
ended_at: "2026-08-14T15:39:15.389Z"
summary: "Exact historical CI identification required GitHub-side backtracking after the first failure-summary push, which itself retriggered the unchanged known-failing hosted matrix from metadata-only changes."
entries:
  - id: DL-001
    kind: difficulty
    description: "Local artifact grep recovered only one prior hosted run ID; branch-wide GitHub Actions history was required after the first failed-summary commit to recover exact initial product and metadata run IDs 31805586261 and 31805718222 for the complete CI-return history."
    target: tooling
    severity: annoying
    workaround: "Queried the complete branch Actions history and inspected both recovered runs directly."
    suggested_encoding: "Retain hosted run IDs and product-versus-metadata head classification in every verification summary."
    fp: "4afe98b4ef8e"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T15:38:41.293Z"
  - id: COORD-001
    kind: coordination
    description: "The required verifier summary/retro push automatically retriggered the unchanged known-failing hosted matrix at metadata head 25274a0: Node 22 and Node 24 again failed the same six Doctor integration tests and Package smoke was skipped, despite the commit changing verification metadata only."
    target: verification-closeout
    severity: degrading
    workaround: "Waited for the automatic run, confirmed both exact job results, and preserved the failure rather than claiming a final green head."
    suggested_encoding: "Separate verification-metadata publication from product CI triggers or define how failed verification metadata checks are classified."
    fp: "73d6a3efad44"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T15:38:41.635Z"
---

# Retro — Issue #29 rpiv-verifier final return

Durable final drain of exact CI-history backtracking and the automatic metadata-head rerun after acceptance had already failed.
