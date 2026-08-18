import * as fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { CommandResult, CommandRunner } from "./live";
import { createLivePorts } from "./live";
import { isTmuxIdentityDiagnostic } from "./persistence";
import {
  buildTmuxIdentityDiagnostic,
  parseTmuxIdentityResult,
  TMUX_CREATE_IDENTITY_FORMAT,
  TMUX_OBSERVE_IDENTITY_FORMAT,
  TmuxIdentityOutputError,
} from "./tmux-identity";

function result(
  stdout: Buffer | string,
  exitCode = 0,
  stderr: Buffer | string = Buffer.alloc(0),
): CommandResult {
  const stdoutBuffer =
    typeof stdout === "string" ? Buffer.from(stdout, "utf8") : stdout;
  const stderrBuffer =
    typeof stderr === "string" ? Buffer.from(stderr, "utf8") : stderr;
  return {
    exitCode,
    signal: null,
    stdout: stdoutBuffer.toString("utf8"),
    stderr: stderrBuffer.toString("utf8"),
    stdoutBuffer,
    stderrBuffer,
    stdoutByteCount: stdoutBuffer.byteLength,
    stderrByteCount: stderrBuffer.byteLength,
  };
}

class QueueCommandRunner implements CommandRunner {
  public readonly calls: Array<{ readonly args: readonly string[] }> = [];

  public constructor(private readonly results: CommandResult[]) {}

  public async run(
    _executable: string,
    args: readonly string[],
  ): Promise<CommandResult> {
    this.calls.push({ args });
    const next = this.results.shift();
    if (next === undefined)
      throw new Error("controlled result queue exhausted");
    return next;
  }

  public async runInherited(
    executable: string,
    args: readonly string[],
    cwd: string,
  ): Promise<CommandResult> {
    return this.run(executable, args, cwd, 0);
  }
}

function malformed(phase: "create" | "observe", stdout: Buffer | string): void {
  expect(() => parseTmuxIdentityResult(phase, result(stdout))).toThrow(
    expect.objectContaining({
      code: "TMUX_IDENTITY_MALFORMED",
      tmuxIdentityDiagnostic: expect.objectContaining({ phase }),
    }),
  );
}

const createRejections: ReadonlyArray<readonly [string, Buffer | string]> = [
  ["empty output", ""],
  ["missing terminal LF", "@1|%1"],
  ["extra terminal LF", "@1|%1\n\n"],
  ["CRLF", "@1|%1\r\n"],
  ["missing pane field", "@1\n"],
  ["empty window field", "|%1\n"],
  ["empty pane field", "@1|\n"],
  ["extra create field", "@1|%1|extra\n"],
  ["multiple records", "@1|%1\n@2|%2\n"],
  ["invalid window prefix", "1|%1\n"],
  ["partial window identity", "@x|%1\n"],
  ["invalid pane prefix", "@1|1\n"],
  ["partial pane identity", "@1|%x\n"],
  ["legacy horizontal tab", "@1\t%1\n"],
  ["sanitized underscore", "@1_%1\n"],
  ["unsupported colon", "@1:%1\n"],
  ["unsupported C0 separator", Buffer.from("@1\u001f%1\n")],
];

const observeRejections: ReadonlyArray<readonly [string, Buffer | string]> = [
  ["empty output", ""],
  ["missing terminal LF", "@1|%1|/tmp"],
  ["extra terminal LF", "@1|%1|/tmp\n\n"],
  ["CRLF", "@1|%1|/tmp\r\n"],
  ["missing cwd framing", "@1|%1\n"],
  ["missing pane framing", "@1\n"],
  ["empty window field", "|%1|/tmp\n"],
  ["empty pane field", "@1||/tmp\n"],
  ["multiple records", "@1|%1|/tmp\n@2|%2|/var\n"],
  ["invalid window prefix", "1|%1|/tmp\n"],
  ["partial window identity", "@x|%1|/tmp\n"],
  ["invalid pane prefix", "@1|1|/tmp\n"],
  ["partial pane identity", "@1|%x|/tmp\n"],
  ["empty cwd", "@1|%1|\n"],
  [
    "invalid UTF-8 cwd",
    Buffer.from([0x40, 0x31, 0x7c, 0x25, 0x31, 0x7c, 0xc3, 0x28, 0x0a]),
  ],
  ["NUL cwd", Buffer.from("@1|%1|/tmp\u0000name\n")],
  ["legacy horizontal tabs", "@1\t%1\t/tmp\n"],
  ["sanitized underscores", "@1_%1_/tmp\n"],
  ["unsupported colons", "@1:%1:/tmp\n"],
  ["unsupported C0 separators", Buffer.from("@1\u001f%1\u001f/tmp\n")],
];

