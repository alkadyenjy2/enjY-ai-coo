import test from "node:test";
import assert from "node:assert/strict";
import {
  createMediaExecutionJob,
  executeMediaJob,
  normalizeLightingInstruction,
  type MediaExecutionProvider,
} from "../src/execution/media-execution.ts";

test("normalizes lighting:darker without executing", () => {
  assert.equal(normalizeLightingInstruction("lighting:darker"), "lighting");
});

test("creates a durable-shaped queued job with an idempotency key", () => {
  const job = createMediaExecutionJob({
    operation: "lighting",
    sourceArtifactUrl: "https://example.com/input.mp4",
    instruction: "lighting:darker",
    idempotencyKey: "telegram:123:abc",
    requestedBy: { userId: "user-1", organizationId: "org-1" },
  }, "2026-09-23T00:00:00.000Z");

  assert.equal(job.id, "telegram:123:abc");
  assert.equal(job.status, "QUEUED");
  assert.equal(job.evidence.verification.status, "PENDING");
});

test("fails closed when a provider returns an unverified artifact", async () => {
  const provider: MediaExecutionProvider = {
    name: "test-provider",
    async execute() {
      return {
        providerJobId: "job-1",
        outputArtifact: { url: "https://example.com/output.mp4", contentType: "video/mp4" },
      };
    },
    async verify() {
      return { passed: false, checks: ["artifact_exists"], details: "verification fixture failed" };
    },
  };

  const job = createMediaExecutionJob({
    operation: "lighting",
    sourceArtifactUrl: "https://example.com/input.mp4",
    instruction: "lighting:darker",
    idempotencyKey: "job-verify-fail",
    requestedBy: { userId: "user-1", organizationId: "org-1" },
  });

  const result = await executeMediaJob(job, provider);
  assert.equal(result.status, "VERIFICATION_FAILED");
  assert.equal(result.evidence.verification.status, "FAILED");
});

test("succeeds only after provider verification", async () => {
  const provider: MediaExecutionProvider = {
    name: "test-provider",
    async execute() {
      return {
        providerJobId: "job-2",
        outputArtifact: { url: "https://example.com/output.mp4", contentType: "video/mp4" },
      };
    },
    async verify() {
      return { passed: true, checks: ["artifact_exists", "artifact_readable", "provider_job_complete"] };
    },
  };

  const job = createMediaExecutionJob({
    operation: "lighting",
    sourceArtifactUrl: "https://example.com/input.mp4",
    instruction: "lighting:darker",
    idempotencyKey: "job-success",
    requestedBy: { userId: "user-1", organizationId: "org-1" },
  });

  const result = await executeMediaJob(job, provider);
  assert.equal(result.status, "SUCCEEDED");
  assert.equal(result.evidence.verification.status, "PASSED");
  assert.equal(result.evidence.providerJobId, "job-2");
});
