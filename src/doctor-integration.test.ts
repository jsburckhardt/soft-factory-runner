import { spawnSync } from "node:child_process";
import * as fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type {
  DoctorCommandResult,
  DoctorCommandRunner,
  DoctorCommandSpec,
} from "./doctor-adapters";
import {
  DOCTOR_CHECK_IDS,
  failedCheck,
  passedCheck,
  type DoctorCheckId,
  type DoctorCheckResultV2,
  type DoctorResultV2,
} from "./doctor";
import { DoctorService } from "./doctor-service";
import type { DoctorTmuxProbePort } from "./doctor-tmux";
import { runCli } from "./index";
import type { RunnerPorts } from "./ports";

const projectRoot = path.resolve(__dirname, "..");
const manifests = path.join(projectRoot, "fixtures", "doctor");
const tripwirePorts = new Proxy({} as RunnerPorts, {
  get() {
    throw new Error("isolated Doctor fixture accessed issue ports");
  },
});
class ControlledTmuxProbe implements DoctorTmuxProbePort {
  public calls = 0;
  public constructor(private readonly ready = true) {}
  public async run() {
    this.calls += 1;
    return this.ready
      ? {
          ok: true as const,
          value: true as const,
          message: null,
          remediation: null,
        }
      : {
          ok: false as const,
          value: null,
          message:
            "The isolated tmux functional probe did not complete with proved cleanup.",
          remediation: "Repair the local tmux installation and rerun Doctor.",
          evidence: {
            schemaVersion: 1 as const,
            kind: "tmux-functional-probe" as const,
            operation: "server-start" as const,
            reason: "launch-failed" as const,
            exitCode: null,
            timedOut: false,
            stdoutByteCount: 0,
            stderrByteCount: 0,
            stdoutTruncated: false,
            stderrTruncated: false,
            identityDiagnostic: null,
            cleanup: {
              server: "not-created" as const,
              paneProcesses: "not-created" as const,
              socket: "not-created" as const,
              workspace: "absent" as const,
            },
          },
        };
  }
}

interface IsolatedManifest {
  readonly schemaVersion: 2;
  readonly variants: readonly {
    readonly name: string;
    readonly failedId: DoctorCheckId;
  }[];
}
async function readManifest<T>(name: string): Promise<T> {
  return JSON.parse(await fs.readFile(path.join(manifests, name), "utf8")) as T;
}
function normalizeHuman(text: string): DoctorResultV2 {
  const lines = text.trimEnd().split("\n");
  const checks: DoctorCheckResultV2[] = [];
  for (let index = 3; index < lines.length - 1; index += 1) {
    const match = /^CHECK id=(\S+) status=(passed|failed) blocking=true$/.exec(
      lines[index],
    );
    if (match === null) continue;
    const id = match[1] as DoctorCheckId;
    if (match[2] === "failed") {
      const evidenceLine = lines[index + 3];
      checks.push(
        failedCheck(
          id,
          lines[index + 1].slice(11),
          lines[index + 2].slice(15),
          evidenceLine?.startsWith("  EVIDENCE: ")
            ? JSON.parse(evidenceLine.slice(12))
            : undefined,
        ),
      );
      index += evidenceLine?.startsWith("  EVIDENCE: ") ? 3 : 2;
    } else checks.push(passedCheck(id));
  }
  const github = lines[1].slice("REPOSITORY github=".length);
  const branch = lines[2].slice("REPOSITORY defaultBranch=".length);
  return {
    schemaVersion: 2,
    ready: lines.at(-1) === "STATUS: READY",
    repository: {
      github: github === "null" ? null : github,
      defaultBranch: branch === "null" ? null : branch,
    },
    checks,
  };
}
async function writeExecutable(target: string, body: string): Promise<void> {
  await fs.writeFile(target, "#!" + process.execPath + "\n" + body);
  await fs.chmod(target, 0o700);
}
type TmuxProtocolMode = "valid" | "malformed-create" | "malformed-observe";
type ControlledIdentityReadinessMode = "normal" | "delayed" | "timeout";

const CONTROLLED_IDENTITY_READINESS_TIMEOUT_MS = 1000;
const CONTROLLED_IDENTITY_READINESS_POLL_MS = 10;
const CONTROLLED_IDENTITY_STABLE_READS = 2;
const CONTROLLED_IDENTITY_DELAY_ATTEMPTS = 3;

