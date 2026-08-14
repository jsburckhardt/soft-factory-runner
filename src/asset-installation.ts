import { createHash } from "node:crypto";
import path from "node:path";
import {
  emptyAssetManifest,
  parseAssetManifest,
  serializeAssetManifest,
  type AssetManifestEntryV1,
} from "./asset-manifest";
import { DOCTOR_PROTOCOL_VERSION } from "./doctor";
import { RunnerError, isRunnerError } from "./errors";
import {
  OFFICIAL_ASSET_OWNERSHIP_CATALOG,
  OFFICIAL_MANIFEST_PATH,
  findOfficialAsset,
  officialAssetKey,
  ownershipKey,
  type OfficialAssetCatalogEntry,
  type OfficialAssetIdentity,
  type OfficialAssetOwnershipDescriptor,
} from "./official-assets";

export type AssetPathKind =
  "missing" | "file" | "directory" | "symlink" | "other";
export interface AssetFileSystemPort {
  kind(filePath: string): Promise<AssetPathKind>;
  read(filePath: string): Promise<Buffer | null>;
  listDirectory(directoryPath: string): Promise<readonly string[]>;
  createDirectory(directoryPath: string): Promise<void>;
  writeExclusive(filePath: string, bytes: Buffer): Promise<void>;
  rename(from: string, to: string): Promise<void>;
  removeFile(filePath: string): Promise<void>;
  removeDirectory(directoryPath: string): Promise<void>;
  removeTree(directoryPath: string): Promise<void>;
}
export interface OfficialAssetSourcePort {
  read(source: string): Promise<Buffer>;
}
export type AssetInstallationStatus =
  "installed" | "adopted" | "upgraded" | "up-to-date";
export interface AssetInstallationOutcomeV1 extends AssetManifestEntryV1 {
  readonly status: AssetInstallationStatus;
}
export type AssetRetirementStatus = "retired" | "stale-entry-retired";
export interface AssetRetirementOutcomeV1 {
  readonly type: "agent" | "skill";
  readonly name: string;
  readonly destination: string;
  readonly status: AssetRetirementStatus;
}
export interface AssetInstallationPlan {
  readonly currentStatus: AssetInstallationStatus;
  readonly currentWrite: boolean;
  readonly retirements: readonly AssetRetirementOutcomeV1[];
  readonly removeDirectories: readonly string[];
  readonly affectedPaths: readonly string[];
}
export interface AssetInstallationResultV1 {
  readonly schemaVersion: 1;
  readonly code: "ASSETS_INSTALLED" | "ASSETS_UP_TO_DATE";
  readonly changed: boolean;
  readonly manifest: typeof OFFICIAL_MANIFEST_PATH;
  readonly assets: readonly AssetInstallationOutcomeV1[];
  readonly retirements: readonly AssetRetirementOutcomeV1[];
}
export interface AssetInstaller {
  install(
    repositoryRoot: string,
    selected: readonly OfficialAssetIdentity[],
  ): Promise<AssetInstallationResultV1>;
}

interface FileSnapshot {
  readonly path: string;
  readonly previous: Buffer | null;
}
interface DirectorySnapshot {
  readonly path: string;
  readonly previous: "missing" | "directory";
}
interface InternalPlan extends AssetInstallationPlan {
  readonly root: string;
  readonly current: OfficialAssetCatalogEntry;
  readonly currentPath: string;
  readonly currentBytes: Buffer;
  readonly previousCurrent: Buffer | null;
  readonly manifestPath: string;
  readonly previousManifest: Buffer | null;
  readonly finalManifest: Buffer;
  readonly manifestWrite: boolean;
  readonly retirementFiles: readonly FileSnapshot[];
  readonly directorySnapshots: readonly DirectorySnapshot[];
}

export class AssetInstallationService implements AssetInstaller {
  public constructor(
    private readonly catalog: readonly OfficialAssetCatalogEntry[],
    private readonly source: OfficialAssetSourcePort,
    private readonly files: AssetFileSystemPort,
    private readonly nextTransactionId: () => string,
  ) {}

