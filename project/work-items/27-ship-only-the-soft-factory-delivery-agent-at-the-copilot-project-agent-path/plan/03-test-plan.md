# Test Plan: Ship only the Soft Factory delivery agent

All automated behavior uses temporary repository roots, injected filesystem boundaries, package-local bytes, and root `justfile` commands. No test uses network access, credentials, live Copilot, or a production fault switch.

## Test V1: Sole catalog, selector, source, and package contract

- **Type:** Unit and package inspection
- **Task:** T1, T4, T5
- **Acceptance Criteria:** AC-1, AC-5, AC-16
- **Priority:** Critical

### Setup
Build Runner from the working source. Keep untracked `assets/official/theoutsideone.agent.md` present to prove the package allowlist is exact rather than dependent on a clean source directory.

### Steps
1. Assert the current catalog identity list is exactly `agent:soft-factory` and its destination is `.github/agents/soft-factory.agent.md`.
2. Assert recommended selection equals the same one identity.
3. Assert only current individual and recommended CLI arrays parse; assessor and skill arrays throw `CLI_INVALID` and exit 2 through `runCli`.
4. Assert tracked current official product sources contain the sole agent and no assessor or skill source.
5. Run `just build`, then parse `npm pack --dry-run --json` and compare `assets/official/` package paths to the exact one-element expected list.
6. Assert compiled catalog digest equals source bytes and package version/protocol metadata.

### Expected Result
One current asset is selectable and packaged. Removed selectors are unsupported. Assessor, skill, and reference source paths are absent from the package file list.

### Expected Evidence
- Catalog and parser Jest assertions.
- Exact package inventory JSON.
- SHA-256 and version/protocol equality output.
- Scoped Git status showing the reference file remains untouched and untracked.

## Test V2: APS Copilot delivery-agent static contract

- **Type:** Static contract test
- **Task:** T3, T5
- **Acceptance Criteria:** AC-2, AC-3, AC-16
- **Priority:** Critical

### Setup
Read the trusted packaged `assets/official/soft-factory.agent.md` as UTF-8 and parse its frontmatter plus APS body.

### Steps
1. Assert frontmatter field order and exact values for name, quoted description, YAML tools `execute/runInTerminal` and `execute/getTerminalOutput`, `user-invocable: true`, `disable-model-invocation: false`, and `target: vscode`.
2. Assert generic `bash` is absent.
3. Assert exactly one ordered `instructions`, `constants`, `formats`, `runtime`, `triggers`, `processes`, and `input` section with required tag newlines, no tabs, and no line comments.
4. Assert directives reject missing, multiple, zero/nonpositive, signed, fractional, leading-zero, and otherwise invalid issue input before terminal use.
5. Assert process indices place input validation before first terminal `USE`, instructions before Doctor, ready check before run, and only the direct JSON run after readiness.
6. Assert instructions failure and non-ready Doctor return exact applicable output and stop; run output is preserved unchanged; retry, status, lifecycle, direct RPIV, and resource manipulation are absent.
7. Assert output fields separate dispatch acceptance and ticket completion and default absent completion to `unknown`.
8. Remove or reorder each required clause and assert the static checker fails.

### Expected Result
The agent is APS-structured and Copilot-compatible, performs only one validated Runner dispatch, and cannot statically lose any stronger comparison behavior unnoticed.

### Expected Evidence
- Mutation-sensitive Jest output.
- Parsed frontmatter snapshot.
- APS section and process-order index report.
- Required and forbidden marker report with zero missing clauses in the trusted asset.

## Test V3: Clean individual, recommended, and repeated convergence

- **Type:** Service and built-CLI integration
- **Task:** T2, T4, T5
- **Acceptance Criteria:** AC-4, AC-13, AC-14
- **Priority:** Critical

### Setup
Create separate empty temporary repositories for individual and recommended installation. Record complete path-kind and content-digest inventories plus mutation traces.

