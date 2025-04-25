import { FullscreenExit as FullscreenExitIcon, Save as SaveIcon } from '@mui/icons-material'
import { Box, IconButton, Menu, MenuItem, Typography, Divider, Slider, useTheme, Button } from '@mui/material'
import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react'
import type {
	ReactFlowInstance,
	Connection,
	Node as ReactFlowNode,
	Edge as ReactFlowEdge,
	NodeProps,
	NodeChange,
	NodeDragHandler,
	EdgeChange,
	NodeMouseHandler,
	Viewport,
	OnMove,
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
import { useDebouncedCallback } from 'use-debounce'
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
import EnhancedZoomControls from './EnhancedZoomControls'
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

// Removed redundant interface as it's likely defined in NodeEditDialog component

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
		updateNodePositions,
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
	const [nodeSpacing, setNodeSpacing] = useState(50)
	const { settings } = useSettings()

	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const isAutosaveEnabled = settings?.autoSave ?? false

	// Function to save the current state
	const saveCurrentState = useCallback(() => {
		if (!onSave) return

		setIsSaving(true)
		try {
			onSave(storeNodes, storeEdges)
			setHasUnsavedChanges(false)
		} catch (error) {
			console.error('Error saving brainstorm:', error)
		} finally {
			setTimeout(() => setIsSaving(false), 500) // Show saving indicator briefly
		}
	}, [onSave, storeNodes, storeEdges])

	// Debounced save function for manual saves only
	const debouncedSave = useDebouncedCallback(saveCurrentState, 1500)

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
			// Batch node changes
			setNodes((currentNodes) => {
				const updatedNodes = applyNodeChanges(changes, currentNodes)
				// Ensure proper type conversion for each node
				return updatedNodes.map((node) => ({
					...node,
					type: node.type as NodeType,
					data: {
						...node.data,
						type: node.type as NodeType,
						updatedAt: new Date().toISOString(),
					},
				})) as CustomNodeType[]
			})
			setHasUnsavedChanges(true)
		},
		[setNodes],
	)

	const onEdgesChange = useCallback(
		(changes: EdgeChange[]) => {
			// Batch edge changes
			setEdges((currentEdges) => {
				const updatedEdges = applyEdgeChanges(changes, currentEdges)
				return updatedEdges.map((edge) => ({
					...edge,
					type: (edge.type as EdgeType) ?? EdgeType.DEFAULT,
				})) as CustomEdge[]
			})
			setHasUnsavedChanges(true)
		},
		[setEdges],
	)

	const onConnect = useCallback((connection: Connection) => {
		setEdges((currentEdges) => {
			const edge = {
				...connection,
				type: EdgeType.DEFAULT,
				id: `e${connection.source}-${connection.target}`,
			}
			return addEdge(edge, currentEdges) as CustomEdge[]
		})
		setHasUnsavedChanges(true)
	}, [setEdges])

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
			setHasUnsavedChanges(true)
			if (isAutosaveEnabled === true && onSave) {
				debouncedSave()
			}
		},
		[updateNodeData, isAutosaveEnabled, onSave, debouncedSave],
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
			setHasUnsavedChanges(true)
			if (isAutosaveEnabled === true && onSave) {
				debouncedSave()
			}
		}
	}, [selectedNode, removeNode, isAutosaveEnabled, onSave, debouncedSave])

	// Only set initial nodes/edges if the store is empty
	useEffect(() => {
		if ((initialNodes?.length > 0 || initialEdges?.length > 0) && storeNodes.length === 0) {
			// Convert and set initial nodes with proper type information
			const convertedNodes = initialNodes.map((node) => ({
				...node,
				type: node.type as NodeType,
				data: {
					...node.data,
					type: node.type as NodeType,
					updatedAt: node.data?.updatedAt ?? new Date().toISOString(),
				},
			})) as CustomNodeType[]

			const convertedEdges = initialEdges.map((edge) => ({
				...edge,
				type: (edge.type as EdgeType) ?? EdgeType.DEFAULT,
			})) as CustomEdge[]

			setNodes(convertedNodes)
			setEdges(convertedEdges)
		}
	}, [initialNodes, initialEdges, setNodes, setEdges, storeNodes.length])

	const handleViewportChange = useCallback<OnMove>((event, viewport) => {
		setViewport(viewport)
	}, [])

	const onNodeDragStop: NodeDragHandler = useCallback((event, node, nodes) => {
		// Update positions of all dragged nodes
		const updatedNodes = nodes
			.filter((n) => n.dragging)
			.map((n) => ({
				id: n.id,
				position: n.position,
			}))
		if (updatedNodes.length > 0) {
			updateNodePositions(updatedNodes)
		}
	}, [updateNodePositions])

	// Add auto-layout handler with proper type conversion
	const handleAutoLayout = useCallback(() => {
		if (reactFlowInstance) {
			const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
				storeNodes,
				storeEdges,
				{ direction: 'TB', spacing: nodeSpacing },
			)
			setNodes(layoutedNodes.map((node) => ({
				...node,
				type: node.type as NodeType,
			})) as CustomNodeType[])
			setEdges(layoutedEdges.map((edge) => ({
				...edge,
				type: (edge.type as EdgeType) ?? EdgeType.DEFAULT,
			})) as CustomEdge[])
			setTimeout(() => reactFlowInstance.fitView(), 50)
		}
	}, [reactFlowInstance, storeNodes, storeEdges, nodeSpacing, setNodes, setEdges])

	// Initialize keyboard shortcuts
	useKeyboardShortcuts({ reactFlowInstance, saveCurrentState, removeNode, nodeSpacing })

	return (
		<div
			ref={flowRef}
			className={`flow-container ${isFullscreen ? 'fullscreen' : ''}`}
			style={{
				width: '100%',
				height: isFullscreen ? '100vh' : '80vh',
				minHeight: '500px',
				display: 'flex',
				flexDirection: 'column',
				position: 'relative',
			}}
			onMouseMove={handleMouseMove}>
			<EnhancedZoomControls
				zoomIn={() => reactFlowInstance?.zoomIn()}
				zoomOut={() => reactFlowInstance?.zoomOut()}
				fitView={() => reactFlowInstance?.fitView()}
				zoomLevel={viewport.zoom}
				onZoomChange={(zoom) => reactFlowInstance?.setViewport({ x: viewport.x, y: viewport.y, zoom })}
				showGrid={showGrid}
				onToggleGrid={() => setShowGrid(!showGrid)}
				isFullscreen={isFullscreen}
				onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
			/>
			<ReactFlow
				nodes={nodesWithHandlers}
				edges={storeEdges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				onNodeDragStop={onNodeDragStop}
				onInit={(instance: ReactFlowInstance) => setReactFlowInstance(instance)}
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

				<Box
					sx={{
						position: 'absolute',
						bottom: 20,
						right: 20,
						zIndex: 5,
					}}
				>
					<EnhancedMiniMap
						zoomable
						pannable
						onNodeClick={handleEditNode}
						style={{
							backgroundColor: theme.palette.background.paper,
							border: `1px solid ${theme.palette.divider}`,
							width: 160,
							height: 120,
							borderRadius: 4
						}}
					/>
				</Box>

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
	)
}
