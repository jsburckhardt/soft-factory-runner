---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/19-rpiv-progress-and-instructions"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-12T08:48:59.748Z"
agent: "rpiv-research"
plan_id: "19-define-rpiv-progress-final-result-ownership-and-integration-instructions"
schema_version: "1.2"
retro_id: "2026-08-12T08:48:59.748Z-rpiv-research-issue19"
started_at: "2026-08-12T07:55:25.090Z"
ended_at: "2026-08-12T08:49:30.000Z"
summary: "Persisted every pending rpiv-research observation from issue #19 before clearing the transient stage buffer."
entries:
  - id: CONF-001
    kind: confusion
    description: "Issue #19 was described as having 17 acceptance criteria, but the authoritative GitHub acceptance block contains 19 unchecked criteria (9 Core, 7 Edge Cases, 3 Verification)."
    target: tooling
    severity: degrading
    workaround: "Preserved all 19 criteria in issue order and flagged the discrepancy for Plan."
    suggested_encoding: "Validate requested acceptance counts against the authoritative marker block."
    fp: "ccae5e011b36"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T07:55:25.090Z"
  - id: DL-001
    kind: difficulty
    description: "Repository investigation commands using ripgrep failed because rg is not installed; keyword searches must be retried with grep."
    target: tooling
    severity: annoying
    workaround: "Retried repository searches with grep."
    suggested_encoding: "Expose a harness search verb or include rg in the environment."
    fp: "cae8b0386c4e"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T07:55:58.994Z"
  - id: DL-002
    kind: difficulty
    description: "Research brief write attempt failed because the documented python command is unavailable as python; retry requires python3."
    target: tooling
    severity: annoying
    workaround: "Retried with python3."
    suggested_encoding: "Document the available interpreter name or expose a file-write helper."
    fp: "ba1e7e909ba3"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T07:59:49.240Z"
  - id: DL-003
    kind: difficulty
    description: "Research brief JSON write retry failed because apostrophes were encoded as invalid five-digit Unicode escapes, producing control characters; the payload requires corrected four-digit escapes."
    target: tooling
    severity: annoying
    workaround: "Corrected Unicode escapes and regenerated the brief."
    suggested_encoding: "Provide a direct structured file-edit primitive that avoids shell quoting."
    fp: "1dc5db886e68"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T08:01:16.525Z"
---

# Retro — Issue #19 rpiv-research

Every pending observation was preserved verbatim with its capture fingerprint and disposition.
