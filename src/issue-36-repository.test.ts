import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const names = [
  ["eng", "harness", "in", "a", "box"].join("-"),
  ["plan", "0", "v2", "constitution"].join("-"),
  ["plan", "v2", "extract", "domain"].join("-"),
  ["validate", "v2"].join("-"),
];
const deleted = [
  ...names.slice(0, 3).map((name) => `.agents/skills/${name}/SKILL.md`),
  `.agents/skills/${names[3]}/SKILL.md`,
  ...[
    "artifact-checks.md",
    "contract-and-forward-compatibility.md",
    "examples.md",
    "record-template.md",
  ].map((file) => `.agents/skills/${names[3]}/references/${file}`),
];

describe("Issue 36 repository release and deletion proof", () => {
  it("preserves exactly the eight requested tracked deletions and removes four lock entries", () => {
    const lock = JSON.parse(
      fs.readFileSync(path.join(root, "skills-lock.json"), "utf8"),
    ) as { skills: Record<string, unknown> };
    expect(names.every((name) => !(name in lock.skills))).toBe(true);
    expect(deleted.every((file) => !fs.existsSync(path.join(root, file)))).toBe(
      true,
    );
    for (const file of deleted) {
      const history = spawnSync(
        "git",
        ["log", "-1", "--format=%H", "--", file],
        { cwd: root, encoding: "utf8" },
      );
      expect(history.status).toBe(0);
      expect(history.stdout.trim()).not.toBe("");
      const committed = spawnSync(
        "git",
        [
          "show",
          "--format=",
          "--name-only",
          "--diff-filter=D",
          history.stdout.trim(),
          "--",
          file,
        ],
        { cwd: root, encoding: "utf8" },
      );
      expect(committed.status).toBe(0);
      expect(committed.stdout.trim()).toBe(file);
    }
  });

  it("has no live references or symlinks to removed skill names", () => {
    const result = spawnSync(
      "git",
      [
        "grep",
        "-n",
        "-E",
        names.join("|"),
        "--",
        ".agents/**",
        ".github/**",
        "assets/**",
        "docs/**",
        "src/**",
        "README.md",
        "PRD.md",
        "package.json",
        "skills-lock.json",
      ],
      { cwd: root, encoding: "utf8" },
    );
    expect([0, 1]).toContain(result.status);
    expect(result.stdout).toBe("");
    const symlinks: string[] = [];
    const walk = (directory: string): void => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const target = path.join(directory, entry.name);
        if (entry.isSymbolicLink()) symlinks.push(target);
        else if (entry.isDirectory()) walk(target);
      }
    };
    walk(path.join(root, ".agents"));
    expect(symlinks).toEqual([]);
  });

  it("synchronizes all governed release values at 0.2.0", () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(root, "package.json"), "utf8"),
    ) as { version: string };
    const lock = JSON.parse(
      fs.readFileSync(path.join(root, "package-lock.json"), "utf8"),
    ) as { version: string; packages: Record<string, { version?: string }> };
    const catalog = fs.readFileSync(
      path.join(root, "src/official-assets.ts"),
      "utf8",
    );
    expect({
      package: pkg.version,
      lock: lock.version,
      lockRoot: lock.packages[""].version,
    }).toEqual({ package: "0.2.0", lock: "0.2.0", lockRoot: "0.2.0" });
    expect(catalog).toContain('OFFICIAL_ASSET_VERSION = "0.2.0"');
  });
});
