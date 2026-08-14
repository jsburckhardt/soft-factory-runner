/* istanbul ignore file -- live Doctor tmux lifecycle is exercised through protocol-aware controlled executables */
import { spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import { realpathSync, watch, type FSWatcher } from "node:fs";
import * as fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  DoctorStreamCapture,
  LiveDoctorCommandRunner,
  redact,
  type DoctorCommandResult,
  type DoctorCommandRunner,
} from "./doctor-adapters";
import {
  DoctorTmuxProbe,
  DoctorTmuxProbeError,
  DoctorTmuxWorkspaceError,
  type DoctorClock,
  type DoctorHelperSearch,
  type DoctorManagedProcessHandle,
  type DoctorManagedProcessPort,
  type DoctorManagedProcessSpec,
  type DoctorProbeWorkspace,
  type DoctorProbeWorkspacePort,
  type DoctorProcessIdentity,
  type DoctorProcessObservationPort,
  type DoctorSocketWaiterPort,
  type DoctorTmuxProbePort,
} from "./doctor-tmux";

const MAX_PRIVATE_SOCKET_BYTES = 100;
const MAX_DOCTOR_DESCENDANTS = 64;
const MAX_DOCTOR_DESCENDANT_DEPTH = 8;
const HELPER_SOURCE = "setInterval(() => {}, 2147483647);\n";

export class LiveDoctorProbeWorkspacePort implements DoctorProbeWorkspacePort {
  private readonly ownedRoots = new Set<string>();

  public async create(token: string): Promise<DoctorProbeWorkspace> {
    const parent = await fs.realpath(os.tmpdir());
    const parentStat = await fs.lstat(parent);
    if (!parentStat.isDirectory())
      throw new DoctorTmuxProbeError("workspace", "unsafe-workspace");
    const estimatedSocket = path.join(
      parent,
      "soft-factory-doctor-XXXXXX",
      "tmux.sock",
    );
    if (Buffer.byteLength(estimatedSocket) > MAX_PRIVATE_SOCKET_BYTES)
      throw new DoctorTmuxProbeError("workspace", "unsafe-workspace");
    const safeToken = token.replace(/[^A-Za-z0-9]/g, "").slice(0, 24);
    if (safeToken === "")
      throw new DoctorTmuxProbeError("workspace", "unsafe-workspace");
    let workspace: DoctorProbeWorkspace | null = null;
    try {
      const root = await fs.mkdtemp(path.join(parent, "soft-factory-doctor-"));
      workspace = privateWorkspace(root, safeToken);
      this.ownedRoots.add(root);
      await fs.chmod(root, 0o700);
      const physicalRoot = await fs.realpath(root);
      if (physicalRoot !== root || path.dirname(physicalRoot) !== parent)
        throw new DoctorTmuxProbeError("workspace", "unsafe-workspace");
      await Promise.all([
        fs.mkdir(workspace.homePath, { mode: 0o700 }),
        fs.mkdir(workspace.xdgPath, { mode: 0o700 }),
        fs.mkdir(workspace.tempPath, { mode: 0o700 }),
      ]);
      await fs.writeFile(workspace.configPath, Buffer.alloc(0), {
        flag: "wx",
        mode: 0o600,
      });
      await fs.writeFile(workspace.helperPath, HELPER_SOURCE, {
        flag: "wx",
        mode: 0o600,
      });
      const [rootMode, configMode, helperMode] = await Promise.all([
        fs.lstat(workspace.root),
        fs.lstat(workspace.configPath),
        fs.lstat(workspace.helperPath),
      ]);
      if (
        (rootMode.mode & 0o777) !== 0o700 ||
        (configMode.mode & 0o777) !== 0o600 ||
        (helperMode.mode & 0o777) !== 0o600
      )
        throw new DoctorTmuxProbeError("workspace", "unsafe-workspace");
      return workspace;
    } catch (cause: unknown) {
      if (workspace === null) throw cause;
      const reason =
        cause instanceof DoctorTmuxProbeError &&
        cause.reason === "unsafe-workspace"
          ? "unsafe-workspace"
          : "filesystem-failed";
      throw new DoctorTmuxWorkspaceError(workspace, reason, { cause });
    }
  }

