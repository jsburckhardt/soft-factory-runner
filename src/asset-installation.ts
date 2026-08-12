import { createHash } from "node:crypto";
import path from "node:path";
import {
  emptyAssetManifest,
  orderManifestEntries,
  parseAssetManifest,
  serializeAssetManifest,
  type AssetManifestEntryV1,
} from "./asset-manifest";
import { DOCTOR_PROTOCOL_VERSION } from "./doctor";
import { RunnerError, isRunnerError } from "./errors";
import {
  OFFICIAL_MANIFEST_PATH,
  findOfficialAsset,
  officialAssetKey,
  type OfficialAssetCatalogEntry,
  type OfficialAssetIdentity,
} from "./official-assets";

export type AssetPathKind =
  "missing" | "file" | "directory" | "symlink" | "other";
export interface AssetFileSystemPort {
  kind(filePath: string): Promise<AssetPathKind>;
  read(filePath: string): Promise<Buffer | null>;
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
export interface AssetInstallationResultV1 {
  readonly schemaVersion: 1;
  readonly code: "ASSETS_INSTALLED" | "ASSETS_UP_TO_DATE";
  readonly changed: boolean;
  readonly manifest: typeof OFFICIAL_MANIFEST_PATH;
  readonly assets: readonly AssetInstallationOutcomeV1[];
}
export interface AssetInstaller {
  install(
    repositoryRoot: string,
    selected: readonly OfficialAssetIdentity[],
  ): Promise<AssetInstallationResultV1>;
}

interface PlannedChange {
  readonly path: string;
  readonly previous: Buffer | null;
  readonly desired: Buffer;
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
    const selected = this.select(selectedIdentities);
    const desiredBytes = new Map<string, Buffer>();
    for (const entry of selected) {
      this.validateCatalogEntry(entry);
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
      desiredBytes.set(officialAssetKey(entry), bytes);
    }

    const manifestPath = this.absolute(root, OFFICIAL_MANIFEST_PATH);
    await this.validatePathLayout(root, [
      OFFICIAL_MANIFEST_PATH,
      ...selected.map((entry) => entry.destination),
    ]);
    const manifestKind = await this.safeKind(manifestPath);
    if (manifestKind !== "missing" && manifestKind !== "file")
      throw pathError(OFFICIAL_MANIFEST_PATH, manifestKind);
    const previousManifestBytes = await this.safeRead(manifestPath);
    const previousManifest =
      previousManifestBytes === null
        ? emptyAssetManifest()
        : parseAssetManifest(
            previousManifestBytes.toString("utf8"),
            this.catalog,
          );
    const previousByKey = new Map(
      previousManifest.assets.map((entry) => [officialAssetKey(entry), entry]),
    );
    const outcomes: AssetInstallationOutcomeV1[] = [];
    const targetChanges: PlannedChange[] = [];

    for (const entry of selected) {
      const targetPath = this.absolute(root, entry.destination);
      const targetKind = await this.safeKind(targetPath);
      if (targetKind !== "missing" && targetKind !== "file")
        throw pathError(entry.destination, targetKind);
      const current = await this.safeRead(targetPath);
      const desired = desiredBytes.get(officialAssetKey(entry));
      if (desired === undefined)
        throw new RunnerError(
          "ASSET_CATALOG_INVALID",
          "The selected official catalog could not resolve desired bytes. No files changed.",
          "Reinstall soft-factory-runner and retry.",
          { details: { noChanges: true } },
        );
      const prior = previousByKey.get(officialAssetKey(entry));
      let status: AssetInstallationStatus;
      if (current === null) {
        status = "installed";
        targetChanges.push({ path: targetPath, previous: null, desired });
      } else if (current.equals(desired)) {
        status = manifestEntryEquals(prior, entry) ? "up-to-date" : "adopted";
      } else if (prior !== undefined && sha256(current) === prior.sha256) {
        status = "upgraded";
        targetChanges.push({ path: targetPath, previous: current, desired });
      } else {
        throw new RunnerError(
          "ASSET_LOCAL_MODIFIED",
          `Refusing to replace ${entry.destination} without exact prior manifest digest proof. No files changed.`,
          "Restore the recorded official bytes, move the local file, or remove the destination and retry.",
          { details: { destination: entry.destination, noChanges: true } },
        );
      }
      outcomes.push({
        type: entry.type,
        name: entry.name,
        version: entry.version,
        runnerProtocol: entry.runnerProtocol,
        destination: entry.destination,
        sha256: entry.sha256,
        status,
      });
    }

