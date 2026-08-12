---
record_kind: "retro"
harness_version: "0.13.0"
branch: "feat/19-rpiv-progress-and-instructions"
repo: "https://github.com/jsburckhardt/soft-factory-runner.git"
created_at: "2026-08-12T11:23:56.980Z"
agent: "rpiv-verifier"
plan_id: "19-define-rpiv-progress-final-result-ownership-and-integration-instructions"
schema_version: "1.2"
retro_id: "2026-08-12T11:23:56Z-rpiv-verifier-f1d38532"
started_at: "2026-08-12T08:57:12.835Z"
ended_at: "2026-08-12T11:23:56.980Z"
summary: "Repeated Verify passes exposed and returned stale-head publication ordering, missing acceptance matrices, incorrect progress display/authorization, unbound V4 launch persistence, missing-justfile acceptance, and legacy V3 AgentResult compatibility; the final pass confirmed all corrections, while the manually resumed checkout still lacked an injected Runner binding for terminal progress and immutable result publication."
entries:
  - id: DL-001
    kind: difficulty
    description: "Root just run rejected an extra separator and required retrying instructions without the additional -- token."
    target: tooling
    severity: annoying
    workaround: "Retried the root recipe without the extra separator."
    suggested_encoding: "Document argument forwarding examples for just run or normalize the optional separator."
    fp: "f9edc3bb604d"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T08:57:12.835Z"
  - id: DL-002
    kind: difficulty
    description: "Repository inspection needed a retry because ripgrep is unavailable; verifier had to fall back to tracked-file grep."
    target: tooling
    severity: annoying
    workaround: "Used tracked-file grep for repository inspection."
    suggested_encoding: "Expose one guaranteed repository search command or document grep as the available fallback."
    fp: "d6a791b78309"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T08:57:32.651Z"
  - id: INS-001
    kind: insight
    description: "Verifier inspection had to infer a stale-head completion defect across contracts: result publication precedes the later verification-summary commit and push, so the immutable result cannot identify final branch HEAD."
    target: project
    severity: degrading
    workaround: "Returned the ordering defect to Implement and verified summary/retro push plus PR-head confirmation now precede publication."
    suggested_encoding: "Keep the final-head publication order covered by canonical agent-contract assertions."
    fp: "a50733ba735b"
    disposition: kept
    system:
      compound:
        status: encoded
        source: agent-self
        first_seen_at: "2026-08-12T09:03:29.559Z"
  - id: DL-003
    kind: difficulty
    description: "Acceptance proof is missing for active/recovered final-validation changes, failed progress publication, helper ordering, and concurrent readers/writers; the claimed matrix is not present in the changed tests."
    target: project
    severity: degrading
    workaround: "Returned missing executable proof to Implement and verified the added orchestration, integration, and filesystem concurrency matrices."
    suggested_encoding: "Map every claimed integration boundary to a named positive and negative fixture before handoff."
    fp: "2436dee12f2c"
    disposition: kept
    system:
      compound:
        status: encoded
        source: agent-self
        first_seen_at: "2026-08-12T09:03:29.591Z"
  - id: DL-004
    kind: difficulty
    description: "A line-reference grep was blocked because backticks inside a double-quoted pattern were treated as command substitution; retry required a literal single-quoted pattern."
    target: tooling
    severity: annoying
    workaround: "Retried with a literal single-quoted grep pattern."
    suggested_encoding: "Provide a structured text-search verb that does not pass search patterns through shell interpolation."
    fp: "2487f06d0dde"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T09:04:46.973Z"
  - id: COORD-001
    kind: coordination
    description: "Closeout order conflicted: verifier contract requires draining and harvesting retros before PR creation, while final-cycle request placed that work after PR creation; followed the higher-priority verifier contract."
    target: plan
    workaround: "Applied the verifier contract order and preserved the harvest in PR and summary evidence."
    suggested_encoding: "Keep coordinator requests generated from the same ordered closeout contract as the verifier agent."
    fp: "b0085510535d"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T09:41:33.247Z"
  - id: INS-002
    kind: insight
    description: "Acceptance inspection found an uncovered accepted-progress-plus-missing-artifact case: classifyProgress reports the prior research phase instead of required unknown, contradicting AC-8, core-component expectations, and documentation."
    target: project
    workaround: "Returned the display defect to Implement and verified current-artifact-only phase reporting with cross-product tests."
    suggested_encoding: "Include accepted-history plus every unusable current-artifact class in status/list matrices."
    fp: "899e101f6eda"
    disposition: kept
    system:
      compound:
        status: encoded
        source: agent-self
        first_seen_at: "2026-08-12T09:43:28.872Z"
  - id: COORD-002
    kind: coordination
    description: "Manual resumed Verify checkout has no injected IntegrationLaunchV1 binding or Runner snapshot-final-validation surface, so strict AgentResultV1 publication/read-back cannot be bound after shipping."
    target: infra
    severity: blocking
    workaround: "Completed acceptance and shipping metadata without fabricating a binding; deferred immutable result publication to a genuinely bound Runner invocation."
    suggested_encoding: "Provide a supported resume token or helper reattachment surface that restores the immutable IntegrationLaunchV1 binding."
    fp: "856ff510f519"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T10:07:29.314Z"
  - id: DL-005
    kind: difficulty
    description: "Repository inspection command failed because ripgrep is unavailable in the Verify environment; used recursive grep as the fallback."
    target: tooling
    severity: annoying
    workaround: "Used recursive grep to complete inspection."
    suggested_encoding: "Expose one guaranteed repository search command or include ripgrep in the verifier image."
    fp: "e7b2db3b8ec5"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T10:09:51.157Z"
  - id: INS-003
    kind: insight
    description: "Manual reconciliation diff tracing found progress excluded from the general authorizing set but still included in completed-run nonGitHubProblems; no completed-state progress cross-product test proves cleanup invariance."
    target: project
    severity: degrading
    workaround: "Returned the authorization defect to Implement and verified progress exclusion plus completed-state invariance tests."
    suggested_encoding: "Maintain one completed-state cross-product over every progress classification and all authorization outputs."
    fp: "06ee6ac747b5"
    disposition: kept
    system:
      compound:
        status: encoded
        source: agent-self
        first_seen_at: "2026-08-12T10:10:28.777Z"
  - id: INS-004
    kind: insight
    description: "V4 persistence review required cross-file inference: isSnapshot validates IntegrationLaunchV1 fields only in isolation, not against snapshot identity/owned paths/final validation, and the helpers trust those unmatched persisted paths; no negative fixture proves malformed launch bindings fail safe."
    target: project
    severity: blocking
    workaround: "Returned the binding defect to Implement and verified strict snapshot cross-checks and forged-path refusal fixtures."
    suggested_encoding: "Validate every injected binding field against its containing snapshot and test each contradiction independently."
    fp: "5b86643623ee"
    disposition: kept
    system:
      compound:
        status: encoded
        source: agent-self
        first_seen_at: "2026-08-12T10:12:49.767Z"
  - id: INS-005
    kind: insight
    description: "Final-validation review found the missing-root-justfile path explicitly accepts the default just verify requirement, despite the architecture requiring the selected recipe be declared before ownership; existing configuration tests do not cover that production path."
    target: project
    severity: degrading
    workaround: "Returned the pre-ownership defect to Implement and verified missing-justfile rejection for default and configured forms."
    suggested_encoding: "Exercise each configuration default through the same declaration-proof path as explicit values."
    fp: "699d317750a2"
    disposition: kept
    system:
      compound:
        status: encoded
        source: agent-self
        first_seen_at: "2026-08-12T10:12:49.828Z"
  - id: DL-006
    kind: difficulty
    description: "Issue-checkbox proof command returned exit 1 even though grep printed the expected zero count because grep -c treats no matches as non-success; retried with an exit-zero awk counter."
    target: tooling
    severity: annoying
    workaround: "Retried checkbox counting with an exit-zero awk expression."
    suggested_encoding: "Expose issue acceptance checkbox counts as structured verifier evidence."
    fp: "453256aa870a"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T10:13:39.205Z"
  - id: DL-007
    kind: difficulty
    description: "Remote-head inspection used git rev-parse without --verify and returned the unresolved ref text, so it was inconclusive; retried with exact refs/remotes verification."
    target: tooling
    severity: annoying
    workaround: "Retried with exact ref verification and compared the resulting SHA."
    suggested_encoding: "Provide a structured branch/head binding check for Verify closeout."
    fp: "fd415cd660db"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T10:14:02.136Z"
  - id: DL-008
    kind: difficulty
    description: "An npm-exec shell probe could not determine an executable, so CLI PATH evidence required direct PATH and bin-directory inspection."
    target: tooling
    severity: annoying
    workaround: "Used direct PATH and package bin inspection."
    suggested_encoding: "Expose the built CLI invocation and executable resolution in a root recipe or harness probe."
    fp: "e9322a2e7227"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T10:51:08.542Z"
  - id: DL-009
    kind: difficulty
    description: "A production-parser probe rejected a previously valid completed RunSnapshotV3 because its legacy AgentResultV1 lacks the newly required final-validation field, contradicting supported v1-v3 compatibility."
    target: project
    severity: blocking
    workaround: "Returned the compatibility regression to Implement and verified explicit legacy parsing, deterministic migration, and unchanged strict V4 parsing."
    suggested_encoding: "Keep canonical historical completed snapshot bytes as production-parser compatibility fixtures."
    fp: "dd34a39ef60a"
    disposition: kept
    system:
      compound:
        status: encoded
        source: agent-self
        first_seen_at: "2026-08-12T10:52:12.551Z"
  - id: COORD-003
    kind: coordination
    description: "Terminal failed-progress publication for resumed Verify returned STATE_NOT_FOUND because no bound Runner snapshot exists; no progress artifact was fabricated."
    target: infra
    severity: degrading
    workaround: "Reported STATE_NOT_FOUND and preserved the unbound checkout without fabricating progress."
    suggested_encoding: "Carry or restore the Runner binding when a Verify pass is manually resumed."
    fp: "3b6d0e020f3b"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T10:53:30.279Z"
  - id: DL-010
    kind: difficulty
    description: "Verifier inspection retried with grep after rg was unavailable in the resumed checkout."
    target: tooling
    severity: annoying
    workaround: "Retried source and test searches with grep."
    suggested_encoding: "Expose one guaranteed repository search command or include ripgrep in the verifier image."
    fp: "1d38532e949a"
    disposition: kept
    system:
      compound:
        status: open
        source: agent-self
        first_seen_at: "2026-08-12T11:20:25.652Z"
---

# Retro — Issue 19 RPIV verifier passes

The structured entries preserve all verifier observations from initial, correction, retry, resumed, and final acceptance passes.