  public async remove(workspace: DoctorProbeWorkspace): Promise<void> {
    if (!this.ownedRoots.has(workspace.root))
      throw new Error("refusing to remove an unowned Doctor workspace");
    await fs.rm(workspace.root, { recursive: true, force: true });
    this.ownedRoots.delete(workspace.root);
  }

  public async workspaceExists(
    workspace: DoctorProbeWorkspace,
  ): Promise<boolean> {
    return exists(workspace.root);
  }

  public async socketExists(workspace: DoctorProbeWorkspace): Promise<boolean> {
    return exists(workspace.socketPath);
  }
}

function privateWorkspace(
  root: string,
  safeToken: string,
): DoctorProbeWorkspace {
  return {
    root,
    socketPath: path.join(root, "tmux.sock"),
    configPath: path.join(root, "tmux.conf"),
    helperPath: path.join(root, "helper.js"),
    homePath: path.join(root, "home"),
    xdgPath: path.join(root, "xdg"),
    tempPath: path.join(root, "tmp"),
    sessionName: "sf-doctor-" + safeToken,
    dashboardName: "dashboard-" + safeToken,
    issueWindowName: "issue-" + safeToken,
  };
}

export class LiveDoctorSocketWaiter implements DoctorSocketWaiterPort {
  public waitForSocket(
    workspace: DoctorProbeWorkspace,
    timeoutMs: number,
  ): Promise<boolean> {
    if (timeoutMs <= 0) return Promise.resolve(false);
    return new Promise((resolve) => {
      let settled = false;
      let watcher: FSWatcher | null = null;
      const finish = (ready: boolean): void => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        watcher?.close();
        resolve(ready);
      };
      const check = async (): Promise<void> => {
        try {
          const stat = await fs.lstat(workspace.socketPath);
          if (stat.isSocket()) finish(true);
        } catch (cause: unknown) {
          if (nodeErrorCode(cause) !== "ENOENT") finish(false);
        }
      };
      const timer = setTimeout(() => finish(false), timeoutMs);
      watcher = watch(
        workspace.root,
        { persistent: false },
        () => void check(),
      );
      watcher.on("error", () => finish(false));
      void check();
    });
  }
}

export class LiveDoctorProcessPort implements DoctorProcessObservationPort {
  public constructor(private readonly procRoot = "/proc") {}

  public identify(
    pid: number,
    launchedAtMs: number,
  ): Promise<DoctorProcessIdentity | null> {
    return readIdentity(this.procRoot, pid, launchedAtMs);
  }

  public async observe(
    identity: DoctorProcessIdentity,
  ): Promise<DoctorProcessIdentity | null> {
    return readIdentity(this.procRoot, identity.pid, identity.launchedAtMs);
  }

  public async findHelpers(
    search: DoctorHelperSearch,
  ): Promise<readonly DoctorProcessIdentity[]> {
    const observedServer = await readIdentity(
      this.procRoot,
      search.server.pid,
      search.server.launchedAtMs,
    );
    if (observedServer === null || !sameIdentity(search.server, observedServer))
      throw new Error("managed Doctor server identity is unavailable");

    const descendants = await findDescendantPids(
      this.procRoot,
      search.server.pid,
    );
    const helpers: DoctorProcessIdentity[] = [];
    for (const pid of descendants) {
      const identity = await readIdentity(
        this.procRoot,
        pid,
        search.launchedAfterMs,
      );
      if (identity === null) continue;
      if (
        identity.executable === search.executable &&
        identity.cwd === search.cwd &&
        identity.args.length === 1 &&
        identity.args[0] === search.helperPath &&
        identity.launchedAtMs >= search.launchedAfterMs - 1_000 &&
        identity.launchedAtMs <= search.launchedBeforeMs + 1_000
      )
        helpers.push(identity);
    }
    return helpers;
  }

