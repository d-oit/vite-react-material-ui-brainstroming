import { FullscreenExit as FullscreenExitIcon } from '@mui/icons-material'
import { Box, IconButton, Menu, MenuItem, Typography, Divider, Slider, useTheme } from '@mui/material'
import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react'
import type {
	ReactFlowInstance,
	Connection,
	Node as ReactFlowNode,
	Edge as ReactFlowEdge,
	NodeProps,
	NodeChange,
	EdgeChange,
	NodeMouseHandler,
	Viewport,
} from 'reactflow'
import ReactFlow, {
	Background,
	Panel,
	addEdge,
	applyNodeChanges,
	applyEdgeChanges,
	useReactFlow,
	ReactFlowProvider,
} from 'reactflow'
import 'reactflow/dist/style.css'

// Project imports
import { useSettings } from '../../contexts/SettingsContext'
import LLMChatPanel from '../../features/brainstorming/LLMChatPanel'
import type { BrainstormNode } from '../../features/brainstorming/types'
import { useBrainstormStore } from '../../store/brainstormStore'
import { NodeType, EdgeType } from '../../types/enums'
import DeleteConfirmationDialog from '../DeleteConfirmationDialog'

// Local Components
import ControlsPanel from './ControlsPanel'
import { EnhancedMiniMap } from './EnhancedMiniMap'
import { FloatingControls } from './FloatingControls'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import NodeEditDialog from './NodeEditDialog'
import CustomNodeComponent from './nodes/CustomNode'
import type { CustomNodeType, CustomEdge, NodeData } from './types'
import { getLayoutedElements } from './utils/autoLayout'

const nodeTypes = {
	[NodeType.IDEA]: CustomNodeComponent,
	[NodeType.TASK]: CustomNodeComponent,
	[NodeType.RESOURCE]: CustomNodeComponent,
	[NodeType.NOTE]: CustomNodeComponent,
}

interface NodeEditDialogProps {
    open: boolean
    onClose: () => void
    initialData: NodeData
    initialType: NodeType
    onSave: (data: Partial<NodeData>, type: NodeType) => void
}

interface EnhancedBrainstormFlowProps {
    initialNodes: CustomNodeType[]
    initialEdges: CustomEdge[]
    projectId: string
    onSave?: (nodes: CustomNodeType[], edges: CustomEdge[]) => void
}

