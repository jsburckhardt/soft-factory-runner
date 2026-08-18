import type {
  AgentResultV1,
  CleanupStep,
  ConcurrencyLeaseV1,
  MergedPullRequestFactsV1,
  ObservationV1,
  OwnerRecordV1,
  ProcessIdentityV1,
  ProgressObservationV1,
  ReconciliationObservationsV1,
  ReconciliationReportV2,
  RunSnapshot,
  RunSnapshotV3,
  RunSnapshotV4,
  RunSnapshotV5,
  RunSnapshotV6,
  TmuxIdentityDiagnosticV1,
  WorktreeObservationV1,
} from "./domain";
import {
  isMigratedLegacyAgentResult,
  migrateLegacyAgentResult,
  parseAgentResult,
  parseLegacyAgentResult,
} from "./completion";
import { isRunnerError } from "./errors";
import { TmuxIdentityOutputError } from "./tmux-identity";
import { RunStore } from "./persistence";
import { classifyProgress } from "./integration";
import type { RunnerPorts } from "./ports";

export async function collectReconciliation(input: {
  readonly persisted: RunSnapshot;
  readonly repositoryRoot: string;
  readonly ports: RunnerPorts;
  readonly store: RunStore;
}): Promise<ReconciliationReportV2> {
  const { persisted, ports, repositoryRoot, store } = input;
  const expectedOwner: OwnerRecordV1 = {
    schemaVersion: 1,
    issueNumber: persisted.issueNumber,
    ownerId: persisted.ownerId,
    runId: persisted.runId,
    repository: persisted.repository,
    acquiredAt:
      (persisted.schemaVersion === 4 ||
        persisted.schemaVersion === 5 ||
        persisted.schemaVersion === 6) &&
      persisted.admission !== null
        ? persisted.admission.acquiredAt
        : "",
  };
  const resultExpected =
    persisted.state === "finalizing" ||
    persisted.state === "completed" ||
    (persisted.schemaVersion !== 1 &&
      persisted.finalization?.result !== null &&
      persisted.finalization?.result !== undefined);
  const persistedPullRequestNumber =
    persisted.schemaVersion !== 1
      ? (persisted.finalization?.result?.prNumber ?? null)
      : null;

  // Process and result facts are collected before candidate-keyed Git/remote/GitHub
  // observations. This is intentional staging, not a retry: every boundary is
  // still observed at most once.
  const [
    lock,
    lease,
    filesystem,
    tmuxResult,
    workerProcess,
    rpivProcess,
    progress,
  ] = await Promise.all([
    observe(async () => {
      const actual = await store.readOwner(persisted.issueNumber);
      if (actual === null) return absent<OwnerRecordV1>("LOCK_ABSENT");
      return sameOwner(actual, expectedOwner)
        ? match(actual, "LOCK_MATCH")
        : mismatch(actual, "LOCK_MISMATCH");
    }),
    persisted.schemaVersion !== 3 &&
    persisted.schemaVersion !== 4 &&
    persisted.schemaVersion !== 5 &&
    persisted.schemaVersion !== 6
      ? Promise.resolve(notApplicable<ConcurrencyLeaseV1>("LEASE_NOT_RECORDED"))
      : persisted.admission === null
        ? Promise.resolve(
            persisted.state === "running_rpiv"
              ? absent<ConcurrencyLeaseV1>("LEASE_NOT_RECORDED")
              : notApplicable<ConcurrencyLeaseV1>("LEASE_NOT_HELD"),
          )
        : observe(async () => {
            const actual = await store.readLease(
              persisted.admission?.slot ?? 0,
            );
            if (actual === null)
              return absent<ConcurrencyLeaseV1>("LEASE_ABSENT");
            return same(actual, persisted.admission)
              ? match(actual, "LEASE_MATCH")
              : mismatch(actual, "LEASE_MISMATCH");
          }),
    observe(async () =>
      (await ports.files.exists(persisted.worktreePath))
        ? match({ worktreePath: persisted.worktreePath }, "WORKTREE_PATH_MATCH")
        : absent<{ readonly worktreePath: string }>("WORKTREE_PATH_ABSENT"),
    ),
    collectTmuxObservation(persisted, ports),
    (persisted.schemaVersion !== 3 &&
      persisted.schemaVersion !== 4 &&
      persisted.schemaVersion !== 5 &&
      persisted.schemaVersion !== 6) ||
    persisted.workerProcess === null
      ? Promise.resolve(
          notApplicable<ProcessIdentityV1>("WORKER_PROCESS_NOT_RECORDED"),
        )
      : observeProcess(ports, persisted.workerProcess, "WORKER"),
    (persisted.schemaVersion !== 3 &&
      persisted.schemaVersion !== 4 &&
      persisted.schemaVersion !== 5 &&
      persisted.schemaVersion !== 6) ||
    persisted.rpivProcess === null
      ? Promise.resolve(absent<ProcessIdentityV1>("RPIV_PROCESS_NOT_RECORDED"))
      : observeProcess(ports, persisted.rpivProcess, "RPIV"),
    observe(async () => {
      const facts = classifyProgress({
        text:
          ports.files.readRpivStatus === undefined
            ? await ports.files.readText(
                persisted.worktreePath + "/.soft-factory/rpiv-status.json",
              )
            : await ports.files.readRpivStatus(persisted.worktreePath),
        snapshot: persisted,
        observedAt: ports.clock.now(),
      });
      if (facts.classification === "PROGRESS_MISSING")
        return absent<ProgressObservationV1>(facts.classification, facts);
      if (facts.classification === "PROGRESS_VALID")
        return match(facts, facts.classification);
      return mismatch(facts, facts.classification);
    }),
  ]);

  const recoveryProcessContext =
    persisted.schemaVersion === 6 &&
    persisted.state === "running_rpiv" &&
    rpivProcess.state === "absent" &&
    (workerProcess.state === "absent" ||
      workerProcess.state === "not_applicable");
  const result = await observe(async () => {
    const text = await ports.files.readAgentResult(persisted.worktreePath);
    if (text === null)
      return resultExpected
        ? absent<AgentResultV1>("RESULT_ABSENT")
        : notApplicable<AgentResultV1>("RESULT_NOT_REQUIRED");
    const persistedResult = normalizedPersistedResult(persisted);
    const parsed = parseObservedResult(text, persisted, persistedResult);
    const identityMatches =
      parsed.issueNumber === persisted.issueNumber &&
      parsed.branch === persisted.branch;
    if (resultExpected) {
      if (!identityMatches) return mismatch(parsed, "RESULT_IDENTITY_MISMATCH");
      if (persistedResult !== null && !same(parsed, persistedResult))
        return mismatch(parsed, "RESULT_CONTENT_MISMATCH");
      return match(parsed, "RESULT_MATCH");
    }
    if (!recoveryProcessContext) return mismatch(parsed, "RESULT_UNEXPECTED");
    const candidateCode = recoveryCandidateMismatch(persisted, parsed);
    return candidateCode === null
      ? match(parsed, "RESULT_RECOVERY_CANDIDATE")
      : mismatch(parsed, candidateCode);
  });
  const candidate =
    result.code === "RESULT_RECOVERY_CANDIDATE" ? result.facts : null;
  const expectedHead = candidate?.headSha ?? completionHead(persisted);

  const [git, remote, github] = await Promise.all([
    observe(async () => {
      const facts = await ports.git.observeWorktree(
        repositoryRoot,
        persisted.worktreePath,
      );
      if (!facts.pathExists && !facts.registered)
        return absent<WorktreeObservationV1>("GIT_WORKTREE_ABSENT", facts);
      const preparationHead =
        persisted.state === "starting_tmux"
          ? (persisted.fetchedBaseProof?.advertisedHeadSha ?? null)
          : expectedHead;
      const preparationClean =
        persisted.state !== "starting_tmux" || isClean(facts);
      const agrees =
        facts.pathExists &&
        facts.registered &&
        facts.branch === persisted.branch &&
        (preparationHead === null || facts.headSha === preparationHead) &&
        preparationClean;
      return agrees
        ? match(facts, "GIT_WORKTREE_MATCH")
        : mismatch(facts, "GIT_WORKTREE_MISMATCH");
    }),
    persisted.fetchedBaseProof === null
      ? Promise.resolve(
          notApplicable<{ readonly headSha: string | null }>(
            "REMOTE_NOT_CONFIGURED",
          ),
        )
      : observe(async () => {
          const headSha = await ports.git.remoteBranchSha(
            repositoryRoot,
            persisted.fetchedBaseProof?.remote ?? "",
            persisted.branch,
          );
          if (headSha === null)
            return absent<{ readonly headSha: string | null }>(
              "REMOTE_BRANCH_ABSENT",
              { headSha },
            );
          return expectedHead === null || headSha === expectedHead
            ? match({ headSha }, "REMOTE_BRANCH_MATCH")
            : mismatch({ headSha }, "REMOTE_BRANCH_MISMATCH");
        }),
    candidate !== null
      ? observe<MergedPullRequestFactsV1>(async () => {
          const facts = await ports.github.loadPullRequest(
            persisted.repository,
            candidate.prNumber,
          );
          if (facts === null) return absent("PULL_REQUEST_CANDIDATE_ABSENT");
          const expectedBase = persisted.fetchedBaseProof?.defaultBranch;
          const eligible =
            expectedBase !== undefined &&
            facts.number === candidate.prNumber &&
            facts.state === "OPEN" &&
            facts.complete &&
            facts.baseBranch === expectedBase &&
            facts.headBranch === persisted.branch &&
            facts.headSha === candidate.headSha &&
            facts.closesIssues.includes(persisted.issueNumber);
          const candidateFacts: MergedPullRequestFactsV1 = {
            number: facts.number,
            state: facts.state,
            mergedAt: null,
            sourceBranch: facts.headBranch,
            sourceHeadSha: facts.headSha,
            mergeCommitSha: null,
            closesIssues: facts.closesIssues,
            complete: facts.complete,
          };
          return eligible
            ? match(candidateFacts, "PULL_REQUEST_CANDIDATE_MATCH")
            : mismatch(candidateFacts, "PULL_REQUEST_CANDIDATE_MISMATCH");
        })
      : persistedPullRequestNumber === null
        ? Promise.resolve(
            notApplicable<MergedPullRequestFactsV1>(
              "PULL_REQUEST_NOT_RECORDED",
            ),
          )
        : observe<MergedPullRequestFactsV1>(async () => {
            const facts = await ports.github.loadMergedPullRequest(
              persisted.repository,
              persistedPullRequestNumber,
            );
            if (facts === null)
              return absent<MergedPullRequestFactsV1>("PULL_REQUEST_ABSENT");
            const completionSha = completionHead(persisted);
            const identityMatches =
              facts.number === persistedPullRequestNumber &&
              facts.sourceBranch === persisted.branch &&
              (completionSha === null ||
                facts.sourceHeadSha === completionSha) &&
              facts.closesIssues.includes(persisted.issueNumber);
            return identityMatches
              ? match(facts, "PULL_REQUEST_MATCH")
              : mismatch(facts, "PULL_REQUEST_MISMATCH");
          }),
  ]);

  const priorDiagnostic =
    persisted.schemaVersion === 5 || persisted.schemaVersion === 6
      ? persisted.tmuxIdentityDiagnostic
      : null;
  const desiredDiagnostic =
    tmuxResult.disposition === "preserve"
      ? priorDiagnostic
      : tmuxResult.diagnostic;
  let reportSnapshot = persisted;
  if (
    (persisted.schemaVersion === 5 || persisted.schemaVersion === 6) &&
    !same(priorDiagnostic, desiredDiagnostic)
  ) {
    reportSnapshot = {
      ...persisted,
      revision: persisted.revision + 1,
      tmuxIdentityDiagnostic: desiredDiagnostic,
      updatedAt: ports.clock.now(),
    };
    await store.save(
      reportSnapshot,
      persisted.state,
      desiredDiagnostic === null
        ? "tmux-identity-diagnostic-cleared"
        : "tmux-identity-diagnostic-retained",
    );
  }
  return buildReconciliationReport(reportSnapshot, {
    lock,
    lease,
    filesystem,
    git,
    tmux: tmuxResult.observation,
    workerProcess,
    rpivProcess,
    progress,
    result,
    remote,
    github,
  });
}

