import test from "node:test";
import assert from "node:assert/strict";
import { gateResponse, requireEvidence, MissingEvidenceError } from "../src/ai-gateway/evidence";

test("evidence gate accepts complete evidence", () => {
  const result = gateResponse("رد موثوق", {
    source_post_id: "post-1",
    metric: "price",
    image_index: 2,
  });

  assert.ok(result);
  assert.ok(result.evidence_id);
});

test("evidence gate rejects missing evidence", () => {
  assert.equal(gateResponse("رد بدون إثبات"), null);
  assert.throws(() => requireEvidence("رد بدون إثبات"), MissingEvidenceError);
});

test("evidence gate rejects malformed evidence", () => {
  assert.equal(
    gateResponse("رد", {
      source_post_id: "",
      metric: "price",
      image_index: 0,
    }),
    null,
  );
});
