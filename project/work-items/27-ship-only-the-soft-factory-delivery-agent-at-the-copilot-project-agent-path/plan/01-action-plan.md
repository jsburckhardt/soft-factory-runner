# Action Plan: Ship only the Soft Factory delivery agent at the Copilot project-agent path

## Feature
- **ID:** 27
- **Research Brief:** project/work-items/27-ship-only-the-soft-factory-delivery-agent-at-the-copilot-project-agent-path/research/00-research.md

## ADRs Created
- None.
- Updated [ADR-260812-official-asset-distribution-installation](../../../architecture/ADR/ADR-260812-official-asset-distribution-installation.md) in place; its original creation-date basename remains unchanged.

## Core-Components Created
- None.
- Updated [CORE-COMPONENT-260812-official-asset-installation-contract](../../../architecture/core-components/CORE-COMPONENT-260812-official-asset-installation-contract.md) in place; its original creation-date basename remains unchanged.

## Delivery Decisions

### Public and package surface
- The current catalog and recommended set contain one identity only: `agent:soft-factory`, source `assets/official/soft-factory.agent.md`, destination `.github/agents/soft-factory.agent.md`.
- `.agents/manifest.json` remains strict schema version 1 and converges to one current entry with package version, protocol 1, current destination, and desired SHA-256.
- `install agent soft-factory` and `install --recommended` are the only supported install forms and run the same convergence operation. Removed assessor and skill selectors return stable unsupported CLI behavior.
- Remove tracked assessor and skill product sources during Implement. Change the npm allowlist from broad `assets/official/` to the exact delivery-agent file. This excludes untracked `assets/official/theoutsideone.agent.md` from packaging without deleting or modifying it.

### Closed ownership vocabulary

| Rank | Classification | Exact identity | Exact destination | Final-state role |
|---:|---|---|---|---|
| 0 | Legacy operator | `agent:soft-factory` | `.agents/agents/soft-factory.agent.md` | Prove retirement only |
| 1 | Current agent | `agent:soft-factory` | `.github/agents/soft-factory.agent.md` | Sole retained manifest entry |
| 2 | Legacy assessor | `agent:soft-factory-assessor` | `.agents/agents/soft-factory-assessor.agent.md` | Prove retirement only |
| 3 | Legacy skill | `skill:soft-factory` | `.agents/skills/soft-factory/SKILL.md` | Prove retirement only |

Each entry requires exact schema-v1 fields, protocol 1, nonempty version, lowercase SHA-256, and stable rank. Destinations are unique. The only permitted repeated identity is one legacy-operator plus one current-agent bridge. Every other duplicate, contradiction, unknown identity or destination, malformed field, unsafe path, or order violation fails before mutation.

### Finite convergence behavior

| Observed state | Required result |
|---|---|
| Current destination absent | Install trusted current bytes and write current ownership metadata. A stale current entry does not block recreation of an absent file. |
| Current destination equals desired bytes | Adopt without rewriting; normalize ownership metadata. |
| Current destination differs and matches a valid current-destination recorded digest | Upgrade in place and normalize current metadata. |
| Current destination differs without matching current ownership | Refuse the complete operation with `ASSET_LOCAL_MODIFIED` and `No files changed`. |
| Legacy entry exists and legacy file is absent | Retire stale entry; do not remove a directory solely for the absent file. |
| Legacy entry exists and file matches recorded digest | Retire the entry and file in the transaction. |
| Legacy entry exists and file differs | Refuse the complete operation with `No files changed`. |
| Legacy file exists without its exact entry | Treat it as unproved local content and refuse without mutation. |
| Both agent destinations exist | Require legacy bytes to match legacy ownership and current bytes to be desired or match current ownership; otherwise refuse all mutation. |
| Current desired or previous-owned bytes plus proved obsolete assets | Adopt or upgrade current bytes and retire all proved obsolete files and entries together. |
| Current destination already converged plus proved obsolete assets | Perform a retirement-only transaction. |
| Skill directory contains untracked siblings | Retire only digest-proved `SKILL.md`; preserve siblings and every nonempty ancestor. |
| Legacy ancestor becomes empty after a file retirement | Remove only known ancestors, deepest first; never recursively remove or remove `.agents/`. |
| Successful operation repeated | Perform zero mutations, retain one current entry, leave no proved obsolete files, and create no legacy directory. |

### Transaction and failure behavior
- Preflight package digest and protocol, the complete recognized manifest, all current and legacy path kinds and digests, root containment, parent path kinds, destination collisions, directory eligibility, final manifest bytes, and every affected path.
- Reject symlink or other indirection under managed `.github/` and `.agents/` paths with stable actionable codes and `No files changed` evidence.
- Stage replacements beside each destination, preserve reversible backups, apply the current file, retire proved legacy files, remove only eligible empty directories, and replace the manifest last.
- Inject faults before and after every create, stage, backup, rename, retirement, empty-directory removal, manifest replacement, and transaction cleanup, including after the new file write and before old-file retirement.
- A caught failure must restore a byte-for-byte and path-kind-identical pre-invocation inventory. If restoration cannot be proved, return `ASSET_ROLLBACK_UNCERTAIN`, list every planned affected path across both roots, and direct the user to stop, inspect, restore, then retry.

