import {
  DOCTOR_AGGREGATE_TIMEOUT_MS,
  DOCTOR_CHECK_IDS,
  type DoctorCheckId,
  type DoctorCheckResultV1,
  type DoctorResultV1,
  failedCheck,
  makeDoctorResult,
  passedCheck,
} from "./doctor";
import {
  LiveDoctorCommandRunner,
  type DoctorCommandRunner,
  type DoctorObservation,
  observeDoctorAuthentication,
  observeDoctorRepository,
  resolveDoctorExecutables,
} from "./doctor-adapters";
import { observeDoctorCompatibility } from "./doctor-compatibility";
import { observeDoctorRuntime } from "./doctor-runtime";

export interface DoctorRunner {
  run(startPath: string): Promise<DoctorResultV1>;
}
export interface DoctorServiceInput {
  readonly runner: DoctorCommandRunner;
  readonly pathValue: string | undefined;
  readonly token?: string;
}
export class DoctorService implements DoctorRunner {
  public constructor(private readonly input: DoctorServiceInput) {}
  public async run(startPath: string): Promise<DoctorResultV1> {
    let timer: NodeJS.Timeout | null = null;
    try {
      return await Promise.race([
        this.evaluate(startPath),
        new Promise<DoctorResultV1>((resolve) => {
          timer = setTimeout(
            () =>
              resolve(
                unavailableResult(
                  "Doctor exceeded its 9000ms aggregate deadline.",
                  "Resolve slow local probes and rerun Doctor.",
                ),
              ),
            DOCTOR_AGGREGATE_TIMEOUT_MS,
          );
        }),
      ]);
    } catch (cause: unknown) {
      return unavailableResult(
        "Doctor could not safely complete an observation: " +
          safeMessage(cause),
        "Repair the named local prerequisite and rerun Doctor.",
      );
    } finally {
      if (timer !== null) clearTimeout(timer);
    }
  }
  private async evaluate(startPath: string): Promise<DoctorResultV1> {
    const executables = await resolveDoctorExecutables(
      this.input.pathValue,
      startPath,
    );
    const repository = await observeDoctorRepository(
      startPath,
      executables.git.value,
      this.input.runner,
    );
    const [authentication, compatibility] = await Promise.all([
      observeDoctorAuthentication({
        runner: this.input.runner,
        cwd: repository.primaryWorktree.value ?? startPath,
        executables,
        githubHost: repository.githubHost,
      }),
      observeDoctorCompatibility({
        primaryWorktree: repository.primaryWorktree.value,
        commonDirectory: repository.commonDirectory.value,
        gitExecutable: executables.git.value,
        runner: this.input.runner,
        token: this.input.token,
      }),
    ]);
    const runtime = await observeDoctorRuntime({
      primaryWorktree: repository.primaryWorktree.value,
      worktreeRoot: compatibility.worktreeRootPath,
      stateRoot: compatibility.stateRootPath,
      repositoryIdentity: repository.githubIdentity.value,
      gitExecutable: executables.git.value,
      runner: this.input.runner,
      token: this.input.token,
    });
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
      "command.tmux": executables.tmux,
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
}
export function createLiveDoctorService(): DoctorService {
  return new DoctorService({
    runner: new LiveDoctorCommandRunner(),
    pathValue: process.env.PATH,
  });
}
function fromObservation(
  id: DoctorCheckId,
  observation: DoctorObservation<unknown>,
): DoctorCheckResultV1 {
  return observation.ok
    ? passedCheck(id)
    : failedCheck(
        id,
        observation.message ?? "The prerequisite could not be proved.",
        observation.remediation ?? "Restore the prerequisite and rerun Doctor.",
      );
}
function unavailableResult(
  message: string,
  remediation: string,
): DoctorResultV1 {
  return makeDoctorResult(
    { github: null, defaultBranch: null },
    DOCTOR_CHECK_IDS.map((id) => failedCheck(id, message, remediation)),
  );
}
function safeMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : "unknown adapter failure";
}
