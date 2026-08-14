import path from "node:path";
import {
  DOCTOR_AGGREGATE_TIMEOUT_MS,
  DOCTOR_EXTERNAL_TIMEOUT_MS,
  DOCTOR_OPERATION_CUTOFF_MS,
  DOCTOR_TMUX_KILL_SERVER_MILESTONE_MS,
  DOCTOR_TMUX_POST_KILL_MILESTONE_MS,
  DOCTOR_TMUX_SIGKILL_MILESTONE_MS,
  DOCTOR_TMUX_SIGTERM_MILESTONE_MS,
  type DoctorTmuxCleanupStateV1,
  type DoctorTmuxProbeEvidenceV1,
  type DoctorTmuxProbeOperationV1,
  type DoctorTmuxProbeReasonV1,
} from "./doctor";
import type {
  DoctorCommandResult,
  DoctorCommandRunner,
  DoctorCommandSpec,
  DoctorObservation,
} from "./doctor-adapters";
import {
  parseTmuxIdentityResult,
  TmuxIdentityOutputError,
  type ParsedTmuxIdentityOutput,
  type TmuxIdentityCommandResult,
} from "./tmux-identity";

export interface DoctorClock {
  now(): number;
}

export interface DoctorProbeWorkspace {
  readonly root: string;
  readonly socketPath: string;
  readonly configPath: string;
  readonly helperPath: string;
  readonly homePath: string;
  readonly xdgPath: string;
  readonly tempPath: string;
  readonly sessionName: string;
  readonly dashboardName: string;
  readonly issueWindowName: string;
}

export interface DoctorProbeWorkspacePort {
  create(token: string): Promise<DoctorProbeWorkspace>;
  remove(workspace: DoctorProbeWorkspace): Promise<void>;
  workspaceExists(workspace: DoctorProbeWorkspace): Promise<boolean>;
  socketExists(workspace: DoctorProbeWorkspace): Promise<boolean>;
}

export interface DoctorProcessIdentity {
  readonly pid: number;
  readonly processGroupId: number;
  readonly startToken: string;
  readonly executable: string;
  readonly args: readonly string[];
  readonly cwd: string;
  readonly launchedAtMs: number;
}

export interface DoctorManagedProcessSpec {
  readonly executable: string;
  readonly args: readonly string[];
  readonly cwd: string;
  readonly environment: Readonly<Record<string, string>>;
  readonly shell: false;
}

export interface DoctorManagedProcessHandle {
  readonly identity: DoctorProcessIdentity;
  wait(timeoutMs: number): Promise<boolean>;
  signal(signal: "SIGTERM" | "SIGKILL"): Promise<boolean>;
  streamResult(): DoctorCommandResult;
}

export interface DoctorManagedProcessPort {
  start(
    spec: DoctorManagedProcessSpec,
    launchedAtMs: number,
  ): Promise<DoctorManagedProcessHandle>;
}

export interface DoctorHelperSearch {
  readonly helperPath: string;
  readonly cwd: string;
  readonly launchedAfterMs: number;
  readonly launchedBeforeMs: number;
  readonly server: DoctorProcessIdentity;
}

export interface DoctorProcessObservationPort {
  identify(
    pid: number,
    launchedAtMs: number,
  ): Promise<DoctorProcessIdentity | null>;
  observe(
    identity: DoctorProcessIdentity,
  ): Promise<DoctorProcessIdentity | null>;
  findHelpers(
    search: DoctorHelperSearch,
  ): Promise<readonly DoctorProcessIdentity[]>;
  isDescendant(
    identity: DoctorProcessIdentity,
    server: DoctorProcessIdentity,
  ): Promise<boolean>;
  signal(
    identity: DoctorProcessIdentity,
    signal: "SIGTERM" | "SIGKILL",
  ): Promise<boolean>;
  waitForExit(
    identity: DoctorProcessIdentity,
    timeoutMs: number,
  ): Promise<boolean>;
}

export interface DoctorSocketWaiterPort {
  waitForSocket(
    workspace: DoctorProbeWorkspace,
    timeoutMs: number,
  ): Promise<boolean>;
}

export class DoctorTmuxProbeError extends Error {
  public constructor(
    public readonly operation: DoctorTmuxProbeOperationV1,
    public readonly reason: DoctorTmuxProbeReasonV1,
  ) {
    super("Doctor tmux probe boundary failed.");
    this.name = "DoctorTmuxProbeError";
  }
}

