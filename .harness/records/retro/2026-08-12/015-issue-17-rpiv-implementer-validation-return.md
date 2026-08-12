---
record_kind: "retro"
harness_version: "0.13.0"
branch: "copilot-fix"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-12T10:13:21.981Z"
agent: "rpiv-implementer"
plan_id: "17-configure-environment-variables-for-runner-launched-copilot-processes"
schema_version: "1.2"
retro_id: "2026-08-12T10:13:21Z-rpiv-implementer-b843f2659e35"
started_at: "2026-08-12T10:11:05.186Z"
ended_at: "2026-08-12T10:16:05.692Z"
summary: "A Verify-return retry reproduced a macOS temporary-path alias mismatch; canonicalizing TMPDIR isolated it from Issue 17 and allowed all authoritative validation gates to pass without unrelated code changes."
entries:
  - id: DL-001
    kind: difficulty
    description: "Verify-return targeted integration retry reproduced unregistered worktree because macOS temporary paths may differ canonically."
    target: infra
    severity: degrading
    workaround: "Reran the fixture and validation recipes with TMPDIR resolved to its canonical filesystem path."
    suggested_encoding: "Make temporary Git worktree fixtures compare canonical paths or provide a canonical-temp validation wrapper."
    fp: "b843f2659e35"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T10:11:05.186Z"
  - id: INS-001
    kind: insight
    description: "Canonicalizing TMPDIR changed the reproduced worktree-registration failure to a pass, confirming a macOS /var versus /private/var fixture-path mismatch rather than Issue 17 behavior."
    target: infra
    workaround: "Used the canonical temporary-directory path for targeted, focused, full, and harness validation."
    suggested_encoding: "Keep fixture paths and Git porcelain paths in one canonical representation."
    fp: "48fa168da898"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T10:11:21.531Z"
  - id: DL-002
    kind: difficulty
    description: "The repository environment had no python executable while filling the retro scaffold, requiring a retry with Node.js."
    target: tooling
    severity: annoying
    workaround: "Used the repository Node.js runtime to write the scaffold content."
    suggested_encoding: "Prefer the project runtime for repository-local artifact editing."
    fp: "a8811e4d5ebd"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T10:13:42.742Z"
  - id: DL-003
    kind: difficulty
    description: "A Node.js evidence-edit retry failed because the embedded test-name quoting conflicted with shell quoting."
    target: tooling
    severity: annoying
    workaround: "Retried with line-array content that avoided conflicting shell quote characters."
    suggested_encoding: "Use a repository-native structured file editor for evidence updates."
    fp: "9e821aa412cb"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T10:14:31.743Z"
  - id: DL-004
    kind: difficulty
    description: "Final full root validation was terminated by signal 11 during Jest after five suites, requiring one explicit full-gate retry."
    target: infra
    severity: degrading
    workaround: "Reran the authoritative full root recipe once; all 19 suites and remaining gates passed."
    suggested_encoding: "Expose host resource and process termination diagnostics in the validation envelope."
    fp: "dc6578c84cd4"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T10:16:05.692Z"
---

# Retro — Issue 17 validation return

The failure was reproduced only with the noncanonical macOS temporary-directory spelling. No production or test source changed because the condition is unrelated to the Copilot child-environment task.
