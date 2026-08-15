import { isUtf8 } from "node:buffer";
import type {
  TmuxIdentityDiagnosticV1,
  TmuxIdentityPhase,
  TmuxIdentityTokenV1,
} from "./domain";
import { RunnerError } from "./errors";

const RECORD_LIMIT = 8;
const FIELD_LIMIT = 8;
const SIGNATURE_LIMIT = 32;
const NUL = 0x00;
const HORIZONTAL_TAB = 0x09;
const LINE_FEED = 0x0a;
const CARRIAGE_RETURN = 0x0d;
const BACKSLASH = 0x5c;
const VERTICAL_BAR = 0x7c;

export const TMUX_CREATE_IDENTITY_FORMAT = "#{window_id}|#{pane_id}" as const;
export const TMUX_OBSERVE_IDENTITY_FORMAT =
  "#{window_id}|#{pane_id}|#{pane_current_path}" as const;

export interface TmuxIdentityCommandResult {
  readonly exitCode: number;
  readonly stdoutBuffer: Buffer;
  readonly stderrBuffer: Buffer;
  readonly stdoutByteCount: number;
  readonly stderrByteCount: number;
}

export interface ParsedTmuxIdentityOutput {
  readonly windowId: string;
  readonly paneId: string;
  readonly cwd: string | null;
}

export class TmuxIdentityOutputError extends RunnerError {
  public readonly tmuxIdentityDiagnostic: TmuxIdentityDiagnosticV1;

  public constructor(
    code: "TMUX_IDENTITY_MALFORMED" | "EXTERNAL_COMMAND_FAILED",
    message: string,
    diagnostic: TmuxIdentityDiagnosticV1,
  ) {
    super(
      code,
      message,
      code === "TMUX_IDENTITY_MALFORMED"
        ? "Preserve existing tmux resources, inspect the bounded structural diagnostic, and retry only after exact ownership is proved."
        : "Inspect tmux state while preserving existing resources, then retry only after exact ownership is proved.",
      { details: { tmuxIdentityDiagnostic: diagnostic } },
    );
    this.name = "TmuxIdentityOutputError";
    this.tmuxIdentityDiagnostic = diagnostic;
  }
}

export function parseTmuxIdentityResult(
  phase: TmuxIdentityPhase,
  result: TmuxIdentityCommandResult,
): ParsedTmuxIdentityOutput {
  const diagnostic = buildTmuxIdentityDiagnostic(phase, result);
  if (result.exitCode !== 0) {
    throw new TmuxIdentityOutputError(
      "EXTERNAL_COMMAND_FAILED",
      "tmux issue-window creation failed before a valid identity was returned.",
      diagnostic,
    );
  }

  const stdout = result.stdoutBuffer;
  const hasExactRecordFraming =
    stdout.byteLength > 1 &&
    stdout.at(-1) === LINE_FEED &&
    !stdout.subarray(0, stdout.byteLength - 1).includes(LINE_FEED) &&
    !stdout.includes(CARRIAGE_RETURN);
  const body = hasExactRecordFraming
    ? stdout.subarray(0, stdout.byteLength - 1)
    : Buffer.alloc(0);
  const fields =
    phase === "create" ? splitCreateFields(body) : splitObserveFields(body);
  const validIds =
    fields !== null && isWindowId(fields[0]) && isPaneId(fields[1]);
  const cwdBytes =
    phase === "observe" && fields !== null && fields.length === 3
      ? fields[2]
      : null;
  const validCwd =
    phase === "create" ||
    (cwdBytes !== null &&
      cwdBytes.byteLength > 0 &&
      !cwdBytes.includes(NUL) &&
      isUtf8(cwdBytes));

  if (!hasExactRecordFraming || fields === null || !validIds || !validCwd) {
    throw new TmuxIdentityOutputError(
      "TMUX_IDENTITY_MALFORMED",
      `tmux returned malformed or ambiguous ${phase} identity evidence.`,
      diagnostic,
    );
  }

  return {
    windowId: fields[0].toString("ascii"),
    paneId: fields[1].toString("ascii"),
    cwd: cwdBytes?.toString("utf8") ?? null,
  };
}

