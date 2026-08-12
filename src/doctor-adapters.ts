import { spawn } from "node:child_process";
import * as fs from "node:fs/promises";
import path from "node:path";
import { DOCTOR_EXTERNAL_TIMEOUT_MS } from "./doctor";

export interface DoctorObservation<T> {
  readonly ok: boolean;
  readonly value: T | null;
  readonly message: string | null;
  readonly remediation: string | null;
}
export interface DoctorCommandSpec {
  readonly executable: string;
  readonly args: readonly string[];
  readonly cwd: string;
  readonly timeoutMs: 2000;
  readonly shell: false;
  readonly environment: Readonly<Record<string, string>>;
}
export interface DoctorCommandResult {
  readonly exitCode: number | null;
  readonly signal: NodeJS.Signals | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly timedOut: boolean;
  readonly launchError: string | null;
}
export interface DoctorCommandRunner {
  run(spec: DoctorCommandSpec): Promise<DoctorCommandResult>;
}
export interface DoctorRepositoryObservations {
  readonly membership: DoctorObservation<true>;
  readonly primaryWorktree: DoctorObservation<string>;
  readonly commonDirectory: DoctorObservation<string>;
  readonly githubIdentity: DoctorObservation<string>;
  readonly defaultBranch: DoctorObservation<string>;
  readonly githubHost: string | null;
}
export type DoctorExecutableName = "git" | "gh" | "tmux" | "node" | "copilot";
export type DoctorExecutableMap = Readonly<
  Record<DoctorExecutableName, DoctorObservation<string>>
>;

const EXECUTABLES: readonly DoctorExecutableName[] = [
  "git",
  "gh",
  "tmux",
  "node",
  "copilot",
];
const REDACTION_PATTERNS = [
  /gh[pousr]_[A-Za-z0-9_]{12,}/g,
  /github_pat_[A-Za-z0-9_]{12,}/g,
  /(?:token|password|secret)\s*[:=]\s*\S+/gi,
];

export class LiveDoctorCommandRunner implements DoctorCommandRunner {
  public run(spec: DoctorCommandSpec): Promise<DoctorCommandResult> {
    return new Promise((resolve) => {
      let settled = false;
      let timedOut = false;
      let escalation: NodeJS.Timeout | null = null;
      const stdout: Buffer[] = [];
      const stderr: Buffer[] = [];
      const child = spawn(spec.executable, [...spec.args], {
        cwd: spec.cwd,
        env: spec.environment,
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
      });
      const finish = (result: DoctorCommandResult): void => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (escalation !== null) clearTimeout(escalation);
        resolve(result);
      };
      child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
      child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
      child.on("error", (cause: Error) =>
        finish({
          exitCode: null,
          signal: null,
          stdout: "",
          stderr: "",
          timedOut: false,
          launchError: redact(cause.message),
        }),
      );
      child.on("close", (exitCode, signal) =>
        finish({
          exitCode,
          signal,
          stdout: redact(Buffer.concat(stdout).toString("utf8")),
          stderr: redact(Buffer.concat(stderr).toString("utf8")),
          timedOut,
          launchError: null,
        }),
      );
      const timer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGTERM");
        escalation = setTimeout(() => child.kill("SIGKILL"), 100);
      }, spec.timeoutMs);
    });
  }
}

export async function resolveDoctorExecutables(
  pathValue: string | undefined,
  cwd: string,
): Promise<DoctorExecutableMap> {
  const entries = (pathValue ?? "").split(path.delimiter);
  const pairs = await Promise.all(
    EXECUTABLES.map(
      async (name) => [name, await resolveOne(name, entries, cwd)] as const,
    ),
  );
  return Object.fromEntries(pairs) as Record<
    DoctorExecutableName,
    DoctorObservation<string>
  >;
}
async function resolveOne(
  name: DoctorExecutableName,
  entries: readonly string[],
  cwd: string,
): Promise<DoctorObservation<string>> {
  for (const entry of entries) {
    const candidate = path.resolve(entry === "" ? cwd : entry, name);
    try {
      const stat = await fs.stat(candidate);
      if (!stat.isFile()) continue;
      await fs.access(candidate, fs.constants.X_OK);
      return pass(candidate);
    } catch {
      continue;
    }
  }
  return fail(
    name + " is not an executable on PATH.",
    "Install " + name + " and add its executable directory to PATH.",
  );
}

