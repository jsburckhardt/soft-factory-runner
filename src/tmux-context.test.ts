import { execFile, spawn } from "node:child_process";
import * as fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { RepositoryIdentity } from "./domain";
import type { TmuxPort } from "./ports";
import { classifyDoctorTmuxTargeting } from "./doctor-service";
import {
  CommandExecutor,
  createLivePorts,
  type CommandResult,
  type CommandRunner,
} from "./live";
import {
  deriveStandaloneTmuxTarget,
  parseExactTargetRecord,
  parseInvokingTmuxEvidence,
  tmuxContextRefusal,
} from "./tmux-target";

describe("Issue 42 strict exact dead-pane records", () => {
  const live = "/tmp/owned.sock|$1|owned|@2|42|%3|0|/repo/.trees/42\n";
  const dead = "/tmp/owned.sock|$1|owned|@2|42|%3|1|\n";

  it("parses one complete live or dead record without process authority", () => {
    expect(parseExactTargetRecord(Buffer.from(live))).toMatchObject({
      paneDead: false,
      cwd: "/repo/.trees/42",
    });
    expect(parseExactTargetRecord(Buffer.from(dead))).toMatchObject({
      paneDead: true,
      cwd: "",
    });
  });

  it.each([
    dead + dead,
    dead.trimEnd(),
    dead.replace("|1|\n", "|true|\n"),
    dead.replace("|1|\n", "|1|/stale\n"),
    live.replace("|0|/repo", "|0|").replace("/.trees/42", ""),
    live.replace("%3", "%other"),
    Buffer.concat([Buffer.from(dead.slice(0, -1)), Buffer.from([0xff, 0x0a])]),
  ])("refuses malformed or contradictory exact records %#", (row) => {
    expect(() =>
      parseExactTargetRecord(Buffer.isBuffer(row) ? row : Buffer.from(row)),
    ).toThrow();
  });
});

const execute = promisify(execFile);
function commandResult(stdout: string, exitCode = 0): CommandResult {
  const stdoutBuffer = Buffer.from(stdout);
  return {
    exitCode,
    signal: null,
    stdout,
    stderr: "",
    stdoutBuffer,
    stderrBuffer: Buffer.alloc(0),
    stdoutByteCount: stdoutBuffer.length,
    stderrByteCount: 0,
  };
}
class ResolverRunner implements CommandRunner {
  public readonly calls: readonly string[][] = [];
  public constructor(private readonly response: CommandResult) {}
  public async run(
    _executable: string,
    args: readonly string[],
  ): Promise<CommandResult> {
    (this.calls as string[][]).push([...args]);
    return this.response;
  }
  public runInherited(): Promise<CommandResult> {
    throw new Error("not used");
  }
}
class RecordingExecutor implements CommandRunner {
  public readonly calls: readonly string[][] = [];
  private readonly delegate = new CommandExecutor();
  public run(
    executable: string,
    args: readonly string[],
    cwd: string,
    timeoutMs: number,
    shell?: false,
    stdoutRetentionBytes?: number,
  ): Promise<CommandResult> {
    (this.calls as string[][]).push([...args]);
    return this.delegate.run(
      executable,
      args,
      cwd,
      timeoutMs,
      shell,
      stdoutRetentionBytes,
    );
  }
  public runInherited(
    executable: string,
    args: readonly string[],
    cwd: string,
  ): Promise<CommandResult> {
    return this.delegate.runInherited(executable, args, cwd);
  }
}

class AttachProbeRunner implements CommandRunner {
  public selectedAtAttachment: string | null = null;
  public async run(
    executable: string,
    args: readonly string[],
  ): Promise<CommandResult> {
    try {
      const completed = await execute(executable, [...args]);
      return commandResult(completed.stdout);
    } catch (cause) {
      const failure = cause as {
        code?: number;
        stdout?: string;
        stderr?: string;
      };
      const stdout = failure.stdout ?? "";
      const result = commandResult(
        stdout,
        typeof failure.code === "number" ? failure.code : 1,
      );
      return {
        ...result,
        stderr: failure.stderr ?? "",
        stderrBuffer: Buffer.from(failure.stderr ?? ""),
        stderrByteCount: Buffer.byteLength(failure.stderr ?? ""),
      };
    }
  }
  public async runInherited(
    _executable: string,
    args: readonly string[],
  ): Promise<CommandResult> {
    const socketIndex = args.indexOf("-S");
    const socket = args[socketIndex + 1];
    if (socket === undefined)
      throw new Error("attachment omitted socket selector");
    this.selectedAtAttachment = (
      await execute("tmux", [
        "-S",
        socket,
        "display-message",
        "-p",
        "#{window_id}|#{pane_id}",
      ])
    ).stdout.trim();
    return commandResult("");
  }
}

const repository: RepositoryIdentity = {
  nameWithOwner: "owner/repo",
  normalizedName: "owner-repo",
};

