import { randomUUID } from "node:crypto";
import * as fs from "node:fs/promises";
import path from "node:path";
import { parseConfiguration } from "./config";
import {
  DOCTOR_RESULT_CONTRACT,
  DOCTOR_PROTOCOL_VERSION,
  parseRpivMetadata,
} from "./doctor";
import {
  type DoctorCommandRunner,
  type DoctorObservation,
  doctorEnvironment,
} from "./doctor-adapters";
import type { RunConfiguration } from "./domain";

export interface DoctorCompatibilityObservations {
  readonly rpivAgent: DoctorObservation<true>;
  readonly runnerProtocol: DoctorObservation<true>;
  readonly configuration: DoctorObservation<true>;
  readonly worktreeRoot: DoctorObservation<string>;
  readonly stateRootWritable: DoctorObservation<string>;
  readonly treesIgnored: DoctorObservation<true>;
  readonly runtimeStateIgnored: DoctorObservation<true>;
  readonly resultContract: DoctorObservation<true>;
  readonly parsedConfiguration: RunConfiguration | null;
  readonly worktreeRootPath: string | null;
  readonly stateRootPath: string | null;
}
export interface DoctorCompatibilityInput {
  readonly primaryWorktree: string | null;
  readonly commonDirectory: string | null;
  readonly gitExecutable: string | null;
  readonly runner: DoctorCommandRunner;
  readonly token?: string;
}

export async function observeDoctorCompatibility(
  input: DoctorCompatibilityInput,
): Promise<DoctorCompatibilityObservations> {
  if (input.primaryWorktree === null) return unavailableCompatibility();
  const root = path.resolve(input.primaryWorktree);
  const agentPath = path.join(root, ".github", "agents", "rpiv.agent.md");
  const configPath = path.join(root, ".soft-factory", "config.yml");
  const [agentRead, configRead] = await Promise.all([
    readText(agentPath),
    readText(configPath),
  ]);
  const rpivAgent = agentRead.ok
    ? pass<true>(true)
    : fail<true>(
        agentRead.message,
        "Install the canonical .github/agents/rpiv.agent.md asset.",
      );
  let metadata: ReturnType<typeof parseRpivMetadata> | null = null;
  if (agentRead.ok) {
    try {
      metadata = parseRpivMetadata(agentRead.text as string);
    } catch {
      metadata = null;
    }
  }
  let parsedConfiguration: RunConfiguration | null = null;
  let configuration: DoctorObservation<true>;
  if (!configRead.ok) {
    configuration = fail(
      "Runner configuration is missing or unreadable.",
      "Create a strict .soft-factory/config.yml using the documented schema.",
    );
  } else {
    try {
      parsedConfiguration = parseConfiguration(configRead.text as string);
      configuration = pass<true>(true);
    } catch (cause: unknown) {
      configuration = fail(
        "Runner configuration is invalid: " + safeMessage(cause),
        "Correct .soft-factory/config.yml and remove unknown or unsafe values.",
      );
    }
  }
  const protocolOkay =
    metadata?.runnerProtocol === DOCTOR_PROTOCOL_VERSION &&
    parsedConfiguration?.protocolVersion === DOCTOR_PROTOCOL_VERSION;
  const runnerProtocol = protocolOkay
    ? pass<true>(true)
    : fail<true>(
        "Runner protocol 1 is not declared by both configuration and the RPIV asset.",
        "Set protocol_version: 1 and runner_protocol: 1 in the canonical files.",
      );
  const resultContract =
    metadata?.resultContract === DOCTOR_RESULT_CONTRACT
      ? pass<true>(true)
      : fail<true>(
          "The RPIV result contract is absent or unsupported.",
          "Set result_contract: agent-result-v1 in .github/agents/rpiv.agent.md.",
        );
  let worktreeRootPath: string | null = null;
  let stateRootPath: string | null = null;
  let worktreeRoot: DoctorObservation<string>;
  if (parsedConfiguration === null || input.commonDirectory === null) {
    worktreeRoot = fail(
      "Worktree root cannot be validated without valid configuration and Git facts.",
      "Correct configuration and Git common-directory discovery.",
    );
  } else {
    worktreeRootPath = path.resolve(root, parsedConfiguration.worktreeRoot);
    stateRootPath = path.resolve(root, parsedConfiguration.stateRoot);
    const validation = await validateRoots(
      root,
      input.commonDirectory,
      worktreeRootPath,
      stateRootPath,
    );
    worktreeRoot = validation.ok
      ? pass(worktreeRootPath)
      : fail(
          validation.message ?? "Configured roots are unsafe.",
          validation.remediation ??
            "Correct configured roots and rerun Doctor.",
        );
  }
  const stateRootWritable =
    worktreeRoot.ok && stateRootPath !== null
      ? await writableProbe(root, stateRootPath, input.token ?? randomUUID())
      : fail<string>(
          "State-root writability cannot be proved until configured roots are safe.",
          "Correct configured roots, then rerun Doctor.",
        );
  const treesIgnored =
    worktreeRoot.ok && input.gitExecutable !== null && worktreeRootPath !== null
      ? await ignoreProbe(
          input.runner,
          input.gitExecutable,
          root,
          path.join(worktreeRootPath, "doctor-ignore-probe"),
          "worktree",
        )
      : fail<true>(
          "Worktree ignore coverage cannot be proved.",
          "Restore Git and a valid worktree root, then ignore its complete descendants.",
        );
  const runtimeStateIgnored =
    configuration.ok && input.gitExecutable !== null && stateRootPath !== null
      ? await ignoreProbe(
          input.runner,
          input.gitExecutable,
          root,
          path.join(stateRootPath, "doctor-ignore-probe"),
          "runtime state",
        )
      : fail<true>(
          "Runtime-state ignore coverage cannot be proved.",
          "Restore Git and valid configuration, then ignore the complete state root.",
        );
  return {
    rpivAgent,
    runnerProtocol,
    configuration,
    worktreeRoot,
    stateRootWritable,
    treesIgnored,
    runtimeStateIgnored,
    resultContract,
    parsedConfiguration,
    worktreeRootPath,
    stateRootPath,
  };
}

