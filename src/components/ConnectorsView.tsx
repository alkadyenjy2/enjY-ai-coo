import React, { useState } from 'react';
import {
  Plug,
  CheckCircle2,
  Clock,
  Key,
  ShieldCheck,
  RefreshCw,
  Plus,
  Github,
  Sparkles,
  Database,
  Workflow,
  MessageSquare,
  Folder,
  Cloud,
  Cpu,
  Zap,
  X,
  Play
} from 'lucide-react';
import { Connector, ConnectorCategory } from '../types';

interface ConnectorsViewProps {
  connectors: Connector[];
  onToggleStatus: (id: string) => void;
  onAddConnector: (connector: Connector) => void;
}

export const ConnectorsView: React.FC<ConnectorsViewProps> = ({
  connectors,
  onToggleStatus,
  onAddConnector,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ConnectorCategory | 'all'>('all');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, string>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ConnectorCategory>('development');
  const [description, setDescription] = useState('');
  const [authType, setAuthType] = useState<Connector['authType']>('oauth');

  const categoriesList: { id: ConnectorCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All Categories' },
    { id: 'development', label: 'Development' },
    { id: 'ai', label: 'AI Engine' },
    { id: 'backend', label: 'Backend & DB' },
    { id: 'productivity', label: 'Productivity' },
    { id: 'communication', label: 'Communication' },
    { id: 'automation', label: 'Automation' },
    { id: 'cloud', label: 'Cloud Infrastructure' },
    { id: 'creation', label: 'Creation Tools' },
  ];

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Github': return Github;
      case 'Sparkles': return Sparkles;
      case 'Database': return Database;
      case 'Workflow': return Workflow;
      case 'MessageSquare': return MessageSquare;
      case 'Folder': return Folder;
      case 'Cloud': return Cloud;
      case 'Cpu': return Cpu;
      default: return Plug;
    }
  };

  const handleTestEndpoint = async (connector: Connector) => {
    setTestingId(connector.id);
    try {
      const res = await fetch('/api/connectors/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectorId: connector.id, name: connector.name })
      });
      const data = await res.json();
      setTestResult(prev => ({
        ...prev,
        [connector.id]: `Verified OK in ${data.latencyMs}ms. Capabilities: ${data.capabilitiesDiscovered.join(', ')}`
      }));
    } catch (err) {
      setTestResult(prev => ({ ...prev, [connector.id]: 'Connection test failed.' }));
    } finally {
      setTestingId(null);
    }
  };

  const filteredConnectors = connectors.filter(c => selectedCategory === 'all' || c.category === selectedCategory);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddConnector({
      id: `conn-${Date.now()}`,
      name,
      category,
      description,
      iconName: 'Plug',
      status: 'authorized',
      authType,
      capabilities: ['api_access', 'workflow_trigger'],
      lastVerified: new Date().toISOString()
    });

    setName('');
    setDescription('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Header Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-zinc-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono">
            <Plug className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              UNIVERSAL CONNECTOR & PLUGIN ECOSYSTEM
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              CONNECT &bull; OAUTH &bull; DONE
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Auto-discovers capabilities, tests connection health, and binds external tools directly to the operational workflow layer.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm active:scale-95 shrink-0 font-mono"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Custom Plugin
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto bg-zinc-900 p-2.5 rounded-2xl border border-zinc-800 text-xs no-scrollbar font-mono">
        {categoriesList.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-zinc-800 text-white border border-zinc-700 font-bold'
                : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-400'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Connector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredConnectors.map((conn) => {
          const IconComp = getIcon(conn.iconName);
          const isConnected = conn.status === 'connected' || conn.status === 'authorized';

          return (
            <div
              key={conn.id}
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-4 rounded-2xl text-zinc-200 flex flex-col justify-between space-y-3 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-emerald-400 font-mono">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-white font-sans">{conn.name}</h3>
                      <span className="text-[10px] text-zinc-500 capitalize font-mono">{conn.category} &bull; {conn.authType}</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                    conn.status === 'connected' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    conn.status === 'authorized' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {conn.status}
                  </span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed font-sans">{conn.description}</p>

                <div className="mt-2.5 flex flex-wrap gap-1 font-mono">
                  {conn.capabilities.map((cap, idx) => (
                    <span key={idx} className="bg-zinc-950 px-1.5 py-0.5 rounded text-[9px] text-zinc-400 border border-zinc-800">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Controls & Health Test */}
              <div className="pt-2 border-t border-zinc-800 space-y-2 font-mono">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleTestEndpoint(conn)}
                    disabled={testingId === conn.id}
                    className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                  >
                    <Play className="w-2.5 h-2.5" />
                    {testingId === conn.id ? 'Testing Endpoint...' : 'Test Connection'}
                  </button>

                  <button
                    onClick={() => onToggleStatus(conn.id)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all ${
                      isConnected
                        ? 'bg-zinc-800 hover:bg-rose-950/40 text-zinc-300 hover:text-rose-300 border border-zinc-700'
                        : 'bg-zinc-100 hover:bg-white text-zinc-950 shadow-sm'
                    }`}
                  >
                    {isConnected ? 'Disconnect' : 'Connect Now'}
                  </button>
                </div>

                {testResult[conn.id] && (
                  <div className="p-1.5 bg-zinc-950 rounded-xl text-[10px] font-mono text-emerald-400 border border-zinc-800">
                    {testResult[conn.id]}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Connector Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl p-5 text-zinc-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Plug className="w-4 h-4 text-emerald-400" />
                Add New Connector or Plugin Endpoint
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Connector Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Stripe Payment Webhook"
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
                  <option value="development">Development</option>
                  <option value="ai">AI Engine</option>
                  <option value="backend">Backend & DB</option>
                  <option value="productivity">Productivity</option>
                  <option value="communication">Communication</option>
                  <option value="automation">Automation</option>
                  <option value="cloud">Cloud Infrastructure</option>
                  <option value="creation">Creation Tools</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Auth Type</label>
                <select
                  value={authType}
                  onChange={(e: any) => setAuthType(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600 font-mono"
                >
                  <option value="oauth">OAuth 2.0 (Sign in & Authorize)</option>
                  <option value="api_key">API Key / Bearer Token</option>
                  <option value="google_signin">Google Sign-In</option>
                  <option value="webhook">Incoming / Outgoing Webhook</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Service capabilities and purpose..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600"
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
                  Save & Authorize Connector
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
