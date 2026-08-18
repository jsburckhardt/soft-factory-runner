# Research Brief: Prevent Doctor collapse when an unrelated tmux server is absent

## GitHub Issue
- **Issue:** #38
- **Title:** Prevent Doctor collapse when an unrelated tmux server is absent
- **Work Item:** project/work-items/38-prevent-doctor-collapse-when-an-unrelated-tmux-server-is-absent

## Scope Classification
- **Scope Type:** issue

## Problem Statement
Release 0.2.0 can convert a normal missing unrelated/default tmux server into an exception that escapes the tmux-targeting observation boundary. The outer Doctor boundary then replaces already completed observations with null repository facts and the same adapter-failure record for all 24 canonical checks. This loses actual readiness in valid custom-socket environments and contradicts the complete, non-fail-fast Doctor contract.

The issue classifies this as a backward-compatible defect correction targeting `0.2.1-beta.0`. This brief records existing evidence and constraints only.

## Acceptance Criteria

**Core**
- [ ] With a valid custom tmux context and no unrelated/default tmux server, Doctor completes without creating or targeting the absent server and reports its inventory as unchanged across an observation bounded to 2 seconds, 65,536 bytes, and 1,024 records.
- [ ] Given controlled observations that report repository `owner/repo` on default branch `main`, successful git, gh, tmux, node, and Copilot commands, and successful GitHub and Copilot authentication, the result retains `owner/repo` and `main`, contains each of the 24 canonical checks exactly once in contract order, and preserves those seven passing prerequisite outcomes instead of replacing them with generic adapter failures.
- [ ] For those same controlled inputs, human and JSON modes have the same readiness outcome, repository facts, ordered check outcomes, and value-free tmux targeting classification.

**Edge Cases**
- [ ] A finite matrix covers an absent socket and, on an existing selected socket, a 2,001 ms timeout, nonzero command exit, malformed output, 65,537 output bytes, 1,025 records, `EACCES` during socket identity lookup, and socket device/inode change during observation; only the absent socket leaves tmux targeting unchanged, while each genuine inventory failure produces a value-free tmux failure and preserves every completed non-tmux observation.
- [ ] A finite invoking-context matrix covers exactly one invoking variable present, a non-absolute socket tuple, an absent selected socket, two returned session records, and a returned session/pane that contradicts the invoking tuple; each returns its existing machine-readable classification respectively for partial, malformed, stale, ambiguous, or contradictory context before mutation, excludes supplied sentinel values from human and JSON output, and preserves every completed non-tmux observation.
- [ ] Two Doctor runs with the identical controlled inputs from the Core criteria return equal repository facts, readiness, ordered check outcomes, and tmux targeting classification; both leave the custom server inventory unchanged and the default server absent.

**Verification**
- [ ] Repository-local live-equivalent evidence uses an isolated real custom tmux server, proves the default server absent before and after Doctor, and supplies the controlled Core observations locally; the result retains `owner/repo` and `main`, preserves the seven passing prerequisites, avoids generic all-check failure, and leaves the custom-server inventory unchanged without network access or external credentials.
- [ ] User-facing release and Doctor documentation identifies `0.2.1-beta.0` as a backward-compatible correction, states that an absent unrelated server does not fail Doctor or get created, and retains value-free troubleshooting outcomes for genuine inventory failures and invalid invoking contexts.
- [ ] The package manifest, root lock metadata, official-asset catalog metadata, package/install fixtures, packed metadata, locally installed metadata, and current version documentation all report `0.2.1-beta.0`; repository diff evidence relative to the issue base shows no third-party dependency changes, and package proof uses no registry publication command or network access.
- [ ] `just verify-focused` and `just verify` both exit successfully, and the recorded output provides a finite criterion-to-evidence mapping.

