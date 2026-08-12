---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/7-install-and-operate-official-agent-assets"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-12T03:32:16.966Z"
agent: "rpiv-verifier"
plan_id: "7-phase-5-install-and-operate-official-agent-assets"
schema_version: "1.2"
retro_id: "2026-08-12T03:32:16Z-rpiv-verifier-52767e8d32c8"
started_at: "2026-08-12T03:32:04.144Z"
ended_at: "2026-08-12T03:35:25.888Z"
summary: "Verification completed after five concrete verification-metadata retries during pull request and issue closeout."
entries:
  - id: DL-001
    kind: difficulty
    description: "Creating the populated PR body through a Python shell argument was blocked by shell-expansion security because Markdown command spans use backticks; retrying with a non-shell file API."
    target: tooling
    severity: annoying
    workaround: "Removed Markdown command spans and used a direct Node file API to create the temporary PR body."
    suggested_encoding: "Expose a non-shell tracked and temporary file-writing tool to verifier agents."
    fp: "52767e8d32c8"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T03:32:04.144Z"
  - id: DL-002
    kind: difficulty
    description: "The non-shell PR body retry used the advertised python executable, but python is unavailable in this environment; retrying the temporary-file write with Node."
    target: tooling
    severity: annoying
    workaround: "Used the available Node runtime and its filesystem API to create the temporary PR body."
    suggested_encoding: "Document one file-writing fallback guaranteed by the development image."
    fp: "270eb82c7bce"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T03:32:44.857Z"
  - id: DL-003
    kind: difficulty
    description: "The final retro harvest showed 15 entries rather than the 14 precomputed in the PR draft, requiring a draft correction and another verifier retro drain before PR creation."
    target: tooling
    severity: annoying
    workaround: "Corrected the PR draft only after persisting the observation and obtaining the final harvested count."
    suggested_encoding: "Provide a closeout command that drains verifier observations and emits stable PR-ready retro totals atomically."
    fp: "b704155a8448"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T03:33:40.866Z"
  - id: DL-004
    kind: difficulty
    description: "The first issue-checkbox update accidentally removed the apostrophe from the unchanged Problem text while preserving criteria and markers; restoring the exact original text before closeout."
    target: tooling
    severity: degrading
    workaround: "Restored the exact original Problem text, repeated the issue update, and read back the complete body from GitHub."
    suggested_encoding: "Provide an acceptance-checkbox updater that changes checkbox tokens only within the marked criterion block."
    fp: "902a33872653"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T03:34:44.985Z"
  - id: DL-005
    kind: difficulty
    description: "Verifier retro read-back found its closing narrative still said before pull request creation even though the latest recorded issue-update retry occurred afterward; correcting the narrative before clearing."
    target: tooling
    severity: annoying
    workaround: "Updated the narrative to cover the complete verification closeout rather than only pre-PR work."
    suggested_encoding: "Generate verifier retro narrative from recorded observation timestamps and closeout phase."
    fp: "2110bbe2f6c4"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T03:35:20.626Z"
---

# Retro — Issue 7 Verify

Durable Verify-stage friction captured through verification closeout.
