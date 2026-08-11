import type {
  AgentResultV1,
  CleanupStep,
  ConcurrencyLeaseV1,
  MergedPullRequestFactsV1,
  ObservationV1,
  OwnerRecordV1,
  ProcessIdentityV1,
  ReconciliationObservationsV1,
  ReconciliationReportV1,
  RunSnapshot,
  TmuxIdentity,
  WorktreeObservationV1,
} from "./domain";
import { parseAgentResult } from "./completion";
import { isRunnerError } from "./errors";
import { RunStore } from "./persistence";
import type { RunnerPorts } from "./ports";

export async function collectReconciliation(input: {
  readonly persisted: RunSnapshot;
  readonly repositoryRoot: string;
  readonly ports: RunnerPorts;
  readonly store: RunStore;
}): Promise<ReconciliationReportV1> {
  const { persisted, ports, repositoryRoot, store } = input;
  const expectedOwner: OwnerRecordV1 = {
    schemaVersion: 1,
    issueNumber: persisted.issueNumber,
    ownerId: persisted.ownerId,
    runId: persisted.runId,
    repository: persisted.repository,
    acquiredAt:
      persisted.schemaVersion === 3 && persisted.admission !== null
        ? persisted.admission.acquiredAt
        : "",
  };
  const resultPath = persisted.worktreePath;
  const resultExpected =
    persisted.state === "finalizing" ||
    persisted.state === "completed" ||
    (persisted.schemaVersion !== 1 &&
      persisted.finalization?.result !== null &&
      persisted.finalization?.result !== undefined);
  const pullRequestNumber =
    persisted.schemaVersion !== 1
      ? (persisted.finalization?.result?.prNumber ?? null)
      : null;

  const [
    lock,
    lease,
    filesystem,
    git,
    tmux,
    workerProcess,
    rpivProcess,
    result,
    remote,
    github,
  ] = await Promise.all([
    observe(async () => {
      const actual = await store.readOwner(persisted.issueNumber);
      if (actual === null) return absent<OwnerRecordV1>("LOCK_ABSENT");
      return sameOwner(actual, expectedOwner)
        ? match(actual, "LOCK_MATCH")
        : mismatch(actual, "LOCK_MISMATCH");
    }),
    persisted.schemaVersion !== 3
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
    observe(async () => {
      const facts = await ports.git.observeWorktree(
        repositoryRoot,
        persisted.worktreePath,
      );
      if (!facts.pathExists && !facts.registered)
        return absent<WorktreeObservationV1>("GIT_WORKTREE_ABSENT", facts);
      const expectedHead = completionHead(persisted);
      const agrees =
        facts.pathExists &&
        facts.registered &&
        facts.branch === persisted.branch &&
        (expectedHead === null || facts.headSha === expectedHead);
      return agrees
        ? match(facts, "GIT_WORKTREE_MATCH")
        : mismatch(facts, "GIT_WORKTREE_MISMATCH");
    }),
    persisted.tmux === null
      ? Promise.resolve(notApplicable<TmuxIdentity>("TMUX_NOT_RECORDED"))
      : observe(async () => {
          const actual = await ports.tmux.observe(
            persisted.tmux as TmuxIdentity,
          );
          if (actual === null) return absent<TmuxIdentity>("TMUX_ABSENT");
          return same(actual, persisted.tmux)
            ? match(actual, "TMUX_MATCH")
            : mismatch(actual, "TMUX_MISMATCH");
        }),
    persisted.schemaVersion !== 3 || persisted.workerProcess === null
      ? Promise.resolve(
          notApplicable<ProcessIdentityV1>("WORKER_PROCESS_NOT_RECORDED"),
        )
      : observeProcess(ports, persisted.workerProcess, "WORKER"),
    persisted.schemaVersion !== 3 || persisted.rpivProcess === null
      ? Promise.resolve(absent<ProcessIdentityV1>("RPIV_PROCESS_NOT_RECORDED"))
      : observeProcess(ports, persisted.rpivProcess, "RPIV"),
    observe(async () => {
      const text = await ports.files.readAgentResult(resultPath);
      if (text === null)
        return resultExpected
          ? absent<AgentResultV1>("RESULT_ABSENT")
          : notApplicable<AgentResultV1>("RESULT_NOT_REQUIRED");
      const parsed = parseAgentResult(text);
      const persistedResult =
        persisted.schemaVersion === 1
          ? null
          : (persisted.finalization?.result ?? null);
      const identityMatches =
        parsed.issueNumber === persisted.issueNumber &&
        parsed.branch === persisted.branch;
      if (!resultExpected) return mismatch(parsed, "RESULT_UNEXPECTED");
      if (!identityMatches) return mismatch(parsed, "RESULT_IDENTITY_MISMATCH");
      if (persistedResult !== null && !same(parsed, persistedResult))
        return mismatch(parsed, "RESULT_CONTENT_MISMATCH");
      return match(parsed, "RESULT_MATCH");
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
          const expectedHead = completionHead(persisted);
          return expectedHead === null || headSha === expectedHead
            ? match({ headSha }, "REMOTE_BRANCH_MATCH")
            : mismatch({ headSha }, "REMOTE_BRANCH_MISMATCH");
        }),
    pullRequestNumber === null
      ? Promise.resolve(
          notApplicable<MergedPullRequestFactsV1>("PULL_REQUEST_NOT_RECORDED"),
        )
      : observe(async () => {
          const facts = await ports.github.loadMergedPullRequest(
            persisted.repository,
            pullRequestNumber,
          );
          if (facts === null)
            return absent<MergedPullRequestFactsV1>("PULL_REQUEST_ABSENT");
          const expectedHead = completionHead(persisted);
          const identityMatches =
            facts.number === pullRequestNumber &&
            facts.sourceBranch === persisted.branch &&
            (expectedHead === null || facts.sourceHeadSha === expectedHead) &&
            facts.closesIssues.includes(persisted.issueNumber);
          return identityMatches
            ? match(facts, "PULL_REQUEST_MATCH")
            : mismatch(facts, "PULL_REQUEST_MISMATCH");
        }),
  ]);
  return buildReconciliationReport(persisted, {
    lock,
    lease,
    filesystem,
    git,
    tmux,
    workerProcess,
    rpivProcess,
    result,
    remote,
    github,
  });
}

