import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const guide = fs.readFileSync(
  path.join(root, "docs", "phase-1-issue-run.md"),
  "utf8",
);
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");

describe("Phase 2 operator documentation", () => {
  it("documents commands, configuration, artifact schema, and command authority", () => {
    for (const phrase of [
      "just run run --issue <positive-integer> [--json]",
      "just run status <positive-integer> [--json]",
      "just run attach <positive-integer>",
      "repository.remote",
      "repository.base_branch",
      "feature: feat",
      "FetchedBaseProofV1",
      "AgentResultV1",
      "agent-result.json",
      "issueNumber",
      "outcome",
      "branch",
      "headSha",
      "prNumber",
      "acceptanceCriteria",
      "validations",
      "completedAt",
      "just verify-focused",
      "just verify",
    ])
      expect(guide).toContain(phrase);
    expect(readme).toContain("just run --help");
    expect(readme).toContain("just run run --issue 3");
    expect(readme).toContain("agent-result.json");
    expect(readme).not.toMatch(/^soft-factory\s/m);
    expect(guide).not.toMatch(/^soft-factory\s/m);
  });

  it("documents persistence, terminal states, conjunction, rejection matrix, and deferrals", () => {
    for (const phrase of [
      "RunSnapshotV2",
      "event append failure",
      "legacy snapshot",
      "`completed`",
      "`failed`",
      "`blocked`",
      "`cancelled`",
      "`interrupted`",
      "local HEAD",
      "remote branch SHA",
      "open PR",
      "closes the issue",
      "every isolated mismatch",
      "RESULT_MISSING",
      "COMPLETION_PROOF_INCOMPLETE",
      "Restart recovery",
      "resume",
      "stop mechanics",
      "cleanup",
      "multiple-issue scheduling",
      "project.name=jsburckhardt-soft-factory-runner,issue.id=issue-3",
      "/workspaces/soft-factory-runner/.trees/3",
    ])
      expect(guide).toContain(phrase);
    expect(guide).not.toContain(
      "zero Copilot exit is **`interrupted`**, never `completed`",
    );
    expect(readme).not.toContain("until a later completion protocol exists");
  });

  it("executes documented commands through the root justfile without a global binary", () => {
    const help = spawnSync("just", ["run", "--help"], {
      cwd: root,
      encoding: "utf8",
    });
    expect(help.status).toBe(0);
    expect(help.stdout).toContain("Soft Factory Runner Phase 2");
    const invalidRun = spawnSync(
      "just",
      ["run", "run", "--issue", "0", "--json"],
      { cwd: root, encoding: "utf8" },
    );
    expect(invalidRun.status).toBe(2);
    expect(invalidRun.stderr).toContain('"code": "CLI_INVALID"');
    const missingStatus = spawnSync(
      "just",
      ["run", "status", "2147483647", "--json"],
      { cwd: root, encoding: "utf8" },
    );
    expect(missingStatus.status).toBe(3);
    expect(missingStatus.stderr).toContain('"code": "STATE_NOT_FOUND"');
    const missingAttach = spawnSync("just", ["run", "attach", "2147483647"], {
      cwd: root,
      encoding: "utf8",
    });
    expect(missingAttach.status).toBe(3);
    expect(missingAttach.stderr).toContain("STATE_NOT_FOUND");
  });
});
