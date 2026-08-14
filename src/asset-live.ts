/* istanbul ignore file -- live filesystem paths are exercised by built CLI integration tests */
import { randomUUID } from "node:crypto";
import * as fs from "node:fs/promises";
import path from "node:path";
import {
  AssetInstallationService,
  type AssetFileSystemPort,
  type AssetInstaller,
  type AssetPathKind,
  type OfficialAssetSourcePort,
} from "./asset-installation";
import { OFFICIAL_ASSET_CATALOG } from "./official-assets";

export class NodeAssetFileSystem implements AssetFileSystemPort {
  public async kind(filePath: string): Promise<AssetPathKind> {
    try {
      const stat = await fs.lstat(filePath);
      if (stat.isSymbolicLink()) return "symlink";
      if (stat.isFile()) return "file";
      if (stat.isDirectory()) return "directory";
      return "other";
    } catch (cause: unknown) {
      if (nodeCode(cause) === "ENOENT") return "missing";
      throw cause;
    }
  }
  public async read(filePath: string): Promise<Buffer | null> {
    try {
      return await fs.readFile(filePath);
    } catch (cause: unknown) {
      if (nodeCode(cause) === "ENOENT") return null;
      throw cause;
    }
  }
  public async listDirectory(
    directoryPath: string,
  ): Promise<readonly string[]> {
    return fs.readdir(directoryPath);
  }
  public async createDirectory(directoryPath: string): Promise<void> {
    await fs.mkdir(directoryPath);
  }
  public async writeExclusive(filePath: string, bytes: Buffer): Promise<void> {
    await fs.writeFile(filePath, bytes, { flag: "wx", mode: 0o600 });
  }
  public async rename(from: string, to: string): Promise<void> {
    await fs.rename(from, to);
  }
  public async removeFile(filePath: string): Promise<void> {
    await fs.rm(filePath, { force: true });
  }
  public async removeDirectory(directoryPath: string): Promise<void> {
    await fs.rmdir(directoryPath);
  }
  public async removeTree(directoryPath: string): Promise<void> {
    await fs.rm(directoryPath, { recursive: true, force: true });
  }
}

export class PackageOfficialAssetSource implements OfficialAssetSourcePort {
  public async read(source: string): Promise<Buffer> {
    return fs.readFile(path.resolve(__dirname, "..", source));
  }
}

export function createLiveAssetInstaller(): AssetInstaller {
  return new AssetInstallationService(
    OFFICIAL_ASSET_CATALOG,
    new PackageOfficialAssetSource(),
    new NodeAssetFileSystem(),
    randomUUID,
  );
}

function nodeCode(cause: unknown): string | undefined {
  return typeof cause === "object" && cause !== null && "code" in cause
    ? String((cause as { code?: unknown }).code)
    : undefined;
}
