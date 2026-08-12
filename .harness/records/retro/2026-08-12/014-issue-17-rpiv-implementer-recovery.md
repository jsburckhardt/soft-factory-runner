---
record_kind: "retro"
harness_version: "0.13.0"
branch: "copilot-fix"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-12T09:57:38.082Z"
agent: "rpiv-implementer"
plan_id: "17-configure-environment-variables-for-runner-launched-copilot-processes"
schema_version: "1.2"
retro_id: "2026-08-12T09:57:38.082Z-rpiv-implementer-7f058e997691"
started_at: "2026-08-12T09:50:04.897Z"
ended_at: "2026-08-12T09:57:38.082Z"
summary: "Infrastructure recovery required dependency setup and exposed two Darwin temporary-path alias assumptions plus normal edit and formatting retries."
entries:
  - id: DL-001
    kind: difficulty
    description: "Focused validation failed because restored workspace lacked installed node_modules; root setup is required before tests"
    target: infra
    severity: degrading
    workaround: "Ran the root just setup recipe before retrying focused validation."
    suggested_encoding: "Make restored-workspace dependency readiness explicit before validation."
    fp: "7f058e997691"
    disposition: kept
    system: { compound: { status: open, source: agent-self, first_seen_at: "2026-08-12T09:50:04.897Z" } }
  - id: DL-002
    kind: difficulty
    description: "After root just setup, focused Jest failed with missing jest-util from ts-jest, requiring dependency-install backtracking"
    target: tooling
    severity: degrading
    workaround: "Installed the missing Jest utility transiently and restored the lockfile afterward."
    suggested_encoding: "Keep the setup recipe deterministic across the supported npm runtime."
    fp: "fb013d7ddb07"
    disposition: kept
    system: { compound: { status: open, source: agent-self, first_seen_at: "2026-08-12T09:50:24.017Z" } }
  - id: DL-003
    kind: difficulty
    description: "A scripted test-file edit failed on nested shell quoting, requiring a safer temporary Python script invocation"
    target: tooling
    severity: annoying
    workaround: "Rephrased the Python edit payload to avoid conflicting quote forms."
    suggested_encoding: "Prefer a structured file-edit tool for multiline changes."
    fp: "736315f2cb8b"
    disposition: kept
    system: { compound: { status: open, source: agent-self, first_seen_at: "2026-08-12T09:51:08.077Z" } }
  - id: DL-004
    kind: difficulty
    description: "Full focused suite exposed an unrelated real-Git integration failure: created worktree was not registered and branch resolved null despite path dirtiness"
    target: project
    severity: degrading
    workaround: "Reproduced the single test and normalized its temporary parent through fs.realpath."
    suggested_encoding: "Canonicalize temporary filesystem fixture roots before exact Git path comparisons."
    fp: "c258164a2ddc"
    disposition: kept
    system: { compound: { status: open, source: agent-self, first_seen_at: "2026-08-12T09:52:09.882Z" } }
  - id: INS-001
    kind: insight
    description: "Reproduction showed Darwin /var versus /private/var path canonicalization made the pre-existing worktree test compare aliases; test setup needs realpath normalization"
    target: project
    workaround: "Applied test-fixture realpath normalization without changing production behavior."
    suggested_encoding: "Use a shared canonical temporary-root fixture helper."
    fp: "ed15c053e798"
    disposition: kept
    system: { compound: { status: open, source: agent-self, first_seen_at: "2026-08-12T09:52:47.675Z" } }
  - id: DL-005
    kind: difficulty
    description: "Focused rerun passed the worktree fix but exposed a second restored-environment failure: ready Doctor fixture exited blocked instead of ready"
    target: project
    severity: degrading
    workaround: "Normalized the ready Doctor process fixture root through fs.realpath."
    suggested_encoding: "Reuse canonical temporary-root setup in built-process fixtures."
    fp: "49ff6cf22436"
    disposition: kept
    system: { compound: { status: open, source: agent-self, first_seen_at: "2026-08-12T09:54:03.647Z" } }
  - id: DL-006
    kind: difficulty
    description: "Full root validation found formatting-only drift in the new documentation contract test after lint passed"
    target: project
    severity: annoying
    workaround: "Formatted the changed test and reran the full root validation recipe."
    suggested_encoding: "Run formatter-aware editing before the full boundary gate."
    fp: "9585557ee10c"
    disposition: kept
    system: { compound: { status: open, source: agent-self, first_seen_at: "2026-08-12T09:56:25.882Z" } }
---

# Retro — Issue 17 infrastructure-recovery implementation

All seven transient implementer observations are preserved above; no Research, Plan, or coordinator observations were pending.
