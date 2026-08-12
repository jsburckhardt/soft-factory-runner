---
record_kind: "retro"
harness_version: "0.13.0"
branch: "copilot-fix"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-12T10:09:15.021Z"
agent: "rpiv-implementer"
plan_id: "1-deliver-the-soft-factory-runner-mvp"
schema_version: "1.2"
retro_id: "2026-08-12T10:09:15Z-rpiv-implementer-90773963b34b"
started_at: "2026-08-12T10:06:27.974Z"
ended_at: "2026-08-12T10:09:15.021Z"
summary: "The correction cycle reproduced the independent Verify failure, traced it to macOS temp-path aliasing rather than the PRD-only change, and reran focused and full validation with a canonical temporary directory."
entries:
  - id: COORD-001
    kind: coordination
    description: "Verify rerun failed integration worktree registration despite prior passing gates; correction must diagnose repository-local fixture state"
    target: infra
    workaround: "Reproduced the failure through harness boot and compared the fixture path with Git worktree porcelain output."
    suggested_encoding: "Make validation temp-path setup deterministic on macOS at the repository command boundary."
    fp: "90773963b34b"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T10:06:27.974Z"
  - id: DL-001
    kind: difficulty
    description: "Harness boot reproduced Verify failure: Git reports the created worktree under canonical /private/var while the test lookup uses noncanonical temp path"
    target: infra
    severity: degrading
    workaround: "Canonicalized TMPDIR with realpath before invoking the unchanged root validation recipes."
    suggested_encoding: "Normalize macOS TMPDIR once in deterministic validation setup so Git and Node compare the same path spelling."
    fp: "33176236c956"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T10:07:17.349Z"
  - id: DL-002
    kind: difficulty
    description: "The diagnostic probe assumed a python executable, but this environment exposes only python3; reran with python3 and realpath"
    target: tooling
    severity: annoying
    workaround: "Used python3 and the platform realpath command for the path comparison."
    suggested_encoding: "Prefer platform commands or python3 in repository diagnostics."
    fp: "f1aadfca475c"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T10:07:24.351Z"
---

# Retro — Issue #1 correction implementation

Verify rejection was reproducible without changing product behavior or tests. The evidence isolates the failure to equivalent macOS temporary paths represented as `/var/...` by Node and `/private/var/...` by Git.
