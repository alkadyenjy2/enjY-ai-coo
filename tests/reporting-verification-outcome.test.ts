import test from 'node:test';
import assert from 'node:assert/strict';

test('reporting does not become VERIFIED when a connector action failed', async () => {
  const previousVercel = process.env.VERCEL;
  process.env.VERCEL = '1';

  try {
    const { getReportingVerificationStatus } = await import('../server');
    const result = getReportingVerificationStatus([
      { tool: 'Connector Health Tool', status: 'failed' },
    ]);

    assert.equal(result, 'FAILED');
  } finally {
    if (previousVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = previousVercel;
  }
});
