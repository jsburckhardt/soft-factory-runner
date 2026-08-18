import * as fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  CommandExecutor,
  createLivePorts,
  type CommandResult,
  type CommandRunner,
} from "./live";
import type { TmuxSocketIdentityV1 } from "./tmux-target";

function result(
  bytes: Buffer = Buffer.from("$1|session|@1|window|%1|/tmp\n"),
  exitCode = 0,
  totalBytes = bytes.byteLength,
  stderrBytes: Buffer = Buffer.alloc(0),
  stderrTotalBytes = stderrBytes.byteLength,
): CommandResult {
  return {
    exitCode,
    signal: null,
    stdout: bytes.toString("utf8"),
    stderr: stderrBytes.toString("utf8"),
    stdoutBuffer: bytes,
    stderrBuffer: stderrBytes,
    stdoutByteCount: totalBytes,
    stderrByteCount: stderrTotalBytes,
  };
}
class InventoryRunner implements CommandRunner {
  public readonly calls: Array<{
    executable: string;
    args: readonly string[];
    timeoutMs: number;
    shell: false | undefined;
    retention: number | undefined;
  }> = [];
  public constructor(
    private readonly response: CommandResult | Error = result(),
  ) {}
  public async run(
    executable: string,
    args: readonly string[],
    _cwd: string,
    timeoutMs: number,
    shell?: false,
    retention?: number,
  ): Promise<CommandResult> {
    this.calls.push({ executable, args, timeoutMs, shell, retention });
    if (this.response instanceof Error) throw this.response;
    return this.response;
  }
  public runInherited(): Promise<CommandResult> {
    throw new Error("not used");
  }
}
function nodeError(code: string): NodeJS.ErrnoException {
  return Object.assign(new Error(code), { code });
}
const identity = { device: "1", inode: "2" } as const;

