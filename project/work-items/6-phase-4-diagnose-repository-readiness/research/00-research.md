# Research Brief: Phase 4: Diagnose repository readiness

## GitHub Issue
- **Issue:** #6
- **Title:** Phase 4: Diagnose repository readiness
- **Work Item:** `project/work-items/6-phase-4-diagnose-repository-readiness`

## Scope Classification
- **Scope Type:** issue

## Problem Statement
After the execution lifecycle is stable, give humans and agents one authoritative, deterministic way to decide whether a repository can safely run Soft Factory.

## Acceptance Criteria

**Core**
- [ ] `soft-factory doctor` evaluates and reports every repository check defined by PRD Section 19: Git repository membership, primary-worktree discovery, Git common-directory discovery, GitHub owner/repository discovery, and default-branch discovery.
- [ ] `soft-factory doctor` evaluates and reports every required-command and authentication check defined by PRD Section 19: availability of `git`, `gh`, `tmux`, `node`, and `copilot`, GitHub CLI authentication, and Copilot CLI usability.
- [ ] `soft-factory doctor` evaluates and reports every Soft Factory compatibility check defined by PRD Section 19: RPIV agent availability, supported Runner protocol availability, valid Runner configuration, valid worktree root, writable state root, ignored `.trees/` and Runner runtime-state paths, and RPIV result-artifact contract availability.
- [ ] `soft-factory doctor` evaluates and reports every runtime-safety check defined by PRD Section 19: absence of invalid `.trees` ownership conflicts, readable state files, interpretable locks, and safe creation of required paths.
- [ ] Every Section 19 check has a stable identifier and an explicit blocking classification, and `soft-factory doctor --json` represents the same check set, `passed` or `failed` outcomes, and blocking classifications as human output in schema version `1`, with a top-level `ready` boolean, repository GitHub and default-branch fields, and a checks array whose entries contain `id`, `status`, and `blocking`; failed entries also contain `message` and `remediation`.
- [ ] If any blocking check fails, human output reports `STATUS: NOT READY`, JSON reports `"ready": false`, and every failed blocking check identifies the failed prerequisite and a concrete corrective action; if all blocking checks pass, human output reports `STATUS: READY` and JSON reports `"ready": true`.
- [ ] Doctor does not select an issue, prioritize backlog work, or assess issue-specific implementation readiness.

**Verification**
- [ ] Configured ready and blocked repository fixtures define their expected result for every reported check, and automated verification proves that human and JSON modes report the same check outcomes and readiness decision for each fixture.
- [ ] Configured fixtures exercise both passing and failing outcomes for every repository, required-command, authentication, compatibility, and runtime-safety check.
- [ ] On the configured ready repository fixture with external network responses controlled by the verification environment, elapsed wall-clock time from Doctor invocation through process exit is at most ten seconds.

