import { readFileSync } from "node:fs";
import * as fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  AssetInstallationService,
  sha256,
  type AssetFileSystemPort,
  type AssetPathKind,
  type OfficialAssetSourcePort,
} from "./asset-installation";
import { NodeAssetFileSystem } from "./asset-live";
import { parseAssetManifest, serializeAssetManifest } from "./asset-manifest";
import { RunnerError } from "./errors";
import {
  OFFICIAL_ASSET_CATALOG,
  type OfficialAssetCatalogEntry,
  type OfficialAssetIdentity,
} from "./official-assets";

const packageRoot = path.resolve(__dirname, "..");
const recommended: readonly OfficialAssetIdentity[] =
  OFFICIAL_ASSET_CATALOG.map(({ type, name }) => ({ type, name }));
const mutationOps = [
  "mkdir",
  "write",
  "rename",
  "remove-file",
  "remove-dir",
  "remove-tree",
];

class Source implements OfficialAssetSourcePort {
  public constructor(private readonly overrides = new Map<string, Buffer>()) {}
  public async read(source: string): Promise<Buffer> {
    return (
      this.overrides.get(source) ?? fs.readFile(path.join(packageRoot, source))
    );
  }
}
class RecordingFiles implements AssetFileSystemPort {
  private readonly live = new NodeAssetFileSystem();
  public readonly trace: string[] = [];
  public tripwire = false;
  public renameBefore: number | null = null;
  public renameAfter: number | null = null;
  public removeFileFailure: number | null = null;
  private renames = 0;
  private removals = 0;
  public constructor(private readonly root: string) {}
  private relative(value: string): string {
    return path.relative(this.root, value).split(path.sep).join("/");
  }
  private mutate(operation: string): void {
    this.trace.push(operation);
    if (this.tripwire) throw new Error("write tripwire");
  }
  public async kind(filePath: string): Promise<AssetPathKind> {
    this.trace.push(`kind:${this.relative(filePath)}`);
    return this.live.kind(filePath);
  }
  public async read(filePath: string): Promise<Buffer | null> {
    this.trace.push(`read:${this.relative(filePath)}`);
    return this.live.read(filePath);
  }
  public async createDirectory(directoryPath: string): Promise<void> {
    this.mutate(`mkdir:${this.relative(directoryPath)}`);
    await this.live.createDirectory(directoryPath);
  }
  public async writeExclusive(filePath: string, bytes: Buffer): Promise<void> {
    this.mutate(`write:${this.relative(filePath)}`);
    await this.live.writeExclusive(filePath, bytes);
  }
  public async rename(from: string, to: string): Promise<void> {
    this.renames += 1;
    this.mutate(`rename:${this.relative(from)}->${this.relative(to)}`);
    if (this.renameBefore === this.renames)
      throw new Error("rename before fault");
    await this.live.rename(from, to);
    if (this.renameAfter === this.renames)
      throw new Error("rename after fault");
  }
  public async removeFile(filePath: string): Promise<void> {
    this.removals += 1;
    this.mutate(`remove-file:${this.relative(filePath)}`);
    if (this.removeFileFailure === this.removals)
      throw new Error("rollback remove fault");
    await this.live.removeFile(filePath);
  }
  public async removeDirectory(directoryPath: string): Promise<void> {
    this.mutate(`remove-dir:${this.relative(directoryPath)}`);
    await this.live.removeDirectory(directoryPath);
  }
  public async removeTree(directoryPath: string): Promise<void> {
    this.mutate(`remove-tree:${this.relative(directoryPath)}`);
    await this.live.removeTree(directoryPath);
  }
  public mutations(): readonly string[] {
    return this.trace.filter((entry) =>
      mutationOps.some((op) => entry.startsWith(op + ":")),
    );
  }
  public reset(): void {
    this.trace.length = 0;
  }
}

