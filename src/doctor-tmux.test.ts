import * as fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type {
  DoctorCommandResult,
  DoctorCommandRunner,
  DoctorCommandSpec,
} from "./doctor-adapters";
import {
  DoctorTmuxProbe,
  DoctorTmuxWorkspaceError,
  type DoctorClock,
  type DoctorManagedProcessHandle,
  type DoctorManagedProcessPort,
  type DoctorManagedProcessSpec,
  type DoctorProbeWorkspace,
  type DoctorProbeWorkspacePort,
  type DoctorProcessIdentity,
  type DoctorProcessObservationPort,
  type DoctorSocketWaiterPort,
} from "./doctor-tmux";
import { LiveDoctorProbeWorkspacePort } from "./doctor-tmux-live";

const SECRET = "SENSITIVE_DOCTOR_PROBE_VALUE";
const workspace: DoctorProbeWorkspace = {
  root: "/private/" + SECRET,
  socketPath: "/private/" + SECRET + "/tmux.sock",
  configPath: "/private/" + SECRET + "/tmux.conf",
  helperPath: "/private/" + SECRET + "/helper.js",
  homePath: "/private/" + SECRET + "/home",
  xdgPath: "/private/" + SECRET + "/xdg",
  tempPath: "/private/" + SECRET + "/tmp",
  sessionName: "session-" + SECRET,
  dashboardName: "dashboard-" + SECRET,
  issueWindowName: "issue-" + SECRET,
};

function result(
  input: {
    readonly stdout?: Buffer;
    readonly stderr?: Buffer;
    readonly exitCode?: number | null;
    readonly timedOut?: boolean;
    readonly cancelled?: boolean;
    readonly stdoutByteCount?: number;
  } = {},
): DoctorCommandResult {
  const stdout = input.stdout ?? Buffer.alloc(0);
  const stderr = input.stderr ?? Buffer.alloc(0);
  const stdoutByteCount = input.stdoutByteCount ?? stdout.byteLength;
  return {
    exitCode: input.exitCode === undefined ? 0 : input.exitCode,
    signal: null,
    stdout: stdout.toString("utf8"),
    stderr: stderr.toString("utf8"),
    stdoutBuffer: stdout.subarray(0, 4096),
    stderrBuffer: stderr.subarray(0, 4096),
    stdoutByteCount,
    stderrByteCount: stderr.byteLength,
    stdoutTruncated: stdoutByteCount > 4096,
    stderrTruncated: stderr.byteLength > 4096,
    timedOut: input.timedOut ?? false,
    cancelled: input.cancelled ?? false,
    launchError: null,
  };
}

function identity(pid: number): DoctorProcessIdentity {
  return {
    pid,
    processGroupId: pid,
    startToken: String(pid * 10),
    executable: process.execPath,
    args: [workspace.helperPath],
    cwd: workspace.root,
    launchedAtMs: 0,
  };
}

class FakeWorkspace implements DoctorProbeWorkspacePort {
  public created = false;
  public removed = false;
  public socket = false;
  public retainWorkspace = false;
  public retainSocket = false;
  public failCreate = false;
  public failAfterCreate = false;
  public async create(): Promise<DoctorProbeWorkspace> {
    if (this.failCreate) throw new Error("controlled workspace failure");
    this.created = true;
    if (this.failAfterCreate)
      throw new DoctorTmuxWorkspaceError(workspace, "filesystem-failed");
    return workspace;
  }
  public async remove(): Promise<void> {
    if (!this.retainWorkspace) this.removed = true;
    if (!this.retainSocket) this.socket = false;
  }
  public async workspaceExists(): Promise<boolean> {
    return this.created && (!this.removed || this.retainWorkspace);
  }
  public async socketExists(): Promise<boolean> {
    return this.socket;
  }
}

