# Implementation Notes: Issue #31

## Status

Implement is complete. Final verification and acceptance remain owned by Verify.

## Summary

Implemented the committed printable-pipe tmux identity contract for normal Runner and isolated Doctor paths, preserved recovery and cleanup safety, added APS Semantic Versioning governance, released the finite package inventory as 0.1.1, and updated current user and operational guidance.

## Completed Tasks

- T-1: Shared closed byte grammar and value-free diagnostics.
- T-2: Normal `LiveTmuxPort` transport, rejection, repeat, ownership, and overlap proof.
- T-3: Doctor transport, packaged two-row proof, rejection, cleanup, and overlap proof.
- T-4: APS-style Semantic Versioning delivery directives.
- T-5: Exact 0.1.1 release inventory and package/install proof.
- T-6: Current behavior, recovery, Doctor, release, and upgrade documentation.
- T-7: Targeted, focused, full, harness, package, inventory, and resource evidence.

## Implementation

- `src/tmux-identity.ts` parses `Buffer` bytes and exports `#{window_id}|#{pane_id}` and `#{window_id}|#{pane_id}|#{pane_current_path}` as the shared formats.
- Creation accepts exactly `@<digits>|%<digits><LF>`. Observation isolates only the first two vertical bars and retains the remaining valid UTF-8 cwd bytes, including additional vertical bars.
- Exactly one terminal LF is required. CR, CRLF, extra/interior LF, malformed IDs, empty/invalid/NUL cwd, multiple records, HT, sanitized underscore, colon, and other C0 structural forms fail without a partial identity.
- `vertical_bar` extends the schema-v1 value-free vocabulary while `horizontal_tab` remains readable for legacy persisted diagnostics. Existing 8-record, 8-field, and 32-token caps remain exact.
- Normal `LiveTmuxPort` and Doctor both import the shared formats. Observation nonzero remains absence; ownership and retry authorization are unchanged.
- Doctor retains its private `-S` server, private environment, bounded streams, deadlines, exact 24 checks, and unconditional cleanup behavior.

## Validation Matrix

| Validation | Result | Concrete evidence |
| --- | --- | --- |
| V-1 shared grammar | Passed | `src/tmux-identity.test.ts` proves the six-byte record, delimiter-bearing UTF-8 cwd, closed rejection classes, no partial identity, 8/8/32 caps, and sentinel confidentiality. |
| V-2 normal client rows | Passed | Explicit `clientUtf8: true` and `false` rows each ran twice; calls and resource inventories matched, creation was six bytes with no HT, and prohibited-access arrays were empty. |
| V-3 normal safety | Passed | Every malformed adapter row maps to `TMUX_IDENTITY_MALFORMED`; `src/recovery-control.test.ts` preserves exact clean fetched-HEAD authorization, immediate zero-name recheck, one create attempt, same-name refusal, and diagnostic non-authorization. |
| V-4 packaged Doctor | Passed | Built UTF-8 and non-UTF8 fake-protocol rows each ran twice, accepted six-byte creation, emitted canonical 24-check JSON, used only private sockets, and restored the pre-run Doctor workspace inventory. |
| V-5 Doctor failures/overlap | Passed | 13 create and 15 observe malformed rows map to `malformed-output`; prior failure, timeout, cancellation, cutoff, and residual-resource cases remain covered. Two barrier-held probes used distinct servers, helper PIDs, sockets, workspaces, and then proved all absent. |
| V-6 APS SemVer | Passed | Documentation tests prove each of six exact one-line `You MUST` directives once, in preserved surrounding order, with stable/pre-1.0 major/minor/patch classification. |
| V-7 inventory | Passed | Product metadata is 0.1.1 at package, both lock roots, official catalog, fixture, and current docs; dependency 0.1.0 entries and package allowlist remain unchanged. |
| V-8 package smoke | Passed | Dry-run reports `soft-factory-runner@0.1.1` and `soft-factory-runner-0.1.1.tgz`; packed tar metadata, clean installed metadata, clean generated manifest, and proved 0.1.0 manifest reconvergence report 0.1.1; repeat install is a no-op. |
| V-9 documentation | Passed | 33 documentation tests cover both client states, closed framing, cwd retention, confidentiality, local upgrade/reinstall, metadata confirmation, recommended asset reconvergence, and no registry or `--version` claim. |
| V-10 root and harness gates | Passed | Direct focused/full recipes and focused/full harness delegates returned success with 23 suites and 556 tests. |

