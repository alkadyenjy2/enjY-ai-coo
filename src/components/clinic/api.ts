/**
 * Typed client for the Clinic Demo API (`/api/clinic/*`).
 * Relative URLs only — the same bundle works in local dev, in the Arena
 * preview and on Vercel without any environment-specific configuration.
 */

import type { BookingSlot, ClinicMetrics, ClinicStatus, PipelineSnapshot } from "../../clinic/types";

export type { BookingSlot, ClinicMetrics, ClinicStatus, PipelineSnapshot };

export interface LeadPayload {
  full_name: string;
  phone: string;
  email: string;
  channel: string;
  service_interest: string;
  message: string;
  external_id: string;
}

export interface MakeProbeResult {
  success: boolean;
  delivered: boolean;
  reason: "not_configured" | "accepted_by_make" | "make_rejected_request" | "timeout" | "network_error" | string;
  detail: string;
  upstream_status?: number;
  upstream_body?: string;
  payload_sent: LeadPayload | null;
  target: string | null;
  latency_ms?: number;
  timestamp: string;
}

async function json<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((body as any)?.error || `Request failed with HTTP ${response.status}`);
  }
  return body as T;
}

export const clinicApi = {
  status: () => fetch("/api/clinic/status").then((r) => json<ClinicStatus>(r)),
  metrics: () => fetch("/api/clinic/metrics").then((r) => json<{ metrics: ClinicMetrics }>(r)),
  slots: () => fetch("/api/clinic/slots").then((r) => json<{ slots: BookingSlot[] }>(r)),

  createLead: (payload: Partial<LeadPayload>, simulateMinutes = 0) =>
    fetch("/api/clinic/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, simulate_minutes: simulateMinutes }),
    }).then((r) => json<{ snapshot: PipelineSnapshot }>(r)),

  getLead: (leadId: string, simulateMinutes = 0) =>
    fetch(`/api/clinic/leads/${encodeURIComponent(leadId)}?minutes=${simulateMinutes}`).then((r) =>
      json<{ snapshot: PipelineSnapshot }>(r),
    ),

  book: (leadId: string, slotId: string) =>
    fetch(`/api/clinic/leads/${encodeURIComponent(leadId)}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slot_id: slotId }),
    }).then((r) => json<{ snapshot: PipelineSnapshot }>(r)),

  probeMakeWebhook: (payload: Partial<LeadPayload>) =>
    fetch("/api/clinic/make-webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => json<MakeProbeResult>(r)),
};

export const SAMPLE_LEADS: Array<{ id: string; label: string; payload: LeadPayload }> = [
  {
    id: "qualified-botox",
    label: "High intent · Botox",
    payload: {
      full_name: "Sarah Ahmed",
      phone: "+201000000000",
      email: "sarah@example.com",
      channel: "whatsapp",
      service_interest: "Botox",
      message: "How much is Botox and do you have an appointment this week?",
      external_id: "ui-demo-botox-100",
    },
  },
  {
    id: "guardrail",
    label: "Clinical safety question → handoff",
    payload: {
      full_name: "Rana Mostafa",
      phone: "+201000000022",
      email: "rana@example.com",
      channel: "messenger",
      service_interest: "Botox",
      message: "I am pregnant, is Botox safe for me right now?",
      external_id: "ui-demo-guardrail-101",
    },
  },
  {
    id: "low-intent",
    label: "Low intent → nurture",
    payload: {
      full_name: "Omar Hassan",
      phone: "",
      email: "",
      channel: "web",
      service_interest: "Laser Hair Removal",
      message: "hi",
      external_id: "ui-demo-lowintent-102",
    },
  },
];
