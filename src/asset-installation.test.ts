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
import {
  parseAssetManifest,
  serializeAssetManifest,
  type AssetManifestEntryV1,
} from "./asset-manifest";
import { RunnerError } from "./errors";
import {
  OFFICIAL_ASSET_CATALOG,
  OFFICIAL_ASSET_OWNERSHIP_CATALOG,
  ownershipKey,
  type OfficialAssetCatalogEntry,
  type OfficialAssetIdentity,
} from "./official-assets";

const packageRoot = path.resolve(__dirname, "..");
const current = OFFICIAL_ASSET_CATALOG[0];
const selected: readonly OfficialAssetIdentity[] = [
  { type: "agent", name: "soft-factory" },
];
const legacy = OFFICIAL_ASSET_OWNERSHIP_CATALOG.filter(
  (entry) => !entry.current,
);

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
  public readonly boundaries: string[] = [];
  public tripwire = false;
  public faultAt: number | null = null;
  public faultWhen: "before" | "after" = "before";
  public rollbackFault = false;
  private mutation = 0;
  private primaryTriggered = false;
  private rollbackTriggered = false;

  public constructor(private readonly root: string) {}

  private relative(value: string): string {
    return path.relative(this.root, value).split(path.sep).join("/");
  }

  private async mutate(
    label: string,
    action: () => Promise<void>,
  ): Promise<void> {
    this.mutation += 1;
    const index = this.mutation;
    this.boundaries.push(label);
    this.trace.push(label);
    if (this.tripwire) throw new Error("mutation tripwire");
    if (
      !this.primaryTriggered &&
      this.faultAt === index &&
      this.faultWhen === "before"
    ) {
      this.primaryTriggered = true;
      throw new Error(`fault before ${label}`);
    }
    if (
      this.primaryTriggered &&
      this.rollbackFault &&
      !this.rollbackTriggered
    ) {
      this.rollbackTriggered = true;
      throw new Error(`rollback fault at ${label}`);
    }
    await action();
    if (
      !this.primaryTriggered &&
      this.faultAt === index &&
      this.faultWhen === "after"
    ) {
      this.primaryTriggered = true;
      throw new Error(`fault after ${label}`);
    }
  }

  public async kind(filePath: string): Promise<AssetPathKind> {
    this.trace.push(`kind:${this.relative(filePath)}`);
    return this.live.kind(filePath);
  }
  public async read(filePath: string): Promise<Buffer | null> {
    this.trace.push(`read:${this.relative(filePath)}`);
    return this.live.read(filePath);
  }
  public async listDirectory(
    directoryPath: string,
  ): Promise<readonly string[]> {
    this.trace.push(`list:${this.relative(directoryPath)}`);
    return this.live.listDirectory(directoryPath);
  }
  public async createDirectory(directoryPath: string): Promise<void> {
    await this.mutate(`create:${this.relative(directoryPath)}`, () =>
      this.live.createDirectory(directoryPath),
    );
  }
  public async writeExclusive(filePath: string, bytes: Buffer): Promise<void> {
    await this.mutate(`stage:${this.relative(filePath)}`, () =>
      this.live.writeExclusive(filePath, bytes),
    );
  }
  public async rename(from: string, to: string): Promise<void> {
    await this.mutate(
      `rename:${this.relative(from)}->${this.relative(to)}`,
      () => this.live.rename(from, to),
    );
  }
  public async removeFile(filePath: string): Promise<void> {
    await this.mutate(`cleanup-file:${this.relative(filePath)}`, () =>
      this.live.removeFile(filePath),
    );
  }
  public async removeDirectory(directoryPath: string): Promise<void> {
    await this.mutate(`remove-dir:${this.relative(directoryPath)}`, () =>
      this.live.removeDirectory(directoryPath),
    );
  }
  public async removeTree(directoryPath: string): Promise<void> {
    await this.mutate(`cleanup-tree:${this.relative(directoryPath)}`, () =>
      this.live.removeTree(directoryPath),
    );
  }
  public mutations(): readonly string[] {
    return this.boundaries;
  }
}

