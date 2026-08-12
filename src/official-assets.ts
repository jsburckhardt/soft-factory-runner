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
        "2a3e24f17f97152488c5e7cf894ac4edccb24cb03dea7d67f5066e22e26b27b8",
    }),
    Object.freeze({
      type: "agent" as const,
      name: "soft-factory-assessor",
      source: "assets/official/soft-factory-assessor.agent.md",
      destination: ".agents/agents/soft-factory-assessor.agent.md",
      version: OFFICIAL_ASSET_VERSION,
      runnerProtocol: DOCTOR_PROTOCOL_VERSION,
      sha256:
        "6a0a62f84af8389ba419099b51d8e2858be3ae4ae46b038c37c14171637759bf",
    }),
    Object.freeze({
      type: "skill" as const,
      name: "soft-factory",
      source: "assets/official/soft-factory/SKILL.md",
      destination: ".agents/skills/soft-factory/SKILL.md",
      version: OFFICIAL_ASSET_VERSION,
      runnerProtocol: DOCTOR_PROTOCOL_VERSION,
      sha256:
        "fb10ec46a5249f79fe92c855a4396fefc579f7bf351f190c6d08aae74c7e928a",
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
