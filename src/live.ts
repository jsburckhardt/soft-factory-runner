/* istanbul ignore file -- live command adapters require local GitHub, tmux, and Copilot; deterministic contracts are covered through injected ports */
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import * as fs from "node:fs/promises";
import path from "node:path";
import type {
  IssueFacts,
  PullRequestFacts,
  RepositoryFacts,
  TmuxIdentity,
} from "./domain";
import { normalizeRepositoryName } from "./domain";
import { RunnerError } from "./errors";
import type {
  FilePort,
  GitHubPort,
  GitPort,
  ProcessPort,
  RunnerPorts,
  TmuxPort,
} from "./ports";

interface CommandResult {
  readonly exitCode: number;
  readonly signal: NodeJS.Signals | null;
  readonly stdout: string;
  readonly stderr: string;
}

class CommandExecutor {
  public run(
    executable: string,
    args: readonly string[],
    cwd: string,
    timeoutMs: number,
  ): Promise<CommandResult> {
    return new Promise((resolve, reject) => {
      const child = spawn(executable, args, {
        cwd,
        env: allowedEnvironment(),
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
      });
      const stdout: Buffer[] = [];
      const stderr: Buffer[] = [];
      child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
      child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
      let timedOut = false;
      let escalation: NodeJS.Timeout | null = null;
      const timer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGTERM");
        escalation = setTimeout(() => child.kill("SIGKILL"), 1_000);
      }, timeoutMs);
      child.on("error", (cause: Error) => {
        clearTimeout(timer);
        if (escalation !== null) clearTimeout(escalation);
        reject(
          new RunnerError(
            "EXTERNAL_COMMAND_FAILED",
            `Could not start ${executable}.`,
            `Install ${executable} and ensure it is available on PATH.`,
            { cause },
          ),
        );
      });
      child.on("close", (exitCode, signal) => {
        clearTimeout(timer);
        if (escalation !== null) clearTimeout(escalation);
        if (timedOut) {
          reject(
            new RunnerError(
              "EXTERNAL_COMMAND_FAILED",
              `${executable} timed out after ${timeoutMs}ms.`,
              "Resolve the external command delay and retry.",
              { details: { executable, timeoutMs } },
            ),
          );
          return;
        }
        resolve({
          exitCode: exitCode ?? 1,
          signal,
          stdout: Buffer.concat(stdout).toString("utf8"),
          stderr: Buffer.concat(stderr).toString("utf8"),
        });
      });
    });
  }

  public runInherited(
    executable: string,
    args: readonly string[],
    cwd: string,
  ): Promise<CommandResult> {
    return new Promise((resolve, reject) => {
      const child = spawn(executable, args, {
        cwd,
        env: allowedEnvironment(),
        shell: false,
        stdio: "inherit",
      });
      child.on("error", (cause: Error) =>
        reject(
          new RunnerError(
            "EXTERNAL_COMMAND_FAILED",
            `Could not start ${executable}.`,
            `Install ${executable} and ensure it is available on PATH.`,
            { cause },
          ),
        ),
      );
      child.on("close", (exitCode, signal) =>
        resolve({ exitCode: exitCode ?? 1, signal, stdout: "", stderr: "" }),
      );
    });
  }
}

class NodeFilePort implements FilePort {
  public async readText(filePath: string): Promise<string | null> {
    try {
      return await fs.readFile(filePath, "utf8");
    } catch (cause: unknown) {
      if (nodeErrorCode(cause) === "ENOENT") return null;
      throw fileFailure("read", filePath, cause);
    }
  }
  public async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch (cause: unknown) {
      if (nodeErrorCode(cause) === "ENOENT") return false;
      throw fileFailure("inspect", filePath, cause);
    }
  }
  public async exclusiveCreate(
    filePath: string,
    content: string,
  ): Promise<boolean> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    try {
      await fs.writeFile(filePath, content, {
        encoding: "utf8",
        flag: "wx",
        mode: 0o600,
      });
      return true;
    } catch (cause: unknown) {
      if (nodeErrorCode(cause) === "EEXIST") return false;
      throw fileFailure("create", filePath, cause);
    }
  }
  public async atomicWrite(filePath: string, content: string): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const temporary = `${filePath}.tmp-${process.pid}-${randomUUID()}`;
    try {
      const handle = await fs.open(temporary, "wx", 0o600);
      try {
        await handle.writeFile(content, "utf8");
        await handle.sync();
      } finally {
        await handle.close();
      }
      await fs.rename(temporary, filePath);
    } catch (cause: unknown) {
      try {
        await fs.rm(temporary, { force: true });
      } catch (cleanupCause: unknown) {
        throw fileFailure(
          "clean temporary snapshot after failed write",
          temporary,
          cleanupCause,
        );
      }
      throw fileFailure("atomically write", filePath, cause);
    }
  }
  public async append(filePath: string, content: string): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    try {
      await fs.appendFile(filePath, content, { encoding: "utf8", mode: 0o600 });
    } catch (cause: unknown) {
      throw fileFailure("append", filePath, cause);
    }
  }
}