### Delivery agent behavior
- Use repository APS and VS Code Copilot evidence: `tools` is a YAML array of `execute/runInTerminal` and `execute/getTerminalOutput`, with `user-invocable: true`, `disable-model-invocation: false`, and `target: vscode`; do not use `bash`.
- Preserve APS section order `instructions`, `constants`, `formats`, `runtime`, `triggers`, `processes`, `input` and tag-newline form.
- Reject missing, multiple, zero, negative, signed, fractional, leading-zero, and otherwise invalid issue input before terminal use.
- For one canonical issue, execute direct commands only: instructions, Doctor, then ready-only run with `--json`. Stop on instructions failure or non-ready Doctor, do not retry or query status, embed the applicable Runner output unchanged, and report dispatch acceptance separately from issue completion. Completion is `unknown` unless Runner explicitly reports it.
- Prohibit install, lifecycle commands, direct RPIV invocation, and direct worktree, lock, state, process, log, cleanup, or completion paths.

### Protected working-tree context
- Do not revert or include the preliminary edits to `assets/official/soft-factory.agent.md`, `src/official-agent-contracts.ts`, `src/official-assets.ts`, or `src/official-assets.test.ts` in the Plan commit.
- Leave untracked `assets/official/theoutsideone.agent.md` and `soft-factory-runner-0.1.0.tgz` untouched and uncommitted. The former is read-only reference evidence; the latter is unrelated.

## Acceptance Criteria
- **AC-1:** The published official catalog, recommended installation set, and npm package contain exactly one consumable official asset: the `soft-factory` agent; the assessor agent and Soft Factory skill are absent from published sources, catalog selection, and recommended installation.
- **AC-2:** The packaged agent has the APS section order and tag-newline structure, Copilot-compatible terminal tools, and statically asserted directives that make explicit-issue delivery its primary goal while prohibiting competing worktree, lock, state, process, cleanup, and completion paths.
- **AC-3:** Before any terminal command, the agent rejects missing, multiple, nonpositive, fractional, signed, or otherwise invalid issue input; for valid input it reads `soft-factory instructions --json` before `soft-factory doctor --json`, dispatches only when Doctor reports ready, preserves exact structured Runner output, and never equates dispatch acceptance with issue completion.
- **AC-4:** Individual and recommended installation converge the agent to `.github/agents/soft-factory.agent.md`, with installed bytes identical to trusted packaged bytes and current version, protocol, destination, and SHA-256 ownership metadata recorded in `.agents/manifest.json`.
- **AC-5:** Removed assessor and skill selectors are rejected as unsupported, and user-facing help and documentation advertise only the remaining agent and current destination.
- **AC-6:** A valid prior manifest plus matching official bytes at `.agents/agents/soft-factory.agent.md` migrates the agent to the new destination and retires the old owned file; a prior entry whose old file is absent installs the current agent at the new destination and retires the stale entry.
- **AC-7:** When both agent destinations exist, migration succeeds only if old bytes match recorded ownership and new bytes are either current desired bytes or bytes matching a valid recorded current-destination digest; modified old bytes or any unproved differing new bytes refuse the complete operation before mutation.
- **AC-8:** Valid prior entries for the removed assessor and skill are retired with their files only when present bytes match their recorded digests; absent owned files retire stale entries, modified owned files refuse the complete operation, and untracked skill-directory siblings are preserved.
- **AC-9:** Legacy directories are removed only when empty after proven file retirement; non-empty directories and unrelated content remain unchanged.
- **AC-10:** Unsafe path indirection, malformed metadata, duplicate or contradictory ownership, and unproved destination collisions return actionable stable errors with `No files changed` evidence.
- **AC-11:** A new destination containing current desired bytes is adopted without rewriting it; a new destination with valid recorded older owned bytes is upgraded in place; proven obsolete legacy files and entries retire in the same atomic operation.
- **AC-12:** Every mutating clean install, migration, adoption-plus-retirement, upgrade, and retirement-only operation spans `.github/` and `.agents/` atomically: failure either restores the exact pre-invocation tree or reports uncertain rollback with every affected path and direct remediation.
- **AC-13:** Repeating any successful clean installation or migration is a stable no-op with one current manifest entry, no obsolete official files, and no empty legacy directories created by Runner.
- **AC-14:** Deterministic automated cases cover clean individual and recommended installation, repeat installation, matching legacy migration, absent legacy agent, both-destination states, current-destination adoption and upgrade, modified legacy refusal, new-destination collision, malformed or contradictory ownership, obsolete-file retirement, untracked skill siblings, empty-directory cleanup, and unrelated-content preservation.
- **AC-15:** Fault-injection cases cover every mutation boundary for clean install, cross-root migration including the window after the new file is written but before the old file retires, adoption-plus-retirement, and retirement-only operations.
- **AC-16:** Package inspection proves the distributable contains the remaining agent and excludes assessor and skill sources; static agent checks prove APS structure, exact-input rejection directives, instructions-before-Doctor order, exact Runner-result preservation, and dispatch-versus-completion distinction.
- **AC-17:** Consumer documentation explains the one-agent package, exact install and invocation commands, `.github/agents/soft-factory.agent.md` destination, legacy migration outcomes, local-modification refusal, sibling preservation, and rollback remediation without claiming an API, service, or deployment change.

