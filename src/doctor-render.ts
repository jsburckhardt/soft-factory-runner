import type { DoctorResultV1 } from "./doctor";

export function renderDoctor(result: DoctorResultV1, json: boolean): string {
  if (json) return JSON.stringify(result, null, 2) + "\n";
  const lines = [
    "SOFT FACTORY REPOSITORY DOCTOR (schema 1)",
    "REPOSITORY github=" + (result.repository.github ?? "null"),
    "REPOSITORY defaultBranch=" + (result.repository.defaultBranch ?? "null"),
  ];
  for (const check of result.checks) {
    lines.push(
      "CHECK id=" +
        check.id +
        " status=" +
        check.status +
        " blocking=" +
        String(check.blocking),
    );
    if (check.status === "failed") {
      lines.push("  MESSAGE: " + check.message);
      lines.push("  REMEDIATION: " + check.remediation);
    }
  }
  lines.push(result.ready ? "STATUS: READY" : "STATUS: NOT READY");
  return lines.join("\n") + "\n";
}