  public isDescendant(
    identity: DoctorProcessIdentity,
    server: DoctorProcessIdentity,
  ): Promise<boolean> {
    return isDescendant(this.procRoot, identity.pid, server.pid);
  }

  public async signal(
    identity: DoctorProcessIdentity,
    signal: "SIGTERM" | "SIGKILL",
  ): Promise<boolean> {
    const observed = await this.observe(identity);
    if (observed === null || !sameIdentity(identity, observed)) return false;
    try {
      process.kill(identity.pid, signal);
      return true;
    } catch (cause: unknown) {
      if (nodeErrorCode(cause) === "ESRCH") return true;
      throw cause;
    }
  }

  public async waitForExit(
    identity: DoctorProcessIdentity,
    timeoutMs: number,
  ): Promise<boolean> {
    const deadline = Date.now() + Math.max(0, timeoutMs);
    while (Date.now() < deadline) {
      if ((await this.observe(identity)) === null) return true;
      await wait(Math.min(25, Math.max(1, deadline - Date.now())));
    }
    return (await this.observe(identity)) === null;
  }
}

export class LiveDoctorManagedProcessPort implements DoctorManagedProcessPort {
  public constructor(private readonly processes: LiveDoctorProcessPort) {}

  public start(
    spec: DoctorManagedProcessSpec,
    launchedAtMs: number,
  ): Promise<DoctorManagedProcessHandle> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const stdout = new DoctorStreamCapture();
      const stderr = new DoctorStreamCapture();
      const child = spawn(spec.executable, [...spec.args], {
        cwd: spec.cwd,
        env: spec.environment,
        shell: false,
        detached: true,
        stdio: ["ignore", "pipe", "pipe"],
      });
      const failOwned = (cause: Error): void => {
        if (settled) return;
        settled = true;
        void stopOwnedChild(child).then(() => reject(cause));
      };
      child.stdout.on("data", (chunk: Buffer) => stdout.add(chunk));
      child.stderr.on("data", (chunk: Buffer) => stderr.add(chunk));
      child.once("error", failOwned);
      child.once("spawn", () => {
        const pid = child.pid;
        if (pid === undefined) {
          failOwned(new Error("managed tmux server has no process identifier"));
          return;
        }
        void this.processes.identify(pid, launchedAtMs).then(
          (identity) => {
            if (identity === null) {
              failOwned(
                new Error("managed tmux server identity is unavailable"),
              );
              return;
            }
            if (settled) return;
            settled = true;
            resolve(
              new LiveManagedHandle(
                child,
                identity,
                stdout,
                stderr,
                this.processes,
              ),
            );
          },
          (cause: unknown) =>
            failOwned(
              cause instanceof Error
                ? cause
                : new Error("managed tmux identity failed"),
            ),
        );
      });
    });
  }
}

async function stopOwnedChild(child: ChildProcess): Promise<void> {
  if (
    child.exitCode !== null ||
    child.signalCode !== null ||
    child.pid === undefined
  )
    return;
  child.kill("SIGTERM");
  if (await waitForOwnedChild(child, 100)) return;
  child.kill("SIGKILL");
  await waitForOwnedChild(child, 2000);
}

function waitForOwnedChild(
  child: ChildProcess,
  timeoutMs: number,
): Promise<boolean> {
  if (child.exitCode !== null || child.signalCode !== null)
    return Promise.resolve(true);
  return new Promise((resolve) => {
    let settled = false;
    const finish = (exited: boolean): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.removeListener("close", onClose);
      resolve(exited);
    };
    const onClose = (): void => finish(true);
    const timer = setTimeout(() => finish(false), timeoutMs);
    child.once("close", onClose);
  });
}