  public async install(
    repositoryRoot: string,
    selectedIdentities: readonly OfficialAssetIdentity[],
  ): Promise<AssetInstallationResultV1> {
    const root = path.resolve(repositoryRoot);
    const current = this.select(selectedIdentities);
    const currentBytes = await this.readTrustedSource(current);
    const plan = await this.preflight(root, current, currentBytes);
    if (
      plan.currentWrite ||
      plan.manifestWrite ||
      plan.retirementFiles.length > 0 ||
      plan.removeDirectories.length > 0
    )
      await this.commit(plan);
    const changed =
      plan.currentWrite ||
      plan.manifestWrite ||
      plan.retirements.length > 0 ||
      plan.removeDirectories.length > 0;
    return {
      schemaVersion: 1,
      code: changed ? "ASSETS_INSTALLED" : "ASSETS_UP_TO_DATE",
      changed,
      manifest: OFFICIAL_MANIFEST_PATH,
      assets: [
        {
          type: current.type,
          name: current.name,
          version: current.version,
          runnerProtocol: current.runnerProtocol,
          destination: current.destination,
          sha256: current.sha256,
          status: plan.currentStatus,
        },
      ],
      retirements: plan.retirements,
    };
  }

  private select(
    identities: readonly OfficialAssetIdentity[],
  ): OfficialAssetCatalogEntry {
    const catalogKeys = this.catalog.map(officialAssetKey);
    if (
      this.catalog.length !== 1 ||
      new Set(catalogKeys).size !== catalogKeys.length
    )
      throw catalogError(
        "The official catalog must contain exactly one unique current asset.",
      );
    if (identities.length !== 1)
      throw catalogError(
        "Exactly one current official asset must be selected.",
      );
    const entry = findOfficialAsset(identities[0], this.catalog);
    if (entry === undefined)
      throw catalogError(
        `Unsupported official asset ${officialAssetKey(identities[0])}.`,
      );
    this.validateCatalogEntry(entry);
    return entry;
  }

  private validateCatalogEntry(entry: OfficialAssetCatalogEntry): void {
    if (
      entry.type !== "agent" ||
      entry.name !== "soft-factory" ||
      entry.destination !== ".github/agents/soft-factory.agent.md"
    )
      throw catalogError("The official catalog current identity is invalid.");
    if (entry.runnerProtocol !== DOCTOR_PROTOCOL_VERSION)
      throw new RunnerError(
        "ASSET_PROTOCOL_INCOMPATIBLE",
        `Official asset ${officialAssetKey(entry)} requires Runner protocol ${entry.runnerProtocol}; this Runner supports protocol 1. No files changed.`,
        "Install a soft-factory-runner release compatible with the selected asset.",
        {
          details: {
            asset: officialAssetKey(entry),
            supportedProtocol: 1,
            noChanges: true,
          },
        },
      );
    if (!/^[0-9a-f]{64}$/.test(entry.sha256))
      throw catalogError(
        `Official asset ${officialAssetKey(entry)} has an invalid SHA-256 digest.`,
      );
  }

  private async readTrustedSource(
    entry: OfficialAssetCatalogEntry,
  ): Promise<Buffer> {
    let bytes: Buffer;
    try {
      bytes = await this.source.read(entry.source);
    } catch (cause: unknown) {
      throw new RunnerError(
        "ASSET_INTEGRITY_INVALID",
        `Packaged bytes for ${officialAssetKey(entry)} are unavailable. No files changed.`,
        "Reinstall the soft-factory-runner npm package and retry.",
        { details: { source: entry.source, noChanges: true }, cause },
      );
    }
    if (sha256(bytes) !== entry.sha256)
      throw new RunnerError(
        "ASSET_INTEGRITY_INVALID",
        `Packaged bytes for ${officialAssetKey(entry)} do not match the official SHA-256 digest. No files changed.`,
        "Reinstall soft-factory-runner from a trusted package source and retry.",
        { details: { source: entry.source, noChanges: true } },
      );
    return bytes;
  }