export async function observeDoctorRepository(
  startPath: string,
  gitExecutable: string | null,
  runner: DoctorCommandRunner,
): Promise<DoctorRepositoryObservations> {
  if (gitExecutable === null) {
    const unavailable = fail<string>(
      "Git is unavailable, so this repository fact cannot be observed.",
      "Install Git and rerun Doctor from the repository.",
    );
    return {
      membership: fail(
        "Git repository membership cannot be checked.",
        "Install Git and run Doctor inside the target repository.",
      ),
      primaryWorktree: unavailable,
      commonDirectory: unavailable,
      githubIdentity: unavailable,
      defaultBranch: unavailable,
      githubHost: null,
    };
  }
  const inside = await runGit(
    runner,
    gitExecutable,
    ["rev-parse", "--is-inside-work-tree"],
    startPath,
  );
  if (!succeeded(inside) || inside.stdout.trim() !== "true") {
    const unavailable = fail<string>(
      "Repository membership is not established.",
      "Run Doctor inside a valid Git worktree.",
    );
    return {
      membership: fail(
        "Current path is not in a Git repository.",
        "Run Doctor from the target repository worktree.",
      ),
      primaryWorktree: unavailable,
      commonDirectory: unavailable,
      githubIdentity: unavailable,
      defaultBranch: unavailable,
      githubHost: null,
    };
  }
  const membership = pass<true>(true);
  const [topResult, commonResult, remotesResult] = await Promise.all([
    runGit(runner, gitExecutable, ["rev-parse", "--show-toplevel"], startPath),
    runGit(
      runner,
      gitExecutable,
      ["rev-parse", "--path-format=absolute", "--git-common-dir"],
      startPath,
    ),
    runGit(runner, gitExecutable, ["remote"], startPath),
  ]);
  const top =
    succeeded(topResult) && topResult.stdout.trim() !== ""
      ? topResult.stdout.trim()
      : null;
  const common =
    succeeded(commonResult) && path.isAbsolute(commonResult.stdout.trim())
      ? path.normalize(commonResult.stdout.trim())
      : null;
  const primary =
    common === null
      ? null
      : path.basename(common) === ".git"
        ? path.dirname(common)
        : top;
  const primaryWorktree =
    primary === null
      ? fail<string>(
          "Primary worktree could not be discovered.",
          "Repair Git worktree metadata and rerun Doctor.",
        )
      : pass(primary);
  const commonDirectory =
    common === null
      ? fail<string>(
          "Git common directory could not be discovered.",
          "Repair Git common-directory metadata and rerun Doctor.",
        )
      : pass(common);
  const remoteNames = succeeded(remotesResult)
    ? remotesResult.stdout.split(/\r?\n/).filter(Boolean)
    : [];
  const remoteResults = await Promise.all(
    remoteNames.map(async (name) => ({
      name,
      result: await runGit(
        runner,
        gitExecutable,
        ["remote", "get-url", name],
        primary ?? startPath,
      ),
    })),
  );
  const identities = new Map<string, { host: string; remote: string }>();
  for (const item of remoteResults) {
    if (!succeeded(item.result)) continue;
    const parsed = parseGitHubUrl(item.result.stdout.trim());
    if (parsed !== null)
      identities.set(parsed.identity, { host: parsed.host, remote: item.name });
  }
  const identityEntries = [...identities.entries()];
  const identity = identityEntries.length === 1 ? identityEntries[0] : null;
  const githubIdentity =
    identity === null
      ? fail<string>(
          "One unambiguous GitHub owner/repository could not be discovered.",
          "Configure exactly one GitHub repository identity in Git remotes.",
        )
      : pass(identity[0]);
  let defaultBranch: DoctorObservation<string> = fail(
    "Default branch cannot be discovered without one GitHub remote.",
    "Configure the remote HEAD symbolic ref for the repository GitHub remote.",
  );
  if (identity !== null) {
    const symbolic = await runGit(
      runner,
      gitExecutable,
      [
        "symbolic-ref",
        "--quiet",
        "refs/remotes/" + identity[1].remote + "/HEAD",
      ],
      primary ?? startPath,
    );
    const prefix = "refs/remotes/" + identity[1].remote + "/";
    const ref = symbolic.stdout.trim();
    defaultBranch =
      succeeded(symbolic) &&
      ref.startsWith(prefix) &&
      ref.length > prefix.length
        ? pass(ref.slice(prefix.length))
        : fail(
            "The repository default branch could not be discovered from remote HEAD.",
            "Run git remote set-head " +
              identity[1].remote +
              " --auto or repair the remote HEAD ref.",
          );
  }
  return {
    membership,
    primaryWorktree,
    commonDirectory,
    githubIdentity,
    defaultBranch,
    githubHost: identity?.[1].host ?? null,
  };
}

