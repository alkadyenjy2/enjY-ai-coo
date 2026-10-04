import test from "node:test";
import assert from "node:assert/strict";
import { formatScholarshipResults, isScholarshipDiscoveryIntent } from "../src/agents/scholarship-discovery";

test("detects Arabic and English scholarship discovery intents", () => {
  assert.equal(isScholarshipDiscoveryIntent("هاتلي منح ماجستير"), true);
  assert.equal(isScholarshipDiscoveryIntent("find scholarships"), true);
  assert.equal(isScholarshipDiscoveryIntent("check system health"), false);
});

test("formats only the supplied verified result records without inventing eligibility", () => {
  const text = formatScholarshipResults([{
    id: "1",
    title: "Test Scholarship",
    provider: "Test Provider",
    country: "US",
    level: "Master",
    field: "CS",
    funding_type: "Full",
    amount: 10000,
    currency: "USD",
    deadline: "2027-01-01T00:00:00.000Z",
    official_source_url: "https://example.org/scholarship",
    source_status: "VERIFIED",
  }]);
  assert.match(text, /Test Scholarship/);
  assert.match(text, /https:\/\/example\.org\/scholarship/);
  assert.match(text, /لا تمثل قبولًا أو أهلية نهائية/);
});
