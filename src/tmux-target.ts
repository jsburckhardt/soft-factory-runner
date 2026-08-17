import { createHash } from "node:crypto";
import path from "node:path";
import type { RepositoryIdentity, TmuxIdentity } from "./domain";
import { RunnerError } from "./errors";

export type TmuxSelectionMode = "invoking" | "standalone";
export type TmuxContextRefusalReason =
  | "partial-evidence"
  | "malformed-evidence"
  | "stale-server"
  | "contradictory-target"
  | "ambiguous-session"
  | "unavailable-proof";

export interface InvokingTmuxEvidenceV1 {
  readonly tmux: string | null;
  readonly tmuxPane: string | null;
}
export interface TmuxSocketIdentityV1 {
  readonly device: string;
  readonly inode: string;
}
export interface TmuxSessionTargetV1 {
  readonly selectionMode: TmuxSelectionMode;
  readonly socketPath: string;
  readonly socketIdentity: TmuxSocketIdentityV1 | null;
  readonly sessionId: string | null;
  readonly sessionName: string;
  readonly repository: string;
}
export interface TmuxTargetV2 extends TmuxIdentity {
  readonly schemaVersion: 2;
  readonly selectionMode: TmuxSelectionMode;
  readonly socketPath: string;
  readonly socketIdentity: TmuxSocketIdentityV1;
  readonly sessionId: string;
}
export interface ParsedInvokingTmuxEvidenceV1 {
  readonly socketPath: string;
  readonly paneId: string;
}
export const TMUX_INVOKING_CONTEXT_FORMAT =
  "#{socket_path}|#{session_id}|#{session_name}|#{window_id}|#{window_name}|#{pane_id}|#{pane_current_path}";

export function parseInvokingTmuxEvidence(
  evidence: InvokingTmuxEvidenceV1,
): ParsedInvokingTmuxEvidenceV1 | null {
  if (evidence.tmux === null && evidence.tmuxPane === null) return null;
  if (evidence.tmux === null || evidence.tmuxPane === null)
    throw tmuxContextRefusal("partial-evidence");
  if (
    evidence.tmux.length > 4096 ||
    evidence.tmuxPane.length > 64 ||
    /[\0\r\n]/.test(evidence.tmux) ||
    !/^%[0-9]+$/.test(evidence.tmuxPane)
  )
    throw tmuxContextRefusal("malformed-evidence");
  const match = /^(.*),([1-9][0-9]*),([0-9]+)$/.exec(evidence.tmux);
  if (match === null || !path.isAbsolute(match[1]) || match[1].includes("|"))
    throw tmuxContextRefusal("malformed-evidence");
  return { socketPath: path.resolve(match[1]), paneId: evidence.tmuxPane };
}

export function deriveStandaloneTmuxTarget(
  repository: RepositoryIdentity,
  temporaryRoot = "/tmp",
): TmuxSessionTargetV1 {
  const token = createHash("sha256")
    .update(repository.nameWithOwner, "utf8")
    .digest("hex")
    .slice(0, 20);
  const readable =
    repository.normalizedName.slice(0, 24).replace(/-$/g, "") || "repo";
  return {
    selectionMode: "standalone",
    socketPath: path.resolve(temporaryRoot, `soft-factory-${token}.sock`),
    socketIdentity: null,
    sessionId: null,
    sessionName: `sf-${readable}-${token.slice(0, 12)}`,
    repository: repository.nameWithOwner,
  };
}

export function parseInvokingContextRecord(value: Buffer): {
  readonly socketPath: string;
  readonly sessionId: string;
  readonly sessionName: string;
  readonly windowId: string;
  readonly windowName: string;
  readonly paneId: string;
  readonly cwd: string;
} {
  if (value.length === 0 || value.length > 16_384 || value.at(-1) !== 0x0a)
    throw tmuxContextRefusal("unavailable-proof");
  const body = value.subarray(0, -1);
  if (body.includes(0x0a) || body.includes(0x0d) || body.includes(0x00))
    throw tmuxContextRefusal("ambiguous-session");
  const text = body.toString("utf8");
  if (!Buffer.from(text, "utf8").equals(body))
    throw tmuxContextRefusal("unavailable-proof");
  const separators: number[] = [];
  for (let index = 0; index < text.length && separators.length < 6; index += 1)
    if (text[index] === "|") separators.push(index);
  if (separators.length !== 6) throw tmuxContextRefusal("ambiguous-session");
  const fields = [
    text.slice(0, separators[0]),
    text.slice(separators[0] + 1, separators[1]),
    text.slice(separators[1] + 1, separators[2]),
    text.slice(separators[2] + 1, separators[3]),
    text.slice(separators[3] + 1, separators[4]),
    text.slice(separators[4] + 1, separators[5]),
    text.slice(separators[5] + 1),
  ];
  if (!path.isAbsolute(fields[0])) throw tmuxContextRefusal("stale-server");
  if (fields[6] === "") throw tmuxContextRefusal("unavailable-proof");
  if (fields[2] === "" || fields[4] === "")
    throw tmuxContextRefusal("ambiguous-session");
  if (
    !/^\$[0-9]+$/.test(fields[1]) ||
    !/^@[0-9]+$/.test(fields[3]) ||
    !/^%[0-9]+$/.test(fields[5])
  )
    throw tmuxContextRefusal("contradictory-target");
  return {
    socketPath: path.resolve(fields[0]),
    sessionId: fields[1],
    sessionName: fields[2],
    windowId: fields[3],
    windowName: fields[4],
    paneId: fields[5],
    cwd: fields[6],
  };
}
export function sameSocketIdentity(
  left: TmuxSocketIdentityV1,
  right: TmuxSocketIdentityV1,
): boolean {
  return left.device === right.device && left.inode === right.inode;
}
export function tmuxContextRefusal(
  reason: TmuxContextRefusalReason,
): RunnerError {
  return new RunnerError(
    "TMUX_CONTEXT_REFUSED",
    `Invoking tmux context was refused (${reason}).`,
    "Use one valid current tmux client context, or remove both TMUX and TMUX_PANE to select the standalone target.",
    { details: { reason } },
  );
}