class LiveManagedHandle implements DoctorManagedProcessHandle {
  private exited = false;
  private exitCode: number | null = null;
  private signalValue: NodeJS.Signals | null = null;
  private readonly completion: Promise<void>;

  public constructor(
    private readonly child: ChildProcess,
    public readonly identity: DoctorProcessIdentity,
    private readonly stdout: DoctorStreamCapture,
    private readonly stderr: DoctorStreamCapture,
    private readonly processes: LiveDoctorProcessPort,
  ) {
    this.completion = new Promise((resolve) => {
      child.once("close", (exitCode, signal) => {
        this.exited = true;
        this.exitCode = exitCode;
        this.signalValue = signal;
        resolve();
      });
    });
  }

  public async wait(timeoutMs: number): Promise<boolean> {
    if (this.exited) return true;
    if (timeoutMs <= 0) return false;
    let timer: NodeJS.Timeout | null = null;
    const expired = new Promise<false>((resolve) => {
      timer = setTimeout(() => resolve(false), timeoutMs);
    });
    const result = await Promise.race([
      this.completion.then(() => true),
      expired,
    ]);
    if (timer !== null) clearTimeout(timer);
    return result;
  }

  public signal(signal: "SIGTERM" | "SIGKILL"): Promise<boolean> {
    return this.processes.signal(this.identity, signal);
  }

  public streamResult(): DoctorCommandResult {
    const stdoutBuffer = this.stdout.buffer();
    const stderrBuffer = this.stderr.buffer();
    return {
      exitCode: this.exitCode,
      signal: this.signalValue,
      stdout: redact(stdoutBuffer.toString("utf8")),
      stderr: redact(stderrBuffer.toString("utf8")),
      stdoutBuffer,
      stderrBuffer,
      stdoutByteCount: this.stdout.byteCount,
      stderrByteCount: this.stderr.byteCount,
      stdoutTruncated: this.stdout.truncated,
      stderrTruncated: this.stderr.truncated,
      timedOut: false,
      cancelled: false,
      launchError: null,
    };
  }
}

export function resolveDoctorHelperExecutable(executable: string): string {
  return realpathSync.native(executable);
}

export function createLiveDoctorTmuxProbe(
  commands: DoctorCommandRunner = new LiveDoctorCommandRunner(),
  clock: DoctorClock = { now: () => Date.now() },
): DoctorTmuxProbePort {
  const processes = new LiveDoctorProcessPort();
  return new DoctorTmuxProbe({
    commands,
    workspaces: new LiveDoctorProbeWorkspacePort(),
    managedProcesses: new LiveDoctorManagedProcessPort(processes),
    processes,
    sockets: new LiveDoctorSocketWaiter(),
    clock,
    helperExecutable: resolveDoctorHelperExecutable(process.execPath),
  });
}

export function nextDoctorProbeToken(): string {
  return randomUUID();
}

async function findDescendantPids(
  procRoot: string,
  serverPid: number,
): Promise<readonly number[]> {
  const queue: Array<{ readonly pid: number; readonly depth: number }> = [
    { pid: serverPid, depth: 0 },
  ];
  const visited = new Set<number>([serverPid]);
  const descendants: number[] = [];
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    if (current === undefined)
      throw new Error("managed Doctor descendant traversal failed");
    let childrenText: string;
    try {
      childrenText = await fs.readFile(
        path.join(
          procRoot,
          String(current.pid),
          "task",
          String(current.pid),
          "children",
        ),
        "utf8",
      );
    } catch (cause: unknown) {
      if (current.depth > 0 && nodeErrorCode(cause) === "ENOENT") continue;
      throw cause;
    }
    const childPids = parseProcessChildren(childrenText);
    if (current.depth >= MAX_DOCTOR_DESCENDANT_DEPTH && childPids.length > 0)
      throw new Error("managed Doctor descendant depth exceeded");
    for (const childPid of childPids) {
      if (visited.has(childPid))
        throw new Error("malformed managed Doctor descendant tree");
      if (descendants.length >= MAX_DOCTOR_DESCENDANTS)
        throw new Error("managed Doctor descendant count exceeded");
      visited.add(childPid);
      descendants.push(childPid);
      queue.push({ pid: childPid, depth: current.depth + 1 });
    }
  }
  return descendants;
}