describe("Issue 31 closed tmux identity byte grammar", () => {
  it("declares exactly the portable printable formats", () => {
    expect(TMUX_CREATE_IDENTITY_FORMAT).toBe("#{window_id}|#{pane_id}");
    expect(TMUX_OBSERVE_IDENTITY_FORMAT).toBe(
      "#{window_id}|#{pane_id}|#{pane_current_path}",
    );
  });

  it("accepts the exact six-byte zero-exit creation record", () => {
    const stdout = Buffer.from([0x40, 0x31, 0x7c, 0x25, 0x31, 0x0a]);
    const command = result(stdout);
    expect(parseTmuxIdentityResult("create", command)).toEqual({
      windowId: "@1",
      paneId: "%1",
      cwd: null,
    });
    expect(command).toMatchObject({
      exitCode: 0,
      stdoutByteCount: 6,
      stderrByteCount: 0,
    });
    expect(stdout.at(-1)).toBe(0x0a);
    expect(stdout.subarray(0, -1).includes(0x0a)).toBe(false);
    expect(stdout.includes(0x09)).toBe(false);
  });

  it("parses only the first two separators and retains UTF-8 cwd bytes", () => {
    const cwd = "/tmp/na|mé|suffix";
    const stdout = Buffer.from(`@12|%34|${cwd}\n`, "utf8");
    const parsed = parseTmuxIdentityResult("observe", result(stdout));
    expect(parsed).toEqual({ windowId: "@12", paneId: "%34", cwd });
    expect(Buffer.from(parsed.cwd ?? "", "utf8")).toEqual(
      stdout.subarray(Buffer.byteLength("@12|%34|"), -1),
    );
  });

  it.each(createRejections)(
    "rejects create %s without a partial identity",
    (_label, bytes) => {
      malformed("create", bytes);
    },
  );

  it.each(observeRejections)(
    "rejects observe %s without a partial identity",
    (_label, bytes) => {
      malformed("observe", bytes);
    },
  );

  it("keeps nonzero commands classified separately with bounded facts", () => {
    expect(() =>
      parseTmuxIdentityResult(
        "create",
        result("secret-output", 1, "secret-stderr"),
      ),
    ).toThrow(
      expect.objectContaining({
        code: "EXTERNAL_COMMAND_FAILED",
        tmuxIdentityDiagnostic: expect.objectContaining({
          exitCode: 1,
          stdoutByteCount: 13,
          stderrByteCount: 13,
        }),
      }),
    );
  });
});

describe("Issue 36 LiveTmuxPort exact selector routing", () => {
  async function exactTarget() {
    const directory = await fs.mkdtemp(
      path.join(os.tmpdir(), "sf-target-test-"),
    );
    const socketPath = path.join(directory, "socket");
    await fs.writeFile(socketPath, "fixture");
    const stat = await fs.stat(socketPath);
    return {
      directory,
      target: {
        selectionMode: "invoking" as const,
        socketPath,
        socketIdentity: { device: String(stat.dev), inode: String(stat.ino) },
        sessionId: "$1",
        sessionName: "session",
        repository: "owner/repo",
      },
    };
  }

  it("prefixes every lifecycle command and uses immutable IDs", async () => {
    const fixture = await exactTarget();
    try {
      const context = `${fixture.target.socketPath}|$1|session|@1|1|%1|0|/tmp/work\n`;
      const commands = new QueueCommandRunner([
        result(""),
        result("@1|%1\n"),
        result(context),
        result(""),
        result("123\n"),
        result("pane transcript"),
        result(""),
        result(""),
        result(""),
        result(""),
        result(""),
      ]);
      const tmux = createLivePorts(commands).tmux;
      const created = await tmux.createIssueWindow({
        target: fixture.target,
        windowName: "1",
        cwd: "/tmp/work",
        executable: "soft-factory",
        args: ["internal"],
      });
      await expect(tmux.observe(created)).resolves.toEqual({
        state: "live",
        target: created,
      });
      await tmux.setRemainOnExit(created);
      await expect(tmux.panePid(created)).resolves.toBe(123);
      await tmux.capturePane(created, 1024);
      await tmux.restartWorker(created, "soft-factory", ["internal"]);
      await tmux.removeWindow(created);
      await tmux.attach(created);
      expect(
        commands.calls.every(
          ({ args }) =>
            args[0] === "-S" && args[1] === fixture.target.socketPath,
        ),
      ).toBe(true);
      expect(
        commands.calls.some(
          ({ args }) =>
            args.includes(created.windowId) && args.includes("kill-window"),
        ),
      ).toBe(true);
      expect(
        commands.calls
          .filter(
            ({ args }) =>
              args.includes("select-pane") || args.includes("capture-pane"),
          )
          .every(({ args }) => args.includes(created.paneId)),
      ).toBe(true);
      const selectWindow = commands.calls.findIndex(({ args }) =>
        args.includes("select-window"),
      );
      const selectPane = commands.calls.findIndex(({ args }) =>
        args.includes("select-pane"),
      );
      const attachSession = commands.calls.findIndex(({ args }) =>
        args.includes("attach-session"),
      );
      expect(selectWindow).toBeGreaterThanOrEqual(0);
      expect(commands.calls[selectWindow]?.args).toContain(created.windowId);
      expect(selectPane).toBeGreaterThan(selectWindow);
      expect(attachSession).toBeGreaterThan(selectPane);
    } finally {
      await fs.rm(fixture.directory, { recursive: true, force: true });
    }
  });

  it("preserves same-name windows and malformed creation output", async () => {
    const fixture = await exactTarget();
    try {
      const collision = new QueueCommandRunner([result("1\n")]);
      await expect(
        createLivePorts(collision).tmux.createIssueWindow({
          target: fixture.target,
          windowName: "1",
          cwd: "/tmp/work",
          executable: "soft-factory",
          args: [],
        }),
      ).rejects.toMatchObject({ code: "RESOURCE_OWNERSHIP_UNKNOWN" });
      expect(collision.calls).toHaveLength(1);
      const malformedRunner = new QueueCommandRunner([
        result(""),
        result("bad\n"),
      ]);
      await expect(
        createLivePorts(malformedRunner).tmux.createIssueWindow({
          target: fixture.target,
          windowName: "1",
          cwd: "/tmp/work",
          executable: "soft-factory",
          args: [],
        }),
      ).rejects.toMatchObject({ code: "TMUX_IDENTITY_MALFORMED" });
    } finally {
      await fs.rm(fixture.directory, { recursive: true, force: true });
    }
  });
});