## Repository Findings
- `DoctorService.evaluate` completes executable, repository, authentication, compatibility, and runtime observations before awaiting tmux targeting. It assembles the canonical check map only after targeting returns (`src/doctor-service.ts`, `DoctorService.evaluate`).
- `classifyDoctorTmuxTargeting` performs its first inventory before its `try`. That exception escapes directly. Selection failures are caught, but an exception from either post-selection inventory also escapes (`src/doctor-service.ts`, `classifyDoctorTmuxTargeting`).
- `DoctorService.run` converts any escaped evaluation exception through `unavailableResult`. This sets both repository facts to null and applies one failure to every `DOCTOR_CHECK_IDS` entry; `safeMessage` reduces every `Error` to `adapter failure`. These symbols explain the generic 24-check collapse (`src/doctor-service.ts`; `src/doctor.ts`).
- `captureDoctorTmuxInventories` derives the default as `${TMUX_TMPDIR ?? os.tmpdir()}/tmux-<uid>/default`. For parseable invoking evidence it inventories the invoking socket and unrelated default; otherwise it inventories default and deterministic standalone selectors. Both calls use `Promise.all` (`src/doctor-service.ts`).
- `TmuxPort.inventoryServerResources` is optional. Its absence throws before classification can produce targeting evidence and reaches the top-level collapse (`src/ports.ts`; `src/doctor-service.ts`).
- The live inventory first obtains device/inode through `fs.stat`. A pre-query `ENOENT` returns stable `absent\n` without invoking tmux. Other pre-query errors, including `EACCES`, become `TMUX_CONTEXT_REFUSED` with `unavailable-proof` (`src/live.ts`, `LiveTmuxPort.inventoryServerResources`, `socketIdentity`, `nodeErrorCode`).
- For an existing socket, live inventory runs shell-free `tmux -S <socket> list-panes -a -F <six fields>` with 2,000 ms timeout. It rejects nonzero exit, stdout over 65,536 bytes, NUL/CR, over 1,024 LF-counted records, or missing terminal LF. Returned ephemeral bytes combine device/inode JSON and pane output (`src/live.ts`, `LiveTmuxPort.inventoryServerResources`).
- `CommandExecutor` buffers complete stdout/stderr and checks inventory size only after completion. Timeout rejects after SIGTERM and a bounded SIGKILL escalation rather than returning a command result. The 65,536 limit is therefore an accepted-result check, not a collection retention cap (`src/live.ts`, `CommandExecutor.run`).
- After a successful query, any socket-identity lookup exception currently returns `absent\n`, regardless of code. Device/inode change returns `replaced\n` rather than throwing. These semantics differ from the issue distinction between normal absence and genuine lookup/replacement failures (`src/live.ts`, `inventoryServerResources`).
- Inventory validation checks terminator/control bytes and count bounds but not UTF-8 or the six field shapes. It relies on exact ephemeral byte comparison (`src/live.ts`; compare `src/tmux-target.ts`, `parseInvokingContextRecord`).
- `parseInvokingTmuxEvidence` classifies one missing variable as `partial-evidence` and non-absolute/invalid tuples as `malformed-evidence`. `selectTarget` maps absent selected sockets to `stale-server`, multi-record evidence to an ambiguity refusal, and mismatched socket/pane evidence to `contradictory-target` (`src/tmux-target.ts`; `src/live.ts`, `selectTarget`).
- `targetingEvidence` exposes only schema/kind, closed mode/reason, bounded facts, and unchanged booleans. `renderDoctor` derives human and JSON output from the same `DoctorResultV2`; inventory bytes, paths, IDs, names, cwd, tuples, PIDs, and sentinels remain outside the result (`src/doctor-service.ts`; `src/doctor.ts`; `src/doctor-render.ts`).
- Existing tests inject stable inventories for mode/reason coverage and include a real-server case where both custom and default servers exist and default resources change without directory-entry change. They do not cover the reported valid-custom plus absent-default composition or service-level preservation after inventory failure (`src/tmux-context.test.ts`, `classifies Doctor modes with closed value-free evidence`, `detects actual server-resource changes that leave socket-directory entries unchanged`).
- Commit `62ae5fd` (`fix(tmux): inventory actual doctor server resources`) introduced the current actual-resource path. It replaced directory listings, which converted every read failure to empty inventory, with explicit socket inventory and added `LiveTmuxPort.inventoryServerResources` (`git history`, `src/doctor-service.ts`, `src/live.ts`).
- Documentation promises explicit read-only inventory, no fallback creation or target mutation, and 2-second/65,536-byte/1,024-record bounds (`README.md`, Exact tmux context ownership; `docs/phase-4-repository-doctor.md`, Exact tmux targeting evidence; `PRD.md`, Exact invoking tmux ownership).
- The supplied incident reports a valid Sparkta custom socket at `/workspaces/sparkta/.devcontainer/.tmux-shared`, absent `/tmp/tmux-1000/default`, and 24 generic Doctor 0.2.0 adapter failures. At research time both paths were absent, so the valid-custom state and output could not be replayed. No persisted Sparkta Doctor artifact was found.
- Current release surfaces are `0.2.0`: `package.json`; top-level/root package entries in `package-lock.json`; `OFFICIAL_ASSET_VERSION` in `src/official-assets.ts`; assertions in `src/official-assets.test.ts`, `src/asset-cli.test.ts`, and `src/issue-36-repository.test.ts`; and `README.md`, `docs/README.md`, and `docs/phase-5-official-assets.md`. Packed and installed metadata are generated by asset tests rather than stored as current installed artifacts.

