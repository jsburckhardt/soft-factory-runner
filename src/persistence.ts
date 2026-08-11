import path from "node:path";
import { parseAgentResult } from "./completion";
import type { RunSnapshot, RunState, TransitionEventV1 } from "./domain";
import { RunnerError } from "./errors";
import type { ClockPort, FilePort } from "./ports";

export class RunStore {
  public constructor(
    private readonly root: string,
    private readonly files: FilePort,
    private readonly clock: ClockPort,
  ) {}

  public lockPath(issueNumber: number): string {
    return path.join(
      this.root,
      ".soft-factory",
      "locks",
      `${issueNumber}.lock`,
    );
  }
  public snapshotPath(issueNumber: number): string {
    return path.join(this.root, ".soft-factory", "runs", `${issueNumber}.json`);
  }
  public eventsPath(issueNumber: number): string {
    return path.join(
      this.root,
      ".soft-factory",
      "events",
      `${issueNumber}.jsonl`,
    );
  }
  public async snapshotExists(issueNumber: number): Promise<boolean> {
    return this.files.exists(this.snapshotPath(issueNumber));
  }
  public async acquire(issueNumber: number, record: object): Promise<boolean> {
    return this.files.exclusiveCreate(
      this.lockPath(issueNumber),
      `${JSON.stringify(record, null, 2)}\n`,
    );
  }

  public async save(
    snapshot: RunSnapshot,
    from: RunState | null,
    reason: string,
  ): Promise<void> {
    const event: TransitionEventV1 = {
      schemaVersion: 1,
      at: this.clock.now(),
      runId: snapshot.runId,
      issueNumber: snapshot.issueNumber,
      from,
      to: snapshot.state,
      reason,
    };
    await this.files.append(
      this.eventsPath(snapshot.issueNumber),
      `${JSON.stringify(event)}\n`,
    );
    await this.files.atomicWrite(
      this.snapshotPath(snapshot.issueNumber),
      `${JSON.stringify(snapshot, null, 2)}\n`,
    );
  }

  public async load(issueNumber: number): Promise<RunSnapshot> {
    const text = await this.files.readText(this.snapshotPath(issueNumber));
    if (text === null)
      throw new RunnerError(
        "STATE_NOT_FOUND",
        `No run snapshot exists for issue #${issueNumber}.`,
        "Start the issue with soft-factory run first.",
      );
    let value: unknown;
    try {
      value = JSON.parse(text);
    } catch (cause: unknown) {
      throw new RunnerError(
        "STATE_INVALID",
        `Run snapshot for issue #${issueNumber} is not valid JSON.`,
        "Preserve the file and inspect it before retrying.",
        { cause },
      );
    }
    if (!isSnapshot(value) || value.issueNumber !== issueNumber)
      throw new RunnerError(
        "STATE_INVALID",
        `Run snapshot for issue #${issueNumber} has an unsupported or mismatched schema.`,
        "Preserve the file and migrate it with a supported Runner version.",
      );
    return value;
  }
}

function isSnapshot(value: unknown): value is RunSnapshot {
  if (!isRecord(value) || !isCommonSnapshot(value)) return false;
  if (value.schemaVersion === 1) return isLegacyState(value.state);
  if (value.schemaVersion !== 2 || !isRunState(value.state)) return false;
  return (
    isRequiredAcceptance(value.requiredAcceptanceCriteria) &&
    isRequiredValidations(value.requiredValidations) &&
    isFinalization(value.finalization)
  );
}

