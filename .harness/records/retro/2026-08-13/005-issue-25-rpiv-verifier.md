---
record_kind: "retro"
harness_version: "0.13.0"
branch: "fix/25-reproducible-clean-install-ci"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-13T03:43:47.564Z"
agent: "rpiv-verifier"
plan_id: "25-make-clean-installs-and-delivery-verification-reproducible"
schema_version: "1.2"
retro_id: "2026-08-13T03:40:29Z-rpiv-verifier-7652351de6ae"
started_at: "2026-08-13T03:40:29.034Z"
ended_at: "2026-08-13T03:44:19.359Z"
summary: "Verification passed after two concrete tool-use retries: correcting static parser assumptions and selecting the available file-editing runtime."
entries:
  - id: DL-001
    kind: difficulty
    description: "Verifier static probes initially misread YAML empty trigger mappings as absent and stripped URL text while parsing JSONC; corrected the probes to test key presence and use an existing JSON5 parser."
    target: tooling
    severity: annoying
    workaround: "Tested YAML trigger key presence rather than value truthiness and parsed devcontainer.json with the already installed JSON5 parser."
    suggested_encoding: "Provide a repository-owned static validation command for workflow and devcontainer lock assertions."
    fp: "7652351de6ae"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-13T03:40:29.034Z"
  - id: DL-002
    kind: difficulty
    description: "Verifier retro persistence first attempted the unavailable python executable; switched to the repository's available Node.js runtime without changing the scaffold contract."
    target: tooling
    severity: annoying
    workaround: "Used Node.js fs.writeFileSync to fill the generated retro scaffold."
    suggested_encoding: "Expose a first-party harness command for filling a retro scaffold from pending observations."
    fp: "c6b995622457"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-13T03:44:12.384Z"
---

# Retro — Issue 25 RPIV verifier

The structured entries preserve both concrete verifier retries and their successful workarounds.