Verbose targeted results: transport/Doctor matrix 5 suites and 202 tests; recovery authorization 1 suite and 54 tests; package/install 2 suites and 17 tests; documentation 1 suite and 33 tests.

## Acceptance Evidence

| AC | Evidence |
| --- | --- |
| AC-1 | `src/tmux-identity.test.ts`, `src/doctor-tmux.test.ts`, and `src/doctor-integration.test.ts` execute explicit UTF-8 and non-UTF8 normal and Doctor rows without inherited locale, TMUX, or default-server state. |
| AC-2 | Shared constants and byte parser accept only exact pipe/LF creation and observation records; tests compare exact IDs and nonempty cwd, including `/tmp/na|mé|suffix`. |
| AC-3 | Shared and adapter rejection catalogs cover empty, missing/extra fields, records and terminators, invalid/partial IDs, empty/invalid/NUL cwd, HT, underscore, colon, CR/CRLF, and C0 separators. Normal returns `TMUX_IDENTITY_MALFORMED`; Doctor reports `malformed-output`; no partial identity is exposed. |
| AC-4 | The 54-test recovery-control run proves diagnostics do not authorize retry, same-name resources are not inspected/adopted/modified, mismatched ownership/HEAD/dirtiness refuse, and an authorized retry performs one immediate name check and one create attempt. |
| AC-5 | Diagnostics retain only phase, exit/count/bounded structural facts. Tests prove exact 8/8/32 limits, closed tokens, legacy readability, and absence of stdout/stderr, cwd/path, identity, command, environment, and unrelated-run sentinels. |
| AC-6 | Built inventory is 24 unique IDs in canonical order. Packaged success, every functional failure/timeout/cancellation case, and overlap tests require server, pane processes, socket, and workspace absence before successful cleanup evidence. |
| AC-7 | `AGENTS.md` contains exactly six APS-style absolute Semantic Versioning directives covering stable incompatible major, compatible minor, pre-1.0 incompatible minor, defect patch, and explicit 1.0.0 stabilization. |
| AC-8 | Package, top-level lock, root lock package, official asset catalog, current fixture, packed tarball, installed package, generated manifest, and current docs identify 0.1.1. Only the two Runner lock version fields changed; dependency metadata remains stable. |
| AC-9 | Repository bytes `[0x40,0x31,0x7c,0x25,0x31,0x0a]` prove exit 0, stdout 6, stderr 0, one terminal LF, and no HT. The built Doctor path accepts the same shape twice in both client rows without external tmux or locale. |
| AC-10 | Each client row repeats with equal result/call/resource inventory. Barrier-controlled normal flows return only owner-specific identities/cwds. Barrier-controlled Doctor probes have distinct server identities, helper lineages, sockets, and workspaces and end fully absent. |
| AC-11 | Controlled fixture facts set inherited locale, inherited TMUX, default server, credentials, network, and Sparkta access false; prohibited-access arrays are empty. Doctor uses temporary fake executables, private sockets, and before/after workspace inventories only. No external live dependency was used. |
| AC-12 | README and current guides document both client states, portable framing without raw values, exact local 0.1.0 to 0.1.1 upgrade or clean reinstall, installed metadata confirmation, and official-asset manifest reconvergence. |
| AC-13 | Direct `just verify-focused` and `just verify` pass. Harness envelopes report `status: ok`, correct focused/full scopes, delegated root recipes, and exit code 0. Targeted matrix, package, Doctor-order, repeat, overlap, and inventory evidence is inspectable in tests and this note. |

## Exact Version Inventory

| Surface | Version |
| --- | --- |
| `package.json` | 0.1.1 |
| `package-lock.json` top level | 0.1.1 |
| `package-lock.json` root package | 0.1.1 |
| `OFFICIAL_ASSET_VERSION` | 0.1.1 |
| Package/install current fixture | 0.1.1 |
| Dry-run/tarball/clean install | 0.1.1 |
| Clean and reconverged generated manifests | 0.1.1 |
| Current README/docs | 0.1.1 |
| `get-package-type` dependency | 0.1.0 unchanged |
| `yocto-queue` dependency | 0.1.0 unchanged |

## Doctor Contract and Resource Proof

Built `DOCTOR_CHECK_IDS` count and unique count are both 24, in this order:

```text
repository.git-membership
repository.primary-worktree
repository.git-common-directory
repository.github-identity
repository.default-branch
command.git
command.gh
command.tmux
command.node
command.copilot
authentication.github-cli
authentication.copilot-cli
compatibility.rpiv-agent
compatibility.runner-protocol
compatibility.configuration
compatibility.worktree-root
compatibility.state-root-writable
compatibility.trees-ignored
compatibility.runtime-state-ignored
compatibility.result-contract
runtime.trees-ownership
runtime.state-readable
runtime.locks-interpretable
runtime.required-paths-creatable
```

