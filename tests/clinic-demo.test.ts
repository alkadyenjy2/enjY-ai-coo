/**
 * Clinic Demo engine — contract tests.
 *
 * These are the assertions behind every claim made in the demo UI:
 * qualification rubric, idempotency, booking, reminders, bounded follow-up,
 * guardrail handoff and reporting.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  ClinicEngine,
  FOLLOWUP_1_OFFSET_MINUTES,
  FOLLOWUP_2_OFFSET_MINUTES,
  REMINDER_24H_OFFSET_MINUTES,
  REMINDER_SAMEDAY_OFFSET_MINUTES,
  detectPrimaryService,
  idempotencyKeyFor,
  normaliseChannel,
  qualifyLead,
} from "../src/clinic/engine";

const HIGH_INTENT = {
  full_name: "Sarah Ahmed",
  phone: "+201000000000",
  email: "sarah@example.com",
  channel: "whatsapp",
  service_interest: "Botox",
  message: "How much is Botox and do you have an appointment this week?",
  external_id: "test-botox-001",
};

const GUARDRAIL = {
  full_name: "Rana Mostafa",
  phone: "+201000000022",
  email: "",
  channel: "messenger",
  service_interest: "Botox",
  message: "I am pregnant, is Botox safe for me right now?",
  external_id: "test-guardrail-001",
};

const LOW_INTENT = {
  full_name: "Omar Hassan",
  phone: "",
  email: "",
  channel: "web",
  service_interest: "",
  message: "hi",
  external_id: "test-low-001",
};

test("qualification rubric: high-intent lead is qualified with a high score", () => {
  const result = qualifyLead(HIGH_INTENT);
  assert.equal(result.status, "qualified");
  assert.ok(result.lead_score >= 65, `expected >= 65, got ${result.lead_score}`);
  assert.ok(result.lead_score <= 100);
  assert.equal(result.primary_service, "Botox");
  assert.equal(result.engine, "local-deterministic");
  assert.equal(result.medical_guardrail_triggered, false);
  assert.ok(result.qualification_reason.length > 20);
  // Contract keys the Make Gemini module must return.
  for (const key of ["lead_score", "status", "qualification_reason", "primary_service"]) {
    assert.ok(key in result, `missing contract key ${key}`);
  }
});

test("qualification rubric: clinical-safety question is routed to a human", () => {
  const result = qualifyLead(GUARDRAIL);
  assert.equal(result.status, "needs_human");
  assert.equal(result.medical_guardrail_triggered, true);
  assert.match(result.qualification_reason, /human/i);
});

test("qualification rubric: thin message is unqualified, never pressured", () => {
  const result = qualifyLead(LOW_INTENT);
  assert.equal(result.status, "unqualified");
  assert.ok(result.lead_score < 65);
});

test("qualification rubric: opt-out language drops the score hard", () => {
  const result = qualifyLead({ ...HIGH_INTENT, message: "No thanks, not interested. Stop messaging me." });
  assert.equal(result.status, "unqualified");
  assert.ok(result.signals.some((signal) => signal.signal === "opt_out_signal"));
});

test("intake normalisation: channels and service detection are stable", () => {
  assert.equal(normaliseChannel("WA"), "whatsapp");
  assert.equal(normaliseChannel("ig_dm"), "instagram");
  assert.equal(normaliseChannel("fb messenger"), "messenger");
  assert.equal(normaliseChannel(undefined), "demo");
  assert.equal(detectPrimaryService("", "I want lip fillers please"), "Dermal Fillers");
  assert.equal(detectPrimaryService("Botox", "how much?"), "Botox");
  assert.equal(detectPrimaryService("", "hello"), "General consultation");
});

test("idempotency: same external_id never creates a second lead", () => {
  const engine = new ClinicEngine();
  const first = engine.intake(HIGH_INTENT);
  const second = engine.intake(HIGH_INTENT);

  assert.equal(second.lead.id, first.lead.id);
  assert.equal(engine.listLeads().length, 1);
  assert.equal(engine.metrics().leads, 1);
  assert.equal(engine.metrics().deduplicated_messages, 1);
  assert.ok(second.events.some((event) => event.type === "intake.deduplicated"));
  // The duplicate message is still recorded, but flagged.
  assert.ok(second.messages.some((message) => message.deduplicated === true));
});

test("idempotency: key falls back to a stable hash when external_id is absent", () => {
  const a = idempotencyKeyFor({ ...HIGH_INTENT, external_id: "" });
  const b = idempotencyKeyFor({ ...HIGH_INTENT, external_id: "" });
  assert.equal(a, b);
  assert.match(a, /^hash:/);
  assert.equal(idempotencyKeyFor(HIGH_INTENT), "ext:test-botox-001");
});

test("booking: creates a confirmed appointment, schedules reminders, stops follow-ups", () => {
  const engine = new ClinicEngine();
  const snapshot = engine.intake(HIGH_INTENT);
  const leadId = snapshot.lead.id;

  // A follow-up ladder exists before booking.
  const beforeFollowups = snapshot.notifications.filter((n) => n.kind.startsWith("followup"));
  assert.equal(beforeFollowups.length, 2);
  assert.equal(beforeFollowups[0].fire_after_minutes, FOLLOWUP_1_OFFSET_MINUTES);
  assert.equal(beforeFollowups[1].fire_after_minutes, FOLLOWUP_2_OFFSET_MINUTES);

  const slot = engine.availableSlots().find((candidate) => candidate.available)!;
  const booked = engine.book(leadId, slot.id);

  assert.ok(booked.appointment, "appointment record missing");
  assert.equal(booked.appointment!.status, "confirmed");
  assert.equal(booked.appointment!.adapter, "demo-booking-adapter");
  assert.equal(booked.lead.booked, true);
  assert.equal(booked.lead.next_action, "Reminder scheduled");

  const kinds = booked.notifications.map((n) => n.kind);
  assert.ok(kinds.includes("confirmation"));
  assert.ok(kinds.includes("reminder_24h"));
  assert.ok(kinds.includes("reminder_sameday"));
  assert.equal(
    booked.notifications.filter((n) => n.kind.startsWith("followup")).length,
    0,
    "follow-up ladder must be cancelled once the lead books",
  );
  assert.ok(booked.events.some((event) => event.type === "followup.stopped"));
  assert.ok(booked.events.some((event) => event.type === "booking.created"));
});

test("booking: re-submitting the same lead is idempotent (no duplicate appointment)", () => {
  const engine = new ClinicEngine();
  const { lead } = engine.intake(HIGH_INTENT);
  const slot = engine.availableSlots().find((candidate) => candidate.available)!;
  const first = engine.book(lead.id, slot.id);
  const second = engine.book(lead.id, slot.id);
  assert.equal(second.appointment!.id, first.appointment!.id);
  assert.equal(engine.metrics().booked, 1);
});

test("booking: unavailable and unknown slots are rejected", () => {
  const engine = new ClinicEngine();
  const { lead } = engine.intake(HIGH_INTENT);
  assert.throws(() => engine.book(lead.id, "slot-does-not-exist"), /unknown slot/);
  const unavailable = engine.availableSlots().find((candidate) => !candidate.available);
  if (unavailable) {
    assert.throws(() => engine.book(lead.id, unavailable.id), /unavailable/);
  }
});

test("handoff: needs_human sets handoff_required, halts AI and logs an escalation", () => {
  const engine = new ClinicEngine();
  const snapshot = engine.intake(GUARDRAIL);

  assert.equal(snapshot.lead.handoff_required, true);
  assert.equal(snapshot.lead.status, "needs_human");
  assert.equal(snapshot.lead.next_action, "Human escalation");
  assert.ok(snapshot.handoff, "handoff record missing");
  assert.equal(snapshot.handoff!.ai_autonomy, "halted");
  assert.equal(snapshot.handoff!.owner, "human_agent");
  assert.ok(snapshot.events.some((event) => event.type === "handoff.required"));
  assert.ok(snapshot.events.some((event) => event.type === "handoff.escalated"));
  // The AI must not answer the clinical question itself.
  const reply = snapshot.messages.find((message) => message.direction === "outbound")!;
  assert.equal(reply.author, "system");
  assert.match(reply.body, /clinical team/i);
  assert.equal(engine.metrics().handoffs, 1);
});

test("virtual clock: reminders and follow-ups fire deterministically", () => {
  const engine = new ClinicEngine();
  const { lead } = engine.intake(HIGH_INTENT);

  const atZero = engine.snapshot(lead.id, 0);
  assert.equal(atZero.notifications.filter((n) => n.status === "sent").length, 0);

  const afterFollowup1 = engine.snapshot(lead.id, FOLLOWUP_1_OFFSET_MINUTES);
  const sent = afterFollowup1.notifications.filter((n) => n.status === "sent").map((n) => n.kind);
  assert.deepEqual(sent, ["followup_1"]);

  const afterFollowup2 = engine.snapshot(lead.id, FOLLOWUP_2_OFFSET_MINUTES);
  assert.deepEqual(
    afterFollowup2.notifications.filter((n) => n.status === "sent").map((n) => n.kind).sort(),
    ["followup_1", "followup_2"],
  );
  assert.equal(afterFollowup2.lead.next_action, "Complete");

  // Booked leads get the reminder pair instead.
  const engine2 = new ClinicEngine();
  const bookedLead = engine2.intake(HIGH_INTENT).lead;
  const slot = engine2.availableSlots().find((candidate) => candidate.available)!;
  engine2.book(bookedLead.id, slot.id);

  const beforeReminder = engine2.snapshot(bookedLead.id, REMINDER_24H_OFFSET_MINUTES - 1);
  assert.deepEqual(
    beforeReminder.notifications.filter((n) => n.status === "sent").map((n) => n.kind),
    ["confirmation"],
  );

  const atReminder = engine2.snapshot(bookedLead.id, REMINDER_24H_OFFSET_MINUTES + REMINDER_SAMEDAY_OFFSET_MINUTES);
  const reminderKinds = atReminder.notifications.filter((n) => n.status === "sent").map((n) => n.kind);
  assert.ok(reminderKinds.includes("reminder_24h"));
  assert.ok(reminderKinds.includes("reminder_sameday"));
});

test("reporting: metrics reflect the real persisted demo state", () => {
  const engine = new ClinicEngine();
  engine.intake(HIGH_INTENT);
  engine.intake(GUARDRAIL);
  engine.intake(LOW_INTENT);
  engine.intake(HIGH_INTENT); // duplicate

  const before = engine.metrics();
  assert.equal(before.leads, 3);
  assert.equal(before.qualified, 1);
  assert.equal(before.needs_human, 1);
  assert.equal(before.unqualified, 1);
  assert.equal(before.booked, 0);
  assert.equal(before.booking_rate, 0);
  assert.equal(before.deduplicated_messages, 1);

  const slot = engine.availableSlots().find((candidate) => candidate.available)!;
  engine.book(engine.listLeads().find((lead) => lead.status === "qualified")!.id, slot.id);

  const after = engine.metrics();
  assert.equal(after.booked, 1);
  assert.equal(after.booking_rate, 100);
  assert.equal(after.unbooked_qualified, 0);
  assert.equal(after.data_source, "in-memory-demo");
});

test("guardrails: the engine never emits real clinic pricing", () => {
  const engine = new ClinicEngine();
  const snapshot = engine.intake(HIGH_INTENT);
  const bodies = snapshot.messages.map((message) => message.body).join(" ");
  assert.match(bodies, /DEMO/i);
  assert.doesNotMatch(bodies, /\d{3,}\s*(EGP|USD|\$|جنيه)/i);
});

test("workflow view: every pipeline step is reported with a state", () => {
  const engine = new ClinicEngine();
  const snapshot = engine.intake(HIGH_INTENT);
  const keys = snapshot.steps.map((step) => step.key);
  assert.deepEqual(keys, [
    "message",
    "ai_receptionist",
    "qualification",
    "crm",
    "booking",
    "confirmation",
    "reminder",
    "followup",
    "handoff",
    "reporting",
  ]);
  for (const step of snapshot.steps) {
    assert.ok(["idle", "running", "success", "skipped", "failed"].includes(step.state), `bad state ${step.state}`);
    assert.ok(step.detail.length > 0, `${step.key} has no detail`);
  }
});
