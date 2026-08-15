# Test Plan: Issue #31

## Test V-1: Shared transport accepted and rejected byte grammar

- **Type:** Unit and schema compatibility
- **Task:** T-1
- **Acceptance Criteria:** AC-2, AC-3, AC-5, AC-9, AC-13
- **Priority:** Critical

### Setup
Use repository-owned `Buffer` inputs and the shared parser/diagnostic builder. Do not start tmux or inherit environment state. Define the accepted catalog as exactly one create form and one observe form, each with exactly one terminal LF. Include cwd values with multibyte UTF-8 and embedded vertical bars.

### Steps
1. Parse `@1|%1<LF>` and assert six stdout bytes, zero stderr bytes, one logical record, no HT, and exact IDs.
2. Parse `@1|%1|/tmp/na|mé<LF>` and assert the parser uses only the first two separators and returns the remainder exactly.
3. Run both phases through the finite matrix: empty; missing fields; extra create field; malformed observe field before the second boundary; multiple records; invalid/partial window or pane IDs; empty, invalid UTF-8, or NUL cwd; no terminal LF; CR/CRLF; extra LF; and unsupported printable (`:`, `_`) or control (HT and other C0) structural separators.
4. Assert every malformed zero-exit input throws `TMUX_IDENTITY_MALFORMED` and returns no partial identity; retain nonzero observe as absence at its adapter boundary.
5. Verify diagnostic record/field/token caps remain 8/8/32, `vertical_bar` is value-free, legacy `horizontal_tab` diagnostics remain readable, and unknown tokens fail strict schema validation.
6. Scan serialized errors, snapshots, events, reports, logs, Doctor evidence, and rendering fixtures for identity/path/command/environment/unrelated-run sentinels.

### Expected Result
Only the two declared forms parse. Embedded vertical bar remains cwd data. Every rejected class fails safely without partial identity. Six-byte facts, schema compatibility, caps, and confidentiality all match the architecture contract.

### Expected Evidence
- Accepted/rejected byte-form table with phase, expected code, and parse result.
- Exact six-byte/count/terminator/no-HT assertions.
- 8/8/32 diagnostic snapshots and sentinel scan output.

## Test V-2: Normal LiveTmuxPort two-row client-state matrix and repetition

- **Type:** Adapter integration
- **Task:** T-2
- **Acceptance Criteria:** AC-1, AC-2, AC-9, AC-10, AC-11, AC-13
- **Priority:** Critical

### Setup
Use a protocol-aware controlled `CommandRunner` that substitutes the actual `-F` format, then applies fixture-owned client facts. Row UTF-8 declares `clientUtf8: true`; row non-UTF8 declares `clientUtf8: false` and applies the tmux 3.7b control-byte sanitizer model. Both rows declare no inherited locale, `TMUX`, default socket, credentials, or network. Use temporary owner-specific cwd values, including UTF-8 and vertical bar.

### Steps
1. For each row, invoke normal `createIssueWindow` and `observe` through `createLivePorts`.
2. Assert the captured normal create and observe format arguments use vertical bars and exactly LF-terminated fake responses.
3. Assert one creation returns exactly one window/pane identity and one observation returns those exact IDs and expected cwd.
4. Assert the non-UTF8 sanitizer would alter an HT format but leaves the requested printable format unchanged.
5. Repeat each row once from the same declared facts and compare complete result, call, and resource inventories.
6. Assert tripwires record no ambient/default tmux, external locale, credentials, network, Sparkta, or unowned-resource access.

### Expected Result
Both rows and both repetitions produce the same successful normal transport behavior. The create record is six bytes with no HT. No external or ambient state contributes to the result.

### Expected Evidence
- Two-row plus repeat matrix with explicit setup facts, exact commands, IDs/cwd, byte counts, and equality result.
- Sanitizer before/after proof for old HT versus new vertical bar.
- Empty prohibited-access tripwire inventory.

## Test V-3: Normal rejection, ownership, retry, diagnostic, and overlap safety

- **Type:** Integration and concurrency
- **Task:** T-2
- **Acceptance Criteria:** AC-3, AC-4, AC-5, AC-10, AC-11, AC-13
- **Priority:** Critical