describe("Issue 36 exact tmux context resolver", () => {
  it("derives repeatable collision-resistant standalone targets", () => {
    expect(deriveStandaloneTmuxTarget(repository)).toEqual(
      deriveStandaloneTmuxTarget(repository),
    );
    const first = deriveStandaloneTmuxTarget({
      nameWithOwner: "a-b/c",
      normalizedName: "a-b-c",
    });
    const second = deriveStandaloneTmuxTarget({
      nameWithOwner: "a/b-c",
      normalizedName: "a-b-c",
    });
    expect(first.sessionName).not.toBe(second.sessionName);
    expect(first.socketPath).not.toBe(second.socketPath);
  });

  it.each([
    [{ tmux: "sentinel", tmuxPane: null }, "partial-evidence"],
    [{ tmux: null, tmuxPane: "%1" }, "partial-evidence"],
    [{ tmux: "relative,12,0", tmuxPane: "%1" }, "malformed-evidence"],
    [{ tmux: "/tmp/socket,0,0", tmuxPane: "%1" }, "malformed-evidence"],
    [{ tmux: "/tmp/socket,12,0", tmuxPane: "bad" }, "malformed-evidence"],
  ] as const)(
    "refuses invalid evidence value-free before a query",
    (evidence, reason) => {
      expect(() => parseInvokingTmuxEvidence(evidence)).toThrow(
        expect.objectContaining({
          code: "TMUX_CONTEXT_REFUSED",
          details: { reason },
        }),
      );
      try {
        parseInvokingTmuxEvidence(evidence);
      } catch (cause) {
        expect(JSON.stringify(cause)).not.toContain("sentinel");
      }
    },
  );

  it("selects standalone absence without contacting tmux and closes malformed records", async () => {
    const runner = new ResolverRunner(commandResult("unused"));
    await expect(
      createLivePorts(runner).tmux.selectTarget?.({
        evidence: { tmux: null, tmuxPane: null },
        repository,
      }),
    ).resolves.toMatchObject({ selectionMode: "standalone", sessionId: null });
    expect(runner.calls).toEqual([]);
    const directory = await fs.mkdtemp(
      path.join(os.tmpdir(), "sf-malformed-target-"),
    );
    const socket = path.join(directory, "socket");
    await fs.writeFile(socket, "fixture");
    try {
      for (const [record, reason] of [
        ["unterminated", "unavailable-proof"],
        ["a|b\nextra\n", "ambiguous-session"],
        [`${socket}|bad|session|@1|origin|%1|/tmp\n`, "contradictory-target"],
        [`${socket}|$1|session|@1|origin|%1|\n`, "unavailable-proof"],
      ] as const) {
        const malformed = new ResolverRunner(commandResult(record));
        await expect(
          createLivePorts(malformed).tmux.selectTarget?.({
            evidence: { tmux: `${socket},12,0`, tmuxPane: "%1" },
            repository,
          }),
        ).rejects.toMatchObject({
          code: "TMUX_CONTEXT_REFUSED",
          details: { reason },
        });
      }
    } finally {
      await fs.rm(directory, { recursive: true, force: true });
    }
  });

  it("refuses a stopped invoking socket before any command", async () => {
    const runner = new ResolverRunner(commandResult("unused"));
    await expect(
      createLivePorts(runner).tmux.selectTarget?.({
        evidence: {
          tmux: "/tmp/soft-factory-definitely-absent.sock,12,0",
          tmuxPane: "%1",
        },
        repository,
      }),
    ).rejects.toMatchObject({
      code: "TMUX_CONTEXT_REFUSED",
      details: { reason: "stale-server" },
    });
    expect(runner.calls).toEqual([]);
  });

  it("publishes one direct scenario-ledger row for AC-1 through AC-14", async () => {
    const ledger = JSON.parse(
      await fs.readFile(
        path.join(process.cwd(), "fixtures/tmux/issue-36-scenarios.json"),
        "utf8",
      ),
    ) as {
      schemaVersion: number;
      issue: number;
      isolation: { credentials: boolean; network: boolean; cleanup: string };
      scenarios: Array<{
        acceptance: string;
        fixture: string;
        assertions: string[];
      }>;
    };
    expect(ledger).toMatchObject({
      schemaVersion: 2,
      issue: 36,
      isolation: { credentials: false, network: false },
    });
    expect(ledger.scenarios.map((row) => row.acceptance)).toEqual(
      Array.from({ length: 14 }, (_, index) => `AC-${index + 1}`),
    );
    expect(
      ledger.scenarios.every(
        (row) =>
          row.fixture === "src/tmux-context.test.ts" &&
          row.assertions.length > 0 &&
          row.assertions.every((assertion) => assertion.length > 20),
      ),
    ).toBe(true);
  });

  it("validates one custom-socket record and discards tuple PID", async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), "sf-resolver-"));
    const socket = path.join(directory, "socket");
    await fs.writeFile(socket, "fixture");
    const runner = new ResolverRunner(
      commandResult(`${socket}|$1|session|@1|origin|%1|${directory}\n`),
    );
    try {
      const selected = await createLivePorts(runner).tmux.selectTarget?.({
        evidence: { tmux: `${socket},987654,0`, tmuxPane: "%1" },
        repository,
      });
      expect(selected).toMatchObject({
        selectionMode: "invoking",
        sessionId: "$1",
        sessionName: "session",
      });
      expect(JSON.stringify(selected)).not.toContain("987654");
      expect(runner.calls).toEqual([
        [
          "-S",
          socket,
          "display-message",
          "-p",
          "-t",
          "%1",
          "-F",
          expect.any(String),
        ],
      ]);
    } finally {
      await fs.rm(directory, { recursive: true, force: true });
    }
  });

  it("classifies Doctor modes with closed value-free evidence", async () => {
    const fallback = await classifyDoctorTmuxTargeting(
      {
        selectTarget: async () => deriveStandaloneTmuxTarget(repository),
      } as never,
      { tmux: null, tmuxPane: null },
      repository.nameWithOwner,
      async () => ({ ambient: Buffer.from("a"), unrelated: Buffer.from("u") }),
    );
    expect(fallback).toMatchObject({
      mode: "standalone-fallback",
      reason: null,
      ambientUnchanged: true,
    });
    const invalid = await classifyDoctorTmuxTargeting(
      {
        selectTarget: async () => {
          throw tmuxContextRefusal("ambiguous-session");
        },
      } as never,
      { tmux: "redacted,1,0", tmuxPane: "%1" },
      repository.nameWithOwner,
      async () => ({ ambient: Buffer.from("a"), unrelated: Buffer.from("u") }),
    );
    expect(invalid).toMatchObject({
      mode: "invalid-context",
      reason: "ambiguous-session",
      unrelatedUnchanged: true,
    });
    expect(JSON.stringify(invalid)).not.toContain("redacted");
    for (const reason of [
      "partial-evidence",
      "malformed-evidence",
      "stale-server",
      "contradictory-target",
      "ambiguous-session",
      "unavailable-proof",
    ] as const) {
      let inventorySamples = 0;
      const classified = await classifyDoctorTmuxTargeting(
        {
          selectTarget: async () => {
            throw tmuxContextRefusal(reason);
          },
        } as never,
        { tmux: "value-never-rendered,1,0", tmuxPane: "%1" },
        repository.nameWithOwner,
        async () => {
          inventorySamples += 1;
          return {
            ambient: Buffer.from("ambient"),
            unrelated: Buffer.from("unrelated"),
          };
        },
      );
      expect(inventorySamples).toBe(2);
      expect(classified).toEqual({
        schemaVersion: 1,
        kind: "tmux-targeting",
        mode: "invalid-context",
        reason,
        bounded: true,
        inventoryMeasured: true,
        ambientUnchanged: true,
        unrelatedUnchanged: true,
      });
      expect(JSON.stringify(classified)).not.toContain("value-never-rendered");
    }
    let samples = 0;
    const changed = await classifyDoctorTmuxTargeting(
      {
        selectTarget: async () => deriveStandaloneTmuxTarget(repository),
      } as never,
      { tmux: null, tmuxPane: null },
      repository.nameWithOwner,
      async () => ({
        ambient: Buffer.from(samples++ === 0 ? "before" : "after"),
        unrelated: Buffer.from("stable"),
      }),
    );
    expect(samples).toBe(2);
    expect(changed).toMatchObject({
      inventoryMeasured: true,
      ambientUnchanged: false,
      unrelatedUnchanged: true,
    });
  });

  it("repeats a real custom server with a stale default socket and cleans every owned resource", async () => {
    const projections: unknown[] = [];
    for (let repetition = 0; repetition < 2; repetition += 1) {
      const directory = await fs.mkdtemp(
        path.join(os.tmpdir(), "sf-issue-40-live-"),
      );
      const tmuxRoot = path.join(directory, "tmux-root");
      const uid = typeof process.getuid === "function" ? process.getuid() : 0;
      const defaultSocket = path.join(tmuxRoot, `tmux-${uid}`, "default");
      const customSocket = path.join(directory, "custom.sock");
      const priorTmuxTmpdir = process.env.TMUX_TMPDIR;
      process.env.TMUX_TMPDIR = tmuxRoot;
      try {
        await fs.mkdir(path.dirname(defaultSocket), { recursive: true });
        await execute("tmux", [
          "-S",
          customSocket,
          "new-session",
          "-d",
          "-s",
          "custom",
          "-n",
          "origin",
          "-c",
          directory,
          "node",
          "-e",
          "setInterval(() => {}, 1000)",
        ]);
        const pane = (
          await execute("tmux", [
            "-S",
            customSocket,
            "display-message",
            "-p",
            "-t",
            "custom:origin",
            "#{pane_id}",
          ])
        ).stdout.trim();
        const staleOwner = spawn(
          process.execPath,
          [
            "-e",
            'const net=require("node:net");const server=net.createServer();server.listen(process.argv[1],()=>process.send("ready"));setInterval(()=>{},1000);',
            defaultSocket,
          ],
          { stdio: ["ignore", "ignore", "ignore", "ipc"] },
        );
        await new Promise<void>((resolve, reject) => {
          staleOwner.once("message", () => resolve());
          staleOwner.once("error", reject);
          staleOwner.once("exit", (code) =>
            reject(new Error(`stale owner exited before readiness: ${code}`)),
          );
        });
        staleOwner.kill("SIGKILL");
        await new Promise<void>((resolve) =>
          staleOwner.once("close", () => resolve()),
        );
        const staleBefore = await fs.stat(defaultSocket);
        expect(staleBefore.isSocket()).toBe(true);

        const direct = new CommandExecutor();
        const customQuery = await direct.run(
          "tmux",
          ["-S", customSocket, "list-panes", "-a"],
          directory,
          2_000,
          false,
          65_536,
        );
        expect(customQuery.exitCode).toBe(0);
        const staleQuery = await direct.run(
          "tmux",
          ["-S", defaultSocket, "list-panes", "-a"],
          directory,
          2_000,
          false,
          65_536,
        );
        expect(staleQuery).toMatchObject({
          exitCode: 1,
          stdoutByteCount: 0,
          stderrByteCount: Buffer.byteLength(
            `no server running on ${defaultSocket}\n`,
          ),
        });
        expect(staleQuery.stderrBuffer).toEqual(
          Buffer.from(`no server running on ${defaultSocket}\n`),
        );

        const commands = new RecordingExecutor();
        const liveTmux = createLivePorts(commands).tmux;
        const inventory = liveTmux.inventoryServerResources?.bind(liveTmux);
        if (inventory === undefined) throw new Error("inventory unavailable");
        const customBefore = await inventory({
          socketPath: customSocket,
          cwd: directory,
        });
        const evidence = await classifyDoctorTmuxTargeting(
          liveTmux,
          { tmux: `${customSocket},12345,0`, tmuxPane: pane },
          repository.nameWithOwner,
        );
        const customAfter = await inventory({
          socketPath: customSocket,
          cwd: directory,
        });
        const staleAfter = await fs.stat(defaultSocket);
        expect(evidence).toEqual({
          schemaVersion: 1,
          kind: "tmux-targeting",
          mode: "invoking-valid",
          reason: null,
          bounded: true,
          inventoryMeasured: true,
          ambientUnchanged: true,
          unrelatedUnchanged: true,
        });
        expect(customAfter).toEqual(customBefore);
        expect({ device: staleAfter.dev, inode: staleAfter.ino }).toEqual({
          device: staleBefore.dev,
          inode: staleBefore.ino,
        });
        expect(
          commands.calls.every((args) =>
            ["display-message", "list-panes"].includes(args[2] ?? ""),
          ),
        ).toBe(true);
        projections.push(evidence);
      } finally {
        if (priorTmuxTmpdir === undefined) delete process.env.TMUX_TMPDIR;
        else process.env.TMUX_TMPDIR = priorTmuxTmpdir;
        await execute("tmux", ["-S", customSocket, "kill-server"]).catch(
          () => undefined,
        );
        await fs.rm(directory, { recursive: true, force: true });
        await expect(fs.stat(directory)).rejects.toMatchObject({
          code: "ENOENT",
        });
      }
    }
    expect(projections[1]).toEqual(projections[0]);
  });

  it("detects actual server-resource changes that leave socket-directory entries unchanged", async () => {
    const directory = await fs.mkdtemp(
      path.join(os.tmpdir(), "sf-doctor-inventory-"),
    );
    const tmuxRoot = path.join(directory, "tmux-root");
    const uid = typeof process.getuid === "function" ? process.getuid() : 0;
    const defaultSocket = path.join(tmuxRoot, `tmux-${uid}`, "default");
    const customSocket = path.join(directory, "custom.sock");
    const helper = ["node", "-e", "setInterval(() => {}, 1000)"];
    const priorTmuxTmpdir = process.env.TMUX_TMPDIR;
    process.env.TMUX_TMPDIR = tmuxRoot;
    await fs.mkdir(path.dirname(defaultSocket), { recursive: true });
    try {
      for (const [socket, session] of [
        [customSocket, "custom"],
        [defaultSocket, "default"],
      ] as const)
        await execute("tmux", [
          "-S",
          socket,
          "new-session",
          "-d",
          "-s",
          session,
          "-n",
          "origin",
          "-c",
          directory,
          ...helper,
        ]);
      const pane = (
        await execute("tmux", [
          "-S",
          customSocket,
          "display-message",
          "-p",
          "-t",
          "custom:origin",
          "#{pane_id}",
        ])
      ).stdout.trim();
      const directoryEntriesBefore = await fs.readdir(tmuxRoot, {
        recursive: true,
      });
      const liveTmux = createLivePorts().tmux;
      const inventoryServerResources =
        liveTmux.inventoryServerResources?.bind(liveTmux);
      const selectTarget = liveTmux.selectTarget?.bind(liveTmux);
      if (inventoryServerResources === undefined || selectTarget === undefined)
        throw new Error("live tmux targeting inventory is unavailable");
      const evidence = await classifyDoctorTmuxTargeting(
        {
          inventoryServerResources,
          selectTarget: async (input) => {
            const selected = await selectTarget(input);
            await execute("tmux", [
              "-S",
              defaultSocket,
              "new-window",
              "-d",
              "-n",
              "changed-without-new-socket",
              "-c",
              directory,
              ...helper,
            ]);
            return selected;
          },
        } as TmuxPort,
        { tmux: `${customSocket},12345,0`, tmuxPane: pane },
        repository.nameWithOwner,
      );
      expect(evidence).toMatchObject({
        mode: "invoking-valid",
        inventoryMeasured: true,
        ambientUnchanged: true,
        unrelatedUnchanged: false,
      });
      expect(await fs.readdir(tmuxRoot, { recursive: true })).toEqual(
        directoryEntriesBefore,
      );
      expect(JSON.stringify(evidence)).not.toContain(customSocket);
      expect(JSON.stringify(evidence)).not.toContain(defaultSocket);
    } finally {
      if (priorTmuxTmpdir === undefined) delete process.env.TMUX_TMPDIR;
      else process.env.TMUX_TMPDIR = priorTmuxTmpdir;
      for (const socket of [customSocket, defaultSocket])
        await execute("tmux", ["-S", socket, "kill-server"]).catch(
          () => undefined,
        );
      await fs.rm(directory, { recursive: true, force: true });
    }
  });
});

