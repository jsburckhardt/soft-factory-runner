# `harness checks` — agent briefing

## What this verb computes (the deterministic part)

Full mode is the default and delegates to `just verify`. `--focused` delegates only to `just verify-focused`. The JSON envelope records `scope`, `delegatedCommand`, exit code, a five-minute timeout, and stdout/stderr bounded to 12,000 characters.

## Your role (the inference part)

Read `status` and the process exit code first. On success, use the selected scope and delegated command as evidence that the intended gate ran. During implementation use focused mode for feedback; before handoff run full mode and the direct RPIV recipe required by the stage contract.

## Watch out for

- Full mode is not implied by `--focused`; check `data.scope` rather than assuming.
- Truncated output is marked and may require rerunning the direct root recipe for complete diagnostics.
- `CHECKS_FAILED` and `CHECKS_TIMEOUT` are non-success results; follow `next_action`.
- Harness checks wrap root recipes and do not replace direct `just verify-focused` or `just verify` at RPIV boundaries.
