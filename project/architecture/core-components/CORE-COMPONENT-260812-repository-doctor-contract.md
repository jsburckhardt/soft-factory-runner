# CORE-COMPONENT-260812-repository-doctor-contract: Repository Doctor Contract

## Status

Adopted

## Purpose

Define the reusable cross-cutting contract for complete, deterministic, safe repository-readiness diagnostics shared by command parsing, domain policy, adapters, rendering, fixtures, and operator documentation.

## Scope

This component applies only to `soft-factory doctor [--json]`, Doctor configuration and RPIV metadata, repository and runtime-state observations, functional command probes, managed probe processes, output, exit behavior, fixtures, cleanup, and timing. It does not select or inspect issues, authorize run mutations, contact the normal Runner tmux server, or replace the ambient engineering-harness Doctor.

## Definition

### Rules
- Emit exactly these stable blocking checks in this order: `repository.git-membership`, `repository.primary-worktree`, `repository.git-common-directory`, `repository.github-identity`, `repository.default-branch`, `command.git`, `command.gh`, `command.tmux`, `command.node`, `command.copilot`, `authentication.github-cli`, `authentication.copilot-cli`, `compatibility.rpiv-agent`, `compatibility.runner-protocol`, `compatibility.configuration`, `compatibility.worktree-root`, `compatibility.state-root-writable`, `compatibility.trees-ignored`, `compatibility.runtime-state-ignored`, `compatibility.result-contract`, `runtime.trees-ownership`, `runtime.state-readable`, `runtime.locks-interpretable`, and `runtime.required-paths-creatable`.
- Represent every check as `passed` or `failed` with `blocking: true`. Never omit a check because another check failed; dependency-blocked or ambiguous observations become failed entries with concrete safe remediation.
- Define `command.tmux` as executable presence plus one successful isolated functional probe and proved cleanup. An executable-only or partially successful observation MUST fail.
- Resolve all command executables directly from PATH without a shell. Check GitHub authentication with bounded redacted `gh auth status` for the discovered host and Copilot usability with bounded redacted `copilot --version`; presence and usability remain separate checks.
- Create exactly one private tmux probe workspace with `mkdtemp` under the physical operating-system temporary directory. Require a safe directory parent and socket path length before launch. Set workspace mode 0700 and create an empty configuration and long-lived Node helper with mode 0600.
- Derive unique socket, session, dashboard, and issue-window names from the probe token. Values remain ephemeral and MUST NOT enter Doctor results, errors, logs, or documentation evidence.
- Start the discovered tmux executable as a directly managed foreground server using `-D -S <private-socket> -f <empty-config>`. Every client MUST use that exact executable and `-S <private-socket>`; no command may omit the private socket selector or contact a default or named ambient server.
- Give the probe private HOME, XDG configuration, and TMPDIR locations within its workspace. Omit inherited `TMUX`, `TMUX_PANE`, `TMUX_TMPDIR`, GitHub/Copilot credentials, and unrelated variables.
- Wait once for private-socket readiness through an event-driven bounded adapter. Do not poll, retry, or infer server readiness from executable presence.
- Execute one sequence: detached session/dashboard creation with the helper; `has-session`; exact dashboard `list-windows`; positive dashboard `display-message` pane PID; detached `new-window -P -F #{window_id}|#{pane_id}` with the helper; `set-window-option remain-on-exit on`; positive issue `display-message -p -t <pane-id> #{pane_pid}`; one `list-panes -F #{window_id}|#{pane_id}|#{pane_current_path}`; and exact issue `kill-window`.
- Parse new-window and list-panes stdout from original bytes under `CORE-COMPONENT-260814-tmux-identity-diagnostics`. Require untruncated streams, exact accepted records, observation IDs equal to creation IDs, and observation cwd equal to the physical workspace.
- Treat each returned pane PID only as an ephemeral locator. Observe compound PID, process-group, start-token, executable, argument, and cwd identity before fallback signaling; PID alone MUST NOT authorize a signal. During cleanup, enumerate the union of recorded helpers and exact candidates matching the private helper script argument, physical workspace cwd, launch interval, and foreground-server lineage; never discover or signal by process name alone.
- Treat server startup, socket readiness, session creation/query, window listing/creation/configuration/removal, pane PID parsing, identity parsing, identity equality, cwd equality, timeout, output overflow, and cleanup as independently classifiable functional failures. No partial sequence can pass.
- Keep original command bytes, identity values, cwd, pane PIDs, socket and workspace paths, tokenized names, command arguments, environment values, helper output, and process details ephemeral. Never persist or render them.
- Capture at most 4096 bytes from each stdout and stderr stream while continuing to drain and count all observed bytes. Count bytes before UTF-8 decoding, expose truncation separately, and fail a parsed or functional observation when either stream is truncated.
- Apply the same 4096-byte retention, complete draining/counting, and truncation rules to the managed foreground server stdout and stderr. Server stream overflow MUST fail the probe and enter cleanup.
- Redact decoded diagnostics before use and cap generic message detail at 240 characters. Tmux probe messages MUST use fixed value-free text instead of command output. Never expose raw output, field values, path components, identifiers, byte values, or hashes in tmux evidence.
- Derive human and JSON forms from one `DoctorResultV2`. Set `ready` only when every blocking check passes. Human output prints every ID, outcome, blocking meaning, failure details, and any versioned safe evidence, then exactly `STATUS: READY` or `STATUS: NOT READY`.
- Emit JSON schema version 2 with top-level `schemaVersion`, `ready`, `repository.github`, `repository.defaultBranch`, and ordered `checks`. Each entry contains `id`, `status`, and `blocking`; each failure also contains nonempty `message` and `remediation` and may contain versioned `evidence`. Unknown repository fields are `null`, never invented.
- Define `DoctorTmuxProbeEvidenceV1` with `schemaVersion: 1`, kind `tmux-functional-probe`, closed `operation` and `reason` enums, nullable exit code, timeout, exact stdout/stderr byte counts, stream truncation flags, nullable value-free `TmuxIdentityDiagnosticV1`, and cleanup states for server, pane processes, socket, and workspace. It MUST contain only closed enum literals, bounded numbers, booleans, and the closed value-free identity structure.
- Define the evidence `operation` enum as exactly `workspace`, `server-start`, `socket-ready`, `session-create`, `session-query`, `window-list`, `dashboard-pane-identify`, `window-create`, `window-configure`, `issue-pane-identify`, `pane-observe`, `window-remove`, `server-stop`, `helper-stop`, `workspace-remove`, and `aggregate`.
- Define the evidence `reason` enum as exactly `unavailable`, `unsafe-workspace`, `filesystem-failed`, `launch-failed`, `socket-unavailable`, `nonzero-exit`, `timeout`, `cancelled`, `output-truncated`, `malformed-output`, `identity-mismatch`, `cwd-mismatch`, `process-identity-unknown`, `cleanup-failed`, `unexpected-resource`, and `aggregate-deadline`.
- Define each server, pane-processes, socket, and workspace cleanup state as exactly `not-created`, `absent`, `present`, or `unknown`.
- Render every `DoctorTmuxProbeEvidenceV1` field deterministically in human output so human and JSON modes preserve identical evidence meaning.
- Exit 0 for READY, 3 for a complete NOT READY report, and 2 for invalid syntax. A failed prerequisite is report data, not a fail-fast CLI error.
- Require `.soft-factory/config.yml` to parse strictly with `protocol_version: 1`, repository-relative `repository.worktree_root`, and repository-relative `repository.state_root`; default roots are `.trees` and `.soft-factory`. Reject unknown keys, unsupported protocol versions, absolute paths, traversal, overlap, file collisions, and symlink escape.
- Require `.github/agents/rpiv.agent.md` frontmatter to identify RPIV and declare `runner_protocol: 1` plus `result_contract: agent-result-v1`. Keep agent existence, protocol compatibility, and result-contract availability as separate checks.
- Prove `.trees/` and the complete configured state root ignored using representative descendant paths and shell-free `git check-ignore --no-index`; do not accept a parent assumption without Git evidence.
- Validate state readability with existing strict schema parsers for recognized snapshots, events, owner locks, and slot leases. Ignore unrelated filenames. Fail malformed or unsupported recognized files and preserve all bytes.
- Classify numeric `.trees/<issue>` directories and registered issue worktrees as safe only when path, Git registration where applicable, snapshot, and owner-lock identities agree. Unknown, malformed, mismatched, or incomplete ownership fails without modification.
- Probe state writability and required path creation only with exclusive randomized resources under validated repository-contained ancestors. Remove only exact resources created by those probes, report cleanup failure as failure, and never create or alter issue locks, snapshots, events, leases, logs, worktrees, branches, or configuration.
- Give every external command and managed-process wait a maximum 2000ms bound. Create one absolute 9000ms Doctor deadline, stop scheduling functional work at 6500ms, and reserve the remaining 2500ms for owned tmux cleanup.
- Partition cleanup with absolute milestones from Doctor start: cancel private `kill-server` by 7000ms; end the post-request managed wait by 7250ms; end concurrent exact SIGTERM waits by 7750ms; end concurrent exact SIGKILL waits by 8250ms; and finish workspace removal plus final process/socket/tree verification by 9000ms. Earlier completion leaves time to later stages, but no stage may exceed its milestone.
- At the operational cutoff, cancel any active tmux client and enter cleanup. The aggregate controller MUST await the probe `finally` settlement and MUST NOT return while evaluation or managed probe work continues in the background.
- On every success, command failure, malformed result, timeout, cancellation, and aggregate expiry, request `kill-server` only through the private socket; wait for the managed foreground server; escalate only that exact process from SIGTERM to SIGKILL; and terminate only still-matching recorded dashboard and issue helper process identities.
- Remove the exclusively owned workspace recursively only after process cleanup, then verify server and helper identities, private socket, and workspace absent. Cleanup uncertainty overrides operation success and fails `command.tmux` with structured evidence.
- Keep Doctor repository-scoped. It MUST NOT call issue APIs, parse issue acceptance criteria, inspect backlog priority, queue work, assess implementation readiness, or inspect/adopt/remove ambient tmux resources.

