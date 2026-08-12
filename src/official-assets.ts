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
        "46b96e18bbf06178c8163d34bd0698ec82c80015af782c22ce6bc44527ced760",
    }),
    Object.freeze({
      type: "agent" as const,
      name: "soft-factory-assessor",
      source: "assets/official/soft-factory-assessor.agent.md",
      destination: ".agents/agents/soft-factory-assessor.agent.md",
      version: OFFICIAL_ASSET_VERSION,
      runnerProtocol: DOCTOR_PROTOCOL_VERSION,
      sha256:
        "40054f0959a92710cdaed42b8bb870867faae29d5e3c1acf6087349762b7ed3d",
    }),
    Object.freeze({
      type: "skill" as const,
      name: "soft-factory",
      source: "assets/official/soft-factory/SKILL.md",
      destination: ".agents/skills/soft-factory/SKILL.md",
      version: OFFICIAL_ASSET_VERSION,
      runnerProtocol: DOCTOR_PROTOCOL_VERSION,
      sha256:
        "07d0c15bb765281f7d47cb0d8e1784b70cb5d2ec06f3943880420f8c579d3b6f",
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
