import test from "node:test";
import assert from "node:assert/strict";
import { auditPortfolioRepositories } from "../src/core/github-portfolio-audit";

const project = { name: "Public Test Project", repositoryUrl: "https://github.com/example/project" };

test("GitHub portfolio audit verifies repository metadata and the latest workflow run", async () => {
  const calls: string[] = [];
  const fetchImpl = (async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    if (url.endsWith("/actions/runs?per_page=1")) {
      return new Response(JSON.stringify({ workflow_runs: [{
        status: "completed", conclusion: "success", created_at: "2026-10-10T00:00:00Z", html_url: "https://github.com/example/project/actions/runs/123",
      }] }), { status: 200 });
    }
    return new Response(JSON.stringify({ default_branch: "main", private: false, html_url: "https://github.com/example/project" }), { status: 200 });
  }) as typeof fetch;

  const audit = await auditPortfolioRepositories({ fetchImpl, projects: [project] });
  assert.equal(audit.source, "github-rest-api");
  assert.equal(audit.results[0].status, "verified");
  assert.equal(audit.results[0].defaultBranch, "main");
  assert.equal(audit.results[0].latestWorkflow?.conclusion, "success");
  assert.equal(calls.length, 2);
});

test("unauthenticated 404 is reported as not checked rather than proof the repository is missing", async () => {
  const fetchImpl = (async () => new Response(JSON.stringify({ message: "Not Found" }), { status: 404 })) as typeof fetch;
  const audit = await auditPortfolioRepositories({ fetchImpl, projects: [project] });
  assert.equal(audit.results[0].status, "not_checked");
  assert.match(audit.results[0].reason || "", /may be private/i);
});

test("repository metadata can be verified while unavailable workflow status remains partial", async () => {
  const fetchImpl = (async (input: RequestInfo | URL) => {
    if (String(input).endsWith("/actions/runs?per_page=1")) {
      return new Response(JSON.stringify({ message: "Forbidden" }), { status: 403 });
    }
    return new Response(JSON.stringify({ default_branch: "main", private: true, html_url: "https://github.com/example/project" }), { status: 200 });
  }) as typeof fetch;

  const audit = await auditPortfolioRepositories({ fetchImpl, projects: [project] });
  assert.equal(audit.results[0].status, "partial");
  assert.equal(audit.results[0].visibility, "private");
  assert.match(audit.results[0].reason || "", /Actions status is not readable/i);
});

test("project-name filter audits only explicitly requested projects", async () => {
  const projects = [
    project,
    { name: "Another Project", repositoryUrl: "https://github.com/example/another" },
  ];
  let calls = 0;
  const fetchImpl = (async () => {
    calls += 1;
    return new Response(JSON.stringify({ default_branch: "main", private: false, workflow_runs: [] }), { status: 200 });
  }) as typeof fetch;

  const audit = await auditPortfolioRepositories({ fetchImpl, projects, projectNames: ["Another Project"] });
  assert.equal(audit.results.length, 1);
  assert.equal(audit.results[0].project, "Another Project");
  assert.equal(calls, 2);
});