export function buildReconciliationReport(
  persisted: RunSnapshot,
  observations: ReconciliationObservationsV1,
): ReconciliationReportV2 {
  const entries = Object.entries(observations) as readonly [
    keyof ReconciliationObservationsV1,
    ObservationV1,
  ][];
  const authorizingEntries = entries.filter(
    ([boundary]) => boundary !== "progress",
  );
  const unknown = authorizingEntries.filter(
    ([, observation]) => observation.state === "unknown",
  );
  const mismatched = authorizingEntries.filter(
    ([, observation]) => observation.state === "mismatch",
  );
  const diagnostics = [...unknown, ...mismatched].map(
    ([boundary, observation]) => boundary + ":" + observation.code,
  );
  if (persisted.schemaVersion !== 6) {
    return report(
      persisted,
      observations,
      "blocked",
      "LEGACY_RECONCILIATION_REQUIRED",
      [],
      ["legacy snapshot requires an explicit proved v3 migration"],
      "Migrate only through a complete, identity-matching reconciliation transition.",
    );
  }
  if (persisted.state === "completed")
    return buildCompletedReport(persisted, observations, diagnostics);
  if (
    persisted.state === "starting_tmux" &&
    observations.tmux.code === "TMUX_NAME_PRESENT_UNKNOWN"
  )
    return report(
      persisted,
      observations,
      "blocked",
      "RESOURCE_OWNERSHIP_UNKNOWN",
      [],
      diagnostics,
      "Preserve every same-name tmux window; a name, cwd, identity, or process command never proves ownership.",
    );
  const tmuxMatches = observations.tmux.code === "TMUX_MATCH";
  const rpivMatches = observations.rpivProcess.state === "match";
  const workerReconciled =
    observations.workerProcess.state === "match" ||
    observations.workerProcess.state === "not_applicable";
  const exactActiveOwnership =
    observations.lock.state === "match" &&
    observations.lease.state === "match" &&
    observations.filesystem.state === "match" &&
    observations.git.state === "match" &&
    tmuxMatches &&
    workerReconciled;
  // A proved active RPIV remains authoritative even if a stale, producer-owned
  // result artifact is present. It is preserved without accepting that result.
  if (
    persisted.state === "running_rpiv" &&
    rpivMatches &&
    exactActiveOwnership &&
    !["unknown", "mismatch"].includes(observations.remote.state) &&
    !["unknown", "mismatch"].includes(observations.github.state)
  ) {
    return report(
      persisted,
      observations,
      "active",
      "active_preserved",
      ["preserve_active", "attach", "stop"],
      [],
      null,
    );
  }
  if (unknown.length > 0)
    return report(
      persisted,
      observations,
      "blocked",
      "RECONCILIATION_UNKNOWN",
      [],
      diagnostics,
      "Restore every unavailable observation and explicitly retry; unknown facts authorize no action.",
    );
  if (mismatched.length > 0)
    return report(
      persisted,
      observations,
      "blocked",
      "RECONCILIATION_MISMATCH",
      [],
      diagnostics,
      "Preserve contradictory resources, restore exact ownership, and explicitly retry.",
    );

  if (
    persisted.state === "running_rpiv" &&
    observations.result.code === "RESULT_RECOVERY_CANDIDATE"
  ) {
    const candidateReady =
      observations.lock.state === "match" &&
      observations.lease.state === "match" &&
      observations.filesystem.state === "match" &&
      observations.git.state === "match" &&
      observations.result.state === "match" &&
      observations.remote.state === "match" &&
      observations.github.state === "match" &&
      observations.rpivProcess.state === "absent" &&
      (observations.workerProcess.state === "absent" ||
        observations.workerProcess.state === "not_applicable") &&
      (observations.tmux.state === "match" ||
        (observations.tmux.state === "absent" &&
          observations.tmux.code === "TMUX_ABSENT"));
    return report(
      persisted,
      observations,
      candidateReady ? "interrupted" : "blocked",
      candidateReady
        ? "FINALIZATION_RECOVERY_AVAILABLE"
        : "FINALIZATION_RECOVERY_INELIGIBLE",
      candidateReady ? ["retry_finalization"] : [],
      [],
      candidateReady
        ? null
        : "Preserve the unaccepted candidate and restore exact inactive ownership and completion-eligibility proof before explicit resume.",
    );
  }
  if (persisted.state === "running_rpiv") {
    const safeOwnership =
      exactActiveOwnership && observations.rpivProcess.state === "absent";
    return report(
      persisted,
      observations,
      safeOwnership ? "interrupted" : "blocked",
      safeOwnership ? "RUN_INTERRUPTED" : "RUN_OWNERSHIP_UNPROVED",
      safeOwnership ? ["resume", "attach"] : [],
      [],
      safeOwnership
        ? null
        : "Restore the exact lock, lease, worktree, tmux, worker, and RPIV process facts before recovery.",
    );
  }
  if (
    persisted.state === "acquiring_lock" ||
    persisted.state === "preparing_worktree" ||
    persisted.state === "starting_tmux"
  ) {
    const preparationOwned =
      observations.lock.state === "match" &&
      observations.lease.state === "match" &&
      (persisted.state !== "starting_tmux" ||
        (persisted.tmux === null &&
          observations.filesystem.state === "match" &&
          observations.git.state === "match" &&
          observations.tmux.state === "absent" &&
          observations.tmux.code === "TMUX_NAME_ABSENT"));
    return report(
      persisted,
      observations,
      preparationOwned ? "interrupted" : "blocked",
      preparationOwned
        ? "PREPARATION_RESUME_AVAILABLE"
        : "RUN_OWNERSHIP_UNPROVED",
      preparationOwned ? ["resume"] : [],
      [],
      preparationOwned
        ? null
        : "Restore the exact lock, lease, fetched-base HEAD, clean registered worktree, and zero-candidate tmux-name proof before resuming preparation.",
    );
  }
  if (persisted.state === "finalizing") {
    const retryable =
      observations.result.state === "match" &&
      observations.rpivProcess.state === "absent";
    return report(
      persisted,
      observations,
      "interrupted",
      retryable ? "FINALIZATION_RETRY_AVAILABLE" : "FINALIZATION_INPUT_MISSING",
      retryable ? ["retry_finalization"] : [],
      [],
      retryable
        ? null
        : "Restore the exact validated result artifact and inactive RPIV facts before retrying finalization.",
    );
  }
  if (
    persisted.state === "interrupted" &&
    observations.result.state === "match" &&
    observations.rpivProcess.state === "absent"
  )
    return report(
      persisted,
      observations,
      "interrupted",
      "FINALIZATION_RETRY_AVAILABLE",
      ["retry_finalization"],
      [],
      null,
    );

  if (
    persisted.state === "interrupted" &&
    (observations.result.state === "absent" ||
      observations.result.state === "not_applicable") &&
    observations.lock.state === "match" &&
    observations.filesystem.state === "match" &&
    observations.git.state === "match" &&
    observations.tmux.code === "TMUX_MATCH" &&
    observations.rpivProcess.state === "absent" &&
    (observations.workerProcess.state === "absent" ||
      observations.workerProcess.state === "not_applicable")
  )
    return report(
      persisted,
      observations,
      "interrupted",
      "RUN_INTERRUPTED",
      ["resume", "attach", "explicit_clean"],
      [],
      null,
    );

  const canClean = canExplicitCleanup(persisted, observations);
  return report(
    persisted,
    observations,
    "inactive",
    "TERMINAL_" + persisted.state.toUpperCase(),
    canClean
      ? observations.tmux.code === "TMUX_MATCH"
        ? ["attach", "explicit_clean"]
        : ["explicit_clean"]
      : observations.tmux.code === "TMUX_MATCH"
        ? ["attach"]
        : [],
    [],
    canClean
      ? null
      : "Restore exact inactive ownership before guarded cleanup.",
  );
}

