---
record_kind: retro
harness_version: 0.13.0
branch: feat/27-single-soft-factory-agent
repo: https://github.com/jsburckhardt/soft-factory-runner.git
created_at: 2026-08-14T08:03:16.951Z
agent: rpiv-verifier
plan_id: 27-ship-only-the-soft-factory-delivery-agent-at-the-copilot-project-agent-path
schema_version: '1.2'
retro_id: 2026-08-14T08:03:16.951Z-rpiv-verifier-010
started_at: 2026-08-14T06:58:14.115Z
ended_at: 2026-08-14T08:03:16.951Z
summary: The final Issue 27 verifier rerun preserved earlier verifier findings and recorded concrete command-availability and file-reading retries before acceptance.
entries:
  - id: CONF-001
    kind: confusion
    description: >-
      Injected run binding and no-clobber result helper were not discoverable in the process environment; only a stale issue-25 candidate artifact is present.
    target: tooling
    workaround: Treated the explicit coordinator handoff as the run identity and deferred immutable publication until the documented bound helper could validate it.
    suggested_encoding: Expose the injected launch binding and exact no-clobber helper command through a read-only harness verb.
    fp: ba115bc3943c
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: 2026-08-14T06:58:14.115Z
  - id: DL-001
    kind: difficulty
    description: >-
      The planned repository search used rg, but rg was unavailable with exit 127; verification had to fall back to grep.
    target: tooling
    severity: degrading
    workaround: Used grep and tracked-file lists for the required repository search.
    suggested_encoding: Provide a root search recipe or include the documented search utility in the verifier environment.
    fp: ac7cbbc6f3cd
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: 2026-08-14T07:00:36.921Z
  - id: DL-002
    kind: difficulty
    description: >-
      Repository search retry required because documented-style rg was unavailable; used tracked-file grep instead.
    target: tooling
    severity: degrading
    workaround: Retried with grep over repository-controlled paths.
    suggested_encoding: Add deterministic search capability to the harness verifier surface.
    fp: 576627ae43ae
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: 2026-08-14T07:28:02.449Z
  - id: INS-001
    kind: insight
    description: >-
      Independent full-documentation review found stale PRD sections that still authorize the sole official agent to run lifecycle commands, contradicting the delivery-only committed agent contract.
    target: doc
    workaround: Returned AC-17 to Implement; the second correction aligned every current PRD agent surface and added regression assertions.
    suggested_encoding: Retain the PRD lifecycle-authorization negative assertions added by the correction.
    fp: dd64c7242ce7
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: 2026-08-14T07:33:01.390Z
  - id: DL-003
    kind: difficulty
    description: >-
      Initial action-plan resolution used unavailable python command and required a retry with python3.
    target: tooling
    severity: annoying
    workaround: Retried the unique-plan resolution with python3.
    suggested_encoding: Document python3 as the available interpreter or expose unique-plan resolution through harness.
    fp: 0bda097f8bae
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: 2026-08-14T07:55:50.292Z
  - id: DL-004
    kind: difficulty
    description: >-
      PRD audit attempted the unavailable rg command and required a retry with grep.
    target: tooling
    severity: annoying
    workaround: Re-ran the PRD lifecycle-language audit with grep.
    suggested_encoding: Include a harness-backed text-search command independent of optional binaries.
    fp: 6cb13f7bf57d
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: 2026-08-14T07:59:10.915Z
  - id: DL-005
    kind: difficulty
    description: >-
      A documentation read requested a second range beyond the file's 98-line end after the first read had already returned the complete file.
    target: tooling
    severity: annoying
    workaround: Used the already complete first read and did not retry the invalid range.
    suggested_encoding: Surface line count alongside successful file reads to avoid redundant range probes.
    fp: 8da98804d784
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: 2026-08-14T08:01:39.244Z
---

# Retro — Issue 27 final verification rerun

All seven pending verifier observations were preserved from the repository-shared buffer before clear.
