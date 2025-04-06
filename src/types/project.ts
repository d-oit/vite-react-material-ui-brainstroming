import type { Node, Edge } from './models';

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
    isArchived: false
  };
}

export function isValidProject(project: unknown): project is Project {
  return (
    typeof project === 'object' &&
    project !== null &&
    'id' in project &&
    'name' in project &&
    'nodes' in project &&
    'edges' in project &&
    'version' in project &&
    typeof (project as Project).version === 'number'
  );
}

export function normalizeProjectVersion(version: string | number): number {
  if (typeof version === 'string') {
    // Convert semantic version to number (e.g., "1.0.0" -> 1)
    const match = /^(\d+)/.exec(version);
    return match ? Number(match[1]) : DEFAULT_PROJECT_VERSION;
  }
  return version;
}