export function buildTmuxIdentityDiagnostic(
  phase: TmuxIdentityPhase,
  result: TmuxIdentityCommandResult,
): TmuxIdentityDiagnosticV1 {
  const logicalRecords = splitLogicalRecords(result.stdoutBuffer);
  const records = logicalRecords.slice(0, RECORD_LIMIT).map((record) => {
    const fields = countByte(record, VERTICAL_BAR) + 1;
    return {
      fieldCount: Math.min(fields, FIELD_LIMIT),
      truncated: fields > FIELD_LIMIT,
    };
  });
  const signature = tokenize(result.stdoutBuffer);
  return {
    schemaVersion: 1,
    phase,
    exitCode: result.exitCode,
    stdoutByteCount: result.stdoutByteCount,
    stderrByteCount: result.stderrByteCount,
    recordCount: Math.min(logicalRecords.length, RECORD_LIMIT),
    recordsTruncated: logicalRecords.length > RECORD_LIMIT,
    records,
    signature: signature.slice(0, SIGNATURE_LIMIT),
    signatureTruncated: signature.length > SIGNATURE_LIMIT,
  };
}

function splitCreateFields(value: Buffer): readonly [Buffer, Buffer] | null {
  const separator = value.indexOf(VERTICAL_BAR);
  if (separator < 0 || value.indexOf(VERTICAL_BAR, separator + 1) >= 0)
    return null;
  return [value.subarray(0, separator), value.subarray(separator + 1)];
}

function splitObserveFields(
  value: Buffer,
): readonly [Buffer, Buffer, Buffer] | null {
  const first = value.indexOf(VERTICAL_BAR);
  if (first < 0) return null;
  const second = value.indexOf(VERTICAL_BAR, first + 1);
  if (second < 0) return null;
  return [
    value.subarray(0, first),
    value.subarray(first + 1, second),
    value.subarray(second + 1),
  ];
}

function splitLogicalRecords(stdout: Buffer): readonly Buffer[] {
  if (stdout.byteLength === 0) return [];
  const body =
    stdout.at(-1) === LINE_FEED
      ? stdout.subarray(0, stdout.byteLength - 1)
      : stdout;
  const records: Buffer[] = [];
  let start = 0;
  for (let index = 0; index < body.byteLength; index += 1) {
    if (body[index] !== LINE_FEED) continue;
    records.push(body.subarray(start, index));
    start = index + 1;
  }
  records.push(body.subarray(start));
  return records;
}

function tokenize(stdout: Buffer): readonly TmuxIdentityTokenV1[] {
  const tokens: TmuxIdentityTokenV1[] = [];
  let index = 0;
  while (index < stdout.byteLength) {
    const special = specialToken(stdout[index]);
    if (special !== null) {
      tokens.push(special);
      index += 1;
      continue;
    }
    const start = index;
    while (index < stdout.byteLength && specialToken(stdout[index]) === null)
      index += 1;
    const run = stdout.subarray(start, index);
    tokens.push(
      isWindowId(run) ? "window_id" : isPaneId(run) ? "pane_id" : "other",
    );
  }
  return tokens;
}

function specialToken(value: number): TmuxIdentityTokenV1 | null {
  if (value === VERTICAL_BAR) return "vertical_bar";
  if (value === HORIZONTAL_TAB) return "horizontal_tab";
  if (value === CARRIAGE_RETURN) return "carriage_return";
  if (value === LINE_FEED) return "line_feed";
  if (value === BACKSLASH) return "backslash";
  return null;
}

function isWindowId(value: Buffer): boolean {
  return isIdentifier(value, 0x40);
}
function isPaneId(value: Buffer): boolean {
  return isIdentifier(value, 0x25);
}
function isIdentifier(value: Buffer, prefix: number): boolean {
  if (value.byteLength < 2 || value[0] !== prefix) return false;
  for (let index = 1; index < value.byteLength; index += 1)
    if (value[index] < 0x30 || value[index] > 0x39) return false;
  return true;
}
function countByte(value: Buffer, expected: number): number {
  let count = 0;
  for (const byte of value) if (byte === expected) count += 1;
  return count;
}
