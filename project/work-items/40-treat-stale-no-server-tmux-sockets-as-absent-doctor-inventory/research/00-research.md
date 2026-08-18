# Research Brief: Treat stale no-server tmux sockets as absent Doctor inventory

## GitHub Issue
- **Issue:** #40
- **Title:** Treat stale no-server tmux sockets as absent Doctor inventory
- **Work Item:** project/work-items/40-treat-stale-no-server-tmux-sockets-as-absent-doctor-inventory

## Scope Classification
- **Scope Type:** issue

## Problem Statement
In `0.2.1-beta.0`, Doctor treats an unrelated tmux socket filesystem entry as a genuine inventory-proof failure when `tmux -S <socket> list-panes` exits nonzero with `no server running`. This differs from both an ENOENT path and a live server whose inventory cannot be proved. In the reported Sparkta state, the invoking custom server is valid, but Doctor reports `invalid-context`/`unavailable-proof` with both unchanged booleans false. The issue is a research-stage backward-compatible defect-correction handoff only; this brief does not select a correction.

## Acceptance Criteria

**Core**
- [ ] With a valid invoking custom server and an unrelated existing socket entry whose bounded inventory query exits nonzero with `no server running`, Doctor reports targeting mode `invoking-valid`, no refusal reason, and both `ambientUnchanged` and `unrelatedUnchanged` true.
- [ ] For that stale-entry case, controlled repository `owner/repo` and default branch `main` facts remain present; the 24 canonical checks occur exactly once in contract order; and successful git, gh, tmux, node, Copilot, GitHub-authentication, and Copilot-authentication observations remain passing.
- [ ] Human and JSON output agree on readiness, repository facts, ordered check ID/pass-fail/evidence results, targeting mode, reason, and unchanged booleans, while excluding the two supplied socket paths, raw tmux identities and pane inventory, raw stderr, and unique sentinel values supplied through controlled observations.

**Edge Cases**
- [ ] A finite controlled matrix covers: the stale no-server entry; a live-server query that exits nonzero with stderr not classified as no-server; invalid UTF-8 inventory; inventory containing NUL or carriage-return bytes; inventory without a terminal newline; 65,537 output bytes; 1,025 records; and socket identity change during inventory. Only the stale no-server row reports `invoking-valid` with both unchanged booleans true; every other row reports `invalid-context`/`unavailable-proof` with both booleans false, while preserving the completed non-tmux observations named in Core.
- [ ] Two runs of every matrix row return equal readiness, repository facts, ordered check ID/pass-fail/evidence results, targeting mode, reason, and unchanged booleans. During each Doctor run, the invoking and unrelated socket-entry type/device/inode observations and the inventories of the finite isolated live servers used by that row are equal before and after; no socket entry or tmux server is created or deleted.

**Verification**
- [ ] Repository-local live-equivalent evidence uses an isolated live custom server and an existing stale default socket entry, demonstrates that the custom query succeeds and the stale query returns `no server running`, and proves the Core targeting result plus bounded before/after non-mutation observations without external credentials; scenario-created resources are absent after cleanup so the evidence can be repeated.
- [ ] User-facing release and Doctor documentation identifies `0.2.1-beta.1` as the backward-compatible correction, describes the stale no-server outcome, and distinguishes it from value-free live-server inventory failures.
- [ ] Package manifest, root lock metadata, official-asset metadata, package/install fixtures, packed metadata, locally installed metadata, and current-version documentation all report `0.2.1-beta.1`; manifest and lock diff evidence shows no third-party dependency change; and offline package evidence completes without registry fetch or publication commands.
- [ ] Direct `just verify-focused` and `just verify` both exit successfully, with recorded finite criterion-to-evidence results for the matrix and live-equivalent case.

