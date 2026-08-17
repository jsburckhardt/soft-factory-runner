import * as fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  DOCTOR_CHECK_IDS,
  DOCTOR_OPERATION_CUTOFF_MS,
  type DoctorCheckId,
  type DoctorCheckResultV2,
  type DoctorResultV2,
  type DoctorTmuxTargetingEvidenceV1,
  failedCheck,
  makeDoctorResult,
  passedCheck,
} from "./doctor";
import {
  LiveDoctorCommandRunner,
  type DoctorCommandResult,
  type DoctorCommandRunner,
  type DoctorObservation,
  observeDoctorAuthentication,
  observeDoctorRepository,
  resolveDoctorExecutables,
} from "./doctor-adapters";
import { observeDoctorCompatibility } from "./doctor-compatibility";
import { normalizeRepositoryName } from "./domain";
import { isRunnerError } from "./errors";
import { createLivePorts } from "./live";
import type { TmuxPort } from "./ports";
import type {
  InvokingTmuxEvidenceV1,
  TmuxContextRefusalReason,
} from "./tmux-target";
import { observeDoctorRuntime } from "./doctor-runtime";
import type { DoctorClock, DoctorTmuxProbePort } from "./doctor-tmux";
import {
  createLiveDoctorTmuxProbe,
  nextDoctorProbeToken,
} from "./doctor-tmux-live";

