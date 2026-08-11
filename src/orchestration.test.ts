import type { IssueFacts, RepositoryFacts, TmuxIdentity } from "./domain";
import { normalizeRepositoryName } from "./domain";
import { RunnerError } from "./errors";
import { runCli } from "./index";
import { IssueRunService } from "./orchestrator";
import type {
  FilePort,
  GitHubPort,
  GitPort,
  ProcessPort,
  RunnerPorts,
  TmuxPort,
} from "./ports";
import {
  proveFetchedBase,
  resolveRemote,
  validateAcceptanceCriteria,
} from "./readiness";

const validBody = `# Acceptance
<!-- ACCEPTANCE_CRITERIA_START -->
${Array.from({ length: 10 }, (_, index) => `- [ ] criterion ${index + 1}`).join("\n")}
<!-- ACCEPTANCE_CRITERIA_END -->`;
const sha = "a".repeat(40);

class MemoryFiles implements FilePort {
  public readonly values = new Map<string, string>();
  public readonly trace: string[];
  public constructor(trace: string[]) {
    this.trace = trace;
  }
  public async readText(filePath: string): Promise<string | null> {
    this.trace.push(`file:read:${filePath}`);
    return this.values.get(filePath) ?? null;
  }
  public async readAgentResult(worktreePath: string): Promise<string | null> {
    this.trace.push(`file:result:${worktreePath}`);
    return (
      this.values.get(`${worktreePath}/.soft-factory/agent-result.json`) ?? null
    );
  }
  public async exists(filePath: string): Promise<boolean> {
    this.trace.push(`file:exists:${filePath}`);
    return this.values.has(filePath);
  }
  public async exclusiveCreate(
    filePath: string,
    content: string,
  ): Promise<boolean> {
    this.trace.push(`lock:create:${filePath}`);
    if (this.values.has(filePath)) return false;
    this.values.set(filePath, content);
    return true;
  }
  public async atomicWrite(filePath: string, content: string): Promise<void> {
    this.trace.push(`snapshot:write:${filePath}`);
    this.values.set(filePath, content);
  }
  public async append(filePath: string, content: string): Promise<void> {
    this.trace.push(`event:append:${filePath}`);
    this.values.set(filePath, (this.values.get(filePath) ?? "") + content);
  }
}

class RecordingGit implements GitPort {
  public readonly trace: string[];
  public tracking: string | null = sha;
  public advertised = sha;
  public remote = sha;
  public remoteFailure: RunnerError | null = null;
  public branchPresent = false;
  public registered = false;
  public facts: RepositoryFacts;
  public constructor(
    trace: string[],
    repository = "jsburckhardt/soft-factory-runner",
  ) {
    this.trace = trace;
    this.facts = {
      root: "/tmp/soft-factory-fixture",
      commonDirectory: "/tmp/soft-factory-fixture/.git",
      identity: {
        nameWithOwner: repository,
        normalizedName: normalizeRepositoryName(repository),
      },
      remotes: ["origin"],
      pushDefault: null,
      currentBranchRemote: null,
    };
  }
  public async discover(): Promise<RepositoryFacts> {
    this.trace.push("git:discover");
    return this.facts;
  }
  public async branchExists(): Promise<boolean> {
    this.trace.push("git:branch-observe");
    return this.branchPresent;
  }
  public async registeredWorktreeExists(): Promise<boolean> {
    this.trace.push("git:worktree-observe");
    return this.registered;
  }
  public async fetch(_root: string, remote: string): Promise<void> {
    this.trace.push(`git:fetch:${remote}`);
  }
  public async advertisedHead(): Promise<{
    readonly branch: string;
    readonly sha: string;
  }> {
    this.trace.push("git:advertised-head");
    return { branch: "main", sha: this.advertised };
  }
  public async trackingSha(): Promise<string | null> {
    this.trace.push("git:tracking-sha");
    return this.tracking;
  }
  public async localHeadSha(worktreePath: string): Promise<string | null> {
    this.trace.push(`git:local-head:${worktreePath}`);
    return sha;
  }
  public async remoteBranchSha(
    _root: string,
    remote: string,
    branch: string,
  ): Promise<string | null> {
    this.trace.push(`git:remote-head:${remote}:${branch}`);
    if (this.remoteFailure !== null) throw this.remoteFailure;
    return this.remote;
  }
  public async createBranch(
    _root: string,
    branch: string,
    startSha: string,
  ): Promise<void> {
    this.trace.push(`git:create-branch:${branch}:${startSha}`);
  }
  public async addWorktree(
    _root: string,
    worktree: string,
    branch: string,
  ): Promise<void> {
    this.trace.push(`git:add-worktree:${worktree}:${branch}`);
  }
}

