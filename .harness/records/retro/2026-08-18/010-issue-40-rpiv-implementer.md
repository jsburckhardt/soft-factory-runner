---
record_kind: retro
harness_version: 0.13.0
branch: fix/40-treat-stale-no-server-tmux-sockets-as-absent
repo: https://github.com/jsburckhardt/soft-factory-runner.git
created_at: 2026-08-18T03:56:53.208Z
agent: rpiv-implementer
plan_id: 40-treat-stale-no-server-tmux-sockets-as-absent-doctor-inventory
schema_version: 1.2
retro_id: 2026-08-18T03:56:53Z-rpiv-implementer-74628172db25
started_at: 2026-08-18T03:37:09Z
ended_at: 2026-08-18T03:56:53Z
summary: Issue 40 implementation completed after concrete interpreter, validation concurrency, documentation, package-smoke, and formatting retries were corrected and revalidated.
entries:
  - id: DL-001
    kind: difficulty
    description: The environment advertises Python execution but the python command is absent; use python3 for repository edits.
    target: tooling
    severity: annoying
    workaround: Retried edits with python3.
    suggested_encoding: Expose the available interpreter alias in environment orientation.
    fp: 74628172db25
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: 2026-08-18T03:37:09.817Z
  - id: COORD-001
    kind: coordination
    description: I ran two focused gates concurrently even though Doctor integration fixtures require exclusive temporary-resource observations; this created cross-gate workspace interference, so validation must run sequentially.
    target: tooling
    workaround: Reran harness and direct validation sequentially and confirmed cleanup.
    suggested_encoding: Mark Doctor integration gates as exclusive in harness instructions.
    fp: 9d9d2c936328
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: 2026-08-18T03:38:38.707Z
  - id: DL-002
    kind: difficulty
    description: The T4 focused documentation assertion exposed that the beta.1 docs dropped the exact existing phrase 'never created or targeted'; restore that user-facing absent-socket guarantee before rerunning.
    target: doc
    severity: annoying
    workaround: Restored the explicit absent-socket guarantee and reran focused gates.
    suggested_encoding: Keep contract phrases in documentation assertions during release updates.
    fp: 4de5c1eedf51
    disposition: fixed-now
    system:
      compound:
        status: encoded
        source: agent-self
        first_seen_at: 2026-08-18T03:47:32.757Z
  - id: DL-003
    kind: difficulty
    description: The first package smoke inferred unsupported install --json/--repository flags and exited before cleanup because the script lacked an EXIT trap; rerun from the consumer cwd with supported grammar and unconditional cleanup.
    target: tooling
    severity: degrading
    workaround: Reused the isolated package, invoked supported install grammar from the consumer cwd, and removed the exact temporary root.
    suggested_encoding: Add a root package-smoke recipe with unconditional cleanup and supported CLI grammar.
    fp: 1acb72f7cd57
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: 2026-08-18T03:50:11.995Z
  - id: DL-004
    kind: difficulty
    description: The full harness gate found four Prettier style failures not covered by verify-focused; follow the gate's explicit Prettier --write remediation, then rerun full validation.
    target: tooling
    severity: annoying
    workaround: Applied Prettier to the named files and reran full harness and direct gates.
    suggested_encoding: Include formatting feedback in verify-focused or provide a formatting recipe.
    fp: 497db5187063
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: 2026-08-18T03:53:27.454Z
---

# Retro — Issue 40 Implement
