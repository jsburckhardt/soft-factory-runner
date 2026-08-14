import { parseCommand } from "./command";
import {
  DOCTOR_CHECK_IDS,
  failedCheck,
  makeDoctorResult,
  passedCheck,
  type DoctorResultV2,
} from "./doctor";
import { renderDoctor } from "./doctor-render";
import type { DoctorRunner } from "./doctor-service";
import { runCli } from "./index";
import type { RunnerPorts } from "./ports";

class FixtureDoctor implements DoctorRunner {
  public calls = 0;
  public constructor(private readonly result: DoctorResultV2) {}
  public async run(): Promise<DoctorResultV2> {
    this.calls += 1;
    return this.result;
  }
}
const issueTripwire = new Proxy({} as RunnerPorts, {
  get() {
    throw new Error("Doctor accessed an issue-run port");
  },
});
function resultWithFailure(
  id?: (typeof DOCTOR_CHECK_IDS)[number],
): DoctorResultV2 {
  return makeDoctorResult(
    { github: "owner/repo", defaultBranch: "main" },
    DOCTOR_CHECK_IDS.map((checkId) =>
      checkId === id
        ? failedCheck(
            checkId,
            "Prerequisite " + checkId + " failed.",
            "Correct " + checkId + " and rerun Doctor.",
          )
        : passedCheck(checkId),
    ),
  );
}
function normalizeHuman(text: string): unknown {
  const lines = text.trimEnd().split("\n");
  const checks: Array<Record<string, unknown>> = [];
  for (let index = 3; index < lines.length - 1; index += 1) {
    const match =
      /^CHECK id=(\S+) status=(passed|failed) blocking=(true)$/.exec(
        lines[index],
      );
    if (match === null) continue;
    const check: Record<string, unknown> = {
      id: match[1],
      status: match[2],
      blocking: true,
    };
    if (match[2] === "failed") {
      check.message = lines[index + 1].slice("  MESSAGE: ".length);
      check.remediation = lines[index + 2].slice("  REMEDIATION: ".length);
      if (lines[index + 3]?.startsWith("  EVIDENCE: ")) {
        check.evidence = JSON.parse(
          lines[index + 3].slice("  EVIDENCE: ".length),
        );
        index += 1;
      }
      index += 2;
    }
    checks.push(check);
  }
  return {
    schemaVersion: 2,
    ready: lines.at(-1) === "STATUS: READY",
    repository: {
      github: lines[1].slice("REPOSITORY github=".length),
      defaultBranch: lines[2].slice("REPOSITORY defaultBranch=".length),
    },
    checks,
  };
}

describe("Doctor service rendering and CLI", () => {
  it("parses only doctor and doctor --json grammar", () => {
    expect(parseCommand(["doctor"])).toEqual({ kind: "doctor", json: false });
    expect(parseCommand(["doctor", "--json"])).toEqual({
      kind: "doctor",
      json: true,
    });
    for (const args of [
      ["doctor", "--bad"],
      ["doctor", "--json", "extra"],
    ])
      expect(() => parseCommand(args)).toThrow();
  });

  it("renders human and schema-v2 JSON from exactly the same all-pass result", () => {
    const result = resultWithFailure();
    const human = renderDoctor(result, false);
    const json = JSON.parse(renderDoctor(result, true));
    expect(normalizeHuman(human)).toEqual(json);
    expect(human).toContain("STATUS: READY\n");
    expect(json).toMatchObject({
      schemaVersion: 2,
      ready: true,
      repository: { github: "owner/repo", defaultBranch: "main" },
    });
    expect(json.checks).toHaveLength(24);
  });

  it("renders value-free tmux evidence with identical human and JSON meaning", () => {
    const evidence = {
      schemaVersion: 1 as const,
      kind: "tmux-functional-probe" as const,
      operation: "pane-observe" as const,
      reason: "output-truncated" as const,
      exitCode: 0,
      timedOut: false,
      stdoutByteCount: 4097,
      stderrByteCount: 0,
      stdoutTruncated: true,
      stderrTruncated: false,
      identityDiagnostic: null,
      cleanup: {
        server: "absent" as const,
        paneProcesses: "absent" as const,
        socket: "absent" as const,
        workspace: "absent" as const,
      },
    };
    const result = makeDoctorResult(
      { github: "owner/repo", defaultBranch: "main" },
      DOCTOR_CHECK_IDS.map((id) =>
        id === "command.tmux"
          ? failedCheck(
              id,
              "The isolated tmux probe failed.",
              "Repair tmux and rerun Doctor.",
              evidence,
            )
          : passedCheck(id),
      ),
    );
    const human = renderDoctor(result, false);
    const json = JSON.parse(renderDoctor(result, true));
    expect(normalizeHuman(human)).toEqual(json);
    expect(human).toContain("EVIDENCE: ");
    expect(human).not.toContain("/tmp/");
  });

  it("preserves failed details and NOT READY parity for every blocking ID", () => {
    for (const id of DOCTOR_CHECK_IDS) {
      const result = resultWithFailure(id);
      const human = renderDoctor(result, false);
      const json = JSON.parse(renderDoctor(result, true));
      expect(normalizeHuman(human)).toEqual(json);
      expect(human).toContain("STATUS: NOT READY");
      expect(json.ready).toBe(false);
      expect(
        json.checks.find((check: { id: string }) => check.id === id),
      ).toMatchObject({
        status: "failed",
        blocking: true,
        message: expect.any(String),
        remediation: expect.any(String),
      });
    }
  });

  it("dispatches without issue ports and maps complete reports to exits 0 and 3", async () => {
    const ready = new FixtureDoctor(resultWithFailure());
    const readyResponse = await runCli(
      ["doctor"],
      "/repo",
      issueTripwire,
      ready,
    );
    expect(readyResponse).toMatchObject({ exitCode: 0, stderr: "" });
    expect(ready.calls).toBe(1);
    const blocked = new FixtureDoctor(resultWithFailure("command.git"));
    const blockedResponse = await runCli(
      ["doctor", "--json"],
      "/repo",
      issueTripwire,
      blocked,
    );
    expect(blockedResponse.exitCode).toBe(3);
    expect(JSON.parse(blockedResponse.stdout).ready).toBe(false);
    expect(
      (await runCli(["doctor", "--bad"], "/repo", issueTripwire, blocked))
        .exitCode,
    ).toBe(2);
    expect(blocked.calls).toBe(1);
  });
});
