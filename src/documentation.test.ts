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
const doctorGuide = read("docs/phase-4-repository-doctor.md");
const assetGuide = read("docs/phase-5-official-assets.md");
const integrationGuide = read("docs/rpiv-integration-contract.md");
const verifierAgent = read(".github/agents/rpiv-verifier.agent.md");
const rpivAgent = read(".github/agents/rpiv.agent.md");
const packageJson = read("package.json");

describe("V-11 Phase 3 operator documentation", () => {
  it("documents executable RPIV integration, migration, safety, and no API/deployment service", () => {
    for (const phrase of [
      "IntegrationContractV1",
      "rpiv.final_validation",
      "just <recipe>",
      "RunSnapshotV4",
      "sole `just verify`",
      "just verify-focused",
      "RpivStatusV1",
      "PROGRESS_MISSING",
      "PROGRESS_CONFLICT",
      "phase `unknown`",
      "AgentResultV1",
      "requiredFinalValidation",
      "no-clobber",
      "pull request is created",
      "coordinator",
      "No valid final artifact",
      "Copilot environment names and values",
      "no network API",
      "no elapsed-age timeout",
    ])
      expect(integrationGuide).toContain(phrase);
    expect(readme).toContain("just run instructions --json");
    expect(docsIndex).toContain(
      "RPIV integration, progress, and completion handoff",
    );
    expect(rpivAgent).toContain("soft-factory instructions --json");
    expect(rpivAgent).toContain("injected local AgentResultV1 validator");
    expect(verifierAgent).toContain("publish strict AgentResultV1 only after");
    expect(verifierAgent).toContain("injected no-clobber Runner helper");
    expect(issueRun).not.toContain(
      "exactly one passed `just verify-focused` and `just verify`",
    );
  });

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
      "RunSnapshotV4",
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
      "never silently treated as v4",
      "concurrency slot lease",
      "strictly parsed result artifact identity, content",
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
    expect(help.stdout).toContain("Soft Factory Runner Phase 5");
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

describe("V-11 Phase 4 repository Doctor documentation", () => {
  it("documents all ordered blocking checks and shared schema-v1 exits", () => {
    const ids = [
      "repository.git-membership",
      "repository.primary-worktree",
      "repository.git-common-directory",
      "repository.github-identity",
      "repository.default-branch",
      "command.git",
      "command.gh",
      "command.tmux",
      "command.node",
      "command.copilot",
      "authentication.github-cli",
      "authentication.copilot-cli",
      "compatibility.rpiv-agent",
      "compatibility.runner-protocol",
      "compatibility.configuration",
      "compatibility.worktree-root",
      "compatibility.state-root-writable",
      "compatibility.trees-ignored",
      "compatibility.runtime-state-ignored",
      "compatibility.result-contract",
      "runtime.trees-ownership",
      "runtime.state-readable",
      "runtime.locks-interpretable",
      "runtime.required-paths-creatable",
    ];
    for (const id of ids) expect(doctorGuide).toContain("`" + id + "`");
    for (const phrase of [
      "exactly these 24 checks in this order",
      "Every check is blocking",
      "schemaVersion",
      "ready",
      "github",
      "defaultBranch",
      "message",
      "remediation",
      "STATUS: READY",
      "STATUS: NOT READY",
      "exits 0",
      "exits 3",
      "syntax exits 2",
      "internal invariant failure exits 1",
      "identical meaning",
    ])
      expect(doctorGuide).toContain(phrase);
  });

  it("documents strict configuration, metadata, path safety, and migration", () => {
    for (const phrase of [
      "protocol_version: 1",
      "worktree_root: .trees",
      "state_root: .soft-factory",
      "unknown empty mapping keys are rejected",
      "Known empty `repository`, `rpiv`, `execution`, `branch_types`, `copilot`, and `copilot.environment`",
      "configuration compatibility migration",
      "repository-relative",
      "non-overlapping",
      "symlink escape",
      "Git common directory",
      "runner_protocol: 1",
      "result_contract: agent-result-v1",
      "No fallback `.agents/`",
    ])
      expect(doctorGuide).toContain(phrase);
    expect(rpivAgent).toContain("runner_protocol: 1");
    expect(rpivAgent).toContain("result_contract: agent-result-v1");
    expect(issueRun).toContain("Existing files migrate");
    expect(readme).toContain("Existing configuration files must migrate");
  });

  it("documents repository-only safe bounded operation, fixtures, timing, and no API impact", () => {
    for (const phrase of [
      "does not accept an issue number",
      "select an issue",
      "ambient `harness doctor`",
      "shell: false",
      "environment allowlist",
      "2-second timeout",
      "one attempt",
      "no polling or hidden retry",
      "9-second aggregate deadline",
      "exclusive tokenized",
      "never creates issue state",
      "fixtures/doctor/ready.json",
      "fixtures/doctor/blocked.json",
      "fixtures/doctor/isolated-failures.json",
      "24-row pass/fail matrix",
      "no manufactured prebuilt Doctor result",
      "snapshot/lock repository disagreement fails",
      "10,000 ms",
      "no daemon",
      "No API specification or API migration is applicable",
    ])
      expect(doctorGuide).toContain(phrase);
    expect(packageJson).not.toContain("engineering-harness");
    expect(docsIndex).toContain("Phase 4 repository Doctor");
    expect(operations).toContain("Repository readiness preflight");
  });

  it("exposes Doctor in README and cumulative CLI help", () => {
    expect(readme).toContain("just run doctor --json");
    const help = spawnSync("just", ["run", "--help"], {
      cwd: root,
      encoding: "utf8",
    });
    expect(help.status).toBe(0);
    expect(help.stdout).toContain("soft-factory doctor [--json]");
    expect(help.stdout).toContain("repository readiness only");
  });
});

describe("V-9 Copilot child environment documentation", () => {
  const guides = [readme, issueRun, operations, doctorGuide];

  it("documents the mapping, example, grammar, explicit empty strings, and defaults", () => {
    for (const guide of guides) {
      expect(guide).toContain("copilot.environment");
      expect(guide).toContain("[A-Za-z_][A-Za-z0-9_]*");
      expect(guide).toContain("string scalar");
      expect(guide).toContain("explicit empty");
      expect(guide).toContain("absent");
      expect(guide).toContain("empty environment mapping");
    }
    for (const guide of [readme, issueRun, operations, doctorGuide]) {
      expect(guide).toContain("COPILOT_OTEL_ENABLED");
      expect(guide).toContain("OPTIONAL_EMPTY");
    }
    expect(docsIndex).toContain("Copilot child configuration");
    expect(docsIndex).toContain("copilot.environment");
  });

  it("documents literal transport and both precedence rules consistently", () => {
    for (const guide of guides) {
      expect(guide).toContain("shell: false");
      expect(guide).toContain("literal");
      expect(guide).toContain("OTEL_RESOURCE_ATTRIBUTES");
      expect(guide).toContain("inherited");
      expect(guide).toContain("configured");
      expect(guide).toContain("Runner-owned");
    }
    expect(issueRun).toContain("command substitution");
    expect(operations).toContain("$VAR");
    expect(operations).toContain("backticks");
    expect(readme).toContain("variable expansion");
  });

  it("documents invalid classes, value-free errors, fresh correction, and confidentiality", () => {
    for (const guide of guides) {
      for (const invalidClass of [
        "Duplicate",
        "invalid names",
        "non-string",
        "nested",
        "aliases",
        "anchors",
        "merge keys",
        "unsupported keys",
        "malformed",
      ])
        expect(guide.toLowerCase()).toContain(invalidClass.toLowerCase());
      expect(guide).toContain("field");
      expect(guide).toContain("reason");
      expect(guide).toContain("no value");
      expect(guide).toContain("fresh");
      expect(guide).toContain("snapshots");
      expect(guide).toContain("events");
    }
    expect(readme).toContain("applies only to Copilot");
    expect(issueRun).toContain("do not alter Git");
    expect(operations).toContain("Concurrent issue launches");
    expect(doctorGuide).toContain("never launches Copilot");
  });

  it("documents additive migration and unchanged API, deployment, schemas, and arguments", () => {
    for (const guide of guides) {
      expect(guide).toContain("additive");
      expect(guide).toContain("no migration");
      expect(guide).toContain("API");
      expect(guide).toContain("deployment");
    }
    expect(readme).toContain("Copilot argument order");
    expect(issueRun).toContain("argument order remain");
    expect(docsIndex).toContain("persisted-schema");
  });
});

describe("V-9 Phase 5 official asset documentation", () => {
  it("documents every install command, exact destination, and strict manifest metadata", () => {
    for (const command of [
      "just run install agent soft-factory",
      "just run install agent soft-factory-assessor",
      "just run install skill soft-factory",
      "just run install --recommended",
    ]) {
      expect(assetGuide).toContain(command);
      expect(readme).toContain(command);
    }
    for (const phrase of [
      ".agents/agents/soft-factory.agent.md",
      ".agents/agents/soft-factory-assessor.agent.md",
      ".agents/skills/soft-factory/SKILL.md",
      ".agents/manifest.json",
      "schemaVersion",
      "runnerProtocol",
      "destination",
      "sha256",
      "stable catalog",
      "package version",
      "protocol 1",
    ])
      expect(assetGuide).toContain(phrase);
  });

  it("documents integrity, all-or-nothing safety, idempotency, collisions, rollback, and remediation", () => {
    for (const phrase of [
      "package-local",
      "integrity trust source",
      "ASSET_PROTOCOL_INCOMPATIBLE",
      "ASSET_INTEGRITY_INVALID",
      "ASSET_MANIFEST_INVALID",
      "ASSET_PATH_INVALID",
      "ASSET_LOCAL_MODIFIED",
      "ASSET_FILESYSTEM_FAILED",
      "ASSET_ROLLBACK_UNCERTAIN",
      "all-or-nothing",
      "Existing desired bytes are never rewritten",
      "prior manifest digest",
      "No files changed",
      "no force option",
      "same-volume staged files",
      "manifest last",
      "version control",
      "preserves every unrelated `.agents/` path",
    ])
      expect(assetGuide).toContain(phrase);
  });

  it("documents Operator, Assessor, and unchanged Doctor authority boundaries", () => {
    for (const phrase of [
      "soft-factory run --issue <number>",
      "soft-factory doctor --json",
      "complete result",
      "top-level `ready` value as authoritative",
      "cannot infer READY",
      "canonical 24 ordered blocking checks",
      ".github/agents/rpiv.agent.md",
      "does not inspect",
      "worktrees, locks, state, tmux/process",
    ])
      expect(assetGuide).toContain(phrase);
  });

  it("documents npm packaging, additive migration, configuration/API no-impact, and local deployment", () => {
    for (const phrase of [
      "explicit npm `files` allowlist",
      "dist/",
      "assets/official/",
      "npm pack --dry-run --json",
      "no configuration migration",
      "no network API contract",
      "API specification",
      "API migration",
      "short-lived CLI invocation",
      "no-network",
      "does not fetch a remote catalog",
      "invoke a subprocess",
      "just verify-focused",
      "just verify",
    ])
      expect(assetGuide).toContain(phrase);
    expect(docsIndex).toContain(
      "Phase 5 official asset installation and operations",
    );
    expect(readme).toContain("docs/phase-5-official-assets.md");
    expect(assetGuide).not.toMatch(/^soft-factory\s/m);
  });

  it("exposes the cumulative Phase 5 command grammar in help", () => {
    const help = spawnSync("just", ["run", "--help"], {
      cwd: root,
      encoding: "utf8",
    });
    expect(help.status).toBe(0);
    expect(help.stdout).toContain("Soft Factory Runner Phase 5");
    for (const command of [
      "soft-factory install agent soft-factory",
      "soft-factory install agent soft-factory-assessor",
      "soft-factory install skill soft-factory",
      "soft-factory install --recommended",
      "soft-factory doctor [--json]",
      "soft-factory instructions [--json]",
      "soft-factory run --issue <number> [--json]",
    ])
      expect(help.stdout).toContain(command);
  });
});