### Setup
Use temporary repositories and controlled tmux/process/Git adapters with deterministic IDs and barriers. Seed exact and inexact `starting_tmux` ownership states. Configure two distinct issue owners with distinct names, IDs, and cwd values for one forced overlap.

### Steps
1. Route each V-1 malformed create and observe class through normal adapter methods and assert `TMUX_IDENTITY_MALFORMED`, no partial identity, and one observation per boundary.
2. Re-run existing exact lock/lease/worktree/branch/fetched-HEAD/cleanliness and zero-candidate authorization tests.
3. Prove same-name presence, ownership mismatch, dirty worktree, HEAD mismatch, and action-race candidate cause zero adoption, modification, worker launch, or RPIV launch.
4. Prove an authorized retry performs one immediate name check and one creation attempt only; diagnostic presence does not alter authorization.
5. Start two distinctly owned normal flows, stop both at barriers after create and observe, then release them together.
6. Compare each returned identity/cwd with its owner and assert no cross-owned or extra window, pane, launch, or persistent resource.
7. Scan all failure and overlap evidence for value-bearing sentinels and prohibited access.

### Expected Result
Malformed output never authorizes or partially identifies a resource. Existing one-pass, ownership, no-adoption, and one-attempt rules remain exact. Overlapped flows remain disjoint.

### Expected Evidence
- Rejection-to-error table and one-pass call counts.
- Recovery authorization/refusal traces with mutation and launch counts.
- Two-owner overlap inventory showing exactly two distinct resource sets and no cross-match.

## Test V-4: Packaged Doctor two-row six-byte regression and repetition

- **Type:** Packaged functional integration
- **Task:** T-3
- **Acceptance Criteria:** AC-1, AC-2, AC-6, AC-9, AC-10, AC-11, AC-13
- **Priority:** Critical

### Setup
Build and locally pack the repository, install the tarball into a clean temporary prefix, and invoke the installed `soft-factory doctor --json` against controlled ready repositories. Provide protocol-aware fake executables only through each temporary PATH. The fake tmux derives output from the actual `-F` argument. Run explicit `clientUtf8: true` and `clientUtf8: false` fixture variants; the latter models control-byte sanitization. Snapshot ambient/default tmux tripwires and OS-temporary Doctor workspace inventory before each run.

### Steps
1. Run the installed Doctor once in each client-state row and once more as a repeat.
2. Capture create output facts and assert exit 0, exactly six stdout bytes, zero stderr bytes, one LF-terminated record, no HT, and exact identity acceptance.
3. Assert observe returns the same IDs and the physical expected workspace cwd.
4. Assert `command.tmux` passes only after the full protocol and output contains exactly `DOCTOR_CHECK_IDS` in its existing 24-item order.
5. Compare each repeat result and post-run resource inventory with its first run.
6. Prove server, dashboard/issue helpers, panes, private socket, configuration, and workspace are absent after every result.
7. Assert no default-server contact, external tmux 3.7b, ambient locale, network, credential, Sparkta, or unowned-resource access.

### Expected Result
The clean installed package path accepts the real six-byte no-HT shape in both client modes, repeats deterministically, emits the canonical 24 checks, and leaves no resource.

### Expected Evidence
- Installed-package two-row/repeat Doctor reports and fake protocol traces.
- Six-byte structure facts and exact 24-ID ordered list.
- Before/after resource and prohibited-access inventories.

## Test V-5: Doctor rejection, complete cleanup, and overlapping isolation matrix

- **Type:** Functional failure and concurrency integration
- **Task:** T-3
- **Acceptance Criteria:** AC-3, AC-5, AC-6, AC-10, AC-11, AC-13
- **Priority:** Critical

### Setup
Use injected Doctor workspaces, managed foreground servers, process observation, clocks, socket waiters, and protocol runners. Derive malformed create/observe output from the same finite V-1 matrix. Provide deterministic cancellation/cutoff and cleanup fault modes. For overlap, use a barrier and two separate probe tokens with distinct process and filesystem inventories.

