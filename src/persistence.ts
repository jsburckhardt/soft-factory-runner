import path from "node:path";
import {
  migrateLegacyAgentResult,
  parseAgentResult,
  parseLegacyAgentResult,
} from "./completion";
import type {
  ConcurrencyLeaseV1,
  IntegrationLaunchV1,
  OwnerRecordV1,
  RequiredFinalValidationV1,
  RunSnapshot,
  RunSnapshotV3,
  RunSnapshotV4,
  RunState,
  TransitionEvent,
  TransitionEventV2,
} from "./domain";
import { RunnerError } from "./errors";
import type { ClockPort, FilePort } from "./ports";

const ISSUE_FILE = /^([1-9]\d*)\.(?:json|lock|jsonl)$/;
const SLOT_FILE = /^([1-9]\d*)\.lock$/;
const ISSUE_DIRECTORY = /^[1-9]\d*$/;

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
  public leasePath(slot: number): string {
    return path.join(
      this.root,
      ".soft-factory",
      "concurrency",
      "slots",
      `${slot}.lock`,
    );
  }
  public logPath(issueNumber: number, attempt: number): string {
    return path.join(
      this.root,
      ".soft-factory",
      "logs",
      String(issueNumber),
      `${attempt}.log`,
    );
  }
  public async snapshotExists(issueNumber: number): Promise<boolean> {
    return this.files.exists(this.snapshotPath(issueNumber));
  }
  public async acquire(
    issueNumber: number,
    record: OwnerRecordV1,
  ): Promise<boolean> {
    return this.files.exclusiveCreate(
      this.lockPath(issueNumber),
      serialize(record, true),
    );
  }
  public async acquireLease(record: ConcurrencyLeaseV1): Promise<boolean> {
    return this.files.exclusiveCreate(
      this.leasePath(record.slot),
      serialize(record, true),
    );
  }

  public async save(
    snapshot: RunSnapshot,
    from: RunState | null,
    reason: string,
  ): Promise<void> {
    const revisioned = isRevisionedSnapshot(snapshot);
    const event: TransitionEvent = revisioned
      ? {
          schemaVersion: 2,
          at: this.clock.now(),
          runId: snapshot.runId,
          issueNumber: snapshot.issueNumber,
          priorRevision: snapshot.revision - 1,
          resultingRevision: snapshot.revision,
          reason,
          resultingSnapshot: snapshot,
        }
      : {
          schemaVersion: 1,
          at: this.clock.now(),
          runId: snapshot.runId,
          issueNumber: snapshot.issueNumber,
          from,
          to: snapshot.state,
          reason,
        };
    if (revisioned) {
      if (snapshot.revision < 1)
        throw stateHistoryError(
          "Revisioned snapshots require a positive revision.",
        );
      const existingText = await this.files.readText(
        this.snapshotPath(snapshot.issueNumber),
      );
      if (existingText === null) {
        if (snapshot.revision !== 1)
          throw stateHistoryError(
            "A new version 3 snapshot must begin at revision 1.",
          );
      } else {
        const existing = await this.load(snapshot.issueNumber);
        const expectedRevision = isRevisionedSnapshot(existing)
          ? existing.revision + 1
          : 1;
        if (
          existing.runId !== snapshot.runId ||
          existing.ownerId !== snapshot.ownerId ||
          snapshot.revision !== expectedRevision
        )
          throw stateHistoryError(
            "Snapshot replacement is not the next identity-matching revision.",
          );
      }
    }
    await this.files.append(
      this.eventsPath(snapshot.issueNumber),
      `${JSON.stringify(event)}\n`,
    );
    await this.files.atomicWrite(
      this.snapshotPath(snapshot.issueNumber),
      serialize(snapshot, true),
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
    const snapshot = parseSnapshot(text, issueNumber);
    const history = await this.loadHistory(issueNumber);
    const replayed = replayHistory(snapshot, history);
    if (replayed !== snapshot) {
      await this.files.atomicWrite(
        this.snapshotPath(issueNumber),
        serialize(replayed, true),
      );
    }
    return replayed;
  }

  public async loadHistory(
    issueNumber: number,
  ): Promise<readonly TransitionEvent[]> {
    const text = await this.files.readText(this.eventsPath(issueNumber));
    if (text === null || text === "") return [];
    const lines = text.split(/\r?\n/);
    if (lines.at(-1) === "") lines.pop();
    const events: TransitionEvent[] = [];
    for (const [index, line] of lines.entries()) {
      if (line.trim() === "")
        throw stateHistoryError(`Event line ${index + 1} is empty.`);
      let value: unknown;
      try {
        value = JSON.parse(line);
      } catch (cause: unknown) {
        throw stateHistoryError(`Event line ${index + 1} is malformed.`, cause);
      }
      if (!isTransitionEvent(value)) {
        throw stateHistoryError(
          `Event line ${index + 1} has an unsupported schema.`,
        );
      }
      events.push(value);
    }
    return events;
  }

  public async readOwner(issueNumber: number): Promise<OwnerRecordV1 | null> {
    return parseRecordAt(
      await this.files.readText(this.lockPath(issueNumber)),
      isOwnerRecord,
      "issue lock",
    );
  }

  public async readLease(slot: number): Promise<ConcurrencyLeaseV1 | null> {
    return parseRecordAt(
      await this.files.readText(this.leasePath(slot)),
      isLeaseRecord,
      "concurrency lease",
    );
  }

  public async releaseOwner(
    issueNumber: number,
    expected: OwnerRecordV1,
  ): Promise<boolean> {
    return this.compareAndDeleteRecord(
      this.lockPath(issueNumber),
      expected,
      isOwnerRecord,
    );
  }

  public async releaseLease(expected: ConcurrencyLeaseV1): Promise<boolean> {
    return this.compareAndDeleteRecord(
      this.leasePath(expected.slot),
      expected,
      isLeaseRecord,
    );
  }

  private async compareAndDeleteRecord<T>(
    filePath: string,
    expected: T,
    guard: (value: unknown) => value is T,
  ): Promise<boolean> {
    const text = await this.files.readText(filePath);
    if (text === null) return false;
    let value: unknown;
    try {
      value = JSON.parse(text);
    } catch {
      return false;
    }
    if (!guard(value) || !same(value, expected)) return false;
    return this.files.compareAndDelete(filePath, text);
  }

  public async writeLog(
    issueNumber: number,
    attempt: number,
    content: string,
  ): Promise<string> {
    const logPath = this.logPath(issueNumber, attempt);
    await this.files.atomicWrite(logPath, content);
    return logPath;
  }

  public async readLog(
    issueNumber: number,
    attempt: number,
  ): Promise<string | null> {
    return this.files.readText(this.logPath(issueNumber, attempt));
  }

  public async enumerateLeases(): Promise<readonly ConcurrencyLeaseV1[]> {
    const names = await this.files.list(
      path.join(this.root, ".soft-factory", "concurrency", "slots"),
    );
    const leases: ConcurrencyLeaseV1[] = [];
    for (const name of [...names].sort()) {
      const match = SLOT_FILE.exec(name);
      if (match === null) continue;
      const lease = await this.readLease(Number(match[1]));
      if (lease !== null) leases.push(lease);
    }
    return leases;
  }

  public async enumerateIssueNumbers(): Promise<readonly number[]> {
    const issueNumbers = new Set<number>();
    for (const directory of ["runs", "locks", "events"] as const) {
      const names = await this.files.list(
        path.join(this.root, ".soft-factory", directory),
      );
      for (const name of names) {
        const match = ISSUE_FILE.exec(name);
        if (match !== null) issueNumbers.add(Number(match[1]));
      }
    }
    const leaseNames = await this.files.list(
      path.join(this.root, ".soft-factory", "concurrency", "slots"),
    );
    for (const name of leaseNames) {
      const match = SLOT_FILE.exec(name);
      if (match === null) continue;
      const lease = await this.readLease(Number(match[1]));
      if (lease !== null) issueNumbers.add(lease.issueNumber);
    }
    const logNames = await this.files.list(
      path.join(this.root, ".soft-factory", "logs"),
    );
    for (const name of logNames)
      if (ISSUE_DIRECTORY.test(name)) issueNumbers.add(Number(name));
    return [...issueNumbers].sort((left, right) => left - right);
  }
}

