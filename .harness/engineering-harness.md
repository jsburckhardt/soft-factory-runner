# Engineering harness

> **AGENTS START HERE → `harness instructions`** — read the core briefing, then `harness instructions <verb>` for the operation you will run. Automation evaluates JSON envelopes and exit codes.

## Boot command

`harness boot --json` delegates known-state build and startup to `just boot`, verifies the short-lived CLI bootstrap signal, and then composes full `harness checks --json`.

## Checks command

`harness checks --focused --json` delegates implementation feedback to `just verify-focused`. `harness checks --json` is the default full gate and delegates to `just verify`. Direct root recipes remain mandatory at RPIV stage boundaries.

## Health check

For this short-lived CLI, health is exit code 0 plus the exact bootstrap signal `Soft Factory Runner is bootstrapped. Product commands will be delivered through RPIV.` There is no persistent service or endpoint.

## Interact method

Run the CLI through the root `just run` recipe. The bootstrap currently accepts no product input and exits after one line.

## Observe method

Use `--json` harness output. Inspect `status`, `data`, per-stage exit codes, bounded stdout/stderr, `error.code`, and `next_action`; do not scrape terminal prose. Runtime evidence is intentionally returned to the caller rather than committed.

## Deterministic signal inventory

- `harness doctor --json`: runtime, extension, convention, and verb readiness.
- `harness boot --json`: built application startup, exact smoke signal, and composed full-check verdict.
- `harness checks --focused --json`: focused tests and diff hygiene through the root recipe.
- `harness checks --json`: lint, formatting, types, tests/coverage, build, and diff hygiene through the root recipe.
- `just verify-focused` and `just verify`: authoritative direct RPIV boundary gates.

## Evidence paths

- Command evidence: JSON on stdout for the invoking session or CI log.
- Governance and briefings: `.harness/engineering-harness.md` and `.harness/extensions/*/instructions.md`.
- RPIV evidence: `project/work-items/<issue-number>-<short-description>/implementation/00-implementation.md`.
- `.harness/temp/`, reports, records, and telemetry are transient and ignored unless a future plan explicitly adopts an artifact.

## Injection map

| Seam event | Fires from | What fires it |
|---|---|---|
| session-start / pre-flight | `AGENTS.md` cold-session instructions | Read `harness instructions` and this governance contract. |
| pre-implement / pre-flight | `AGENTS.md` and RPIV Implement | Run `harness boot --json` before product work. |
| task-pause / coding | RPIV Implement task loop | Run `harness checks --focused --json`, then direct `just verify-focused` as required. |
| phase-end / post-coding | RPIV Implement handoff preparation | Run full `harness checks --json`, then direct `just verify`. |
| plan-complete / post-flight | RPIV Verify | Independently evaluate the exact commit and direct root validation; Verify owns acceptance. |

## Back-pressure gaps

- The product is only a bootstrap CLI: interaction has no feature input and observation has no persistent runtime, endpoint, trace, or screenshot.
- No harness sensors, dependency/security audit, schema validation, or long-running recovery smoke path exists yet.
- Harness output is bounded; full diagnostics may require the named direct root recipe.
- Machine attribution/capture health can be degraded independently of repository readiness and must be reported, not hidden.

## Current maturity snapshot

**L1 — a tracked, repeatable boot/check nucleus is operational.** Boot, smoke output, focused/full checks, governance, and cold-agent cues are deterministic; richer product interaction, observation, and sensors remain future improvements.
