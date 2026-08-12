---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/7-install-and-operate-official-agent-assets"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-12T03:22:08.018Z"
agent: "rpiv-research"
plan_id: "7-phase-5-install-and-operate-official-agent-assets"
schema_version: "1.2"
retro_id: "2026-08-12T03:22:08Z-rpiv-research-bcfce3b66810"
started_at: "2026-08-12T02:46:38.282Z"
ended_at: "2026-08-12T03:22:30.000Z"
summary: "Research completed after adapting repository search, command-test discovery, and file-writing approaches to the available environment."
entries:
  - id: DL-001
    kind: difficulty
    description: "Repository search expected rg, but rg is unavailable; using grep instead."
    target: tooling
    severity: annoying
    workaround: "Used grep and find for repository search."
    suggested_encoding: "Expose a harness-backed repository search verb or install rg consistently."
    fp: "bcfce3b66810"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T02:46:38.282Z"
  - id: DL-002
    kind: difficulty
    description: "Expected src/command.test.ts was absent; command parser coverage is co-located in src/index.test.ts."
    target: project
    severity: annoying
    workaround: "Located command coverage through the source test inventory."
    suggested_encoding: "Keep a discoverable test-to-module map when tests are intentionally co-located under another filename."
    fp: "d8ea27016db6"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T02:48:07.917Z"
  - id: DL-003
    kind: difficulty
    description: "The documented-style Python file-write fallback failed because only Node is available; retrying with Node."
    target: tooling
    severity: annoying
    workaround: "Used Node for direct UTF-8 file creation."
    suggested_encoding: "Document one file-writing fallback guaranteed by the development image."
    fp: "5d3e0aeaeb78"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T02:49:21.405Z"
---

# Retro — Issue 7 Research

Durable Research-stage friction captured before implementation closeout.
