# Task Breakdown: Issue #31

## Task T-1: Implement the shared closed tmux identity grammar

- **Status:** Complete
- **Complexity:** High
- **Dependencies:** Plan-stage architecture revisions committed
- **Acceptance Criteria:** AC-2, AC-3, AC-5, AC-9, AC-13
- **Related ADRs:** `ADR-260814-tmux-identity-failure-recovery`, `ADR-260810-typescript-node-cli`
- **Related Core-Components:** `CORE-COMPONENT-260814-tmux-identity-diagnostics`, `CORE-COMPONENT-260810-subprocess-execution`, `CORE-COMPONENT-260810-error-handling`, `CORE-COMPONENT-260810-development-standards`

### Description
Centralize the printable vertical-bar format and original-byte parser used by normal and Doctor paths. Update `src/tmux-identity.ts`, `src/domain.ts`, strict persistence/Doctor diagnostic validators, and shared constants so create accepts only `@<digits>|%<digits><LF>` and observe accepts only `@<digits>|%<digits>|<cwd><LF>`. Parse only the first two observe separators and return every remaining cwd byte unchanged, including vertical bars. Require exactly one terminal LF and nonempty valid UTF-8 cwd without NUL/CR/LF. Preserve diagnostic schema v1, old `horizontal_tab` readability, 8/8/32 limits, and add only value-free `vertical_bar` classification.

### Acceptance Criteria
- Enumerate one accepted create form and one accepted observe form; no HT, underscore, inferred, no-LF, or alternate printable/control form is accepted (`AC-2`).
- Reject empty output, missing framing, extra create framing, malformed fields before the second observe boundary, multiple records, invalid IDs, empty/invalid cwd, missing/extra terminators, and unsupported structural separators with `TMUX_IDENTITY_MALFORMED` and no partial identity (`AC-3`).
- Accept a valid UTF-8 cwd containing one or more vertical bars and retain it byte-for-byte after the second separator (`AC-2`).
- Keep exact original byte counts, closed value-free tokens, and 8/8/32 caps without raw values (`AC-5`).
- Accept the exact six-byte create record `@1|%1<LF>` with zero stderr, one record, and no HT (`AC-9`).

### Test Coverage
- Extend `src/tmux-identity.test.ts` with the accepted-form catalog, first-two-separator UTF-8 cwd cases, exact six-byte facts, and the finite create/observe rejection table.
- Extend persistence, Doctor-schema, and recovery fixtures to accept both legacy `horizontal_tab` diagnostics and new `vertical_bar` diagnostics while rejecting unknown tokens.
- Add cap and sentinel scans covering errors, snapshots, events, reports, logs, Doctor evidence, and renderers.
- Execute V-1 and include these tests in V-10 focused/full gates.

### Expected Evidence
- A table listing every accepted byte form and every rejected class with exact error code.
- Assertions for `stdoutByteCount: 6`, `stderrByteCount: 0`, one terminal LF, no byte `0x09`, exact `@1`/`%1`, and exact delimiter-containing cwd.
- Diagnostic snapshots showing only bounded counts/flags/closed tokens and successful sentinel absence scans.

### Implementation Evidence
- Shared parser accepts only printable-pipe, exactly one terminal LF records, retains observe cwd bytes after the second separator, and emits bounded schema-v1 diagnostics with legacy HT readability.
- V-1 coverage: `src/tmux-identity.test.ts`, `src/recovery-persistence.test.ts`, and `src/doctor.test.ts`; targeted 75 tests passed and complete focused gate passed 23 suites/475 tests.

## Task T-2: Apply and prove transport in normal issue-window flows

- **Status:** Complete
- **Complexity:** High
- **Dependencies:** T-1
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-9, AC-10, AC-11, AC-13
- **Related ADRs:** `ADR-260814-tmux-identity-failure-recovery`, `ADR-260811-prototype-one-run-orchestration`, `ADR-260811-prototype-three-recovery-concurrency`
- **Related Core-Components:** `CORE-COMPONENT-260814-tmux-identity-diagnostics`, `CORE-COMPONENT-260811-issue-run-orchestration`, `CORE-COMPONENT-260811-run-reconciliation-control`, `CORE-COMPONENT-260811-concurrent-run-admission`, `CORE-COMPONENT-260810-issue-worktree-locking`

