import type { TmuxIdentity } from "./domain";
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

type ClientState = {
  readonly name: "UTF-8" | "non-UTF8";
  readonly clientUtf8: boolean;
  readonly inheritedLocale: false;
  readonly inheritedTmux: false;
  readonly defaultServer: false;
  readonly credentials: false;
  readonly network: false;
  readonly sparkta: false;
};

const clientStates: readonly ClientState[] = [
  {
    name: "UTF-8",
    clientUtf8: true,
    inheritedLocale: false,
    inheritedTmux: false,
    defaultServer: false,
    credentials: false,
    network: false,
    sparkta: false,
  },
  {
    name: "non-UTF8",
    clientUtf8: false,
    inheritedLocale: false,
    inheritedTmux: false,
    defaultServer: false,
    credentials: false,
    network: false,
    sparkta: false,
  },
];

class Barrier {
  private arrivals = 0;
  private release!: () => void;
  private readonly ready = new Promise<void>((resolve) => {
    this.release = resolve;
  });

  public async arrive(): Promise<void> {
    this.arrivals += 1;
    if (this.arrivals === 2) this.release();
    await this.ready;
  }
}

class ProtocolCommandRunner implements CommandRunner {
  public readonly calls: Array<{
    readonly executable: string;
    readonly args: readonly string[];
    readonly cwd: string;
    readonly timeoutMs: number;
    readonly shell: false | undefined;
  }> = [];
  public readonly resources: Array<{
    readonly windowId: string;
    readonly paneId: string;
    readonly cwd: string;
  }> = [];
  public readonly prohibitedAccess: readonly string[] = [];

  public constructor(
    public readonly state: ClientState,
    private readonly identity: {
      readonly windowId: string;
      readonly paneId: string;
      readonly cwd: string;
    },
    private readonly barrier?: Barrier,
  ) {}

  public async run(
    executable: string,
    args: readonly string[],
    cwd: string,
    timeoutMs: number,
    shell?: false,
  ): Promise<CommandResult> {
    this.calls.push({ executable, args, cwd, timeoutMs, shell });
    const command = args[0];
    if (command === "has-session") return result("");
    if (command === "list-windows") return result("");
    if (command === "new-window") {
      await this.barrier?.arrive();
      const format = args[args.indexOf("-F") + 1];
      if (format === undefined) throw new Error("controlled format missing");
      this.resources.push(this.identity);
      return result(
        renderTmuxFormat(format, this.identity, this.state.clientUtf8),
      );
    }
    if (command === "list-panes") {
      const format = args[args.indexOf("-F") + 1];
      if (format === undefined) throw new Error("controlled format missing");
      return result(
        renderTmuxFormat(format, this.identity, this.state.clientUtf8),
      );
    }
    throw new Error(
      "unexpected controlled tmux command: " + (command ?? "none"),
    );
  }

