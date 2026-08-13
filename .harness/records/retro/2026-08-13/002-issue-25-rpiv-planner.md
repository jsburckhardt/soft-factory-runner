---
record_kind: retro
harness_version: 0.13.0
branch: fix/25-reproducible-clean-install-ci
repo: 'https://github.com/jsburckhardt/soft-factory-runner.git'
created_at: '2026-08-13T03:31:13.869Z'
agent: rpiv-planner
plan_id: 25-make-clean-installs-and-delivery-verification-reproducible
schema_version: '1.2'
retro_id: '2026-08-13T03:32:45Z-rpiv-planner-bd52b999922e'
started_at: '2026-08-13T03:06:54.292Z'
ended_at: '2026-08-13T03:32:45.000Z'
summary: Planning preserved the user-supplied implementation after scope backtracking and repository-tool retries.
entries:
  - id: CONF-001
    kind: confusion
    description: 'The regenerated package-lock removes 2300 lines beyond the root jest-util addition, so implementation must prove lock consistency and clean-install reproducibility rather than infer correctness from the diff.'
    target: tooling
    severity: degrading
    workaround: 'Planned explicit lock consistency, clean-install, repeat, and hash evidence.'
    fp: bd52b999922e
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: '2026-08-13T03:06:54.292Z'
  - id: DL-001
    kind: difficulty
    description: 'The expected apply_patch editing helper was unavailable after the full plan patch was prepared, requiring a different file-writing method and a complete retry.'
    target: tooling
    severity: annoying
    workaround: Retried plan writing with an available repository runtime.
    fp: e48b050e19e3
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: '2026-08-13T03:09:06.695Z'
  - id: DL-002
    kind: difficulty
    description: The fallback file-writing command also failed because the documented python executable is absent in this environment; planning retried with the available Node.js runtime.
    target: tooling
    severity: annoying
    workaround: Used Node.js for bounded file writing.
    fp: caae9637abfd
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: '2026-08-13T03:09:38.560Z'
  - id: COORD-001
    kind: coordination
    description: 'User clarified that the dirty tree is the completed implementation, requiring Plan to backtrack from proposed new helpers and root recipes to scope-preserving review, evidence, documentation gaps, and delivery.'
    target: tooling
    severity: degrading
    workaround: Rewrote the plan around review and evidence without redesigning the existing implementation.
    fp: 4bd9ed061b54
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: '2026-08-13T03:11:55.649Z'
  - id: DL-003
    kind: difficulty
    description: 'The final scope-language audit command failed because ripgrep is unavailable, requiring a retry with grep while preserving the completed Plan files.'
    target: tooling
    severity: annoying
    workaround: Retried the audit with grep.
    fp: be39ed1fbd79
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: '2026-08-13T03:13:44.113Z'
---

# Retro — issue 25 Plan

Plan observations were drained with original provenance.
