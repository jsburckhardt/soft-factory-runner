import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type {
  AssetInstaller,
  AssetInstallationResultV1,
} from "./asset-installation";
import { sha256 } from "./asset-installation";
import { serializeAssetManifest } from "./asset-manifest";
import { parseCommand } from "./command";
import { RunnerError } from "./errors";
import { runCli } from "./index";
import { checkOperatorContract } from "./official-agent-contracts";
import {
  OFFICIAL_ASSET_CATALOG,
  type OfficialAssetIdentity,
} from "./official-assets";
import type { RunnerPorts } from "./ports";

const root = path.resolve(__dirname, "..");
const current = OFFICIAL_ASSET_CATALOG[0];
const emptyPorts = {} as RunnerPorts;

class CapturingInstaller implements AssetInstaller {
  public selected: readonly OfficialAssetIdentity[] = [];
  public constructor(
    private readonly result: AssetInstallationResultV1 | RunnerError,
  ) {}
  public async install(
    _repositoryRoot: string,
    selected: readonly OfficialAssetIdentity[],
  ): Promise<AssetInstallationResultV1> {
    this.selected = selected;
    if (this.result instanceof RunnerError) throw this.result;
    return this.result;
  }
}

const success: AssetInstallationResultV1 = {
  schemaVersion: 1,
  code: "ASSETS_INSTALLED",
  changed: true,
  manifest: ".agents/manifest.json",
  assets: [
    {
      type: "agent",
      name: "soft-factory",
      version: "0.1.3",
      runnerProtocol: 1,
      destination: ".github/agents/soft-factory.agent.md",
      sha256: "a".repeat(64),
      status: "installed",
    },
  ],
  retirements: [
    {
      type: "skill",
      name: "soft-factory",
      destination: ".agents/skills/soft-factory/SKILL.md",
      status: "stale-entry-retired",
    },
  ],
};

