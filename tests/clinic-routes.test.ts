/**
 * Clinic Demo API — route contract tests against the real Express app.
 *
 * Runs the actual `server.ts` app in Vercel mode (so no dev server is started)
 * and exercises the public `/api/clinic/*` surface end to end.
 */

import { createServer } from "node:http";
import assert from "node:assert/strict";
import test from "node:test";

process.env.VERCEL = "1";
process.env.NODE_ENV = "test";
delete process.env.MAKE_CLINIC_WEBHOOK_URL;

const { app } = await import("../server.ts");

let base = "";
let server: ReturnType<typeof createServer>;

test("clinic API server boots", async () => {
  server = createServer(app as any);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  base = `http://127.0.0.1:${address.port}`;
});

test("GET /api/clinic/status reports demo mode and never leaks secrets", async () => {
  const response = await fetch(`${base}/api/clinic/status`);
  assert.equal(response.status, 200);
  const status = await response.json();

  assert.equal(status.mode, "NON-PRODUCTION DEMO");
  assert.equal(status.make_scenario_id, "7290390");
  assert.equal(status.booking_adapter, "demo-booking-adapter");
  assert.equal(status.notification_adapter, "demo-notification-adapter");
  assert.deepEqual(status.supabase_tables, [
    "clinic_demo_leads",
    "clinic_demo_conversations",
    "clinic_demo_appointments",
    "clinic_demo_events",
  ]);
  assert.ok(Array.isArray(status.live_claims) && status.live_claims.length > 0);

  const raw = JSON.stringify(status);
  assert.doesNotMatch(raw, /service_role/i);
  assert.doesNotMatch(raw, /eyJ[A-Za-z0-9_-]{20,}/); // no JWT-shaped key
});

test("POST /api/clinic/leads runs the pipeline and returns a full snapshot", async () => {
  const response = await fetch(`${base}/api/clinic/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      full_name: "Test Lead",
      phone: "+201000009999",
      email: "test@example.com",
      channel: "whatsapp",
      service_interest: "Botox",
      message: "How much is Botox and can I book an appointment this week?",
      external_id: "route-test-001",
    }),
  });
  assert.equal(response.status, 201);
  const body = await response.json();

  assert.equal(body.success, true);
  assert.equal(body.snapshot.lead.status, "qualified");
  assert.ok(body.snapshot.lead.lead_score >= 65);
  assert.equal(body.snapshot.steps.length, 10);
  assert.ok(body.snapshot.events.length >= 4);
  assert.equal(body.snapshot.data_source, "in-memory-demo");

  // Duplicate delivery must be absorbed, not duplicated.
  const duplicate = await fetch(`${base}/api/clinic/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ external_id: "route-test-001", message: "How much is Botox and can I book an appointment this week?" }),
  });
  const duplicateBody = await duplicate.json();
  assert.equal(duplicateBody.snapshot.lead.id, body.snapshot.lead.id);
});

test("POST /api/clinic/leads rejects a payload with no message", async () => {
  const response = await fetch(`${base}/api/clinic/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ full_name: "No Message" }),
  });
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.success, false);
  assert.match(body.error, /message is required/);
});

test("booking route creates an appointment and updates the CRM record", async () => {
  const leadResponse = await fetch(`${base}/api/clinic/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      full_name: "Booking Lead",
      phone: "+201000008888",
      channel: "instagram",
      service_interest: "Dermal Fillers",
      message: "I want lip fillers, how much and can I book this week please?",
      external_id: "route-test-booking-001",
    }),
  });
  const { snapshot } = await leadResponse.json();

  const slotsResponse = await fetch(`${base}/api/clinic/slots`);
  const { slots } = await slotsResponse.json();
  const slot = slots.find((candidate: any) => candidate.available);
  assert.ok(slot, "no available demo slot");

  const bookingResponse = await fetch(`${base}/api/clinic/leads/${snapshot.lead.id}/book`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slot_id: slot.id }),
  });
  assert.equal(bookingResponse.status, 201);
  const booked = await bookingResponse.json();

  assert.equal(booked.snapshot.appointment.status, "confirmed");
  assert.equal(booked.snapshot.lead.booked, true);
  assert.equal(booked.snapshot.lead.next_action, "Reminder scheduled");
  assert.equal(
    booked.snapshot.notifications.filter((n: any) => n.kind.startsWith("followup")).length,
    0,
  );
});

test("virtual clock route fires follow-ups at +6h and +24h", async () => {
  const leadResponse = await fetch(`${base}/api/clinic/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      full_name: "Clock Lead",
      phone: "+201000007777",
      channel: "web",
      service_interest: "Skin Boosters",
      message: "Please send pricing for skin boosters and your availability, I want to book soon.",
      external_id: "route-test-clock-001",
    }),
  });
  const { snapshot } = await leadResponse.json();

  const at6h = await (await fetch(`${base}/api/clinic/leads/${snapshot.lead.id}?minutes=360`)).json();
  assert.deepEqual(
    at6h.snapshot.notifications.filter((n: any) => n.status === "sent").map((n: any) => n.kind),
    ["followup_1"],
  );

  const at24h = await (await fetch(`${base}/api/clinic/leads/${snapshot.lead.id}?minutes=1440`)).json();
  assert.deepEqual(
    at24h.snapshot.notifications.filter((n: any) => n.status === "sent").map((n: any) => n.kind).sort(),
    ["followup_1", "followup_2"],
  );
});

test("handoff route path marks the lead and escalates", async () => {
  const response = await fetch(`${base}/api/clinic/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      full_name: "Guardrail Lead",
      channel: "messenger",
      service_interest: "Botox",
      message: "I am pregnant, is Botox safe for me?",
      external_id: "route-test-guardrail-001",
    }),
  });
  const { snapshot } = await response.json();
  assert.equal(snapshot.lead.handoff_required, true);
  assert.equal(snapshot.lead.status, "needs_human");
  assert.ok(snapshot.handoff);
  assert.ok(snapshot.events.some((e: any) => e.type === "handoff.escalated"));
});

test("metrics route aggregates the demo dataset", async () => {
  const response = await fetch(`${base}/api/clinic/metrics`);
  assert.equal(response.status, 200);
  const { metrics } = await response.json();
  assert.ok(metrics.leads >= 5, `expected seeded leads, got ${metrics.leads}`);
  assert.ok(metrics.qualified >= 1);
  assert.ok(metrics.booked >= 1);
  assert.ok(metrics.handoffs >= 1);
  assert.equal(typeof metrics.booking_rate, "number");
  assert.equal(metrics.data_source, "in-memory-demo");
});

test("make webhook proxy is honest when the webhook is not configured", async () => {
  const response = await fetch(`${base}/api/clinic/make-webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ full_name: "Probe Lead" }),
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, false);
  assert.equal(body.delivered, false);
  assert.equal(body.reason, "not_configured");
  assert.match(body.detail, /not a Make execution/i);
});

test("clinic routes are public — reachable without auth", async () => {
  const response = await fetch(`${base}/api/clinic/leads`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.ok(Array.isArray(body.leads));
});

test("clinic API server closes", async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});
