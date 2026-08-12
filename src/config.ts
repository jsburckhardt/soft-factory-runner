import type { RequiredFinalValidationV1, RunConfiguration } from "./domain";
import { DEFAULT_FINAL_VALIDATION } from "./domain";
import { RunnerError } from "./errors";

const EMPTY_ENVIRONMENT: Readonly<Record<string, string>> = Object.freeze({});

export const DEFAULT_CONFIGURATION: RunConfiguration = Object.freeze({
  protocolVersion: null,
  remote: null,
  baseBranch: null,
  worktreeRoot: ".trees",
  stateRoot: ".soft-factory",
  labelTypes: Object.freeze({ feature: "feat" }),
  promptTemplate: "Deliver issue #{issue}",
  maxConcurrentRuns: 1,
  copilotEnvironment: EMPTY_ENVIRONMENT,
  finalValidation: DEFAULT_FINAL_VALIDATION,
});

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
  "copilot",
  "copilot.environment",
]);
const FIXED_KEYS = new Set([
  "protocol_version",
  "repository.remote",
  "repository.base_branch",
  "repository.worktree_root",
  "repository.state_root",
  "rpiv.prompt",
  "rpiv.final_validation",
  "execution.max_concurrent_runs",
]);
const ENVIRONMENT_PREFIX = "copilot.environment.";
const ENVIRONMENT_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

interface ParsedScalar {
  readonly raw: string;
  readonly value: string;
  readonly quoted: boolean;
}

export function parseConfiguration(
  text: string | null,
  rootJustfile: string | null = null,
  persistedFinalValidation?: RequiredFinalValidationV1,
): RunConfiguration {
  if (text === null || text.trim() === "") {
    if (persistedFinalValidation === undefined)
      validateDeclaredRecipe(DEFAULT_FINAL_VALIDATION.command, rootJustfile);
    return persistedFinalValidation === undefined
      ? DEFAULT_CONFIGURATION
      : Object.freeze({
          ...DEFAULT_CONFIGURATION,
          finalValidation: persistedFinalValidation,
        });
  }
  const values = new Map<string, ParsedScalar>();
  const mappings = new Set<string>();
  const seen = new Set<string>();
  const levels: string[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const uncommented = stripComment(rawLine);
    if (uncommented.trim() === "") continue;
    if (/^\s*/.exec(uncommented)?.[0].includes("\t"))
      throw invalidConfiguration(
        ".soft-factory/config.yml",
        "indentation must use two-space levels",
      );
    const match = /^(\s*)([^:\s][^:]*?):(?:\s*(.*))?$/.exec(uncommented);
    if (match === null)
      throw invalidConfiguration(
        ".soft-factory/config.yml",
        "line has malformed mapping syntax",
      );
    const indent = match[1].length;
    if (indent % 2 !== 0)
      throw invalidConfiguration(
        ".soft-factory/config.yml",
        "indentation must use two-space levels",
      );
    const depth = indent / 2;
    if (depth > levels.length)
      throw invalidConfiguration(
        ".soft-factory/config.yml",
        "indentation skips a mapping level",
      );
    levels.splice(depth);
    const key = match[2].trim();
    const field = [...levels, key].join(".");
    if (seen.has(field))
      throw invalidConfiguration(field, "field is duplicated");
    seen.add(field);
    const rawValue = (match[3] ?? "").trim();
    if (key === "<<")
      throw invalidConfiguration(field, "YAML merge keys are not supported");
    if (rawValue.startsWith("&"))
      throw invalidConfiguration(field, "YAML anchors are not supported");
    if (rawValue.startsWith("*"))
      throw invalidConfiguration(field, "YAML aliases are not supported");
    if (rawValue === "") {
      mappings.add(field);
      levels[depth] = key;
      continue;
    }
    values.set(
      field,
      field.startsWith("rpiv.final_validation") &&
        persistedFinalValidation !== undefined
        ? { raw: rawValue, value: rawValue, quoted: false }
        : parseScalar(rawValue, field),
    );
  }

  if (persistedFinalValidation !== undefined) {
    for (const key of [...values.keys()])
      if (key.startsWith("rpiv.final_validation")) values.delete(key);
    for (const key of [...mappings])
      if (key.startsWith("rpiv.final_validation")) mappings.delete(key);
  }
  validateKnownKeys(values, mappings);
  if (
    persistedFinalValidation === undefined &&
    mappings.has("rpiv.final_validation")
  )
    throw invalidConfiguration(
      "rpiv.final_validation",
      "value must be one argument-free just recipe and must not be empty",
    );
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
    throw invalidConfiguration(
      "repository.worktree_root,repository.state_root",
      "configured repository roots must not overlap",
    );
  const promptTemplate =
    optional(values, "rpiv.prompt") ?? DEFAULT_CONFIGURATION.promptTemplate;
  const finalValidation =
    persistedFinalValidation ??
    parseFinalValidation(values.get("rpiv.final_validation"), rootJustfile);
  const concurrencyValue = optional(values, "execution.max_concurrent_runs");
  const maxConcurrentRuns =
    concurrencyValue === null
      ? DEFAULT_CONFIGURATION.maxConcurrentRuns
      : parsePositiveInteger(concurrencyValue, "execution.max_concurrent_runs");
  const labelTypes: Record<string, string> = {
    ...DEFAULT_CONFIGURATION.labelTypes,
  };
  const copilotEnvironment: Record<string, string> = {};
  for (const [key, scalar] of values) {
    if (key.startsWith("branch_types.")) {
      const label = key.slice("branch_types.".length).toLowerCase();
      if (label === "" || !allowedTypes.has(scalar.value))
        throw invalidConfiguration(
          key,
          "branch type must be an allowed Conventional Commit type",
        );
      labelTypes[label] = scalar.value;
    }
    if (key.startsWith(ENVIRONMENT_PREFIX)) {
      const name = key.slice(ENVIRONMENT_PREFIX.length);
      if (!ENVIRONMENT_NAME.test(name))
        throw invalidConfiguration(key, "environment name has invalid syntax");
      if (!isStringScalar(scalar))
        throw invalidConfiguration(
          key,
          "environment value must be a string scalar",
        );
      copilotEnvironment[name] = scalar.value;
    }
  }
  return Object.freeze({
    protocolVersion,
    remote,
    baseBranch,
    worktreeRoot,
    stateRoot,
    labelTypes: Object.freeze(labelTypes),
    promptTemplate,
    maxConcurrentRuns,
    copilotEnvironment: Object.freeze(copilotEnvironment),
    finalValidation,
  });
}