function service(
  files: RecordingFiles,
  catalog: readonly OfficialAssetCatalogEntry[] = OFFICIAL_ASSET_CATALOG,
  source = new Source(),
): AssetInstallationService {
  return new AssetInstallationService(catalog, source, files, () => "fixture");
}
async function temporaryRoot(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "official-install-"));
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
async function runnerError(action: Promise<unknown>): Promise<RunnerError> {
  try {
    await action;
    throw new Error("expected RunnerError");
  } catch (cause: unknown) {
    if (!(cause instanceof RunnerError)) throw cause;
    return cause;
  }
}
function manifestEntry(
  descriptor: { type: "agent" | "skill"; name: string; destination: string },
  bytes: Buffer,
  version = "0.0.9",
): AssetManifestEntryV1 {
  return {
    type: descriptor.type,
    name: descriptor.name,
    version,
    runnerProtocol: 1,
    destination: descriptor.destination,
    sha256: sha256(bytes),
  };
}
async function writeManifest(
  root: string,
  entries: readonly AssetManifestEntryV1[],
): Promise<void> {
  await fs.mkdir(path.join(root, ".agents"), { recursive: true });
  await fs.writeFile(
    path.join(root, ".agents", "manifest.json"),
    serializeAssetManifest({ schemaVersion: 1, assets: entries }),
  );
}
async function writeManaged(
  root: string,
  destination: string,
  bytes: Buffer,
): Promise<void> {
  const target = path.join(root, destination);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, bytes);
}
async function desiredBytes(): Promise<Buffer> {
  return fs.readFile(path.join(packageRoot, current.source));
}
function finalEntry(): AssetManifestEntryV1 {
  return {
    type: current.type,
    name: current.name,
    version: current.version,
    runnerProtocol: current.runnerProtocol,
    destination: current.destination,
    sha256: current.sha256,
  };
}

const manifestShapes: readonly [string, unknown][] = [
  ["bad-json", "{"],
  ["bad-schema", { schemaVersion: 2, assets: [] }],
  ["extra-fields", { schemaVersion: 1, assets: [], extra: true }],
  [
    "unknown-destination",
    {
      schemaVersion: 1,
      assets: [
        {
          ...finalEntry(),
          destination: ".agents/agents/unknown.agent.md",
        },
      ],
    },
  ],
  [
    "malformed-digest",
    {
      schemaVersion: 1,
      assets: [{ ...finalEntry(), sha256: "ABC" }],
    },
  ],
  [
    "duplicate-pair",
    {
      schemaVersion: 1,
      assets: [finalEntry(), finalEntry()],
    },
  ],
  [
    "unstable-order",
    {
      schemaVersion: 1,
      assets: [
        { ...manifestEntry(legacy[2], Buffer.from("skill")) },
        { ...manifestEntry(legacy[0], Buffer.from("agent")) },
      ],
    },
  ],
];

describe("V1 closed catalog ownership grammar", () => {
  it("accepts exactly the four ranked pairs and exact dual-agent bridge", () => {
    expect(
      OFFICIAL_ASSET_OWNERSHIP_CATALOG.map((entry) => [
        entry.rank,
        ownershipKey(entry),
      ]),
    ).toEqual([
      [0, "agent:soft-factory@.agents/agents/soft-factory.agent.md"],
      [1, "agent:soft-factory@.github/agents/soft-factory.agent.md"],
      [
        2,
        "agent:soft-factory-assessor@.agents/agents/soft-factory-assessor.agent.md",
      ],
      [3, "skill:soft-factory@.agents/skills/soft-factory/SKILL.md"],
    ]);
    const old = manifestEntry(legacy[0], Buffer.from("old"));
    const bridge = parseAssetManifest(
      serializeAssetManifest({
        schemaVersion: 1,
        assets: [old, finalEntry()],
      }),
    );
    expect(bridge.assets).toHaveLength(2);
  });

  it.each(manifestShapes)("rejects %s metadata before planning", (_, value) => {
    const text = typeof value === "string" ? value : JSON.stringify(value);
    expect(() => parseAssetManifest(text)).toThrow(
      expect.objectContaining({ code: "ASSET_MANIFEST_INVALID" }),
    );
  });

  it("rejects contradictory duplicate identity outside the exact bridge", () => {
    const old = manifestEntry(legacy[0], Buffer.from("old"));
    const currentOwned = finalEntry();
    const duplicate = { ...currentOwned, destination: legacy[0].destination };
    expect(() =>
      parseAssetManifest(
        JSON.stringify({ schemaVersion: 1, assets: [old, duplicate] }),
      ),
    ).toThrow(expect.objectContaining({ code: "ASSET_MANIFEST_INVALID" }));
  });
});

