---
record_kind: "retro"
harness_version: "0.13.0"
branch: "copilot-fix"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-12T11:02:48.829Z"
agent: "rpiv-implementer"
plan_id: "17-configure-environment-variables-for-runner-launched-copilot-processes"
schema_version: "1.2"
retro_id: "2026-08-12T11:02:48Z-rpiv-implementer-safe-tmpdir-resume"
started_at: "2026-08-12T10:59:28.339Z"
ended_at: "2026-08-12T11:02:48.829Z"
summary: "The restored PR checkout required inspection of the prior validation defect, canonical safe-TMPDIR execution outside the checkout, and dependency-installation backtracking before focused and full gates passed without deleting the checkout."
entries:
  - id: "DL-001"
    kind: "difficulty"
    description: "Initial concrete PRD command proof used an inferred issue-123 string that did not match the documented fixture, requiring inspection of section 27 and its regression assertion."
    target: "doc"
    severity: "annoying"
    workaround: "Inspected PRD section 27 and the focused documentation regression, then proved the committed generic and concrete forms."
    suggested_encoding: "Keep command evidence sourced from the regression assertion rather than reconstructed from memory."
    fp: "775c03b50e3c"
    disposition: "kept"
    system:
      compound:
        status: "open"
        source: "agent-self"
        first_seen_at: "2026-08-12T10:59:28.339Z"
  - id: "DL-002"
    kind: "difficulty"
    description: "Safe targeted focused validation could not start because the restored PR head had no installed Jest executable; checkout persistence still passed, so root just setup is required before retry."
    target: "tooling"
    severity: "degrading"
    workaround: "Ran the root setup recipe under the safe canonical TMPDIR before retrying validation."
    suggested_encoding: "Have validation report the root setup prerequisite explicitly when local project binaries are absent."
    fp: "98aa1f9f2e93"
    disposition: "kept"
    system:
      compound:
        status: "open"
        source: "agent-self"
        first_seen_at: "2026-08-12T10:59:47.814Z"
  - id: "DL-003"
    kind: "difficulty"
    description: "After root just setup with ambient npm, focused validation loaded Jest but failed because ts-jest could not resolve jest-util; the restored dependency tree requires backtracking to the repository-compatible npm installation method."
    target: "tooling"
    severity: "degrading"
    workaround: "Restored package-lock.json and reinstalled the committed tree with npm 10.9.2 before rerunning all gates."
    suggested_encoding: "Pin the compatible npm major in the project setup recipe."
    fp: "ffed1388e4ff"
    disposition: "kept"
    system:
      compound:
        status: "open"
        source: "agent-self"
        first_seen_at: "2026-08-12T11:00:08.897Z"
  - id: "DL-004"
    kind: "difficulty"
    description: "Implementation evidence append introduced one extra blank line at EOF detected by git diff --check; trimming the file to one trailing newline fixed it before validation."
    target: "doc"
    severity: "annoying"
    workaround: "Normalized the implementation note to exactly one trailing newline and reran git diff --check."
    suggested_encoding: "Have evidence writers normalize Markdown EOF whitespace."
    fp: "57fc141a7de6"
    disposition: "kept"
    system:
      compound:
        status: "open"
        source: "agent-self"
        first_seen_at: "2026-08-12T11:03:48.898Z"
---

# Retro — Issue 17 safe TMPDIR implementation resume

Validation used `/private/tmp`, which is canonical and outside the evaluation checkout. The targeted cleanup test and all focused/full gates passed while the checkout remained at the restored commit.
