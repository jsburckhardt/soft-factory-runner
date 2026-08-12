---
record_kind: "retro"
harness_version: "0.13.0"
branch: "copilot-fix"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-12T12:08:06.211Z"
agent: "rpiv-implementer"
plan_id: "1-deliver-the-soft-factory-runner-mvp"
schema_version: "1.2"
retro_id: "2026-08-12T12:03:58Z-rpiv-implementer-c1585bdf3bed"
started_at: "2026-08-12T12:03:58.415Z"
ended_at: "2026-08-12T12:06:32.576Z"
summary: "Implementation resolved missing and incorrectly hoisted test dependencies, retried unavailable editing and blocked assertion commands, and adapted targeted test evidence around the global coverage gate."
entries:
  - id: DL-001
    kind: difficulty
    description: "Focused validation could not start because Jest dependencies were absent; root just setup is required before validation."
    target: tooling
    severity: degrading
    workaround: "Ran the root setup recipe before retrying focused validation."
    suggested_encoding: "Have validation report the setup recipe as the next action when dependencies are absent."
    fp: "c1585bdf3bed"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T12:03:58.415Z"
  - id: DL-002
    kind: difficulty
    description: "After root setup, focused validation still failed because ts-jest could not resolve jest-util; dependency installation required backtracking."
    target: tooling
    severity: degrading
    workaround: "Reinstalled from the tracked lock and supplied a transient root peer link to the installed Jest utility package."
    suggested_encoding: "Lock or explicitly declare the ts-jest jest-util peer so root setup yields a runnable tree."
    fp: "bf9e432d5206"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T12:04:18.930Z"
  - id: DL-003
    kind: difficulty
    description: "The planned file edit retry was needed because the environment exposes Node but no python executable."
    target: tooling
    severity: annoying
    workaround: "Used Node for the scoped file edit."
    suggested_encoding: "Document Node as the repository file-edit runtime."
    fp: "ca1c7087e1eb"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T12:05:23.470Z"
  - id: DL-004
    kind: difficulty
    description: "The exact-fence assertion was blocked by shell-security because command substitution was disallowed; validation needed an awk-only rewrite."
    target: tooling
    severity: annoying
    workaround: "Rewrote the assertion as one awk program without command substitution."
    suggested_encoding: "Prefer shell-security-safe static assertions in generated test plans."
    fp: "ad76d8a75eb0"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T12:05:45.436Z"
  - id: DL-005
    kind: difficulty
    description: "TEST-3 targeted suites all passed, but the root test recipe exited 1 because partial-suite coverage cannot meet the global 80 percent threshold; proof required a coverage-disabled retry."
    target: plan
    severity: degrading
    workaround: "Retried the same five suites through the root test recipe with coverage disabled, then proved global coverage through full verification."
    suggested_encoding: "Give targeted test plans a root recipe that disables global coverage while retaining full-gate coverage."
    fp: "6409f8e51e36"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T12:06:32.576Z"
---

# Retro — Issue 1 Implement

Preserves all pending Implement observations for the Issue 1 implementation handoff.