### Interfaces
- `DoctorCheckId` is the closed ordered 24-ID vocabulary above.
- `DoctorCheckResultV2` contains `id`, `status`, `blocking`, failure-only `message` and `remediation`, and optional versioned safe `evidence`.
- `DoctorResultV2` contains schema version 2, readiness, nullable GitHub/default-branch facts, and the complete ordered checks array.
- `DoctorTmuxProbeEvidenceV1` is the value-free operation, command, identity-structure, and cleanup failure contract.
- `DoctorCommandResult` exposes bounded original buffers, total byte counts, and truncation flags in addition to redacted decoded streams and exit/timeout facts.
- `DoctorTmuxProbePort` accepts the discovered absolute tmux executable, absolute aggregate deadline, and injected workspace, managed-process, process-observation, command, clock, and token seams.
- A managed foreground process handle exposes exact identity, bounded wait, SIGTERM, and SIGKILL without name-based signaling.
- Doctor ports otherwise expose bounded command resolution/execution, Git discovery/default/ignore/worktree facts, strict state inventory, RPIV metadata, and reversible filesystem probes.

### Expectations
- Ready and blocked schema-v2 fixtures declare the expected result for every check before invocation.
- The fixture matrix produces at least one passing and one failing outcome for each of the 24 IDs and verifies no issue-port call or owned-resource mutation.
- Controlled `command.tmux` fixtures cover absent executable, no-op/nonfunctional executable, server startup failure, malformed create bytes, malformed observe bytes, identity mismatch, cwd mismatch, client timeout, aggregate cancellation, output overflow, cleanup-command failure, and residual process/socket/workspace detection.
- Every tmux success and failure fixture snapshots ambient/default-server tripwires before and after and observes no contact or mutation.
- Every tmux fixture proves server, session, windows, panes, helpers, socket, configuration, and workspace absent after the result; resource inventories and managed-process traces are expected evidence.
- Human and JSON rendering preserve identical IDs, statuses, blocking values, readiness, repository facts, messages, remediations, and safe evidence.
- A controlled ready built fixture uses a protocol-aware fake tmux executable and exits in at most 10000ms without credentials, network, ambient tmux, Sparkta, or consumer state.
- A two-row controlled client-state matrix derives output from the requested `-F` format under explicit UTF-8 and non-UTF8 sanitizer facts, repeats each row once, and proves identical exact identity and cleanup results.
- Two overlapping probes use distinct foreground servers, sockets, helper lineages, and workspaces and prove every owned resource absent independently.