## Repository Findings
- `PRD.md:483-488`, `PRD.md:791-850`, `PRD.md:854-924`, and `PRD.md:1550-1563` define the Doctor commands, four check categories, human and JSON forms, and repository-discovery requirement. `PRD.md:1949-1955` says repository validation should normally finish within ten seconds excluding external network delays.
- No product Doctor command exists. `src/command.ts:3-19` has no `doctor` command variant, `src/command.ts:33-103` rejects unsupported grammar, and `src/index.ts:37-107` dispatches only bootstrap, explicit issue execution, and Phase 3 controls. `src/command.ts:105-119`, `README.md:23-36`, and `docs/phase-3-recovery-operations.md:13-25` likewise omit Doctor.
- Existing repository discovery is concentrated in `LiveGitPort.discover` (`src/live.ts:252-309`). It uses bounded Git argument-array calls to obtain the top level, absolute Git common directory, remotes, and one owner-qualified GitHub identity. `RepositoryFacts` (`src/domain.ts:18-25`) carries the root, common directory, identity, and remote facts, but no default-branch field. Default-branch and fetched-tip proof are obtained later through `proveFetchedBase` (`src/readiness.ts:190-240`), which performs a fetch and compares advertised HEAD with a tracking SHA.
- `parseConfiguration` (`src/config.ts:26-139`) reads the current simple YAML subset into `RunConfiguration` (`src/domain.ts:375-381`). It supports remote, base branch, label mappings, RPIV prompt, and concurrency. It does not represent the PRD configuration example fields `protocol_version`, `repository.worktree_root`, or `repository.state_root` from `PRD.md:1496-1506`; unrecognized keys are currently retained during parsing but otherwise ignored.
- The existing external-process boundary (`CommandRunner` and `CommandExecutor`, `src/live.ts:29-140`) uses executable plus argument arrays, an allowlisted environment, timeout handling, exit status, signal, and captured output. `RunnerPorts` (`src/ports.ts:144-152`) exposes filesystem, Git, GitHub, tmux, process, clock, and ID ports, but has no explicit command-presence, authentication, Copilot-usability, or Git-ignore observations.
- Runtime state paths are fixed under `.soft-factory/` by `RunStore` (`src/persistence.ts:18-61`), while issue worktrees are fixed at `<repository>/.trees/<issue>` in `IssueRunService.run` (`src/orchestrator.ts:120-153`). The repository `.gitignore:4-5` ignores both `.trees/` and `.soft-factory/`.
- Existing runtime interpretation is strict rather than best-effort: `RunStore.load`, `loadHistory`, `readOwner`, `readLease`, and enumeration (`src/persistence.ts:144-299`) validate versioned snapshots, JSONL events, owner records, and leases. `collectReconciliation` (`src/reconciliation.ts:20-180`) keeps persisted and observed lock, lease, filesystem, Git, tmux, process, result, remote, and GitHub facts separate and classifies uncertainty rather than inferring absence.
- The RPIV agent exists at `.github/agents/rpiv.agent.md` and declares the four stage agents, but repository search found no `runner_protocol` or `protocol_version` declaration outside the PRD. The result contract is concrete in `AgentResultV1` (`src/domain.ts:213-223`), `parseAgentResult` (`src/completion.ts:45-96`), and `docs/phase-1-issue-run.md:42-71`.
- Human and JSON output already derive from shared typed facts for current commands (`src/render.ts:17-84`), and typed failures carry stable code, message, remediation, details, and nonzero exit mapping (`src/errors.ts:1-91`). The Doctor-specific check model and schema do not exist.
- Existing tests demonstrate injectable in-memory and disk-backed ports, temporary Git repositories, controlled external commands, strict CLI parsing, state parsing, and human/JSON rendering patterns (`src/index.test.ts`, `src/orchestration.test.ts`, `src/integration.test.ts`, `src/recovery-persistence.test.ts`). Repository search found no product Doctor test or fixture. The orientation run `harness boot --json` completed successfully with the bootstrap signal, all 149 current tests passing, and full validation status `ok`; this establishes the pre-change baseline, not Doctor readiness.

## Constraints
- Doctor must report every Section 19 check individually; collapsing several prerequisites into the current fail-fast `REPOSITORY_INVALID` path would not satisfy the issue check-set requirement (`PRD.md:791-850`; acceptance criteria 1-5).
- Human and JSON modes must preserve one check set, outcome, and blocking meaning, consistent with the shared-facts rule in `CORE-COMPONENT-260810-structured-events` and current rendering practice in `src/render.ts`.
- Expected failures require stable machine-readable codes, actionable remediation, nonzero CLI behavior where applicable, redaction, and fail-safe treatment of ambiguity under `CORE-COMPONENT-260810-error-handling`.
- External tools must be invoked through validated executable/argument arrays with bounded execution and redacted results under `CORE-COMPONENT-260810-subprocess-execution`; credentials must not enter configuration, state, logs, or output (`docs/phase-1-issue-run.md:5-8`).
- Existing ownership and recovery contracts prohibit treating unknown `.trees`, locks, state, worktrees, or processes as safe. Recorded and observed ownership must agree before reuse or mutation (`CORE-COMPONENT-260810-issue-worktree-locking`; `CORE-COMPONENT-260811-run-reconciliation-control`).
- State compatibility includes schema-aware snapshots, events, locks, leases, and the strict owned-worktree result artifact; malformed or unsupported durable data currently fails safely (`CORE-COMPONENT-260810-persistence-recovery`; `CORE-COMPONENT-260811-completion-evidence-reconciliation`).
- Runner remains a strict TypeScript Node.js CLI, distributed as `soft-factory`, with external systems behind typed testable boundaries (`ADR-260810-typescript-node-cli`). The root `justfile` remains project command authority; the ambient harness is not a product runtime dependency (`CORE-COMPONENT-260811-engineering-harness-interface`).
- Doctor must remain repository-scoped and must not query, select, rank, or assess a GitHub issue. Explicit issue-only behavior is already a repository contract (`README.md:38`; `CORE-COMPONENT-260811-concurrent-run-admission`).
- The ready fixture requirement is stricter than the PRD general performance note: acceptance requires total process exit within ten seconds when network responses are controlled, while existing individual Git/GitHub bounds are commonly 15 or 30 seconds (`src/live.ts`; `CORE-COMPONENT-260811-issue-run-orchestration`).
- Strict TypeScript, ESLint, Prettier, deterministic adapter-isolated tests, root validation recipes, and at least 80 percent global coverage remain mandatory (`CORE-COMPONENT-260810-development-standards`).

