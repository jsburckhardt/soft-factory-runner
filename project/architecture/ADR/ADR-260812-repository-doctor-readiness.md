# ADR-260812-repository-doctor-readiness: Repository Doctor Readiness Architecture

## Status

Accepted

## Context

Issue #6 requires one repository-scoped Doctor command to report every PRD Section 19 prerequisite without fail-fast information loss. Existing run readiness discovers only the facts needed to start an explicit issue and uses longer, sequential bounds. The product originally had no Doctor result model, protocol authority, complete configuration paths, blocking table, or exit behavior. These choices must remain deterministic, safe around owned resources, and independent of issue selection and the ambient engineering harness.

Issue #29 shows that executable presence alone is not truthful tmux readiness. Runner requires a working server plus session, window, pane, exact creation identity, exact observation identity, and cleanup behavior. A Doctor probe must establish those facts without contacting the normal Runner server, inheriting ambient tmux configuration, retaining returned paths or identities, or allowing the aggregate deadline to return while probe resources remain active.

## Decision

Keep the exact ordered 24-check vocabulary defined in `CORE-COMPONENT-260812-repository-doctor-contract`. Strengthen the existing `command.tmux` check instead of adding a check ID: executable resolution is necessary but it passes only after one isolated functional probe succeeds and cleanup is proved. This preserves the official-asset Doctor vocabulary while making the existing dependency check mean that tmux can perform the preparation operations Runner actually needs.

Run the probe on one exclusively created mode-0700 directory under the physical operating-system temporary directory. Reject an unsafe, non-directory, or socket-path-too-long temporary parent before starting tmux. Create a mode-0600 empty configuration file and a mode-0600 Node helper in that directory, and derive unique socket, session, and window names from the same unguessable probe token. Start the discovered tmux executable as a directly managed foreground server with global arguments `-D -S <private-socket> -f <empty-config>`. Every client command uses that exact absolute executable and `-S <private-socket>`. Give the probe a private HOME, XDG configuration root, and TMPDIR; omit `TMUX`, `TMUX_PANE`, `TMUX_TMPDIR`, credentials, and unrelated inherited variables. The explicit socket and configuration prevent contact with the default server and prevent system or user configuration from defining the probe result.

After one event-driven bounded wait for the private socket, perform this one-pass functional sequence with no retry or polling:

1. Create a detached tokenized session and dashboard window rooted at the physical probe directory, running the private long-lived Node helper.
2. Prove the session with `has-session`, prove the exact dashboard name with `list-windows -F #{window_name}`, and read one positive dashboard pane PID for cleanup ownership.
3. Create one detached issue window with `new-window -P -F #{window_id}\t#{pane_id}`, rooted at the same directory and running the helper.
4. Parse creation stdout from original bytes under `CORE-COMPONENT-260814-tmux-identity-diagnostics`.
5. Enable `remain-on-exit` on the issue window and read one positive issue pane PID with `display-message -p -t <pane-id> #{pane_pid}` for cleanup ownership.
6. Observe the issue pane once with `list-panes -F #{window_id}\t#{pane_id}\t#{pane_current_path}` and the same session/window targeting used by Runner.
7. Parse observation stdout from original bytes, require its window and pane IDs to equal creation, and require its cwd to equal the physical probe directory.
8. Remove the exact issue window with `kill-window`; the unconditional cleanup still destroys the complete private server.

Treat each returned pane PID only as a locator. Before any fallback signal, observe and retain ephemeral compound process identity including PID, process group, start token, resolved executable, arguments, and cwd; PID alone never authorizes signaling. At cleanup, enumerate the union of recorded helpers and processes that exactly match the private helper script argument, physical workspace cwd, launch interval, and foreground-server lineage; this recovers helpers created before a PID result was accepted without matching by process name.

This is the minimum readiness sequence: it proves server startup, session lookup, window-name observation, issue-window creation, exact identity transport, pane targeting, pane process identity, cwd observation, remain-on-exit configuration, and exact window removal. Interactive attachment, terminal capture, and interrupted-run respawn are context-dependent control operations and remain covered by the normal injected tmux adapter tests rather than by repository readiness.

