import path from "node:path";
import { claimConcurrencySlot } from "./admission";
import { parseAgentResult, reconcileCompletion } from "./completion";
import { parseConfiguration, renderPrompt } from "./config";
import type {
  AgentResultV1,
  CleanupFactsV1,
  CleanupMode,
  CleanupStep,
  ControlOutcomeV1,
  CopilotLaunchFacts,
  LaunchIntentV1,
  OwnerRecordV1,
  ReconciliationReportV1,
  RepositoryFacts,
  RetainedLogV1,
  RunSnapshotV2,
  RunSnapshotV3,
  RunState,
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
import { isRunnerError, RunnerError } from "./errors";
import { RunStore } from "./persistence";
import type { RunnerPorts } from "./ports";
import { collectReconciliation } from "./reconciliation";
import { prepareIssue, proveFetchedBase, resolveRemote } from "./readiness";

const MAX_LOG_BYTES = 2 * 1024 * 1024;

export class IssueRunService {
  public constructor(
    private readonly ports: RunnerPorts,
    private readonly executable = "soft-factory",
  ) {}

  public async run(
    issueNumber: number,
    startPath: string,
  ): Promise<RunSnapshotV3> {
    const repository = await this.ports.git.discover(startPath);
    const store = this.store(repository.root);
    const configuration = await this.configuration(repository.root);
    if (await store.snapshotExists(issueNumber)) {
      let existing = await store.load(issueNumber);
      let report = await collectReconciliation({
        persisted: existing,
        repositoryRoot: repository.root,
        ports: this.ports,
        store,
      });
      if (
        existing.schemaVersion === 3 &&
        report.safeActions.includes("automatic_clean")
      ) {
        existing = await this.performCleanup(
          "automatic_merged",
          report,
          repository,
          store,
        );
        report = await collectReconciliation({
          persisted: existing,
          repositoryRoot: repository.root,
          ports: this.ports,
          store,
        });
      }
      throw new RunnerError(
        "RUN_EXISTS",
        `Issue #${issueNumber} already has persisted Runner state.`,
        "Use reconcile, status, or resume; run never relaunches existing state.",
        {
          details: {
            state: existing.state,
            decisionCode: report.decisionCode,
            safeActions: report.safeActions,
          },
        },
      );
    }
    const issue = await this.ports.github.loadIssue(
      repository.identity.nameWithOwner,
      issueNumber,
    );
    if (issue === null)
      throw new RunnerError(
        "ISSUE_NOT_FOUND",
        `Issue #${issueNumber} does not exist.`,
        "Choose an existing open GitHub issue.",
      );
    const prepared = prepareIssue(issue, configuration);
    const owner: OwnerRecordV1 = {
      schemaVersion: 1,
      issueNumber,
      ownerId: this.ports.ids.nextOwnerId(),
      runId: this.ports.ids.nextRunId(),
      repository: repository.identity.nameWithOwner,
      acquiredAt: this.ports.clock.now(),
    };
    if (!(await store.acquire(issueNumber, owner)))
      throw new RunnerError(
        "ISSUE_ALREADY_OWNED",
        `Issue #${issueNumber} already has a local owner.`,
        "Inspect soft-factory status and preserve the existing lock.",
      );
    const admission = await claimConcurrencySlot({
      store,
      owner,
      maxConcurrentRuns: configuration.maxConcurrentRuns,
      acquiredAt: this.ports.clock.now(),
    });
    const worktreePath = path.join(
      repository.root,
      ".trees",
      String(issueNumber),
    );
    let snapshot: RunSnapshotV3 = {
      schemaVersion: 3,
      revision: 1,
      attempt: 1,
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
      admission: admission.lease,
      launchIntent: null,
      workerProcess: null,
      rpivProcess: null,
      stop: null,
      cleanup: null,
      logs: [],
      mergedPullRequest: null,
      error: null,
      updatedAt: this.ports.clock.now(),
      requiredAcceptanceCriteria: prepared.requiredAcceptanceCriteria,
      requiredValidations: REQUIRED_VALIDATIONS,
      finalization: null,
    };
    await store.save(snapshot, null, "ownership-and-slot-acquired");
    try {
      snapshot = await this.prepareResources(
        snapshot,
        repository,
        configuration.remote,
        configuration.baseBranch,
        store,
      );
      return snapshot;
    } catch (cause: unknown) {
      if (!isRunnerError(cause)) throw cause;
      const blocked = this.next(snapshot, {
        state: "blocked",
        error: { code: cause.code, message: cause.message },
      });
      await store.save(blocked, snapshot.state, "run-blocked");
      await this.releaseTerminalLease(store, blocked);
      throw cause;
    }
  }

  private async prepareResources(
    initial: RunSnapshotV3,
    repository: RepositoryFacts,
    configuredRemote: string | null,
    configuredBase: string | null,
    store: RunStore,
  ): Promise<RunSnapshotV3> {
    let snapshot = initial;
    if (snapshot.state === "acquiring_lock") {
      await this.assertResourcesAbsent(
        repository,
        snapshot.branch,
        snapshot.worktreePath,
      );
      const remote = resolveRemote(repository, configuredRemote);
      const proof = await proveFetchedBase({
        git: this.ports.git,
        repository,
        remote,
        configuredBase,
        fetchedAt: this.ports.clock.now(),
      });
      const preparing = this.next(snapshot, {
        state: "preparing_worktree",
        fetchedBaseProof: proof,
      });
      await store.save(preparing, snapshot.state, "fetched-base-proven");
      snapshot = preparing;
    }
    if (snapshot.state === "preparing_worktree") {
      if (snapshot.fetchedBaseProof === null)
        throw new RunnerError(
          "STATE_INVALID",
          "Partial preparation lacks fetched-base proof.",
          "Preserve state and restore an exact fetched-base transition.",
        );
      const observed = await this.ports.git.observeWorktree(
        repository.root,
        snapshot.worktreePath,
      );
      if (!observed.pathExists && !observed.registered) {
        if (await this.ports.git.branchExists(repository.root, snapshot.branch))
          throw new RunnerError(
            "RESOURCE_OWNERSHIP_UNKNOWN",
            "The issue branch exists without a matching prepared worktree.",
            "Preserve the branch and reconcile ownership before resume.",
          );
        await this.ports.git.createBranch(
          repository.root,
          snapshot.branch,
          snapshot.fetchedBaseProof.advertisedHeadSha,
        );
        await this.ports.git.addWorktree(
          repository.root,
          snapshot.worktreePath,
          snapshot.branch,
        );
      } else if (
        !observed.pathExists ||
        !observed.registered ||
        observed.branch !== snapshot.branch
      ) {
        throw new RunnerError(
          "RESOURCE_OWNERSHIP_UNKNOWN",
          "Partial worktree preparation does not exactly match persisted ownership.",
          "Preserve the resource and reconcile branch, registration, and path.",
        );
      }
      const starting = this.next(snapshot, { state: "starting_tmux" });
      await store.save(starting, snapshot.state, "worktree-prepared");
      snapshot = starting;
    }
    if (snapshot.state === "starting_tmux") {
      let tmux = snapshot.tmux;
      if (tmux === null) {
        tmux = await this.ports.tmux.createIssueWindow({
          sessionName: tmuxSessionName(repository.identity),
          windowName: String(snapshot.issueNumber),
          cwd: snapshot.worktreePath,
          executable: this.executable,
          args: [
            "internal",
            "run-agent",
            "--issue",
            String(snapshot.issueNumber),
          ],
        });
      }
      await this.ports.tmux.setRemainOnExit(tmux);
      const workerPid = await this.ports.tmux.panePid(tmux);
      if (workerPid === null)
        throw new RunnerError(
          "PROCESS_OBSERVATION_UNKNOWN",
          "The newly created tmux worker has no observable process identity.",
          "Preserve the pane and restore readable process metadata before retrying.",
        );
      const workerProcess = await this.ports.processes.identify(
        workerPid,
        {
          sessionName: tmux.sessionName,
          windowId: tmux.windowId,
          paneId: tmux.paneId,
          panePid: workerPid,
        },
        this.ports.clock.now(),
      );
      if (workerProcess === null)
        throw new RunnerError(
          "PROCESS_OBSERVATION_UNKNOWN",
          "The newly created tmux worker disappeared before identity persistence.",
          "Preserve the pane and reconcile worker ownership before retrying.",
        );
      const running = this.next(snapshot, {
        state: "running_rpiv",
        tmux,
        workerProcess,
      });
      await store.save(running, snapshot.state, "visible-worker-started");
      snapshot = running;
    }
    return snapshot;
  }

  public async runWorker(
    issueNumber: number,
    startPath: string,
  ): Promise<RunSnapshotV3> {
    const repository = await this.ports.git.discover(startPath);
    const store = this.store(repository.root);
    const loaded = await store.load(issueNumber);
    if (
      loaded.schemaVersion !== 3 ||
      loaded.state !== "running_rpiv" ||
      loaded.tmux === null
    )
      throw new RunnerError(
        "STATE_INVALID",
        `Issue #${issueNumber} is not ready for its revisioned RPIV worker.`,
        "Use reconcile and resume only after exact ownership is restored.",
      );
    let snapshot = loaded;
    const tmuxTarget = loaded.tmux;
    if (snapshot.workerProcess === null) {
      const workerPid = await this.ports.tmux.panePid(tmuxTarget);
      if (workerPid === null)
        throw new RunnerError(
          "PROCESS_OBSERVATION_UNKNOWN",
          "The tmux worker process identity is unavailable.",
          "Preserve the pane and restore readable process metadata before retrying.",
        );
      const workerIdentity = await this.ports.processes.identify(
        workerPid,
        {
          sessionName: tmuxTarget.sessionName,
          windowId: tmuxTarget.windowId,
          paneId: tmuxTarget.paneId,
          panePid: workerPid,
        },
        snapshot.updatedAt,
      );
      if (workerIdentity === null)
        throw new RunnerError(
          "PROCESS_OBSERVATION_UNKNOWN",
          "The tmux worker disappeared before its identity could be persisted.",
          "Preserve the pane and reconcile worker ownership before retrying.",
        );
      snapshot = await this.persistTransition(
        store,
        snapshot,
        { workerProcess: workerIdentity },
        "worker-process-identity-recorded",
      );
    } else {
      const observedWorker = await this.ports.processes.observe(
        snapshot.workerProcess,
      );
      if (
        observedWorker === null ||
        !same(observedWorker, snapshot.workerProcess)
      )
        throw new RunnerError(
          "PROCESS_IDENTITY_MISMATCH",
          "The recorded worker identity does not match the active tmux worker.",
          "Preserve the pane and refuse RPIV launch until worker identity is exact.",
        );
    }
    if (snapshot.rpivProcess !== null) {
      const observed = await this.ports.processes.observe(snapshot.rpivProcess);
      if (observed !== null && same(observed, snapshot.rpivProcess))
        return snapshot;
      if (observed !== null)
        throw new RunnerError(
          "PROCESS_IDENTITY_MISMATCH",
          "The recorded RPIV PID now has a different compound identity.",
          "Do not relaunch or signal it; reconcile PID reuse and pane lineage.",
        );
    }
    if (snapshot.launchIntent !== null && snapshot.rpivProcess === null) {
      const candidates = await this.ports.processes.findLaunchCandidates(
        snapshot.launchIntent,
      );
      if (candidates.length === 1) {
        const adopted = this.next(snapshot, { rpivProcess: candidates[0] });
        await store.save(adopted, snapshot.state, "interrupted-launch-adopted");
        return adopted;
      }
      if (candidates.length > 1)
        throw new RunnerError(
          "PROCESS_IDENTITY_AMBIGUOUS",
          "More than one pane descendant matches the interrupted launch intent.",
          "Preserve all candidates and disambiguate them before resume.",
        );
      const interrupted = this.next(snapshot, {
        state: "interrupted",
        error: {
          code: "PROCESS_IDENTITY_MISMATCH",
          message: "Interrupted launch intent has no matching process.",
        },
      });
      await store.save(
        interrupted,
        snapshot.state,
        "interrupted-launch-absent",
      );
      return this.releaseTerminalLease(store, interrupted);
    }

    const configuration = await this.configuration(repository.root);
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
    const panePid = await this.ports.tmux.panePid(tmuxTarget);
    if (panePid === null)
      throw new RunnerError(
        "TMUX_TARGET_MISSING",
        "The recorded tmux pane has no observable process lineage.",
        "Preserve the pane and reconcile it before launching RPIV.",
      );
    const launch: CopilotLaunchFacts = {
      executable: "copilot",
      args,
      cwd: snapshot.worktreePath,
      resourceAttributes,
      exitCode: null,
    };
    const intent: LaunchIntentV1 = {
      schemaVersion: 1,
      attempt: snapshot.attempt,
      executable: "copilot",
      args,
      cwd: snapshot.worktreePath,
      resourceAttributes,
      pane: tmuxTarget,
      panePid,
      recordedAt: this.ports.clock.now(),
    };
    const intended = this.next(snapshot, {
      launchIntent: intent,
      copilot: launch,
    });
    await store.save(intended, snapshot.state, "launch-intent-recorded");
    snapshot = intended;
    try {
      const process = await this.ports.processes.spawnCopilot({
        executable: "copilot",
        args,
        cwd: snapshot.worktreePath,
        environment: { OTEL_RESOURCE_ATTRIBUTES: resourceAttributes },
        pane: tmuxTarget,
        panePid,
        launchedAt: this.ports.clock.now(),
      });
      const identified = this.next(snapshot, { rpivProcess: process.identity });
      await store.save(
        identified,
        snapshot.state,
        "rpiv-process-identity-recorded",
      );
      snapshot = identified;
      const processResult = await process.wait();
      if (processResult.exitCode !== 0) {
        const failed = this.next(snapshot, {
          state: "failed",
          rpivProcess: null,
          copilot: { ...launch, exitCode: processResult.exitCode },
          error: {
            code: "EXTERNAL_COMMAND_FAILED",
            message: `Copilot exited with code ${processResult.exitCode}.`,
          },
        });
        await store.save(failed, snapshot.state, "copilot-failed");
        return this.releaseTerminalLease(store, failed);
      }
      const finalizing = this.next(snapshot, {
        state: "finalizing",
        rpivProcess: null,
        copilot: { ...launch, exitCode: 0 },
        error: null,
      });
      await store.save(finalizing, snapshot.state, "copilot-exited-zero");
      return this.finalize(finalizing, repository, store);
    } catch (cause: unknown) {
      if (!isRunnerError(cause)) throw cause;
      const failed = this.next(snapshot, {
        state: "failed",
        rpivProcess: null,
        error: { code: cause.code, message: cause.message },
      });
      await store.save(failed, snapshot.state, "copilot-launch-failed");
      await this.releaseTerminalLease(store, failed);
      throw cause;
    }
  }

  private async finalize(
    snapshot: RunSnapshotV3,
    repository: RepositoryFacts,
    store: RunStore,
  ): Promise<RunSnapshotV3> {
    let result: AgentResultV1;
    try {
      result = parseAgentResult(
        await this.ports.files.readAgentResult(snapshot.worktreePath),
      );
    } catch (cause: unknown) {
      if (!isRunnerError(cause)) throw cause;
      const interrupted = this.next(snapshot, {
        state: "interrupted",
        finalization: {
          result: null,
          git: null,
          pullRequest: null,
          reconciliation: null,
        },
        error: { code: cause.code, message: cause.message },
      });
      await store.save(interrupted, snapshot.state, "result-proof-incomplete");
      return this.releaseTerminalLease(store, interrupted);
    }
    if (snapshot.fetchedBaseProof === null)
      return this.persistIncompleteFinalization(
        store,
        snapshot,
        result,
        "Fetched-base proof is missing.",
      );
    if (result.outcome !== "succeeded") {
      const decision = reconcileCompletion({
        issueNumber: snapshot.issueNumber,
        branch: snapshot.branch,
        baseBranch: snapshot.fetchedBaseProof.defaultBranch,
        remote: snapshot.fetchedBaseProof.remote,
        requiredAcceptanceCriteria: snapshot.requiredAcceptanceCriteria,
        requiredValidations: snapshot.requiredValidations,
        result,
        git: null,
        pullRequest: null,
      });
      const terminal = this.next(snapshot, {
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
      });
      await store.save(terminal, snapshot.state, decision.code);
      return this.releaseTerminalLease(store, terminal);
    }
    try {
      const [localHeadSha, remoteHeadSha, pullRequest] = await Promise.all([
        this.ports.git.localHeadSha(snapshot.worktreePath),
        this.ports.git.remoteBranchSha(
          repository.root,
          snapshot.fetchedBaseProof.remote,
          snapshot.branch,
        ),
        this.ports.github.loadPullRequest(snapshot.repository, result.prNumber),
      ]);
      const git = {
        localHeadSha,
        remote: snapshot.fetchedBaseProof.remote,
        remoteBranch: snapshot.branch,
        remoteHeadSha,
      };
      const decision = reconcileCompletion({
        issueNumber: snapshot.issueNumber,
        branch: snapshot.branch,
        baseBranch: snapshot.fetchedBaseProof.defaultBranch,
        remote: snapshot.fetchedBaseProof.remote,
        requiredAcceptanceCriteria: snapshot.requiredAcceptanceCriteria,
        requiredValidations: snapshot.requiredValidations,
        result,
        git,
        pullRequest,
      });
      const terminal = this.next(snapshot, {
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
      });
      await store.save(terminal, snapshot.state, decision.code);
      return this.releaseTerminalLease(store, terminal);
    } catch (cause: unknown) {
      if (!isRunnerError(cause)) throw cause;
      return this.persistIncompleteFinalization(
        store,
        snapshot,
        result,
        cause.message,
        cause.code,
      );
    }
  }

  private async persistIncompleteFinalization(
    store: RunStore,
    snapshot: RunSnapshotV3,
    result: AgentResultV1,
    message: string,
    code = "COMPLETION_PROOF_INCOMPLETE",
  ): Promise<RunSnapshotV3> {
    const interrupted = this.next(snapshot, {
      state: "interrupted",
      finalization: {
        result,
        git: null,
        pullRequest: null,
        reconciliation: null,
      },
      error: { code, message },
    });
    await store.save(
      interrupted,
      snapshot.state,
      "completion-proof-incomplete",
    );
    return this.releaseTerminalLease(store, interrupted);
  }

  public async reconcile(
    issueNumber: number,
    startPath: string,
  ): Promise<ReconciliationReportV1> {
    const repository = await this.ports.git.discover(startPath);
    const store = this.store(repository.root);
    let persisted = await store.load(issueNumber);
    let report = await collectReconciliation({
      persisted,
      repositoryRoot: repository.root,
      ports: this.ports,
      store,
    });
    if (persisted.schemaVersion === 2 && canMigrateLegacy(persisted, report)) {
      const migrated = migrateLegacySnapshot(persisted, this.ports.clock.now());
      await store.save(
        migrated,
        persisted.state,
        "legacy-v3-reconciliation-migration",
      );
      persisted = migrated;
      report = await collectReconciliation({
        persisted,
        repositoryRoot: repository.root,
        ports: this.ports,
        store,
      });
    }
    if (
      persisted.schemaVersion === 3 &&
      report.safeActions.includes("automatic_clean")
    ) {
      await this.performCleanup("automatic_merged", report, repository, store);
      const updated = await store.load(issueNumber);
      report = await collectReconciliation({
        persisted: updated,
        repositoryRoot: repository.root,
        ports: this.ports,
        store,
      });
    }
    return report;
  }

  public async status(
    issueNumber: number,
    startPath: string,
  ): Promise<StatusFacts> {
    const report = await this.reconcile(issueNumber, startPath);
    return {
      schemaVersion: 2,
      issueNumber,
      persisted: report.persisted,
      observed: report.observations.tmux.facts,
      reconciliation: report,
    };
  }

  public async list(startPath: string): Promise<
    ControlOutcomeV1<
      readonly {
        readonly issueNumber: number;
        readonly state: string;
        readonly code: string;
      }[]
    >
  > {
    const repository = await this.ports.git.discover(startPath);
    const store = this.store(repository.root);
    const issueNumbers = await store.enumerateIssueNumbers();
    const records: {
      readonly issueNumber: number;
      readonly state: string;
      readonly code: string;
    }[] = [];
    for (const issueNumber of issueNumbers) {
      try {
        const report = await this.reconcile(issueNumber, startPath);
        records.push({
          issueNumber,
          state: report.persisted.state,
          code: report.decisionCode,
        });
      } catch (cause: unknown) {
        if (!isRunnerError(cause) || cause.code !== "STATE_NOT_FOUND")
          throw cause;
        records.push({ issueNumber, state: "orphan", code: "STATE_NOT_FOUND" });
      }
    }
    return {
      schemaVersion: 1,
      issueNumber: null,
      state: "inventory",
      code: "INVENTORY_READY",
      exitCode: 0,
      report: null,
      facts: records,
      remediation: null,
    };
  }

  public async resume(
    issueNumber: number,
    startPath: string,
  ): Promise<ControlOutcomeV1> {
    const repository = await this.ports.git.discover(startPath);
    const store = this.store(repository.root);
    const persisted = await store.load(issueNumber);
    const report = await collectReconciliation({
      persisted,
      repositoryRoot: repository.root,
      ports: this.ports,
      store,
    });
    if (persisted.schemaVersion !== 3)
      return refused(
        issueNumber,
        persisted.state,
        "RESUME_REFUSED",
        report,
        "Migrate only through a proved v3 reconciliation transition.",
      );
    if (report.decisionCode === "active_preserved")
      return outcome(
        issueNumber,
        persisted.state,
        "ACTIVE_PRESERVED",
        0,
        report,
        {
          attempt: persisted.attempt,
          launched: false,
        },
      );
    if (persisted.state === "completed")
      return outcome(
        issueNumber,
        persisted.state,
        "COMPLETED_NOOP",
        0,
        report,
        {
          attempt: persisted.attempt,
          launched: false,
        },
      );
    const allowedResumeDecision =
      (persisted.state === "finalizing" &&
        report.decisionCode === "FINALIZATION_RETRY_AVAILABLE") ||
      (persisted.state === "interrupted" &&
        (report.decisionCode === "FINALIZATION_RETRY_AVAILABLE" ||
          report.decisionCode === "RUN_INTERRUPTED")) ||
      (["acquiring_lock", "preparing_worktree", "starting_tmux"].includes(
        persisted.state,
      ) &&
        report.decisionCode === "PREPARATION_RESUME_AVAILABLE");
    if (!allowedResumeDecision)
      return refused(
        issueNumber,
        persisted.state,
        "RESUME_REFUSED",
        report,
        "Resume requires the exact allowed reconciliation decision; unknown, mismatched, or blocked facts must be restored first.",
      );
    if (report.decisionCode === "FINALIZATION_RETRY_AVAILABLE") {
      const finalizing =
        persisted.state === "finalizing"
          ? persisted
          : await this.persistTransition(
              store,
              persisted,
              { state: "finalizing" },
              "resume-finalization",
            );
      const finalized = await this.finalize(finalizing, repository, store);
      const finalReport = await collectReconciliation({
        persisted: finalized,
        repositoryRoot: repository.root,
        ports: this.ports,
        store,
      });
      return outcome(
        issueNumber,
        finalized.state,
        "FINALIZATION_RETRIED",
        finalized.state === "completed" ? 0 : 4,
        finalReport,
        {
          launched: false,
        },
      );
    }
    if (["failed", "blocked", "cancelled"].includes(persisted.state))
      return refused(
        issueNumber,
        persisted.state,
        "RESUME_REFUSED",
        report,
        "Terminal failed, blocked, and cancelled runs are not resumable.",
      );
    if (
      ["acquiring_lock", "preparing_worktree", "starting_tmux"].includes(
        persisted.state,
      )
    ) {
      const configuration = await this.configuration(repository.root);
      const prepared = await this.prepareResources(
        persisted,
        repository,
        configuration.remote,
        configuration.baseBranch,
        store,
      );
      return outcome(
        issueNumber,
        prepared.state,
        "PREPARATION_RESUMED",
        0,
        report,
        {
          launched: true,
          attempt: prepared.attempt,
        },
      );
    }
    if (report.decisionCode !== "RUN_INTERRUPTED")
      return refused(
        issueNumber,
        persisted.state,
        "RESUME_REFUSED",
        report,
        "Restore exact inactive ownership before resume.",
      );
    if (persisted.tmux === null)
      return refused(
        issueNumber,
        persisted.state,
        "RESUME_REFUSED",
        report,
        "Restore the exact recorded tmux target before resume.",
      );
    const configuration = await this.configuration(repository.root);
    const owner = await store.readOwner(issueNumber);
    if (
      owner === null ||
      owner.ownerId !== persisted.ownerId ||
      owner.runId !== persisted.runId ||
      owner.repository !== persisted.repository
    )
      return refused(
        issueNumber,
        persisted.state,
        "RESUME_REFUSED",
        report,
        "Restore the exact issue lock before reacquiring capacity.",
      );
    const admission = await claimConcurrencySlot({
      store,
      owner,
      maxConcurrentRuns: configuration.maxConcurrentRuns,
      acquiredAt: this.ports.clock.now(),
      rollbackOwnerOnFailure: false,
    });
    const resumed = await this.persistTransition(
      store,
      persisted,
      {
        state: "running_rpiv",
        attempt: persisted.attempt + 1,
        admission: admission.lease,
        launchIntent: null,
        workerProcess: null,
        rpivProcess: null,
        stop: null,
        error: null,
      },
      "resume-new-attempt",
    );
    await this.ports.tmux.restartWorker(persisted.tmux, this.executable, [
      "internal",
      "run-agent",
      "--issue",
      String(issueNumber),
    ]);
    return outcome(issueNumber, resumed.state, "RESUME_STARTED", 0, report, {
      launched: true,
      attempt: resumed.attempt,
    });
  }

  public async stop(
    issueNumber: number,
    startPath: string,
  ): Promise<ControlOutcomeV1> {
    const repository = await this.ports.git.discover(startPath);
    const store = this.store(repository.root);
    const persisted = await store.load(issueNumber);
    const report = await collectReconciliation({
      persisted,
      repositoryRoot: repository.root,
      ports: this.ports,
      store,
    });
    if (persisted.schemaVersion !== 3)
      return refused(
        issueNumber,
        persisted.state,
        "STOP_REFUSED",
        report,
        "Migrate the run before process control.",
      );
    if (
      persisted.rpivProcess === null ||
      report.observations.rpivProcess.state === "absent"
    ) {
      if (persisted.stop !== null && persisted.state === "running_rpiv") {
        let stopped = persisted;
        if (persisted.tmux !== null) {
          const capture = await this.ports.tmux.capturePane(
            persisted.tmux,
            MAX_LOG_BYTES,
          );
          const log = await this.retainLog(
            store,
            persisted,
            "",
            capture.content,
            capture.truncated,
          );
          stopped = await this.persistTransition(
            store,
            stopped,
            { logs: mergeLog(stopped.logs, log) },
            "stop-final-evidence-retained",
          );
        }
        const cancelled = await this.persistTransition(
          store,
          stopped,
          {
            state: "cancelled",
            rpivProcess: null,
            stop: {
              ...persisted.stop,
              completedAt: this.ports.clock.now(),
            },
            error: null,
          },
          "stop-absence-confirmed",
        );
        const released = await this.releaseTerminalLease(store, cancelled);
        return outcome(issueNumber, released.state, "STOPPED", 0, report, {
          signaled: false,
          recoveredFromRecordedStop: true,
          worktreePreserved: true,
          tmuxPreserved: true,
        });
      }
      return outcome(
        issueNumber,
        persisted.state,
        "ALREADY_STOPPED",
        0,
        report,
        {
          signaled: false,
          worktreePreserved: true,
        },
      );
    }
    if (!report.safeActions.includes("stop") || persisted.tmux === null)
      return refused(
        issueNumber,
        persisted.state,
        "STOP_REFUSED",
        report,
        "Stop requires one exact active process and pane identity.",
      );
    const processIdentity = persisted.rpivProcess;
    const target = persisted.tmux;
    const requestedAt = persisted.stop?.requestedAt ?? this.ports.clock.now();
    let stopping = persisted;
    if (persisted.stop === null) {
      stopping = await this.persistTransition(
        store,
        stopping,
        {
          stop: {
            requestedAt,
            termSentAt: null,
            killSentAt: null,
            completedAt: null,
            escalated: false,
            processIdentity,
            beforeLog: null,
            afterLog: null,
          },
        },
        "operator-stop-requested",
      );
    }
    const before = await this.ports.tmux.capturePane(target, MAX_LOG_BYTES);
    let termSentAt = stopping.stop?.termSentAt ?? null;
    if (termSentAt === null) {
      await this.ports.processes.signalGroup(processIdentity, "SIGTERM");
      termSentAt = this.ports.clock.now();
      stopping = await this.persistTransition(
        store,
        stopping,
        {
          stop: {
            ...(stopping.stop ?? {
              requestedAt,
              killSentAt: null,
              completedAt: null,
              escalated: false,
              processIdentity,
              beforeLog: null,
              afterLog: null,
            }),
            termSentAt,
          },
        },
        "operator-stop-term-sent",
      );
    }
    let exited = await this.ports.processes.waitForExit(
      processIdentity,
      10_000,
    );
    let killSentAt = stopping.stop?.killSentAt ?? null;
    if (!exited) {
      if (killSentAt === null) {
        await this.ports.processes.signalGroup(processIdentity, "SIGKILL");
        killSentAt = this.ports.clock.now();
        stopping = await this.persistTransition(
          store,
          stopping,
          {
            stop: {
              ...(stopping.stop ?? {
                requestedAt,
                termSentAt,
                completedAt: null,
                escalated: true,
                processIdentity,
                beforeLog: null,
                afterLog: null,
              }),
              killSentAt,
              escalated: true,
            },
          },
          "operator-stop-kill-sent",
        );
      }
      exited = await this.ports.processes.waitForExit(processIdentity, 5_000);
    }
    const after = await this.ports.tmux.capturePane(target, MAX_LOG_BYTES);
    const log = await this.retainLog(
      store,
      stopping,
      before.content,
      after.content,
      before.truncated || after.truncated,
    );
    const stopFacts = {
      requestedAt,
      termSentAt,
      killSentAt,
      completedAt: exited ? this.ports.clock.now() : null,
      escalated: killSentAt !== null,
      processIdentity,
      beforeLog: log.path,
      afterLog: log.path,
    };
    if (!exited) {
      const stillActive = await this.persistTransition(
        store,
        stopping,
        {
          logs: mergeLog(stopping.logs, log),
          stop: stopFacts,
          error: {
            code: "STOP_PROCESS_STILL_ACTIVE",
            message:
              "The exact RPIV process remained active after bounded escalation.",
          },
        },
        "operator-stop-process-still-active",
      );
      return {
        schemaVersion: 1,
        issueNumber,
        state: stillActive.state,
        code: "STOP_PROCESS_STILL_ACTIVE",
        exitCode: 4,
        report,
        facts: {
          termWaitMs: 10_000,
          killWaitMs: 5_000,
          escalated: true,
          processIdentityPreserved: true,
          leasePreserved: stillActive.admission !== null,
          worktreePreserved: true,
          tmuxPreserved: true,
          log: log.path,
        },
        remediation:
          "The process is still active; inspect retained logs and retry stop only after exact identity remains observable or inactivity is proved.",
      };
    }
    const cancelled = this.next(stopping, {
      state: "cancelled",
      rpivProcess: null,
      logs: mergeLog(stopping.logs, log),
      stop: stopFacts,
      error: null,
    });
    await store.save(cancelled, stopping.state, "operator-stop-completed");
    const released = await this.releaseTerminalLease(store, cancelled);
    return outcome(issueNumber, released.state, "STOPPED", 0, report, {
      termWaitMs: 10_000,
      killWaitMs: killSentAt === null ? 0 : 5_000,
      escalated: killSentAt !== null,
      worktreePreserved: true,
      tmuxPreserved: true,
      log: log.path,
    });
  }

  public async clean(
    issueNumber: number,
    startPath: string,
  ): Promise<ControlOutcomeV1> {
    const repository = await this.ports.git.discover(startPath);
    const store = this.store(repository.root);
    const persisted = await store.load(issueNumber);
    const report = await collectReconciliation({
      persisted,
      repositoryRoot: repository.root,
      ports: this.ports,
      store,
    });
    if (persisted.schemaVersion !== 3)
      return refused(
        issueNumber,
        persisted.state,
        "CLEANUP_OWNERSHIP_UNPROVED",
        report,
        "Migrate the run before cleanup.",
      );
    if (
      persisted.cleanup?.mode === "explicit" &&
      persisted.cleanup.remainingSteps.length === 0
    )
      return outcome(
        issueNumber,
        persisted.state,
        "CLEANUP_ALREADY_COMPLETED",
        0,
        report,
        { completedSteps: persisted.cleanup.completedSteps },
      );
    const git = report.observations.git.facts;
    if (report.activity === "active")
      return refused(
        issueNumber,
        persisted.state,
        "CLEANUP_ACTIVE",
        report,
        "Stop the exact active process before cleanup.",
      );
    if (git !== null && (git.staged || git.unstaged || git.untracked))
      return refused(
        issueNumber,
        persisted.state,
        "CLEANUP_DIRTY_WORKTREE",
        report,
        "Commit, move, or explicitly preserve every worktree change; no force-clean path exists.",
      );
    if (!report.safeActions.includes("explicit_clean"))
      return refused(
        issueNumber,
        persisted.state,
        "CLEANUP_OWNERSHIP_UNPROVED",
        report,
        "Restore exact inactive ownership and complete observations before cleanup.",
      );
    try {
      const cleaned = await this.performCleanup(
        "explicit",
        report,
        repository,
        store,
      );
      return outcome(
        issueNumber,
        cleaned.state,
        "CLEANUP_COMPLETED",
        0,
        report,
        {
          completedSteps: cleaned.cleanup?.completedSteps ?? [],
          retained: ["branch", "snapshot", "events", "logs"],
        },
      );
    } catch (cause: unknown) {
      if (!isRunnerError(cause)) throw cause;
      const partial = await store.load(issueNumber);
      if (partial.schemaVersion !== 3) throw cause;
      const partialReport = await collectReconciliation({
        persisted: partial,
        repositoryRoot: repository.root,
        ports: this.ports,
        store,
      });
      return {
        schemaVersion: 1,
        issueNumber,
        state: partial.state,
        code: cause.code.startsWith("CLEANUP_")
          ? cause.code
          : "CLEANUP_PARTIAL",
        exitCode: 4,
        report: partialReport,
        facts: {
          completedSteps: partial.cleanup?.completedSteps ?? [],
          remainingSteps: partial.cleanup?.remainingSteps ?? [],
        },
        remediation: cause.remediation,
      };
    }
  }

  private async performCleanup(
    mode: CleanupMode,
    report: ReconciliationReportV1,
    repository: RepositoryFacts,
    store: RunStore,
  ): Promise<RunSnapshotV3> {
    if (report.persisted.schemaVersion !== 3)
      throw new RunnerError(
        "CLEANUP_OWNERSHIP_UNPROVED",
        "Cleanup requires a version 3 ownership record.",
        "Migrate through proved reconciliation first.",
      );
    let snapshot = report.persisted;
    if (
      snapshot.cleanup !== null &&
      (snapshot.cleanup.ownerId !== snapshot.ownerId ||
        snapshot.cleanup.runId !== snapshot.runId)
    )
      throw new RunnerError(
        "CLEANUP_OWNERSHIP_UNPROVED",
        "Recorded cleanup progress belongs to a different owner or run.",
        "Preserve all resources and restore same-owner cleanup progress.",
      );
    const previous =
      snapshot.cleanup?.mode === mode ? snapshot.cleanup.completedSteps : [];
    const allSteps: readonly CleanupStep[] =
      mode === "explicit"
        ? ["tmux", "worktree", "lease", "lock"]
        : ["worktree", "lease", "lock"];
    let cleanup: CleanupFactsV1 = {
      mode,
      ownerId: snapshot.ownerId,
      runId: snapshot.runId,
      intentAt:
        snapshot.cleanup?.mode === mode
          ? snapshot.cleanup.intentAt
          : this.ports.clock.now(),
      completedSteps: previous,
      remainingSteps: allSteps.filter((step) => !previous.includes(step)),
      blockedCode: null,
      updatedAt: this.ports.clock.now(),
    };
    snapshot = await this.persistTransition(
      store,
      snapshot,
      { cleanup },
      "cleanup-intent",
    );
    const requiredAction =
      mode === "explicit" ? "explicit_clean" : "automatic_clean";
    for (const step of allSteps) {
      if (cleanup.completedSteps.includes(step)) continue;
      const currentReport = await collectReconciliation({
        persisted: snapshot,
        repositoryRoot: repository.root,
        ports: this.ports,
        store,
      });
      if (!currentReport.safeActions.includes(requiredAction))
        throw new RunnerError(
          "CLEANUP_OWNERSHIP_UNPROVED",
          "Cleanup authorization changed before the next destructive step.",
          currentReport.remediation ??
            "Preserve all resources and restore exact ownership before retrying.",
          { details: { step, decisionCode: currentReport.decisionCode } },
        );
      const exactOwner = currentReport.observations.lock.facts;
      snapshot = await this.persistTransition(
        store,
        snapshot,
        { cleanup: { ...cleanup, updatedAt: this.ports.clock.now() } },
        "cleanup-" + step + "-started",
      );
      if (step === "tmux" && snapshot.tmux !== null) {
        const target = snapshot.tmux;
        const capture = await this.ports.tmux.capturePane(
          target,
          MAX_LOG_BYTES,
        );
        const log = await this.retainLog(
          store,
          snapshot,
          capture.content,
          "",
          capture.truncated,
        );
        snapshot = await this.persistTransition(
          store,
          snapshot,
          { logs: mergeLog(snapshot.logs, log) },
          "cleanup-terminal-log-retained",
        );
        await this.ports.tmux.removeWindow(target);
        if ((await this.ports.tmux.observe(target)) !== null)
          throw new RunnerError(
            "CLEANUP_PARTIAL",
            "The tmux window remained after its cleanup step.",
            "Preserve the window and retry only after exact absence can be observed.",
          );
      }
      if (step === "worktree") {
        await this.ports.git.removeWorktree(
          repository.root,
          snapshot.worktreePath,
        );
        const observed = await this.ports.git.observeWorktree(
          repository.root,
          snapshot.worktreePath,
        );
        if (
          observed.pathExists ||
          observed.registered ||
          (await this.ports.files.exists(snapshot.worktreePath))
        )
          throw new RunnerError(
            "CLEANUP_PARTIAL",
            "The worktree remained after its cleanup step.",
            "Preserve the path and registration; retry only after exact absence can be observed.",
          );
      }
      if (step === "lease" && snapshot.admission !== null) {
        const expectedLease = snapshot.admission;
        const released = await store.releaseLease(expectedLease);
        if (!released || (await store.readLease(expectedLease.slot)) !== null)
          throw new RunnerError(
            "CLEANUP_OWNERSHIP_UNPROVED",
            "The concurrency lease changed before cleanup could release it.",
            "Preserve the replacement lease and reconcile ownership.",
          );
      }
      if (step === "lock") {
        if (
          exactOwner === null ||
          exactOwner.ownerId !== snapshot.ownerId ||
          exactOwner.runId !== snapshot.runId ||
          !(await store.releaseOwner(snapshot.issueNumber, exactOwner)) ||
          (await store.readOwner(snapshot.issueNumber)) !== null
        )
          throw new RunnerError(
            "CLEANUP_OWNERSHIP_UNPROVED",
            "The issue lock changed before cleanup could release it.",
            "Preserve the replacement lock and reconcile ownership.",
          );
      }
      const completedSteps = [...cleanup.completedSteps, step];
      cleanup = {
        ...cleanup,
        completedSteps,
        remainingSteps: allSteps.filter(
          (entry) => !completedSteps.includes(entry),
        ),
        updatedAt: this.ports.clock.now(),
      };
      snapshot = await this.persistTransition(
        store,
        snapshot,
        {
          cleanup,
          admission: step === "lease" ? null : snapshot.admission,
          mergedPullRequest:
            mode === "automatic_merged"
              ? report.observations.github.facts
              : snapshot.mergedPullRequest,
        },
        "cleanup-" + step + "-completed",
      );
    }
    return snapshot;
  }

  public async logs(
    issueNumber: number,
    startPath: string,
  ): Promise<ControlOutcomeV1> {
    const report = await this.reconcile(issueNumber, startPath);
    const snapshot = report.persisted;
    if (snapshot.schemaVersion !== 3)
      return refused(
        issueNumber,
        snapshot.state,
        "LOG_NOT_FOUND",
        report,
        "Migrate the snapshot before using retained logs.",
      );
    const retained = await Promise.all(
      snapshot.logs.map(async (entry) => ({
        ...entry,
        content: (await this.ports.files.readText(entry.path)) ?? "",
      })),
    );
    const live =
      report.safeActions.includes("attach") && snapshot.tmux !== null
        ? await this.ports.tmux.capturePane(snapshot.tmux, MAX_LOG_BYTES)
        : null;
    if (retained.length === 0 && live === null)
      return refused(
        issueNumber,
        snapshot.state,
        "LOG_NOT_FOUND",
        report,
        "No retained attempt transcript or exact live pane is available.",
      );
    return outcome(issueNumber, snapshot.state, "LOGS_READY", 0, report, {
      retained,
      live,
    });
  }

  public async attach(
    issueNumber: number,
    startPath: string,
  ): Promise<TmuxIdentity> {
    const report = await this.reconcile(issueNumber, startPath);
    const expected = report.persisted.tmux;
    if (
      expected === null ||
      report.observations.tmux.state !== "match" ||
      !report.safeActions.includes("attach")
    )
      throw new RunnerError(
        report.observations.tmux.state === "mismatch"
          ? "TMUX_TARGET_MISMATCH"
          : "TMUX_TARGET_MISSING",
        `No exact attachable tmux target exists for issue #${issueNumber}.`,
        "Inspect the shared reconciliation report and preserve mismatched panes.",
      );
    await this.ports.tmux.attach(expected);
    return expected;
  }

  private async retainLog(
    store: RunStore,
    snapshot: RunSnapshotV3,
    before: string,
    after: string,
    adapterTruncated: boolean,
  ): Promise<RetainedLogV1> {
    const combined = redactTranscript(
      [
        "--- capture before control ---",
        before,
        "--- capture after control ---",
        after,
      ].join("\n"),
    );
    const bytes = Buffer.from(combined, "utf8");
    const truncated = adapterTruncated || bytes.byteLength > MAX_LOG_BYTES;
    const marker = Buffer.from(
      truncated ? "[TRUNCATED TO LAST 2 MiB]\n" : "",
      "utf8",
    );
    const available = MAX_LOG_BYTES - marker.byteLength;
    const selected = truncated
      ? bytes.subarray(Math.max(0, bytes.byteLength - available))
      : bytes;
    const content = Buffer.concat([marker, selected]).toString("utf8");
    const logPath = await store.writeLog(
      snapshot.issueNumber,
      snapshot.attempt,
      content,
    );
    return {
      attempt: snapshot.attempt,
      path: logPath,
      bytes: Buffer.byteLength(content),
      truncated,
      source: "tmux",
      capturedAt: this.ports.clock.now(),
    };
  }

  private async releaseTerminalLease(
    store: RunStore,
    snapshot: RunSnapshotV3,
  ): Promise<RunSnapshotV3> {
    if (snapshot.admission === null) return snapshot;
    const released = await store.releaseLease(snapshot.admission);
    if (!released) return snapshot;
    return this.persistTransition(
      store,
      snapshot,
      { admission: null },
      "inactive-concurrency-lease-released",
    );
  }

  private async persistTransition(
    store: RunStore,
    snapshot: RunSnapshotV3,
    changes: Partial<RunSnapshotV3>,
    reason: string,
  ): Promise<RunSnapshotV3> {
    const next = this.next(snapshot, changes);
    await store.save(next, snapshot.state, reason);
    return next;
  }

  private next(
    snapshot: RunSnapshotV3,
    changes: Partial<RunSnapshotV3>,
  ): RunSnapshotV3 {
    return {
      ...snapshot,
      ...changes,
      schemaVersion: 3,
      revision: snapshot.revision + 1,
      updatedAt: this.ports.clock.now(),
    };
  }

  private store(repositoryRoot: string): RunStore {
    return new RunStore(repositoryRoot, this.ports.files, this.ports.clock);
  }

  private async configuration(repositoryRoot: string) {
    return parseConfiguration(
      await this.ports.files.readText(
        path.join(repositoryRoot, ".soft-factory", "config.yml"),
      ),
    );
  }

  private async assertResourcesAbsent(
    repository: RepositoryFacts,
    branch: string,
    worktreePath: string,
  ): Promise<void> {
    const [branchExists, pathExists, registered] = await Promise.all([
      this.ports.git.branchExists(repository.root, branch),
      this.ports.files.exists(worktreePath),
      this.ports.git.registeredWorktreeExists(repository.root, worktreePath),
    ]);
    if (branchExists || pathExists || registered)
      throw new RunnerError(
        "RESOURCE_OWNERSHIP_UNKNOWN",
        "A planned branch, path, or worktree already exists without matching Runner ownership.",
        "Preserve the unknown resource and reconcile it manually before retrying.",
        { details: { branchExists, pathExists, registered } },
      );
  }
}

function canMigrateLegacy(
  snapshot: RunSnapshotV2,
  report: ReconciliationReportV1,
): boolean {
  const terminal = [
    "completed",
    "failed",
    "blocked",
    "cancelled",
    "interrupted",
  ].includes(snapshot.state);
  const observations = Object.values(report.observations);
  return (
    terminal &&
    observations.every(
      (entry) => entry.state !== "unknown" && entry.state !== "mismatch",
    ) &&
    report.observations.lock.state === "match" &&
    report.observations.filesystem.state === "match" &&
    report.observations.git.state === "match" &&
    (snapshot.tmux === null || report.observations.tmux.state === "match")
  );
}

function migrateLegacySnapshot(
  snapshot: RunSnapshotV2,
  updatedAt: string,
): RunSnapshotV3 {
  return {
    ...snapshot,
    schemaVersion: 3,
    revision: 1,
    attempt: 1,
    admission: null,
    launchIntent: null,
    workerProcess: null,
    rpivProcess: null,
    stop: null,
    cleanup: null,
    logs: [],
    mergedPullRequest: null,
    updatedAt,
  };
}

function outcome<T>(
  issueNumber: number,
  state: RunState,
  code: string,
  exitCode: number,
  report: ReconciliationReportV1,
  facts: T,
): ControlOutcomeV1<T> {
  return {
    schemaVersion: 1,
    issueNumber,
    state,
    code,
    exitCode,
    report,
    facts,
    remediation: null,
  };
}
function refused(
  issueNumber: number,
  state: RunState,
  code: string,
  report: ReconciliationReportV1,
  remediation: string,
): ControlOutcomeV1<Record<string, never>> {
  return {
    schemaVersion: 1,
    issueNumber,
    state,
    code,
    exitCode: 4,
    report,
    facts: {},
    remediation,
  };
}
function mergeLog(
  logs: readonly RetainedLogV1[],
  log: RetainedLogV1,
): readonly RetainedLogV1[] {
  return [...logs.filter((entry) => entry.attempt !== log.attempt), log];
}
function same(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function redactTranscript(value: string): string {
  return value.replace(
    /(token|password|authorization)[=:]\s*\S+/gi,
    "$1=[REDACTED]",
  );
}
