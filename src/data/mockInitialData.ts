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
  CommandTemplate
} from '../types';

export const initialUserProfile: UserProfile = {
  name: "Operations Lead",
  communicationPreference: "concise",
  technicalLevel: "advanced",
  autonomyLevel: "full_autonomy",
  decisionStyle: "execute_first",
  executionSpeed: "fast",
  preferredTools: ["n8n", "GitHub", "Supabase", "Gemini 3.6 Flash", "Telegram", "Vercel"],
  dislikedTools: ["manual CSV imports", "unnecessary wizard steps"],
  dislikedUIPatterns: ["nested modal inside modal", "hidden action buttons"],
  repeatedApprovals: ["Auto-fix lint errors", "Deploy preview on PR", "Save lessons learned on bug fix"],
  workingPatterns: ["Prefers 1-sentence action summary before execution", "Requires verification step after deployments"],
  bio: "Lead Systems Architect & Product Manager operating across multiple automated web projects."
};

export const initialMemoryItems: MemoryItem[] = [
  {
    id: 'mem-1',
    layer: 'user',
    title: 'User Communication Preference',
    content: 'User prefers concise, direct summaries with 1-sentence action descriptions. Avoid conversational filler or marketing fluff.',
    tags: ['preferences', 'communication', 'style'],
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-08T12:00:00Z',
    confidence: 100,
    verified: true
  },
  {
    id: 'mem-2',
    layer: 'behavioral',
    title: 'Autonomous Execution Pattern',
    content: 'Default strategy is "Inspect -> Plan -> Implement -> Test -> Verify". User approved auto-executing safe code fixes without prior permission.',
    tags: ['autonomy', 'execution', 'pattern'],
    createdAt: '2026-08-02T14:30:00Z',
    updatedAt: '2026-08-07T09:15:00Z',
    confidence: 95,
    verified: true
  },
  {
    id: 'mem-3',
    layer: 'technical',
    title: 'ARCHITECTURE v1.0 LOCKED (Provider-Agnostic AI COO)',
    content: 'Rule: n8n is a tool/execution engine, not the agent; Gemini is a default model provider, not the agent identity. Architecture: Core Agent (Identity, Memory, Rules) -> Tool Gateway -> (GitHub, Supabase, n8n, Cloud Run). Execution loop: Understand -> Inspect -> Decide -> Execute -> Verify -> Report.',
    tags: ['architecture', 'locked', 'core-agent', 'ai-coo'],
    createdAt: '2026-08-08T20:00:00Z',
    updatedAt: '2026-08-08T21:20:00Z',
    confidence: 100,
    verified: true
  },
  {
    id: 'mem-4',
    layer: 'lessons_learned',
    title: 'Express Port & Host Binding in Cloud Run Containers',
    content: 'Port must strictly bind to 3000 and host 0.0.0.0. Do not attempt to override PORT variable.',
    tags: ['express', 'port', 'cloud-run', 'deployment'],
    createdAt: '2026-08-04T16:20:00Z',
    updatedAt: '2026-08-06T18:00:00Z',
    confidence: 100,
    verified: true
  },
  {
    id: 'mem-5',
    layer: 'episodic',
    title: 'Automated GitHub CI/CD Pipeline Setup',
    content: 'Configured automated testing and deployment for E-Commerce project. Verified build step passes in 1.4s.',
    tags: ['github', 'ci-cd', 'history'],
    projectId: 'proj-1',
    createdAt: '2026-08-05T11:00:00Z',
    updatedAt: '2026-08-05T11:00:00Z',
    confidence: 90,
    verified: true
  },
  {
    id: 'mem-6',
    layer: 'project',
    title: 'Core AI Operations Agent Scope',
    content: 'Reusable AI OS containing memory, user profile, adaptive behavior, n8n automation engine, connector hub, and project inheritance layer.',
    tags: ['core', 'scope', 'architecture'],
    projectId: 'proj-0',
    createdAt: '2026-08-08T10:00:00Z',
    updatedAt: '2026-08-08T18:00:00Z',
    confidence: 100,
    verified: true
  }
];

