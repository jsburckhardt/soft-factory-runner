import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import path from "node:path";
import {
  ASSESSOR_REQUIRED_AUTHORITY,
  checkAssessorContract,
  checkOperatorContract,
  OPERATOR_REQUIRED_DELEGATIONS,
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

describe("V-1 official catalog and npm package", () => {
  it("defines the closed stable catalog with exact metadata and packaged digests", () => {
    expect(OFFICIAL_ASSET_CATALOG.map(officialAssetKey)).toEqual([
      "agent:soft-factory",
      "agent:soft-factory-assessor",
      "skill:soft-factory",
    ]);
    expect(OFFICIAL_ASSET_CATALOG.map((entry) => entry.destination)).toEqual([
      ".agents/agents/soft-factory.agent.md",
      ".agents/agents/soft-factory-assessor.agent.md",
      ".agents/skills/soft-factory/SKILL.md",
    ]);
    const packageVersion = JSON.parse(
      fs.readFileSync(path.join(root, "package.json"), "utf8"),
    ).version;
    for (const entry of OFFICIAL_ASSET_CATALOG) {
      expect(entry.version).toBe(packageVersion);
      expect(entry.version).toBe(OFFICIAL_ASSET_VERSION);
      expect(entry.runnerProtocol).toBe(1);
      expect(
        createHash("sha256").update(sourceBytes(entry.source)).digest("hex"),
      ).toBe(entry.sha256);
    }
    expect(new Set(OFFICIAL_ASSET_CATALOG.map(officialAssetKey)).size).toBe(3);
    expect(
      new Set(OFFICIAL_ASSET_CATALOG.map((entry) => entry.destination)).size,
    ).toBe(3);
  });

  it("publishes compiled Runner and all official sources but no runtime state", () => {
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
    for (const entry of OFFICIAL_ASSET_CATALOG)
      expect(files).toContain(entry.source);
    expect(files).toContain("dist/official-assets.js");
    expect(files.some((file) => file.startsWith("dist/"))).toBe(true);
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

describe("V-7 and V-8 official agent authority contracts", () => {
  const operator = sourceBytes(OFFICIAL_ASSET_CATALOG[0].source).toString(
    "utf8",
  );
  const assessor = sourceBytes(OFFICIAL_ASSET_CATALOG[1].source).toString(
    "utf8",
  );

  it("requires every Operator Runner delegation and prohibition", () => {
    expect(checkOperatorContract(operator)).toEqual({
      valid: true,
      missing: [],
      forbidden: [],
    });
    for (const phrase of [
      ...OPERATOR_REQUIRED_DELEGATIONS,
      ...OPERATOR_REQUIRED_PROHIBITIONS,
    ]) {
      const result = checkOperatorContract(
        operator.replace(phrase, "removed-contract-clause"),
      );
      expect(result.valid).toBe(false);
      expect(result.missing).toContain(phrase);
    }
    expect(
      checkOperatorContract(operator + "\nBYPASS_RUNNER_INVARIANTS\n")
        .forbidden,
    ).toEqual(["BYPASS_RUNNER_INVARIANTS"]);
  });

  it("requires complete Doctor JSON authority and rejects Assessor bypasses", () => {
    expect(checkAssessorContract(assessor)).toEqual({
      valid: true,
      missing: [],
      forbidden: [],
    });
    for (const phrase of ASSESSOR_REQUIRED_AUTHORITY) {
      const result = checkAssessorContract(
        assessor.replace(phrase, "removed-authority-clause"),
      );
      expect(result.valid).toBe(false);
      expect(result.missing).toContain(phrase);
    }
    expect(
      checkAssessorContract(assessor + "\nBYPASS_DOCTOR_READINESS\n").forbidden,
    ).toEqual(["BYPASS_DOCTOR_READINESS"]);
  });
});
