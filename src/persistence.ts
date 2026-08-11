import path from "node:path";
import type { RunSnapshotV1, RunState, TransitionEventV1 } from "./domain";
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
    snapshot: RunSnapshotV1,
    from: RunState | null,
    reason: string,
  ): Promise<void> {
    await this.files.atomicWrite(
      this.snapshotPath(snapshot.issueNumber),
      `${JSON.stringify(snapshot, null, 2)}\n`,
    );
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
  }

  public async load(issueNumber: number): Promise<RunSnapshotV1> {
    const text = await this.files.readText(this.snapshotPath(issueNumber));
    if (text === null) {
      throw new RunnerError(
        "STATE_NOT_FOUND",
        `No run snapshot exists for issue #${issueNumber}.`,
        "Start the issue with soft-factory run first.",
      );
    }
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
    if (!isSnapshot(value) || value.issueNumber !== issueNumber) {
      throw new RunnerError(
        "STATE_INVALID",
        `Run snapshot for issue #${issueNumber} has an unsupported or mismatched schema.`,
        "Preserve the file and migrate it with a supported Runner version.",
      );
    }
    return value;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRunState(value: unknown): value is RunState {
  return (
    typeof value === "string" &&
    (value === "acquiring_lock" ||
      value === "preparing_worktree" ||
      value === "starting_tmux" ||
      value === "running_rpiv" ||
      value === "failed" ||
      value === "blocked" ||
      value === "interrupted")
  );
}

function isSnapshot(value: unknown): value is RunSnapshotV1 {
  if (!isRecord(value)) return false;
  return (
    value.schemaVersion === 1 &&
    typeof value.runId === "string" &&
    typeof value.ownerId === "string" &&
    typeof value.repository === "string" &&
    typeof value.issueNumber === "number" &&
    isRunState(value.state) &&
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

function isFetchedBaseProof(value: unknown): boolean {
  if (value === null) return true;
  return (
    isRecord(value) &&
    value.schemaVersion === 1 &&
    typeof value.remote === "string" &&
    typeof value.defaultBranch === "string" &&
    typeof value.advertisedHeadSha === "string" &&
    typeof value.trackingRefSha === "string" &&
    typeof value.fetchedAt === "string" &&
    value.matches === true
  );
}

function isTmux(value: unknown): boolean {
  if (value === null) return true;
  return (
    isRecord(value) &&
    typeof value.sessionName === "string" &&
    typeof value.windowName === "string" &&
    typeof value.windowId === "string" &&
    typeof value.paneId === "string" &&
    typeof value.cwd === "string"
  );
}

function isCopilot(value: unknown): boolean {
  if (value === null) return true;
  return (
    isRecord(value) &&
    value.executable === "copilot" &&
    Array.isArray(value.args) &&
    value.args.every((argument: unknown) => typeof argument === "string") &&
    typeof value.cwd === "string" &&
    typeof value.resourceAttributes === "string" &&
    (value.exitCode === null || typeof value.exitCode === "number")
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
