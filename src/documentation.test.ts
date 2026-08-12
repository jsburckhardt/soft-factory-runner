import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const read = (relative: string) =>
  fs.readFileSync(path.join(root, relative), "utf8");
const readme = read("README.md");
const docsIndex = read("docs/README.md");
const issueRun = read("docs/phase-1-issue-run.md");
const operations = read("docs/phase-3-recovery-operations.md");

describe("V-11 Phase 3 operator documentation", () => {
  it("documents every public command, JSON form, stable facts, exits, and root recipes", () => {
    for (const command of [
      "run --issue <positive-integer> [--json]",
      "reconcile <positive-integer> [--json]",
      "resume <positive-integer> [--json]",
      "stop <positive-integer> [--json]",
      "clean <positive-integer> [--json]",
      "list [--json]",
      "status <positive-integer> [--json]",
      "attach <positive-integer>",
      "logs <positive-integer> [--json]",
    ])
      expect(operations).toContain(`just run ${command}`);
    for (const phrase of [
      "Human and JSON",
      "observation states/codes/facts",
      "shared reconciliation report",
      "persisted state",
      "outcome code",
      "safe actions",
      "remediation",
      "exit 2",
      "exit 3",
      "exit 4",
      "idempotent",
      "just verify-focused",
      "just verify",
    ])
      expect(operations).toContain(phrase);
    expect(readme).toContain("just run reconcile 5 --json");
    expect(docsIndex).toContain("Phase 3 recovery and concurrency operations");
    expect(readme).not.toMatch(/^soft-factory\s/m);
    expect(operations).not.toMatch(/^soft-factory\s/m);
  });

  it("documents strict explicit concurrency configuration without issue selection", () => {
    for (const phrase of [
      "execution.max_concurrent_runs",
      "strict positive safe integer",
      "defaults to `1`",
      "Unknown leases consume capacity",
      "Reducing the configured limit",
      "CONCURRENCY_LIMIT_REACHED",
      "does not queue, rank, query for, or automatically select another issue",
      ".soft-factory/concurrency/slots/<slot>.lock",
    ])
      expect(operations).toContain(phrase);
    expect(readme).toContain("max_concurrent_runs: 2");
  });

  it("documents recovery, exact process identity, resume decisions, and migration", () => {
    for (const phrase of [
      "RunSnapshotV3",
      "TransitionEventV2",
      "complete, contiguous",
      "STATE_HISTORY_INVALID",
      "PID",
      "process-group ID",
      "OS start token",
      "exact argument vector",
      "tmux pane lineage",
      "active_preserved",
      "exactly one matching pane descendant",
      "ACTIVE_PRESERVED",
      "COMPLETED_NOOP",
      "RESUME_REFUSED",
      "RunSnapshotV1",
      "RunSnapshotV2",
      "never silently treated as v3",
      "concurrency slot lease",
      "strictly parsed result artifact identity and content",
      "permission-denied process metadata",
    ])
      expect(operations).toContain(phrase);
    expect(issueRun).toContain("Phase 3 continuation");
    expect(issueRun).not.toContain("## Remaining Prototype 3 deferrals");
    expect(issueRun).not.toContain("operator cancellation control is deferred");
    expect(issueRun).not.toContain(
      "Only an explicit version 2 transition can carry required evidence",
    );
  });

  it("documents stop bounds, retained evidence, guarded cleanup, and merge-source proof", () => {
    for (const phrase of [
      "`SIGTERM`",
      "10 seconds",
      "`SIGKILL`",
      "5 additional seconds",
      "remain-on-exit",
      "2 MiB",
      ".soft-factory/logs/<issue>/<attempt>.log",
      "staged, unstaged, and untracked",
      "no `--force` bypass",
      "non-forced `git worktree remove`",
      "CLOSED-unmerged",
      "immutable PR source head",
      "merge-commit SHA is informational",
      "deleted remote issue branch",
      "retains tmux, local branch, snapshot, events, and logs",
      "completed steps",
      "remaining steps",
      "STOP_PROCESS_STILL_ACTIVE",
      "retain its process identity, running state, issue lock, slot lease",
      "same owner and run",
      "same-owner/run record",
      "inject snapshot failure after every cleanup step",
      "refuse unrelated replacements",
    ])
      expect(operations).toContain(phrase);
  });

  it("documents local deployment limitations and no API impact", () => {
    for (const phrase of [
      "short-lived local CLI",
      "no long-running daemon",
      "network service/API deployment",
      "next reconciliation-capable",
      "no network API contract",
      "API migration is not applicable",
    ])
      expect(operations).toContain(phrase);
    expect(docsIndex).toContain(
      "API reference documentation is therefore not applicable",
    );
  });

  it("smoke tests help and safe missing-state controls through the root justfile", () => {
    const help = spawnSync("just", ["run", "--help"], {
      cwd: root,
      encoding: "utf8",
    });
    expect(help.status).toBe(0);
    expect(help.stdout).toContain("Soft Factory Runner Phase 3");
    for (const command of [
      "status",
      "reconcile",
      "resume",
      "stop",
      "clean",
      "logs",
    ]) {
      const result = spawnSync(
        "just",
        ["run", command, "2147483647", "--json"],
        { cwd: root, encoding: "utf8" },
      );
      expect(result.status).toBe(3);
      expect(result.stderr).toContain(`"code": "STATE_NOT_FOUND"`);
    }
    const inventory = spawnSync("just", ["run", "list", "--json"], {
      cwd: root,
      encoding: "utf8",
    });
    expect(inventory.status).toBe(0);
    expect(inventory.stdout).toContain("INVENTORY_READY");
  });
});