## Acceptance Coverage

| AC | Implementation tasks | Tests or validation | Expected evidence |
|---|---|---|---|
| AC-1 | T1, T4, T5, T7 | V1, V11, V12 | One catalog identity, one recommended identity, exact package inventory containing only the delivery-agent source, and no tracked assessor or skill product source. |
| AC-2 | T3, T5, T7 | V2, V11, V12 | Static contract report showing ordered APS tags, tag newlines, exact Copilot tools/frontmatter, primary delivery directives, and all resource-path prohibitions. |
| AC-3 | T3, T5, T7 | V2, V11, V12 | Static process-order and directive assertions for pre-tool input rejection, instructions before Doctor, ready-only run, unchanged output capture, no retry/status, and separate dispatch/completion fields. |
| AC-4 | T1, T2, T4, T5, T7 | V3, V11, V12 | Individual and recommended inventories with trusted byte digest at the new destination and one exact current schema-v1 manifest entry. |
| AC-5 | T4, T6, T7 | V1, V10, V11, V12 | Parser rejection snapshots for removed selectors plus help, README, docs index, guide, and PRD assertions naming only the current form and destination. |
| AC-6 | T1, T2, T5, T7 | V4, V12 | Matching-old and absent-old fixture inventories showing current install, old removal when present, stale-entry retirement, and final one-entry manifest. |
| AC-7 | T1, T2, T5, T7 | V4, V6, V7, V12 | Both-destination truth-table results and before/after inventory equality for modified-old or unproved-new refusal. |
| AC-8 | T1, T2, T5, T7 | V5, V6, V12 | Assessor/skill matching, absent, and modified outcomes; sibling file hashes and nonempty directory inventory remain unchanged. |
| AC-9 | T2, T5, T7 | V5, V12 | Deepest-first removal trace for empty eligible directories and byte-identical nonempty/unrelated directory inventory. |
| AC-10 | T1, T2, T5, T7 | V6, V12 | Stable typed codes, actionable remediation, `noChanges: true`, `No files changed`, zero mutation trace, and exact pre/post inventory equality. |
| AC-11 | T1, T2, T5, T7 | V4, V7, V12 | Adoption preserves inode and bytes, proved older current bytes upgrade, and combined plans report current outcome plus all retirements. |
| AC-12 | T2, T5, T7 | V8, V9, V12 | Fault matrix with exact inventory restoration at every caught boundary or uncertain rollback containing the complete planned path list and remediation. |
| AC-13 | T2, T5, T7 | V3, V4, V5, V7, V12 | Second-run zero mutation trace, stable result, one current manifest entry, no obsolete files, and no Runner-created legacy directories. |
| AC-14 | T5, T7 | V3, V4, V5, V6, V7, V11, V12 | Named deterministic Jest cases and fixtures cover every listed scenario with explicit inventory and outcome assertions. |
| AC-15 | T2, T5, T7 | V8, V9, V12 | Enumerated mutation-boundary matrix covers clean, migration, post-new/pre-old, adoption-plus-retirement, and retirement-only plans. |
| AC-16 | T3, T4, T5, T7 | V1, V2, V11, V12 | `npm pack --dry-run --json` exact file list and mutation-sensitive static agent checks for every required phrase, section, tool, and order relation. |
| AC-17 | T6, T7 | V10, V12 | Documentation test assertions and reviewed diffs cover commands, destination, manifest, migration, refusal, siblings, rollback, and explicit no-API/service/deployment scope. |

Coverage proof: every AC-1 through AC-17 appears once in this catalog, maps to one or more dependency-ordered implementation tasks, maps to deterministic V1-V12 validation, and names reproducible expected evidence.

## Implementation Tasks
- **T1 — Model the sole current catalog and closed legacy ownership grammar** (AC-1, AC-4, AC-6 through AC-11, AC-13)
- **T2 — Implement cross-root convergence, retirement, and rollback** (AC-4, AC-6 through AC-13, AC-15)
- **T3 — Finalize the APS Copilot delivery agent contract** (AC-2, AC-3, AC-16)
- **T4 — Contract CLI selectors and package publication** (AC-1, AC-4, AC-5, AC-16)
- **T5 — Build deterministic state and fault-injection coverage** (AC-1 through AC-16)
- **T6 — Update consumer, product, migration, and help documentation** (AC-5, AC-17)
- **T7 — Run full validation and record acceptance evidence** (AC-1 through AC-17)