class LiveGitPort implements GitPort {
  public constructor(private readonly commands: CommandExecutor) {}
  public async discover(startPath: string): Promise<RepositoryFacts> {
    const top = await this.required(
      ["rev-parse", "--show-toplevel"],
      startPath,
      15_000,
      "REPOSITORY_INVALID",
    );
    const common = await this.required(
      ["rev-parse", "--path-format=absolute", "--git-common-dir"],
      startPath,
      15_000,
      "REPOSITORY_INVALID",
    );
    const commonDirectory = common.trim();
    const root =
      path.basename(commonDirectory) === ".git"
        ? path.dirname(commonDirectory)
        : top.trim();
    const remotesText = await this.required(
      ["remote"],
      root,
      15_000,
      "REPOSITORY_INVALID",
    );
    const remotes = remotesText.split(/\r?\n/).filter(Boolean);
    const identities = new Set<string>();
    for (const remote of remotes) {
      const url = await this.required(
        ["remote", "get-url", remote],
        root,
        15_000,
        "REPOSITORY_INVALID",
      );
      const identity = parseGitHubIdentity(url.trim());
      if (identity !== null) identities.add(identity);
    }
    if (identities.size !== 1) {
      throw new RunnerError(
        "REPOSITORY_INVALID",
        "Could not resolve one owner-qualified GitHub repository.",
        "Configure exactly one unambiguous GitHub repository remote.",
      );
    }
    const nameWithOwner = [...identities][0];
    return {
      root,
      commonDirectory,
      identity: {
        nameWithOwner,
        normalizedName: normalizeRepositoryName(nameWithOwner),
      },
      remotes,
      pushDefault: await this.optionalConfig(root, "remote.pushDefault"),
      currentBranchRemote: await this.optionalConfig(root, "", true),
    };
  }
  public async branchExists(
    repositoryRoot: string,
    branch: string,
  ): Promise<boolean> {
    const result = await this.commands.run(
      "git",
      ["show-ref", "--verify", "--quiet", `refs/heads/${branch}`],
      repositoryRoot,
      15_000,
    );
    if (result.exitCode === 0) return true;
    if (result.exitCode === 1) return false;
    throw commandFailure("git branch observation", result);
  }
  public async registeredWorktreeExists(
    repositoryRoot: string,
    worktreePath: string,
  ): Promise<boolean> {
    const output = await this.required(
      ["worktree", "list", "--porcelain"],
      repositoryRoot,
      15_000,
      "REPOSITORY_INVALID",
    );
    return output
      .split(/\r?\n/)
      .some((line) => line === `worktree ${worktreePath}`);
  }
  public async fetch(repositoryRoot: string, remote: string): Promise<void> {
    const result = await this.commands.run(
      "git",
      ["fetch", "--prune", remote],
      repositoryRoot,
      30_000,
    );
    if (result.exitCode !== 0)
      throw new RunnerError(
        "REMOTE_FETCH_FAILED",
        `Fetching remote ${remote} failed.`,
        "Check remote access and retry.",
        { details: { stderr: redact(result.stderr) } },
      );
  }
  public async advertisedHead(
    repositoryRoot: string,
    remote: string,
  ): Promise<{ readonly branch: string; readonly sha: string }> {
    const result = await this.commands.run(
      "git",
      ["ls-remote", "--symref", remote, "HEAD"],
      repositoryRoot,
      30_000,
    );
    if (result.exitCode !== 0)
      throw new RunnerError(
        "REMOTE_HEAD_MISSING",
        `Could not query advertised HEAD for ${remote}.`,
        "Ensure the remote has a symbolic default branch.",
        { details: { stderr: redact(result.stderr) } },
      );
    const ref = /^ref:\s+refs\/heads\/([^\s]+)\s+HEAD$/m.exec(result.stdout);
    const sha = /^([0-9a-f]{40,64})\s+HEAD$/m.exec(result.stdout);
    if (ref === null || sha === null)
      throw new RunnerError(
        "REMOTE_HEAD_MISSING",
        `Remote ${remote} did not advertise a complete symbolic HEAD.`,
        "Configure a remote default branch and retry.",
      );
    return { branch: ref[1], sha: sha[1] };
  }
  public async trackingSha(
    repositoryRoot: string,
    remote: string,
    branch: string,
  ): Promise<string | null> {
    const result = await this.commands.run(
      "git",
      ["rev-parse", "--verify", `refs/remotes/${remote}/${branch}`],
      repositoryRoot,
      15_000,
    );
    return result.exitCode === 0 ? result.stdout.trim() : null;
  }
  public async createBranch(
    repositoryRoot: string,
    branch: string,
    sha: string,
  ): Promise<void> {
    await this.required(
      ["branch", branch, sha],
      repositoryRoot,
      15_000,
      "EXTERNAL_COMMAND_FAILED",
    );
  }
  public async addWorktree(
    repositoryRoot: string,
    worktreePath: string,
    branch: string,
  ): Promise<void> {
    await this.required(
      ["worktree", "add", worktreePath, branch],
      repositoryRoot,
      30_000,
      "EXTERNAL_COMMAND_FAILED",
    );
  }
  private async optionalConfig(
    root: string,
    key: string,
    currentBranch = false,
  ): Promise<string | null> {
    let actualKey = key;
    if (currentBranch) {
      const branch = await this.commands.run(
        "git",
        ["symbolic-ref", "--quiet", "--short", "HEAD"],
        root,
        15_000,
      );
      if (branch.exitCode !== 0) return null;
      actualKey = `branch.${branch.stdout.trim()}.remote`;
    }
    const result = await this.commands.run(
      "git",
      ["config", "--get", actualKey],
      root,
      15_000,
    );
    return result.exitCode === 0 && result.stdout.trim() !== ""
      ? result.stdout.trim()
      : null;
  }
  private async required(
    args: readonly string[],
    cwd: string,
    timeout: number,
    code: "REPOSITORY_INVALID" | "EXTERNAL_COMMAND_FAILED",
  ): Promise<string> {
    const result = await this.commands.run("git", args, cwd, timeout);
    if (result.exitCode !== 0)
      throw new RunnerError(
        code,
        `Git command failed: git ${args[0]}`,
        "Inspect the repository and Git command diagnostics before retrying.",
        { details: { stderr: redact(result.stderr) } },
      );
    return result.stdout;
  }
}