function parseProcessChildren(value: string): readonly number[] {
  const trimmed = value.trim();
  if (trimmed === "") return [];
  return trimmed.split(/\s+/).map((token) => {
    if (!/^[1-9]\d*$/.test(token))
      throw new Error("malformed managed Doctor descendant tree");
    const pid = Number(token);
    if (!Number.isSafeInteger(pid))
      throw new Error("malformed managed Doctor descendant tree");
    return pid;
  });
}

async function readIdentity(
  procRoot: string,
  pid: number,
  fallbackLaunchMs: number,
): Promise<DoctorProcessIdentity | null> {
  try {
    const [statText, executable, cwd, commandLine, procStat] =
      await Promise.all([
        fs.readFile(path.join(procRoot, String(pid), "stat"), "utf8"),
        fs.readlink(path.join(procRoot, String(pid), "exe")),
        fs.readlink(path.join(procRoot, String(pid), "cwd")),
        fs.readFile(path.join(procRoot, String(pid), "cmdline")),
        fs.stat(path.join(procRoot, String(pid))),
      ]);
    const parsed = parseProcStat(statText);
    const argv = commandLine.toString("utf8").split("\0").filter(Boolean);
    return {
      pid,
      processGroupId: parsed.processGroupId,
      startToken: parsed.startToken,
      executable,
      args: argv.slice(1),
      cwd,
      launchedAtMs:
        procStat.birthtimeMs > 0 ? procStat.birthtimeMs : fallbackLaunchMs,
    };
  } catch (cause: unknown) {
    if (nodeErrorCode(cause) === "ENOENT") return null;
    throw cause;
  }
}

function parseProcStat(value: string): {
  readonly parentPid: number;
  readonly processGroupId: number;
  readonly startToken: string;
} {
  const closing = value.lastIndexOf(")");
  const fields =
    closing < 0
      ? []
      : value
          .slice(closing + 1)
          .trim()
          .split(/\s+/);
  const parentPid = Number(fields[1]);
  const processGroupId = Number(fields[2]);
  const startToken = fields[19];
  if (
    !Number.isSafeInteger(parentPid) ||
    !Number.isSafeInteger(processGroupId) ||
    processGroupId <= 0 ||
    startToken === undefined ||
    !/^\d+$/.test(startToken)
  )
    throw new Error("malformed operating-system process identity");
  return { parentPid, processGroupId, startToken };
}

async function isDescendant(
  procRoot: string,
  pid: number,
  ancestorPid: number,
): Promise<boolean> {
  let current = pid;
  const visited = new Set<number>();
  while (current > 1 && !visited.has(current)) {
    if (current === ancestorPid) return pid !== ancestorPid;
    visited.add(current);
    try {
      const stat = await fs.readFile(
        path.join(procRoot, String(current), "stat"),
        "utf8",
      );
      current = parseProcStat(stat).parentPid;
    } catch (cause: unknown) {
      if (nodeErrorCode(cause) === "ENOENT") return false;
      throw cause;
    }
  }
  return false;
}

async function exists(target: string): Promise<boolean> {
  try {
    await fs.lstat(target);
    return true;
  } catch (cause: unknown) {
    if (nodeErrorCode(cause) === "ENOENT") return false;
    throw cause;
  }
}

function nodeErrorCode(cause: unknown): string | null {
  if (typeof cause !== "object" || cause === null || !("code" in cause))
    return null;
  const code = Reflect.get(cause, "code");
  return typeof code === "string" ? code : null;
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

function wait(timeoutMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, timeoutMs));
}
