import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import path from "node:path";
import { parseSnapshot } from "./persistence";

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
const runReconciliationContract = read(
  "project/architecture/core-components/CORE-COMPONENT-260811-run-reconciliation-control.md",
);
const tmuxIdentityContract = read(
  "project/architecture/core-components/CORE-COMPONENT-260814-tmux-identity-diagnostics.md",
);
const decisionLog = read("project/architecture/ADR/DECISION-LOG.md");
const verifierAgent = read(".github/agents/rpiv-verifier.agent.md");
const rpivAgent = read(".github/agents/rpiv.agent.md");
const packageJson = read("package.json");
const agents = read("AGENTS.md");
const prd = read("PRD.md");

function sectionBetween(
  document: string,
  startHeading: string,
  endHeading: string,
): string {
  const start = document.indexOf(startHeading);
  const end = document.indexOf(endHeading, start + startHeading.length);
  if (start < 0 || end <= start)
    throw new Error(
      `Missing or reversed documentation section: ${startHeading}`,
    );
  return document.slice(start, end);
}

function firstFencedJson(section: string): unknown {
  const match = /```json\n([\s\S]*?)\n```/.exec(section);
  if (match?.[1] === undefined)
    throw new Error("Documentation section has no fenced JSON object.");
  return JSON.parse(match[1]);
}

function requiredObject(value: unknown): object {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw new Error("Expected a JSON object.");
  return value;
}

function objectValue(value: unknown, key: string): unknown {
  return Reflect.get(requiredObject(value), key);
}