class FakeProcesses implements DoctorProcessObservationPort {
  public readonly alive = new Map<number, DoctorProcessIdentity>();
  public readonly signals: Array<{ pid: number; signal: string }> = [];
  public lineage = true;
  public failNextTerm = false;
  public readonly waitTimeouts: number[] = [];
  public identify(pid: number): Promise<DoctorProcessIdentity | null> {
    return Promise.resolve(this.alive.get(pid) ?? null);
  }
  public observe(
    expected: DoctorProcessIdentity,
  ): Promise<DoctorProcessIdentity | null> {
    return Promise.resolve(this.alive.get(expected.pid) ?? null);
  }
  public findHelpers(): Promise<readonly DoctorProcessIdentity[]> {
    return Promise.resolve(
      [...this.alive.values()].filter((entry) => entry.pid !== 500),
    );
  }
  public isDescendant(): Promise<boolean> {
    return Promise.resolve(this.lineage);
  }
  public signal(
    expected: DoctorProcessIdentity,
    signal: "SIGTERM" | "SIGKILL",
  ): Promise<boolean> {
    if (!this.alive.has(expected.pid)) return Promise.resolve(false);
    if (signal === "SIGTERM" && this.failNextTerm) {
      this.failNextTerm = false;
      return Promise.resolve(false);
    }
    this.signals.push({ pid: expected.pid, signal });
    this.alive.delete(expected.pid);
    return Promise.resolve(true);
  }
  public waitForExit(
    expected: DoctorProcessIdentity,
    timeoutMs: number,
  ): Promise<boolean> {
    this.waitTimeouts.push(timeoutMs);
    return Promise.resolve(!this.alive.has(expected.pid));
  }
}

class FakeManagedHandle implements DoctorManagedProcessHandle {
  public readonly waitTimeouts: number[] = [];
  public readonly identity = {
    ...identity(500),
    executable: "/tools/tmux",
    args: ["-D", "-S", workspace.socketPath, "-f", workspace.configPath],
  };
  public constructor(
    private readonly processes: FakeProcesses,
    private readonly streams: DoctorCommandResult = result(),
  ) {
    processes.alive.set(this.identity.pid, this.identity);
  }
  public wait(timeoutMs: number): Promise<boolean> {
    this.waitTimeouts.push(timeoutMs);
    return Promise.resolve(!this.processes.alive.has(this.identity.pid));
  }
  public signal(signal: "SIGTERM" | "SIGKILL"): Promise<boolean> {
    return this.processes.signal(this.identity, signal);
  }
  public streamResult(): DoctorCommandResult {
    return this.streams;
  }
}

class FakeManaged implements DoctorManagedProcessPort {
  public spec: DoctorManagedProcessSpec | null = null;
  public handle: FakeManagedHandle | null = null;
  public failStart = false;
  public advanceClockTo: number | null = null;
  public constructor(
    private readonly processes: FakeProcesses,
    private readonly workspaces: FakeWorkspace,
    private readonly streams: DoctorCommandResult = result(),
    private readonly clock?: MutableClock,
  ) {}
  public async start(
    spec: DoctorManagedProcessSpec,
  ): Promise<DoctorManagedProcessHandle> {
    this.spec = spec;
    if (this.advanceClockTo !== null && this.clock !== undefined)
      this.clock.value = this.advanceClockTo;
    if (this.failStart) throw new Error("controlled launch failure");
    this.workspaces.socket = true;
    this.handle = new FakeManagedHandle(this.processes, this.streams);
    return this.handle;
  }
}

type Fault =
  | "session-create"
  | "session-query"
  | "window-list"
  | "dashboard-pane-identify"
  | "window-create"
  | "window-configure"
  | "issue-pane-identify"
  | "pane-observe"
  | "window-remove"
  | "server-stop";

class ProtocolRunner implements DoctorCommandRunner {
  public readonly calls: DoctorCommandSpec[] = [];
  public fault: Fault | null = null;
  public faultMode: "nonzero" | "timeout" | "overflow" | "malformed" =
    "nonzero";
  public observeMismatch = false;
  public cwdMismatch = false;
  public leaveHelpersOnStop = false;
  public cutoffAt: Fault | null = null;

  public constructor(
    private readonly processes: FakeProcesses,
    private readonly workspaces: FakeWorkspace,
    private readonly clock?: MutableClock,
  ) {}

