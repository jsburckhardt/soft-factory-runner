import { execFile } from "node:child_process";
import * as fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type {
  IssueFacts,
  RepositoryFacts,
  ProcessIdentityV1,
  RunSnapshotV3,
  TmuxIdentity,
} from "./domain";
import { normalizeRepositoryName } from "./domain";
import { createLivePorts, processObservationDisposition } from "./live";
import type { CommandResult, CommandRunner } from "./live";
import { RunnerError } from "./errors";
import { IssueRunService } from "./orchestrator";
import type {
  FilePort,
  GitHubPort,
  GitPort,
  ProcessPort,
  RunnerPorts,
  TmuxPort,
} from "./ports";
import { proveFetchedBase } from "./readiness";

const execute = promisify(execFile);
const validBody =
  "<!-- ACCEPTANCE_CRITERIA_START -->\n- [ ] deterministic criterion\n<!-- ACCEPTANCE_CRITERIA_END -->";
const issue: IssueFacts = {
  number: 3,
  title: "Concurrent run",
  body: validBody,
  state: "OPEN",
  labels: ["feature"],
  openBlockers: [],
  openPullRequests: [],
  complete: true,
};

class DiskFiles implements FilePort {
  private temporaryCounter = 0;
  public async readText(filePath: string): Promise<string | null> {
    try {
      return await fs.readFile(filePath, "utf8");
    } catch (cause: unknown) {
      if (errorCode(cause) === "ENOENT") return null;
      throw cause;
    }
  }
  public async readAgentResult(worktreePath: string): Promise<string | null> {
    return this.readText(
      path.join(worktreePath, ".soft-factory", "agent-result.json"),
    );
  }
  public async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch (cause: unknown) {
      if (errorCode(cause) === "ENOENT") return false;
      throw cause;
    }
  }
  public async list(directoryPath: string): Promise<readonly string[]> {
    try {
      return await fs.readdir(directoryPath);
    } catch (cause: unknown) {
      if (errorCode(cause) === "ENOENT") return [];
      throw cause;
    }
  }
  public async exclusiveCreate(
    filePath: string,
    content: string,
  ): Promise<boolean> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    try {
      await fs.writeFile(filePath, content, { flag: "wx" });
      return true;
    } catch (cause: unknown) {
      if (errorCode(cause) === "EEXIST") return false;
      throw cause;
    }
  }
  public async atomicWrite(filePath: string, content: string): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const temporary = `${filePath}.${++this.temporaryCounter}.tmp`;
    await fs.writeFile(temporary, content, { flag: "wx" });
    await fs.rename(temporary, filePath);
  }
  public async append(filePath: string, content: string): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.appendFile(filePath, content);
  }
  public async compareAndDelete(
    filePath: string,
    expectedContent: string,
  ): Promise<boolean> {
    const actual = await this.readText(filePath);
    if (actual !== expectedContent) return false;
    await fs.unlink(filePath);
    return true;
  }
}

class BarrierGitHub implements GitHubPort {
  private arrivals = 0;
  private release: (() => void) | null = null;
  private readonly barrier = new Promise<void>((resolve) => {
    this.release = resolve;
  });
  public async loadPullRequest(): Promise<null> {
    return null;
  }
  public async loadMergedPullRequest(): Promise<null> {
    return null;
  }
  public async loadIssue(
    _repository: string,
    issueNumber: number,
  ): Promise<IssueFacts> {
    this.arrivals += 1;
    if (this.arrivals === 2) this.release?.();
    await this.barrier;
    return {
      ...issue,
      number: issueNumber,
      title: `Concurrent run ${issueNumber}`,
    };
  }
}

class CountingGit implements GitPort {
  public branches = 0;
  public worktrees = 0;
  public readonly branchNames: string[] = [];
  public readonly worktreePaths: string[] = [];
  public constructor(private readonly root: string) {}
  public async discover(): Promise<RepositoryFacts> {
    return {
      root: this.root,
      commonDirectory: path.join(this.root, ".git"),
      identity: { nameWithOwner: "owner/repo", normalizedName: "owner-repo" },
      remotes: ["origin"],
      pushDefault: null,
      currentBranchRemote: null,
    };
  }
  public async branchExists(): Promise<boolean> {
    return false;
  }
  public async registeredWorktreeExists(): Promise<boolean> {
    return false;
  }
  public async observeWorktree(_root: string, worktreePath: string) {
    let pathExists = true;
    try {
      await fs.access(worktreePath);
    } catch {
      pathExists = false;
    }
    return {
      pathExists,
      registered: pathExists,
      branch: pathExists ? "feat/3-concurrent-run" : null,
      headSha: pathExists ? "a".repeat(40) : null,
      staged: false,
      unstaged: false,
      untracked: false,
    };
  }
  public async fetch(): Promise<void> {}
  public async advertisedHead(): Promise<{
    readonly branch: string;
    readonly sha: string;
  }> {
    return { branch: "main", sha: "a".repeat(40) };
  }
  public async trackingSha(): Promise<string> {
    return "a".repeat(40);
  }
  public async localHeadSha(): Promise<string> {
    return "a".repeat(40);
  }
  public async remoteBranchSha(): Promise<string> {
    return "a".repeat(40);
  }
  public async createBranch(_root: string, branch: string): Promise<void> {
    this.branches += 1;
    this.branchNames.push(branch);
  }
  public async addWorktree(_root: string, worktreePath: string): Promise<void> {
    this.worktrees += 1;
    this.worktreePaths.push(worktreePath);
    await fs.mkdir(worktreePath, { recursive: true });
  }
  public async removeWorktree(
    _root: string,
    worktreePath: string,
  ): Promise<void> {
    await fs.rm(worktreePath, { recursive: true });
  }
}

