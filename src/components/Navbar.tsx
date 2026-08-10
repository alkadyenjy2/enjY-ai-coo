import React from 'react';
import { 
  Sparkles, 
  Cpu, 
  Layers, 
  HelpCircle, 
  Terminal,
} from 'lucide-react';
import { AIModelOption, Project } from '../types';

interface NavbarProps {
  activeModel: AIModelOption;
  models: AIModelOption[];
  onSelectModel: (model: AIModelOption) => void;
  activeProject: Project;
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onOpenOnboarding: () => void;
  onOpenCommandCenter: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeModel,
  models,
  onSelectModel,
  activeProject,
  projects,
  onSelectProject,
  onOpenOnboarding,
  onOpenCommandCenter,
}) => {
  return (
    <header className="bg-zinc-950 border-b border-zinc-800 text-zinc-300 px-4 py-3 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Identity - Bento Grid Style */}
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] shrink-0"></div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base md:text-lg tracking-tight text-white font-sans">
                CORE AGENT <span className="text-zinc-500 font-mono text-xs ml-1.5 font-normal">v4.0.2-STABLE</span>
              </h1>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              Reusable Operations OS &bull; Adaptive Memory &bull; n8n Orchestrator
            </p>
          </div>
        </div>

        {/* Controls Header - Bento Grid Monospace Specs */}
        <div className="flex items-center flex-wrap gap-2 md:gap-3 w-full md:w-auto justify-end text-xs">
          {/* Active Layer / Project Selector */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 font-mono">
            <Layers className="w-3.5 h-3.5 text-cyan-400 mr-2" />
            <span className="text-zinc-500 mr-1.5 uppercase tracking-wider text-[10px] hidden sm:inline">Active Layer:</span>
            <select
              value={activeProject.id}
              onChange={(e) => {
                const found = projects.find(p => p.id === e.target.value);
                if (found) onSelectProject(found);
              }}
              className="bg-transparent text-cyan-400 font-semibold focus:outline-none cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-zinc-900 text-zinc-200 font-sans">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* AI Model Router Selector */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 mr-2" />
            <span className="text-zinc-500 mr-1.5 uppercase tracking-wider text-[10px] hidden sm:inline">Model Router:</span>
            <select
              value={activeModel.id}
              onChange={(e) => {
                const found = models.find(m => m.id === e.target.value);
                if (found) onSelectModel(found);
              }}
              className="bg-transparent text-amber-400 font-semibold focus:outline-none cursor-pointer"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id} className="bg-zinc-900 text-zinc-200 font-sans">
                  {m.name} [{m.speed}]
                </option>
              ))}
            </select>
          </div>

          {/* Quick Action: Command Center */}
          <button
            onClick={onOpenCommandCenter}
            className="flex items-center gap-1.5 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95 shadow-sm"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Command Center</span>
          </button>

          {/* Quick Action: Onboarding Discovery Quiz */}
          <button
            onClick={onOpenOnboarding}
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium px-3 py-1.5 rounded-lg border border-zinc-700 transition-all active:scale-95"
            title="Start Project Discovery Quiz"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Discovery Quiz</span>
          </button>
        </div>
      </div>
    </header>
  );
};