describe("Issue 31 bounded value-free tmux diagnostics", () => {
  it("reports exact original byte structure with the closed token vocabulary", () => {
    const stdout = Buffer.from([
      0x40, 0x31, 0x7c, 0x25, 0x31, 0x09, 0x0d, 0x0a, 0x5c, 0xff,
    ]);
    const diagnostic = buildTmuxIdentityDiagnostic(
      "observe",
      result(stdout, 0, Buffer.from([0xff, 0x00])),
    );
    expect(diagnostic).toEqual({
      schemaVersion: 1,
      phase: "observe",
      exitCode: 0,
      stdoutByteCount: 10,
      stderrByteCount: 2,
      recordCount: 2,
      recordsTruncated: false,
      records: [
        { fieldCount: 2, truncated: false },
        { fieldCount: 1, truncated: false },
      ],
      signature: [
        "window_id",
        "vertical_bar",
        "pane_id",
        "horizontal_tab",
        "carriage_return",
        "line_feed",
        "backslash",
        "other",
      ],
      signatureTruncated: false,
    });
    expect(
      buildTmuxIdentityDiagnostic("create", result(Buffer.alloc(0))),
    ).toMatchObject({ recordCount: 0, records: [] });
  });

  it("keeps schema-v1 legacy HT diagnostics readable and rejects unknown tokens", () => {
    const legacy = {
      schemaVersion: 1,
      phase: "create",
      exitCode: 0,
      stdoutByteCount: 6,
      stderrByteCount: 0,
      recordCount: 1,
      recordsTruncated: false,
      records: [{ fieldCount: 2, truncated: false }],
      signature: ["window_id", "horizontal_tab", "pane_id", "line_feed"],
      signatureTruncated: false,
    };
    expect(isTmuxIdentityDiagnostic(legacy)).toBe(true);
    expect(
      isTmuxIdentityDiagnostic({ ...legacy, signature: ["raw-value"] }),
    ).toBe(false);
  });

  it("caps records, vertical-bar fields, and signature exactly at 8/8/32", () => {
    const records = Array.from({ length: 9 }, () =>
      Array.from({ length: 9 }, () => "x").join("|"),
    ).join("\n");
    const bounded = buildTmuxIdentityDiagnostic("create", result(records));
    expect(bounded).toMatchObject({
      recordCount: 8,
      recordsTruncated: true,
      records: Array.from({ length: 8 }, () => ({
        fieldCount: 8,
        truncated: true,
      })),
    });
    const signatureInput = Buffer.from(
      Array.from({ length: 17 }, () => "@1|").join(""),
    );
    const signature = buildTmuxIdentityDiagnostic(
      "observe",
      result(signatureInput),
    );
    expect(signature.signature).toHaveLength(32);
    expect(signature.signatureTruncated).toBe(true);
  });

  it("keeps command, stderr, cwd, identity, and other-run sentinels off errors", () => {
    const sentinels = [
      "secret-path-component",
      "secret-command-argument",
      "secret-environment-value",
      "issue-31-owner-run",
      "other-run-bytes",
    ];
    const command = result(
      sentinels.join("/"),
      0,
      sentinels.slice().reverse().join("/"),
    );
    let captured: TmuxIdentityOutputError | null = null;
    try {
      parseTmuxIdentityResult("create", command);
    } catch (cause: unknown) {
      if (!(cause instanceof TmuxIdentityOutputError)) throw cause;
      captured = cause;
    }
    expect(captured).not.toBeNull();
    const serialized = JSON.stringify(captured);
    for (const sentinel of sentinels)
      expect(serialized).not.toContain(sentinel);
    expect(serialized).not.toContain("stdoutBuffer");
    expect(serialized).not.toContain("stderrBuffer");
  });
});
