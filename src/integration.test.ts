import { execFile } from "node:child_process";
import * as fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { IssueFacts, RepositoryFacts, TmuxIdentity } from "./domain";
import { normalizeRepositoryName } from "./domain";
import { createLivePorts } from "./live";
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
    const temporary = `${filePath}.${Math.random()}.tmp`;
    await fs.writeFile(temporary, content, { flag: "wx" });
    await fs.rename(temporary, filePath);
  }
  public async append(filePath: string, content: string): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.appendFile(filePath, content);
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
  public async loadIssue(): Promise<IssueFacts> {
    this.arrivals += 1;
    if (this.arrivals === 2) this.release?.();
    await this.barrier;
    return issue;
  }
}

class CountingGit implements GitPort {
  public branches = 0;
  public worktrees = 0;
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
  public async createBranch(): Promise<void> {
    this.branches += 1;
  }
  public async addWorktree(): Promise<void> {
    this.worktrees += 1;
  }
}

class CountingTmux implements TmuxPort {
  public windows = 0;
  public async createIssueWindow(input: {
    readonly sessionName: string;
    readonly windowName: string;
    readonly cwd: string;
  }): Promise<TmuxIdentity> {
    this.windows += 1;
    return {
      sessionName: input.sessionName,
      windowName: input.windowName,
      windowId: "@1",
      paneId: "%1",
      cwd: input.cwd,
    };
  }
  public async observe(target: TmuxIdentity): Promise<TmuxIdentity> {
    return target;
  }
  public async attach(): Promise<void> {}
}

const unusedProcess: ProcessPort = {
  runCopilot: async () => ({ exitCode: 0 }),
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
});