function protocolTmuxBody(
  mode: TmuxProtocolMode,
  readinessMode: ControlledIdentityReadinessMode = "normal",
): string {
  return String.raw`
const fs=require("node:fs");
const net=require("node:net");
const cp=require("node:child_process");
const args=process.argv.slice(2);
const mode=${JSON.stringify(mode)};
const readinessMode=${JSON.stringify(readinessMode)};
const readinessTimeoutMs=${CONTROLLED_IDENTITY_READINESS_TIMEOUT_MS};
const readinessPollMs=${CONTROLLED_IDENTITY_READINESS_POLL_MS};
const readinessStableReads=${CONTROLLED_IDENTITY_STABLE_READS};
const readinessDelayAttempts=${CONTROLLED_IDENTITY_DELAY_ATTEMPTS};
const log=process.argv[1]+".log";
const append=(entry)=>fs.appendFileSync(log,JSON.stringify(entry)+"\n");
const sleep=(durationMs)=>new Promise((resolve)=>setTimeout(resolve,durationMs));
const valueAfter=(items,key)=>{const index=items.indexOf(key);return index<0?null:items[index+1];};
if(args[0]==="-D"){
  const socketPath=args[2];
  const configPath=args[4];
  const children={dashboard:null,issue:null};let dashboardName="";
  append({server:true,privateSocket:args[1]==="-S",privateConfig:args[3]==="-f",workspaceMode:fs.statSync(process.cwd()).mode&511,configMode:fs.statSync(configPath).mode&511,helperMode:fs.statSync(require("node:path").join(process.cwd(),"helper.js")).mode&511});
  const stopChild=(child)=>new Promise((resolve)=>{
    if(child===null||child.exitCode!==null||child.signalCode!==null){resolve();return;}
    let settled=false;let killTimer=null;let settleTimer=null;
    const finish=()=>{if(settled)return;settled=true;if(killTimer!==null)clearTimeout(killTimer);if(settleTimer!==null)clearTimeout(settleTimer);child.removeListener("exit",finish);resolve();};
    child.once("exit",finish);
    killTimer=setTimeout(()=>{if(!settled)child.kill("SIGKILL");},100);
    settleTimer=setTimeout(finish,250);
    child.kill("SIGTERM");
  });
  const stopChildren=async()=>{await Promise.all(Object.values(children).map((child)=>stopChild(child)));children.dashboard=null;children.issue=null;};
  const emptyChecks=()=>({executable:false,arguments:false,cwd:false,parent:false,processGroup:false,startToken:false});
  const failedCategory=(checks)=>checks.executable?checks.arguments?checks.cwd?checks.parent?checks.processGroup?checks.startToken?null:"start-token":"process-group":"parent":"cwd":"arguments":"executable";
  const inspectHelper=(pid,physicalExecutable,helper,cwd,attempt)=>{
    let executable;let argv;let observedCwd;let stat;
    try{
      executable=fs.readlinkSync("/proc/"+pid+"/exe");
      argv=fs.readFileSync("/proc/"+pid+"/cmdline").toString("utf8").split("\0").filter(Boolean);
      observedCwd=fs.readlinkSync("/proc/"+pid+"/cwd");
      stat=fs.readFileSync("/proc/"+pid+"/stat","utf8");
    }catch(cause){
      if(cause!==null&&typeof cause==="object"&&["ENOENT","EACCES","EPERM"].includes(cause.code)){return{ready:false,signature:null,failureCategory:"proc-unavailable",checks:emptyChecks()};}
      throw cause;
    }
    const fields=stat.slice(stat.lastIndexOf(")")+1).trim().split(/\s+/);
    const checks={
      executable:executable===physicalExecutable,
      arguments:argv.length===2&&argv[1]===helper,
      cwd:observedCwd===cwd,
      parent:Number(fields[1])===process.pid,
      processGroup:Number.isSafeInteger(Number(fields[2]))&&Number(fields[2])>0,
      startToken:/^\d+$/.test(fields[19]||""),
    };
    if(readinessMode==="timeout"||(readinessMode==="delayed"&&attempt<=readinessDelayAttempts))checks.executable=false;
    const failureCategory=failedCategory(checks);
    return{ready:failureCategory===null,signature:failureCategory===null?JSON.stringify([executable,argv,observedCwd,fields[1],fields[2],fields[19]]):null,failureCategory,checks};
  };
  const waitForIdentity=async(child,executable,helper,cwd)=>{
    const physicalExecutable=fs.realpathSync(executable);
    const deadline=Date.now()+readinessTimeoutMs;
    let attempts=0;let stableReads=0;let priorSignature=null;
    let latest={ready:false,signature:null,failureCategory:"proc-unavailable",checks:emptyChecks()};
    while(Date.now()<=deadline){
      attempts+=1;
      latest=inspectHelper(child.pid,physicalExecutable,helper,cwd,attempts);
      if(latest.ready){
        stableReads=latest.signature===priorSignature?stableReads+1:1;
        priorSignature=latest.signature;
        if(stableReads>=readinessStableReads)return{outcome:"ready",failureCategory:null,attempts,stableReads,checks:latest.checks};
      }else{stableReads=0;priorSignature=null;}
      const remaining=deadline-Date.now();
      if(remaining<=0)break;
      await sleep(Math.min(readinessPollMs,remaining));
    }
    return{outcome:"timeout",failureCategory:latest.failureCategory,attempts,stableReads,checks:latest.checks};
  };
  const waitForSpawn=(child)=>new Promise((resolve)=>{child.once("spawn",()=>resolve(true));child.once("error",()=>resolve(false));});
  const spawnHelper=async(executable,helper,cwd)=>{
    const child=cp.spawn(executable,[helper],{cwd,stdio:"ignore"});
    const spawned=await waitForSpawn(child);
    if(!spawned){append({server:false,privateSocket:true,command:"helper-readiness",spawnObserved:false,outcome:"spawn-error",failureCategory:"spawn",attempts:0,stableReads:0,timeoutMs:readinessTimeoutMs,pollMs:readinessPollMs,requiredStableReads:readinessStableReads,checks:emptyChecks()});return null;}
    const readiness=await waitForIdentity(child,executable,helper,cwd);
    append({server:false,privateSocket:true,command:"helper-readiness",spawnObserved:true,outcome:readiness.outcome,failureCategory:readiness.failureCategory,attempts:readiness.attempts,stableReads:readiness.stableReads,timeoutMs:readinessTimeoutMs,pollMs:readinessPollMs,requiredStableReads:readinessStableReads,checks:readiness.checks});
    if(readiness.outcome!=="ready"){await stopChild(child);return null;}
    return child;
  };
  const server=net.createServer({allowHalfOpen:true},(connection)=>{
    let input="";
    connection.on("data",(chunk)=>{input+=chunk.toString("utf8");});
    connection.on("end",async()=>{
      const request=JSON.parse(input);
      const command=request.args[0];
      const a=request.args;
      const response={exitCode:0,stdout:"",stderr:""};
      let stop=false;
      if(command==="new-session"){
        const cwd=valueAfter(a,"-c");const helper=a.at(-1);dashboardName=valueAfter(a,"-n")||"";
        const executable=a.at(-2);children.dashboard=await spawnHelper(executable,helper,cwd);
        if(children.dashboard===null)response.exitCode=1;
      }else if(command==="has-session"){
        if(children.dashboard===null)response.exitCode=1;
      }else if(command==="list-windows"){
        response.stdout=dashboardName+"\n";
      }else if(command==="display-message"){
        const target=valueAfter(a,"-t")||"";
        const child=target.includes("%1")?children.issue:children.dashboard;
        if(child===null||child.pid===undefined)response.exitCode=1;else response.stdout=String(child.pid)+"\n";
      }else if(command==="new-window"){
        const cwd=valueAfter(a,"-c");const helper=a.at(-1);
        const executable=a.at(-2);children.issue=await spawnHelper(executable,helper,cwd);
        if(children.issue===null)response.exitCode=1;
        response.stdout=mode==="malformed-create"?"@1\t%1\textra\n":"@1\t%1\n";
      }else if(command==="set-window-option"){
        if(children.issue===null)response.exitCode=1;
      }else if(command==="list-panes"){
        response.stdout=mode==="malformed-observe"?"@1\t%1\n":"@1\t%1\t"+process.cwd()+"\n";
      }else if(command==="kill-window"){
        await stopChild(children.issue);children.issue=null;
      }else if(command==="kill-server"){
        stop=true;await stopChildren();
      }else response.exitCode=1;
      connection.end(JSON.stringify(response),()=>{if(stop)server.close(()=>process.exit(0));});
    });
  });
  server.listen(socketPath);
  let shuttingDown=false;
  const shutdown=async()=>{if(shuttingDown)return;shuttingDown=true;await stopChildren();server.close(()=>process.exit(0));};
  process.on("SIGTERM",()=>void shutdown());
  process.on("SIGINT",()=>void shutdown());
}else{
  const socketPath=args[1];
  const commandArgs=args.slice(2);
  append({server:false,privateSocket:args[0]==="-S",command:commandArgs[0]});
  const client=net.createConnection(socketPath);
  let output="";
  const timer=setTimeout(()=>{client.destroy();process.exitCode=1;},1500);
  client.on("connect",()=>client.end(JSON.stringify({args:commandArgs})));
  client.on("data",(chunk)=>{output+=chunk.toString("utf8");});
  client.on("end",()=>{clearTimeout(timer);const response=JSON.parse(output);process.stdout.write(response.stdout);process.stderr.write(response.stderr);process.exitCode=response.exitCode;});
  client.on("error",()=>{clearTimeout(timer);process.exitCode=1;});
}
`;
}

