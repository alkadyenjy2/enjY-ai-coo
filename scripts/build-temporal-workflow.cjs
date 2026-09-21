const { bundleWorkflowCode } = require("@temporalio/worker");
const { writeFile, mkdir } = require("node:fs/promises");
const path = require("node:path");

async function main() {
  const { code } = await bundleWorkflowCode({
    workflowsPath: require.resolve("../temporal-proof/workflows.ts"),
  });
  await mkdir(path.resolve("dist"), { recursive: true });
  await writeFile(path.resolve("dist/workflow-bundle.js"), code, "utf8");
  console.log("Temporal workflow bundle written to dist/workflow-bundle.js");
}

main().catch((error) => {
  console.error("Temporal workflow bundle failed:", error);
  process.exit(1);
});