  public async runInherited(
    executable: string,
    args: readonly string[],
    cwd: string,
  ): Promise<CommandResult> {
    return this.run(executable, args, cwd, 0, false);
  }
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

function renderTmuxFormat(
  format: string,
  identity: {
    readonly windowId: string;
    readonly paneId: string;
    readonly cwd: string;
  },
  clientUtf8: boolean,
): Buffer {
  const rendered = format
    .replaceAll("#{window_id}", identity.windowId)
    .replaceAll("#{pane_id}", identity.paneId)
    .replaceAll("#{pane_current_path}", identity.cwd);
  const bytes = Buffer.from(rendered, "utf8");
  const clientBytes = clientUtf8
    ? bytes
    : Buffer.from(bytes.map((byte) => (byte <= 0x1f ? 0x5f : byte)));
  return Buffer.concat([clientBytes, Buffer.from([0x0a])]);
}

async function runNormalFlow(
  state: ClientState,
  identity: {
    readonly windowId: string;
    readonly paneId: string;
    readonly cwd: string;
  },
  barrier?: Barrier,
): Promise<{
  readonly runner: ProtocolCommandRunner;
  readonly created: TmuxIdentity;
  readonly observed: TmuxIdentity | null;
}> {
  const runner = new ProtocolCommandRunner(state, identity, barrier);
  const tmux = createLivePorts(runner).tmux;
  const created = await tmux.createIssueWindow({
    sessionName: "sf-owner-repo",
    windowName: identity.windowId.slice(1),
    cwd: identity.cwd,
    executable: "soft-factory",
    args: ["internal", "run-agent", "--issue", identity.windowId.slice(1)],
  });
  const observed = await tmux.observe(created);
  return { runner, created, observed };
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

describe("Issue 31 LiveTmuxPort client-state and isolation matrix", () => {
  it.each(clientStates)(
    "creates and observes exact identities in the $name row and repeat",
    async (state) => {
      const identity = {
        windowId: "@1",
        paneId: "%1",
        cwd: "/tmp/normal|mé",
      };
      const first = await runNormalFlow(state, identity);
      const repeated = await runNormalFlow(state, identity);
      const expected = {
        sessionName: "sf-owner-repo",
        windowName: "1",
        ...identity,
      };
      expect(first.created).toEqual(expected);
      expect(first.observed).toEqual(expected);
      expect(repeated.created).toEqual(expected);
      expect(repeated.observed).toEqual(expected);
      expect(first.runner.calls).toEqual(repeated.runner.calls);
      expect(first.runner.resources).toEqual(repeated.runner.resources);
      expect(first.runner.resources).toEqual([identity]);
      const formats = first.runner.calls.flatMap((call) => {
        const index = call.args.indexOf("-F");
        return index < 0 ? [] : [call.args[index + 1]];
      });
      expect(formats).toEqual([
        "#{window_name}",
        TMUX_CREATE_IDENTITY_FORMAT,
        TMUX_OBSERVE_IDENTITY_FORMAT,
      ]);
      expect(first.runner.state).toEqual(state);
      expect(first.runner.prohibitedAccess).toEqual([]);
      expect(state).toMatchObject({
        inheritedLocale: false,
        inheritedTmux: false,
        defaultServer: false,
        credentials: false,
        network: false,
        sparkta: false,
      });
      const createBytes = renderTmuxFormat(
        TMUX_CREATE_IDENTITY_FORMAT,
        identity,
        state.clientUtf8,
      );
      expect(createBytes).toEqual(Buffer.from("@1|%1\n"));
      expect(createBytes).toHaveLength(6);
      expect(createBytes.includes(0x09)).toBe(false);
      if (!state.clientUtf8) {
        expect(
          renderTmuxFormat(
            "#{window_id}\t#{pane_id}",
            identity,
            state.clientUtf8,
          ),
        ).toEqual(Buffer.from("@1_%1\n"));
      }
    },
  );

  it.each(createRejections)(
    "maps malformed create %s to TMUX_IDENTITY_MALFORMED",
    async (_label, stdout) => {
      const commands = new QueueCommandRunner([
        result(""),
        result(""),
        result(stdout),
      ]);
      const created = createLivePorts(commands).tmux.createIssueWindow({
        sessionName: "sf-owner-repo",
        windowName: "31",
        cwd: "/tmp/normal",
        executable: "soft-factory",
        args: ["internal", "run-agent", "--issue", "31"],
      });
      await expect(created).rejects.toMatchObject({
        code: "TMUX_IDENTITY_MALFORMED",
        tmuxIdentityDiagnostic: { phase: "create" },
      });
      expect(commands.calls).toHaveLength(3);
    },
  );

  it.each(observeRejections)(
    "maps malformed observe %s to TMUX_IDENTITY_MALFORMED",
    async (_label, stdout) => {
      const commands = new QueueCommandRunner([result(stdout)]);
      const target: TmuxIdentity = {
        sessionName: "sf-owner-repo",
        windowName: "31",
        windowId: "@31",
        paneId: "%31",
        cwd: "/tmp/normal",
      };
      await expect(
        createLivePorts(commands).tmux.observe(target),
      ).rejects.toMatchObject({
        code: "TMUX_IDENTITY_MALFORMED",
        tmuxIdentityDiagnostic: { phase: "observe" },
      });
      expect(commands.calls).toHaveLength(1);
    },
  );

  it("keeps nonzero observation as absence", async () => {
    const commands = new QueueCommandRunner([result("not retained", 1)]);
    await expect(
      createLivePorts(commands).tmux.observe({
        sessionName: "sf-owner-repo",
        windowName: "31",
        windowId: "@31",
        paneId: "%31",
        cwd: "/tmp/normal",
      }),
    ).resolves.toBeNull();
  });

  it("refuses same-name adoption before creating or modifying a window", async () => {
    const commands = new QueueCommandRunner([result(""), result("31\n")]);
    await expect(
      createLivePorts(commands).tmux.createIssueWindow({
        sessionName: "sf-owner-repo",
        windowName: "31",
        cwd: "/tmp/normal",
        executable: "soft-factory",
        args: ["internal", "run-agent", "--issue", "31"],
      }),
    ).rejects.toMatchObject({ code: "RESOURCE_OWNERSHIP_UNKNOWN" });
    expect(commands.calls.map((call) => call.args[0])).toEqual([
      "has-session",
      "list-windows",
    ]);
  });

  it("keeps two barrier-overlapped owner flows disjoint", async () => {
    const barrier = new Barrier();
    const identities = [
      { windowId: "@31", paneId: "%31", cwd: "/tmp/owner-a|é" },
      { windowId: "@32", paneId: "%32", cwd: "/tmp/owner-b|ß" },
    ] as const;
    const [first, second] = await Promise.all([
      runNormalFlow(clientStates[0], identities[0], barrier),
      runNormalFlow(clientStates[1], identities[1], barrier),
    ]);
    expect(first.observed).toEqual(first.created);
    expect(second.observed).toEqual(second.created);
    expect(first.runner.resources).toEqual([identities[0]]);
    expect(second.runner.resources).toEqual([identities[1]]);
    expect(first.created).not.toMatchObject({
      windowId: identities[1].windowId,
      paneId: identities[1].paneId,
      cwd: identities[1].cwd,
    });
    expect(second.created).not.toMatchObject({
      windowId: identities[0].windowId,
      paneId: identities[0].paneId,
      cwd: identities[0].cwd,
    });
    expect([
      ...first.runner.prohibitedAccess,
      ...second.runner.prohibitedAccess,
    ]).toEqual([]);
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
