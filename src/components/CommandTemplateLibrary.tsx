import React, { useState } from 'react';
import {
  Bookmark,
  Pin,
  PinOff,
  Plus,
  Play,
  Trash2,
  Edit3,
  Search,
  Tag,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  SlidersHorizontal,
  X,
  Layers,
  Wand2
} from 'lucide-react';
import { CommandTemplate } from '../types';

interface CommandTemplateLibraryProps {
  templates: CommandTemplate[];
  onExecuteTemplate: (prompt: string, templateId: string) => void;
  onSaveTemplate: (template: Omit<CommandTemplate, 'id' | 'usageCount'>) => void;
  onUpdateTemplate: (template: CommandTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onTogglePin: (templateId: string) => void;
  isLoading?: boolean;
}

export const CommandTemplateLibrary: React.FC<CommandTemplateLibraryProps> = ({
  templates,
  onExecuteTemplate,
  onSaveTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onTogglePin,
  isLoading = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CommandTemplate | null>(null);

  // Template execution variable fill modal
  const [selectedTemplateForRun, setSelectedTemplateForRun] = useState<CommandTemplate | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  // Form State for create / edit
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrompt, setFormPrompt] = useState('');
  const [formCategory, setFormCategory] = useState<CommandTemplate['category']>('custom');
  const [formTags, setFormTags] = useState('');
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Category filter items
  const categories = [
    { id: 'all', label: 'All Templates' },
    { id: 'pinned', label: 'Pinned' },
    { id: 'diagnostics', label: 'Diagnostics' },
    { id: 'workflow', label: 'Workflows' },
    { id: 'leads', label: 'Leads & CRM' },
    { id: 'social', label: 'Social & Content' },
    { id: 'deployment', label: 'Deployment' },
    { id: 'custom', label: 'Custom' },
  ];

  // Filter templates
  const filteredTemplates = templates.filter(tmpl => {
    if (activeCategory === 'pinned' && !tmpl.isPinned) return false;
    if (activeCategory !== 'all' && activeCategory !== 'pinned' && tmpl.category !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = tmpl.title.toLowerCase().includes(q);
      const matchDesc = tmpl.description.toLowerCase().includes(q);
      const matchPrompt = tmpl.prompt.toLowerCase().includes(q);
      const matchTags = tmpl.tags.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchPrompt && !matchTags) return false;
    }
    return true;
  });

  // Pinned templates for quick access toolbar
  const pinnedTemplates = templates.filter(t => t.isPinned);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormTitle('');
    setFormDescription('');
    setFormPrompt('');
    setFormCategory('custom');
    setFormTags('');
    setFormIsPinned(false);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (template: CommandTemplate) => {
    setEditingTemplate(template);
    setFormTitle(template.title);
    setFormDescription(template.description);
    setFormPrompt(template.prompt);
    setFormCategory(template.category);
    setFormTags(template.tags.join(', '));
    setFormIsPinned(template.isPinned);
    setIsCreateModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formPrompt.trim()) return;