class RecordingGitHub implements GitHubPort {
  public readonly trace: string[];
  public issue: IssueFacts | null;
  public constructor(trace: string[], issue: IssueFacts | null) {
    this.trace = trace;
    this.issue = issue;
  }
  public async loadIssue(
    repository: string,
    issueNumber: number,
  ): Promise<IssueFacts | null> {
    this.trace.push(`github:issue:${repository}:${issueNumber}`);
    return this.issue;
  }
  public async loadPullRequest(_repository: string, pullRequestNumber: number) {
    this.trace.push(`github:pr:${pullRequestNumber}`);
    return {
      number: pullRequestNumber,
      state: "OPEN" as const,
      baseBranch: "main",
      headBranch: "feat/3-phase-1-run-one-issue",
      headSha: sha,
      closesIssues: [3],
      complete: true,
    };
  }
}

class RecordingTmux implements TmuxPort {
  public readonly trace: string[];
  public observedOverride: TmuxIdentity | null | undefined;
  public created: TmuxIdentity | null = null;
  public constructor(trace: string[]) {
    this.trace = trace;
  }
  public async createIssueWindow(input: {
    readonly sessionName: string;
    readonly windowName: string;
    readonly cwd: string;
    readonly executable: string;
    readonly args: readonly string[];
  }): Promise<TmuxIdentity> {
    this.trace.push(
      `tmux:create:${input.sessionName}:${input.windowName}:${input.cwd}:${input.executable} ${input.args.join(" ")}`,
    );
    this.created = {
      sessionName: input.sessionName,
      windowName: input.windowName,
      windowId: "@3",
      paneId: "%3",
      cwd: input.cwd,
    };
    return this.created;
  }
  public async observe(target: TmuxIdentity): Promise<TmuxIdentity | null> {
    this.trace.push(`tmux:observe:${target.paneId}`);
    return this.observedOverride === undefined ? target : this.observedOverride;
  }
  public async attach(target: TmuxIdentity): Promise<void> {
    this.trace.push(
      `tmux:attach:${target.sessionName}:${target.windowName}:${target.paneId}`,
    );
  }
}

class RecordingProcess implements ProcessPort {
  public readonly trace: string[];
  public exitCode = 0;
  public constructor(trace: string[]) {
    this.trace = trace;
  }
  public async runCopilot(input: {
    readonly executable: "copilot";
    readonly args: readonly string[];
    readonly cwd: string;
    readonly environment: Readonly<Record<string, string>>;
  }): Promise<{ readonly exitCode: number }> {
    this.trace.push(
      `process:${input.executable}:${input.args.join(" ")}:${input.cwd}:${input.environment.OTEL_RESOURCE_ATTRIBUTES}`,
    );
    return { exitCode: this.exitCode };
  }
}

function validIssue(overrides: Partial<IssueFacts> = {}): IssueFacts {
  return {
    number: 3,
    title: "Phase 1 run one issue",
    body: validBody,
    state: "OPEN",
    labels: ["feature"],
    openBlockers: [],
    openPullRequests: [],
    complete: true,
    ...overrides,
  };
}

function fixture(
  issue: IssueFacts | null = validIssue(),
  repository?: string,
): {
  readonly ports: RunnerPorts;
  readonly trace: string[];
  readonly files: MemoryFiles;
  readonly git: RecordingGit;
  readonly github: RecordingGitHub;
  readonly tmux: RecordingTmux;
  readonly processes: RecordingProcess;
} {
  const trace: string[] = [];
  const files = new MemoryFiles(trace);
  const git = new RecordingGit(trace, repository);
  const github = new RecordingGitHub(trace, issue);
  const tmux = new RecordingTmux(trace);
  const processes = new RecordingProcess(trace);
  let tick = 0;
  let id = 0;
  const ports: RunnerPorts = {
    files,
    git,
    github,
    tmux,
    processes,
    clock: {
      now: () => `2026-08-11T07:00:${String(tick++).padStart(2, "0")}.000Z`,
    },
    ids: { nextOwnerId: () => `owner-${++id}`, nextRunId: () => `run-${++id}` },
  };
  files.values.set(
    "/tmp/soft-factory-fixture/.trees/3/.soft-factory/agent-result.json",
    JSON.stringify({
      schemaVersion: 1,
      issueNumber: 3,
      outcome: "succeeded",
      branch: "feat/3-phase-1-run-one-issue",
      headSha: sha,
      prNumber: 13,
      acceptanceCriteria: Array.from({ length: 10 }, (_, index) => ({
        id: `AC-${index + 1}`,
        status: "verified",
        evidence: [`fixture:AC-${index + 1}`],
      })),
      validations: [
        { command: "just verify-focused", status: "passed" },
        { command: "just verify", status: "passed" },
      ],
      completedAt: "2026-08-11T07:01:00.000Z",
    }),
  );
  return { ports, trace, files, git, github, tmux, processes };
}