  private async preflight(
    root: string,
    current: OfficialAssetCatalogEntry,
    currentBytes: Buffer,
  ): Promise<InternalPlan> {
    const allManagedPaths = [
      OFFICIAL_MANIFEST_PATH,
      ...OFFICIAL_ASSET_OWNERSHIP_CATALOG.map((entry) => entry.destination),
    ];
    await this.validatePathLayout(root, allManagedPaths);
    const manifestPath = this.absolute(root, OFFICIAL_MANIFEST_PATH);
    const manifestKind = await this.safeKind(manifestPath);
    if (manifestKind !== "missing" && manifestKind !== "file")
      throw pathError(OFFICIAL_MANIFEST_PATH, manifestKind);
    const previousManifest = await this.safeRead(manifestPath);
    const parsedManifest =
      previousManifest === null
        ? emptyAssetManifest()
        : parseAssetManifest(previousManifest.toString("utf8"));
    const manifestByPair = new Map(
      parsedManifest.assets.map((entry) => [ownershipKey(entry), entry]),
    );

    const currentPath = this.absolute(root, current.destination);
    const currentKind = await this.safeKind(currentPath);
    if (currentKind !== "missing" && currentKind !== "file")
      throw pathError(current.destination, currentKind);
    const previousCurrent = await this.safeRead(currentPath);
    const currentRecord = manifestByPair.get(
      ownershipKey({
        type: current.type,
        name: current.name,
        destination: current.destination,
      }),
    );
    let currentStatus: AssetInstallationStatus;
    let currentWrite = false;
    if (previousCurrent === null) {
      currentStatus = "installed";
      currentWrite = true;
    } else if (previousCurrent.equals(currentBytes)) {
      currentStatus = manifestEntryEquals(currentRecord, current)
        ? "up-to-date"
        : "adopted";
    } else if (
      currentRecord !== undefined &&
      sha256(previousCurrent) === currentRecord.sha256
    ) {
      currentStatus = "upgraded";
      currentWrite = true;
    } else {
      throw localModifiedError(current.destination);
    }

    const retirements: AssetRetirementOutcomeV1[] = [];
    const retirementFiles: FileSnapshot[] = [];
    const retiredDescriptors: OfficialAssetOwnershipDescriptor[] = [];
    for (const descriptor of OFFICIAL_ASSET_OWNERSHIP_CATALOG.filter(
      (entry) => !entry.current,
    )) {
      const absolute = this.absolute(root, descriptor.destination);
      const kind = await this.safeKind(absolute);
      if (kind !== "missing" && kind !== "file")
        throw pathError(descriptor.destination, kind);
      const record = manifestByPair.get(ownershipKey(descriptor));
      if (kind === "file") {
        if (record === undefined)
          throw localModifiedError(descriptor.destination);
        const bytes = await this.safeRead(absolute);
        if (bytes === null || sha256(bytes) !== record.sha256)
          throw localModifiedError(descriptor.destination);
        retirements.push({
          type: descriptor.type,
          name: descriptor.name,
          destination: descriptor.destination,
          status: "retired",
        });
        retirementFiles.push({ path: absolute, previous: bytes });
        retiredDescriptors.push(descriptor);
      } else if (record !== undefined) {
        retirements.push({
          type: descriptor.type,
          name: descriptor.name,
          destination: descriptor.destination,
          status: "stale-entry-retired",
        });
      }
    }

    const currentEntry: AssetManifestEntryV1 = {
      type: current.type,
      name: current.name,
      version: current.version,
      runnerProtocol: current.runnerProtocol,
      destination: current.destination,
      sha256: current.sha256,
    };
    const finalManifest = Buffer.from(
      serializeAssetManifest({ schemaVersion: 1, assets: [currentEntry] }),
      "utf8",
    );
    const manifestWrite =
      previousManifest === null || !previousManifest.equals(finalManifest);
    const removeDirectories = await this.planDirectoryRemovals(
      root,
      retiredDescriptors,
      retirementFiles.map((entry) => entry.path),
    );
    const mutationTargets = [
      ...(currentWrite ? [currentPath] : []),
      ...(manifestWrite ? [manifestPath] : []),
    ];
    const directoryPaths = new Set<string>();
    for (const target of mutationTargets)
      for (const directory of this.parentDirectories(root, target))
        directoryPaths.add(directory);
    for (const directory of removeDirectories)
      directoryPaths.add(this.absolute(root, directory));
    const directorySnapshots: DirectorySnapshot[] = [];
    for (const directory of [...directoryPaths].sort(byDepthAscending)) {
      const kind = await this.safeKind(directory);
      if (kind !== "missing" && kind !== "directory")
        throw pathError(this.relative(root, directory), kind);
      directorySnapshots.push({ path: directory, previous: kind });
    }
    const affectedPaths = [
      current.destination,
      OFFICIAL_MANIFEST_PATH,
      ...retirements.map((entry) => entry.destination),
      ...removeDirectories,
    ].filter((value, index, all) => all.indexOf(value) === index);
    return {
      root,
      current,
      currentPath,
      currentBytes,
      previousCurrent,
      currentStatus,
      currentWrite,
      manifestPath,
      previousManifest,
      finalManifest,
      manifestWrite,
      retirementFiles,
      retirements,
      removeDirectories,
      directorySnapshots,
      affectedPaths,
    };
  }