function buildCompletedReport(
  persisted: RunSnapshotV3 | RunSnapshotV4 | RunSnapshotV5 | RunSnapshotV6,
  observations: ReconciliationObservationsV1,
  diagnostics: readonly string[],
): ReconciliationReportV2 {
  const nonGitHubProblems = Object.entries(observations).filter(
    ([boundary, observation]) =>
      boundary !== "github" &&
      boundary !== "progress" &&
      (observation.state === "unknown" || observation.state === "mismatch"),
  );
  const explicitReady = canExplicitCleanup(persisted, observations);
  const automaticCleanupCompleted = cleanupStepsCompleted(persisted, [
    "worktree",
    "lease",
    "lock",
  ]);
  const explicitCleanupCompleted = cleanupStepsCompleted(persisted, [
    "tmux",
    "worktree",
    "lease",
    "lock",
  ]);
  const attach =
    observations.tmux.code === "TMUX_MATCH" ? ["attach" as const] : [];
  const explicit =
    explicitReady && !explicitCleanupCompleted
      ? ["explicit_clean" as const]
      : [];
  if (nonGitHubProblems.length > 0)
    return report(
      persisted,
      observations,
      "blocked",
      "CLEANUP_OWNERSHIP_UNPROVED",
      attach,
      diagnostics,
      "Preserve the completed run and restore every unknown or mismatched ownership fact before cleanup.",
    );

  if (!explicitReady)
    return report(
      persisted,
      observations,
      "blocked",
      "CLEANUP_OWNERSHIP_UNPROVED",
      attach,
      diagnostics,
      "Preserve the completed run and restore every required exact or same-owner recorded cleanup fact.",
    );

  if (automaticCleanupCompleted)
    return report(
      persisted,
      observations,
      "inactive",
      "CLEANUP_ALREADY_COMPLETED",
      [...attach, ...explicit],
      [],
      null,
    );

  const merge = observations.github.facts;
  const mergeProved =
    observations.github.state === "match" &&
    merge !== null &&
    merge.complete &&
    merge.state === "MERGED" &&
    merge.mergedAt !== null;
  if (mergeProved && explicitReady)
    return report(
      persisted,
      observations,
      "inactive",
      "MERGED_CLEANUP_READY",
      [...attach, ...explicit, "automatic_clean"],
      [],
      null,
    );
  if (
    observations.github.state === "match" &&
    merge !== null &&
    merge.complete &&
    merge.state === "OPEN"
  )
    return report(
      persisted,
      observations,
      "inactive",
      "MERGE_PENDING",
      [...attach, ...explicit],
      [],
      "Wait for the expected pull request to merge or use explicit cleanup only when all ownership facts remain exact.",
    );
  return report(
    persisted,
    observations,
    "blocked",
    "CLEANUP_MERGE_NOT_PROVED",
    [...attach, ...explicit],
    diagnostics,
    "Preserve completed state and resources; restore complete expected-PR source-head and ownership proof before automatic cleanup.",
  );
}

