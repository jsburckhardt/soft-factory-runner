---
record_kind: "retro"
harness_version: "0.13.0"
branch: "docs/17-otel-prd-invocation"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-12T11:06:06.343Z"
agent: "rpiv-implementer"
plan_id: "17-configure-environment-variables-for-runner-launched-copilot-processes"
schema_version: "1.2"
retro_id: "2026-08-12T11:06:06Z-rpiv-implementer-6e7a44f2ed3b"
started_at: "2026-08-12T11:02:13.564Z"
ended_at: "2026-08-12T11:06:28.160Z"
summary: "Rebuilding the lost Issue 17 handoff required restoring local dependencies and accounting for host-specific validation and editing conditions; no product or PRD behavior needed correction."
entries:
  - id: DL-001
    kind: difficulty
    description: "Restored clean checkout lacked installed Node dependencies, so harness boot failed with tsc not found before validation and required the root just setup recipe."
    target: tooling
    severity: degrading
    workaround: "Ran the root just setup recipe before retrying boot."
    suggested_encoding: "Have restored-checkout automation run just setup before the harness boot boundary."
    fp: "6e7a44f2ed3b"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T11:02:22.084Z"
  - id: CONF-001
    kind: confusion
    description: "After just setup, harness boot application passed but composed full checks failed because ts-jest could not resolve jest-util during coverage; the dependency installation appeared incomplete and required investigation."
    target: tooling
    workaround: "Inspected npm resolution and the committed lock before applying a local no-save dependency repair."
    suggested_encoding: "Add a clean-checkout dependency-resolution check for the supported Node and npm versions."
    fp: "2d5b01848e91"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T11:02:50.670Z"
  - id: DL-002
    kind: difficulty
    description: "The committed npm lock under Node 24/npm 11 installed jest-util only beneath Jest packages, while ts-jest requires root resolution; restored the lock and used an untracked exact no-save jest-util 29.7.0 install to validate without changing task scope."
    target: tooling
    severity: degrading
    workaround: "Restored package-lock.json and installed jest-util 29.7.0 locally with no save and no lock update."
    suggested_encoding: "Pin and validate the supported Node/npm toolchain or encode a clean-install repair in the setup recipe."
    fp: "ee4aaa4eb8d5"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T11:03:43.409Z"
  - id: DL-003
    kind: difficulty
    description: "Focused harness reproduced the known macOS temporary-path alias failure in an unrelated Git worktree test: Git canonicalized /var to /private/var, so registration comparison failed; validation needs canonical TMPDIR as already documented in implementation evidence."
    target: tooling
    severity: degrading
    workaround: "Ran the root validation recipes and harness delegates with TMPDIR resolved to its canonical filesystem path."
    suggested_encoding: "Canonicalize temporary fixture roots inside the integration test helper."
    fp: "0ef100ad53bb"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T11:04:14.850Z"
  - id: DL-004
    kind: difficulty
    description: "Attempting to fill the retro with the advertised python command failed because only python3 is available in this checkout environment, requiring a direct retry with python3."
    target: tooling
    severity: annoying
    workaround: "Retried the same local file write with python3."
    suggested_encoding: "Advertise python3 rather than python in repository agent tooling examples."
    fp: "f1589f8f0f2c"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T11:06:28.160Z"
---

# Retro — Issue 17 rebuilt Implement handoff

The restored implementation already satisfied the plan. This record preserves only concrete checkout setup and host-validation friction encountered while rebuilding handoff evidence.
