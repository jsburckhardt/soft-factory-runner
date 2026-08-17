import { DOCTOR_PROTOCOL_VERSION } from "./doctor";

export const OFFICIAL_ASSET_VERSION = "0.2.0" as const;
export const OFFICIAL_MANIFEST_PATH = ".agents/manifest.json" as const;
export const CURRENT_AGENT_DESTINATION =
  ".github/agents/soft-factory.agent.md" as const;

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
export interface OfficialAssetOwnershipDescriptor extends OfficialAssetIdentity {
  readonly destination: string;
  readonly rank: number;
  readonly current: boolean;
  readonly legacyAncestors: readonly string[];
}

export const OFFICIAL_ASSET_CATALOG: readonly OfficialAssetCatalogEntry[] =
  Object.freeze([
    Object.freeze({
      type: "agent" as const,
      name: "soft-factory",
      source: "assets/official/soft-factory.agent.md",
      destination: CURRENT_AGENT_DESTINATION,
      version: OFFICIAL_ASSET_VERSION,
      runnerProtocol: DOCTOR_PROTOCOL_VERSION,
      sha256:
        "a77899dbd3d4d3e3d89a637b736f80690334363908b6d593d9742579924c8cad",
    }),
  ]);

export const OFFICIAL_ASSET_OWNERSHIP_CATALOG: readonly OfficialAssetOwnershipDescriptor[] =
  Object.freeze([
    Object.freeze({
      type: "agent" as const,
      name: "soft-factory",
      destination: ".agents/agents/soft-factory.agent.md",
      rank: 0,
      current: false,
      legacyAncestors: Object.freeze([".agents/agents"]),
    }),
    Object.freeze({
      type: "agent" as const,
      name: "soft-factory",
      destination: CURRENT_AGENT_DESTINATION,
      rank: 1,
      current: true,
      legacyAncestors: Object.freeze([]),
    }),
    Object.freeze({
      type: "agent" as const,
      name: "soft-factory-assessor",
      destination: ".agents/agents/soft-factory-assessor.agent.md",
      rank: 2,
      current: false,
      legacyAncestors: Object.freeze([".agents/agents"]),
    }),
    Object.freeze({
      type: "skill" as const,
      name: "soft-factory",
      destination: ".agents/skills/soft-factory/SKILL.md",
      rank: 3,
      current: false,
      legacyAncestors: Object.freeze([
        ".agents/skills/soft-factory",
        ".agents/skills",
      ]),
    }),
  ]);

export function officialAssetKey(identity: OfficialAssetIdentity): string {
  return `${identity.type}:${identity.name}`;
}

export function ownershipKey(
  identity: Pick<
    OfficialAssetOwnershipDescriptor,
    "type" | "name" | "destination"
  >,
): string {
  return `${officialAssetKey(identity)}@${identity.destination}`;
}

export function findOfficialAsset(
  identity: OfficialAssetIdentity,
  catalog: readonly OfficialAssetCatalogEntry[] = OFFICIAL_ASSET_CATALOG,
): OfficialAssetCatalogEntry | undefined {
  const key = officialAssetKey(identity);
  return catalog.find((entry) => officialAssetKey(entry) === key);
}
