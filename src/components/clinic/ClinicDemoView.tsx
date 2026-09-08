import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  FlaskConical,
  PlayCircle,
  Radio,
  RotateCcw,
  ShieldAlert,
  Stethoscope,
  Terminal,
} from "lucide-react";
import type { ClinicMetrics, ClinicStatus, PipelineSnapshot } from "../../clinic/types";
import { Panel, Tag } from "./ui";
import { SAMPLE_LEADS, clinicApi, type MakeProbeResult } from "./api";
import {
  ClinicConversationSimulator,
  ClinicCrmPanel,
  ClinicQualificationPanel,
  ClinicWorkflowDiagram,
} from "./Panels";
import {
  ClinicBookingPanel,
  ClinicEventLog,
  ClinicFollowUpPanel,
  ClinicHandoffPanel,
  ClinicReminderTimeline,
  ClinicReportingPanel,
} from "./FlowPanels";

const DEMO_LEAD = SAMPLE_LEADS[0].payload;

/** 48 hours of virtual clock, in minutes. */
const MAX_VIRTUAL_MINUTES = 48 * 60;

export const ClinicDemoView: React.FC = () => {
  const [status, setStatus] = useState<ClinicStatus | null>(null);
  const [snapshot, setSnapshot] = useState<PipelineSnapshot | null>(null);
  const [metrics, setMetrics] = useState<ClinicMetrics | null>(null);
  const [minutes, setMinutes] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [probe, setProbe] = useState<MakeProbeResult | null>(null);
  const [probeBusy, setProbeBusy] = useState(false);

  const refreshMetrics = useCallback(() => {
    clinicApi.metrics().then((data) => setMetrics(data.metrics)).catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const statusData = await clinicApi.status();
        if (cancelled) return;
        setStatus(statusData);
        const created = await clinicApi.createLead(DEMO_LEAD, 0);
        if (cancelled) return;
        setSnapshot(created.snapshot);
        refreshMetrics();
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? "Clinic demo API is unavailable");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshMetrics]);

  /** Re-renders the current lead at a different position on the virtual clock. */
  useEffect(() => {
    if (!snapshot) return;
    let cancelled = false;
    clinicApi
      .getLead(snapshot.lead.id, minutes)
      .then((data) => {
        if (!cancelled) setSnapshot(data.snapshot);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [minutes, snapshot?.lead.id]);

  const runScenario = async (payload: (typeof SAMPLE_LEADS)[number]["payload"]) => {
    setBusy(true);
    setError("");
    try {
      const result = await clinicApi.createLead(payload, minutes);
      setSnapshot(result.snapshot);
      refreshMetrics();
    } catch (err: any) {
      setError(err?.message ?? "Scenario failed");
    } finally {
      setBusy(false);
    }
  };

  const runLiveMakeDemo = async () => {
    setProbeBusy(true);
    setError("");
    try {
      const result = await clinicApi.probeMakeWebhook({ ...DEMO_LEAD, external_id: `ui-live-${Date.now()}` });
      setProbe(result);
    } catch (err: any) {
      setProbe({
        success: false,
        delivered: false,
        reason: "network_error",
        detail: err?.message ?? "Proxy request failed",
        payload_sent: null,
        target: null,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setProbeBusy(false);
    }
  };

  const virtualClockLabel = useMemo(() => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `+${hours}h ${String(mins).padStart(2, "0")}m`;
  }, [minutes]);

  return (
    <div className="space-y-4">
      {/* ------------------------------ Hero ------------------------------ */}
      <section className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-emerald-950/30 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <Stethoscope className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-emerald-400">Portfolio case study</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white font-sans tracking-tight leading-tight">
              AI Clinic Lead → Booking Automation
            </h2>
            <p className="text-[13px] text-zinc-400 font-sans mt-2 max-w-2xl leading-relaxed">
              From inbound message to qualified lead, appointment, reminders, follow-up and human handoff — with every
              state transition written to an auditable event log.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <Tag tone="rose">NON-PRODUCTION DEMO</Tag>
              <Tag tone="cyan">MAKE SCENARIO {status?.make_scenario_id ?? "…"}</Tag>
              <Tag tone="violet">GEMINI QUALIFICATION</Tag>
              <Tag tone="amber">SUPABASE CRM CONTRACT</Tag>
            </div>
          </div>
          <div className="bg-zinc-950/70 border border-zinc-800 rounded-2xl p-4 min-w-[240px]">
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 mb-2">Runtime honesty</div>
            <StatusLine label="Data source" value={snapshot?.data_source ?? status?.data_source ?? "…"} tone={snapshot?.data_source === "supabase-live" ? "emerald" : "amber"} />
            <StatusLine label="Qualification" value={status?.qualification_model ?? "…"} />
            <StatusLine label="Booking" value="demo-booking-adapter" tone="violet" />
            <StatusLine label="Notifications" value="demo-notification-adapter" tone="violet" />
            <StatusLine
              label="Make webhook"
              value={status?.make_webhook_configured ? "configured" : "not configured"}
              tone={status?.make_webhook_configured ? "emerald" : "zinc"}
            />
            <StatusLine label="Supabase" value={status?.supabase_configured ? "connected" : "not connected"} tone={status?.supabase_configured ? "emerald" : "zinc"} />
          </div>
        </div>

        <div className="mt-5 flex items-start gap-2 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-amber-100/90 font-sans leading-relaxed">
            <strong className="font-mono">Demo boundaries:</strong> no live WhatsApp / Instagram / Messenger credentials are
            connected, booking and notifications run through clearly labelled demo adapters, and no real clinic pricing or
            medical advice is produced. Everything below is a working demonstration of how the workflow is architected —
            not a claim of a live clinic deployment.
          </div>
        </div>
      </section>

      {/* --------------------------- Controls --------------------------- */}
      <Panel
        title="Run the pipeline"
        subtitle="each scenario drives the real engine — qualification, CRM, booking, reminders, follow-up, handoff"
        badge={<Tag tone="emerald">INTERACTIVE</Tag>}
      >
        <div className="flex flex-wrap gap-2">
          {SAMPLE_LEADS.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => runScenario(scenario.payload)}
              disabled={busy}
              className="inline-flex items-center gap-2 bg-zinc-800/80 hover:bg-zinc-800 disabled:opacity-50 border border-zinc-700 text-zinc-200 text-[11px] font-mono px-3 py-2 rounded-xl transition-all"
            >
              <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
              {scenario.label}
            </button>
          ))}
          <button
            onClick={() => {
              setMinutes(0);
              runScenario(DEMO_LEAD);
            }}
            disabled={busy}
            className="inline-flex items-center gap-2 bg-zinc-950 hover:bg-zinc-900 disabled:opacity-50 border border-zinc-800 text-zinc-400 text-[11px] font-mono px-3 py-2 rounded-xl transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset clock
          </button>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 mb-1.5">
            <span>Virtual demo clock — fires reminders & follow-ups deterministically</span>
            <span className="text-emerald-300 font-bold">{virtualClockLabel}</span>
          </div>
          <input
            type="range"
            min={0}
            max={MAX_VIRTUAL_MINUTES}
            step={30}
            value={minutes}
            onChange={(event) => setMinutes(Number(event.target.value))}
            className="w-full accent-emerald-500"
          />
          <div className="flex justify-between text-[9px] font-mono text-zinc-600 mt-1">
            <span>+0m intake</span>
            <span>+6h follow-up #1</span>
            <span>+24h follow-up #2 / reminder</span>
            <span>+48h</span>
          </div>
        </div>

        {error ? (
          <p className="mt-3 text-[11px] text-rose-300 font-mono bg-rose-500/10 border border-rose-500/30 rounded-xl p-2.5">{error}</p>
        ) : null}
      </Panel>

      {/* --------------------------- Live Make --------------------------- */}
      <Panel
        title="Run live Make demo"
        subtitle={`same-origin proxy → Make webhook (scenario ${status?.make_scenario_id ?? "…"})`}
        badge={<Tag tone="cyan">REAL NETWORK CALL</Tag>}
      >
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={runLiveMakeDemo}
            disabled={probeBusy}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-500 font-bold text-[12px] px-4 py-2.5 rounded-xl transition-all"
          >
            <PlayCircle className="w-4 h-4" />
            {probeBusy ? "Sending to Make…" : "Send demo lead to Make webhook"}
          </button>
          <code className="text-[10px] font-mono text-zinc-600 break-all">
            POST /api/clinic/make-webhook → {status?.make_webhook_target ?? "MAKE_CLINIC_WEBHOOK_URL not set"}
          </code>
        </div>

        {probe ? (
          <div
            className={`mt-3 rounded-xl border p-3 text-[11px] font-mono ${
              probe.success
                ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-100"
                : "border-rose-500/30 bg-rose-500/5 text-rose-100"
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              {probe.success ? <Activity className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
              <span className="font-bold">
                {probe.delivered ? `delivered · ${probe.reason}` : `NOT delivered · ${probe.reason}`}
              </span>
              {probe.upstream_status ? <span className="text-zinc-400">HTTP {probe.upstream_status}</span> : null}
              {probe.latency_ms ? <span className="text-zinc-400">{probe.latency_ms}ms</span> : null}
            </div>
            <p className="leading-relaxed">{probe.detail}</p>
            {probe.upstream_body ? <pre className="mt-2 text-[10px] text-zinc-400 whitespace-pre-wrap break-all">{probe.upstream_body}</pre> : null}
            <p className="mt-2 text-[10px] text-zinc-500">
              An HTTP 200 from Make only proves the webhook accepted the delivery. A verified run requires a matching entry
              in the scenario execution list plus a persisted CRM row.
            </p>
          </div>
        ) : (
          <p className="mt-3 text-[11px] text-zinc-500 font-sans">
            The button reports exactly what the network returned — including failures. It never simulates a successful
            Make execution.
          </p>
        )}
      </Panel>

      {/* --------------------------- Pipeline --------------------------- */}
      {!snapshot ? (
        <Panel title="Pipeline" subtitle="waiting for the clinic demo API">
          <p className="text-[12px] text-zinc-500 font-mono">Loading snapshot…</p>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-1 space-y-4">
            <ClinicWorkflowDiagram snapshot={snapshot} />
            <ClinicEventLog snapshot={snapshot} />
          </div>

          <div className="xl:col-span-2 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ClinicConversationSimulator snapshot={snapshot} />
              <ClinicQualificationPanel snapshot={snapshot} />
            </div>

            <ClinicCrmPanel snapshot={snapshot} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ClinicBookingPanel
                snapshot={snapshot}
                onBooked={(next) => {
                  setSnapshot(next);
                  refreshMetrics();
                }}
              />
              <ClinicReminderTimeline snapshot={snapshot} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ClinicFollowUpPanel snapshot={snapshot} />
              <ClinicHandoffPanel snapshot={snapshot} />
            </div>
          </div>
        </div>
      )}

      {/* --------------------------- Reporting --------------------------- */}
      <ClinicReportingPanel metrics={metrics} />

      {/* --------------------------- Positioning --------------------------- */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h3 className="text-[14px] font-bold text-white font-sans">Engineering patterns demonstrated here</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px] font-mono text-zinc-400">
          {[
            "Webhook intake + channel normalisation",
            "Idempotency keys → no duplicate CRM rows",
            "Structured JSON AI contract (score / status / reason)",
            "Clinical-safety guardrails → human handoff",
            "Deterministic scheduling (confirmation / reminders)",
            "Bounded follow-up ladder with auto-stop",
            "Event-sourced execution log per lead",
            "Same-origin proxy — no secrets in the browser bundle",
          ].map((pattern) => (
            <div key={pattern} className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3 flex items-start gap-2">
              <Radio className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
              <span>{pattern}</span>
            </div>
          ))}
        </div>
        <p className="text-[12px] text-zinc-500 font-sans mt-4 leading-relaxed">
          I don&apos;t build basic chatbots — I build automated lead-to-booking systems. This is a working demonstration of
          how an aesthetic-clinic workflow can be architected and automated, with the reliability patterns a production
          deployment needs.
        </p>
      </section>
    </div>
  );
};

const StatusLine: React.FC<{ label: string; value: string; tone?: "emerald" | "amber" | "violet" | "zinc" }> = ({
  label,
  value,
  tone = "zinc",
}) => {
  const colours: Record<string, string> = { emerald: "text-emerald-300", amber: "text-amber-300", violet: "text-violet-300", zinc: "text-zinc-300" };
  return (
    <div className="flex items-center justify-between gap-3 py-1 border-b border-zinc-800/70 last:border-0">
      <span className="text-[10px] font-mono uppercase tracking-wide text-zinc-600">{label}</span>
      <span className={`text-[10px] font-mono ${colours[tone]}`}>{value}</span>
    </div>
  );
};
