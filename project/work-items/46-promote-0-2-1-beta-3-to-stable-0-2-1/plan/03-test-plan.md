# Test Plan: Stable 0.2.1

## V-1: Stable current-version inventory

- Tasks: T-1, T-2
- Acceptance criteria: AC-1

Inspect every governed current package, root-lock, official-asset, fixture,
packed/install expectation, generated-manifest expectation, and current
documentation surface. Require exact `0.2.1` with no prerelease identifier.
Compare historical architecture and prior work-item records with the baseline.

Expected evidence: finite path-to-value inventory and unchanged historical
record report.

## V-2: Dependency invariance

- Tasks: T-1, T-2, T-3
- Acceptance criteria: AC-2

Deep-compare `dependencies`, `devDependencies`, `optionalDependencies`, and
`peerDependencies` with the immutable baseline. Remove the root package entry
from both lockfile package maps and deep-compare all 453 remaining entries.
Require lockfile differences to be limited to the two root-project versions.

Expected evidence: equal declarations, equal non-root maps, entry count, and
root-only lock diff.

## V-3: No functional change

- Tasks: T-1, T-2, T-4
- Acceptance criteria: AC-3

Review the complete baseline-to-HEAD diff. Permit only current version
metadata, version fixtures/assertions, current documentation, RPIV evidence,
and required retro records. Require zero functional behavior changes unless a
promotion-specific failure has failing-before and passing-after evidence.

Expected evidence: classified changed-file list and zero unauthorized
functional hunks.

## V-4: Publication boundary

- Tasks: T-1, T-4
- Acceptance criteria: AC-4

Capture local/remote tag and GitHub release inventories before and after
implementation. Confirm no policy grants publication authority and no tag,
GitHub release, or npm publication command is executed.

Expected evidence: unchanged inventories and explicit PR-only handoff.

## V-5: Local package and isolated install

- Tasks: T-3
- Acceptance criteria: AC-1, AC-2, AC-5

Build and run `npm pack --json` into an isolated directory. Require version
`0.2.1` and filename `soft-factory-runner-0.2.1.tgz`. Read packed metadata,
install that exact tarball into a new clean prefix with `--ignore-scripts`,
`--no-audit`, `--no-fund`, and `--omit=dev`, then read installed metadata.
Run installed recommended asset convergence in an isolated target and require
generated manifest version `0.2.1`.

Expected evidence: pack JSON, tarball identity and digest, packed/installed
metadata, package inventory, installation output, and manifest JSON.

## V-6: Focused and full gates

- Tasks: T-4
- Acceptance criteria: AC-3, AC-6

Run:

1. `harness checks --focused --json`
2. `just verify-focused`
3. `harness checks --json`
4. `just verify`

Require all exits to succeed. Require the direct full Jest summary to report at
least 29 suites and 670 tests.

Expected evidence: two harness envelopes, two direct transcripts, exit
statuses, suite/test counts, and coverage summary.
