import type { ReactNode } from 'react';

export type NodeType = 'idea' | 'group' | 'connection';

export interface NodePosition {
  x: number;
  y: number;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  structure: BrainstormNode[];
  version: string;
  created: Date;
  modified: Date;
}

export interface BrainstormNode {
  id: string;
  type: NodeType;
  content: string;
  position?: NodePosition;
  parentId?: string;
  children?: string[];
  tags?: string[];
  color?: string;
}

export interface BrainstormHistoryEntry {
  timestamp: Date;
  type: 'create' | 'update' | 'delete' | 'move' | 'connect';
  nodeId: string;
  data: Partial<BrainstormNode>;
}

export interface BrainstormSession {
  id: string;
  projectId: string;
  templateId: string;
  nodes: BrainstormNode[];
  history: BrainstormHistoryEntry[];
  created: Date;
  modified: Date;
  isQuick: boolean;
}

export interface BrainstormingProps {
  projectId: string;
  session?: BrainstormSession | null;
  onSave?: (session: BrainstormSession) => Promise<void>;
  onClose?: () => void;
  children?: ReactNode;
}

export interface QuickBrainstormProps extends Omit<BrainstormingProps, 'projectId' | 'session'> {
  onConvert?: (session: BrainstormSession) => Promise<void>;
}

export interface LLMChatPanelProps {
  projectId: string;
  session?: BrainstormSession | null;
  onInsightGenerated: (insight: BrainstormNode) => void;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}