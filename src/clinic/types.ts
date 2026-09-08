/**
 * Clinic Demo — shared contract types.
 *
 * This mirrors the payload contract of the Make scenario
 * "DEMO — Clinic AI Lead Intake (Non-Production)" and the Supabase
 * `clinic_demo_*` tables. The demo runs fully locally with a deterministic
 * engine; when real credentials are configured the same contracts are used
 * against the live Make webhook / Supabase project.
 */

export type LeadStatus = "qualified" | "unqualified" | "needs_human";

export type NextAction =
  | "Offer booking"
  | "Nurture sequence"
  | "Human escalation"
  | "Await booking decision"
  | "Reminder scheduled"
  | "Complete";

export type StepState = "idle" | "running" | "success" | "skipped" | "failed";

export type ClinicChannel = "whatsapp" | "instagram" | "messenger" | "web" | "demo";

export interface ClinicLeadInput {
  full_name: string;
  phone?: string;
  email?: string;
  /** Normalised inbound channel. The webhook is the normalised intake layer. */
  channel: ClinicChannel | string;
  service_interest: string;
  message: string;
  /** Provider-side message id — used for idempotency. */
  external_id?: string;
}

export interface IntakeMessage {
  id: string;
  lead_id: string;
  idempotency_key: string;
  external_id: string;
  channel: string;
  direction: "inbound" | "outbound";
  author: "lead" | "ai_receptionist" | "human_agent" | "system";
  body: string;
  created_at: string;
  /** True when this message was absorbed by deduplication instead of processed. */
  deduplicated?: boolean;
}

export interface QualificationSignal {
  signal: string;
  detail: string;
  weight: number;
}

export interface QualificationResult {
  lead_score: number;
  status: LeadStatus;
  qualification_reason: string;
  primary_service: string;
  signals: QualificationSignal[];
  /** Which qualification engine produced the result. Never faked. */
  engine: "local-deterministic" | "gemini";
  model: string;
  medical_guardrail_triggered: boolean;
}

export interface AppointmentRecord {
  id: string;
  lead_id: string;
  slot_id: string;
  starts_at: string;
  status: "booked" | "confirmed" | "cancelled";
  booked_at: string;
  confirmed_at: string | null;
  confirmation_channel: string;
  /** Adapter is a labelled demo adapter unless real calendar credentials exist. */
  adapter: "demo-booking-adapter";
}

export interface NotificationRecord {
  id: string;
  lead_id: string;
  appointment_id: string | null;
  kind: "confirmation" | "reminder_24h" | "reminder_sameday" | "followup_1" | "followup_2" | "handoff_escalation";
  channel: string;
  body: string;
  scheduled_for: string;
  /** Virtual clock position at which this notification fires. */
  fire_after_minutes: number;
  status: "scheduled" | "sent";
  sent_at: string | null;
}

export interface HandoffRecord {
  id: string;
  lead_id: string;
  reason: string;
  created_at: string;
  ai_autonomy: "halted";
  owner: "human_agent";
}

export interface ClinicEvent {
  id: string;
  lead_id: string;
  type:
    | "intake.received"
    | "intake.deduplicated"
    | "qualification.completed"
    | "crm.upserted"
    | "booking.offered"
    | "booking.created"
    | "notification.confirmation"
    | "notification.reminder_24h"
    | "notification.reminder_sameday"
    | "followup.scheduled"
    | "followup.sent"
    | "followup.stopped"
    | "handoff.required"
    | "handoff.escalated";
  detail: string;
  created_at: string;
  minutes_after_intake: number;
}

export interface ClinicLeadRecord {
  id: string;
  external_id: string;
  idempotency_key: string;
  full_name: string;
  phone: string;
  email: string;
  source: string;
  service_interest: string;
  message: string;
  lead_score: number;
  status: LeadStatus;
  qualification_reason: string;
  primary_service: string;
  next_action: NextAction;
  next_action_at: string | null;
  handoff_required: boolean;
  booked: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStepView {
  key:
    | "message"
    | "ai_receptionist"
    | "qualification"
    | "crm"
    | "booking"
    | "confirmation"
    | "reminder"
    | "followup"
    | "handoff"
    | "reporting";
  label: string;
  state: StepState;
  detail: string;
}

export interface PipelineSnapshot {
  lead: ClinicLeadRecord;
  messages: IntakeMessage[];
  qualification: QualificationResult;
  appointment: AppointmentRecord | null;
  notifications: NotificationRecord[];
  handoff: HandoffRecord | null;
  events: ClinicEvent[];
  steps: WorkflowStepView[];
  /** Minutes elapsed on the virtual demo clock for this snapshot. */
  simulated_minutes_elapsed: number;
  data_source: "in-memory-demo" | "supabase-live";
}

export interface ClinicMetrics {
  conversations: number;
  leads: number;
  qualified: number;
  unqualified: number;
  needs_human: number;
  booked: number;
  booking_rate: number;
  unbooked_qualified: number;
  followups_sent: number;
  handoffs: number;
  reminders_scheduled: number;
  reminders_sent: number;
  deduplicated_messages: number;
  data_source: "in-memory-demo" | "supabase-live";
}

export interface ClinicStatus {
  mode: "NON-PRODUCTION DEMO";
  data_source: "in-memory-demo" | "supabase-live";
  qualification_engine: "local-deterministic" | "gemini";
  qualification_model: string;
  make_webhook_configured: boolean;
  /** Webhook target from server-side env. Never contains credentials. */
  make_webhook_target: string | null;
  make_scenario_id: string;
  supabase_configured: boolean;
  supabase_tables: string[];
  notification_adapter: "demo-notification-adapter";
  booking_adapter: "demo-booking-adapter";
  channels_supported: string[];
  live_claims: string[];
  timestamp: string;
}

export interface BookingSlot {
  id: string;
  label: string;
  starts_at: string;
  available: boolean;
}
