import { RunnerError } from "./errors";

export type Command =
  | { readonly kind: "bootstrap" }
  | { readonly kind: "help" }
  | {
      readonly kind: "run";
      readonly issueNumber: number;
      readonly json: boolean;
    }
  | {
      readonly kind: "status";
      readonly issueNumber: number;
      readonly json: boolean;
    }
  | { readonly kind: "attach"; readonly issueNumber: number }
  | { readonly kind: "worker"; readonly issueNumber: number };

export function parseCommand(args: readonly string[]): Command {
  if (args.length === 0) return { kind: "bootstrap" };
  if (args.length === 1 && (args[0] === "--help" || args[0] === "help"))
    return { kind: "help" };
  if (
    args[0] === "run" &&
    (args.length === 3 || args.length === 4) &&
    args[1] === "--issue"
  ) {
    return {
      kind: "run",
      issueNumber: parseIssue(args[2]),
      json: parseOptionalJson(args.slice(3)),
    };
  }
  if (args[0] === "status" && (args.length === 2 || args.length === 3)) {
    return {
      kind: "status",
      issueNumber: parseIssue(args[1]),
      json: parseOptionalJson(args.slice(2)),
    };
  }
  if (args[0] === "attach" && args.length === 2) {
    return { kind: "attach", issueNumber: parseIssue(args[1]) };
  }
  if (
    args[0] === "internal" &&
    args[1] === "run-agent" &&
    args[2] === "--issue" &&
    args.length === 4
  ) {
    return { kind: "worker", issueNumber: parseIssue(args[3]) };
  }
  throw new RunnerError(
    "CLI_INVALID",
    "Invalid command or arguments.",
    "Run soft-factory --help for the supported Phase 1 command grammar.",
  );
}

function parseIssue(value: string | undefined): number {
  if (value === undefined || !/^[1-9]\d*$/.test(value)) {
    throw new RunnerError(
      "CLI_INVALID",
      `Invalid issue number: ${value ?? "missing"}`,
      "Supply a positive integer issue number.",
    );
  }
  const issue = Number(value);
  if (!Number.isSafeInteger(issue)) {
    throw new RunnerError(
      "CLI_INVALID",
      `Issue number is outside the safe integer range: ${value}`,
      "Supply a smaller positive integer issue number.",
    );
  }
  return issue;
}

function parseOptionalJson(args: readonly string[]): boolean {
  if (args.length === 0) return false;
  if (args.length === 1 && args[0] === "--json") return true;
  throw new RunnerError(
    "CLI_INVALID",
    "Only --json may follow this command.",
    "Remove unsupported command options.",
  );
}

export const HELP_TEXT = `Soft Factory Runner Phase 1

Usage:
  soft-factory run --issue <number> [--json]
  soft-factory status <issue> [--json]
  soft-factory attach <issue>
`;
