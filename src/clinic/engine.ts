/**
 * Clinic Demo — deterministic automation engine.
 *
 * This is the local, credential-free implementation of the pipeline that the
 * Make scenario "DEMO — Clinic AI Lead Intake (Non-Production)" orchestrates:
 *
 *   Message → AI Receptionist → Qualification → CRM → Booking
 *           → Confirmation → Reminder → Follow-up → Human Handoff → Reporting
 *
 * Design rules enforced here (and covered by tests/clinic-demo.test.ts):
 *  - Nothing is faked: adapters are labelled `demo-*` and every state
 *    transition is emitted as a `clinic_demo_events` style record.
 *  - Idempotency: the same `external_id` (or message hash) never creates a
 *    second lead, a second appointment or a second follow-up.
 *  - Time is a virtual clock. Reminder / follow-up scheduling is a pure
 *    function of `minutesAfterIntake`, so the demo and the tests are
 *    deterministic and reproducible.
 */

import type {
  AppointmentRecord,
  BookingSlot,
  ClinicChannel,
  ClinicEvent,
  ClinicLeadInput,
  ClinicLeadRecord,
  ClinicMetrics,
  HandoffRecord,
  IntakeMessage,
  NextAction,
  NotificationRecord,
  PipelineSnapshot,
  QualificationResult,
  QualificationSignal,
  WorkflowStepView,
} from "./types";

/* ------------------------------------------------------------------ */
/* Configuration                                                       */
/* ------------------------------------------------------------------ */

export const CLINIC_TABLES = [
  "clinic_demo_leads",
  "clinic_demo_conversations",
  "clinic_demo_appointments",
  "clinic_demo_events",
] as const;

export const MAKE_SCENARIO_ID = "7290390";
export const MAKE_SCENARIO_NAME = "DEMO — Clinic AI Lead Intake (Non-Production)";

/** Virtual clock offsets (minutes after intake). */
export const REMINDER_24H_OFFSET_MINUTES = 24 * 60;
export const REMINDER_SAMEDAY_OFFSET_MINUTES = 90;
export const FOLLOWUP_1_OFFSET_MINUTES = 6 * 60;
export const FOLLOWUP_2_OFFSET_MINUTES = 24 * 60;

const NOTIFICATION_EVENT_BY_KIND: Record<NotificationRecord["kind"], ClinicEvent["type"]> = {
  confirmation: "notification.confirmation",
  reminder_24h: "notification.reminder_24h",
  reminder_sameday: "notification.reminder_sameday",
  followup_1: "followup.sent",
  followup_2: "followup.sent",
  handoff_escalation: "handoff.escalated",
};

/* ------------------------------------------------------------------ */
/* Intake normalisation                                                */
/* ------------------------------------------------------------------ */

const SUPPORTED_CHANNELS: ClinicChannel[] = ["whatsapp", "instagram", "messenger", "web", "demo"];

export function normaliseChannel(raw: unknown): string {
  const value = String(raw ?? "").trim().toLowerCase();
  if (!value) return "demo";
  if ((SUPPORTED_CHANNELS as string[]).includes(value)) return value;
  // e.g. "ig", "fb_messenger", "wa"
  if (value.startsWith("wa") || value.includes("whats")) return "whatsapp";
  if (value.startsWith("ig") || value.includes("insta")) return "instagram";
  if (value.startsWith("fb") || value.includes("messeng")) return "messenger";
  return value;
}

