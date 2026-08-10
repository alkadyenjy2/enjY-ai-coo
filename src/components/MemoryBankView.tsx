import React, { useState } from 'react';
import {
  Brain,
  Search,
  Plus,
  Tag,
  CheckCircle2,
  Lock,
  Layers,
  Download,
  Upload,
  Trash2,
  Sparkles,
  ShieldCheck,
  X
} from 'lucide-react';
import { MemoryItem, MemoryLayer } from '../types';

interface MemoryBankViewProps {
  memoryItems: MemoryItem[];
  onAddMemory: (item: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteMemory: (id: string) => void;
}

export const MemoryBankView: React.FC<MemoryBankViewProps> = ({
  memoryItems,
  onAddMemory,
  onDeleteMemory,
}) => {
  const [selectedLayer, setSelectedLayer] = useState<MemoryLayer | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add Form State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newLayer, setNewLayer] = useState<MemoryLayer>('user');
  const [newTags, setNewTags] = useState('preferences, persistent');

  const layersList: { id: MemoryLayer | 'all'; label: string; count: number }[] = [
    { id: 'all', label: 'All Memory Layers', count: memoryItems.length },
    { id: 'short_term', label: 'Short-Term', count: memoryItems.filter(m => m.layer === 'short_term').length },
    { id: 'project', label: 'Project Memory', count: memoryItems.filter(m => m.layer === 'project').length },
    { id: 'user', label: 'User Memory', count: memoryItems.filter(m => m.layer === 'user').length },
    { id: 'episodic', label: 'Episodic', count: memoryItems.filter(m => m.layer === 'episodic').length },
    { id: 'semantic', label: 'Semantic Knowledge', count: memoryItems.filter(m => m.layer === 'semantic').length },
    { id: 'technical', label: 'Technical Stack', count: memoryItems.filter(m => m.layer === 'technical').length },
    { id: 'lessons_learned', label: 'Lessons Learned', count: memoryItems.filter(m => m.layer === 'lessons_learned').length },
    { id: 'behavioral', label: 'Behavioral Learning', count: memoryItems.filter(m => m.layer === 'behavioral').length },
  ];

  const filteredItems = memoryItems.filter(item => {
    const matchesLayer = selectedLayer === 'all' || item.layer === selectedLayer;
    const matchesSearch = searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesLayer && matchesSearch;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    onAddMemory({
      title: newTitle,
      content: newContent,
      layer: newLayer,
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      confidence: 100,
      verified: true
    });

    setNewTitle('');
    setNewContent('');
    setIsAddModalOpen(false);
  };

  const exportMemoryJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(memoryItems, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `core_agent_memory_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Header Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-zinc-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono">
            <Brain className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              MULTI-LAYER PERSISTENT MEMORY BANK
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              8 TIERS ACTIVE
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Short-Term, Project, User, Episodic, Technical, Lessons Learned, and Behavioral memory layers persisting across project environments.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 font-mono">
          <button
            onClick={exportMemoryJSON}
            className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium px-3 py-2 rounded-xl border border-zinc-700 transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Export JSON
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Memory
          </button>
        </div>
      </div>

      {/* Layer Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-zinc-900 p-3 rounded-2xl border border-zinc-800 font-mono">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar text-xs">
          {layersList.map((layer) => (
            <button
              key={layer.id}
              onClick={() => setSelectedLayer(layer.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all ${
                selectedLayer === layer.id
                  ? 'bg-zinc-800 text-white border border-zinc-700 font-bold'
                  : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-400'
              }`}
            >
              {layer.label} ({layer.count})
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64 shrink-0 font-sans">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tags, title, content..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
          />
        </div>
      </div>

      {/* Memory Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-4 rounded-2xl text-zinc-200 flex flex-col justify-between space-y-3 transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-2 font-mono">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {item.layer.replace('_', ' ')}
                </span>
                <div className="flex items-center gap-1">
                  {item.verified && (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verified
                    </span>
                  )}
                  <button
                    onClick={() => onDeleteMemory(item.id)}
                    className="text-zinc-500 hover:text-rose-400 p-1 transition-colors ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-xs text-white leading-snug font-sans">{item.title}</h3>
              <p className="text-xs text-zinc-300 mt-1.5 whitespace-pre-wrap leading-relaxed font-sans">
                {item.content}
              </p>
            </div>

            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
              <div className="flex flex-wrap gap-1">
                {item.tags.map((tag, idx) => (
                  <span key={idx} className="bg-zinc-950 px-1.5 py-0.5 rounded text-zinc-400 border border-zinc-800">
                    #{tag}
                  </span>
                ))}
              </div>
              <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="col-span-full py-12 text-center text-zinc-500 text-xs font-mono">
            No memory items found matching the selected layer or search query.
          </div>
        )}
      </div>

      {/* Add Memory Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl p-5 text-zinc-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Brain className="w-4 h-4 text-emerald-400" />
                Store New Persistent Memory Item
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Memory Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Preferred Deployment Flow"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Target Layer</label>
                <select
                  value={newLayer}
                  onChange={(e: any) => setNewLayer(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600 font-mono"
                >
                  <option value="user">User Memory</option>
                  <option value="project">Project Memory</option>
                  <option value="short_term">Short-Term Memory</option>
                  <option value="episodic">Episodic Memory</option>
                  <option value="semantic">Semantic Knowledge</option>
                  <option value="technical">Technical Memory</option>
                  <option value="lessons_learned">Lessons Learned</option>
                  <option value="behavioral">Behavioral Memory</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Content / Knowledge</label>
                <textarea
                  rows={3}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Detail the exact verified preference or architectural rule..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Tags (Comma separated)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="preferences, architecture, express"
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