## Repository Findings
- Issue #40 has a delimited `## Acceptance Criteria` section with ordered Markdown checkboxes under Core, Edge Cases, and Verification. The criteria above are verbatim and in issue order.
- Branch HEAD `3a9729d` merges PR #39 and implementation `e6141c9` for Issue #38. This merged `0.2.1-beta.0` behavior is the direct base for Issue #40 (`git log`; `project/work-items/38-prevent-doctor-collapse-when-an-unrelated-tmux-server-is-absent/verify/summary.md`).
- `LiveTmuxPort.inventoryServerResources` reads socket device/inode first. Pre-query `ENOENT` returns an empty buffer without invoking tmux; any other identity failure is `TMUX_CONTEXT_REFUSED`/`unavailable-proof` (`src/live.ts`).
- For an existing entry, that method invokes shell-free `tmux -S <socket> list-panes -a -F <six-field-format>` once with a 2,000 ms timeout and 65,536-byte stdout retention. `CommandExecutor.run` drains and counts all stdout while retaining no more than that cap; timeout rejects after SIGTERM and a one-second SIGKILL escalation (`src/live.ts`, `CommandExecutor.run`).
- The beta.0 inventory path classifies every completed nonzero result as `unavailable-proof` without inspecting stderr. It therefore does not recognize `no server running`. Separately, `LiveTmuxPort.observeIssueWindowName` already recognizes `/no server running|can.t find session|no sessions/i` on nonzero results and returns false, but Doctor inventory does not use that method (`src/live.ts`).
- A zero-exit inventory is rejected as `unavailable-proof` for more than 65,536 total stdout bytes, NUL or CR, more than 1,024 LF records, missing terminal LF, or lossy UTF-8 decoding. Post-query identity failure, including ENOENT, and device/inode replacement are also unavailable proof (`src/live.ts`, `inventoryServerResources`).
- `captureDoctorTmuxInventories` uses the parseable invoking custom socket as ambient and the explicit default socket as unrelated, samples both concurrently with `Promise.all`, and repeats the pair before and after target selection (`src/doctor-service.ts`).
- If either before/after sample rejects, `classifyDoctorTmuxTargeting` returns schema-1 targeting evidence with mode `invalid-context`, reason `unavailable-proof`, `bounded` and `inventoryMeasured` true, and both unchanged booleans false. A before-sample rejection prevents `selectTarget`; an after-sample rejection discards its earlier mode (`src/doctor-service.ts`).
- `DoctorService.evaluate` completes repository, command, authentication, compatibility, and runtime observations before targeting. Issue #38 containment keeps this targeting failure on `command.tmux`; it no longer invokes `unavailableResult` to replace all 24 checks. The tmux failure message is `The invoking tmux context was refused.` (`src/doctor-service.ts`).
- `renderDoctor` derives JSON and deterministic human output from the same `DoctorResultV2`. `DoctorTmuxTargetingEvidenceV1` carries only schema/kind, closed mode/reason, bounded/measured flags, and unchanged booleans; raw paths, identity, inventories, and stderr are not result fields (`src/doctor-render.ts`; `src/doctor.ts`).
- Existing Issue #38 tests cover pre-query ENOENT, timeout, generic nonzero, invalid UTF-8, 65,537 bytes, 1,025 records, EACCES, post-query ENOENT, replacement, NUL/CR, and missing LF. The real custom-server case uses an ENOENT default path. No test constructs an existing stale socket whose query returns `no server running` (`src/issue-38-tmux-inventory.test.ts`; `src/tmux-context.test.ts`; `src/doctor-integration.test.ts`).
- Commit `e6141c9` changed pre-query ENOENT to empty inventory, contained inventory failures to `command.tmux`, added bounded retention and UTF-8 validation, and synchronized release surfaces to `0.2.1-beta.0`. Its package/lock/catalog diff changed no dependency lines (`git diff 28c96f0..e6141c9`).
- Current beta.0 version surfaces are `package.json`, both root `package-lock.json` version values, `OFFICIAL_ASSET_VERSION` in `src/official-assets.ts`, package/install assertions in `src/asset-cli.test.ts` and `src/official-assets.test.ts`, synchronization assertions in `src/issue-36-repository.test.ts`, and current guidance in `README.md`, `docs/README.md`, `docs/phase-4-repository-doctor.md`, and `docs/phase-5-official-assets.md`. Packed and installed metadata are generated transiently by package tests rather than committed as standalone artifacts.
- The user-supplied Sparkta snapshot records a valid custom server with panes `%0` and `%6`; an unrelated default path that was a Unix socket entry while its explicit query exited nonzero with `no server running`; and beta.0 targeting `{mode: invalid-context, reason: unavailable-proof, ambientUnchanged: false, unrelatedUnchanged: false}` while other completed checks remained preserved. These facts match the checked-in beta.0 path.
- The supplied live state was not reproducible at research time: `/workspaces/sparkta` and both supplied socket paths were absent, and the available global `soft-factory` package was `0.1.0`. The snapshot is therefore user-supplied incident evidence rather than a fresh local observation.