### Description
Change `LiveTmuxPort.createIssueWindow` and `observe` to emit the shared printable format and consume the shared parser. Build a protocol-aware controlled command adapter that substitutes the actual requested tmux `-F` format and models the proved non-UTF8 control-byte sanitizer rather than emitting unconditional valid records. Declare UTF-8 and non-UTF8 state explicitly in each row and prohibit ambient locale, `TMUX`, default-server, network, and credential inputs. Exercise sequential repeat and barrier-controlled overlap for two distinctly owned issue flows.

### Acceptance Criteria
- Both explicit client-state rows create one exact window/pane identity and observe those same IDs plus expected cwd (`AC-1`, `AC-2`).
- Normal create and zero-exit observe map every rejection row to `TMUX_IDENTITY_MALFORMED`; nonzero observe remains absence (`AC-3`).
- Creation/observation equality, expected cwd, ownership, lineage, same-name refusal, exact clean fetched-HEAD proof, zero-candidate authorization, immediate recheck, and one-attempt retry remain unchanged (`AC-4`).
- Each row repeated once has identical output and resource inventory; two overlapped issue flows have distinct IDs/cwds/resources and no cross-owned or extra resource (`AC-10`).
- All fixtures operate in temporary roots with tripwires proving no prohibited external access (`AC-11`).

### Test Coverage
- Refactor `src/tmux-identity.test.ts` controlled runner to derive bytes from actual format arguments under explicit client mode and assert every normal command format.
- Extend `src/recovery-control.test.ts` for unchanged diagnostic authorization, one-pass observation, one create retry, action-race refusal, and no adoption.
- Add repeated two-row and barrier-controlled overlap tests to the normal integration fixture, including delimiter-bearing UTF-8 cwd.
- Execute V-2 and V-3 and include the affected suites in V-10.

### Expected Evidence
- A two-row matrix with explicit client-state setup, create count 1, observe count 1, exact IDs/cwd, and no ambient input.
- Repeat inventories equal row-by-row and overlap traces show two disjoint owner/resource sets.
- Recovery traces show zero launches/mutations for unproved resources and exactly one authorized create attempt.

### Implementation Evidence
- `LiveTmuxPort` uses shared create/observe formats; explicit UTF-8/non-UTF8 rows, repeat equality, full adapter rejection mapping, same-name refusal, and barrier overlap are covered without ambient inputs.
- V-2/V-3 coverage: `src/tmux-identity.test.ts` plus unchanged authorization coverage in `src/recovery-control.test.ts`; targeted 141 tests passed and complete focused gate passed 23 suites/517 tests.

## Task T-3: Apply and prove transport in the isolated Doctor protocol

- **Status:** Complete
- **Complexity:** High
- **Dependencies:** T-1
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-5, AC-6, AC-9, AC-10, AC-11, AC-13
- **Related ADRs:** `ADR-260812-repository-doctor-readiness`, `ADR-260814-tmux-identity-failure-recovery`
- **Related Core-Components:** `CORE-COMPONENT-260812-repository-doctor-contract`, `CORE-COMPONENT-260814-tmux-identity-diagnostics`, `CORE-COMPONENT-260810-subprocess-execution`, `CORE-COMPONENT-260810-development-standards`

### Description
Change Doctor `new-window` and `list-panes` formats to the shared vertical-bar grammar. Refactor unit and built protocol fakes to derive output from the requested format and an explicit client-state fact, including the non-UTF8 sanitizer that would convert HT but preserves printable framing. Run both rows through the complete isolated functional sequence, repeat each once, and overlap two probes with distinct workspaces, sockets, servers, and helper lineages. Preserve the exact 24 check IDs/order, time bounds, 4096-byte stream caps, value-free evidence, and unconditional `finally` cleanup.

