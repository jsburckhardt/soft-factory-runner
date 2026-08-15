---
record_kind: "retro"
harness_version: "0.13.0"
branch: "fix/31-portable-tmux-identity"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-15T02:12:44.545Z"
agent: "rpiv-research"
plan_id: "31-support-locale-compatible-tmux-identities-and-release-0-1-1-under-semver-governance"
schema_version: "1.2"
retro_id: "2026-08-15T02:12:44.545Z-rpiv-research-d973fc815be4"
started_at: "2026-08-15T00:26:34.219Z"
ended_at: "2026-08-15T02:13:45.572Z"
summary: "Persisted 4 concrete Issue #31 Research friction observations before implementation handoff; every entry is retained with disposition kept."
entries:
  - id: "DL-001"
    kind: "difficulty"
    description: "Research text searches had to be retried with grep because ripgrep is not installed in the repository environment."
    severity: "annoying"
    fp: "d973fc815be4"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-15T00:26:34.219Z"
  - id: "DL-002"
    kind: "difficulty"
    description: "The authoritative tmux source scan had to be retried with Node because the python command is unavailable in this environment."
    severity: "annoying"
    fp: "13d30ec17d6b"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-15T00:31:06.576Z"
  - id: "DL-003"
    kind: "difficulty"
    description: "The version inventory search had to be narrowed to tracked product paths because recursive grep entered Git working logs and hit a stale tmux socket."
    severity: "annoying"
    fp: "530bbe4e62c1"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-15T00:34:44.249Z"
  - id: "INS-001"
    kind: "insight"
    description: "Repository command environments omit locale and TMUX variables and tmux calls omit -u; tmux 3.7b source therefore explains the six-byte non-UTF8 Doctor shape by sanitizing HT to underscore."
    severity: "degrading"
    fp: "c45d850c42de"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-15T00:37:46.770Z"
---

# Retro — Issue #31 Research friction

Generated from the repository-shared pending observation buffer before implementation notes were written.
