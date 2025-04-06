import type { Node, Edge } from './models';

export enum ProjectTemplate {
  SOFTWARE_DEVELOPMENT = 'software_development',
  MARKETING_CAMPAIGN = 'marketing_campaign',
  RESEARCH_PROJECT = 'research_project',
  BUSINESS_PLAN = 'business_plan',
  CUSTOM = 'custom',
}

export interface SyncSettings {
  enableS3Sync: boolean;
  syncFrequency: 'manual' | 'onSave' | 'interval';
  intervalMinutes?: number;
  lastSyncedAt?: string;
  s3Path?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
  createdAt: string;
  updatedAt: string;
  version: number;
  isArchived?: boolean;
  currentCommitId?: string;
  commits?: GitCommit[];
  template?: ProjectTemplate;
  syncSettings?: SyncSettings;
  isTemplate?: boolean;
}

export interface GitCommit {
  id: string;
  message: string;
  timestamp: string;
  nodes: Node[];
  edges: Edge[];
  parentId?: string;
}

export interface ProjectHistoryEntry {
  id: string;
  projectId: string;
  action: 'create' | 'update' | 'delete' | 'archive' | 'restore';
  timestamp: string;
  details: Record<string, unknown>;
}

export const DEFAULT_PROJECT_VERSION = 1;

export function createEmptyProject(id: string): Project {
  return {
    id,
    name: 'New Project',
    description: '',
    nodes: [],
    edges: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: DEFAULT_PROJECT_VERSION,
    isArchived: false,
    template: ProjectTemplate.CUSTOM,
    syncSettings: {
      enableS3Sync: false,
      syncFrequency: 'manual',
    },
  };
}

export function isValidProject(project: unknown): project is Project {
  const basicValidation =
    typeof project === 'object' &&
    project !== null &&
    'id' in project &&
    'name' in project &&
    'nodes' in project &&
    'edges' in project &&
    'version' in project &&
    typeof (project as Project).version === 'number';

  if (!basicValidation) return false;

  // Validate template if present
  if ('template' in project && project.template !== undefined) {
    const templateValue = (project as Project).template;
    if (templateValue !== undefined) {
      const validTemplates = Object.values(ProjectTemplate);
      if (!validTemplates.includes(templateValue)) {
        return false;
      }
    }
  }

  // Validate syncSettings if present
  if ('syncSettings' in project && project.syncSettings !== undefined) {
    const syncSettings = (project as Project).syncSettings;
    if (
      typeof syncSettings !== 'object' ||
      syncSettings === null ||
      !('enableS3Sync' in syncSettings) ||
      !('syncFrequency' in syncSettings) ||
      typeof syncSettings.enableS3Sync !== 'boolean' ||
      !['manual', 'onSave', 'interval'].includes(syncSettings.syncFrequency)
    ) {
      return false;
    }
  }

  return true;
}

export function normalizeProjectVersion(version: string | number): number {
  if (typeof version === 'string') {
    // Convert semantic version to number (e.g., "1.0.0" -> 1)
    const match = /^(\d+)/.exec(version);
    return match ? Number(match[1]) : DEFAULT_PROJECT_VERSION;
  }
  return version;
}