function readSnapshot(files: MemoryFiles): Readonly<Record<string, unknown>> {
  const text = files.values.get(
    "/tmp/soft-factory-fixture/.soft-factory/runs/3.json",
  );
  if (text === undefined) throw new Error("fixture snapshot missing");
  const value: unknown = JSON.parse(text);
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw new Error("fixture snapshot malformed");
  return value;
}

describe("deterministic issue-to-RPIV fixture", () => {
  it("proves issue to exact fetched branch, worktree, tmux, Copilot, status, and attach", async () => {
    const f = fixture();
    const run = await runCli(
      ["run", "--issue", "3", "--json"],
      "/tmp/fixture-start",
      f.ports,
    );
    expect(run.exitCode).toBe(0);
    expect(JSON.parse(run.stdout).run.state).toBe("running_rpiv");
    const worker = await runCli(
      ["internal", "run-agent", "--issue", "3"],
      "/tmp/soft-factory-fixture/.trees/3",
      f.ports,
    );
    expect(worker).toEqual({
      exitCode: 0,
      stdout: `RPIV worker 3 exited: completed.
`,
      stderr: "",
    });
    const status = await runCli(
      ["status", "3", "--json"],
      "/tmp/fixture-start",
      f.ports,
    );
    expect(JSON.parse(status.stdout)).toMatchObject({
      persisted: { state: "completed" },
      observed: { paneId: "%3" },
    });
    const attached = await runCli(
      ["attach", "3"],
      "/tmp/fixture-start",
      f.ports,
    );
    expect(attached.stdout).toContain("sf-jsburckhardt-soft-factory-runner:3");

    const snapshot = readSnapshot(f.files);
    expect(snapshot.fetchedBaseProof).toMatchObject({
      remote: "origin",
      defaultBranch: "main",
      advertisedHeadSha: sha,
      trackingRefSha: sha,
      matches: true,
    });
    expect(snapshot.state).toBe("completed");
    expect(snapshot.finalization).toMatchObject({
      reconciliation: { passed: true, decisionCode: "COMPLETION_PROVED" },
    });
    expect(f.trace).toContain(
      `git:create-branch:feat/3-phase-1-run-one-issue:${sha}`,
    );
    expect(f.trace).toContain(
      "tmux:create:sf-jsburckhardt-soft-factory-runner:3:/tmp/soft-factory-fixture/.trees/3:soft-factory internal run-agent --issue 3",
    );
    expect(f.trace).toContain(
      "process:copilot:--yolo --name issue-3 --agent rpiv --prompt Deliver issue #3:/tmp/soft-factory-fixture/.trees/3:project.name=jsburckhardt-soft-factory-runner,issue.id=issue-3",
    );
    expect(
      f.trace.some((entry) =>
        entry.includes("/workspaces/soft-factory-runner/.trees/3"),
      ),
    ).toBe(false);

    const fetchIndex = f.trace.indexOf("git:fetch:origin");
    const proofWriteIndex = f.trace.findIndex(
      (entry, index) =>
        index > fetchIndex && entry.startsWith("snapshot:write:"),
    );
    const branchIndex = f.trace.findIndex((entry) =>
      entry.startsWith("git:create-branch:"),
    );
    expect(fetchIndex).toBeLessThan(proofWriteIndex);
    expect(proofWriteIndex).toBeLessThan(branchIndex);
    expect(
      f.trace.filter((entry) => entry.startsWith("lock:create:")).length,
    ).toBe(1);
    expect(
      f.trace.filter((entry) => entry.startsWith("git:create-branch:")).length,
    ).toBe(1);
    expect(
      f.trace.filter((entry) => entry.startsWith("git:add-worktree:")).length,
    ).toBe(1);
    expect(
      f.trace.filter((entry) => entry.startsWith("tmux:create:")).length,
    ).toBe(1);
    expect(
      f.trace.filter((entry) => entry.startsWith("process:copilot:")).length,
    ).toBe(1);
    expect(
      f.trace.filter((entry) => entry.startsWith("git:remote-head:")).length,
    ).toBe(1);
    expect(
      f.trace.findIndex((entry) => entry.startsWith("process:copilot:")),
    ).toBeLessThan(
      f.trace.findIndex((entry) => entry.startsWith("git:remote-head:")),
    );
  });

  it("applies exact names and telemetry for every repository and issue launch", async () => {
    const f = fixture(
      validIssue({ number: 7, title: "Other" }),
      "Owner/Repo.Name",
    );
    await new IssueRunService(f.ports).run(7, "/tmp/start");
    await new IssueRunService(f.ports).runWorker(7, "/tmp/start");
    expect(
      f.trace.find((entry) => entry.startsWith("process:copilot:")),
    ).toContain("--name issue-7");
    expect(
      f.trace.find((entry) => entry.startsWith("process:copilot:")),
    ).toContain("project.name=owner-repo-name,issue.id=issue-7");
  });

  it("classifies nonzero Copilot exit as failed", async () => {
    const f = fixture();
    f.processes.exitCode = 9;
    await new IssueRunService(f.ports).run(3, "/tmp/start");
    const snapshot = await new IssueRunService(f.ports).runWorker(
      3,
      "/tmp/start",
    );
    expect(snapshot).toMatchObject({
      state: "failed",
      copilot: { exitCode: 9 },
      error: { code: "EXTERNAL_COMMAND_FAILED" },
    });
  });
});

