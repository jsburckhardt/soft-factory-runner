# Verification Summary: Issue 27

## Outcome

PASS — accepted and shipped for review without merge.

- Work item: project/work-items/27-ship-only-the-soft-factory-delivery-agent-at-the-copilot-project-agent-path
- Issue: #27 — Ship only the Soft Factory delivery agent at the Copilot project-agent path
- Branch: feat/27-single-soft-factory-agent
- Implementation commit: 5bdc52cd732f98ea0312097329728ffe487e142c
- Base commit: 0eff506ff00358eeaf7de5aeff6c42ce77d17144
- Pull request: #28, https://github.com/jsburckhardt/soft-factory-runner/pull/28
- Pull request title: feat(assets): ship single Soft Factory delivery agent

## Handoff, scope, and architecture

The repository initially matched the exact Implement handoff branch and commit with a clean tracked working tree. The complete 45-file branch diff was reviewed: 3,989 insertions and 1,538 deletions across the package allowlist/CI check, official agent, catalog/manifest/transaction runtime, tests/fixtures, consumer and product documentation, the accepted ADR/core-component, work-item evidence, and generated RPIV retros. No out-of-scope application change was found.

Architecture PASS. The implementation conforms to ADR-260812-official-asset-distribution-installation and CORE-COMPONENT-260812-official-asset-installation-contract: one current agent, closed legacy ownership vocabulary, exact digest proof, cross-root manifest-last compensation, delivery-only Runner delegation, unchanged Doctor authority, and no API/service/deployment expansion. DECISION-LOG entries 115 through 122 register the current decisions. No unrecorded ADR or core-component divergence was found.

Commit standards PASS. Plan, implementation, and both correction commits use Conventional Commits and each has the required Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com> trailer and an AI attribution note.

## Acceptance decisions

| ID | Status | Evidence |
|---|---|---|
| AC-1 | Passed | One current catalog/recommended identity; deleted tracked assessor/skill sources; exact package official inventory contains only assets/official/soft-factory.agent.md. |
| AC-2 | Passed | Agent frontmatter, ordered APS tags, qualified terminal tools, delivery-primary clauses, and lifecycle/resource prohibitions pass mutation-sensitive V2 checks. |
| AC-3 | Passed | Input validation precedes terminal use; instructions precede Doctor; one run is ready-only; applicable output remains unchanged; dispatch and completion are separate. |
| AC-4 | Passed | V3/V11 converge both install forms to the trusted digest at .github/agents/soft-factory.agent.md and one schema-v1 manifest entry. |
| AC-5 | Passed | Removed selectors return CLI_INVALID/exit 2; live root help exposes only current install forms and destination. |
| AC-6 | Passed | V4 proves matching legacy retirement and absent-file stale-entry retirement while installing trusted current bytes. |
| AC-7 | Passed | Dual-destination accepted rows require both proofs; modified-old and unproved-current rows refuse before mutation with inventory equality. |
| AC-8 | Passed | Matching/absent assessor and skill records retire safely; modified bytes refuse; untracked sibling bytes and inode are preserved. |
| AC-9 | Passed | Empty eligible ancestors are removed deepest first only after proved file retirement; nonempty and unrelated directories remain. |
| AC-10 | Passed | Malformed, duplicate, contradictory, unstable, unknown, symlinked, unrecorded, modified, and collision states return stable no-change failures. |
| AC-11 | Passed | Desired bytes are adopted without rewrite; prior owned bytes upgrade; proved obsolete assets retire in the same transaction. |
| AC-12 | Passed | Every mutation boundary across five operation shapes restores exact inventory or returns complete ASSET_ROLLBACK_UNCERTAIN remediation. |
| AC-13 | Passed | Repeated successful source and packed-CLI operations perform zero mutations with one current entry and no obsolete files. |
| AC-14 | Passed | Named deterministic V3-V7/V11 cases cover every required state, including executable unrelated-content preservation across both roots. |
| AC-15 | Passed | V8 faults every before/after boundary, including post-current-write/pre-old-retirement; V9 covers uncertain rollback for every shape. |
| AC-16 | Passed | 63-entry package inventory contains only the delivery-agent official source; trusted and packed bytes pass all static delivery-contract checks. |
| AC-17 | Passed | README, docs index, Phase 5 guide, PRD, help, ADR, and core-component accurately cover the full one-agent contract; corrected current PRD surfaces authorize only one validated dispatch. |

## Validation results

- Direct just verify: PASS, exit 0. Lint, Prettier format check, strict type check, 21/21 suites, 354/354 tests, coverage, build, and git diff check passed.
- Coverage: 88.13% statements, 83.66% branches, 94.37% functions, 89.73% lines.
- Harness boot --json: PASS, status ok; expected short-lived bootstrap signal observed; application and composed full-check exits were zero.
- Harness checks delegated by boot: PASS, status ok, full scope, delegated command just verify.
- Root justfile interface: PASS; verify-focused and verify are both exposed.
- Package inspection: PASS; 63 entries and exact official inventory assets/official/soft-factory.agent.md.
- Live help: PASS; only current install forms are advertised and the current destination/manifest are accurate.
- Full diff check: PASS.
- Required final validation: command just verify; status passed; evidence is the independent final-head direct run above.

## Documentation review

Documentation PASS.

- README and usage: exact local install forms, invocation, current destination, manifest, authority, refusal, rollback, and idempotency are accurate.
- API: no network API or specification applies; documentation explicitly states the unchanged boundary.
- Configuration: no option/default or configuration migration changed; this is stated explicitly.
- Migration: matching/absent old files, both destinations, adoption, upgrade, assessor/skill retirement, local modification refusal, siblings, and empty-only cleanup match runtime behavior.
- Architecture: accepted ADR, adopted core-component, and decision log match the committed implementation.
- Operations and deployment: exact rollback and uncertain-remediation guidance is complete; the local short-lived CLI introduces no service, daemon, webhook, container, or deployment change.
- PRD correction: executive model, §§15–17, AC-019, Prototype 5, user journey, product boundary, metrics, and final definition now consistently retain lifecycle commands only for humans/Runner.

## RPIV friction drain and harvest

Verifier buffers were cleared only after durable read-back of every pending ID and description:

- .harness/records/retro/2026-08-14/010-issue-27-rpiv-verifier.md — 7 observations.
- .harness/records/retro/2026-08-14/011-issue-27-rpiv-verifier-push.md — 1 observation.
- .harness/records/retro/2026-08-14/012-issue-27-rpiv-verifier-closeout.md — 1 observation.

Final harvest PASS: schema harness.retro-insights/v1, exact plan scope, 13 records, 42 entries, five RPIV agents, 42 kept dispositions, zero malformed records, zero unsupported versions, and zero pending buffer entries.

## GitHub and protected-file proof

- Issue #27: all 17 acceptance checkboxes updated after every criterion passed.
- Pull request #28: created open from feat/27-single-soft-factory-agent to main with Conventional Commit title and every AC evidence item.
- Protected assets/official/theoutsideone.agent.md: SHA-256 149f0bc7bbdc85ca9fa9a0b7dfa11ae58839311de78696ba29a6099e756695c3; untracked, excluded, uncommitted, and absent from package.
- Protected soft-factory-runner-0.1.0.tgz: SHA-256 cbca56b3c27e5ced504cf9cea974c2e4b9ec93de805ad98b2b779768a59da06d; untracked, excluded, uncommitted, and absent from package.

No blockers remain for review. The coordinator, not Verify, owns merge.
