---
record_kind: retro
harness_version: 0.13.0
branch: fix/25-reproducible-clean-install-ci
repo: 'https://github.com/jsburckhardt/soft-factory-runner.git'
created_at: '2026-08-13T03:31:13.901Z'
agent: rpiv-research
plan_id: 25-make-clean-installs-and-delivery-verification-reproducible
schema_version: '1.2'
retro_id: '2026-08-13T03:32:45Z-rpiv-research-a331e4a089fb'
started_at: '2026-08-13T03:02:20.384Z'
ended_at: '2026-08-13T03:32:45.000Z'
summary: Research completed after bounded-read and runtime-tool retries.
entries:
  - id: DL-001
    kind: difficulty
    description: 'DECISION-LOG.md exceeded the file viewer size limit, requiring a line-count probe and two ranged reads to complete the mandated inspection.'
    target: tooling
    severity: annoying
    workaround: Used a line-count probe and ranged reads.
    fp: a331e4a089fb
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: '2026-08-13T03:02:20.384Z'
  - id: DL-002
    kind: difficulty
    description: The first artifact-write command failed because the environment exposes Node.js but no python executable; Research backtracked to the repository runtime without changing files.
    target: tooling
    severity: annoying
    workaround: Retried the artifact write with Node.js.
    fp: bb4bb70a605a
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: '2026-08-13T03:04:06.387Z'
---

# Retro — issue 25 Research

Research observations were drained with original provenance.