describe("V3 clean individual, recommended, and repeat convergence", () => {
  it("installs trusted current bytes with exact one-entry metadata", async () => {
    const root = await temporaryRoot();
    const files = new RecordingFiles(root);
    const result = await service(files).install(root, selected);
    expect(result).toMatchObject({
      code: "ASSETS_INSTALLED",
      changed: true,
      assets: [{ status: "installed", destination: current.destination }],
      retirements: [],
    });
    expect(
      sha256(await fs.readFile(path.join(root, current.destination))),
    ).toBe(current.sha256);
    const manifest = parseAssetManifest(
      await fs.readFile(path.join(root, ".agents", "manifest.json"), "utf8"),
    );
    expect(manifest.assets).toEqual([finalEntry()]);
    expect(await inventory(root)).not.toHaveProperty(".agents/agents/");
    expect(await inventory(root)).not.toHaveProperty(".agents/skills/");
    const manifestRename = files.trace.findIndex((entry) =>
      entry.includes(
        "manifest.json.install-fixture.stage->.agents/manifest.json",
      ),
    );
    const currentRename = files.trace.findIndex((entry) =>
      entry.includes(
        "soft-factory.agent.md.install-fixture.stage->.github/agents/soft-factory.agent.md",
      ),
    );
    expect(manifestRename).toBeGreaterThan(currentRename);
    await fs.rm(root, { recursive: true, force: true });
  });

  it("repeats as a zero-mutation no-op and preserves the current inode", async () => {
    const root = await temporaryRoot();
    const firstFiles = new RecordingFiles(root);
    await service(firstFiles).install(root, selected);
    const before = await fs.stat(path.join(root, current.destination));
    const repeatFiles = new RecordingFiles(root);
    repeatFiles.tripwire = true;
    const result = await service(repeatFiles).install(root, selected);
    expect(result).toMatchObject({
      code: "ASSETS_UP_TO_DATE",
      changed: false,
      assets: [{ status: "up-to-date" }],
      retirements: [],
    });
    expect(repeatFiles.mutations()).toEqual([]);
    expect((await fs.stat(path.join(root, current.destination))).ino).toBe(
      before.ino,
    );
    await fs.rm(root, { recursive: true, force: true });
  });
});

describe("V4 legacy operator and dual destination migration matrix", () => {
  it("migrates matching old bytes and retires an absent stale old entry", async () => {
    for (const present of [true, false]) {
      const root = await temporaryRoot();
      const bytes = Buffer.from("owned legacy operator\n");
      if (present) await writeManaged(root, legacy[0].destination, bytes);
      await writeManifest(root, [manifestEntry(legacy[0], bytes)]);
      const result = await service(new RecordingFiles(root)).install(
        root,
        selected,
      );
      expect(result.retirements).toEqual([
        expect.objectContaining({
          destination: legacy[0].destination,
          status: present ? "retired" : "stale-entry-retired",
        }),
      ]);
      expect(await fs.readFile(path.join(root, current.destination))).toEqual(
        await desiredBytes(),
      );
      expect(
        await fs.stat(path.join(root, legacy[0].destination)).catch(() => null),
      ).toBeNull();
      expect(
        parseAssetManifest(
          await fs.readFile(
            path.join(root, ".agents", "manifest.json"),
            "utf8",
          ),
        ).assets,
      ).toEqual([finalEntry()]);
      await fs.rm(root, { recursive: true, force: true });
    }
  });

  it("adopts desired current bytes and upgrades recorded older current bytes while retiring old", async () => {
    for (const mode of ["adopt", "upgrade"] as const) {
      const root = await temporaryRoot();
      const old = Buffer.from("owned old operator\n");
      const desired = await desiredBytes();
      const currentOnDisk =
        mode === "adopt" ? desired : Buffer.from("owned older current\n");
      await writeManaged(root, legacy[0].destination, old);
      await writeManaged(root, current.destination, currentOnDisk);
      const beforeInode = (await fs.stat(path.join(root, current.destination)))
        .ino;
      const entries = [manifestEntry(legacy[0], old)];
      if (mode === "upgrade")
        entries.push(manifestEntry(current, currentOnDisk));
      await writeManifest(root, entries);
      const result = await service(new RecordingFiles(root)).install(
        root,
        selected,
      );
      expect(result.assets[0].status).toBe(
        mode === "adopt" ? "adopted" : "upgraded",
      );
      if (mode === "adopt")
        expect((await fs.stat(path.join(root, current.destination))).ino).toBe(
          beforeInode,
        );
      expect(await fs.readFile(path.join(root, current.destination))).toEqual(
        desired,
      );
      expect(result.retirements).toHaveLength(1);
      await fs.rm(root, { recursive: true, force: true });
    }
  });

  it.each([
    ["modified-old", "old"],
    ["unproved-current", "current"],
  ])("refuses dual destination %s before mutation", async (_, modified) => {
    const root = await temporaryRoot();
    const ownedOld = Buffer.from("owned old\n");
    await writeManaged(
      root,
      legacy[0].destination,
      modified === "old" ? Buffer.from("local old\n") : ownedOld,
    );
    await writeManaged(
      root,
      current.destination,
      modified === "current"
        ? Buffer.from("local current\n")
        : await desiredBytes(),
    );
    await writeManifest(root, [manifestEntry(legacy[0], ownedOld)]);
    const before = await inventory(root);
    const files = new RecordingFiles(root);
    const error = await runnerError(service(files).install(root, selected));
    expect(error).toMatchObject({
      code: "ASSET_LOCAL_MODIFIED",
      details: expect.objectContaining({ noChanges: true }),
    });
    expect(error.message).toContain("No files changed");
    expect(files.mutations()).toEqual([]);
    expect(await inventory(root)).toEqual(before);
    await fs.rm(root, { recursive: true, force: true });
  });
});