describe("zero-exit false-completion rejection", () => {
  it.each([
    ["missing artifact", null],
    ["malformed artifact", "{"],
    ["unsupported artifact", JSON.stringify({ schemaVersion: 9 })],
  ])("ends interrupted for %s", async (_name, artifact) => {
    const f = fixture();
    await new IssueRunService(f.ports).run(3, "/tmp/start");
    const resultPath =
      "/tmp/soft-factory-fixture/.trees/3/.soft-factory/agent-result.json";
    if (artifact === null) f.files.values.delete(resultPath);
    else f.files.values.set(resultPath, artifact);
    const final = await new IssueRunService(f.ports).runWorker(3, "/tmp/start");
    expect(final.state).toBe("interrupted");
    expect(final.state).not.toBe("completed");
    const events =
      f.files.values.get(
        "/tmp/soft-factory-fixture/.soft-factory/events/3.jsonl",
      ) ?? "";
    expect(events).toContain("finalizing");
    expect(events).not.toContain("COMPLETION_PROVED");
    expect(f.trace.some((entry) => entry.startsWith("git:local-head:"))).toBe(
      false,
    );
  });
  it("persists authoritative remote divergence as a failed SHA mismatch", async () => {
    const f = fixture();
    f.git.remote = "b".repeat(40);
    await new IssueRunService(f.ports).run(3, "/tmp/start");
    const final = await new IssueRunService(f.ports).runWorker(3, "/tmp/start");
    expect(final).toMatchObject({
      state: "failed",
      error: { code: "RESULT_REMOTE_SHA_MISMATCH" },
      finalization: {
        git: { remoteHeadSha: "b".repeat(40) },
        reconciliation: { decisionCode: "RESULT_REMOTE_SHA_MISMATCH" },
      },
    });
    const events =
      f.files.values.get(
        "/tmp/soft-factory-fixture/.soft-factory/events/3.jsonl",
      ) ?? "";
    expect(events).toContain("RESULT_REMOTE_SHA_MISMATCH");
    expect(events).not.toContain("COMPLETION_PROVED");
  });

  it("persists an interrupted incomplete proof when the remote query fails", async () => {
    const f = fixture();
    f.git.remoteFailure = new RunnerError(
      "COMPLETION_PROOF_INCOMPLETE",
      "Authoritative remote query timed out.",
      "Retry finalization.",
    );
    await new IssueRunService(f.ports).run(3, "/tmp/start");
    const final = await new IssueRunService(f.ports).runWorker(3, "/tmp/start");
    expect(final).toMatchObject({
      state: "interrupted",
      error: { code: "COMPLETION_PROOF_INCOMPLETE" },
    });
    expect(final.state).not.toBe("completed");
  });
});