class CountingTmux implements TmuxPort {
  public windows = 0;
  public readonly identities: TmuxIdentity[] = [];
  public async createIssueWindow(input: {
    readonly sessionName: string;
    readonly windowName: string;
    readonly cwd: string;
  }): Promise<TmuxIdentity> {
    this.windows += 1;
    const identity = {
      sessionName: input.sessionName,
      windowName: input.windowName,
      windowId: `@${input.windowName}`,
      paneId: `%${input.windowName}`,
      cwd: input.cwd,
    };
    this.identities.push(identity);
    return identity;
  }
  public async observe(target: TmuxIdentity): Promise<TmuxIdentity> {
    return target;
  }
  public async panePid(): Promise<number> {
    return 100;
  }
  public async setRemainOnExit(): Promise<void> {}
  public async capturePane() {
    return { content: "", truncated: false };
  }
  public async restartWorker(): Promise<void> {}
  public async removeWindow(): Promise<void> {}
  public async attach(): Promise<void> {}
}

const unusedProcess: ProcessPort = {
  spawnCopilot: async (input) => {
    const identity: ProcessIdentityV1 = {
      schemaVersion: 1,
      pid: 101,
      processGroupId: 101,
      startToken: "1",
      executable: "copilot",
      args: input.args,
      cwd: input.cwd,
      launchedAt: input.launchedAt,
      paneLineage: {
        sessionName: input.pane.sessionName,
        windowId: input.pane.windowId,
        paneId: input.pane.paneId,
        panePid: input.panePid,
      },
    };
    return { identity, wait: async () => ({ exitCode: 0 }) };
  },
  identify: async (pid, paneLineage, launchedAt) => ({
    schemaVersion: 1,
    pid,
    processGroupId: pid,
    startToken: "worker",
    executable: "/usr/bin/soft-factory",
    args: ["internal", "run-agent"],
    cwd: "/repo",
    launchedAt,
    paneLineage,
  }),
  observe: async () => null,
  findLaunchCandidates: async () => [],
  signalGroup: async () => undefined,
  waitForExit: async () => true,
};

function errorCode(value: unknown): string | null {
  return typeof value === "object" &&
    value !== null &&
    "code" in value &&
    typeof value.code === "string"
    ? value.code
    : null;
}

async function git(cwd: string, args: readonly string[]): Promise<string> {
  const result = await execute("git", args, { cwd, encoding: "utf8" });
  return result.stdout.trim();
}

interface GitHubCliResponses {
  readonly issue: unknown;
  readonly pullRequests: unknown;
  readonly blockers: unknown;
  readonly completionPullRequest?: unknown;
}

async function writeFakeGitHubCli(
  directory: string,
  responses: GitHubCliResponses,
): Promise<void> {
  const executable = path.join(directory, "gh");
  const script = `#!/usr/bin/env node
const responses = ${JSON.stringify(responses)};
const command = process.argv[2];
const action = process.argv[3];
const response = command === "issue"
  ? responses.issue
  : command === "pr" && action === "view"
    ? responses.completionPullRequest
    : command === "pr"
      ? responses.pullRequests
      : command === "api"
        ? responses.blockers
        : undefined;
if (response === undefined) process.exit(2);
process.stdout.write(JSON.stringify(response));
`;
  await fs.writeFile(executable, script, { mode: 0o755 });
}

describe("live process observation classification", () => {
  it("treats only missing proc entries as absent and permissions as unknown", () => {
    expect(processObservationDisposition("ENOENT")).toBe("absent");
    expect(processObservationDisposition("EACCES")).toBe("unknown");
    expect(processObservationDisposition("EPERM")).toBe("unknown");
    expect(processObservationDisposition(null)).toBe("unknown");
  });
});

