import { createRequire } from "node:module";
import { isAuthoritativelyVerified } from "../src/utils/execution-verification";

const require = createRequire(import.meta.url);
const { app } = require("../dist/server.cjs") as typeof import("../server");

// Production response boundary: an execution record cannot be reported as success
// unless authoritative verification evidence exists. This protects the public API
// even when an older bundled server path assembles a synthetic VERIFIED record.
app.use("/api/agent/command", (_req: any, res: any, next: any) => {
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    const record = body?.executionRecord;
    if (record) {
      const verified = isAuthoritativelyVerified({
        state_history: Array.isArray(record.state_history) ? record.state_history : [],
        evidence: typeof record.evidence === "string" ? record.evidence : "",
        verificationStatus: record.verificationStatus,
        errors: Array.isArray(record.errors) ? record.errors : [],
        actionsExecuted: Array.isArray(record.actionsExecuted) ? record.actionsExecuted : [],
      });

      if (!verified && body?.success === true) {
        res.statusCode = 409;
        return originalJson({
          ...body,
          success: false,
          error: "Authoritative verification evidence is required before success.",
          executionRecord: {
            ...record,
            verificationStatus: "FAILED",
            state_history: Array.isArray(record.state_history)
              ? record.state_history.filter((state: string) => state !== "VERIFIED")
              : [],
            errors: [
              ...(Array.isArray(record.errors) ? record.errors : []),
              "NO_EVIDENCE_NO_SUCCESS",
            ],
          },
        });
      }
    }
    return originalJson(body);
  };
  next();
});

export default app;

// Trigger fresh production deployment after environment configuration update.
