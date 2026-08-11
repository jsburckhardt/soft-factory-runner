# `harness boot` — agent briefing

## What this verb computes (the deterministic part)

`harness boot` delegates to `just boot`, which builds and starts the current short-lived CLI from a known state. It requires the exact bootstrap signal, then composes full `harness checks --json`. The envelope contains application command/output/exit evidence and the complete checks verdict; overall `ok` requires both stages.

## Your role (the inference part)

Parse the JSON envelope and confirm `application.signalObserved`, both stage exit codes, and `checks.status`. Treat boot as orientation and readiness proof for the current CLI, not evidence of a persistent service.

## Watch out for

- The application intentionally exits after printing its bootstrap line; there is no health endpoint.
- `BOOT_APPLICATION_FAILED`, `BOOT_APPLICATION_TIMEOUT`, and `BOOT_APPLICATION_SIGNAL_MISSING` identify startup-contract failures.
- `BOOT_CHECKS_INVALID_ENVELOPE`, `BOOT_CHECKS_FAILED`, and `BOOT_CHECKS_TIMEOUT` identify composed-check failures.
- Any non-`ok` result requires following `next_action`; partial startup must not be presented as readiness.