export const initialConnectors: Connector[] = [
  {
    id: 'conn-github',
    name: 'GitHub Repository Manager',
    category: 'development',
    description: 'Inspect repositories, create PRs, commit code edits, manage issues and trigger CI/CD workflows.',
    iconName: 'Github',
    status: 'connected',
    authType: 'oauth',
    capabilities: ['read_repos', 'write_code', 'create_prs', 'manage_actions'],
    lastVerified: '2026-08-08T19:30:00Z'
  },
  {
    id: 'conn-gemini',
    name: 'Google Gemini 3.6 Flash Engine',
    category: 'ai',
    description: 'Server-side native AI reasoning engine for fast analysis, code generation, and task routing.',
    iconName: 'Sparkles',
    status: 'connected',
    authType: 'api_key',
    capabilities: ['generate_content', 'chat_stream', 'structured_json', 'function_calling', 'grounding'],
    lastVerified: '2026-08-08T20:00:00Z'
  },
  {
    id: 'conn-n8n',
    name: 'n8n Automation Orchestrator',
    category: 'automation',
    description: 'Self-hosted modular workflow automation engine connecting webhooks, queues, and external APIs.',
    iconName: 'Workflow',
    status: 'connected',
    authType: 'api_key',
    capabilities: ['trigger_workflows', 'listen_webhooks', 'node_execution', 'error_handling'],
    lastVerified: '2026-08-08T18:45:00Z'
  },
  {
    id: 'conn-supabase',
    name: 'Supabase Cloud Database',
    category: 'backend',
    description: 'PostgreSQL database with real-time subscriptions, row level security, and vector embeddings storage.',
    iconName: 'Database',
    status: 'connected',
    authType: 'oauth',
    capabilities: ['relational_db', 'vector_search', 'realtime_events', 'auth_management'],
    lastVerified: '2026-08-08T17:10:00Z'
  },
  {
    id: 'conn-telegram',
    name: 'Telegram Command Center Bot',
    category: 'communication',
    description: 'Operational command center bot sending status updates, execution alerts, and receiving natural language commands.',
    iconName: 'MessageSquare',
    status: 'connected',
    authType: 'api_key',
    capabilities: ['receive_commands', 'send_alerts', 'interactive_buttons', 'report_delivery'],
    lastVerified: '2026-08-08T19:50:00Z'
  },
  {
    id: 'conn-gdrive',
    name: 'Google Workspace (Drive / Docs / Sheets)',
    category: 'productivity',
    description: 'Store documents, update tracking spreadsheets, generate reports, and manage team knowledge base.',
    iconName: 'Folder',
    status: 'authorized',
    authType: 'google_signin',
    capabilities: ['read_docs', 'update_sheets', 'file_storage'],
    lastVerified: '2026-08-07T14:20:00Z'
  },
  {
    id: 'conn-vercel',
    name: 'Vercel Deployment Engine',
    category: 'cloud',
    description: 'Instant edge deployment for frontend SPAs, preview environments, and custom domains.',
    iconName: 'Cloud',
    status: 'authorized',
    authType: 'oauth',
    capabilities: ['deploy_preview', 'promote_prod', 'domain_management'],
    lastVerified: '2026-08-06T12:00:00Z'
  },
  {
    id: 'conn-ollama',
    name: 'Ollama Local AI Models',
    category: 'ai',
    description: 'Zero-cost offline local model runner for sensitive data processing and lightweight fallbacks.',
    iconName: 'Cpu',
    status: 'discovering',
    authType: 'api_key',
    capabilities: ['local_inference', 'offline_mode', 'zero_cost'],
    lastVerified: '2026-08-08T09:00:00Z'
  }
];