    const finalByKey = new Map(
      previousManifest.assets.map((entry) => [officialAssetKey(entry), entry]),
    );
    for (const outcome of outcomes) {
      finalByKey.set(officialAssetKey(outcome), {
        type: outcome.type,
        name: outcome.name,
        version: outcome.version,
        runnerProtocol: outcome.runnerProtocol,
        destination: outcome.destination,
        sha256: outcome.sha256,
      });
    }
    const finalManifest = {
      schemaVersion: 1 as const,
      assets: orderManifestEntries([...finalByKey.values()], this.catalog),
    };
    const desiredManifestBytes = Buffer.from(
      serializeAssetManifest(finalManifest),
      "utf8",
    );
    const changes = [...targetChanges];
    if (
      previousManifestBytes === null ||
      !previousManifestBytes.equals(desiredManifestBytes)
    )
      changes.push({
        path: manifestPath,
        previous: previousManifestBytes,
        desired: desiredManifestBytes,
      });
    if (changes.length > 0) await this.commit(root, changes);
    return {
      schemaVersion: 1,
      code: changes.length === 0 ? "ASSETS_UP_TO_DATE" : "ASSETS_INSTALLED",
      changed: changes.length > 0,
      manifest: OFFICIAL_MANIFEST_PATH,
      assets: outcomes,
    };
  }

  private select(
    identities: readonly OfficialAssetIdentity[],
  ): readonly OfficialAssetCatalogEntry[] {
    if (identities.length === 0)
      throw catalogError("At least one official asset must be selected.");
    const catalogKeys = this.catalog.map(officialAssetKey);
    if (new Set(catalogKeys).size !== catalogKeys.length)
      throw catalogError("The official catalog contains duplicate identities.");
    const requested = new Set(identities.map(officialAssetKey));
    if (requested.size !== identities.length)
      throw catalogError("The official asset selection contains duplicates.");
    const selected = this.catalog.filter((entry) =>
      requested.has(officialAssetKey(entry)),
    );
    if (selected.length !== identities.length) {
      const unknown = identities.find(
        (identity) => findOfficialAsset(identity, this.catalog) === undefined,
      );
      throw catalogError(
        `Unsupported official asset ${unknown === undefined ? "selection" : officialAssetKey(unknown)}.`,
      );
    }
    return selected;
  }