async function probeWorkspaces(): Promise<readonly string[]> {
  return (await fs.readdir(await fs.realpath(os.tmpdir())))
    .filter((entry) => entry.startsWith("soft-factory-doctor-"))
    .sort();
}

async function readyRepository(
  tmuxMode: TmuxProtocolMode | "nonfunctional" = "valid",
  readinessMode: ControlledIdentityReadinessMode = "normal",
): Promise<{ root: string; bin: string }> {
  const root = await fs.mkdtemp(
    path.join(os.tmpdir(), "doctor-ready-process-"),
  );
  const bin = path.join(root, "bin");
  await fs.mkdir(bin);
  await fs.mkdir(path.join(root, ".git"));
  await fs.mkdir(path.join(root, ".github", "agents"), { recursive: true });
  await fs.mkdir(path.join(root, ".soft-factory"));
  await fs.mkdir(path.join(root, ".trees"));
  await fs.writeFile(
    path.join(root, ".github", "agents", "rpiv.agent.md"),
    "---\nname: rpiv\nrunner_protocol: 1\nresult_contract: agent-result-v1\n---\n",
  );
  await fs.writeFile(
    path.join(root, ".soft-factory", "config.yml"),
    "protocol_version: 1\nrepository:\n  worktree_root: .trees\n  state_root: .soft-factory\n",
  );
  const gitBody = `const a=process.argv.slice(2);const k=a.join(" ");const cwd=process.cwd();let out="";let code=0;if(k==="rev-parse --is-inside-work-tree")out="true\\n";else if(k==="rev-parse --show-toplevel")out=cwd+"\\n";else if(k==="rev-parse --path-format=absolute --git-common-dir")out=cwd+"/.git\\n";else if(k==="remote")out="origin\\n";else if(k==="remote get-url origin")out="git@github.com:owner/repo.git\\n";else if(k==="symbolic-ref --quiet refs/remotes/origin/HEAD")out="refs/remotes/origin/main\\n";else if(k.startsWith("check-ignore --no-index --quiet -- "))code=0;else if(k==="worktree list --porcelain")out="worktree "+cwd+"\\nHEAD abc\\n";else code=1;process.stdout.write(out);process.exitCode=code;`;
  await writeExecutable(path.join(bin, "git"), gitBody);
  await writeExecutable(
    path.join(bin, "gh"),
    'process.exitCode=process.argv.slice(2).join(" ").startsWith("auth status --hostname github.com")?0:1;',
  );
  await writeExecutable(
    path.join(bin, "copilot"),
    'process.stdout.write("copilot 1\\n");',
  );
  await writeExecutable(
    path.join(bin, "tmux"),
    tmuxMode === "nonfunctional"
      ? "process.exitCode=0;"
      : protocolTmuxBody(tmuxMode, readinessMode),
  );
  await writeExecutable(path.join(bin, "node"), "process.exitCode=0;");
  return { root, bin };
}
class ControlledDoctorRunner implements DoctorCommandRunner {
  public readonly calls: DoctorCommandSpec[] = [];
  public constructor(
    private readonly root: string,
    private readonly failedId: DoctorCheckId | null,
  ) {}
  public async run(spec: DoctorCommandSpec): Promise<DoctorCommandResult> {
    this.calls.push(spec);
    const args = spec.args.join(" ");
    let exitCode = 0;
    let stdout = "";
    if (path.basename(spec.executable) === "git") {
      if (args === "rev-parse --is-inside-work-tree") {
        exitCode = this.failedId === "repository.git-membership" ? 1 : 0;
        stdout = exitCode === 0 ? "true\n" : "";
      } else if (args === "rev-parse --show-toplevel") {
        exitCode = this.failedId === "repository.primary-worktree" ? 1 : 0;
        stdout = exitCode === 0 ? this.root + "\n" : "";
      } else if (args === "rev-parse --path-format=absolute --git-common-dir") {
        exitCode = this.failedId === "repository.git-common-directory" ? 1 : 0;
        stdout =
          exitCode !== 0
            ? ""
            : this.failedId === "repository.primary-worktree"
              ? path.join(this.root, ".git", "worktrees", "linked") + "\n"
              : path.join(this.root, ".git") + "\n";
      } else if (args === "remote") {
        stdout =
          this.failedId === "repository.github-identity" ? "" : "origin\n";
      } else if (args === "remote get-url origin") {
        stdout = "git@github.com:owner/repo.git\n";
      } else if (args === "symbolic-ref --quiet refs/remotes/origin/HEAD") {
        exitCode = this.failedId === "repository.default-branch" ? 1 : 0;
        stdout = exitCode === 0 ? "refs/remotes/origin/main\n" : "";
      } else if (args.startsWith("check-ignore --no-index --quiet -- ")) {
        const representative = spec.args.at(-1) ?? "";
        if (
          (this.failedId === "compatibility.trees-ignored" &&
            representative.includes(path.sep + ".trees" + path.sep)) ||
          (this.failedId === "compatibility.runtime-state-ignored" &&
            representative.includes(path.sep + ".soft-factory" + path.sep))
        )
          exitCode = 1;
      } else if (args === "worktree list --porcelain") {
        stdout = "worktree " + this.root + "\nHEAD abc\n";
      } else exitCode = 1;
    } else if (path.basename(spec.executable) === "gh") {
      exitCode = this.failedId === "authentication.github-cli" ? 1 : 0;
    } else if (path.basename(spec.executable) === "copilot") {
      exitCode = this.failedId === "authentication.copilot-cli" ? 1 : 0;
      stdout = exitCode === 0 ? "copilot 1\n" : "";
    }
    return {
      exitCode,
      signal: null,
      stdout,
      stderr: "",
      stdoutBuffer: Buffer.from(stdout),
      stderrBuffer: Buffer.alloc(0),
      stdoutByteCount: Buffer.byteLength(stdout),
      stderrByteCount: 0,
      stdoutTruncated: false,
      stderrTruncated: false,
      timedOut: false,
      cancelled: false,
      launchError: null,
    };
  }
}
async function actualDoctorFixture(failedId: DoctorCheckId | null): Promise<{
  root: string;
  doctor: DoctorService;
  runner: ControlledDoctorRunner;
}> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doctor-actual-check-"));
  const bin = path.join(root, "bin");
  await fs.mkdir(bin);
  await fs.mkdir(path.join(root, ".git"));
  await fs.mkdir(path.join(root, ".github", "agents"), { recursive: true });
  await fs.mkdir(path.join(root, ".soft-factory"));
  await fs.mkdir(path.join(root, ".trees"));
  for (const executable of ["git", "gh", "tmux", "node", "copilot"])
    if (failedId !== "command." + executable)
      await writeExecutable(path.join(bin, executable), "process.exitCode=0;");

  if (failedId !== "compatibility.rpiv-agent")
    await fs.writeFile(
      path.join(root, ".github", "agents", "rpiv.agent.md"),
      "---\nname: rpiv\nrunner_protocol: " +
        (failedId === "compatibility.runner-protocol" ? "2" : "1") +
        "\nresult_contract: " +
        (failedId === "compatibility.result-contract"
          ? "unsupported"
          : "agent-result-v1") +
        "\n---\n",
    );
  const worktreeRoot =
    failedId === "compatibility.worktree-root" ? "collision" : ".trees";
  await fs.writeFile(
    path.join(root, ".soft-factory", "config.yml"),
    failedId === "compatibility.configuration"
      ? "protocol_version: 1\nunknown:\n"
      : "protocol_version: 1\nrepository:\n  worktree_root: " +
          worktreeRoot +
          "\n  state_root: .soft-factory\n",
  );
  if (failedId === "compatibility.worktree-root")
    await fs.writeFile(path.join(root, "collision"), "preserve");
  if (failedId === "compatibility.state-root-writable")
    await fs.writeFile(
      path.join(root, ".soft-factory", ".doctor-write-isolated"),
      "collision",
    );
  if (failedId === "runtime.trees-ownership")
    await fs.mkdir(path.join(root, ".trees", "5"));
  if (failedId === "runtime.state-readable") {
    await fs.mkdir(path.join(root, ".soft-factory", "runs"));
    await fs.writeFile(
      path.join(root, ".soft-factory", "runs", "5.json"),
      "{broken",
    );
  }
  if (failedId === "runtime.locks-interpretable") {
    await fs.mkdir(path.join(root, ".soft-factory", "locks"));
    await fs.writeFile(
      path.join(root, ".soft-factory", "locks", "5.lock"),
      "{}",
    );
  }
  if (failedId === "runtime.required-paths-creatable")
    await fs.writeFile(
      path.join(root, ".trees", ".doctor-path-worktree-isolated"),
      "collision",
    );
  const runner = new ControlledDoctorRunner(root, failedId);
  const tmuxProbe = new ControlledTmuxProbe();
  return {
    root,
    runner,
    doctor: new DoctorService({
      runner,
      pathValue: bin,
      token: "isolated",
      tmuxProbe,
    }),
  };
}

