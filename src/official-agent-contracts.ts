export interface AgentContractResult {
  readonly valid: boolean;
  readonly missing: readonly string[];
  readonly forbidden: readonly string[];
}

export const OPERATOR_FRONTMATTER = `---
name: soft-factory
description: "Deliver exactly one explicitly selected GitHub issue through Soft Factory Runner and preserve Runner-owned evidence."
tools:
  - execute/runInTerminal
  - execute/getTerminalOutput
user-invocable: true
disable-model-invocation: false
target: vscode
---`;

export const OPERATOR_APS_SECTIONS = Object.freeze([
  "instructions",
  "constants",
  "formats",
  "runtime",
  "triggers",
  "processes",
  "input",
]);

export const OPERATOR_REQUIRED_INPUT_DIRECTIVES = Object.freeze([
  "validate the complete caller input before using any terminal tool",
  "reject missing issue input before terminal use",
  "reject multiple issue numbers before terminal use",
  "reject zero and every nonpositive issue number before terminal use",
  "reject signed issue numbers, including plus and minus signs, before terminal use",
  "reject fractional issue numbers before terminal use",
  "reject leading-zero issue numbers before terminal use",
  "not exactly one canonical positive base-10 integer matching `[1-9][0-9]*` before terminal use",
  "true only for exactly one unsigned, nonzero, non-fractional, no-leading-zero, safe positive base-10 integer",
  "ASSERT INPUT_VALID is true",
]);

export const OPERATOR_REQUIRED_DELIVERY_CONTRACT = Object.freeze([
  "delivery of exactly one explicitly selected GitHub issue through Soft Factory Runner your primary goal",
  "Runner as the sole operational and completion authority",
  "soft-factory instructions --json",
  "soft-factory doctor --json",
  "soft-factory run --issue <ISSUE_NUMBER> --json",
  "only when Doctor explicitly reports ready",
  "stop after an instructions failure, a non-ready Doctor result, or the one run result",
  "applicable structured Runner output unchanged, byte-for-byte, without retry, status follow-up, summary, or reinterpretation",
  "APPLICABLE_RUNNER_OUTPUT := INSTRUCTIONS_RESULT (exact bytes without reinterpretation)",
  "APPLICABLE_RUNNER_OUTPUT := DOCTOR_RESULT (exact bytes without reinterpretation)",
  "APPLICABLE_RUNNER_OUTPUT := RUN_RESULT (exact bytes without reinterpretation)",
  "report dispatch acceptance separately from ticket completion",
  "keep ticket completion `unknown` unless the applicable Runner output explicitly reports completion",
  "Dispatch accepted: <DISPATCH_ACCEPTED>",
  "Ticket completion: <TICKET_COMPLETION>",
  "<RUNNER_OUTPUT> is the exact applicable structured Runner output",
  'use "unknown" unless explicitly reported',
]);

export const OPERATOR_REQUIRED_PROHIBITIONS = Object.freeze([
  "MUST NOT install assets or invoke Runner list, status, attach, logs, reconcile, resume, stop, clean, internal, or other lifecycle commands",
  "MUST NOT invoke RPIV directly or create a competing orchestration path",
  "MUST NOT select, rank, queue, or infer an issue",
  "MUST NOT manually create, reuse, move, inspect, or delete worktrees",
  "MUST NOT acquire, alter, infer, inspect, or remove Runner locks or concurrency leases",
  "MUST NOT directly read or write Runner snapshots, events, state, progress, result, or log files",
  "MUST NOT directly launch, inspect, signal, replace, or kill Runner-owned tmux windows or processes",
  "MUST NOT perform manual cleanup or bypass Runner ownership and invariant checks",
  "MUST NOT infer completion from prose, terminal output, dispatch acceptance, or process exit alone",
  "MUST NOT override a structured Runner refusal or claim completion without Runner proof",
]);

const FORBIDDEN_MARKERS = Object.freeze([
  "tools:\n  - bash",
  "USE `bash`",
  "soft-factory status <",
  "soft-factory list --json",
  "soft-factory attach ",
  "soft-factory logs ",
  "soft-factory reconcile ",
  "soft-factory resume ",
  "soft-factory stop ",
  "soft-factory clean ",
  "BYPASS_RUNNER_INVARIANTS",
  "DIRECT_RUNNER_STATE_WRITE_ALLOWED",
]);

export function checkOperatorContract(text: string): AgentContractResult {
  const required = [
    OPERATOR_FRONTMATTER,
    ...OPERATOR_REQUIRED_INPUT_DIRECTIVES,
    ...OPERATOR_REQUIRED_DELIVERY_CONTRACT,
    ...OPERATOR_REQUIRED_PROHIBITIONS,
    '<trigger event="user_message" target="deliver-issue" />',
    '<process id="deliver-issue"',
    "IF INSTRUCTIONS_RESULT indicates command failure:",
    "IF DOCTOR_RESULT does not explicitly report ready true:",
    "ASSERT DOCTOR_RESULT explicitly reports ready true",
  ];
  const missing = required.filter((phrase) => !text.includes(phrase));
  const forbidden = FORBIDDEN_MARKERS.filter((marker) => text.includes(marker));
  const sectionIndexes: number[] = [];
  for (const section of OPERATOR_APS_SECTIONS) {
    const opening = `<${section}>`;
    const closing = `</${section}>`;
    const index = text.indexOf(opening);
    sectionIndexes.push(index);
    if (
      index < 0 ||
      text.indexOf(opening, index + opening.length) >= 0 ||
      text.indexOf(closing) <= index ||
      !text.includes(`${opening}\n`) ||
      !text.includes(`\n${closing}`)
    )
      missing.push(`APS_SECTION:${section}`);
  }
  if (
    sectionIndexes.some(
      (index, offset) => offset > 0 && index <= sectionIndexes[offset - 1],
    )
  )
    missing.push("APS_SECTION_ORDER");
  const process = text.slice(
    text.indexOf("<processes>"),
    text.indexOf("</processes>"),
  );
  const validation = process.indexOf("ASSERT INPUT_VALID is true");
  const firstUse = process.indexOf("USE `execute/runInTerminal`");
  const instructions = process.indexOf(
    'command="soft-factory instructions --json"',
  );
  const doctor = process.indexOf('command="soft-factory doctor --json"');
  const ready = process.indexOf(
    "ASSERT DOCTOR_RESULT explicitly reports ready true",
  );
  const run = process.indexOf(
    'command="soft-factory run --issue <ISSUE_NUMBER> --json"',
  );
  if (!(validation >= 0 && validation < firstUse))
    missing.push("ORDER:input-before-terminal");
  if (!(instructions >= firstUse && instructions < doctor))
    missing.push("ORDER:instructions-before-doctor");
  if (!(doctor >= 0 && doctor < ready && ready < run))
    missing.push("ORDER:ready-before-run");
  if (text.includes("\t") || /^\s*\/\//m.test(text))
    missing.push("APS_FORMATTING");
  if (/command="[^"]*(?:&&|\|\||;)[^"]*"/.test(text))
    forbidden.push("SHELL_COMMAND_CHAINING");
  return {
    valid: missing.length === 0 && forbidden.length === 0,
    missing,
    forbidden,
  };
}
