import test from "node:test";
import assert from "node:assert/strict";
import { executeWithFailover, AllProvidersFailedError } from "../src/ai-gateway/executor";

const evidence = {
  source_post_id: "post-123",
  metric: "engagement_rate",
  image_index: 0,
};

const candidates = [
  {
    toolId: "groq",
    name: "Groq",
    pricingStatus: "FREE_TIER",
    verificationStatus: "VERIFIED",
    priority: 80,
    fallbackToolIds: ["cerebras"],
  },
  {
    toolId: "cerebras",
    name: "Cerebras",
    pricingStatus: "FREE_TIER",
    verificationStatus: "VERIFIED",
    priority: 60,
    fallbackToolIds: [],
  },
] as any;

test("fails over from Groq to Cerebras and logs evidence", async () => {
  const logged: any[] = [];
  const result = await executeWithFailover(
    candidates,
    { prompt: "hello", evidence },
    async (candidate) => {
      if (candidate.toolId === "groq") throw new Error("GROQ_DOWN");
      return { response: "hello from cerebras", evidence };
    },
    (attempt) => { logged.push(attempt); },
  );

  assert.equal(result.provider, "cerebras");
  assert.equal(result.response, "hello from cerebras");
  assert.equal(result.attempts.length, 2);
  assert.equal(logged[0].status, "FAILED");
  assert.equal(logged[1].status, "VERIFIED");
  assert.ok(logged[1].evidence_id);
});

test("fails closed when every provider fails", async () => {
  await assert.rejects(
    () =>
      executeWithFailover(
        candidates,
        { prompt: "hello", evidence },
        async () => {
          throw new Error("DOWN");
        },
      ),
    (error) => {
      assert.ok(error instanceof AllProvidersFailedError);
      assert.equal(error.attempts.length, 2);
      return true;
    },
  );
});

test("rejects a successful provider response without evidence", async () => {
  await assert.rejects(
    () =>
      executeWithFailover(
        [candidates[0]],
        { prompt: "hello" },
        async () => ({ response: "invented success" }),
      ),
    /ALL_PROVIDERS_FAILED/,
  );
});
