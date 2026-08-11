import path from "node:path";
import type {
  AgentResultV1,
  CopilotLaunchFacts,
  OwnerRecordV1,
  RepositoryFacts,
  RunSnapshotV2,
  StatusFacts,
  TmuxIdentity,
} from "./domain";
import {
  REQUIRED_VALIDATIONS,
  issueName,
  normalizeRepositoryName,
  otelResourceAttributes,
  tmuxSessionName,
} from "./domain";
import { parseAgentResult, reconcileCompletion } from "./completion";
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
  ): Promise<RunSnapshotV2> {
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
    let snapshot: RunSnapshotV2 = {
      schemaVersion: 2,
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
      requiredAcceptanceCriteria: prepared.requiredAcceptanceCriteria,
      requiredValidations: REQUIRED_VALIDATIONS,
      finalization: null,
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
  ): Promise<RunSnapshotV2> {
    const repository = await this.ports.git.discover(startPath);
    const store = new RunStore(
      repository.root,
      this.ports.files,
      this.ports.clock,
    );
    const loaded = await store.load(issueNumber);
    if (
      loaded.schemaVersion !== 2 ||
      loaded.state !== "running_rpiv" ||
      loaded.tmux === null
    ) {
      throw new RunnerError(
        "STATE_INVALID",
        `Issue #${issueNumber} is not ready for its RPIV worker or lacks version 2 evidence requirements.`,
        "Start the issue with this Runner version and preserve the recorded worker state.",
      );
    }
    let snapshot: RunSnapshotV2 = loaded;
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
      const processResult = await this.ports.processes.runCopilot({
        executable: "copilot",
        args,
        cwd: snapshot.worktreePath,
        environment: { OTEL_RESOURCE_ATTRIBUTES: resourceAttributes },
      });
      if (processResult.exitCode !== 0) {
        snapshot = {
          ...snapshot,
          state: "failed",
          copilot: { ...launch, exitCode: processResult.exitCode },
          error: {
            code: "EXTERNAL_COMMAND_FAILED",
            message: `Copilot exited with code ${processResult.exitCode}.`,
          },
          updatedAt: this.ports.clock.now(),
        };
        await store.save(snapshot, "running_rpiv", "copilot-failed");
        return snapshot;
      }

      snapshot = {
        ...snapshot,
        state: "finalizing",
        copilot: { ...launch, exitCode: 0 },
        error: null,
        updatedAt: this.ports.clock.now(),
      };
      await store.save(snapshot, "running_rpiv", "copilot-exited-zero");

      let result: AgentResultV1;
      try {
        result = parseAgentResult(
          await this.ports.files.readAgentResult(snapshot.worktreePath),
        );
      } catch (cause: unknown) {
        if (!isRunnerError(cause)) throw cause;
        snapshot = {
          ...snapshot,
          state: "interrupted",
          finalization: {
            result: null,
            git: null,
            pullRequest: null,
            reconciliation: null,
          },
          error: { code: cause.code, message: cause.message },
          updatedAt: this.ports.clock.now(),
        };
        await store.save(snapshot, "finalizing", "result-proof-incomplete");
        return snapshot;
      }

      if (snapshot.fetchedBaseProof === null) {
        snapshot = await this.persistIncompleteFinalization(
          store,
          snapshot,
          result,
          "Fetched-base proof is missing.",
        );
        return snapshot;
      }
      if (result.outcome !== "succeeded") {
        const decision = reconcileCompletion({
          issueNumber,
          branch: snapshot.branch,
          baseBranch: snapshot.fetchedBaseProof.defaultBranch,
          remote: snapshot.fetchedBaseProof.remote,
          requiredAcceptanceCriteria: snapshot.requiredAcceptanceCriteria,
          requiredValidations: snapshot.requiredValidations,
          result,
          git: null,
          pullRequest: null,
        });
        snapshot = {
          ...snapshot,
          state: decision.state,
          finalization: {
            result,
            git: null,
            pullRequest: null,
            reconciliation: decision.reconciliation,
          },
          error: {
            code: decision.code,
            message: `RPIV reported ${result.outcome}.`,
          },
          updatedAt: this.ports.clock.now(),
        };
        await store.save(snapshot, "finalizing", decision.code);
        return snapshot;
      }

      try {
        const [localHeadSha, remoteHeadSha, pullRequest] = await Promise.all([
          this.ports.git.localHeadSha(snapshot.worktreePath),
          this.ports.git.remoteBranchSha(
            repository.root,
            snapshot.fetchedBaseProof.remote,
            snapshot.branch,
          ),
          this.ports.github.loadPullRequest(
            snapshot.repository,
            result.prNumber,
          ),
        ]);
        const git = {
          localHeadSha,
          remote: snapshot.fetchedBaseProof.remote,
          remoteBranch: snapshot.branch,
          remoteHeadSha,
        };
        const decision = reconcileCompletion({
          issueNumber,
          branch: snapshot.branch,
          baseBranch: snapshot.fetchedBaseProof.defaultBranch,
          remote: snapshot.fetchedBaseProof.remote,
          requiredAcceptanceCriteria: snapshot.requiredAcceptanceCriteria,
          requiredValidations: snapshot.requiredValidations,
          result,
          git,
          pullRequest,
        });
        snapshot = {
          ...snapshot,
          state: decision.state,
          finalization: {
            result,
            git,
            pullRequest,
            reconciliation: decision.reconciliation,
          },
          error:
            decision.state === "completed"
              ? null
              : {
                  code: decision.code,
                  message: "Completion evidence did not reconcile.",
                },
          updatedAt: this.ports.clock.now(),
        };
        await store.save(snapshot, "finalizing", decision.code);
        return snapshot;
      } catch (cause: unknown) {
        if (!isRunnerError(cause)) throw cause;
        snapshot = await this.persistIncompleteFinalization(
          store,
          snapshot,
          result,
          cause.message,
          cause.code,
        );
        return snapshot;
      }
    } catch (cause: unknown) {
      if (!isRunnerError(cause)) throw cause;
      snapshot = {
        ...snapshot,
        state: "failed",
        error: { code: cause.code, message: cause.message },
        updatedAt: this.ports.clock.now(),
      };
      await store.save(
        snapshot,
        snapshot.state === "finalizing" ? "finalizing" : "running_rpiv",
        "copilot-launch-failed",
      );
      throw cause;
    }
  }

  private async persistIncompleteFinalization(
    store: RunStore,
    snapshot: RunSnapshotV2,
    result: AgentResultV1,
    message: string,
    code = "COMPLETION_PROOF_INCOMPLETE",
  ): Promise<RunSnapshotV2> {
    const interrupted: RunSnapshotV2 = {
      ...snapshot,
      state: "interrupted",
      finalization: {
        result,
        git: null,
        pullRequest: null,
        reconciliation: null,
      },
      error: { code, message },
      updatedAt: this.ports.clock.now(),
    };
    await store.save(interrupted, "finalizing", "completion-proof-incomplete");
    return interrupted;
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