class LiveGitHubPort implements GitHubPort {
  public constructor(private readonly commands: CommandExecutor) {}
  public async loadIssue(
    repository: string,
    issueNumber: number,
  ): Promise<IssueFacts | null> {
    const issueResult = await this.commands.run(
      "gh",
      [
        "issue",
        "view",
        String(issueNumber),
        "--repo",
        repository,
        "--json",
        "number,title,body,state,labels",
      ],
      process.cwd(),
      15_000,
    );
    if (issueResult.exitCode !== 0) {
      if (/not found|could not resolve/i.test(issueResult.stderr)) return null;
      throw new RunnerError(
        "GITHUB_PROOF_INCOMPLETE",
        "GitHub issue lookup failed.",
        "Authenticate gh, restore connectivity, and retry.",
        { details: { stderr: redact(issueResult.stderr) } },
      );
    }
    const issue = parseObject(issueResult.stdout, "GitHub issue");
    const labels = readNameArray(issue.labels);
    const prsResult = await this.commands.run(
      "gh",
      [
        "pr",
        "list",
        "--repo",
        repository,
        "--state",
        "open",
        "--limit",
        "1001",
        "--json",
        "number,headRefName,closingIssuesReferences",
      ],
      process.cwd(),
      15_000,
    );
    if (prsResult.exitCode !== 0)
      throw new RunnerError(
        "GITHUB_PROOF_INCOMPLETE",
        "Open pull-request query failed.",
        "Restore complete GitHub query access and retry.",
      );
    const pullRequests = parsePullRequests(prsResult.stdout);
    const [owner, name] = repository.split("/");
    const blockerQuery =
      "query($owner:String!,$name:String!,$number:Int!){repository(owner:$owner,name:$name){issue(number:$number){blockedBy(first:100){nodes{number state} pageInfo{hasNextPage}}}}}";
    const blockersResult = await this.commands.run(
      "gh",
      [
        "api",
        "graphql",
        "-f",
        `query=${blockerQuery}`,
        "-F",
        `owner=${owner}`,
        "-F",
        `name=${name}`,
        "-F",
        `number=${issueNumber}`,
      ],
      process.cwd(),
      15_000,
    );
    if (blockersResult.exitCode !== 0)
      throw new RunnerError(
        "GITHUB_PROOF_INCOMPLETE",
        "Blocked-by relationship query failed.",
        "Use a GitHub/gh version that exposes complete issue dependency facts.",
      );
    const blockerFacts = parseBlockers(blockersResult.stdout);
    return {
      number: requireNumber(issue, "number"),
      title: requireString(issue, "title"),
      body: requireString(issue, "body"),
      state: requireString(issue, "state") === "OPEN" ? "OPEN" : "CLOSED",
      labels,
      openBlockers: blockerFacts.open,
      openPullRequests: pullRequests.slice(0, 1000),
      complete: pullRequests.length <= 1000 && blockerFacts.complete,
    };
  }
}

