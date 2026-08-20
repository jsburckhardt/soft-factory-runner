# Action Plan: Stable 0.2.1

## Scope

- GitHub Issue: #46
- Scope type: `issue`
- Baseline: `1a3ed0006383cdfe9a7073ab2d5da5dd625435a5`
- Release assignment: Semantic Versioning patch release `0.2.1`
- Publication boundary: PR delivery only; no tag, GitHub release, or npm
  publication is authorized.

No ADR or core-component change is required. Existing package Semantic
Versioning governance covers synchronized current surfaces, dependency
preservation, and local package proof. Historical beta records and
`DECISION-LOG.md` remain unchanged.

## Acceptance Catalog

| ID | Acceptance criterion |
|---|---|
| AC-1 | Every governed current version surface reports exact stable `0.2.1`; historical delivery records remain unchanged. |
| AC-2 | Third-party declarations and non-root resolved dependency metadata remain unchanged from the immutable baseline. |
| AC-3 | The delivery contains no functional change unless justified by promotion-specific failing-before and passing-after evidence. |
| AC-4 | No tag or release is published without policy authorization and complete Verify acceptance. |
| AC-5 | A repository-local packed artifact and isolated installation report stable `0.2.1`. |
| AC-6 | Harness and direct focused/full gates pass, with at least 29 suites and 670 tests in the full result. |

## Approach

1. Inventory current governed version surfaces and distinguish them from
   historical prerelease records.
2. Change only current package, lock-root, official-asset, fixture/assertion,
   and user-guidance version surfaces to `0.2.1`.
3. Prove dependency invariance and absence of functional changes against the
   immutable baseline.
4. Build and pack locally, install the exact generated tarball into an isolated
   prefix, and inspect packed, installed, and generated manifest metadata.
5. Run harness and direct focused/full gates, retain inspectable evidence, and
   hand off a clean committed branch to Verify.

## Coverage

| AC | Tasks | Validation | Evidence |
|---|---|---|---|
| AC-1 | T-1, T-2, T-3 | V-1, V-5 | Current-surface inventory, historical preservation, packed/installed/manifest metadata |
| AC-2 | T-1, T-2, T-3 | V-2, V-5 | Equal dependency declarations and 453 non-root lock entries |
| AC-3 | T-1, T-2, T-4 | V-3, V-6 | Classified baseline diff and passing gates |
| AC-4 | T-1, T-4 | V-4 | Unchanged tag/release inventories and PR-only handoff |
| AC-5 | T-3 | V-5 | Pack JSON, tarball digest, isolated installed metadata, manifest metadata |
| AC-6 | T-4 | V-6 | Four successful gate results and full test counts |

