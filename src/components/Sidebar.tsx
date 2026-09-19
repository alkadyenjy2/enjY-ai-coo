import React from 'react';
import {
  LayoutDashboard,
  Terminal,
  Brain,
  Plug,
  Workflow,
  Code,
  Layers,
  BookOpenCheck,
  Zap,
  Activity,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';

export type NavView =
  | 'dashboard'
  | 'chat'
  | 'memory'
  | 'connectors'
  | 'workflows'
  | 'coding'
  | 'projects'
  | 'lessons';

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  memoryCount: number;
  connectorsCount: number;
  workflowsCount: number;
  lessonsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  memoryCount,
  connectorsCount,
  workflowsCount,
  lessonsCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavView,
      label: 'Operations HQ',
      icon: LayoutDashboard,
      badge: null,
      description: 'Central Overview & KPIs'
    },
    {
      id: 'chat' as NavView,
      label: 'Command Center',
      icon: Terminal,
      badge: 'Live',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      description: 'Verified command execution'
    },
    {
      id: 'memory' as NavView,
      label: 'Memory Bank',
      icon: Brain,
      badge: memoryCount,
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      description: '8 Memory Layers'
    },
    {
      id: 'connectors' as NavView,
      label: 'Plugins & Connectors',
      icon: Plug,
      badge: connectorsCount,
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
      description: 'OAuth & API Ecosystem'
    },
    {
      id: 'workflows' as NavView,
      label: 'Workflow Studio',
      icon: Workflow,
      badge: workflowsCount,
      badgeColor: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      description: 'Automations & Orchestration'
    },
    {
      id: 'coding' as NavView,
      label: 'Coding & Creative',
      icon: Code,
      badge: 'Studio',
      badgeColor: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
      description: 'Software Engineering Engine'
    },
    {
      id: 'projects' as NavView,
      label: 'Projects Inheritance',
      icon: Layers,
      badge: null,
      description: 'Core vs Project Layer'
    },
    {
      id: 'lessons' as NavView,
      label: 'Lessons Learned',
      icon: BookOpenCheck,
      badge: lessonsCount,
      badgeColor: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      description: 'Self-Improvement Registry'
    },
  ];

  return (
    <aside className="w-full md:w-64 bg-zinc-950 border-r border-zinc-800 text-zinc-300 flex flex-col justify-between p-3 shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">
          Core AI OS Architecture
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-zinc-800/90 text-white border border-zinc-700 shadow-sm'
                  : 'hover:bg-zinc-900/80 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <div className="text-left truncate">
                  <div className="truncate font-medium">{item.label}</div>
                  <div className={`text-[10px] truncate ${isActive ? 'text-zinc-300 font-mono' : 'text-zinc-500'}`}>
                    {item.description}
                  </div>
                </div>
              </div>
              {item.badge !== null && (
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                    isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* System Status Summary Widget */}
      <div className="mt-4 p-3 bg-gradient-to-br from-violet-500/10 to-cyan-400/5 border border-white/10 rounded-2xl space-y-2 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-zinc-300 font-semibold text-[11px]">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          RUNTIME STATE
        </div>
        <p className="text-[10px] leading-relaxed text-zinc-500">Live operational status is loaded from the backend. No demo health values are shown.</p>
      </div>
    </aside>
  );
};
