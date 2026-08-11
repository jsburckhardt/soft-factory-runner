import type { RunSnapshotV1, StatusFacts, TmuxIdentity } from "./domain";
import type { RunnerError } from "./errors";

export function renderRun(snapshot: RunSnapshotV1, json: boolean): string {
  if (json)
    return `${JSON.stringify({ schemaVersion: 1, run: snapshot }, null, 2)}\n`;
  return `Issue #${snapshot.issueNumber}: ${snapshot.state}\nBranch: ${snapshot.branch}\nWorktree: ${snapshot.worktreePath}\nWindow: ${snapshot.tmux?.sessionName ?? "not-started"}:${snapshot.tmux?.windowName ?? "not-started"}\n`;
}

export function renderStatus(facts: StatusFacts, json: boolean): string {
  if (json) return `${JSON.stringify(facts, null, 2)}\n`;
  const observed =
    facts.observed === null
      ? "not observed"
      : `${facts.observed.sessionName}:${facts.observed.windowName} ${facts.observed.paneId}`;
  return `Issue #${facts.issueNumber}\nPersisted state: ${facts.persisted.state}\nObserved tmux: ${observed}\n`;
}

export function renderAttach(target: TmuxIdentity): string {
  return `Attached to ${target.sessionName}:${target.windowName} (${target.paneId}).\n`;
}

export function renderError(error: RunnerError, json: boolean): string {
  if (json) {
    return `${JSON.stringify({ schemaVersion: 1, error: { code: error.code, message: error.message, remediation: error.remediation, details: error.details } }, null, 2)}\n`;
  }
  return `${error.code}: ${error.message}\nRemediation: ${error.remediation}\n`;
}
