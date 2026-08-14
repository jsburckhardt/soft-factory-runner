import { DOCTOR_PROTOCOL_VERSION } from "./doctor";
import { RunnerError } from "./errors";
import {
  OFFICIAL_ASSET_OWNERSHIP_CATALOG,
  officialAssetKey,
  ownershipKey,
  type OfficialAssetOwnershipDescriptor,
  type OfficialAssetType,
} from "./official-assets";

export interface AssetManifestEntryV1 {
  readonly type: OfficialAssetType;
  readonly name: string;
  readonly version: string;
  readonly runnerProtocol: number;
  readonly destination: string;
  readonly sha256: string;
}
export interface AssetManifestV1 {
  readonly schemaVersion: 1;
  readonly assets: readonly AssetManifestEntryV1[];
}

const MANIFEST_KEYS = ["schemaVersion", "assets"] as const;
const ENTRY_KEYS = [
  "type",
  "name",
  "version",
  "runnerProtocol",
  "destination",
  "sha256",
] as const;

export function emptyAssetManifest(): AssetManifestV1 {
  return { schemaVersion: 1, assets: [] };
}

export function parseAssetManifest(
  text: string,
  vocabulary: readonly OfficialAssetOwnershipDescriptor[] = OFFICIAL_ASSET_OWNERSHIP_CATALOG,
): AssetManifestV1 {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (cause: unknown) {
    throw manifestError(
      "The official asset manifest is not valid JSON.",
      cause,
    );
  }
  if (!isRecord(value) || !hasExactKeys(value, MANIFEST_KEYS))
    throw manifestError(
      "The official asset manifest must contain only schemaVersion and assets.",
    );
  if (value.schemaVersion !== 1 || !Array.isArray(value.assets))
    throw manifestError(
      "The official asset manifest must use schemaVersion 1 and an assets array.",
    );

  const descriptors = new Map(
    vocabulary.map((entry) => [ownershipKey(entry), entry]),
  );
  const pairs = new Set<string>();
  const destinations = new Set<string>();
  const assets = value.assets.map((raw, index) => {
    if (!isRecord(raw) || !hasExactKeys(raw, ENTRY_KEYS))
      throw manifestError(
        `Manifest asset ${index} has unsupported or missing fields.`,
      );
    if (
      (raw.type !== "agent" && raw.type !== "skill") ||
      typeof raw.name !== "string" ||
      raw.name.length === 0 ||
      typeof raw.version !== "string" ||
      raw.version.length === 0 ||
      raw.runnerProtocol !== DOCTOR_PROTOCOL_VERSION ||
      typeof raw.destination !== "string" ||
      typeof raw.sha256 !== "string" ||
      !/^[0-9a-f]{64}$/.test(raw.sha256)
    )
      throw manifestError(`Manifest asset ${index} contains invalid metadata.`);
    const entry: AssetManifestEntryV1 = {
      type: raw.type,
      name: raw.name,
      version: raw.version,
      runnerProtocol: raw.runnerProtocol,
      destination: raw.destination,
      sha256: raw.sha256,
    };
    const pair = ownershipKey(entry);
    if (!descriptors.has(pair))
      throw manifestError(
        `Manifest asset ${index} is outside the closed ownership vocabulary.`,
      );
    if (pairs.has(pair) || destinations.has(entry.destination))
      throw manifestError(
        `Manifest asset ${index} duplicates an ownership pair or destination.`,
      );
    pairs.add(pair);
    destinations.add(entry.destination);
    return entry;
  });

  const identities = new Map<string, AssetManifestEntryV1[]>();
  for (const entry of assets) {
    const key = officialAssetKey(entry);
    identities.set(key, [...(identities.get(key) ?? []), entry]);
  }
  for (const [identity, entries] of identities) {
    if (entries.length <= 1) continue;
    const destinationsForIdentity = new Set(
      entries.map((entry) => entry.destination),
    );
    const validBridge =
      identity === "agent:soft-factory" &&
      entries.length === 2 &&
      destinationsForIdentity.has(".agents/agents/soft-factory.agent.md") &&
      destinationsForIdentity.has(".github/agents/soft-factory.agent.md");
    if (!validBridge)
      throw manifestError(
        `Manifest identity ${identity} is duplicated or contradictory.`,
      );
  }

  const rank = (entry: AssetManifestEntryV1): number =>
    descriptors.get(ownershipKey(entry))?.rank ?? -1;
  if (
    assets.some(
      (entry, index) => index > 0 && rank(assets[index - 1]) >= rank(entry),
    )
  )
    throw manifestError("Manifest assets are not in stable migration order.");
  return { schemaVersion: 1, assets };
}

export function serializeAssetManifest(manifest: AssetManifestV1): string {
  return JSON.stringify(manifest, null, 2) + "\n";
}

function manifestError(message: string, cause?: unknown): RunnerError {
  return new RunnerError(
    "ASSET_MANIFEST_INVALID",
    `${message} No files changed.`,
    "Repair or restore .agents/manifest.json, then retry the complete installation.",
    { details: { path: ".agents/manifest.json", noChanges: true }, cause },
  );
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const keys = Object.keys(value).sort();
  return (
    keys.length === expected.length &&
    [...expected].sort().every((key, index) => key === keys[index])
  );
}
