# Action Plan: Prevent Doctor collapse when an unrelated tmux server is absent

## Feature
- **ID:** 38
- **Research Brief:** project/work-items/38-prevent-doctor-collapse-when-an-unrelated-tmux-server-is-absent/research/00-research.md
- **Branch:** `fix/38-prevent-doctor-collapse-when-unrelated-tmux-server-is-absent`
- **Scope:** Issue; Plan stage only
- **Release:** Backward-compatible PATCH correction targeting prerelease `0.2.1-beta.0`

## ADRs Created
- None. The accepted Doctor readiness, invoking-context targeting, tmux identity, and official-asset ADRs already determine the solution.

## Core-Components Created
- None.
- Amended [`CORE-COMPONENT-260817-exact-tmux-context-ownership`](../../../architecture/core-components/CORE-COMPONENT-260817-exact-tmux-context-ownership.md) in place to make absent-server inventory, genuine inventory failure containment, and 2,000 ms/65,536-byte/1,024-record streaming bounds explicit. Its ID, status, and creation date remain unchanged.
- Updated [`DECISION-LOG.md`](../../../architecture/ADR/DECISION-LOG.md) with decisions 180-182. No other architecture artifact requires amendment: the Doctor contract already requires complete non-fail-fast observations and human/JSON parity; error handling already requires typed safe failures; tmux diagnostics and exact ownership already require confidentiality; SemVer governance already assigns PATCH corrections and synchronized local package proof.

## Acceptance Criteria
- **AC-1:** With a valid custom tmux context and no unrelated/default tmux server, Doctor completes without creating or targeting the absent server and reports its inventory as unchanged across an observation bounded to 2 seconds, 65,536 bytes, and 1,024 records.
- **AC-2:** Given controlled observations that report repository `owner/repo` on default branch `main`, successful git, gh, tmux, node, and Copilot commands, and successful GitHub and Copilot authentication, the result retains `owner/repo` and `main`, contains each of the 24 canonical checks exactly once in contract order, and preserves those seven passing prerequisite outcomes instead of replacing them with generic adapter failures.
- **AC-3:** For those same controlled inputs, human and JSON modes have the same readiness outcome, repository facts, ordered check outcomes, and value-free tmux targeting classification.
- **AC-4:** A finite matrix covers an absent socket and, on an existing selected socket, a 2,001 ms timeout, nonzero command exit, malformed output, 65,537 output bytes, 1,025 records, `EACCES` during socket identity lookup, and socket device/inode change during observation; only the absent socket leaves tmux targeting unchanged, while each genuine inventory failure produces a value-free tmux failure and preserves every completed non-tmux observation.
- **AC-5:** A finite invoking-context matrix covers exactly one invoking variable present, a non-absolute socket tuple, an absent selected socket, two returned session records, and a returned session/pane that contradicts the invoking tuple; each returns its existing machine-readable classification respectively for partial, malformed, stale, ambiguous, or contradictory context before mutation, excludes supplied sentinel values from human and JSON output, and preserves every completed non-tmux observation.
- **AC-6:** Two Doctor runs with the identical controlled inputs from the Core criteria return equal repository facts, readiness, ordered check outcomes, and tmux targeting classification; both leave the custom server inventory unchanged and the default server absent.
- **AC-7:** Repository-local live-equivalent evidence uses an isolated real custom tmux server, proves the default server absent before and after Doctor, and supplies the controlled Core observations locally; the result retains `owner/repo` and `main`, preserves the seven passing prerequisites, avoids generic all-check failure, and leaves the custom-server inventory unchanged without network access or external credentials.
- **AC-8:** User-facing release and Doctor documentation identifies `0.2.1-beta.0` as a backward-compatible correction, states that an absent unrelated server does not fail Doctor or get created, and retains value-free troubleshooting outcomes for genuine inventory failures and invalid invoking contexts.
- **AC-9:** The package manifest, root lock metadata, official-asset catalog metadata, package/install fixtures, packed metadata, locally installed metadata, and current version documentation all report `0.2.1-beta.0`; repository diff evidence relative to the issue base shows no third-party dependency changes, and package proof uses no registry publication command or network access.
- **AC-10:** `just verify-focused` and `just verify` both exit successfully, and the recorded output provides a finite criterion-to-evidence mapping.

