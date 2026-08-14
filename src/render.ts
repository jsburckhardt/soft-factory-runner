import type {
  ControlOutcomeV1,
  ReconciliationReportV2,
  RunSnapshot,
  StatusFacts,
  TmuxIdentity,
} from "./domain";
import type { RunnerError } from "./errors";

export function renderRun(snapshot: RunSnapshot, json: boolean): string {
  if (json)
    return `${JSON.stringify({ schemaVersion: 1, run: snapshot }, null, 2)}\n`;
  const revision =
    snapshot.schemaVersion === 3 ||
    snapshot.schemaVersion === 4 ||
    snapshot.schemaVersion === 5
      ? ` r${snapshot.revision}`
      : "";
  return `Issue #${snapshot.issueNumber}: ${snapshot.state}${revision}\nBranch: ${snapshot.branch}\nWorktree: ${snapshot.worktreePath}\nWindow: ${snapshot.tmux?.sessionName ?? "not-started"}:${snapshot.tmux?.windowName ?? "not-started"}\n`;
}

export function renderStatus(facts: StatusFacts, json: boolean): string {
  if (json) return `${JSON.stringify(facts, null, 2)}\n`;
  return renderReport(facts.reconciliation);
}

export function renderReport(
  report: ReconciliationReportV2,
  json = false,
): string {
  if (json) return JSON.stringify(report, null, 2) + "\n";
  const observations = Object.entries(report.observations)
    .map(
      ([boundary, observation]) =>
        boundary +
        "=" +
        observation.state +
        ":" +
        observation.code +
        ":" +
        JSON.stringify(observation.facts),
    )
    .join(", ");
  const actions =
    report.safeActions.length === 0 ? "none" : report.safeActions.join(", ");
  const diagnostics =
    report.diagnostics.length === 0 ? "none" : report.diagnostics.join(", ");
  const remediation = report.remediation ?? "none";
  const tmuxIdentityEvidence =
    report.tmuxIdentityDiagnostic === null
      ? "none"
      : "malformed or ambiguous; " +
        JSON.stringify(report.tmuxIdentityDiagnostic);
  return (
    "Issue #" +
    report.issueNumber +
    "\nPersisted state: " +
    report.persisted.state +
    "\nReconciliation: " +
    report.decisionCode +
    " (" +
    report.activity +
    ")\nObservations: " +
    observations +
    "\nSafe actions: " +
    actions +
    "\nDiagnostics: " +
    diagnostics +
    "\nTmux identity evidence: " +
    tmuxIdentityEvidence +
    "\nReconciliation remediation: " +
    remediation +
    "\n"
  );
}

export function renderControl(result: ControlOutcomeV1, json: boolean): string {
  if (json) return JSON.stringify(result, null, 2) + "\n";
  const issue =
    result.issueNumber === null ? "Repository" : "Issue #" + result.issueNumber;
  const report =
    result.report === null ? "" : "\n" + renderReport(result.report).trimEnd();
  const remediation = result.remediation === null ? "none" : result.remediation;
  return (
    issue +
    ": " +
    result.state +
    "\nOutcome: " +
    result.code +
    "\nFacts: " +
    JSON.stringify(result.facts) +
    report +
    "\nRemediation: " +
    remediation +
    "\n"
  );
}

export function renderAttach(target: TmuxIdentity): string {
  return `Attached to ${target.sessionName}:${target.windowName} (${target.paneId}).\n`;
}

export function renderError(error: RunnerError, json: boolean): string {
  if (json)
    return `${JSON.stringify({ schemaVersion: 1, error: { code: error.code, message: error.message, remediation: error.remediation, details: error.details } }, null, 2)}\n`;
  return `${error.code}: ${error.message}\nRemediation: ${error.remediation}\n`;
}