export class DoctorTmuxWorkspaceError extends DoctorTmuxProbeError {
  public constructor(
    public readonly workspace: DoctorProbeWorkspace,
    reason: "filesystem-failed" | "unsafe-workspace",
    options?: ErrorOptions,
  ) {
    super("workspace", reason);
    this.name = "DoctorTmuxWorkspaceError";
    if (options?.cause !== undefined) this.cause = options.cause;
  }
}

export interface DoctorTmuxProbePort {
  run(input: {
    readonly tmuxExecutable: string;
    readonly token: string;
    readonly doctorStartedAtMs: number;
    readonly abortSignal?: AbortSignal;
  }): Promise<DoctorObservation<true>>;
}

interface ProbeFailure {
  readonly operation: DoctorTmuxProbeOperationV1;
  readonly reason: DoctorTmuxProbeReasonV1;
  readonly result: DoctorCommandResult;
  readonly identityDiagnostic: DoctorTmuxProbeEvidenceV1["identityDiagnostic"];
}

interface CleanupFacts {
  readonly server: DoctorTmuxCleanupStateV1;
  readonly paneProcesses: DoctorTmuxCleanupStateV1;
  readonly socket: DoctorTmuxCleanupStateV1;
  readonly workspace: DoctorTmuxCleanupStateV1;
}

const EMPTY_RESULT: DoctorCommandResult = {
  exitCode: null,
  signal: null,
  stdout: "",
  stderr: "",
  stdoutBuffer: Buffer.alloc(0),
  stderrBuffer: Buffer.alloc(0),
  stdoutByteCount: 0,
  stderrByteCount: 0,
  stdoutTruncated: false,
  stderrTruncated: false,
  timedOut: false,
  cancelled: false,
  launchError: null,
};

export class DoctorTmuxProbe implements DoctorTmuxProbePort {
  public constructor(
    private readonly dependencies: {
      readonly commands: DoctorCommandRunner;
      readonly workspaces: DoctorProbeWorkspacePort;
      readonly managedProcesses: DoctorManagedProcessPort;
      readonly processes: DoctorProcessObservationPort;
      readonly sockets: DoctorSocketWaiterPort;
      readonly clock: DoctorClock;
    },
  ) {}