describe("Issue 38 bounded targeting inventory", () => {
  it("treats a missing unrelated socket as stable empty inventory without a command", async () => {
    const runner = new InventoryRunner();
    const tmux = createLivePorts(runner, async () => {
      throw nodeError("ENOENT");
    }).tmux;
    const inventory = tmux.inventoryServerResources?.bind(tmux);
    const input = { socketPath: "/absent/default", cwd: "/tmp" };
    await expect(inventory?.(input)).resolves.toEqual(Buffer.alloc(0));
    await expect(inventory?.(input)).resolves.toEqual(Buffer.alloc(0));
    expect(runner.calls).toEqual([]);
  });

  it("classifies only the exact bounded no-server response with stable identity", async () => {
    const socketPath = "/sentinel/stale.sock";
    const runner = new InventoryRunner(
      result(
        Buffer.alloc(0),
        1,
        0,
        Buffer.from(`no server running on ${socketPath}\n`),
      ),
    );
    const tmux = createLivePorts(runner, async () => identity).tmux;
    const inventory = tmux.inventoryServerResources?.bind(tmux);
    const first = await inventory?.({ socketPath, cwd: "/tmp" });
    const second = await inventory?.({ socketPath, cwd: "/tmp" });
    expect(first).toEqual(second);
    expect(first).toEqual(
      Buffer.from(JSON.stringify({ socket: identity }) + "\n"),
    );
    expect(runner.calls).toHaveLength(2);
  });

  it.each([
    [
      "spoofed path",
      Buffer.alloc(0),
      Buffer.from("no server running on /spoofed.sock\n"),
      0,
    ],
    [
      "additional record",
      Buffer.alloc(0),
      Buffer.from("no server running on /sentinel/stale.sock\nextra\n"),
      0,
    ],
    [
      "missing LF",
      Buffer.alloc(0),
      Buffer.from("no server running on /sentinel/stale.sock"),
      0,
    ],
    ["invalid UTF-8", Buffer.alloc(0), Buffer.from([0xff, 0x0a]), 0],
    [
      "nonempty stdout",
      Buffer.from("x"),
      Buffer.from("no server running on /sentinel/stale.sock\n"),
      0,
    ],
    ["stderr overflow", Buffer.alloc(0), Buffer.alloc(65_536, 0x61), 1],
  ] as const)(
    "rejects no-server near miss: %s",
    async (_name, stdout, stderr, stderrExtra) => {
      const runner = new InventoryRunner(
        result(
          stdout,
          1,
          stdout.byteLength,
          stderr,
          stderr.byteLength + stderrExtra,
        ),
      );
      const tmux = createLivePorts(runner, async () => identity).tmux;
      await expect(
        tmux.inventoryServerResources?.({
          socketPath: "/sentinel/stale.sock",
          cwd: "/tmp",
        }),
      ).rejects.toMatchObject({
        code: "TMUX_CONTEXT_REFUSED",
        details: { reason: "unavailable-proof" },
      });
    },
  );

  it.each([
    ["timeout", new Error("2001ms timeout"), [identity, identity]],
    [
      "nonzero",
      result(Buffer.alloc(0), 1, 0, Buffer.from("server exited\n")),
      [identity, identity],
    ],
    ["malformed", result(Buffer.from([0xff, 0x0a])), [identity, identity]],
    [
      "65537 bytes",
      result(Buffer.alloc(65_536, 0x61), 0, 65_537),
      [identity, identity],
    ],
    [
      "1025 records",
      result(Buffer.from("x\n".repeat(1_025))),
      [identity, identity],
    ],
    ["EACCES identity", result(), [nodeError("EACCES")]],
    ["post-query identity loss", result(), [identity, nodeError("ENOENT")]],
    ["socket replacement", result(), [identity, { device: "1", inode: "3" }]],
  ] as const)(
    "returns value-free unavailable proof for %s",
    async (name, response, identities) => {
      const runner = new InventoryRunner(response);
      let read = 0;
      const tmux = createLivePorts(runner, async () => {
        const next = identities[read++] as TmuxSocketIdentityV1 | Error;
        if (next instanceof Error) throw next;
        return next;
      }).tmux;
      const inventory = tmux.inventoryServerResources?.bind(tmux);
      let failure: unknown;
      try {
        await inventory?.({
          socketPath: "/sentinel/selected.sock",
          cwd: "/sentinel/cwd",
        });
      } catch (cause) {
        failure = cause;
      }
      expect(failure).toMatchObject({
        code: "TMUX_CONTEXT_REFUSED",
        details: { reason: "unavailable-proof" },
      });
      expect(JSON.stringify(failure)).not.toContain("sentinel");
      if (name === "EACCES identity") expect(runner.calls).toHaveLength(0);
      else {
        expect(runner.calls).toHaveLength(1);
        expect(runner.calls[0]).toMatchObject({
          executable: "tmux",
          args: [
            "-S",
            "/sentinel/selected.sock",
            "list-panes",
            "-a",
            "-F",
            expect.any(String),
          ],
          timeoutMs: 2_000,
          shell: false,
          retention: 65_536,
        });
      }
    },
  );

  it("drains and counts overflow while retaining at most 65536 bytes per stream", async () => {
    const directory = await fs.mkdtemp(
      path.join(os.tmpdir(), "sf-inventory-cap-"),
    );
    try {
      const execution = await new CommandExecutor().run(
        process.execPath,
        [
          "-e",
          "process.stdout.write(Buffer.alloc(65537, 97)); process.stderr.write(Buffer.alloc(65538, 98))",
        ],
        directory,
        2_000,
        false,
        65_536,
      );
      expect(execution.stdoutByteCount).toBe(65_537);
      expect(execution.stdoutBuffer.byteLength).toBe(65_536);
      expect(execution.stderrByteCount).toBe(65_538);
      expect(execution.stderrBuffer.byteLength).toBe(65_536);
    } finally {
      await fs.rm(directory, { recursive: true, force: true });
    }
  });
});
