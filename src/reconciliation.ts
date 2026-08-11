import type {
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
    persisted.state === "failed" ||
    persisted.state === "interrupted";
  const pullRequestNumber =
    persisted.schemaVersion !== 1
      ? (persisted.finalization?.result?.prNumber ?? null)
      : null;

  const [
    lock,
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
          ? absent<{ readonly present: boolean }>("RESULT_ABSENT", {
              present: false,
            })
          : notApplicable<{ readonly present: boolean }>("RESULT_NOT_REQUIRED");
      return match({ present: true }, "RESULT_PRESENT");
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
  const diagnostics = entries
    .filter(
      ([, observation]) =>
        observation.state === "unknown" || observation.state === "mismatch",
    )
    .map(([boundary, observation]) => `${boundary}:${observation.code}`);
  if (persisted.schemaVersion !== 3) {
    return report(
      persisted,
      observations,
      "blocked",
      "LEGACY_RECONCILIATION_REQUIRED",
      [],
      ["legacy snapshot requires an explicit proved v3 migration"],
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
    );
  if (mismatched.length > 0)
    return report(
      persisted,
      observations,
      "blocked",
      "RECONCILIATION_MISMATCH",
      [],
      diagnostics,
    );

  const tmuxMatches = observations.tmux.state === "match";
  const rpivMatches = observations.rpivProcess.state === "match";
  if (persisted.state === "running_rpiv" && rpivMatches) {
    return report(
      persisted,
      observations,
      "active",
      "active_preserved",
      tmuxMatches
        ? ["preserve_active", "attach", "stop"]
        : ["preserve_active", "stop"],
      [],
    );
  }
  if (persisted.state === "running_rpiv") {
    const safeOwnership =
      observations.lock.state === "match" &&
      observations.filesystem.state === "match" &&
      observations.git.state === "match" &&
      tmuxMatches;
    return report(
      persisted,
      observations,
      safeOwnership ? "interrupted" : "blocked",
      safeOwnership ? "RUN_INTERRUPTED" : "RUN_OWNERSHIP_UNPROVED",
      safeOwnership ? ["resume", "attach"] : [],
      [],
    );
  }
  if (
    persisted.state === "acquiring_lock" ||
    persisted.state === "preparing_worktree" ||
    persisted.state === "starting_tmux"
  ) {
    return report(
      persisted,
      observations,
      "interrupted",
      "PREPARATION_RESUME_AVAILABLE",
      ["resume"],
      [],
    );
  }
  if (persisted.state === "finalizing") {
    return report(
      persisted,
      observations,
      "interrupted",
      observations.result.state === "match"
        ? "FINALIZATION_RETRY_AVAILABLE"
        : "FINALIZATION_INPUT_MISSING",
      observations.result.state === "match" ? ["retry_finalization"] : [],
      [],
    );
  }
  if (persisted.state === "completed") {
    const merge = observations.github.facts;
    const canExplicitClean =
      isClean(observations.git.facts) &&
      observations.tmux.state === "match" &&
      observations.rpivProcess.state === "absent" &&
      observations.result.state === "match" &&
      observations.lock.state === "match" &&
      observations.filesystem.state === "match" &&
      observations.git.state === "match";
    if (
      observations.github.state === "match" &&
      merge?.state === "MERGED" &&
      merge.mergedAt !== null &&
      canExplicitClean
    ) {
      return report(
        persisted,
        observations,
        "inactive",
        "MERGED_CLEANUP_READY",
        tmuxMatches
          ? ["attach", "explicit_clean", "automatic_clean"]
          : ["explicit_clean", "automatic_clean"],
        [],
      );
    }
    if (merge?.state === "CLOSED") {
      return report(
        persisted,
        observations,
        "blocked",
        "CLEANUP_MERGE_NOT_PROVED",
        canExplicitClean
          ? tmuxMatches
            ? ["attach", "explicit_clean"]
            : ["explicit_clean"]
          : tmuxMatches
            ? ["attach"]
            : [],
        ["expected pull request is closed without complete merge proof"],
      );
    }
    return report(
      persisted,
      observations,
      "inactive",
      merge?.state === "OPEN" ? "MERGE_PENDING" : "COMPLETED_PRESERVED",
      canExplicitClean
        ? tmuxMatches
          ? ["attach", "explicit_clean"]
          : ["explicit_clean"]
        : tmuxMatches
          ? ["attach"]
          : [],
      [],
    );
  }
  const canClean =
    observations.rpivProcess.state === "absent" &&
    observations.tmux.state === "match" &&
    observations.lock.state === "match" &&
    observations.filesystem.state === "match" &&
    observations.git.state === "match" &&
    isClean(observations.git.facts);
  return report(
    persisted,
    observations,
    "inactive",
    `TERMINAL_${persisted.state.toUpperCase()}`,
    canClean
      ? tmuxMatches
        ? ["attach", "explicit_clean"]
        : ["explicit_clean"]
      : tmuxMatches
        ? ["attach"]
        : [],
    [],
  );
}

function report(
  persisted: RunSnapshot,
  observations: ReconciliationObservationsV1,
  activity: ReconciliationReportV1["activity"],
  decisionCode: string,
  safeActions: ReconciliationReportV1["safeActions"],
  diagnostics: readonly string[],
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
