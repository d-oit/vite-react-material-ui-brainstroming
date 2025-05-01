// Base types
// Enums
import { NodeType, EdgeType, ThemeMode, LogLevel, LogCategory, NodeSize, ConnectionMode, PanelPosition, NODE_TYPES } from './enums'

export type {
	NodeData,
	Node,
	Edge,
	Settings,
	LogEntry,
	NetworkStatus,
	NodePreferences,
	UserPreferences,
} from './models'

// Chat types
export type { ChatMessage, NodeSuggestion, ChatSuggestion } from './chat'

export { createNodeSuggestionFromNodeData, createNodeDataFromSuggestion } from './chat'

// Project types
export type { Project } from './project'

export { createEmptyProject, isValidProject, normalizeProjectVersion, DEFAULT_PROJECT_VERSION } from './project'

// Flow types
export type {
	NodeChange,
	EdgeChange,
	Connection,
	OnConnectStartParams,
	ReactFlowInstance,
	FlowCallbacks,
	FlowProps,
	FlowPanelProps,
} from './flow'

// Test utilities
export type {
	MockResizeObserver,
	MockStorage,
	MockNetworkStatus,
	TestNodeData,
	TestNode,
	TestProject,
} from './test-utils'

export {
	createTestNode,
	createTestEdge,
	createTestProject,
	createMockResizeObserver,
	createMockStorage,
	createMockNetworkStatus,
} from './test-utils'

// Version utilities
export { normalizeVersion, formatVersion, isValidVersion, DEFAULT_VERSION } from '../utils/version'

export { NodeType, EdgeType, ThemeMode, LogLevel, LogCategory, NodeSize, ConnectionMode, PanelPosition, NODE_TYPES }

// Constants
export const NodeColors: Record<NodeType, string> = {
	[NodeType.IDEA]: '#e3f2fd',
	[NodeType.TASK]: '#e8f5e9',
	[NodeType.NOTE]: '#fff8e1',
	[NodeType.RESOURCE]: '#f3e5f5',
} as const

export const NodeSizeConfig = {
	[NodeSize.SMALL]: { width: 150, fontSize: 12, chipSize: 'small' as const },
	[NodeSize.MEDIUM]: { width: 200, fontSize: 14, chipSize: 'medium' as const },
	[NodeSize.LARGE]: { width: 300, fontSize: 16, chipSize: 'medium' as const },
} as const

export const FlowConfig = {
	connectionMode: ConnectionMode.LOOSE,
	panelPosition: PanelPosition.CENTER,
	snapToGrid: true,
	snapGrid: [15, 15],
	defaultZoom: 1,
	minZoom: 0.5,
	maxZoom: 2,
} as const
