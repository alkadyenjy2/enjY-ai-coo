import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, NavView } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { CommandCenterView } from './components/CommandCenterView';
import { MemoryBankView } from './components/MemoryBankView';
import { ConnectorsView } from './components/ConnectorsView';
import { WorkflowStudioView } from './components/WorkflowStudioView';
import { CodingWorkspaceView } from './components/CodingWorkspaceView';
import { ProjectsInheritanceView } from './components/ProjectsInheritanceView';
import { LessonsLearnedView } from './components/LessonsLearnedView';
import { initialAIModels } from './data/mockInitialData';
import { UserProfile, MemoryItem, Connector, Workflow, Project, LessonLearned, AIModelOption, ExecutionLog, ChatMessage, CommandTemplate } from './types';
import { mapOperationalRecordsToExecutionLogs } from './utils/operationalLogs';
import { apiFetch } from './auth/client';

export default function App() {
  const [currentView, setCurrentView] = useState<NavView>('chat');
  const [userProfile, setUserProfile] = useState<UserProfile>({ name: 'Operator', communicationPreference: 'concise', technicalLevel: 'advanced', autonomyLevel: 'approval_required', decisionStyle: 'execute_first', executionSpeed: 'fast', dislikedTools: [], preferredTools: [], dislikedUIPatterns: [], repeatedApprovals: [], workingPatterns: [] });
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>([]);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project>({ id: 'workspace', name: 'No active project', objective: 'Select or create a project to establish operational context.', targetUsers: 'Workspace owner', status: 'planning', inheritedCoreCapabilities: [], projectWorkflows: [], projectTools: [], projectRules: [], createdAt: new Date(0).toISOString(), kpis: { tasksCompleted: 0, automationsActive: 0, lessonsRecorded: 0 } });
  const [lessons, setLessons] = useState<LessonLearned[]>([]);
  const [models] = useState<AIModelOption[]>(initialAIModels.filter((model) => model.id === 'gpt-6-astra'));
  const [activeModel, setActiveModel] = useState<AIModelOption>(initialAIModels.find((model) => model.id === 'gpt-6-astra') ?? initialAIModels[0]);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [commandTemplates, setCommandTemplates] = useState<CommandTemplate[]>([]);
  const [isAgentLoading, setIsAgentLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadOperationalHistory = async () => {
      try {
        const response = await fetch('/api/agent/history?limit=50');
        if (!response.ok) throw new Error(`Operational history request failed with HTTP ${response.status}.`);
        const data = await response.json();
        if (!cancelled) setLogs(mapOperationalRecordsToExecutionLogs(Array.isArray(data.records) ? data.records : []));
      } catch (error) {
        console.error('Operational history load failed:', error);
        if (!cancelled) setLogs([]);
      }
    };
    void loadOperationalHistory();
    return () => { cancelled = true; };
  }, []);

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = { id: `msg-${Date.now()}`, sender: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setIsAgentLoading(true);
    try {
      const response = await apiFetch('/api/agent/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, userProfile, activeProject, memoryContext: memoryItems.slice(0, 5), model: activeModel.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof data?.error === 'string' ? data.error : `Agent command failed with HTTP ${response.status}.`);
      }

      const executionRecord = data.executionRecord;
      const stateHistory = Array.isArray(executionRecord?.state_history) ? executionRecord.state_history : [];
      const hasExecutedState = stateHistory.includes('EXECUTED');
      const hasEvidence = typeof executionRecord?.evidence === 'string' && executionRecord.evidence.trim().length > 0;
      const verificationStatus = executionRecord?.verificationStatus;
      const hasValidVerification = verificationStatus === 'VERIFIED' || verificationStatus === 'NOT_REQUIRED';
      const hasErrors = Array.isArray(executionRecord?.errors) && executionRecord.errors.length > 0;
      const executionVerified = hasExecutedState && hasEvidence && hasValidVerification && !hasErrors;

      if (!executionVerified) {
        throw new Error('JARVIS command completed without sufficient execution evidence. Verification is pending.');
      }

      const agentMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'agent',
        content: data.content || 'Command completed with recorded execution evidence.',
        timestamp: new Date().toISOString(),
        thoughtProcess: data.thoughtProcess,
        actionsTaken: data.actionsTaken
      };
      setMessages(prev => [...prev, agentMsg]);
      if (executionRecord) setLogs(prev => [...mapOperationalRecordsToExecutionLogs([executionRecord]), ...prev.filter(log => log.id !== executionRecord.id)]);
    } catch (err) {
      console.error('Agent execution error:', err);
      setMessages(prev => [...prev, { id: `msg-${Date.now() + 1}`, sender: 'agent', content: 'Diagnosed failure in agent pipeline. Executing error protocol (Diagnose -> Verify -> Fix -> Test -> Record Lesson).', timestamp: new Date().toISOString() }]);
    } finally {
      setIsAgentLoading(false);
    }
  };

  const handleRunQuickCommand = (cmd: string) => { setCurrentView('chat'); handleSendMessage(cmd); };

  const handleAddMemory = (item: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'>) => setMemoryItems(prev => [{ ...item, id: `mem-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...prev]);
  const handleDeleteMemory = (id: string) => setMemoryItems(prev => prev.filter(m => m.id !== id));
  const handleToggleConnectorStatus = (id: string) => setConnectors(prev => prev.map(c => c.id === id ? { ...c, status: c.status === 'connected' ? 'disconnected' : 'connected', lastVerified: new Date().toISOString() } : c));
  const handleAddConnector = (newConn: Connector) => setConnectors(prev => [newConn, ...prev]);
  const handleRunWorkflow = (id: string) => setWorkflows(prev => prev.map(w => w.id === id ? { ...w, runCount: w.runCount + 1, lastRun: new Date().toISOString(), lastStatus: 'success' } : w));
  const handleToggleWorkflowActive = (id: string) => setWorkflows(prev => prev.map(w => w.id === id ? { ...w, active: !w.active } : w));
  const handleAddProject = (newProj: Project) => { setProjects(prev => [newProj, ...prev]); setActiveProject(newProj); };
  const handleAddLesson = (newLes: LessonLearned) => setLessons(prev => [newLes, ...prev]);
  const handleSaveCommandTemplate = (template: Omit<CommandTemplate, 'id' | 'usageCount'>) => setCommandTemplates(prev => [{ ...template, id: `tmpl-${Date.now()}`, usageCount: 0 }, ...prev]);
  const handleUpdateCommandTemplate = (template: CommandTemplate) => setCommandTemplates(prev => prev.map(t => t.id === template.id ? template : t));
  const handleDeleteCommandTemplate = (templateId: string) => setCommandTemplates(prev => prev.filter(t => t.id !== templateId));
  const handleTogglePinCommandTemplate = (templateId: string) => setCommandTemplates(prev => prev.map(t => t.id === templateId ? { ...t, isPinned: !t.isPinned } : t));

  return (
    <div className="min-h-screen bg-[#050816] text-zinc-100 flex flex-col font-sans selection:bg-cyan-400 selection:text-slate-950">
      <Navbar activeModel={activeModel} models={models} onSelectModel={setActiveModel} activeProject={activeProject} projects={projects} onSelectProject={setActiveProject} onOpenCommandCenter={() => setCurrentView('chat')} />
      <div className="mx-auto w-full max-w-7xl border-x border-b border-cyan-400/15 bg-gradient-to-r from-violet-500/10 via-cyan-400/5 to-transparent px-4 py-2 text-center text-[11px] font-medium tracking-wide text-cyan-100">AI OPERATIONS CORE • EVIDENCE REQUIRED • APPROVAL BEFORE SIDE EFFECTS</div>
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row">
        <Sidebar currentView={currentView} onSelectView={setCurrentView} memoryCount={memoryItems.length} connectorsCount={connectors.length} workflowsCount={workflows.length} lessonsCount={lessons.length} />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {currentView === 'dashboard' && <DashboardView projects={projects} activeProject={activeProject} connectors={connectors} workflows={workflows} lessons={lessons} logs={logs} userProfile={userProfile} activeModel={activeModel} onNavigate={setCurrentView} onRunQuickCommand={handleRunQuickCommand} />}
          {currentView === 'chat' && <CommandCenterView messages={messages} onSendMessage={handleSendMessage} isLoading={isAgentLoading} userProfile={userProfile} activeProject={activeProject} activeModel={activeModel} memoryItems={memoryItems} commandTemplates={commandTemplates} onSaveTemplate={handleSaveCommandTemplate} onUpdateTemplate={handleUpdateCommandTemplate} onDeleteTemplate={handleDeleteCommandTemplate} onTogglePinTemplate={handleTogglePinCommandTemplate} />}
          {currentView === 'memory' && <MemoryBankView memoryItems={memoryItems} onAddMemory={handleAddMemory} onDeleteMemory={handleDeleteMemory} />}
          {currentView === 'connectors' && <ConnectorsView connectors={connectors} onToggleStatus={handleToggleConnectorStatus} onAddConnector={handleAddConnector} />}
          {currentView === 'workflows' && <WorkflowStudioView workflows={workflows} onRunWorkflow={handleRunWorkflow} onAddWorkflow={(wf) => setWorkflows(prev => [wf, ...prev])} onToggleActive={handleToggleWorkflowActive} />}
          {currentView === 'coding' && <CodingWorkspaceView activeProject={activeProject} activeModel={activeModel} />}
          {currentView === 'projects' && <ProjectsInheritanceView projects={projects} activeProject={activeProject} onSelectProject={setActiveProject} onAddProject={handleAddProject} />}
          {currentView === 'lessons' && <LessonsLearnedView lessons={lessons} onAddLesson={handleAddLesson} />}
        </main>
      </div>
      <footer className="bg-[#050816] border-t border-white/10 px-4 py-2.5 text-xs font-mono text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>JARVIS</span>
          <span className="text-zinc-700">|</span>
          <span className="text-zinc-400">FREE-FIRST ROUTING</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-zinc-500">
          <span>POLICY: <strong className="text-emerald-300 font-normal">NO PAID ROUTE BY DEFAULT</strong></span>
          <span className="text-zinc-800">•</span>
          <span>SUCCESS: <strong className="text-emerald-300 font-normal">VERIFY FIRST</strong></span>
        </div>
      </footer>
    </div>
  );
}
