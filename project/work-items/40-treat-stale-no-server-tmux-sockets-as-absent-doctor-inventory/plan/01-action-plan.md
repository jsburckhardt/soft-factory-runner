# Action Plan: Treat stale no-server tmux sockets as absent Doctor inventory

## Feature
- **ID:** 40
- **Research Brief:** `project/work-items/40-treat-stale-no-server-tmux-sockets-as-absent-doctor-inventory/research/00-research.md`

## ADRs Created
- None. Amended `ADR-260817-invoking-tmux-context-targeting` instead.

## Core-Components Created
- None. Amended `CORE-COMPONENT-260817-exact-tmux-context-ownership` instead.

## Architecture Amendments
- Recognize only completed, bounded, exact original-byte `no server running on <queried-socket>\n` with zero stdout and unchanged socket identity as stable stale-socket absence.
- Preserve stale identity in ephemeral inventory. Arbitrary nonzero, malformed/additional stderr, timeout, stdout/stderr overflow, malformed inventory, EACCES, post-query loss, and replacement remain unavailable proof.
- Decisions 183-184 record the amendments in `DECISION-LOG.md`; existing dates and IDs are preserved.

## Acceptance Criteria
- **AC-1:** With a valid invoking custom server and an unrelated existing socket entry whose bounded inventory query exits nonzero with `no server running`, Doctor reports targeting mode `invoking-valid`, no refusal reason, and both `ambientUnchanged` and `unrelatedUnchanged` true.
- **AC-2:** For that stale-entry case, controlled repository `owner/repo` and default branch `main` facts remain present; the 24 canonical checks occur exactly once in contract order; and successful git, gh, tmux, node, Copilot, GitHub-authentication, and Copilot-authentication observations remain passing.
- **AC-3:** Human and JSON output agree on readiness, repository facts, ordered check ID/pass-fail/evidence results, targeting mode, reason, and unchanged booleans, while excluding the two supplied socket paths, raw tmux identities and pane inventory, raw stderr, and unique sentinel values supplied through controlled observations.
- **AC-4:** A finite controlled matrix covers: the stale no-server entry; a live-server query that exits nonzero with stderr not classified as no-server; invalid UTF-8 inventory; inventory containing NUL or carriage-return bytes; inventory without a terminal newline; 65,537 output bytes; 1,025 records; and socket identity change during inventory. Only the stale no-server row reports `invoking-valid` with both unchanged booleans true; every other row reports `invalid-context`/`unavailable-proof` with both booleans false, while preserving the completed non-tmux observations named in Core.
- **AC-5:** Two runs of every matrix row return equal readiness, repository facts, ordered check ID/pass-fail/evidence results, targeting mode, reason, and unchanged booleans. During each Doctor run, the invoking and unrelated socket-entry type/device/inode observations and the inventories of the finite isolated live servers used by that row are equal before and after; no socket entry or tmux server is created or deleted.
- **AC-6:** Repository-local live-equivalent evidence uses an isolated live custom server and an existing stale default socket entry, demonstrates that the custom query succeeds and the stale query returns `no server running`, and proves the Core targeting result plus bounded before/after non-mutation observations without external credentials; scenario-created resources are absent after cleanup so the evidence can be repeated.
- **AC-7:** User-facing release and Doctor documentation identifies `0.2.1-beta.1` as the backward-compatible correction, describes the stale no-server outcome, and distinguishes it from value-free live-server inventory failures.
- **AC-8:** Package manifest, root lock metadata, official-asset metadata, package/install fixtures, packed metadata, locally installed metadata, and current-version documentation all report `0.2.1-beta.1`; manifest and lock diff evidence shows no third-party dependency change; and offline package evidence completes without registry fetch or publication commands.
- **AC-9:** Direct `just verify-focused` and `just verify` both exit successfully, with recorded finite criterion-to-evidence results for the matrix and live-equivalent case.

## Acceptance Coverage
| AC | Tasks | Validation | Expected evidence |
|---|---|---|---|
| AC-1 | T1, T2 | V1, V2 | Strict classifier and Doctor `invoking-valid`/null/true/true result. |
| AC-2 | T2 | V2 | `owner/repo`, `main`, exact ordered 24 IDs once, and named passing checks. |
| AC-3 | T2 | V3 | Human/JSON semantic parity and zero prohibited-value matches. |
| AC-4 | T1, T2 | V1, V2, V4 | Finite matrix; only stale succeeds; timeout, EACCES, malformed/overflow stderr, loss, and replacement remain unavailable. |
| AC-5 | T2, T3 | V4, V5 | Two-run equality, before/after identity/inventory equality, and empty mutation trace. |
| AC-6 | T3 | V5 | Real custom success, stale no-server, Core result, bounds, cleanup, and repeat proof. |
| AC-7 | T4 | V6 | beta.1 documentation assertions and explicit outcome distinction. |
| AC-8 | T4 | V6, V7 | Version inventory, unchanged dependency metadata, offline pack/install trace. |
| AC-9 | T5 | V8, V9 | Direct and harness gate outputs plus complete AC evidence index. |

Coverage is complete: every AC has implementation, validation, and evidence ownership.

## Implementation Tasks
1. **T1 — Strict inventory classification (AC-1, AC-4):** classify only the exact bounded stale response; preserve ENOENT and every unavailable-proof boundary.
2. **T2 — Doctor contract matrix (AC-1–AC-5):** prove all 24 checks, preservation, repeated equality, renderer parity, confidentiality, and no mutation.
3. **T3 — Live-equivalent fixture (AC-5, AC-6):** run a real isolated custom server plus bound-and-closed stale default entry twice with unconditional cleanup.
4. **T4 — beta.1 release/package/docs (AC-7, AC-8):** synchronize all governed surfaces and prove offline tarball installation without dependency churn.
5. **T5 — Gates/evidence (AC-9; validates AC-1–AC-8):** run direct focused/full and briefed harness focused/full checks and assemble the finite evidence index.

## Deferred Operational Acceptance
After beta.1 packaging, visibly validate in Sparkta: record/uninstall `0.2.1-beta.0`, install `0.2.1-beta.1`, confirm metadata, run installed human and JSON Doctor in the reported context, then invoke `soft-factory run --issue 7 --json`. This external acceptance is deferred and does not replace AC-1–AC-9 repository evidence.
