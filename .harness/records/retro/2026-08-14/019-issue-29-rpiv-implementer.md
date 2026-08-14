---
record_kind: "retro"
harness_version: "0.13.0"
branch: "fix/29-tmux-preparation-diagnostics"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-14T11:58:54.881Z"
agent: "rpiv-implementer"
plan_id: "29-preserve-retryable-tmux-preparation-failures-with-bounded-identity-diagnostics"
schema_version: "1.2"
retro_id: "2026-08-14T11:58:54.881Z-rpiv-implementer-e816db5c"
started_at: "2026-08-14T11:05:41.295Z"
ended_at: "2026-08-14T12:00:29.496Z"
summary: "9 pending rpiv-implementer observations were drained after Issue #29 AC-10 implementation and validation."
entries:
  - id: DL-001
    kind: difficulty
    description: "The revised-artifact line-count command used the historical project/architecture/decision-log.md path, which does not exist in this repository; locate the current decision-log artifact before reading decisions 135-143."
    severity: annoying
    fp: "e816db5c3f7c"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T11:05:41.295Z"
  - id: DL-002
    kind: difficulty
    description: "The first T-8 strict type-check exposed two boundary mismatches: the managed server has null stdin rather than ChildProcessWithoutNullStreams, and Doctor command exitCode remains nullable after success classification before reuse by the strict tmux parser."
    severity: annoying
    fp: "8470dbe6fb04"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T11:19:16.872Z"
  - id: DL-003
    kind: difficulty
    description: "The first schema-v2 fixture migration edit failed before changing files because nested Python and shell quoting escaped the JSON schemaVersion strings incorrectly; split the source/test and JSON edits into simpler commands."
    severity: annoying
    fp: "fd60f5d51a19"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T11:23:46.751Z"
  - id: DL-004
    kind: difficulty
    description: "The first integrated Doctor probe run exposed a live process-enumeration flaw: cleanup treated unreadable unrelated /proc entries as helper-identity uncertainty, overriding expected socket/malformed outcomes, and the built READY path also failed at process identity proof. Narrow candidate reads to proved server descendants and inspect the controlled fixture."
    severity: degrading
    fp: "7eda6d030ece"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T11:30:49.363Z"
  - id: DL-005
    kind: difficulty
    description: "Fresh full validation failed because focused Jest did not expose ESLint no-unsafe-finally and unused-parameter violations in the new Doctor probe; implementation must move the return outside finally and remove unused bindings before retrying the root gate."
    target: "validation"
    severity: annoying
    workaround: "Apply lint-specific control-flow and binding fixes, rerun just verify-focused, then rerun just verify."
    fp: "f4e990194e1e"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T11:51:01.271Z"
  - id: DL-006
    kind: difficulty
    description: "A broad text replacement used while addressing lint accidentally removed the bound error variable from the strict create-parser catch; the required focused rerun caught the TypeScript compile failure before full validation."
    target: "implementation-edit"
    severity: annoying
    workaround: "Restore the narrow TmuxIdentityOutputError catch explicitly and rerun the root focused gate."
    fp: "cc62f2d4c4c9"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T11:53:02.125Z"
  - id: DL-007
    kind: difficulty
    description: "The second full-validation attempt passed lint but stopped at the root format-check because eleven changed TypeScript files were not Prettier-normalized; focused validation does not exercise this boundary."
    target: "validation"
    severity: annoying
    workaround: "Apply the project formatter only to the eleven named changed files, rerun focused validation, then retry the root full gate."
    fp: "6f06fc024f32"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T11:54:43.250Z"
  - id: DL-008
    kind: difficulty
    description: "The first durable retro fill script failed before writing because nested escaped expressions inside Python f-strings were invalid; split computed YAML scalar values from line assembly before retrying the drain."
    target: "harness-retro"
    severity: annoying
    workaround: "Compute retro IDs and summaries in local variables, then regenerate all three records and read them back before clearing buffers."
    fp: "2f17708a2785"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T12:00:00.377Z"
  - id: DL-009
    kind: difficulty
    description: "The corrected Python retro generator then failed immediately because this execution reported the standard json module unavailable, despite earlier Python use; abandon Python for the repository-native Node runtime."
    target: "harness-retro"
    severity: annoying
    workaround: "Regenerate the scaffolded schema-1.2 retro records with Node, validating each harness JSON envelope and observation count."
    fp: "db34873733d7"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T12:00:29.496Z"
---

# Retro — Issue #29 rpiv-implementer

Durable pre-verification drain of the complete transient observation buffer.