  private async planDirectoryRemovals(
    root: string,
    retiredDescriptors: readonly OfficialAssetOwnershipDescriptor[],
    retiredFiles: readonly string[],
  ): Promise<readonly string[]> {
    const candidates = new Set<string>();
    for (const descriptor of retiredDescriptors)
      for (const ancestor of descriptor.legacyAncestors)
        candidates.add(this.absolute(root, ancestor));
    const virtuallyRemoved = new Set(retiredFiles);
    const planned: string[] = [];
    for (const directory of [...candidates].sort(byDepthDescending)) {
      if ((await this.safeKind(directory)) !== "directory") continue;
      const names = await this.safeList(directory);
      const children = names.map((name) => path.join(directory, name));
      if (children.every((child) => virtuallyRemoved.has(child))) {
        planned.push(this.relative(root, directory));
        virtuallyRemoved.add(directory);
      }
    }
    return planned;
  }

  private async validatePathLayout(
    root: string,
    destinations: readonly string[],
  ): Promise<void> {
    const directories = new Set<string>();
    for (const destination of destinations) {
      const absolute = this.absolute(root, destination);
      for (const directory of this.parentDirectories(root, absolute))
        directories.add(directory);
    }
    for (const directory of [...directories].sort(byDepthAscending)) {
      const kind = await this.safeKind(directory);
      if (kind !== "missing" && kind !== "directory")
        throw pathError(this.relative(root, directory), kind);
    }
  }

  private parentDirectories(root: string, target: string): readonly string[] {
    const directories: string[] = [];
    let current = path.dirname(target);
    while (current !== root) {
      directories.push(current);
      current = path.dirname(current);
    }
    return directories.reverse();
  }

  private absolute(root: string, relative: string): string {
    const normalized = path.posix.normalize(relative);
    const acceptedRoot =
      relative === ".agents" ||
      relative.startsWith(".agents/") ||
      relative === ".github" ||
      relative.startsWith(".github/");
    if (path.isAbsolute(relative) || relative !== normalized || !acceptedRoot)
      throw pathError(relative, "other");
    const absolute = path.resolve(root, relative);
    const contained = [".agents", ".github"].some((managed) => {
      const managedRoot = path.resolve(root, managed);
      return (
        absolute === managedRoot || absolute.startsWith(managedRoot + path.sep)
      );
    });
    if (!contained) throw pathError(relative, "other");
    return absolute;
  }

  private relative(root: string, absolute: string): string {
    return path.relative(root, absolute).split(path.sep).join("/");
  }

  private async safeKind(filePath: string): Promise<AssetPathKind> {
    try {
      return await this.files.kind(filePath);
    } catch (cause: unknown) {
      throw fileError("inspect", filePath, cause);
    }
  }
  private async safeRead(filePath: string): Promise<Buffer | null> {
    try {
      return await this.files.read(filePath);
    } catch (cause: unknown) {
      throw fileError("read", filePath, cause);
    }
  }
  private async safeList(directoryPath: string): Promise<readonly string[]> {
    try {
      return await this.files.listDirectory(directoryPath);
    } catch (cause: unknown) {
      throw fileError("list", directoryPath, cause);
    }
  }

