---
record_kind: "retro"
harness_version: "0.13.0"
branch: "fix/29-tmux-preparation-diagnostics"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-14T16:14:35.379Z"
agent: "rpiv-implementer"
plan_id: "29-preserve-retryable-tmux-preparation-failures-with-bounded-identity-diagnostics"
schema_version: "1.2"
retro_id: "2026-08-14T16:14:35.379Z-rpiv-implementer-owned-descendant-cleanup"
started_at: "2026-08-14T15:54:32.031Z"
ended_at: "2026-08-14T16:14:35.379Z"
summary: "Hosted cleanup correction replaced unrelated host-wide process scanning with exact managed descendant traversal; five concrete Implement observations were retained during inspection, editing, focused repetition, and validation."
entries:
  - id: DL-001
    kind: difficulty
    description: "Repository inspection attempted to use ripgrep, but the environment has no rg executable; the search must be repeated with grep."
    target: "source-inspection"
    severity: annoying
    workaround: "Use grep -nE over the explicit affected files."
    suggested_encoding: "Expose the repository-supported source search tool in harness instructions or devcontainer tooling."
    fp: "d67c91701e94"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T15:54:32.031Z"
  - id: DL-002
    kind: difficulty
    description: "The first scripted LiveDoctorProcessPort edit used nested double quotes inside Python string literals, causing a SyntaxError before any file write."
    target: "product-edit"
    severity: annoying
    workaround: "Split the edit into smaller scripts and use triple-quoted Python literals for TypeScript blocks."
    suggested_encoding: "Provide a structured patch tool to avoid multi-language shell quoting for source edits."
    fp: "d400cef3f92f"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T15:59:44.041Z"
  - id: INS-001
    kind: insight
    description: "Inspection caught that the first no-helper optimization guarded the entire server cleanup block, which would skip private kill-server; only fallback helper discovery may be conditional."
    target: "cleanup-optimization"
    severity: degrading
    workaround: "Keep the workspace/server cleanup block unconditional and nest only findHelpers behind the helper-may-exist flags."
    suggested_encoding: "Add a no-helper cleanup regression that proves zero helper scans and one private kill-server call."
    fp: "84152d67227c"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T16:00:57.188Z"
  - id: DL-003
    kind: difficulty
    description: "The repeated focused test used a regex containing a pipe; the root just recipe expanded it unquoted and the shell treated the second branch as a command, so all three repetitions failed before Jest."
    target: "focused-validation"
    severity: annoying
    workaround: "Run READY and malformed-create selections as separate root-recipe invocations using pipe-free test-name substrings."
    suggested_encoding: "Quote variadic justfile test arguments or document that shell metacharacters are unsupported."
    fp: "b90b66eaf81c"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T16:06:03.908Z"
  - id: DL-004
    kind: difficulty
    description: "The first direct full gate passed lint but failed the root format-check for the three changed TypeScript files; no tests or build ran in that attempt."
    target: "full-validation"
    severity: annoying
    workaround: "Manually normalize the changed blocks to repository Prettier style, then rerun direct just verify."
    suggested_encoding: "Expose a root formatting recipe alongside format-check for deterministic Implement corrections."
    fp: "b36047acdb7a"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T16:09:47.399Z"
---

# Retro — Issue #29 managed descendant cleanup portability

Durable drain of the current Implement observations. Existing verifier records, summaries, and buffer remain untouched.