describe("live GitHub proof parsing", () => {
  const validIssueResponse = {
    number: 3,
    title: "Live parser boundary",
    body: validBody,
    state: "OPEN",
    labels: [{ name: "feature" }],
  };
  const completeBlockersResponse = {
    data: {
      repository: {
        issue: {
          blockedBy: {
            nodes: [],
            pageInfo: { hasNextPage: false },
          },
        },
      },
    },
  };

  it.each([
    [
      "malformed top-level pull request",
      { pullRequests: [null] },
      "Pull-request entry 1",
    ],
    [
      "malformed nested closing issue",
      {
        pullRequests: [
          {
            number: 8,
            headRefName: "feat/other",
            closingIssuesReferences: [{ number: "3" }],
          },
        ],
      },
      "closing-issue entry 1",
    ],
    [
      "malformed label",
      { issue: { ...validIssueResponse, labels: [{ name: 7 }] } },
      "GitHub labels entry 1",
    ],
    [
      "malformed blocker",
      {
        blockers: {
          data: {
            repository: {
              issue: {
                blockedBy: {
                  nodes: [{ number: 2, state: "UNKNOWN" }],
                  pageInfo: { hasNextPage: false },
                },
              },
            },
          },
        },
      },
      "Blocked-by entry 1",
    ],
  ])(
    "blocks %s as incomplete proof before owned side effects",
    async (_name, overrides, message) => {
      const root = await fs.mkdtemp(
        path.join(os.tmpdir(), "soft-factory-live-github-"),
      );
      const bin = path.join(root, "bin");
      await fs.mkdir(bin);
      await writeFakeGitHubCli(bin, {
        issue: validIssueResponse,
        pullRequests: [],
        blockers: completeBlockersResponse,
        ...overrides,
      });
      const originalPath = process.env.PATH;
      process.env.PATH = `${bin}:${originalPath ?? ""}`;
      try {
        const live = createLivePorts();
        const files = new DiskFiles();
        const repository = new CountingGit(root);
        const tmux = new CountingTmux();
        const ports: RunnerPorts = {
          files,
          github: live.github,
          git: repository,
          tmux,
          processes: unusedProcess,
          clock: { now: () => "2026-08-11T00:00:00.000Z" },
          ids: {
            nextOwnerId: () => "owner-live-parser",
            nextRunId: () => "run-live-parser",
          },
        };
        await expect(
          new IssueRunService(ports).run(3, root),
        ).rejects.toMatchObject({
          code: "GITHUB_PROOF_INCOMPLETE",
          message: expect.stringContaining(message),
        });
        expect(repository.branches).toBe(0);
        expect(repository.worktrees).toBe(0);
        expect(tmux.windows).toBe(0);
        expect(
          await files.exists(
            path.join(root, ".soft-factory", "locks", "3.lock"),
          ),
        ).toBe(false);
      } finally {
        if (originalPath === undefined) delete process.env.PATH;
        else process.env.PATH = originalPath;
        await fs.rm(root, {
          recursive: true,
          force: true,
          maxRetries: 3,
          retryDelay: 20,
        });
      }
    },
  );
});

describe("live completion pull-request proof", () => {
  it("parses one complete PR-by-number fact set and rejects malformed fields", async () => {
    const root = await fs.mkdtemp(
      path.join(os.tmpdir(), "soft-factory-completion-pr-"),
    );
    const bin = path.join(root, "bin");
    await fs.mkdir(bin);
    const base = { issue: {}, pullRequests: [], blockers: {} };
    const complete = {
      number: 14,
      state: "OPEN",
      baseRefName: "main",
      headRefName: "feat/4-proof",
      headRefOid: "a".repeat(40),
      closingIssuesReferences: [{ number: 4 }],
    };
    await writeFakeGitHubCli(bin, { ...base, completionPullRequest: complete });
    const originalPath = process.env.PATH;
    process.env.PATH = bin + ":" + (originalPath ?? "");
    try {
      const live = createLivePorts();
      await expect(
        live.github.loadPullRequest("owner/repo", 14),
      ).resolves.toEqual({
        number: 14,
        state: "OPEN",
        baseBranch: "main",
        headBranch: "feat/4-proof",
        headSha: "a".repeat(40),
        closesIssues: [4],
        complete: true,
      });
      await writeFakeGitHubCli(bin, {
        ...base,
        completionPullRequest: { ...complete, headRefOid: "short" },
      });
      await expect(
        live.github.loadPullRequest("owner/repo", 14),
      ).rejects.toMatchObject({ code: "COMPLETION_PROOF_INCOMPLETE" });
    } finally {
      if (originalPath === undefined) delete process.env.PATH;
      else process.env.PATH = originalPath;
      await fs.rm(root, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 20,
      });
    }
  });
});

