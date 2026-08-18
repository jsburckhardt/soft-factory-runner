---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/36-preserve-invoking-tmux-context"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-17T06:48:05.623Z"
agent: "rpiv-implementer"
plan_id: "36-preserve-the-invoking-tmux-server-and-session-for-issue-windows"
schema_version: "1.2"
retro_id: "2026-08-17T06:48:05Z-rpiv-implementer-40df2b3891ff"
started_at: "2026-08-17T06:34:24.344Z"
ended_at: "2026-08-17T06:48:05.623Z"
summary: "The Verify-return correction replaced directory-entry snapshots with explicit-server tmux resource inventories, added a regression that exposes the old proof gap, corrected documentation, and resolved concrete editing and validation retries."
entries:
  - id: DL-001
    kind: difficulty
    description: "The repository environment exposes python3 but not python; the first scripted edit failed before changing files."
    target: tooling
    severity: annoying
    workaround: "Retried the unchanged edit script with python3."
    suggested_encoding: "Expose the available Python executable in harness orientation when scripted edits are expected."
    fp: "40df2b3891ff"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-17T06:34:24.344Z"
  - id: DL-002
    kind: difficulty
    description: "The first inventory type-check exposed that the scripted import edit left tmux-target as type-only, requiring explicit value imports before retry."
    target: project
    severity: annoying
    workaround: "Changed the tmux-target import to include the two runtime values and reran type checking."
    suggested_encoding: "Keep type checking in the focused implementation loop."
    fp: "14e0de27c57f"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-17T06:35:34.432Z"
  - id: DL-003
    kind: difficulty
    description: "A direct single-file Jest retry passed its assertions but exited 1 because repository-wide coverage thresholds apply to partial npm test runs; subsequent validation uses only root just recipes."
    target: tooling
    severity: annoying
    workaround: "Stopped using the partial npm command and returned to just verify-focused."
    suggested_encoding: "Provide a root focused-test recipe that preserves repository coverage policy for a named test when needed."
    fp: "372d92b97aa9"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-17T06:36:49.224Z"
  - id: INS-001
    kind: insight
    description: "Diff review found Doctor inventory passed os.tmpdir to standalone derivation while live target selection uses the helper's /tmp default; aligning both selectors avoided measuring a different server."
    target: project
    severity: degrading
    workaround: "Reused deriveStandaloneTmuxTarget with the same default arguments as live selection."
    suggested_encoding: "Centralize all standalone target derivation calls without caller-specific temporary-root overrides."
    fp: "c57926233df5"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-17T06:40:22.452Z"
  - id: DL-004
    kind: difficulty
    description: "Focused harness validation failed in an unrelated Git integration clone because Git could not create maintenance.lock in a temporary clone; no inventory test failed, so validation required a clean retry."
    target: infra
    severity: degrading
    workaround: "Read the harness envelope, confirmed the unrelated fixture failure, and reran the complete focused gate successfully."
    suggested_encoding: "Make the Git clone fixture isolate or disable inherited maintenance configuration."
    fp: "96ef9829ac38"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-17T06:42:03.517Z"
  - id: DL-005
    kind: difficulty
    description: "Full harness validation found two forbidden non-null assertions in the new tmux inventory regression that focused tests do not lint; the test adapter needed explicit capability guards."
    target: tooling
    severity: annoying
    workaround: "Replaced assertions with bound optional methods and an explicit unavailable guard, then reran focused and full gates."
    suggested_encoding: "Include lint or the relevant static checks in verify-focused to expose these failures earlier."
    fp: "a095d67b530e"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-17T06:44:14.293Z"
---

# Retro — Issue 36 Implement Verify-return correction

All six pending Implement observations are preserved verbatim with their concrete workarounds. The prior coordinator, Research, and Plan buffers were empty.