describe("V1 strict one-agent install command integration", () => {
  it("accepts only the current individual and recommended forms", () => {
    expect(parseCommand(["install", "agent", "soft-factory"])).toEqual({
      kind: "install",
      assets: [{ type: "agent", name: "soft-factory" }],
    });
    expect(parseCommand(["install", "--recommended"])).toEqual({
      kind: "install",
      assets: [{ type: "agent", name: "soft-factory" }],
    });
    for (const args of [
      ["install"],
      ["install", "agent"],
      ["install", "agent", "soft-factory-assessor"],
      ["install", "skill", "soft-factory"],
      ["install", "agent", "unknown"],
      ["install", "--recommended", "extra"],
      ["install", "agent", "soft-factory", "--json"],
    ])
      expect(() => parseCommand(args)).toThrow(
        expect.objectContaining({ code: "CLI_INVALID" }),
      );
  });

  it.each([
    ["agent", "soft-factory-assessor"],
    ["skill", "soft-factory"],
  ])("returns stable exit 2 for removed %s selector", async (type, name) => {
    const result = await runCli(
      ["install", type, name],
      "/repository",
      emptyPorts,
      undefined,
      new CapturingInstaller(success),
    );
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("CLI_INVALID");
    expect(result.stderr).toContain("soft-factory --help");
  });

  it("dispatches the sole selection and renders current plus retirement outcomes", async () => {
    const installer = new CapturingInstaller(success);
    const result = await runCli(
      ["install", "--recommended"],
      "/repository",
      emptyPorts,
      undefined,
      installer,
    );
    expect(installer.selected).toEqual([
      { type: "agent", name: "soft-factory" },
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("agent soft-factory: installed");
    expect(result.stdout).toContain("skill soft-factory: stale-entry-retired");
    expect(result.stdout).toContain(
      "destination=.github/agents/soft-factory.agent.md",
    );
  });

  it("maps no-change and uncertain failures to stable safe output", async () => {
    for (const [code, expectedExit, message] of [
      ["ASSET_LOCAL_MODIFIED", 4, "No files changed."],
      ["ASSET_ROLLBACK_UNCERTAIN", 4, "Rollback is uncertain."],
      ["ASSET_INTEGRITY_INVALID", 3, "No files changed."],
    ] as const) {
      const installer = new CapturingInstaller(
        new RunnerError(code, message, "Inspect safe paths and retry.", {
          details: { destination: ".github/agents/safe" },
        }),
      );
      const result = await runCli(
        ["install", "--recommended"],
        "/repository",
        emptyPorts,
        undefined,
        installer,
      );
      expect(result.exitCode).toBe(expectedExit);
      expect(result.stderr).toContain(code);
      expect(result.stderr).toContain("Remediation:");
      expect(result.stderr).not.toContain("secret asset bytes");
    }
  });
});

function invoke(packageRoot: string, cwd: string, args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [path.join(packageRoot, "dist", "index.js"), ...args],
    { cwd, encoding: "utf8", env: { ...process.env } },
  );
}

async function tree(rootPath: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  async function visit(directory: string): Promise<void> {
    let names: string[];
    try {
      names = await fsp.readdir(directory);
    } catch {
      return;
    }
    for (const name of names.sort()) {
      const absolute = path.join(directory, name);
      const relative = path
        .relative(rootPath, absolute)
        .split(path.sep)
        .join("/");
      const stat = await fsp.lstat(absolute);
      if (stat.isDirectory()) {
        result[relative + "/"] = "directory";
        await visit(absolute);
      } else result[relative] = sha256(await fsp.readFile(absolute));
    }
  }
  await visit(rootPath);
  return result;
}

describe("V3 and V11 packed built-CLI installation smoke", () => {
  jest.setTimeout(60_000);
  let temp: string;
  let packageRoot: string;
  let tarball: string;

  beforeAll(async () => {
    expect(
      spawnSync("just", ["build"], { cwd: root, encoding: "utf8" }).status,
    ).toBe(0);
    temp = await fsp.mkdtemp(path.join(os.tmpdir(), "asset-packed-cli-"));
    const packed = spawnSync(
      "npm",
      ["pack", "--json", "--pack-destination", temp],
      { cwd: root, encoding: "utf8" },
    );
    expect(packed.status).toBe(0);
    const packEntry = JSON.parse(packed.stdout)[0] as {
      filename: string;
      version: string;
    };
    expect(packEntry.version).toBe("0.1.3");
    expect(packEntry.filename).toBe("soft-factory-runner-0.1.3.tgz");
    tarball = path.join(temp, packEntry.filename);
    const prefix = path.join(temp, "prefix");
    const installed = spawnSync(
      "npm",
      [
        "install",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
        "--omit=dev",
        "--prefix",
        prefix,
        tarball,
      ],
      { cwd: temp, encoding: "utf8" },
    );
    expect(installed.status).toBe(0);
    packageRoot = path.join(prefix, "node_modules", "soft-factory-runner");
    const installedMetadata = JSON.parse(
      await fsp.readFile(path.join(packageRoot, "package.json"), "utf8"),
    ) as { version: string };
    expect(installedMetadata.version).toBe("0.1.3");
    const tarMetadata = spawnSync(
      "tar",
      ["-xOf", tarball, "package/package.json"],
      { cwd: temp, encoding: "utf8" },
    );
    expect(tarMetadata.status).toBe(0);
    expect(
      (JSON.parse(tarMetadata.stdout) as { version: string }).version,
    ).toBe("0.1.3");
  });

  afterAll(async () => {
    await fsp.rm(temp, { recursive: true, force: true });
  });

  it("ships the exact agent and passes the static contract from packed bytes", async () => {
    const official = path.join(packageRoot, "assets", "official");
    expect(await fsp.readdir(official)).toEqual(["soft-factory.agent.md"]);
    const agent = await fsp.readFile(
      path.join(official, "soft-factory.agent.md"),
      "utf8",
    );
    expect(checkOperatorContract(agent).valid).toBe(true);
    expect(sha256(Buffer.from(agent))).toBe(current.sha256);
  });

  it("installs individual and recommended forms identically and repeats as a no-op", async () => {
    const roots = [
      await fsp.mkdtemp(path.join(os.tmpdir(), "asset-packed-one-")),
      await fsp.mkdtemp(path.join(os.tmpdir(), "asset-packed-rec-")),
    ];
    const args = [
      ["install", "agent", "soft-factory"],
      ["install", "--recommended"],
    ];
    const inventories: Record<string, string>[] = [];
    for (let index = 0; index < roots.length; index += 1) {
      const installed = invoke(packageRoot, roots[index], args[index]);
      expect(installed.status).toBe(0);
      expect(installed.stdout).toContain("agent soft-factory: installed");
      const repeat = invoke(packageRoot, roots[index], args[index]);
      expect(repeat.status).toBe(0);
      expect(repeat.stdout).toContain("ASSETS_UP_TO_DATE");
      const generated = JSON.parse(
        await fsp.readFile(
          path.join(roots[index], ".agents", "manifest.json"),
          "utf8",
        ),
      ) as { assets: Array<{ version: string }> };
      expect(generated.assets).toHaveLength(1);
      expect(generated.assets[0]?.version).toBe("0.1.3");
      inventories.push(await tree(roots[index]));
    }
    expect(inventories[1]).toEqual(inventories[0]);
    for (const repository of roots)
      await fsp.rm(repository, { recursive: true, force: true });
  });

  it("reconverges a proved 0.1.0 current manifest to 0.1.3 and repeats", async () => {
    const repository = await fsp.mkdtemp(
      path.join(os.tmpdir(), "asset-packed-version-upgrade-"),
    );
    const desired = await fsp.readFile(path.join(packageRoot, current.source));
    await fsp.mkdir(path.dirname(path.join(repository, current.destination)), {
      recursive: true,
    });
    await fsp.mkdir(path.join(repository, ".agents"), { recursive: true });
    await fsp.writeFile(path.join(repository, current.destination), desired);
    await fsp.writeFile(
      path.join(repository, ".agents", "manifest.json"),
      serializeAssetManifest({
        schemaVersion: 1,
        assets: [
          {
            type: current.type,
            name: current.name,
            version: "0.1.0",
            runnerProtocol: current.runnerProtocol,
            destination: current.destination,
            sha256: sha256(desired),
          },
        ],
      }),
    );
    const upgraded = invoke(packageRoot, repository, [
      "install",
      "--recommended",
    ]);
    expect(upgraded.status).toBe(0);
    const manifest = JSON.parse(
      await fsp.readFile(
        path.join(repository, ".agents", "manifest.json"),
        "utf8",
      ),
    ) as { assets: Array<{ version: string }> };
    expect(manifest.assets.map((entry) => entry.version)).toEqual(["0.1.3"]);
    const repeat = invoke(packageRoot, repository, [
      "install",
      "--recommended",
    ]);
    expect(repeat.status).toBe(0);
    expect(repeat.stdout).toContain("ASSETS_UP_TO_DATE");
    await fsp.rm(repository, { recursive: true, force: true });
  });

  it("migrates matching legacy ownership and rejects removed selectors", async () => {
    const repository = await fsp.mkdtemp(
      path.join(os.tmpdir(), "asset-packed-migrate-"),
    );
    const oldDestination = ".agents/agents/soft-factory.agent.md";
    const old = Buffer.from("packed legacy owned bytes\n");
    await fsp.mkdir(path.join(repository, ".agents", "agents"), {
      recursive: true,
    });
    await fsp.writeFile(path.join(repository, oldDestination), old);
    await fsp.writeFile(
      path.join(repository, ".agents", "manifest.json"),
      serializeAssetManifest({
        schemaVersion: 1,
        assets: [
          {
            type: "agent",
            name: "soft-factory",
            version: "0.0.9",
            runnerProtocol: 1,
            destination: oldDestination,
            sha256: sha256(old),
          },
        ],
      }),
    );
    const migrated = invoke(packageRoot, repository, [
      "install",
      "--recommended",
    ]);
    expect(migrated.status).toBe(0);
    expect(migrated.stdout).toContain("agent soft-factory: retired");
    expect(fs.existsSync(path.join(repository, oldDestination))).toBe(false);
    expect(
      sha256(await fsp.readFile(path.join(repository, current.destination))),
    ).toBe(current.sha256);
    for (const removed of [
      ["install", "agent", "soft-factory-assessor"],
      ["install", "skill", "soft-factory"],
    ]) {
      const rejected = invoke(packageRoot, repository, removed);
      expect(rejected.status).toBe(2);
      expect(rejected.stderr).toContain("CLI_INVALID");
    }
    await fsp.rm(repository, { recursive: true, force: true });
  });
});
