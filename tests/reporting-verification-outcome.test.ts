import test from 'node:test';
import assert from 'node:assert/strict';
import { getReportingVerificationStatus } from '../server';

test('reporting does not become VERIFIED when a connector action failed', () => {
  const result = getReportingVerificationStatus([
    { tool: 'Connector Health Tool', status: 'failed' },
  ]);

  assert.equal(result, 'FAILED');
});