### Acceptance Criteria
- Doctor completes create/observe in both explicit client-state rows with exact identity/cwd and a passing `command.tmux` (`AC-1`, `AC-2`).
- Every create/observe rejection row yields failed `command.tmux`, operation `window-create` or `pane-observe`, reason `malformed-output`, and no partial identity (`AC-3`).
- Doctor output remains exactly 24 ordered checks and returns only after server, pane processes, socket, and workspace are proved absent on success, failure, timeout, cancellation, and aggregate cutoff (`AC-6`).
- Six-byte create output is accepted through the same built packaged runtime path that previously failed (`AC-9`).
- Repeated and overlapped probes retain disjoint resources and prove independent complete absence without ambient/default tmux or external systems (`AC-10`, `AC-11`).

### Test Coverage
- Update `src/doctor-tmux.test.ts` protocol expectations, full malformed matrix, cleanup paths, exact client arguments, and overlapping probes.
- Update `src/doctor-integration.test.ts` protocol executable to derive bytes from the requested format under explicit UTF-8/non-UTF8 facts; run the built CLI/package path in both rows and repeat.
- Preserve `src/doctor.test.ts`, `src/doctor-cli.test.ts`, `src/asset-doctor-regression.test.ts`, and all three `fixtures/doctor/*.json` exact 24-row assertions.
- Execute V-4 and V-5 and include all Doctor suites in V-10.

### Expected Evidence
- Built-path two-row report with six-byte/no-HT create facts, exact IDs/cwd, `command.tmux: passed`, and 24 IDs in canonical order.
- Rejection evidence for every matrix row with bounded value-free diagnostic and `malformed-output`.
- Repeat/overlap resource ledgers proving distinct owned names/PIDs/paths during execution and all server/pane/socket/workspace states absent after return.

### Implementation Evidence
- Doctor imports the shared printable formats; protocol-aware UTF-8/non-UTF8 unit and built-path rows repeat identically, accept six-byte creation, preserve 24 IDs, and retain private environments.
- V-4/V-5 coverage: full create/observe malformed matrices, every prior cleanup/deadline path, and a barrier-held two-probe overlap with disjoint servers, helpers, sockets, and workspaces.
- Targeted 90 tests passed; complete focused gate passed 23 suites/550 tests.

## Task T-4: Add APS SemVer delivery instructions

- **Status:** Complete
- **Complexity:** Medium
- **Dependencies:** Plan-stage `CORE-COMPONENT-260815-package-semver-governance`
- **Acceptance Criteria:** AC-7, AC-13
- **Related ADRs:** `ADR-260810-typescript-node-cli`, `ADR-260812-official-asset-distribution-installation`
- **Related Core-Components:** `CORE-COMPONENT-260815-package-semver-governance`, `CORE-COMPONENT-260806-rpiv-stage-contract`, `CORE-COMPONENT-260505-commit-standards`

### Description
Edit only the existing `<instructions>` block in `AGENTS.md` during Implement. Preserve all unrelated lines and their order. Add one absolute APS instruction per line with no workflow or control-flow prose:

```
You MUST assign every code or package change the correct Semantic Versioning major, minor, or patch release before delivery.
You MUST increment the major version for incompatible public-contract changes when the current major version is at least 1.
You MUST increment the minor version for backward-compatible functionality.
You MUST increment the minor version for incompatible public-contract changes before 1.0.0.
You MUST increment the patch version for backward-compatible defect corrections.
You MUST set version 1.0.0 only for a delivery that explicitly establishes the stable public contract.
```

### Acceptance Criteria
- The instructions require a correct major/minor/patch assignment before delivery for every code or package change (`AC-7`).
- Every added line is one direct `You MUST` imperative and contains no conditional workflow sequence, loop, or stage control (`AC-7`).
- Existing APS badge governance and all unrelated content/order remain byte-identical relative to their prior sequence (`AC-7`).

