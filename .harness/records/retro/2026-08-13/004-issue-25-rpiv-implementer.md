---
record_kind: retro
harness_version: 0.13.0
branch: fix/25-reproducible-clean-install-ci
repo: 'https://github.com/jsburckhardt/soft-factory-runner.git'
created_at: '2026-08-13T03:31:13.940Z'
agent: rpiv-implementer
plan_id: 25-make-clean-installs-and-delivery-verification-reproducible
schema_version: '1.2'
retro_id: '2026-08-13T03:32:45Z-rpiv-implementer-423f33ed500e'
started_at: '2026-08-13T02:47:00.790Z'
ended_at: '2026-08-13T03:32:45.000Z'
summary: Implementation review validated the existing dirty tree; isolated runtime proof required host and container setup and cleanup retries.
entries:
  - id: DL-001
    kind: difficulty
    description: Ruby was unavailable for local workflow YAML parsing; reused the installed js-yaml dependency instead.
    target: tooling
    severity: annoying
    workaround: Parsed workflow YAML with the already-installed js-yaml dependency.
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: '2026-08-13T02:47:00.790Z'
    fp: 423f33ed500e
  - id: DL-002
    kind: difficulty
    description: Runtime probe partially failed because the expected file utility is absent; Docker itself is available and the probe was retried without file.
    target: tooling
    severity: annoying
    workaround: Retried using ldd and Docker inspection.
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: '2026-08-13T03:19:16.877Z'
    fp: e5b2a1c7bb72
  - id: DL-003
    kind: difficulty
    description: The first isolated-checkout copy placed devcontainer-lock.json at the checkout root because mixed source paths were copied to one directory; the snapshots were corrected before validation.
    target: tooling
    severity: annoying
    workaround: Removed the misplaced file and copied it to the intended path.
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: '2026-08-13T03:19:47.456Z'
    fp: 4665e85cda4f
  - id: DL-004
    kind: difficulty
    description: The first Docker runtime attempt mounted an in-container /tmp path that the host Docker daemon could not see; validation was retried through the documented HOST_PROJECT_PATH workspace mapping.
    target: tooling
    severity: degrading
    workaround: Created ignored workspace checkouts and mounted them through HOST_PROJECT_PATH.
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: '2026-08-13T03:20:19.746Z'
    fp: b26a8670de07
  - id: DL-005
    kind: difficulty
    description: The host Docker daemon also could not bind the devcontainer-only /usr/local/bin/just path; the existing static just binary was copied into each ignored isolated checkout and added to PATH for the retry.
    target: tooling
    severity: degrading
    workaround: Copied the existing static just binary into each isolated checkout.
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: '2026-08-13T03:20:51.929Z'
    fp: 45f70c78902a
  - id: DL-006
    kind: difficulty
    description: 'The first host-visible Node 22 verification failed one repository-aware documentation test because git clone rewrote origin to the local source path; matching the source checkout GitHub origin was hidden isolated-fixture setup, then validation was restarted.'
    target: tooling
    severity: degrading
    workaround: Set each isolated clone origin to the source checkout GitHub URL and restarted proof.
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: '2026-08-13T03:22:23.310Z'
    fp: 68ea608b43a9
  - id: DL-007
    kind: difficulty
    description: 'The planned task-status edit initially used python, but this repository environment exposes Node rather than python; the same bounded edit was retried with Node.'
    target: tooling
    severity: annoying
    workaround: Used Node.js for the bounded Markdown edit.
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: '2026-08-13T03:28:11.826Z'
    fp: 2edd5b15d7e8
  - id: DL-008
    kind: difficulty
    description: Full harness validation initially failed because ESLint traversed the ignored isolated checkouts retained under .harness/temp; runtime proof artifacts had to be removed before the repository gate.
    target: tooling
    severity: degrading
    workaround: Removed isolated runtime proof directories and reran the full gate.
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: '2026-08-13T03:28:34.230Z'
    fp: 60cf170aa619
  - id: DL-009
    kind: difficulty
    description: Cleanup of Docker-generated isolated checkouts required a container retry because npm/build outputs were root-owned and could not be removed by the development user.
    target: tooling
    severity: degrading
    workaround: Removed root-owned outputs through a short-lived container mount.
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: '2026-08-13T03:28:46.816Z'
    fp: f99397d291ac
  - id: DL-010
    kind: difficulty
    description: The first retro population command was blocked by the shell security scanner because JavaScript template syntax resembled dangerous shell expansion; it was rewritten without template expansion.
    target: tooling
    severity: annoying
    workaround: Rewrote the command without template expansion.
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: '2026-08-13T03:31:55.623Z'
  - id: DL-011
    kind: difficulty
    description: The second retro population retry hit shell quoting on an apostrophe inside an observation description; the text was preserved semantically and the writer was retried with quote-safe input.
    target: tooling
    severity: annoying
    workaround: Retried with quote-safe input and preserved the observation meaning.
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: '2026-08-13T03:32:31.816Z'
---

# Retro — issue 25 Implement

Implement observations were drained with original provenance.
