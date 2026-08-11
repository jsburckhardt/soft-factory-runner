import type {
  ControlOutcomeV1,
  ReconciliationReportV1,
  RunSnapshot,
  StatusFacts,
  TmuxIdentity,
} from "./domain";
import type { RunnerError } from "./errors";

export function renderRun(snapshot: RunSnapshot, json: boolean): string {
  if (json)
    return `${JSON.stringify({ schemaVersion: 1, run: snapshot }, null, 2)}\n`;
  const revision = snapshot.schemaVersion === 3 ? ` r${snapshot.revision}` : "";
  return `Issue #${snapshot.issueNumber}: ${snapshot.state}${revision}\nBranch: ${snapshot.branch}\nWorktree: ${snapshot.worktreePath}\nWindow: ${snapshot.tmux?.sessionName ?? "not-started"}:${snapshot.tmux?.windowName ?? "not-started"}\n`;
}

export function renderStatus(facts: StatusFacts, json: boolean): string {
  if (json) return `${JSON.stringify(facts, null, 2)}\n`;
  return renderReport(facts.reconciliation);
}

export function renderReport(
  report: ReconciliationReportV1,
  json = false,
): string {
  if (json) return `${JSON.stringify(report, null, 2)}\n`;
  const observations = Object.entries(report.observations)
    .map(([boundary, observation]) => `${boundary}=${observation.state}`)
    .join(", ");
  const actions =
    report.safeActions.length === 0 ? "none" : report.safeActions.join(", ");
  return `Issue #${report.issueNumber}\nPersisted state: ${report.persisted.state}\nReconciliation: ${report.decisionCode} (${report.activity})\nObservations: ${observations}\nSafe actions: ${actions}\n`;
}

export function renderControl(result: ControlOutcomeV1, json: boolean): string {
  if (json) return `${JSON.stringify(result, null, 2)}\n`;
  const issue =
    result.issueNumber === null ? "Repository" : `Issue #${result.issueNumber}`;
  const remediation =
    result.remediation === null ? "" : `\nRemediation: ${result.remediation}`;
  return `${issue}: ${result.state}\nOutcome: ${result.code}\nFacts: ${JSON.stringify(result.facts)}${remediation}\n`;
}

export function renderAttach(target: TmuxIdentity): string {
  return `Attached to ${target.sessionName}:${target.windowName} (${target.paneId}).\n`;
}

export function renderError(error: RunnerError, json: boolean): string {
  if (json)
    return `${JSON.stringify({ schemaVersion: 1, error: { code: error.code, message: error.message, remediation: error.remediation, details: error.details } }, null, 2)}\n`;
  return `${error.code}: ${error.message}\nRemediation: ${error.remediation}\n`;
}
