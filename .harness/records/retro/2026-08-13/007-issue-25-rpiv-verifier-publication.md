---
record_kind: "retro"
harness_version: "0.13.0"
branch: "fix/25-reproducible-clean-install-ci"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-13T03:51:12.159Z"
agent: "rpiv-verifier"
plan_id: "25-make-clean-installs-and-delivery-verification-reproducible"
schema_version: "1.2"
retro_id: "2026-08-13T03:50:33Z-rpiv-verifier-6a1d6873bb88"
started_at: "2026-08-13T03:50:33.491Z"
ended_at: "2026-08-13T03:51:12.159Z"
summary: "Publication discovery required a search-tool fallback and then exposed missing Runner run-state binding in the current checkout."
entries:
  - id: DL-001
    kind: difficulty
    description: "Verifier publication-helper discovery attempted the unavailable rg executable; switched to recursive grep over the bounded source and documentation paths."
    target: tooling
    severity: annoying
    workaround: "Used recursive grep over only the relevant source, documentation, and agent paths."
    suggested_encoding: "Document the publication helper directly in the injected verifier handoff."
    fp: "6a1d6873bb88"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-13T03:50:33.491Z"
  - id: COORD-001
    kind: coordination
    description: "Runner status for issue 25 returned STATE_NOT_FOUND while locating the injected publication binding; no run snapshot is available in this checkout, so immutable result publication may be blocked without coordinator injection."
    target: tooling
    severity: blocking
    workaround: "Preserved the missing-state evidence and continued only with tracked verifier closeout before attempting the no-clobber helper."
    suggested_encoding: "Inject the run identity and publish/validate commands into the verifier environment independently of mutable Runner state lookup."
    fp: "c767d784e497"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-13T03:51:01.732Z"
---

# Retro — Issue 25 verifier publication discovery

These entries preserve the concrete helper-discovery retry and missing Runner binding evidence.
