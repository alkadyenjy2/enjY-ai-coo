import test from 'node:test';
import assert from 'node:assert/strict';
import { callOpenAIResponses } from '../src/adapters/openai';

test('normalizes string input into a Responses API user input item', async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  let requestBody: any = null;

  process.env.OPENAI_API_KEY = 'test-openai-key';
  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    requestBody = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({
      id: 'resp_test',
      output_text: 'ok',
      output: [],
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;

  try {
    const result = await callOpenAIResponses({
      model: 'gpt-6-astra',
      instructions: 'test',
      input: ['hello'],
    });

    assert.equal(result.id, 'resp_test');
    assert.deepEqual(requestBody.input, [{ role: 'user', content: 'hello' }]);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  }
});
