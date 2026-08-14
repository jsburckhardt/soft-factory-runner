---
record_kind: "retro"
harness_version: "0.13.0"
branch: "fix/29-tmux-preparation-diagnostics"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-14T13:16:25.331Z"
agent: "rpiv-implementer"
plan_id: "29-preserve-retryable-tmux-preparation-failures-with-bounded-identity-diagnostics"
schema_version: "1.2"
retro_id: "2026-08-14T13:16:25.331Z-rpiv-implementer-1bc032e9"
started_at: "2026-08-14T13:04:21.767Z"
ended_at: "2026-08-14T13:16:25.331Z"
summary: "Four pending rpiv-implementer observations were drained after the Issue #29 target and documentation corrections passed direct and harness validation."
entries:
  - id: DL-001
    kind: difficulty
    description: "The documented environment/tool surface suggested python was available, but the first bounded edit command failed with exit 127 because only python3 is installed; retried with python3."
    target: "tooling"
    severity: annoying
    workaround: "Use python3 for bounded repository-local text edits."
    suggested_encoding: "Document the available Python executable in the environment surface."
    fp: "1bc032e99ec5"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T13:04:21.767Z"
  - id: CONF-001
    kind: confusion
    description: "The first friction-capture attempt used unsupported kind tooling; the CLI rejected it with the allowed enum, so capture was retried as difficulty."
    target: "harness-observe"
    severity: annoying
    workaround: "Use one of the enum values returned by the failed command and retry the observation."
    suggested_encoding: "Include the closed observation-kind enum in the general harness orientation."
    fp: "682de9420f3f"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T13:04:32.939Z"
  - id: DL-002
    kind: difficulty
    description: "The repository exploration step assumed ripgrep was available, but rg was absent (exit 127; two piped probes masked this as exit 0 via head). Switched to grep without inferring results from the masked exits."
    target: "tooling"
    severity: annoying
    workaround: "Use grep and inspect unpiped exit codes before trusting repository search output."
    suggested_encoding: "Document guaranteed search tools and discourage pipelines that mask producer exit status."
    fp: "7e975b06a618"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T13:06:34.739Z"
  - id: DL-003
    kind: difficulty
    description: "The first direct full gate failed at Prettier because the new section-scoped documentation assertions were not formatter-normalized; no tests ran in that attempt. Applied the repository formatter only to src/documentation.test.ts, then reran required gates."
    target: "validation"
    severity: annoying
    workaround: "Format only the changed test, then rerun direct full and harness full validation."
    suggested_encoding: "Expose a root formatting recipe or include formatting in focused feedback."
    fp: "8c1b99617010"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T13:13:05.265Z"
---

# Retro — Issue #29 Verify-return correction Implement

Durable drain of the complete correction-implementation observation buffer. Verifier-owned observations remain untouched.