describe("V-11 Phase 3 operator documentation", () => {
  it("documents executable RPIV integration, migration, safety, and no API/deployment service", () => {
    for (const phrase of [
      "IntegrationContractV1",
      "rpiv.final_validation",
      "just <recipe>",
      "RunSnapshotV5",
      "sole `just verify`",
      "just verify-focused",
      "RpivStatusV1",
      "PROGRESS_MISSING",
      "PROGRESS_CONFLICT",
      "phase `unknown`",
      "lastAccepted",
      "never a display fallback",
      "AgentResultV1",
      "requiredFinalValidation",
      "no-clobber",
      "pull request is created",
      "coordinator",
      "No valid final artifact",
      "Copilot environment names and values",
      "no network API",
      "no elapsed-age timeout",
      "terminal `failed` publication",
      "classifies before writing",
      "Candidate `prNumber` is never trusted",
      "verification summary and verifier retro commits",
      "missing root `justfile`",
      "strictly cross-checks launch run ID",
      "Every progress classification",
      "exact historical AgentResult shape",
      "only at the version-aware legacy persistence/recovery boundary",
      "Current AgentResultV1 publication and v4/v5 snapshot parsing still require the strict new shape",
    ])
      expect(integrationGuide).toContain(phrase);
    expect(readme).toContain("just run instructions --json");
    expect(readme).toContain("missing root file fails before ownership");
    expect(readme).toContain(
      "valid completed v2/v3 snapshots with the historical pre-binding AgentResult remain readable",
    );
    expect(operations).toContain(
      "no progress classification changes completion, activity, decision code, safe actions, cleanup eligibility, ownership, recovery, or process control",
    );
    expect(docsIndex).toContain(
      "RPIV integration, progress, and completion handoff",
    );
    expect(rpivAgent).toContain("soft-factory instructions --json");
    expect(rpivAgent).toContain("injected local AgentResultV1 validator");
    expect(verifierAgent).toContain("publish strict AgentResultV1 only after");
    expect(verifierAgent).toContain("injected no-clobber Runner helper");
    expect(rpivAgent).toContain("publish-failed-terminal-progress");
    expect(rpivAgent).toContain("preserve ORIGINAL_FAILURE verbatim first");
    const createPr = verifierAgent.indexOf("RUN `create-pull-request`");
    const summary = verifierAgent.indexOf("RUN `write-verification-summary`");
    const confirmHead = verifierAgent.indexOf(
      "RUN `confirm-final-head-and-pr`",
    );
    const publishResult = verifierAgent.indexOf("RUN `publish-agent-result`");
    expect(createPr).toBeGreaterThan(-1);
    expect(summary).toBeGreaterThan(createPr);
    expect(confirmHead).toBeGreaterThan(summary);
    expect(publishResult).toBeGreaterThan(confirmHead);
    const router = rpivAgent.slice(
      rpivAgent.indexOf('<process id="rpiv-router"'),
      rpivAgent.indexOf('<process id="publish-research-progress"'),
    );
    const failedReturns =
      router.match(/RETURN: format="PIPELINE_ERROR"/g) ?? [];
    const failedPublications =
      router.match(/RUN `publish-failed-terminal-progress`/g) ?? [];
    expect(failedReturns.length).toBeGreaterThanOrEqual(10);
    expect(failedPublications).toHaveLength(failedReturns.length);
    expect(issueRun).not.toContain(
      "exactly one passed `just verify-focused` and `just verify`",
    );
  });

  it("guards corrected v5 architecture and final publication ordering against stale contracts", () => {
    for (const phrase of [
      "Persist new runs as `RunSnapshotV5`",
      "snapshot versions 1 through 5",
      "explicit revisioned v5 transition",
      "a complete resulting `RunSnapshotV3`, `RunSnapshotV4`, or `RunSnapshotV5`",
      "nullable `tmuxIdentityDiagnostic`",
    ])
      expect(runReconciliationContract).toContain(phrase);
    expect(runReconciliationContract).not.toContain(
      "Persist new runs as `RunSnapshotV3`",
    );
    expect(runReconciliationContract).not.toContain(
      "Read valid snapshot versions 1 through 3",
    );
    expect(decisionLog).toContain(
      "Read RunSnapshotV1-V5 and persist new runs as revisioned RunSnapshotV5",
    );
    for (const phrase of [
      "commits and pushes the required verification summary and verifier retro records",
      "independently confirms that the pull request points at the resulting final head",
      "Only after that confirmation",
    ])
      expect(issueRun).toContain(phrase);
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
      "RunSnapshotV5",
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
      "`RunSnapshotV1` through `RunSnapshotV5`",
      "never silently treated as v4 or v5",
      "concurrency slot lease",
      "strictly parsed result artifact identity, content",
      "permission-denied process metadata",
      "exact historical AgentResult parser only at the legacy boundary",
      "historical result shape remains invalid for current publication and v4/v5 snapshots",
    ])
      expect(operations).toContain(phrase);
    expect(issueRun).toContain("Phase 3 continuation");
    expect(issueRun).not.toContain("## Remaining Prototype 3 deferrals");
    expect(issueRun).not.toContain("operator cancellation control is deferred");
    expect(issueRun).not.toContain(
      "Only an explicit version 2 transition can carry required evidence",
    );
  });

  it("documents strict result-candidate finalization recovery without inferred authority", () => {
    for (const phrase of [
      "RESULT_RECOVERY_CANDIDATE",
      "FINALIZATION_RECOVERY_AVAILABLE",
      "unaccepted recovery candidate",
      "ordered acceptance set",
      "query inputs",
      "active_preserved",
      "Unknown takes precedence over mismatch",
      "Malformed tmux remains unknown",
      "launches no worker/RPIV",
      "never authorizes cleanup",
      "fails closed",
    ])
      expect(readme + operations).toContain(phrase);
    expect(operations).toContain(
      "no configuration option/default, network API, data migration, service, container, or deployment change",
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

describe("V-8 Issue 29 tmux identity recovery documentation", () => {
  it("documents exact transport, diagnostic bounds, lifecycle, and rendering", () => {
    for (const document of [readme, issueRun, operations, prd]) {
      for (const phrase of [
        "UTF-8 and non-UTF8",
        "@<digits>|%<digits><LF>",
        "terminal LF",
        "first two",
        "malformed or ambiguous",
      ])
        expect(document).toContain(phrase);
      expect(document).not.toContain("Upgrade tmux");
    }
    for (const phrase of [
      "TmuxIdentityDiagnosticV1",
      "8",
      "32",
      "value-free",
      "raw stdout/stderr",
      "other-run",
      "replaced by a later identity failure",
      "clears only after valid create/observe identity proof",
      "Malformed zero-exit observation is unknown",
      "nonzero observation remains absence",
      "only one observation",
    ])
      expect(operations + issueRun).toContain(phrase);
    for (const phrase of [
      "RunSnapshotV5",
      "ReconciliationReportV2",
      "status schema v4",
      "explicit revisioned transitions",
      "complete exact-target authority",
    ])
      expect(readme + operations + prd).toContain(phrase);
    expect(tmuxIdentityContract).toContain(
      "window_id`, `pane_id`, `vertical_bar`, `horizontal_tab`, `carriage_return`, `line_feed`, `backslash`, or `other",
    );
  });

  it("documents exact zero-candidate retry, same-name refusal, and logs independence", () => {
    for (const phrase of [
      "fetched-base advertised HEAD",
      "staged/unstaged/untracked cleanliness",
      "zero same-name candidates",
      "immediately before one creation attempt",
      "unknown ownership",
      "never inspected or adopted",
      "name, cwd, identity, or process command",
      "non-authorizing",
      "LOG_NOT_FOUND",
    ])
      expect(readme + operations + prd).toContain(phrase);
    expect(issueRun).toContain("TMUX_IDENTITY_MALFORMED");
    expect(operations).toContain("RESOURCE_OWNERSHIP_UNKNOWN");
  });

  it("locks the Phase 1 persistence grammar and version semantics to its section", () => {
    const section = sectionBetween(
      issueRun,
      "## Persistence and status",
      "## Troubleshooting",
    );
    expect(section).toContain(
      "Supported v1-v3 inputs normalize through v4 to sole just verify and never consult later configuration; supported v4 inputs preserve their snapshotted final validation while normalizing through an explicit revisioned v5 transition; malformed persistence fails safe.",
    );
    expect(section).not.toContain("all supported inputs to sole");
    expect(section).toContain("new runs use revisioned `RunSnapshotV6`");
    expect(section).toContain(
      "Valid Phase 1 `RunSnapshotV1` files remain readable",
    );
    expect(section).toContain(
      "Only an explicit proved versioned transition can carry required evidence",
    );
  });

  it("parses the exact current PRD RunSnapshotV6 and distinguishes schema families", () => {
    const assetSection = sectionBetween(
      prd,
      "# 12. Asset Manifest",
      "# 13. Installation Safety",
    );
    const doctorSection = sectionBetween(
      prd,
      "# 21. Doctor JSON Output",
      "# 22. Issue Execution",
    );
    const snapshotSection = sectionBetween(
      prd,
      "# 33. Run Snapshot",
      "# 34. Transition Events",
    );
    const resultSection = sectionBetween(
      prd,
      "# 35. RPIV Result Artifact",
      "# 36. Completion Reconciliation",
    );
    expect(snapshotSection).toContain("New runs write `RunSnapshotV6`");
    expect(snapshotSection).toContain(
      "Snapshot versions v1-v5 are compatibility inputs only and migrate only through supported explicit transitions that prove an exact target.",
    );

    const assetExample = firstFencedJson(assetSection);
    const doctorExample = firstFencedJson(doctorSection);
    const snapshotExample = firstFencedJson(snapshotSection);
    const resultExample = firstFencedJson(resultSection);
    expect({
      asset: objectValue(assetExample, "schemaVersion"),
      doctor: objectValue(doctorExample, "schemaVersion"),
      snapshot: objectValue(snapshotExample, "schemaVersion"),
      result: objectValue(resultExample, "schemaVersion"),
    }).toEqual({ asset: 1, doctor: 2, snapshot: 6, result: 1 });

    const expectedKeys = [
      "schemaVersion",
      "runId",
      "ownerId",
      "repository",
      "issueNumber",
      "state",
      "branchType",
      "branch",
      "worktreePath",
      "fetchedBaseProof",
      "tmuxSelection",
      "tmux",
      "copilot",
      "error",
      "updatedAt",
      "revision",
      "attempt",
      "admission",
      "launchIntent",
      "workerProcess",
      "rpivProcess",
      "stop",
      "cleanup",
      "logs",
      "mergedPullRequest",
      "requiredAcceptanceCriteria",
      "finalization",
      "requiredFinalValidation",
      "integrationLaunch",
      "progress",
      "tmuxIdentityDiagnostic",
    ].sort();
    expect(Object.keys(requiredObject(snapshotExample)).sort()).toEqual(
      expectedKeys,
    );
    expect(parseSnapshot(JSON.stringify(snapshotExample), 123)).toEqual(
      snapshotExample,
    );

    const launch = objectValue(snapshotExample, "integrationLaunch");
    expect(Object.keys(requiredObject(launch)).sort()).toEqual(
      [
        "schemaVersion",
        "runId",
        "attempt",
        "issueNumber",
        "branch",
        "startedAt",
        "progressPath",
        "resultPath",
        "requiredFinalValidation",
        "publishProgressCommand",
        "publishResultCommand",
        "validateResultCommand",
      ].sort(),
    );
    expect(objectValue(launch, "schemaVersion")).toBe(1);
    for (const key of ["runId", "attempt", "issueNumber", "branch"])
      expect(objectValue(launch, key)).toEqual(
        objectValue(snapshotExample, key),
      );
    expect(objectValue(launch, "startedAt")).toBe(
      objectValue(snapshotExample, "updatedAt"),
    );
    expect(objectValue(launch, "progressPath")).toBe(
      ".trees/123/.soft-factory/rpiv-status.json",
    );
    expect(objectValue(launch, "resultPath")).toBe(
      ".trees/123/.soft-factory/agent-result.json",
    );
    expect(objectValue(launch, "requiredFinalValidation")).toEqual(
      objectValue(snapshotExample, "requiredFinalValidation"),
    );
    expect(objectValue(launch, "publishProgressCommand")).toBe(
      "soft-factory internal publish-progress --issue 123 --phase <phase> --status <status>",
    );
    expect(objectValue(launch, "publishResultCommand")).toBe(
      "soft-factory internal publish-result --issue 123 --candidate .soft-factory/agent-result.candidate.json",
    );
    expect(objectValue(launch, "validateResultCommand")).toBe(
      "soft-factory internal validate-result --issue 123",
    );
  });

  it("documents controlled validation and no API configuration or deployment impact", () => {
    for (const command of [
      "just verify-focused",
      "just verify",
      "harness checks --focused --json",
      "harness checks --json",
    ])
      expect(issueRun + operations + readme).toContain(command);
    for (const phrase of [
      "no configuration option/default",
      "no configuration migration",
      "no network API",
      "no API specification",
      "no deployment",
    ])
      expect(readme + docsIndex + operations).toContain(phrase);
    expect(operations).toContain("byte-aware tmux/process adapters");
    expect(operations).toContain("exact six-byte no-HT record");
  });
});

describe("V-15 Phase 4 repository Doctor documentation", () => {
  it("documents all ordered blocking checks and shared schema-v2 exits", () => {
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

  it("documents private functional tmux proof, bounded cleanup, and value-free evidence", () => {
    for (const phrase of [
      "mode-0700",
      "mode-0600",
      "tmux -D -S <private-socket> -f <empty-config>",
      "with no command",
      "exact same private `-S <private-socket>` selector",
      "#{window_id}|#{pane_id}<LF>",
      "#{window_id}|#{pane_id}|#{pane_current_path}<LF>",
      "remain-on-exit",
      "original bytes",
      "4096",
      "2000 ms",
      "6500 ms",
      "2500 ms",
      "7000 ms",
      "7250 ms",
      "7750 ms",
      "8250 ms",
      "9000 ms",
      "unconditional cleanup",
      "DoctorResultV2",
      "DoctorTmuxProbeEvidenceV1",
      "value-free",
      "ambient/default",
    ])
      expect(doctorGuide).toContain(phrase);
    expect(doctorGuide).toContain("Do not inspect or mutate an ambient server");
    expect(doctorGuide).toContain("never use name-wide/PID-only destruction");
    expect(readme).toContain("function, not only executable presence");
    expect(prd).toContain("Signaling by process name, unsafe PID alone");
  });

  it("documents strict schema-v2 migration, controlled validation, and no unrelated migration", () => {
    for (const document of [readme, doctorGuide, prd]) {
      expect(document).toContain("DoctorResultV2");
      expect(document).toContain("schemaVersion: 2");
    }
    for (const command of [
      "just verify-focused",
      "harness checks --focused --json",
      "just verify",
      "harness checks --json",
    ])
      expect(doctorGuide).toContain(command);
    for (const phrase of [
      "no configuration option/default",
      "run snapshot",
      "issue-run tmux",
      "network API",
      "database/data migration",
      "service",
      "container",
      "deployment procedure",
    ])
      expect(readme + doctorGuide + docsIndex).toContain(phrase);
    expect(JSON.parse(read("fixtures/doctor/ready.json")).schemaVersion).toBe(
      2,
    );
    expect(JSON.parse(read("fixtures/doctor/blocked.json")).schemaVersion).toBe(
      2,
    );
    expect(
      JSON.parse(read("fixtures/doctor/isolated-failures.json")).schemaVersion,
    ).toBe(2);
    expect(readme).not.toContain("schema-version-1 automation output");
    expect(doctorGuide).not.toContain("DoctorResultV1");
    expect(doctorGuide).not.toContain(
      "`tmux` is an executable on PATH; install or correct PATH",
    );
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

describe("V10 one-agent help, consumer documentation, and PRD contract", () => {
  it("documents exact current commands, destination, manifest, and invocation", () => {
    for (const command of [
      "just run install agent soft-factory",
      "just run install --recommended",
      "soft-factory run --issue <number> --json",
    ])
      expect(assetGuide).toContain(command);
    expect(readme).toContain("just run install agent soft-factory");
    expect(readme).toContain("just run install --recommended");
    for (const phrase of [
      "exactly one consumable official asset",
      "assets/official/soft-factory.agent.md",
      ".github/agents/soft-factory.agent.md",
      ".agents/manifest.json",
      "schema version 1",
      "runnerProtocol",
      "destination",
      "sha256",
      "package-coupled",
      "protocol 1",
    ])
      expect(assetGuide).toContain(phrase);
    const manifestStart = prd.indexOf("# 12. Asset Manifest");
    const manifestEnd = prd.indexOf("# 13. Installation Safety", manifestStart);
    expect(manifestStart).toBeGreaterThanOrEqual(0);
    expect(manifestEnd).toBeGreaterThan(manifestStart);
    const manifestSection = prd.slice(manifestStart, manifestEnd);
    expect(manifestSection).toContain('"schemaVersion": 1');
    expect(manifestSection).not.toContain('"schemaVersion": 2');
    const doctorStart = prd.indexOf("# 21. Doctor JSON Output");
    const doctorEnd = prd.indexOf("# 22. Issue Execution", doctorStart);
    expect(doctorStart).toBeGreaterThanOrEqual(0);
    expect(doctorEnd).toBeGreaterThan(doctorStart);
    const doctorSection = prd.slice(doctorStart, doctorEnd);
    expect(doctorSection).toContain('"schemaVersion": 2');
    expect(doctorSection).not.toContain('"schemaVersion": 1');
  });

  it("locks every current PRD official-agent surface to delivery-only dispatch", () => {
    const start = prd.indexOf("# 15. Soft Factory Delivery Agent");
    const end = prd.indexOf("# 18. Repository Doctor", start);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const currentAgent = prd.slice(start, end);

    for (const phrase of [
      "exactly one explicitly selected GitHub issue dispatch",
      "Before any terminal use",
      "exactly one canonical positive base-10 issue number",
      "missing, multiple, zero or nonpositive, signed, fractional, leading-zero, unsafe-range, and otherwise invalid",
      "soft-factory instructions --json",
      "soft-factory doctor --json",
      "soft-factory run --issue <number> --json",
      "only when Doctor explicitly reports ready",
      "applicable structured instructions, Doctor, or run output unchanged and byte-for-byte",
      "report dispatch acceptance separately from issue completion",
      "keep completion `unknown` unless",
      "does not retry or query status",
      "not a general Runner operator or lifecycle control plane",
      "official Delivery Agent is authorized only for the one validated dispatch sequence",
    ])
      expect(currentAgent).toContain(phrase);

    const instructions = currentAgent.indexOf(
      "soft-factory instructions --json",
    );
    const doctor = currentAgent.indexOf("soft-factory doctor --json");
    const run = currentAgent.indexOf(
      "soft-factory run --issue <number> --json",
    );
    expect(instructions).toBeLessThan(doctor);
    expect(doctor).toBeLessThan(run);
    expect(currentAgent.match(/soft-factory run --issue/g)).toHaveLength(1);

    for (const command of [
      "install",
      "list",
      "status",
      "attach",
      "logs",
      "reconcile",
      "resume",
      "stop",
      "clean",
      "internal",
    ])
      expect(currentAgent).not.toContain("soft-factory " + command);
    for (const stale of [
      "Operator Agent",
      "The Delivery Agent MAY invoke",
      "lifecycle, state model, failure modes",
      "reconcile interrupted runs",
      "inspect logs",
      "help the user attach",
      "Which Runner command should be used?",
      "both humans and agents can operate",
    ])
      expect(prd).not.toContain(stale);
    expect(prd).toContain(
      "The official Delivery Agent may perform only one validated issue dispatch",
    );
    expect(prd).toContain(
      "The complete Runner CLI remains available to humans",
    );
  });

  it("documents complete migration, refusal, sibling, idempotency, and rollback behavior", () => {
    for (const phrase of [
      ".agents/agents/soft-factory.agent.md",
      "Install trusted current packaged bytes",
      "independently retire the digest-proved old owned file",
      "absent old file",
      "Both agent destinations",
      "Adopt without rewriting",
      "upgrade",
      "historical assessor or skill",
      "ASSET_LOCAL_MODIFIED",
      "No files changed",
      "An untracked sibling",
      "only when a file retired in that operation leaves them empty",
      "zero mutations",
      "manifest last",
      "ASSET_ROLLBACK_UNCERTAIN",
      "every listed path",
      "version control or backup",
      "retry only after restoration",
    ])
      expect(assetGuide).toContain(phrase);
    expect(assetGuide).not.toContain(
      "Move to the current destination and retire the old owned file",
    );
  });

  it("documents exact package allowlist, Doctor authority, and no API or deployment impact", () => {
    for (const phrase of [
      "explicit npm",
      "exact `assets/official/soft-factory.agent.md` source",
      "assets/official/theoutsideone.agent.md",
      "npm pack --dry-run --json",
      "canonical 24 ordered Doctor checks",
      ".github/agents/rpiv.agent.md",
      "no network API contract",
      "API specification",
      "service endpoint",
      "daemon",
      "webhook",
      "container",
      "deployment change",
      "no configuration migration",
      "short-lived",
    ])
      expect(assetGuide).toContain(phrase);
    expect(docsIndex).toContain(
      "Phase 5 official delivery-agent installation and migration",
    );
    expect(readme).toContain("docs/phase-5-official-assets.md");
    expect(prd).toContain("exactly one versioned official asset");
    expect(prd).toContain("no API, service, daemon, webhook, container");
  });

  it("does not advertise removed selectors or old destination as the current surface", () => {
    for (const document of [readme, docsIndex]) {
      expect(document).not.toContain(
        "soft-factory install agent soft-factory-assessor",
      );
      expect(document).not.toContain("soft-factory install skill soft-factory");
      expect(document).not.toContain(
        "installs the Operator at .agents/agents/soft-factory.agent.md",
      );
    }
    expect(assetGuide).toContain("removed assessor and skill selectors");
  });

  it("exposes only current installation forms in cumulative help", () => {
    const help = spawnSync("just", ["run", "--help"], {
      cwd: root,
      encoding: "utf8",
    });
    expect(help.status).toBe(0);
    for (const command of [
      "soft-factory install agent soft-factory",
      "soft-factory install --recommended",
      "soft-factory doctor [--json]",
      "soft-factory instructions [--json]",
      "soft-factory run --issue <number> [--json]",
      ".github/agents/soft-factory.agent.md",
    ])
      expect(help.stdout).toContain(command);
    expect(help.stdout).not.toContain("soft-factory-assessor");
    expect(help.stdout).not.toContain("install skill");
  });
});

describe("Issue 31 APS Semantic Versioning instructions", () => {
  const rules = [
    "You MUST assign every code or package change the correct Semantic Versioning major, minor, or patch release before delivery.",
    "You MUST increment the major version for incompatible public-contract changes when the current major version is at least 1.",
    "You MUST increment the minor version for backward-compatible functionality.",
    "You MUST increment the minor version for incompatible public-contract changes before 1.0.0.",
    "You MUST increment the patch version for backward-compatible defect corrections.",
    "You MUST set version 1.0.0 only for a delivery that explicitly establishes the stable public contract.",
  ] as const;

  it("contains each exact one-line absolute directive once", () => {
    const match = /<instructions>\n([\s\S]*?)\n<\/instructions>/.exec(agents);
    expect(match?.[1]).toBeDefined();
    const lines = (match?.[1] ?? "").split("\n");
    for (const rule of rules) {
      expect(lines.filter((line) => line === rule)).toHaveLength(1);
      expect(rule.startsWith("You MUST ")).toBe(true);
    }
    expect(
      lines.slice(lines.indexOf(rules[0]), lines.indexOf(rules[5]) + 1),
    ).toEqual(rules);
  });

  it("preserves the surrounding governance order and classifies all increments", () => {
    const bounded = agents.indexOf(
      "You MUST keep issue acceptance criteria bounded, observable, and executable",
    );
    const semver = agents.indexOf(rules[0]);
    const badge = agents.indexOf("You MUST update the APS version badge");
    const review = agents.indexOf(
      "You MUST mark a PR review comment as resolved",
    );
    expect(bounded).toBeLessThan(semver);
    expect(semver).toBeLessThan(badge);
    expect(badge).toBeLessThan(review);
    expect(rules.join("\n")).toContain("major version");
    expect(rules.join("\n")).toContain("minor version");
    expect(rules.join("\n")).toContain("patch version");
    expect(rules.join("\n")).toContain("before 1.0.0");
    expect(rules.join("\n")).toContain("stable public contract");
  });
});

describe("Issue 36 exact tmux ownership and 0.2.0 guidance", () => {
  it("keeps the issue-run guide structurally unique and grammatically complete", () => {
    const title = "# Issue run and Phase 2 completion proof";
    const bodyAnchor =
      "Runner validates and exclusively owns an explicit GitHub issue";
    const headings = issueRun.match(/^#{1,3} .+$/gm) ?? [];
    const levelTwoHeadings = issueRun.match(/^## .+$/gm) ?? [];

    expect(issueRun.split(title)).toHaveLength(2);
    expect(issueRun.split(bodyAnchor)).toHaveLength(2);
    expect(new Set(headings).size).toBe(headings.length);
    expect(levelTwoHeadings).toEqual([
      "## Prerequisites and commands",
      "## Configuration and readiness",
      "## Strict tmux identity transport and diagnostics",
      "## RPIV result artifact",
      "## Finalization and false-completion protection",
      "## Persistence and status",
      "## Troubleshooting",
      "## Deterministic evidence fixtures",
      "## Phase 3 continuation",
      "## Invoking tmux target and v6 migration",
    ]);
    expect(issueRun.split("^@[0-9]+$")).toHaveLength(2);
    expect(issueRun.split("^%[0-9]+$")).toHaveLength(2);
    expect(issueRun).not.toMatch(/\^[@%]\[0-9\]\+#/);
    expect(issueRun).not.toMatch(/^\s+(?:and pane ID|validation\.)/m);
  });
  it("documents both client states, closed framing, cwd retention, and confidentiality", () => {
    for (const document of [
      readme,
      issueRun,
      operations,
      doctorGuide,
      docsIndex,
      prd,
    ]) {
      expect(document).toContain("UTF-8 and non-UTF8");
      expect(document).not.toContain("<HT>");
      expect(document).not.toContain("optional final LF");
    }
    for (const document of [readme, issueRun, operations, doctorGuide, prd])
      expect(document).toContain("vertical bar");
    expect(issueRun + operations + prd).toContain(
      "@<digits>|%<digits>|<cwd><LF>",
    );
    expect(readme + issueRun + operations + doctorGuide).toContain(
      "exactly one terminal LF",
    );
    expect(readme + issueRun + operations + doctorGuide).toContain(
      "additional vertical bars",
    );
    for (const document of [readme, issueRun, operations, doctorGuide]) {
      expect(document).toContain("value-free");
      expect(document).toMatch(/raw (?:output|stdout\/stderr|bytes)/i);
    }
  });

  it("documents invoking selection, v6 lifecycle isolation, refusal, confidentiality, and Doctor classification", () => {
    const combined = [
      readme,
      issueRun,
      operations,
      doctorGuide,
      docsIndex,
      prd,
    ].join("\n");
    for (const phrase of [
      "TMUX_PANE",
      "standalone",
      "RunSnapshotV6",
      "same-name",
      "never adopted",
      "persisted socket",
      "invalid-context",
      "server PIDs",
      "v1-v5",
      "no network API",
    ])
      expect(combined).toContain(phrase);
    expect(readme).toContain("Complete equality authorizes action");
    expect(operations).toContain("tmux -S <persisted-socket>");
    expect(doctorGuide).toContain("ordered 24 check IDs");
  });

  it("documents exact local 0.1.3-to-0.2.0 upgrade, reinstall, confirmation, and reconvergence", () => {
    expect((JSON.parse(packageJson) as { version: string }).version).toBe(
      "0.2.0",
    );
    for (const document of [readme, assetGuide, docsIndex]) {
      expect(document).toContain("0.2.0");
      expect(document).toContain("0.1.3");
      expect(document).not.toContain("soft-factory --version");
      expect(document).not.toContain("registry publication complete");
    }
    for (const phrase of [
      "just build",
      "npm pack --json --pack-destination",
      "npm install --ignore-scripts --no-audit --no-fund --omit=dev --prefix",
      "node -p",
      "package.json",
      "npm uninstall --prefix",
      'soft-factory" install --recommended',
      ".agents/manifest.json",
      "ASSETS_UP_TO_DATE",
      "does not claim registry publication",
      "no `--version` command",
    ])
      expect(readme + assetGuide + docsIndex).toContain(phrase);
  });
});

describe("Issue 34 post-wait operator contract", () => {
  it("documents reload identity, refusal, preservation, race, and idempotence", () => {
    for (const phrase of [
      "reloads the strict current snapshot",
      "run ID, owner ID, complete worker identity, and complete RPIV identity",
      "POST_WAIT_STATE_REFUSED",
      "run_mismatch",
      "owner_mismatch",
      "worker_mismatch",
      "rpiv_mismatch",
      "state_advanced",
      "no stale fallback save",
      "idempotent",
    ])
      expect(readme + issueRun + operations).toContain(phrase);
    for (const phrase of [
      "progress",
      "immutable result",
      "retained diagnostic",
      "duplicate launch",
      "result overwrite",
    ])
      expect(readme + issueRun + operations).toContain(phrase);
  });

  it("states the no-impact migration and deployment scope", () => {
    for (const phrase of [
      "network API",
      "configuration",
      "snapshot schema",
      "database",
      "data migration",
      "service",
      "container",
      "deployment",
    ])
      expect(readme + issueRun).toContain(phrase);
  });
});
