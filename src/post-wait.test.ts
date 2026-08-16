import type { ProcessIdentityV1, RunSnapshotV5 } from "./domain";
import { renderError } from "./render";
import { classifyPostWaitState, postWaitRefusal } from "./post-wait";

const worker: ProcessIdentityV1 = {
  schemaVersion: 1,
  pid: 10,
  processGroupId: 11,
  startToken: "worker-start",
  executable: "/usr/bin/soft-factory",
  args: ["internal", "run-agent"],
  cwd: "/repo",
  launchedAt: "2026-08-16T00:00:00.000Z",
  paneLineage: {
    sessionName: "session",
    windowId: "@1",
    paneId: "%1",
    panePid: 12,
  },
};
const rpiv: ProcessIdentityV1 = {
  ...worker,
  pid: 20,
  processGroupId: 21,
  startToken: "rpiv-start",
  executable: "copilot",
};
const expected = {
  runId: "run-1",
  ownerId: "owner-1",
  workerProcess: worker,
  rpivProcess: rpiv,
};
const active = {
  schemaVersion: 5,
  runId: expected.runId,
  ownerId: expected.ownerId,
  state: "running_rpiv",
  workerProcess: worker,
  rpivProcess: rpiv,
} as unknown as RunSnapshotV5;

function changedIdentity(
  identity: ProcessIdentityV1,
  field: string,
): ProcessIdentityV1 {
  const copy = JSON.parse(JSON.stringify(identity)) as ProcessIdentityV1 & {
    paneLineage: Record<string, unknown>;
    [key: string]: unknown;
  };
  if (field.startsWith("paneLineage."))
    copy.paneLineage[field.slice("paneLineage.".length)] = "different";
  else if (field === "args") copy.args = [...identity.args, "different"];
  else if (["pid", "processGroupId"].includes(field))
    copy[field] = Number(copy[field]) + 1;
  else copy[field] = "different";
  return copy;
}

describe("post-wait state decision", () => {
  it.each([
    ["run_mismatch", { runId: "other" }],
    ["owner_mismatch", { ownerId: "other" }],
    ["worker_mismatch", { workerProcess: null }],
    ["rpiv_mismatch", { rpivProcess: null }],
    ["invalid", { state: "finalizing" }],
  ] as const)("returns %s without side effects", (reason, change) => {
    expect(classifyPostWaitState({ ...active, ...change }, expected)).toEqual({
      kind: "refused",
      reason,
    });
  });

  it.each([
    "pid",
    "processGroupId",
    "startToken",
    "executable",
    "args",
    "cwd",
    "launchedAt",
    "paneLineage.sessionName",
    "paneLineage.windowId",
    "paneLineage.paneId",
    "paneLineage.panePid",
  ])("compares complete worker and RPIV identity field %s", (field) => {
    expect(
      classifyPostWaitState(
        { ...active, workerProcess: changedIdentity(worker, field) },
        expected,
      ),
    ).toMatchObject({ kind: "refused", reason: "worker_mismatch" });
    expect(
      classifyPostWaitState(
        { ...active, rpivProcess: changedIdentity(rpiv, field) },
        expected,
      ),
    ).toMatchObject({ kind: "refused", reason: "rpiv_mismatch" });
  });

  it.each([
    "completed",
    "failed",
    "blocked",
    "cancelled",
    "interrupted",
  ] as const)(
    "returns exact terminal state %s without requiring RPIV identity",
    (state) => {
      const terminal = { ...active, state, rpivProcess: null };
      expect(classifyPostWaitState(terminal, expected)).toEqual({
        kind: "terminal",
        snapshot: terminal,
      });
    },
  );

  it("renders a stable value-safe machine-readable refusal", () => {
    const cause = postWaitRefusal("invalid", postWaitRefusal("missing"));
    expect(JSON.parse(renderError(cause, true))).toEqual({
      schemaVersion: 1,
      error: {
        code: "POST_WAIT_STATE_REFUSED",
        message: "Post-wait state handling was refused: invalid.",
        remediation:
          "Inspect the current run history and retry only after exact ownership and identity are restored.",
        details: { reason: "invalid", causeCode: "POST_WAIT_STATE_REFUSED" },
      },
    });
    expect(renderError(cause, false)).toContain("POST_WAIT_STATE_REFUSED");
  });
});
