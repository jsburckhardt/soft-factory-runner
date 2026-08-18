# Task Breakdown: Issue 40

## Task T1: Implement strict stale no-server inventory classification

- **Status:** Completed
- **Complexity:** Medium
- **Dependencies:** None
- **Acceptance Criteria:** AC-1, AC-4
- **Related ADRs:** ADR-260817-invoking-tmux-context-targeting; ADR-260812-repository-doctor-readiness; ADR-260814-tmux-identity-failure-recovery
- **Related Core-Components:** CORE-COMPONENT-260817-exact-tmux-context-ownership; CORE-COMPONENT-260810-subprocess-execution; CORE-COMPONENT-260810-error-handling

### Description
Update `CommandExecutor` and `LiveTmuxPort.inventoryServerResources` so only a completed nonzero query with zero stdout, complete bounded valid-UTF-8 stderr exactly `no server running on <queried-socket>\n`, and equal pre/post socket identity becomes stable empty-resource inventory. Include identity in ephemeral comparison. Keep command-free ENOENT and keep arbitrary nonzero, alternate/additional/malformed stderr, timeout, stdout/stderr overflow, invalid inventory, EACCES, post-query loss, and replacement as `unavailable-proof`. Never render bytes or paths.

### Acceptance Criteria
- AC-1: expose stable stale absence to Doctor without refusal.
- AC-4: preserve every non-stale unavailable-proof boundary.

### Test Coverage
Unit exact/near-miss rows; existing Issue 38 regressions; one shell-free explicit-`-S` call with 2,000 ms and caps; no call for ENOENT.

### Expected Evidence
Focused output, command trace, finite classifier table, pre/post identities, and zero sentinel matches.

## Task T2: Prove complete Doctor contract and finite matrix

- **Status:** Completed
- **Complexity:** High
- **Dependencies:** T1
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5
- **Related ADRs:** ADR-260817-invoking-tmux-context-targeting; ADR-260812-repository-doctor-readiness
- **Related Core-Components:** CORE-COMPONENT-260817-exact-tmux-context-ownership; CORE-COMPONENT-260812-repository-doctor-contract; CORE-COMPONENT-260814-tmux-identity-diagnostics

### Description
Add a full-service valid-custom/stale-unrelated fixture and a closed matrix for stale, generic nonzero, invalid UTF-8, NUL, CR, missing LF, 65,537 bytes, 1,025 records, and replacement. Add timeout, EACCES, malformed/additional/overflow stderr, and post-query identity loss safety rows. Run every row twice; snapshot type/device/inode, live inventories, and mutation traces. Compare human/JSON projections and scan for paths, raw identities/inventory/stderr, environment, and sentinels.

### Acceptance Criteria
- AC-1: only exact stale is `invoking-valid`, null, true/true.
- AC-2: stale retains `owner/repo`, `main`, exact once-ordered 24 checks, and named passes.
- AC-3: renderings agree and disclose no prohibited values.
- AC-4: required non-stale rows are `invalid-context`/`unavailable-proof` false/false with completed observations preserved.
- AC-5: repeats are equal and Doctor creates, deletes, or mutates no socket/server.

### Test Coverage
Doctor service/integration matrix, exact `DOCTOR_CHECK_IDS` assertion, named pass checks, renderer parity, negative scans, pairwise equality, and resource tripwires.

### Expected Evidence
Matrix, two-run comparison, 24-ID snapshot, preserved pass list, parity/scan report, and before/after resource facts.

## Task T3: Add repository-local live-equivalent evidence

- **Status:** Completed
- **Complexity:** High
- **Dependencies:** T1, T2
- **Acceptance Criteria:** AC-5, AC-6
- **Related ADRs:** ADR-260817-invoking-tmux-context-targeting; ADR-260812-repository-doctor-readiness
- **Related Core-Components:** CORE-COMPONENT-260817-exact-tmux-context-ownership; CORE-COMPONENT-260812-repository-doctor-contract; CORE-COMPONENT-260810-subprocess-execution

