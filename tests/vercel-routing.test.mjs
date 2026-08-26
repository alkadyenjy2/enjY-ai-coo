import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.VERCEL = '1';
process.env.NODE_ENV = 'production';
const { default: app } = await import('../api/index.ts');

test('Express API exposes health and readiness routes in Vercel mode', async () => {
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}`;

  try {
    const health = await fetch(`${base}/api/health`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).status, 'ok');

    const readiness = await fetch(`${base}/api/readiness`);
    assert.ok([200, 503].includes(readiness.status));
    assert.ok(['ready', 'degraded'].includes((await readiness.json()).status));

    const legacyReadiness = await fetch(`${base}/api/ready`);
    assert.equal(legacyReadiness.status, readiness.status);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