export const initialWorkflows: Workflow[] = [
  {
    id: 'wf-1',
    name: 'Daily System HQ Health & Lead Digest',
    description: 'Cron trigger every morning at 08:00 AM. Scans active projects, checks API health, summarizes failed runs, and delivers Telegram report.',
    triggerType: 'schedule',
    active: true,
    lastRun: '2026-08-08T08:00:00Z',
    lastStatus: 'success',
    runCount: 42,
    nodes: [
      { id: 'n1', type: 'trigger', label: 'Cron Trigger (Daily 8:00 AM)', description: 'Schedule timer', config: { cron: '0 8 * * *' }, status: 'success' },
      { id: 'n2', type: 'connector', label: 'Inspect Active Projects (Supabase)', description: 'Fetch KPIs & status', config: { table: 'projects' }, status: 'success' },
      { id: 'n3', type: 'ai_agent', label: 'Gemini Summary Engine', description: 'Synthesize health report & actionable risks', config: { model: 'gemini-3.6-flash' }, status: 'success' },
      { id: 'n4', type: 'connector', label: 'Send Telegram HQ Notification', description: 'Deliver formatted message', config: { channel: 'hq_chat' }, status: 'success' }
    ],
    connections: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3' },
      { from: 'n3', to: 'n4' }
    ]
  },
  {
    id: 'wf-2',
    name: 'GitHub PR Code Review & Auto-Test Pipeline',
    description: 'Webhook trigger on new Pull Request. Runs linter, inspects modified files against Lessons Learned, and posts review comments.',
    triggerType: 'webhook',
    active: true,
    lastRun: '2026-08-08T15:30:00Z',
    lastStatus: 'success',
    runCount: 128,
    nodes: [
      { id: 'n1', type: 'trigger', label: 'GitHub PR Webhook', description: 'Event: pull_request.opened', config: { repo: 'org/app' }, status: 'success' },
      { id: 'n2', type: 'code', label: 'Extract Diff & Changed Files', description: 'Parse git diff', config: { maxFiles: 15 }, status: 'success' },
      { id: 'n3', type: 'connector', label: 'Retrieve Lessons Learned Memory', description: 'Query memory for past fixes', config: { tags: ['code-review'] }, status: 'success' },
      { id: 'n4', type: 'ai_agent', label: 'Coding Agent Security & Quality Audit', description: 'Review code using Gemini Pro', config: { model: 'gemini-3.1-pro-preview' }, status: 'success' },
      { id: 'n5', type: 'connector', label: 'Post PR Comment & Status Check', description: 'GitHub API response', config: { postApproval: true }, status: 'success' }
    ],
    connections: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3' },
      { from: 'n3', to: 'n4' },
      { from: 'n4', to: 'n5' }
    ]
  },
  {
    id: 'wf-3',
    name: 'Automated Error Diagnostic & Self-Fix Engine',
    description: 'Listens for system error webhooks. Diagnoses root cause, searches Lessons Learned, generates minimal safe patch, and records outcome.',
    triggerType: 'event',
    active: true,
    lastRun: '2026-08-07T22:15:00Z',
    lastStatus: 'success',
    runCount: 19,
    nodes: [
      { id: 'n1', type: 'trigger', label: 'System Error Listener', description: 'Catches runtime exceptions', config: { minLevel: 'ERROR' }, status: 'idle' },
      { id: 'n2', type: 'ai_agent', label: 'Root Cause Diagnoser', description: '6-step diagnostic protocol', config: { protocol: 'Diagnose->Verify->Fix->Test' }, status: 'idle' },
      { id: 'n3', type: 'condition', label: 'Known Solution in Memory?', description: 'Branch logic', config: {}, status: 'idle' },
      { id: 'n4', type: 'code', label: 'Apply Minimal Safe Patch', description: 'Surgical code update', config: {}, status: 'idle' },
      { id: 'n5', type: 'connector', label: 'Record Lesson Learned', description: 'Save to persistent memory', config: {}, status: 'idle' }
    ],
    connections: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3' },
      { from: 'n3', to: 'n4', conditionLabel: 'Yes' },
      { from: 'n4', to: 'n5' }
    ]
  }
];

