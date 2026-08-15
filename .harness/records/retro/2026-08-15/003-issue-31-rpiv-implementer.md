---
record_kind: "retro"
harness_version: "0.13.0"
branch: "fix/31-portable-tmux-identity"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-15T02:12:44.602Z"
agent: "rpiv-implementer"
plan_id: "31-support-locale-compatible-tmux-identities-and-release-0-1-1-under-semver-governance"
schema_version: "1.2"
retro_id: "2026-08-15T02:12:44.602Z-rpiv-implementer-3b0bc157e5bd"
started_at: "2026-08-15T01:25:17.341Z"
ended_at: "2026-08-15T02:13:46.144Z"
summary: "Persisted 12 concrete Issue #31 Implement friction observations before implementation handoff; every entry is retained with disposition kept."
entries:
  - id: "DL-001"
    kind: "difficulty"
    description: "Initial AGENTS.md and implementer-agent reads exceeded the view size limit and required explicit full-file retries."
    target: "tooling"
    severity: "annoying"
    workaround: "Retried with forceReadLargeFiles after the action plan path was resolved."
    suggested_encoding: "Expose line-ranged or automatic chunked repository instruction reads."
    fp: "3b0bc157e5bd"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-15T01:25:17.341Z"
  - id: "DL-002"
    kind: "difficulty"
    description: "The repository orientation expected ripgrep, but rg is absent from PATH; two inventory probes exited 127 and required grep/find fallbacks."
    target: "tooling"
    severity: "annoying"
    workaround: "Use grep -R and find for repository inspection."
    suggested_encoding: "Add a harness or justfile search recipe with a guaranteed implementation."
    fp: "5d55ea46759a"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-15T01:25:51.809Z"
  - id: "DL-003"
    kind: "difficulty"
    description: "The documented environment advertised Python availability, but the first file-edit helper failed with python not found and required a Node-based retry."
    target: "infra"
    severity: "annoying"
    workaround: "Use the available Node runtime for deterministic file edits."
    suggested_encoding: "Keep environment capability metadata aligned with executable PATH."
    fp: "759ab6472db5"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-15T01:27:50.894Z"
  - id: "DL-004"
    kind: "difficulty"
    description: "The first complete focused gate after the shared parser change failed on strict tuple narrowing and exposed stale normal/Doctor HT fixture expectations."
    target: "project"
    severity: "degrading"
    workaround: "Narrow observe cwd explicitly, wire shared formats, and migrate dependent controlled fixtures before rerunning the gate."
    suggested_encoding: "Add a narrow transport contract suite that compiles shared parser consumers before the complete focused gate."
    fp: "78ce0ab4b0c8"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-15T01:30:51.708Z"
  - id: "DL-005"
    kind: "difficulty"
    description: "The first tuple-narrowing fix was insufficient because TypeScript could not correlate the phase branch with the tuple union; the second focused gate still failed compilation."
    target: "project"
    severity: "annoying"
    workaround: "Use the tuple length discriminant before indexing the observe cwd element."
    suggested_encoding: "Keep parser phase branches structurally separate so strict tuple narrowing is compile-time obvious."
    fp: "fb25f7607f09"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-15T01:33:04.946Z"
  - id: "DL-006"
    kind: "difficulty"
    description: "A Node-based test insertion retry failed because a nested TypeScript template literal terminated the edit helper template unexpectedly."
    target: "tooling"
    severity: "annoying"
    workaround: "Replace the inserted diagnostic template literal with ordinary string concatenation before retrying."
    suggested_encoding: "Provide a first-class repository file edit tool instead of quoting source through shell commands."
    fp: "064df9a5cf29"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-15T01:35:41.605Z"
  - id: "DL-007"
    kind: "difficulty"
    description: "The first normal-matrix targeted test failed because the Node insertion helper materialized escaped LF and HT sequences inside TypeScript string literals."
    target: "tooling"
    severity: "annoying"
    workaround: "Replace materialized control characters with explicit escaped source sequences, then rerun targeted validation."
    suggested_encoding: "Avoid source generation through nested JavaScript template strings."
    fp: "eb688a83f49c"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-15T01:37:36.400Z"
  - id: "DL-008"
    kind: "difficulty"
    description: "The normal transport targeted test initially omitted the unchanged list-windows name format from its complete -F call inventory."
    target: "project"
    severity: "annoying"
    workaround: "Include the name-only observation format before create and observe in the expected call sequence."
    suggested_encoding: "Expose typed per-operation format assertions in the controlled tmux fixture."
    fp: "9cfe26f77f13"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-15T01:38:55.046Z"
  - id: "DL-009"
    kind: "difficulty"
    description: "The first Doctor client-state test used exact equality for a successful probe and omitted its existing message, remediation, and value fields."
    target: "project"
    severity: "annoying"
    workaround: "Assert the stable success subset while retaining the full result in repeat evidence."
    suggested_encoding: "Export a canonical successful Doctor probe fixture shape for reuse."
    fp: "57d32acd5b9a"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-15T01:43:38.733Z"
  - id: "DL-010"
    kind: "difficulty"
    description: "A broad version grep encountered the repository .devcontainer tmux socket and emitted a device-address error before scoped exclusions were added."
    target: "tooling"
    severity: "annoying"
    workaround: "Restrict later inventory searches to tracked files or explicit product paths and exclude special filesystem entries."
    suggested_encoding: "Add a tracked-file version inventory command that never traverses sockets."
    fp: "88bc38936ff3"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-15T01:52:12.841Z"
  - id: "DL-011"
    kind: "difficulty"
    description: "First full validation exposed two unused createProcess probe parameters in the new normal-overlap test double that focused Jest and TypeScript compile paths did not report; the first observation attempt also used unsupported kind failure and exited 2, requiring the documented difficulty kind."
    fp: "0d3b7bd78f81"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-15T02:05:33.171Z"
  - id: "DL-012"
    kind: "difficulty"
    description: "Second full validation passed lint but exposed Prettier drift in six newly edited TypeScript files; focused Jest and diff checks did not surface repository formatting, so the files require formatter backtracking before another full-gate retry."
    fp: "af2b422109ad"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-15T02:07:04.047Z"
---

# Retro — Issue #31 Implement friction

Generated from the repository-shared pending observation buffer before implementation notes were written.