  public async run(input: {
    readonly tmuxExecutable: string;
    readonly token: string;
    readonly doctorStartedAtMs: number;
  }): Promise<DoctorObservation<true>> {
    let workspace: DoctorProbeWorkspace | null = null;
    let server: DoctorManagedProcessHandle | null = null;
    let failure: ProbeFailure | null = null;
    let activeOperation: DoctorTmuxProbeOperationV1 = "workspace";
    let creation: ParsedTmuxIdentityOutput | null = null;
    const helpers: DoctorProcessIdentity[] = [];
    let dashboardHelperCreated = false;
    let issueHelperCreated = false;
    const launchStartedAtMs = this.dependencies.clock.now();
    let cleanupFacts: CleanupFacts = {
      server: "unknown",
      paneProcesses: "unknown",
      socket: "unknown",
      workspace: "unknown",
    };

    try {
      workspace = await this.dependencies.workspaces.create(input.token);
      activeOperation = "server-start";
      if (this.operationTimeout(input.doctorStartedAtMs) === 0) {
        failure = failed("aggregate", "aggregate-deadline");
      } else {
        server = await this.dependencies.managedProcesses.start(
          {
            executable: input.tmuxExecutable,
            args: [
              "-D",
              "-S",
              workspace.socketPath,
              "-f",
              workspace.configPath,
            ],
            cwd: workspace.root,
            environment: probeEnvironment(workspace),
            shell: false,
          },
          this.dependencies.clock.now(),
        );
        const initialServerStreams = server.streamResult();
        if (streamsTruncated(initialServerStreams))
          failure = failed(
            activeOperation,
            "output-truncated",
            initialServerStreams,
          );
      }

      if (failure === null) {
        activeOperation = "socket-ready";
        const timeoutMs = this.operationTimeout(input.doctorStartedAtMs);
        if (timeoutMs === 0)
          failure = failed("aggregate", "aggregate-deadline");
        else if (
          !(await this.dependencies.sockets.waitForSocket(workspace, timeoutMs))
        )
          failure = failed(activeOperation, "socket-unavailable", {
            ...EMPTY_RESULT,
            timedOut: true,
          });
      }

      if (failure === null) {
        activeOperation = "session-create";
        const result = await this.client(input, workspace, [
          "new-session",
          "-d",
          "-s",
          workspace.sessionName,
          "-n",
          workspace.dashboardName,
          "-c",
          workspace.root,
          process.execPath,
          workspace.helperPath,
        ]);
        failure = classifyCommand(activeOperation, result);
        dashboardHelperCreated = failure === null;
      }

      if (failure === null) {
        activeOperation = "session-query";
        failure = classifyCommand(
          activeOperation,
          await this.client(input, workspace, [
            "has-session",
            "-t",
            workspace.sessionName,
          ]),
        );
      }

      if (failure === null) {
        activeOperation = "window-list";
        const result = await this.client(input, workspace, [
          "list-windows",
          "-t",
          workspace.sessionName,
          "-F",
          "#{window_name}",
        ]);
        failure = classifyCommand(activeOperation, result);
        if (
          failure === null &&
          !exactSingleLine(result.stdoutBuffer, workspace.dashboardName)
        )
          failure = failed(activeOperation, "malformed-output", result);
      }

      if (failure === null) {
        activeOperation = "dashboard-pane-identify";
        const result = await this.client(input, workspace, [
          "display-message",
          "-p",
          "-t",
          workspace.sessionName + ":" + workspace.dashboardName + ".0",
          "#{pane_pid}",
        ]);
        failure = classifyCommand(activeOperation, result);
        const pid = failure === null ? positivePid(result.stdoutBuffer) : null;
        if (failure === null && pid === null)
          failure = failed(activeOperation, "malformed-output", result);
        if (failure === null && pid !== null) {
          const identity = await this.dependencies.processes.identify(
            pid,
            launchStartedAtMs,
          );
          if (
            identity === null ||
            !isExpectedHelper(identity, workspace) ||
            server === null ||
            !(await this.dependencies.processes.isDescendant(
              identity,
              server.identity,
            ))
          )
            failure = failed(
              activeOperation,
              "process-identity-unknown",
              result,
            );
          else helpers.push(identity);
        }
      }

      if (failure === null) {
        activeOperation = "window-create";
        const result = await this.client(input, workspace, [
          "new-window",
          "-d",
          "-P",
          "-F",
          "#{window_id}\t#{pane_id}",
          "-t",
          workspace.sessionName,
          "-n",
          workspace.issueWindowName,
          "-c",
          workspace.root,
          process.execPath,
          workspace.helperPath,
        ]);
        failure = classifyCommand(activeOperation, result);
        issueHelperCreated = failure === null;
        if (failure === null) {
          try {
            creation = parseTmuxIdentityResult(
              "create",
              completedIdentityResult(result),
            );
          } catch (cause: unknown) {
            if (!(cause instanceof TmuxIdentityOutputError)) throw cause;
            failure = failed(
              activeOperation,
              "malformed-output",
              result,
              cause.tmuxIdentityDiagnostic,
            );
          }
        }
      }

      if (failure === null && creation !== null) {
        activeOperation = "window-configure";
        failure = classifyCommand(
          activeOperation,
          await this.client(input, workspace, [
            "set-window-option",
            "-t",
            creation.windowId,
            "remain-on-exit",
            "on",
          ]),
        );
      }

      if (failure === null && creation !== null) {
        activeOperation = "issue-pane-identify";
        const result = await this.client(input, workspace, [
          "display-message",
          "-p",
          "-t",
          creation.paneId,
          "#{pane_pid}",
        ]);
        failure = classifyCommand(activeOperation, result);
        const pid = failure === null ? positivePid(result.stdoutBuffer) : null;
        if (failure === null && pid === null)
          failure = failed(activeOperation, "malformed-output", result);
        if (failure === null && pid !== null) {
          const identity = await this.dependencies.processes.identify(
            pid,
            launchStartedAtMs,
          );
          if (
            identity === null ||
            !isExpectedHelper(identity, workspace) ||
            server === null ||
            !(await this.dependencies.processes.isDescendant(
              identity,
              server.identity,
            ))
          )
            failure = failed(
              activeOperation,
              "process-identity-unknown",
              result,
            );
          else helpers.push(identity);
        }
      }

      if (failure === null && creation !== null) {
        activeOperation = "pane-observe";
        const result = await this.client(input, workspace, [
          "list-panes",
          "-t",
          `${workspace.sessionName}:${workspace.issueWindowName}`,
          "-F",
          "#{window_id}\t#{pane_id}\t#{pane_current_path}",
        ]);
        failure = classifyCommand(activeOperation, result);
        if (failure === null) {
          try {
            const observed = parseTmuxIdentityResult(
              "observe",
              completedIdentityResult(result),
            );
            if (
              observed.windowId !== creation.windowId ||
              observed.paneId !== creation.paneId
            )
              failure = failed(activeOperation, "identity-mismatch", result);
            else if (observed.cwd !== workspace.root)
              failure = failed(activeOperation, "cwd-mismatch", result);
          } catch (cause: unknown) {
            if (!(cause instanceof TmuxIdentityOutputError)) throw cause;
            failure = failed(
              activeOperation,
              "malformed-output",
              result,
              cause.tmuxIdentityDiagnostic,
            );
          }
        }
      }

      if (failure === null && creation !== null) {
        activeOperation = "window-remove";
        failure = classifyCommand(
          activeOperation,
          await this.client(input, workspace, [
            "kill-window",
            "-t",
            creation.windowId,
          ]),
        );
      }
    } catch (cause: unknown) {
      if (workspace === null && cause instanceof DoctorTmuxWorkspaceError)
        workspace = cause.workspace;
      failure ??=
        cause instanceof DoctorTmuxProbeError
          ? failed(cause.operation, cause.reason)
          : failed(
              activeOperation,
              activeOperation === "workspace"
                ? "filesystem-failed"
                : "launch-failed",
            );
    } finally {
      const cleanup = await this.cleanup({
        input,
        workspace,
        server,
        helpers,
        launchStartedAtMs,
        dashboardHelperCreated,
        issueHelperCreated,
      });
      const serverStreams = server?.streamResult() ?? EMPTY_RESULT;
      if (failure === null && streamsTruncated(serverStreams))
        failure = failed("server-start", "output-truncated", serverStreams);
      cleanupFacts = cleanup.facts;
      if (
        !cleanup.proved &&
        (failure === null || failure.operation !== cleanup.failureOperation)
      )
        failure = failed(cleanup.failureOperation, cleanup.failureReason);
    }

    return failure === null
      ? { ok: true, value: true, message: null, remediation: null }
      : failedObservation(evidence(failure, cleanupFacts));
  }