## Constraints
- Preserve exactly 24 canonical blocking checks in contract order and completed independent observations (`CORE-COMPONENT-260812-repository-doctor-contract.md`; Decisions 135, 140, 179, 181).
- Preserve read-only explicit-`-S` inventory. Doctor cannot create, delete, adopt, or mutate invoking, unrelated/default, fallback, or ambient tmux resources (`ADR-260817-invoking-tmux-context-targeting.md`; `CORE-COMPONENT-260817-exact-tmux-context-ownership.md`; Decisions 172-182).
- Preserve one query, 2,000 ms bound, 65,536-byte retention/acceptance limit, 1,024-record limit, strict original-byte validation, and no polling, retry, or historical fallback (`src/live.ts`; Decision 182).
- Keep these outcomes distinct: pre-query ENOENT is empty without a client call; the issue-specific existing stale entry reports bounded no-server; live nonzero not classified as no-server, malformed bytes, timeout, overflow, post-query identity loss, and replacement remain unavailable proof.
- Raw `TMUX`/`TMUX_PANE`, socket paths and identities, session/window/pane values, cwd, inventory bytes, raw stderr, sentinels, environment values, secrets, and hashes remain ephemeral and absent from human/JSON output (`CORE-COMPONENT-260814-tmux-identity-diagnostics.md`; Decisions 130, 178).
- Ambiguous filesystem/process evidence must fail safe. External commands remain shell-free, bounded, cancellable, environment-allowlisted, and redacted (`CORE-COMPONENT-260810-error-handling.md`; `CORE-COMPONENT-260810-subprocess-execution.md`).
- Human and JSON forms continue to represent the same `DoctorResultV2` readiness, repository facts, ordered checks, and evidence meaning (`ADR-260812-repository-doctor-readiness.md`).
- The issue classifies a backward-compatible defect correction and requires exact prerelease `0.2.1-beta.1` across governed surfaces without third-party dependency churn (`CORE-COMPONENT-260815-package-semver-governance.md`).
- Existing architecture governs this issue; no new API, configuration/default, database/data migration, service, container, or deployment surface is authorized.

## Relevant ADRs and Core-Components
- `project/architecture/ADR/ADR-260812-repository-doctor-readiness.md` — complete non-fail-fast Doctor result, bounded tmux observations, value-free evidence, and cleanup.
- `project/architecture/ADR/ADR-260817-invoking-tmux-context-targeting.md` — custom-socket targeting, explicit selectors, read-only inventory, and pre-mutation refusal.
- `project/architecture/ADR/ADR-260814-tmux-identity-failure-recovery.md` — strict original-byte parsing and absence-versus-unknown semantics.
- `project/architecture/core-components/CORE-COMPONENT-260812-repository-doctor-contract.md` — exact checks, `DoctorResultV2`, preservation, rendering, confidentiality, and timing.
- `project/architecture/core-components/CORE-COMPONENT-260817-exact-tmux-context-ownership.md` — ephemeral inventory, no mutation/adoption, bounds, and typed unavailable proof.
- `project/architecture/core-components/CORE-COMPONENT-260814-tmux-identity-diagnostics.md` — bounded value-free byte diagnostics and confidentiality.
- `project/architecture/core-components/CORE-COMPONENT-260810-error-handling.md` and `CORE-COMPONENT-260810-subprocess-execution.md` — fail-safe ambiguity and safe bounded subprocesses.
- `project/architecture/core-components/CORE-COMPONENT-260815-package-semver-governance.md` — PATCH classification and synchronized version surfaces.
- `project/architecture/ADR/DECISION-LOG.md` — relevant Decisions 123, 130, 135-140, 142-149, 151-159, and 172-182; notably 180 defines ENOENT absence, 181 contains genuine failures, and 182 defines inventory bounds.

## Risks and Open Questions
- The Sparkta state and beta.0 output could not be replayed locally; exact environment, tmux version/locale, entry lifetime, and raw external stderr are unavailable beyond the supplied snapshot.
- The safe boundary for recognizing the external-tool no-server outcome across tmux version/locale variations is unresolved at Research; generic live-server nonzero must remain distinct.
- Concurrent `Promise.all` sampling means one selector failure discards the peer result for that sample, although the peer process still settles under its own bound.
- The architecture currently describes every nonzero targeting-inventory command as unavailable proof. Issue #40 requires one narrower stale-entry outcome, so prose and required behavior are presently in tension; resolving that semantics is outside this brief.
- ENOENT is already stable empty inventory, but the matrix criterion does not explicitly state its resulting mode/reason; existing architecture treats it as normal absence.
- Version synchronization spans source, lock, catalog, assertions, generated packed/installed metadata, and several current documents; stale beta.0 references are a release-consistency risk.
