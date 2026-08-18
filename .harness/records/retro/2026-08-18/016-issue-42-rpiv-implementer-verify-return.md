---
record_kind: "retro"
harness_version: "0.13.0"
branch: "fix/42-clean-exact-owned-dead-pane-window"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-18T08:41:18.685Z"
agent: "rpiv-implementer"
plan_id: "42-allow-explicit-cleanup-of-an-exact-owned-tmux-window-with-a-dead-pane"
schema_version: "1.2"
retro_id: "2026-08-18T08:41:18Z-rpiv-implementer-529e0a47db4f"
started_at: "2026-08-18T08:17:54.056Z"
ended_at: "2026-08-18T08:41:18.685Z"
summary: "Verify-return implementation required two concrete command retries: using the installed Python executable name and correcting installed-CLI option placement in the offline package smoke."
entries:
  - id: DL-001
    kind: difficulty
    description: "Implementation edit retried with python3 because the environment has no python command."
    target: tooling
    severity: annoying
    workaround: "Retried the same repository-local edit script with python3."
    suggested_encoding: "Expose the available Python executable name in harness doctor or repository orientation."
    fp: "529e0a47db4f"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-18T08:17:54.056Z"
  - id: DL-002
    kind: difficulty
    description: "Offline package smoke retried because installed CLI rejected --json after install --recommended; command option placement was unclear."
    target: doc
    severity: degrading
    workaround: "Retried the documented installed command without the unsupported trailing --json option and confirmed package plus manifest version."
    suggested_encoding: "Include exact JSON option placement for install examples in CLI help and package-smoke guidance."
    fp: "e39deb305852"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-18T08:40:34.066Z"
---

# Retro — Issue 42 Verify-return implementation

Preserves both pending rpiv-implementer observations from the Verify-return correction session.