  private async client(
    input: {
      readonly tmuxExecutable: string;
      readonly doctorStartedAtMs: number;
      readonly abortSignal?: AbortSignal;
    },
    workspace: DoctorProbeWorkspace,
    args: readonly string[],
  ): Promise<DoctorCommandResult> {
    const timeoutMs = this.operationTimeout(input.doctorStartedAtMs);
    if (timeoutMs === 0) return { ...EMPTY_RESULT, cancelled: true };
    const spec: DoctorCommandSpec = {
      executable: input.tmuxExecutable,
      args: ["-S", workspace.socketPath, ...args],
      cwd: workspace.root,
      timeoutMs,
      shell: false,
      environment: probeEnvironment(workspace),
      abortSignal: input.abortSignal,
    };
    return this.dependencies.commands.run(spec);
  }

  private operationTimeout(startedAtMs: number): number {
    const remaining =
      startedAtMs + DOCTOR_OPERATION_CUTOFF_MS - this.dependencies.clock.now();
    return Math.max(0, Math.min(DOCTOR_EXTERNAL_TIMEOUT_MS, remaining));
  }

  private async cleanup(input: {
    readonly input: {
      readonly tmuxExecutable: string;
      readonly doctorStartedAtMs: number;
    };
    readonly workspace: DoctorProbeWorkspace | null;
    readonly server: DoctorManagedProcessHandle | null;
    readonly helpers: DoctorProcessIdentity[];
    readonly launchStartedAtMs: number;
    readonly dashboardHelperCreated: boolean;
    readonly issueHelperCreated: boolean;
  }): Promise<{
    readonly proved: boolean;
    readonly failureOperation: DoctorTmuxProbeOperationV1;
    readonly failureReason: DoctorTmuxProbeReasonV1;
    readonly facts: CleanupFacts;
  }> {
    const helpers = [...input.helpers];
    let cleanupOperation: DoctorTmuxProbeOperationV1 = "server-stop";
    let cleanupReason: DoctorTmuxProbeReasonV1 = "cleanup-failed";
    let cleanupFailed = false;

    if (input.workspace !== null && input.server !== null) {
      try {
        const candidates = await this.dependencies.processes.findHelpers({
          helperPath: input.workspace.helperPath,
          cwd: input.workspace.root,
          launchedAfterMs: input.launchStartedAtMs,
          launchedBeforeMs: this.dependencies.clock.now(),
          server: input.server.identity,
        });
        for (const candidate of candidates)
          if (!helpers.some((helper) => sameIdentity(helper, candidate)))
            helpers.push(candidate);
      } catch {
        cleanupFailed = true;
        cleanupOperation = "helper-stop";
        cleanupReason = "process-identity-unknown";
      }

      const killTimeout = remaining(
        input.input.doctorStartedAtMs,
        DOCTOR_TMUX_KILL_SERVER_MILESTONE_MS,
        this.dependencies.clock.now(),
      );
      if (killTimeout > 0) {
        const result = await this.dependencies.commands.run({
          executable: input.input.tmuxExecutable,
          args: ["-S", input.workspace.socketPath, "kill-server"],
          cwd: input.workspace.root,
          timeoutMs: Math.min(DOCTOR_EXTERNAL_TIMEOUT_MS, killTimeout),
          shell: false,
          environment: probeEnvironment(input.workspace),
        });
        if (classifyCommand("server-stop", result) !== null)
          cleanupFailed = true;
      } else cleanupFailed = true;

      await input.server.wait(
        Math.min(
          DOCTOR_EXTERNAL_TIMEOUT_MS,
          remaining(
            input.input.doctorStartedAtMs,
            DOCTOR_TMUX_POST_KILL_MILESTONE_MS,
            this.dependencies.clock.now(),
          ),
        ),
      );
    }

    const termTargets = await this.presentHelpers(helpers);
    const serverPresent =
      input.server !== null &&
      (await this.dependencies.processes.observe(input.server.identity)) !==
        null;
    if (serverPresent && !(await input.server.signal("SIGTERM"))) {
      cleanupFailed = true;
      cleanupOperation = "server-stop";
      cleanupReason = "cleanup-failed";
    }
    const termSignals = await Promise.all(
      termTargets.map((helper) =>
        this.dependencies.processes.signal(helper, "SIGTERM"),
      ),
    );
    if (termSignals.some((sent) => !sent)) {
      cleanupFailed = true;
      cleanupOperation = "helper-stop";
      cleanupReason = "cleanup-failed";
    }
    const termWait = Math.min(
      DOCTOR_EXTERNAL_TIMEOUT_MS,
      remaining(
        input.input.doctorStartedAtMs,
        DOCTOR_TMUX_SIGTERM_MILESTONE_MS,
        this.dependencies.clock.now(),
      ),
    );
    await Promise.all([
      ...(input.server === null ? [] : [input.server.wait(termWait)]),
      ...termTargets.map((helper) =>
        this.dependencies.processes.waitForExit(helper, termWait),
      ),
    ]);

    const killTargets = await this.presentHelpers(helpers);
    const serverStillPresent =
      input.server !== null &&
      (await this.dependencies.processes.observe(input.server.identity)) !==
        null;
    if (serverStillPresent && !(await input.server.signal("SIGKILL"))) {
      cleanupFailed = true;
      cleanupOperation = "server-stop";
      cleanupReason = "cleanup-failed";
    }
    const killSignals = await Promise.all(
      killTargets.map((helper) =>
        this.dependencies.processes.signal(helper, "SIGKILL"),
      ),
    );
    if (killSignals.some((sent) => !sent)) {
      cleanupFailed = true;
      cleanupOperation = "helper-stop";
      cleanupReason = "cleanup-failed";
    }
    const killWait = Math.min(
      DOCTOR_EXTERNAL_TIMEOUT_MS,
      remaining(
        input.input.doctorStartedAtMs,
        DOCTOR_TMUX_SIGKILL_MILESTONE_MS,
        this.dependencies.clock.now(),
      ),
    );
    await Promise.all([
      ...(input.server === null ? [] : [input.server.wait(killWait)]),
      ...killTargets.map((helper) =>
        this.dependencies.processes.waitForExit(helper, killWait),
      ),
    ]);

    if (input.workspace !== null) {
      try {
        await this.dependencies.workspaces.remove(input.workspace);
      } catch {
        cleanupFailed = true;
        cleanupOperation = "workspace-remove";
        cleanupReason = "cleanup-failed";
      }
    }

    const serverState = await processState(
      input.server?.identity ?? null,
      this.dependencies.processes,
    );
    const helperStates = await Promise.all(
      helpers.map((helper) =>
        processState(helper, this.dependencies.processes),
      ),
    );
    const paneProcessesState: DoctorTmuxCleanupStateV1 =
      !input.dashboardHelperCreated && !input.issueHelperCreated
        ? "not-created"
        : helperStates.some((state) => state === "present")
          ? "present"
          : helperStates.some((state) => state === "unknown")
            ? "unknown"
            : "absent";
    const socketState = await resourceState(
      input.workspace,
      input.server !== null,
      (workspace) => this.dependencies.workspaces.socketExists(workspace),
    );
    const workspaceState = await resourceState(
      input.workspace,
      input.workspace !== null,
      (workspace) => this.dependencies.workspaces.workspaceExists(workspace),
    );
    const facts: CleanupFacts = {
      server: input.server === null ? "not-created" : serverState,
      paneProcesses: paneProcessesState,
      socket: socketState,
      workspace: workspaceState,
    };
    const proved =
      !cleanupFailed &&
      (facts.server === "absent" || facts.server === "not-created") &&
      (facts.paneProcesses === "absent" ||
        facts.paneProcesses === "not-created") &&
      (facts.socket === "absent" || facts.socket === "not-created") &&
      (facts.workspace === "absent" || facts.workspace === "not-created") &&
      this.dependencies.clock.now() <=
        input.input.doctorStartedAtMs + DOCTOR_AGGREGATE_TIMEOUT_MS;
    if (!proved && !cleanupFailed) {
      cleanupOperation = "aggregate";
      cleanupReason =
        this.dependencies.clock.now() >
        input.input.doctorStartedAtMs + DOCTOR_AGGREGATE_TIMEOUT_MS
          ? "aggregate-deadline"
          : "unexpected-resource";
    }
    return {
      proved,
      failureOperation: cleanupOperation,
      failureReason: cleanupReason,
      facts,
    };
  }