export function replayHistory(
  snapshot: RunSnapshot,
  events: readonly TransitionEvent[],
): RunSnapshot {
  const versionTwo = events.filter(
    (event): event is TransitionEventV2 => event.schemaVersion === 2,
  );
  if (!isRevisionedSnapshot(snapshot)) {
    if (versionTwo.length > 0)
      throw stateHistoryError(
        "Legacy snapshot has version 2 history that cannot be inferred safely.",
      );
    return snapshot;
  }
  const matching = versionTwo.filter(
    (event) =>
      event.issueNumber === snapshot.issueNumber &&
      event.runId === snapshot.runId,
  );
  if (matching.length !== versionTwo.length) {
    throw stateHistoryError(
      "Event history contains a conflicting run identity.",
    );
  }
  const byPrior = new Map<number, TransitionEventV2>();
  for (const event of matching) {
    const existing = byPrior.get(event.priorRevision);
    if (existing !== undefined && !same(existing, event)) {
      throw stateHistoryError("Event history contains conflicting revisions.");
    }
    byPrior.set(event.priorRevision, event);
  }
  let current = snapshot;
  const visited = new Set<number>();
  while (byPrior.has(current.revision)) {
    const event = byPrior.get(current.revision);
    if (event === undefined) break;
    if (visited.has(event.priorRevision))
      throw stateHistoryError("Event history contains a revision cycle.");
    visited.add(event.priorRevision);
    if (
      event.resultingRevision !== event.priorRevision + 1 ||
      event.resultingSnapshot.revision !== event.resultingRevision ||
      event.resultingSnapshot.issueNumber !== current.issueNumber ||
      event.resultingSnapshot.runId !== current.runId
    ) {
      throw stateHistoryError(
        "Event history is noncontiguous or identity mismatched.",
      );
    }
    current = event.resultingSnapshot;
  }
  const ahead = matching.some(
    (event) => event.resultingRevision > current.revision,
  );
  if (ahead)
    throw stateHistoryError(
      "Event history is noncontiguous ahead of the snapshot.",
    );
  return current;
}