function cleanupStepsCompleted(
  persisted: RunSnapshotV3 | RunSnapshotV4 | RunSnapshotV5 | RunSnapshotV6,
  steps: readonly CleanupStep[],
): boolean {
  const progress = persisted.cleanup;
  return (
    progress !== null &&
    progress.ownerId === persisted.ownerId &&
    progress.runId === persisted.runId &&
    steps.every((step) => progress.completedSteps.includes(step))
  );
}

function canExplicitCleanup(
  persisted: RunSnapshotV3 | RunSnapshotV4 | RunSnapshotV5 | RunSnapshotV6,
  observations: ReconciliationObservationsV1,
): boolean {
  const progress = persisted.cleanup;
  const progressOwned =
    progress !== null &&
    progress.ownerId === persisted.ownerId &&
    progress.runId === persisted.runId;
  const completed = (step: CleanupStep): boolean =>
    progressOwned && (progress?.completedSteps.includes(step) ?? false);
  const started = (step: CleanupStep): boolean =>
    progressOwned &&
    (progress?.startedCheckpoints?.some(
      (checkpoint) =>
        checkpoint.step === step &&
        checkpoint.resourceIdentity ===
          cleanupResourceIdentity(persisted, step),
    ) ??
      false);
  const tmuxReconciled =
    observations.tmux.code === "TMUX_MATCH" ||
    observations.tmux.code === "TMUX_EXACT_DEAD" ||
    ((completed("tmux") || started("tmux")) &&
      observations.tmux.state === "absent");
  const worktreeReconciled =
    (observations.filesystem.state === "match" &&
      observations.git.state === "match" &&
      isClean(observations.git.facts)) ||
    ((completed("worktree") || started("worktree")) &&
      observations.filesystem.state === "absent" &&
      observations.git.state === "absent");
  const leaseReconciled =
    persisted.admission === null
      ? observations.lease.state === "not_applicable" || completed("lease")
      : observations.lease.state === "match" ||
        (started("lease") && observations.lease.state === "absent");
  const lockReconciled =
    observations.lock.state === "match" ||
    ((completed("lock") || started("lock")) &&
      observations.lock.state === "absent");
  const resultReconciled =
    persisted.state === "completed"
      ? observations.result.state === "match" ||
        ((completed("worktree") || started("worktree")) &&
          observations.result.state === "absent")
      : observations.result.state === "match" ||
        observations.result.state === "absent" ||
        observations.result.state === "not_applicable";
  const processesInactive =
    (observations.workerProcess.state === "absent" ||
      observations.workerProcess.state === "not_applicable") &&
    observations.rpivProcess.state === "absent";
  return (
    tmuxReconciled &&
    worktreeReconciled &&
    leaseReconciled &&
    lockReconciled &&
    resultReconciled &&
    processesInactive
  );
}