describe("Issue 36 isolated custom-socket acceptance", () => {
  it("completes the custom-socket target lifecycle with no default-server issue window", async () => {
    const directory = await fs.mkdtemp(
      path.join(os.tmpdir(), "sf-isolated-tmux-"),
    );
    const selectedSocket = path.join(directory, "selected.sock");
    const defaultSocket = path.join(directory, "default.sock");
    const helper = ["node", "-e", "setInterval(() => {}, 1000)"];
    const tmux = createLivePorts().tmux;
    try {
      await execute("tmux", [
        "-S",
        selectedSocket,
        "new-session",
        "-d",
        "-s",
        "same",
        "-n",
        "origin",
        "-c",
        directory,
        ...helper,
      ]);
      await execute("tmux", [
        "-S",
        defaultSocket,
        "new-session",
        "-d",
        "-s",
        "same",
        "-n",
        "origin",
        "-c",
        directory,
        ...helper,
      ]);
      const pane = (
        await execute("tmux", [
          "-S",
          selectedSocket,
          "display-message",
          "-p",
          "-t",
          "same:origin",
          "#{pane_id}",
        ])
      ).stdout.trim();
      const beforeDefault = (
        await execute("tmux", [
          "-S",
          defaultSocket,
          "list-windows",
          "-F",
          "#{window_id}|#{window_name}",
        ])
      ).stdout;
      const selected = await tmux.selectTarget?.({
        evidence: { tmux: `${selectedSocket},12345,0`, tmuxPane: pane },
        repository,
      });
      if (selected === undefined) throw new Error("selection unavailable");
      const created = await tmux.createIssueWindow({
        target: selected,
        windowName: "36",
        cwd: directory,
        executable: helper[0],
        args: helper.slice(1),
      });
      const raw = await execute("tmux", [
        "-S",
        selectedSocket,
        "display-message",
        "-p",
        "-t",
        created.paneId,
        "-F",
        "#{socket_path}|#{session_id}|#{session_name}|#{window_id}|#{window_name}|#{pane_id}|#{pane_current_path}",
      ]);
      expect(raw.stdout).toBe(
        `${selectedSocket}|${created.sessionId}|same|${created.windowId}|36|${created.paneId}|${directory}\n`,
      );
      const selectedInventory = (
        await execute("tmux", [
          "-S",
          selectedSocket,
          "list-panes",
          "-a",
          "-F",
          "#{session_id}|#{window_id}|#{window_name}|#{pane_id}",
        ])
      ).stdout;
      expect(
        selectedInventory.split("\n").filter((line) => line.includes("|36|")),
      ).toEqual([
        `${created.sessionId}|${created.windowId}|36|${created.paneId}`,
      ]);
      expect(await tmux.observe(created)).toEqual({
        state: "live",
        target: created,
      });
      await tmux.removeWindow(created);
      expect(await tmux.observe(created)).toBeNull();
      const afterDefault = (
        await execute("tmux", [
          "-S",
          defaultSocket,
          "list-windows",
          "-F",
          "#{window_id}|#{window_name}",
        ])
      ).stdout;
      expect(afterDefault).toBe(beforeDefault);
      expect(afterDefault).not.toContain("|36");
    } finally {
      for (const socket of [selectedSocket, defaultSocket])
        await execute("tmux", ["-S", socket, "kill-server"]).catch(
          () => undefined,
        );
      await fs.rm(directory, { recursive: true, force: true });
    }
  });
  it("owns deterministic standalone resources and refuses same-name adoption", async () => {
    const directory = await fs.mkdtemp(
      path.join(os.tmpdir(), "sf-standalone-tmux-"),
    );
    const uniqueRepository: RepositoryIdentity = {
      nameWithOwner: `owner/${path.basename(directory)}`,
      normalizedName: path.basename(directory),
    };
    const tmux = createLivePorts().tmux;
    const selected = await tmux.selectTarget?.({
      evidence: { tmux: null, tmuxPane: null },
      repository: uniqueRepository,
    });
    if (selected === undefined) throw new Error("selection unavailable");
    const helper = ["node", "-e", "setInterval(() => {}, 1000)"];
    try {
      const created = await tmux.createIssueWindow({
        target: selected,
        windowName: "36",
        cwd: directory,
        executable: helper[0],
        args: helper.slice(1),
      });
      const before = (
        await execute("tmux", [
          "-S",
          created.socketPath,
          "list-windows",
          "-F",
          "#{window_id}|#{window_name}",
        ])
      ).stdout;
      await expect(
        tmux.createIssueWindow({
          target: {
            ...selected,
            socketIdentity: created.socketIdentity,
            sessionId: created.sessionId,
          },
          windowName: "36",
          cwd: directory,
          executable: helper[0],
          args: helper.slice(1),
        }),
      ).rejects.toMatchObject({ code: "RESOURCE_OWNERSHIP_UNKNOWN" });
      expect(
        (
          await execute("tmux", [
            "-S",
            created.socketPath,
            "list-windows",
            "-F",
            "#{window_id}|#{window_name}",
          ])
        ).stdout,
      ).toBe(before);
      await tmux.removeWindow(created);
    } finally {
      await execute("tmux", ["-S", selected.socketPath, "kill-server"]).catch(
        () => undefined,
      );
      await fs.rm(selected.socketPath + ".owner.json", { force: true });
      await fs.rm(directory, { recursive: true, force: true });
    }
  });

  it("proves sequential clean standalone runs and distinct repository targets", async () => {
    const directory = await fs.mkdtemp(
      path.join(os.tmpdir(), "sf-fallback-repeat-"),
    );
    const helper = ["node", "-e", "setInterval(() => {}, 1000)"];
    const tmux = createLivePorts().tmux;
    const sameRepository: RepositoryIdentity = {
      nameWithOwner: `owner/${path.basename(directory)}`,
      normalizedName: path.basename(directory),
    };
    const distinctRepository: RepositoryIdentity = {
      nameWithOwner: `other/${path.basename(directory)}-other`,
      normalizedName: `${path.basename(directory)}-other`,
    };
    const targets = [];
    const initial = deriveStandaloneTmuxTarget(sameRepository);
    await execute("tmux", ["-S", initial.socketPath, "kill-server"]).catch(
      () => undefined,
    );
    await fs.rm(initial.socketPath + ".owner.json", { force: true });
    await fs.rm(initial.socketPath, { force: true });
    try {
      for (let cycle = 0; cycle < 2; cycle += 1) {
        const selected = await tmux.selectTarget?.({
          evidence: { tmux: null, tmuxPane: null },
          repository: sameRepository,
        });
        if (selected === undefined) throw new Error("selection unavailable");
        targets.push({
          socketPath: selected.socketPath,
          sessionName: selected.sessionName,
        });
        const created = await tmux.createIssueWindow({
          target: selected,
          windowName: "36",
          cwd: directory,
          executable: helper[0],
          args: helper.slice(1),
        });
        await tmux.removeWindow(created);
        await execute("tmux", ["-S", selected.socketPath, "kill-server"]);
        await fs.rm(selected.socketPath + ".owner.json", { force: true });
        await fs.rm(selected.socketPath, { force: true });
      }
      expect(targets[1]).toEqual(targets[0]);
      const different = deriveStandaloneTmuxTarget(distinctRepository);
      expect(different.socketPath).not.toBe(targets[0]?.socketPath);
      expect(different.sessionName).not.toBe(targets[0]?.sessionName);
    } finally {
      for (const target of targets) {
        await execute("tmux", ["-S", target.socketPath, "kill-server"]).catch(
          () => undefined,
        );
        await fs.rm(target.socketPath + ".owner.json", { force: true });
        await fs.rm(target.socketPath, { force: true });
      }
      await fs.rm(directory, { recursive: true, force: true });
    }
  });

  it("keeps identical persisted names isolated across two servers and exact cleanup", async () => {
    const directory = await fs.mkdtemp(
      path.join(os.tmpdir(), "sf-twin-targets-"),
    );
    const sockets = [
      path.join(directory, "one.sock"),
      path.join(directory, "two.sock"),
    ];
    const tmux = createLivePorts().tmux;
    const targets = [];
    const inventory = async (socket: string): Promise<string> =>
      (
        await execute("tmux", [
          "-S",
          socket,
          "list-panes",
          "-a",
          "-F",
          "#{session_name}|#{window_name}|#{window_id}|#{pane_id}",
        ])
      ).stdout;
    try {
      for (const [index, socket] of sockets.entries()) {
        await execute("tmux", [
          "-S",
          socket,
          "new-session",
          "-d",
          "-s",
          "same",
          "-n",
          "origin",
          "-c",
          directory,
          "node",
          "-e",
          "setInterval(() => {}, 1000)",
        ]);
        const pane = (
          await execute("tmux", [
            "-S",
            socket,
            "display-message",
            "-p",
            "-t",
            "same:origin",
            "#{pane_id}",
          ])
        ).stdout.trim();
        const selected = await tmux.selectTarget?.({
          evidence: { tmux: `${socket},${100 + index},0`, tmuxPane: pane },
          repository,
        });
        if (selected === undefined) throw new Error("selection unavailable");
        targets.push(
          await tmux.createIssueWindow({
            target: selected,
            windowName: "36",
            cwd: directory,
            executable: "sh",
            args: ["-c", `printf twin-${index}; sleep 30`],
          }),
        );
      }
      expect(targets[0]?.sessionName).toBe(targets[1]?.sessionName);
      expect(targets[0]?.windowName).toBe(targets[1]?.windowName);
      const secondBefore = await inventory(sockets[1] as string);
      const firstLog = await tmux.capturePane(
        targets[0] as NonNullable<(typeof targets)[number]>,
        4096,
      );
      const secondLog = await tmux.capturePane(
        targets[1] as NonNullable<(typeof targets)[number]>,
        4096,
      );
      expect(firstLog.content).toContain("twin-0");
      expect(firstLog.content).not.toContain("twin-1");
      expect(secondLog.content).toContain("twin-1");
      await tmux.removeWindow(
        targets[0] as NonNullable<(typeof targets)[number]>,
      );
      expect(
        await tmux.observe(targets[0] as NonNullable<(typeof targets)[number]>),
      ).toBeNull();
      expect(await inventory(sockets[1] as string)).toBe(secondBefore);
      expect(
        await tmux.observe(targets[1] as NonNullable<(typeof targets)[number]>),
      ).toEqual({ state: "live", target: targets[1] });
    } finally {
      for (const socket of sockets)
        await execute("tmux", ["-S", socket, "kill-server"]).catch(
          () => undefined,
        );
      await fs.rm(directory, { recursive: true, force: true });
    }
  });

  it("refuses the complete invalid-context matrix with byte-identical state and server inventories", async () => {
    const directory = await fs.mkdtemp(
      path.join(os.tmpdir(), "sf-invalid-matrix-"),
    );
    const sockets = [
      path.join(directory, "ambient.sock"),
      path.join(directory, "unrelated.sock"),
    ];
    const statePath = path.join(directory, "run-state.json");
    const inventory = async (): Promise<Buffer> => {
      const parts = [await fs.readFile(statePath)];
      for (const socket of sockets)
        parts.push(
          Buffer.from(
            (
              await execute("tmux", [
                "-S",
                socket,
                "list-panes",
                "-a",
                "-F",
                "#{session_id}|#{window_id}|#{pane_id}",
              ])
            ).stdout,
          ),
        );
      return Buffer.concat(parts);
    };
    try {
      await fs.writeFile(statePath, Buffer.from("unchanged-run-state\n"));
      for (const socket of sockets)
        await execute("tmux", [
          "-S",
          socket,
          "new-session",
          "-d",
          "-s",
          "tripwire",
          "-n",
          "sentinel",
          "node",
          "-e",
          "setInterval(() => {}, 1000)",
        ]);
      const pane = (
        await execute("tmux", [
          "-S",
          sockets[0] as string,
          "display-message",
          "-p",
          "-t",
          "tripwire:sentinel",
          "#{pane_id}",
        ])
      ).stdout.trim();
      const valid = `${sockets[0]}|$1|tripwire|@1|sentinel|${pane}|${directory}\n`;
      const rows = [
        { evidence: { tmux: "malformed", tmuxPane: pane }, response: valid },
        {
          evidence: {
            tmux: path.join(directory, "stopped.sock") + ",1,0",
            tmuxPane: pane,
          },
          response: valid,
        },
        {
          evidence: { tmux: `${sockets[0]},1,0`, tmuxPane: pane },
          response: valid + valid,
        },
        {
          evidence: { tmux: `${sockets[0]},1,0`, tmuxPane: "%999" },
          response: valid,
        },
        {
          evidence: { tmux: `${sockets[0]},1,0`, tmuxPane: pane },
          response: "unresolvable\n",
        },
      ] as const;
      for (const row of rows) {
        const before = await inventory();
        const runner = new ResolverRunner(commandResult(row.response));
        let machineCode = "";
        try {
          await createLivePorts(runner).tmux.selectTarget?.({
            evidence: row.evidence,
            repository,
          });
        } catch (cause) {
          machineCode = (cause as { code?: string }).code ?? "";
        }
        expect(machineCode).toBe("TMUX_CONTEXT_REFUSED");
        expect(await inventory()).toEqual(before);
      }
    } finally {
      for (const socket of sockets)
        await execute("tmux", ["-S", socket, "kill-server"]).catch(
          () => undefined,
        );
      await fs.rm(directory, { recursive: true, force: true });
    }
  });

  it("proves a real isolated remain-on-exit dead pane twice and retains its final transcript", async () => {
    const normalized: unknown[] = [];
    for (let run = 0; run < 2; run += 1) {
      const directory = await fs.mkdtemp(
        path.join(os.tmpdir(), "sf-dead-pane-"),
      );
      const socket = path.join(directory, "owned.sock");
      const retained = path.join(directory, "retained.log");
      try {
        await execute("tmux", [
          "-S",
          socket,
          "new-session",
          "-d",
          "-s",
          "owned",
          "-n",
          "anchor",
          "-c",
          directory,
          "node",
          "-e",
          "setInterval(() => {}, 1000)",
        ]);
        const pane = (
          await execute("tmux", [
            "-S",
            socket,
            "display-message",
            "-p",
            "#{pane_id}",
          ])
        ).stdout.trim();
        const tmux = createLivePorts().tmux;
        const selected = await tmux.selectTarget?.({
          evidence: { tmux: socket + ",1,0", tmuxPane: pane },
          repository: {
            nameWithOwner: "owner/dead-proof",
            normalizedName: "owner-dead-proof",
          },
        });
        if (selected === undefined)
          throw new Error("tmux selection unavailable");
        const target = await tmux.createIssueWindow({
          target: selected,
          windowName: "42",
          cwd: directory,
          executable: "node",
          args: [
            "-e",
            'console.log("retained-dead-marker"); setTimeout(() => {}, 300)',
          ],
        });
        await tmux.setRemainOnExit(target);
        let observed: Awaited<ReturnType<typeof tmux.observe>> = null;
        const deadline = Date.now() + 3_000;
        while (observed?.state !== "dead" && Date.now() < deadline) {
          await new Promise((resolve) => setTimeout(resolve, 25));
          try {
            observed = await tmux.observe(target);
          } catch {
            observed = null;
          }
        }
        expect(observed).toEqual({ state: "dead", target });
        const capture = await tmux.capturePane(target, 4096);
        expect(capture.content).toContain("retained-dead-marker");
        await fs.writeFile(retained, capture.content, "utf8");
        await tmux.removeWindow(target);
        expect(await tmux.observe(target)).toBeNull();
        expect(await fs.readFile(retained, "utf8")).toContain(
          "retained-dead-marker",
        );
        normalized.push({
          outcome: "CLEANUP_COMPLETED",
          transitions: ["tmux:present", "tmux:absent"],
          retained: true,
          unrelated: "unchanged",
        });
      } finally {
        await execute("tmux", ["-S", socket, "kill-server"]).catch(
          () => undefined,
        );
        await fs.rm(directory, { recursive: true, force: true });
      }
    }
    expect(normalized[1]).toEqual(normalized[0]);
  });

  it("bounds cleanup overlaps with status and reconciliation to whole-target or absence", async () => {
    const directory = await fs.mkdtemp(
      path.join(os.tmpdir(), "sf-clean-overlap-"),
    );
    const socket = path.join(directory, "owned.sock");
    const unrelated = path.join(directory, "unrelated.sock");
    const observe = async (
      target: import("./tmux-target").TmuxTargetV2,
    ): Promise<string | null> => {
      try {
        return (
          await execute("tmux", [
            "-S",
            target.socketPath,
            "list-panes",
            "-t",
            target.paneId,
            "-F",
            "#{session_id}|#{window_id}|#{pane_id}|#{pane_current_path}",
          ])
        ).stdout;
      } catch {
        return null;
      }
    };
    const tmux = createLivePorts().tmux;
    try {
      for (const current of [socket, unrelated])
        await execute("tmux", [
          "-S",
          current,
          "new-session",
          "-d",
          "-s",
          "same",
          "-n",
          "origin",
          "-c",
          directory,
          "node",
          "-e",
          "setInterval(() => {}, 1000)",
        ]);
      const unrelatedBefore = (
        await execute("tmux", [
          "-S",
          unrelated,
          "list-panes",
          "-a",
          "-F",
          "#{session_id}|#{window_id}|#{pane_id}",
        ])
      ).stdout;
      for (const label of ["status", "reconciliation"] as const) {
        const pane = (
          await execute("tmux", [
            "-S",
            socket,
            "display-message",
            "-p",
            "-t",
            "same:origin",
            "#{pane_id}",
          ])
        ).stdout.trim();
        const selected = await tmux.selectTarget?.({
          evidence: { tmux: `${socket},1,0`, tmuxPane: pane },
          repository,
        });
        if (selected === undefined) throw new Error("selection unavailable");
        const target = await tmux.createIssueWindow({
          target: selected,
          windowName: label,
          cwd: directory,
          executable: "node",
          args: ["-e", "setInterval(() => {}, 1000)"],
        });
        const expected = `${target.sessionId}|${target.windowId}|${target.paneId}|${target.cwd}\n`;
        const overlap = await Promise.race([
          Promise.all([observe(target), tmux.removeWindow(target)]),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("overlap exceeded bound")), 2000),
          ),
        ]);
        expect([expected, null]).toContain(overlap[0]);
        expect(await tmux.observe(target)).toBeNull();
        expect(
          (
            await execute("tmux", [
              "-S",
              unrelated,
              "list-panes",
              "-a",
              "-F",
              "#{session_id}|#{window_id}|#{pane_id}",
            ])
          ).stdout,
        ).toBe(unrelatedBefore);
      }
    } finally {
      for (const current of [socket, unrelated])
        await execute("tmux", ["-S", current, "kill-server"]).catch(
          () => undefined,
        );
      await fs.rm(directory, { recursive: true, force: true });
    }
  });

  it("selects the exact persisted window and pane before live attachment", async () => {
    const directory = await fs.mkdtemp(
      path.join(os.tmpdir(), "sf-live-attach-"),
    );
    const socket = path.join(directory, "attach.sock");
    const runner = new AttachProbeRunner();
    const tmux = createLivePorts(runner).tmux;
    try {
      await execute("tmux", [
        "-S",
        socket,
        "new-session",
        "-d",
        "-s",
        "same",
        "-n",
        "origin",
        "-c",
        directory,
        "node",
        "-e",
        "setInterval(() => {}, 1000)",
      ]);
      const invokingPane = (
        await execute("tmux", [
          "-S",
          socket,
          "display-message",
          "-p",
          "-t",
          "same:origin",
          "#{pane_id}",
        ])
      ).stdout.trim();
      const selected = await tmux.selectTarget?.({
        evidence: { tmux: `${socket},1,0`, tmuxPane: invokingPane },
        repository,
      });
      if (selected === undefined) throw new Error("selection unavailable");
      const target = await tmux.createIssueWindow({
        target: selected,
        windowName: "36",
        cwd: directory,
        executable: "node",
        args: ["-e", "setInterval(() => {}, 1000)"],
      });
      await execute("tmux", [
        "-S",
        socket,
        "split-window",
        "-d",
        "-t",
        target.windowId,
        "node",
        "-e",
        "setInterval(() => {}, 1000)",
      ]);
      await execute("tmux", [
        "-S",
        socket,
        "select-window",
        "-t",
        "same:origin",
      ]);
      expect(
        (
          await execute("tmux", [
            "-S",
            socket,
            "display-message",
            "-p",
            "#{window_id}|#{pane_id}",
          ])
        ).stdout.trim(),
      ).not.toBe(`${target.windowId}|${target.paneId}`);
      await tmux.attach(target);
      expect(runner.selectedAtAttachment).toBe(
        `${target.windowId}|${target.paneId}`,
      );
    } finally {
      await execute("tmux", ["-S", socket, "kill-server"]).catch(
        () => undefined,
      );
      await fs.rm(directory, { recursive: true, force: true });
    }
  });
});
