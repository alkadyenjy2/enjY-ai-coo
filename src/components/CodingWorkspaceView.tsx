import React, { useState } from 'react';
import {
  Code,
  FileCode,
  Sparkles,
  GitCommit,
  CheckCircle2,
  Bug,
  Play,
  Terminal,
  FileText,
  Layout,
  Pencil,
  Copy,
  RefreshCw
} from 'lucide-react';
import { Project, AIModelOption } from '../types';

interface CodingWorkspaceViewProps {
  activeProject: Project;
  activeModel: AIModelOption;
}

export const CodingWorkspaceView: React.FC<CodingWorkspaceViewProps> = ({
  activeProject,
  activeModel,
}) => {
  const [activeTab, setActiveTab] = useState<'code' | 'creative'>('code');
  const [codePrompt, setCodePrompt] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [codeResult, setCodeResult] = useState<string>('');

  // Creative State
  const [assetType, setAssetType] = useState('marketing_asset');
  const [creativePrompt, setCreativePrompt] = useState('');
  const [creativeOutput, setCreativeOutput] = useState('');

  const handleRunCodeAgent = async () => {
    if (!codePrompt.trim() || isExecuting) return;

    setIsExecuting(true);
    try {
      const res = await fetch('/api/agent/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `[Coding Agent Task]: ${codePrompt}\nFollow 5-step protocol: Inspect -> Plan -> Implement -> Test -> Verify. Generate clean TypeScript/React code block.`,
          activeProject,
          model: activeModel.id
        })
      });
      const data = await res.json();
      setCodeResult(data.content || 'Code generation completed.');
    } catch (err) {
      setCodeResult('Code generation failed.');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleGenerateCreative = async () => {
    if (!creativePrompt.trim() || isExecuting) return;

    setIsExecuting(true);
    try {
      const res = await fetch('/api/agent/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `[Creative Hub Task - ${assetType}]: ${creativePrompt}\nProduce a polished creative asset (UI layout specification, marketing copy, or presentation content).`,
          activeProject,
          model: activeModel.id
        })
      });
      const data = await res.json();
      setCreativeOutput(data.content || 'Asset generation complete.');
    } catch (err) {
      setCreativeOutput('Asset generation failed.');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Header Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-zinc-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono">
            <Code className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              CODING & CREATIVE EXECUTION ENGINE
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              5-STEP PROTOCOL
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Software engineering pipeline (Inspect &rarr; Plan &rarr; Implement &rarr; Test &rarr; Verify) and Creative Orchestration (Websites, UI, Copy, Assets).
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs shrink-0 font-mono">
          <button
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'code' ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" /> Coding Engine
          </button>
          <button
            onClick={() => setActiveTab('creative')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'creative' ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Creative Hub
          </button>
        </div>
      </div>

      {activeTab === 'code' ? (
        /* CODING ENGINE VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Prompt & Control Panel */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-zinc-200 space-y-3 font-sans">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5 font-mono">
              <span className="text-xs font-bold uppercase text-zinc-300 flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-emerald-400" />
                Software Engineering Protocol
              </span>
              <span className="text-[10px] text-zinc-500">Inspect &rarr; Plan &rarr; Implement &rarr; Test</span>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-zinc-300">
                Code Task / Bug Fix / Refactor Request
              </label>
              <textarea
                rows={4}
                value={codePrompt}
                onChange={(e) => setCodePrompt(e.target.value)}
                placeholder="e.g., Implement an Express middleware for API rate-limiting with Redis fallback and TypeScript types..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              />
            </div>

            <div className="flex items-center justify-between pt-1 font-mono">
              <span className="text-[11px] text-zinc-500">
                Engine: <strong className="text-emerald-400 font-normal">{activeModel.name}</strong>
              </span>
              <button
                onClick={handleRunCodeAgent}
                disabled={!codePrompt.trim() || isExecuting}
                className="bg-zinc-100 hover:bg-white disabled:opacity-50 text-zinc-950 font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                {isExecuting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                Execute Coding Agent
              </button>
            </div>

            {/* Protocol checklist */}
            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-1.5 text-[11px] text-zinc-400 font-mono">
              <div className="font-bold text-zinc-300 mb-1">5-Step Engineering Verification:</div>
              <div className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> 1. Inspect existing repositories & files</div>
              <div className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> 2. Formulate minimal safe architectural plan</div>
              <div className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> 3. Implement surgical code changes</div>
              <div className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> 4. Run syntax check & linter</div>
              <div className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> 5. Record verified solution into Lessons Learned</div>
            </div>
          </div>

          {/* Generated Code Output */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-zinc-200 flex flex-col justify-between space-y-3 font-mono">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5 mb-3">
                <span className="text-xs font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4" /> Code Output & Diff
                </span>
                {codeResult && (
                  <button
                    onClick={() => navigator.clipboard.writeText(codeResult)}
                    className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy Output
                  </button>
                )}
              </div>

              {codeResult ? (
                <pre className="font-mono text-xs text-emerald-400 bg-zinc-900 p-3.5 rounded-xl border border-zinc-800 overflow-x-auto whitespace-pre-wrap max-h-[350px]">
                  {codeResult}
                </pre>
              ) : (
                <div className="py-20 text-center text-zinc-500 text-xs font-mono">
                  Enter a coding task prompt to run the 5-step software engineering loop.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* CREATIVE HUB VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-zinc-200 space-y-3 font-sans">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5 font-mono">
              <span className="text-xs font-bold uppercase text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Creative Orchestrator
              </span>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-zinc-300">Asset Type</label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600 font-mono"
              >
                <option value="marketing_asset">Marketing Asset Copy / Landing Section</option>
                <option value="ui_wireframe">UI Wireframe & Component Layout</option>
                <option value="presentation">Executive Presentation Outline</option>
                <option value="documentation">System Architecture Documentation</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-zinc-300">Creative Brief / Description</label>
              <textarea
                rows={4}
                value={creativePrompt}
                onChange={(e) => setCreativePrompt(e.target.value)}
                placeholder="Describe the desired creative output, brand style, target audience..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              />
            </div>

            <button
              onClick={handleGenerateCreative}
              disabled={!creativePrompt.trim() || isExecuting}
              className="w-full bg-zinc-100 hover:bg-white disabled:opacity-50 text-zinc-950 font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 font-mono"
            >
              {isExecuting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Orchestrate Creative Asset
            </button>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-zinc-200">
            <div className="border-b border-zinc-800 pb-2 mb-3 font-bold text-xs uppercase text-emerald-400 font-mono">
              Creative Result
            </div>
            {creativeOutput ? (
              <div className="text-xs text-zinc-200 bg-zinc-900 p-4 rounded-xl border border-zinc-800 whitespace-pre-wrap max-h-[350px] overflow-y-auto leading-relaxed">
                {creativeOutput}
              </div>
            ) : (
              <div className="py-20 text-center text-zinc-500 text-xs font-mono">
                Provide a creative brief to generate marketing assets, UI wireframes, or docs.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
