import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createTemporalPersistenceContext,
  verifyTemporalPersistenceContext,
} from '../src/adapters/temporal-persistence-context';

test('Temporal persistence context is signed, tenant-bound, and workflow-bound', () => {
  const original = process.env.TEMPORAL_WORKFLOW_OWNERSHIP_SECRET;
  process.env.TEMPORAL_WORKFLOW_OWNERSHIP_SECRET = 'temporal-test-secret';

  try {
    const context = createTemporalPersistenceContext(
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
      'wf-123',
      60_000,
    );

    assert.ok(context);
    assert.deepEqual(verifyTemporalPersistenceContext(context, 'wf-123'), {
      organizationId: '11111111-1111-1111-1111-111111111111',
      userId: '22222222-2222-2222-2222-222222222222',
      workflowId: 'wf-123',
    });
    assert.equal(verifyTemporalPersistenceContext(context, 'wf-other'), null);

    const tampered = { ...context, userId: '33333333-3333-3333-3333-333333333333' };
    assert.equal(verifyTemporalPersistenceContext(tampered, 'wf-123'), null);
  } finally {
    if (original === undefined) delete process.env.TEMPORAL_WORKFLOW_OWNERSHIP_SECRET;
    else process.env.TEMPORAL_WORKFLOW_OWNERSHIP_SECRET = original;
  }
});