  public async run(spec: DoctorCommandSpec): Promise<DoctorCommandResult> {
    this.calls.push(spec);
    const operation = operationFor(spec.args);
    if (operation === this.cutoffAt && this.clock !== undefined) {
      this.clock.value = 6500;
      return result({ exitCode: null, cancelled: true });
    }
    if (operation === this.fault) {
      if (this.faultMode === "timeout")
        return result({ exitCode: null, timedOut: true });
      if (this.faultMode === "overflow")
        return result({
          stdout: Buffer.alloc(4096, 97),
          stdoutByteCount: 4097,
        });
      if (this.faultMode === "malformed")
        return result({ stdout: Buffer.from("bad\n") });
      return result({ exitCode: 1 });
    }
    if (operation === "session-create")
      this.processes.alive.set(101, identity(101));
    if (operation === "dashboard-pane-identify")
      return result({ stdout: Buffer.from("101\n") });
    if (operation === "window-list")
      return result({ stdout: Buffer.from(workspace.dashboardName + "\n") });
    if (operation === "window-create") {
      this.processes.alive.set(102, identity(102));
      return result({ stdout: Buffer.from("@1\t%1\n") });
    }
    if (operation === "issue-pane-identify")
      return result({ stdout: Buffer.from("102\n") });
    if (operation === "pane-observe") {
      const ids = this.observeMismatch ? "@2\t%2\t" : "@1\t%1\t";
      const cwd = this.cwdMismatch ? "/other" : workspace.root;
      return result({ stdout: Buffer.from(ids + cwd + "\n") });
    }
    if (operation === "window-remove") this.processes.alive.delete(102);
    if (operation === "server-stop") {
      if (this.leaveHelpersOnStop) this.processes.alive.delete(500);
      else this.processes.alive.clear();
      this.workspaces.socket = false;
    }
    return result();
  }
}

class FakeSocketWaiter implements DoctorSocketWaiterPort {
  public ready = true;
  public waitForSocket(): Promise<boolean> {
    return Promise.resolve(this.ready);
  }
}

class MutableClock implements DoctorClock {
  public value = 0;
  public now(): number {
    return this.value;
  }
}

function fixture(serverStreams: DoctorCommandResult = result()): {
  probe: DoctorTmuxProbe;
  runner: ProtocolRunner;
  workspaces: FakeWorkspace;
  processes: FakeProcesses;
  managed: FakeManaged;
  sockets: FakeSocketWaiter;
  clock: MutableClock;
} {
  const workspaces = new FakeWorkspace();
  const processes = new FakeProcesses();
  const clock = new MutableClock();
  const runner = new ProtocolRunner(processes, workspaces, clock);
  const managed = new FakeManaged(processes, workspaces, serverStreams, clock);
  const sockets = new FakeSocketWaiter();
  return {
    probe: new DoctorTmuxProbe({
      commands: runner,
      workspaces,
      managedProcesses: managed,
      processes,
      sockets,
      clock,
    }),
    runner,
    workspaces,
    processes,
    managed,
    sockets,
    clock,
  };
}

function operationFor(args: readonly string[]): Fault {
  const command = args[0] === "-S" ? args[2] : args[0];
  if (command === "new-session") return "session-create";
  if (command === "has-session") return "session-query";
  if (command === "list-windows") return "window-list";
  if (command === "new-window") return "window-create";
  if (command === "set-window-option") return "window-configure";
  if (command === "list-panes") return "pane-observe";
  if (command === "kill-window") return "window-remove";
  if (command === "kill-server") return "server-stop";
  if (command === "display-message")
    return args.includes("%1")
      ? "issue-pane-identify"
      : "dashboard-pane-identify";
  throw new Error("unexpected controlled tmux command");
}

async function run(probe: DoctorTmuxProbe) {
  return probe.run({
    tmuxExecutable: "/tools/tmux",
    token: "private-token",
    doctorStartedAtMs: 0,
  });
}

