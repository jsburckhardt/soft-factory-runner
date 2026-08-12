import type { RunConfiguration } from "./domain";
import { RunnerError } from "./errors";

export const DEFAULT_CONFIGURATION: RunConfiguration = {
  protocolVersion: null,
  remote: null,
  baseBranch: null,
  worktreeRoot: ".trees",
  stateRoot: ".soft-factory",
  labelTypes: { feature: "feat" },
  promptTemplate: "Deliver issue #{issue}",
  maxConcurrentRuns: 1,
};
const allowedTypes = new Set([
  "feat",
  "fix",
  "docs",
  "style",
  "refactor",
  "perf",
  "test",
  "build",
  "ci",
  "chore",
  "revert",
]);
const MAPPING_KEYS = new Set([
  "repository",
  "rpiv",
  "execution",
  "branch_types",
]);
const FIXED_KEYS = new Set([
  "protocol_version",
  "repository.remote",
  "repository.base_branch",
  "repository.worktree_root",
  "repository.state_root",
  "rpiv.prompt",
  "execution.max_concurrent_runs",
]);

export function parseConfiguration(text: string | null): RunConfiguration {
  if (text === null || text.trim() === "") return DEFAULT_CONFIGURATION;
  const values = new Map<string, string>();
  const mappings = new Set<string>();
  const levels: string[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const uncommented = stripComment(rawLine);
    if (uncommented.trim() === "") continue;
    const match = /^(\s*)([a-zA-Z_][\w-]*):(?:\s*(.*))?$/.exec(uncommented);
    if (match === null)
      throw new RunnerError(
        "CONFIG_INVALID",
        "Unsupported configuration line: " + rawLine,
        "Use simple YAML mappings documented in docs/phase-1-issue-run.md.",
      );
    const indent = match[1].length;
    if (indent % 2 !== 0)
      throw new RunnerError(
        "CONFIG_INVALID",
        "Configuration indentation must use two-space levels.",
        "Indent nested .soft-factory/config.yml keys with two spaces.",
      );
    const depth = indent / 2;
    levels.splice(depth);
    const key = match[2];
    const rawValue = (match[3] ?? "").trim();
    if (rawValue === "") {
      const fullKey = [...levels.slice(0, depth), key].join(".");
      mappings.add(fullKey);
      levels[depth] = key;
      continue;
    }
    const fullKey = [...levels.slice(0, depth), key].join(".");
    if (values.has(fullKey))
      throw new RunnerError(
        "CONFIG_INVALID",
        "Duplicate configuration key: " + fullKey,
        "Keep exactly one value for each configuration key.",
      );
    values.set(fullKey, unquote(rawValue));
  }
  validateKnownKeys(values, mappings);
  const protocolValue = optional(values, "protocol_version");
  const protocolVersion =
    protocolValue === null
      ? null
      : parsePositiveInteger(protocolValue, "protocol_version");
  const remote = optional(values, "repository.remote");
  const baseBranch = optional(values, "repository.base_branch");
  const worktreeRoot = parseRepositoryPath(
    optional(values, "repository.worktree_root") ??
      DEFAULT_CONFIGURATION.worktreeRoot,
    "repository.worktree_root",
  );
  const stateRoot = parseRepositoryPath(
    optional(values, "repository.state_root") ??
      DEFAULT_CONFIGURATION.stateRoot,
    "repository.state_root",
  );
  if (pathsOverlap(worktreeRoot, stateRoot))
    throw new RunnerError(
      "CONFIG_INVALID",
      "repository.worktree_root and repository.state_root must not overlap.",
      "Configure distinct repository-relative roots.",
    );
  const promptTemplate =
    optional(values, "rpiv.prompt") ?? DEFAULT_CONFIGURATION.promptTemplate;
  const concurrencyValue = optional(values, "execution.max_concurrent_runs");
  const maxConcurrentRuns =
    concurrencyValue === null
      ? DEFAULT_CONFIGURATION.maxConcurrentRuns
      : parsePositiveInteger(concurrencyValue, "execution.max_concurrent_runs");
  const labelTypes: Record<string, string> = {
    ...DEFAULT_CONFIGURATION.labelTypes,
  };
  for (const [key, value] of values) {
    if (!key.startsWith("branch_types.")) continue;
    const label = key.slice("branch_types.".length).toLowerCase();
    if (label === "" || !allowedTypes.has(value))
      throw new RunnerError(
        "CONFIG_INVALID",
        "Invalid branch type mapping " + key + ": " + value,
        "Map a nonempty issue label to an allowed Conventional Commit type.",
      );
    labelTypes[label] = value;
  }
  return {
    protocolVersion,
    remote,
    baseBranch,
    worktreeRoot,
    stateRoot,
    labelTypes,
    promptTemplate,
    maxConcurrentRuns,
  };
}
function validateKnownKeys(
  values: ReadonlyMap<string, string>,
  mappings: ReadonlySet<string>,
): void {
  for (const key of mappings) {
    if (MAPPING_KEYS.has(key)) continue;
    throw unknownConfigurationKey(key);
  }
  for (const key of values.keys()) {
    if (FIXED_KEYS.has(key) || key.startsWith("branch_types.")) continue;
    throw unknownConfigurationKey(key);
  }
}
function unknownConfigurationKey(key: string): RunnerError {
  return new RunnerError(
    "CONFIG_INVALID",
    "Unknown configuration key: " + key,
    "Remove unsupported keys from .soft-factory/config.yml.",
  );
}
function stripComment(line: string): string {
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    if (line[index] === '"' && line[index - 1] !== "\\") quoted = !quoted;
    if (
      !quoted &&
      line[index] === "#" &&
      (index === 0 || /\s/.test(line[index - 1]))
    )
      return line.slice(0, index).trimEnd();
  }
  return line;
}
function optional(
  values: ReadonlyMap<string, string>,
  key: string,
): string | null {
  const value = values.get(key);
  return value === undefined || value === "" ? null : value;
}
function unquote(value: string): string {
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"'))
    return value.slice(1, -1);
  return value;
}
export function renderPrompt(template: string, issueNumber: number): string {
  return template.replaceAll("{issue}", String(issueNumber));
}
function parsePositiveInteger(value: string, key: string): number {
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value)))
    throw new RunnerError(
      "CONFIG_INVALID",
      key + " must be a strict positive safe integer: " + value,
      "Set " + key + " to a positive safe integer.",
    );
  return Number(value);
}
function parseRepositoryPath(value: string, key: string): string {
  if (
    value === "" ||
    value.startsWith("/") ||
    value.startsWith("\\\\") ||
    /^[a-zA-Z]:[\\/]/.test(value)
  )
    throw invalidPath(key, value);
  const parts = value.replaceAll("\\", "/").split("/");
  if (parts.some((part) => part === "" || part === "." || part === ".."))
    throw invalidPath(key, value);
  return parts.join("/");
}
function invalidPath(key: string, value: string): RunnerError {
  return new RunnerError(
    "CONFIG_INVALID",
    key + " must be a normalized repository-relative path: " + value,
    "Set " +
      key +
      " to a contained path without traversal or absolute prefixes.",
  );
}
function pathsOverlap(left: string, right: string): boolean {
  return (
    left === right ||
    left.startsWith(right + "/") ||
    right.startsWith(left + "/")
  );
}
