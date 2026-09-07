import test from 'node:test';
import assert from 'node:assert/strict';
import { mapOperationalRecordsToExecutionLogs } from '../src/utils/operationalLogs';

test('maps persisted operational records into dashboard execution logs', () => {
  const logs = mapOperationalRecordsToExecutionLogs([
    {
      id: 'exec-1',
      timestamp: '2026-09-07T10:00:00.000Z',
      command: 'Run workflow now',
      project: 'Core Operations HQ',
      final_state_reason: 'Workflow completed and verified.',
      verificationStatus: 'VERIFIED',
      errors: [],
      approvalStatus: 'AUTO_APPROVED',
    },
    {
      id: 'exec-2',
      timestamp: '2026-09-07T10:01:00.000Z',
      command: 'Deploy project',
      project: 'Core Operations HQ',
      final_state_reason: 'Execution failed.',
      verificationStatus: 'FAILED',
      errors: ['deployment failed'],
      approvalStatus: 'AUTO_APPROVED',
    },
  ]);

  assert.equal(logs.length, 2);
  assert.equal(logs[0].id, 'exec-1');
  assert.equal(logs[0].status, 'success');
  assert.equal(logs[0].project, 'Core Operations HQ');
  assert.equal(logs[1].status, 'failed');
});