## Rationale

Doctor spans command, Git, filesystem, authentication, compatibility, state, process lifecycle, rendering, and test boundaries. A closed ordered result contract prevents drift and preserves the official delivery-agent readiness gate. The existing `command.tmux` ID can truthfully own both discovery and functional behavior. A private foreground server provides exact process ownership, while original-byte parsing and value-free evidence prove the same identity contract Runner consumes without exposing probe values.

## Usage Examples

```
soft-factory doctor
soft-factory doctor --json

{"schemaVersion":2,"ready":false,"repository":{"github":null,"defaultBranch":null},"checks":[{"id":"command.tmux","status":"failed","blocking":true,"message":"The isolated tmux probe returned malformed creation identity evidence.","remediation":"Repair the local tmux installation and rerun Doctor.","evidence":{"schemaVersion":1,"kind":"tmux-functional-probe","operation":"window-create","reason":"malformed-output","exitCode":0,"timedOut":false,"stdoutByteCount":8,"stderrByteCount":0,"stdoutTruncated":false,"stderrTruncated":false,"identityDiagnostic":{"schemaVersion":1,"phase":"create","exitCode":0,"stdoutByteCount":8,"stderrByteCount":0,"recordCount":1,"recordsTruncated":false,"records":[{"fieldCount":3,"truncated":false}],"signature":["window_id","vertical_bar","pane_id","vertical_bar","other"],"signatureTruncated":false},"cleanup":{"server":"absent","paneProcesses":"absent","socket":"absent","workspace":"absent"}}}]}
```