## Constraints
- Doctor must retain exactly one of each canonical 24 check ID in contract order, all blocking, without erasing independent observations (`CORE-COMPONENT-260812-repository-doctor-contract`; Decision Log 77, 81-83).
- Human and JSON forms derive from strict `DoctorResultV2` and preserve equal facts, checks, readiness, and evidence meaning (`ADR-260812-repository-doctor-readiness`; Decision Log 80, 82, 140).
- Target inventory is read-only: no fallback/default creation, selected/ambient/unrelated mutation, or ambient adoption; every command uses an explicit selector (`ADR-260817-invoking-tmux-context-targeting`; `CORE-COMPONENT-260817-exact-tmux-context-ownership`; Decision Log 176, 179).
- Only complete absence of both invoking variables permits fallback. Partial, malformed, stale, ambiguous, and contradictory evidence remain typed pre-mutation refusals (`CORE-COMPONENT-260817-exact-tmux-context-ownership`; `src/tmux-target.ts`).
- Each inventory operation is one attempt, at most 2,000 ms, with no polling or hidden retry, and with 65,536-byte/1,024-record bounds (`docs/phase-4-repository-doctor.md`; Decision Log 85).
- Missing socket state is distinct from failed proof. Ambiguous identity, command failure, malformed bytes, overflow, replacement, or unavailable proof must fail safely (`CORE-COMPONENT-260810-error-handling`; `CORE-COMPONENT-260817-exact-tmux-context-ownership`).
- Raw inventory, paths, IDs/names/cwds, tuples, server PIDs, sentinels, environment values, and secrets remain ephemeral. Only closed value-free classification and bounded facts may cross the result boundary (`CORE-COMPONENT-260814-tmux-identity-diagnostics`; Decision Log 130, 178).
- Subprocesses use argument arrays, `shell: false`, bounded cancellation, allowlisted environment, and redacted diagnostics (`CORE-COMPONENT-260810-subprocess-execution`).
- Issue #38 is a backward-compatible defect correction. Governance assigns PATCH and requires package, lock, official asset, fixtures, generated package/install metadata, and current docs to agree without third-party dependency churn or publication (`CORE-COMPONENT-260815-package-semver-governance`; AGENTS.md; Decision Log 152, 154-156).
- Existing contracts govern this issue; no new ADR or core-component is requested.

## Relevant ADRs and Core-Components
- `project/architecture/ADR/ADR-260812-repository-doctor-readiness.md` — complete 24-check Doctor reporting, value-free evidence, command bounds, and cleanup.
- `project/architecture/ADR/ADR-260817-invoking-tmux-context-targeting.md` — exact custom-socket/fallback selection and read-only Doctor targeting.
- `project/architecture/ADR/ADR-260814-tmux-identity-failure-recovery.md` — original-byte, strict, value-free identity and absence-versus-unknown behavior.
- `project/architecture/core-components/CORE-COMPONENT-260812-repository-doctor-contract.md` — ordered checks, non-fail-fast observations, schema, bounds, confidentiality, and rendering.
- `project/architecture/core-components/CORE-COMPONENT-260817-exact-tmux-context-ownership.md` — selector ownership, invalid contexts, no mutation/adoption, and ephemeral inventory.
- `project/architecture/core-components/CORE-COMPONENT-260814-tmux-identity-diagnostics.md` — original-byte and bounded value-free confidentiality rules.
- `project/architecture/core-components/CORE-COMPONENT-260810-error-handling.md` — typed safe failure and ambiguity handling.
- `project/architecture/core-components/CORE-COMPONENT-260810-subprocess-execution.md` — shell-free bounded subprocess requirements.
- `project/architecture/core-components/CORE-COMPONENT-260815-package-semver-governance.md` — PATCH classification and synchronized version surfaces.
- `project/architecture/ADR/DECISION-LOG.md` records these artifacts and relevant decisions 77-85, 123, 130, 135-142, 152-156, and 172-179.

## Risks and Open Questions
- The reported Sparkta state was not live at research time. Exact installed 0.2.0 bytes, environment, root exception, and full incident output are unavailable for direct comparison.
- Checked-in inventory already maps pre-query `ENOENT` to `absent\n`, yet the incident attributes collapse to absent default socket. It is unresolved whether another filesystem error, post-query disappearance, installed-byte drift, environment-specific path, or separate adapter exception occurred.
- Inventory-before-`try` and post-selection inventory have asymmetric containment, creating broad information-loss risk.
- With `Promise.all`, one rejected inventory discards the other result while the other operation may finish. This path uses a command runner separate from the aggregate Doctor runner and relies on its own timeout.
- Post-query lookup errors are conflated with absence, while device/inode replacement is returned as inventory bytes rather than typed failure; genuine proof failures can be obscured.
- The byte check follows unbounded buffering. Output is rejected over 65,536 bytes but may already consume arbitrary memory.
- Inventory malformed-output checks do not enforce UTF-8 or field shape. Tmux ordering/format behavior determines byte stability.
- Exact prerelease `0.2.1-beta.0` must replace many current 0.2.0 assertions and generated surfaces; omission of any governed surface is a release-consistency risk.