### Test Coverage
- Extend `src/documentation.test.ts` to parse the `<instructions>` block, assert each exact line once, enforce one instruction per line, and check the pre-1.0 and stable classifications.
- Review the focused `git diff -- AGENTS.md` and assert only the six planned lines were inserted at the version-governance location.
- Execute V-6 and include documentation tests in V-10.

### Expected Evidence
- Static assertion output naming all six exact instruction lines.
- A minimal AGENTS diff with no APS badge change, reorder, or unrelated edit.
- Root focused/full validation passes with the instruction checks.

### Implementation Evidence
- Inserted exactly the six planned one-line absolute `You MUST` SemVer directives inside the existing `<instructions>` block; the focused AGENTS diff contains no unrelated change.
- V-6 coverage: `src/documentation.test.ts` asserts exact presence/order and major/minor/patch classifications; targeted 31 tests and complete focused 23 suites/552 tests passed.

## Task T-5: Release the finite authoritative inventory as 0.1.1

- **Status:** Complete
- **Complexity:** Medium
- **Dependencies:** T-4
- **Acceptance Criteria:** AC-8, AC-13
- **Related ADRs:** `ADR-260810-typescript-node-cli`, `ADR-260812-official-asset-distribution-installation`
- **Related Core-Components:** `CORE-COMPONENT-260815-package-semver-governance`, `CORE-COMPONENT-260812-official-asset-installation-contract`, `CORE-COMPONENT-260810-development-standards`

### Description
Apply the selected PATCH increment from 0.1.0 to exactly 0.1.1. Update only `package.json`, top-level and root-package versions in `package-lock.json`, `OFFICIAL_ASSET_VERSION`, current package/install fixture expectations, and the documentation surfaces owned by T-6. Keep dependency entries such as `get-package-type` and `yocto-queue` unchanged. Strengthen package tests to inspect dry-run JSON, tarball metadata, installed `package.json`, generated `.agents/manifest.json`, and a clean temporary installation/reinstallation that identifies 0.1.1 rather than 0.1.0.

### Acceptance Criteria
- Every finite authoritative tracked and generated product surface equals exactly 0.1.1 (`AC-8`).
- Package-lock dependency versions/ranges, integrity/resolved values, package file inventory, and dependency graph have no release-only churn (`AC-8`).
- Dry-run, packed tarball, clean installed package, installed CLI asset manifest, and reconverged prior 0.1.0 manifest all identify 0.1.1 (`AC-8`).

### Test Coverage
- Update `src/official-assets.test.ts` and `src/asset-cli.test.ts` to assert package/catalog/fixture/pack/install/generated-manifest equality.
- Add an exact tracked version inventory test or deterministic assertion that distinguishes the two root lock entries from unrelated dependency 0.1.0 strings.
- Run `npm pack --dry-run --json`, a temporary `npm pack`, and `npm install --ignore-scripts --no-audit --no-fund --omit=dev --prefix <temp>` without publication.
- Execute V-7 and V-8 and include asset/package suites in V-10.

### Expected Evidence
- Exact table of authoritative surfaces, each reading 0.1.1, plus a separate unchanged dependency-0.1.0 table.
- Pack JSON filename/version, tarball `package/package.json`, installed package metadata, and generated manifest all show 0.1.1.
- Lock/package diff contains only the intended root release fields and no dependency churn.

### Implementation Evidence
- Applied the planned PATCH release to package, the two root lock fields, official catalog, and current fixture only; dependency 0.1.0 entries remain unchanged.
- V-7/V-8 tests assert exact dry-run filename/version, tarball and installed package metadata, generated clean manifest, proved 0.1.0 manifest reconvergence, and repeat no-op.
- Manual isolated package smoke reported package/tar/install/manifest 0.1.1 with temporary cleanup; targeted 17 tests and complete focused 23 suites/554 tests passed.

## Task T-6: Update current user documentation