describe("V-11/V-12 isolated Doctor tmux probe", () => {
  it("creates the private workspace with exact modes and removes every file", async () => {
    const port = new LiveDoctorProbeWorkspacePort();
    const created = await port.create("controlled-token");
    expect(path.dirname(created.root)).toBe(await fs.realpath(os.tmpdir()));
    expect((await fs.lstat(created.root)).mode & 0o777).toBe(0o700);
    expect((await fs.lstat(created.configPath)).mode & 0o777).toBe(0o600);
    expect((await fs.lstat(created.helperPath)).mode & 0o777).toBe(0o600);
    expect(await fs.readFile(created.configPath)).toHaveLength(0);
    await port.remove(created);
    expect(await port.workspaceExists(created)).toBe(false);
  });

  it("runs the exact private foreground protocol once and proves complete cleanup", async () => {
    const f = fixture();
    const observed = await run(f.probe);
    expect(observed).toEqual({
      ok: true,
      value: true,
      message: null,
      remediation: null,
    });
    expect(f.managed.spec).toEqual({
      executable: "/tools/tmux",
      args: ["-D", "-S", workspace.socketPath, "-f", workspace.configPath],
      cwd: workspace.root,
      environment: {
        HOME: workspace.homePath,
        XDG_CONFIG_HOME: workspace.xdgPath,
        TMPDIR: workspace.tempPath,
      },
      shell: false,
    });
    expect(f.runner.calls.map((call) => operationFor(call.args))).toEqual([
      "session-create",
      "session-query",
      "window-list",
      "dashboard-pane-identify",
      "window-create",
      "window-configure",
      "issue-pane-identify",
      "pane-observe",
      "window-remove",
      "server-stop",
    ]);
    expect(
      f.runner.calls.every(
        (call) =>
          call.args[0] === "-S" && call.args[1] === workspace.socketPath,
      ),
    ).toBe(true);
    const issuePaneIdentifyCalls = f.runner.calls.filter(
      (call) => operationFor(call.args) === "issue-pane-identify",
    );
    expect(issuePaneIdentifyCalls).toEqual([
      {
        executable: "/tools/tmux",
        args: [
          "-S",
          workspace.socketPath,
          "display-message",
          "-p",
          "-t",
          "%1",
          "#{pane_pid}",
        ],
        cwd: workspace.root,
        timeoutMs: 2000,
        shell: false,
        environment: {
          HOME: workspace.homePath,
          XDG_CONFIG_HOME: workspace.xdgPath,
          TMPDIR: workspace.tempPath,
        },
        abortSignal: undefined,
      },
    ]);
    const paneObserveCalls = f.runner.calls.filter(
      (call) => operationFor(call.args) === "pane-observe",
    );
    expect(paneObserveCalls).toEqual([
      {
        executable: "/tools/tmux",
        args: [
          "-S",
          workspace.socketPath,
          "list-panes",
          "-t",
          `${workspace.sessionName}:${workspace.issueWindowName}`,
          "-F",
          "#{window_id}\t#{pane_id}\t#{pane_current_path}",
        ],
        cwd: workspace.root,
        timeoutMs: 2000,
        shell: false,
        environment: {
          HOME: workspace.homePath,
          XDG_CONFIG_HOME: workspace.xdgPath,
          TMPDIR: workspace.tempPath,
        },
        abortSignal: undefined,
      },
    ]);
    expect(paneObserveCalls[0]?.args).not.toContain("%1");
    expect(
      f.runner.calls.every(
        (call) => call.timeoutMs <= 2000 && call.shell === false,
      ),
    ).toBe(true);
    expect(
      f.managed.handle?.waitTimeouts.every((timeout) => timeout <= 2000),
    ).toBe(true);
    expect(f.processes.waitTimeouts.every((timeout) => timeout <= 2000)).toBe(
      true,
    );
    expect(f.processes.alive.size).toBe(0);
    expect(await f.workspaces.workspaceExists(workspace)).toBe(false);
    expect(JSON.stringify(observed)).not.toContain(SECRET);
  });
});

