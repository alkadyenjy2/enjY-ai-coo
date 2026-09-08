import React from "react";
import {
  MessageSquare,
  Bot,
  Gauge,
  Database,
  CalendarCheck2,
  MailCheck,
  BellRing,
  Repeat2,
  UserRoundCog,
  BarChart3,
  Check,
  Loader2,
  Minus,
  X,
} from "lucide-react";
import type { PipelineSnapshot, StepState, WorkflowStepView } from "../../clinic/types";
import { Panel, Tag } from "./ui";

const ICONS: Record<WorkflowStepView["key"], React.ComponentType<{ className?: string }>> = {
  message: MessageSquare,
  ai_receptionist: Bot,
  qualification: Gauge,
  crm: Database,
  booking: CalendarCheck2,
  confirmation: MailCheck,
  reminder: BellRing,
  followup: Repeat2,
  handoff: UserRoundCog,
  reporting: BarChart3,
};

const STATE_STYLE: Record<StepState, { ring: string; text: string; label: string; icon: React.ReactNode }> = {
  success: { ring: "border-emerald-500/40 bg-emerald-500/10", text: "text-emerald-300", label: "SUCCESS", icon: <Check className="w-3 h-3" /> },
  running: { ring: "border-cyan-500/40 bg-cyan-500/10", text: "text-cyan-300", label: "RUNNING", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  idle: { ring: "border-zinc-700 bg-zinc-900", text: "text-zinc-500", label: "IDLE", icon: <Minus className="w-3 h-3" /> },
  skipped: { ring: "border-zinc-800 bg-zinc-950", text: "text-zinc-600", label: "SKIPPED", icon: <Minus className="w-3 h-3" /> },
  failed: { ring: "border-rose-500/40 bg-rose-500/10", text: "text-rose-300", label: "FAILED", icon: <X className="w-3 h-3" /> },
};

export const ClinicWorkflowDiagram: React.FC<{ snapshot: PipelineSnapshot }> = ({ snapshot }) => (
  <Panel
    title="Pipeline state — every step is observable"
    subtitle="Message → AI Receptionist → Qualification → CRM → Booking → Confirmation → Reminder → Follow-up → Handoff → Reporting"
    badge={<Tag tone="cyan">VIRTUAL CLOCK +{snapshot.simulated_minutes_elapsed}m</Tag>}
  >
    <ol className="space-y-0">
      {snapshot.steps.map((step, index) => {
        const Icon = ICONS[step.key];
        const style = STATE_STYLE[step.state];
        const isLast = index === snapshot.steps.length - 1;
        return (
          <li key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${style.ring}`}>
                <Icon className={`w-4 h-4 ${style.text}`} />
              </div>
              {!isLast ? <div className="w-px flex-1 bg-zinc-800 my-1 min-h-[18px]" /> : null}
            </div>
            <div className={`pb-4 ${isLast ? "pb-0" : ""} min-w-0 flex-1`}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[12px] font-bold text-zinc-100 font-sans">{step.label}</span>
                <span className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold ${style.text}`}>
                  {style.icon}
                  {style.label}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 font-mono break-words mt-0.5">{step.detail}</p>
            </div>
          </li>
        );
      })}
    </ol>
  </Panel>
);

