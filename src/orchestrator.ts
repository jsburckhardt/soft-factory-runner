import path from "node:path";
import type {
  CopilotLaunchFacts,
  OwnerRecordV1,
  RepositoryFacts,
  RunSnapshotV1,
  StatusFacts,
  TmuxIdentity,
} from "./domain";
import {
  issueName,
  normalizeRepositoryName,
  otelResourceAttributes,
  tmuxSessionName,
} from "./domain";
import { parseConfiguration, renderPrompt } from "./config";
import { isRunnerError, RunnerError } from "./errors";
import type { RunnerPorts } from "./ports";
import { RunStore } from "./persistence";
import { prepareIssue, proveFetchedBase, resolveRemote } from "./readiness";

export class IssueRunService {
  public constructor(
    private readonly ports: RunnerPorts,
    private readonly executable = "soft-factory",
  ) {}

  public async run(
    issueNumber: number,
    startPath: string,
  ): Promise<RunSnapshotV1> {
    const repository = await this.ports.git.discover(startPath);
    const configuration = parseConfiguration(
      await this.ports.files.readText(
        path.join(repository.root, ".soft-factory", "config.yml"),
      ),
    );
    const issue = await this.ports.github.loadIssue(
      repository.identity.nameWithOwner,
      issueNumber,
    );
    if (issue === null) {
      throw new RunnerError(
        "ISSUE_NOT_FOUND",
        `Issue #${issueNumber} does not exist.`,
        "Choose an existing open GitHub issue.",
      );
    }
    const prepared = prepareIssue(issue, configuration);
    const store = new RunStore(
      repository.root,
      this.ports.files,
      this.ports.clock,
    );
    const owner: OwnerRecordV1 = {
      schemaVersion: 1,
      issueNumber,
      ownerId: this.ports.ids.nextOwnerId(),
      runId: this.ports.ids.nextRunId(),
      repository: repository.identity.nameWithOwner,
      acquiredAt: this.ports.clock.now(),
    };
    if (!(await store.acquire(issueNumber, owner))) {
      throw new RunnerError(
        "ISSUE_ALREADY_OWNED",
        `Issue #${issueNumber} already has a local owner.`,
        "Inspect soft-factory status and preserve the existing lock.",
      );
    }
    const worktreePath = path.join(
      repository.root,
      ".trees",
      String(issueNumber),
    );
    let snapshot: RunSnapshotV1 = {
      schemaVersion: 1,
      runId: owner.runId,
      ownerId: owner.ownerId,
      repository: owner.repository,
      issueNumber,
      state: "acquiring_lock",
      branchType: prepared.branchType,
      branch: prepared.branchName,
      worktreePath,
      fetchedBaseProof: null,
      tmux: null,
      copilot: null,
      error: null,
      updatedAt: this.ports.clock.now(),
    };
    if (await store.snapshotExists(issueNumber)) {
      throw new RunnerError(
        "RESOURCE_OWNERSHIP_UNKNOWN",
        "An existing run snapshot is not owned by the newly acquired lock.",
        "Preserve the snapshot and lock, then reconcile ownership manually.",
      );
    }
    await store.save(snapshot, null, "ownership-acquired");
    try {
      await this.assertResourcesAbsent(
        repository,
        prepared.branchName,
        worktreePath,
      );
      const remote = resolveRemote(repository, configuration.remote);
      const proof = await proveFetchedBase({
        git: this.ports.git,
        repository,
        remote,
        configuredBase: configuration.baseBranch,
        fetchedAt: this.ports.clock.now(),
      });
      snapshot = {
        ...snapshot,
        state: "preparing_worktree",
        fetchedBaseProof: proof,
        updatedAt: this.ports.clock.now(),
      };
      await store.save(snapshot, "acquiring_lock", "fetched-base-proven");
      await this.ports.git.createBranch(
        repository.root,
        prepared.branchName,
        proof.advertisedHeadSha,
      );
      await this.ports.git.addWorktree(
        repository.root,
        worktreePath,
        prepared.branchName,
      );
      snapshot = {
        ...snapshot,
        state: "starting_tmux",
        updatedAt: this.ports.clock.now(),
      };
      await store.save(snapshot, "preparing_worktree", "worktree-prepared");
      const tmux = await this.ports.tmux.createIssueWindow({
        sessionName: tmuxSessionName(repository.identity),
        windowName: String(issueNumber),
        cwd: worktreePath,
        executable: this.executable,
        args: ["internal", "run-agent", "--issue", String(issueNumber)],
      });
      snapshot = {
        ...snapshot,
        state: "running_rpiv",
        tmux,
        updatedAt: this.ports.clock.now(),
      };
      await store.save(snapshot, "starting_tmux", "visible-worker-started");
      return snapshot;
    } catch (cause: unknown) {
      if (!isRunnerError(cause)) throw cause;
      const priorState = snapshot.state;
      snapshot = {
        ...snapshot,
        state: "blocked",
        error: { code: cause.code, message: cause.message },
        updatedAt: this.ports.clock.now(),
      };
      await store.save(snapshot, priorState, "run-blocked");
      throw cause;
    }
  }

