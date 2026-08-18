import type { CommandResult, CommandRunner } from "./live";
import { createLivePorts } from "./live";
import type { TmuxTargetV2 } from "./tmux-target";

const target: TmuxTargetV2 = {
  schemaVersion: 2,
  selectionMode: "standalone",
  socketPath: "/private/socket-sentinel",
  socketIdentity: { device: "7", inode: "11" },
  sessionId: "$3",
  sessionName: "private-session",
  windowId: "@4",
  windowName: "private-window",
  paneId: "%5",
  cwd: "/removed/worktree-sentinel",
};

function result(stderr: Buffer, stdout = Buffer.alloc(0)): CommandResult {
  return {
    exitCode: 1,
    signal: null,
    stdout: stdout.toString("utf8"),
    stderr: stderr.toString("utf8"),
    stdoutBuffer: stdout,
    stderrBuffer: stderr,
    stdoutByteCount: stdout.byteLength,
    stderrByteCount: stderr.byteLength,
  };
}

class ObservationRunner implements CommandRunner {
  public readonly calls: Array<{
    readonly args: readonly string[];
    readonly cwd: string;
    readonly timeoutMs: number;
  }> = [];
  public constructor(private readonly response: CommandResult) {}
  public async run(
    _executable: string,
    args: readonly string[],
    cwd: string,
    timeoutMs: number,
  ): Promise<CommandResult> {
    this.calls.push({ args, cwd, timeoutMs });
    return this.response;
  }
  public runInherited(): Promise<CommandResult> {
    throw new Error("not used");
  }
}

function live(
  response: CommandResult,
  identities = [
    { device: "7", inode: "11" },
    { device: "7", inode: "11" },
  ],
) {
  const runner = new ObservationRunner(response);
  let index = 0;
  const tmux = createLivePorts(
    runner,
    async () => identities[Math.min(index++, identities.length - 1)],
  ).tmux;
  return { runner, tmux };
}

describe("Issue 44 bounded live cleanup observation", () => {
  it.each([
    ["pane", "%5", "missing_pane"],
    ["window", "@4", "missing_window"],
    ["session", "$3", "missing_session"],
  ] as const)(
    "accepts one exact selector-bound missing %s record with unchanged socket authority",
    async (kind, selector, category) => {
      const fixture = live(
        result(Buffer.from(`can't find ${kind}: ${selector}\n`, "utf8")),
      );
      await expect(
        fixture.tmux.observe(target, process.cwd()),
      ).resolves.toEqual({
        state: "missing",
        category,
        socketIdentity: "unchanged",
      });
      expect(fixture.runner.calls).toEqual([
        expect.objectContaining({
          args: expect.arrayContaining([
            "-S",
            target.socketPath,
            "-t",
            target.paneId,
          ]),
          cwd: process.cwd(),
          timeoutMs: 15_000,
        }),
      ]);
    },
  );

  it.each([
    ["wrong selector", Buffer.from("can't find pane: %999\n")],
    ["wrong case", Buffer.from("Can't find pane: %5\n")],
    ["missing LF", Buffer.from("can't find pane: %5")],
    ["CRLF", Buffer.from("can't find pane: %5\r\n")],
    ["extra record", Buffer.from("can't find pane: %5\nextra\n")],
    [
      "invalid UTF-8",
      Buffer.concat([
        Buffer.from("can't find pane: "),
        Buffer.from([0xff, 0x0a]),
      ]),
    ],
    ["other nonzero", Buffer.from("permission denied\n")],
  ])("refuses %s without exposing private values", async (_name, stderr) => {
    const fixture = live(result(stderr));
    await expect(
      fixture.tmux.observe(target, process.cwd()),
    ).rejects.toMatchObject({
      code: "TMUX_TARGET_OBSERVATION_REFUSED",
      details: { reason: "response_not_accepted" },
    });
    try {
      await fixture.tmux.observe(target, process.cwd());
    } catch (cause) {
      const serialized = JSON.stringify(cause);
      for (const forbidden of [
        target.socketPath,
        target.sessionId,
        target.windowId,
        target.paneId,
        target.cwd,
        stderr.toString("utf8"),
      ])
        expect(serialized).not.toContain(forbidden);
    }
  });

  it("refuses stdout data, stream truncation, and socket replacement", async () => {
    const accepted = Buffer.from("can't find pane: %5\n");
    const stdoutFixture = live(result(accepted, Buffer.from("sentinel")));
    await expect(
      stdoutFixture.tmux.observe(target, process.cwd()),
    ).rejects.toMatchObject({
      code: "TMUX_TARGET_OBSERVATION_REFUSED",
    });
    const truncated = result(accepted);
    const truncatedFixture = live({
      ...truncated,
      stderrByteCount: accepted.length + 1,
    });
    await expect(
      truncatedFixture.tmux.observe(target, process.cwd()),
    ).rejects.toMatchObject({
      code: "TMUX_TARGET_OBSERVATION_REFUSED",
    });
    const replaced = live(result(accepted), [
      { device: "7", inode: "11" },
      { device: "7", inode: "12" },
    ]);
    await expect(
      replaced.tmux.observe(target, process.cwd()),
    ).rejects.toMatchObject({
      code: "TMUX_TARGET_OBSERVATION_REFUSED",
      details: { reason: "socket_identity_changed" },
    });
  });
});