export interface DoctorRunner {
  run(startPath: string): Promise<DoctorResultV2>;
}
export interface DoctorServiceInput {
  readonly runner: DoctorCommandRunner;
  readonly pathValue: string | undefined;
  readonly token?: string;
  readonly tmuxProbe?: DoctorTmuxProbePort;
  readonly clock?: DoctorClock;
  readonly tmuxPort?: TmuxPort;
  readonly invokingEvidence?: InvokingTmuxEvidenceV1;
  readonly tmuxInventory?: () => Promise<DoctorTmuxInventories>;
}
export interface DoctorTmuxInventories {
  readonly ambient: Uint8Array;
  readonly unrelated: Uint8Array;
}
export class DoctorService implements DoctorRunner {
  public constructor(private readonly input: DoctorServiceInput) {}
  public async run(startPath: string): Promise<DoctorResultV2> {
    const startedAtMs = this.clock().now();
    const controller = new AbortController();
    const cutoff = setTimeout(
      () => controller.abort(),
      DOCTOR_OPERATION_CUTOFF_MS,
    );
    cutoff.unref();
    try {
      return await this.evaluate(startPath, startedAtMs, controller.signal);
    } catch (cause: unknown) {
      return unavailableResult(
        "Doctor could not safely complete an observation: " +
          safeMessage(cause),
        "Repair the named local prerequisite and rerun Doctor.",
      );
    } finally {
      clearTimeout(cutoff);
    }
  }
  private async evaluate(
    startPath: string,
    startedAtMs: number,
    abortSignal: AbortSignal,
  ): Promise<DoctorResultV2> {
    const runner = aggregateRunner(this.input.runner, abortSignal);
    const executables = await resolveDoctorExecutables(
      this.input.pathValue,
      startPath,
    );
    const tmuxPromise =
      executables.tmux.value === null
        ? Promise.resolve(executables.tmux)
        : this.tmuxProbe().run({
            tmuxExecutable: executables.tmux.value,
            token: this.input.token ?? nextDoctorProbeToken(),
            doctorStartedAtMs: startedAtMs,
            abortSignal,
          });
    const repository = await observeDoctorRepository(
      startPath,
      executables.git.value,
      runner,
    );
    const [authentication, compatibility] = await Promise.all([
      observeDoctorAuthentication({
        runner,
        cwd: repository.primaryWorktree.value ?? startPath,
        executables,
        githubHost: repository.githubHost,
      }),
      observeDoctorCompatibility({
        primaryWorktree: repository.primaryWorktree.value,
        commonDirectory: repository.commonDirectory.value,
        gitExecutable: executables.git.value,
        runner,
        token: this.input.token,
      }),
    ]);
    const runtime = await observeDoctorRuntime({
      primaryWorktree: repository.primaryWorktree.value,
      worktreeRoot: compatibility.worktreeRootPath,
      stateRoot: compatibility.stateRootPath,
      repositoryIdentity: repository.githubIdentity.value,
      gitExecutable: executables.git.value,
      runner,
      token: this.input.token,
    });
    const targeting = await classifyDoctorTmuxTargeting(
      this.input.tmuxPort ?? createLivePorts().tmux,
      this.input.invokingEvidence ?? { tmux: null, tmuxPane: null },
      repository.githubIdentity.value ?? "unknown/unknown",
      this.input.tmuxInventory ??
        (() => captureDoctorTmuxInventories(startPath)),
    );
    const probeObservation = await tmuxPromise;
    const tmux: DoctorObservation<unknown> =
      targeting.mode === "invalid-context" ||
      !targeting.ambientUnchanged ||
      !targeting.unrelatedUnchanged
        ? {
            ok: false,
            value: null,
            message: "The invoking tmux context was refused.",
            remediation:
              "Use one valid current tmux client context or remove both invoking variables.",
            evidence: targeting,
          }
        : probeObservation.ok
          ? { ...probeObservation, evidence: targeting }
          : probeObservation;
    const observations: Readonly<
      Record<DoctorCheckId, DoctorObservation<unknown>>
    > = {
      "repository.git-membership": repository.membership,
      "repository.primary-worktree": repository.primaryWorktree,
      "repository.git-common-directory": repository.commonDirectory,
      "repository.github-identity": repository.githubIdentity,
      "repository.default-branch": repository.defaultBranch,
      "command.git": executables.git,
      "command.gh": executables.gh,
      "command.tmux": tmux,
      "command.node": executables.node,
      "command.copilot": executables.copilot,
      "authentication.github-cli": authentication.github,
      "authentication.copilot-cli": authentication.copilot,
      "compatibility.rpiv-agent": compatibility.rpivAgent,
      "compatibility.runner-protocol": compatibility.runnerProtocol,
      "compatibility.configuration": compatibility.configuration,
      "compatibility.worktree-root": compatibility.worktreeRoot,
      "compatibility.state-root-writable": compatibility.stateRootWritable,
      "compatibility.trees-ignored": compatibility.treesIgnored,
      "compatibility.runtime-state-ignored": compatibility.runtimeStateIgnored,
      "compatibility.result-contract": compatibility.resultContract,
      "runtime.trees-ownership": runtime.treesOwnership,
      "runtime.state-readable": runtime.stateReadable,
      "runtime.locks-interpretable": runtime.locksInterpretable,
      "runtime.required-paths-creatable": runtime.requiredPathsCreatable,
    };
    const checks = DOCTOR_CHECK_IDS.map((id) =>
      fromObservation(id, observations[id]),
    );
    return makeDoctorResult(
      {
        github: repository.githubIdentity.value,
        defaultBranch: repository.defaultBranch.value,
      },
      checks,
    );
  }
  private clock(): DoctorClock {
    return this.input.clock ?? { now: () => Date.now() };
  }
  private tmuxProbe(): DoctorTmuxProbePort {
    return (
      this.input.tmuxProbe ??
      createLiveDoctorTmuxProbe(this.input.runner, this.clock())
    );
  }
}
function aggregateRunner(
  runner: DoctorCommandRunner,
  abortSignal: AbortSignal,
): DoctorCommandRunner {
  return {
    run: (spec) =>
      abortSignal.aborted
        ? Promise.resolve(cancelledCommandResult())
        : runner.run({ ...spec, abortSignal }),
  };
}

function cancelledCommandResult(): DoctorCommandResult {
  return {
    exitCode: null,
    signal: null,
    stdout: "",
    stderr: "",
    stdoutBuffer: Buffer.alloc(0),
    stderrBuffer: Buffer.alloc(0),
    stdoutByteCount: 0,
    stderrByteCount: 0,
    stdoutTruncated: false,
    stderrTruncated: false,
    timedOut: false,
    cancelled: true,
    launchError: null,
  };
}