  private validateCatalogEntry(entry: OfficialAssetCatalogEntry): void {
    if (entry.runnerProtocol !== DOCTOR_PROTOCOL_VERSION)
      throw new RunnerError(
        "ASSET_PROTOCOL_INCOMPATIBLE",
        `Official asset ${officialAssetKey(entry)} requires Runner protocol ${entry.runnerProtocol}; this Runner supports protocol 1. No files changed.`,
        "Install a soft-factory-runner release compatible with the selected assets.",
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
    this.absolute(process.cwd(), entry.destination);
  }

  private async validatePathLayout(
    root: string,
    destinations: readonly string[],
  ): Promise<void> {
    const directories = new Set<string>();
    for (const destination of destinations) {
      const absolute = this.absolute(root, destination);
      let parent = path.dirname(absolute);
      while (parent !== root) {
        directories.add(parent);
        parent = path.dirname(parent);
      }
    }
    const ordered = [...directories].sort(
      (a, b) => a.split(path.sep).length - b.split(path.sep).length,
    );
    for (const directory of ordered) {
      const kind = await this.safeKind(directory);
      if (kind !== "missing" && kind !== "directory")
        throw pathError(path.relative(root, directory), kind);
    }
  }

  private absolute(root: string, relative: string): string {
    if (
      path.isAbsolute(relative) ||
      relative !== path.posix.normalize(relative) ||
      (!relative.startsWith(".agents/") && relative !== ".agents")
    )
      throw pathError(relative, "other");
    const absolute = path.resolve(root, relative);
    const agentsRoot = path.resolve(root, ".agents");
    if (absolute !== agentsRoot && !absolute.startsWith(agentsRoot + path.sep))
      throw pathError(relative, "other");
    return absolute;
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

  private async commit(
    root: string,
    changes: readonly PlannedChange[],
  ): Promise<void> {
    const missingDirectories = await this.missingDirectories(
      root,
      changes.map((change) => change.path),
    );
    const createdDirectories: string[] = [];
    const transactionRoot = path.join(
      root,
      ".agents",
      `.install-${this.nextTransactionId()}`,
    );
    const attempted: {
      readonly change: PlannedChange;
      readonly backup: string;
    }[] = [];
    let transactionCreated = false;
    try {
      for (const directory of missingDirectories) {
        await this.files.createDirectory(directory);
        createdDirectories.push(directory);
      }
      await this.files.createDirectory(transactionRoot);
      transactionCreated = true;
      const staged: {
        readonly change: PlannedChange;
        readonly stage: string;
        readonly backup: string;
      }[] = [];
      for (const [index, change] of changes.entries()) {
        const stage = path.join(transactionRoot, `stage-${index}`);
        const backup = path.join(transactionRoot, `backup-${index}`);
        await this.files.writeExclusive(stage, change.desired);
        if (change.previous !== null)
          await this.files.writeExclusive(backup, change.previous);
        staged.push({ change, stage, backup });
      }
      for (const item of staged) {
        attempted.push({ change: item.change, backup: item.backup });
        await this.files.rename(item.stage, item.change.path);
      }
      await this.files.removeTree(transactionRoot);
    } catch (cause: unknown) {
      const rollbackFailure = await this.rollback(
        attempted,
        transactionCreated ? transactionRoot : null,
        createdDirectories,
      );
      if (rollbackFailure !== null)
        throw new RunnerError(
          "ASSET_ROLLBACK_UNCERTAIN",
          "Official asset installation failed and exact rollback could not be proved.",
          "Inspect the listed .agents paths and restore them from version control before retrying.",
          {
            details: {
              paths: changes.map((change) => path.relative(root, change.path)),
            },
            cause: rollbackFailure,
          },
        );
      if (isRunnerError(cause)) throw cause;
      throw fileError("commit transaction", ".agents", cause);
    }
  }

  private async missingDirectories(
    root: string,
    targets: readonly string[],
  ): Promise<readonly string[]> {
    const candidates = new Set<string>();
    for (const target of targets) {
      let current = path.dirname(target);
      while (current !== root) {
        candidates.add(current);
        current = path.dirname(current);
      }
    }
    const ordered = [...candidates].sort(
      (a, b) => a.split(path.sep).length - b.split(path.sep).length,
    );
    const missing: string[] = [];
    for (const candidate of ordered) {
      if ((await this.safeKind(candidate)) === "missing")
        missing.push(candidate);
    }
    return missing;
  }

  private async rollback(
    attempted: readonly {
      readonly change: PlannedChange;
      readonly backup: string;
    }[],
    transactionRoot: string | null,
    createdDirectories: readonly string[],
  ): Promise<unknown | null> {
    let failure: unknown | null = null;
    for (const item of [...attempted].reverse()) {
      try {
        if (item.change.previous === null)
          await this.files.removeFile(item.change.path);
        else await this.files.rename(item.backup, item.change.path);
      } catch (cause: unknown) {
        failure ??= cause;
      }
    }
    if (transactionRoot !== null) {
      try {
        await this.files.removeTree(transactionRoot);
      } catch (cause: unknown) {
        failure ??= cause;
      }
    }
    for (const directory of [...createdDirectories].reverse()) {
      try {
        await this.files.removeDirectory(directory);
      } catch (cause: unknown) {
        failure ??= cause;
      }
    }
    return failure;
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
function catalogError(message: string): RunnerError {
  return new RunnerError(
    "ASSET_CATALOG_INVALID",
    `${message} No files changed.`,
    "Reinstall soft-factory-runner from a trusted package source and retry.",
    { details: { noChanges: true } },
  );
}
function pathError(relative: string, kind: AssetPathKind): RunnerError {
  return new RunnerError(
    "ASSET_PATH_INVALID",
    `Official asset path ${relative} is unsafe or collides with ${kind} content. No files changed.`,
    "Remove path indirection or collisions beneath .agents, then retry.",
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
    `Could not ${operation} official asset path ${filePath}.`,
    "Inspect filesystem permissions and available space, then retry.",
    { details: { operation, path: filePath }, cause },
  );
}
