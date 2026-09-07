import test from 'node:test';
import assert from 'node:assert/strict';
import { BrowserUseAdapter } from '../src/adapters/browserUse';

test('Browser Use adapter returns a structured execution result without exposing provider details', async () => {
  const adapter = new BrowserUseAdapter({
    run: async (task) => ({
      sessionId: 'session-1',
      status: 'completed',
      task,
      output: { title: 'Example' },
      evidence: [{ type: 'page', url: 'https://example.com' }],
    }),
  });

  const result = await adapter.execute({
    task: 'Open example.com and extract the page title',
  });

  assert.deepEqual(result, {
    sessionId: 'session-1',
    status: 'completed',
    output: { title: 'Example' },
    evidence: [{ type: 'page', url: 'https://example.com' }],
  });
});