  public async runWorker(
    issueNumber: number,
    startPath: string,
  ): Promise<RunSnapshotV1> {
    const repository = await this.ports.git.discover(startPath);
    const store = new RunStore(
      repository.root,
      this.ports.files,
      this.ports.clock,
    );
    let snapshot = await store.load(issueNumber);
    if (snapshot.state !== "running_rpiv" || snapshot.tmux === null) {
      throw new RunnerError(
        "STATE_INVALID",
        `Issue #${issueNumber} is not ready for its RPIV worker.`,
        "Start the issue and preserve the recorded worker state.",
      );
    }
    const configuration = parseConfiguration(
      await this.ports.files.readText(
        path.join(repository.root, ".soft-factory", "config.yml"),
      ),
    );
    const identity = {
      nameWithOwner: snapshot.repository,
      normalizedName: normalizeRepositoryName(snapshot.repository),
    };
    const resourceAttributes = otelResourceAttributes(identity, issueNumber);
    const args = [
      "--yolo",
      "--name",
      issueName(issueNumber),
      "--agent",
      "rpiv",
      "--prompt",
      renderPrompt(configuration.promptTemplate, issueNumber),
    ];
    const launch: CopilotLaunchFacts = {
      executable: "copilot",
      args,
      cwd: snapshot.worktreePath,
      resourceAttributes,
      exitCode: null,
    };
    snapshot = {
      ...snapshot,
      copilot: launch,
      updatedAt: this.ports.clock.now(),
    };
    await store.save(snapshot, "running_rpiv", "copilot-launched");
    try {
      const result = await this.ports.processes.runCopilot({
        executable: "copilot",
        args,
        cwd: snapshot.worktreePath,
        environment: { OTEL_RESOURCE_ATTRIBUTES: resourceAttributes },
      });
      const state = result.exitCode === 0 ? "interrupted" : "failed";
      snapshot = {
        ...snapshot,
        state,
        copilot: { ...launch, exitCode: result.exitCode },
        error:
          result.exitCode === 0
            ? null
            : {
                code: "EXTERNAL_COMMAND_FAILED",
                message: `Copilot exited with code ${result.exitCode}.`,
              },
        updatedAt: this.ports.clock.now(),
      };
      await store.save(
        snapshot,
        "running_rpiv",
        result.exitCode === 0 ? "completion-unproved" : "copilot-failed",
      );
      return snapshot;
    } catch (cause: unknown) {
      if (!isRunnerError(cause)) throw cause;
      snapshot = {
        ...snapshot,
        state: "failed",
        error: { code: cause.code, message: cause.message },
        updatedAt: this.ports.clock.now(),
      };
      await store.save(snapshot, "running_rpiv", "copilot-launch-failed");
      throw cause;
    }
  }

  public async status(
    issueNumber: number,
    startPath: string,
  ): Promise<StatusFacts> {
    const repository = await this.ports.git.discover(startPath);
    const persisted = await new RunStore(
      repository.root,
      this.ports.files,
      this.ports.clock,
    ).load(issueNumber);
    const observed =
      persisted.tmux === null
        ? null
        : await this.ports.tmux.observe(persisted.tmux);
    return { schemaVersion: 1, issueNumber, persisted, observed };
  }

  public async attach(
    issueNumber: number,
    startPath: string,
  ): Promise<TmuxIdentity> {
    const facts = await this.status(issueNumber, startPath);
    if (facts.persisted.tmux === null || facts.observed === null) {
      throw new RunnerError(
        "TMUX_TARGET_MISSING",
        `No observable tmux target exists for issue #${issueNumber}.`,
        "Inspect status and preserve the recorded state.",
      );
    }
    if (!sameTmux(facts.persisted.tmux, facts.observed)) {
      throw new RunnerError(
        "TMUX_TARGET_MISMATCH",
        `Observed tmux target does not match issue #${issueNumber}.`,
        "Do not attach; reconcile the recorded and observed identities.",
      );
    }
    await this.ports.tmux.attach(facts.persisted.tmux);
    return facts.persisted.tmux;
  }

  private async assertResourcesAbsent(
    repository: RepositoryFacts,
    branch: string,
    worktreePath: string,
  ): Promise<void> {
    const branchExists = await this.ports.git.branchExists(
      repository.root,
      branch,
    );
    const pathExists = await this.ports.files.exists(worktreePath);
    const registered = await this.ports.git.registeredWorktreeExists(
      repository.root,
      worktreePath,
    );
    if (branchExists || pathExists || registered) {
      throw new RunnerError(
        "RESOURCE_OWNERSHIP_UNKNOWN",
        "A planned branch, path, or worktree already exists without matching Runner ownership.",
        "Preserve the unknown resource and reconcile it manually before retrying.",
        { details: { branchExists, pathExists, registered } },
      );
    }
  }
}

function sameTmux(expected: TmuxIdentity, observed: TmuxIdentity): boolean {
  return (
    expected.sessionName === observed.sessionName &&
    expected.windowName === observed.windowName &&
    expected.windowId === observed.windowId &&
    expected.paneId === observed.paneId &&
    expected.cwd === observed.cwd
  );
}
