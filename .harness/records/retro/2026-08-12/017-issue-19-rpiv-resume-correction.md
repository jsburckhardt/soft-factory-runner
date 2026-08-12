---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/19-rpiv-progress-and-instructions"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-12T10:01:25.950Z"
agent: "rpiv"
plan_id: "19-define-rpiv-progress-final-result-ownership-and-integration-instructions"
schema_version: "1.2"
retro_id: "2026-08-12T10:01:25Z-rpiv-acde222891a2"
started_at: "2026-08-12T09:45:49.578Z"
ended_at: "2026-08-12T10:01:25.950Z"
summary: "The resumed issue-19 coordinator returned one phase-reporting defect to Implement and encountered unavailable direct CLI and missing Runner snapshot boundaries without fabricating runtime artifacts."
entries:
  - id: COORD-001
    kind: coordination
    description: "Final issue 19 verification found missing progress exposes the last accepted phase instead of unknown after the single correction cycle."
    target: project
    severity: blocking
    workaround: "Returned the exact AC-8 and AC-13 defect to Implement for a minimal code, test, documentation, and evidence correction."
    suggested_encoding: "Keep direct status and list coverage for missing current progress after a persisted accepted phase."
    fp: "acde222891a2"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T09:45:49.578Z"
  - id: DL-001
    kind: difficulty
    description: "soft-factory instructions command is unavailable on PATH while resuming bound RPIV issue 19"
    target: tooling
    severity: degrading
    workaround: "Used the repository root command surface and existing accepted plan and architecture artifacts instead of assuming a global binary."
    suggested_encoding: "Expose the repository CLI invocation in resumed-stage bindings when the global binary is unavailable."
    fp: "b637cc6180eb"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T09:48:21.028Z"
  - id: COORD-002
    kind: coordination
    description: "Resumed issue 19 checkout has no bound Runner snapshot, so the mandated injected implement progress helper returns STATE_NOT_FOUND"
    target: tooling
    severity: degrading
    workaround: "Continued the explicitly resumed correction without inventing a snapshot or progress artifact and preserved the observable STATE_NOT_FOUND fact."
    suggested_encoding: "Represent detached resumed RPIV corrections explicitly so progress publication absence is expected and inspectable."
    fp: "a91d2e1b39d7"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T09:49:28.851Z"
---

# Retro — Issue 19 coordinator resumed correction

Scaffolded by harness record retro for issue-19-rpiv-resume-correction; all three pending coordinator observations are preserved with kept disposition.
