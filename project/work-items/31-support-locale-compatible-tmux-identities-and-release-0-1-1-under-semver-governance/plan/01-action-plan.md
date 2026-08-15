# Action Plan: Support locale-compatible tmux identities and release 0.1.1 under SemVer governance

## Feature
- **ID:** 31
- **Research Brief:** `project/work-items/31-support-locale-compatible-tmux-identities-and-release-0-1-1-under-semver-governance/research/00-research.md`

## ADRs Created
- No new ADR was required.
- Revised `ADR-260814-tmux-identity-failure-recovery` in place to select printable vertical-bar framing, exactly one terminal LF, first-two-separator observation parsing, and no inferred sanitized forms.
- Revised `ADR-260812-repository-doctor-readiness` in place to apply the shared transport to Doctor while preserving its 24-check and cleanup architecture.

## Core-Components Created
- Created `CORE-COMPONENT-260815-package-semver-governance` as the global package-version classification, synchronization, package-proof, and upgrade-guidance contract.
- Revised `CORE-COMPONENT-260814-tmux-identity-diagnostics` in place for the shared portable grammar, `vertical_bar` value-free token, client-state matrix, and preserved safety limits.
- Revised `CORE-COMPONENT-260812-repository-doctor-contract` in place for portable Doctor create/observe framing, controlled client-state proof, and overlapping isolation.
- Updated `project/architecture/ADR/DECISION-LOG.md`: revised decision 127 and added decisions 144-162 for every changed architecture artifact.

## Acceptance Criteria
- **AC-1:** A repository-controlled two-row validation matrix declares and verifies one UTF-8 and one non-UTF8 tmux client state from explicit setup facts, without inheriting ambient locale or tmux state, and proves that normal issue-window creation and observation and the isolated Doctor functional probe complete successfully in both rows.
- **AC-2:** The delivered compatibility contract defines a finite closed set of accepted identity transport forms covering both client states; validation enumerates every accepted form, and each accepted creation proves exactly one window and pane identity while each accepted observation proves those exact identities and one nonempty valid cwd matching the expected cwd.
- **AC-3:** A finite rejection matrix covers empty output, missing or extra fields, multiple records, invalid window or pane identities, empty or invalid cwd, extra record terminators, and unsupported printable and control separators; normal creation/observation returns `TMUX_IDENTITY_MALFORMED`, Doctor reports `command.tmux` with reason `malformed-output`, and no case accepts a partial identity.
- **AC-4:** Existing ownership and retry authorization remain unchanged: identity evidence or diagnostics alone never authorize ownership or retry; same-name or otherwise unproved resources are never inferred, adopted, or modified; and retry remains limited to the existing exact clean fetched-HEAD ownership, zero same-name candidate, and one-attempt bounds.
- **AC-5:** Identity failures retain the existing bounded, value-free diagnostic facts and limits without raw output, identity, path, command, environment, or unrelated-run values.
- **AC-6:** Doctor still emits exactly the existing 24 checks in their existing order. `command.tmux` passes only after the complete isolated functional protocol succeeds and no managed server, pane process, socket, or workspace remains; every existing functional failure, timeout, and cancellation path also returns only after proving that no such resource remains.
- **AC-7:** `AGENTS.md` uses the repository APS-compliant instruction style to require Semantic Versioning and require every code or package change to receive the correct major, minor, or patch version before delivery.
- **AC-8:** This backward-compatible fix releases as 0.1.1, with 0.1.1 agreed by package metadata, lock metadata, official-asset catalog metadata, newly generated installed-manifest metadata, package and installation fixtures, packed and installed package metadata, and current user documentation; clean package installation evidence distinguishes it from 0.1.0.
- **AC-9:** Repository-controlled deterministic input reproduces the proved zero-exit create shape of six stdout bytes, zero stderr bytes, one LF-terminated logical record, and no horizontal tab, and the same packaged runtime path that failed now returns a valid exact identity without depending on tmux 3.7b or an external locale.
- **AC-10:** Repeating each client-state row once yields the same result and resource inventory. In one controlled overlap of two distinctly owned issue-window flows, each returns and observes only its own identity/cwd and creates no cross-owned or extra resource; in one controlled overlap of two Doctor probes, each uses distinct isolated resources and proves its own server, pane processes, socket, and workspace absent.
- **AC-11:** Regression evidence uses only repository-controlled temporary or isolated resources and does not access Sparkta, credentials, network services, ambient/default tmux, or unowned resources.
- **AC-12:** User documentation states support for both tmux client locale states, explains how a 0.1.0 user upgrades or reinstalls and confirms 0.1.1, and preserves the raw-value confidentiality boundary.
- **AC-13:** Root `just verify-focused` and `just verify` pass with inspectable evidence covering the controlled six-byte regression, the two-row client-state matrix, rejection matrix, repeated and overlapping runs, preserved safety contracts, and finite package-version inventory.

## Acceptance Coverage

