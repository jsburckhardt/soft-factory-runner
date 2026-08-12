---
record_kind: "retro"
harness_version: "0.13.0"
branch: "copilot-fix"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-12T11:07:42.566Z"
agent: "rpiv-verifier"
plan_id: "17-configure-environment-variables-for-runner-launched-copilot-processes"
schema_version: "1.2"
retro_id: "2026-08-12T11:07:42Z-rpiv-verifier-ac-catalog-gap"
started_at: "2026-08-12T11:06:13.977Z"
ended_at: "2026-08-12T11:07:56.808Z"
summary: "Verification proved the exact handoff and corrected safe-TMPDIR gate, but the requested AC-14 through AC-16 do not exist in the authoritative acceptance catalog; persisting this result also required one tooling retry."
entries:
  - id: "CONF-001"
    kind: confusion
    description: "Requested AC-14 through AC-16 are absent from the sole Issue 17 action plan and GitHub issue; acceptance ownership cannot be inferred safely."
    target: "plan"
    workaround: "Verified the sole action plan and marker-bounded GitHub criteria, then returned the acceptance catalog gap to Plan rather than inventing criteria."
    suggested_encoding: "Add stable AC-14 through AC-16 text and coverage to the action plan and GitHub issue, or correct the handoff to reference AC-1 through AC-13."
    fp: "6ab71c8a18b9"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T11:07:34.751Z"
  - id: "DL-001"
    kind: difficulty
    description: "Verifier retro persistence retry was required because the expected python executable is unavailable in this repository environment."
    target: "tooling"
    severity: "annoying"
    workaround: "Retried the same metadata-only write with the available python3 executable."
    suggested_encoding: "Use the repository-available runtime explicitly for verifier metadata generation."
    fp: "8c34636bc627"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T11:07:56.808Z"
---

# Retro — Issue 17 verifier acceptance-catalog gap

The canonical `/private/tmp` validation passed and preserved the checkout, but acceptance cannot close against undefined criterion IDs.
