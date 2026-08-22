import React, { useState } from 'react';
import {
  Layers,
  Brain,
  Plug,
  Workflow,
  BookOpenCheck,
  Activity,
  Terminal,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Clock,
  Sparkles
} from 'lucide-react';
import { Project, Connector, Workflow as WorkflowType, LessonLearned, ExecutionLog, UserProfile, AIModelOption } from '../types';
import { AdaptiveBehaviorCard } from './AdaptiveBehaviorCard';
import { checkEnvStatus, EnvValidationSummary } from '../utils/envValidator';

interface DashboardViewProps {
  projects: Project[];
  activeProject: Project;
  connectors: Connector[];
  workflows: WorkflowType[];
  lessons: LessonLearned[];
  logs: ExecutionLog[];
  userProfile: UserProfile;
  activeModel: AIModelOption;
  onNavigate: (view: any) => void;
  onRunQuickCommand: (cmd: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  activeProject,
  connectors,
  workflows,
  lessons,
  logs,
  userProfile,
  activeModel,
  onNavigate,
  onRunQuickCommand,
}) => {
  const connectedCount = connectors.filter(c => c.status === 'connected' || c.status === 'authorized').length;
  const activeWfCount = workflows.filter(w => w.active).length;

  const [envSummary, setEnvSummary] = useState<EnvValidationSummary | null>(null);
  const [checkingEnv, setCheckingEnv] = useState(false);

  const handleCheckEnv = async () => {
    setCheckingEnv(true);
    try {
      const summary = await checkEnvStatus();
      setEnvSummary(summary);
    } catch (err) {
      console.error('Error checking env status:', err);
    } finally {
      setCheckingEnv(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & System Status Banner - Bento Grid Hero Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-zinc-200 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2 font-mono text-xs">
              <span className="px-2.5 py-0.5 font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                MASTER OPERATIONS HQ
              </span>
              <span className="text-zinc-500">&bull; ACTIVE LAYER: <strong className="text-zinc-200">{activeProject.name}</strong></span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-sans">
              Universal AI Operations OS
            </h2>
            <p className="text-xs md:text-sm text-zinc-400 max-w-2xl mt-1.5 font-sans leading-relaxed">
              Core agent core built once and inherited by project modules. Features 8-layer memory, adaptive behavioral learning, n8n orchestrator, and automated software engineering.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate('chat')}
              className="flex items-center gap-2 bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95"
            >
              <Terminal className="w-4 h-4" />
              Command Center
            </button>
            <button
              onClick={() => onNavigate('onboarding')}
              className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium px-3.5 py-2.5 rounded-xl border border-zinc-700 transition-all active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              Discovery Quiz
            </button>
          </div>
        </div>
      </div>

      {/* Bento Grid KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Active Projects */}
        <div 
          onClick={() => onNavigate('projects')}
          className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-4 rounded-2xl text-zinc-200 cursor-pointer transition-all hover:bg-zinc-900/80"
        >
          <div className="flex items-center justify-between text-zinc-500 mb-1 font-mono">
            <span className="text-[10px] font-bold uppercase tracking-wider">PROJECTS</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{projects.length}</div>
          <div className="text-[10px] text-emerald-400 font-mono mt-1">1 Core &bull; {projects.length - 1} Inherit</div>
        </div>

        {/* Plugins & Connectors */}
        <div 
          onClick={() => onNavigate('connectors')}
          className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-4 rounded-2xl text-zinc-200 cursor-pointer transition-all hover:bg-zinc-900/80"
        >
          <div className="flex items-center justify-between text-zinc-500 mb-1 font-mono">
            <span className="text-[10px] font-bold uppercase tracking-wider">CONNECTORS</span>
            <Plug className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{connectedCount}/{connectors.length}</div>
          <div className="text-[10px] text-cyan-400 font-mono mt-1">OAuth & APIs</div>
        </div>

        {/* n8n Automations */}
        <div 
          onClick={() => onNavigate('workflows')}
          className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-4 rounded-2xl text-zinc-200 cursor-pointer transition-all hover:bg-zinc-900/80"
        >
          <div className="flex items-center justify-between text-zinc-500 mb-1 font-mono">
            <span className="text-[10px] font-bold uppercase tracking-wider">WORKFLOWS</span>
            <Workflow className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{activeWfCount}</div>
          <div className="text-[10px] text-amber-400 font-mono mt-1">n8n Active</div>
        </div>

        {/* Lessons Learned */}
        <div 
          onClick={() => onNavigate('lessons')}
          className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-4 rounded-2xl text-zinc-200 cursor-pointer transition-all hover:bg-zinc-900/80"
        >
          <div className="flex items-center justify-between text-zinc-500 mb-1 font-mono">
            <span className="text-[10px] font-bold uppercase tracking-wider">LESSONS</span>
            <BookOpenCheck className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{lessons.length}</div>
          <div className="text-[10px] text-rose-400 font-mono mt-1">Self-Fix Database</div>
        </div>

        {/* Active AI Model */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-zinc-200">
          <div className="flex items-center justify-between text-zinc-500 mb-1 font-mono">
            <span className="text-[10px] font-bold uppercase tracking-wider">ROUTER</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-sm font-bold text-white truncate font-mono">{activeModel.name.split(' ')[1] || 'Gemini'}</div>
          <div className="text-[10px] text-purple-400 font-mono mt-1">{activeModel.speed}</div>
        </div>

        {/* System Health & Env Secrets Audit */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-zinc-200">
          <div className="flex items-center justify-between text-zinc-500 mb-1 font-mono">
            <span className="text-[10px] font-bold uppercase tracking-wider">INGRESS</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xs font-bold text-emerald-400 font-mono">3000 : 0.0.0.0</div>
          <div className="text-[10px] text-zinc-500 font-mono mt-1">Cloud Run</div>
        </div>
      </div>

      {/* Environment Variables Audit & System Status */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-zinc-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
              System Status & Environment Secrets Audit
            </h3>
          </div>
          <button
            onClick={handleCheckEnv}
            disabled={checkingEnv}
            className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold px-3.5 py-1.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Activity className={`w-3.5 h-3.5 ${checkingEnv ? 'animate-spin' : ''}`} />
            {checkingEnv ? 'Checking Environment...' : 'Check Env Status'}
          </button>
        </div>

        {envSummary ? (
          <div className="mt-4 space-y-3 font-mono">
            <div className="flex flex-wrap items-center justify-between text-xs bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">Status Summary:</span>
                <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                  {envSummary.presentCount} PRESENT
                </span>
                <span className="px-2.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px] font-bold">
                  {envSummary.absentCount} ABSENT
                </span>
              </div>
              <span className="text-[10px] text-zinc-500">
                Last Checked: {new Date(envSummary.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {envSummary.results.map((item) => (
                <div
                  key={item.key}
                  className="bg-zinc-950/70 border border-zinc-800/60 p-2.5 rounded-xl flex items-center justify-between text-xs"
                >
                  <span className="text-zinc-300 truncate font-mono text-[11px]">{item.key}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.status === 'PRESENT'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-3 text-xs text-zinc-500 font-mono flex items-center justify-between">
            <span>Click &quot;Check Env Status&quot; to iterate through the 9 required environment variables and view their status.</span>
            <span className="text-[10px] text-zinc-600">9 Secrets Configured</span>
          </div>
        )}
      </div>

      {/* Core Architecture Overview Visualizer - Bento Grid */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-zinc-200">
        <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
              Core Architecture & Inheritance Pipeline
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase">Master Operating System</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-2 text-center text-xs font-mono">
          <div className="bg-zinc-950 border border-emerald-500/30 p-3 rounded-xl flex flex-col justify-center items-center">
            <span className="font-bold text-emerald-400 text-xs">CORE AGENT</span>
            <span className="text-[10px] text-zinc-500 mt-0.5">Central OS</span>
          </div>

          <div className="flex items-center justify-center text-zinc-600 font-bold hidden md:flex">&rarr;</div>

          <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl flex flex-col justify-center items-center">
            <span className="font-semibold text-zinc-200 text-xs">Memory Layers</span>
            <span className="text-[10px] text-zinc-500 mt-0.5">8 Adaptive Tiers</span>
          </div>

          <div className="flex items-center justify-center text-zinc-600 font-bold hidden md:flex">&rarr;</div>

          <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl flex flex-col justify-center items-center">
            <span className="font-semibold text-zinc-200 text-xs">Connector Hub</span>
            <span className="text-[10px] text-zinc-500 mt-0.5">OAuth & API Hub</span>
          </div>

          <div className="flex items-center justify-center text-zinc-600 font-bold hidden md:flex">&rarr;</div>

          <div className="bg-zinc-950 border border-cyan-500/30 p-3 rounded-xl flex flex-col justify-center items-center">
            <span className="font-bold text-cyan-400 text-xs">PROJECT LAYER</span>
            <span className="text-[10px] text-zinc-500 mt-0.5">Inherits + Overrides</span>
          </div>
        </div>
      </div>

      {/* Adaptive Behavior Preferences */}
      <AdaptiveBehaviorCard userProfile={userProfile} />

      {/* Quick Operational Commands Launcher */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-zinc-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
              Operational Command Macros
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">Telegram & Chat Shortcuts</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 font-mono">
          {[
            { label: "What's happening?", cmd: "What's happening?" },
            { label: "Run workflow", cmd: "Run the workflow." },
            { label: "Check leads", cmd: "Check the leads." },
            { label: "What failed?", cmd: "What failed?" },
            { label: "Deploy project", cmd: "Deploy this." },
            { label: "Research this", cmd: "Research this." },
            { label: "Fix error", cmd: "Fix the error." },
            { label: "Daily report", cmd: "Give me today's report." }
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => onRunQuickCommand(item.cmd)}
              className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 p-2.5 rounded-xl text-zinc-300 text-xs transition-all active:scale-95 flex flex-col justify-center items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] truncate w-full text-center">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* System Execution Logs Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-zinc-200">
        <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
              System Execution Logs & Observability
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">SECTION 18 STREAM</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-[10px] uppercase font-bold">
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Action</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Project Layer</th>
                <th className="py-2 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-950/50 transition-colors">
                  <td className="py-2.5 px-3 text-zinc-500 text-[11px]">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-zinc-200 font-sans">
                    {log.action}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      log.status === 'failed' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {log.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                    {log.project || 'Core Agent'}
                  </td>
                  <td className="py-2.5 px-3 text-zinc-400 font-sans truncate max-w-md">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
