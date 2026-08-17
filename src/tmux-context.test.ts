import { execFile } from "node:child_process";
import * as fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { RepositoryIdentity } from "./domain";
import { classifyDoctorTmuxTargeting } from "./doctor-service";
import {
  createLivePorts,
  type CommandResult,
  type CommandRunner,
} from "./live";
import {
  deriveStandaloneTmuxTarget,
  parseInvokingTmuxEvidence,
  tmuxContextRefusal,
} from "./tmux-target";

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
      scenarios: Array<{ acceptance: string; evidence: string }>;
    };
    expect(ledger).toMatchObject({ schemaVersion: 1, issue: 36 });
    expect(ledger.scenarios.map((row) => row.acceptance)).toEqual(
      Array.from({ length: 14 }, (_, index) => `AC-${index + 1}`),
    );
    expect(ledger.scenarios.every((row) => row.evidence.length > 0)).toBe(true);
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
    );
    expect(invalid).toMatchObject({
      mode: "invalid-context",
      reason: "ambiguous-session",
      unrelatedUnchanged: true,
    });
    expect(JSON.stringify(invalid)).not.toContain("redacted");
  });
});

describe("Issue 36 isolated custom-socket acceptance", () => {
  it("creates, observes, and removes only the invoking-server window", async () => {
    const directory = await fs.mkdtemp(
      path.join(os.tmpdir(), "sf-isolated-tmux-"),
    );
    const selectedSocket = path.join(directory, "selected.sock");
    const unrelatedSocket = path.join(directory, "unrelated.sock");
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
        unrelatedSocket,
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
      const beforeUnrelated = (
        await execute("tmux", [
          "-S",
          unrelatedSocket,
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
      expect(await tmux.observe(created)).toEqual(created);
      await tmux.removeWindow(created);
      expect(await tmux.observe(created)).toBeNull();
      const afterUnrelated = (
        await execute("tmux", [
          "-S",
          unrelatedSocket,
          "list-windows",
          "-F",
          "#{window_id}|#{window_name}",
        ])
      ).stdout;
      expect(afterUnrelated).toBe(beforeUnrelated);
    } finally {
      for (const socket of [selectedSocket, unrelatedSocket])
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
});
