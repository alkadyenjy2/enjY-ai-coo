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
    <header className="jarvis-glass border-b text-zinc-300 px-4 py-3 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Identity - Bento Grid Style */}
        <div className="flex items-center gap-3">
          <div className="jarvis-pulse relative flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-300/30 bg-emerald-300/10 shrink-0">
            <div className="h-3 w-3 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(88,240,189,0.95)]"></div>
            <div className="absolute inset-1 rounded-xl border border-emerald-300/10"></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base md:text-lg tracking-[0.18em] text-white font-sans">
                JARVIS <span className="text-emerald-300/80 font-mono text-[10px] ml-1.5 font-normal tracking-wider">AI OPERATIONS</span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Evidence-first command layer <span className="text-slate-600">•</span> Adaptive memory <span className="text-slate-600">•</span> n8n orchestration
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