- **Status:** Complete
- **Complexity:** Medium
- **Dependencies:** T-2, T-3, T-5
- **Acceptance Criteria:** AC-1, AC-5, AC-8, AC-12, AC-13
- **Related ADRs:** `ADR-260814-tmux-identity-failure-recovery`, `ADR-260812-repository-doctor-readiness`, `ADR-260812-official-asset-distribution-installation`
- **Related Core-Components:** `CORE-COMPONENT-260814-tmux-identity-diagnostics`, `CORE-COMPONENT-260812-repository-doctor-contract`, `CORE-COMPONENT-260815-package-semver-governance`, `CORE-COMPONENT-260812-official-asset-installation-contract`

### Description
Update `README.md`, `docs/phase-1-issue-run.md`, `docs/phase-3-recovery-operations.md`, `docs/phase-4-repository-doctor.md`, `docs/phase-5-official-assets.md`, and `docs/README.md` where current behavior is described. Replace HT-only claims with the closed vertical-bar/exact-LF contract and first-two-separator cwd behavior; state support for UTF-8 and non-UTF8 client modes; retain diagnostic confidentiality and safety. Name current version 0.1.1. Give copyable 0.1.0 upgrade and reinstall forms, confirmation through installed package metadata because no `--version` command exists, and `soft-factory install --recommended` plus manifest inspection for official-asset reconvergence. Do not claim registry publication.

### Acceptance Criteria
- Current documentation describes both client states, exact accepted/rejected framing, delimiter-bearing UTF-8 cwd, and unchanged safety/confidentiality (`AC-1`, `AC-5`, `AC-12`).
- User guidance explains upgrade or reinstall from 0.1.0 to exact 0.1.1 and how to confirm installed package and generated asset-manifest version (`AC-8`, `AC-12`).
- Package scope remains local npm distribution with no invented API, service, registry publication, locale prerequisite, or raw-value diagnostic guidance (`AC-12`).

### Test Coverage
- Extend `src/documentation.test.ts` with required current transport, dual-state support, version, upgrade/reinstall/confirmation, asset reconvergence, and confidentiality assertions and stale HT-only claim rejection.
- Run a tracked-doc search proving 0.1.0 appears only as upgrade history, never as current product metadata.
- Execute V-9 and include documentation tests in V-10.

### Expected Evidence
- Documentation assertion report and focused diff covering all current behavior locations.
- Copyable command examples for exact 0.1.1 install/reinstall and local metadata confirmation.
- Search output showing no stale current-version or HT-only transport statement and no raw value disclosure recommendation.

### Implementation Evidence
- Updated README, PRD, docs index, issue-run, recovery, Doctor, and official-assets guidance for both tmux client states, printable-pipe/exact-LF framing, cwd retention, rejection classes, and value-free confidentiality.
- Documented the exact local 0.1.0 to 0.1.1 build/pack/install or clean-reinstall path, installed metadata confirmation, recommended asset reconvergence, and generated-manifest confirmation without registry-publication or CLI-version claims.
- V-9 documentation assertions passed 33 tests; the complete focused gate passed 23 suites/556 tests.

### Verify-Return Correction Evidence
- Preserved product commit `8a6f1472319d8013f832bf0612a1ec4b3b3633aa` and failed verification metadata commit `3dc353673597f577eb8cede961ed986fae31154b`; repaired only the returned application-documentation defect on top.
- Reconstructed `docs/phase-1-issue-run.md` from the canonical 178-line pre-Issue guide and applied only the intended three portable-transport/diagnostic/fixture edits. The guide now has one title, one copy of every heading/body, complete `^@[0-9]+$` and `^%[0-9]+$` expressions, and no fragment.
- Added a deterministic structural regression in `src/documentation.test.ts` covering unique headings, unique guide body, complete anchored ID grammar, embedded-title corruption, and orphan fragments; targeted documentation validation passed 34 tests.
- Reinspected README, PRD, docs index, issue-run, recovery, Doctor, and official-asset guides: no duplicate headings, embedded guide bodies, truncated grammar, or fragment markers remained; neighboring documents required no correction.

## Task T-7: Run complete validation and evidence inventory

