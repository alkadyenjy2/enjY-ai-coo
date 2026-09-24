import test from "node:test";
import assert from "node:assert/strict";

test("Kolbo provider requires a production API key", async () => {
  const previous = process.env.KOLBO_API_KEY;
  delete process.env.KOLBO_API_KEY;
  const { kolboMediaExecutionProvider } = await import("../src/execution/kolbo-provider.ts");
  await assert.rejects(() => kolboMediaExecutionProvider.execute({ operation: "lighting", sourceArtifactUrl: "https://example.com/input.mp4", instruction: "lighting:darker", idempotencyKey: "test-kolbo-missing-key", requestedBy: { userId: "user-1", organizationId: "org-1" } }), /KOLBO_API_KEY is required/);
  if (previous) process.env.KOLBO_API_KEY = previous;
});

test("Kolbo provider declares the expected provider name", async () => {
  const { kolboMediaExecutionProvider } = await import("../src/execution/kolbo-provider.ts");
  assert.equal(kolboMediaExecutionProvider.name, "kolbo");
});