function cleanupResourceIdentity(
  persisted: RunSnapshotV3 | RunSnapshotV4 | RunSnapshotV5 | RunSnapshotV6,
  step: CleanupStep,
): string {
  if (step === "tmux") return JSON.stringify(persisted.tmux);
  if (step === "worktree")
    return JSON.stringify({
      path: persisted.worktreePath,
      branch: persisted.branch,
      head: persisted.finalization?.result?.headSha ?? null,
    });
  if (step === "lease") return JSON.stringify(persisted.admission);
  return JSON.stringify({
    issueNumber: persisted.issueNumber,
    repository: persisted.repository,
    ownerId: persisted.ownerId,
    runId: persisted.runId,
  });
}

function report(
  persisted: RunSnapshot,
  observations: ReconciliationObservationsV1,
  activity: ReconciliationReportV2["activity"],
  decisionCode: string,
  safeActions: ReconciliationReportV2["safeActions"],
  diagnostics: readonly string[],
  remediation: string | null,
): ReconciliationReportV2 {
  return {
    schemaVersion: 3,
    issueNumber: persisted.issueNumber,
    persisted,
    observations,
    activity,
    decisionCode,
    safeActions,
    resultAuthority:
      observations.result.code === "RESULT_RECOVERY_CANDIDATE"
        ? "recovery_candidate"
        : observations.result.code === "RESULT_MATCH"
          ? "persisted_completion"
          : "none",
    diagnostics,
    remediation,
    tmuxIdentityDiagnostic:
      persisted.schemaVersion === 5 || persisted.schemaVersion === 6
        ? persisted.tmuxIdentityDiagnostic
        : null,
  };
}