export function buildReconciliationReport(
  persisted: RunSnapshot,
  observations: ReconciliationObservationsV1,
): ReconciliationReportV1 {
  const entries = Object.entries(observations) as readonly [
    keyof ReconciliationObservationsV1,
    ObservationV1,
  ][];
  const unknown = entries.filter(
    ([, observation]) => observation.state === "unknown",
  );
  const mismatched = entries.filter(
    ([, observation]) => observation.state === "mismatch",
  );
  const diagnostics = [...unknown, ...mismatched].map(
    ([boundary, observation]) => boundary + ":" + observation.code,
  );
  if (persisted.schemaVersion !== 3) {
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

  const tmuxMatches = observations.tmux.state === "match";
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
  if (
    persisted.state === "running_rpiv" &&
    rpivMatches &&
    exactActiveOwnership
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
      observations.lease.state === "match";
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
        : "Restore the exact issue lock and concurrency lease before resuming preparation.",
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
    observations.tmux.state === "match" &&
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
      ? observations.tmux.state === "match"
        ? ["attach", "explicit_clean"]
        : ["explicit_clean"]
      : observations.tmux.state === "match"
        ? ["attach"]
        : [],
    [],
    canClean
      ? null
      : "Restore exact inactive ownership before guarded cleanup.",
  );
}

function buildCompletedReport(
  persisted: Extract<RunSnapshot, { readonly schemaVersion: 3 }>,
  observations: ReconciliationObservationsV1,
  diagnostics: readonly string[],
): ReconciliationReportV1 {
  const nonGitHubProblems = Object.entries(observations).filter(
    ([boundary, observation]) =>
      boundary !== "github" &&
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
  const attach = observations.tmux.state === "match" ? ["attach" as const] : [];
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
  persisted: Extract<RunSnapshot, { readonly schemaVersion: 3 }>,
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
  persisted: Extract<RunSnapshot, { readonly schemaVersion: 3 }>,
  observations: ReconciliationObservationsV1,
): boolean {
  const progress = persisted.cleanup;
  const progressOwned =
    progress !== null &&
    progress.ownerId === persisted.ownerId &&
    progress.runId === persisted.runId;
  const completed = (step: CleanupStep): boolean =>
    progressOwned && (progress?.completedSteps.includes(step) ?? false);
  const tmuxReconciled =
    observations.tmux.state === "match" ||
    (completed("tmux") && observations.tmux.state === "absent");
  const worktreeReconciled =
    (observations.filesystem.state === "match" &&
      observations.git.state === "match" &&
      isClean(observations.git.facts)) ||
    (completed("worktree") &&
      observations.filesystem.state === "absent" &&
      observations.git.state === "absent");
  const leaseReconciled =
    persisted.admission === null
      ? observations.lease.state === "not_applicable" || completed("lease")
      : observations.lease.state === "match";
  const lockReconciled =
    observations.lock.state === "match" ||
    (completed("lock") && observations.lock.state === "absent");
  const resultReconciled =
    persisted.state === "completed"
      ? observations.result.state === "match" ||
        (completed("worktree") && observations.result.state === "absent")
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

function report(
  persisted: RunSnapshot,
  observations: ReconciliationObservationsV1,
  activity: ReconciliationReportV1["activity"],
  decisionCode: string,
  safeActions: ReconciliationReportV1["safeActions"],
  diagnostics: readonly string[],
  remediation: string | null,
): ReconciliationReportV1 {
  return {
    schemaVersion: 1,
    issueNumber: persisted.issueNumber,
    persisted,
    observations,
    activity,
    decisionCode,
    safeActions,
    diagnostics,
    remediation,
  };
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