async function temporaryRoot(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "official-install-"));
}
function service(
  files: RecordingFiles,
  catalog: readonly OfficialAssetCatalogEntry[] = OFFICIAL_ASSET_CATALOG,
  source = new Source(),
): AssetInstallationService {
  return new AssetInstallationService(catalog, source, files, () => "fixture");
}
async function inventory(
  root: string,
): Promise<Readonly<Record<string, string>>> {
  const result: Record<string, string> = {};
  async function visit(directory: string): Promise<void> {
    let entries: import("node:fs").Dirent[];
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const absolute = path.join(directory, entry.name);
      const relative = path.relative(root, absolute).split(path.sep).join("/");
      if (entry.isDirectory()) {
        result[relative + "/"] = "directory";
        await visit(absolute);
      } else if (entry.isSymbolicLink()) result[relative] = "symlink";
      else result[relative] = sha256(await fs.readFile(absolute));
    }
  }
  await visit(root);
  return result;
}
function fixture(name: string): Record<string, unknown> {
  return JSON.parse(
    readFileSync(
      path.join(packageRoot, "fixtures", "install", name + ".json"),
      "utf8",
    ),
  );
}
async function runnerError(action: Promise<unknown>): Promise<RunnerError> {
  try {
    await action;
    throw new Error("expected RunnerError");
  } catch (cause: unknown) {
    if (!(cause instanceof RunnerError)) throw cause;
    return cause;
  }
}

describe("V-2 and V-3 clean, recommended, repeat, and adoption", () => {
  it("runs the tracked clean individual scenario twice with identical facts", async () => {
    const results: unknown[] = [];
    const snapshots: unknown[] = [];
    for (let run = 0; run < 2; run += 1) {
      const root = await temporaryRoot();
      const files = new RecordingFiles(root);
      const result = await service(files).install(root, [recommended[0]]);
      expect(result.code).toBe(fixture("clean").expectedCode);
      expect(result.assets.map((asset) => asset.status)).toEqual(
        fixture("clean").expectedStatuses,
      );
      results.push(result);
      snapshots.push(await inventory(root));
      await fs.rm(root, { recursive: true, force: true });
    }
    expect(results[1]).toEqual(results[0]);
    expect(snapshots[1]).toEqual(snapshots[0]);
  });

  it("installs the complete recommended batch deterministically with manifest last", async () => {
    const outputs: unknown[] = [];
    const inventories: unknown[] = [];
    const traces: unknown[] = [];
    for (let run = 0; run < 2; run += 1) {
      const root = await temporaryRoot();
      await fs.mkdir(path.join(root, ".agents", "skills", "local"), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(root, ".agents", "skills", "local", "SKILL.md"),
        "local\n",
      );
      const files = new RecordingFiles(root);
      const result = await service(files).install(root, recommended);
      outputs.push(result);
      inventories.push(await inventory(root));
      traces.push(
        files.trace.map((entry) =>
          entry.replace(/\.install-fixture/g, ".install-TX"),
        ),
      );
      expect(result.code).toBe(fixture("recommended").expectedCode);
      expect(result.assets.map((asset) => asset.status)).toEqual(
        fixture("recommended").expectedStatuses,
      );
      expect(
        await fs.readFile(
          path.join(root, ".agents", "skills", "local", "SKILL.md"),
          "utf8",
        ),
      ).toBe("local\n");
      const manifest = parseAssetManifest(
        await fs.readFile(path.join(root, ".agents", "manifest.json"), "utf8"),
        OFFICIAL_ASSET_CATALOG,
      );
      expect(manifest.assets).toEqual(
        OFFICIAL_ASSET_CATALOG.map((entry) => ({
          type: entry.type,
          name: entry.name,
          version: entry.version,
          runnerProtocol: entry.runnerProtocol,
          destination: entry.destination,
          sha256: entry.sha256,
        })),
      );
      const commits = files.trace
        .filter(
          (entry) => entry.startsWith("rename:") && entry.includes("stage-"),
        )
        .map((entry) => entry.split("->")[1]);
      expect(commits).toEqual(fixture("recommended").expectedWriteOrder);
      await fs.rm(root, { recursive: true, force: true });
    }
    expect(outputs[1]).toEqual(outputs[0]);
    expect(inventories[1]).toEqual(inventories[0]);
    expect(traces[1]).toEqual(traces[0]);
  });

  it("never rewrites converged targets and adopts matching unmanaged bytes", async () => {
    const root = await temporaryRoot();
    const files = new RecordingFiles(root);
    const installer = service(files);
    await installer.install(root, recommended);
    const target = path.join(root, OFFICIAL_ASSET_CATALOG[0].destination);
    const before = await fs.stat(target);
    files.reset();
    files.tripwire = true;
    const first = await installer.install(root, recommended);
    const second = await installer.install(root, recommended);
    expect(first).toEqual(second);
    expect(first.code).toBe(fixture("repeated").expectedCode);
    expect(files.mutations()).toEqual([]);
    expect((await fs.stat(target)).ino).toBe(before.ino);
    await fs.rm(root, { recursive: true, force: true });

    const adoptRoot = await temporaryRoot();
    const desired = await fs.readFile(
      path.join(packageRoot, OFFICIAL_ASSET_CATALOG[0].source),
    );
    await fs.mkdir(
      path.dirname(path.join(adoptRoot, OFFICIAL_ASSET_CATALOG[0].destination)),
      { recursive: true },
    );
    await fs.writeFile(
      path.join(adoptRoot, OFFICIAL_ASSET_CATALOG[0].destination),
      desired,
    );
    const adoptFiles = new RecordingFiles(adoptRoot);
    const adoptedInode = (
      await fs.stat(path.join(adoptRoot, OFFICIAL_ASSET_CATALOG[0].destination))
    ).ino;
    const adopted = await service(adoptFiles).install(adoptRoot, [
      recommended[0],
    ]);
    expect(adopted.assets[0].status).toBe("adopted");
    expect(
      (
        await fs.stat(
          path.join(adoptRoot, OFFICIAL_ASSET_CATALOG[0].destination),
        )
      ).ino,
    ).toBe(adoptedInode);
    expect(
      adoptFiles.trace.filter(
        (entry) => entry.startsWith("rename:") && entry.includes("stage-"),
      ),
    ).toHaveLength(1);
    await fs.rm(adoptRoot, { recursive: true, force: true });
  });
});

