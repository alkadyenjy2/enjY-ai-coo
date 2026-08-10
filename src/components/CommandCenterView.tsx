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
  Clock,
  Layers,
  Brain,
  AlertCircle,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { ChatMessage, UserProfile, Project, AIModelOption, MemoryItem } from '../types';
import { ArchitectureMonitor } from './ArchitectureMonitor';

interface CommandCenterViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  userProfile: UserProfile;
  activeProject: Project;
  activeModel: AIModelOption;
  memoryItems: MemoryItem[];
}

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({
  messages,
  onSendMessage,
  isLoading,
  userProfile,
  activeProject,
  activeModel,
  memoryItems,
}) => {
  const [inputText, setInputText] = useState('');
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);

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
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden text-zinc-200">
      {/* Header */}
      <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-emerald-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-mono">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                OPERATIONAL COMMAND CENTER (TELEGRAM PROTOCOL)
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                CONNECTED
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              Active Context: <strong className="text-zinc-200">{activeProject.name}</strong> &bull; Model: <strong className="text-amber-400">{activeModel.name}</strong>
            </p>
          </div>
        </div>

        <div className="text-right text-[11px] text-zinc-500 hidden sm:block font-mono">
          <div>Execution Loop:</div>
          <div className="text-emerald-400 text-[10px]">Understand &rarr; Inspect &rarr; Decide &rarr; Execute &rarr; Verify &rarr; Report</div>
        </div>
      </div>

      {/* Quick Command Pills */}
      <div className="bg-zinc-950 px-4 py-2 border-b border-zinc-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-mono">
        <span className="text-[10px] uppercase font-bold text-zinc-500 shrink-0 mr-1 flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" /> Macros:
        </span>
        {quickCommands.map((cmd, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(cmd)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-[11px] font-mono whitespace-nowrap transition-all active:scale-95 disabled:opacity-50"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Architecture v1.0 Monitor */}
        <ArchitectureMonitor activeModel={activeModel} />

        {messages.map((msg) => {
          const isAgent = msg.sender === 'agent';
          const isThoughtExpanded = expandedThoughts[msg.id];

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isAgent ? 'items-start' : 'items-start flex-row-reverse'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold font-mono ${
                  isAgent
                    ? 'bg-zinc-100 text-zinc-950 border border-white'
                    : 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                }`}
              >
                {isAgent ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div className={`max-w-2xl space-y-2 ${isAgent ? 'text-left' : 'text-right'}`}>
                {/* Sender Title */}
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                  <span className="font-semibold text-zinc-300">
                    {isAgent ? 'CORE AI OS AGENT' : userProfile.name}
                  </span>
                  <span>&bull;</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>

                {/* Message Box */}
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed font-sans ${
                    isAgent
                      ? 'bg-zinc-950 border border-zinc-800 text-zinc-100'
                      : 'bg-zinc-100 text-zinc-950 font-medium'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Actions Taken Badge List */}
                  {msg.actionsTaken && msg.actionsTaken.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-zinc-800 flex flex-wrap gap-1.5">
                      {msg.actionsTaken.map((act, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-900 text-emerald-400 border border-emerald-500/30 flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                          {act.tool}: {act.details}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Agent Thought Process Collapsible */}
                {isAgent && msg.thoughtProcess && (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden text-[11px] font-mono">
                    <button
                      onClick={() => toggleThought(msg.id)}
                      className="w-full px-3 py-2 flex items-center justify-between text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
                    >
                      <span className="font-semibold flex items-center gap-1.5 text-emerald-400">
                        <Sparkles className="w-3.5 h-3.5" />
                        Execution Reasoning Loop (6 Steps)
                      </span>
                      {isThoughtExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {isThoughtExpanded && (
                      <div className="p-3 border-t border-zinc-800 space-y-2 font-mono text-[10px] text-zinc-300 bg-zinc-950">
                        {msg.thoughtProcess.understand && (
                          <div className="flex gap-2">
                            <span className="text-emerald-400 font-bold shrink-0">1. UNDERSTAND:</span>
                            <span className="text-zinc-300">{msg.thoughtProcess.understand}</span>
                          </div>
                        )}
                        {msg.thoughtProcess.inspect && (
                          <div className="flex gap-2">
                            <span className="text-cyan-400 font-bold shrink-0">2. INSPECT:</span>
                            <span className="text-zinc-300">{msg.thoughtProcess.inspect}</span>
                          </div>
                        )}
                        {msg.thoughtProcess.decide && (
                          <div className="flex gap-2">
                            <span className="text-amber-400 font-bold shrink-0">3. DECIDE:</span>
                            <span className="text-zinc-300">{msg.thoughtProcess.decide}</span>
                          </div>
                        )}
                        {msg.thoughtProcess.execute && (
                          <div className="flex gap-2">
                            <span className="text-emerald-400 font-bold shrink-0">4. EXECUTE:</span>
                            <span className="text-zinc-300">{msg.thoughtProcess.execute}</span>
                          </div>
                        )}
                        {msg.thoughtProcess.verify && (
                          <div className="flex gap-2">
                            <span className="text-purple-400 font-bold shrink-0">5. VERIFY:</span>
                            <span className="text-zinc-300">{msg.thoughtProcess.verify}</span>
                          </div>
                        )}
                        {msg.thoughtProcess.report && (
                          <div className="flex gap-2">
                            <span className="text-rose-400 font-bold shrink-0">6. REPORT:</span>
                            <span className="text-zinc-300">{msg.thoughtProcess.report}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-3 text-xs text-emerald-400 font-mono">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center animate-spin">
              <RefreshCw className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="bg-zinc-950 border border-zinc-800 px-3.5 py-2 rounded-xl flex items-center gap-2 text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Core Agent executing: Understand &rarr; Inspect &rarr; Decide &rarr; Execute &rarr; Verify...
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Send operational command (e.g., 'What's happening?', 'Run the workflow', 'Check the leads')..."
          disabled={isLoading}
          className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-xl px-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors font-sans"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="bg-zinc-100 hover:bg-white disabled:opacity-50 text-zinc-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-sm font-mono"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Execute</span>
        </button>
      </form>
    </div>
  );
};