export const EnhancedBrainstormFlow: React.FC<EnhancedBrainstormFlowProps> = ({
	initialNodes,
	initialEdges,
	projectId,
	onSave,
}) => {
	const theme = useTheme()
	const flowRef = useRef<HTMLDivElement>(null)
	const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
	const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 })
	const {
		nodes: storeNodes,
		edges: storeEdges,
		setNodes,
		setEdges,
		updateNodeData,
		toggleArchiveNode,
		removeNode,
	} = useBrainstormStore()

	const [showArchived, setShowArchived] = useState(false)
	const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 100, y: 100 })
	const [showEditDialog, setShowEditDialog] = useState(false)
	const [showDeleteDialog, setShowDeleteDialog] = useState(false)
	const [showChatPanel, setShowChatPanel] = useState(false)
	const [selectedNode, setSelectedNode] = useState<CustomNodeType | null>(null)
	const [isFullscreen, setIsFullscreen] = useState(false)
	const [settingsAnchorEl, setSettingsAnchorEl] = useState<HTMLElement | null>(null)
	const [zoomLevel, setZoomLevel] = useState(1)
	const [showGrid, setShowGrid] = useState(true)
	const { settings } = useSettings()

	const handleInsightGenerated = useCallback((insight: BrainstormNode) => {
		const newNode: CustomNodeType = {
			id: insight.id,
			type: insight.type as NodeType,
			position: insight.position || { x: 0, y: 0 },
			data: {
				id: insight.id,
				type: insight.type as NodeType,
				title: 'Generated Insight',
				content: insight.content,
				label: 'Generated Insight',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				tags: insight.tags || [],
				color: insight.color,
			},
		}
		setNodes((nodes) => [...nodes, newNode])
	}, [setNodes])

	const nodesWithHandlers = useMemo(() => {
		return (storeNodes as CustomNodeType[]).map((node) => ({
			...node,
			data: {
				...node.data,
				onEdit: (id: string): void => handleEditNode(id),
				onDelete: (id: string, event: React.MouseEvent): void =>
					handleDeleteNode(id, event),
				onChat: (id: string): void => handleChatNode(id),
			},
		})).filter((node) => showArchived || !node.data.isArchived)
	}, [storeNodes, showArchived])

	const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
		const bounds = flowRef.current?.getBoundingClientRect()
		if (bounds) {
			setMousePosition({
				x: event.clientX - bounds.left,
				y: event.clientY - bounds.top,
			})
		}
	}, [])

	const onNodesChange = useCallback(
		(changes: NodeChange[]) => {
			setNodes((currentNodes) => {
				const updatedNodes = applyNodeChanges(changes, currentNodes)
				return updatedNodes.map((node) => ({
					...node,
					type: node.type as NodeType,
				})) as CustomNodeType[]
			})
		},
		[setNodes],
	)

	const onEdgesChange = useCallback(
		(changes: EdgeChange[]) => {
			setEdges((currentEdges) => applyEdgeChanges(changes, currentEdges) as CustomEdge[])
		},
		[setEdges],
	)

	const onConnect = useCallback(
		(connection: Connection) => {
			setEdges((currentEdges) => {
				const edge = { ...connection, type: EdgeType.DEFAULT }
				return addEdge(edge, currentEdges) as CustomEdge[]
			})
		},
		[setEdges],
	)

	const handleEditNode = useCallback((nodeId: string): void => {
		const node = nodesWithHandlers.find((n: CustomNodeType) => n.id === nodeId)
		if (node) {
			setSelectedNode(node)
			setShowEditDialog(true)
		}
	}, [nodesWithHandlers])

	const handleDeleteNode = useCallback((nodeId: string, event: React.MouseEvent): void => {
		event.stopPropagation()
		const node = nodesWithHandlers.find((n: CustomNodeType) => n.id === nodeId)
		if (node) {
			setSelectedNode(node)
			setShowDeleteDialog(true)
		}
	}, [nodesWithHandlers])

	const handleChatNode = useCallback((nodeId: string): void => {
		const node = nodesWithHandlers.find((n: CustomNodeType) => n.id === nodeId)
		if (node) {
			setSelectedNode(node)
			setShowChatPanel(true)
		}
	}, [nodesWithHandlers])

	const handleSaveNodeEdit = useCallback(
		(nodeId: string, updates: Partial<NodeData>, type: NodeType) => {
			updateNodeData(nodeId, {
				...updates,
				type,
				updatedAt: new Date().toISOString(),
			})
		},
		[updateNodeData],
	)

	const handleCloseEditDialog = useCallback(() => {
		setShowEditDialog(false)
		setSelectedNode(null)
	}, [])

	const handleConfirmDelete = useCallback(() => {
		if (selectedNode) {
			removeNode(selectedNode.id)
			setShowDeleteDialog(false)
			setSelectedNode(null)
		}
	}, [selectedNode, removeNode])

	useEffect(() => {
		setNodes(initialNodes)
		setEdges(initialEdges)
	}, [initialNodes, initialEdges, setNodes, setEdges])

	const handleViewportChange = useCallback((_: MouseEvent | TouchEvent, viewport: Viewport) => {
		setViewport(viewport)
	}, [])

	return (
		<ReactFlowProvider>
			<div
				ref={flowRef}
				className={`flow-container ${isFullscreen ? 'fullscreen' : ''}`}
				style={{
					width: '100%',
					height: isFullscreen ? '100vh' : '80vh',
					minHeight: '500px',
					display: 'flex',
					flexDirection: 'column',
				}}
				onMouseMove={handleMouseMove}>
				<ReactFlow
					nodes={nodesWithHandlers}
					edges={storeEdges}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onConnect={onConnect}
					onInit={setReactFlowInstance}
					onMove={handleViewportChange}
					nodeTypes={nodeTypes}
					fitView
					minZoom={0.1}
					maxZoom={1.5}
					attributionPosition="bottom-left"
					draggable={true}
					selectionOnDrag={true}
					panOnDrag={true}
					zoomOnScroll={true}
					panOnScroll={false}
					style={{ width: '100%', height: '100%', flex: 1 }}>
					{showGrid && <Background />}

					<FloatingControls
						position={mousePosition}
						showArchived={showArchived}
						onToggleArchived={() => setShowArchived(!showArchived)}
						viewport={viewport}
					/>

					{showEditDialog && selectedNode && (
						<NodeEditDialog
							open={showEditDialog}
							onClose={handleCloseEditDialog}
							initialData={selectedNode.data}
							initialType={selectedNode.type}
							onSave={(data: Partial<NodeData>, type: NodeType) => {
								handleSaveNodeEdit(selectedNode.id, data, type)
								handleCloseEditDialog()
							}}
						/>
					)}

					{showDeleteDialog && selectedNode && (
						<DeleteConfirmationDialog
							open={showDeleteDialog}
							onClose={() => {
								setShowDeleteDialog(false)
								setSelectedNode(null)
							}}
							onConfirm={handleConfirmDelete}
							title="Delete Node"
							message={`Are you sure you want to delete "${selectedNode.data.title}"? This action cannot be undone.`}
						/>
					)}

					{showChatPanel && selectedNode && (
						<LLMChatPanel
							projectId={projectId}
							open={showChatPanel}
							onClose={() => {
								setShowChatPanel(false)
								setSelectedNode(null)
							}}
							onInsightGenerated={handleInsightGenerated}
						/>
					)}
				</ReactFlow>
			</div>
		</ReactFlowProvider>
	)
}
