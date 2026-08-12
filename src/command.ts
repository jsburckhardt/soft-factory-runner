import { RunnerError } from "./errors";
import type { OfficialAssetIdentity } from "./official-assets";

export type Command =
  | { readonly kind: "bootstrap" }
  | { readonly kind: "help" }
  | { readonly kind: "doctor"; readonly json: boolean }
  | { readonly kind: "instructions"; readonly json: boolean }
  | {
      readonly kind: "install";
      readonly assets: readonly OfficialAssetIdentity[];
    }
  | {
      readonly kind: "run";
      readonly issueNumber: number;
      readonly json: boolean;
    }
  | {
      readonly kind:
        "reconcile" | "resume" | "stop" | "clean" | "status" | "logs";
      readonly issueNumber: number;
      readonly json: boolean;
    }
  | { readonly kind: "list"; readonly json: boolean }
  | { readonly kind: "attach"; readonly issueNumber: number }
  | { readonly kind: "worker"; readonly issueNumber: number }
  | {
      readonly kind: "publish-progress";
      readonly issueNumber: number;
      readonly phase: string;
      readonly status: string;
    }
  | {
      readonly kind: "publish-result";
      readonly issueNumber: number;
      readonly candidatePath: string;
    }
  | { readonly kind: "validate-result"; readonly issueNumber: number };

const ISSUE_COMMANDS = new Set([
  "reconcile",
  "resume",
  "stop",
  "clean",
  "status",
  "logs",
] as const);

type IssueCommandKind =
  "reconcile" | "resume" | "stop" | "clean" | "status" | "logs";

export function parseCommand(args: readonly string[]): Command {
  if (args.length === 0) return { kind: "bootstrap" };
  if (args.length === 1 && (args[0] === "--help" || args[0] === "help"))
    return { kind: "help" };
  if (args[0] === "install" && args.length === 2 && args[1] === "--recommended")
    return {
      kind: "install",
      assets: [
        { type: "agent", name: "soft-factory" },
        { type: "agent", name: "soft-factory-assessor" },
        { type: "skill", name: "soft-factory" },
      ],
    };
  if (
    args[0] === "install" &&
    args.length === 3 &&
    (args[1] === "agent" || args[1] === "skill") &&
    ((args[1] === "agent" &&
      (args[2] === "soft-factory" || args[2] === "soft-factory-assessor")) ||
      (args[1] === "skill" && args[2] === "soft-factory"))
  )
    return { kind: "install", assets: [{ type: args[1], name: args[2] }] };
  if (args[0] === "doctor" && (args.length === 1 || args.length === 2))
    return { kind: "doctor", json: parseOptionalJson(args.slice(1)) };
  if (args[0] === "instructions" && (args.length === 1 || args.length === 2))
    return { kind: "instructions", json: parseOptionalJson(args.slice(1)) };
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
  if (
    args[0] !== undefined &&
    ISSUE_COMMANDS.has(args[0] as IssueCommandKind) &&
    (args.length === 2 || args.length === 3)
  ) {
    return {
      kind: args[0] as IssueCommandKind,
      issueNumber: parseIssue(args[1]),
      json: parseOptionalJson(args.slice(2)),
    };
  }
  if (args[0] === "list" && (args.length === 1 || args.length === 2)) {
    return { kind: "list", json: parseOptionalJson(args.slice(1)) };
  }
  if (args[0] === "attach" && args.length === 2)
    return { kind: "attach", issueNumber: parseIssue(args[1]) };
  if (
    args[0] === "internal" &&
    args[1] === "publish-progress" &&
    args[2] === "--issue" &&
    args[4] === "--phase" &&
    args[6] === "--status" &&
    args.length === 8
  )
    return {
      kind: "publish-progress",
      issueNumber: parseIssue(args[3]),
      phase: args[5] ?? "",
      status: args[7] ?? "",
    };
  if (
    args[0] === "internal" &&
    args[1] === "publish-result" &&
    args[2] === "--issue" &&
    args[4] === "--candidate" &&
    args.length === 6 &&
    args[5] !== undefined &&
    args[5] !== ""
  )
    return {
      kind: "publish-result",
      issueNumber: parseIssue(args[3]),
      candidatePath: args[5],
    };
  if (
    args[0] === "internal" &&
    args[1] === "validate-result" &&
    args[2] === "--issue" &&
    args.length === 4
  )
    return { kind: "validate-result", issueNumber: parseIssue(args[3]) };
  if (
    args[0] === "internal" &&
    args[1] === "run-agent" &&
    args[2] === "--issue" &&
    args.length === 4
  )
    return { kind: "worker", issueNumber: parseIssue(args[3]) };
  throw new RunnerError(
    "CLI_INVALID",
    "Invalid command or arguments.",
    "Run soft-factory --help for the supported command grammar.",
  );
}

function parseIssue(value: string | undefined): number {
  if (value === undefined || !/^[1-9]\d*$/.test(value))
    throw new RunnerError(
      "CLI_INVALID",
      `Invalid issue number: ${value ?? "missing"}`,
      "Supply a positive integer issue number.",
    );
  const issue = Number(value);
  if (!Number.isSafeInteger(issue))
    throw new RunnerError(
      "CLI_INVALID",
      `Issue number is outside the safe integer range: ${value}`,
      "Supply a smaller positive integer issue number.",
    );
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

export const HELP_TEXT = `Soft Factory Runner Phase 5

Usage:
  soft-factory install agent soft-factory
  soft-factory install agent soft-factory-assessor
  soft-factory install skill soft-factory
  soft-factory install --recommended
  soft-factory doctor [--json]
  soft-factory instructions [--json]
  soft-factory run --issue <number> [--json]
  soft-factory reconcile <issue> [--json]
  soft-factory resume <issue> [--json]
  soft-factory stop <issue> [--json]
  soft-factory clean <issue> [--json]
  soft-factory list [--json]
  soft-factory status <issue> [--json]
  soft-factory attach <issue>
  soft-factory logs <issue> [--json]

Install writes verified package-local official assets transactionally beneath .agents/.
Doctor reports repository readiness only; it never selects or assesses an issue.
Instructions reports the deterministic Runner/RPIV integration contract without mutation.
Control commands return stable state, code, facts, remediation, and exit status.
`;