  private async presentHelpers(
    helpers: readonly DoctorProcessIdentity[],
  ): Promise<readonly DoctorProcessIdentity[]> {
    const observations = await Promise.all(
      helpers.map(async (helper) => ({
        helper,
        observed: await this.dependencies.processes.observe(helper),
      })),
    );
    return observations
      .filter(
        (entry) =>
          entry.observed !== null && sameIdentity(entry.helper, entry.observed),
      )
      .map((entry) => entry.helper);
  }
}

function probeEnvironment(
  workspace: DoctorProbeWorkspace,
): Readonly<Record<string, string>> {
  return {
    HOME: workspace.homePath,
    XDG_CONFIG_HOME: workspace.xdgPath,
    TMPDIR: workspace.tempPath,
  };
}

function completedIdentityResult(
  result: DoctorCommandResult,
): TmuxIdentityCommandResult {
  if (result.exitCode === null)
    throw new Error("completed tmux command has no exit code");
  return {
    exitCode: result.exitCode,
    stdoutBuffer: result.stdoutBuffer,
    stderrBuffer: result.stderrBuffer,
    stdoutByteCount: result.stdoutByteCount,
    stderrByteCount: result.stderrByteCount,
  };
}

function classifyCommand(
  operation: DoctorTmuxProbeOperationV1,
  result: DoctorCommandResult,
): ProbeFailure | null {
  if (result.cancelled) return failed(operation, "cancelled", result);
  if (result.timedOut) return failed(operation, "timeout", result);
  if (result.stdoutTruncated || result.stderrTruncated)
    return failed(operation, "output-truncated", result);
  if (result.launchError !== null)
    return failed(operation, "launch-failed", result);
  if (result.exitCode !== 0) return failed(operation, "nonzero-exit", result);
  return null;
}

