---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/17-configure-copilot-environment"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-12T05:34:35.859Z"
agent: "rpiv-research"
plan_id: "17-configure-environment-variables-for-runner-launched-copilot-processes"
schema_version: "1.2"
retro_id: "2026-08-12T05:34:35.859Z-rpiv-research-1ffded61362f"
started_at: "2026-08-12T04:56:54.410Z"
ended_at: "2026-08-12T05:34:35.859Z"
summary: "Research encountered three missing local editing and search commands and completed by using repository-available find, grep, and Node filesystem operations."
entries:
  - id: DL-001
    kind: difficulty
    description: "Repository investigation command failed because ripgrep (rg) is unavailable; use grep/find instead."
    target: tooling
    severity: annoying
    workaround: "Used grep and find for repository investigation."
    suggested_encoding: "Expose a root repository search recipe or include ripgrep in the development image."
    fp: "1ffded61362f"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T04:56:54.410Z"
  - id: DL-002
    kind: difficulty
    description: "Research artifact creation failed because the expected apply_patch helper is unavailable; use a direct file-writing API instead."
    target: tooling
    severity: annoying
    workaround: "Switched to a direct repository file-writing operation."
    suggested_encoding: "Provide a first-class literal file edit operation in the agent tool surface."
    fp: "6bda84c1b468"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T05:00:22.164Z"
  - id: DL-003
    kind: difficulty
    description: "Fallback artifact writing failed because the python executable is unavailable despite Node being present; retry with Node filesystem APIs."
    target: infra
    severity: annoying
    workaround: "Used Node filesystem APIs for artifact writing."
    suggested_encoding: "Align advertised runtimes with the development image or provide a root artifact-writing command."
    fp: "766e56d8ddde"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T05:01:05.220Z"
---

# Retro — Issue 17 Research

All three pending Research observations are retained verbatim in structured entries.