describe("readiness and safe blocking", () => {
  it.each([
    ["closed", validIssue({ state: "CLOSED" }), "ISSUE_CLOSED"],
    [
      "blocked label",
      validIssue({ labels: ["feature", "BLOCKED"] }),
      "ISSUE_BLOCKED",
    ],
    [
      "blocked relationship",
      validIssue({ openBlockers: [2] }),
      "ISSUE_BLOCKED",
    ],
    [
      "missing markers",
      validIssue({ body: "- [ ] criterion" }),
      "ACCEPTANCE_CRITERIA_INVALID",
    ],
    [
      "duplicate markers",
      validIssue({
        body: `${validBody}
${validBody}`,
      }),
      "ACCEPTANCE_CRITERIA_INVALID",
    ],
    [
      "empty block",
      validIssue({
        body: `<!-- ACCEPTANCE_CRITERIA_START -->
<!-- ACCEPTANCE_CRITERIA_END -->`,
      }),
      "ACCEPTANCE_CRITERIA_INVALID",
    ],
    [
      "incomplete pagination",
      validIssue({ complete: false }),
      "GITHUB_PROOF_INCOMPLETE",
    ],
    [
      "unmapped type",
      validIssue({ labels: ["question"] }),
      "ISSUE_TYPE_UNMAPPED",
    ],
    [
      "ambiguous type",
      validIssue({ labels: ["feature", "fix"] }),
      "ISSUE_TYPE_AMBIGUOUS",
    ],
    [
      "closing PR",
      validIssue({
        openPullRequests: [
          { number: 8, headBranch: "other", closesIssues: [3] },
        ],
      }),
      "ISSUE_CONFLICT",
    ],
    [
      "planned branch PR",
      validIssue({
        openPullRequests: [
          {
            number: 8,
            headBranch: "feat/3-phase-1-run-one-issue",
            closesIssues: [],
          },
        ],
      }),
      "ISSUE_CONFLICT",
    ],
  ])("rejects %s before ownership", async (_name, issue, code) => {
    const f = fixture(issue);
    if (_name === "ambiguous type")
      f.files.values.set(
        "/tmp/soft-factory-fixture/.soft-factory/config.yml",
        `branch_types:
  fix: fix
`,
      );
    const result = await runCli(["run", "--issue", "3"], "/tmp/start", f.ports);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain(String(code));
    expect(f.trace.some((entry) => entry.startsWith("lock:create:"))).toBe(
      false,
    );
  });

  it("rejects nonexistent issues without owned effects", async () => {
    const f = fixture(null);
    const result = await runCli(["run", "--issue", "3"], "/tmp/start", f.ports);
    expect(result.stderr).toContain("ISSUE_NOT_FOUND");
    expect(f.trace.some((entry) => entry.startsWith("lock:create:"))).toBe(
      false,
    );
  });

  it("validates marker-wrapped checkbox counts", () => {
    expect(validateAcceptanceCriteria(validBody)).toBe(10);
    expect(() =>
      validateAcceptanceCriteria(
        "<!-- ACCEPTANCE_CRITERIA_END --><!-- ACCEPTANCE_CRITERIA_START -->",
      ),
    ).toThrow(RunnerError);
  });

  it("resolves documented remote precedence and ambiguity", () => {
    const repository = fixture().git.facts;
    expect(resolveRemote(repository, "origin")).toBe("origin");
    expect(
      resolveRemote(
        {
          ...repository,
          remotes: ["origin", "upstream"],
          pushDefault: "upstream",
        },
        null,
      ),
    ).toBe("upstream");
    expect(
      resolveRemote(
        {
          ...repository,
          remotes: ["origin", "upstream"],
          currentBranchRemote: "origin",
        },
        null,
      ),
    ).toBe("origin");
    expect(() => resolveRemote({ ...repository, remotes: [] }, null)).toThrow(
      "no Git remote",
    );
    expect(() =>
      resolveRemote({ ...repository, remotes: ["one", "two"] }, null),
    ).toThrow("multiple remotes");
    expect(() => resolveRemote(repository, "missing")).toThrow(
      "does not exist",
    );
  });

  it("blocks each unproved fetched base before branch or worktree", async () => {
    for (const scenario of ["base", "tracking", "sha"] as const) {
      const f = fixture();
      if (scenario === "tracking") f.git.tracking = null;
      if (scenario === "sha") f.git.tracking = "b".repeat(40);
      const promise = proveFetchedBase({
        git: f.git,
        repository: f.git.facts,
        remote: "origin",
        configuredBase: scenario === "base" ? "trunk" : null,
        fetchedAt: "2026-08-11T00:00:00Z",
      });
      await expect(promise).rejects.toBeInstanceOf(RunnerError);
      expect(
        f.trace.some((entry) => entry.startsWith("git:create-branch:")),
      ).toBe(false);
      expect(
        f.trace.some((entry) => entry.startsWith("git:add-worktree:")),
      ).toBe(false);
    }
  });

  it("preserves unknown worktree, branch, and snapshot resources", async () => {
    for (const kind of ["branch", "path", "registered", "snapshot"] as const) {
      const f = fixture();
      if (kind === "branch") f.git.branchPresent = true;
      if (kind === "path")
        f.files.values.set("/tmp/soft-factory-fixture/.trees/3", "unknown");
      if (kind === "registered") f.git.registered = true;
      if (kind === "snapshot")
        f.files.values.set(
          "/tmp/soft-factory-fixture/.soft-factory/runs/3.json",
          "unknown",
        );
      const before = new Map(f.files.values);
      const result = await runCli(
        ["run", "--issue", "3"],
        "/tmp/start",
        f.ports,
      );
      expect(result.stderr).toContain("RESOURCE_OWNERSHIP_UNKNOWN");
      if (kind === "path")
        expect(f.files.values.get("/tmp/soft-factory-fixture/.trees/3")).toBe(
          before.get("/tmp/soft-factory-fixture/.trees/3"),
        );
      if (kind === "snapshot")
        expect(
          f.files.values.get(
            "/tmp/soft-factory-fixture/.soft-factory/runs/3.json",
          ),
        ).toBe("unknown");
      expect(
        f.trace.some((entry) => entry.startsWith("git:create-branch:")),
      ).toBe(false);
    }
  });
});

