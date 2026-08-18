---
record_kind: "retro"
harness_version: "0.13.0"
branch: "fix/38-prevent-doctor-collapse-when-unrelated-tmux-server-is-absent"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-18T02:48:57.336Z"
agent: "rpiv-research"
plan_id: "38-prevent-doctor-collapse-when-an-unrelated-tmux-server-is-absent"
schema_version: "1.2"
retro_id: "2026-08-18T02:48:57Z-rpiv-research-0577d00ef789"
started_at: "2026-08-18T02:13:10Z"
ended_at: "2026-08-18T02:48:57Z"
summary: "Research completed with unavailable search tooling, unavailable live incident state, one file-write retry, and a late harness boot correction."
entries:
  - id: DL-001
    kind: difficulty
    description: "Repository investigation expected ripgrep, but rg is unavailable; using git grep and grep instead."
    target: tooling
    severity: annoying
    workaround: "Used git grep and grep."
    suggested_encoding: "Expose one repository search helper or install ripgrep."
    fp: "0577d00ef789"
    disposition: kept
    system: { compound: { status: open, source: agent-self, first_seen_at: "2026-08-18T02:13:10.676Z" } }
  - id: DL-002
    kind: difficulty
    description: "Requested Sparkta live custom-socket proof could not be reproduced: both the custom socket and default socket were absent at inspection time."
    target: infra
    severity: degrading
    workaround: "Recorded the missing incident state and planned isolated repository-local live-equivalent proof."
    suggested_encoding: "Capture bounded incident fixtures when the consumer state is still live."
    fp: "c00a41f702b3"
    disposition: kept
    system: { compound: { status: open, source: agent-self, first_seen_at: "2026-08-18T02:14:25.168Z" } }
  - id: DL-003
    kind: difficulty
    description: "Artifact write attempt failed because the python executable is unavailable; retrying with the repository Node runtime."
    target: tooling
    severity: annoying
    workaround: "Used the available Node runtime."
    suggested_encoding: "Use python3 explicitly or provide a stable artifact writer."
    fp: "29589e4e79fa"
    disposition: kept
    system: { compound: { status: open, source: agent-self, first_seen_at: "2026-08-18T02:17:13.218Z" } }
  - id: COORD-001
    kind: coordination
    description: "Late guardrail inspection revealed harness boot was also required before product work; running the missed setup check before finalizing Research."
    target: plan
    severity: degrading
    workaround: "Ran harness boot before finalizing Research."
    suggested_encoding: "Place harness boot in the first deterministic preflight checklist."
    fp: "b2f983341e53"
    disposition: kept
    system: { compound: { status: open, source: agent-self, first_seen_at: "2026-08-18T02:18:21.719Z" } }
---

# Retro — Issue 38 Research

All four pending observations were preserved before clearing the transient buffer.
