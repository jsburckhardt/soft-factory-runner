---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/36-preserve-invoking-tmux-context"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-17T06:58:45.254Z"
agent: "rpiv-verifier"
plan_id: "36-preserve-the-invoking-tmux-server-and-session-for-issue-windows"
schema_version: "1.2"
retro_id: "2026-08-17T06:58:45Z-rpiv-verifier-cc9c0d412eb0"
started_at: "2026-08-17T06:23:38.774Z"
ended_at: "2026-08-17T06:58:45.254Z"
summary: "The prior Verify return exposed missing Doctor resource proof and attach semantics; the implementation correction was reverified, while unavailable search utilities and one malformed grep required explicit fallbacks."
entries:
  - id: DL-001
    kind: difficulty
    description: "Initial action-plan resolution retried because python executable was unavailable; used find instead."
    target: tooling
    severity: annoying
    workaround: "Used find for exact action-plan resolution."
    fp: "fb97c2fad78d"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-17T06:23:38.774Z"
  - id: DL-002
    kind: difficulty
    description: "Source search retried because ripgrep was unavailable in the verifier environment; used grep instead."
    target: tooling
    severity: annoying
    workaround: "Used grep and direct file reads."
    fp: "f83cae0673ad"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-17T06:23:39.780Z"
  - id: INS-001
    kind: insight
    description: "Live attach diagnostic proved select-pane does not make the persisted issue window current before attach-session, contradicting AC-5 exact-window attach behavior."
    target: project
    fp: "936be2f532fd"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-17T06:23:40.806Z"
  - id: DL-003
    kind: difficulty
    description: "Live Doctor unchanged evidence inventories directory entries rather than tmux server resources, so AC-13 proof is missing"
    target: project
    severity: blocking
    workaround: "Returned verification to Implement; correction now inventories explicit tmux resources."
    fp: "cbb8e581dfe1"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-17T06:23:42.301Z"
  - id: DL-004
    kind: difficulty
    description: "Repository verification expected rg for targeted source search, but rg is unavailable; used grep and direct file reads instead."
    target: tooling
    severity: annoying
    workaround: "Use grep and view ranges"
    fp: "cc9c0d412eb0"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-17T06:54:12.615Z"
  - id: DL-005
    kind: difficulty
    description: "A stale-schema grep placed --exclude after path operands and emitted an option-as-file error; reran with scoped patterns and direct classification."
    target: tooling
    severity: annoying
    workaround: "Place grep options before paths"
    fp: "9037e6f5eda1"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-17T06:54:58.770Z"
---

# Retro — Issue 36 RPIV Verify

The correction closes the prior Doctor inventory proof gap. All six pending verifier observations are preserved above with their original IDs, fingerprints, and first-seen timestamps.
