import React, { useState } from 'react';
import {
  Workflow as WorkflowIcon,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Zap,
  ArrowRight,
  Sparkles,
  Database,
  Globe,
  Terminal,
  RefreshCw,
  X
} from 'lucide-react';
import { Workflow, WorkflowNode } from '../types';

interface WorkflowStudioViewProps {
  workflows: Workflow[];
  onRunWorkflow: (id: string) => void;
  onAddWorkflow: (workflow: Workflow) => void;
  onToggleActive: (id: string) => void;
}

export const WorkflowStudioView: React.FC<WorkflowStudioViewProps> = ({
  workflows,
  onRunWorkflow,
  onAddWorkflow,
  onToggleActive,
}) => {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(workflows[0]?.id || '');
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);

  const selectedWf = workflows.find(w => w.id === selectedWorkflowId) || workflows[0];

  // This UI catalog is not connected to an authenticated n8n execution endpoint.
  // Never simulate node progress, increment run counters, or report success without a
  // real execution receipt. Open the owner's actual n8n Agent as the current handoff.
  const handleExecute = () => {
    if (!selectedWf) return;
    setExecutionLogs([
      `[BLOCKED] "${selectedWf.name}" is a local catalog entry, not a live n8n workflow binding.`,
      '[NOT EXECUTED] No workflow nodes ran, no run counter changed, and no success is claimed.',
      'Reason: this Vercel app has no configured authenticated n8n Agent/API bridge.',
      'Next step: open the canonical JARVIS Agent in n8n and continue there.'
    ]);
  };

  // Keep callback compatibility with the parent until a real authenticated adapter is configured.
  void onRunWorkflow;
  void onToggleActive;
  void onAddWorkflow;

  const getNodeIcon = (type: WorkflowNode['type']) => {
    switch (type) {
      case 'trigger': return Zap;
      case 'ai_agent': return Sparkles;
      case 'connector': return Globe;
      case 'condition': return WorkflowIcon;
      case 'code': return Terminal;
      case 'error_handler': return AlertTriangle;
      default: return WorkflowIcon;
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Header Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-zinc-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono">
            <WorkflowIcon className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              N8N AUTOMATION ENGINE & WORKFLOW STUDIO
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
              LIVE API NOT CONNECTED
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Workflow entries below are a local catalog. Live execution requires an authenticated n8n bridge; the UI will not simulate successful runs.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0 font-mono">
          <a
            href="https://zeoutsourse.app.n8n.cloud/assistant/d3e4813d-7342-4a62-8a54-8ae705734554"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
          >
            <Globe className="w-3.5 h-3.5" /> Open JARVIS Agent in n8n <ArrowRight className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={handleExecute}
            disabled={!selectedWf}
            className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 text-xs font-bold px-4 py-2 rounded-xl transition-all border border-zinc-700"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-300" /> Check live execution
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Workflows Sidebar List */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between px-2 py-1 text-zinc-500 font-bold uppercase text-[10px] border-b border-zinc-800 pb-2">
            <span>Local Workflow Catalog ({workflows.length})</span>
            <span className="text-rose-300">Not Live</span>
          </div>

          {workflows.map((wf) => (
            <div
              key={wf.id}
              onClick={() => setSelectedWorkflowId(wf.id)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                selectedWf?.id === wf.id
                  ? 'bg-zinc-800 border-zinc-700 text-white font-semibold'
                  : 'bg-zinc-950 border-zinc-800/80 text-zinc-400 hover:bg-zinc-800/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs truncate font-sans">{wf.name}</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-zinc-800 text-zinc-300">
                  {wf.active ? 'REGISTERED' : 'UNVERIFIED'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 line-clamp-2 font-sans">{wf.description}</p>
              <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500">
                <span>{wf.nodes.length} Catalog Steps</span>
                <span>Live runs: NOT VERIFIED</span>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Workflow Node Builder / Visualizer */}
        {selectedWf && (
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-zinc-200">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
                <div>
                  <h3 className="font-bold text-sm text-white font-sans">{selectedWf.name}</h3>
                  <p className="text-xs text-zinc-400 font-sans mt-0.5">{selectedWf.description}</p>
                </div>

                <div className="flex items-center gap-2 font-mono">
                  <span className="px-3 py-1 rounded-xl text-xs font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                    Live activation state: NOT VERIFIED
                  </span>
                </div>
              </div>

              {/* Node Sequence Diagram */}
              <div className="space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2 font-mono">
                  Catalog step list — NOT EXECUTED ({selectedWf.nodes.length} Steps)
                </div>

                <div className="space-y-2">
                  {selectedWf.nodes.map((node, index) => {
                    const NodeIcon = getNodeIcon(node.type);
                    return (
                      <React.Fragment key={node.id}>
                        <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400 font-bold shrink-0 font-mono">
                              <NodeIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-white flex items-center gap-2 font-sans">
                                <span>Step {index + 1}: {node.label}</span>
                                <span className="px-1.5 py-0.2 rounded text-[9px] uppercase bg-zinc-900 text-zinc-400 border border-zinc-800 font-mono">
                                  {node.type}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-400 font-sans">{node.description}</p>
                            </div>
                          </div>

                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
                            NOT VERIFIED
                          </span>
                        </div>

                        {index < selectedWf.nodes.length - 1 && (
                          <div className="flex justify-center text-zinc-600">
                            <ArrowRight className="w-4 h-4 rotate-90" />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Execution Log Terminal */}
            {executionLogs.length > 0 && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 font-mono text-[11px] text-zinc-300 space-y-1">
                <div className="text-amber-300 font-bold uppercase text-[10px] mb-1 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" /> Execution status / connection check
                </div>
                {executionLogs.map((log, i) => (
                  <div key={i} className="text-zinc-300">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