## Acceptance Coverage

| AC | Implementation tasks | Tests / validation | Expected evidence |
|---|---|---|---|
| AC-1 | T1, T2, T3 | V2, V3, V5, V7 | Absent-default command tripwire, equal empty before/after inventory, 2,000/65,536/1,024 bounds, unchanged custom inventory |
| AC-2 | T2, T3 | V3, V5, V7 | `owner/repo`, `main`, canonical ordered 24 checks, and seven named passing prerequisite outcomes |
| AC-3 | T2, T3 | V3, V4, V7 | Normalized human/JSON equality and closed value-free targeting evidence |
| AC-4 | T1, T2, T3 | V2, V3, V7 | Nine-row inventory matrix, typed `unavailable-proof`, bounded stream trace, non-tmux preservation |
| AC-5 | T2, T3 | V4, V7 | Five-row existing reason matrix, zero mutation trace, sentinel scans, preserved observations |
| AC-6 | T3 | V3, V5, V7 | Two equal results and byte-equal custom/absent-default inventories |
| AC-7 | T3 | V5, V7 | Isolated real-server transcript with no credentials/network and exact cleanup |
| AC-8 | T4 | V6, V7 | Documentation assertions for correction, absence, value-free failures, and invalid contexts |
| AC-9 | T4, T5 | V6, V7 | Version matrix, dry-run/tarball/installed metadata, no-dependency diff, no publish/network trace |
| AC-10 | T5 | V7 | Direct and harness gate envelopes plus finite AC-1..AC-10 evidence index |

Coverage proof: all 10 issue criteria map to implementation work, executable validation, and concrete expected evidence before plan artifacts are written. Sparkta and later Issue #7 operational checks are supplementary post-RPIV beta acceptance and do not replace any repository implementation proof above.

## Implementation Tasks
1. **T1 — Make targeting inventory bounded and typed (AC-1, AC-4):** implement one-attempt explicit-selector inventory with absence as stable empty inventory; drain while retaining no more than 65,536 stdout bytes; reject timeout, nonzero, malformed, 65,537 bytes, 1,025 records, identity lookup uncertainty, post-query identity loss, and replacement as typed value-free unavailable proof.
2. **T2 — Contain tmux targeting failures without collapsing Doctor (AC-1 through AC-5):** move all pre-selection and post-selection inventory work inside the owned targeting boundary, convert genuine failures to only the `command.tmux` observation, preserve repository facts and every completed observation, retain canonical order, and keep human/JSON output value-free and equivalent.
3. **T3 — Add deterministic service, matrix, repeat, and isolated live-equivalent proof (AC-1 through AC-7):** extend injected and real isolated-socket tests, including absent-default command tripwires, failure/context matrices, two identical runs, cleanup, and sentinel scans without credentials or network.
4. **T4 — Synchronize release documentation and governed version surfaces (AC-8, AC-9):** update current Doctor/release guidance, package and lock root values, official catalog, package/install assertions and fixtures to `0.2.1-beta.0`; preserve dependency versions and explain local upgrade/reinstall and value-free troubleshooting.
5. **T5 — Produce local package and repository validation evidence (AC-9, AC-10):** build and inspect dry-run, tarball, and `--offline` local-install metadata; never run `npm publish` or a registry/network operation; compare dependencies to the recorded issue base; run direct root gates followed by their harness delegates and assemble the finite AC evidence index.

## Post-RPIV Beta Acceptance
- After repository Implement and Verify accept AC-1 through AC-10, install the exact locally packed `0.2.1-beta.0` tarball into Sparkta without registry/network access. In a visible right-hand tmux pane, prove the custom server remains unchanged, the unrelated default server remains absent before/after, and Doctor no longer collapses. Record only value-free output and bounded inventory facts. This is product-delivery confirmation, not a substitute for this repository implementation acceptance.
- After that package proof, perform the later Issue #7 official-agent operational flow against the installed beta: reconverge the package-coupled asset, invoke the visible project agent with one controlled issue, observe instructions-before-Doctor and ready-only dispatch, and preserve dispatch-versus-completion semantics. Treat this as post-RPIV beta acceptance; do not reopen or redefine closed Issue #7 and do not use Sparkta evidence to satisfy AC-1 through AC-10.
