import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import path from "node:path";
import { OFFICIAL_ASSET_VERSION } from "./official-assets";

const root = process.cwd();
const VERSION = "0.2.1-beta.3";

function readJson(relative: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
}

function git(args: readonly string[]): string {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  expect(result.status).toBe(0);
  return result.stdout;
}

describe("Issue 44 beta.3 finite repository evidence", () => {
  it("synchronizes every authoritative current-release surface", () => {
    const pkg = readJson("package.json") as { version: string };
    const lock = readJson("package-lock.json") as {
      version: string;
      packages: Record<string, { version?: string }>;
    };
    const inventory = {
      "package.json": pkg.version,
      "package-lock.json": lock.version,
      "package-lock.json#packages-root": lock.packages[""]?.version,
      "src/official-assets.ts": OFFICIAL_ASSET_VERSION,
    };
    expect(inventory).toEqual(
      Object.fromEntries(Object.keys(inventory).map((file) => [file, VERSION])),
    );
    for (const file of [
      "README.md",
      "docs/README.md",
      "docs/phase-3-recovery-operations.md",
      "docs/phase-4-repository-doctor.md",
      "docs/phase-5-official-assets.md",
    ])
      expect(fs.readFileSync(path.join(root, file), "utf8")).toContain(VERSION);
  });

  it("keeps beta.0, beta.1, and beta.2 release history scoped to their corrections", () => {
    const history = [
      fs.readFileSync(path.join(root, "README.md"), "utf8"),
      fs.readFileSync(path.join(root, "docs/README.md"), "utf8"),
      fs.readFileSync(
        path.join(root, "docs/phase-4-repository-doctor.md"),
        "utf8",
      ),
    ].join("\n");
    expect(history).toContain("beta.0 prevents Doctor collapse");
    expect(history).toContain(
      "beta.1 recognizes only an unchanged stale socket",
    );
    expect(history).toContain("beta.2 adds only guarded dead-pane cleanup");
    expect(history).toContain("beta.3 accepts only exact selector-bound");
    expect(history).toContain("Explicit cleanup refuses a live match");
  });

  it("keeps third-party dependency ranges and lock package metadata equal to merge base", () => {
    const mergeBase = git(["merge-base", "HEAD", "origin/main"]).trim();
    const basePackage = JSON.parse(git(["show", mergeBase + ":package.json"]));
    const currentPackage = readJson("package.json");
    for (const key of [
      "dependencies",
      "devDependencies",
      "optionalDependencies",
      "peerDependencies",
    ])
      expect(currentPackage[key]).toEqual(basePackage[key]);
    const baseLock = JSON.parse(
      git(["show", mergeBase + ":package-lock.json"]),
    );
    const currentLock = readJson("package-lock.json") as {
      packages: Record<string, unknown>;
    };
    const baseThirdParty = { ...baseLock.packages };
    const currentThirdParty = { ...currentLock.packages };
    delete baseThirdParty[""];
    delete currentThirdParty[""];
    expect(currentThirdParty).toEqual(baseThirdParty);
  });

  it("documents local-only package proof and a non-gating external handoff", () => {
    const recovery = fs.readFileSync(
      path.join(root, "docs/phase-3-recovery-operations.md"),
      "utf8",
    );
    expect(recovery).toContain("Deferred Sparkta beta.3 recovery handoff");
    expect(recovery).toContain("does not install into or inspect Sparkta");
    expect(recovery).toContain("No force-clean");
    expect(recovery).toContain("registry publication");
  });
});
