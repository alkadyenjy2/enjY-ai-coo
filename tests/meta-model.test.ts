import test from "node:test";
import assert from "node:assert/strict";
import { callMetaModelResponses } from "../src/adapters/meta-model";

test("Meta Model adapter sends Responses API requests with the configured key", async () => {
  const previousKey = process.env.META_MODEL_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.META_MODEL_API_KEY = "test-meta-key";

  let captured: any = null;
  globalThis.fetch = async (_input, init) => {
    captured = init;
    return new Response(JSON.stringify({
      id: "resp_meta_test",
      output: [
        {
          type: "message",
          content: [{ type: "output_text", text: "ok" }],
        },
        {
          type: "function_call",
          name: "query_supabase",
          arguments: JSON.stringify({ table: "leads" }),
          call_id: "call_meta_1",
        },
      ],
    }), { status: 200, headers: { "content-type": "application/json" } });
  };

  try {
    const result = await callMetaModelResponses({
      model: "muse-spark-1.3",
      instructions: "test",
      input: ["hello"],
      tools: [{ type: "function", name: "query_supabase", parameters: { type: "object" } }],
      previousResponseId: "resp_previous",
    });

    assert.equal(result.id, "resp_meta_test");
    assert.equal(result.text, "ok");
    assert.deepEqual(result.functionCalls, [{
      name: "query_supabase",
      args: { table: "leads" },
      callId: "call_meta_1",
    }]);

    const body = JSON.parse(String(captured.body));
    assert.equal(body.model, "muse-spark-1.3");
    assert.equal(body.previous_response_id, "resp_previous");
    assert.equal(body.input[0], "hello");
    assert.equal(captured.headers.Authorization, "Bearer test-meta-key");
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.META_MODEL_API_KEY;
    else process.env.META_MODEL_API_KEY = previousKey;
  }
});

test("Meta Model adapter fails closed without a key", async () => {
  const previousKey = process.env.META_MODEL_API_KEY;
  delete process.env.META_MODEL_API_KEY;
  try {
    await assert.rejects(
      () => callMetaModelResponses({
        model: "muse-spark-1.3",
        instructions: "test",
        input: ["hello"],
      }),
      /META_MODEL_API_KEY is not configured/,
    );
  } finally {
    if (previousKey === undefined) delete process.env.META_MODEL_API_KEY;
    else process.env.META_MODEL_API_KEY = previousKey;
  }
});
