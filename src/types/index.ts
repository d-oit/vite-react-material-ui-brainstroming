// Project Types
export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  version: string;
  nodes: Node[];
  edges: Edge[];
}

// Node Types
export interface Node {
  id: string;
  type: NodeType;
  position: Position;
  data: NodeData;
}

export enum NodeType {
  IDEA = 'idea',
  TASK = 'task',
  NOTE = 'note',
  RESOURCE = 'resource',
}

export interface Position {
  x: number;
  y: number;
}

export interface NodeData {
  label: string;
  content: string;
  color?: string;
  tags?: string[];
}

// Edge Types
export interface Edge {
  id: string;
  source: string;
  target: string;
  type?: EdgeType;
  label?: string;
}

export enum EdgeType {
  DEFAULT = 'default',
  STRAIGHT = 'straight',
  STEP = 'step',
  SMOOTHSTEP = 'smoothstep',
  BEZIER = 'bezier',
}

// Theme Types
export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

// Chat Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// User Preferences
export interface UserPreferences {
  themeMode: ThemeMode;
  autoSave: boolean;
  autoBackup: boolean;
  fontSize: number;
  language: string;
}
