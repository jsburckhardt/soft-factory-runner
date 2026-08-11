import type {
  FetchedBaseProofV1,
  IssueFacts,
  PreparedIssue,
  RepositoryFacts,
  RequiredAcceptanceCriterionV1,
  RunConfiguration,
} from "./domain";
import { issueSlug } from "./domain";
import { RunnerError } from "./errors";
import type { GitPort } from "./ports";

const AC_START = "<!-- ACCEPTANCE_CRITERIA_START -->";
const AC_END = "<!-- ACCEPTANCE_CRITERIA_END -->";

export function prepareIssue(
  issue: IssueFacts,
  configuration: RunConfiguration,
): PreparedIssue {
  validateIssue(issue);
  const requiredAcceptanceCriteria = extractAcceptanceCriteria(issue.body);
  const mapped = issue.labels
    .map((label) => ({
      label: label.toLowerCase(),
      type: configuration.labelTypes[label.toLowerCase()],
    }))
    .filter(
      (entry): entry is { readonly label: string; readonly type: string } =>
        entry.type !== undefined,
    );
  if (mapped.length === 0) {
    throw new RunnerError(
      "ISSUE_TYPE_UNMAPPED",
      "No issue label maps to a branch type.",
      "Add exactly one configured intent label such as feature.",
    );
  }
  if (mapped.length !== 1) {
    throw new RunnerError(
      "ISSUE_TYPE_AMBIGUOUS",
      "More than one issue label maps to a branch type.",
      "Leave exactly one configured intent label on the issue.",
      { details: { labels: mapped.map((entry) => entry.label) } },
    );
  }
  const branchName = `${mapped[0].type}/${issue.number}-${issueSlug(issue.title)}`;
  const conflict = issue.openPullRequests.find(
    (pullRequest) =>
      pullRequest.headBranch === branchName ||
      pullRequest.closesIssues.includes(issue.number),
  );
  if (conflict !== undefined) {
    throw new RunnerError(
      "ISSUE_CONFLICT",
      `Open pull request #${conflict.number} conflicts with issue #${issue.number}.`,
      "Close or reconcile the conflicting pull request before retrying.",
    );
  }
  return {
    issue,
    branchType: mapped[0].type,
    branchName,
    requiredAcceptanceCriteria,
  };
}

export function validateIssue(issue: IssueFacts): void {
  if (!issue.complete) {
    throw new RunnerError(
      "GITHUB_PROOF_INCOMPLETE",
      "GitHub readiness evidence was incomplete or truncated.",
      "Retry after GitHub is reachable and all bounded pages can be proven complete.",
    );
  }
  if (issue.state !== "OPEN") {
    throw new RunnerError(
      "ISSUE_CLOSED",
      `Issue #${issue.number} is not open.`,
      "Reopen the issue or choose an open issue.",
    );
  }
  if (
    issue.labels.some((label) => label.toLowerCase() === "blocked") ||
    issue.openBlockers.length > 0
  ) {
    throw new RunnerError(
      "ISSUE_BLOCKED",
      `Issue #${issue.number} is blocked.`,
      "Remove the blocked label and resolve all open blocked-by relationships.",
    );
  }
  validateAcceptanceCriteria(issue.body);
}

export function extractAcceptanceCriteria(
  body: string,
): readonly RequiredAcceptanceCriterionV1[] {
  const starts = count(body, AC_START);
  const ends = count(body, AC_END);
  const start = body.indexOf(AC_START);
  const end = body.indexOf(AC_END);
  if (starts !== 1 || ends !== 1 || start < 0 || end <= start) {
    throw new RunnerError(
      "ACCEPTANCE_CRITERIA_INVALID",
      "Issue must contain exactly one ordered acceptance-criteria marker block.",
      "Add one ACCEPTANCE_CRITERIA_START/END block containing nonempty checkboxes.",
    );
  }
  const block = body.slice(start + AC_START.length, end);
  const checkboxes = block
    .split(/\r?\n/)
    .filter((line) => /^\s*-\s+\[[ xX]\]\s+\S/.test(line));
  if (checkboxes.length === 0) {
    throw new RunnerError(
      "ACCEPTANCE_CRITERIA_INVALID",
      "Acceptance-criteria block contains no nonempty checkbox.",
      "Add at least one nonempty markdown checkbox criterion.",
    );
  }
  return checkboxes.map((line, index) => ({
    id: `AC-${index + 1}`,
    text: line.replace(/^\s*-\s+\[[ xX]\]\s+/, "").trim(),
  }));
}