export const ClinicConversationSimulator: React.FC<{ snapshot: PipelineSnapshot }> = ({ snapshot }) => (
  <Panel
    title="AI receptionist conversation"
    subtitle={`channel: ${snapshot.lead.source} · no invented clinic pricing`}
    badge={snapshot.lead.handoff_required ? <Tag tone="rose">GUARDRAIL ACTIVE</Tag> : <Tag tone="emerald">AUTOPILOT</Tag>}
  >
    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
      {snapshot.messages.map((message) => {
        const inbound = message.direction === "inbound";
        return (
          <div key={message.id} className={`flex ${inbound ? "justify-start" : "justify-end"}`}>
            <div
              className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 border ${
                inbound
                  ? "bg-zinc-950 border-zinc-800 text-zinc-200 rounded-bl-sm"
                  : message.author === "system"
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-100 rounded-br-sm"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-50 rounded-br-sm"
              }`}
            >
              <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 mb-1">
                {inbound ? `${snapshot.lead.full_name} · ${message.channel}` : message.author === "system" ? "system" : "ai receptionist"}
                {message.deduplicated ? " · DEDUPLICATED" : ""}
              </div>
              <p className="text-[12px] leading-relaxed font-sans">{message.body}</p>
              <div className="text-[9px] font-mono text-zinc-600 mt-1">{new Date(message.created_at).toISOString().slice(11, 19)}Z</div>
            </div>
          </div>
        );
      })}
    </div>
  </Panel>
);

export const ClinicQualificationPanel: React.FC<{ snapshot: PipelineSnapshot }> = ({ snapshot }) => {
  const { qualification: q, lead } = snapshot;
  const statusTone = lead.status === "qualified" ? "emerald" : lead.status === "needs_human" ? "rose" : "amber";
  return (
    <Panel
      title="Lead qualification"
      subtitle={`engine: ${q.model} · contract: {lead_score, status, qualification_reason, primary_service}`}
      badge={<Tag tone={statusTone as "emerald"}>{lead.status.toUpperCase()}</Tag>}
    >
      <div className="flex items-center gap-4">
        <ScoreRingLocal score={lead.lead_score} />
        <div className="min-w-0 flex-1">
          <div className="text-[11px] text-zinc-500 font-mono uppercase tracking-wide">Primary service</div>
          <div className="text-[15px] text-white font-bold font-sans">{q.primary_service}</div>
          <div className="text-[11px] text-zinc-500 font-mono uppercase tracking-wide mt-2">Next action</div>
          <div className="text-[13px] text-emerald-300 font-mono">{lead.next_action}</div>
        </div>
      </div>

      <p className="text-[12px] text-zinc-300 font-sans leading-relaxed mt-3 bg-zinc-950/70 border border-zinc-800 rounded-xl p-3">
        {q.qualification_reason}
      </p>

      <div className="mt-3 space-y-1.5">
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Scoring signals</div>
        {q.signals.length === 0 ? (
          <p className="text-[11px] text-zinc-600 font-mono">No weighted signals detected.</p>
        ) : (
          q.signals.map((signal) => (
            <div key={signal.signal} className="flex items-center justify-between gap-2 text-[11px] font-mono">
              <span className="text-zinc-400 truncate">{signal.detail}</span>
              <span className={signal.weight > 0 ? "text-emerald-400" : signal.weight < 0 ? "text-rose-400" : "text-zinc-500"}>
                {signal.weight > 0 ? `+${signal.weight}` : signal.weight}
              </span>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
};

// Local re-declaration keeps this file independent of the ui kit import order.
const ScoreRingLocal: React.FC<{ score: number }> = ({ score }) => {
  const circumference = 2 * Math.PI * 34;
  const offset = circumference - (score / 100) * circumference;
  const colour = score >= 65 ? "#34d399" : score >= 40 ? "#fbbf24" : "#fb7185";
  return (
    <div className="relative w-[92px] h-[92px] shrink-0">
      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
        <circle cx="40" cy="40" r="34" fill="none" stroke="#27272a" strokeWidth="8" />
        <circle cx="40" cy="40" r="34" fill="none" stroke={colour} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-white font-mono leading-none">{score}</span>
        <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest mt-0.5">score</span>
      </div>
    </div>
  );
};

export const ClinicCrmPanel: React.FC<{ snapshot: PipelineSnapshot }> = ({ snapshot }) => {
  const { lead } = snapshot;
  return (
    <Panel
      title="CRM record — clinic_demo_leads"
      subtitle={`idempotency_key: ${lead.idempotency_key}`}
      badge={snapshot.data_source === "supabase-live" ? <Tag tone="emerald">LIVE · SUPABASE</Tag> : <Tag tone="amber">DEMO · IN-MEMORY</Tag>}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5">
        <Field label="id" value={lead.id} />
        <Field label="external_id" value={lead.external_id} />
        <Field label="full_name" value={lead.full_name} />
        <Field label="phone" value={lead.phone || "—"} />
        <Field label="email" value={lead.email || "—"} />
        <Field label="source" value={lead.source} />
        <Field label="service_interest" value={lead.service_interest} />
        <Field label="lead_score" value={String(lead.lead_score)} />
        <Field label="status" value={lead.status} tone={lead.status === "qualified" ? "emerald" : lead.status === "needs_human" ? "rose" : "amber"} />
        <Field label="primary_service" value={lead.primary_service} />
        <Field label="next_action" value={lead.next_action} />
        <Field label="next_action_at" value={lead.next_action_at ? new Date(lead.next_action_at).toISOString().replace("T", " ").slice(0, 16) : "—"} />
        <Field label="handoff_required" value={String(lead.handoff_required)} tone={lead.handoff_required ? "rose" : "zinc"} />
        <Field label="booked" value={String(lead.booked)} tone={lead.booked ? "emerald" : "zinc"} />
        <Field label="created_at" value={lead.created_at.replace("T", " ").slice(0, 19)} />
        <Field label="updated_at" value={lead.updated_at.replace("T", " ").slice(0, 19)} />
      </div>
    </Panel>
  );
};

const Field: React.FC<{ label: string; value: string; tone?: "emerald" | "rose" | "amber" | "zinc" }> = ({ label, value, tone = "zinc" }) => {
  const colours: Record<string, string> = { emerald: "text-emerald-300", rose: "text-rose-300", amber: "text-amber-300", zinc: "text-zinc-200" };
  return (
    <div className="py-1.5 border-b border-zinc-800/70">
      <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-600">{label}</div>
      <div className={`text-[12px] font-mono break-all ${colours[tone]}`}>{value}</div>
    </div>
  );
};