class LiveTmuxPort implements TmuxPort {
  public constructor(private readonly commands: CommandExecutor) {}
  public async createIssueWindow(input: {
    readonly sessionName: string;
    readonly windowName: string;
    readonly cwd: string;
    readonly executable: string;
    readonly args: readonly string[];
  }): Promise<TmuxIdentity> {
    const session = await this.commands.run(
      "tmux",
      ["has-session", "-t", input.sessionName],
      input.cwd,
      15_000,
    );
    if (session.exitCode !== 0) {
      const created = await this.commands.run(
        "tmux",
        [
          "new-session",
          "-d",
          "-s",
          input.sessionName,
          "-n",
          "dashboard",
          "-c",
          input.cwd,
        ],
        input.cwd,
        15_000,
      );
      if (created.exitCode !== 0)
        throw commandFailure("tmux session creation", created);
    }
    const existing = await this.commands.run(
      "tmux",
      ["list-windows", "-t", input.sessionName, "-F", "#{window_name}"],
      input.cwd,
      15_000,
    );
    if (existing.exitCode !== 0)
      throw commandFailure("tmux window observation", existing);
    if (existing.stdout.split(/\r?\n/).includes(input.windowName))
      throw new RunnerError(
        "RESOURCE_OWNERSHIP_UNKNOWN",
        `tmux window ${input.windowName} already exists.`,
        "Preserve the unknown window and reconcile ownership manually.",
      );
    const created = await this.commands.run(
      "tmux",
      [
        "new-window",
        "-d",
        "-P",
        "-F",
        "#{window_id}\t#{pane_id}",
        "-t",
        input.sessionName,
        "-n",
        input.windowName,
        "-c",
        input.cwd,
        input.executable,
        ...input.args,
      ],
      input.cwd,
      15_000,
    );
    if (created.exitCode !== 0)
      throw commandFailure("tmux issue-window creation", created);
    const [windowId, paneId] = created.stdout.trim().split("\t");
    if (!windowId || !paneId)
      throw new RunnerError(
        "EXTERNAL_COMMAND_FAILED",
        "tmux returned malformed window identity.",
        "Upgrade tmux and retry after preserving existing resources.",
      );
    return {
      sessionName: input.sessionName,
      windowName: input.windowName,
      windowId,
      paneId,
      cwd: input.cwd,
    };
  }
  public async observe(target: TmuxIdentity): Promise<TmuxIdentity | null> {
    const result = await this.commands.run(
      "tmux",
      [
        "list-panes",
        "-t",
        `${target.sessionName}:${target.windowName}`,
        "-F",
        "#{window_id}\t#{pane_id}\t#{pane_current_path}",
      ],
      target.cwd,
      15_000,
    );
    if (result.exitCode !== 0) return null;
    const rows = result.stdout.trim().split(/\r?\n/).filter(Boolean);
    if (rows.length !== 1)
      throw new RunnerError(
        "TMUX_TARGET_MISMATCH",
        "tmux observation was ambiguous.",
        "Preserve all panes and reconcile the recorded target.",
      );
    const [windowId, paneId, cwd] = rows[0].split("\t");
    return {
      sessionName: target.sessionName,
      windowName: target.windowName,
      windowId,
      paneId,
      cwd,
    };
  }
  public async attach(target: TmuxIdentity): Promise<void> {
    const selected = await this.commands.run(
      "tmux",
      ["select-window", "-t", `${target.sessionName}:${target.windowName}`],
      target.cwd,
      15_000,
    );
    if (selected.exitCode !== 0)
      throw commandFailure("tmux window selection", selected);
    const pane = await this.commands.run(
      "tmux",
      ["select-pane", "-t", target.paneId],
      target.cwd,
      15_000,
    );
    if (pane.exitCode !== 0) throw commandFailure("tmux pane selection", pane);
    const attached = await this.commands.runInherited(
      "tmux",
      ["attach-session", "-t", target.sessionName],
      target.cwd,
    );
    if (attached.exitCode !== 0) throw commandFailure("tmux attach", attached);
  }
}

