import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type {
  AssetInstaller,
  AssetInstallationResultV1,
} from "./asset-installation";
import { parseCommand } from "./command";
import { RunnerError } from "./errors";
import { runCli } from "./index";
import {
  OFFICIAL_ASSET_CATALOG,
  type OfficialAssetIdentity,
} from "./official-assets";
import type { RunnerPorts } from "./ports";

const root = path.resolve(__dirname, "..");
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
      version: "0.1.0",
      runnerProtocol: 1,
      destination: ".agents/agents/soft-factory.agent.md",
      sha256: "a".repeat(64),
      status: "installed",
    },
  ],
};

describe("V-6 strict install command integration", () => {
  it("accepts exactly the three individual forms and recommended batch", () => {
    expect(parseCommand(["install", "agent", "soft-factory"])).toEqual({
      kind: "install",
      assets: [{ type: "agent", name: "soft-factory" }],
    });
    expect(parseCommand(["install", "agent", "soft-factory-assessor"])).toEqual(
      {
        kind: "install",
        assets: [{ type: "agent", name: "soft-factory-assessor" }],
      },
    );
    expect(parseCommand(["install", "skill", "soft-factory"])).toEqual({
      kind: "install",
      assets: [{ type: "skill", name: "soft-factory" }],
    });
    expect(parseCommand(["install", "--recommended"])).toEqual({
      kind: "install",
      assets: [
        { type: "agent", name: "soft-factory" },
        { type: "agent", name: "soft-factory-assessor" },
        { type: "skill", name: "soft-factory" },
      ],
    });
    for (const args of [
      ["install"],
      ["install", "agent"],
      ["install", "agent", "unknown"],
      ["install", "skill", "soft-factory-assessor"],
      ["install", "other", "soft-factory"],
      ["install", "--recommended", "extra"],
      ["install", "--recommended", "--json"],
      ["install", "agent", "soft-factory", "--json"],
    ])
      expect(() => parseCommand(args)).toThrow(RunnerError);
  });

  it("dispatches structured selection and renders shared metadata", async () => {
    const installer = new CapturingInstaller(success);
    const result = await runCli(
      ["install", "agent", "soft-factory"],
      "/repository",
      emptyPorts,
      undefined,
      installer,
    );
    expect(installer.selected).toEqual([
      { type: "agent", name: "soft-factory" },
    ]);
    expect(result.exitCode).toBe(0);
    for (const phrase of [
      "Installation: ASSETS_INSTALLED",
      "Changed: yes",
      "Manifest: .agents/manifest.json",
      "agent soft-factory: installed",
      "version=0.1.0",
      "runnerProtocol=1",
      "sha256=",
    ])
      expect(result.stdout).toContain(phrase);
  });

  it("maps actionable typed failures to stable nonzero CLI output without raw bytes", async () => {
    for (const [code, expectedExit] of [
      ["ASSET_LOCAL_MODIFIED", 4],
      ["ASSET_PROTOCOL_INCOMPATIBLE", 3],
      ["ASSET_INTEGRITY_INVALID", 3],
    ] as const) {
      const installer = new CapturingInstaller(
        new RunnerError(
          code,
          "Selected asset was refused. No files changed.",
          "Repair the official installation evidence and retry.",
          { details: { destination: ".agents/safe" } },
        ),
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
      expect(result.stderr).toContain("No files changed");
      expect(result.stderr).toContain("Remediation:");
      expect(result.stderr).not.toContain("secret asset bytes");
    }
  });
});

describe("built local install CLI", () => {
  beforeAll(() => {
    expect(
      spawnSync("just", ["build"], { cwd: root, encoding: "utf8" }).status,
    ).toBe(0);
  });
  function invoke(packageRoot: string, cwd: string, args: readonly string[]) {
    return spawnSync(
      process.execPath,
      [path.join(packageRoot, "dist", "index.js"), ...args],
      {
        cwd,
        encoding: "utf8",
        env: { ...process.env },
      },
    );
  }

  it("installs individual and recommended assets, repeats, and refuses local edits", async () => {
    const individual = await fsp.mkdtemp(
      path.join(os.tmpdir(), "asset-cli-one-"),
    );
    const one = invoke(root, individual, ["install", "agent", "soft-factory"]);
    expect(one.status).toBe(0);
    expect(one.stdout).toContain("agent soft-factory: installed");
    expect(
      fs.existsSync(
        path.join(individual, OFFICIAL_ASSET_CATALOG[0].destination),
      ),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(individual, OFFICIAL_ASSET_CATALOG[1].destination),
      ),
    ).toBe(false);
    await fsp.rm(individual, { recursive: true, force: true });

    const repository = await fsp.mkdtemp(
      path.join(os.tmpdir(), "asset-cli-all-"),
    );
    const installed = invoke(root, repository, ["install", "--recommended"]);
    expect(installed.status).toBe(0);
    expect(installed.stdout).toContain("Installation: ASSETS_INSTALLED");
    const repeated = invoke(root, repository, ["install", "--recommended"]);
    expect(repeated.status).toBe(0);
    expect(repeated.stdout).toContain("Installation: ASSETS_UP_TO_DATE");
    expect(repeated.stdout).toContain("Changed: no");
    await fsp.writeFile(
      path.join(repository, OFFICIAL_ASSET_CATALOG[0].destination),
      "secret asset bytes",
    );
    const collision = invoke(root, repository, ["install", "--recommended"]);
    expect(collision.status).toBe(4);
    expect(collision.stderr).toContain("ASSET_LOCAL_MODIFIED");
    expect(collision.stderr).toContain("No files changed");
    expect(collision.stderr).not.toContain("secret asset bytes");
    await fsp.rm(repository, { recursive: true, force: true });
  });

  it("rejects integrity and protocol faults in isolated package copies", async () => {
    const copied = await fsp.mkdtemp(
      path.join(os.tmpdir(), "asset-cli-package-"),
    );
    await fsp.cp(path.join(root, "dist"), path.join(copied, "dist"), {
      recursive: true,
    });
    await fsp.cp(path.join(root, "assets"), path.join(copied, "assets"), {
      recursive: true,
    });
    const target = await fsp.mkdtemp(
      path.join(os.tmpdir(), "asset-cli-target-"),
    );
    await fsp.appendFile(
      path.join(copied, OFFICIAL_ASSET_CATALOG[0].source),
      "tampered",
    );
    const integrity = invoke(copied, target, [
      "install",
      "agent",
      "soft-factory",
    ]);
    expect(integrity.status).toBe(3);
    expect(integrity.stderr).toContain("ASSET_INTEGRITY_INVALID");
    expect(fs.existsSync(path.join(target, ".agents"))).toBe(false);

    await fsp.rm(path.join(copied, "assets"), { recursive: true, force: true });
    await fsp.cp(path.join(root, "assets"), path.join(copied, "assets"), {
      recursive: true,
    });
    const compiledCatalog = path.join(copied, "dist", "official-assets.js");
    const compiled = await fsp.readFile(compiledCatalog, "utf8");
    const incompatible = compiled.replace(
      /runnerProtocol: doctor_1\.DOCTOR_PROTOCOL_VERSION/,
      "runnerProtocol: 2",
    );
    expect(incompatible).not.toBe(compiled);
    await fsp.writeFile(compiledCatalog, incompatible);
    const protocol = invoke(copied, target, [
      "install",
      "agent",
      "soft-factory",
    ]);
    expect(protocol.status).toBe(3);
    expect(protocol.stderr).toContain("ASSET_PROTOCOL_INCOMPATIBLE");
    expect(fs.existsSync(path.join(target, ".agents"))).toBe(false);
    await fsp.rm(copied, { recursive: true, force: true });
    await fsp.rm(target, { recursive: true, force: true });
  });
});
