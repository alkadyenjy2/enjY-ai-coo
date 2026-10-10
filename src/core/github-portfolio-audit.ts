import { canonicalPortfolioProjects } from "../data/canonicalPortfolio";

export type RepositoryAuditStatus = "verified" | "partial" | "blocked" | "not_checked";

export interface RepositoryAuditResult {
  project: string;
  repository: string | null;
  status: RepositoryAuditStatus;
  defaultBranch?: string;
  visibility?: "public" | "private";
  latestWorkflow?: {
    status: string;
    conclusion: string | null;
    createdAt: string;
    url: string;
  } | null;
  evidence: string[];
  reason?: string;
}

type AuditProject = Pick<(typeof canonicalPortfolioProjects)[number], "name" | "repositoryUrl">;
type FetchLike = typeof fetch;

export async function auditPortfolioRepositories(options: {
  fetchImpl?: FetchLike;
  token?: string;
  projectNames?: string[];
  projects?: AuditProject[];
} = {}): Promise<{ auditedAt: string; source: "github-rest-api"; results: RepositoryAuditResult[] }> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const token = options.token?.trim() || undefined;
  const requestedNames = new Set((options.projectNames ?? []).map((name) => name.trim()).filter(Boolean));
  const projects = (options.projects ?? canonicalPortfolioProjects)
    .filter((project) => project.repositoryUrl)
    .filter((project) => requestedNames.size === 0 || requestedNames.has(project.name));

  const results = await Promise.all(projects.map(async (project): Promise<RepositoryAuditResult> => {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(project.repositoryUrl!);
    } catch {
      return { project: project.name, repository: null, status: "not_checked", evidence: [], reason: "Canonical repository URL is invalid." };
    }

    if (parsedUrl.hostname !== "github.com") {
      return { project: project.name, repository: project.repositoryUrl!, status: "not_checked", evidence: [], reason: "Repository host is not GitHub; this audit only checks GitHub repositories." };
    }

    const parts = parsedUrl.pathname.split("/").filter(Boolean);
    if (parts.length < 2) {
      return { project: project.name, repository: project.repositoryUrl!, status: "not_checked", evidence: [], reason: "Canonical repository owner/name could not be parsed." };
    }

    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/, "");
    const apiBase = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "JARVIS-Portfolio-Audit",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const repoResponse = await fetchImpl(apiBase, { headers, signal: AbortSignal.timeout(8000) });
      if (!repoResponse.ok) {
        const privateOrUnavailable = repoResponse.status === 404 && !token;
        return {
          project: project.name,
          repository: `${owner}/${repo}`,
          status: privateOrUnavailable ? "not_checked" : "blocked",
          evidence: [`Repository metadata request returned HTTP ${repoResponse.status}.`],
          reason: privateOrUnavailable
            ? "Repository may be private; no GitHub token is configured for this runtime, so existence/health is not inferred from a 404."
            : `GitHub repository metadata could not be read (HTTP ${repoResponse.status}).`,
        };
      }

      const metadata = await repoResponse.json() as { default_branch?: string; private?: boolean; html_url?: string };
      const evidence = [`GitHub repository metadata returned HTTP ${repoResponse.status}.`];
      const workflowResponse = await fetchImpl(`${apiBase}/actions/runs?per_page=1`, { headers, signal: AbortSignal.timeout(8000) });

      if (!workflowResponse.ok) {
        return {
          project: project.name,
          repository: `${owner}/${repo}`,
          status: "partial",
          defaultBranch: metadata.default_branch,
          visibility: metadata.private ? "private" : "public",
          evidence,
          reason: `Repository is reachable, but latest GitHub Actions status is not readable (HTTP ${workflowResponse.status}).`,
        };
      }

      const workflowData = await workflowResponse.json() as {
        workflow_runs?: Array<{ status?: string; conclusion?: string | null; created_at?: string; html_url?: string }>;
      };
      const latest = workflowData.workflow_runs?.[0];
      evidence.push(`Latest workflow-run query returned HTTP ${workflowResponse.status}.`);

      return {
        project: project.name,
        repository: `${owner}/${repo}`,
        status: latest ? "verified" : "partial",
        defaultBranch: metadata.default_branch,
        visibility: metadata.private ? "private" : "public",
        latestWorkflow: latest ? {
          status: latest.status || "unknown",
          conclusion: latest.conclusion ?? null,
          createdAt: latest.created_at || "unknown",
          url: latest.html_url || metadata.html_url || `https://github.com/${owner}/${repo}/actions`,
        } : null,
        evidence,
        ...(latest ? {} : { reason: "Repository metadata is verified, but no workflow run was returned; CI health remains unverified." }),
      };
    } catch (error) {
      return {
        project: project.name,
        repository: `${owner}/${repo}`,
        status: "blocked",
        evidence: [],
        reason: error instanceof Error && error.name === "TimeoutError"
          ? "GitHub audit request timed out."
          : "GitHub audit request failed before evidence could be collected.",
      };
    }
  }));

  return { auditedAt: new Date().toISOString(), source: "github-rest-api", results };
}
