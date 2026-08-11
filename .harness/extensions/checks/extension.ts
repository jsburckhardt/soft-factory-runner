import { defineExtension } from "@ai-substrate/engineering-harness/contract";

const OUTPUT_LIMIT = 12_000;
const TIMEOUT_MS = 300_000;

function bounded(value: string): string {
  return value.length <= OUTPUT_LIMIT
    ? value
    : `${value.slice(0, OUTPUT_LIMIT)}\n[output truncated at ${OUTPUT_LIMIT} characters]`;
}

export default defineExtension({
  name: "checks",
  summary: "Run focused or full repository validation through root just recipes.",
  verbs: {
    checks: {
      summary: "Delegate validation to just verify, or just verify-focused with --focused.",
      description:
        "Runs full validation by default. Pass --focused for the implementation feedback gate. The JSON envelope reports scope, delegated command, bounded output, and exit metadata.",
      options: [
        {
          flags: "--focused",
          description: "Run the focused validation scope instead of full validation.",
          defaultValue: false,
        },
      ],
      async run(ctx) {
        const focused = ctx.options.focused === true;
        const recipe = focused ? "verify-focused" : "verify";
        const delegatedCommand = `just ${recipe}`;
        const result = await ctx.exec("just", [recipe], { timeoutMs: TIMEOUT_MS });
        const data = {
          scope: focused ? "focused" : "full",
          delegatedCommand,
          exitCode: result.code,
          stdout: bounded(result.stdout),
          stderr: bounded(result.stderr),
          outputLimit: OUTPUT_LIMIT,
          timeoutMs: TIMEOUT_MS,
        };

        if (!result.ok) {
          const code = result.code === 124 ? "CHECKS_TIMEOUT" : "CHECKS_FAILED";
          return ctx.error(code, `${delegatedCommand} did not complete successfully.`, {
            details: data,
            next_action: `Review the bounded output, fix the ${focused ? "focused" : "full"} validation failure, then rerun harness checks${focused ? " --focused" : ""} --json.`,
          });
        }

        return ctx.ok(data, {
          evidence: [{ label: `${focused ? "focused" : "full"} validation output`, none: true }],
        });
      },
    },
  },
});
