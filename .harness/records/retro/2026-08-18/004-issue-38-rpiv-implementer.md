---
record_kind: "retro"
harness_version: "0.13.0"
branch: "fix/38-prevent-doctor-collapse-when-unrelated-tmux-server-is-absent"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-18T02:48:57.623Z"
agent: "rpiv-implementer"
plan_id: "38-prevent-doctor-collapse-when-an-unrelated-tmux-server-is-absent"
schema_version: "1.2"
retro_id: "2026-08-18T02:48:57Z-rpiv-implementer-da1b0937e8d0"
started_at: "2026-08-18T02:28:18Z"
ended_at: "2026-08-18T02:48:57Z"
summary: "Implementation completed after concrete tooling, edit, cleanup-warning, and formatting retries."
entries:
  - id: DL-001
    kind: difficulty
    description: "Repository exploration retried with grep because ripgrep was unavailable in the implementation environment."
    target: tooling
    severity: annoying
    workaround: "Used grep."
    suggested_encoding: "Provide a stable repository search command."
    fp: "da1b0937e8d0"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-18T02:28:18.483Z"
  - id: DL-002
    kind: difficulty
    description: "Repository edits required a retry because the expected apply_patch helper was unavailable; used Python file transforms instead."
    target: tooling
    severity: annoying
    workaround: "Used narrow Python file transforms."
    suggested_encoding: "Expose a deterministic patch helper."
    fp: "d7d7bcf75f91"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-18T02:29:31.872Z"
  - id: DL-003
    kind: difficulty
    description: "Creating the new TypeScript matrix test required a retry after shell quoting broke the initial Python file-write command."
    target: tooling
    severity: annoying
    workaround: "Retried with a simpler quoted transform."
    suggested_encoding: "Provide a direct tracked-file edit command."
    fp: "e552e1d00574"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-18T02:30:44.635Z"
  - id: DL-004
    kind: difficulty
    description: "A broad newline-normalization edit corrupted Doctor test string literals, so the file was restored and the test change was re-applied with narrower transforms."
    target: project
    severity: degrading
    workaround: "Restored the file from Git and reapplied exact replacements."
    suggested_encoding: "Prefer structured patch application over broad text normalization."
    fp: "9a56b055f56b"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-18T02:34:40.326Z"
  - id: CONF-001
    kind: confusion
    description: "The focused Issue 38 live-equivalent test passed but Jest reported an open-handle warning after exact tmux cleanup, requiring full-gate confirmation."
    target: project
    severity: annoying
    workaround: "Confirmed repeated focused and full gates exited cleanly without the warning."
    suggested_encoding: "Add deterministic tmux process settlement evidence to the live fixture."
    fp: "82f6d8c642be"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-18T02:38:00.166Z"
  - id: DL-005
    kind: difficulty
    description: "The first full direct gate failed format-check on six changed TypeScript files; formatting was applied before retrying the authoritative gate."
    target: project
    severity: degrading
    workaround: "Applied repository Prettier and reran just verify successfully."
    suggested_encoding: "Expose a root formatting recipe alongside format-check."
    fp: "bd0ab8f101e2"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-18T02:46:19.029Z"
---

# Retro — Issue 38 Implement

Every concrete implementation observation was retained.
