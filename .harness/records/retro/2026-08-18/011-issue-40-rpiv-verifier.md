---
record_kind: "retro"
harness_version: "0.13.0"
branch: "fix/40-treat-stale-no-server-tmux-sockets-as-absent"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-18T04:08:05.727Z"
agent: "rpiv-verifier"
plan_id: "40-treat-stale-no-server-tmux-sockets-as-absent-doctor-inventory"
schema_version: "1.2"
retro_id: "2026-08-18T04:08:05Z-rpiv-verifier-75fe0983bd31"
started_at: "2026-08-18T03:59:47Z"
ended_at: "2026-08-18T04:08:43Z"
summary: "Verification passed; the complete diff required chunked inspection, one observation listing raced concurrent writes, the first retro write used an unavailable runtime, and manual coordination supplied no bound AgentResult publication helper."
entries:
  - id: DL-001
    kind: difficulty
    description: "Complete branch diff output exceeded the terminal capture limit and required reading tool-saved output in explicit line ranges before scope review could finish."
    target: tooling
    severity: degrading
    workaround: "Read the tool-saved diff in explicit non-overlapping line ranges."
    suggested_encoding: "Expose a harness diff-review command with deterministic per-file chunks."
    fp: "9a16a846d96a"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-18T04:07:45.633Z"
  - id: COORD-001
    kind: coordination
    description: "No injected AgentResult publication helper or run-binding snapshot was present during manual final verification; immutable publication must be reported separately without touching unrelated artifacts."
    target: tooling
    workaround: "Preserved unrelated artifacts and reported the missing publication surface separately."
    suggested_encoding: "Always inject the no-clobber helper and immutable run binding for final Verify sessions."
    fp: "18f8bd64d4e3"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-18T04:07:45.694Z"
  - id: DL-002
    kind: difficulty
    description: "The first verifier observation-list call ran concurrently with capture writes and returned empty; I had to relist sequentially before draining."
    target: tooling
    severity: annoying
    workaround: "Repeated the list operation only after both capture calls completed."
    suggested_encoding: "Document that observation capture and list operations must be serialized."
    fp: "be0b5b3fccd4"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-18T04:07:58.105Z"
  - id: DL-003
    kind: difficulty
    description: "The documented tool guidance suggested python for file operations, but only node/python3 was available; the verifier retro write failed once and required a runtime switch."
    target: tooling
    severity: annoying
    workaround: "Retried the generated metadata write with python3."
    suggested_encoding: "Advertise available runtime command names in the environment orientation."
    fp: "916856e7d1a6"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-18T04:08:36.721Z"
---

# Retro — Issue 40 RPIV verifier

All verifier observations were preserved before clearing the transient buffer.
