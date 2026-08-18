# Task Breakdown: Issue #38

## Task T1: Make targeting inventory bounded and typed

- **Status:** Completed
- **Complexity:** High
- **Dependencies:** None
- **Acceptance Criteria:** AC-1, AC-4
- **Related ADRs:** ADR-260817-invoking-tmux-context-targeting; ADR-260812-repository-doctor-readiness
- **Related Core-Components:** CORE-COMPONENT-260817-exact-tmux-context-ownership; CORE-COMPONENT-260810-error-handling; CORE-COMPONENT-260810-subprocess-execution

### Description
Correct `LiveTmuxPort.inventoryServerResources` and its command seam. A pre-query `ENOENT` represents stable empty inventory and starts no query. Any post-query identity loss, including `ENOENT`, and every existing-socket timeout, nonzero exit, malformed bytes, overflow, inaccessible or lost identity proof, and device/inode change is typed `unavailable-proof`. Use one shell-free `tmux -S <socket> list-panes` attempt, 2,000 ms, continued draining/counting with at most 65,536 retained stdout bytes, and at most 1,024 accepted LF-terminated records. Keep all selectors, bytes, identities, records, and sentinels ephemeral.

### Acceptance Criteria
- Absence returns equal empty inventory without tmux invocation or server creation (AC-1).
- Every genuine matrix row fails typed and value-free; only absence is unchanged success (AC-4).
- The adapter proves collection retention is bounded, not merely rejected after unbounded buffering (AC-1, AC-4).

### Test Coverage
- Unit/fault matrix for absence, 2,001 ms timeout, nonzero exit, malformed bytes, 65,537 bytes, 1,025 records, `EACCES`, post-query identity loss, and device/inode replacement.
- Command trace assertions for explicit `-S`, `shell: false`, one attempt, timeout, drain/count, retention cap, and zero call on pre-query absence.
- Sentinel scans across typed errors and serialized results.

### Expected Evidence
- Nine-row matrix with exact classification and command counts.
- Stream trace showing total bytes can exceed retained bytes while retention never exceeds 65,536.
- Before/after filesystem proof that an absent socket/server remains absent.

## Task T2: Contain targeting failures and preserve Doctor observations

- **Status:** Completed
- **Complexity:** High
- **Dependencies:** T1
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5
- **Related ADRs:** ADR-260812-repository-doctor-readiness; ADR-260817-invoking-tmux-context-targeting
- **Related Core-Components:** CORE-COMPONENT-260812-repository-doctor-contract; CORE-COMPONENT-260817-exact-tmux-context-ownership; CORE-COMPONENT-260810-error-handling

### Description
Contain first inventory, selection, and second inventory failures inside the tmux-targeting observation boundary. Produce an `invalid-context`/`unavailable-proof` value-free targeting result for genuine inventory failure and fail only `command.tmux`; do not route expected inventory failure through `DoctorService.run` generic `unavailableResult`. Preserve completed repository, executable, authentication, compatibility, and runtime observations, exactly 24 ordered checks, repository facts, readiness derivation, and existing invalid-context reason classifications.

### Acceptance Criteria
- Controlled core facts remain `owner/repo` and `main`, with seven named prerequisites passed and 24 canonical checks exactly once (AC-2).
- Human and JSON forms normalize to identical readiness, facts, checks, and targeting meaning (AC-3).
- Every genuine inventory/context refusal preserves completed non-tmux observations and reveals no supplied value (AC-4, AC-5).
- Absent unrelated inventory remains a successful unchanged targeting classification (AC-1).

### Test Coverage
- Service-level controlled composition for success and each inventory failure.
- Human/JSON normalization and strict result-schema assertions.
- Five-row invoking-context matrix for partial, malformed, stale, ambiguous, and contradictory reasons before mutation.
- Regression assertion that no expected row creates 24 repeated generic adapter failures.

