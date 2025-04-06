// Node types
export enum NodeType {
  IDEA = 'idea',
  TASK = 'task',
  NOTE = 'note',
  RESOURCE = 'resource',
}

// Edge types
export enum EdgeType {
  DEFAULT = 'default',
  STEP = 'step',
  SMOOTHSTEP = 'smoothstep',
  STRAIGHT = 'straight',
}

// Theme modes
export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical',
}

// Log categories
export enum LogCategory {
  SYSTEM = 'system',
  USER = 'user',
  NETWORK = 'network',
  STORAGE = 'storage',
  SYNC = 'sync',
}

// Node sizes
export enum NodeSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
}

// Connection modes
export enum ConnectionMode {
  STRICT = 'strict',
  LOOSE = 'loose',
}

// Panel positions
export enum PanelPosition {
  TOP = 'top',
  TOP_LEFT = 'top-left',
  TOP_RIGHT = 'top-right',
  BOTTOM = 'bottom',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_RIGHT = 'bottom-right',
  LEFT = 'left',
  RIGHT = 'right',
  CENTER = 'center',
}

// Enum value lists for iteration
export const NODE_TYPES = Object.values(NodeType);
export const EDGE_TYPES = Object.values(EdgeType);
export const NODE_SIZES = Object.values(NodeSize);
export const THEME_MODES = Object.values(ThemeMode);
export const LOG_LEVELS = Object.values(LogLevel);
export const LOG_CATEGORIES = Object.values(LogCategory);
export const CONNECTION_MODES = Object.values(ConnectionMode);
export const PANEL_POSITIONS = Object.values(PanelPosition);
