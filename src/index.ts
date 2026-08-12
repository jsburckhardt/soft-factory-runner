#!/usr/bin/env node

import { HELP_TEXT, parseCommand } from "./command";
import type { AssetInstaller } from "./asset-installation";
import { createLiveAssetInstaller } from "./asset-live";
import { renderAssetInstallation } from "./asset-render";
import { errorExitCode, isRunnerError } from "./errors";
import { renderDoctor } from "./doctor-render";
import { createLiveDoctorService, type DoctorRunner } from "./doctor-service";
import { createLivePorts } from "./live";
import { IssueRunService } from "./orchestrator";
import type { RunnerPorts } from "./ports";
import {
  renderAttach,
  renderControl,
  renderError,
  renderReport,
  renderRun,
  renderStatus,
} from "./render";

export const projectName = "Soft Factory Runner";
export const bootstrapMessage = `${projectName} is bootstrapped. Product commands will be delivered through RPIV.\n`;

export function workerStartupMarker(issueNumber: number): string {
  return `Soft Factory RPIV worker issue-${issueNumber} starting.\n`;
}

export interface CliResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

export async function runCli(
  args: readonly string[],
  startPath: string,
  ports: RunnerPorts,
  doctorRunner?: DoctorRunner,
  assetInstaller?: AssetInstaller,
): Promise<CliResult> {
  const jsonRequested = args.includes("--json");
  try {
    const command = parseCommand(args);
    if (command.kind === "bootstrap")
      return { exitCode: 0, stdout: bootstrapMessage, stderr: "" };
    if (command.kind === "help")
      return { exitCode: 0, stdout: HELP_TEXT, stderr: "" };
    if (command.kind === "install") {
      const result = await (
        assetInstaller ?? createLiveAssetInstaller()
      ).install(startPath, command.assets);
      return {
        exitCode: 0,
        stdout: renderAssetInstallation(result),
        stderr: "",
      };
    }
    if (command.kind === "doctor") {
      const result = await (doctorRunner ?? createLiveDoctorService()).run(
        startPath,
      );
      return {
        exitCode: result.ready ? 0 : 3,
        stdout: renderDoctor(result, command.json),
        stderr: "",
      };
    }
    const service = new IssueRunService(ports);
    if (command.kind === "run")
      return {
        exitCode: 0,
        stdout: renderRun(
          await service.run(command.issueNumber, startPath),
          command.json,
        ),
        stderr: "",
      };
    if (command.kind === "status")
      return {
        exitCode: 0,
        stdout: renderStatus(
          await service.status(command.issueNumber, startPath),
          command.json,
        ),
        stderr: "",
      };
    if (command.kind === "reconcile") {
      const report = await service.reconcile(command.issueNumber, startPath);
      const exitCode = report.activity === "blocked" ? 4 : 0;
      return {
        exitCode,
        stdout: renderReport(report, command.json),
        stderr: "",
      };
    }
    if (command.kind === "list") {
      const result = await service.list(startPath);
      return {
        exitCode: result.exitCode,
        stdout: renderControl(result, command.json),
        stderr: "",
      };
    }
    if (
      command.kind === "resume" ||
      command.kind === "stop" ||
      command.kind === "clean" ||
      command.kind === "logs"
    ) {
      const result = await service[command.kind](
        command.issueNumber,
        startPath,
      );
      return {
        exitCode: result.exitCode,
        stdout: renderControl(result, command.json),
        stderr: "",
      };
    }
    if (command.kind === "attach")
      return {
        exitCode: 0,
        stdout: renderAttach(
          await service.attach(command.issueNumber, startPath),
        ),
        stderr: "",
      };
    const snapshot = await service.runWorker(command.issueNumber, startPath);
    return {
      exitCode: snapshot.state === "completed" ? 0 : 3,
      stdout: `RPIV worker ${command.issueNumber} exited: ${snapshot.state}.\n`,
      stderr: "",
    };
  } catch (cause: unknown) {
    if (!isRunnerError(cause)) throw cause;
    return {
      exitCode: errorExitCode(cause),
      stdout: "",
      stderr: renderError(cause, jsonRequested),
    };
  }
}

export async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (
    args.length === 4 &&
    args[0] === "internal" &&
    args[1] === "run-agent" &&
    args[2] === "--issue" &&
    /^[1-9]\d*$/.test(args[3])
  ) {
    process.stdout.write(workerStartupMarker(Number(args[3])));
  }
  const result = await runCli(args, process.cwd(), createLivePorts());
  if (result.stdout !== "") process.stdout.write(result.stdout);
  if (result.stderr !== "") process.stderr.write(result.stderr);
  process.exitCode = result.exitCode;
}

/* istanbul ignore next -- executable process boundary is covered by harness boot */
if (require.main === module) {
  void main().catch((cause: unknown) => {
    const message =
      cause instanceof Error ? cause.message : "Unknown internal failure";
    process.stderr.write(`INTERNAL_ERROR: ${message}\n`);
    process.exitCode = 1;
  });
}