### Expected Evidence
- Full ordered result snapshots for success and each failure row.
- Fact/pass preservation table naming the seven prerequisite outcomes.
- Human/JSON equality and sentinel-absence report.

## Task T3: Add deterministic repeat and isolated live-equivalent proof

- **Status:** Completed
- **Complexity:** High
- **Dependencies:** T2
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7
- **Related ADRs:** ADR-260817-invoking-tmux-context-targeting; ADR-260812-repository-doctor-readiness
- **Related Core-Components:** CORE-COMPONENT-260817-exact-tmux-context-ownership; CORE-COMPONENT-260812-repository-doctor-contract; CORE-COMPONENT-260814-tmux-identity-diagnostics

### Description
Extend repository-controlled Doctor fixtures and `src/tmux-context.test.ts` or a focused Issue #38 test file. Build one isolated real custom tmux server, force the derived default socket absent, inject local controlled Git/gh/tmux/Node/Copilot and authentication observations, and run Doctor twice. Snapshot inventories before/after, tripwire any command targeting the absent default, clean exact owned resources, and require no credentials, ambient server, Sparkta installation, or network.

### Acceptance Criteria
- All core, inventory-failure, and invoking-context rows are deterministic and preserve required facts/checks (AC-1 through AC-5).
- Two identical runs return equal facts/readiness/checks/classification and preserve inventories (AC-6).
- Real custom-server evidence proves absent default before/after, unchanged custom inventory, local controlled observations, and no generic collapse (AC-7).

### Test Coverage
- Repeat comparison of complete `DoctorResultV2` values.
- Real tmux custom-socket fixture with default path absence checks and exact cleanup in `finally`.
- Local fake command/auth observations with network and credential tripwires.
- Mutation traces and inventory byte comparisons before/after both runs.

### Expected Evidence
- Two equal serialized result hashes or deep-equality assertion.
- Real-server transcript with selected inventory equal and default absent at all checkpoints.
- Cleanup report and no-network/no-credentials tripwire results.

## Task T4: Synchronize documentation and beta version surfaces

- **Status:** Completed
- **Complexity:** Medium
- **Dependencies:** T2
- **Acceptance Criteria:** AC-8, AC-9
- **Related ADRs:** ADR-260812-repository-doctor-readiness; ADR-260812-official-asset-distribution-installation
- **Related Core-Components:** CORE-COMPONENT-260815-package-semver-governance; CORE-COMPONENT-260812-repository-doctor-contract; CORE-COMPONENT-260812-official-asset-installation-contract

### Description
Document `0.2.1-beta.0` as a backward-compatible PATCH correction. Explain that absent unrelated/default servers are empty unchanged inventory and are never created or targeted; retain value-free troubleshooting for genuine inventory and invoking-context failure. Synchronize `package.json`, root/top-level lock values, `OFFICIAL_ASSET_VERSION`, current package/install fixtures and assertions, README, docs index, Doctor guide, and official-assets guide. Preserve all third-party dependency ranges, versions, and lock metadata.

### Acceptance Criteria
- User-facing Doctor and release documentation states every AC-8 behavior.
- Every governed source, fixture, packed, installed, asset-manifest, and current-doc version expectation is `0.2.1-beta.0` (AC-9).
- No third-party dependency change or registry-publication guidance is introduced (AC-9).

### Test Coverage
- Documentation assertions for correction class, absence semantics, no creation/targeting, and value-free outcomes.
- Release consistency test covering package/lock/catalog/fixtures and generated manifest metadata.
- Dependency-object diff against the issue base, excluding only root package version fields.

### Expected Evidence
- Finite version-surface matrix at `0.2.1-beta.0`.
- Documentation assertion transcript.
- Dependency diff with zero third-party changes.

## Task T5: Produce package and final validation evidence