## Relevant ADRs and Core-Components
- `ADR-260810-typescript-node-cli` — fixes the strict TypeScript/Node CLI and typed adapter context.
- `ADR-260811-prototype-one-run-orchestration` — establishes repository discovery, bounded readiness, fetched-base proof, ownership ordering, and dependency-injected fixtures.
- `ADR-260811-prototype-two-completion-proof` — establishes the strict RPIV result artifact and bounded independent proof.
- `ADR-260811-prototype-three-recovery-concurrency` — establishes one-pass reconciliation, explicit issue behavior, state interpretation, and conservative ownership handling.
- `CORE-COMPONENT-260810-error-handling` — stable actionable failures and fail-safe ambiguity.
- `CORE-COMPONENT-260810-subprocess-execution` — typed, bounded, shell-free, redacted external execution.
- `CORE-COMPONENT-260810-persistence-recovery` — versioned state and strict recovery interpretation.
- `CORE-COMPONENT-260810-issue-worktree-locking` — exact ownership and preservation of unknown resources.
- `CORE-COMPONENT-260810-structured-events` — shared structured facts for human and JSON meaning.
- `CORE-COMPONENT-260811-issue-run-orchestration` — current repository readiness and discovery boundaries.
- `CORE-COMPONENT-260811-completion-evidence-reconciliation` — RPIV result-contract definition.
- `CORE-COMPONENT-260811-run-reconciliation-control` and `CORE-COMPONENT-260811-concurrent-run-admission` — lock, lease, state, and runtime-safety interpretation without issue selection.
- `CORE-COMPONENT-260810-development-standards` and `CORE-COMPONENT-260811-engineering-harness-interface` — executable project validation and harness boundaries.

## Risks and Open Questions
- The authoritative source and exact compatibility rule for a supported Runner protocol are unresolved. The PRD shows both asset metadata `runner_protocol: 1` (`PRD.md:659-670`) and repository configuration `protocol_version: 1` (`PRD.md:1496-1506`), while current configuration and RPIV agent metadata expose neither.
- The exact repository artifact that proves RPIV agent availability is not stated. The current repository has `.github/agents/rpiv.agent.md`, while the PRD target layout and official asset sections also discuss `.agents/`.
- The boundaries of valid worktree root, writable state root, safe required-path creation, and non-destructive writability proof are not specified beyond the PRD names. Current runtime paths are fixed and `NodeFilePort` creation methods recursively create parent directories as part of writes.
- The scope of ignored runtime-state paths is unclear: the PRD names Runner runtime state generally, while current state includes runs, events, locks, concurrency slots, logs, configuration, and an owned-worktree result file under `.soft-factory/`.
- The required interpretation of malformed unrelated files versus malformed recognized state and lock files is not explicit. Current enumeration skips filenames that do not match known patterns but fails on malformed recognized records.
- Authentication and usability checks can depend on external tool behavior and network state. The issue requires deterministic every-check reporting and a controlled-network timing bound, while existing adapters typically stop on typed command failure and use longer per-call timeouts.
- Blocking classifications for each named Section 19 check are required but are not enumerated in the PRD or existing architecture. Research cannot infer which, if any, checks are nonblocking.
- Exit-code requirements for READY versus NOT READY are not stated in the issue. Existing CLI conventions distinguish syntax, operational evidence, and blocked ownership outcomes with exit codes 2, 3, and 4 (`docs/phase-3-recovery-operations.md:25`; `src/errors.ts:78-91`).
- The relationship between harness `doctor` and product `soft-factory doctor` may confuse operators. The harness command diagnoses development-surface readiness (`CORE-COMPONENT-260811-engineering-harness-interface`), while Issue #6 is the product repository-readiness authority and cannot depend on the ambient harness.
