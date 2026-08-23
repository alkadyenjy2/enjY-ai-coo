/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, NavView } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { CommandCenterView } from './components/CommandCenterView';
import { OnboardingQuizModal } from './components/OnboardingQuizModal';
import { MemoryBankView } from './components/MemoryBankView';
import { ConnectorsView } from './components/ConnectorsView';
import { WorkflowStudioView } from './components/WorkflowStudioView';
import { CodingWorkspaceView } from './components/CodingWorkspaceView';
import { ProjectsInheritanceView } from './components/ProjectsInheritanceView';
import { LessonsLearnedView } from './components/LessonsLearnedView';

import {
  initialUserProfile,
  initialMemoryItems,
  initialConnectors,
  initialWorkflows,
  initialProjects,
  initialLessonsLearned,
  initialAIModels,
  initialExecutionLogs,
  initialChatMessages,
  initialCommandTemplates,
} from './data/mockInitialData';

import {
  UserProfile,
  MemoryItem,
  Connector,
  Workflow,
  Project,
  LessonLearned,
  AIModelOption,
  ExecutionLog,
  ChatMessage,
  CommandTemplate,
} from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [userProfile, setUserProfile] = useState<UserProfile>(initialUserProfile);
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>(initialMemoryItems);
  const [connectors, setConnectors] = useState<Connector[]>(initialConnectors);
  const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [activeProject, setActiveProject] = useState<Project>(initialProjects[0]);
  const [lessons, setLessons] = useState<LessonLearned[]>(initialLessonsLearned);
  const [models] = useState<AIModelOption[]>(initialAIModels);
  const [activeModel, setActiveModel] = useState<AIModelOption>(initialAIModels[0]);
  const [logs, setLogs] = useState<ExecutionLog[]>(initialExecutionLogs);
  const [messages, setMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [commandTemplates, setCommandTemplates] = useState<CommandTemplate[]>(initialCommandTemplates);

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isAgentLoading, setIsAgentLoading] = useState(false);

  // Send Command to Agent (Calls backend Express /api/agent/command -> Gemini 3.6 Flash)
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsAgentLoading(true);

    try {
      const response = await fetch('/api/agent/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          userProfile,
          activeProject,
          memoryContext: memoryItems.slice(0, 5),
          model: activeModel.id,
        }),
      });

      const data = await response.json();

      const agentMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'agent',
        content: data.content || 'Task executed successfully.',
        timestamp: new Date().toISOString(),
        thoughtProcess: data.thoughtProcess,
        actionsTaken: data.actionsTaken,
      };

      setMessages(prev => [...prev, agentMsg]);

      // Add Execution Log
      const newLog: ExecutionLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: `Command Execution: "${text.slice(0, 30)}..."`,
        status: 'success',
        details: `Executed via ${activeModel.name}. Adhered to ${userProfile.communicationPreference} preference.`,
        project: activeProject.name,
        durationMs: 380,
      };

      setLogs(prev => [newLog, ...prev]);
    } catch (err) {
      console.error('Agent execution error:', err);
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'agent',
        content: 'Diagnosed failure in agent pipeline. Executing error protocol (Diagnose -> Verify -> Fix -> Test -> Record Lesson).',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsAgentLoading(false);
    }
  };

  // Quick Command Launcher from Dashboard
  const handleRunQuickCommand = (cmd: string) => {
    setCurrentView('chat');
    handleSendMessage(cmd);
  };

  // Onboarding Quiz Completion
  const handleOnboardingComplete = (updatedProfile: UserProfile, newProject: Project) => {
    setUserProfile(updatedProfile);
    setProjects(prev => [newProject, ...prev]);
    setActiveProject(newProject);

    // Save profile to memory
    const newMem: MemoryItem = {
      id: `mem-${Date.now()}`,
      layer: 'user',
      title: `Discovery Profile for ${newProject.name}`,
      content: `Comm: ${updatedProfile.communicationPreference}, Tech: ${updatedProfile.technicalLevel}, Autonomy: ${updatedProfile.autonomyLevel}`,
      tags: ['onboarding', 'profile', newProject.name],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      confidence: 100,
      verified: true,
    };
    setMemoryItems(prev => [newMem, ...prev]);
  };

  // Memory Handlers
  const handleAddMemory = (item: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newMem: MemoryItem = {
      ...item,
      id: `mem-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMemoryItems(prev => [newMem, ...prev]);
  };

  const handleDeleteMemory = (id: string) => {
    setMemoryItems(prev => prev.filter(m => m.id !== id));
  };

  // Connector Handlers
  const handleToggleConnectorStatus = (id: string) => {
    setConnectors(prev =>
      prev.map(c => {
        if (c.id === id) {
          const nextStatus = c.status === 'connected' ? 'disconnected' : 'connected';
          return { ...c, status: nextStatus, lastVerified: new Date().toISOString() };
        }
        return c;
      })
    );
  };

  const handleAddConnector = (newConn: Connector) => {
    setConnectors(prev => [newConn, ...prev]);
  };

  // Workflow Handlers
  const handleRunWorkflow = (id: string) => {
    setWorkflows(prev =>
      prev.map(w => {
        if (w.id === id) {
          return { ...w, runCount: w.runCount + 1, lastRun: new Date().toISOString(), lastStatus: 'success' };
        }
        return w;
      })
    );
  };

  const handleToggleWorkflowActive = (id: string) => {
    setWorkflows(prev =>
      prev.map(w => {
        if (w.id === id) {
          return { ...w, active: !w.active };
        }
        return w;
      })
    );
  };

  // Project Handlers
  const handleAddProject = (newProj: Project) => {
    setProjects(prev => [newProj, ...prev]);
    setActiveProject(newProj);
  };

  // Lesson Handlers
  const handleAddLesson = (newLes: LessonLearned) => {
    setLessons(prev => [newLes, ...prev]);
  };

  // Command Template Handlers
  const handleSaveCommandTemplate = (template: Omit<CommandTemplate, 'id' | 'usageCount'>) => {
    const newTmpl: CommandTemplate = {
      ...template,
      id: `tmpl-${Date.now()}`,
      usageCount: 0,
    };
    setCommandTemplates(prev => [newTmpl, ...prev]);
  };

  const handleUpdateCommandTemplate = (template: CommandTemplate) => {
    setCommandTemplates(prev => prev.map(t => (t.id === template.id ? template : t)));
  };

  const handleDeleteCommandTemplate = (templateId: string) => {
    setCommandTemplates(prev => prev.filter(t => t.id !== templateId));
  };

  const handleTogglePinCommandTemplate = (templateId: string) => {
    setCommandTemplates(prev =>
      prev.map(t => (t.id === templateId ? { ...t, isPinned: !t.isPinned } : t))
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-zinc-950">
      {/* Top Navbar */}
      <Navbar
        activeModel={activeModel}
        models={models}
        onSelectModel={setActiveModel}
        activeProject={activeProject}
        projects={projects}
        onSelectProject={setActiveProject}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onOpenCommandCenter={() => setCurrentView('chat')}
      />

      {/* Main Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row">
        {/* Left Sidebar */}
        <Sidebar
          currentView={currentView}
          onSelectView={setCurrentView}
          memoryCount={memoryItems.length}
          connectorsCount={connectors.length}
          workflowsCount={workflows.length}
          lessonsCount={lessons.length}
        />

        {/* Primary View Canvas */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {currentView === 'dashboard' && (
            <DashboardView
              projects={projects}
              activeProject={activeProject}
              connectors={connectors}
              workflows={workflows}
              lessons={lessons}
              logs={logs}
              userProfile={userProfile}
              activeModel={activeModel}
              onNavigate={setCurrentView}
              onRunQuickCommand={handleRunQuickCommand}
            />
          )}

          {currentView === 'chat' && (
            <CommandCenterView
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isAgentLoading}
              userProfile={userProfile}
              activeProject={activeProject}
              activeModel={activeModel}
              memoryItems={memoryItems}
              commandTemplates={commandTemplates}
              onSaveTemplate={handleSaveCommandTemplate}
              onUpdateTemplate={handleUpdateCommandTemplate}
              onDeleteTemplate={handleDeleteCommandTemplate}
              onTogglePinTemplate={handleTogglePinCommandTemplate}
            />
          )}

          {currentView === 'onboarding' && (
            <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-2xl text-center space-y-4">
              <h2 className="text-xl font-bold text-white font-sans">First-Run Project Discovery Quiz</h2>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed font-sans">
                Calibrate the Core AI Operations Agent memory bank and project layer parameters using the discovery quiz.
              </p>
              <button
                onClick={() => setIsOnboardingOpen(true)}
                className="bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all"
              >
                Launch Discovery Quiz Modal
              </button>
            </div>
          )}

          {currentView === 'memory' && (
            <MemoryBankView
              memoryItems={memoryItems}
              onAddMemory={handleAddMemory}
              onDeleteMemory={handleDeleteMemory}
            />
          )}

          {currentView === 'connectors' && (
            <ConnectorsView
              connectors={connectors}
              onToggleStatus={handleToggleConnectorStatus}
              onAddConnector={handleAddConnector}
            />
          )}

          {currentView === 'workflows' && (
            <WorkflowStudioView
              workflows={workflows}
              onRunWorkflow={handleRunWorkflow}
              onAddWorkflow={(wf) => setWorkflows(prev => [wf, ...prev])}
              onToggleActive={handleToggleWorkflowActive}
            />
          )}

          {currentView === 'coding' && (
            <CodingWorkspaceView
              activeProject={activeProject}
              activeModel={activeModel}
            />
          )}

          {currentView === 'projects' && (
            <ProjectsInheritanceView
              projects={projects}
              activeProject={activeProject}
              onSelectProject={setActiveProject}
              onAddProject={handleAddProject}
            />
          )}

          {currentView === 'lessons' && (
            <LessonsLearnedView
              lessons={lessons}
              onAddLesson={handleAddLesson}
            />
          )}
        </main>
      </div>

      {/* Bento Grid Status Footer Bar */}
      <footer className="bg-zinc-950 border-t border-zinc-800 px-4 py-2.5 text-xs font-mono text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            SYSTEM READY
          </span>
          <span className="text-zinc-700">|</span>
          <span className="text-zinc-400">CMD &gt; _</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-zinc-500">
          <span>LATENCY: <strong className="text-zinc-300 font-normal">28ms</strong></span>
          <span className="text-zinc-800">•</span>
          <span>OAUTH: <strong className="text-emerald-400 font-normal">ACTIVE</strong></span>
          <span className="text-zinc-800">•</span>
          <span>PERSISTENCE: <strong className="text-cyan-400 font-normal">100%</strong></span>
        </div>
      </footer>

      {/* Discovery Quiz Modal */}
      <OnboardingQuizModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
}
