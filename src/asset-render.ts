import type { AssetInstallationResultV1 } from "./asset-installation";

export function renderAssetInstallation(
  result: AssetInstallationResultV1,
): string {
  const lines = [
    `Installation: ${result.code}`,
    `Changed: ${result.changed ? "yes" : "no"}`,
    `Manifest: ${result.manifest}`,
  ];
  for (const asset of result.assets) {
    lines.push(
      `${asset.type} ${asset.name}: ${asset.status}; destination=${asset.destination}; version=${asset.version}; runnerProtocol=${asset.runnerProtocol}; sha256=${asset.sha256}`,
    );
  }
  for (const retirement of result.retirements) {
    lines.push(
      `${retirement.type} ${retirement.name}: ${retirement.status}; destination=${retirement.destination}`,
    );
  }
  return lines.join("\n") + "\n";
}