function failed(
  operation: DoctorTmuxProbeOperationV1,
  reason: DoctorTmuxProbeReasonV1,
  result: DoctorCommandResult = EMPTY_RESULT,
  identityDiagnostic: DoctorTmuxProbeEvidenceV1["identityDiagnostic"] = null,
): ProbeFailure {
  return { operation, reason, result, identityDiagnostic };
}

function evidence(
  failure: ProbeFailure,
  cleanup: CleanupFacts,
): DoctorTmuxProbeEvidenceV1 {
  return {
    schemaVersion: 1,
    kind: "tmux-functional-probe",
    operation: failure.operation,
    reason: failure.reason,
    exitCode: failure.result.exitCode,
    timedOut: failure.result.timedOut,
    stdoutByteCount: failure.result.stdoutByteCount,
    stderrByteCount: failure.result.stderrByteCount,
    stdoutTruncated: failure.result.stdoutTruncated,
    stderrTruncated: failure.result.stderrTruncated,
    identityDiagnostic: failure.identityDiagnostic,
    cleanup,
  };
}

function failedObservation(
  evidenceValue: DoctorTmuxProbeEvidenceV1,
): DoctorObservation<true> {
  return {
    ok: false,
    value: null,
    message:
      "The isolated tmux functional probe did not complete with proved cleanup.",
    remediation:
      "Repair the local tmux installation or private temporary-directory permissions, then rerun Doctor.",
    evidence: evidenceValue,
  };
}

