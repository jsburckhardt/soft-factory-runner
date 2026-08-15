/* istanbul ignore file -- live command adapters require local GitHub, tmux, and Copilot; deterministic contracts are covered through injected ports */
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import * as fs from "node:fs/promises";
import path from "node:path";
import type {
  CompletionPullRequestFacts,
  IssueFacts,
  LaunchIntentV1,
  MergedPullRequestFactsV1,
  ProcessIdentityV1,
  PullRequestFacts,
  RepositoryFacts,
  TmuxIdentity,
  WorktreeObservationV1,
} from "./domain";
import { normalizeRepositoryName } from "./domain";
import { RunnerError } from "./errors";
import {
  parseTmuxIdentityResult,
  TMUX_CREATE_IDENTITY_FORMAT,
  TMUX_OBSERVE_IDENTITY_FORMAT,
} from "./tmux-identity";
import type {
  FilePort,
  GitHubPort,
  GitPort,
  ProcessPort,
  RunnerPorts,
  SpawnedProcessV1,
  TmuxPort,
} from "./ports";

export interface CommandResult {
  readonly exitCode: number;
  readonly signal: NodeJS.Signals | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly stdoutBuffer: Buffer;
  readonly stderrBuffer: Buffer;
  readonly stdoutByteCount: number;
  readonly stderrByteCount: number;
}

export interface CommandRunner {
  run(
    executable: string,
    args: readonly string[],
    cwd: string,
    timeoutMs: number,
    shell?: false,
  ): Promise<CommandResult>;
  runInherited(
    executable: string,
    args: readonly string[],
    cwd: string,
  ): Promise<CommandResult>;
}