describe("V-4 collision, safe upgrade, and exact rollback", () => {
  it("refuses a locally modified recommended target twice with zero changes", async () => {
    const root = await temporaryRoot();
    const files = new RecordingFiles(root);
    const installer = service(files);
    await installer.install(root, recommended);
    await fs.writeFile(
      path.join(root, OFFICIAL_ASSET_CATALOG[1].destination),
      "local edit\n",
    );
    const before = await inventory(root);
    for (let run = 0; run < 2; run += 1) {
      files.reset();
      const error = await runnerError(installer.install(root, recommended));
      expect(error.code).toBe(fixture("modified-local").expectedCode);
      expect(error.message).toContain("No files changed");
      expect(files.mutations()).toEqual([]);
      expect(await inventory(root)).toEqual(before);
    }
    await fs.rm(root, { recursive: true, force: true });
  });

  it("upgrades only bytes proved by the exact prior manifest digest", async () => {
    const root = await temporaryRoot();
    const entry = OFFICIAL_ASSET_CATALOG[0];
    const old = Buffer.from("old official bytes\n");
    await fs.mkdir(path.dirname(path.join(root, entry.destination)), {
      recursive: true,
    });
    await fs.writeFile(path.join(root, entry.destination), old);
    const prior = {
      schemaVersion: 1 as const,
      assets: [
        {
          type: entry.type,
          name: entry.name,
          version: "0.0.9",
          runnerProtocol: 1,
          destination: entry.destination,
          sha256: sha256(old),
        },
      ],
    };
    await fs.writeFile(
      path.join(root, ".agents", "manifest.json"),
      serializeAssetManifest(prior),
    );
    const result = await service(new RecordingFiles(root)).install(root, [
      recommended[0],
    ]);
    expect(result.assets[0].status).toBe("upgraded");
    expect(sha256(await fs.readFile(path.join(root, entry.destination)))).toBe(
      entry.sha256,
    );
    await fs.rm(root, { recursive: true, force: true });
  });

  it.each([1, 2, 3, 4])(
    "restores the exact clean tree when commit rename %i fails",
    async (rename) => {
      const root = await temporaryRoot();
      await fs.writeFile(path.join(root, "unrelated"), "keep");
      const before = await inventory(root);
      const files = new RecordingFiles(root);
      files.renameBefore = rename;
      const error = await runnerError(
        service(files).install(root, recommended),
      );
      expect(error.code).toBe("ASSET_FILESYSTEM_FAILED");
      expect(await inventory(root)).toEqual(before);
      await fs.rm(root, { recursive: true, force: true });
    },
  );

  it("restores after an ambiguous post-rename fault and reports uncertain rollback failures", async () => {
    const exactRoot = await temporaryRoot();
    const exactFiles = new RecordingFiles(exactRoot);
    exactFiles.renameAfter = 2;
    expect(
      (await runnerError(service(exactFiles).install(exactRoot, recommended)))
        .code,
    ).toBe("ASSET_FILESYSTEM_FAILED");
    expect(await inventory(exactRoot)).toEqual({});
    await fs.rm(exactRoot, { recursive: true, force: true });

    const uncertainRoot = await temporaryRoot();
    const uncertainFiles = new RecordingFiles(uncertainRoot);
    uncertainFiles.renameAfter = 1;
    uncertainFiles.removeFileFailure = 1;
    const uncertain = await runnerError(
      service(uncertainFiles).install(uncertainRoot, recommended),
    );
    expect(uncertain.code).toBe("ASSET_ROLLBACK_UNCERTAIN");
    expect(uncertain.remediation).toContain("version control");
    await fs.rm(uncertainRoot, { recursive: true, force: true });
  });
});