describe("V5 obsolete retirement, siblings, and empty directory cleanup", () => {
  it("retires matching assessor and skill, preserves siblings, and removes only empty eligible directories", async () => {
    const root = await temporaryRoot();
    const assessor = Buffer.from("owned assessor\n");
    const skill = Buffer.from("owned skill\n");
    await writeManaged(root, legacy[1].destination, assessor);
    await writeManaged(root, legacy[2].destination, skill);
    const sibling = path.join(
      root,
      ".agents",
      "skills",
      "soft-factory",
      "notes.md",
    );
    await fs.writeFile(sibling, "preserve me\n");
    const siblingBefore = await fs.stat(sibling);
    await writeManifest(root, [
      manifestEntry(legacy[1], assessor),
      manifestEntry(legacy[2], skill),
    ]);
    const result = await service(new RecordingFiles(root)).install(
      root,
      selected,
    );
    expect(result.retirements.map((entry) => entry.status)).toEqual([
      "retired",
      "retired",
    ]);
    expect(await fs.readFile(sibling, "utf8")).toBe("preserve me\n");
    expect((await fs.stat(sibling)).ino).toBe(siblingBefore.ino);
    expect(
      await fs.stat(path.join(root, ".agents", "agents")).catch(() => null),
    ).toBeNull();
    expect(
      await fs.stat(path.join(root, ".agents", "skills", "soft-factory")),
    ).toBeDefined();
    await fs.rm(root, { recursive: true, force: true });
  });

  it("retires absent metadata without deleting pre-existing directories", async () => {
    const root = await temporaryRoot();
    const absent = Buffer.from("absent skill proof\n");
    await fs.mkdir(path.join(root, ".agents", "skills", "soft-factory"), {
      recursive: true,
    });
    await writeManifest(root, [manifestEntry(legacy[2], absent)]);
    const result = await service(new RecordingFiles(root)).install(
      root,
      selected,
    );
    expect(result.retirements[0].status).toBe("stale-entry-retired");
    expect(
      (
        await fs.stat(path.join(root, ".agents", "skills", "soft-factory"))
      ).isDirectory(),
    ).toBe(true);
    await fs.rm(root, { recursive: true, force: true });
  });

  it("removes a proved skill path and empty ancestors deepest first", async () => {
    const root = await temporaryRoot();
    const skill = Buffer.from("owned skill\n");
    await writeManaged(root, legacy[2].destination, skill);
    await writeManifest(root, [manifestEntry(legacy[2], skill)]);
    const files = new RecordingFiles(root);
    await service(files).install(root, selected);
    const removals = files.trace.filter((entry) =>
      entry.startsWith("remove-dir:"),
    );
    expect(removals).toEqual([
      "remove-dir:.agents/skills/soft-factory",
      "remove-dir:.agents/skills",
    ]);
    await fs.rm(root, { recursive: true, force: true });
  });
});

