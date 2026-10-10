import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalPortfolioProjects } from '../src/data/canonicalPortfolio';

test('JARVIS project registry contains the nine real canonical portfolio projects', () => {
  assert.equal(canonicalPortfolioProjects.length, 9);
  assert.deepEqual(
    canonicalPortfolioProjects.map((project) => project.name),
    [
      'JARVIS / ENJY AI COO',
      'Side Hustle Hub / IdeaCollector',
      'RIZKAHA / FLOURISH',
      'ZA Media AI Growth Engine',
      'ZE Outsource',
      'Short Drama World',
      'Scholarship OS / Hidden Scholarships',
      'NileCare',
      'Roofing AI Operations / Dialer',
    ],
  );
});

test('portfolio project records never present unverified KPI counts as production evidence', () => {
  for (const project of canonicalPortfolioProjects) {
    assert.equal(project.kpisVerified, false, `${project.name} must mark its KPI counts unverified`);
    assert.ok(project.repositoryUrl || project.sourceNotes, `${project.name} must identify its canonical repository or explicitly disclose that it is unverified`);
    assert.ok(project.blockers.length > 0, `${project.name} must surface known blockers or an explicit recheck requirement`);
    assert.equal(project.evidenceStatus, 'not_checked');
  }
});

test('project registry preserves project-specific backend and outbound safety boundaries', () => {
  const byName = Object.fromEntries(canonicalPortfolioProjects.map((project) => [project.name, project]));
  assert.match(byName['RIZKAHA / FLOURISH'].projectRules.join(' '), /Firebase|Firestore/i);
  assert.match(byName['ZA Media AI Growth Engine'].projectRules.join(' '), /Convex ONLY/i);
  assert.match(byName['ZE Outsource'].projectRules.join(' '), /no cold calls/i);
  assert.match(byName['Roofing AI Operations / Dialer'].projectRules.join(' '), /never bypass auth|RLS/i);
});

import { initialConnectors, initialWorkflows, initialCommandTemplates } from '../src/data/mockInitialData';

test('seeded connector and workflow catalog never claims unverified live connectivity or executions', () => {
  assert.ok(initialConnectors.every((connector) => connector.status === 'discovering' || connector.status === 'disconnected' || connector.status === 'error'));
  assert.ok(initialConnectors.every((connector) => !connector.lastVerified));
  assert.ok(initialWorkflows.every((workflow) => workflow.active === false));
  assert.ok(initialWorkflows.every((workflow) => workflow.runCount === 0 && !workflow.lastRun && !workflow.lastStatus));
  assert.ok(initialWorkflows.every((workflow) => workflow.nodes.every((node) => node.status === 'idle')));
});

test('portfolio blocker sweep template invokes the live audit and forbids completion claims without evidence', () => {
  const template = initialCommandTemplates.find((item) => item.id === 'tmpl-7');
  assert.ok(template);
  assert.match(template.prompt, /audit all projects/i);
  assert.match(template.prompt, /do not claim completion/i);
  assert.equal(template.usageCount, 0);
  assert.equal(template.lastUsedAt, undefined);
});
