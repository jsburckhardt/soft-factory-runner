import * as fs from "node:fs/promises";
import path from "node:path";
import { parseAgentResult } from "./completion";
import {
  type DoctorCommandRunner,
  type DoctorObservation,
  doctorEnvironment,
} from "./doctor-adapters";
import type { OwnerRecordV1, RunSnapshot } from "./domain";
import {
  isLeaseRecord,
  isOwnerRecord,
  isTransitionEvent,
  parseSnapshot,
} from "./persistence";

export interface DoctorRuntimeObservations {
  readonly treesOwnership: DoctorObservation<true>;
  readonly stateReadable: DoctorObservation<true>;
  readonly locksInterpretable: DoctorObservation<true>;
  readonly requiredPathsCreatable: DoctorObservation<true>;
}
export interface DoctorRuntimeInput {
  readonly primaryWorktree: string | null;
  readonly worktreeRoot: string | null;
  readonly stateRoot: string | null;
  readonly repositoryIdentity: string | null;
  readonly gitExecutable: string | null;
  readonly runner: DoctorCommandRunner;
  readonly token?: string;
}
interface StateInventory {
  readonly observation: DoctorObservation<true>;
  readonly snapshots: ReadonlyMap<number, RunSnapshot>;
}
interface LockInventory {
  readonly observation: DoctorObservation<true>;
  readonly owners: ReadonlyMap<number, OwnerRecordV1>;
}
const ISSUE_JSON = /^([1-9]\d*)\.json$/;
const ISSUE_JSONL = /^([1-9]\d*)\.jsonl$/;
const ISSUE_LOCK = /^([1-9]\d*)\.lock$/;
const ISSUE_DIRECTORY = /^[1-9]\d*$/;
const ATTEMPT_LOG = /^[1-9]\d*\.log$/;

export async function observeDoctorRuntime(
  input: DoctorRuntimeInput,
): Promise<DoctorRuntimeObservations> {
  if (
    input.primaryWorktree === null ||
    input.worktreeRoot === null ||
    input.stateRoot === null
  ) {
    const unavailable = fail<true>(
      "Runtime safety cannot be observed until repository and configured roots are valid.",
      "Repair repository discovery and configured roots, then rerun Doctor.",
    );
    return {
      treesOwnership: unavailable,
      stateReadable: unavailable,
      locksInterpretable: unavailable,
      requiredPathsCreatable: unavailable,
    };
  }
  const [state, locks, registrations] = await Promise.all([
    inventoryState(input.stateRoot, input.worktreeRoot),
    inventoryLocks(input.stateRoot),
    observeRegistrations(input),
  ]);
  const treesOwnership = await classifyOwnership(
    input,
    state.snapshots,
    locks.owners,
    registrations,
  );
  const requiredPathsCreatable = await probeRequiredPaths(
    input.worktreeRoot,
    input.stateRoot,
    input.token ?? String(process.pid),
  );
  return {
    treesOwnership,
    stateReadable: state.observation,
    locksInterpretable: locks.observation,
    requiredPathsCreatable,
  };
}

