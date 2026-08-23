import { Project, MemoryItem, Workflow, ExecutionLog, ChatMessage, LessonLearned, Connector } from '../types';

export interface ProjectExportData {
  schemaVersion: string;
  exportedAt: string;
  system: string;
  project: {
    id: string;
    name: string;
    objective: string;
    targetUsers: string;
    status: string;
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
  };
  memory: {
    totalItems: number;
    layers: Record<string, MemoryItem[]>;
    items: MemoryItem[];
  };
  commandHistory: {
    totalLogs: number;
    executionLogs: ExecutionLog[];
    chatMessages?: ChatMessage[];
  };
  workflowConfiguration: {
    totalWorkflows: number;
    workflows: Workflow[];
  };
  lessonsLearned: {
    totalLessons: number;
    lessons: LessonLearned[];
  };
  connectors?: {
    totalConnectors: number;
    activeConnectors: Connector[];
  };
}

/**
 * Exports the active project's memory, command history, and current workflow configuration as a formatted JSON file.
 */
export function exportProjectAsJSON(options: {
  project: Project;
  memoryItems?: MemoryItem[];
  workflows?: Workflow[];
  logs?: ExecutionLog[];
  messages?: ChatMessage[];
  lessons?: LessonLearned[];
  connectors?: Connector[];
}): { filename: string; data: ProjectExportData } {
  const {
    project,
    memoryItems = [],
    workflows = [],
    logs = [],
    messages = [],
    lessons = [],
    connectors = [],
  } = options;

  // Filter memory items for this project (or universal core items)
  const projectMemory = memoryItems.filter(
    (item) => !item.projectId || item.projectId === project.id || project.id === 'proj-core'
  );

  // Group memory items by layer
  const memoryLayers: Record<string, MemoryItem[]> = {};
  projectMemory.forEach((item) => {
    if (!memoryLayers[item.layer]) {
      memoryLayers[item.layer] = [];
    }
    memoryLayers[item.layer].push(item);
  });

  // Filter workflows relevant to project
  const projectWorkflows = workflows.filter(
    (w) =>
      project.projectWorkflows?.some((pw) => pw.toLowerCase() === w.name.toLowerCase() || pw === w.id) ||
      project.id === 'proj-core' ||
      workflows.length <= 4
  );

  // Filter logs for this project
  const projectLogs = logs.filter(
    (l) => !l.project || l.project === project.name || l.project === 'Core Agent' || project.id === 'proj-core'
  );

  // Filter lessons for this project
  const projectLessons = lessons.filter(
    (les) => !les.projectId || les.projectId === project.id || project.id === 'proj-core'
  );

  const exportPayload: ProjectExportData = {
    schemaVersion: '2.4.0',
    exportedAt: new Date().toISOString(),
    system: 'Universal AI Operations OS (HQ)',
    project: {
      id: project.id,
      name: project.name,
      objective: project.objective,
      targetUsers: project.targetUsers,
      status: project.status,
      inheritedCoreCapabilities: project.inheritedCoreCapabilities || [],
      projectWorkflows: project.projectWorkflows || [],
      projectTools: project.projectTools || [],
      projectRules: project.projectRules || [],
      createdAt: project.createdAt,
      kpis: project.kpis,
    },
    memory: {
      totalItems: projectMemory.length,
      layers: memoryLayers,
      items: projectMemory,
    },
    commandHistory: {
      totalLogs: projectLogs.length,
      executionLogs: projectLogs,
      chatMessages: messages,
    },
    workflowConfiguration: {
      totalWorkflows: projectWorkflows.length,
      workflows: projectWorkflows,
    },
    lessonsLearned: {
      totalLessons: projectLessons.length,
      lessons: projectLessons,
    },
    connectors: {
      totalConnectors: connectors.length,
      activeConnectors: connectors,
    },
  };

  const cleanName = project.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${cleanName || 'project'}-export-${timestamp}.json`;

  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', url);
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  URL.revokeObjectURL(url);

  return { filename, data: exportPayload };
}