describe("V6 no-change refusal matrix", () => {
  it.each([
    ["modified-assessor", legacy[1]],
    ["modified-skill", legacy[2]],
  ])(
    "refuses %s with stable redacted no-change evidence",
    async (_, descriptor) => {
      const root = await temporaryRoot();
      const recorded = Buffer.from("recorded bytes\n");
      await writeManaged(
        root,
        descriptor.destination,
        Buffer.from("local secret\n"),
      );
      await writeManifest(root, [manifestEntry(descriptor, recorded)]);
      const before = await inventory(root);
      const files = new RecordingFiles(root);
      const first = await runnerError(service(files).install(root, selected));
      const second = await runnerError(
        service(new RecordingFiles(root)).install(root, selected),
      );
      expect(first.code).toBe("ASSET_LOCAL_MODIFIED");
      expect(first.message).toContain("No files changed");
      expect(first.message).not.toContain("local secret");
      expect(second.message).toBe(first.message);
      expect(files.mutations()).toEqual([]);
      expect(await inventory(root)).toEqual(before);
      await fs.rm(root, { recursive: true, force: true });
    },
  );

  it("refuses an unrecorded legacy file and managed-root symlink indirection", async () => {
    const root = await temporaryRoot();
    await writeManaged(root, legacy[0].destination, Buffer.from("unowned\n"));
    const files = new RecordingFiles(root);
    expect(
      (await runnerError(service(files).install(root, selected))).code,
    ).toBe("ASSET_LOCAL_MODIFIED");
    expect(files.mutations()).toEqual([]);
    await fs.rm(root, { recursive: true, force: true });

    const symlinkRoot = await temporaryRoot();
    const outside = await temporaryRoot();
    await fs.symlink(outside, path.join(symlinkRoot, ".github"));
    const symlinkFiles = new RecordingFiles(symlinkRoot);
    expect(
      (await runnerError(service(symlinkFiles).install(symlinkRoot, selected)))
        .code,
    ).toBe("ASSET_PATH_INVALID");
    expect(symlinkFiles.mutations()).toEqual([]);
    await fs.rm(symlinkRoot, { recursive: true, force: true });
    await fs.rm(outside, { recursive: true, force: true });
  });

  it("rejects malformed ownership through the service with exact inventory equality", async () => {
    const root = await temporaryRoot();
    await fs.mkdir(path.join(root, ".agents"));
    await fs.writeFile(path.join(root, ".agents", "manifest.json"), "{");
    const before = await inventory(root);
    const files = new RecordingFiles(root);
    const error = await runnerError(service(files).install(root, selected));
    expect(error.code).toBe("ASSET_MANIFEST_INVALID");
    expect(error.details.noChanges).toBe(true);
    expect(files.mutations()).toEqual([]);
    expect(await inventory(root)).toEqual(before);
    await fs.rm(root, { recursive: true, force: true });
  });
});

describe("V7 current adoption, upgrade, and combined retirement", () => {
  it("adopts unmanaged desired bytes without rewrite", async () => {
    const root = await temporaryRoot();
    await writeManaged(root, current.destination, await desiredBytes());
    const inode = (await fs.stat(path.join(root, current.destination))).ino;
    const files = new RecordingFiles(root);
    const result = await service(files).install(root, selected);
    expect(result.assets[0].status).toBe("adopted");
    expect((await fs.stat(path.join(root, current.destination))).ino).toBe(
      inode,
    );
    expect(
      files.trace.some(
        (entry) =>
          entry.startsWith("rename:") &&
          entry.endsWith("->.github/agents/soft-factory.agent.md"),
      ),
    ).toBe(false);
    await fs.rm(root, { recursive: true, force: true });
  });

  it("upgrades proved current bytes and retires all obsolete assets together", async () => {
    const root = await temporaryRoot();
    const older = Buffer.from("older current\n");
    const old = Buffer.from("old operator\n");
    const assessor = Buffer.from("assessor\n");
    const skill = Buffer.from("skill\n");
    for (const [descriptor, bytes] of [
      [current, older],
      [legacy[0], old],
      [legacy[1], assessor],
      [legacy[2], skill],
    ] as const)
      await writeManaged(root, descriptor.destination, bytes);
    await writeManifest(root, [
      manifestEntry(legacy[0], old),
      manifestEntry(current, older),
      manifestEntry(legacy[1], assessor),
      manifestEntry(legacy[2], skill),
    ]);
    const result = await service(new RecordingFiles(root)).install(
      root,
      selected,
    );
    expect(result.assets[0].status).toBe("upgraded");
    expect(result.retirements).toHaveLength(3);
    expect(await fs.readFile(path.join(root, current.destination))).toEqual(
      await desiredBytes(),
    );
    const repeatFiles = new RecordingFiles(root);
    repeatFiles.tripwire = true;
    expect((await service(repeatFiles).install(root, selected)).code).toBe(
      "ASSETS_UP_TO_DATE",
    );
    await fs.rm(root, { recursive: true, force: true });
  });
});

