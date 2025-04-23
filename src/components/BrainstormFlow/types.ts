import type { CSSProperties } from 'react'
import type { Node, Edge } from 'reactflow'

import type { NodeType, EdgeType } from '../../types/enums'

export interface NodeData {
	id: string
	title: string
	content: string
	createdAt: string
	updatedAt: string
	tags?: string[]
	color?: string
	type: NodeType
	label?: string
	onEdit?: (id: string) => void
	onDelete?: (id: string, event: React.MouseEvent) => void
	onChat?: (id: string) => void
}

// Keep ReactFlow's Node type but enforce our NodeType and NodeData
export type CustomNodeType = Omit<Node<NodeData>, 'type'> & {
	type: NodeType
}

// Keep ReactFlow's Edge type but enforce our EdgeType
export type CustomEdge = Omit<Edge, 'type'> & {
	type: EdgeType
}

// Props interface for components
export interface FlowContentProps {
	flowRef: React.RefObject<HTMLDivElement>
	isFullscreen: boolean
	showGrid: boolean
	settings: Record<string, unknown>
	toggleFullscreen: () => Promise<void>
	onSave?: (nodes: Node[], edges: Edge[]) => void
	handleSettingsOpen: (event: React.MouseEvent<HTMLElement>) => void
	toggleGrid: () => void
}

export interface ControlsPanelProps {
	isFullscreen: boolean
	showGrid: boolean
	handleSettingsOpen: (event: React.MouseEvent<HTMLElement>) => void
	toggleGrid: () => void
	toggleFullscreen: () => Promise<void>
	zoomIn: () => void
	zoomOut: () => void
}

export interface EnhancedMiniMapProps {
	nodes: Node[]
	edges: Edge[]
	onNodeClick: (nodeId: string) => void
	onZoomIn?: () => void
	onZoomOut?: () => void
	onFitView?: () => void
	position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}