interface TmuxObservationCollection {
  readonly observation: ReconciliationObservationsV1["tmux"];
  readonly disposition: "preserve" | "replace" | "clear";
  readonly diagnostic: TmuxIdentityDiagnosticV1 | null;
}

async function collectTmuxObservation(
  persisted: RunSnapshot,
  ports: RunnerPorts,
): Promise<TmuxObservationCollection> {
  if (persisted.schemaVersion !== 6) {
    return {
      observation: unknown("LEGACY_TMUX_SELECTOR_MISSING"),
      disposition: "preserve",
      diagnostic: null,
    };
  }
  if (persisted.tmux === null) {
    if (persisted.state !== "starting_tmux")
      return {
        observation: notApplicable("TMUX_NOT_RECORDED"),
        disposition: "preserve",
        diagnostic: null,
      };
    try {
      const present = await ports.tmux.observeIssueWindowName({
        target: persisted.tmuxSelection,
        windowName: String(persisted.issueNumber),
        cwd: persisted.worktreePath,
      });
      return {
        observation: present
          ? mismatch({ present: true }, "TMUX_NAME_PRESENT_UNKNOWN")
          : absent("TMUX_NAME_ABSENT", { present: false }),
        disposition: "preserve",
        diagnostic: null,
      };
    } catch (cause: unknown) {
      if (!isRunnerError(cause)) throw cause;
      return {
        observation: unknown(cause.code),
        disposition: "preserve",
        diagnostic: null,
      };
    }
  }
  try {
    const actual = await ports.tmux.observe(persisted.tmux);
    if (actual === null)
      return {
        observation: absent("TMUX_ABSENT"),
        disposition: "preserve",
        diagnostic: null,
      };
    const exact = same(actual.target, persisted.tmux);
    return {
      observation: exact
        ? match(
            actual.target,
            actual.state === "dead" ? "TMUX_EXACT_DEAD" : "TMUX_MATCH",
          )
        : mismatch(actual.target, "TMUX_MISMATCH"),
      disposition: "clear",
      diagnostic: null,
    };
  } catch (cause: unknown) {
    if (cause instanceof TmuxIdentityOutputError)
      return {
        observation: unknown(cause.code),
        disposition: "replace",
        diagnostic: cause.tmuxIdentityDiagnostic,
      };
    if (!isRunnerError(cause)) throw cause;
    return {
      observation: unknown(cause.code),
      disposition: "preserve",
      diagnostic: null,
    };
  }
}

