import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, ArrowRight, ArrowLeft, Sparkles, X, User, Layers, ShieldCheck } from 'lucide-react';
import { UserProfile, Project } from '../types';

interface OnboardingQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (userProfile: UserProfile, newProject: Project) => void;
}

export const OnboardingQuizModal: React.FC<OnboardingQuizModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [step, setStep] = useState<number>(1);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Form State
  const [commStyle, setCommStyle] = useState<UserProfile['communicationPreference']>('concise');
  const [techLevel, setTechLevel] = useState<UserProfile['technicalLevel']>('advanced');
  const [autonomy, setAutonomy] = useState<UserProfile['autonomyLevel']>('full_autonomy');
  const [decisionStyle, setDecisionStyle] = useState<UserProfile['decisionStyle']>('execute_first');
  const [executionSpeed, setExecutionSpeed] = useState<UserProfile['executionSpeed']>('fast');

  const [projectName, setProjectName] = useState('');
  const [projectGoal, setProjectGoal] = useState('');
  const [targetUsers, setTargetUsers] = useState('');
  const [existingTools, setExistingTools] = useState('GitHub, Gemini 3.6 Flash, Express, Vite, Tailwind');
  const [projectRules, setProjectRules] = useState('Verify code before committing; Keep memory persistent across turns');

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 2) setStep(step + 1);
    else handleSubmit();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsSynthesizing(true);
    try {
      const res = await fetch('/api/agent/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: {
            commStyle,
            techLevel,
            autonomy,
            decisionStyle,
            executionSpeed,
            projectName: projectName || 'New Operations Project Layer',
            projectGoal: projectGoal || 'Automate system workflows & maintain persistent memory',
            targetUsers: targetUsers || 'Operations Team',
            existingTools,
            projectRules
          }
        })
      });

      const data = await res.json();

      const synthesizedProfile: UserProfile = {
        name: 'Operations Lead',
        communicationPreference: commStyle,
        technicalLevel: techLevel,
        autonomyLevel: autonomy,
        decisionStyle: decisionStyle,
        executionSpeed: executionSpeed,
        preferredTools: existingTools.split(',').map(s => s.trim()),
        dislikedTools: ['unnecessary manual steps'],
        dislikedUIPatterns: ['overly deep navigation'],
        repeatedApprovals: ['Auto-lint on save', 'Auto-fix safe errors'],
        workingPatterns: ['Execute first, verify second']
      };

      const synthesizedProject: Project = {
        id: `proj-${Date.now()}`,
        name: projectName || 'New Operations Project Layer',
        objective: projectGoal || 'Automate project operations',
        targetUsers: targetUsers || 'Internal Operations',
        status: 'active',
        inheritedCoreCapabilities: [
          'Multi-Layer Memory System',
          'User Behavioral Profile',
          'n8n Workflow Engine',
          'Universal Connector Hub'
        ],
        projectWorkflows: [],
        projectTools: existingTools.split(',').map(s => s.trim()),
        projectRules: projectRules.split(';').map(s => s.trim()),
        createdAt: new Date().toISOString(),
        kpis: { tasksCompleted: 0, automationsActive: 0, lessonsRecorded: 0 }
      };

      onComplete(synthesizedProfile, synthesizedProject);
      setIsSynthesizing(false);
      onClose();
    } catch (err) {
      console.error(err);
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-zinc-200">
        {/* Header */}
        <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-emerald-400 flex items-center justify-center font-mono">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                FIRST-RUN PROJECT DISCOVERY QUIZ
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                Step {step} of 2 &bull; Calibrating Core Agent Memory & Project Inheritance
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          {step === 1 ? (
            /* STEP 1: USER BEHAVIOR & PREFERENCES */
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-[11px] tracking-wider border-b border-zinc-800 pb-2 font-mono">
                <User className="w-4 h-4" />
                1. User Working Preferences & Thinking Style
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Communication Preference */}
                <div className="space-y-1">
                  <label className="block text-zinc-300 font-semibold">Communication Style</label>
                  <select
                    value={commStyle}
                    onChange={(e: any) => setCommStyle(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600 font-mono"
                  >
                    <option value="concise">Concise & Direct (1-sentence summary)</option>
                    <option value="detailed">Detailed & Explanatory</option>
                    <option value="bullet_points">Structured Bullet Points</option>
                  </select>
                </div>

                {/* Technical Level */}
                <div className="space-y-1">
                  <label className="block text-zinc-300 font-semibold">Technical Level</label>
                  <select
                    value={techLevel}
                    onChange={(e: any) => setTechLevel(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600 font-mono"
                  >
                    <option value="advanced">Advanced / Engineer</option>
                    <option value="architect">Systems Architect</option>
                    <option value="intermediate">Intermediate Technical</option>
                    <option value="beginner">Non-Technical / High-Level</option>
                  </select>
                </div>

                {/* Autonomy Level */}
                <div className="space-y-1">
                  <label className="block text-zinc-300 font-semibold">Agent Autonomy Level</label>
                  <select
                    value={autonomy}
                    onChange={(e: any) => setAutonomy(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600 font-mono"
                  >
                    <option value="full_autonomy">Full Autonomy (Execute safe tasks directly)</option>
                    <option value="approval_required">Approval Required for Major Changes</option>
                    <option value="guided_step_by_step">Guided Step-by-Step Confirmation</option>
                  </select>
                </div>

                {/* Decision Style */}
                <div className="space-y-1">
                  <label className="block text-zinc-300 font-semibold">Decision Style</label>
                  <select
                    value={decisionStyle}
                    onChange={(e: any) => setDecisionStyle(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600 font-mono"
                  >
                    <option value="execute_first">Execute First & Verify Second</option>
                    <option value="discuss_first">Discuss Options First</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            /* STEP 2: PROJECT SPECIFICS */
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-[11px] tracking-wider border-b border-zinc-800 pb-2 font-mono">
                <Layers className="w-4 h-4" />
                2. Project Layer Goals & Constraints
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-zinc-300 font-semibold">Project Name</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g., E-Commerce Growth Automation Agent"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-300 font-semibold">What is being built & Desired Outcome?</label>
                  <textarea
                    rows={2}
                    value={projectGoal}
                    onChange={(e) => setProjectGoal(e.target.value)}
                    placeholder="Describe main goals, desired outcome, and why it is being built..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-zinc-300 font-semibold">Target Users / Customers</label>
                    <input
                      type="text"
                      value={targetUsers}
                      onChange={(e) => setTargetUsers(e.target.value)}
                      placeholder="e.g., Operations Team, End Users"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-zinc-300 font-semibold">Existing Infrastructure & Tools</label>
                    <input
                      type="text"
                      value={existingTools}
                      onChange={(e) => setExistingTools(e.target.value)}
                      placeholder="GitHub, n8n, Supabase, Gemini"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-300 font-semibold">Project-Specific Rules & Constraints (Semicolon separated)</label>
                  <input
                    type="text"
                    value={projectRules}
                    onChange={(e) => setProjectRules(e.target.value)}
                    placeholder="e.g., Verify fix before deployment; Keep memory persistent"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600 font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="bg-zinc-950 px-6 py-4 border-t border-zinc-800 flex items-center justify-between font-mono">
          <button
            onClick={handleBack}
            disabled={step === 1 || isSynthesizing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold disabled:opacity-30 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={isSynthesizing}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold transition-all shadow-sm"
          >
            {isSynthesizing ? (
              <>Synthesizing AI Profile...</>
            ) : step === 1 ? (
              <>
                Next: Project Scope <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                Save & Initialize Project <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