- **Status:** Completed
- **Complexity:** Medium
- **Dependencies:** T3, T4
- **Acceptance Criteria:** AC-9, AC-10
- **Related ADRs:** ADR-260812-official-asset-distribution-installation; ADR-260812-repository-doctor-readiness
- **Related Core-Components:** CORE-COMPONENT-260815-package-semver-governance; CORE-COMPONENT-260812-official-asset-installation-contract; CORE-COMPONENT-260806-project-command-interface; CORE-COMPONENT-260806-rpiv-stage-contract; CORE-COMPONENT-260811-engineering-harness-interface

### Description
Record the issue base before implementation comparison. Build locally; inspect `npm pack --dry-run --json`; create a tarball in a temporary directory; inspect `package/package.json`; install that tarball into a clean temporary prefix using `--offline --ignore-scripts --no-audit --no-fund --omit=dev`; inspect installed package and generated official-asset manifest metadata. Do not run `npm publish`, contact a registry, fetch, or use external credentials. Run direct root gates and then harness delegates after reading harness checks instructions. Assemble `implementation/00-implementation.md` with AC-1..AC-10 evidence.

### Acceptance Criteria
- Packed and installed metadata, generated manifest, and governed sources all report `0.2.1-beta.0`, with no dependency churn or publication/network command (AC-9).
- `just verify-focused`, `harness checks --focused --json`, `just verify`, and `harness checks --json` succeed; harness delegates supplement rather than replace direct gates (AC-10).
- Implement evidence maps every AC to exact tests, outputs, and paths (AC-10).

### Test Coverage
- Local dry-run, tarball inspection, offline install smoke, installed CLI/asset convergence, and repeat no-op.
- `git diff --check`, direct focused/full recipes, and focused/full harness envelopes.
- Static scan of executed package commands proving `npm publish` and registry/network operations absent.

### Expected Evidence
- Dry-run, tarball, installed package, and installed asset-manifest metadata excerpts.
- Direct gate exit-0 transcripts and harness JSON envelopes naming delegated commands/scopes.
- Final finite AC evidence matrix and exact changed-path list.

## Task T6: Perform post-RPIV beta operational acceptance

- **Status:** Deferred until repository RPIV acceptance
- **Complexity:** Medium
- **Dependencies:** T5 and accepted repository Verify result
- **Acceptance Criteria:** AC-7, AC-9 (supplementary evidence only; not required to establish repository implementation acceptance)
- **Related ADRs:** ADR-260817-invoking-tmux-context-targeting; ADR-260812-official-asset-distribution-installation
- **Related Core-Components:** CORE-COMPONENT-260817-exact-tmux-context-ownership; CORE-COMPONENT-260812-official-asset-installation-contract

### Description
Install the exact local beta tarball into Sparkta without registry/network access. In a visible right-hand tmux pane, run the bounded Doctor scenario and record value-free proof that custom inventory is unchanged and the default server remains absent. Then perform later Issue #7 operational validation with the installed official agent: package-coupled reconvergence, visible invocation with one controlled issue, instructions-before-Doctor, ready-only dispatch, and dispatch-versus-completion distinction. Do not redefine closed Issue #7 or treat Sparkta delivery as proof of this repository implementation.

### Acceptance Criteria
- Sparkta visibly demonstrates the packaged beta behavior without value leakage or unrelated server creation (supplements AC-7, AC-9).
- The official agent visibly preserves the current Issue #7-derived operational contract after package installation.
- Failure of this external follow-up blocks beta promotion, not the truth of already recorded repository-local AC evidence.

### Test Coverage
- Manual/operator-observed visible right-pane run using only the locally packed tarball.
- Before/after value-free custom/default inventory checks and installed metadata confirmation.
- One controlled official-agent dispatch trace with no lifecycle bypass.

### Expected Evidence
- Timestamped pane identifier/classification, installed version, closed Doctor facts, and unchanged/absent booleans without raw paths or IDs.
- Separate post-RPIV beta report clearly labeled external operational acceptance.