export async function observeDoctorAuthentication(input: {
  readonly runner: DoctorCommandRunner;
  readonly cwd: string;
  readonly executables: DoctorExecutableMap;
  readonly githubHost: string | null;
}): Promise<{
  readonly github: DoctorObservation<true>;
  readonly copilot: DoctorObservation<true>;
}> {
  const githubPromise =
    input.executables.gh.ok && input.githubHost !== null
      ? runProbe(
          input.runner,
          input.executables.gh.value as string,
          ["auth", "status", "--hostname", input.githubHost],
          input.cwd,
          "GitHub CLI authentication failed.",
          "Authenticate with gh auth login --hostname " +
            input.githubHost +
            ".",
        )
      : Promise.resolve(
          fail<true>(
            "GitHub CLI authentication cannot be checked without gh and a GitHub host.",
            "Install gh, configure one GitHub remote, and authenticate.",
          ),
        );
  const copilotPromise = input.executables.copilot.ok
    ? runProbe(
        input.runner,
        input.executables.copilot.value as string,
        ["--version"],
        input.cwd,
        "Copilot CLI usability check failed.",
        "Install or repair the Copilot CLI and authenticate it if required.",
      )
    : Promise.resolve(
        fail<true>(
          "Copilot CLI usability cannot be checked because copilot is unavailable.",
          "Install the Copilot CLI and add it to PATH.",
        ),
      );
  const [github, copilot] = await Promise.all([githubPromise, copilotPromise]);
  return { github, copilot };
}
async function runProbe(
  runner: DoctorCommandRunner,
  executable: string,
  args: readonly string[],
  cwd: string,
  message: string,
  remediation: string,
): Promise<DoctorObservation<true>> {
  const result = await runner.run(spec(executable, args, cwd));
  return succeeded(result)
    ? pass<true>(true)
    : fail(message + diagnostic(result), remediation);
}
async function runGit(
  runner: DoctorCommandRunner,
  executable: string,
  args: readonly string[],
  cwd: string,
): Promise<DoctorCommandResult> {
  return runner.run(spec(executable, args, cwd));
}
function spec(
  executable: string,
  args: readonly string[],
  cwd: string,
): DoctorCommandSpec {
  return {
    executable,
    args,
    cwd,
    timeoutMs: DOCTOR_EXTERNAL_TIMEOUT_MS,
    shell: false,
    environment: doctorEnvironment(process.env),
  };
}
export function doctorEnvironment(
  environment: NodeJS.ProcessEnv,
): Readonly<Record<string, string>> {
  const allowed: Record<string, string> = {};
  for (const key of [
    "PATH",
    "HOME",
    "XDG_CONFIG_HOME",
    "GH_CONFIG_DIR",
    "TMPDIR",
    "NODE_EXTRA_CA_CERTS",
  ])
    if (environment[key] !== undefined)
      allowed[key] = environment[key] as string;
  return allowed;
}
function succeeded(result: DoctorCommandResult): boolean {
  return (
    result.exitCode === 0 && !result.timedOut && result.launchError === null
  );
}
function diagnostic(result: DoctorCommandResult): string {
  if (result.timedOut) return " The bounded 2000ms probe timed out.";
  if (result.launchError !== null)
    return " The command could not be launched: " + result.launchError;
  const detail = (result.stderr || result.stdout).trim();
  return detail === ""
    ? " The command exited nonzero."
    : " " + redact(detail).slice(0, 240);
}
export function redact(value: string): string {
  let redacted = value;
  for (const pattern of REDACTION_PATTERNS)
    redacted = redacted.replace(pattern, "[REDACTED]");
  return redacted.slice(0, 4096);
}
function pass<T>(value: T): DoctorObservation<T> {
  return { ok: true, value, message: null, remediation: null };
}
function fail<T>(message: string, remediation: string): DoctorObservation<T> {
  return { ok: false, value: null, message, remediation };
}
function parseGitHubUrl(
  value: string,
): { readonly host: string; readonly identity: string } | null {
  const match =
    /^(?:https?:\/\/|ssh:\/\/git@|git@)(github\.com)(?::|\/)([^/\s]+)\/([^/\s]+?)(?:\.git)?$/.exec(
      value,
    );
  return match === null
    ? null
    : { host: match[1].toLowerCase(), identity: match[2] + "/" + match[3] };
}
