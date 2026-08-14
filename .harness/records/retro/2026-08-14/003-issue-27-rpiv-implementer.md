---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/27-single-soft-factory-agent"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-14T06:41:58.209Z"
agent: "rpiv-implementer"
plan_id: "27-ship-only-the-soft-factory-delivery-agent-at-the-copilot-project-agent-path"
schema_version: "1.2"
retro_id: "2026-08-14T06:42:47.149Z-rpiv-implementer-issue27"
started_at: "2026-08-14T06:09:39.746Z"
ended_at: "2026-08-14T06:42:47.149Z"
summary: "Drained 10 pending rpiv-implementer observations for Issue 27 before implementation handoff."
entries:
  - id: DL-001
    kind: difficulty
    description: "Python was unavailable while resolving the action-plan glob; retried with Node."
    severity: "annoying"
    fp: "d8ffd8bb54fd"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T06:09:39.746Z"
  - id: DL-002
    kind: difficulty
    description: "Harness Doctor was degraded because git-ai is not on the inherited editor PATH; repository layers passed."
    target: "tooling"
    severity: "degrading"
    workaround: "Retained the explicit Doctor warning; product work can continue under the documented machine-warning exception."
    fp: "475c09ecee9a"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T06:11:01.962Z"
  - id: DL-003
    kind: difficulty
    description: "A Node string-replacement edit evaluated a TypeScript template interpolation; rewrote the renderer as a complete file."
    target: "tooling"
    severity: "annoying"
    workaround: "Used a literal full-file write to avoid host-language interpolation."
    fp: "7ca55cb0ebc3"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T06:18:18.140Z"
  - id: DL-004
    kind: difficulty
    description: "Focused validation exposed one expected stale Phase 5 help assertion after selector contraction; deferred completion until documentation tests are updated in T6."
    target: "project"
    severity: "degrading"
    workaround: "Kept T1-T5 incomplete and proceeded to the planned documentation update before rerunning the root gate."
    fp: "6a37db456dd2"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T06:20:16.605Z"
  - id: DL-005
    kind: difficulty
    description: "An overbroad PRD section replacement removed sections 2 through 7; restored the tracked PRD and will apply bounded edits."
    target: "project"
    severity: "degrading"
    workaround: "Reviewed heading diff, restored only PRD.md from the Plan commit, and switched to exact local replacements."
    fp: "e5e3251be742"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T06:21:54.819Z"
  - id: DL-006
    kind: difficulty
    description: "The repository checkout hook reported git-personas unavailable but skipped the hook and completed the PRD restore successfully."
    target: "tooling"
    severity: "annoying"
    workaround: "Verified checkout exit code zero and inspected PRD headings before continuing."
    fp: "8e208ba9aa37"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T06:22:04.907Z"
  - id: DL-007
    kind: difficulty
    description: "A bounded PRD edit command was blocked because shell quoting around an apostrophe made the command shape unsafe; split it into quote-safe edits."
    target: "tooling"
    severity: "annoying"
    workaround: "Removed ambiguous shell quoting and used smaller Node transformations without dynamic shell construction."
    fp: "7a1e7f8ebd8e"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T06:29:17.093Z"
  - id: DL-008
    kind: difficulty
    description: "The first quote-safe PRD retry still retained an apostrophe in a secondary replacement and failed parsing; isolated each edit further."
    target: "tooling"
    severity: "annoying"
    workaround: "Applied the heading-bounded edit independently, then used heading indices for the acceptance wording."
    fp: "6fb883ef6b85"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T06:29:32.441Z"
  - id: DL-009
    kind: difficulty
    description: "A documentation-test rewrite embedded Markdown backticks inside a JavaScript template literal and failed parsing; retried with plain phrase assertions."
    target: "tooling"
    severity: "annoying"
    workaround: "Removed nested template delimiters while preserving observable documentation checks."
    fp: "5a68db87b980"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T06:30:39.088Z"
  - id: DL-010
    kind: difficulty
    description: "Full root validation failed at format-check for nine changed TypeScript files; applied the configured Prettier formatter before retry."
    target: "project"
    severity: "degrading"
    workaround: "Formatted only the named changed files, then reran root validation."
    fp: "7c0b3c58c791"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-14T06:38:04.948Z"
---

# Retro — Issue 27 rpiv-implementer

Pending observations were copied from the repository-shared stage buffer. The buffer is cleared only after this record is read back and checked.