class LiveProcessPort implements ProcessPort {
  public runCopilot(input: {
    readonly executable: "copilot";
    readonly args: readonly string[];
    readonly cwd: string;
    readonly environment: Readonly<Record<string, string>>;
  }): Promise<{ readonly exitCode: number }> {
    return new Promise((resolve, reject) => {
      const child = spawn(input.executable, input.args, {
        cwd: input.cwd,
        shell: false,
        stdio: "inherit",
        env: { ...allowedEnvironment(), ...input.environment },
      });
      child.on("error", (cause: Error) =>
        reject(
          new RunnerError(
            "EXTERNAL_COMMAND_FAILED",
            "Could not launch Copilot.",
            "Install and authenticate Copilot CLI, then retry.",
            { cause },
          ),
        ),
      );
      child.on("close", (exitCode) => resolve({ exitCode: exitCode ?? 1 }));
    });
  }
}

export function createLivePorts(): RunnerPorts {
  const commands = new CommandExecutor();
  return {
    files: new NodeFilePort(),
    git: new LiveGitPort(commands),
    github: new LiveGitHubPort(commands),
    tmux: new LiveTmuxPort(commands),
    processes: new LiveProcessPort(),
    clock: { now: () => new Date().toISOString() },
    ids: { nextOwnerId: () => randomUUID(), nextRunId: () => randomUUID() },
  };
}

