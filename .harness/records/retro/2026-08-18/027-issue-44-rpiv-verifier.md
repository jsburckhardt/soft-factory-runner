---
record_kind: "retro"
harness_version: "0.13.0"
branch: "fix/44-complete-live-cleanup-retries-after-tmux-removal"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-18T12:33:42.704Z"
agent: "rpiv-verifier"
plan_id: "44-complete-live-cleanup-retries-after-exact-tmux-target-removal"
schema_version: "1.2"
retro_id: "2026-08-18T12:33:42Z-rpiv-verifier-9d762921fe1f"
started_at: "2026-08-18T11:37:26.989Z"
ended_at: "2026-08-18T12:45:41.002Z"
summary: "Verification first returned incomplete acceptance proof to Implement, then independently reverified the corrected exact handoff, full gates, documentation, offline package, and prior gaps. Optional tooling limitations caused bounded inspection retries without changing the authoritative validation interface."
entries:
  - id: DL-001
    kind: difficulty
    description: "Harness doctor returned degraded because telemetry capture liveness was absent and git-ai was not on PATH, although repository gates remained ready."
    target: tooling
    severity: annoying
    workaround: "Evaluated the JSON layer statuses and continued with authoritative harness checks and direct just recipes."
    suggested_encoding: "Expose a verification-readiness verdict separately from optional attribution diagnostics."
    fp: "caeb1eb763e9"
    disposition: kept
    system: { compound: { status: open, source: agent-self, first_seen_at: "2026-08-18T11:37:26.989Z" } }
  - id: DL-002
    kind: difficulty
    description: "Repository inspection commands using rg failed because ripgrep is unavailable, requiring backtracking to grep and targeted file reads."
    target: tooling
    severity: annoying
    workaround: "Used grep -n and direct view ranges instead of installing or inventing validation commands."
    suggested_encoding: "Include ripgrep in the development environment or document grep-compatible inspection examples."
    fp: "25bbd184298f"
    disposition: kept
    system: { compound: { status: open, source: agent-self, first_seen_at: "2026-08-18T11:39:52.715Z" } }
  - id: DL-003
    kind: difficulty
    description: "Acceptance review found missing proof: no cleanup/retry overlap test, the real tmux fixture does not retry the persisted partial state or repeat idempotently, and required refusal rows are incomplete."
    target: project
    severity: blocking
    workaround: "Marked the affected acceptance criteria failed and returned test defects to Implement instead of inferring coverage."
    suggested_encoding: "Add an AC-indexed verification manifest test that fails when each required matrix and overlap row lacks executable evidence."
    fp: "4389a52acd37"
    disposition: kept
    system: { compound: { status: open, source: agent-self, first_seen_at: "2026-08-18T11:46:21.190Z" } }
  - id: DL-004
    kind: difficulty
    description: "Dependency comparison required a retry because the documented environment suggested python but only Node is available."
    target: tooling
    severity: annoying
    workaround: "Reran the issue-start dependency and lock comparison with repository-available Node."
    suggested_encoding: "Document Node-based repository inspection examples for this TypeScript environment."
    fp: "9d762921fe1f"
    disposition: kept
    system: { compound: { status: open, source: agent-self, first_seen_at: "2026-08-18T12:32:34.277Z" } }
  - id: DL-005
    kind: difficulty
    description: "Verifier retro editing required a retry because the expected apply_patch helper is unavailable in this environment."
    target: tooling
    severity: annoying
    workaround: "Used repository-available Node to write the generated metadata record without touching application files."
    suggested_encoding: "Expose a deterministic harness command for filling a retro scaffold from a JSON observation envelope."
    fp: "10939ee045f3"
    disposition: kept
    system: { compound: { status: open, source: agent-self, first_seen_at: "2026-08-18T12:35:25.732Z" } }
  - id: COORD-001
    kind: coordination
    description: "Immutable result publication could not complete because no bound Runner snapshot or injected helper exists for Issue 44 in this verification workspace."
    target: infra
    workaround: "Preserved the existing Issue 25 candidate and returned publication failure rather than writing an unbound artifact."
    suggested_encoding: "Always inject the run-bound no-clobber publish and validate commands into verifier sessions."
    fp: "c6536e3a01c3"
    disposition: kept
    system: { compound: { status: open, source: agent-self, first_seen_at: "2026-08-18T12:45:41.002Z" } }
---

# Retro — Issue 44 RPIV verification

All pending verifier observations were preserved before clearing the transient buffer.
