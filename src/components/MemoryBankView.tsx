import React, { useState } from 'react';
import {
  Brain,
  Search,
  Plus,
  CheckCircle2,
  Download,
  Trash2,
  ShieldCheck,
  X
} from 'lucide-react';
import { MemoryItem, MemoryLayer } from '../types';

interface MemoryBankViewProps {
  memoryItems: MemoryItem[];
  onAddMemory: (item: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteMemory: (id: string) => void;
}

const memoryGroups: { id: MemoryLayer | 'all'; label: string; layers: MemoryLayer[] }[] = [
  { id: 'all', label: 'Everything', layers: [] },
  { id: 'user', label: 'About You', layers: ['user'] },
  { id: 'project', label: 'Projects', layers: ['project', 'technical'] },
  { id: 'episodic', label: 'Experiences', layers: ['episodic', 'short_term'] },
  { id: 'semantic', label: 'Knowledge', layers: ['semantic'] },
  { id: 'lessons_learned', label: 'Lessons', layers: ['lessons_learned'] },
  { id: 'behavioral', label: 'How You Work', layers: ['behavioral'] },
];

const groupForLayer = (layer: MemoryLayer) =>
  memoryGroups.find(group => group.layers.includes(layer))?.label ?? 'Memory';

export const MemoryBankView: React.FC<MemoryBankViewProps> = ({
  memoryItems,
  onAddMemory,
  onDeleteMemory,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<MemoryLayer | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newLayer, setNewLayer] = useState<MemoryLayer>('user');
  const [newTags, setNewTags] = useState('preferences, persistent');

  const selected = memoryGroups.find(group => group.id === selectedGroup) ?? memoryGroups[0];

  const filteredItems = memoryItems.filter(item => {
    const matchesGroup = selectedGroup === 'all' || selected.layers.includes(item.layer);
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query ||
      item.title.toLowerCase().includes(query) ||
      item.content.toLowerCase().includes(query) ||
      item.tags.some(tag => tag.toLowerCase().includes(query));
    return matchesGroup && matchesSearch;
  });

  const verifiedCount = memoryItems.filter(item => item.verified).length;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    onAddMemory({
      title: newTitle.trim(),
      content: newContent.trim(),
      layer: newLayer,
      tags: newTags.split(',').map(tag => tag.trim()).filter(Boolean),
      confidence: 100,
      verified: true
    });

    setNewTitle('');
    setNewContent('');
    setNewTags('preferences, persistent');
    setNewLayer('user');
    setIsAddModalOpen(false);
  };

  const exportMemoryJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(memoryItems, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `jarvis-memory-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-4 font-sans">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-zinc-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">MEMORY</h2>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              PERSISTENT
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-2xl">
            The things JARVIS remembers about you, your work, your projects, and what it has learned over time.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {verifiedCount} verified
          </div>
          <button
            onClick={exportMemoryJSON}
            className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium px-3 py-2 rounded-xl border border-zinc-700 transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Export
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            Remember something
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-zinc-900 p-3 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar text-xs">
          {memoryGroups.map(group => {
            const count = group.id === 'all'
              ? memoryItems.length
              : memoryItems.filter(item => group.layers.includes(item.layer)).length;
            return (
              <button
                key={group.id}
                onClick={() => setSelectedGroup(group.id)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                  selectedGroup === group.id
                    ? 'bg-zinc-800 text-white border border-zinc-700 font-bold'
                    : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-400'
                }`}
              >
                {group.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search memory..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
          />
        </div>
      </div>

      <div className="flex items-center justify-between px-1 text-[10px] text-zinc-500 font-mono">
        <span>{selected.label}</span>
        <span>{filteredItems.length} {filteredItems.length === 1 ? 'memory' : 'memories'}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredItems.map(item => (
          <div
            key={item.id}
            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-4 rounded-2xl text-zinc-200 flex flex-col justify-between space-y-3 transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-950 text-zinc-400 border border-zinc-800">
                  {groupForLayer(item.layer)}
                </span>
                <div className="flex items-center gap-1">
                  {item.verified && (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  )}
                  <button
                    onClick={() => onDeleteMemory(item.id)}
                    aria-label="Forget this memory"
                    title="Forget this memory"
                    className="text-zinc-500 hover:text-rose-400 p-1 transition-colors ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-xs text-white leading-snug">{item.title}</h3>
              <p className="text-xs text-zinc-300 mt-1.5 whitespace-pre-wrap leading-relaxed">
                {item.content}
              </p>
            </div>

            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500 font-mono gap-2">
              <div className="flex flex-wrap gap-1">
                {item.tags.map((tag, idx) => (
                  <span key={idx} className="bg-zinc-950 px-1.5 py-0.5 rounded text-zinc-400 border border-zinc-800">
                    #{tag}
                  </span>
                ))}
              </div>
              <span className="shrink-0">{new Date(item.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="col-span-full py-12 text-center text-zinc-500 text-xs">
            {searchQuery ? 'Nothing in memory matches that search.' : 'Nothing remembered here yet.'}
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl p-5 text-zinc-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-emerald-400" />
                Remember something
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-500 hover:text-white" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">What should JARVIS remember?</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Preferred deployment flow"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Memory type</label>
                <select
                  value={newLayer}
                  onChange={e => setNewLayer(e.target.value as MemoryLayer)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600"
                >
                  <option value="user">About You</option>
                  <option value="project">Project</option>
                  <option value="episodic">Experience</option>
                  <option value="semantic">Knowledge</option>
                  <option value="technical">Project / Technical</option>
                  <option value="lessons_learned">Lesson</option>
                  <option value="behavioral">How You Work</option>
                  <option value="short_term">Recent Context</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Details</label>
                <textarea
                  rows={4}
                  required
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="Write the preference, fact, decision, or lesson..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Tags</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={e => setNewTags(e.target.value)}
                  placeholder="preferences, persistent"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
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
                  Save to Memory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
