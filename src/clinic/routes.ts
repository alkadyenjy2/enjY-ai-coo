/**
 * Clinic Demo — public API routes.
 *
 * These routes are deliberately NOT behind the auth middleware: the clinic demo
 * is the portfolio case study and must be viewable by a recruiter without
 * credentials. They expose demo data only — never service-role keys, Make
 * credentials or any other secret.
 *
 * Every endpoint reports its own `data_source` so the UI can distinguish
 * "DEMO (in-memory)" from "LIVE (Supabase)".
 */

import { Router } from "express";
import type { Request, Response } from "express";
import {
  CLINIC_TABLES,
  ClinicValidationError,
  MAKE_SCENARIO_ID,
  MAKE_SCENARIO_NAME,
  clinicEngine,
} from "./engine";

export const clinicRouter = Router();

/** Seed rows so the reporting dashboard is never an empty shell. */
const SEED_LEADS = [
  {
    full_name: "Sarah Ahmed",
    phone: "+201000000000",
    email: "sarah@example.com",
    channel: "whatsapp",
    service_interest: "Botox",
    message: "How much is Botox and do you have an appointment this week?",
    external_id: "demo-botox-001",
  },
  {
    full_name: "Mona Adel",
    phone: "+201000000011",
    email: "",
    channel: "instagram",
    service_interest: "Dermal Fillers",
    message: "Hi! I want lip fillers, how much does it cost and can I book this week?",
    external_id: "demo-filler-002",
  },
  {
    full_name: "Rana Mostafa",
    phone: "+201000000022",
    email: "rana@example.com",
    channel: "messenger",
    service_interest: "Botox",
    message: "I am pregnant, is Botox safe for me right now?",
    external_id: "demo-guardrail-003",
  },
  {
    full_name: "Omar Hassan",
    phone: "",
    email: "",
    channel: "web",
    service_interest: "Laser Hair Removal",
    message: "hi",
    external_id: "demo-lowintent-004",
  },
  {
    full_name: "Nour Ibrahim",
    phone: "+201000000033",
    email: "nour@example.com",
    channel: "whatsapp",
    service_interest: "Skin Boosters",
    message: "Please send me the price list for skin boosters and your weekend availability, I want to book soon.",
    external_id: "demo-skinbooster-005",
  },
];

let seeded = false;

function ensureSeeded(): void {
  if (seeded) return;
  seeded = true;
  for (const seed of SEED_LEADS) {
    try {
      const snapshot = clinicEngine.intake(seed);
      // Two qualified demo leads convert, so booking rate is non-zero.
      if (["demo-botox-001", "demo-filler-002"].includes(seed.external_id)) {
        const slot = clinicEngine.availableSlots().find((candidate) => candidate.available);
        if (slot) clinicEngine.book(snapshot.lead.id, slot.id);
      }
    } catch {
      // Seeding must never break server start-up.
    }
  }
}

function publicStatus() {
  ensureSeeded();
  const makeWebhookUrl = process.env.MAKE_CLINIC_WEBHOOK_URL ?? "";
  const supabaseConfigured = Boolean(
    (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) &&
      (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY),
  );
  return {
    mode: "NON-PRODUCTION DEMO" as const,
    data_source: clinicEngine.dataSource,
    qualification_engine: "local-deterministic" as const,
    qualification_model: "local-deterministic-rubric-v1",
    make_scenario_id: MAKE_SCENARIO_ID,
    make_scenario_name: MAKE_SCENARIO_NAME,
    make_webhook_configured: Boolean(makeWebhookUrl),
    make_webhook_target: makeWebhookUrl || null,
    supabase_configured: supabaseConfigured,
    supabase_tables: CLINIC_TABLES,
    booking_adapter: "demo-booking-adapter" as const,
    notification_adapter: "demo-notification-adapter" as const,
    channels_supported: ["whatsapp", "instagram", "messenger", "web", "demo"],
    gemini_key_present: Boolean(process.env.GEMINI_API_KEY),
    live_claims: [
      "No live WhatsApp / Instagram / Messenger credentials are connected in this demo.",
      "Booking uses a labelled demo adapter, not a real calendar provider.",
      "Notifications use a labelled demo adapter, not a live SMS/WhatsApp sender.",
    ],
    timestamp: new Date().toISOString(),
  };
}

clinicRouter.get("/status", (_req: Request, res: Response) => {
  res.json(publicStatus());
});

