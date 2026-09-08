import React, { useEffect, useState } from "react";
import { CalendarCheck2, BellRing, UserRoundCog, BarChart3, Check, Circle, Clock } from "lucide-react";
import type { BookingSlot, ClinicMetrics, PipelineSnapshot } from "../../clinic/types";
import { Panel, Tag } from "./ui";
import { clinicApi } from "./api";

/* ------------------------- Booking ------------------------- */

export const ClinicBookingPanel: React.FC<{
  snapshot: PipelineSnapshot;
  onBooked: (snapshot: PipelineSnapshot) => void;
}> = ({ snapshot, onBooked }) => {
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    clinicApi.slots().then((data) => {
      if (cancelled) return;
      setSlots(data.slots);
      const firstAvailable = data.slots.find((slot) => slot.available);
      if (firstAvailable) setSelected(firstAvailable.id);
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const canBook = snapshot.lead.status === "qualified" && !snapshot.lead.booked;

  const handleBook = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await clinicApi.book(snapshot.lead.id, selected);
      onBooked(result.snapshot);
    } catch (err: any) {
      setError(err?.message ?? "Booking failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel
      title="Booking — demo adapter"
      subtitle="deterministic slot generation · idempotent appointment creation"
      badge={<Tag tone="violet">demo-booking-adapter</Tag>}
    >
      {snapshot.appointment ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-300 text-[12px] font-mono">
            <Check className="w-4 h-4" />
            Appointment {snapshot.appointment.id} · {snapshot.appointment.status.toUpperCase()}
          </div>
          <div className="text-[11px] font-mono text-zinc-500">slot: {snapshot.appointment.slot_id}</div>
          <div className="text-[11px] font-mono text-zinc-500">starts_at: {snapshot.appointment.starts_at}</div>
          <div className="text-[11px] font-mono text-zinc-500">booked_at: {snapshot.appointment.booked_at}</div>
          <div className="text-[11px] font-mono text-zinc-500">
            confirmed_at: {snapshot.appointment.confirmed_at ?? "pending"}
          </div>
          <div className="text-[11px] font-mono text-zinc-500">confirmation_channel: {snapshot.appointment.confirmation_channel}</div>
          <p className="text-[11px] text-zinc-600 font-mono pt-1">
            Re-submitting this booking returns the same appointment — no duplicate rows.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {!canBook ? (
            <p className="text-[12px] text-zinc-400 font-sans bg-zinc-950/70 border border-zinc-800 rounded-xl p-3">
              Booking is only offered to <span className="text-emerald-300 font-mono">qualified</span> leads. This lead is{" "}
              <span className="text-zinc-200 font-mono">{snapshot.lead.status}</span>
              {snapshot.lead.status === "needs_human" ? " and is waiting on a human agent." : ", so it goes to nurture instead."}
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            {slots.map((slot) => (
              <button
                key={slot.id}
                disabled={!slot.available || !canBook}
                onClick={() => setSelected(slot.id)}
                className={`text-left px-3 py-2 rounded-xl border text-[11px] font-mono transition-all ${
                  selected === slot.id && slot.available
                    ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-200"
                    : slot.available
                      ? "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700"
                      : "border-zinc-900 bg-zinc-950/50 text-zinc-700 line-through cursor-not-allowed"
                }`}
              >
                {slot.label}
              </button>
            ))}
          </div>

          {error ? <p className="text-[11px] text-rose-300 font-mono">{error}</p> : null}

          <button
            onClick={handleBook}
            disabled={!canBook || !selected || busy}
            className="w-full inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 disabled:text-zinc-500 font-bold text-[12px] px-4 py-2.5 rounded-xl transition-all"
          >
            <CalendarCheck2 className="w-4 h-4" />
            {busy ? "Creating appointment…" : "Create appointment + confirm"}
          </button>
        </div>
      )}
    </Panel>
  );
};

/* ------------------------- Reminders ------------------------- */

export const ClinicReminderTimeline: React.FC<{ snapshot: PipelineSnapshot }> = ({ snapshot }) => {
  const items = snapshot.notifications.filter((n) => n.kind === "confirmation" || n.kind.startsWith("reminder"));
  return (
    <Panel
      title="Confirmation & reminders"
      subtitle="fires on a virtual clock — scrub the demo timeline above"
      badge={<Tag tone="violet">demo-notification-adapter</Tag>}
    >
      {items.length === 0 ? (
        <p className="text-[12px] text-zinc-500 font-sans">No appointment yet — confirmation and reminders are scheduled the moment a booking is created.</p>
      ) : (
        <ol className="space-y-3">
          {items.map((item) => {
            const sent = item.status === "sent";
            const Icon = sent ? Check : Clock;
            return (
              <li key={item.id} className="flex gap-3">
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${sent ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-zinc-700 bg-zinc-950 text-zinc-500"}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[12px] font-bold text-zinc-100 font-sans">{item.kind.replace(/_/g, " ")}</span>
                    <span className={`text-[9px] font-mono font-bold ${sent ? "text-emerald-400" : "text-zinc-500"}`}>{sent ? "SENT" : "SCHEDULED"}</span>
                    <span className="text-[9px] font-mono text-zinc-600">+{item.fire_after_minutes}m</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-sans leading-relaxed mt-0.5">{item.body}</p>
                  <p className="text-[10px] text-zinc-600 font-mono mt-0.5">
                    {sent ? `sent_at ${item.sent_at?.replace("T", " ").slice(0, 16)}` : `scheduled_for ${item.scheduled_for.replace("T", " ").slice(0, 16)}`} · channel {item.channel}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
};

/* ------------------------- Follow-up ------------------------- */

export const ClinicFollowUpPanel: React.FC<{ snapshot: PipelineSnapshot }> = ({ snapshot }) => {
  const followups = snapshot.notifications.filter((n) => n.kind.startsWith("followup"));
  const stopped = snapshot.lead.booked;
  return (
    <Panel
      title="Unbooked follow-up engine"
      subtitle="follow-up #1 → #2 → auto-stop on booking"
      badge={stopped ? <Tag tone="emerald">STOPPED AFTER BOOKING</Tag> : followups.length ? <Tag tone="cyan">LADDER ACTIVE</Tag> : <Tag>NOT APPLICABLE</Tag>}
    >
      {followups.length === 0 ? (
        <p className="text-[12px] text-zinc-500 font-sans">
          This lead is <span className="font-mono text-zinc-300">{snapshot.lead.status}</span> — no booking ladder is scheduled.
          Unqualified leads get nurture content, not repeated booking pressure.
        </p>
      ) : (
        <div className="space-y-3">
          {followups.map((item, index) => {
            const sent = item.status === "sent";
            return (
              <div key={item.id} className={`rounded-xl border p-3 ${sent ? "border-emerald-500/30 bg-emerald-500/5" : "border-zinc-800 bg-zinc-950/60"}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <BellRing className={`w-3.5 h-3.5 ${sent ? "text-emerald-400" : "text-zinc-600"}`} />
                  <span className="text-[12px] font-bold text-zinc-100 font-sans">Follow-up #{index + 1}</span>
                  <span className={`text-[9px] font-mono font-bold ${sent ? "text-emerald-400" : "text-zinc-500"}`}>{sent ? "SENT" : "SCHEDULED"}</span>
                  <span className="text-[9px] font-mono text-zinc-600">+{item.fire_after_minutes}m</span>
                </div>
                <p className="text-[11px] text-zinc-400 font-sans mt-1.5 leading-relaxed">{item.body}</p>
              </div>
            );
          })}
          {stopped ? (
            <p className="text-[11px] text-emerald-300 font-mono">
              Ladder cancelled automatically — the lead booked, so no further follow-ups are sent.
            </p>
          ) : (
            <p className="text-[11px] text-zinc-500 font-mono">
              Ladder stops after #2 regardless of response. Idempotency prevents duplicate sends.
            </p>
          )}
        </div>
      )}
    </Panel>
  );
};

/* ------------------------- Handoff ------------------------- */

export const ClinicHandoffPanel: React.FC<{ snapshot: PipelineSnapshot }> = ({ snapshot }) => {
  const { handoff, lead } = snapshot;
  return (
    <Panel
      title="Human handoff"
      subtitle="clinical-safety questions never get an automated clinical answer"
      badge={handoff ? <Tag tone="rose">AI AUTONOMY HALTED</Tag> : <Tag tone="emerald">NOT REQUIRED</Tag>}
    >
      {handoff ? (
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-rose-200 text-[12px] font-sans bg-rose-500/10 border border-rose-500/30 rounded-xl p-3">
            <UserRoundCog className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong className="font-mono">handoff_required = true</strong> — the AI stopped before answering and created an escalation
              for a human agent.
            </span>
          </div>
          <div className="text-[11px] font-mono text-zinc-500">handoff_id: {handoff.id}</div>
          <div className="text-[11px] font-mono text-zinc-500">owner: {handoff.owner}</div>
          <div className="text-[11px] font-mono text-zinc-500">ai_autonomy: {handoff.ai_autonomy}</div>
          <div className="text-[11px] font-mono text-zinc-500">created_at: {handoff.created_at.replace("T", " ").slice(0, 19)}</div>
          <p className="text-[11px] text-zinc-400 font-sans bg-zinc-950/70 border border-zinc-800 rounded-xl p-3">{handoff.reason}</p>
        </div>
      ) : (
        <p className="text-[12px] text-zinc-500 font-sans">
          No clinical-safety trigger in this message, so the AI handled it end-to-end. Trigger terms (pregnancy, medication,
          side effects, diagnosis, …) force <span className="font-mono text-zinc-300">status = needs_human</span>.
        </p>
      )}
      <div className="text-[11px] font-mono text-zinc-600 mt-3">
        lead.handoff_required = <span className={lead.handoff_required ? "text-rose-300" : "text-zinc-400"}>{String(lead.handoff_required)}</span> · next_action ={" "}
        <span className="text-zinc-300">{lead.next_action}</span>
      </div>
    </Panel>
  );
};

/* ------------------------- Reporting ------------------------- */

const METRIC_CARDS: Array<{ key: keyof ClinicMetrics; label: string; suffix?: string }> = [
  { key: "conversations", label: "Conversations" },
  { key: "leads", label: "Leads" },
  { key: "qualified", label: "Qualified" },
  { key: "booked", label: "Booked" },
  { key: "booking_rate", label: "Booking rate", suffix: "%" },
  { key: "unbooked_qualified", label: "Unbooked qualified" },
  { key: "followups_sent", label: "Follow-ups sent" },
  { key: "handoffs", label: "Human handoffs" },
  { key: "reminders_sent", label: "Reminders sent" },
  { key: "deduplicated_messages", label: "Duplicates absorbed" },
];

export const ClinicReportingPanel: React.FC<{ metrics: ClinicMetrics | null }> = ({ metrics }) => (
  <Panel
    title="Operational reporting"
    subtitle="clinic_demo_* aggregates — no fabricated production numbers"
    badge={<BarChart3 className="w-4 h-4 text-cyan-300" />}
  >
    {!metrics ? (
      <p className="text-[12px] text-zinc-500 font-mono">Loading metrics…</p>
    ) : (
      <>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {METRIC_CARDS.map((card) => (
            <div key={card.key} className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3">
              <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-600">{card.label}</div>
              <div className="text-xl font-bold text-white font-mono leading-tight mt-1">
                {String(metrics[card.key] ?? 0)}
                {card.suffix ?? ""}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 text-[11px] font-mono text-zinc-500">
          <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3">
            unqualified: <span className="text-zinc-300">{metrics.unqualified}</span>
          </div>
          <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3">
            needs_human: <span className="text-rose-300">{metrics.needs_human}</span>
          </div>
          <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3">
            reminders scheduled: <span className="text-zinc-300">{metrics.reminders_scheduled}</span>
          </div>
        </div>
      </>
    )}
  </Panel>
);

/* ------------------------- Event log ------------------------- */

export const ClinicEventLog: React.FC<{ snapshot: PipelineSnapshot }> = ({ snapshot }) => (
  <Panel
    title="Execution log — clinic_demo_events"
    subtitle={`${snapshot.events.length} auditable records for this lead`}
    badge={<Tag tone="cyan">OBSERVABILITY</Tag>}
  >
    <ol className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
      {snapshot.events.map((event) => (
        <li key={event.id} className="flex items-start gap-2 text-[11px] font-mono">
          <Circle className="w-2 h-2 mt-1 shrink-0 text-emerald-500" />
          <span className="text-zinc-600 shrink-0">+{event.minutes_after_intake}m</span>
          <span className="text-cyan-300 shrink-0">{event.type}</span>
          <span className="text-zinc-500 break-words">{event.detail}</span>
        </li>
      ))}
    </ol>
  </Panel>
);