describe("V-13 Doctor tmux failure and confidentiality matrix", () => {
  it("cancels after managed server startup reaches the cutoff and then cleans up", async () => {
    const f = fixture();
    f.managed.advanceClockTo = 6500;
    const observed = await run(f.probe);
    expect(observed.evidence).toMatchObject({
      operation: "aggregate",
      reason: "aggregate-deadline",
    });
    expect(f.runner.calls.map((call) => operationFor(call.args))).toEqual([
      "server-stop",
    ]);
    expect(f.processes.alive.size).toBe(0);
    expect(await f.workspaces.workspaceExists(workspace)).toBe(false);
  });

  it.each([
    "session-create",
    "session-query",
    "window-list",
    "dashboard-pane-identify",
    "window-create",
    "window-configure",
    "issue-pane-identify",
    "pane-observe",
    "window-remove",
  ] as const)(
    "fails %s once, schedules only cleanup afterward, and leaves no resource",
    async (operation) => {
      const f = fixture();
      f.runner.fault = operation;
      const observed = await run(f.probe);
      expect(observed.ok).toBe(false);
      expect(observed.evidence).toMatchObject({
        operation,
        reason: "nonzero-exit",
      });
      expect(
        f.runner.calls.filter((call) => operationFor(call.args) === operation),
      ).toHaveLength(1);
      expect(operationFor(f.runner.calls.at(-1)?.args ?? [])).toBe(
        "server-stop",
      );
      expect(f.processes.alive.size).toBe(0);
      expect(await f.workspaces.workspaceExists(workspace)).toBe(false);
      expect(JSON.stringify(observed)).not.toContain(SECRET);
    },
  );

  it.each([
    ["window-create", "malformed"],
    ["pane-observe", "malformed"],
    ["window-create", "overflow"],
    ["pane-observe", "timeout"],
  ] as const)(
    "classifies %s %s with bounded evidence and no raw values",
    async (operation, mode) => {
      const f = fixture();
      f.runner.fault = operation;
      f.runner.faultMode = mode;
      const observed = await run(f.probe);
      expect(observed.ok).toBe(false);
      expect(observed.evidence?.operation).toBe(operation);
      expect(observed.evidence?.reason).toBe(
        mode === "malformed"
          ? "malformed-output"
          : mode === "overflow"
            ? "output-truncated"
            : "timeout",
      );
      if (mode === "malformed")
        expect(observed.evidence?.identityDiagnostic).not.toBeNull();
      expect(JSON.stringify(observed)).not.toContain(SECRET);
      expect(f.processes.alive.size).toBe(0);
    },
  );

  it("classifies workspace, server launch, socket, and helper-lineage boundaries safely", async () => {
    const workspaceFailure = fixture();
    workspaceFailure.workspaces.failCreate = true;
    expect((await run(workspaceFailure.probe)).evidence).toMatchObject({
      operation: "workspace",
      reason: "filesystem-failed",
      cleanup: { workspace: "not-created" },
    });

    const partialWorkspaceFailure = fixture();
    partialWorkspaceFailure.workspaces.failAfterCreate = true;
    expect((await run(partialWorkspaceFailure.probe)).evidence).toMatchObject({
      operation: "workspace",
      reason: "filesystem-failed",
      cleanup: { workspace: "absent" },
    });

    const launchFailure = fixture();
    launchFailure.managed.failStart = true;
    expect((await run(launchFailure.probe)).evidence).toMatchObject({
      operation: "server-start",
      reason: "launch-failed",
      cleanup: { workspace: "absent" },
    });

    const socketFailure = fixture();
    socketFailure.sockets.ready = false;
    expect((await run(socketFailure.probe)).evidence).toMatchObject({
      operation: "socket-ready",
      reason: "socket-unavailable",
    });

    const lineageFailure = fixture();
    lineageFailure.processes.lineage = false;
    expect((await run(lineageFailure.probe)).evidence).toMatchObject({
      operation: "dashboard-pane-identify",
      reason: "process-identity-unknown",
    });
  });

  it("rejects identity and cwd mismatches independently", async () => {
    for (const reason of ["identity-mismatch", "cwd-mismatch"] as const) {
      const f = fixture();
      f.runner.observeMismatch = reason === "identity-mismatch";
      f.runner.cwdMismatch = reason === "cwd-mismatch";
      const observed = await run(f.probe);
      expect(observed.evidence).toMatchObject({
        operation: "pane-observe",
        reason,
      });
      expect(f.processes.alive.size).toBe(0);
    }
  });

  it("lets cleanup failure override functional success and uses exact identity signals", async () => {
    const f = fixture();
    f.runner.fault = "server-stop";
    const observed = await run(f.probe);
    expect(observed.evidence).toMatchObject({
      operation: "server-stop",
      reason: "cleanup-failed",
    });
    expect(
      f.processes.signals.every(
        (entry) => entry.pid === 500 || entry.pid === 101,
      ),
    ).toBe(true);
    expect(f.processes.alive.size).toBe(0);
    expect(JSON.stringify(observed)).not.toContain(SECRET);
  });

  it("records helper-stop cleanup failure while SIGKILL still proves final absence", async () => {
    const f = fixture();
    f.runner.leaveHelpersOnStop = true;
    f.processes.failNextTerm = true;
    const observed = await run(f.probe);
    expect(observed.evidence).toMatchObject({
      operation: "helper-stop",
      reason: "cleanup-failed",
    });
    expect(f.processes.alive.size).toBe(0);
    expect(
      f.processes.signals.some((entry) => entry.signal === "SIGKILL"),
    ).toBe(true);
  });

  it("rejects managed-server stream overflow even after the functional sequence succeeds", async () => {
    const f = fixture(
      result({ stdout: Buffer.alloc(4096), stdoutByteCount: 4097 }),
    );
    const observed = await run(f.probe);
    expect(observed.evidence).toMatchObject({
      operation: "server-start",
      reason: "output-truncated",
      stdoutByteCount: 4097,
    });
    expect(f.processes.alive.size).toBe(0);
  });
});

