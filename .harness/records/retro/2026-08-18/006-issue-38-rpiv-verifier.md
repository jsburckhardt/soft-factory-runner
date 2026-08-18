---
record_kind: "retro"
harness_version: "0.13.0"
branch: "fix/38-prevent-doctor-collapse-when-unrelated-tmux-server-is-absent"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-18T03:04:03.467Z"
agent: "rpiv-verifier"
plan_id: "38-prevent-doctor-collapse-when-an-unrelated-tmux-server-is-absent"
schema_version: "1.2"
retro_id: "2026-08-18T03:04:03Z-rpiv-verifier-8a7b3d97409d"
started_at: "2026-08-18T02:57:06.500Z"
ended_at: "2026-08-18T03:04:34Z"
summary: "Verification passed after two procedural retries; no application defect was found."
entries:
  - id: DL-001
    kind: difficulty
    description: "Offline installed Doctor smoke initially hid node from the shell as well as Doctor, so JSON evidence was unavailable and required a corrected isolated PATH retry."
    target: tooling
    severity: annoying
    workaround: "Invoked the installed CLI with the absolute Node executable while exposing only a temporary Node symlink to Doctor through PATH."
    suggested_encoding: "Provide a harness package-smoke command that invokes Node absolutely while isolating the child command-discovery PATH."
    fp: "8a7b3d97409d"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-18T03:02:45.328Z"
  - id: DL-002
    kind: difficulty
    description: "The verifier retro write attempt assumed a python executable that this environment does not provide, requiring a Node-based retry."
    target: tooling
    severity: annoying
    workaround: "Used the repository runtime Node.js executable to write the generated verifier retro record."
    suggested_encoding: "Document Node.js as the repository-safe scripting fallback for generated verifier metadata."
    fp: "3c2f2f4f7fa3"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-18T03:04:28.217Z"
---

# Retro — Issue 38 RPIV verifier

Both retries were procedural only; corrected validation completed successfully.