Extend the Doctor command result boundary to count bytes before decoding and retain at most 4096 original bytes per stdout and stderr stream while continuing to drain and count discarded bytes. Apply the same drain, count, and cap rules to the managed foreground server streams. Mark each stream truncation explicitly and reject a truncated functional result. Reuse the exact create and observe byte grammar, and keep all raw bytes, returned IDs, pane PIDs, paths, names, arguments, environment values, and helper output ephemeral.

Migrate emitted Doctor output to `DoctorResultV2`. Preserve the same repository facts, readiness conjunction, ordered IDs, statuses, blocking flags, messages, remediations, and exit behavior. A failed check may add versioned structured evidence. A functional tmux failure adds `DoctorTmuxProbeEvidenceV1` with only the failing operation and reason enums, exit and timeout facts, exact byte counts and truncation flags, an optional value-free `TmuxIdentityDiagnosticV1`, and cleanup states for server, pane processes, socket, and workspace. Human output renders the same safe evidence. Operations are exactly `workspace`, `server-start`, `socket-ready`, `session-create`, `session-query`, `window-list`, `dashboard-pane-identify`, `window-create`, `window-configure`, `issue-pane-identify`, `pane-observe`, `window-remove`, `server-stop`, `helper-stop`, `workspace-remove`, and `aggregate`. Reasons are exactly `unavailable`, `unsafe-workspace`, `filesystem-failed`, `launch-failed`, `socket-unavailable`, `nonzero-exit`, `timeout`, `cancelled`, `output-truncated`, `malformed-output`, `identity-mismatch`, `cwd-mismatch`, `process-identity-unknown`, `cleanup-failed`, `unexpected-resource`, and `aggregate-deadline`. Each cleanup state is `not-created`, `absent`, `present`, or `unknown`. No successful check needs evidence.

Keep each external tmux client command and each managed-process wait at or below 2 seconds. The Doctor service creates one absolute 9-second aggregate deadline and a 6.5-second operational cutoff, reserving the final 2.5 seconds for probe cleanup. At the cutoff it starts no further probe operation, cancels any active client, and enters cleanup. Use fixed cleanup milestones from Doctor start: private `kill-server` is cancelled by 7000ms; the post-request managed wait ends by 7250ms; concurrent exact SIGTERM waits end by 7750ms; concurrent exact SIGKILL waits end by 8250ms; recursive workspace removal and final process/socket/tree verification end by 9000ms. Skipped or early stages leave their time available, but no stage may pass its milestone. The service must await cleanup settlement before returning a normal, failed, or aggregate-timeout result; a detached evaluation promise may not outlive the report.

Own cleanup in one unconditional `finally` boundary. First request `kill-server` through the private socket. Then wait for the directly managed foreground server, escalate only that exact process from SIGTERM to SIGKILL when needed, and terminate only the still-matching recorded dashboard and issue helper process identities. Remove the exclusively owned temporary tree recursively only after process cleanup, then verify the server and helper identities, socket, and temporary tree are absent. Operation success never overrides cleanup uncertainty: any unproved residual resource fails `command.tmux` with actionable cleanup evidence. The same cleanup runs after startup failure, command failure, malformed bytes, identity mismatch, timeout, cancellation, and aggregate expiry.

Retain Runner protocol version 1. `.soft-factory/config.yml` must expose `protocol_version: 1`; unsupported or absent protocol data fails its dedicated check. The installed RPIV asset authority is `.github/agents/rpiv.agent.md`, whose frontmatter must declare `runner_protocol: 1` and `result_contract: agent-result-v1`. The RPIV-agent, Runner-protocol, and result-contract checks remain separate. Do not search fallback `.agents/` locations or infer compatibility from prose.