function builtDoctor(
  cwd: string,
  pathValue: string,
  json: boolean,
): {
  status: number | null;
  stdout: string;
  stderr: string;
  elapsedMs: number;
} {
  const start = process.hrtime.bigint();
  const result = spawnSync(
    process.execPath,
    [
      path.join(projectRoot, "dist", "index.js"),
      "doctor",
      ...(json ? ["--json"] : []),
    ],
    {
      cwd,
      env: { PATH: pathValue, HOME: cwd },
      encoding: "utf8",
      timeout: 10_000,
    },
  );
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    elapsedMs: Number(process.hrtime.bigint() - start) / 1_000_000,
  };
}

type ControlledReadinessCategory =
  | "arguments"
  | "cwd"
  | "executable"
  | "parent"
  | "process-group"
  | "proc-unavailable"
  | "spawn"
  | "start-token";

interface ControlledReadinessChecks {
  readonly executable: boolean;
  readonly arguments: boolean;
  readonly cwd: boolean;
  readonly parent: boolean;
  readonly processGroup: boolean;
  readonly startToken: boolean;
}

interface ControlledReadinessDiagnostic {
  readonly spawnObserved: boolean;
  readonly outcome: "ready" | "spawn-error" | "timeout";
  readonly failureCategory: ControlledReadinessCategory | null;
  readonly attempts: number;
  readonly stableReads: number;
  readonly timeoutMs: number;
  readonly pollMs: number;
  readonly requiredStableReads: number;
  readonly checks: ControlledReadinessChecks;
}

