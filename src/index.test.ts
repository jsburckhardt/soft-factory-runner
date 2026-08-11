import { parseCommand } from "./command";
import { parseConfiguration, renderPrompt } from "./config";
import {
  issueName,
  issueSlug,
  normalizeRepositoryName,
  otelResourceAttributes,
  tmuxSessionName,
} from "./domain";
import { errorExitCode, RunnerError } from "./errors";
import { bootstrapMessage, projectName, workerStartupMarker } from "./index";
import { renderError } from "./render";

describe("CLI and domain primitives", () => {
  it("keeps the no-argument bootstrap signal", async () => {
    expect(projectName).toBe("Soft Factory Runner");
    expect(bootstrapMessage).toBe(
      "Soft Factory Runner is bootstrapped. Product commands will be delivered through RPIV.\n",
    );
    expect(parseCommand([])).toEqual({ kind: "bootstrap" });
    expect(workerStartupMarker(3))
      .toBe(`Soft Factory RPIV worker issue-3 starting.
`);
  });

  it("parses every public command and the private worker strictly", () => {
    expect(parseCommand(["run", "--issue", "3", "--json"])).toEqual({
      kind: "run",
      issueNumber: 3,
      json: true,
    });
    expect(parseCommand(["status", "3"])).toEqual({
      kind: "status",
      issueNumber: 3,
      json: false,
    });
    expect(parseCommand(["attach", "3"])).toEqual({
      kind: "attach",
      issueNumber: 3,
    });
    expect(parseCommand(["internal", "run-agent", "--issue", "3"])).toEqual({
      kind: "worker",
      issueNumber: 3,
    });
    expect(parseCommand(["--help"]).kind).toBe("help");
    for (const args of [
      ["run"],
      ["run", "--issue", "0"],
      ["status", "-1"],
      ["attach", "x"],
      ["status", "3", "--bad"],
      ["run", "--issue", "999999999999999999999"],
    ]) {
      expect(() => parseCommand(args)).toThrow(RunnerError);
    }
  });

  it("normalizes deterministic identities, slugs, names, and telemetry", () => {
    const identity = {
      nameWithOwner: "JSBurckhardt/Soft Factory_Runner",
      normalizedName: normalizeRepositoryName(
        "JSBurckhardt/Soft Factory_Runner",
      ),
    };
    expect(identity.normalizedName).toBe("jsburckhardt-soft-factory-runner");
    expect(issueSlug("--- A useful Feature!!! ---")).toBe("a-useful-feature");
    expect(issueSlug("!!!")).toBe("issue");
    expect(issueName(3)).toBe("issue-3");
    expect(tmuxSessionName(identity)).toBe(
      "sf-jsburckhardt-soft-factory-runner",
    );
    expect(otelResourceAttributes(identity, 3)).toBe(
      "project.name=jsburckhardt-soft-factory-runner,issue.id=issue-3",
    );
  });

  it("parses documented configuration and rejects unsupported input", () => {
    const configuration = parseConfiguration(`repository:
  remote: upstream
  base_branch: main
branch_types:
  feature: feat
rpiv:
  prompt: "Implement #{issue}"
`);
    expect(configuration).toEqual({
      remote: "upstream",
      baseBranch: "main",
      labelTypes: { feature: "feat" },
      promptTemplate: "Implement #{issue}",
    });
    expect(renderPrompt(configuration.promptTemplate, 3)).toBe("Implement #3");
    expect(parseConfiguration(null).labelTypes).toEqual({ feature: "feat" });
    expect(() => parseConfiguration("bad line")).toThrow(
      "Unsupported configuration line",
    );
    expect(() =>
      parseConfiguration(` repository:
`),
    ).toThrow("indentation");
    expect(() =>
      parseConfiguration(`branch_types:
  feature: nope
`),
    ).toThrow("Invalid branch type mapping");
  });

  it("renders stable error categories and exit codes", () => {
    const syntax = new RunnerError("CLI_INVALID", "bad", "fix it", {
      details: { field: "issue" },
    });
    expect(errorExitCode(syntax)).toBe(2);
    expect(
      errorExitCode(new RunnerError("ISSUE_ALREADY_OWNED", "owned", "wait")),
    ).toBe(4);
    expect(
      errorExitCode(new RunnerError("ISSUE_CLOSED", "closed", "open")),
    ).toBe(3);
    expect(renderError(syntax, false)).toContain("CLI_INVALID: bad");
    expect(JSON.parse(renderError(syntax, true)).error.code).toBe(
      "CLI_INVALID",
    );
  });
});
