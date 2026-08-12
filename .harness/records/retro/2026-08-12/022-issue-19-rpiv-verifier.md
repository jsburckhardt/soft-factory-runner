---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/19-rpiv-progress-and-instructions"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-12T11:30:37.796Z"
agent: "rpiv-verifier"
plan_id: "19-define-rpiv-progress-final-result-ownership-and-integration-instructions"
schema_version: "1.2"
retro_id: "2026-08-12T11:30:37Z-rpiv-verifier-6555fdb1"
started_at: "2026-08-12T11:29:33.821Z"
ended_at: "2026-08-12T11:30:53.890Z"
summary: "Final GitHub checkbox and pull-request evidence probes required concrete retries for the available Python executable, acceptance-text shape, regex alternation, and escaping before deterministic read-only confirmation succeeded."
entries:
  - id: DL-001
    kind: difficulty
    description: "The final checkbox and PR evidence probes invoked python, but this checkout only provides python3; both probes exited 127 and required a concrete retry with python3."
    target: tooling
    severity: annoying
    workaround: "Retried the same read-only probes with python3."
    suggested_encoding: "Expose a stable Python command in the verifier environment or prefer dependency-free shell probes."
    fp: "0e2e3f49066f"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T11:29:33.821Z"
  - id: CONF-001
    kind: confusion
    description: "The first python3 final evidence probe was inconclusive: issue criteria do not embed AC IDs, and the PR regex matched one-digit alternatives before AC-10 through AC-19; manual inspection exposed both assumptions and required corrected probes."
    target: verification-tooling
    severity: annoying
    workaround: "Count all marker-bounded issue checkboxes and match two-digit PR IDs before one-digit IDs."
    suggested_encoding: "Provide one structured verifier command for acceptance checkbox and PR evidence confirmation."
    fp: "1dce423faecb"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T11:30:01.120Z"
  - id: DL-002
    kind: difficulty
    description: "The corrected issue-checkbox probe still over-escaped square brackets inside a Python raw regex and falsely reported zero; a second retry using marker-bounded awk counting was required."
    target: verification-tooling
    severity: annoying
    workaround: "Used awk literal line-prefix tests instead of layered shell/Python regex escaping."
    suggested_encoding: "Prefer a checked/unchecked count in the GitHub acceptance-update helper output."
    fp: "9f8f98166ed5"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T11:30:20.716Z"
---

# Retro — Issue 19 final RPIV verifier confirmation

These entries preserve the concrete retries needed while independently confirming GitHub issue and pull-request metadata after the final verification push.
