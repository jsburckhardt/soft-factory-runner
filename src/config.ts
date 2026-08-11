import type { RunConfiguration } from "./domain";
import { RunnerError } from "./errors";

export const DEFAULT_CONFIGURATION: RunConfiguration = {
  remote: null,
  baseBranch: null,
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

export function parseConfiguration(text: string | null): RunConfiguration {
  if (text === null || text.trim() === "") return DEFAULT_CONFIGURATION;
  const values = new Map<string, string>();
  const levels: string[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const uncommented = stripComment(rawLine);
    if (uncommented.trim() === "") continue;
    const match = /^(\s*)([a-zA-Z_][\w-]*):(?:\s*(.*))?$/.exec(uncommented);
    if (match === null) {
      throw new RunnerError(
        "CONFIG_INVALID",
        `Unsupported configuration line: ${rawLine}`,
        "Use simple YAML mappings documented in docs/phase-1-issue-run.md.",
      );
    }
    const indent = match[1].length;
    if (indent % 2 !== 0) {
      throw new RunnerError(
        "CONFIG_INVALID",
        "Configuration indentation must use two-space levels.",
        "Indent nested .soft-factory/config.yml keys with two spaces.",
      );
    }
    const depth = indent / 2;
    levels.splice(depth);
    const key = match[2];
    const rawValue = (match[3] ?? "").trim();
    if (rawValue === "") {
      levels[depth] = key;
      continue;
    }
    values.set([...levels.slice(0, depth), key].join("."), unquote(rawValue));
  }
  const remote = optional(values, "repository.remote");
  const baseBranch = optional(values, "repository.base_branch");
  const promptTemplate =
    optional(values, "rpiv.prompt") ?? DEFAULT_CONFIGURATION.promptTemplate;
  const concurrencyValue = optional(values, "execution.max_concurrent_runs");
  const maxConcurrentRuns =
    concurrencyValue === null ? 1 : parseConcurrencyLimit(concurrencyValue);
  const labelTypes: Record<string, string> = {
    ...DEFAULT_CONFIGURATION.labelTypes,
  };
  for (const [key, value] of values) {
    if (!key.startsWith("branch_types.")) continue;
    const label = key.slice("branch_types.".length).toLowerCase();
    if (label === "" || !allowedTypes.has(value)) {
      throw new RunnerError(
        "CONFIG_INVALID",
        `Invalid branch type mapping ${key}: ${value}`,
        "Map a nonempty issue label to an allowed Conventional Commit type.",
      );
    }
    labelTypes[label] = value;
  }
  return {
    remote,
    baseBranch,
    labelTypes,
    promptTemplate,
    maxConcurrentRuns,
  };
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

function parseConcurrencyLimit(value: string): number {
  if (!/^[1-9]\d*$/.test(value)) {
    throw new RunnerError(
      "CONFIG_INVALID",
      `execution.max_concurrent_runs must be a strict positive integer: ${value}`,
      "Set execution.max_concurrent_runs to a positive safe integer.",
    );
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new RunnerError(
      "CONFIG_INVALID",
      "execution.max_concurrent_runs exceeds the safe integer range.",
      "Set execution.max_concurrent_runs to a smaller positive integer.",
    );
  }
  return parsed;
}
