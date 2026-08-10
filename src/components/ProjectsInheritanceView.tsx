import React, { useState } from 'react';
import {
  Layers,
  Plus,
  CheckCircle2,
  Brain,
  Plug,
  Workflow,
  ShieldCheck,
  Zap,
  FolderPlus,
  ArrowRight,
  X
} from 'lucide-react';
import { Project } from '../types';

interface ProjectsInheritanceViewProps {
  projects: Project[];
  activeProject: Project;
  onSelectProject: (project: Project) => void;
  onAddProject: (project: Project) => void;
}

export const ProjectsInheritanceView: React.FC<ProjectsInheritanceViewProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onAddProject,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [targetUsers, setTargetUsers] = useState('');
  const [tools, setTools] = useState('GitHub, Supabase, n8n');
  const [rules, setRules] = useState('Inherit Core Memory; Verify deployments');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProj: Project = {
      id: `proj-${Date.now()}`,
      name,
      objective: objective || 'Automate specialized workflow',
      targetUsers: targetUsers || 'Operations Team',
      status: 'active',
      inheritedCoreCapabilities: [
        'Multi-Layer Memory System',
        'User Behavioral Profile',
        'n8n Automation Engine',
        'Universal Connector Hub',
        'Self-Improvement Registry',
        'Software Engineering Protocol'
      ],
      projectWorkflows: [],
      projectTools: tools.split(',').map(s => s.trim()),
      projectRules: rules.split(';').map(s => s.trim()),
      createdAt: new Date().toISOString(),
      kpis: { tasksCompleted: 0, automationsActive: 0, lessonsRecorded: 0 }
    };

    onAddProject(newProj);
    setName('');
    setObjective('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Header Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-zinc-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              PROJECT INHERITANCE & LAYER MANAGEMENT
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              BUILD ONCE, REUSE
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Build core once, reuse everywhere. Every project inherits Core Memory, User Profile, Connector Ecosystem, and n8n Engine automatically.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm shrink-0 font-mono active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Project Layer
        </button>
      </div>

      {/* Inheritance Architecture Diagram Card */}
      <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl text-zinc-200 font-sans">
        <div className="text-xs font-bold uppercase text-zinc-400 mb-2 font-mono">
          Inheritance Protocol Breakdown
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-1.5">
            <div className="font-bold text-emerald-400 uppercase text-[11px] flex items-center gap-1.5 font-mono">
              <Brain className="w-3.5 h-3.5 text-emerald-400" /> Inherited Core Layer (Shared Across All Projects)
            </div>
            <ul className="text-[11px] text-zinc-300 space-y-1 list-disc list-inside leading-relaxed">
              <li>Multi-Layer Memory System (User, Technical, Episodic)</li>
              <li>Adaptive User Behavioral Profile & Learning</li>
              <li>Universal Connector Ecosystem (GitHub, Gemini, Supabase)</li>
              <li>n8n Workflow Studio & Self-Improvement Registry</li>
            </ul>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-1.5">
            <div className="font-bold text-amber-400 uppercase text-[11px] flex items-center gap-1.5 font-mono">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Added Project-Specific Layer Only
            </div>
            <ul className="text-[11px] text-zinc-300 space-y-1 list-disc list-inside leading-relaxed">
              <li>Project Name, Objectives, Target Users</li>
              <li>Project-specific workflows & custom APIs</li>
              <li>Project constraints, budget, and rules</li>
              <li>Project success criteria & specific KPI metrics</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Projects List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {projects.map((proj) => {
          const isSelected = proj.id === activeProject.id;
          return (
            <div
              key={proj.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                isSelected
                  ? 'bg-zinc-900 border-zinc-700 ring-1 ring-zinc-700 shadow-xl'
                  : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-xs text-white font-sans">{proj.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                    isSelected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-950 text-zinc-500 border border-zinc-800'
                  }`}>
                    {isSelected ? 'Active Context' : proj.status}
                  </span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed mb-3 font-sans">{proj.objective}</p>

                {/* Inherited Capabilities List */}
                <div className="space-y-1 mb-3 font-mono">
                  <div className="text-[10px] font-bold uppercase text-zinc-500">Inherited Core Capabilities:</div>
                  <div className="flex flex-wrap gap-1">
                    {proj.inheritedCoreCapabilities.map((cap, i) => (
                      <span key={i} className="bg-zinc-950 text-emerald-400 border border-zinc-800 px-1.5 py-0.5 rounded text-[9px]">
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Project Specific Rules */}
                <div className="space-y-1 font-mono">
                  <div className="text-[10px] font-bold uppercase text-zinc-500">Project Specific Rules:</div>
                  <div className="flex flex-wrap gap-1">
                    {proj.projectRules.map((rule, i) => (
                      <span key={i} className="bg-zinc-950 text-amber-400 border border-zinc-800 px-1.5 py-0.5 rounded text-[9px]">
                        {rule}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between font-mono">
                <span className="text-[10px] text-zinc-500">KPI: {proj.kpis.tasksCompleted} Tasks</span>
                {!isSelected && (
                  <button
                    onClick={() => onSelectProject(proj)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                  >
                    Switch Context <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Project Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl p-5 text-zinc-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 font-mono">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-emerald-400" />
                Create New Project Layer (Inherits Core OS)
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., E-Commerce Growth Operations"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Project Objective</label>
                <textarea
                  rows={2}
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="What is being built and desired outcome..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Project Specific Tools</label>
                <input
                  type="text"
                  value={tools}
                  onChange={(e) => setTools(e.target.value)}
                  placeholder="GitHub, Supabase, n8n"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Project Rules (Semicolon separated)</label>
                <input
                  type="text"
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  placeholder="Require code linting; Log verified fixes"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 font-mono">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold shadow-sm"
                >
                  Create Project Layer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