export const initialProjects: Project[] = [
  {
    id: 'proj-0',
    name: 'Core Operations HQ',
    objective: 'Central management platform for reusable memory, plugin connections, user profile, and master task routing.',
    targetUsers: 'AI Agent Operator & System Owner',
    status: 'active',
    inheritedCoreCapabilities: [
      'Multi-Layer Memory System',
      'User Behavioral Profile',
      'n8n Workflow Engine',
      'Universal Connector Hub',
      'Self-Improvement Diagnostic Engine',
      'Telegram Operational Chat Command'
    ],
    projectWorkflows: ['wf-1', 'wf-3'],
    projectTools: ['GitHub', 'Gemini 3.6 Flash', 'n8n', 'Supabase', 'Telegram'],
    projectRules: [
      'ARCHITECTURE v1.0 LOCKED: n8n is a tool, not the agent; Gemini is a provider, not the agent',
      'Core Agent remains provider-agnostic & unchanged across projects',
      'Store all verified fixes into Lessons Learned database',
      'Keep output concise and scannable by default'
    ],
    createdAt: '2026-08-01T00:00:00Z',
    kpis: {
      tasksCompleted: 142,
      automationsActive: 3,
      lessonsRecorded: 18
    }
  },
  {
    id: 'proj-1',
    name: 'SaaS Customer Lead & Growth Engine',
    objective: 'Automated lead acquisition, enrichment via web APIs, qualification scoring, and direct CRM sync.',
    targetUsers: 'B2B Growth & Sales Team',
    status: 'active',
    inheritedCoreCapabilities: [
      'Multi-Layer Memory System',
      'Gemini Reasoning Engine',
      'Universal Connector Hub'
    ],
    projectWorkflows: ['wf-1'],
    projectTools: ['n8n', 'Airtable', 'SendGrid', 'Gemini 3.6 Flash'],
    projectRules: [
      'Score leads from 0 to 100 based on company size and stack',
      'Never send email without double verification'
    ],
    createdAt: '2026-08-04T12:00:00Z',
    kpis: {
      tasksCompleted: 89,
      automationsActive: 2,
      lessonsRecorded: 6
    }
  },
  {
    id: 'proj-2',
    name: 'Smart Content & Social Publishing Hub',
    objective: 'Generate technical articles, create social media assets, auto-format markdown, and publish via webhooks.',
    targetUsers: 'Content Creators & Marketing Lead',
    status: 'planning',
    inheritedCoreCapabilities: [
      'Multi-Layer Memory System',
      'Creative Execution Engine',
      'Gemini Vision & Image Generation'
    ],
    projectWorkflows: [],
    projectTools: ['Notion', 'Gemini 3.1 Flash Image', 'Vercel'],
    projectRules: [
      'Maintain authoritative, professional tone',
      'Always include code examples with proper syntax highlighting'
    ],
    createdAt: '2026-08-07T09:00:00Z',
    kpis: {
      tasksCompleted: 14,
      automationsActive: 0,
      lessonsRecorded: 2
    }
  }
];

export const initialLessonsLearned: LessonLearned[] = [
  {
    id: 'les-1',
    problem: 'Cloud Run Express server failing startup health check on port 8080.',
    rootCause: 'Hardcoded port configuration mismatch with infrastructure proxy layer.',
    verifiedSolution: 'Always bind Express server to port 3000 and host 0.0.0.0. Use process.env.PORT only if provided, defaulting to 3000.',
    category: 'deployment',
    recordedAt: '2026-08-02T11:00:00Z',
    timesApplied: 14,
    projectId: 'proj-0'
  },
  {
    id: 'les-2',
    problem: 'React state mismatch during async streaming content updates causing visual flickering.',
    rootCause: 'Updating state inside unmemoized loops without functional state update handlers.',
    verifiedSolution: 'Use functional setState `setMessages(prev => [...prev, newChunk])` or buffered chunk batching every 100ms.',
    category: 'coding',
    recordedAt: '2026-08-04T15:30:00Z',
    timesApplied: 22,
    projectId: 'proj-0'
  },
  {
    id: 'les-3',
    problem: 'n8n Webhook node returning 401 Unauthorized during automated Telegram payload delivery.',
    rootCause: 'Header Authorization header missing `Bearer ` prefix.',
    verifiedSolution: 'Format authorization header explicitly as `Bearer ${N8N_API_KEY}` in outgoing HTTP Request nodes.',
    category: 'workflow',
    recordedAt: '2026-08-06T09:45:00Z',
    timesApplied: 9,
    projectId: 'proj-1'
  }
];

