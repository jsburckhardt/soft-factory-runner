---
record_kind: "retro"
harness_version: "0.13.0"
branch: "copilot-fix"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-12T11:15:08.979Z"
agent: "rpiv-implementer"
plan_id: "17-configure-environment-variables-for-runner-launched-copilot-processes"
schema_version: "1.2"
retro_id: "2026-08-12T11:15:30Z-rpiv-implementer-issue17"
started_at: "2026-08-12T11:12:57.553Z"
ended_at: "2026-08-12T11:15:30.000Z"
summary: "Implementation corrected the section-scoped V-11 proof and retried one unavailable local tool alias."
entries:
  - id: DL-001
    kind: difficulty
    description: "Corrected V-11 requires section-27 isolation, but the existing invocation assertion scans the whole PRD and is nested under V-9, so passing output does not prove AC-15 without a test correction."
    target: plan
    severity: degrading
    workaround: "Moved the assertion into a named V-11 block and bounded it between sections 27 and 28."
    suggested_encoding: "Encode section-bounded documentation assertions when acceptance names a section."
    fp: "e2b38e6eedfa"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T11:12:57.553Z"
  - id: DL-002
    kind: difficulty
    description: "The documented python tool name was unavailable while applying the V-11 test edit; retrying with the repository host's python3 executable."
    target: tooling
    severity: degrading
    workaround: "Retried the edit with python3."
    suggested_encoding: "Document the available Python executable consistently in the tool surface."
    fp: "202989b47bb7"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T11:13:10.996Z"
---

# Retro — Issue 17 rpiv-implementer acceptance coverage

The structured entries preserve all pending observations from this correction pass.
