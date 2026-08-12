---
record_kind: "retro"
harness_version: "0.13.0"
branch: "docs/17-otel-prd-invocation"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-12T11:15:57.753Z"
agent: "rpiv-implementer"
plan_id: "17-configure-environment-variables-for-runner-launched-copilot-processes"
schema_version: "1.2"
retro_id: "2026-08-12T11:15:57Z-rpiv-implementer-6c3296c90787"
started_at: "2026-08-12T11:12:59.379Z"
ended_at: "2026-08-12T11:15:54.373Z"
summary: "The second Verify return reproduced a host-path representation defect in pre-existing recovery integration code; canonical temporary-path setup restored all configured gates without changing unrelated production or test behavior."
entries:
  - id: DL-001
    kind: difficulty
    description: "Verify-return full gate reproducibly reports a newly created temporary Git worktree as path-existing but unregistered"
    target: tooling
    severity: degrading
    workaround: "Reproduced the exact test alone and inspected Git porcelain plus requested and real fixture paths."
    suggested_encoding: "Canonicalize temporary fixture roots inside the owning recovery work item."
    fp: "6c3296c90787"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T11:12:59.379Z"
  - id: INS-001
    kind: insight
    description: "Targeted diagnosis showed macOS os.tmpdir returns /var while Git worktree porcelain canonicalizes it to /private/var; exact string matching misclassifies registration"
    target: tooling
    workaround: "Compared os.tmpdir, fs.realpath, and git worktree list output in a disposable diagnostic repository."
    suggested_encoding: "Add canonical path comparison at the worktree adapter boundary under the recovery plan."
    fp: "2f1ef89d6c7f"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T11:13:54.465Z"
  - id: COORD-001
    kind: coordination
    description: "Because the failure is unrelated pre-existing recovery code, validation requires canonicalizing TMPDIR so macOS /var and Git /private/var identify the same fixture path; no product or test change is justified for Issue 17"
    target: plan
    workaround: "Preserved Issue 17 scope and ran root and harness gates with TMPDIR resolved before invocation."
    suggested_encoding: "Track the recovery adapter defect separately instead of coupling it to Issue 17."
    fp: "286dda3f7fa0"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T11:14:17.557Z"
---

# Retro — Issue 17 second validation return

No stale registration or verifier-created worktree remained. The only workaround was canonical host setup; the Issue 17 implementation and its tests were not changed.