### Steps
1. For every create rejection row, run the complete probe until `window-create`; assert failed `command.tmux`, operation `window-create`, reason `malformed-output`, and bounded diagnostic.
2. For every observe rejection row, run until `pane-observe`; assert the same mapping with operation `pane-observe`.
3. Re-run every existing startup, command, identity/cwd mismatch, overflow, timeout, cancellation, aggregate cutoff, cleanup-command, residual process/socket/workspace, and unrecorded-helper path.
4. Assert all normal failure returns wait for final server, pane process, socket, and workspace absence; controlled residual-uncertainty cases must fail rather than claim absence.
5. Run two probes concurrently, hold both after resource creation, prove distinct server identities/helper lineages/socket/workspace paths, then release cleanup.
6. Assert each overlapping result proves its own complete absence and does not signal, remove, or report the other probe resources.
7. Verify every result still contains exactly 24 ordered checks and all durable/rendered evidence remains value-free.

### Expected Result
Every malformed form maps to Doctor `malformed-output`; every success/failure/timeout/cancellation path settles cleanup before return; overlap remains isolated; Doctor order and confidentiality do not change.

### Expected Evidence
- Full create/observe rejection table with operation/reason and bounded diagnostic shape.
- Existing failure-path cleanup ledger and exact 24-ID order.
- Two-probe overlap timeline and final all-absent resource inventories.

## Test V-6: APS SemVer instruction contract

- **Type:** Static documentation and governance validation
- **Task:** T-4
- **Acceptance Criteria:** AC-7, AC-13
- **Priority:** High

### Setup
Read the APS `<instructions>` block from `AGENTS.md` and preserve the pre-change unrelated-line sequence as a test fixture or focused diff expectation. Use the six exact planned `You MUST` lines from T-4.

### Steps
1. Assert each planned line appears exactly once within `<instructions>`.
2. Assert every added line contains one imperative, absolute `MUST`, and no stage sequence, loop, branch, or workflow/control-flow wording.
3. Assert the rules distinguish stable major, backward-compatible minor, pre-1.0 incompatible minor, patch correction, and explicit 1.0.0 stabilization.
4. Assert every unrelated instruction and all content outside the insertion remain in the same order.
5. Run the documentation test through the focused and full root gates.

### Expected Result
AGENTS requires correct SemVer assignment before delivery in APS style without changing unrelated governance.

### Expected Evidence
- Exact-line assertion results.
- Minimal focused AGENTS diff and preserved-order result.
- Passing documentation suite output.

## Test V-7: Exact 0.1.1 authoritative inventory and lock integrity

- **Type:** Metadata contract and diff validation
- **Task:** T-5
- **Acceptance Criteria:** AC-8, AC-13
- **Priority:** Critical

### Setup
Define the finite tracked inventory: `package.json` version; top-level and root-package `package-lock.json` versions; `OFFICIAL_ASSET_VERSION`; current package/install fixture values; and current documentation values. Separately enumerate package-lock dependency versions/ranges that contain 0.1.0. Capture the pre-change dependency subtree and package file allowlist.

### Steps
1. Assert every authoritative Runner inventory item equals exactly 0.1.1.
2. Assert official catalog entries equal package version and generated manifest code derives version from the current catalog entry.
3. Assert unrelated dependency 0.1.0 versions/ranges, resolved URLs, integrity values, and dependency graph remain unchanged.
4. Inspect the package-lock diff and assert only top-level/root-package Runner release fields changed for versioning.
5. Assert the package files allowlist and official asset digest/inventory remain unchanged unless another planned source change explicitly requires it.

### Expected Result
All and only authoritative Runner release surfaces identify 0.1.1; dependency and package inventory remain stable.

### Expected Evidence
- Exact product-version inventory table.
- Unchanged dependency-0.1.0 and lock-integrity comparison.
- Focused package/lock/catalog diff and passing asset tests.

## Test V-8: Dry-run, packed, clean-installed, and manifest version smoke

- **Type:** Package and installation smoke
- **Task:** T-5
- **Acceptance Criteria:** AC-8, AC-12, AC-13
- **Priority:** Critical

### Setup
Use repository-controlled temporary directories only. Build through the root recipe. Run `npm pack --dry-run --json`, create a local tarball with `npm pack --json --pack-destination <temp>`, and install it with `npm install --ignore-scripts --no-audit --no-fund --omit=dev --prefix <temp-prefix> <local-tarball>`. Do not publish or contact a registry. Create one clean target repository and one target with schema-v1 manifest metadata at 0.1.0 but digest-proved current asset bytes.