class CommandExecutor implements CommandRunner {
  public run(
    executable: string,
    args: readonly string[],
    cwd: string,
    timeoutMs: number,
    shell: false = false,
  ): Promise<CommandResult> {
    return new Promise((resolve, reject) => {
      const child = spawn(executable, args, {
        cwd,
        env: allowedEnvironment(),
        shell,
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
        const stdoutBuffer = Buffer.concat(stdout);
        const stderrBuffer = Buffer.concat(stderr);
        resolve({
          exitCode: exitCode ?? 1,
          signal,
          stdout: stdoutBuffer.toString("utf8"),
          stderr: stderrBuffer.toString("utf8"),
          stdoutBuffer,
          stderrBuffer,
          stdoutByteCount: stdoutBuffer.byteLength,
          stderrByteCount: stderrBuffer.byteLength,
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
        resolve({
          exitCode: exitCode ?? 1,
          signal,
          stdout: "",
          stderr: "",
          stdoutBuffer: Buffer.alloc(0),
          stderrBuffer: Buffer.alloc(0),
          stdoutByteCount: 0,
          stderrByteCount: 0,
        }),
      );
    });
  }
}

export type PublicationOperation = "mutable" | "immutable";
export type PublicationStep =
  | "temporary-created"
  | "temporary-synced"
  | "before-publish"
  | "published"
  | "directory-synced";
export interface PublicationFaultPort {
  step(
    operation: PublicationOperation,
    step: PublicationStep,
    destination: string,
  ): Promise<void>;
}
const NO_PUBLICATION_FAULTS: PublicationFaultPort = {
  step: async () => undefined,
};

export class NodeFilePort implements FilePort {
  public constructor(
    private readonly publicationFaults: PublicationFaultPort = NO_PUBLICATION_FAULTS,
  ) {}
  public async readText(filePath: string): Promise<string | null> {
    try {
      return await fs.readFile(filePath, "utf8");
    } catch (cause: unknown) {
      if (nodeErrorCode(cause) === "ENOENT") return null;
      throw fileFailure("read", filePath, cause);
    }
  }
  public async readAgentResult(worktreePath: string): Promise<string | null> {
    return this.readText(
      path.join(worktreePath, ".soft-factory", "agent-result.json"),
    );
  }
  public async readRpivStatus(worktreePath: string): Promise<string | null> {
    return this.readText(
      path.join(worktreePath, ".soft-factory", "rpiv-status.json"),
    );
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
  public async list(directoryPath: string): Promise<readonly string[]> {
    try {
      return await fs.readdir(directoryPath);
    } catch (cause: unknown) {
      if (nodeErrorCode(cause) === "ENOENT") return [];
      throw fileFailure("enumerate", directoryPath, cause);
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
  public async immutableWrite(
    filePath: string,
    content: string,
  ): Promise<boolean> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const temporary = filePath + ".tmp-" + process.pid + "-" + randomUUID();
    try {
      const handle = await fs.open(temporary, "wx", 0o600);
      try {
        await this.publicationFaults.step(
          "immutable",
          "temporary-created",
          filePath,
        );
        await handle.writeFile(content, "utf8");
        await handle.sync();
        await this.publicationFaults.step(
          "immutable",
          "temporary-synced",
          filePath,
        );
      } finally {
        await handle.close();
      }
      await this.publicationFaults.step(
        "immutable",
        "before-publish",
        filePath,
      );
      try {
        await fs.link(temporary, filePath);
      } catch (cause: unknown) {
        if (nodeErrorCode(cause) === "EEXIST") return false;
        throw cause;
      }
      await this.publicationFaults.step("immutable", "published", filePath);
      const directory = await fs.open(path.dirname(filePath), "r");
      try {
        await directory.sync();
        await this.publicationFaults.step(
          "immutable",
          "directory-synced",
          filePath,
        );
      } finally {
        await directory.close();
      }
      return true;
    } catch (cause: unknown) {
      throw fileFailure("immutably publish", filePath, cause);
    } finally {
      await fs.rm(temporary, { force: true });
    }
  }
  public async atomicWrite(filePath: string, content: string): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const temporary = `${filePath}.tmp-${process.pid}-${randomUUID()}`;
    try {
      const handle = await fs.open(temporary, "wx", 0o600);
      try {
        await this.publicationFaults.step(
          "mutable",
          "temporary-created",
          filePath,
        );
        await handle.writeFile(content, "utf8");
        await handle.sync();
        await this.publicationFaults.step(
          "mutable",
          "temporary-synced",
          filePath,
        );
      } finally {
        await handle.close();
      }
      await this.publicationFaults.step("mutable", "before-publish", filePath);
      await fs.rename(temporary, filePath);
      await this.publicationFaults.step("mutable", "published", filePath);
      const directory = await fs.open(path.dirname(filePath), "r");
      try {
        await directory.sync();
        await this.publicationFaults.step(
          "mutable",
          "directory-synced",
          filePath,
        );
      } finally {
        await directory.close();
      }
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
  public async compareAndDelete(
    filePath: string,
    expectedContent: string,
  ): Promise<boolean> {
    let handle: fs.FileHandle;
    try {
      handle = await fs.open(filePath, "r");
    } catch (cause: unknown) {
      if (nodeErrorCode(cause) === "ENOENT") return false;
      throw fileFailure("open for compare-and-delete", filePath, cause);
    }
    try {
      const actual = await handle.readFile("utf8");
      if (actual !== expectedContent) return false;
      const before = await handle.stat();
      const current = await fs.stat(filePath);
      if (before.dev !== current.dev || before.ino !== current.ino)
        return false;
      await fs.unlink(filePath);
      return true;
    } catch (cause: unknown) {
      if (nodeErrorCode(cause) === "ENOENT") return false;
      throw fileFailure("compare-and-delete", filePath, cause);
    } finally {
      await handle.close();
    }
  }
}

class LiveGitPort implements GitPort {
  public constructor(private readonly commands: CommandRunner) {}
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
  public async observeWorktree(
    repositoryRoot: string,
    worktreePath: string,
  ): Promise<WorktreeObservationV1> {
    const output = await this.required(
      ["worktree", "list", "--porcelain"],
      repositoryRoot,
      15_000,
      "REPOSITORY_INVALID",
    );
    const blocks = output.split(/\r?\n\r?\n/);
    const block = blocks.find((entry) =>
      entry.split(/\r?\n/).includes(`worktree ${worktreePath}`),
    );
    let pathExists = true;
    try {
      await fs.access(worktreePath);
    } catch (cause: unknown) {
      if (nodeErrorCode(cause) === "ENOENT") pathExists = false;
      else throw fileFailure("inspect worktree", worktreePath, cause);
    }
    const lines = block?.split(/\r?\n/) ?? [];
    const branchLine = lines.find((line) =>
      line.startsWith("branch refs/heads/"),
    );
    const headLine = lines.find((line) => line.startsWith("HEAD "));
    let staged = false;
    let unstaged = false;
    let untracked = false;
    if (pathExists) {
      const status = await this.required(
        ["status", "--porcelain=v1", "--untracked-files=all"],
        worktreePath,
        15_000,
        "EXTERNAL_COMMAND_FAILED",
      );
      for (const row of status.split(/\r?\n/).filter(Boolean)) {
        if (row.startsWith("??")) untracked = true;
        else {
          if (row[0] !== " ") staged = true;
          if (row[1] !== " ") unstaged = true;
        }
      }
    }
    return {
      pathExists,
      registered: block !== undefined,
      branch:
        branchLine === undefined
          ? null
          : branchLine.slice("branch refs/heads/".length),
      headSha: headLine === undefined ? null : headLine.slice(5),
      staged,
      unstaged,
      untracked,
    };
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
  public async localHeadSha(worktreePath: string): Promise<string | null> {
    return this.observedSha(["rev-parse", "--verify", "HEAD"], worktreePath);
  }
  public async remoteBranchSha(
    repositoryRoot: string,
    remote: string,
    branch: string,
  ): Promise<string | null> {
    const ref = `refs/heads/${branch}`;
    let result: CommandResult;
    try {
      result = await this.commands.run(
        "git",
        ["ls-remote", "--refs", remote, ref],
        repositoryRoot,
        15_000,
        false,
      );
    } catch (cause: unknown) {
      throw incompleteRemoteProof(
        "The authoritative remote branch query did not complete.",
        cause,
      );
    }
    if (result.exitCode !== 0)
      throw incompleteRemoteProof(
        "The authoritative remote branch query failed.",
        undefined,
        result,
      );
    return parseRemoteBranchAdvertisement(result.stdout, ref);
  }
  private async observedSha(
    args: readonly string[],
    cwd: string,
  ): Promise<string | null> {
    const result = await this.commands.run("git", args, cwd, 15_000);
    if (result.exitCode !== 0) return null;
    const sha = result.stdout.trim();
    if (!/^[0-9a-f]{40,64}$/.test(sha))
      throw new RunnerError(
        "COMPLETION_PROOF_INCOMPLETE",
        "Git returned a malformed completion SHA.",
        "Repair the Git reference and retry finalization.",
      );
    return sha;
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
  public async removeWorktree(
    repositoryRoot: string,
    worktreePath: string,
  ): Promise<void> {
    await this.required(
      ["worktree", "remove", worktreePath],
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
  public constructor(private readonly commands: CommandRunner) {}
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
  public async loadPullRequest(
    repository: string,
    pullRequestNumber: number,
  ): Promise<CompletionPullRequestFacts | null> {
    const result = await this.commands.run(
      "gh",
      [
        "pr",
        "view",
        String(pullRequestNumber),
        "--repo",
        repository,
        "--json",
        "number,state,baseRefName,headRefName,headRefOid,closingIssuesReferences",
      ],
      process.cwd(),
      15_000,
    );
    if (result.exitCode !== 0) {
      if (/not found|could not resolve/i.test(result.stderr)) return null;
      throw new RunnerError(
        "COMPLETION_PROOF_INCOMPLETE",
        "Pull-request completion query failed.",
        "Restore complete GitHub access and retry finalization.",
        { details: { stderr: redact(result.stderr) } },
      );
    }
    return parseCompletionPullRequest(result.stdout);
  }
  public async findOpenPullRequest(
    repository: string,
    headBranch: string,
  ): Promise<CompletionPullRequestFacts | null> {
    const result = await this.commands.run(
      "gh",
      [
        "pr",
        "list",
        "--repo",
        repository,
        "--state",
        "open",
        "--head",
        headBranch,
        "--limit",
        "2",
        "--json",
        "number,state,baseRefName,headRefName,headRefOid,closingIssuesReferences",
      ],
      process.cwd(),
      15_000,
    );
    if (result.exitCode !== 0)
      throw new RunnerError(
        "COMPLETION_PROOF_INCOMPLETE",
        "Trusted pull-request binding query failed.",
        "Restore complete GitHub access and retry result publication.",
        { details: { stderr: redact(result.stderr) } },
      );
    let candidates: unknown;
    try {
      candidates = JSON.parse(result.stdout);
    } catch (cause: unknown) {
      throw new RunnerError(
        "COMPLETION_PROOF_INCOMPLETE",
        "Trusted pull-request binding response was malformed.",
        "Retry with a compatible gh version.",
        { cause },
      );
    }
    if (!Array.isArray(candidates))
      throw new RunnerError(
        "COMPLETION_PROOF_INCOMPLETE",
        "Trusted pull-request binding response had an unexpected shape.",
        "Retry with a compatible gh version.",
      );
    if (candidates.length === 0) return null;
    if (candidates.length !== 1)
      throw new RunnerError(
        "COMPLETION_PROOF_INCOMPLETE",
        "More than one open pull request claims the owned branch.",
        "Preserve all pull requests and restore one unambiguous branch binding.",
      );
    return parseCompletionPullRequest(JSON.stringify(candidates[0]));
  }
  public async loadMergedPullRequest(
    repository: string,
    pullRequestNumber: number,
  ): Promise<MergedPullRequestFactsV1 | null> {
    const result = await this.commands.run(
      "gh",
      [
        "pr",
        "view",
        String(pullRequestNumber),
        "--repo",
        repository,
        "--json",
        "number,state,mergedAt,headRefName,headRefOid,mergeCommit,closingIssuesReferences",
      ],
      process.cwd(),
      15_000,
    );
    if (result.exitCode !== 0) {
      if (/not found|could not resolve/i.test(result.stderr)) return null;
      throw new RunnerError(
        "COMPLETION_PROOF_INCOMPLETE",
        "Pull-request merge query failed.",
        "Restore complete GitHub access and retry reconciliation.",
        { details: { stderr: redact(result.stderr) } },
      );
    }
    return parseMergedPullRequest(result.stdout);
  }
}

class LiveTmuxPort implements TmuxPort {
  public constructor(private readonly commands: CommandRunner) {}
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
    if (
      await this.observeIssueWindowName({
        sessionName: input.sessionName,
        windowName: input.windowName,
        cwd: input.cwd,
      })
    )
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
        TMUX_CREATE_IDENTITY_FORMAT,
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
    const parsed = parseTmuxIdentityResult("create", created);
    return {
      sessionName: input.sessionName,
      windowName: input.windowName,
      windowId: parsed.windowId,
      paneId: parsed.paneId,
      cwd: input.cwd,
    };
  }
  public async observeIssueWindowName(input: {
    readonly sessionName: string;
    readonly windowName: string;
    readonly cwd: string;
  }): Promise<boolean> {
    const existing = await this.commands.run(
      "tmux",
      ["list-windows", "-t", input.sessionName, "-F", "#{window_name}"],
      input.cwd,
      15_000,
    );
    if (existing.exitCode !== 0) {
      if (
        /no server running|can.t find session|no sessions/i.test(
          existing.stderr,
        )
      )
        return false;
      throw commandFailure("tmux window observation", existing);
    }
    return existing.stdout.split(/\r?\n/).includes(input.windowName);
  }
  public async observe(target: TmuxIdentity): Promise<TmuxIdentity | null> {
    const result = await this.commands.run(
      "tmux",
      [
        "list-panes",
        "-t",
        `${target.sessionName}:${target.windowName}`,
        "-F",
        TMUX_OBSERVE_IDENTITY_FORMAT,
      ],
      target.cwd,
      15_000,
    );
    if (result.exitCode !== 0) return null;
    const parsed = parseTmuxIdentityResult("observe", result);
    return {
      sessionName: target.sessionName,
      windowName: target.windowName,
      windowId: parsed.windowId,
      paneId: parsed.paneId,
      cwd: parsed.cwd ?? target.cwd,
    };
  }
  public async panePid(target: TmuxIdentity): Promise<number | null> {
    const result = await this.commands.run(
      "tmux",
      ["display-message", "-p", "-t", target.paneId, "#{pane_pid}"],
      target.cwd,
      15_000,
    );
    if (result.exitCode !== 0) return null;
    const value = result.stdout.trim();
    if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value)))
      throw new RunnerError(
        "TMUX_TARGET_MISMATCH",
        "tmux returned a malformed pane process identity.",
        "Preserve the pane and reconcile it before process control.",
      );
    return Number(value);
  }
  public async setRemainOnExit(target: TmuxIdentity): Promise<void> {
    const result = await this.commands.run(
      "tmux",
      [
        "set-window-option",
        "-t",
        `${target.sessionName}:${target.windowName}`,
        "remain-on-exit",
        "on",
      ],
      target.cwd,
      15_000,
    );
    if (result.exitCode !== 0)
      throw commandFailure("tmux remain-on-exit configuration", result);
  }
  public async capturePane(
    target: TmuxIdentity,
    maxBytes: number,
  ): Promise<{ readonly content: string; readonly truncated: boolean }> {
    const result = await this.commands.run(
      "tmux",
      ["capture-pane", "-p", "-S", "-", "-t", target.paneId],
      target.cwd,
      15_000,
    );
    if (result.exitCode !== 0)
      throw commandFailure("tmux pane capture", result);
    const bytes = Buffer.from(redact(result.stdout), "utf8");
    const truncated = bytes.byteLength > maxBytes;
    const selected = truncated
      ? bytes.subarray(bytes.byteLength - maxBytes)
      : bytes;
    return { content: selected.toString("utf8"), truncated };
  }
  public async restartWorker(
    target: TmuxIdentity,
    executable: string,
    args: readonly string[],
  ): Promise<void> {
    const result = await this.commands.run(
      "tmux",
      [
        "respawn-pane",
        "-k",
        "-t",
        target.paneId,
        "-c",
        target.cwd,
        executable,
        ...args,
      ],
      target.cwd,
      15_000,
    );
    if (result.exitCode !== 0)
      throw commandFailure("tmux worker restart", result);
  }
  public async removeWindow(target: TmuxIdentity): Promise<void> {
    const result = await this.commands.run(
      "tmux",
      ["kill-window", "-t", `${target.sessionName}:${target.windowName}`],
      target.cwd,
      15_000,
    );
    if (result.exitCode !== 0)
      throw commandFailure("tmux window removal", result);
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
  public spawnCopilot(input: {
    readonly executable: "copilot";
    readonly args: readonly string[];
    readonly cwd: string;
    readonly environment: Readonly<Record<string, string>>;
    readonly pane: TmuxIdentity;
    readonly panePid: number;
    readonly launchedAt: string;
  }): Promise<SpawnedProcessV1> {
    return new Promise((resolve, reject) => {
      const child = spawn(input.executable, input.args, {
        cwd: input.cwd,
        shell: false,
        detached: true,
        stdio: "inherit",
        env: copilotChildEnvironment(input.environment),
      });
      const completion = new Promise<{ readonly exitCode: number }>(
        (complete) =>
          child.on("close", (exitCode) =>
            complete({ exitCode: exitCode ?? 1 }),
          ),
      );
      child.once("error", (cause: Error) =>
        reject(
          new RunnerError(
            "EXTERNAL_COMMAND_FAILED",
            "Could not launch Copilot.",
            "Install and authenticate Copilot CLI, then retry.",
            { cause },
          ),
        ),
      );
      child.once("spawn", () => {
        const pid = child.pid;
        if (pid === undefined) {
          reject(
            new RunnerError(
              "EXTERNAL_COMMAND_FAILED",
              "Copilot started without an observable process identifier.",
              "Preserve the pane and retry only after process identity can be observed.",
            ),
          );
          return;
        }
        void readProcessIdentity(
          pid,
          {
            sessionName: input.pane.sessionName,
            windowId: input.pane.windowId,
            paneId: input.pane.paneId,
            panePid: input.panePid,
          },
          input.launchedAt,
        ).then(
          (identity) => {
            if (identity === null) {
              reject(
                new RunnerError(
                  "EXTERNAL_COMMAND_FAILED",
                  "Copilot process identity disappeared before it could be persisted.",
                  "Inspect retained terminal evidence before retrying.",
                ),
              );
              return;
            }
            resolve({ identity, wait: () => completion });
          },
          (cause: unknown) => reject(cause),
        );
      });
    });
  }

  public async identify(
    pid: number,
    paneLineage: ProcessIdentityV1["paneLineage"],
    launchedAt: string,
  ): Promise<ProcessIdentityV1 | null> {
    return readProcessIdentity(pid, paneLineage, launchedAt);
  }

  public async observe(
    identity: ProcessIdentityV1,
  ): Promise<ProcessIdentityV1 | null> {
    return this.identify(
      identity.pid,
      identity.paneLineage,
      identity.launchedAt,
    );
  }

  public async findLaunchCandidates(
    intent: LaunchIntentV1,
  ): Promise<readonly ProcessIdentityV1[]> {
    const entries = await fs.readdir("/proc");
    const candidates: ProcessIdentityV1[] = [];
    for (const entry of entries) {
      if (!/^[1-9]\d*$/.test(entry)) continue;
      const pid = Number(entry);
      if (!(await isDescendant(pid, intent.panePid))) continue;
      const identity = await readProcessIdentity(
        pid,
        {
          sessionName: intent.pane.sessionName,
          windowId: intent.pane.windowId,
          paneId: intent.pane.paneId,
          panePid: intent.panePid,
        },
        intent.recordedAt,
      );
      if (
        identity !== null &&
        identity.cwd === intent.cwd &&
        sameStringArray(identity.args, intent.args) &&
        path.basename(identity.executable) === intent.executable
      )
        candidates.push(identity);
    }
    return candidates;
  }

  public async signalGroup(
    identity: ProcessIdentityV1,
    signal: "SIGTERM" | "SIGKILL",
  ): Promise<void> {
    const observed = await this.observe(identity);
    if (observed === null || !sameProcessIdentity(observed, identity)) {
      throw new RunnerError(
        "PROCESS_IDENTITY_MISMATCH",
        "Refusing to signal a process group whose identity no longer matches.",
        "Reconcile the recorded PID, start token, command, cwd, and pane lineage.",
      );
    }
    try {
      process.kill(-identity.processGroupId, signal);
    } catch (cause: unknown) {
      throw new RunnerError(
        "EXTERNAL_COMMAND_FAILED",
        `Could not send ${signal} to the exact RPIV process group.`,
        "Inspect the process identity and retry stop safely.",
        { cause },
      );
    }
  }

  public async waitForExit(
    identity: ProcessIdentityV1,
    timeoutMs: number,
  ): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() <= deadline) {
      if ((await this.observe(identity)) === null) return true;
      await new Promise<void>((resolve) => setTimeout(resolve, 100));
    }
    return (await this.observe(identity)) === null;
  }
}

export function createLivePorts(
  commands: CommandRunner = new CommandExecutor(),
): RunnerPorts {
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

export function parseRemoteBranchAdvertisement(
  stdout: string,
  expectedRef: string,
): string | null {
  const normalized = stdout.replace(/\r\n/g, "\n").trim();
  if (normalized === "") return null;
  const rows = normalized.split("\n");
  if (rows.length !== 1)
    throw incompleteRemoteProof(
      "The authoritative remote branch response contained multiple records.",
    );
  const record = /^((?:[0-9a-f]{40}|[0-9a-f]{64}))[ \t]+(\S+)$/.exec(rows[0]);
  if (record === null || record[2] !== expectedRef)
    throw incompleteRemoteProof(
      "The authoritative remote branch response was malformed.",
    );
  return record[1];
}

function incompleteRemoteProof(
  message: string,
  cause?: unknown,
  result?: CommandResult,
): RunnerError {
  return new RunnerError(
    "COMPLETION_PROOF_INCOMPLETE",
    message,
    "Restore one complete remote branch advertisement and retry finalization.",
    {
      cause,
      details:
        result === undefined
          ? {}
          : {
              exitCode: result.exitCode,
              signal: result.signal,
              stderr: redact(result.stderr),
            },
    },
  );
}
async function readProcessIdentity(
  pid: number,
  paneLineage: ProcessIdentityV1["paneLineage"],
  launchedAt: string,
): Promise<ProcessIdentityV1 | null> {
  try {
    const [stat, executable, cwd, commandLine] = await Promise.all([
      fs.readFile(`/proc/${pid}/stat`, "utf8"),
      fs.readlink(`/proc/${pid}/exe`),
      fs.readlink(`/proc/${pid}/cwd`),
      fs.readFile(`/proc/${pid}/cmdline`),
    ]);
    const parsed = parseProcStat(stat);
    const argv = commandLine.toString("utf8").split("\0").filter(Boolean);
    return {
      schemaVersion: 1,
      pid,
      processGroupId: parsed.processGroupId,
      startToken: parsed.startToken,
      executable,
      args: argv.slice(1),
      cwd,
      launchedAt,
      paneLineage,
    };
  } catch (cause: unknown) {
    const code = nodeErrorCode(cause);
    if (processObservationDisposition(code) === "absent") return null;
    throw fileFailure("observe process identity", `/proc/${pid}`, cause);
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
  ) {
    throw new RunnerError(
      "EXTERNAL_COMMAND_FAILED",
      "The operating system returned malformed process identity facts.",
      "Restore readable process metadata before recovery or control.",
    );
  }
  return { parentPid, processGroupId, startToken };
}

async function isDescendant(
  pid: number,
  ancestorPid: number,
): Promise<boolean> {
  let current = pid;
  const visited = new Set<number>();
  while (current > 1 && !visited.has(current)) {
    if (current === ancestorPid) return pid !== ancestorPid;
    visited.add(current);
    try {
      const stat = await fs.readFile(`/proc/${current}/stat`, "utf8");
      current = parseProcStat(stat).parentPid;
    } catch (cause: unknown) {
      const code = nodeErrorCode(cause);
      if (processObservationDisposition(code) === "absent") return false;
      throw fileFailure("observe process ancestry", `/proc/${current}`, cause);
    }
  }
  return false;
}

export function processObservationDisposition(
  code: string | null,
): "absent" | "unknown" {
  return code === "ENOENT" ? "absent" : "unknown";
}

function sameStringArray(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return (
    left.length === right.length &&
    left.every((entry, index) => entry === right[index])
  );
}
function sameProcessIdentity(
  left: ProcessIdentityV1,
  right: ProcessIdentityV1,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function copilotChildEnvironment(
  explicit: Readonly<Record<string, string>>,
  inherited: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  return Object.freeze({ ...allowedEnvironment(inherited), ...explicit });
}

function allowedEnvironment(
  source: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
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
      source[key] === undefined ? [] : [[key, source[key]]],
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

function parseMergedPullRequest(text: string): MergedPullRequestFactsV1 {
  const value = parseObject(text, "Merged pull request");
  const state = requireString(value, "state");
  if (state !== "OPEN" && state !== "CLOSED" && state !== "MERGED")
    throw new RunnerError(
      "COMPLETION_PROOF_INCOMPLETE",
      "Pull-request merge state was unsupported.",
      "Retry with compatible gh output.",
    );
  const closing = value.closingIssuesReferences;
  if (!Array.isArray(closing))
    throw new RunnerError(
      "COMPLETION_PROOF_INCOMPLETE",
      "Pull-request closing issues were incomplete.",
      "Retry with complete gh output.",
    );
  const closesIssues = closing.map((entry, index) => {
    if (
      !isRecord(entry) ||
      !Number.isSafeInteger(entry.number) ||
      (entry.number as number) <= 0
    )
      throw new RunnerError(
        "COMPLETION_PROOF_INCOMPLETE",
        `Pull-request closing issue ${index + 1} was malformed.`,
        "Retry with complete gh output.",
      );
    return entry.number as number;
  });
  const sourceHeadSha = requireString(value, "headRefOid");
  if (!/^[0-9a-f]{40,64}$/.test(sourceHeadSha))
    throw new RunnerError(
      "COMPLETION_PROOF_INCOMPLETE",
      "Pull-request source-head SHA was malformed.",
      "Retry with complete immutable source-head output.",
    );
  const mergeCommit = value.mergeCommit;
  const mergeCommitSha =
    isRecord(mergeCommit) && typeof mergeCommit.oid === "string"
      ? mergeCommit.oid
      : null;
  const mergedAt = value.mergedAt;
  if (mergedAt !== null && typeof mergedAt !== "string")
    throw new RunnerError(
      "COMPLETION_PROOF_INCOMPLETE",
      "Pull-request merged time was malformed.",
      "Retry with complete merge output.",
    );
  return {
    number: requireNumber(value, "number"),
    state,
    mergedAt,
    sourceBranch: requireString(value, "headRefName"),
    sourceHeadSha,
    mergeCommitSha,
    closesIssues,
    complete: true,
  };
}

function parseCompletionPullRequest(text: string): CompletionPullRequestFacts {
  const value = parseObject(text, "Completion pull request");
  const state = requireString(value, "state");
  if (state !== "OPEN" && state !== "CLOSED" && state !== "MERGED")
    throw new RunnerError(
      "COMPLETION_PROOF_INCOMPLETE",
      "Pull-request state was unsupported.",
      "Retry with compatible gh output.",
    );
  const closing = value.closingIssuesReferences;
  if (!Array.isArray(closing))
    throw new RunnerError(
      "COMPLETION_PROOF_INCOMPLETE",
      "Pull-request closing issues were incomplete.",
      "Retry with complete gh output.",
    );
  const closesIssues = closing.map((entry, index) => {
    if (
      !isRecord(entry) ||
      !Number.isSafeInteger(entry.number) ||
      (entry.number as number) <= 0
    )
      throw new RunnerError(
        "COMPLETION_PROOF_INCOMPLETE",
        `Pull-request closing issue ${index + 1} was malformed.`,
        "Retry with complete gh output.",
      );
    return entry.number as number;
  });
  const headSha = requireString(value, "headRefOid");
  if (!/^[0-9a-f]{40,64}$/.test(headSha))
    throw new RunnerError(
      "COMPLETION_PROOF_INCOMPLETE",
      "Pull-request head SHA was malformed.",
      "Retry with complete gh output.",
    );
  return {
    number: requireNumber(value, "number"),
    state,
    baseBranch: requireString(value, "baseRefName"),
    headBranch: requireString(value, "headRefName"),
    headSha,
    closesIssues,
    complete: true,
  };
}