type ShapeName =
  | "clean"
  | "migration"
  | "adoption-retirement"
  | "upgrade-retirement"
  | "retirement-only";
async function setupShape(name: ShapeName): Promise<string> {
  const root = await temporaryRoot();
  const desired = await desiredBytes();
  if (name === "clean") return root;
  if (name === "migration") {
    const old = Buffer.from("migration old\n");
    await writeManaged(root, legacy[0].destination, old);
    await writeManifest(root, [manifestEntry(legacy[0], old)]);
    return root;
  }
  if (name === "adoption-retirement") {
    const assessor = Buffer.from("adoption assessor\n");
    await writeManaged(root, current.destination, desired);
    await writeManaged(root, legacy[1].destination, assessor);
    await writeManifest(root, [manifestEntry(legacy[1], assessor)]);
    return root;
  }
  if (name === "upgrade-retirement") {
    const older = Buffer.from("upgrade current\n");
    const skill = Buffer.from("upgrade skill\n");
    await writeManaged(root, current.destination, older);
    await writeManaged(root, legacy[2].destination, skill);
    await writeManifest(root, [
      manifestEntry(current, older),
      manifestEntry(legacy[2], skill),
    ]);
    return root;
  }
  const assessor = Buffer.from("retirement assessor\n");
  await writeManaged(root, current.destination, desired);
  await writeManaged(root, legacy[1].destination, assessor);
  await writeManifest(root, [finalEntry(), manifestEntry(legacy[1], assessor)]);
  return root;
}
const shapes: readonly ShapeName[] = [
  "clean",
  "migration",
  "adoption-retirement",
  "upgrade-retirement",
  "retirement-only",
];

describe("V8 exact rollback at every concrete mutation boundary", () => {
  jest.setTimeout(120_000);
  it.each(shapes)(
    "restores exact inventory for every %s boundary",
    async (shape) => {
      const successfulRoot = await setupShape(shape);
      const successfulFiles = new RecordingFiles(successfulRoot);
      await service(successfulFiles).install(successfulRoot, selected);
      const boundaryCount = successfulFiles.boundaries.length;
      expect(boundaryCount).toBeGreaterThan(0);
      await fs.rm(successfulRoot, { recursive: true, force: true });

      for (let faultAt = 1; faultAt <= boundaryCount; faultAt += 1) {
        for (const faultWhen of ["before", "after"] as const) {
          const root = await setupShape(shape);
          const before = await inventory(root);
          const files = new RecordingFiles(root);
          files.faultAt = faultAt;
          files.faultWhen = faultWhen;
          const error = await runnerError(
            service(files).install(root, selected),
          );
          expect(error.code).toBe("ASSET_FILESYSTEM_FAILED");
          expect(await inventory(root)).toEqual(before);
          expect(
            Object.keys(await inventory(root)).some((entry) =>
              entry.includes("install-fixture"),
            ),
          ).toBe(false);
          await fs.rm(root, { recursive: true, force: true });
        }
      }
    },
  );

  it("covers the explicit post-new-write and pre-old-retirement window", async () => {
    const root = await setupShape("migration");
    const before = await inventory(root);
    const probe = new RecordingFiles(root);
    await service(probe).install(root, selected);
    const boundary = probe.boundaries.findIndex((entry) =>
      entry.endsWith("->.github/agents/soft-factory.agent.md"),
    );
    expect(boundary).toBeGreaterThanOrEqual(0);
    await fs.rm(root, { recursive: true, force: true });

    const faultRoot = await setupShape("migration");
    const files = new RecordingFiles(faultRoot);
    files.faultAt = boundary + 1;
    files.faultWhen = "after";
    expect(
      (await runnerError(service(files).install(faultRoot, selected))).code,
    ).toBe("ASSET_FILESYSTEM_FAILED");
    expect(await inventory(faultRoot)).toEqual(before);
    await fs.rm(faultRoot, { recursive: true, force: true });
  });
});

