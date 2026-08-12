---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/19-rpiv-progress-and-instructions"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-12T09:33:00.917Z"
agent: "rpiv-implementer"
plan_id: "19-define-rpiv-progress-final-result-ownership-and-integration-instructions"
schema_version: "1.2"
retro_id: "2026-08-12T09:33:00Z-rpiv-implementer-4693bddf"
started_at: "2026-08-12T09:11:42.636Z"
ended_at: "2026-08-12T09:33:00.917Z"
summary: "The issue-19 correction cycle added final-head and trusted-PR binding, strict progress transitions, snapshot-immutable recovery, failed terminal progress, and real filesystem fault/concurrency proof; editing-tool availability and focused/full validation each required concrete retries recorded below."
entries:
  - id: DL-001
    kind: difficulty
    description: "Repository environment lacks the python alias; file-edit command failed and required retrying with python3."
    target: tooling
    severity: annoying
    workaround: "Retried the same deterministic edit with python3."
    suggested_encoding: "Expose the available Python executable in harness doctor or provide a repository edit helper."
    fp: "4693bddf0356"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T09:11:42.636Z"
  - id: DL-002
    kind: difficulty
    description: "Shell security rejected a safe Python-based test-file edit because embedded TypeScript template interpolation resembled shell expansion; rewrote the fixture with string concatenation."
    target: tooling
    severity: annoying
    workaround: "Removed template interpolation from the generated test payload."
    suggested_encoding: "Provide a first-class file edit tool that does not route source payloads through a shell parser."
    fp: "068e415262fd"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T09:17:16.028Z"
  - id: DL-003
    kind: difficulty
    description: "The first string-concatenation rewrite still failed because nested shell/Python quoting terminated the edit payload; switched to a non-heredoc patch pipe."
    target: tooling
    severity: annoying
    workaround: "Abandoned nested Python quoting and attempted a patch transport."
    suggested_encoding: "Provide deterministic structured file creation/editing in the harness."
    fp: "e86402da449f"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T09:18:19.919Z"
  - id: DL-004
    kind: difficulty
    description: "The environment also lacks the expected apply_patch helper, so the non-heredoc patch retry failed; switched to Node argument-based file creation."
    target: tooling
    severity: annoying
    workaround: "Passed source as a literal Node process argument and wrote it with node:fs."
    suggested_encoding: "Ship or document one supported repository patch/edit command."
    fp: "9c1c4d57d087"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T09:18:55.312Z"
  - id: DL-005
    kind: difficulty
    description: "Focused correction validation exposed two test-assumption defects: immutable pre-link fault hooks reject before EEXIST while still preserving bytes, and publication normalizes JSON formatting. Adjusted assertions to verify invariant bytes/parsed equality."
    target: project
    severity: annoying
    workaround: "Changed tests to assert preserved destination bytes and semantic JSON equality rather than incidental return/format details."
    suggested_encoding: "Keep publication test helpers centered on artifact invariants and normalized parser results."
    fp: "9d98b07542b0"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T09:24:30.477Z"
  - id: DL-006
    kind: difficulty
    description: "Full validation caught ESLint no-unsafe-finally in the progress lock cleanup path; refactored cleanup to preserve the primary publication error without throwing from finally."
    target: project
    severity: annoying
    workaround: "Captured the primary error, performed lock release outside finally, and rethrew only after cleanup."
    suggested_encoding: "Add a reusable compare-delete cleanup helper that preserves primary causes."
    fp: "ce58ce2e02b8"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T09:29:29.296Z"
  - id: DL-007
    kind: difficulty
    description: "Full validation then reached format-check and identified five programmatically edited TypeScript files needing canonical Prettier formatting; formatted those named files before rerunning root gates."
    target: project
    severity: annoying
    workaround: "Ran canonical Prettier over only the five files named by the root gate."
    suggested_encoding: "Expose a root justfile formatting recipe alongside format-check."
    fp: "541789b0f0cb"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T09:30:36.241Z"
  - id: DL-008
    kind: difficulty
    description: "The repository worktree has no local node_modules binary path even though npm resolves shared dependencies, so the first formatter invocation failed; retried through npm exec."
    target: tooling
    severity: annoying
    workaround: "Used npm exec so dependency resolution followed the workspace installation."
    suggested_encoding: "Document shared worktree dependency resolution or wrap formatting in the root justfile."
    fp: "2050d9f849c7"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T09:30:52.617Z"
---

# Retro — Issue 19 Implement correction cycle

Scaffolded by `harness record retro --slug issue-19-rpiv-implementer-correction --json`; all eight pending correction observations are preserved with kept disposition.