clinicRouter.post("/leads", (req: Request, res: Response) => {
  ensureSeeded();
  try {
    const minutes = Number(req.body?.simulate_minutes ?? req.query?.minutes ?? 0);
    const snapshot = clinicEngine.intake(req.body ?? {});
    const advanced = clinicEngine.snapshot(snapshot.lead.id, Number.isFinite(minutes) ? minutes : 0);
    res.status(201).json({ success: true, snapshot: advanced, status: publicStatus() });
  } catch (error) {
    if (error instanceof ClinicValidationError) {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Lead intake failed" });
  }
});

clinicRouter.get("/leads/:leadId", (req: Request, res: Response) => {
  ensureSeeded();
  try {
    const minutes = Number(req.query?.minutes ?? 0);
    const snapshot = clinicEngine.snapshot(req.params.leadId, Number.isFinite(minutes) ? minutes : 0);
    res.json({ success: true, snapshot });
  } catch (error) {
    if (error instanceof ClinicValidationError) {
      return res.status(404).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Lead lookup failed" });
  }
});

clinicRouter.get("/leads", (_req: Request, res: Response) => {
  ensureSeeded();
  res.json({ success: true, leads: clinicEngine.listLeads(), data_source: clinicEngine.dataSource });
});

clinicRouter.get("/slots", (_req: Request, res: Response) => {
  ensureSeeded();
  res.json({ success: true, slots: clinicEngine.availableSlots(), adapter: "demo-booking-adapter" });
});

clinicRouter.post("/leads/:leadId/book", (req: Request, res: Response) => {
  ensureSeeded();
  try {
    const slotId = String(req.body?.slot_id ?? "");
    const snapshot = clinicEngine.book(req.params.leadId, slotId);
    res.status(201).json({ success: true, snapshot });
  } catch (error) {
    if (error instanceof ClinicValidationError) {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Booking failed" });
  }
});

clinicRouter.get("/metrics", (_req: Request, res: Response) => {
  ensureSeeded();
  res.json({ success: true, metrics: clinicEngine.metrics() });
});

/**
 * Same-origin proxy to the real Make webhook.
 *
 * Exists so the browser never calls Make directly (CORS + no webhook URL baked
 * into the client bundle) and so the UI can show the REAL network outcome —
 * including a genuine failure — instead of a fabricated success.
 */
clinicRouter.post("/make-webhook", async (req: Request, res: Response) => {
  const target = process.env.MAKE_CLINIC_WEBHOOK_URL ?? "";
  const payload = {
    full_name: String(req.body?.full_name ?? "Sarah Ahmed"),
    phone: String(req.body?.phone ?? "+201000000000"),
    email: String(req.body?.email ?? "sarah@example.com"),
    channel: String(req.body?.channel ?? "demo"),
    service_interest: String(req.body?.service_interest ?? "Botox"),
    message: String(req.body?.message ?? "How much is Botox and do you have an appointment this week?"),
    external_id: String(req.body?.external_id ?? `live-probe-${Date.now()}`),
  };

  if (!target) {
    return res.status(200).json({
      success: false,
      delivered: false,
      reason: "not_configured",
      detail:
        "MAKE_CLINIC_WEBHOOK_URL is not set on this deployment, so no request was sent to Make. This response is not a Make execution.",
      payload_sent: null,
      target: null,
      timestamp: new Date().toISOString(),
    });
  }

  const started = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const upstream = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const text = await upstream.text();
    return res.status(200).json({
      success: upstream.ok,
      delivered: true,
      reason: upstream.ok ? "accepted_by_make" : "make_rejected_request",
      detail: `HTTP ${upstream.status} from Make in ${Date.now() - started}ms. HTTP acceptance alone is NOT proof of a Make execution — check the scenario execution list.`,
      upstream_status: upstream.status,
      upstream_body: text.slice(0, 2000),
      payload_sent: payload,
      target,
      latency_ms: Date.now() - started,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(200).json({
      success: false,
      delivered: false,
      reason: error?.name === "AbortError" ? "timeout" : "network_error",
      detail: `Request to Make failed: ${error?.message ?? "unknown network error"}. No Make execution was created by this attempt.`,
      payload_sent: payload,
      target,
      latency_ms: Date.now() - started,
      timestamp: new Date().toISOString(),
    });
  }
});

/** Test-only helper; disabled unless NODE_ENV=test. */
clinicRouter.post("/__reset", (_req: Request, res: Response) => {
  if (process.env.NODE_ENV !== "test") {
    return res.status(404).json({ success: false, error: "not found" });
  }
  clinicEngine.reset();
  seeded = false;
  return res.json({ success: true });
});