export function parseSnapshot(text: string, issueNumber: number): RunSnapshot {
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

export function isSnapshot(value: unknown): value is RunSnapshot {
  if (!isRecord(value) || !isCommonSnapshot(value)) return false;
  if (value.schemaVersion === 1) return isLegacyState(value.state);
  if (
    value.schemaVersion !== 2 &&
    value.schemaVersion !== 3 &&
    value.schemaVersion !== 4
  )
    return false;
  if (
    !isRunState(value.state) ||
    !isRequiredAcceptance(value.requiredAcceptanceCriteria) ||
    (value.schemaVersion !== 4 &&
      !isRequiredValidations(value.requiredValidations)) ||
    (value.schemaVersion === 4
      ? !isFinalization(value.finalization)
      : !isLegacyFinalization(value.finalization, value.state))
  )
    return false;
  if (value.schemaVersion === 2) return true;
  const revisioned =
    isNonnegativeInteger(value.revision) &&
    isPositiveInteger(value.attempt) &&
    (value.admission === null || isLeaseRecord(value.admission)) &&
    (value.launchIntent === null || isLaunchIntent(value.launchIntent)) &&
    (value.workerProcess === null || isProcessIdentity(value.workerProcess)) &&
    (value.rpivProcess === null || isProcessIdentity(value.rpivProcess)) &&
    (value.stop === null || isStopFacts(value.stop)) &&
    (value.cleanup === null || isCleanupFacts(value.cleanup)) &&
    Array.isArray(value.logs) &&
    value.logs.every(isLogFacts) &&
    (value.mergedPullRequest === null ||
      isMergedFacts(value.mergedPullRequest));
  if (!revisioned) return false;
  if (value.schemaVersion === 3) return true;
  return (
    isRequiredFinalValidation(value.requiredFinalValidation) &&
    isBoundIntegrationLaunch(value.integrationLaunch, value) &&
    (value.progress === null || isRpivStatus(value.progress))
  );
}

export function isTransitionEvent(value: unknown): value is TransitionEvent {
  if (!isRecord(value)) return false;
  if (value.schemaVersion === 1) {
    return (
      typeof value.at === "string" &&
      typeof value.runId === "string" &&
      isPositiveInteger(value.issueNumber) &&
      (value.from === null || isRunState(value.from)) &&
      isRunState(value.to) &&
      typeof value.reason === "string"
    );
  }
  return (
    value.schemaVersion === 2 &&
    typeof value.at === "string" &&
    typeof value.runId === "string" &&
    isPositiveInteger(value.issueNumber) &&
    isNonnegativeInteger(value.priorRevision) &&
    isPositiveInteger(value.resultingRevision) &&
    typeof value.reason === "string" &&
    isSnapshot(value.resultingSnapshot) &&
    (value.resultingSnapshot.schemaVersion === 3 ||
      value.resultingSnapshot.schemaVersion === 4)
  );
}

function isCommonSnapshot(value: Readonly<Record<string, unknown>>): boolean {
  return (
    typeof value.runId === "string" &&
    typeof value.ownerId === "string" &&
    typeof value.repository === "string" &&
    isPositiveInteger(value.issueNumber) &&
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
  if (!Array.isArray(value) || value.length < 1 || value.length > 2)
    return false;
  const commands = value.flatMap((entry) =>
    isRecord(entry) && typeof entry.command === "string" ? [entry.command] : [],
  );
  return (
    commands.length === value.length &&
    new Set(commands).size === commands.length &&
    commands.includes("just verify") &&
    commands.every(
      (command) =>
        command === "just verify" || command === "just verify-focused",
    )
  );
}
function isRequiredFinalValidation(
  value: unknown,
): value is RequiredFinalValidationV1 {
  return (
    isRecord(value) &&
    Object.keys(value).length === 1 &&
    typeof value.command === "string" &&
    /^just [A-Za-z][A-Za-z0-9_-]*$/.test(value.command) &&
    value.command !== "just verify-focused"
  );
}
function isBoundIntegrationLaunch(
  value: unknown,
  snapshot: Readonly<Record<string, unknown>>,
): boolean {
  const snapshotFinalValidation = snapshot.requiredFinalValidation;
  if (
    !isIntegrationLaunch(value) ||
    typeof snapshot.runId !== "string" ||
    !isPositiveInteger(snapshot.attempt) ||
    !isPositiveInteger(snapshot.issueNumber) ||
    typeof snapshot.branch !== "string" ||
    typeof snapshot.worktreePath !== "string" ||
    !isRequiredFinalValidation(snapshotFinalValidation)
  )
    return false;
  return (
    value.runId === snapshot.runId &&
    value.attempt === snapshot.attempt &&
    value.issueNumber === snapshot.issueNumber &&
    value.branch === snapshot.branch &&
    value.progressPath ===
      path.join(snapshot.worktreePath, ".soft-factory", "rpiv-status.json") &&
    value.resultPath ===
      path.join(snapshot.worktreePath, ".soft-factory", "agent-result.json") &&
    value.requiredFinalValidation.command === snapshotFinalValidation.command
  );
}
function isIntegrationLaunch(value: unknown): value is IntegrationLaunchV1 {
  return (
    isRecord(value) &&
    value.schemaVersion === 1 &&
    typeof value.runId === "string" &&
    isPositiveInteger(value.attempt) &&
    isPositiveInteger(value.issueNumber) &&
    typeof value.branch === "string" &&
    typeof value.startedAt === "string" &&
    typeof value.progressPath === "string" &&
    typeof value.resultPath === "string" &&
    isRequiredFinalValidation(value.requiredFinalValidation) &&
    typeof value.publishProgressCommand === "string" &&
    typeof value.publishResultCommand === "string" &&
    typeof value.validateResultCommand === "string"
  );
}
function isRpivStatus(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const phase = value.phase;
  const status = value.status;
  return (
    value.schemaVersion === 1 &&
    typeof value.runId === "string" &&
    isPositiveInteger(value.attempt) &&
    isPositiveInteger(value.issueNumber) &&
    typeof value.branch === "string" &&
    isPositiveInteger(value.sequence) &&
    typeof phase === "string" &&
    ["research", "plan", "implement", "verify", "terminal"].includes(phase) &&
    typeof status === "string" &&
    (phase === "terminal"
      ? ["succeeded", "failed", "blocked", "cancelled", "interrupted"].includes(
          status,
        )
      : status === "running") &&
    typeof value.updatedAt === "string"
  );
}
function isLegacyFinalization(value: unknown, state: unknown): boolean {
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
      const result = parseLegacyAgentResult(JSON.stringify(value.result));
      if (state === "completed") migrateLegacyAgentResult(result);
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
      isPositiveInteger(value.number) &&
      typeof value.state === "string" &&
      typeof value.baseBranch === "string" &&
      typeof value.headBranch === "string" &&
      typeof value.headSha === "string" &&
      Array.isArray(value.closesIssues) &&
      value.closesIssues.every(isPositiveInteger) &&
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
      isStringArray(value.args) &&
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
export function isOwnerRecord(value: unknown): value is OwnerRecordV1 {
  return (
    isRecord(value) &&
    value.schemaVersion === 1 &&
    isPositiveInteger(value.issueNumber) &&
    typeof value.ownerId === "string" &&
    typeof value.runId === "string" &&
    typeof value.repository === "string" &&
    typeof value.acquiredAt === "string"
  );
}
export function isLeaseRecord(value: unknown): value is ConcurrencyLeaseV1 {
  return (
    isRecord(value) &&
    value.schemaVersion === 1 &&
    isPositiveInteger(value.slot) &&
    isPositiveInteger(value.issueNumber) &&
    typeof value.ownerId === "string" &&
    typeof value.runId === "string" &&
    typeof value.repository === "string" &&
    isPositiveInteger(value.configuredLimit) &&
    typeof value.acquiredAt === "string"
  );
}
function isLaunchIntent(value: unknown): boolean {
  return (
    isRecord(value) &&
    value.schemaVersion === 1 &&
    isPositiveInteger(value.attempt) &&
    value.executable === "copilot" &&
    isStringArray(value.args) &&
    typeof value.cwd === "string" &&
    typeof value.resourceAttributes === "string" &&
    isTmux(value.pane) &&
    value.pane !== null &&
    isPositiveInteger(value.panePid) &&
    typeof value.recordedAt === "string"
  );
}
function isProcessIdentity(value: unknown): boolean {
  return (
    isRecord(value) &&
    value.schemaVersion === 1 &&
    isPositiveInteger(value.pid) &&
    isPositiveInteger(value.processGroupId) &&
    typeof value.startToken === "string" &&
    typeof value.executable === "string" &&
    isStringArray(value.args) &&
    typeof value.cwd === "string" &&
    typeof value.launchedAt === "string" &&
    isRecord(value.paneLineage) &&
    typeof value.paneLineage.sessionName === "string" &&
    typeof value.paneLineage.windowId === "string" &&
    typeof value.paneLineage.paneId === "string" &&
    isPositiveInteger(value.paneLineage.panePid)
  );
}
function isStopFacts(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.requestedAt === "string" &&
    (value.termSentAt === null || typeof value.termSentAt === "string") &&
    (value.killSentAt === null || typeof value.killSentAt === "string") &&
    (value.completedAt === null || typeof value.completedAt === "string") &&
    typeof value.escalated === "boolean" &&
    (value.processIdentity === null ||
      isProcessIdentity(value.processIdentity)) &&
    (value.beforeLog === null || typeof value.beforeLog === "string") &&
    (value.afterLog === null || typeof value.afterLog === "string")
  );
}
function isCleanupFacts(value: unknown): boolean {
  const steps = ["tmux", "worktree", "lease", "lock"];
  return (
    isRecord(value) &&
    (value.mode === "explicit" || value.mode === "automatic_merged") &&
    typeof value.ownerId === "string" &&
    typeof value.runId === "string" &&
    typeof value.intentAt === "string" &&
    Array.isArray(value.completedSteps) &&
    value.completedSteps.every(
      (entry: unknown) => typeof entry === "string" && steps.includes(entry),
    ) &&
    Array.isArray(value.remainingSteps) &&
    value.remainingSteps.every(
      (entry: unknown) => typeof entry === "string" && steps.includes(entry),
    ) &&
    (value.blockedCode === null || typeof value.blockedCode === "string") &&
    typeof value.updatedAt === "string"
  );
}
function isLogFacts(value: unknown): boolean {
  return (
    isRecord(value) &&
    isPositiveInteger(value.attempt) &&
    typeof value.path === "string" &&
    isNonnegativeInteger(value.bytes) &&
    typeof value.truncated === "boolean" &&
    ["tmux", "process", "combined"].includes(String(value.source)) &&
    typeof value.capturedAt === "string"
  );
}
function isMergedFacts(value: unknown): boolean {
  return (
    isRecord(value) &&
    isPositiveInteger(value.number) &&
    ["OPEN", "CLOSED", "MERGED"].includes(String(value.state)) &&
    (value.mergedAt === null || typeof value.mergedAt === "string") &&
    typeof value.sourceBranch === "string" &&
    typeof value.sourceHeadSha === "string" &&
    (value.mergeCommitSha === null ||
      typeof value.mergeCommitSha === "string") &&
    Array.isArray(value.closesIssues) &&
    value.closesIssues.every(isPositiveInteger) &&
    typeof value.complete === "boolean"
  );
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((entry: unknown) => typeof entry === "string")
  );
}
function isPositiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0;
}
function isNonnegativeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}
function same(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
function serialize(value: unknown, pretty = false): string {
  return `${JSON.stringify(value, null, pretty ? 2 : undefined)}\n`;
}
function stateHistoryError(message: string, cause?: unknown): RunnerError {
  return new RunnerError(
    "STATE_HISTORY_INVALID",
    message,
    "Preserve snapshot and event history; repair only with an identity-matching contiguous event chain.",
    { cause },
  );
}
function parseRecordAt<T>(
  text: string | null,
  guard: (value: unknown) => value is T,
  label: string,
): T | null {
  if (text === null) return null;
  try {
    const value: unknown = JSON.parse(text);
    if (guard(value)) return value;
  } catch {
    // Converted to a stable typed state error below.
  }
  throw new RunnerError(
    "STATE_INVALID",
    `The ${label} record is malformed.`,
    `Preserve the ${label}; malformed ownership never authorizes mutation.`,
  );
}

function isRevisionedSnapshot(
  snapshot: RunSnapshot,
): snapshot is RunSnapshotV3 | RunSnapshotV4 {
  return snapshot.schemaVersion === 3 || snapshot.schemaVersion === 4;
}