describe("V-5 protocol, integrity, manifest, and path rejection", () => {
  it.each(["incompatible", "integrity-invalid"])(
    "rejects %s preflight deterministically with no writes",
    async (scenario) => {
      for (let run = 0; run < 2; run += 1) {
        const root = await temporaryRoot();
        const files = new RecordingFiles(root);
        const catalog = OFFICIAL_ASSET_CATALOG.map((entry, index) =>
          index === 0
            ? {
                ...entry,
                ...(scenario === "incompatible"
                  ? { runnerProtocol: 2 }
                  : { sha256: "0".repeat(64) }),
              }
            : entry,
        );
        const error = await runnerError(
          service(files, catalog).install(root, recommended),
        );
        expect(error.code).toBe(fixture(scenario).expectedCode);
        expect(error.message).toContain("No files changed");
        expect(files.mutations()).toEqual([]);
        expect(await inventory(root)).toEqual({});
        await fs.rm(root, { recursive: true, force: true });
      }
    },
  );

  it.each([
    "{",
    JSON.stringify({ schemaVersion: 2, assets: [] }),
    JSON.stringify({ schemaVersion: 1, assets: [], unknown: true }),
    JSON.stringify({
      schemaVersion: 1,
      assets: [
        {
          type: "agent",
          name: "soft-factory",
          version: "x",
          runnerProtocol: 1,
          destination: "../escape",
          sha256: "0".repeat(64),
        },
      ],
    }),
    JSON.stringify({
      schemaVersion: 1,
      assets: [
        {
          type: "agent",
          name: "soft-factory",
          version: "x",
          runnerProtocol: 1,
          destination: OFFICIAL_ASSET_CATALOG[0].destination,
          sha256: "0".repeat(64),
        },
        {
          type: "agent",
          name: "soft-factory",
          version: "x",
          runnerProtocol: 1,
          destination: OFFICIAL_ASSET_CATALOG[0].destination,
          sha256: "1".repeat(64),
        },
      ],
    }),
  ])(
    "rejects malformed or contradictory manifest %# before mutation",
    async (manifest) => {
      const root = await temporaryRoot();
      await fs.mkdir(path.join(root, ".agents"));
      await fs.writeFile(path.join(root, ".agents", "manifest.json"), manifest);
      const before = await inventory(root);
      const files = new RecordingFiles(root);
      const error = await runnerError(
        service(files).install(root, [recommended[0]]),
      );
      expect(error.code).toBe("ASSET_MANIFEST_INVALID");
      expect(files.mutations()).toEqual([]);
      expect(await inventory(root)).toEqual(before);
      await fs.rm(root, { recursive: true, force: true });
    },
  );

  it("rejects symlink path ambiguity and invalid catalog selection without writes", async () => {
    const root = await temporaryRoot();
    const outside = await temporaryRoot();
    await fs.symlink(outside, path.join(root, ".agents"));
    const files = new RecordingFiles(root);
    expect(
      (await runnerError(service(files).install(root, [recommended[0]]))).code,
    ).toBe("ASSET_PATH_INVALID");
    expect(files.mutations()).toEqual([]);
    expect(
      (
        await runnerError(
          service(files).install(root, [{ type: "skill", name: "unknown" }]),
        )
      ).code,
    ).toBe("ASSET_CATALOG_INVALID");
    await fs.rm(root, { recursive: true, force: true });
    await fs.rm(outside, { recursive: true, force: true });
  });
});

describe("tracked installation scenario declarations", () => {
  it("is complete, uniquely named, and stable ordered", async () => {
    const names = (
      await fs.readdir(path.join(packageRoot, "fixtures", "install"))
    )
      .filter((name) => name.endsWith(".json"))
      .sort();
    expect(names).toEqual([
      "clean.json",
      "incompatible.json",
      "integrity-invalid.json",
      "modified-local.json",
      "recommended.json",
      "repeated.json",
    ]);
    expect(
      new Set(names.map((name) => fixture(name.slice(0, -5)).name)).size,
    ).toBe(names.length);
  });
});