export function createLiveDoctorService(): DoctorService {
  const runner = new LiveDoctorCommandRunner();
  const clock = { now: () => Date.now() };
  return new DoctorService({
    runner,
    pathValue: process.env.PATH,
    invokingEvidence: {
      tmux: process.env.TMUX ?? null,
      tmuxPane: process.env.TMUX_PANE ?? null,
    },
    tmuxProbe: createLiveDoctorTmuxProbe(runner, clock),
    clock,
  });
}
function fromObservation(
  id: DoctorCheckId,
  observation: DoctorObservation<unknown>,
): DoctorCheckResultV2 {
  return observation.ok
    ? passedCheck(id, observation.evidence)
    : failedCheck(
        id,
        observation.message ?? "The prerequisite could not be proved.",
        observation.remediation ?? "Restore the prerequisite and rerun Doctor.",
        observation.evidence,
      );
}
function unavailableResult(
  message: string,
  remediation: string,
): DoctorResultV2 {
  return makeDoctorResult(
    { github: null, defaultBranch: null },
    DOCTOR_CHECK_IDS.map((id) => failedCheck(id, message, remediation)),
  );
}
function safeMessage(cause: unknown): string {
  return cause instanceof Error ? "adapter failure" : "unknown adapter failure";
}

export async function classifyDoctorTmuxTargeting(
  tmux: TmuxPort,
  evidence: InvokingTmuxEvidenceV1,
  repository: string,
  inventory: () => Promise<DoctorTmuxInventories> = () =>
    captureDoctorTmuxInventories(process.cwd()),
): Promise<DoctorTmuxTargetingEvidenceV1> {
  const before = await inventory();
  try {
    const target =
      tmux.selectTarget === undefined
        ? null
        : await tmux.selectTarget({
            evidence,
            repository: {
              nameWithOwner: repository,
              normalizedName: normalizeRepositoryName(repository),
            },
          });
    const mode =
      evidence.tmux === null && evidence.tmuxPane === null
        ? "standalone-fallback"
        : "invoking-valid";
    if (
      target !== null &&
      (mode === "invoking-valid") !== (target.selectionMode === "invoking")
    )
      throw new Error("target mode mismatch");
    const after = await inventory();
    return targetingEvidence(mode, null, before, after);
  } catch (cause: unknown) {
    const reason =
      isRunnerError(cause) &&
      cause.code === "TMUX_CONTEXT_REFUSED" &&
      typeof cause.details.reason === "string"
        ? (cause.details.reason as TmuxContextRefusalReason)
        : "unavailable-proof";
    const after = await inventory();
    return targetingEvidence("invalid-context", reason, before, after);
  }
}

function targetingEvidence(
  mode: DoctorTmuxTargetingEvidenceV1["mode"],
  reason: DoctorTmuxTargetingEvidenceV1["reason"],
  before: DoctorTmuxInventories,
  after: DoctorTmuxInventories,
): DoctorTmuxTargetingEvidenceV1 {
  return {
    schemaVersion: 1,
    kind: "tmux-targeting",
    mode,
    reason,
    bounded: true,
    inventoryMeasured: true,
    ambientUnchanged: Buffer.from(before.ambient).equals(
      Buffer.from(after.ambient),
    ),
    unrelatedUnchanged: Buffer.from(before.unrelated).equals(
      Buffer.from(after.unrelated),
    ),
  };
}

async function captureDoctorTmuxInventories(
  startPath: string,
): Promise<DoctorTmuxInventories> {
  const uid = typeof process.getuid === "function" ? process.getuid() : 0;
  const ambientRoot =
    process.env.TMUX_TMPDIR ?? path.join(os.tmpdir(), `tmux-${uid}`);
  return {
    ambient: Buffer.from(await boundedDirectoryInventory(ambientRoot)),
    unrelated: Buffer.from(
      await boundedDirectoryInventory(path.join(startPath, ".soft-factory")),
    ),
  };
}

async function boundedDirectoryInventory(directory: string): Promise<string> {
  try {
    const entries = (await fs.readdir(directory, { withFileTypes: true }))
      .slice(0, 1024)
      .map(
        (entry) =>
          `${entry.name}|${entry.isDirectory() ? "d" : entry.isSymbolicLink() ? "l" : "f"}`,
      )
      .sort();
    return JSON.stringify(entries);
  } catch {
    return "[]";
  }
}