export function validateAcceptanceCriteria(body: string): number {
  return extractAcceptanceCriteria(body).length;
}

function count(value: string, needle: string): number {
  return value.split(needle).length - 1;
}

export function resolveRemote(
  repository: RepositoryFacts,
  configuredRemote: string | null,
): string {
  if (configuredRemote !== null) {
    if (!repository.remotes.includes(configuredRemote)) {
      throw new RunnerError(
        "REMOTE_MISSING",
        `Configured remote ${configuredRemote} does not exist.`,
        "Configure repository.remote with an existing Git remote.",
      );
    }
    return configuredRemote;
  }
  if (repository.pushDefault !== null)
    return requireExistingRemote(
      repository,
      repository.pushDefault,
      "remote.pushDefault",
    );
  if (repository.currentBranchRemote !== null)
    return requireExistingRemote(
      repository,
      repository.currentBranchRemote,
      "current branch",
    );
  if (repository.remotes.length === 1) return repository.remotes[0];
  if (repository.remotes.length === 0) {
    throw new RunnerError(
      "REMOTE_MISSING",
      "Repository has no Git remote.",
      "Add a remote or set repository.remote.",
    );
  }
  throw new RunnerError(
    "REMOTE_AMBIGUOUS",
    "Repository has multiple remotes and no deterministic default.",
    "Set repository.remote in .soft-factory/config.yml.",
  );
}

function requireExistingRemote(
  repository: RepositoryFacts,
  candidate: string,
  source: string,
): string {
  if (!repository.remotes.includes(candidate)) {
    throw new RunnerError(
      "REMOTE_MISSING",
      `${source} selects missing remote ${candidate}.`,
      "Repair Git remote configuration or set repository.remote.",
    );
  }
  return candidate;
}

export async function proveFetchedBase(input: {
  readonly git: GitPort;
  readonly repository: RepositoryFacts;
  readonly remote: string;
  readonly configuredBase: string | null;
  readonly fetchedAt: string;
}): Promise<FetchedBaseProofV1> {
  await input.git.fetch(input.repository.root, input.remote);
  const advertised = await input.git.advertisedHead(
    input.repository.root,
    input.remote,
  );
  if (
    input.configuredBase !== null &&
    input.configuredBase !== advertised.branch
  ) {
    throw new RunnerError(
      "BASE_BRANCH_CONFLICT",
      `Configured base ${input.configuredBase} disagrees with advertised ${advertised.branch}.`,
      "Update repository.base_branch or the remote default branch.",
    );
  }
  const tracking = await input.git.trackingSha(
    input.repository.root,
    input.remote,
    advertised.branch,
  );
  if (tracking === null) {
    throw new RunnerError(
      "BASE_TRACKING_MISSING",
      "Fetched remote tracking reference is missing.",
      "Check fetch refspecs and retry the run.",
    );
  }
  if (tracking !== advertised.sha) {
    throw new RunnerError(
      "BASE_SHA_MISMATCH",
      "Advertised remote HEAD and fetched tracking SHA do not match.",
      "Retry fetch after remote propagation completes.",
      { details: { advertised: advertised.sha, tracking } },
    );
  }
  return {
    schemaVersion: 1,
    remote: input.remote,
    defaultBranch: advertised.branch,
    advertisedHeadSha: advertised.sha,
    trackingRefSha: tracking,
    fetchedAt: input.fetchedAt,
    matches: true,
  };
}