interface BuiltDoctorDiagnostic {
  readonly status: number | null;
  readonly stderr: "empty" | "present";
  readonly doctorFailure: {
    readonly operation: string;
    readonly reason: string;
  } | null;
  readonly readiness: readonly ControlledReadinessDiagnostic[];
}

const READY_IDENTITY_CHECKS: ControlledReadinessChecks = {
  executable: true,
  arguments: true,
  cwd: true,
  parent: true,
  processGroup: true,
  startToken: true,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseBuiltDoctorOutput(output: string, json: boolean): unknown {
  if (!json) return normalizeHuman(output);
  try {
    return JSON.parse(output);
  } catch (cause: unknown) {
    if (cause instanceof SyntaxError) return null;
    throw cause;
  }
}

function doctorFailure(
  output: string,
  json: boolean,
): BuiltDoctorDiagnostic["doctorFailure"] {
  const parsed = parseBuiltDoctorOutput(output, json);
  if (!isRecord(parsed) || !Array.isArray(parsed.checks))
    return { operation: "output-unparseable", reason: "output-unparseable" };
  const check = parsed.checks.find(
    (candidate: unknown) =>
      isRecord(candidate) && candidate.id === "command.tmux",
  );
  if (!isRecord(check))
    return { operation: "check-missing", reason: "check-missing" };
  if (check.status === "passed") return null;
  if (!isRecord(check.evidence))
    return { operation: "evidence-missing", reason: "evidence-missing" };
  return {
    operation:
      typeof check.evidence.operation === "string"
        ? check.evidence.operation
        : "operation-missing",
    reason:
      typeof check.evidence.reason === "string"
        ? check.evidence.reason
        : "reason-missing",
  };
}

function numberField(record: Record<string, unknown>, field: string): number {
  const value = record[field];
  if (!Number.isSafeInteger(value) || typeof value !== "number" || value < 0)
    throw new Error("Malformed value-free controlled readiness count.");
  return value;
}

function booleanField(record: Record<string, unknown>, field: string): boolean {
  const value = record[field];
  if (typeof value !== "boolean")
    throw new Error("Malformed value-free controlled readiness fact.");
  return value;
}

function readinessDiagnostic(
  value: unknown,
): ControlledReadinessDiagnostic | null {
  if (!isRecord(value) || value.command !== "helper-readiness") return null;
  if (!isRecord(value.checks))
    throw new Error("Malformed value-free controlled readiness checks.");
  const outcomes = ["ready", "spawn-error", "timeout"] as const;
  const categories = [
    "arguments",
    "cwd",
    "executable",
    "parent",
    "process-group",
    "proc-unavailable",
    "spawn",
    "start-token",
  ] as const;
  const outcome = outcomes.find((candidate) => candidate === value.outcome);
  const failureCategory =
    value.failureCategory === null
      ? null
      : categories.find((candidate) => candidate === value.failureCategory);
  if (outcome === undefined || failureCategory === undefined)
    throw new Error(
      "Malformed value-free controlled readiness classification.",
    );
  return {
    spawnObserved: booleanField(value, "spawnObserved"),
    outcome,
    failureCategory,
    attempts: numberField(value, "attempts"),
    stableReads: numberField(value, "stableReads"),
    timeoutMs: numberField(value, "timeoutMs"),
    pollMs: numberField(value, "pollMs"),
    requiredStableReads: numberField(value, "requiredStableReads"),
    checks: {
      executable: booleanField(value.checks, "executable"),
      arguments: booleanField(value.checks, "arguments"),
      cwd: booleanField(value.checks, "cwd"),
      parent: booleanField(value.checks, "parent"),
      processGroup: booleanField(value.checks, "processGroup"),
      startToken: booleanField(value.checks, "startToken"),
    },
  };
}

async function controlledReadinessDiagnostics(
  bin: string,
): Promise<readonly ControlledReadinessDiagnostic[]> {
  let content: string;
  try {
    content = await fs.readFile(path.join(bin, "tmux.log"), "utf8");
  } catch (cause: unknown) {
    if (isRecord(cause) && cause.code === "ENOENT") return [];
    throw cause;
  }
  if (content.trim() === "") return [];
  return content
    .trim()
    .split("\n")
    .map((line) => {
      try {
        return JSON.parse(line) as unknown;
      } catch (cause: unknown) {
        if (cause instanceof SyntaxError)
          throw new Error("Malformed controlled readiness trace.");
        throw cause;
      }
    })
    .map(readinessDiagnostic)
    .filter((entry): entry is ControlledReadinessDiagnostic => entry !== null);
}

async function builtDoctorDiagnostic(
  result: ReturnType<typeof builtDoctor>,
  bin: string,
  json: boolean,
): Promise<BuiltDoctorDiagnostic> {
  return {
    status: result.status,
    stderr: result.stderr === "" ? "empty" : "present",
    doctorFailure: doctorFailure(result.stdout, json),
    readiness: (await controlledReadinessDiagnostics(bin)).slice(-2),
  };
}

describe("Doctor manifest-driven acceptance fixtures", () => {
  beforeAll(() => {
    const build = spawnSync("just", ["build"], {
      cwd: projectRoot,
      encoding: "utf8",
    });
    if (build.status !== 0)
      throw new Error("Fixture build failed: " + build.stdout + build.stderr);
  });

  it("validates complete ordered ready, blocked, and isolated-failure manifests", async () => {
    const ready = await readManifest<DoctorResultV2>("ready.json");
    const blocked = await readManifest<DoctorResultV2>("blocked.json");
    const isolated = await readManifest<IsolatedManifest>(
      "isolated-failures.json",
    );
    for (const manifest of [ready, blocked]) {
      expect(manifest.schemaVersion).toBe(2);
      expect(manifest.checks.map((check) => check.id)).toEqual(
        DOCTOR_CHECK_IDS,
      );
      expect(new Set(manifest.checks.map((check) => check.id)).size).toBe(24);
      expect(manifest.checks.every((check) => check.blocking === true)).toBe(
        true,
      );
    }
    expect(isolated.variants.map((variant) => variant.failedId)).toEqual(
      DOCTOR_CHECK_IDS,
    );
    expect(new Set(isolated.variants.map((variant) => variant.name)).size).toBe(
      24,
    );
  });

  it("executes every isolated failure through actual Doctor checks and proves a 24-row pass/fail matrix", async () => {
    const isolated = await readManifest<IsolatedManifest>(
      "isolated-failures.json",
    );
    const readyManifest = await readManifest<DoctorResultV2>("ready.json");
    const readyFixture = await actualDoctorFixture(null);
    const readyResponse = await runCli(
      ["doctor", "--json"],
      readyFixture.root,
      tripwirePorts,
      readyFixture.doctor,
    );
    expect(readyResponse.exitCode).toBe(0);
    expect(JSON.parse(readyResponse.stdout)).toEqual(readyManifest);
    expect(readyFixture.runner.calls.length).toBeGreaterThan(0);
    await fs.rm(readyFixture.root, { recursive: true, force: true });

    const matrix: Array<{ id: string; pass: string; fail: string }> = [];
    for (const variant of isolated.variants) {
      const fixture = await actualDoctorFixture(variant.failedId);
      const response = await runCli(
        ["doctor", "--json"],
        fixture.root,
        tripwirePorts,
        fixture.doctor,
      );
      expect(response.exitCode).toBe(3);
      const output = JSON.parse(response.stdout) as DoctorResultV2;
      expect(output.checks).toHaveLength(24);
      expect(
        output.checks.find((check) => check.id === variant.failedId)?.status,
      ).toBe("failed");
      expect(fixture.runner.calls.length).toBeGreaterThan(0);
      matrix.push({ id: variant.failedId, pass: "ready", fail: variant.name });
      await fs.rm(fixture.root, { recursive: true, force: true });
    }
    expect(matrix.map((row) => row.id)).toEqual(DOCTOR_CHECK_IDS);
  });

  it("runs controlled ready human/JSON built processes with parity, determinism, and <=10 second timing", async () => {
    const fixture = await readyRepository();
    const beforeProbeWorkspaces = await probeWorkspaces();
    try {
      const manifest = await readManifest<DoctorResultV2>("ready.json");
      const jsonFirst = builtDoctor(fixture.root, fixture.bin, true);
      const jsonFirstDiagnostic = await builtDoctorDiagnostic(
        jsonFirst,
        fixture.bin,
        true,
      );
      const jsonSecond = builtDoctor(fixture.root, fixture.bin, true);
      const jsonSecondDiagnostic = await builtDoctorDiagnostic(
        jsonSecond,
        fixture.bin,
        true,
      );
      const human = builtDoctor(fixture.root, fixture.bin, false);
      const humanDiagnostic = await builtDoctorDiagnostic(
        human,
        fixture.bin,
        false,
      );
      const expectedReadiness = expect.objectContaining({
        spawnObserved: true,
        outcome: "ready",
        failureCategory: null,
        stableReads: CONTROLLED_IDENTITY_STABLE_READS,
        timeoutMs: CONTROLLED_IDENTITY_READINESS_TIMEOUT_MS,
        pollMs: CONTROLLED_IDENTITY_READINESS_POLL_MS,
        requiredStableReads: CONTROLLED_IDENTITY_STABLE_READS,
        checks: READY_IDENTITY_CHECKS,
      });
      expect([
        jsonFirstDiagnostic,
        jsonSecondDiagnostic,
        humanDiagnostic,
      ]).toEqual(
        Array.from({ length: 3 }, () => ({
          status: 0,
          stderr: "empty",
          doctorFailure: null,
          readiness: [expectedReadiness, expectedReadiness],
        })),
      );
      const parsed = JSON.parse(jsonFirst.stdout) as DoctorResultV2;
      expect(parsed).toEqual(manifest);
      expect(JSON.parse(jsonSecond.stdout)).toEqual(parsed);
      expect(normalizeHuman(human.stdout)).toEqual(parsed);
      expect(jsonFirst.elapsedMs).toBeLessThanOrEqual(10_000);
      expect(jsonSecond.elapsedMs).toBeLessThanOrEqual(10_000);
      expect(human.elapsedMs).toBeLessThanOrEqual(10_000);
      expect(await probeWorkspaces()).toEqual(beforeProbeWorkspaces);
      const trace = (
        await fs.readFile(path.join(fixture.bin, "tmux.log"), "utf8")
      )
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line) as Record<string, unknown>);
      expect(trace.filter((entry) => entry.server === true)).toHaveLength(3);
      const helperReadiness = await controlledReadinessDiagnostics(fixture.bin);
      expect(helperReadiness).toHaveLength(6);
      expect(
        helperReadiness.every(
          (entry) =>
            entry.outcome === "ready" &&
            entry.spawnObserved &&
            entry.failureCategory === null &&
            entry.stableReads === CONTROLLED_IDENTITY_STABLE_READS &&
            Object.values(entry.checks).every(Boolean),
        ),
      ).toBe(true);
      expect(trace.every((entry) => entry.privateSocket === true)).toBe(true);
      expect(
        trace
          .filter((entry) => entry.server === true)
          .every(
            (entry) =>
              entry.privateConfig === true &&
              entry.workspaceMode === 0o700 &&
              entry.configMode === 0o600 &&
              entry.helperMode === 0o600,
          ),
      ).toBe(true);
    } finally {
      await fs.rm(fixture.root, { recursive: true, force: true });
    }
  });

  it("waits for two stable identities after deterministic post-spawn delay", async () => {
    const fixture = await readyRepository("valid", "delayed");
    const beforeProbeWorkspaces = await probeWorkspaces();
    try {
      const response = builtDoctor(fixture.root, fixture.bin, true);
      const diagnostic = await builtDoctorDiagnostic(
        response,
        fixture.bin,
        true,
      );
      expect(diagnostic).toMatchObject({
        status: 0,
        stderr: "empty",
        doctorFailure: null,
        readiness: [
          {
            spawnObserved: true,
            outcome: "ready",
            failureCategory: null,
            stableReads: CONTROLLED_IDENTITY_STABLE_READS,
            checks: READY_IDENTITY_CHECKS,
          },
          {
            spawnObserved: true,
            outcome: "ready",
            failureCategory: null,
            stableReads: CONTROLLED_IDENTITY_STABLE_READS,
            checks: READY_IDENTITY_CHECKS,
          },
        ],
      });
      expect(
        diagnostic.readiness.every(
          (entry) =>
            entry.attempts >=
            CONTROLLED_IDENTITY_DELAY_ATTEMPTS +
              CONTROLLED_IDENTITY_STABLE_READS,
        ),
      ).toBe(true);
      expect(await probeWorkspaces()).toEqual(beforeProbeWorkspaces);
    } finally {
      await fs.rm(fixture.root, { recursive: true, force: true });
    }
  });

  it("times out fixture identity readiness without returning a pane PID", async () => {
    const fixture = await readyRepository("valid", "timeout");
    const beforeProbeWorkspaces = await probeWorkspaces();
    try {
      const response = builtDoctor(fixture.root, fixture.bin, true);
      const diagnostic = await builtDoctorDiagnostic(
        response,
        fixture.bin,
        true,
      );
      expect(diagnostic).toMatchObject({
        status: 3,
        stderr: "empty",
        doctorFailure: {
          operation: "session-create",
          reason: "nonzero-exit",
        },
        readiness: [
          {
            spawnObserved: true,
            outcome: "timeout",
            failureCategory: "executable",
            stableReads: 0,
            timeoutMs: CONTROLLED_IDENTITY_READINESS_TIMEOUT_MS,
            pollMs: CONTROLLED_IDENTITY_READINESS_POLL_MS,
            requiredStableReads: CONTROLLED_IDENTITY_STABLE_READS,
            checks: {
              ...READY_IDENTITY_CHECKS,
              executable: false,
            },
          },
        ],
      });
      expect(diagnostic.readiness[0]?.attempts).toBeGreaterThan(1);
      expect(await probeWorkspaces()).toEqual(beforeProbeWorkspaces);
    } finally {
      await fs.rm(fixture.root, { recursive: true, force: true });
    }
  });

  it.each([
    ["nonfunctional", "socket-ready", "socket-unavailable"],
    ["malformed-create", "window-create", "malformed-output"],
    ["malformed-observe", "pane-observe", "malformed-output"],
  ] as const)(
    "reports installed %s tmux as NOT READY with cleanup proof",
    async (mode, operation, reason) => {
      const fixture = await readyRepository(mode);
      const beforeProbeWorkspaces = await probeWorkspaces();
      try {
        const response = builtDoctor(fixture.root, fixture.bin, true);
        const diagnostic = await builtDoctorDiagnostic(
          response,
          fixture.bin,
          true,
        );
        expect(diagnostic).toMatchObject({
          status: 3,
          stderr: "empty",
          doctorFailure: { operation, reason },
        });
        expect(diagnostic.readiness).toHaveLength(
          mode === "nonfunctional" ? 0 : 2,
        );
        expect(
          diagnostic.readiness.every(
            (entry) =>
              entry.outcome === "ready" &&
              entry.failureCategory === null &&
              Object.values(entry.checks).every(Boolean),
          ),
        ).toBe(true);
        const parsed = JSON.parse(response.stdout) as DoctorResultV2;
        const check = parsed.checks.find(
          (entry) => entry.id === "command.tmux",
        );
        expect(check).toMatchObject({
          status: "failed",
          evidence: {
            schemaVersion: 1,
            kind: "tmux-functional-probe",
            operation,
            reason,
            cleanup: {
              server: expect.stringMatching(/^(absent|not-created)$/),
              paneProcesses: expect.stringMatching(/^(absent|not-created)$/),
              socket: expect.stringMatching(/^(absent|not-created)$/),
              workspace: "absent",
            },
          },
        });
        expect(await probeWorkspaces()).toEqual(beforeProbeWorkspaces);
      } finally {
        await fs.rm(fixture.root, { recursive: true, force: true });
      }
    },
  );

  it("runs a controlled blocked built fixture with complete human/JSON parity and exit 3", async () => {
    const root = await fs.mkdtemp(
      path.join(os.tmpdir(), "doctor-blocked-process-"),
    );
    const bin = path.join(root, "empty-bin");
    await fs.mkdir(bin);
    const json = builtDoctor(root, bin, true);
    const human = builtDoctor(root, bin, false);
    const manifest = await readManifest<DoctorResultV2>("blocked.json");
    const parsed = JSON.parse(json.stdout) as DoctorResultV2;
    expect(json.status).toBe(3);
    expect(human.status).toBe(3);
    expect(parsed).toEqual(manifest);
    expect(parsed.ready).toBe(false);
    expect(parsed.checks).toHaveLength(24);
    expect(
      parsed.checks.every(
        (check) =>
          check.status === "failed" &&
          check.message !== "" &&
          check.remediation !== "",
      ),
    ).toBe(true);
    expect(normalizeHuman(human.stdout)).toEqual(manifest);
    await fs.rm(root, { recursive: true, force: true });
  });
});