### Steps
1. Run individual installation and recommended installation in their separate roots.
2. Compare resulting inventories and typed outcomes.
3. Assert installed bytes equal packaged bytes at `.github/agents/soft-factory.agent.md`.
4. Parse `.agents/manifest.json` and assert one exact current entry.
5. Assert no `.agents/agents` or `.agents/skills` directory was created.
6. Record the current agent inode and invoke each successful form again with the mutation adapter tripwire enabled.

### Expected Result
Both forms converge to identical trusted bytes and metadata. Repeated installation returns the stable up-to-date result with zero mutation, unchanged inode, one manifest entry, no obsolete files, and no Runner-created legacy directory.

### Expected Evidence
- Matching individual and recommended result objects and inventories.
- Manifest fixture and installed/package digest comparison.
- Empty second-run mutation trace and stable inode.

## Test V4: Legacy operator and both-destination migration matrix

- **Type:** Deterministic migration integration
- **Task:** T1, T2, T5
- **Acceptance Criteria:** AC-6, AC-7, AC-11, AC-13, AC-14
- **Priority:** Critical

### Setup
Generate table-driven temporary repositories for old operator entry with matching file, old entry with absent file, both destinations with desired current bytes, and both destinations with recorded older current bytes. Include the exact dual-agent manifest bridge where current ownership proof is required.

### Steps
1. Invoke the same convergence operation for each accepted row.
2. Assert matching old bytes retire and absent old files retire stale entries.
3. Assert desired current bytes are not rewritten and proved older current bytes upgrade.
4. Assert all proved old files and entries retire in the same operation.
5. Assert final manifest has one current entry and repeat invocation has zero mutations.
6. Record operation ordering for the cross-root write and retirement.

### Expected Result
Every accepted legacy and dual-destination row converges atomically to one current agent. No accepted row leaves an old file or entry, and every repeat is a no-op.

### Expected Evidence
- Named truth-table Jest cases and expected statuses.
- Inode proof for desired-current adoption and digest proof for upgrade.
- Mutation trace showing manifest replacement last.
- Canonical final and repeat inventories.

## Test V5: Assessor and skill retirement, siblings, and directory cleanup

- **Type:** Deterministic retirement integration
- **Task:** T1, T2, T5
- **Acceptance Criteria:** AC-8, AC-9, AC-13, AC-14
- **Priority:** Critical

### Setup
Create rows for matching assessor and skill files, absent files with stale entries, an untracked sibling beside legacy `SKILL.md`, unrelated files under `.agents/agents`, `.agents/skills`, and `.github/agents`, and empty versus nonempty legacy ancestors.

### Steps
1. Converge matching obsolete entries/files and assert explicit retirement outcomes.
2. Converge absent obsolete files and assert stale-entry retirement without unrelated directory removal.
3. Retire a matching skill with an untracked sibling and compare sibling bytes/inode before and after.
4. Assert known ancestors are removed deepest-first only when a file retired in the operation and the ancestor is empty.
5. Assert nonempty and unrelated directories remain exactly unchanged.
6. Repeat every successful row.

### Expected Result
Only digest-proved obsolete files and entries retire. Stale entries can retire without deleting pre-existing directories. Untracked siblings and unrelated content remain byte-identical. Eligible empty directories are removed once and repeat is stable.

### Expected Evidence
- Retirement result objects distinguishing file and stale-entry outcomes.
- Sibling and unrelated path hash/inode comparisons.
- Directory-removal trace and complete final inventories.
- Empty repeat mutation traces.

## Test V6: No-change refusal matrix

- **Type:** Negative unit and integration
- **Task:** T1, T2, T5
- **Acceptance Criteria:** AC-7, AC-8, AC-10, AC-14
- **Priority:** Critical

### Setup
Create independent rows for malformed JSON/schema/fields/digest/protocol/order, duplicate pair, duplicate destination, contradictory identity, unsupported identity/destination, path traversal, symlinked roots or parents, modified old agent, modified assessor, modified skill, unrecorded legacy files, and unproved differing current destination.

