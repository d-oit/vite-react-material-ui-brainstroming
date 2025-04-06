import type { ReactNode } from 'react';

import { NodeType, EdgeType, ThemeMode, LogLevel, LogCategory, NodeSize } from './enums';

// Basic node types
export interface NodeData {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  color?: string;
  size?: NodeSize;
  type?: NodeType;
  createdAt: string;
  updatedAt: string;
  label?: string; // For backward compatibility
}

export interface Node {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeData & {
    onEdit?: (id: string) => void;
    onDelete?: (id: string, event: React.MouseEvent) => void;
  };
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  type?: EdgeType;
  label?: string;
  animated?: boolean;
}

// Settings and preferences
export interface Settings {
  themeMode: ThemeMode;
  language: string;
  autoSave: boolean;
  autoBackup: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  context: Record<string, unknown>;
  category?: LogCategory;
}

export interface NetworkStatus {
  online: boolean;
  type: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
  signalStrength?: number;
}

export interface NodePreferences {
  defaultSize: NodeSize;
  defaultColorScheme: string;
  nodeSizes: {
    [K in NodeSize]: {
      width: number;
      fontSize: number;
      chipSize: 'small' | 'medium';
    };
  };
  touchOptimized: boolean;
  customColors: Record<NodeType, string>;
}

export interface UserPreferences extends Record<string, unknown> {
  autoSave: boolean;
  autoBackup: boolean;
}

// Component Props
export interface NodeEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: NodeData, type: NodeType) => void;
  initialData: NodeData;
  initialType: NodeType;
}

export interface WithOfflineFallbackProps {
  isOnline: boolean;
  children?: ReactNode;
}

// Re-export enums
export { NodeType, EdgeType, ThemeMode, LogLevel, LogCategory, NodeSize };