class RecordingCommandRunner implements CommandRunner {
  public readonly calls: Array<{
    readonly executable: string;
    readonly args: readonly string[];
    readonly cwd: string;
    readonly timeoutMs: number;
    readonly shell: false | undefined;
  }> = [];
  public constructor(
    private readonly result: CommandResult,
    private readonly failure: RunnerError | null = null,
  ) {}
  public async run(
    executable: string,
    args: readonly string[],
    cwd: string,
    timeoutMs: number,
    shell?: false,
  ): Promise<CommandResult> {
    this.calls.push({ executable, args, cwd, timeoutMs, shell });
    if (this.failure !== null) throw this.failure;
    return this.result;
  }
  public async runInherited(
    executable: string,
    args: readonly string[],
    cwd: string,
  ): Promise<CommandResult> {
    return this.run(executable, args, cwd, 0, false);
  }
}

describe("merged pull-request source-head adapter", () => {
  it("queries and parses immutable source head, merge time, and informational merge commit", async () => {
    const commands = new RecordingCommandRunner({
      exitCode: 0,
      signal: null,
      stdout: JSON.stringify({
        number: 15,
        state: "MERGED",
        mergedAt: "2026-08-11T14:00:00.000Z",
        headRefName: "feat/5-recovery",
        headRefOid: "a".repeat(40),
        mergeCommit: { oid: "b".repeat(40) },
        closingIssuesReferences: [{ number: 5 }],
      }),
      stderr: "",
    });
    await expect(
      createLivePorts(commands).github.loadMergedPullRequest("owner/repo", 15),
    ).resolves.toEqual({
      number: 15,
      state: "MERGED",
      mergedAt: "2026-08-11T14:00:00.000Z",
      sourceBranch: "feat/5-recovery",
      sourceHeadSha: "a".repeat(40),
      mergeCommitSha: "b".repeat(40),
      closesIssues: [5],
      complete: true,
    });
    expect(commands.calls[0]).toMatchObject({
      executable: "gh",
      args: [
        "pr",
        "view",
        "15",
        "--repo",
        "owner/repo",
        "--json",
        "number,state,mergedAt,headRefName,headRefOid,mergeCommit,closingIssuesReferences",
      ],
      timeoutMs: 15000,
    });
  });
});