### Description
In an exclusive temporary root, start a finite custom tmux server and bind/close a Unix socket at the isolated default selector. Prove custom `list-panes` success and stale exact no-server failure before full controlled Doctor. Record bounds, identities, inventories, and traces; repeat. Cleanup only scenario-owned resources in `finally` and prove server, entry, helpers, and root absent. Use no credentials, network, Sparkta, ambient default server, polling, or hidden retry.

### Acceptance Criteria
- AC-5: identities/inventories stay equal during each run and Doctor performs no mutation.
- AC-6: two live-equivalent repetitions prove query outcomes, Core result, bounds, and cleanup.

### Test Coverage
Real local tmux integration under existing conventions, with precondition/query/Doctor/after/cleanup/repeat assertions and cleanup on failure.

### Expected Evidence
Value-free outcomes, timings, Doctor result, before/after equality, empty mutation trace, cleanup absence, and repeat equality.

## Task T4: Synchronize beta.1 release, package, and documentation

- **Status:** Completed
- **Complexity:** Medium
- **Dependencies:** T1, T2, T3
- **Acceptance Criteria:** AC-7, AC-8
- **Related ADRs:** ADR-260817-invoking-tmux-context-targeting; ADR-260812-official-asset-distribution-installation
- **Related Core-Components:** CORE-COMPONENT-260815-package-semver-governance; CORE-COMPONENT-260812-official-asset-installation-contract; CORE-COMPONENT-260812-repository-doctor-contract

### Description
Classify as a backward-compatible correction and set governed manifest, two root lock values, official asset metadata, package/install fixtures, packed/installed assertions, README, docs index, Doctor guide, and official-assets guide to `0.2.1-beta.1`. Retain beta.0 only as prior-version context. Document exact stale absence versus arbitrary live nonzero/malformed/timeout/overflow/EACCES/replacement. Prove local pack/install with npm `--offline` and no dependency churn, fetch, publication, credentials, or leftover prefix.

### Acceptance Criteria
- AC-7: release/Doctor docs identify beta.1 and distinguish outcomes.
- AC-8: all governed/generated values are beta.1 with unchanged third-party metadata and offline proof.

### Test Coverage
Version/documentation tests; dry-run pack, local pack, tar read, offline no-script/no-audit/no-fund/omit-dev install; dependency-section comparison and prohibited-command audit.

### Expected Evidence
Version inventory, docs output, packed/installed metadata, dependency equality, offline trace, and cleanup proof.

## Task T5: Run direct and harness gates and assemble evidence

- **Status:** Completed
- **Complexity:** Medium
- **Dependencies:** T1, T2, T3, T4
- **Acceptance Criteria:** AC-9
- **Related ADRs:** ADR-260811-engineering-harness-surface; ADR-260817-invoking-tmux-context-targeting
- **Related Core-Components:** CORE-COMPONENT-260806-project-command-interface; CORE-COMPONENT-260811-engineering-harness-interface; CORE-COMPONENT-260806-rpiv-stage-contract

### Description
Run direct `just verify-focused` and `just verify`. Read `harness instructions checks`, then run focused/full harness checks without replacing direct gates. Record finite AC-1–AC-9 references; preserve failures and rerun only after a documented correction.

### Acceptance Criteria
- AC-9: both direct recipes exit zero, harness outcomes are visible, and finite evidence is complete.

### Test Coverage
Direct focused/full recipes, briefed harness focused/full checks, and final artifact/coverage audit.

### Expected Evidence
Commands, timestamps, statuses/envelopes, logs, and complete AC-to-evidence table.

## Deferred Operational Acceptance
After repository acceptance, an operator may visibly record/uninstall Sparkta beta.0, install beta.1, confirm metadata, run installed human/JSON Doctor, and invoke `soft-factory run --issue 7 --json`. This requires external state and is not evidence for an AC.
