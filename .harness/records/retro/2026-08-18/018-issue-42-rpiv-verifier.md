---
record_kind: "retro"
harness_version: "0.13.0"
branch: "fix/42-clean-exact-owned-dead-pane-window"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-18T09:40:36.573Z"
agent: "rpiv-verifier"
plan_id: "42-allow-explicit-cleanup-of-an-exact-owned-tmux-window-with-a-dead-pane"
schema_version: "1.2"
retro_id: "2026-08-18T09:40:36Z-rpiv-verifier-d9189f4c6324"
started_at: "2026-08-18T07:58:04.110Z"
ended_at: "2026-08-18T09:41:29.710Z"
summary: "Final verification preserved earlier return findings, completed full diff, architecture, acceptance, and documentation review, reran all direct and harness gates, and retried concrete tooling failures."
entries:
  - id: DL-001
    kind: difficulty
    description: "Repository verification search retried with grep because ripgrep is unavailable."
    target: tooling
    severity: annoying
    workaround: "Used grep for the finite repository search."
    suggested_encoding: "Provide ripgrep in the verifier image or document grep as the deterministic fallback."
    fp: "ddcc26b22875"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-18T07:58:04.110Z"
  - id: INS-001
    kind: insight
    description: "AC-9 live proof stops at direct tmux adapter removal and hard-codes worktree lease lock outcomes instead of driving explicit cleanup through Runner services."
    target: project
    workaround: "Returned the missing end-to-end acceptance proof to Implement; the retry now drives full IssueRunService cleanup."
    suggested_encoding: "Keep the full Runner live fixture as an AC-9 regression test."
    fp: "9ecf16732cc1"
    disposition: kept
    system:
      compound:
        status: encoded
        source: agent-self
        first_seen_at: "2026-08-18T08:05:57.395Z"
  - id: INS-002
    kind: insight
    description: "Release documentation attributes prior beta.1 Doctor and v6 targeting behavior to beta.2, making current release guidance historically inaccurate."
    target: doc
    workaround: "Returned the stale release history to Implement; corrected guidance now separates beta.0, beta.1, and beta.2."
    suggested_encoding: "Retain executable release-history documentation assertions."
    fp: "378ccc7fc8f8"
    disposition: kept
    system:
      compound:
        status: encoded
        source: agent-self
        first_seen_at: "2026-08-18T08:05:57.552Z"
  - id: INS-003
    kind: insight
    description: "AC-3 requires live-pane cleanup refusal, but canExplicitCleanup still treats TMUX_MATCH as reconciled and tests explicitly accept live-pane cleanup."
    target: project
    workaround: "Returned the authorization defect to Implement; the retry separates exact-dead explicit cleanup from live automatic cleanup."
    suggested_encoding: "Retain explicit live-refusal and exact-dead authorization matrix rows."
    fp: "ea1b6b125366"
    disposition: kept
    system:
      compound:
        status: encoded
        source: agent-self
        first_seen_at: "2026-08-18T08:06:18.941Z"
  - id: DL-002
    kind: difficulty
    description: "Environment variable-name probe was blocked because indirect shell expansion is prohibited; retried with plain env name listing."
    target: tooling
    severity: annoying
    workaround: "Used a plain filtered env listing without indirect expansion."
    suggested_encoding: "Expose the injected binding through one documented safe command."
    fp: "9623813ac7fd"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-18T08:50:46.306Z"
  - id: DL-003
    kind: difficulty
    description: "Large complete diff output was truncated into temporary tool artifacts and required range-based backtracking to finish architecture and documentation review."
    target: tooling
    severity: degrading
    workaround: "Read every generated diff artifact in bounded line ranges."
    suggested_encoding: "Add a harness diff-review manifest with per-file bounded evidence."
    fp: "e44c84bf61b5"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-18T08:52:11.447Z"
  - id: INS-004
    kind: insight
    description: "Application documentation review found stale public-output schemas and pre-dead-pane tmux observation grammar in README and recovery/issue-run guides despite changed committed rendering and observation behavior."
    target: doc
    workaround: "Returned application documentation defects to Implement and independently reviewed the corrected committed guides."
    suggested_encoding: "Keep documentation contract tests synchronized with public rendering and exact-target grammar."
    fp: "1e753af9a764"
    disposition: kept
    system:
      compound:
        status: encoded
        source: agent-self
        first_seen_at: "2026-08-18T08:55:11.250Z"
  - id: DL-004
    kind: difficulty
    description: "Offline pack smoke used unsupported install --recommended --json argument ordering; package/install version passed but manifest step required retry without --json."
    target: tooling
    severity: annoying
    workaround: "Read CLI help and reran the isolated offline smoke with the supported install --recommended syntax."
    suggested_encoding: "Expose JSON support consistently or include the exact package smoke invocation in a root recipe."
    fp: "d9189f4c6324"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-18T09:39:46.849Z"
  - id: DL-005
    kind: difficulty
    description: "Verifier retro write retried with python3 because the environment exposes no python executable despite Python availability guidance."
    target: tooling
    severity: annoying
    workaround: "Retried the generated retro write with python3."
    suggested_encoding: "Expose a stable python command or a harness retro fill operation."
    fp: "261925761671"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-18T09:41:29.709Z"
---

# Retro — Issue 42 RPIV verifier

All nine pending verifier observations were preserved, including prior acceptance and documentation returns and final verification retries.
