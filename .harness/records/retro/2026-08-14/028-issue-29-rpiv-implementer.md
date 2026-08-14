---
record_kind: "retro"
harness_version: "0.13.0"
branch: "fix/29-tmux-preparation-diagnostics"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-14T14:13:23.589Z"
agent: "rpiv-implementer"
plan_id: "29-preserve-retryable-tmux-preparation-failures-with-bounded-identity-diagnostics"
schema_version: "1.2"
retro_id: "2026-08-14T14:13:23.589Z-rpiv-implementer-1dc1c09c"
started_at: "2026-08-14T13:56:44.647Z"
ended_at: "2026-08-14T14:13:23.589Z"
summary: "Five Implement observations were drained after reproducing and correcting the built Doctor helper-readiness portability failure, hardening physical executable comparison, validating all gates, and removing exact residual debugging helpers."
entries:
  - id: DL-001
    kind: difficulty
    description: "Repository search with rg failed because rg is unavailable (exit 127); the first observation attempt also failed because kind 'tooling' is unsupported (exit 2), so grep and the documented 'difficulty' kind were used."
    target: "tooling"
    severity: annoying
    workaround: "Use grep for repository searches and a closed harness observation kind."
    suggested_encoding: "Document guaranteed search tools and the observation-kind enum in the orientation surface."
    fp: "d4de0c690cb3"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T13:56:44.647Z"
  - id: INS-001
    kind: insight
    description: "CI preserved value-free Doctor evidence as designed, but process-identity-unknown did not identify which compound field differed; root-cause work required reconstructing the mixed physical-versus-lexical executable comparison and protocol-fake launch source from code plus deterministic alias tests rather than reading raw runtime values."
    target: "diagnostics"
    workaround: "Use value-free compound-identity facts and controlled alias fixtures to isolate the mismatch without exposing process values."
    suggested_encoding: "Retain value-free per-field identity-match booleans in controlled test traces."
    fp: "a7a207248bd0"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T13:59:16.191Z"
  - id: DL-002
    kind: difficulty
    description: "The first scripted source edit invoked unavailable 'python' (exit 127); because the shell continued, formatting ran against unchanged files. Retried explicitly with python3 before formatting."
    target: "tooling"
    severity: annoying
    workaround: "Use python3 and inspect the edit command result before formatting."
    suggested_encoding: "Document python3 as the supported interpreter and fail edit-format command groups on the first error."
    fp: "1dbd612919de"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T13:59:59.321Z"
  - id: INS-002
    kind: insight
    description: "Targeted Doctor tests reproduced the CI symptom locally once: the built READY fixture returned exit 3, while rerunning the unchanged retained fixture immediately returned READY. This backtracking disproved a stable protocol/output defect and isolated a launch-readiness race in the fake server, which replied using child.pid before awaiting the child 'spawn' milestone."
    target: "test-fixture"
    workaround: "Await the exact helper spawn milestone over an allow-half-open private protocol connection before returning its PID."
    suggested_encoding: "Require controlled process fixtures to prove child launch settlement before publishing process locators."
    fp: "757b6c358a7b"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T14:02:50.840Z"
  - id: DL-003
    kind: difficulty
    description: "Failed built-fixture debugging runs left nine controlled helper processes after their temporary workspaces had been removed; the post-validation resource audit exposed them. Cleanup required strict /proc executable/argument/cwd/start-token rechecks before signaling those exact test-owned PIDs, followed by a clean inventory."
    target: "test-resource-cleanup"
    severity: degrading
    workaround: "Recheck every compound identity field for the fixed test-owned PIDs, signal only exact matches, and prove the process and workspace inventories empty."
    suggested_encoding: "Add failure-safe teardown around built-process fixture assertions and retain the final resource inventory gate."
    fp: "1dc1c09c1b2d"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T14:11:38.120Z"
---

# Retro — Issue #29 PR CI portability return

Durable drain of the complete CI-return Implement observation buffer. Existing verifier records and summaries were not modified.