export const initialAIModels: AIModelOption[] = [
  {
    id: 'gemini-3.6-flash',
    name: 'Google Gemini 3.6 Flash (Default)',
    provider: 'Gemini',
    recommendedFor: 'Fast reasoning, general operations, chat command center, workflow orchestration',
    isLocal: false,
    active: true,
    speed: 'Ultra Fast'
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Google Gemini 3.1 Pro Preview',
    provider: 'Gemini',
    recommendedFor: 'Complex code generation, deep architectural analysis, advanced logic reasoning',
    isLocal: false,
    active: false,
    speed: 'High Precision'
  },
  {
    id: 'ollama-llama3',
    name: 'Ollama Llama-3 8B (Local)',
    provider: 'Ollama',
    recommendedFor: 'Zero-cost offline tasks, local privacy processing, simple text operations',
    isLocal: true,
    active: false,
    speed: 'Fast'
  },
  {
    id: 'openai-gpt4o',
    name: 'OpenAI GPT-4o',
    provider: 'OpenAI',
    recommendedFor: 'Secondary cloud model comparison and fallback validation',
    isLocal: false,
    active: false,
    speed: 'Balanced'
  },
  {
    id: 'anthropic-claude-35',
    name: 'Anthropic Claude 3.5 Sonnet',
    provider: 'Anthropic',
    recommendedFor: 'Complex document parsing and creative narrative writing',
    isLocal: false,
    active: false,
    speed: 'Balanced'
  }
];

export const initialExecutionLogs: ExecutionLog[] = [
  {
    id: 'log-101',
    timestamp: '2026-08-08T20:20:00Z',
    action: 'Telegram Operational Command Execution',
    status: 'success',
    details: 'Executed "What\'s happening?" query. Scanned 3 projects, 8 connectors, verified all systems healthy.',
    project: 'Core Operations HQ',
    durationMs: 420
  },
  {
    id: 'log-102',
    timestamp: '2026-08-08T19:50:00Z',
    action: 'Connector Health Check',
    status: 'success',
    details: 'Verified GitHub, Gemini 3.6 Flash, Supabase, n8n, and Telegram endpoints. 100% uptime.',
    project: 'Core Operations HQ',
    durationMs: 210
  },
  {
    id: 'log-103',
    timestamp: '2026-08-08T18:00:00Z',
    action: 'Workflow Studio Execution',
    status: 'success',
    details: 'Workflow "Daily System HQ Health & Lead Digest" completed successfully across 4 nodes.',
    project: 'Core Operations HQ',
    durationMs: 1250
  },
  {
    id: 'log-104',
    timestamp: '2026-08-08T16:15:00Z',
    action: 'Memory Layer Auto-Consolidation',
    status: 'success',
    details: 'Consolidated 2 new behavioral learning preferences into persistent user memory.',
    project: 'Core Operations HQ',
    durationMs: 180
  }
];

export const initialChatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'agent',
    content: 'Welcome to the **Core AI Operations Agent Command Center**. All memory layers, connector channels, and n8n workflow pipelines are active and synchronized.\n\nHow can I assist your operations today?',
    timestamp: '2026-08-08T20:25:00Z',
    thoughtProcess: {
      understand: 'System booted with Core AI Operations Agent configuration.',
      inspect: 'Checked memory bank (6 items), connectors (8 active), workflows (3 ready).',
      decide: 'Present ready status and command options.',
      execute: 'Initialize operational command center view.',
      verify: 'Endpoints responding on port 3000.',
      report: 'System operational.'
    }
  }
];