describe("V-14 Doctor tmux aggregate cutoff and awaited cleanup", () => {
  it("starts no functional operation at 6500ms and settles cleanup before returning", async () => {
    const f = fixture();
    f.clock.value = 6500;
    const observed = await run(f.probe);
    expect(observed.evidence).toMatchObject({
      operation: "aggregate",
      reason: "aggregate-deadline",
    });
    expect(f.managed.spec).toBeNull();
    expect(f.runner.calls).toHaveLength(0);
    expect(f.processes.alive.size).toBe(0);
    expect(await f.workspaces.workspaceExists(workspace)).toBe(false);
  });

  it("cancels after managed server startup reaches the cutoff and then cleans up", async () => {
    const f = fixture();
    f.managed.advanceClockTo = 6500;
    const observed = await run(f.probe);
    expect(observed.evidence).toMatchObject({
      operation: "aggregate",
      reason: "aggregate-deadline",
    });
    expect(f.runner.calls.map((call) => operationFor(call.args))).toEqual([
      "server-stop",
    ]);
    expect(f.processes.alive.size).toBe(0);
    expect(await f.workspaces.workspaceExists(workspace)).toBe(false);
  });

  it.each([
    "session-create",
    "session-query",
    "window-list",
    "dashboard-pane-identify",
    "window-create",
    "window-configure",
    "issue-pane-identify",
    "pane-observe",
    "window-remove",
  ] as const)(
    "cancels %s at the operation cutoff and awaits cleanup",
    async (operation) => {
      const f = fixture();
      f.runner.cutoffAt = operation;
      const observed = await run(f.probe);
      expect(observed.evidence).toMatchObject({
        operation,
        reason: "cancelled",
      });
      expect(operationFor(f.runner.calls.at(-1)?.args ?? [])).toBe(
        "server-stop",
      );
      expect(f.processes.alive.size).toBe(0);
      expect(await f.workspaces.workspaceExists(workspace)).toBe(false);
      expect(
        f.managed.handle?.waitTimeouts.every((timeout) => timeout <= 2000),
      ).toBe(true);
    },
  );

  it("fails final absence proof when a controlled workspace remains present", async () => {
    const f = fixture();
    f.workspaces.retainWorkspace = true;
    const observed = await run(f.probe);
    expect(observed.evidence).toMatchObject({
      operation: "aggregate",
      reason: "unexpected-resource",
    });
    expect(observed.evidence?.cleanup.workspace).toBe("present");
  });
});
