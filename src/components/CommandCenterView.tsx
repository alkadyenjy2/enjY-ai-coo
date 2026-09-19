import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Terminal,
  Bot,
  User,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Zap,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Route,
  CircleDot,
} from 'lucide-react';
import { ChatMessage, UserProfile, Project, AIModelOption, MemoryItem, CommandTemplate } from '../types';
import { ArchitectureMonitor } from './ArchitectureMonitor';
import { CommandTemplateLibrary } from './CommandTemplateLibrary';
import { summarizeJarvisRoute } from '../utils/jarvis-route';

interface CommandCenterViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  userProfile: UserProfile;
  activeProject: Project;
  activeModel: AIModelOption;
  memoryItems: MemoryItem[];
  commandTemplates: CommandTemplate[];
  onSaveTemplate: (template: Omit<CommandTemplate, 'id' | 'usageCount'>) => void;
  onUpdateTemplate: (template: CommandTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onTogglePinTemplate: (templateId: string) => void;
}

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({
  messages,
  onSendMessage,
  isLoading,
  userProfile,
  activeProject,
  activeModel,
  memoryItems,
  commandTemplates,
  onSaveTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onTogglePinTemplate,
}) => {
  const [inputText, setInputText] = useState('');
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});
  const [showRouteDetails, setShowRouteDetails] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const routeSummary = summarizeJarvisRoute(inputText);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const toggleThought = (id: string) => {
    setExpandedThoughts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const textToSend = inputText;
    setInputText('');
    await onSendMessage(textToSend);
  };

  const handleExecuteTemplate = async (prompt: string, templateId: string) => {
    const tmpl = commandTemplates.find(t => t.id === templateId);
    if (tmpl) {
      onUpdateTemplate({
        ...tmpl,
        usageCount: tmpl.usageCount + 1,
        lastUsedAt: new Date().toISOString(),
      });
    }
    await onSendMessage(prompt);
  };

  const quickCommands = [
    "What's happening?",
    "Run the workflow.",
    "Check the leads.",
    "What failed?",
    "Deploy this.",
    "Research this.",
    "Build this.",
    "Fix the error.",
    "Give me today's report."
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-[#0a1024] border border-white/10 rounded-2xl shadow-xl overflow-hidden text-zinc-200">
      <div className="bg-[#050816] px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0a1024] border border-zinc-700 flex items-center justify-center text-cyan-300">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-mono">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">JARVIS COMMAND CENTER</h2>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
                READY
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              Active Context: <strong className="text-zinc-200">{activeProject.name}</strong> &bull; Model: <strong className="text-amber-400">{activeModel.name}</strong>
            </p>
          </div>
        </div>

        <div className="text-right text-[11px] text-zinc-500 hidden sm:block font-mono">
          <div>Execution Loop:</div>
          <div className="text-cyan-300 text-[10px]">Understand &rarr; Route &rarr; Execute &rarr; Verify &rarr; Report</div>
        </div>
      </div>

      <div className="border-b border-white/10 bg-[#050816]/80 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-300">
              <Route className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider">
                <span className="text-zinc-500">AI Route</span>
                <span className="text-cyan-300 font-bold">{isLoading ? 'EXECUTING' : routeSummary.status}</span>
              </div>
              <div className="text-xs text-white font-semibold truncate">{routeSummary.primary}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowRouteDetails(prev => !prev)}
            className="shrink-0 px-2.5 py-1.5 rounded-lg border border-white/10 bg-[#0a1024] hover:bg-zinc-800 text-[10px] font-mono text-zinc-300 transition-colors"
          >
            {showRouteDetails ? 'Hide route' : 'Advanced route'}
          </button>
        </div>

        {showRouteDetails && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-mono">
            <div className="rounded-lg border border-white/10 bg-[#0a1024] p-2.5">
              <div className="text-zinc-500 uppercase tracking-wider">Policy</div>
              <div className="mt-1 text-cyan-300 font-bold">POLICY GOVERNED</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0a1024] p-2.5">
              <div className="text-zinc-500 uppercase tracking-wider">Fallbacks</div>
              <div className="mt-1 text-zinc-200">{routeSummary.fallbacks.length} verified routes</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0a1024] p-2.5">
              <div className="text-zinc-500 uppercase tracking-wider">Guardrail</div>
              <div className="mt-1 text-zinc-200 flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-cyan-300" /> Approval required</div>
            </div>
            <div className="sm:col-span-3 rounded-lg border border-white/10 bg-[#050816] p-2.5">
              <div className="text-zinc-500 uppercase tracking-wider mb-1">Fallback chain</div>
              <div className="flex flex-wrap gap-1.5">
                {routeSummary.fallbacks.map((name) => (
                  <span key={name} className="px-2 py-1 rounded-md bg-[#0a1024] border border-white/10 text-zinc-300 flex items-center gap-1.5">
                    <CircleDot className="w-2.5 h-2.5 text-zinc-500" /> {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <CommandTemplateLibrary
        templates={commandTemplates}
        onExecuteTemplate={handleExecuteTemplate}
        onSaveTemplate={onSaveTemplate}
        onUpdateTemplate={onUpdateTemplate}
        onDeleteTemplate={onDeleteTemplate}
        onTogglePin={onTogglePinTemplate}
        isLoading={isLoading}
      />

      <div className="bg-[#050816] px-4 py-2 border-b border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-mono">
        <span className="text-[10px] uppercase font-bold text-zinc-500 shrink-0 mr-1 flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" /> Macros:
        </span>
        {quickCommands.map((cmd, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(cmd)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-lg bg-[#0a1024] hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white text-[11px] font-mono whitespace-nowrap transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {cmd}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <ArchitectureMonitor activeModel={activeModel} />

        {messages.map((msg) => {
          const isAgent = msg.sender === 'agent';
          const isThoughtExpanded = expandedThoughts[msg.id];

          return (
            <div key={msg.id} className={`flex gap-3 ${isAgent ? 'items-start' : 'items-start flex-row-reverse'}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold font-mono ${isAgent ? 'bg-zinc-100 text-zinc-950 border border-white' : 'bg-zinc-800 text-zinc-200 border border-zinc-700'}`}>
                {isAgent ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div className={`max-w-2xl space-y-2 ${isAgent ? 'text-left' : 'text-right'}`}>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                  <span className="font-semibold text-zinc-300">{isAgent ? 'CORE AI OS AGENT' : userProfile.name}</span>
                  <span>&bull;</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>

                <div className={`p-3.5 rounded-2xl text-xs leading-relaxed font-sans ${isAgent ? 'bg-[#050816] border border-white/10 text-zinc-100' : 'bg-zinc-100 text-zinc-950 font-medium'}`}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {msg.actionsTaken && msg.actionsTaken.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap gap-1.5">
                      {msg.actionsTaken.map((act, i) => (
                        <span key={i} className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#0a1024] text-cyan-300 border border-cyan-400/30 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5 text-cyan-300" />
                          {act.tool}: {act.details}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {isAgent && msg.thoughtProcess && (
                  <div className="bg-[#050816] border border-white/10 rounded-xl overflow-hidden text-[11px] font-mono">
                    <button onClick={() => toggleThought(msg.id)} className="w-full px-3 py-2 flex items-center justify-between text-zinc-400 hover:text-zinc-200 hover:bg-[#0a1024] transition-colors">
                      <span className="font-semibold flex items-center gap-1.5 text-cyan-300"><Sparkles className="w-3.5 h-3.5" /> Execution Reasoning Loop (6 Steps)</span>
                      {isThoughtExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>

                    {isThoughtExpanded && (
                      <div className="p-3 border-t border-white/10 space-y-2 font-mono text-[10px] text-zinc-300 bg-[#050816]">
                        {msg.thoughtProcess.understand && <div className="flex gap-2"><span className="text-cyan-300 font-bold shrink-0">1. UNDERSTAND:</span><span>{msg.thoughtProcess.understand}</span></div>}
                        {msg.thoughtProcess.inspect && <div className="flex gap-2"><span className="text-cyan-400 font-bold shrink-0">2. INSPECT:</span><span>{msg.thoughtProcess.inspect}</span></div>}
                        {msg.thoughtProcess.decide && <div className="flex gap-2"><span className="text-amber-400 font-bold shrink-0">3. DECIDE:</span><span>{msg.thoughtProcess.decide}</span></div>}
                        {msg.thoughtProcess.execute && <div className="flex gap-2"><span className="text-cyan-300 font-bold shrink-0">4. EXECUTE:</span><span>{msg.thoughtProcess.execute}</span></div>}
                        {msg.thoughtProcess.verify && <div className="flex gap-2"><span className="text-purple-400 font-bold shrink-0">5. VERIFY:</span><span>{msg.thoughtProcess.verify}</span></div>}
                        {msg.thoughtProcess.report && <div className="flex gap-2"><span className="text-rose-400 font-bold shrink-0">6. REPORT:</span><span>{msg.thoughtProcess.report}</span></div>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3 text-xs text-cyan-300 font-mono">
            <div className="w-8 h-8 rounded-xl bg-[#0a1024] border border-white/10 flex items-center justify-center animate-spin"><RefreshCw className="w-4 h-4 text-cyan-300" /></div>
            <div className="bg-[#050816] border border-white/10 px-3.5 py-2 rounded-xl flex items-center gap-2 text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-cyan-300 animate-ping"></span>
              Core Agent executing: Understand &rarr; Route &rarr; Execute &rarr; Verify...
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 bg-[#050816] border-t border-white/10 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="What do you want JARVIS to do?"
          disabled={isLoading}
          className="flex-1 bg-[#0a1024] border border-white/10 focus:border-zinc-600 rounded-xl px-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors font-sans"
        />
        <button type="submit" disabled={!inputText.trim() || isLoading} className="bg-zinc-100 hover:bg-white disabled:opacity-50 text-zinc-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-sm font-mono">
          <Send className="w-3.5 h-3.5" />
          <span>Execute</span>
        </button>
      </form>
    </div>
  );
};