function streamsTruncated(result: DoctorCommandResult): boolean {
  return result.stdoutTruncated || result.stderrTruncated;
}

function exactSingleLine(buffer: Buffer, expected: string): boolean {
  const expectedBuffer = Buffer.from(expected, "utf8");
  return (
    buffer.equals(expectedBuffer) ||
    buffer.equals(Buffer.concat([expectedBuffer, Buffer.from("\n")]))
  );
}

function positivePid(buffer: Buffer): number | null {
  const body = buffer.at(-1) === 0x0a ? buffer.subarray(0, -1) : buffer;
  if (body.byteLength === 0 || body.includes(0x0a) || body.includes(0x0d))
    return null;
  const text = body.toString("ascii");
  if (!/^[1-9]\d*$/.test(text)) return null;
  const pid = Number(text);
  return Number.isSafeInteger(pid) ? pid : null;
}

function isExpectedHelper(
  identity: DoctorProcessIdentity,
  workspace: DoctorProbeWorkspace,
): boolean {
  return (
    identity.cwd === workspace.root &&
    path.resolve(identity.executable) === path.resolve(process.execPath) &&
    identity.args.length === 1 &&
    identity.args[0] === workspace.helperPath
  );
}

function sameIdentity(
  left: DoctorProcessIdentity,
  right: DoctorProcessIdentity,
): boolean {
  return (
    left.pid === right.pid &&
    left.processGroupId === right.processGroupId &&
    left.startToken === right.startToken &&
    left.executable === right.executable &&
    left.cwd === right.cwd &&
    left.args.length === right.args.length &&
    left.args.every((arg, index) => arg === right.args[index])
  );
}

async function processState(
  identity: DoctorProcessIdentity | null,
  processes: DoctorProcessObservationPort,
): Promise<DoctorTmuxCleanupStateV1> {
  if (identity === null) return "not-created";
  try {
    const observed = await processes.observe(identity);
    return observed === null
      ? "absent"
      : sameIdentity(identity, observed)
        ? "present"
        : "unknown";
  } catch {
    return "unknown";
  }
}

async function resourceState(
  workspace: DoctorProbeWorkspace | null,
  created: boolean,
  observe: (workspace: DoctorProbeWorkspace) => Promise<boolean>,
): Promise<DoctorTmuxCleanupStateV1> {
  if (!created || workspace === null) return "not-created";
  try {
    return (await observe(workspace)) ? "present" : "absent";
  } catch {
    return "unknown";
  }
}

function remaining(
  startedAtMs: number,
  milestoneMs: number,
  nowMs: number,
): number {
  return Math.max(0, startedAtMs + milestoneMs - nowMs);
}
