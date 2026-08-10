import React, { useState } from 'react';
import {
  BookOpenCheck,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Tag,
  Search,
  X,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { LessonLearned } from '../types';

interface LessonsLearnedViewProps {
  lessons: LessonLearned[];
  onAddLesson: (lesson: LessonLearned) => void;
}

export const LessonsLearnedView: React.FC<LessonsLearnedViewProps> = ({
  lessons,
  onAddLesson,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add Form State
  const [problem, setProblem] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [verifiedSolution, setVerifiedSolution] = useState('');
  const [category, setCategory] = useState<LessonLearned['category']>('coding');

  const filteredLessons = lessons.filter(les =>
    searchQuery === '' ||
    les.problem.toLowerCase().includes(searchQuery.toLowerCase()) ||
    les.rootCause.toLowerCase().includes(searchQuery.toLowerCase()) ||
    les.verifiedSolution.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem.trim() || !verifiedSolution.trim()) return;

    onAddLesson({
      id: `les-${Date.now()}`,
      problem,
      rootCause: rootCause || 'Diagnosed during error resolution loop',
      verifiedSolution,
      category,
      recordedAt: new Date().toISOString(),
      timesApplied: 1
    });

    setProblem('');
    setRootCause('');
    setVerifiedSolution('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Header Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-zinc-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono">
            <BookOpenCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              SELF-IMPROVEMENT & LESSONS LEARNED REGISTRY
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              6-STEP DIAGNOSTIC LOOP
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Error Diagnostic Loop (Diagnose &rarr; Verify &rarr; Fix &rarr; Test &rarr; Record). Lessons are retrieved before executing similar future tasks.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 font-mono">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            Record Lesson
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative bg-zinc-900 p-3 rounded-2xl border border-zinc-800 font-mono">
        <Search className="w-4 h-4 text-zinc-500 absolute left-5 top-4" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search problem, root cause, or verified solutions..."
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
        />
      </div>

      {/* 6-Step Protocol Card */}
      <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl text-zinc-200 text-xs">
        <div className="font-bold text-zinc-400 uppercase text-[11px] mb-2 flex items-center gap-1.5 font-mono">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          Mandatory 6-Step Failure Diagnostic Protocol
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-[10px] text-center font-mono">
          <div className="bg-zinc-900 p-2 rounded-xl border border-zinc-800 font-medium text-zinc-300">1. What failed?</div>
          <div className="bg-zinc-900 p-2 rounded-xl border border-zinc-800 font-medium text-zinc-300">2. Where failed?</div>
          <div className="bg-zinc-900 p-2 rounded-xl border border-zinc-800 font-medium text-zinc-300">3. Why failed?</div>
          <div className="bg-zinc-900 p-2 rounded-xl border border-zinc-800 font-medium text-zinc-300">4. Recoverable?</div>
          <div className="bg-zinc-900 p-2 rounded-xl border border-zinc-800 font-medium text-zinc-300">5. Smallest fix?</div>
          <div className="bg-zinc-900 p-2 rounded-xl border border-zinc-800 font-medium text-emerald-400">6. Record Lesson</div>
        </div>
      </div>

      {/* Lessons Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredLessons.map((les) => (
          <div
            key={les.id}
            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-4 rounded-2xl text-zinc-200 space-y-3 transition-all"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 font-mono">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-zinc-950 text-emerald-400 border border-zinc-800">
                {les.category}
              </span>
              <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Applied {les.timesApplied}x
              </span>
            </div>

            <div>
              <div className="text-[11px] font-bold text-zinc-500 uppercase font-mono">Encountered Problem:</div>
              <p className="text-xs font-semibold text-white mt-0.5 font-sans">{les.problem}</p>
            </div>

            <div>
              <div className="text-[11px] font-bold text-zinc-500 uppercase font-mono">Root Cause Analysis:</div>
              <p className="text-xs text-zinc-300 mt-0.5 font-mono bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                {les.rootCause}
              </p>
            </div>

            <div>
              <div className="text-[11px] font-bold text-emerald-400 uppercase flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3 h-3" /> Verified Solution:
              </div>
              <p className="text-xs text-emerald-400 mt-0.5 bg-zinc-950 border border-emerald-500/20 p-2.5 rounded-xl font-medium font-sans">
                {les.verifiedSolution}
              </p>
            </div>

            <div className="text-right text-[10px] text-zinc-500 font-mono">
              Recorded: {new Date(les.recordedAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {/* Add Lesson Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl p-5 text-zinc-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 font-mono">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BookOpenCheck className="w-4 h-4 text-emerald-400" />
                Record Verified Lesson Learned
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Encountered Problem</label>
                <input
                  type="text"
                  required
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  placeholder="e.g., Express server crash on port binding..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e: any) => setCategory(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600 font-mono"
                >
                  <option value="coding">Coding / TypeScript</option>
                  <option value="deployment">Deployment / Cloud Run</option>
                  <option value="workflow">n8n Workflow Execution</option>
                  <option value="api">API / OAuth Connector</option>
                  <option value="user_preference">User Preference Adaptation</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Root Cause Analysis</label>
                <textarea
                  rows={2}
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  placeholder="Why did it fail?"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Verified Solution / Fix</label>
                <textarea
                  rows={2}
                  required
                  value={verifiedSolution}
                  onChange={(e) => setVerifiedSolution(e.target.value)}
                  placeholder="What is the smallest safe verified fix?"
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
                  Record Lesson Learned
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
