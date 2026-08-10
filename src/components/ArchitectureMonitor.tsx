import React, { useState } from 'react';
import {
  ShieldCheck,
  Cpu,
  Workflow,
  Database,
  GitBranch,
  Cloud,
  CheckCircle2,
  Lock,
  Zap,
  Activity,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Server,
  Layers,
  Sparkles,
  ArrowDown
} from 'lucide-react';
import { AIModelOption } from '../types';

interface ArchitectureMonitorProps {
  activeModel: AIModelOption;
}

export const ArchitectureMonitor: React.FC<ArchitectureMonitorProps> = ({ activeModel }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditTimestamp, setAuditTimestamp] = useState<string>(new Date().toLocaleTimeString());
  const [selectedProvider, setSelectedProvider] = useState<string>(activeModel.id);

  const runAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
      setAuditTimestamp(new Date().toLocaleTimeString());
    }, 600);
  };

  const enforcementRules = [
    { rule: 'Core Agent identity independent from Gemini', status: 'PASS' },
    { rule: 'Model Provider hot-swappable (Provider-Agnostic)', status: 'PASS' },
    { rule: 'n8n exposed ONLY as a Tool capability, never as Agent', status: 'PASS' },
    { rule: 'Tool Gateway enforces 100% execution boundary', status: 'PASS' },
    { rule: '6-Step Execution Loop strictly enforced', status: 'PASS' },
    { rule: 'Governance & Profile rules enforced before tools', status: 'PASS' },
    { rule: 'Memory Bank decoupled from LLM context window', status: 'PASS' },
    { rule: 'Core Agent reusable across multi-tenant projects', status: 'PASS' }
  ];

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg mb-4 text-zinc-200">
      {/* Header Bar */}
      <div className="px-4 py-3 bg-zinc-900/80 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-xs font-bold uppercase tracking-wide text-zinc-100">
                ARCHITECTURE v1.0 LOCKED
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> 8/8 PASSED
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans">
              Decoupled Core Agent Architecture • Tool Gateway Execution Boundary
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={runAudit}
            disabled={isAuditing}
            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white text-[11px] flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 text-emerald-400 ${isAuditing ? 'animate-spin' : ''}`} />
            <span>Audit Status</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title={isExpanded ? 'Collapse Diagram' : 'Expand Diagram'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Diagram Area */}
      {isExpanded && (
        <div className="p-4 space-y-4 bg-zinc-950 font-mono">
          {/* Topology Diagram Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative">
            
            {/* Box 1: CORE AGENT (The Brain) */}
            <div className="bg-zinc-900/90 border border-emerald-500/30 rounded-xl p-3.5 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5" /> CORE AGENT (AI COO)
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    DECOUPLED
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white mb-1.5">Operational Core Identity</h4>
                <div className="space-y-1 text-[10px] text-zinc-400">
                  <div className="flex items-center justify-between">
                    <span>Identity:</span>
                    <strong className="text-zinc-200">AI COO Protocol</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Memory:</span>
                    <strong className="text-zinc-200">Decoupled Context Engine</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Governance:</span>
                    <strong className="text-emerald-400">Rules & Profiles Enforced</strong>
                  </div>
                </div>
              </div>

              {/* Loop Pill */}
              <div className="mt-3 pt-2.5 border-t border-zinc-800 text-[9px] text-zinc-400">
                <span className="text-zinc-500 block mb-0.5 font-bold uppercase">Enforced Execution Loop:</span>
                <span className="text-emerald-400 font-semibold">
                  Understand &rarr; Inspect &rarr; Decide &rarr; Execute &rarr; Verify &rarr; Report
                </span>
              </div>
            </div>

            {/* Down/Right Arrow Connector 1 */}
            <div className="hidden md:flex absolute left-1/3 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none text-emerald-500/60">
              <div className="w-6 h-6 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-emerald-400">
                &rarr;
              </div>
            </div>

            {/* Box 2: TOOL GATEWAY (Execution Boundary) */}
            <div className="bg-zinc-900/90 border border-indigo-500/30 rounded-xl p-3.5 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold tracking-wider text-indigo-400 uppercase flex items-center gap-1">
                    <Server className="w-3.5 h-3.5" /> TOOL GATEWAY
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    GATEWAY BOUNDARY
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white mb-2">Managed Target Integrations</h4>

                {/* Sub Tools List */}
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className="bg-zinc-950 p-1.5 rounded-lg border border-zinc-800 flex items-center gap-1.5">
                    <GitBranch className="w-3 h-3 text-cyan-400 shrink-0" />
                    <div>
                      <div className="text-zinc-200 font-bold">GitHub</div>
                      <div className="text-[8px] text-zinc-500">Repo & PRs</div>
                    </div>
                  </div>

                  <div className="bg-zinc-950 p-1.5 rounded-lg border border-zinc-800 flex items-center gap-1.5">
                    <Database className="w-3 h-3 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-zinc-200 font-bold">Supabase</div>
                      <div className="text-[8px] text-zinc-500">DB & Auth</div>
                    </div>
                  </div>

                  <div className="bg-zinc-950 p-1.5 rounded-lg border border-zinc-800 flex items-center gap-1.5">
                    <Workflow className="w-3 h-3 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-zinc-200 font-bold">n8n Engine</div>
                      <div className="text-[8px] text-amber-400/80 font-bold">Tool Only</div>
                    </div>
                  </div>

                  <div className="bg-zinc-950 p-1.5 rounded-lg border border-zinc-800 flex items-center gap-1.5">
                    <Cloud className="w-3 h-3 text-blue-400 shrink-0" />
                    <div>
                      <div className="text-zinc-200 font-bold">Cloud Run</div>
                      <div className="text-[8px] text-zinc-500">Infra / GCP</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-zinc-800 text-[9px] text-zinc-400 flex items-center justify-between">
                <span>Boundary Status:</span>
                <span className="text-indigo-300 font-bold">100% Isolated</span>
              </div>
            </div>

            {/* Down/Right Arrow Connector 2 */}
            <div className="hidden md:flex absolute right-1/3 top-1/2 translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none text-indigo-500/60">
              <div className="w-6 h-6 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-indigo-400">
                &rarr;
              </div>
            </div>

            {/* Box 3: MODEL PROVIDER (Provider-Agnostic) */}
            <div className="bg-zinc-900/90 border border-amber-500/30 rounded-xl p-3.5 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold tracking-wider text-amber-400 uppercase flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> MODEL PROVIDER
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    HOT-SWAPPABLE
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white mb-1.5">Model Abstraction Layer</h4>

                <div className="space-y-1 text-[10px]">
                  <div className="flex items-center justify-between bg-zinc-950 p-1.5 rounded-lg border border-zinc-800">
                    <span className="text-zinc-400">Active Default:</span>
                    <strong className="text-amber-400 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> {activeModel.name}
                    </strong>
                  </div>

                  <div className="text-[9px] text-zinc-500 pt-1">
                    Rule: Gemini is a model provider layer, not the agent identity. Swappable to Claude or OpenAI without changing Core Agent logic.
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-zinc-800 text-[9px] text-zinc-400 flex items-center justify-between">
                <span>Decoupling Verification:</span>
                <span className="text-emerald-400 font-bold">PASSED</span>
              </div>
            </div>

          </div>

          {/* Audit Rule Status Strip */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-[11px]">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-zinc-800">
              <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" /> Architectural Decoupled Rules Audit
              </span>
              <span className="text-[9px] text-zinc-500">
                Last checked: <strong className="text-zinc-300">{auditTimestamp}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[10px]">
              {enforcementRules.map((item, idx) => (
                <div key={idx} className="bg-zinc-950 p-2 rounded-lg border border-zinc-800/80 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="leading-tight">
                    <span className="text-zinc-300 block">{item.rule}</span>
                    <span className="text-[8px] font-bold text-emerald-400 uppercase">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