function validateKnownKeys(
  values: ReadonlyMap<string, ParsedScalar>,
  mappings: ReadonlySet<string>,
): void {
  for (const key of mappings) {
    if (MAPPING_KEYS.has(key)) continue;
    if (key.startsWith(ENVIRONMENT_PREFIX))
      throw invalidConfiguration(
        key,
        "environment value must be a string scalar",
      );
    throw unknownConfigurationKey(key);
  }
  for (const key of values.keys()) {
    if (
      FIXED_KEYS.has(key) ||
      key.startsWith("branch_types.") ||
      key.startsWith(ENVIRONMENT_PREFIX)
    )
      continue;
    throw unknownConfigurationKey(key);
  }
}

function unknownConfigurationKey(key: string): RunnerError {
  return invalidConfiguration(key, "field is not supported");
}

function invalidConfiguration(field: string, reason: string): RunnerError {
  return new RunnerError(
    "CONFIG_INVALID",
    "Invalid configuration field " + field + ": " + reason + ".",
    "Correct the named field using the documented .soft-factory/config.yml schema.",
    { details: { field, reason } },
  );
}

function stripComment(line: string): string {
  let doubleQuoted = false;
  let singleQuoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const current = line[index];
    if (current === '"' && !singleQuoted && line[index - 1] !== "\\")
      doubleQuoted = !doubleQuoted;
    if (current === "\u0027" && !doubleQuoted) {
      if (singleQuoted && line[index + 1] === "\u0027") {
        index += 1;
        continue;
      }
      singleQuoted = !singleQuoted;
    }
    if (
      !doubleQuoted &&
      !singleQuoted &&
      current === "#" &&
      (index === 0 || /\s/.test(line[index - 1]))
    )
      return line.slice(0, index).trimEnd();
  }
  return line;
}

