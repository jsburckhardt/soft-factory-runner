import { DOCTOR_PROTOCOL_VERSION } from "./doctor";

export const OFFICIAL_ASSET_VERSION = "0.1.0" as const;
export const OFFICIAL_MANIFEST_PATH = ".agents/manifest.json" as const;

export type OfficialAssetType = "agent" | "skill";
export interface OfficialAssetIdentity {
  readonly type: OfficialAssetType;
  readonly name: string;
}
export interface OfficialAssetCatalogEntry extends OfficialAssetIdentity {
  readonly source: string;
  readonly destination: string;
  readonly version: string;
  readonly runnerProtocol: number;
  readonly sha256: string;
}

export const OFFICIAL_ASSET_CATALOG: readonly OfficialAssetCatalogEntry[] =
  Object.freeze([
    Object.freeze({
      type: "agent" as const,
      name: "soft-factory",
      source: "assets/official/soft-factory.agent.md",
      destination: ".agents/agents/soft-factory.agent.md",
      version: OFFICIAL_ASSET_VERSION,
      runnerProtocol: DOCTOR_PROTOCOL_VERSION,
      sha256:
        "a762d956df4e343710e37d0bc410f2aceb4a6651f7b8128da49db4ec1fdc5474",
    }),
    Object.freeze({
      type: "agent" as const,
      name: "soft-factory-assessor",
      source: "assets/official/soft-factory-assessor.agent.md",
      destination: ".agents/agents/soft-factory-assessor.agent.md",
      version: OFFICIAL_ASSET_VERSION,
      runnerProtocol: DOCTOR_PROTOCOL_VERSION,
      sha256:
        "318e3ae2a0bf16b5842e2a60297d87b4a698754c1a3959c2ee46753c40625ed7",
    }),
    Object.freeze({
      type: "skill" as const,
      name: "soft-factory",
      source: "assets/official/soft-factory/SKILL.md",
      destination: ".agents/skills/soft-factory/SKILL.md",
      version: OFFICIAL_ASSET_VERSION,
      runnerProtocol: DOCTOR_PROTOCOL_VERSION,
      sha256:
        "a8dd2c1db607b3ad47947674fa72940a07febf55ac72f8f0b57a18297c4eebef",
    }),
  ]);

export function officialAssetKey(identity: OfficialAssetIdentity): string {
  return `${identity.type}:${identity.name}`;
}

export function findOfficialAsset(
  identity: OfficialAssetIdentity,
  catalog: readonly OfficialAssetCatalogEntry[] = OFFICIAL_ASSET_CATALOG,
): OfficialAssetCatalogEntry | undefined {
  const key = officialAssetKey(identity);
  return catalog.find((entry) => officialAssetKey(entry) === key);
}