### Steps
1. Snapshot complete inventory before each invocation.
2. Invoke convergence twice per row.
3. Assert the expected stable code, nonzero result, actionable remediation, `noChanges: true`, and literal `No files changed`.
4. Assert no local bytes appear in output.
5. Assert mutation trace is empty and complete pre/post inventory is identical.

### Expected Result
Every ambiguous, unsafe, malformed, contradictory, modified, or unproved state refuses deterministically before mutation and identifies a direct correction path.

### Expected Evidence
- Table of scenario to stable error code and exit.
- Zero mutation traces.
- Exact inventory equality and redaction assertions.
- Repeated error object equality.

## Test V7: Current adoption, upgrade, and combined retirement

- **Type:** Deterministic convergence integration
- **Task:** T1, T2, T5
- **Acceptance Criteria:** AC-7, AC-11, AC-13, AC-14
- **Priority:** High

### Setup
Create rows for unmanaged desired current bytes, desired current bytes with legacy records/files, valid recorded older current bytes alone, and older current bytes with all proved obsolete assets.

### Steps
1. Record current destination inode, bytes, and manifest before each invocation.
2. Converge each row.
3. Assert unmanaged desired bytes are adopted without a destination write.
4. Assert recorded older bytes are upgraded to the desired digest.
5. Assert proved obsolete entries/files retire in the same result and transaction.
6. Repeat each successful operation under a mutation tripwire.

### Expected Result
Desired bytes are never rewritten, valid older ownership authorizes replacement, combined retirement is complete, and every final repeat is a no-op.

### Expected Evidence
- Adoption inode and mutation trace.
- Upgrade before/after digest evidence.
- Typed current and retirement outcomes.
- Stable final manifest and second-run result.

## Test V8: Exact rollback at every mutation boundary

- **Type:** Fault-injection integration
- **Task:** T2, T5
- **Acceptance Criteria:** AC-12, AC-15
- **Priority:** Critical

### Setup
For clean install, matching old migration, current adoption-plus-retirement, current upgrade-plus-retirement, and retirement-only plans, enumerate every concrete create, stage, backup, rename, retirement, empty-directory removal, manifest replacement, and transaction cleanup operation. Support injected failure immediately before and immediately after each operation.

### Steps
1. Snapshot complete file/directory/symlink kinds and file digests before each faulted invocation.
2. Inject one fault at each before/after boundary for each plan shape.
3. Include an explicit row after the new current file rename and before old agent retirement.
4. Allow rollback operations to succeed.
5. Assert the command returns the stable exact-rollback filesystem failure.
6. Compare complete post-failure inventory with the pre-invocation inventory and assert transaction artifacts are absent.
7. Assert enumerated boundaries equal executed fault cases with no gap.

### Expected Result
Every caught mutation failure restores the exact pre-invocation tree across `.github/` and `.agents/`, including path absence and empty-directory existence.

### Expected Evidence
- Machine-readable plan-shape to boundary-count report.
- Passing before/after fault matrix.
- Exact inventory equality for every row.
- Dedicated post-new-write/pre-old-retirement rollback trace.

## Test V9: Uncertain rollback completeness and remediation

- **Type:** Fault-injection negative integration
- **Task:** T2, T5
- **Acceptance Criteria:** AC-12, AC-15
- **Priority:** Critical

### Setup
For each required mutating plan shape, inject a primary commit fault after at least one path changed and a second fault into one reverse restoration operation.

### Steps
1. Record the immutable planned affected-path set before commit.
2. Trigger the primary and rollback failures.
3. Assert `ASSET_ROLLBACK_UNCERTAIN`, nonzero exit, and no `No files changed` claim.
4. Compare reported paths with the complete planned affected-path set, not only attempted paths.
5. Assert paths include both managed roots where the plan spans them.
6. Assert remediation directs the user to stop, inspect every listed path, restore from version control or backup, and retry only after restoration.
7. Assert no file bytes or secrets appear in output.

### Expected Result
Rollback uncertainty is never reported as success or exact restoration and always provides complete bounded remediation.

### Expected Evidence
- Typed uncertain error snapshots for every plan shape.
- Exact set equality between planned and reported affected paths.
- Remediation and redaction assertions.