Normal overlap creates exactly one resource per owner and no cross-match. Doctor overlap proves two arrivals with distinct managed server PIDs, dashboard/issue helper IDs, socket paths, and workspace roots; both process inventories finish at size 0, both sockets are false, and both workspaces are absent. Built repeated Doctor tests restore the exact pre-probe temporary-workspace inventory.

## Documentation Evidence

- Updated `README.md`, `docs/README.md`, `docs/phase-1-issue-run.md`, `docs/phase-3-recovery-operations.md`, `docs/phase-4-repository-doctor.md`, `docs/phase-5-official-assets.md`, and `PRD.md`.
- Setup/behavior/user capability impact: README now describes portable client-state behavior and exact local 0.1.1 package use.
- Usage and migration impact: README and Phase 5 give build, pack, upgrade, uninstall/reinstall, installed metadata, recommended asset convergence, and manifest confirmation commands.
- Operational impact: issue-run, recovery, and Doctor guides describe exact framing, rejection, value-free diagnostics, private isolation, and cleanup.
- Explanatory architecture impact: PRD transport requirements were aligned to the committed ADR/core-component contract.
- API documentation: no impact; Runner adds no network API or specification.
- Configuration documentation: no impact; no option, default, or configuration migration changed.
- Data/database migration: no impact. The only migration guidance is local package/official-manifest reconvergence from 0.1.0.
- Deployment/runbook scope: no service, daemon, container, registry-publication, or remote deployment procedure changed.

## Architecture Adherence

Implementation stays within revised `ADR-260814-tmux-identity-failure-recovery`, `ADR-260812-repository-doctor-readiness`, `CORE-COMPONENT-260814-tmux-identity-diagnostics`, `CORE-COMPONENT-260812-repository-doctor-contract`, and new `CORE-COMPONENT-260815-package-semver-governance`. No implementation-stage ADR or core-component change was required, and no architecture or Plan deviation occurred. Existing retry authorization, no-adoption, diagnostics, 24-check order, private isolation, bounds, deadlines, and cleanup contracts remain intact.

## Root and Harness Validation

- `just verify-focused`: passed 23 suites, 556 tests, and `git diff --check`.
- `harness checks --focused --json`: exit 0, `status: ok`, `scope: focused`, delegated `just verify-focused`, 23 suites/556 tests.
- `just verify`: passed ESLint, Prettier, typecheck, 23 suites/556 tests, coverage, build, and `git diff --check`. Coverage totals: 89.1% statements, 85.14% branches, 95.85% functions, 90.7% lines; `tmux-identity.ts` is 100% in all categories.
- `harness checks --json`: exit 0, `status: ok`, `scope: full`, delegated `just verify`, 23 suites/556 tests.
- `npm pack --dry-run --json`: `soft-factory-runner@0.1.1`, filename `soft-factory-runner-0.1.1.tgz`.

## Harness Friction Drain

- Coordinator `rpiv`: 0 pending; no record or clear required.
- Research `rpiv-research`: 4 pending persisted to `.harness/records/retro/2026-08-15/002-issue-31-rpiv-research.md`, read back as schema 1.2 with matching plan/agent and all 4 entries, then clear returned `status: ok`, `cleared: 4`.
- Plan `rpiv-planner`: 6 pending persisted to `.harness/records/retro/2026-08-15/001-issue-31-rpiv-planner.md`, read back as schema 1.2 with matching plan/agent and all 6 entries, then clear returned `status: ok`, `cleared: 6`.
- Implement `rpiv-implementer`: 12 pending persisted to `.harness/records/retro/2026-08-15/003-issue-31-rpiv-implementer.md`, read back as schema 1.2 with matching plan/agent and all 12 entries, then clear returned `status: ok`, `cleared: 12`.
- Post-clear JSON lists for all four required agents returned exit 0, `status: ok`, and empty observations. The verifier buffer was not accessed or mutated.

## Evidence Artifacts

- Original Research handoff: `project/work-items/31-support-locale-compatible-tmux-identities-and-release-0-1-1-under-semver-governance/research/00-research.md`.
- Completed task evidence: `project/work-items/31-support-locale-compatible-tmux-identities-and-release-0-1-1-under-semver-governance/plan/02-task-breakdown.md`.
- Durable retros: the three `.harness/records/retro/2026-08-15/*issue-31*.md` records listed above.
