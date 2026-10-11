import test from 'node:test';
import assert from 'node:assert/strict';
import { probeN8nMcpHealth } from '../src/adapters/n8n-mcp-health.ts';

const validInitialize = {
  jsonrpc: '2.0',
  id: 1,
  result: {
    protocolVersion: '2025-03-26',
    capabilities: {},
    serverInfo: { name: 'n8n', version: '1.0.0' },
  },
};

test('n8n MCP reports UNCONFIGURED when endpoint or credential is missing', async () => {
  const result = await probeN8nMcpHealth({ url: 'https://example.n8n.cloud/mcp-server/http', apiKey: '' });
  assert.equal(result.status, 'UNCONFIGURED');
  assert.equal(result.actualCall, false);
});

test('n8n MCP reports REAL_LIVE only after a valid authenticated initialize handshake', async () => {
  let captured: { url: string; init: RequestInit } | undefined;
  const result = await probeN8nMcpHealth(
    { url: 'https://example.n8n.cloud/mcp-server/http', apiKey: 'test-secret-do-not-return' },
    async (url, init) => {
      captured = { url: String(url), init: init ?? {} };
      return new Response(JSON.stringify(validInitialize), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  );

  assert.equal(result.status, 'REAL_LIVE');
  assert.equal(result.actualCall, true);
  assert.equal(result.authPresent, true);
  assert.equal(captured?.url, 'https://example.n8n.cloud/mcp-server/http');
  assert.equal((captured?.init.headers as Record<string, string>)?.Authorization, 'Bearer test-secret-do-not-return');
  assert.equal(JSON.stringify(result).includes('test-secret-do-not-return'), false);
});

test('n8n MCP treats HTTP 401 as BROKEN rather than a successful connector', async () => {
  const result = await probeN8nMcpHealth(
    { url: 'https://example.n8n.cloud/mcp-server/http', apiKey: 'test-secret-do-not-return' },
    async () => new Response('Unauthorized', { status: 401 }),
  );

  assert.equal(result.status, 'BROKEN');
  assert.equal(result.actualCall, true);
  assert.match(result.evidence, /HTTP 401/);
  assert.equal(JSON.stringify(result).includes('test-secret-do-not-return'), false);
});

test('n8n MCP rejects malformed JSON-RPC responses even when HTTP is 200', async () => {
  const result = await probeN8nMcpHealth(
    { url: 'https://example.n8n.cloud/mcp-server/http', apiKey: 'test-secret-do-not-return' },
    async () => new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, error: { message: 'not initialized' } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  );

  assert.equal(result.status, 'BROKEN');
  assert.match(result.evidence, /no valid JSON-RPC MCP initialize result/i);
});

test('n8n MCP does not claim live status on network exceptions', async () => {
  const result = await probeN8nMcpHealth(
    { url: 'https://example.n8n.cloud/mcp-server/http', apiKey: 'test-secret-do-not-return' },
    async () => { throw new Error('socket hang up'); },
  );

  assert.equal(result.status, 'BROKEN');
  assert.equal(result.actualCall, true);
  assert.match(result.evidence, /network request failed/i);
  assert.equal(JSON.stringify(result).includes('test-secret-do-not-return'), false);
});

test('n8n MCP rejects non-HTTPS endpoints without sending credentials', async () => {
  let requestMade = false;
  const result = await probeN8nMcpHealth(
    { url: 'http://example.n8n.cloud/mcp-server/http', apiKey: 'test-secret-do-not-return' },
    async () => { requestMade = true; return new Response(JSON.stringify(validInitialize)); },
  );

  assert.equal(requestMade, false);
  assert.equal(result.status, 'BROKEN');
  assert.equal(result.actualCall, false);
  assert.match(result.evidence, /HTTPS/i);
});