export const initialCommandTemplates: CommandTemplate[] = [
  {
    id: 'tmpl-1',
    title: 'Daily HQ Health & Status Audit',
    description: 'Inspect all connector endpoints, memory synchronization, and active workflows.',
    prompt: 'Give me today\'s report. Inspect all connector latencies, memory persistence status, and recent error rates.',
    category: 'diagnostics',
    isPinned: true,
    tags: ['daily', 'audit', 'health'],
    usageCount: 42,
    lastUsedAt: '2026-08-21T16:30:00Z'
  },
  {
    id: 'tmpl-2',
    title: 'Run Autonomous Workflow Pipeline',
    description: 'Trigger the multi-step lead enrichment and CRM synchronization workflow.',
    prompt: 'Run the workflow "Daily System HQ Health & Lead Digest" and report node-level execution results.',
    category: 'workflow',
    isPinned: true,
    tags: ['workflow', 'automation', 'crm'],
    usageCount: 28,
    lastUsedAt: '2026-08-21T15:10:00Z'
  },
  {
    id: 'tmpl-3',
    title: 'Roofing Leads Scraping & Enrichment',
    description: 'Scrape, qualify, and score high-intent roofing contractor leads using Outscraper & Gemini.',
    prompt: 'Check the leads. Run Outscraper scrape for {{location}} target niche {{niche}}, qualify with Gemini, and sync top leads to GoHighLevel CRM.',
    category: 'leads',
    isPinned: true,
    tags: ['outscraper', 'leads', 'ghl'],
    usageCount: 35,
    lastUsedAt: '2026-08-21T17:45:00Z',
    variables: [
      { name: 'location', label: 'Target Location', defaultValue: 'Dallas, TX', placeholder: 'City, State' },
      { name: 'niche', label: 'Niche / Specialty', defaultValue: 'Residential Roofing', placeholder: 'Niche' }
    ]
  },
  {
    id: 'tmpl-4',
    title: 'Social Engine Research & Post Generation',
    description: 'Research trending tech/business topics on Tavily and craft multi-platform copy for Postiz.',
    prompt: 'Research trending insights on {{topic}} using Tavily search and generate a multi-platform social batch formatted for Postiz scheduling.',
    category: 'social',
    isPinned: false,
    tags: ['tavily', 'postiz', 'content'],
    usageCount: 19,
    lastUsedAt: '2026-08-20T19:00:00Z',
    variables: [
      { name: 'topic', label: 'Research Topic', defaultValue: 'AI Operations & Autonomous Agents 2026', placeholder: 'Topic' }
    ]
  },
  {
    id: 'tmpl-5',
    title: 'Diagnose & Self-Fix Code Errors',
    description: 'Execute the error remediation protocol: Diagnose -> Verify -> Fix -> Test -> Record Lesson.',
    prompt: 'Fix the error. Review recent execution failures, pinpoint root cause, execute the fix, and register verified solution in the Lessons Learned memory layer.',
    category: 'diagnostics',
    isPinned: true,
    tags: ['self-heal', 'debugging', 'lessons'],
    usageCount: 14,
    lastUsedAt: '2026-08-21T12:20:00Z'
  },
  {
    id: 'tmpl-6',
    title: 'Deploy Project to Production',
    description: 'Validate build artifacts, run security and secrets audit, and trigger deployment pipeline.',
    prompt: 'Deploy this project. Verify container build, check environment secrets audit, and confirm live ingress routing on port 3000.',
    category: 'deployment',
    isPinned: false,
    tags: ['deployment', 'cloud-run', 'ci-cd'],
    usageCount: 8,
    lastUsedAt: '2026-08-19T14:15:00Z'
  }
];