### Steps
1. Assert dry-run JSON reports package version 0.1.1, expected filename, and unchanged allowed file inventory.
2. Inspect tarball `package/package.json` and clean installed `node_modules/soft-factory-runner/package.json`; require 0.1.1.
3. Invoke the installed CLI asset installation in the clean target; parse `.agents/manifest.json` and require one current 0.1.1 entry.
4. Invoke the installed CLI in the proved 0.1.0-manifest target; require safe reconvergence to 0.1.1 and a repeat no-op.
5. Assert no packed or installed authoritative metadata reports 0.1.0 and no dependency churn or external access occurred.

### Expected Result
Dry-run, tarball, clean installed package, clean generated manifest, and reconverged manifest all distinguish 0.1.1 from 0.1.0.

### Expected Evidence
- Pack JSON, tar member, installed package JSON, and both generated manifest excerpts containing 0.1.1.
- Clean/reinstall command statuses and repeat no-op evidence.
- Temporary inventory and no-publication/no-network proof.

## Test V-9: Current documentation, upgrade guidance, and confidentiality

- **Type:** Documentation contract
- **Task:** T-6
- **Acceptance Criteria:** AC-1, AC-5, AC-8, AC-12, AC-13
- **Priority:** High

### Setup
Read README and all current tmux, recovery, Doctor, official-asset, and docs-index guides named in T-6. Use static documentation assertions and tracked-file searches scoped away from historical work-item evidence.

### Steps
1. Assert documentation states support for explicit UTF-8 and non-UTF8 tmux client states and the printable vertical-bar/exact-LF forms.
2. Assert observation parsing retains all bytes after the first two separators and permits delimiter-bearing valid UTF-8 cwd.
3. Assert rejection, exact identity/cwd matching, ownership/retry, 24-Doctor-check, cleanup, and value-free raw-output boundaries remain stated.
4. Assert current version is 0.1.1 and guidance gives exact 0.1.0 upgrade/reinstall, installed-package metadata confirmation, official asset reconvergence, and generated manifest confirmation.
5. Assert guidance does not claim a `--version` command, registry publication, locale dependency, API/service, raw-value logging, or permissive sanitized output.
6. Search current product surfaces for stale HT-only or current-version 0.1.0 statements; allow 0.1.0 only as migration history or dependency data.

### Expected Result
Current documentation is accurate, actionable, confidentiality-preserving, and version-consistent.

### Expected Evidence
- Passing documentation assertions and scoped stale-text search.
- Copyable upgrade/reinstall/confirmation examples.
- Documentation diff inventory covering every affected current guide.

## Test V-10: Root-authoritative focused/full validation and final evidence audit

- **Type:** Stage boundary validation
- **Task:** T-7
- **Acceptance Criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11, AC-12, AC-13
- **Priority:** Critical

### Setup
Start from the completed implementation with repository-controlled temporary resources and no live external dependencies. Read `harness instructions checks --json`. Keep direct root recipes authoritative and harness checks as delegates. Prepare the final 13-row acceptance evidence table.

### Steps
1. Run direct `just verify-focused` and retain suite/test status plus matrix evidence.
2. Run `harness checks --focused --json`; require `status: ok`, delegated `just verify-focused`, and exit 0.
3. Run direct `just verify`; require lint, format, typecheck, full tests/coverage, build, and diff check to pass.
4. Run `harness checks --json`; require `status: ok`, delegated `just verify`, and exit 0.
5. Re-run or extract `npm pack --dry-run --json` and local package/install smoke evidence from V-8.
6. Audit exact inventories: two client rows and repeats; full rejection classes; normal and Doctor overlap; 8/8/32 diagnostics; unchanged authorization; 24 Doctor IDs/order; all-absent cleanup; 0.1.1 product surfaces; unchanged dependency versions; documentation; and prohibited-access tripwires.
7. Map every AC-1 through AC-13 to passing V-* evidence in `implementation/00-implementation.md` and confirm no row relies on inference or missing proof.

### Expected Result
Both direct root gates and both harness delegates pass. Every acceptance criterion has concrete inspectable evidence, and all finite matrices/inventories are complete.

### Expected Evidence
- Direct command logs for `just verify-focused` and `just verify`.
- Focused/full harness JSON envelopes with delegated command and exit evidence.
- Final 13-row coverage table plus version, package, Doctor, isolation, cleanup, confidentiality, and external-access inventories.