describe("ownership, status, and attach", () => {
  it("gives two simultaneous starts exactly one owner and resource set", async () => {
    const f = fixture();
    const serviceA = new IssueRunService(f.ports);
    const serviceB = new IssueRunService(f.ports);
    const results = await Promise.allSettled([
      serviceA.run(3, "/tmp/start"),
      serviceB.run(3, "/tmp/start"),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    const rejected = results.find((result) => result.status === "rejected");
    expect(rejected?.status).toBe("rejected");
    if (rejected?.status === "rejected")
      expect(rejected.reason).toMatchObject({ code: "ISSUE_ALREADY_OWNED" });
    expect(
      f.trace.filter((entry) => entry.startsWith("git:create-branch:")).length,
    ).toBe(1);
    expect(
      f.trace.filter((entry) => entry.startsWith("tmux:create:")).length,
    ).toBe(1);
  });

  it("renders human status from common facts and blocks mismatched attach", async () => {
    const f = fixture();
    await new IssueRunService(f.ports).run(3, "/tmp/start");
    const human = await runCli(["status", "3"], "/tmp/start", f.ports);
    expect(human.stdout).toContain("Persisted state: running_rpiv");
    if (f.tmux.created === null)
      throw new Error("fixture tmux identity missing");
    f.tmux.observedOverride = { ...f.tmux.created, paneId: "%wrong" };
    const result = await runCli(["attach", "3"], "/tmp/start", f.ports);
    expect(result.stderr).toContain("TMUX_TARGET_MISMATCH");
    f.tmux.observedOverride = null;
    const missing = await runCli(["attach", "3"], "/tmp/start", f.ports);
    expect(missing.stderr).toContain("TMUX_TARGET_MISSING");
  });

  it("returns stable missing and malformed state errors", async () => {
    const f = fixture();
    expect(
      (await runCli(["status", "3"], "/tmp/start", f.ports)).stderr,
    ).toContain("STATE_NOT_FOUND");
    f.files.values.set(
      "/tmp/soft-factory-fixture/.soft-factory/runs/3.json",
      "not-json",
    );
    expect(
      (await runCli(["status", "3"], "/tmp/start", f.ports)).stderr,
    ).toContain("STATE_INVALID");
    f.files.values.set(
      "/tmp/soft-factory-fixture/.soft-factory/runs/3.json",
      JSON.stringify({ schemaVersion: 2 }),
    );
    expect(
      (await runCli(["status", "3"], "/tmp/start", f.ports)).stderr,
    ).toContain("STATE_INVALID");
  });
});