  private async commit(plan: InternalPlan): Promise<void> {
    const id = this.nextTransactionId();
    const currentStage = `${plan.currentPath}.install-${id}.stage`;
    const currentBackup = `${plan.currentPath}.install-${id}.backup`;
    const manifestStage = `${plan.manifestPath}.install-${id}.stage`;
    const manifestBackup = `${plan.manifestPath}.install-${id}.backup`;
    const transactionRoot = path.join(plan.root, ".agents", `.install-${id}`);
    const retiredBackups = plan.retirementFiles.map((_, index) =>
      path.join(transactionRoot, `retired-${index}`),
    );
    const artifacts = [
      ...(plan.currentWrite ? [currentStage, currentBackup] : []),
      ...(plan.manifestWrite ? [manifestStage, manifestBackup] : []),
      ...retiredBackups,
    ];
    for (const artifact of [
      ...artifacts,
      ...(plan.retirementFiles.length > 0 ? [transactionRoot] : []),
    ]) {
      if ((await this.safeKind(artifact)) !== "missing")
        throw pathError(this.relative(plan.root, artifact), "file");
    }
    const fileSnapshots: FileSnapshot[] = [
      { path: plan.currentPath, previous: plan.previousCurrent },
      { path: plan.manifestPath, previous: plan.previousManifest },
      ...plan.retirementFiles,
    ];
    const directories = [...plan.directorySnapshots];
    if (plan.retirementFiles.length > 0)
      directories.push({ path: transactionRoot, previous: "missing" });
    const missingDirectories = directories
      .filter((entry) => entry.previous === "missing")
      .map((entry) => entry.path)
      .filter((value, index, all) => all.indexOf(value) === index)
      .sort(byDepthAscending);
    try {
      for (const directory of missingDirectories) {
        if (directory === transactionRoot) continue;
        await this.files.createDirectory(directory);
      }
      if (plan.retirementFiles.length > 0)
        await this.files.createDirectory(transactionRoot);
      if (plan.currentWrite)
        await this.files.writeExclusive(currentStage, plan.currentBytes);
      if (plan.manifestWrite)
        await this.files.writeExclusive(manifestStage, plan.finalManifest);
      if (plan.currentWrite) {
        if (plan.previousCurrent !== null)
          await this.files.rename(plan.currentPath, currentBackup);
        await this.files.rename(currentStage, plan.currentPath);
      }
      for (const [index, retirement] of plan.retirementFiles.entries())
        await this.files.rename(retirement.path, retiredBackups[index]);
      for (const directory of plan.removeDirectories)
        await this.files.removeDirectory(this.absolute(plan.root, directory));
      if (plan.manifestWrite) {
        if (plan.previousManifest !== null)
          await this.files.rename(plan.manifestPath, manifestBackup);
        await this.files.rename(manifestStage, plan.manifestPath);
      }
      for (const backup of [currentBackup, manifestBackup]) {
        if ((await this.safeKind(backup)) === "file")
          await this.files.removeFile(backup);
      }
      if (plan.retirementFiles.length > 0)
        await this.files.removeTree(transactionRoot);
    } catch (cause: unknown) {
      const rollbackFailure = await this.restore(
        plan,
        fileSnapshots,
        directories,
        artifacts,
        transactionRoot,
        id,
      );
      if (rollbackFailure !== null)
        throw new RunnerError(
          "ASSET_ROLLBACK_UNCERTAIN",
          "Official asset installation failed and exact rollback could not be proved.",
          "Stop. Inspect every listed path, restore it from version control or backup, then retry only after restoration.",
          {
            details: { paths: plan.affectedPaths },
            cause: rollbackFailure,
          },
        );
      if (isRunnerError(cause)) throw cause;
      throw fileError("commit transaction", "official asset paths", cause);
    }
  }

