---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/6-diagnose-repository-readiness"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-12T01:50:56.729Z"
agent: "rpiv-implementer"
plan_id: "6-phase-4-diagnose-repository-readiness"
schema_version: "1.2"
retro_id: "2026-08-12T01:50:56Z-rpiv-implementer-cc3f26788560"
started_at: "2026-08-12T01:30:43.455Z"
ended_at: "2026-08-12T01:50:56.743Z"
summary: "Implement completed T-1 through T-7 with focused/full retries for tooling, strict typing, containment, and formatting friction."
entries:
  - id: DL-001
    kind: difficulty
    description: "The repository environment does not provide apply_patch, so implementation edits require a different deterministic file-edit mechanism."
    target: tooling
    severity: annoying
    workaround: "Use short Python file transformations and verify each diff."
    suggested_encoding: "Expose a repository-supported patch/edit helper in the harness briefing."
    fp: "cc3f26788560"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T01:30:43.455Z"
  - id: CONF-001
    kind: confusion
    description: "The advertised Python edit fallback is available only as python3, not python, causing a second failed implementation-edit attempt."
    target: tooling
    severity: annoying
    workaround: "Use python3 explicitly for repository file transformations."
    suggested_encoding: "List exact executable names in the agent tool briefing."
    fp: "cc51e4087be5"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T01:30:59.375Z"
  - id: DL-002
    kind: difficulty
    description: "Without the repository patch helper, the first python3 whole-file edit also failed because shell quoting terminated the embedded source unexpectedly."
    target: tooling
    severity: annoying
    workaround: "Use a single-quoted python3 command with triple-double-quoted source that contains no conflicting delimiter."
    suggested_encoding: "Provide a native file-edit tool instead of shell-embedded source."
    fp: "3004c43411a7"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T01:32:24.923Z"
  - id: INS-001
    kind: insight
    description: "Task T-1 focused validation exposed a forward dependency from runtime.trees-ownership to later canonical checks; the closed output order requires only earlier assembly dependencies."
    target: project
    severity: annoying
    workaround: "Remove forward result dependencies and keep state/lock observations independent inputs to ownership classification."
    suggested_encoding: "Validate the canonical dependency table for acyclicity and earlier-only references."
    fp: "3633444b3c1e"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T01:33:59.469Z"
  - id: INS-002
    kind: insight
    description: "Task T-2 focused validation caught a test assertion that counted the nullable githubHost fact as an object, obscuring the intended five repository check records."
    target: project
    severity: annoying
    workaround: "Assert the five named repository observation keys directly instead of using typeof over a mixed result object."
    suggested_encoding: "Keep check collections separate from auxiliary nullable discovery facts in adapter test helpers."
    fp: "26e102bae683"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T01:36:13.221Z"
  - id: INS-003
    kind: insight
    description: "Task T-3 focused validation showed that physical containment rejected a missing configured child whenever its nearest existing ancestor was the repository root itself."
    target: project
    severity: annoying
    workaround: "Allow the physical ancestor to equal the repository root while continuing to require the configured target to be a non-root contained path."
    suggested_encoding: "Test missing safe roots separately from roots that resolve to the repository root."
    fp: "82350b29be5c"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T01:38:18.314Z"
  - id: COORD-001
    kind: coordination
    description: "Task T-5 focused validation exposed the expected stale Phase 3 help-title assertion immediately after adding the Phase 4 Doctor command."
    target: project
    severity: annoying
    workaround: "Advance the existing help smoke assertion to Phase 4 now, then add complete Doctor documentation assertions in T-7."
    suggested_encoding: "Avoid phase-number coupling in legacy command smoke tests when help is intentionally cumulative."
    fp: "4ff16fb11f97"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T01:42:10.805Z"
  - id: DL-003
    kind: difficulty
    description: "Task T-6 focused validation reported only the nested just build stderr and omitted TypeScript diagnostics written to stdout, requiring a direct root build rerun to identify the failure."
    target: tooling
    severity: degrading
    workaround: "Run the existing root just build recipe directly and then fix the surfaced compiler diagnostics."
    suggested_encoding: "Include both bounded stdout and stderr when a nested fixture build fails."
    fp: "c5733a917833"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T01:44:17.266Z"
  - id: DL-004
    kind: difficulty
    description: "Full validation rejected explicit any types in the new manifest integration tests even though focused Jest validation had passed all behavior."
    target: tooling
    severity: degrading
    workaround: "Define strict manifest/check/variant interfaces and replace all explicit any annotations before rerunning full gates."
    suggested_encoding: "Include lint and type checking in an optional fast pre-full task check for strict TypeScript fixtures."
    fp: "e57751e948f8"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T01:47:40.606Z"
  - id: DL-005
    kind: difficulty
    description: "After lint passed, full validation found Prettier drift across the newly created Doctor source and test files because focused validation checks tests and diff hygiene but not formatting."
    target: tooling
    severity: degrading
    workaround: "Apply the repository-configured Prettier formatter to the exact paths named by the root format-check recipe, then rerun root full validation."
    suggested_encoding: "Add a root format-write recipe or include format checking in the focused gate for multi-file TypeScript work."
    fp: "462550a73272"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T01:48:20.438Z"
  - id: CONF-002
    kind: confusion
    description: "A full validation rerun still reported src/doctor-compatibility.ts as unformatted immediately after the repository Prettier write completed, requiring an isolated format-and-check retry."
    target: tooling
    severity: annoying
    workaround: "Format that file in isolation, run the root format-check recipe, and inspect for formatter instability before full validation."
    suggested_encoding: "Expose formatter version and changed-file diff when format-check disagrees with a just-completed write."
    fp: "60643bcb99c1"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T01:48:47.434Z"
---

# Retro — Issue 6 rpiv-implementer

Durable drain of every pending rpiv-implementer observation before implementation handoff.
