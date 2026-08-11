import * as fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const guide = fs.readFileSync(
  path.join(root, "docs", "phase-1-issue-run.md"),
  "utf8",
);

describe("Phase 1 operator documentation", () => {
  it("documents the supported command and configuration contracts", () => {
    for (const phrase of [
      "soft-factory run --issue <positive-integer> [--json]",
      "soft-factory status <positive-integer> [--json]",
      "soft-factory attach <positive-integer>",
      "repository.remote",
      "repository.base_branch",
      "feature: feat",
      "FetchedBaseProofV1",
      "ISSUE_ALREADY_OWNED",
      "RESOURCE_OWNERSHIP_UNKNOWN",
    ]) {
      expect(guide).toContain(phrase);
    }
  });

  it("documents exact Issue 3 telemetry, ambient worktree protection, and deferrals", () => {
    expect(guide).toContain(
      "project.name=jsburckhardt-soft-factory-runner,issue.id=issue-3",
    );
    expect(guide).toContain("/workspaces/soft-factory-runner/.trees/3");
    expect(guide).toContain(
      "zero Copilot exit is **`interrupted`**, never `completed`",
    );
    for (const deferral of [
      "restart recovery",
      "resume",
      "stop",
      "clean",
      "post-launch pull-request reconciliation",
      "multiple-issue scheduling",
    ]) {
      expect(guide).toContain(deferral);
    }
  });
});