Keep repository path validation unchanged. `repository.worktree_root` and `repository.state_root` remain normalized repository-relative paths contained by the primary worktree, distinct from each other and from the Git common directory, and free of symlink escape or file collisions. Writability and required-path probes remain exclusive, tokenized, repository-contained, and reversible. The private tmux sandbox is an execution-isolation resource, not evidence that an arbitrary external path is safe for Runner state.

Inspect recognized snapshots, events, owner locks, slot leases, logs, and result-contract paths according to their existing versioned parsers. Ignore unrelated filenames, but fail malformed recognized records. Treat every numeric `.trees/<issue>` path or registered issue worktree without matching interpretable snapshot and lock ownership as a blocking conflict. READY still exits 0, NOT READY exits 3, and invalid Doctor syntax exits 2.

## Alternatives

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Add a twenty-fifth tmux functional check | Separates executable and functional status | Breaks the canonical vocabulary and official-asset contract | `command.tmux` can truthfully represent executable functional readiness |
| Keep executable-only `command.tmux` | No schema or fixture migration | Reports READY for a no-op or malformed executable | Contradicts the operational prerequisite in Issue #29 |
| Probe the default Runner tmux server | Reuses production targeting | Can inspect, alter, or kill ambient sessions and windows | Unknown and ambient resources are outside Doctor ownership |
| Start a daemonized alternate tmux server | Familiar tmux lifecycle | A timed-out client can leave an unowned daemon | Foreground `-D` gives Doctor one directly managed server process |
| Use only `-S` with ambient configuration | Isolates the socket | System or user tmux configuration can alter probe behavior | The empty `-f` configuration makes the probe deterministic |
| Parse decoded or unbounded command strings | Reuses current Doctor results | Loses exact byte proof and permits unbounded memory | Identity readiness requires capped original-byte parsing |
| Encode tmux detail only in message text | Avoids a schema migration | Machines cannot classify operation, reason, or cleanup proof reliably | Versioned structured evidence is required for actionable automation |
| Return at nine seconds and clean asynchronously | Preserves the current Promise race | Resources can survive a completed Doctor report | Aggregate timeout must coordinate and await owned cleanup |
| Probe every interactive and recovery tmux command | Broad coverage | Requires terminal interaction and expands timing and side effects | The selected sequence proves preparation readiness; adapter tests prove contextual control |

## Consequences

### Positive
- READY now proves the tmux preparation contract rather than only executable presence.
- The exact 24-ID vocabulary and ready-only delivery-agent gate remain stable.
- A foreground private server, socket, configuration, and helper make cleanup ownership explicit.
- Machines receive bounded value-free operation and cleanup evidence for tmux failures.

### Negative
- Doctor output consumers and tracked manifests must migrate from schema 1 to schema 2.
- Doctor gains managed-process, original-byte, temporary-workspace, and aggregate-cancellation seams.
- The functional sequence adds local process work and may expose broken tmux installations as NOT READY.

### Neutral
- Issue-run tmux targeting, 15-second runtime adapter bounds, identity grammar, and recovery authorization do not change.
- No Runner configuration field, run snapshot, network API, database, service, container, or deployment mechanism changes.
- The ambient `harness doctor` remains a separate development-surface diagnostic.

## Related Issues

- [#6](https://github.com/jsburckhardt/soft-factory-runner/issues/6)
- [#29](https://github.com/jsburckhardt/soft-factory-runner/issues/29)

## References

- [Soft Factory Runner PRD](../../../PRD.md)
- [TypeScript and Node.js CLI](ADR-260810-typescript-node-cli.md)
- [Prototype Three Recovery and Explicit Concurrency](ADR-260811-prototype-three-recovery-concurrency.md)
- [Tmux Identity Failure Recovery](ADR-260814-tmux-identity-failure-recovery.md)
- [Repository Doctor Contract](../core-components/CORE-COMPONENT-260812-repository-doctor-contract.md)
- [Tmux Identity Diagnostics](../core-components/CORE-COMPONENT-260814-tmux-identity-diagnostics.md)
- [tmux manual](https://man.openbsd.org/tmux.1)
