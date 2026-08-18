import type {
  CleanupStep,
  ControlOutcomeV1,
  ReconciliationReportV2,
  RunSnapshot,
  StatusFacts,
  TmuxIdentity,
} from "./domain";
import type { RunnerError } from "./errors";

function hasControlState(
  snapshot: RunSnapshot,
): snapshot is Extract<RunSnapshot, { readonly schemaVersion: 3 | 4 | 5 | 6 }> {
  return [3, 4, 5, 6].includes(snapshot.schemaVersion);
}

const CLEANUP_STEPS: readonly CleanupStep[] = [
  "tmux",
  "worktree",
  "lease",
  "lock",
];

export function renderRun(snapshot: RunSnapshot, json: boolean): string {
  const view = {
    schemaVersion: 1,
    issueNumber: snapshot.issueNumber,
    state: snapshot.state,
    revision: hasControlState(snapshot) ? snapshot.revision : null,
    resources: {
      tmux: snapshot.tmux === null ? "not_started" : "recorded",
      worktree: "recorded",
      lease:
        hasControlState(snapshot) && snapshot.admission !== null
          ? "recorded"
          : "not_applicable",
      lock: "recorded",
    },
  };
  if (json) return JSON.stringify(view, null, 2) + "\n";
  return (
    "Issue #" +
    view.issueNumber +
    ": " +
    view.state +
    (view.revision === null ? "" : " r" + view.revision) +
    "\nResources: tmux=" +
    view.resources.tmux +
    ", worktree=" +
    view.resources.worktree +
    ", lease=" +
    view.resources.lease +
    ", lock=" +
    view.resources.lock +
    "\n"
  );
}

export function renderStatus(facts: StatusFacts, json: boolean): string {
  return renderReport(facts.reconciliation, json);
}

function tmuxCategory(report: ReconciliationReportV2): string {
  const observation = report.observations.tmux;
  if (observation.code === "TMUX_MATCH") return "live";
  if (observation.code === "TMUX_EXACT_DEAD") return "dead";
  return observation.state;
}

function cleanupCategories(
  report: ReconciliationReportV2,
): Record<CleanupStep, string> {
  const cleanup = hasControlState(report.persisted)
    ? report.persisted.cleanup
    : null;
  return Object.fromEntries(
    CLEANUP_STEPS.map((step) => [
      step,
      cleanup?.completedSteps.includes(step)
        ? "completed"
        : cleanup?.remainingSteps.includes(step)
          ? "remaining"
          : "present",
    ]),
  ) as Record<CleanupStep, string>;
}

function publicReport(report: ReconciliationReportV2) {
  return {
    schemaVersion: 1,
    issueNumber: report.issueNumber,
    state: report.persisted.state,
    activity: report.activity,
    decisionCode: report.decisionCode,
    safeActions: report.safeActions,
    resultAuthority: report.resultAuthority,
    observations: Object.fromEntries(
      Object.entries(report.observations).map(([name, observation]) => [
        name,
        { state: observation.state, code: observation.code },
      ]),
    ),
    tmux: tmuxCategory(report),
    cleanup: cleanupCategories(report),
    diagnostics: report.diagnostics,
    remediation: report.remediation,
    tmuxIdentityEvidence:
      report.tmuxIdentityDiagnostic === null
        ? "none"
        : "malformed_or_ambiguous",
  };
}

export function renderReport(
  report: ReconciliationReportV2,
  json = false,
): string {
  const view = publicReport(report);
  if (json) return JSON.stringify(view, null, 2) + "\n";
  const observations = Object.entries(view.observations)
    .map(
      ([name, observation]) =>
        name + "=" + observation.state + ":" + observation.code,
    )
    .join(", ");
  return (
    "Issue #" +
    view.issueNumber +
    "\nPersisted state: " +
    view.state +
    "\nReconciliation: " +
    view.decisionCode +
    " (" +
    view.activity +
    ")" +
    "\nObservations: " +
    observations +
    "\nTmux lifecycle: " +
    view.tmux +
    "\nResult authority: " +
    view.resultAuthority +
    "\nCleanup authority: persisted completion proof only; dead-pane state, recovery candidates, progress, and unproved absence or malformed tmux evidence are non-authorizing" +
    "\nCleanup categories: " +
    JSON.stringify(view.cleanup) +
    "\nSafe actions: " +
    (view.safeActions.length === 0 ? "none" : view.safeActions.join(", ")) +
    "\nDiagnostics: " +
    (view.diagnostics.length === 0 ? "none" : view.diagnostics.join(", ")) +
    "\nTmux identity evidence: " +
    view.tmuxIdentityEvidence +
    "\nReconciliation remediation: " +
    (view.remediation ?? "none") +
    "\n"
  );
}

function publicControlFacts(result: ControlOutcomeV1): unknown {
  if (result.code === "LOGS_READY") {
    const facts = result.facts as {
      readonly retained?: readonly Record<string, unknown>[];
      readonly live?: unknown;
    };
    return {
      retained: (facts.retained ?? []).map((entry) =>
        Object.fromEntries(
          Object.entries(entry).filter(([key]) => key !== "path"),
        ),
      ),
      live: facts.live ?? null,
    };
  }
  if (result.report === null) return result.facts;
  return {
    cleanup: cleanupCategories(result.report),
    retainedEvidence: ["branch", "snapshot", "events", "logs"],
  };
}

export function renderControl(result: ControlOutcomeV1, json: boolean): string {
  const view = {
    schemaVersion: 1,
    issueNumber: result.issueNumber,
    state: result.state,
    code: result.code,
    exitCode: result.exitCode,
    exitMeaning: result.exitCode === 0 ? "success" : "refused_or_partial",
    facts: publicControlFacts(result),
    report: result.report === null ? null : publicReport(result.report),
    refusalReason: result.exitCode === 0 ? null : result.code,
    remediation: result.remediation,
  };
  if (json) return JSON.stringify(view, null, 2) + "\n";
  const issue =
    view.issueNumber === null ? "Repository" : "Issue #" + view.issueNumber;
  return (
    issue +
    ": " +
    view.state +
    "\nOutcome: " +
    view.code +
    "\nExit meaning: " +
    view.exitMeaning +
    "\nFacts: " +
    JSON.stringify(view.facts) +
    (result.report === null
      ? ""
      : "\n" + renderReport(result.report).trimEnd()) +
    "\nRefusal reason: " +
    (view.refusalReason ?? "none") +
    "\nRemediation: " +
    (view.remediation ?? "none") +
    "\n"
  );
}

export function renderAttach(target: TmuxIdentity): string {
  void target;
  return "Attached to the exact owned live tmux target.\n";
}

export function renderError(error: RunnerError, json: boolean): string {
  const view = {
    schemaVersion: 1,
    error: {
      code: error.code,
      message: error.message,
      remediation: error.remediation,
      details:
        typeof error.details.reason === "string" ||
        typeof error.details.causeCode === "string"
          ? {
              ...(typeof error.details.reason === "string"
                ? { reason: error.details.reason }
                : {}),
              ...(typeof error.details.causeCode === "string"
                ? { causeCode: error.details.causeCode }
                : {}),
            }
          : undefined,
    },
  };
  if (json) return JSON.stringify(view, null, 2) + "\n";
  return (
    error.code +
    ": " +
    error.message +
    "\nRemediation: " +
    error.remediation +
    "\n"
  );
}