async function observeProcess(
  ports: RunnerPorts,
  expected: ProcessIdentityV1,
  label: string,
): Promise<ObservationV1<ProcessIdentityV1>> {
  return observe(async () => {
    const actual = await ports.processes.observe(expected);
    if (actual === null)
      return absent<ProcessIdentityV1>(`${label}_PROCESS_ABSENT`);
    return same(actual, expected)
      ? match(actual, `${label}_PROCESS_MATCH`)
      : mismatch(actual, `${label}_PROCESS_IDENTITY_MISMATCH`);
  });
}

async function observe<T>(
  operation: () => Promise<ObservationV1<T>>,
): Promise<ObservationV1<T>> {
  try {
    return await operation();
  } catch (cause: unknown) {
    if (!isRunnerError(cause)) throw cause;
    return unknown<T>(cause.code);
  }
}

function match<T>(facts: T, code: string): ObservationV1<T> {
  return { state: "match", facts, code };
}
function absent<T>(code: string, facts: T | null = null): ObservationV1<T> {
  return { state: "absent", facts, code };
}
function mismatch<T>(facts: T, code: string): ObservationV1<T> {
  return { state: "mismatch", facts, code };
}
function unknown<T>(code: string): ObservationV1<T> {
  return { state: "unknown", facts: null, code };
}
function notApplicable<T>(code: string): ObservationV1<T> {
  return { state: "not_applicable", facts: null, code };
}
function same(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
function sameOwner(actual: OwnerRecordV1, expected: OwnerRecordV1): boolean {
  return (
    actual.issueNumber === expected.issueNumber &&
    actual.ownerId === expected.ownerId &&
    actual.runId === expected.runId &&
    actual.repository === expected.repository
  );
}
function recoveryCandidateMismatch(
  snapshot: RunSnapshotV6,
  result: AgentResultV1,
): string | null {
  if (
    result.issueNumber !== snapshot.issueNumber ||
    result.branch !== snapshot.branch
  )
    return "RESULT_IDENTITY_MISMATCH";
  if (result.outcome !== "succeeded") return "RESULT_RECOVERY_INELIGIBLE";
  const expectedIds = snapshot.requiredAcceptanceCriteria.map(({ id }) => id);
  const observedIds = result.acceptanceCriteria.map(({ id }) => id);
  if (
    !same(expectedIds, observedIds) ||
    result.acceptanceCriteria.some(
      ({ status, evidence }) => status !== "verified" || evidence.length === 0,
    )
  )
    return "RESULT_ACCEPTANCE_BINDING_MISMATCH";
  if (
    result.requiredFinalValidation.command !==
      snapshot.requiredFinalValidation.command ||
    result.requiredFinalValidation.status !== "passed" ||
    result.requiredFinalValidation.evidence.length === 0
  )
    return "RESULT_FINAL_VALIDATION_BINDING_MISMATCH";
  return null;
}

function normalizedPersistedResult(
  snapshot: RunSnapshot,
): AgentResultV1 | null {
  if (snapshot.schemaVersion === 1 || snapshot.finalization?.result == null)
    return null;
  return snapshot.schemaVersion === 2 || snapshot.schemaVersion === 3
    ? migrateLegacyAgentResult(snapshot.finalization.result)
    : snapshot.finalization.result;
}

function parseObservedResult(
  text: string,
  snapshot: RunSnapshot,
  persistedResult: AgentResultV1 | null,
): AgentResultV1 {
  if (snapshot.schemaVersion === 2 || snapshot.schemaVersion === 3)
    return migrateLegacyAgentResult(parseLegacyAgentResult(text));
  try {
    return parseAgentResult(text);
  } catch (cause: unknown) {
    if (
      (snapshot.schemaVersion !== 4 &&
        snapshot.schemaVersion !== 5 &&
        snapshot.schemaVersion !== 6) ||
      persistedResult === null ||
      !isMigratedLegacyAgentResult(persistedResult)
    )
      throw cause;
    return migrateLegacyAgentResult(parseLegacyAgentResult(text));
  }
}

function completionHead(snapshot: RunSnapshot): string | null {
  return snapshot.schemaVersion !== 1
    ? (snapshot.finalization?.result?.headSha ?? null)
    : null;
}
function isClean(facts: WorktreeObservationV1 | null): boolean {
  return (
    facts !== null &&
    facts.pathExists &&
    facts.registered &&
    !facts.staged &&
    !facts.unstaged &&
    !facts.untracked
  );
}