async function inventoryState(
  stateRoot: string,
  worktreeRoot: string,
): Promise<StateInventory> {
  const snapshots = new Map<number, RunSnapshot>();
  try {
    for (const name of await list(path.join(stateRoot, "runs"))) {
      const match = ISSUE_JSON.exec(name);
      if (match === null) continue;
      const issue = Number(match[1]);
      snapshots.set(
        issue,
        parseSnapshot(
          await fs.readFile(path.join(stateRoot, "runs", name), "utf8"),
          issue,
        ),
      );
    }
    for (const name of await list(path.join(stateRoot, "events"))) {
      const match = ISSUE_JSONL.exec(name);
      if (match === null) continue;
      const issue = Number(match[1]);
      const text = await fs.readFile(
        path.join(stateRoot, "events", name),
        "utf8",
      );
      const lines =
        text === ""
          ? []
          : text
              .split(/\r?\n/)
              .filter(
                (line, index, all) =>
                  !(line === "" && index === all.length - 1),
              );
      if (lines.some((line) => line.trim() === ""))
        throw new Error("recognized event history contains an empty record");
      for (const line of lines) {
        const value: unknown = JSON.parse(line);
        if (!isTransitionEvent(value) || value.issueNumber !== issue)
          throw new Error(
            "recognized event history has an unsupported or mismatched schema",
          );
      }
    }
    for (const issueName of await list(path.join(stateRoot, "logs"))) {
      if (!ISSUE_DIRECTORY.test(issueName)) continue;
      for (const name of await list(path.join(stateRoot, "logs", issueName)))
        if (ATTEMPT_LOG.test(name))
          await fs.readFile(path.join(stateRoot, "logs", issueName, name));
    }
    for (const issueName of await list(worktreeRoot)) {
      if (!ISSUE_DIRECTORY.test(issueName)) continue;
      const resultPath = path.join(
        worktreeRoot,
        issueName,
        ".soft-factory",
        "agent-result.json",
      );
      try {
        const result = parseAgentResult(await fs.readFile(resultPath, "utf8"));
        if (result.issueNumber !== Number(issueName))
          throw new Error("result artifact issue identity is mismatched");
      } catch (cause: unknown) {
        if (nodeCode(cause) !== "ENOENT") throw cause;
      }
    }
    return { observation: pass<true>(true), snapshots };
  } catch (cause: unknown) {
    return {
      observation: fail(
        "Recognized Runner state is unreadable or malformed: " +
          safeMessage(cause),
        "Preserve the state and repair or migrate every recognized snapshot, event, log, and result record.",
      ),
      snapshots,
    };
  }
}
async function inventoryLocks(stateRoot: string): Promise<LockInventory> {
  const owners = new Map<number, OwnerRecordV1>();
  try {
    for (const name of await list(path.join(stateRoot, "locks"))) {
      const match = ISSUE_LOCK.exec(name);
      if (match === null) continue;
      const issue = Number(match[1]);
      const value: unknown = JSON.parse(
        await fs.readFile(path.join(stateRoot, "locks", name), "utf8"),
      );
      if (!isOwnerRecord(value) || value.issueNumber !== issue)
        throw new Error(
          "recognized owner lock has an unsupported or mismatched schema",
        );
      owners.set(issue, value);
    }
    for (const name of await list(
      path.join(stateRoot, "concurrency", "slots"),
    )) {
      const match = ISSUE_LOCK.exec(name);
      if (match === null) continue;
      const slot = Number(match[1]);
      const value: unknown = JSON.parse(
        await fs.readFile(
          path.join(stateRoot, "concurrency", "slots", name),
          "utf8",
        ),
      );
      if (!isLeaseRecord(value) || value.slot !== slot)
        throw new Error(
          "recognized slot lease has an unsupported or mismatched schema",
        );
    }
    return { observation: pass<true>(true), owners };
  } catch (cause: unknown) {
    return {
      observation: fail(
        "Recognized Runner locks are not interpretable: " + safeMessage(cause),
        "Preserve and repair every recognized owner lock and concurrency lease.",
      ),
      owners,
    };
  }
}
async function observeRegistrations(
  input: DoctorRuntimeInput,
): Promise<DoctorObservation<readonly string[]>> {
  if (input.gitExecutable === null)
    return fail(
      "Git worktree registrations cannot be observed.",
      "Install Git and repair repository discovery.",
    );
  const result = await input.runner.run({
    executable: input.gitExecutable,
    args: ["worktree", "list", "--porcelain"],
    cwd: input.primaryWorktree as string,
    timeoutMs: 2000,
    shell: false,
    environment: doctorEnvironment(process.env),
  });
  if (result.exitCode !== 0 || result.timedOut || result.launchError !== null)
    return fail(
      "Git worktree registrations are unavailable or malformed.",
      "Repair Git worktree metadata and rerun Doctor.",
    );
  const registrations = result.stdout
    .split(/\r?\n/)
    .filter((line) => line.startsWith("worktree "))
    .map((line) => path.resolve(line.slice("worktree ".length)));
  return pass(registrations);
}
async function classifyOwnership(
  input: DoctorRuntimeInput,
  snapshots: ReadonlyMap<number, RunSnapshot>,
  owners: ReadonlyMap<number, OwnerRecordV1>,
  registrations: DoctorObservation<readonly string[]>,
): Promise<DoctorObservation<true>> {
  if (!registrations.ok)
    return fail(
      registrations.message as string,
      registrations.remediation as string,
    );
  try {
    const directories = (await list(input.worktreeRoot as string)).filter(
      (name) => ISSUE_DIRECTORY.test(name),
    );
    const registered = (registrations.value as readonly string[]).filter(
      (entry) =>
        path.dirname(entry) === path.resolve(input.worktreeRoot as string) &&
        ISSUE_DIRECTORY.test(path.basename(entry)),
    );
    const issues = new Set([
      ...directories.map(Number),
      ...registered.map((entry) => Number(path.basename(entry))),
    ]);
    for (const issue of issues) {
      const expectedPath = path.resolve(
        input.worktreeRoot as string,
        String(issue),
      );
      const snapshot = snapshots.get(issue);
      const owner = owners.get(issue);
      if (
        !directories.includes(String(issue)) ||
        !registered.includes(expectedPath) ||
        snapshot === undefined ||
        owner === undefined ||
        path.resolve(snapshot.worktreePath) !== expectedPath ||
        snapshot.issueNumber !== issue ||
        owner.issueNumber !== issue ||
        snapshot.ownerId !== owner.ownerId ||
        snapshot.runId !== owner.runId ||
        snapshot.repository !== owner.repository ||
        (input.repositoryIdentity !== null &&
          (snapshot.repository !== input.repositoryIdentity ||
            owner.repository !== input.repositoryIdentity))
      )
        return fail(
          "Numeric worktree " +
            expectedPath +
            " has incomplete or mismatched ownership proof.",
          "Preserve the worktree and reconcile its Git registration, snapshot, owner lock, run, issue, path, and repository identities.",
        );
    }
    return pass<true>(true);
  } catch (cause: unknown) {
    return fail(
      "Worktree ownership inventory is unreadable: " + safeMessage(cause),
      "Restore readable worktree inventory and rerun Doctor without modifying unknown resources.",
    );
  }
}
async function probeRequiredPaths(
  worktreeRoot: string,
  stateRoot: string,
  token: string,
): Promise<DoctorObservation<true>> {
  const created: string[] = [];
  try {
    for (const [label, target] of [
      ["worktree", worktreeRoot],
      ["state", stateRoot],
    ] as const) {
      const ancestor = await nearestDirectory(target);
      const probe = path.join(ancestor, ".doctor-path-" + label + "-" + token);
      const handle = await fs.open(probe, "wx", 0o600);
      await handle.close();
      created.push(probe);
    }
    for (const probe of [...created].reverse()) {
      await fs.unlink(probe);
      created.pop();
    }
    return pass<true>(true);
  } catch (cause: unknown) {
    let cleanupFailed = false;
    for (const probe of [...created].reverse())
      try {
        await fs.unlink(probe);
      } catch {
        cleanupFailed = true;
      }
    return fail(
      "Required-path exclusive creation probe failed" +
        (cleanupFailed ? " and cleanup was incomplete" : "") +
        ": " +
        safeMessage(cause),
      "Restore contained ancestor permissions, resolve probe collisions, and inspect any named probe before retrying.",
    );
  }
}
async function nearestDirectory(target: string): Promise<string> {
  let candidate = target;
  while (true) {
    try {
      const stat = await fs.stat(candidate);
      if (!stat.isDirectory())
        throw new Error(candidate + " is not a directory");
      return candidate;
    } catch (cause: unknown) {
      if (nodeCode(cause) !== "ENOENT") throw cause;
      const parent = path.dirname(candidate);
      if (parent === candidate) throw cause;
      candidate = parent;
    }
  }
}
async function list(directory: string): Promise<readonly string[]> {
  try {
    return await fs.readdir(directory);
  } catch (cause: unknown) {
    if (nodeCode(cause) === "ENOENT") return [];
    throw cause;
  }
}
function safeMessage(cause: unknown): string {
  return cause instanceof Error
    ? cause.message
    : "unknown runtime inventory failure";
}
function nodeCode(cause: unknown): string | null {
  return typeof cause === "object" && cause !== null && "code" in cause
    ? String((cause as { code?: unknown }).code)
    : null;
}
function pass<T>(value: T): DoctorObservation<T> {
  return { ok: true, value, message: null, remediation: null };
}
function fail<T>(message: string, remediation: string): DoctorObservation<T> {
  return { ok: false, value: null, message, remediation };
}
