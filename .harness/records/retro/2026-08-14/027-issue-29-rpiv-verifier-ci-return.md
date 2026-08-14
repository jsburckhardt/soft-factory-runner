---
record_kind: "retro"
harness_version: "0.13.0"
branch: "fix/29-tmux-preparation-diagnostics"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-14T13:43:07.045Z"
agent: "rpiv-verifier"
plan_id: "29-preserve-retryable-tmux-preparation-failures-with-bounded-identity-diagnostics"
schema_version: "1.2"
retro_id: "2026-08-14T13:43:07.045Z-rpiv-verifier-ded1a571"
started_at: "2026-08-14T13:42:47.041Z"
ended_at: "2026-08-14T13:43:07.045Z"
summary: "PR CI invalidated the local acceptance result by exposing a portable Doctor built-process identity failure in both supported Node matrix jobs, requiring return to Implement."
entries:
  - id: DL-001
    kind: difficulty
    description: "PR #30 CI exposed a cross-environment Doctor integration failure after local just verify passed: Node 22 and Node 24 each failed four src/doctor-integration.test.ts cases because controlled built-process evidence became process-identity-unknown; the same 7-test suite passes locally, so AC-9 and AC-10 lack portable proof."
    target: "src/doctor-integration.test.ts and Doctor process identity verification"
    severity: blocking
    workaround: "Return the code/test portability defect to Implement without modifying application code or tests."
    suggested_encoding: "Exercise the built Doctor process fixture in the repository CI matrix before Verify shipping and preserve the intended failure reason when cleanup identity proof diverges."
    fp: "ded1a571ecef"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T13:42:47.041Z"
---

# Retro — Issue #29 rpiv-verifier CI return

Durable drain of the blocking CI portability failure discovered after PR creation.