  private async restore(
    plan: InternalPlan,
    files: readonly FileSnapshot[],
    directories: readonly DirectorySnapshot[],
    artifacts: readonly string[],
    transactionRoot: string,
    id: string,
  ): Promise<unknown | null> {
    try {
      for (const directory of directories
        .filter((entry) => entry.previous === "directory")
        .sort((left, right) => byDepthAscending(left.path, right.path))) {
        const kind = await this.files.kind(directory.path);
        if (kind === "missing")
          await this.files.createDirectory(directory.path);
        else if (kind !== "directory")
          throw new Error("directory restore collision");
      }
      for (const snapshot of files) {
        const kind = await this.files.kind(snapshot.path);
        if (snapshot.previous === null) {
          if (kind === "file") await this.files.removeFile(snapshot.path);
          else if (kind !== "missing")
            throw new Error("file restore collision");
          continue;
        }
        if (kind === "file") {
          const bytes = await this.files.read(snapshot.path);
          if (bytes !== null && bytes.equals(snapshot.previous)) continue;
          await this.files.removeFile(snapshot.path);
        } else if (kind !== "missing") {
          throw new Error("file restore collision");
        }
        const restoreStage = `${snapshot.path}.install-${id}.restore`;
        if ((await this.files.kind(restoreStage)) === "file")
          await this.files.removeFile(restoreStage);
        await this.files.writeExclusive(restoreStage, snapshot.previous);
        await this.files.rename(restoreStage, snapshot.path);
      }
      for (const artifact of artifacts) {
        if ((await this.files.kind(artifact)) === "file")
          await this.files.removeFile(artifact);
      }
      if ((await this.files.kind(transactionRoot)) === "directory")
        await this.files.removeTree(transactionRoot);
      for (const directory of directories
        .filter((entry) => entry.previous === "missing")
        .sort((left, right) => byDepthDescending(left.path, right.path))) {
        const kind = await this.files.kind(directory.path);
        if (kind === "directory")
          await this.files.removeDirectory(directory.path);
        else if (kind !== "missing")
          throw new Error("directory cleanup collision");
      }
      for (const snapshot of files) {
        const kind = await this.files.kind(snapshot.path);
        if (snapshot.previous === null) {
          if (kind !== "missing") throw new Error("rollback absence unproved");
        } else {
          const bytes =
            kind === "file" ? await this.files.read(snapshot.path) : null;
          if (bytes === null || !bytes.equals(snapshot.previous))
            throw new Error("rollback bytes unproved");
        }
      }
      for (const directory of directories) {
        const kind = await this.files.kind(directory.path);
        if (kind !== directory.previous)
          throw new Error("rollback directory kind unproved");
      }
      return null;
    } catch (cause: unknown) {
      return cause;
    }
  }
}

export function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}
function manifestEntryEquals(
  prior: AssetManifestEntryV1 | undefined,
  desired: OfficialAssetCatalogEntry,
): boolean {
  return (
    prior !== undefined &&
    prior.type === desired.type &&
    prior.name === desired.name &&
    prior.version === desired.version &&
    prior.runnerProtocol === desired.runnerProtocol &&
    prior.destination === desired.destination &&
    prior.sha256 === desired.sha256
  );
}
function byDepthAscending(left: string, right: string): number {
  return left.split(path.sep).length - right.split(path.sep).length;
}
function byDepthDescending(left: string, right: string): number {
  return byDepthAscending(right, left);
}
function catalogError(message: string): RunnerError {
  return new RunnerError(
    "ASSET_CATALOG_INVALID",
    `${message} No files changed.`,
    "Reinstall soft-factory-runner from a trusted package source and retry.",
    { details: { noChanges: true } },
  );
}
function localModifiedError(destination: string): RunnerError {
  return new RunnerError(
    "ASSET_LOCAL_MODIFIED",
    `Refusing to change ${destination} without exact ownership digest proof. No files changed.`,
    "Restore the recorded official bytes, move the local file, or remove the unowned destination and retry.",
    { details: { destination, noChanges: true } },
  );
}
function pathError(relative: string, kind: AssetPathKind): RunnerError {
  return new RunnerError(
    "ASSET_PATH_INVALID",
    `Official asset path ${relative} is unsafe or collides with ${kind} content. No files changed.`,
    "Remove path indirection or collisions beneath .github or .agents, then retry.",
    { details: { path: relative, kind, noChanges: true } },
  );
}
function fileError(
  operation: string,
  filePath: string,
  cause: unknown,
): RunnerError {
  return new RunnerError(
    "ASSET_FILESYSTEM_FAILED",
    `Could not ${operation} ${filePath}; exact pre-invocation contents were restored.`,
    "Inspect filesystem permissions and available space, then retry.",
    { details: { operation, path: filePath }, cause },
  );
}