    // Detect variables like {{variable_name}}
    const varMatches = formPrompt.match(/\{\{([^}]+)\}\}/g);
    const variables = varMatches
      ? Array.from(new Set(varMatches.map((m: string) => m.replace(/[{}]/g, '').trim()))).map((name: string) => ({
          name,
          label: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          placeholder: `Enter ${name}...`
        }))
      : undefined;

    const tagsArray = formTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    if (editingTemplate) {
      onUpdateTemplate({
        ...editingTemplate,
        title: formTitle.trim(),
        description: formDescription.trim(),
        prompt: formPrompt.trim(),
        category: formCategory,
        tags: tagsArray,
        isPinned: formIsPinned,
        variables
      });
    } else {
      onSaveTemplate({
        title: formTitle.trim(),
        description: formDescription.trim(),
        prompt: formPrompt.trim(),
        category: formCategory,
        tags: tagsArray,
        isPinned: formIsPinned,
        variables
      });
    }

    setIsCreateModalOpen(false);
  };

  const handleTriggerTemplate = (template: CommandTemplate) => {
    // If template has variables, open fill modal
    if (template.variables && template.variables.length > 0) {
      const initialVars: Record<string, string> = {};
      template.variables.forEach(v => {
        initialVars[v.name] = v.defaultValue || '';
      });
      setVariableValues(initialVars);
      setSelectedTemplateForRun(template);
    } else {
      onExecuteTemplate(template.prompt, template.id);
    }
  };

  const handleExecuteWithVariables = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateForRun) return;

    let finalPrompt = selectedTemplateForRun.prompt;
    Object.entries(variableValues).forEach(([key, val]) => {
      finalPrompt = finalPrompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(val || '').trim() || `[${key}]`);
    });

    onExecuteTemplate(finalPrompt, selectedTemplateForRun.id);
    setSelectedTemplateForRun(null);
  };

  const handleCopyPrompt = (template: CommandTemplate) => {
    navigator.clipboard.writeText(template.prompt);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-zinc-950 border-b border-zinc-800 text-zinc-200">
      {/* Pinned Quick Bar */}
      <div className="px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar font-mono text-xs border-b border-zinc-800/60">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] uppercase font-bold text-amber-400 shrink-0 flex items-center gap-1">
            <Pin className="w-3 h-3 fill-amber-400/20 text-amber-400" /> Pinned Templates:
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1">
          {pinnedTemplates.length === 0 ? (
            <span className="text-[11px] text-zinc-500 italic">No pinned templates. Pin templates below for 1-click execution.</span>
          ) : (
            pinnedTemplates.map(tmpl => (
              <button
                key={tmpl.id}
                onClick={() => handleTriggerTemplate(tmpl)}
                disabled={isLoading}
                title={tmpl.prompt}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-[11px] font-mono whitespace-nowrap transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 group cursor-pointer"
              >
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                <span className="truncate max-w-[160px]">{tmpl.title}</span>
                <span className="text-[9px] text-zinc-500 group-hover:text-emerald-400 transition-colors">
                  ({tmpl.usageCount})
                </span>
              </button>
            ))
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-emerald-400 hover:text-emerald-300 text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
          >
            <Bookmark className="w-3 h-3" />
            <span>Templates Library ({templates.length})</span>
            {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Expanded Template Library Drawer */}
      {isOpen && (
        <div className="p-4 bg-zinc-950/95 border-b border-zinc-800 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Controls Bar: Search, Category Filter, and Add Button */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 font-mono">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search templates by title, prompt, or tag..."
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-xl pl-9 pr-4 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
              />
            </div>

            {/* Category Selector */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition-all font-medium cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Create Template Button */}
            <button
              onClick={handleOpenCreate}
              className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Template</span>
            </button>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTemplates.length === 0 ? (
              <div className="col-span-full py-8 text-center bg-zinc-900/50 border border-zinc-800/80 rounded-2xl">
                <Bookmark className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-xs font-mono text-zinc-400">No command templates match your search or filter.</p>
                <button
                  onClick={handleOpenCreate}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-emerald-400 inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Create New Template
                </button>
              </div>
            ) : (
              filteredTemplates.map(template => (
                <div
                  key={template.id}
                  className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-3.5 flex flex-col justify-between space-y-3 transition-all group"
                >
                  <div>
                    {/* Top Row: Title, Pin toggle, Category */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            template.category === 'workflow'
                              ? 'bg-purple-400'
                              : template.category === 'diagnostics'
                              ? 'bg-cyan-400'
                              : template.category === 'leads'
                              ? 'bg-amber-400'
                              : template.category === 'social'
                              ? 'bg-rose-400'
                              : 'bg-emerald-400'
                          }`}
                        />
                        <h4 className="text-xs font-bold text-zinc-100 font-mono line-clamp-1">{template.title}</h4>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => onTogglePin(template.id)}
                          title={template.isPinned ? 'Unpin from quick bar' : 'Pin to quick bar'}
                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                            template.isPinned
                              ? 'text-amber-400 hover:bg-amber-400/10'
                              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                          }`}
                        >
                          {template.isPinned ? (
                            <Pin className="w-3.5 h-3.5 fill-amber-400/20" />
                          ) : (
                            <PinOff className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-400 font-sans line-clamp-2 leading-relaxed mb-2">
                      {template.description}
                    </p>

                    {/* Prompt Preview Snippet */}
                    <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-2 font-mono text-[10px] text-zinc-300 relative group/prompt">
                      <p className="line-clamp-2 pr-6 select-all">{template.prompt}</p>
                      <button
                        onClick={() => handleCopyPrompt(template)}
                        title="Copy command text"
                        className="absolute right-1.5 top-1.5 p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 opacity-0 group-hover/prompt:opacity-100 transition-opacity cursor-pointer"
                      >
                        {copiedId === template.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>

                    {/* Tags & Variables Indicator */}
                    <div className="flex flex-wrap items-center gap-1 mt-2">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-zinc-950 text-zinc-400 border border-zinc-800">
                        {template.category}
                      </span>
                      {template.variables && template.variables.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-0.5">
                          <Wand2 className="w-2.5 h-2.5" /> {template.variables.length} vars
                        </span>
                      )}
                      {template.tags.map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 rounded text-[9px] font-mono text-zinc-500 bg-zinc-950/60">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Actions Row */}
                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between font-mono text-[10px]">
                    <span className="text-zinc-500">Used {template.usageCount}x</span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(template)}
                        title="Edit template"
                        className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTemplate(template.id)}
                        title="Delete template"
                        className="p-1 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleTriggerTemplate(template)}
                        disabled={isLoading}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <Play className="w-2.5 h-2.5 fill-emerald-400" />
                        <span>Run</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Create / Edit Template Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl p-5 text-zinc-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Bookmark className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-mono font-bold text-white">
                    {editingTemplate ? 'Edit Command Template' : 'Create New Command Template'}
                  </h3>
                  <p className="text-[11px] text-zinc-400">Save frequent operational instructions with optional variables</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1 font-bold">Template Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="e.g., Weekly Customer Sentiment & Churn Analysis"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1 font-bold">Description</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Brief summary of what this automated instruction accomplishes"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-zinc-400 font-bold">Command Prompt *</label>
                  <span className="text-[10px] text-purple-400">Use {'{{variable_name}}'} for dynamic inputs</span>
                </div>
                <textarea
                  required
                  rows={4}
                  value={formPrompt}
                  onChange={e => setFormPrompt(e.target.value)}
                  placeholder="e.g., Run sentiment analysis on {{target_channel}} and alert {{notify_channel}} if churn risk exceeds 15%."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-xl p-3 text-zinc-100 placeholder-zinc-600 focus:outline-none font-mono text-xs leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1 font-bold">Category</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none"
                  >
                    <option value="workflow">Workflows</option>
                    <option value="diagnostics">Diagnostics</option>
                    <option value="leads">Leads & CRM</option>
                    <option value="social">Social & Content</option>
                    <option value="deployment">Deployment</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1 font-bold">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={e => setFormTags(e.target.value)}
                    placeholder="audit, crm, high-priority"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="pinCheckbox"
                  checked={formIsPinned}
                  onChange={e => setFormIsPinned(e.target.checked)}
                  className="rounded border-zinc-800 bg-zinc-950 text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="pinCheckbox" className="text-zinc-300 text-xs font-mono cursor-pointer flex items-center gap-1">
                  <Pin className="w-3 h-3 text-amber-400" /> Pin to top toolbar for instant 1-click execution
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingTemplate ? 'Update Template' : 'Save Template'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Variable Fill Modal before Execution */}
      {selectedTemplateForRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-5 text-zinc-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Wand2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-mono font-bold text-white">Fill Template Parameters</h3>
                  <p className="text-[11px] text-zinc-400 font-sans">{selectedTemplateForRun.title}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTemplateForRun(null)}
                className="text-zinc-500 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteWithVariables} className="space-y-3 font-mono text-xs">
              <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                Provide parameters for this execution. They will be formatted directly into the agent command prompt.
              </p>

              {selectedTemplateForRun.variables?.map(v => (
                <div key={v.name}>
                  <label className="block text-[11px] text-zinc-300 mb-1 font-bold">{v.label || v.name}</label>
                  <input
                    type="text"
                    value={variableValues[v.name] || ''}
                    onChange={e =>
                      setVariableValues(prev => ({
                        ...prev,
                        [v.name]: e.target.value
                      }))
                    }
                    placeholder={v.placeholder || `Enter ${v.name}...`}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500/50 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none"
                  />
                </div>
              ))}

              <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 text-[10px] text-zinc-400 font-mono">
                <span className="text-zinc-500 block mb-1">PROMPT PREVIEW:</span>
                <p className="text-zinc-300">
                  {selectedTemplateForRun.variables?.reduce(
                    (str, v) => str.replace(new RegExp(`\\{\\{${v.name}\\}\\}`, 'g'), variableValues[v.name] || `[${v.name}]`),
                    selectedTemplateForRun.prompt
                  )}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSelectedTemplateForRun(null)}
                  className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono font-bold text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-zinc-950" />
                  <span>Execute Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
