import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import path from "node:path";
import {
  checkOperatorContract,
  OPERATOR_APS_SECTIONS,
  OPERATOR_FRONTMATTER,
  OPERATOR_REQUIRED_DELIVERY_CONTRACT,
  OPERATOR_REQUIRED_INPUT_DIRECTIVES,
  OPERATOR_REQUIRED_PROHIBITIONS,
} from "./official-agent-contracts";
import {
  OFFICIAL_ASSET_CATALOG,
  OFFICIAL_ASSET_VERSION,
  officialAssetKey,
} from "./official-assets";

const root = path.resolve(__dirname, "..");
const sourceBytes = (source: string) =>
  fs.readFileSync(path.join(root, source));
const operator = sourceBytes(OFFICIAL_ASSET_CATALOG[0].source).toString("utf8");

describe("V1 sole catalog, source, and npm package contract", () => {
  it("defines exactly the current delivery agent with trusted metadata", () => {
    expect(OFFICIAL_ASSET_CATALOG.map(officialAssetKey)).toEqual([
      "agent:soft-factory",
    ]);
    expect(OFFICIAL_ASSET_CATALOG.map((entry) => entry.destination)).toEqual([
      ".github/agents/soft-factory.agent.md",
    ]);
    const packageVersion = JSON.parse(
      fs.readFileSync(path.join(root, "package.json"), "utf8"),
    ).version;
    const entry = OFFICIAL_ASSET_CATALOG[0];
    expect(entry.version).toBe(packageVersion);
    expect(entry.version).toBe(OFFICIAL_ASSET_VERSION);
    expect(entry.runnerProtocol).toBe(1);
    expect(
      createHash("sha256").update(sourceBytes(entry.source)).digest("hex"),
    ).toBe(entry.sha256);
    expect(
      fs.existsSync(
        path.join(root, "assets/official/soft-factory-assessor.agent.md"),
      ),
    ).toBe(false);
    expect(
      fs.existsSync(path.join(root, "assets/official/soft-factory/SKILL.md")),
    ).toBe(false);
  });

  it("publishes exactly one official source even with local reference material present", () => {
    expect(
      spawnSync("just", ["build"], { cwd: root, encoding: "utf8" }).status,
    ).toBe(0);
    const packed = spawnSync("npm", ["pack", "--dry-run", "--json"], {
      cwd: root,
      encoding: "utf8",
    });
    expect(packed.status).toBe(0);
    const files = (
      JSON.parse(packed.stdout)[0].files as { path: string }[]
    ).map((entry) => entry.path);
    expect(files.filter((file) => file.startsWith("assets/official/"))).toEqual(
      ["assets/official/soft-factory.agent.md"],
    );
    expect(files).toContain("dist/official-assets.js");
    expect(files).not.toContain("assets/official/theoutsideone.agent.md");
    expect(files).not.toContain(
      "assets/official/soft-factory-assessor.agent.md",
    );
    expect(files).not.toContain("assets/official/soft-factory/SKILL.md");
    for (const prefix of [
      ".agents/",
      ".soft-factory/",
      ".harness/",
      "project/",
      "src/",
      "fixtures/",
    ])
      expect(files.some((file) => file.startsWith(prefix))).toBe(false);
  });
});

describe("V2 APS Copilot delivery-agent static contract", () => {
  it("has exact qualified frontmatter and ordered APS tag-newline form", () => {
    expect(operator.startsWith(OPERATOR_FRONTMATTER + "\n\n")).toBe(true);
    expect(operator).not.toContain("tools:\n  - bash");
    expect(operator).not.toContain("\t");
    expect(operator).not.toMatch(/^\s*\/\//m);
    let previous = -1;
    for (const section of OPERATOR_APS_SECTIONS) {
      const opening = `<${section}>`;
      const closing = `</${section}>`;
      const index = operator.indexOf(opening);
      expect(index).toBeGreaterThan(previous);
      expect(operator.indexOf(opening, index + opening.length)).toBe(-1);
      expect(operator.indexOf(closing)).toBeGreaterThan(index);
      expect(operator).toContain(`${opening}\n`);
      expect(operator).toContain(`\n${closing}`);
      previous = index;
    }
  });

  it("requires every input, delivery, output, and Runner-only clause mutation-sensitively", () => {
    expect(checkOperatorContract(operator)).toEqual({
      valid: true,
      missing: [],
      forbidden: [],
    });
    for (const phrase of [
      OPERATOR_FRONTMATTER,
      ...OPERATOR_REQUIRED_INPUT_DIRECTIVES,
      ...OPERATOR_REQUIRED_DELIVERY_CONTRACT,
      ...OPERATOR_REQUIRED_PROHIBITIONS,
    ]) {
      const result = checkOperatorContract(
        operator.split(phrase).join("removed-contract-clause"),
      );
      expect(result.valid).toBe(false);
      expect(result.missing.length).toBeGreaterThan(0);
    }
  });

  it("places input validation, instructions, Doctor readiness, and the one run in exact order", () => {
    const process = operator.slice(
      operator.indexOf("<processes>"),
      operator.indexOf("</processes>"),
    );
    const validation = process.indexOf("ASSERT INPUT_VALID is true");
    const firstUse = process.indexOf("USE `execute/runInTerminal`");
    const instructions = process.indexOf(
      'command="soft-factory instructions --json"',
    );
    const instructionsFailure = process.indexOf(
      "IF INSTRUCTIONS_RESULT indicates command failure:",
    );
    const doctor = process.indexOf('command="soft-factory doctor --json"');
    const nonReady = process.indexOf(
      "IF DOCTOR_RESULT does not explicitly report ready true:",
    );
    const ready = process.indexOf(
      "ASSERT DOCTOR_RESULT explicitly reports ready true",
    );
    const run = process.indexOf(
      'command="soft-factory run --issue <ISSUE_NUMBER> --json"',
    );
    expect(validation).toBeLessThan(firstUse);
    expect(instructions).toBeLessThan(instructionsFailure);
    expect(instructionsFailure).toBeLessThan(doctor);
    expect(doctor).toBeLessThan(nonReady);
    expect(nonReady).toBeLessThan(ready);
    expect(ready).toBeLessThan(run);
    expect(process.match(/soft-factory run --issue/g)).toHaveLength(1);
    expect(process).not.toMatch(
      /command="soft-factory (?:status|list|attach|logs|reconcile|resume|stop|clean|install)/,
    );
    expect(process).not.toMatch(/command="[^"]*(?:&&|\|\||;)/);
  });

  it("fails static checks when required process order is reversed", () => {
    const instructions = 'command="soft-factory instructions --json"';
    const doctor = 'command="soft-factory doctor --json"';
    const reordered = operator
      .replace(instructions, "ORDER_PLACEHOLDER")
      .replace(doctor, instructions)
      .replace("ORDER_PLACEHOLDER", doctor);
    expect(checkOperatorContract(reordered)).toEqual(
      expect.objectContaining({
        valid: false,
        missing: expect.arrayContaining(["ORDER:instructions-before-doctor"]),
      }),
    );
  });

  it("rejects generic shell, lifecycle invocation, and invariant bypass markers", () => {
    for (const marker of [
      "\ntools:\n  - bash\n",
      '\nUSE `bash` where: command="echo unsafe"\n',
      "\nsoft-factory status <issue> --json\n",
      "\nBYPASS_RUNNER_INVARIANTS\n",
    ])
      expect(checkOperatorContract(operator + marker).valid).toBe(false);
  });
});
