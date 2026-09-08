import { createRequire } from "node:module";

if (process.env.NODE_ENV === "production" && !process.env.TEMPORAL_ADDRESS) {
  throw new Error("PRODUCTION_TEMPORAL_ADDRESS_REQUIRED");
}

const require = createRequire(import.meta.url);
const { app } = require("../dist/server.cjs") as typeof import("../server");

export default app;