describe("V9 uncertain rollback evidence", () => {
  it.each(shapes)("reports complete affected paths for %s", async (shape) => {
    const root = await setupShape(shape);
    const probe = new RecordingFiles(root);
    await service(probe).install(root, selected);
    const changedBoundary = probe.boundaries.findIndex(
      (entry) =>
        entry.endsWith("->.github/agents/soft-factory.agent.md") ||
        entry.includes("->.agents/.install-fixture/retired-"),
    );
    await fs.rm(root, { recursive: true, force: true });

    const faultRoot = await setupShape(shape);
    const files = new RecordingFiles(faultRoot);
    files.faultAt = Math.max(1, changedBoundary + 1);
    files.faultWhen = "after";
    files.rollbackFault = true;
    const error = await runnerError(
      service(files).install(faultRoot, selected),
    );
    expect(error.code).toBe("ASSET_ROLLBACK_UNCERTAIN");
    expect(error.message).not.toContain("No files changed");
    expect(error.remediation).toContain("Stop");
    expect(error.remediation).toContain("every listed path");
    expect(error.remediation).toContain("version control or backup");
    expect(error.remediation).toContain("retry only after restoration");
    expect(error.details.paths).toEqual(
      expect.arrayContaining([
        ".github/agents/soft-factory.agent.md",
        ".agents/manifest.json",
      ]),
    );
    expect(JSON.stringify(error.details)).not.toContain("owned");
    await fs.rm(faultRoot, { recursive: true, force: true });
  });
});

describe("catalog integrity and protocol preflight", () => {
  it.each(["protocol", "digest"])(
    "refuses %s faults with zero mutations",
    async (kind) => {
      const root = await temporaryRoot();
      const files = new RecordingFiles(root);
      const catalog = [
        {
          ...current,
          ...(kind === "protocol"
            ? { runnerProtocol: 2 }
            : { sha256: "0".repeat(64) }),
        },
      ];
      const error = await runnerError(
        service(files, catalog).install(root, selected),
      );
      expect(error.code).toBe(
        kind === "protocol"
          ? "ASSET_PROTOCOL_INCOMPATIBLE"
          : "ASSET_INTEGRITY_INVALID",
      );
      expect(error.message).toContain("No files changed");
      expect(files.mutations()).toEqual([]);
      expect(await inventory(root)).toEqual({});
      await fs.rm(root, { recursive: true, force: true });
    },
  );
});

describe("tracked Issue 27 installation scenario declarations", () => {
  it("is complete, uniquely named, and stable ordered across V3-V9 and V11", async () => {
    const catalog = JSON.parse(
      await fs.readFile(
        path.join(
          packageRoot,
          "fixtures",
          "install",
          "issue-27-scenarios.json",
        ),
        "utf8",
      ),
    ) as {
      schemaVersion: number;
      groups: { validation: string; scenarios: string[] }[];
    };
    expect(catalog.schemaVersion).toBe(1);
    expect(catalog.groups.map((group) => group.validation)).toEqual([
      "V3",
      "V4",
      "V5",
      "V6",
      "V7",
      "V8",
      "V9",
      "V11",
    ]);
    const names = catalog.groups.flatMap((group) => group.scenarios);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toEqual(
      expect.arrayContaining([
        "clean-individual",
        "clean-recommended",
        "matching-old-agent",
        "absent-old-agent",
        "both-destinations-modified-old-refusal",
        "matching-assessor-retirement",
        "matching-skill-retirement",
        "skill-sibling-preservation",
        "empty-legacy-directory-cleanup",
        "malformed-manifest",
        "contradictory-ownership",
        "unsafe-path-indirection",
        "desired-current-adoption",
        "owned-current-upgrade",
        "fault-post-current-pre-legacy",
        "uncertain-retirement-only",
        "packed-legacy-migration",
      ]),
    );
  });
});