| AC ID | Implementation tasks | Tests or validation | Expected evidence |
|---|---|---|---|
| AC-1 | T-1, T-2, T-3 | V-1, V-2, V-4 | Two explicit client-state rows show normal and Doctor create/observe success with no ambient locale/tmux inputs. |
| AC-2 | T-1, T-2, T-3 | V-1, V-2, V-4 | Accepted-form catalog contains only vertical-bar, exactly LF-terminated create/observe records; IDs and expected cwd compare exactly. |
| AC-3 | T-1, T-2, T-3 | V-1, V-3, V-5 | Complete rejection table records `TMUX_IDENTITY_MALFORMED` for normal paths and Doctor `malformed-output`, with no parsed partial identity. |
| AC-4 | T-2, T-7 | V-3, V-10 | Recovery call traces preserve exact ownership, zero adoption, zero-candidate authorization, immediate recheck, and one create attempt. |
| AC-5 | T-1, T-2, T-3, T-6 | V-1, V-3, V-5, V-9 | 8/8/32 cap assertions and sentinel scans find no raw/value-bearing data in any durable or rendered surface. |
| AC-6 | T-3, T-7 | V-4, V-5, V-10 | Exact `DOCTOR_CHECK_IDS` list has 24 ordered entries and every success/failure inventory proves server, panes, socket, and workspace absent. |
| AC-7 | T-4 | V-6 | Static APS assertion finds the exact one-command-per-line absolute `You MUST` SemVer rules and an unrelated-content/order diff review passes. |
| AC-8 | T-5, T-6 | V-7, V-8, V-9 | Exact 0.1.1 inventory spans source, lock roots, catalog, fixture, generated manifest, pack JSON/tarball, clean install, and docs while dependency metadata is unchanged. |
| AC-9 | T-1, T-2, T-3 | V-1, V-2, V-4 | Controlled create record is six bytes `@1|%1<LF>`, zero stderr, one record, no HT, and the built packaged Doctor path accepts it in both rows. |
| AC-10 | T-2, T-3 | V-2, V-3, V-4, V-5 | Repeated row outputs/inventories are equal; overlap traces show distinct normal identities/cwds and distinct Doctor servers, helpers, sockets, and workspaces with no residuals. |
| AC-11 | T-2, T-3, T-7 | V-2, V-3, V-4, V-5, V-10 | Fixture tripwires and temporary-root inventories prove zero network, credential, Sparkta, ambient/default tmux, and unowned-resource access. |
| AC-12 | T-6 | V-9 | README and current guides state both client modes, 0.1.0 to 0.1.1 upgrade/reinstall/confirmation, asset reconvergence, and raw-value prohibition. |
| AC-13 | T-1, T-2, T-3, T-4, T-5, T-6, T-7 | V-1 through V-10 | Focused and full direct root gates pass; harness delegates pass; reports expose every required matrix and inventory. |

Coverage is complete: all 13 stable IDs have at least one implementation task, one test or validation entry, and one inspectable expected-evidence statement.

## Implementation Tasks
- **T-1 — Implement the shared closed tmux identity grammar** (`AC-2`, `AC-3`, `AC-5`, `AC-9`, `AC-13`): centralize vertical-bar format/parsing, exact terminal LF, first-two-separator cwd retention, schema-compatible value-free diagnostics, and the parser rejection matrix.
- **T-2 — Apply and prove the transport in normal issue-window flows** (`AC-1`, `AC-2`, `AC-3`, `AC-4`, `AC-5`, `AC-9`, `AC-10`, `AC-11`, `AC-13`): update `LiveTmuxPort`, then prove client rows, repetition, overlap, exact cwd/identity, and unchanged recovery authorization.
- **T-3 — Apply and prove the transport in Doctor** (`AC-1`, `AC-2`, `AC-3`, `AC-5`, `AC-6`, `AC-9`, `AC-10`, `AC-11`, `AC-13`): update Doctor create/observe and protocol-aware fixtures while preserving 24 IDs, timing, confidentiality, and unconditional isolated cleanup.
- **T-4 — Add APS SemVer delivery instructions** (`AC-7`, `AC-13`): update only the `<instructions>` block of `AGENTS.md` with absolute one-line major/minor/patch rules from `CORE-COMPONENT-260815-package-semver-governance`.
- **T-5 — Release the finite authoritative inventory as 0.1.1** (`AC-8`, `AC-13`): update package/lock roots, official asset version, fixtures, generated-manifest expectations, and packed/installed assertions without dependency churn.
- **T-6 — Update current user documentation** (`AC-1`, `AC-5`, `AC-8`, `AC-12`, `AC-13`): document both client modes, closed transport/confidentiality, current 0.1.1, upgrade/reinstall/confirmation, and official-asset reconvergence.
- **T-7 — Run complete validation and evidence inventory** (`AC-1` through `AC-13`): execute focused/full direct and harness gates and capture exact version, Doctor order, isolation, cleanup, and package evidence.

Dependency order: T-1 first; T-2 and T-3 after T-1; T-4 independently; T-5 after T-4 classification; T-6 after T-2, T-3, and T-5 establish behavior/version; T-7 after T-1 through T-6.
