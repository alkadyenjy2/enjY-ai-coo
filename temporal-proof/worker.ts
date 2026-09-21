import path from "node:path";
import { readFile } from "node:fs/promises";
import { NativeConnection, Worker } from "@temporalio/worker";
import * as activities from "./activities";

const TASK_QUEUE = process.env.TEMPORAL_TASK_QUEUE || "ai-core-conformance-queue";

async function main() {
  const address = process.env.TEMPORAL_ADDRESS?.trim();
  if (!address) throw new Error("TEMPORAL_ADDRESS_REQUIRED_FOR_WORKER");

  const apiKey = process.env.TEMPORAL_API_KEY?.trim();
  const namespace = process.env.TEMPORAL_NAMESPACE?.trim() || "default";
  const bundlePath = path.resolve(process.cwd(), "dist/workflow-bundle.js");
  const workflowCode = await readFile(bundlePath, "utf8");

  const connection = await NativeConnection.connect({
    address,
    apiKey: apiKey || undefined,
    tls: apiKey ? true : undefined,
  });

  const worker = await Worker.create({
    connection,
    namespace,
    taskQueue: TASK_QUEUE,
    workflowBundle: { code: workflowCode },
    activities,
  });

  console.log(`Temporal worker polling ${TASK_QUEUE} in namespace ${namespace}`);
  await worker.run();
}

main().catch((error) => {
  console.error("Temporal worker failed:", error?.message || error);
  process.exit(1);
});
