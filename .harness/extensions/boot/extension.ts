import { defineExtension } from "@ai-substrate/engineering-harness/contract";

const OUTPUT_LIMIT = 12_000;
const TIMEOUT_MS = 300_000;
const BOOTSTRAP_SIGNAL =
  "Soft Factory Runner is bootstrapped. Product commands will be delivered through RPIV.";

function bounded(value: string): string {
  return value.length <= OUTPUT_LIMIT
    ? value
    : `${value.slice(0, OUTPUT_LIMIT)}\n[output truncated at ${OUTPUT_LIMIT} characters]`;
}

export default defineExtension({
  name: "boot",
  summary: "Build and start the short-lived CLI, then compose full harness checks.",
  verbs: {
    boot: {
      summary: "Start the application from a built state and compose full validation.",
      description:
        "Delegates known-state startup to just boot, verifies the exact CLI bootstrap signal, then invokes harness checks --json in full mode. Overall status is ok only when both stages pass.",
      async run(ctx) {
        const application = await ctx.exec("just", ["boot"], { timeoutMs: TIMEOUT_MS });
        const applicationStage = {
          command: "just boot",
          exitCode: application.code,
          expectedSignal: BOOTSTRAP_SIGNAL,
          signalObserved: application.stdout.includes(BOOTSTRAP_SIGNAL),
          stdout: bounded(application.stdout),
          stderr: bounded(application.stderr),
          timeoutMs: TIMEOUT_MS,
        };

        if (!application.ok) {
          return ctx.error(
            application.code === 124 ? "BOOT_APPLICATION_TIMEOUT" : "BOOT_APPLICATION_FAILED",
            "The application did not start successfully from the root boot recipe.",
            {
              details: { application: applicationStage },
              next_action: "Review the application-stage output, fix just boot, then rerun harness boot --json.",
            },
          );
        }
        if (!applicationStage.signalObserved) {
          return ctx.error("BOOT_APPLICATION_SIGNAL_MISSING", "The application exited without its expected bootstrap signal.", {
            details: { application: applicationStage },
            next_action: "Restore or intentionally update the CLI bootstrap contract and its test before rerunning harness boot --json.",
          });
        }

        const checks = await ctx.exec("harness", ["checks", "--json"], { timeoutMs: TIMEOUT_MS });
        let checksEnvelope: unknown = null;
        try {
          checksEnvelope = JSON.parse(checks.stdout.trim());
        } catch {
          return ctx.error("BOOT_CHECKS_INVALID_ENVELOPE", "Full checks did not return a valid JSON envelope.", {
            details: {
              application: applicationStage,
              checks: {
                command: "harness checks --json",
                exitCode: checks.code,
                stdout: bounded(checks.stdout),
                stderr: bounded(checks.stderr),
              },
            },
            next_action: "Run harness checks --json directly, repair its structured output, then rerun harness boot --json.",
          });
        }

        const checkStatus =
          typeof checksEnvelope === "object" && checksEnvelope !== null && "status" in checksEnvelope
            ? (checksEnvelope as { status: unknown }).status
            : undefined;
        const checksStage = {
          command: "harness checks --json",
          exitCode: checks.code,
          status: checkStatus,
          envelope: checksEnvelope,
          stderr: bounded(checks.stderr),
          timeoutMs: TIMEOUT_MS,
        };
        if (!checks.ok || checkStatus !== "ok") {
          return ctx.error(
            checks.code === 124 ? "BOOT_CHECKS_TIMEOUT" : "BOOT_CHECKS_FAILED",
            "The composed full validation stage did not complete successfully.",
            {
              details: { application: applicationStage, checks: checksStage },
              next_action: "Review harness checks --json, fix the full validation failure, then rerun harness boot --json.",
            },
          );
        }

        return ctx.ok({
          knownState: "built short-lived CLI",
          application: applicationStage,
          checks: checksStage,
          outputLimit: OUTPUT_LIMIT,
        });
      },
    },
  },
});