function isCommonSnapshot(value: Readonly<Record<string, unknown>>): boolean {
  return (
    typeof value.runId === "string" &&
    typeof value.ownerId === "string" &&
    typeof value.repository === "string" &&
    typeof value.issueNumber === "number" &&
    typeof value.branchType === "string" &&
    typeof value.branch === "string" &&
    typeof value.worktreePath === "string" &&
    isFetchedBaseProof(value.fetchedBaseProof) &&
    isTmux(value.tmux) &&
    isCopilot(value.copilot) &&
    isErrorFact(value.error) &&
    typeof value.updatedAt === "string"
  );
}
function isRunState(value: unknown): value is RunState {
  return (
    typeof value === "string" &&
    [
      "acquiring_lock",
      "preparing_worktree",
      "starting_tmux",
      "running_rpiv",
      "finalizing",
      "completed",
      "failed",
      "blocked",
      "cancelled",
      "interrupted",
    ].includes(value)
  );
}
function isLegacyState(value: unknown): boolean {
  return (
    typeof value === "string" &&
    [
      "acquiring_lock",
      "preparing_worktree",
      "starting_tmux",
      "running_rpiv",
      "failed",
      "blocked",
      "interrupted",
    ].includes(value)
  );
}
function isRequiredAcceptance(value: unknown): boolean {
  if (!Array.isArray(value) || value.length === 0) return false;
  const entries = value.filter(
    (entry) =>
      isRecord(entry) &&
      typeof entry.id === "string" &&
      /^AC-[1-9]\d*$/.test(entry.id) &&
      typeof entry.text === "string" &&
      entry.text.trim() !== "",
  );
  return (
    entries.length === value.length &&
    new Set(entries.map((entry) => entry.id)).size === entries.length
  );
}
function isRequiredValidations(value: unknown): boolean {
  if (!Array.isArray(value) || value.length !== 2) return false;
  const commands = value.flatMap((entry) =>
    isRecord(entry) && typeof entry.command === "string" ? [entry.command] : [],
  );
  return (
    commands.length === 2 &&
    new Set(commands).size === 2 &&
    commands.includes("just verify-focused") &&
    commands.includes("just verify")
  );
}
function isFinalization(value: unknown): boolean {
  if (value === null) return true;
  if (
    !isRecord(value) ||
    !("result" in value) ||
    !("git" in value) ||
    !("pullRequest" in value) ||
    !("reconciliation" in value)
  )
    return false;
  if (value.result !== null) {
    try {
      parseAgentResult(JSON.stringify(value.result));
    } catch {
      return false;
    }
  }
  return (
    isGitFacts(value.git) &&
    isPullRequestFacts(value.pullRequest) &&
    isReconciliation(value.reconciliation)
  );
}
function isGitFacts(value: unknown): boolean {
  return (
    value === null ||
    (isRecord(value) &&
      (value.localHeadSha === null || typeof value.localHeadSha === "string") &&
      typeof value.remote === "string" &&
      typeof value.remoteBranch === "string" &&
      (value.remoteHeadSha === null || typeof value.remoteHeadSha === "string"))
  );
}
function isPullRequestFacts(value: unknown): boolean {
  return (
    value === null ||
    (isRecord(value) &&
      typeof value.number === "number" &&
      typeof value.state === "string" &&
      typeof value.baseBranch === "string" &&
      typeof value.headBranch === "string" &&
      typeof value.headSha === "string" &&
      Array.isArray(value.closesIssues) &&
      value.closesIssues.every((entry: unknown) => typeof entry === "number") &&
      typeof value.complete === "boolean")
  );
}
function isReconciliation(value: unknown): boolean {
  return (
    value === null ||
    (isRecord(value) &&
      value.schemaVersion === 1 &&
      Array.isArray(value.comparisons) &&
      value.comparisons.every(
        (entry: unknown) =>
          isRecord(entry) &&
          typeof entry.code === "string" &&
          typeof entry.passed === "boolean" &&
          "expected" in entry &&
          "observed" in entry,
      ) &&
      typeof value.passed === "boolean" &&
      typeof value.decisionCode === "string")
  );
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isFetchedBaseProof(value: unknown): boolean {
  return (
    value === null ||
    (isRecord(value) &&
      value.schemaVersion === 1 &&
      typeof value.remote === "string" &&
      typeof value.defaultBranch === "string" &&
      typeof value.advertisedHeadSha === "string" &&
      typeof value.trackingRefSha === "string" &&
      typeof value.fetchedAt === "string" &&
      value.matches === true)
  );
}
function isTmux(value: unknown): boolean {
  return (
    value === null ||
    (isRecord(value) &&
      typeof value.sessionName === "string" &&
      typeof value.windowName === "string" &&
      typeof value.windowId === "string" &&
      typeof value.paneId === "string" &&
      typeof value.cwd === "string")
  );
}
function isCopilot(value: unknown): boolean {
  return (
    value === null ||
    (isRecord(value) &&
      value.executable === "copilot" &&
      Array.isArray(value.args) &&
      value.args.every((argument: unknown) => typeof argument === "string") &&
      typeof value.cwd === "string" &&
      typeof value.resourceAttributes === "string" &&
      (value.exitCode === null || typeof value.exitCode === "number"))
  );
}
function isErrorFact(value: unknown): boolean {
  return (
    value === null ||
    (isRecord(value) &&
      typeof value.code === "string" &&
      typeof value.message === "string")
  );
}
