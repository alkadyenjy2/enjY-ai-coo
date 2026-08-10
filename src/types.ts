export type MemoryLayer = 
  | 'short_term'
  | 'project'
  | 'user'
  | 'episodic'
  | 'semantic'
  | 'technical'
  | 'lessons_learned'
  | 'behavioral';

export interface MemoryItem {
  id: string;
  layer: MemoryLayer;
  title: string;
  content: string;
  tags: string[];
  projectId?: string;
  createdAt: string;
  updatedAt: string;
  confidence?: number; // 0-100%
  verified?: boolean;
}

export interface UserProfile {
  name: string;
  communicationPreference: 'concise' | 'detailed' | 'bullet_points';
  technicalLevel: 'beginner' | 'intermediate' | 'advanced' | 'architect';
  autonomyLevel: 'full_autonomy' | 'approval_required' | 'guided_step_by_step';
  decisionStyle: 'execute_first' | 'discuss_first';
  executionSpeed: 'fast' | 'balanced' | 'thorough';
  dislikedTools: string[];
  preferredTools: string[];
  dislikedUIPatterns: string[];
  repeatedApprovals: string[];
  workingPatterns: string[];
  bio?: string;
}

export type ConnectorCategory =
  | 'development'
  | 'ai'
  | 'backend'
  | 'productivity'
  | 'communication'
  | 'automation'
  | 'cloud'
  | 'creation';

export type ConnectorStatus = 'connected' | 'authorized' | 'discovering' | 'disconnected' | 'error';

export interface Connector {
  id: string;
  name: string;
  category: ConnectorCategory;
  description: string;
  iconName: string;
  status: ConnectorStatus;
  authType: 'oauth' | 'api_key' | 'google_signin' | 'webhook';
  capabilities: string[];
  metadata?: Record<string, any>;
  lastVerified?: string;
}

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'ai_agent' | 'connector' | 'condition' | 'code' | 'error_handler';
  label: string;
  description: string;
  config: Record<string, any>;
  status?: 'idle' | 'running' | 'success' | 'failed';
}

export interface WorkflowConnection {
  from: string;
  to: string;
  conditionLabel?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  triggerType: 'webhook' | 'schedule' | 'telegram' | 'event';
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  active: boolean;
  lastRun?: string;
  lastStatus?: 'success' | 'failed' | 'running';
  runCount: number;
}

export interface Project {
  id: string;
  name: string;
  objective: string;
  targetUsers: string;
  status: 'active' | 'planning' | 'paused' | 'completed';
  inheritedCoreCapabilities: string[];
  projectWorkflows: string[];
  projectTools: string[];
  projectRules: string[];
  createdAt: string;
  kpis: {
    tasksCompleted: number;
    automationsActive: number;
    lessonsRecorded: number;
  };
}

export interface LessonLearned {
  id: string;
  problem: string;
  rootCause: string;
  verifiedSolution: string;
  category: 'coding' | 'workflow' | 'api' | 'user_preference' | 'deployment';
  recordedAt: string;
  timesApplied: number;
  projectId?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  thoughtProcess?: {
    understand?: string;
    inspect?: string;
    decide?: string;
    execute?: string;
    verify?: string;
    report?: string;
  };
  actionsTaken?: {
    tool: string;
    status: 'success' | 'warning' | 'error';
    details: string;
  }[];
  category?: 'command' | 'research' | 'code' | 'workflow' | 'report';
}

export interface AIModelOption {
  id: string;
  name: string;
  provider: 'Gemini' | 'Ollama' | 'OpenAI' | 'Anthropic';
  recommendedFor: string;
  isLocal: boolean;
  active: boolean;
  speed: 'Ultra Fast' | 'Fast' | 'Balanced' | 'High Precision';
}

export interface ExecutionLog {
  id: string;
  timestamp: string;
  action: string;
  status: 'success' | 'failed' | 'warning' | 'in_progress';
  details: string;
  project?: string;
  durationMs?: number;
}