function allowedEnvironment(): NodeJS.ProcessEnv {
  const keys = [
    "PATH",
    "HOME",
    "USERPROFILE",
    "XDG_CONFIG_HOME",
    "GH_CONFIG_DIR",
    "GH_TOKEN",
    "GITHUB_TOKEN",
    "COPILOT_GITHUB_TOKEN",
    "SHELL",
    "TERM",
    "TMPDIR",
  ];
  return Object.fromEntries(
    keys.flatMap((key) =>
      process.env[key] === undefined ? [] : [[key, process.env[key]]],
    ),
  );
}
function nodeErrorCode(value: unknown): string | null {
  return typeof value === "object" &&
    value !== null &&
    "code" in value &&
    typeof value.code === "string"
    ? value.code
    : null;
}
function fileFailure(
  operation: string,
  filePath: string,
  cause: unknown,
): RunnerError {
  return new RunnerError(
    "EXTERNAL_COMMAND_FAILED",
    `Could not ${operation} ${filePath}.`,
    "Check filesystem permissions and preserve existing state before retrying.",
    { cause },
  );
}
function commandFailure(operation: string, result: CommandResult): RunnerError {
  return new RunnerError(
    "EXTERNAL_COMMAND_FAILED",
    `${operation} failed.`,
    "Inspect the external tool state and retry safely.",
    {
      details: {
        exitCode: result.exitCode,
        signal: result.signal,
        stderr: redact(result.stderr),
      },
    },
  );
}
function redact(value: string): string {
  return value
    .replace(/(token|password|authorization)[=:]\s*\S+/gi, "$1=[REDACTED]")
    .slice(0, 2000);
}
function parseGitHubIdentity(url: string): string | null {
  const match = /github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/.exec(url);
  return match === null ? null : `${match[1]}/${match[2]}`;
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function parseObject(text: string, label: string): Record<string, unknown> {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (cause: unknown) {
    throw new RunnerError(
      "GITHUB_PROOF_INCOMPLETE",
      `${label} response was malformed JSON.`,
      "Retry after restoring compatible gh output.",
      { cause },
    );
  }
  if (!isRecord(value))
    throw new RunnerError(
      "GITHUB_PROOF_INCOMPLETE",
      `${label} response had an unexpected shape.`,
      "Retry with a compatible gh version.",
    );
  return value;
}
function requireString(
  record: Readonly<Record<string, unknown>>,
  key: string,
): string {
  const value = record[key];
  if (typeof value !== "string")
    throw new RunnerError(
      "GITHUB_PROOF_INCOMPLETE",
      `GitHub field ${key} was missing.`,
      "Retry with a compatible gh response.",
    );
  return value;
}
function requireNumber(
  record: Readonly<Record<string, unknown>>,
  key: string,
): number {
  const value = record[key];
  if (typeof value !== "number")
    throw new RunnerError(
      "GITHUB_PROOF_INCOMPLETE",
      `GitHub field ${key} was missing.`,
      "Retry with a compatible gh response.",
    );
  return value;
}
function readNameArray(value: unknown): string[] {
  if (!Array.isArray(value))
    throw new RunnerError(
      "GITHUB_PROOF_INCOMPLETE",
      "GitHub labels response was not a list.",
      "Retry with a compatible gh response.",
    );
  return value.map((entry, index) => {
    if (
      !isRecord(entry) ||
      typeof entry.name !== "string" ||
      entry.name.trim() === ""
    )
      throw new RunnerError(
        "GITHUB_PROOF_INCOMPLETE",
        `GitHub labels entry ${index + 1} was malformed.`,
        "Retry with a compatible gh response that includes every label name.",
      );
    return entry.name;
  });
}
function parsePullRequests(text: string): PullRequestFacts[] {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (cause: unknown) {
    throw new RunnerError(
      "GITHUB_PROOF_INCOMPLETE",
      "Pull-request response was malformed.",
      "Retry with compatible gh output.",
      { cause },
    );
  }
  if (!Array.isArray(value))
    throw new RunnerError(
      "GITHUB_PROOF_INCOMPLETE",
      "Pull-request response was not a list.",
      "Retry with compatible gh output.",
    );
  return value.map((entry, index) => {
    if (
      !isRecord(entry) ||
      !Number.isSafeInteger(entry.number) ||
      (entry.number as number) <= 0 ||
      typeof entry.headRefName !== "string" ||
      entry.headRefName.trim() === "" ||
      !Array.isArray(entry.closingIssuesReferences)
    )
      throw new RunnerError(
        "GITHUB_PROOF_INCOMPLETE",
        `Pull-request entry ${index + 1} was malformed.`,
        "Retry with compatible gh output containing complete pull-request and closing-issue fields.",
      );
    const closesIssues = entry.closingIssuesReferences.map(
      (issue: unknown, issueIndex: number) => {
        if (
          !isRecord(issue) ||
          !Number.isSafeInteger(issue.number) ||
          (issue.number as number) <= 0
        )
          throw new RunnerError(
            "GITHUB_PROOF_INCOMPLETE",
            `Pull-request entry ${index + 1} closing-issue entry ${issueIndex + 1} was malformed.`,
            "Retry with compatible gh output containing every closing issue number.",
          );
        return issue.number as number;
      },
    );
    return {
      number: entry.number as number,
      headBranch: entry.headRefName,
      closesIssues,
    };
  });
}
function parseBlockers(text: string): {
  readonly open: number[];
  readonly complete: boolean;
} {
  const root = parseObject(text, "Blocked-by");
  const data = root.data;
  if (
    !isRecord(data) ||
    !isRecord(data.repository) ||
    !isRecord(data.repository.issue) ||
    !isRecord(data.repository.issue.blockedBy)
  )
    throw new RunnerError(
      "GITHUB_PROOF_INCOMPLETE",
      "Blocked-by response was incomplete.",
      "Retry with compatible GitHub dependency support.",
    );
  const blockedBy = data.repository.issue.blockedBy;
  if (!Array.isArray(blockedBy.nodes))
    throw new RunnerError(
      "GITHUB_PROOF_INCOMPLETE",
      "Blocked-by nodes response was not a list.",
      "Retry with compatible GitHub dependency support.",
    );
  const open = blockedBy.nodes.flatMap((node, index) => {
    if (
      !isRecord(node) ||
      !Number.isSafeInteger(node.number) ||
      (node.number as number) <= 0 ||
      (node.state !== "OPEN" && node.state !== "CLOSED")
    )
      throw new RunnerError(
        "GITHUB_PROOF_INCOMPLETE",
        `Blocked-by entry ${index + 1} was malformed.`,
        "Retry with compatible GitHub dependency output containing every blocker number and state.",
      );
    return node.state === "OPEN" ? [node.number as number] : [];
  });
  if (
    !isRecord(blockedBy.pageInfo) ||
    typeof blockedBy.pageInfo.hasNextPage !== "boolean"
  )
    throw new RunnerError(
      "GITHUB_PROOF_INCOMPLETE",
      "Blocked-by pagination response was incomplete.",
      "Retry with compatible GitHub dependency support.",
    );
  return {
    open,
    complete: !blockedBy.pageInfo.hasNextPage,
  };
}
