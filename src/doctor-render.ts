import type { DoctorResultV2 } from "./doctor";

export function renderDoctor(result: DoctorResultV2, json: boolean): string {
  if (json) return JSON.stringify(result, null, 2) + "\n";
  const lines = [
    "SOFT FACTORY REPOSITORY DOCTOR (schema 2)",
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
      if (check.evidence !== undefined)
        lines.push("  EVIDENCE: " + JSON.stringify(check.evidence));
    }
  }
  lines.push(result.ready ? "STATUS: READY" : "STATUS: NOT READY");
  return lines.join("\n") + "\n";
}
