import { Connection } from '@temporalio/client';
import { Worker } from '@temporalio/worker';
import * as activities from './temporal-proof/activities';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const address = process.env.TEMPORAL_ADDRESS;
const namespace = process.env.TEMPORAL_NAMESPACE || 'default';
const taskQueue = process.env.TEMPORAL_TASK_QUEUE || 'ai-core-conformance-queue';

if (!address) {
  console.error('TEMPORAL_ADDRESS is required for the production worker.');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workflowsPath = path.resolve(__dirname, './temporal-proof/workflows.ts');

async function main() {
  console.log(`Connecting Temporal worker to ${address} (namespace=${namespace}, taskQueue=${taskQueue})`);

  const connection = await Connection.connect({ address });

  const worker = await Worker.create({
    connection,
    namespace,
    taskQueue,
    workflowsPath,
    activities,
  });

  console.log('Temporal worker started.');
  await worker.run();
}

main().catch((error) => {
  console.error('Temporal worker failed:', error);
  process.exit(1);
});