## Test V10: Help, consumer documentation, and PRD contract

- **Type:** Documentation and live-help validation
- **Task:** T6
- **Acceptance Criteria:** AC-5, AC-17
- **Priority:** High

### Setup
Load `README.md`, `docs/README.md`, `docs/phase-5-official-assets.md`, `PRD.md`, and live `just run --help` output.

### Steps
1. Assert current guidance includes exact individual, recommended, and issue invocation commands; new destination; manifest location and fields; and one-agent package wording.
2. Assert current command and product sections do not advertise assessor, skill, or old destination.
3. Assert migration sections cover matching and absent old agent, both destinations, current adoption and upgrade, assessor/skill retirement, modified/unproved refusal, sibling preservation, empty-only cleanup, repeat behavior, and rollback uncertainty remediation.
4. Assert package guidance names the exact source allowlist and local reference exclusion behavior.
5. Assert Doctor authority remains unchanged.
6. Assert documentation explicitly states no API, service, daemon, webhook, container, or deployment change.

### Expected Result
Help and consumer/product documentation consistently describe the sole delivery agent and complete finite migration/safety contract without stale current-surface claims.

### Expected Evidence
- Passing `src/documentation.test.ts` output.
- Required/forbidden phrase table.
- Captured live help output.
- Reviewed documentation diff.

## Test V11: Packed built-CLI installation smoke

- **Type:** End-to-end local package smoke
- **Task:** T3, T4, T5
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-14, AC-16
- **Priority:** Critical

### Setup
Build and pack the local npm package into a temporary directory, install it with scripts disabled under a temporary prefix, and prepare clean and legacy temporary target repositories. Keep the user reference source outside the tarball.

### Steps
1. Inspect tar contents for the exact source and compiled files.
2. Invoke packaged CLI help and removed selectors.
3. Run packaged individual installation in a clean target and recommended installation in another clean target.
4. Run packaged recommended migration against matching old-agent and obsolete-asset ownership.
5. Compare installed bytes with the packed trusted source and manifest digest.
6. Read the packed agent and run V2 static checks against the actual tar content.
7. Repeat each successful target invocation.

### Expected Result
The distributable itself contains and installs only the current agent, rejects retired selectors, migrates recognized ownership safely, and reaches a stable no-op.

### Expected Evidence
- Tar file inventory.
- Built CLI exit/output captures.
- Packed/installed/catalog/manifest digest equality.
- Packed-agent static contract output.
- Repeat inventory and mutation evidence.

## Test V12: Full repository validation and Doctor non-regression

- **Type:** Full quality gate and evidence review
- **Task:** T7
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15, AC-16, AC-17
- **Priority:** Critical

### Setup
Complete T1 through T6, retain protected untracked reference and tarball items, and run from the repository root.

### Steps
1. Run `just verify-focused` and resolve all focused failures.
2. Run `harness checks --focused --json` and inspect the envelope.
3. Run direct `just verify`.
4. Run `harness checks --json` and inspect the envelope.
5. Re-run `npm pack --dry-run --json` and archive the exact inventory in implementation evidence.
6. Confirm `src/asset-doctor-regression.test.ts` still proves 24 canonical checks, `.github/agents/rpiv.agent.md` authority, and ignored asset manifest.
7. Run `git diff --check`, inspect the complete implementation diff, and inspect scoped status for protected baseline files.
8. Record AC-1 through AC-17 evidence in `implementation/00-implementation.md` without claiming final acceptance.

### Expected Result
All root and harness validation passes in one final source state. Every AC has reproducible implementation evidence, package and documentation proof is current, Doctor is unchanged, and protected unrelated files remain untouched and uncommitted.

### Expected Evidence
- Direct root-recipe output with exit 0 and complete Jest/coverage summary.
- Successful focused and full harness JSON envelopes.
- Exact npm package inventory and digest evidence.
- Doctor regression test result.
- AC evidence table, implementation commit SHA, `git diff --check`, and scoped status capture.