describe("authoritative completion remote adapter", () => {
  const branch = "feat/4-proof";
  const ref = `refs/heads/${branch}`;
  const authoritativeSha = "b".repeat(40);
  const success = (stdout: string, exitCode = 0): CommandResult => ({
    exitCode,
    signal: null,
    stdout,
    stderr: exitCode === 0 ? "" : "query failed",
  });

  it("executes one exact bounded no-shell ls-remote query from the repository root", async () => {
    const commands = new RecordingCommandRunner(
      success(`${authoritativeSha}\t${ref}\n`),
    );
    await expect(
      createLivePorts(commands).git.remoteBranchSha(
        "/tmp/repository-root",
        "origin",
        branch,
      ),
    ).resolves.toBe(authoritativeSha);
    expect(commands.calls).toEqual([
      {
        executable: "git",
        args: ["ls-remote", "--refs", "origin", ref],
        cwd: "/tmp/repository-root",
        timeoutMs: 15_000,
        shell: false,
      },
    ]);
  });

  it("treats a zero-record response as missing proof", async () => {
    const commands = new RecordingCommandRunner(success(""));
    await expect(
      createLivePorts(commands).git.remoteBranchSha(
        "/tmp/repository-root",
        "origin",
        branch,
      ),
    ).resolves.toBeNull();
    expect(commands.calls).toHaveLength(1);
  });

  it.each([
    ["command failure", success("", 2), null],
    [
      "timeout",
      success(""),
      new RunnerError(
        "EXTERNAL_COMMAND_FAILED",
        "git timed out after 15000ms.",
        "Retry.",
      ),
    ],
    ["malformed record", success(`not-a-sha\t${ref}\n`), null],
    [
      "truncated SHA",
      success(`${authoritativeSha.slice(0, 39)}\t${ref}\n`),
      null,
    ],
    ["non-full SHA length", success(`${"c".repeat(41)}\t${ref}\n`), null],
    [
      "duplicate records",
      success(`${authoritativeSha}\t${ref}\n${authoritativeSha}\t${ref}\n`),
      null,
    ],
    [
      "wrong ref",
      success(`${authoritativeSha}\trefs/heads/feat/wrong\n`),
      null,
    ],
  ])("classifies %s as incomplete proof", async (_name, result, failure) => {
    const commands = new RecordingCommandRunner(result, failure);
    await expect(
      createLivePorts(commands).git.remoteBranchSha(
        "/tmp/repository-root",
        "origin",
        branch,
      ),
    ).rejects.toMatchObject({ code: "COMPLETION_PROOF_INCOMPLETE" });
    expect(commands.calls).toHaveLength(1);
  });
});
describe("real filesystem and Git integration", () => {
  it("uses exclusive-create ownership so barrier-released starts create one resource set", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "soft-factory-lock-"));
    try {
      const files = new DiskFiles();
      const github = new BarrierGitHub();
      const repository = new CountingGit(root);
      const tmux = new CountingTmux();
      let id = 0;
      const ports: RunnerPorts = {
        files,
        github,
        git: repository,
        tmux,
        processes: unusedProcess,
        clock: { now: () => "2026-08-11T00:00:00.000Z" },
        ids: {
          nextOwnerId: () => `owner-${++id}`,
          nextRunId: () => `run-${++id}`,
        },
      };
      const results = await Promise.allSettled([
        new IssueRunService(ports).run(3, root),
        new IssueRunService(ports).run(3, root),
      ]);
      expect(
        results.filter((result) => result.status === "fulfilled"),
      ).toHaveLength(1);
      const failures = results.filter((result) => result.status === "rejected");
      expect(failures).toHaveLength(1);
      if (failures[0].status === "rejected")
        expect(failures[0].reason).toMatchObject({
          code: "ISSUE_ALREADY_OWNED",
        });
      expect(repository.branches).toBe(1);
      expect(repository.worktrees).toBe(1);
      expect(tmux.windows).toBe(1);
      const owner: unknown = JSON.parse(
        await fs.readFile(
          path.join(root, ".soft-factory", "locks", "3.lock"),
          "utf8",
        ),
      );
      expect(owner).toMatchObject({
        schemaVersion: 1,
        issueNumber: 3,
        repository: "owner/repo",
      });
    } finally {
      await fs.rm(root, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 20,
      });
    }
  });

  it("admits two distinct explicit issues into disjoint resource sets with capacity two", async () => {
    for (let repetition = 0; repetition < 20; repetition += 1) {
      const root = await fs.mkdtemp(
        path.join(os.tmpdir(), "soft-factory-distinct-"),
      );
      try {
        const files = new DiskFiles();
        await files.atomicWrite(
          path.join(root, ".soft-factory", "config.yml"),
          "execution:\n  max_concurrent_runs: 2\n",
        );
        const github = new BarrierGitHub();
        const repository = new CountingGit(root);
        const tmux = new CountingTmux();
        let id = 0;
        const ports: RunnerPorts = {
          files,
          github,
          git: repository,
          tmux,
          processes: unusedProcess,
          clock: { now: () => "2026-08-11T00:00:00.000Z" },
          ids: {
            nextOwnerId: () => `owner-${++id}`,
            nextRunId: () => `run-${++id}`,
          },
        };
        const issueNumbers = [3, 4, 5] as const;
        const results = await Promise.allSettled(
          issueNumbers.map((issueNumber) =>
            new IssueRunService(ports).run(issueNumber, root),
          ),
        );
        const admitted = results.flatMap((entry) =>
          entry.status === "fulfilled" ? [entry.value] : [],
        );
        expect(admitted.map((entry) => entry.admission?.slot).sort()).toEqual([
          1, 2,
        ]);
        const refused = results.find((entry) => entry.status === "rejected");
        expect(refused?.status).toBe("rejected");
        if (refused?.status === "rejected")
          expect(refused.reason).toMatchObject({
            code: "CONCURRENCY_LIMIT_REACHED",
          });
        expect(new Set(repository.branchNames).size).toBe(2);
        expect(new Set(repository.worktreePaths).size).toBe(2);
        expect(
          new Set(tmux.identities.map((entry) => entry.windowName)).size,
        ).toBe(2);
        expect(new Set(tmux.identities.map((entry) => entry.paneId)).size).toBe(
          2,
        );
        expect(
          tmux.identities.every(
            (entry) => entry.sessionName === "sf-owner-repo",
          ),
        ).toBe(true);
        const admittedIssues = new Set(
          admitted.map((entry) => entry.issueNumber),
        );
        for (const issueNumber of issueNumbers) {
          const expected = admittedIssues.has(issueNumber);
          await expect(
            files.exists(
              path.join(root, ".soft-factory", "locks", `${issueNumber}.lock`),
            ),
          ).resolves.toBe(expected);
          await expect(
            files.exists(
              path.join(root, ".soft-factory", "runs", `${issueNumber}.json`),
            ),
          ).resolves.toBe(expected);
          await expect(
            files.exists(
              path.join(
                root,
                ".soft-factory",
                "events",
                `${issueNumber}.jsonl`,
              ),
            ),
          ).resolves.toBe(expected);
        }
      } finally {
        await fs.rm(root, {
          recursive: true,
          force: true,
          maxRetries: 3,
          retryDelay: 20,
        });
      }
    }
  });

  it("observes staged, unstaged, and untracked dirtiness and refuses forced worktree removal", async () => {
    const parent = await fs.mkdtemp(
      path.join(os.tmpdir(), "soft-factory-dirty-"),
    );
    const root = path.join(parent, "repository");
    const worktreePath = path.join(parent, "owned-worktree");
    try {
      await fs.mkdir(root);
      await git(root, ["init", "-b", "main"]);
      await git(root, ["config", "user.email", "fixture@example.invalid"]);
      await git(root, ["config", "user.name", "Fixture"]);
      await fs.writeFile(path.join(root, "README.md"), "initial\n");
      await git(root, ["add", "README.md"]);
      await git(root, ["commit", "-m", "initial"]);
      await git(root, [
        "worktree",
        "add",
        "-b",
        "feat/5-recovery",
        worktreePath,
      ]);
      await fs.writeFile(path.join(worktreePath, "tracked.txt"), "staged\n");
      await git(worktreePath, ["add", "tracked.txt"]);
      await fs.writeFile(path.join(worktreePath, "tracked.txt"), "unstaged\n");
      await fs.writeFile(
        path.join(worktreePath, "untracked.txt"),
        "untracked\n",
      );
      const live = createLivePorts();
      await expect(
        live.git.observeWorktree(root, worktreePath),
      ).resolves.toMatchObject({
        pathExists: true,
        registered: true,
        branch: "feat/5-recovery",
        staged: true,
        unstaged: true,
        untracked: true,
      });
      await expect(
        live.git.removeWorktree(root, worktreePath),
      ).rejects.toMatchObject({
        code: "EXTERNAL_COMMAND_FAILED",
      });
      await expect(
        fs.readFile(path.join(worktreePath, "untracked.txt"), "utf8"),
      ).resolves.toBe("untracked\n");
      await git(worktreePath, ["reset", "--hard"]);
      await git(worktreePath, ["clean", "-fd"]);
      await expect(
        live.git.removeWorktree(root, worktreePath),
      ).resolves.toBeUndefined();
      await expect(fs.access(worktreePath)).rejects.toMatchObject({
        code: "ENOENT",
      });
    } finally {
      await fs.rm(parent, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 20,
      });
    }
  });

  it("creates the typed branch and worktree from the exact advertised and fetched SHA", async () => {
    const parent = await fs.mkdtemp(
      path.join(os.tmpdir(), "soft-factory-git-"),
    );
    const root = path.join(parent, "repository");
    const remote = path.join(parent, "remote.git");
    try {
      await fs.mkdir(root);
      await git(root, ["init", "-b", "main"]);
      await git(root, ["config", "user.email", "fixture@example.invalid"]);
      await git(root, ["config", "user.name", "Fixture"]);
      await fs.writeFile(path.join(root, "README.md"), "fixture\n");
      await git(root, ["add", "README.md"]);
      await git(root, ["commit", "-m", "chore: seed fixture"]);
      await git(parent, ["init", "--bare", remote]);
      await git(root, ["remote", "add", "origin", remote]);
      await git(root, ["push", "-u", "origin", "main"]);
      await git(parent, [
        "--git-dir",
        remote,
        "symbolic-ref",
        "HEAD",
        "refs/heads/main",
      ]);
      const startSha = await git(root, ["rev-parse", "HEAD"]);
      const live = createLivePorts();
      const repository: RepositoryFacts = {
        root,
        commonDirectory: path.join(root, ".git"),
        identity: {
          nameWithOwner: "owner/repo",
          normalizedName: normalizeRepositoryName("owner/repo"),
        },
        remotes: ["origin"],
        pushDefault: null,
        currentBranchRemote: null,
      };
      const proof = await proveFetchedBase({
        git: live.git,
        repository,
        remote: "origin",
        configuredBase: "main",
        fetchedAt: "2026-08-11T00:00:00.000Z",
      });
      expect(proof.advertisedHeadSha).toBe(startSha);
      await live.git.createBranch(
        root,
        "feat/3-concurrent-run",
        proof.advertisedHeadSha,
      );
      const worktree = path.join(root, ".trees", "3");
      await live.git.addWorktree(root, worktree, "feat/3-concurrent-run");
      expect(await git(root, ["rev-parse", "feat/3-concurrent-run"])).toBe(
        startSha,
      );
      expect(await git(worktree, ["rev-parse", "HEAD"])).toBe(startSha);
      expect(await live.git.localHeadSha(worktree)).toBe(startSha);
      expect(
        await live.git.remoteBranchSha(root, "origin", "feat/3-concurrent-run"),
      ).toBeNull();
      await git(root, ["push", "-u", "origin", "feat/3-concurrent-run"]);
      expect(
        await live.git.remoteBranchSha(root, "origin", "feat/3-concurrent-run"),
      ).toBe(startSha);
      expect(worktree.startsWith(parent)).toBe(true);
      expect(worktree).not.toContain(
        "/workspaces/soft-factory-runner/.trees/3",
      );
    } finally {
      await fs.rm(parent, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 20,
      });
    }
  });
  it("rejects stale tracking cache A after the actual remote advances to B and permits an authoritative control", async () => {
    const parent = await fs.mkdtemp(
      path.join(os.tmpdir(), "soft-factory-stale-remote-"),
    );
    const root = path.join(parent, "subject");
    const remotePath = path.join(parent, "remote.git");
    const writer = path.join(parent, "writer");
    const branch = "feat/4-proof";
    try {
      await fs.mkdir(root);
      await git(root, ["init", "-b", "main"]);
      await git(root, ["config", "user.email", "fixture@example.invalid"]);
      await git(root, ["config", "user.name", "Fixture"]);
      await fs.writeFile(path.join(root, "README.md"), "SHA A\n");
      await git(root, ["add", "README.md"]);
      await git(root, ["commit", "-m", "chore: seed SHA A"]);
      const shaA = await git(root, ["rev-parse", "HEAD"]);
      await git(parent, ["init", "--bare", remotePath]);
      await git(root, ["remote", "add", "origin", remotePath]);
      await git(root, ["push", "-u", "origin", "main"]);
      await git(parent, [
        "--git-dir",
        remotePath,
        "symbolic-ref",
        "HEAD",
        "refs/heads/main",
      ]);
      await git(root, ["switch", "-c", branch]);
      await git(root, ["push", "-u", "origin", branch]);
      expect(
        await git(root, ["rev-parse", `refs/remotes/origin/${branch}`]),
      ).toBe(shaA);

      await git(parent, ["clone", remotePath, writer]);
      await git(writer, ["config", "user.email", "writer@example.invalid"]);
      await git(writer, ["config", "user.name", "Writer"]);
      await git(writer, ["switch", branch]);
      await fs.writeFile(path.join(writer, "README.md"), "SHA B\n");
      await git(writer, ["add", "README.md"]);
      await git(writer, ["commit", "-m", "chore: advance to SHA B"]);
      const shaB = await git(writer, ["rev-parse", "HEAD"]);
      await git(writer, ["push", "origin", branch]);

      const cachedSha = await git(root, [
        "rev-parse",
        `refs/remotes/origin/${branch}`,
      ]);
      expect(cachedSha).toBe(shaA);
      expect(shaB).not.toBe(shaA);
      const live = createLivePorts();
      await expect(
        live.git.remoteBranchSha(root, "origin", branch),
      ).resolves.toBe(shaB);

      const requiredAcceptanceCriteria = [
        { id: "AC-1", text: "authoritative remote proof" },
      ];
      const snapshotFor = (updatedAt: string): RunSnapshotV3 => ({
        schemaVersion: 3,
        revision: 1,
        attempt: 1,
        runId: "run-stale-remote",
        ownerId: "owner-stale-remote",
        repository: "owner/repo",
        issueNumber: 4,
        state: "running_rpiv",
        branchType: "feat",
        branch,
        worktreePath: root,
        fetchedBaseProof: {
          schemaVersion: 1,
          remote: "origin",
          defaultBranch: "main",
          advertisedHeadSha: shaA,
          trackingRefSha: shaA,
          fetchedAt: "2026-08-11T12:00:00.000Z",
          matches: true,
        },
        tmux: {
          sessionName: "sf-owner-repo",
          windowName: "4",
          windowId: "@4",
          paneId: "%4",
          cwd: root,
        },
        copilot: null,
        admission: null,
        launchIntent: null,
        workerProcess: null,
        rpivProcess: null,
        stop: null,
        cleanup: null,
        logs: [],
        mergedPullRequest: null,
        error: null,
        updatedAt,
        requiredAcceptanceCriteria,
        requiredValidations: [
          { command: "just verify-focused" },
          { command: "just verify" },
        ],
        finalization: null,
      });
      const resultFor = (headSha: string) => ({
        schemaVersion: 1,
        issueNumber: 4,
        outcome: "succeeded",
        branch,
        headSha,
        prNumber: 14,
        acceptanceCriteria: [
          { id: "AC-1", status: "verified", evidence: ["fixture:remote"] },
        ],
        validations: [
          { command: "just verify-focused", status: "passed" },
          { command: "just verify", status: "passed" },
        ],
        completedAt: "2026-08-11T12:01:00.000Z",
      });
      const stateDirectory = path.join(root, ".soft-factory");
      const runPath = path.join(stateDirectory, "runs", "4.json");
      const eventPath = path.join(stateDirectory, "events", "4.jsonl");
      const resultDirectory = path.join(stateDirectory);
      await fs.mkdir(path.dirname(runPath), { recursive: true });
      await fs.mkdir(resultDirectory, { recursive: true });
      await fs.writeFile(
        path.join(resultDirectory, "agent-result.json"),
        JSON.stringify(resultFor(shaA)),
      );
      await fs.writeFile(
        runPath,
        JSON.stringify(snapshotFor("2026-08-11T12:00:00.000Z")),
      );

      let expectedPrSha = shaA;
      const repository: RepositoryFacts = {
        root,
        commonDirectory: path.join(root, ".git"),
        identity: { nameWithOwner: "owner/repo", normalizedName: "owner-repo" },
        remotes: ["origin"],
        pushDefault: null,
        currentBranchRemote: null,
      };
      const completionGit: GitPort = {
        discover: async () => repository,
        branchExists: (...args) => live.git.branchExists(...args),
        registeredWorktreeExists: (...args) =>
          live.git.registeredWorktreeExists(...args),
        observeWorktree: (...args) => live.git.observeWorktree(...args),
        fetch: (...args) => live.git.fetch(...args),
        advertisedHead: (...args) => live.git.advertisedHead(...args),
        trackingSha: (...args) => live.git.trackingSha(...args),
        localHeadSha: (...args) => live.git.localHeadSha(...args),
        remoteBranchSha: (...args) => live.git.remoteBranchSha(...args),
        createBranch: (...args) => live.git.createBranch(...args),
        addWorktree: (...args) => live.git.addWorktree(...args),
        removeWorktree: (...args) => live.git.removeWorktree(...args),
      };
      const completionGithub: GitHubPort = {
        loadIssue: async () => null,
        loadPullRequest: async () => ({
          number: 14,
          state: "OPEN",
          baseBranch: "main",
          headBranch: branch,
          headSha: expectedPrSha,
          closesIssues: [4],
          complete: true,
        }),
        loadMergedPullRequest: async () => ({
          number: 14,
          state: "OPEN",
          mergedAt: null,
          sourceBranch: branch,
          sourceHeadSha: expectedPrSha,
          mergeCommitSha: null,
          closesIssues: [4],
          complete: true,
        }),
      };
      let tick = 0;
      const ports: RunnerPorts = {
        files: new DiskFiles(),
        git: completionGit,
        github: completionGithub,
        tmux: new CountingTmux(),
        processes: unusedProcess,
        clock: {
          now: () => `2026-08-11T12:02:${String(tick++).padStart(2, "0")}.000Z`,
        },
        ids: {
          nextOwnerId: () => "unused-owner",
          nextRunId: () => "unused-run",
        },
      };

      const divergent = await new IssueRunService(ports).runWorker(4, root);
      expect(divergent).toMatchObject({
        state: "failed",
        finalization: {
          git: { localHeadSha: shaA, remoteHeadSha: shaB },
          reconciliation: { decisionCode: "RESULT_REMOTE_SHA_MISMATCH" },
        },
        error: { code: "RESULT_REMOTE_SHA_MISMATCH" },
      });
      const divergentEvents = await fs.readFile(eventPath, "utf8");
      expect(divergentEvents).toContain("RESULT_REMOTE_SHA_MISMATCH");
      expect(divergentEvents).not.toContain("COMPLETION_PROVED");
      expect(
        await git(root, ["rev-parse", `refs/remotes/origin/${branch}`]),
      ).toBe(shaA);

      await git(root, ["fetch", "origin", shaB]);
      await git(root, ["reset", "--hard", shaB]);
      expect(
        await git(root, ["rev-parse", `refs/remotes/origin/${branch}`]),
      ).toBe(shaA);
      expectedPrSha = shaB;
      await fs.writeFile(
        path.join(resultDirectory, "agent-result.json"),
        JSON.stringify(resultFor(shaB)),
      );
      await fs.writeFile(
        runPath,
        JSON.stringify(snapshotFor("2026-08-11T12:03:00.000Z")),
      );
      await fs.rm(eventPath, { force: true });

      const control = await new IssueRunService(ports).runWorker(4, root);
      expect(control).toMatchObject({
        state: "completed",
        finalization: {
          git: { localHeadSha: shaB, remoteHeadSha: shaB },
          reconciliation: { decisionCode: "COMPLETION_PROVED" },
        },
        error: null,
      });
      expect(await fs.readFile(eventPath, "utf8")).toContain(
        "COMPLETION_PROVED",
      );
    } finally {
      await fs.rm(parent, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 20,
      });
    }
  });
});