- **Status:** Complete
- **Complexity:** Medium
- **Dependencies:** T-1, T-2, T-3, T-4, T-5, T-6
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11, AC-12, AC-13
- **Related ADRs:** `ADR-260814-tmux-identity-failure-recovery`, `ADR-260812-repository-doctor-readiness`, `ADR-260812-official-asset-distribution-installation`, `ADR-260810-typescript-node-cli`
- **Related Core-Components:** `CORE-COMPONENT-260814-tmux-identity-diagnostics`, `CORE-COMPONENT-260812-repository-doctor-contract`, `CORE-COMPONENT-260815-package-semver-governance`, `CORE-COMPONENT-260810-development-standards`, `CORE-COMPONENT-260811-engineering-harness-interface`

### Description
Run the finite test matrix and root-authoritative gates after implementation. Read `harness instructions checks --json` before harness checks. Run direct `just verify-focused` and `just verify` as the authoritative commands, and run `harness checks --focused --json` and `harness checks --json` as structured delegates. Capture matrix rows, six-byte facts, rejection outcomes, diagnostic caps, ownership traces, exact Doctor order, repeat/overlap resource inventories, package metadata, and documentation assertions in `implementation/00-implementation.md` under every AC ID.

### Acceptance Criteria
- Every AC-1 through AC-13 has implementation evidence tied to one or more V-* entries and no unresolved or inferred proof (`AC-1` through `AC-13`).
- Both direct root gates pass and harness envelopes report delegated root commands with `status: ok` (`AC-13`).
- Evidence contains exact counts, enums, IDs, versions, and resource states but no prohibited raw values or external-system access (`AC-5`, `AC-11`, `AC-13`).

### Test Coverage
- Execute V-1 through V-9, then V-10 in the stated direct/harness order.
- Confirm exact 24 Doctor IDs/order, exact 13-AC evidence rows, exact 0.1.1 inventory, and zero residual temporary/isolated resources.
- Run `git diff --check` through the root recipes and inspect final status for only intended implementation/evidence files.

### Expected Evidence
- Successful direct `just verify-focused` and `just verify` command logs and successful focused/full harness JSON envelopes.
- One final AC coverage table linking all 13 IDs to passing tests and concrete evidence paths.
- Final version, Doctor, package, overlap, cleanup/isolation, confidentiality, and prohibited-access inventories.

### Implementation Evidence
- Direct `just verify-focused` passed 23 suites/556 tests; focused harness JSON returned `status: ok`, `scope: focused`, delegated `just verify-focused`, and exit 0.
- Direct `just verify` passed lint, Prettier, typecheck, 23 suites/556 tests with coverage, build, and diff check; full harness JSON returned `status: ok`, `scope: full`, delegated `just verify`, and exit 0.
- Verbose V-1–V-5 matrix validation passed 202 tests, unchanged recovery authorization passed 54 tests, package/install validation passed 17 tests, and V-9 documentation passed 33 tests.
- Built Doctor inventory contains exactly 24 unique IDs in canonical order; controlled overlap/repeat fixtures prove all owned resources absent and prohibited-access inventories empty.
- Product inventory is package/lock roots/catalog/fixture/docs 0.1.1, with dependency `get-package-type` and `yocto-queue` entries still 0.1.0; dry-run reports `soft-factory-runner-0.1.1.tgz`, and clean packed/installed/manifest smoke distinguishes 0.1.1.

### Verify-Return Validation Evidence
- Targeted documentation validation passed 1 suite/34 tests. Direct `just verify-focused` and focused harness feedback passed 23 suites/557 tests with clean diff checks.
- Direct `just verify` and full harness feedback passed lint, formatting, typecheck, 23 suites/557 tests with coverage, build, and clean diff checks.
- Package dry-run still reports `soft-factory-runner@0.1.1` and `soft-factory-runner-0.1.1.tgz`; package/lock roots/catalog remain 0.1.1 and unrelated dependency 0.1.0 entries remain unchanged.