function parseScalar(raw: string, field: string): ParsedScalar {
  if (raw.startsWith("[") || raw.startsWith("{"))
    throw invalidConfiguration(
      field,
      "nested or flow values are not supported",
    );
  if (raw === "|" || raw === ">" || raw.startsWith("!"))
    throw invalidConfiguration(
      field,
      "non-scalar YAML values are not supported",
    );
  if (raw.startsWith('"')) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== "string") throw new Error("not string");
      return { raw, value: parsed, quoted: true };
    } catch {
      throw invalidConfiguration(field, "quoted string syntax is malformed");
    }
  }
  if (raw.startsWith("\u0027")) {
    if (!raw.endsWith("\u0027") || raw.length < 2)
      throw invalidConfiguration(field, "quoted string syntax is malformed");
    return {
      raw,
      value: raw.slice(1, -1).replaceAll("\u0027\u0027", "\u0027"),
      quoted: true,
    };
  }
  if (raw.includes("\t"))
    throw invalidConfiguration(field, "scalar contains unsupported tab syntax");
  return { raw, value: raw, quoted: false };
}

function isStringScalar(scalar: ParsedScalar): boolean {
  if (scalar.quoted) return true;
  const value = scalar.raw;
  if (/^(?:null|~|true|false|yes|no|on|off)$/i.test(value)) return false;
  if (/^[-+]?(?:\d[\d_]*)(?:\.\d[\d_]*)?(?:e[-+]?\d+)?$/i.test(value))
    return false;
  if (/^[-+]?(?:\.inf|\.nan)$/i.test(value)) return false;
  if (/^\d{4}-\d{2}-\d{2}(?:[Tt]|\s)/.test(value)) return false;
  return true;
}

function optional(
  values: ReadonlyMap<string, ParsedScalar>,
  key: string,
): string | null {
  const value = values.get(key)?.value;
  return value === undefined || value === "" ? null : value;
}

export function renderPrompt(template: string, issueNumber: number): string {
  return template.replaceAll("{issue}", String(issueNumber));
}

function parsePositiveInteger(value: string, key: string): number {
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value)))
    throw invalidConfiguration(
      key,
      "value must be a strict positive safe integer",
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
    throw invalidConfiguration(
      key,
      "path must be normalized and repository-relative",
    );
  const parts = value.replaceAll("\\", "/").split("/");
  if (parts.some((part) => part === "" || part === "." || part === ".."))
    throw invalidConfiguration(
      key,
      "path must be normalized and repository-relative",
    );
  return parts.join("/");
}

function pathsOverlap(left: string, right: string): boolean {
  return (
    left === right ||
    left.startsWith(right + "/") ||
    right.startsWith(left + "/")
  );
}

export function parseFinalValidation(
  scalar:
    | { readonly raw: string; readonly value: string; readonly quoted: boolean }
    | undefined,
  rootJustfile: string | null,
): RequiredFinalValidationV1 {
  const command = scalar?.value ?? DEFAULT_FINAL_VALIDATION.command;
  if (scalar !== undefined && (!isStringScalar(scalar) || scalar.value === ""))
    throw invalidConfiguration(
      "rpiv.final_validation",
      "value must be a nonempty string scalar",
    );
  const match = /^just ([A-Za-z][A-Za-z0-9_-]*)$/.exec(command);
  if (match === null || command.includes("  "))
    throw invalidConfiguration(
      "rpiv.final_validation",
      "value must match exactly just <recipe> without arguments or shell syntax",
    );
  if (command === "just verify-focused")
    throw invalidConfiguration(
      "rpiv.final_validation",
      "focused validation is implementation feedback and cannot control completion",
    );
  validateDeclaredRecipe(command, rootJustfile);
  return Object.freeze({ command });
}

function validateDeclaredRecipe(
  command: string,
  rootJustfile: string | null,
): void {
  if (rootJustfile === null) {
    if (command === DEFAULT_FINAL_VALIDATION.command) return;
    throw invalidConfiguration(
      "rpiv.final_validation",
      "configured recipe cannot be proved without the root justfile",
    );
  }
  const recipe = command.slice("just ".length);
  const declared = rootJustfile.split(/\r?\n/).some((line) => {
    const match = /^([A-Za-z][A-Za-z0-9_-]*)(?:\s+[^:]*)?:\s*(?:#.*)?$/.exec(
      line,
    );
    return match?.[1] === recipe;
  });
  if (!declared)
    throw invalidConfiguration(
      "rpiv.final_validation",
      "recipe is not declared by the repository root justfile",
    );
}