## Integration Guidelines

- Keep check policy and dependency completion in the pure Doctor service; keep private tmux lifecycle and cleanup in a dedicated probe adapter.
- Share the tmux identity byte parser and value-free diagnostic builder without routing the Doctor probe through the default-server `LiveTmuxPort`.
- Start the functional tmux probe after executable discovery and coordinate it with other safe independent Doctor observations under the same absolute deadline.
- Keep all tmux client construction in one private-socket helper so tests can assert that every call carries `-S`.
- Reuse strict configuration and state parsers while adding non-mutating inventory entry points.
- Centralize ordered checks, schema versions, evidence enums, and caps so renderers and fixtures cannot drift.
- Use injected protocol-aware fake executables and managed process/workspace ports; never add a production test switch or run an ambient/default tmux server.
- Derive fake output from the actual format argument and explicit client-state facts so fixtures cannot mask separator sanitization.
- Update ready/blocked/isolated manifests, README, PRD, docs index, Doctor operations/troubleshooting, schema migration text, help assertions, and documentation tests together.
- Validate with direct root `just verify-focused` and `just verify`; harness checks may add structured feedback but do not replace those boundaries.

## Exceptions

- The exclusively owned private tmux sandbox is the sole Doctor temporary resource allowed outside repository-contained ancestors. It exists only to keep the Unix socket short and isolated, and its complete cleanup is mandatory.

## Enforcement

- [x] Automated checks
- [x] Code review checklist
- [x] Test coverage requirements

## Related ADRs

- [ADR-260812-repository-doctor-readiness](../ADR/ADR-260812-repository-doctor-readiness.md)
- [ADR-260810-typescript-node-cli](../ADR/ADR-260810-typescript-node-cli.md)
- [ADR-260814-tmux-identity-failure-recovery](../ADR/ADR-260814-tmux-identity-failure-recovery.md)
