import { RunnerError } from "./errors";

export const DOCTOR_SCHEMA_VERSION = 1 as const;
export const DOCTOR_PROTOCOL_VERSION = 1 as const;
export const DOCTOR_RESULT_CONTRACT = "agent-result-v1" as const;
export const DOCTOR_EXTERNAL_TIMEOUT_MS = 2_000 as const;
export const DOCTOR_AGGREGATE_TIMEOUT_MS = 9_000 as const;

export const DOCTOR_CHECK_IDS = [
  "repository.git-membership",
  "repository.primary-worktree",
  "repository.git-common-directory",
  "repository.github-identity",
  "repository.default-branch",
  "command.git",
  "command.gh",
  "command.tmux",
  "command.node",
  "command.copilot",
  "authentication.github-cli",
  "authentication.copilot-cli",
  "compatibility.rpiv-agent",
  "compatibility.runner-protocol",
  "compatibility.configuration",
  "compatibility.worktree-root",
  "compatibility.state-root-writable",
  "compatibility.trees-ignored",
  "compatibility.runtime-state-ignored",
  "compatibility.result-contract",
  "runtime.trees-ownership",
  "runtime.state-readable",
  "runtime.locks-interpretable",
  "runtime.required-paths-creatable",
] as const;

export type DoctorCheckId = (typeof DOCTOR_CHECK_IDS)[number];
export type DoctorCheckStatus = "passed" | "failed";

export const DOCTOR_CHECK_DEPENDENCIES: Readonly<
  Record<DoctorCheckId, readonly DoctorCheckId[]>
> = {
  "repository.git-membership": [],
  "repository.primary-worktree": ["repository.git-membership"],
  "repository.git-common-directory": ["repository.git-membership"],
  "repository.github-identity": ["repository.git-membership"],
  "repository.default-branch": [
    "repository.git-membership",
    "repository.github-identity",
  ],
  "command.git": [],
  "command.gh": [],
  "command.tmux": [],
  "command.node": [],
  "command.copilot": [],
  "authentication.github-cli": ["command.gh", "repository.github-identity"],
  "authentication.copilot-cli": ["command.copilot"],
  "compatibility.rpiv-agent": ["repository.primary-worktree"],
  "compatibility.runner-protocol": ["compatibility.rpiv-agent"],
  "compatibility.configuration": ["repository.primary-worktree"],
  "compatibility.worktree-root": [
    "compatibility.configuration",
    "repository.git-common-directory",
  ],
  "compatibility.state-root-writable": [
    "compatibility.configuration",
    "compatibility.worktree-root",
  ],
  "compatibility.trees-ignored": ["compatibility.worktree-root", "command.git"],
  "compatibility.runtime-state-ignored": [
    "compatibility.configuration",
    "command.git",
  ],
  "compatibility.result-contract": ["compatibility.rpiv-agent"],
  "runtime.trees-ownership": ["compatibility.worktree-root"],
  "runtime.state-readable": ["compatibility.configuration"],
  "runtime.locks-interpretable": ["compatibility.configuration"],
  "runtime.required-paths-creatable": [
    "compatibility.worktree-root",
    "compatibility.state-root-writable",
  ],
};

export interface DoctorPassedCheckV1 {
  readonly id: DoctorCheckId;
  readonly status: "passed";
  readonly blocking: true;
}
export interface DoctorFailedCheckV1 {
  readonly id: DoctorCheckId;
  readonly status: "failed";
  readonly blocking: true;
  readonly message: string;
  readonly remediation: string;
}
export type DoctorCheckResultV1 = DoctorPassedCheckV1 | DoctorFailedCheckV1;
export interface DoctorRepositoryFactsV1 {
  readonly github: string | null;
  readonly defaultBranch: string | null;
}
export interface DoctorResultV1 {
  readonly schemaVersion: 1;
  readonly ready: boolean;
  readonly repository: DoctorRepositoryFactsV1;
  readonly checks: readonly DoctorCheckResultV1[];
}
export interface RpivMetadataV1 {
  readonly name: "rpiv";
  readonly runnerProtocol: number | null;
  readonly resultContract: string | null;
}

export function passedCheck(id: DoctorCheckId): DoctorPassedCheckV1 {
  return { id, status: "passed", blocking: true };
}
export function failedCheck(
  id: DoctorCheckId,
  message: string,
  remediation: string,
): DoctorFailedCheckV1 {
  if (message.trim() === "" || remediation.trim() === "")
    throw new RunnerError(
      "DOCTOR_INVARIANT",
      "Doctor failures require message and remediation.",
      "Correct the Doctor check implementation.",
    );
  return { id, status: "failed", blocking: true, message, remediation };
}
export function makeDoctorResult(
  repository: DoctorRepositoryFactsV1,
  checks: readonly DoctorCheckResultV1[],
): DoctorResultV1 {
  const ordered =
    checks.length === DOCTOR_CHECK_IDS.length &&
    checks.every((check, index) => check.id === DOCTOR_CHECK_IDS[index]);
  if (!ordered)
    throw new RunnerError(
      "DOCTOR_INVARIANT",
      "Doctor must produce exactly the canonical ordered 24 checks.",
      "Correct the Doctor check assembly before rendering output.",
    );
  return {
    schemaVersion: 1,
    ready: checks.every((check) => check.status === "passed"),
    repository,
    checks: [...checks],
  };
}

export function parseRpivMetadata(text: string): RpivMetadataV1 {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== "---")
    throw metadataError("RPIV agent frontmatter is missing.");
  const end = lines.indexOf("---", 1);
  if (end < 0) throw metadataError("RPIV agent frontmatter is unterminated.");
  const fields = new Map<string, string>();
  for (const line of lines.slice(1, end)) {
    const match = /^([a-z_][a-z0-9_-]*):\s*(.*?)\s*$/.exec(line);
    if (match === null) continue;
    if (fields.has(match[1]))
      throw metadataError(
        "RPIV agent metadata contains duplicate field " + match[1] + ".",
      );
    fields.set(match[1], match[2].replace(/^"|"$/g, ""));
  }
  if (fields.get("name") !== "rpiv")
    throw metadataError("Canonical RPIV metadata must declare name: rpiv.");
  const protocol = fields.get("runner_protocol");
  const runnerProtocol =
    protocol === undefined
      ? null
      : /^[1-9]\d*$/.test(protocol) && Number.isSafeInteger(Number(protocol))
        ? Number(protocol)
        : null;
  return {
    name: "rpiv",
    runnerProtocol,
    resultContract: fields.get("result_contract") ?? null,
  };
}
function metadataError(message: string): RunnerError {
  return new RunnerError(
    "DOCTOR_ADAPTER_FAILED",
    message,
    "Install the canonical .github/agents/rpiv.agent.md with valid frontmatter metadata.",
  );
}
