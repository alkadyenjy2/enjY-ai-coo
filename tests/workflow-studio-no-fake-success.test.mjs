import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const componentPath = fileURLToPath(new URL('../src/components/WorkflowStudioView.tsx', import.meta.url));
const source = await readFile(componentPath, 'utf8');

test('Workflow Studio never simulates successful execution without a live n8n bridge', () => {
  assert.match(source, /LIVE API NOT CONNECTED/);
  assert.match(source, /\[NOT EXECUTED\]/);
  assert.match(source, /local catalog entry, not a live n8n workflow binding/);
  assert.match(source, /https:\/\/zeoutsourse\.app\.n8n\.cloud\/assistant\/d3e4813d-7342-4a62-8a54-8ae705734554/);
  assert.doesNotMatch(source, /Gemini 3\.6 Flash API \(Unlimited, no n8n credits required\)/);
  assert.doesNotMatch(source, /Processed 0 errors/);
  assert.doesNotMatch(source, /\[Success\] Workflow/);
  assert.doesNotMatch(source, /await new Promise\(r => setTimeout\(r, 500\)\)/);
});