async function validateRoots(
  root: string,
  commonDirectory: string,
  worktreeRoot: string,
  stateRoot: string,
): Promise<DoctorObservation<true>> {
  const physicalRoot = await fs.realpath(root);
  const physicalCommon = await physicalOrLexical(commonDirectory);
  for (const [name, target] of [
    ["worktree", worktreeRoot],
    ["state", stateRoot],
  ] as const) {
    if (!contained(root, target))
      return fail(
        "Configured " + name + " root escapes the primary worktree.",
        "Use a normalized repository-relative contained path.",
      );
    const existing = await nearestExisting(target);
    if (!sameOrContains(physicalRoot, existing.physical))
      return fail(
        "Configured " + name + " root escapes through a symlink.",
        "Remove the symlink escape and configure a contained directory.",
      );
    if (existing.exact && !existing.directory)
      return fail(
        "Configured " + name + " root collides with a file.",
        "Replace the configured root with a directory path.",
      );
    if (
      sameOrContains(
        physicalCommon,
        existing.exact ? existing.physical : target,
      ) ||
      sameOrContains(
        existing.exact ? existing.physical : target,
        physicalCommon,
      )
    )
      return fail(
        "Configured " + name + " root collides with the Git common directory.",
        "Choose a root distinct from Git metadata.",
      );
  }
  return pass<true>(true);
}
async function writableProbe(
  root: string,
  stateRoot: string,
  token: string,
): Promise<DoctorObservation<string>> {
  const probeName = ".doctor-write-" + token;
  const probe = path.join(stateRoot, probeName);
  let createdRoot = false;
  let createdProbe = false;
  try {
    try {
      await fs.mkdir(stateRoot);
      createdRoot = true;
    } catch (cause: unknown) {
      if (nodeCode(cause) !== "EEXIST") throw cause;
    }
    const handle = await fs.open(probe, "wx", 0o600);
    createdProbe = true;
    await handle.close();
    await fs.unlink(probe);
    createdProbe = false;
    if (createdRoot) {
      await fs.rmdir(stateRoot);
      createdRoot = false;
    }
    return pass(stateRoot);
  } catch (cause: unknown) {
    let cleanupFailed = false;
    try {
      if (createdProbe) await fs.unlink(probe);
    } catch {
      cleanupFailed = true;
    }
    try {
      if (createdRoot) await fs.rmdir(stateRoot);
    } catch {
      cleanupFailed = true;
    }
    return fail(
      "State-root reversible writability probe failed" +
        (cleanupFailed ? " and cleanup was incomplete" : "") +
        ": " +
        safeMessage(cause),
      "Restore directory permissions, remove probe collisions, and manually inspect any named Doctor probe before retrying.",
    );
  }
}
async function ignoreProbe(
  runner: DoctorCommandRunner,
  executable: string,
  root: string,
  representative: string,
  label: string,
): Promise<DoctorObservation<true>> {
  const result = await runner.run({
    executable,
    args: ["check-ignore", "--no-index", "--quiet", "--", representative],
    cwd: root,
    timeoutMs: 2000,
    shell: false,
    environment: doctorEnvironment(process.env),
  });
  return result.exitCode === 0 &&
    !result.timedOut &&
    result.launchError === null
    ? pass<true>(true)
    : fail<true>(
        "Git does not prove complete " + label + " root ignore coverage.",
        "Add an ignore rule covering descendants of the configured " +
          label +
          " root.",
      );
}
async function readText(filePath: string): Promise<{
  readonly ok: boolean;
  readonly text: string | null;
  readonly message: string;
}> {
  try {
    return { ok: true, text: await fs.readFile(filePath, "utf8"), message: "" };
  } catch (cause: unknown) {
    return {
      ok: false,
      text: null,
      message: "Could not read " + filePath + ": " + safeMessage(cause),
    };
  }
}
async function nearestExisting(target: string): Promise<{
  readonly physical: string;
  readonly exact: boolean;
  readonly directory: boolean;
}> {
  let candidate = target;
  while (true) {
    try {
      const stat = await fs.lstat(candidate);
      return {
        physical: await fs.realpath(candidate),
        exact: candidate === target,
        directory: stat.isDirectory(),
      };
    } catch (cause: unknown) {
      if (nodeCode(cause) !== "ENOENT") throw cause;
      const parent = path.dirname(candidate);
      if (parent === candidate) throw cause;
      candidate = parent;
    }
  }
}
async function physicalOrLexical(target: string): Promise<string> {
  try {
    return await fs.realpath(target);
  } catch {
    return path.resolve(target);
  }
}
function contained(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return (
    relative !== "" &&
    !relative.startsWith(".." + path.sep) &&
    relative !== ".." &&
    !path.isAbsolute(relative)
  );
}
function sameOrContains(left: string, right: string): boolean {
  const relative = path.relative(left, right);
  return (
    relative === "" ||
    (!relative.startsWith(".." + path.sep) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  );
}
function safeMessage(cause: unknown): string {
  return cause instanceof Error
    ? cause.message.replace(
        /(?:token|password|secret)\s*[:=]\s*\S+/gi,
        "[REDACTED]",
      )
    : "unknown filesystem failure";
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
function unavailableCompatibility(): DoctorCompatibilityObservations {
  const unavailable = fail<true>(
    "Compatibility cannot be observed without the primary worktree.",
    "Repair repository discovery and rerun Doctor.",
  );
  return {
    rpivAgent: unavailable,
    runnerProtocol: unavailable,
    configuration: unavailable,
    worktreeRoot: fail(
      "Worktree root cannot be observed.",
      "Repair repository discovery.",
    ),
    stateRootWritable: fail(
      "State root cannot be observed.",
      "Repair repository discovery.",
    ),
    treesIgnored: unavailable,
    runtimeStateIgnored: unavailable,
    resultContract: unavailable,
    parsedConfiguration: null,
    worktreeRootPath: null,
    stateRootPath: null,
  };
}