function hash(text: string): string {
  // FNV-1a — small, dependency free, stable across runs/processes.
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function idempotencyKeyFor(input: ClinicLeadInput): string {
  const external = String(input.external_id ?? "").trim();
  if (external) return `ext:${external}`;
  const basis = [input.phone ?? "", input.email ?? "", input.full_name ?? "", input.message ?? ""]
    .map((part) => part.trim().toLowerCase())
    .join("|");
  return `hash:${hash(basis)}`;
}

/* ------------------------------------------------------------------ */
/* Qualification                                                       */
/* ------------------------------------------------------------------ */

const SERVICE_VOCABULARY = [
  { key: "Botox", terms: ["botox", "botulinum", "anti wrinkle", "anti-wrinkle", "frown lines"] },
  { key: "Dermal Fillers", terms: ["filler", "fillers", "lips", "lip fill", "juvederm", "cheek"] },
  { key: "Laser Hair Removal", terms: ["laser", "hair removal", "ipl"] },
  { key: "Skin Boosters", terms: ["skin booster", "profhilo", "mesotherapy", "hydrafacial", "facial"] },
  { key: "PRP", terms: ["prp", "platelet", "hair loss treatment"] },
  { key: "Body Contouring", terms: ["contour", "coolsculpting", "cryo", "fat freeze"] },
];

/** Clinical-safety guardrails: these must reach a human, never an automated answer. */
const MEDICAL_GUARDRAIL_TERMS = [
  "pregnan",
  "breastfeed",
  "medication",
  "blood thinner",
  "autoimmune",
  "allergic reaction",
  "side effect",
  "infection",
  "diagnos",
  "safe for me",
  "is it safe",
  "doctor said",
  "surgery",
];

const PRICE_INTENT_TERMS = ["how much", "price", "pricing", "cost", "quote", "كام", "سعر"];
const AVAILABILITY_TERMS = ["appointment", "book", "available", "slot", "this week", "tomorrow", "حجز", "ميعاد"];
const URGENCY_TERMS = ["asap", "urgent", "soon", "today", "this week", "quickly"];
const NEGATIVE_TERMS = ["no thanks", "not interested", "spam", "unsubscribe", "stop messaging"];

function containsAny(haystack: string, terms: string[]): string | null {
  for (const term of terms) {
    if (haystack.includes(term)) return term;
  }
  return null;
}

export function detectPrimaryService(serviceInterest: string, message: string): string {
  const interest = String(serviceInterest ?? "").trim();
  if (interest) {
    const matched = SERVICE_VOCABULARY.find((service) =>
      service.terms.some((term) => interest.toLowerCase().includes(term) || term.includes(interest.toLowerCase())),
    );
    if (matched) return matched.key;
    return interest.split(/\s+/).slice(0, 3).join(" ") || "General consultation";
  }
  const lowered = message.toLowerCase();
  const fromMessage = SERVICE_VOCABULARY.find((service) => service.terms.some((term) => lowered.includes(term)));
  return fromMessage?.key ?? "General consultation";
}

/**
 * Deterministic qualification.
 *
 * Mirrors the JSON contract the Make Gemini module is required to return:
 * `{ lead_score, status, qualification_reason, primary_service }`.
 * When a Gemini key is configured the server may call the real model; this
 * function is the auditable fallback and the reference scoring rubric.
 */
export function qualifyLead(
  input: ClinicLeadInput,
  engine: "local-deterministic" | "gemini" = "local-deterministic",
  model?: string,
): QualificationResult {
  const message = String(input.message ?? "");
  const lowered = message.toLowerCase();
  const signals: QualificationSignal[] = [];
  let score = 42;

  const guardrailTerm = containsAny(lowered, MEDICAL_GUARDRAIL_TERMS);
  const priceTerm = containsAny(lowered, PRICE_INTENT_TERMS);
  const availabilityTerm = containsAny(lowered, AVAILABILITY_TERMS);
  const urgencyTerm = containsAny(lowered, URGENCY_TERMS);
  const negativeTerm = containsAny(lowered, NEGATIVE_TERMS);

  if (priceTerm) {
    score += 14;
    signals.push({ signal: "price_intent", detail: `Asked about pricing ("${priceTerm}")`, weight: 14 });
  }
  if (availabilityTerm) {
    score += 18;
    signals.push({ signal: "availability_intent", detail: `Asked about booking ("${availabilityTerm}")`, weight: 18 });
  }
  if (urgencyTerm) {
    score += 6;
    signals.push({ signal: "urgency", detail: `Time-sensitive language ("${urgencyTerm}")`, weight: 6 });
  }
  if (message.trim().split(/\s+/).length >= 6) {
    score += 6;
    signals.push({ signal: "message_depth", detail: "Multi-clause message, engaged lead", weight: 6 });
  }
  if (String(input.phone ?? "").trim()) {
    score += 8;
    signals.push({ signal: "contactable_phone", detail: "Phone captured at intake", weight: 8 });
  }
  if (String(input.email ?? "").trim()) {
    score += 4;
    signals.push({ signal: "contactable_email", detail: "Email captured at intake", weight: 4 });
  }
  if (detectPrimaryService(input.service_interest, message) !== "General consultation") {
    score += 8;
    signals.push({ signal: "service_identified", detail: detectPrimaryService(input.service_interest, message), weight: 8 });
  }
  if (negativeTerm) {
    score -= 45;
    signals.push({ signal: "opt_out_signal", detail: `Negative/opt-out language ("${negativeTerm}")`, weight: -45 });
  }
  if (guardrailTerm) {
    signals.push({
      signal: "medical_guardrail",
      detail: `Clinical-safety term detected ("${guardrailTerm}") — routed to human review`,
      weight: 0,
    });
  }

  const lead_score = Math.max(0, Math.min(100, score));
  const primary_service = detectPrimaryService(input.service_interest, message);

  let status: QualificationResult["status"];
  let qualification_reason: string;

  if (guardrailTerm) {
    status = "needs_human";
    qualification_reason = `Clinical-safety question detected ("${guardrailTerm}"). Automated clinical answers are disabled; escalated to a human agent before any treatment guidance is given.`;
  } else if (lead_score >= 65) {
    status = "qualified";
    qualification_reason = `High buying intent: ${signals
      .filter((s) => s.weight > 0)
      .map((s) => s.signal)
      .join(", ") || "engaged inbound enquiry"}. Contact details captured and primary service identified (${primary_service}).`;
  } else {
    status = "unqualified";
    qualification_reason = `Insufficient buying intent (score ${lead_score}/100). ${
      negativeTerm ? "Opt-out/negative signal present — " : ""
    }Routed to nurture instead of booking pressure.`;
  }

  return {
    lead_score,
    status,
    qualification_reason,
    primary_service,
    signals,
    engine,
    model: model ?? (engine === "gemini" ? "gemini-3.6-flash" : "local-deterministic-rubric-v1"),
    medical_guardrail_triggered: Boolean(guardrailTerm),
  };
}

export function nextActionFor(status: QualificationResult["status"], booked: boolean): NextAction {
  if (booked) return "Reminder scheduled";
  if (status === "needs_human") return "Human escalation";
  if (status === "qualified") return "Offer booking";
  return "Nurture sequence";
}

/* ------------------------------------------------------------------ */
/* Demo adapters (clearly labelled)                                    */
/* ------------------------------------------------------------------ */

export function demoBookingSlots(now: Date = new Date()): BookingSlot[] {
  const slots: BookingSlot[] = [];
  const times = [
    { hour: 11, minute: 0, label: "11:00" },
    { hour: 13, minute: 30, label: "13:30" },
    { hour: 16, minute: 0, label: "16:00" },
    { hour: 18, minute: 30, label: "18:30" },
  ];
  for (let day = 1; day <= 3; day += 1) {
    const date = new Date(now.getTime() + day * 24 * 60 * 60 * 1000);
    for (const time of times) {
      const starts = new Date(date);
      starts.setUTCHours(time.hour, time.minute, 0, 0);
      // Deterministic pseudo-availability so the demo is repeatable.
      const available = (day * 7 + time.hour) % 5 !== 0;
      slots.push({
        id: `slot-${day}-${time.label.replace(":", "")}`,
        label: `${date.toISOString().slice(0, 10)} ${time.label} UTC`,
        starts_at: starts.toISOString(),
        available,
      });
    }
  }
  return slots;
}

function receptionistReply(lead: ClinicLeadRecord, qualification: QualificationResult, slots: BookingSlot[]): string {
  const service = qualification.primary_service;
  if (qualification.status === "needs_human") {
    return `Thank you ${lead.full_name.split(" ")[0] || "for reaching out"}. Your question about ${service.toLowerCase()} needs a clinician's review before I can answer it properly — I've flagged it for a member of our clinical team and they will follow up with you directly. I won't give treatment guidance from an automated reply.`;
  }
  if (qualification.status === "unqualified") {
    return `Thanks for your message about ${service.toLowerCase()}. I'll send you our information pack and current treatment guide — no pressure, and you can reply here whenever you'd like to talk it through.`;
  }
  const firstAvailable = slots.find((slot) => slot.available);
  return `Hi ${lead.full_name.split(" ")[0] || "there"} — happy to help with ${service.toLowerCase()}. Pricing is quoted after a short consultation because it depends on the areas treated, so I can hold you a consultation slot. ${
    firstAvailable ? `The next available is ${firstAvailable.label}.` : "I'll check availability and confirm shortly."
  } Would you like me to book it? (DEMO conversation — sample wording, not live clinic pricing.)`;
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

interface StoreShape {
  leads: Map<string, ClinicLeadRecord>;
  conversations: Map<string, IntakeMessage>;
  appointments: Map<string, AppointmentRecord>;
  notifications: Map<string, NotificationRecord>;
  handoffs: Map<string, HandoffRecord>;
  events: ClinicEvent[];
}

export type ClinicDataSource = "in-memory-demo" | "supabase-live";

export interface ClinicEngineOptions {
  /** Server-side only: real Make webhook target, if configured. */
  makeWebhookUrl?: string;
  /** True when Supabase URL + publishable/anon key are present server-side. */
  supabaseConfigured?: boolean;
  /** Reported by /api/clinic/status only; does not change the scoring engine. */
  geminiConfigured?: boolean;
  /**
   * Which engine actually produced the qualification result. Stays
   * "local-deterministic" unless a real Gemini call populated the record.
   */
  qualificationEngine?: "local-deterministic" | "gemini";
  qualificationModel?: string;
  dataSource?: ClinicDataSource;
  now?: () => Date;
}

/**
 * In-memory implementation of the `clinic_demo_*` tables.
 *
 * The same shape maps 1:1 to Supabase; `dataSource` is reported to the UI so a
 * viewer always knows whether they are looking at demo data or live rows.
 */
export class ClinicEngine {
  private store: StoreShape = {
    leads: new Map(),
    conversations: new Map(),
    appointments: new Map(),
    notifications: new Map(),
    handoffs: new Map(),
    events: [],
  };

  private options: ClinicEngineOptions;

  constructor(options: ClinicEngineOptions = {}) {
    this.options = options;
  }

  private now(): Date {
    return this.options.now ? this.options.now() : new Date();
  }

  get dataSource(): ClinicDataSource {
    return this.options.dataSource === "supabase-live" ? "supabase-live" : "in-memory-demo";
  }

  reset(): void {
    this.store = {
      leads: new Map(),
      conversations: new Map(),
      appointments: new Map(),
      notifications: new Map(),
      handoffs: new Map(),
      events: [],
    };
  }

  private pushEvent(leadId: string, type: ClinicEvent["type"], detail: string, lead?: ClinicLeadRecord): ClinicEvent {
    const created = this.now();
    const event: ClinicEvent = {
      id: `evt-${created.getTime()}-${this.store.events.length + 1}`,
      lead_id: leadId,
      type,
      detail,
      created_at: created.toISOString(),
      minutes_after_intake: lead ? Math.round((created.getTime() - new Date(lead.created_at).getTime()) / 60000) : 0,
    };
    this.store.events.push(event);
    return event;
  }

  /* ---------------- Intake → Qualification → CRM ---------------- */

  intake(rawInput: Partial<ClinicLeadInput> & Record<string, unknown>): PipelineSnapshot {
    const input: ClinicLeadInput = {
      full_name: String(rawInput.full_name ?? rawInput.name ?? "Unknown Lead").trim() || "Unknown Lead",
      phone: String(rawInput.phone ?? "").trim(),
      email: String(rawInput.email ?? "").trim(),
      channel: normaliseChannel(rawInput.channel ?? rawInput.source ?? "demo"),
      service_interest: String(rawInput.service_interest ?? rawInput.service ?? "").trim(),
      message: String(rawInput.message ?? "").trim(),
      external_id: String(rawInput.external_id ?? "").trim(),
    };

    if (!input.message) {
      throw new ClinicValidationError("message is required");
    }

    const idempotencyKey = idempotencyKeyFor(input);
    const existing = this.findLeadByIdempotencyKey(idempotencyKey);
    const created = this.now();

    if (existing) {
      const duplicate: IntakeMessage = {
        id: `msg-${created.getTime()}-dup`,
        lead_id: existing.id,
        idempotency_key: idempotencyKey,
        external_id: input.external_id || idempotencyKey,
        channel: input.channel,
        direction: "inbound",
        author: "lead",
        body: input.message,
        created_at: created.toISOString(),
        deduplicated: true,
      };
      this.store.conversations.set(duplicate.id, duplicate);
      this.pushEvent(existing.id, "intake.deduplicated", `Duplicate intake absorbed (idempotency_key=${idempotencyKey})`, existing);
      return this.snapshot(existing.id, 0);
    }

    const leadId = `lead-${hash(idempotencyKey + created.getTime())}`;
    const qualification = qualifyLead(
      input,
      this.options.qualificationEngine ?? "local-deterministic",
      this.options.qualificationModel,
    );

    const lead: ClinicLeadRecord = {
      id: leadId,
      external_id: input.external_id || idempotencyKey,
      idempotency_key: idempotencyKey,
      full_name: input.full_name,
      phone: input.phone,
      email: input.email,
      source: input.channel,
      service_interest: input.service_interest || qualification.primary_service,
      message: input.message,
      lead_score: qualification.lead_score,
      status: qualification.status,
      qualification_reason: qualification.qualification_reason,
      primary_service: qualification.primary_service,
      next_action: nextActionFor(qualification.status, false),
      next_action_at: null,
      handoff_required: qualification.status === "needs_human",
      booked: false,
      created_at: created.toISOString(),
      updated_at: created.toISOString(),
    };

    this.store.leads.set(lead.id, lead);
    this.pushEvent(lead.id, "intake.received", `Inbound ${input.channel} message normalised from ${input.full_name}`, lead);

    const inbound: IntakeMessage = {
      id: `msg-${created.getTime()}-in`,
      lead_id: lead.id,
      idempotency_key: idempotencyKey,
      external_id: lead.external_id,
      channel: input.channel,
      direction: "inbound",
      author: "lead",
      body: input.message,
      created_at: created.toISOString(),
    };
    this.store.conversations.set(inbound.id, inbound);

    this.pushEvent(
      lead.id,
      "qualification.completed",
      `${qualification.model}: score ${qualification.lead_score} → ${qualification.status}`,
      lead,
    );

    const reply = receptionistReply(lead, qualification, demoBookingSlots(created));
    const outbound: IntakeMessage = {
      id: `msg-${created.getTime()}-out`,
      lead_id: lead.id,
      idempotency_key: idempotencyKey,
      external_id: lead.external_id,
      channel: input.channel,
      direction: "outbound",
      author: lead.handoff_required ? "system" : "ai_receptionist",
      body: reply,
      created_at: new Date(created.getTime() + 1000).toISOString(),
    };
    this.store.conversations.set(outbound.id, outbound);

    this.pushEvent(lead.id, "crm.upserted", `clinic_demo_leads upsert (idempotency_key=${idempotencyKey})`, lead);

    if (lead.handoff_required) {
      this.createHandoff(lead, qualification.qualification_reason);
    } else if (lead.status === "qualified") {
      this.scheduleFollowUps(lead);
      this.pushEvent(lead.id, "booking.offered", `Booking offered via ${input.channel} (demo booking adapter)`, lead);
    } else {
      this.pushEvent(lead.id, "followup.scheduled", "Nurture sequence assigned (no booking pressure for unqualified leads)", lead);
    }

    return this.snapshot(lead.id, 0);
  }

  /* ---------------- Booking ---------------- */

  book(leadId: string, slotId: string): PipelineSnapshot {
    const lead = this.store.leads.get(leadId);
    if (!lead) throw new ClinicValidationError(`unknown lead: ${leadId}`);

    const slot = demoBookingSlots(this.now()).find((candidate) => candidate.id === slotId);
    if (!slot) throw new ClinicValidationError(`unknown slot: ${slotId}`);
    if (!slot.available) throw new ClinicValidationError(`slot unavailable: ${slotId}`);

    const already = Array.from(this.store.appointments.values()).find(
      (appointment) => appointment.lead_id === leadId && appointment.status !== "cancelled",
    );
    if (already) {
      // Idempotent: re-submitting a booking never creates a second appointment.
      return this.snapshot(leadId, 0);
    }

    const created = this.now();
    const appointment: AppointmentRecord = {
      id: `apt-${hash(leadId + slot.id)}`,
      lead_id: leadId,
      slot_id: slot.id,
      starts_at: slot.starts_at,
      status: "booked",
      booked_at: created.toISOString(),
      confirmed_at: null,
      confirmation_channel: lead.source,
      adapter: "demo-booking-adapter",
    };
    this.store.appointments.set(appointment.id, appointment);
    this.pushEvent(leadId, "booking.created", `Appointment ${appointment.id} held for ${slot.label}`, lead);

    // Confirmation
    appointment.status = "confirmed";
    appointment.confirmed_at = new Date(created.getTime() + 1000).toISOString();
    this.addNotification({
      lead_id: leadId,
      appointment_id: appointment.id,
      kind: "confirmation",
      body: `Confirmed: ${lead.primary_service} consultation on ${slot.label}. Reply here to reschedule. (DEMO notification adapter)`,
      scheduled_for: appointment.confirmed_at,
      fire_after_minutes: 0,
    });
    this.pushEvent(leadId, "notification.confirmation", `Confirmation queued on ${appointment.confirmation_channel}`, lead);

    // Reminders
    this.addNotification({
      lead_id: leadId,
      appointment_id: appointment.id,
      kind: "reminder_24h",
      body: `Reminder: your ${lead.primary_service} appointment is tomorrow at ${slot.label.slice(11)}. (DEMO notification adapter)`,
      scheduled_for: new Date(new Date(slot.starts_at).getTime() - REMINDER_24H_OFFSET_MINUTES * 60000).toISOString(),
      fire_after_minutes: REMINDER_24H_OFFSET_MINUTES,
    });
    this.addNotification({
      lead_id: leadId,
      appointment_id: appointment.id,
      kind: "reminder_sameday",
      body: `Today is the day — we'll see you at ${slot.label.slice(11)} for your ${lead.primary_service} appointment. (DEMO notification adapter)`,
      scheduled_for: new Date(new Date(slot.starts_at).getTime() - REMINDER_SAMEDAY_OFFSET_MINUTES * 60000).toISOString(),
      fire_after_minutes: REMINDER_24H_OFFSET_MINUTES + REMINDER_SAMEDAY_OFFSET_MINUTES,
    });
    this.pushEvent(leadId, "notification.reminder_24h", "24h reminder scheduled", lead);
    this.pushEvent(leadId, "notification.reminder_sameday", "Same-day reminder scheduled", lead);

    // Booking stops the unbooked follow-up ladder.
    const cancelled = this.cancelPendingFollowUps(leadId);
    if (cancelled > 0) {
      this.pushEvent(leadId, "followup.stopped", `${cancelled} pending follow-up(s) cancelled because the lead booked`, lead);
    }

    lead.booked = true;
    lead.next_action = "Reminder scheduled";
    lead.next_action_at = appointment.starts_at;
    lead.updated_at = created.toISOString();

    return this.snapshot(leadId, 0);
  }

  availableSlots(): BookingSlot[] {
    return demoBookingSlots(this.now());
  }

  /* ---------------- Follow-ups & handoff ---------------- */

  private scheduleFollowUps(lead: ClinicLeadRecord): void {
    const first = this.addNotification({
      lead_id: lead.id,
      appointment_id: null,
      kind: "followup_1",
      body: `Hi ${lead.full_name.split(" ")[0]}, still thinking about ${lead.primary_service.toLowerCase()}? I can hold a consultation slot for you this week. (DEMO notification adapter)`,
      scheduled_for: new Date(new Date(lead.created_at).getTime() + FOLLOWUP_1_OFFSET_MINUTES * 60000).toISOString(),
      fire_after_minutes: FOLLOWUP_1_OFFSET_MINUTES,
    });
    const second = this.addNotification({
      lead_id: lead.id,
      appointment_id: null,
      kind: "followup_2",
      body: `Last note from me about ${lead.primary_service.toLowerCase()} — no pressure at all. If timing isn't right I'll stop here. (DEMO notification adapter)`,
      scheduled_for: new Date(new Date(lead.created_at).getTime() + FOLLOWUP_2_OFFSET_MINUTES * 60000).toISOString(),
      fire_after_minutes: FOLLOWUP_2_OFFSET_MINUTES,
    });
    this.pushEvent(lead.id, "followup.scheduled", `Follow-up ladder scheduled: +${first.fire_after_minutes}m, +${second.fire_after_minutes}m`, lead);
    lead.next_action_at = first.scheduled_for;
  }

  private cancelPendingFollowUps(leadId: string): number {
    let cancelled = 0;
    for (const notification of this.store.notifications.values()) {
      if (notification.lead_id === leadId && notification.kind.startsWith("followup") && notification.status === "scheduled") {
        this.store.notifications.delete(notification.id);
        cancelled += 1;
      }
    }
    return cancelled;
  }

  private createHandoff(lead: ClinicLeadRecord, reason: string): HandoffRecord {
    const created = this.now();
    const handoff: HandoffRecord = {
      id: `handoff-${hash(lead.id + created.getTime())}`,
      lead_id: lead.id,
      reason,
      created_at: created.toISOString(),
      ai_autonomy: "halted",
      owner: "human_agent",
    };
    this.store.handoffs.set(handoff.id, handoff);
    this.pushEvent(lead.id, "handoff.required", `handoff_required=true (${reason.slice(0, 90)}…)`, lead);
    this.pushEvent(lead.id, "handoff.escalated", "Escalation event created; automated clinical responses disabled for this lead", lead);
    this.addNotification({
      lead_id: lead.id,
      appointment_id: null,
      kind: "handoff_escalation",
      body: `[HUMAN HANDOFF] ${lead.full_name} asked a clinical-safety question about ${lead.primary_service.toLowerCase()}. AI autonomy halted. (DEMO notification adapter)`,
      scheduled_for: created.toISOString(),
      fire_after_minutes: 0,
    });
    lead.handoff_required = true;
    lead.next_action = "Human escalation";
    lead.next_action_at = created.toISOString();
    lead.updated_at = created.toISOString();
    return handoff;
  }

  private addNotification(input: Omit<NotificationRecord, "id" | "channel" | "status" | "sent_at">): NotificationRecord {
    const lead = this.store.leads.get(input.lead_id);
    const notification: NotificationRecord = {
      ...input,
      id: `ntf-${hash(input.lead_id + input.kind + input.fire_after_minutes + this.store.notifications.size)}`,
      channel: lead?.source ?? "demo",
      status: "scheduled",
      sent_at: null,
    };
    this.store.notifications.set(notification.id, notification);
    return notification;
  }

  /* ---------------- Virtual clock ---------------- */

  /**
   * Advances the demo clock and fires everything that is due.
   * Pure with respect to `minutesAfterIntake` → the same input always yields
   * the same reminder/follow-up state.
   */
  snapshot(leadId: string, minutesAfterIntake = 0): PipelineSnapshot {
    const lead = this.store.leads.get(leadId);
    if (!lead) throw new ClinicValidationError(`unknown lead: ${leadId}`);

    const elapsed = Math.max(0, Math.floor(minutesAfterIntake));

    for (const notification of this.store.notifications.values()) {
      if (notification.lead_id !== leadId) continue;
      if (notification.status === "sent") continue;
      if (notification.fire_after_minutes <= elapsed) {
        notification.status = "sent";
        notification.sent_at = new Date(
          new Date(lead.created_at).getTime() + notification.fire_after_minutes * 60000,
        ).toISOString();
        this.pushEvent(
          leadId,
          NOTIFICATION_EVENT_BY_KIND[notification.kind],
          `${notification.kind} delivered at +${notification.fire_after_minutes}m (virtual clock)`,
          lead,
        );
      }
    }

    const appointment =
      Array.from(this.store.appointments.values()).find((candidate) => candidate.lead_id === leadId) ?? null;
    const handoff = Array.from(this.store.handoffs.values()).find((candidate) => candidate.lead_id === leadId) ?? null;

    if (lead.booked) {
      lead.next_action = "Reminder scheduled";
      lead.next_action_at = appointment?.starts_at ?? lead.next_action_at;
    } else if (lead.status === "needs_human") {
      lead.next_action = "Human escalation";
    } else if (lead.status === "qualified") {
      const pending = Array.from(this.store.notifications.values()).filter(
        (notification) => notification.lead_id === leadId && notification.kind.startsWith("followup") && notification.status === "scheduled",
      );
      lead.next_action = pending.length > 0 ? "Await booking decision" : "Complete";
      lead.next_action_at = pending[0]?.scheduled_for ?? null;
    }

    const messages = Array.from(this.store.conversations.values())
      .filter((message) => message.lead_id === leadId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
    const events = this.store.events.filter((event) => event.lead_id === leadId);
    const notifications = Array.from(this.store.notifications.values())
      .filter((notification) => notification.lead_id === leadId)
      .sort((a, b) => a.fire_after_minutes - b.fire_after_minutes);

    return {
      lead,
      messages,
      qualification: qualifyLead(
        {
          full_name: lead.full_name,
          phone: lead.phone,
          email: lead.email,
          channel: lead.source,
          service_interest: lead.service_interest,
          message: lead.message,
          external_id: lead.external_id,
        },
        this.options.qualificationEngine ?? "local-deterministic",
        this.options.qualificationModel,
      ),
      appointment,
      notifications,
      handoff,
      events,
      steps: this.buildSteps(lead, appointment, handoff, notifications, elapsed),
      simulated_minutes_elapsed: elapsed,
      data_source: this.dataSource,
    };
  }

  private buildSteps(
    lead: ClinicLeadRecord,
    appointment: AppointmentRecord | null,
    handoff: HandoffRecord | null,
    notifications: NotificationRecord[],
    elapsed: number,
  ): WorkflowStepView[] {
    const reminders = notifications.filter((n) => n.kind.startsWith("reminder") || n.kind === "confirmation");
    const followups = notifications.filter((n) => n.kind.startsWith("followup"));
    const sentFollowups = followups.filter((n) => n.status === "sent");

    return [
      {
        key: "message",
        label: "Message intake",
        state: "success",
        detail: `${lead.source} → normalised, idempotency_key=${lead.idempotency_key}`,
      },
      {
        key: "ai_receptionist",
        label: "AI receptionist",
        state: "success",
        detail: handoff ? "Halted before clinical answer (guardrail)" : "Reply generated, no invented pricing",
      },
      {
        key: "qualification",
        label: "Qualification",
        state: "success",
        detail: `score ${lead.lead_score}/100 → ${lead.status}`,
      },
      {
        key: "crm",
        label: "CRM upsert",
        state: "success",
        detail: `clinic_demo_leads · ${lead.id} · ${this.dataSource}`,
      },
      {
        key: "booking",
        label: "Booking",
        state: appointment ? "success" : lead.status === "qualified" ? "running" : "skipped",
        detail: appointment
          ? `${appointment.adapter}: ${appointment.status}`
          : lead.status === "qualified"
            ? "Offered — awaiting lead decision"
            : `Skipped (${lead.status})`,
      },
      {
        key: "confirmation",
        label: "Confirmation",
        state: appointment?.status === "confirmed" ? "success" : "idle",
        detail: appointment?.status === "confirmed" ? `Sent on ${appointment.confirmation_channel}` : "Pending appointment",
      },
      {
        key: "reminder",
        label: "Reminders",
        state: reminders.length === 0 ? "idle" : reminders.every((r) => r.status === "sent") ? "success" : "running",
        detail: reminders.length
          ? `${reminders.filter((r) => r.status === "sent").length}/${reminders.length} fired at +${elapsed}m`
          : "Pending appointment",
      },
      {
        key: "followup",
        label: "Unbooked follow-up",
        state: followups.length === 0 ? "skipped" : lead.booked ? "skipped" : sentFollowups.length >= 2 ? "success" : "running",
        detail: lead.booked
          ? `Stopped after booking (${sentFollowups.length} sent before booking)`
          : followups.length === 0
            ? "Not applicable for this lead"
            : `${sentFollowups.length}/2 sent at +${elapsed}m`,
      },
      {
        key: "handoff",
        label: "Human handoff",
        state: handoff ? "success" : "skipped",
        detail: handoff ? `${handoff.id} · AI autonomy halted` : "No handoff required",
      },
      {
        key: "reporting",
        label: "Reporting",
        state: "success",
        detail: `clinic_demo_events: ${this.store.events.filter((e) => e.lead_id === lead.id).length} records`,
      },
    ];
  }

  /* ---------------- Reporting ---------------- */

  metrics(): ClinicMetrics {
    const leads = Array.from(this.store.leads.values());
    const qualified = leads.filter((lead) => lead.status === "qualified").length;
    const booked = leads.filter((lead) => lead.booked).length;
    const notifications = Array.from(this.store.notifications.values());

    return {
      conversations: Array.from(this.store.conversations.values()).filter((message) => !message.deduplicated).length,
      leads: leads.length,
      qualified,
      unqualified: leads.filter((lead) => lead.status === "unqualified").length,
      needs_human: leads.filter((lead) => lead.status === "needs_human").length,
      booked,
      booking_rate: qualified === 0 ? 0 : Math.round((booked / qualified) * 1000) / 10,
      unbooked_qualified: Math.max(0, qualified - booked),
      followups_sent: notifications.filter((n) => n.kind.startsWith("followup") && n.status === "sent").length,
      handoffs: this.store.handoffs.size,
      reminders_scheduled: notifications.filter((n) => n.kind.startsWith("reminder") || n.kind === "confirmation").length,
      reminders_sent: notifications.filter(
        (n) => (n.kind.startsWith("reminder") || n.kind === "confirmation") && n.status === "sent",
      ).length,
      deduplicated_messages: Array.from(this.store.conversations.values()).filter((message) => message.deduplicated).length,
      data_source: this.dataSource,
    };
  }

  listLeads(): ClinicLeadRecord[] {
    return Array.from(this.store.leads.values()).sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  findLeadByIdempotencyKey(key: string): ClinicLeadRecord | undefined {
    return Array.from(this.store.leads.values()).find((lead) => lead.idempotency_key === key);
  }
}

export class ClinicValidationError extends Error {}

/** Process-wide singleton used by the API layer. */
export const clinicEngine = new ClinicEngine({
  makeWebhookUrl: process.env.MAKE_CLINIC_WEBHOOK_URL,
  supabaseConfigured: Boolean(
    (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) &&
      (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY),
  ),
  geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
});
