---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/27-single-soft-factory-agent"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-14T07:49:46.325Z"
agent: "rpiv-implementer"
plan_id: "27-ship-only-the-soft-factory-delivery-agent-at-the-copilot-project-agent-path"
schema_version: "1.2"
retro_id: "2026-08-14T07:50:09.925Z-rpiv-implementer-issue27-second-return-evidence"
started_at: "2026-08-14T07:49:09.801Z"
ended_at: "2026-08-14T07:50:09.925Z"
summary: "Implementation-evidence read-back required a bounded range retry and exposed malformed section-symbol typography, both corrected before handoff."
entries:
  - id: DL-001
    kind: difficulty
    description: "A post-edit implementation-note read requested a line range beyond the shortened file and failed; retried with the actual final range."
    target: "tooling"
    severity: "annoying"
    workaround: "Read the note from line 130 through its actual end before handoff."
    fp: "cba35e69ed12"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T07:49:09.801Z"
  - id: DL-002
    kind: difficulty
    description: "Read-back exposed that placeholder replacement converted PRD section symbols in implementation evidence into double backticks; corrected the evidence typography."
    target: "tooling"
    severity: "annoying"
    workaround: "Replace only the three malformed PRD section references with literal section symbols."
    fp: "ab11bd536481"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T07:49:27.482Z"
---

# Retro — Issue 27 second-return evidence

Both observations affected evidence authoring only; no runtime, PRD contract, or test behavior changed during their correction.
