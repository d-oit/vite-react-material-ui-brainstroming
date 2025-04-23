import { FullscreenExit as FullscreenExitIcon } from '@mui/icons-material'
import { Box, IconButton, Menu, MenuItem, Typography, Divider, Slider, useTheme } from '@mui/material'
import React, { useCallback, useRef, useState, useEffect } from 'react'
import type {
	ReactFlowInstance,
	Connection,
	Node as ReactFlowNode,
	Edge as ReactFlowEdge,
	NodeProps,
	NodeChange,
	EdgeChange,
	NodeMouseHandler,
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

interface NodeEditDialogResult {
	title: string
	content: string
	type: NodeType
}

interface EnhancedBrainstormFlowProps {
	initialNodes: CustomNodeType[]
	initialEdges: CustomEdge[]
	onSave?: (nodes: CustomNodeType[], edges: CustomEdge[]) => void
}

export const EnhancedBrainstormFlow: React.FC<EnhancedBrainstormFlowProps> = ({
	initialNodes,
	initialEdges,
	onSave,
}) => {
	const theme = useTheme()
	const flowRef = useRef<HTMLDivElement>(null)
	const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
	const {
		nodes: storeNodes,
		edges: storeEdges,
		setNodes,
		setEdges,
		updateNodeData,
		toggleArchiveNode,
	} = useBrainstormStore()

	const [showArchived, setShowArchived] = useState(false)
	const nodes = (storeNodes as CustomNodeType[]).filter(
		(node) => showArchived || !node.data.isArchived,
	)
	const edges = (storeEdges as CustomEdge[]).filter((edge) => {
		const sourceNode = storeNodes.find((n) => n.id === edge.source)
		const targetNode = storeNodes.find((n) => n.id === edge.target)
		return (
			(showArchived || !sourceNode?.data.isArchived) &&
			(showArchived || !targetNode?.data.isArchived)
		)
	})

	// UI State
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

	// Track mouse position for new node placement
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
			setEdges((currentEdges) => addEdge({ ...connection, type: EdgeType.DEFAULT }, currentEdges) as CustomEdge[])
		},
		[setEdges],
	)

	const handleNodeClick = useCallback<NodeMouseHandler>(
		(_event: React.MouseEvent, node: ReactFlowNode) => {
			setSelectedNode({
				...node,
				type: node.type as NodeType,
			} as CustomNodeType)
			setShowEditDialog(true)
		},
		[],
	)

	const handleToggleArchiveNode = useCallback(
		(nodeId: string) => {
			toggleArchiveNode(nodeId)
		},
		[toggleArchiveNode],
	)

	const handleAutoLayout = useCallback(() => {
		if (!nodes?.length) return

		const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges)
		setNodes(layoutedNodes as CustomNodeType[])
		setEdges(layoutedEdges as CustomEdge[])

		setTimeout(() => {
			reactFlowInstance?.fitView()
		}, 50)
	}, [nodes, edges, setNodes, setEdges, reactFlowInstance])

	useKeyboardShortcuts({
		onAutoLayout: handleAutoLayout,
		onZoomIn: () => reactFlowInstance?.zoomIn(),
		onZoomOut: () => reactFlowInstance?.zoomOut(),
		onFitView: () => reactFlowInstance?.fitView(),
		onToggleFullscreen: () => void toggleFullscreen(),
	})

	const handleSettingsOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
		setSettingsAnchorEl(event.currentTarget)
		if (reactFlowInstance) {
			setZoomLevel(reactFlowInstance.getZoom())
		}
	}, [reactFlowInstance])

	const handleSettingsClose = useCallback(() => {
		setSettingsAnchorEl(null)
	}, [])

	const handleZoomChange = useCallback((_event: Event, newValue: number | number[]) => {
		const zoom = Array.isArray(newValue) ? newValue[0] : newValue
		setZoomLevel(zoom)
		if (reactFlowInstance) {
			reactFlowInstance.zoomTo(zoom)
		}
	}, [reactFlowInstance])

	const handleCloseEditDialog = useCallback(() => {
		setShowEditDialog(false)
		setSelectedNode(null)
	}, [])

	const toggleFullscreen = useCallback(async () => {
		const newFullscreenState = !isFullscreen
		setIsFullscreen(newFullscreenState)

		try {
			if (newFullscreenState) {
				await document.documentElement?.requestFullscreen?.()
			} else {
				await document.exitFullscreen?.()
			}
		} catch (error) {
			console.error('Error with fullscreen API:', error)
		}
	}, [isFullscreen])

	useEffect(() => {
		setNodes(initialNodes)
		setEdges(initialEdges)
	}, [initialNodes, initialEdges, setNodes, setEdges])

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
					nodes={nodes}
					edges={edges}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onConnect={onConnect}
					onInit={setReactFlowInstance}
					nodeTypes={nodeTypes}
					onNodeClick={handleNodeClick}
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

					<Panel position="top-right">
						<ControlsPanel
							handleSettingsOpen={handleSettingsOpen}
							toggleGrid={() => setShowGrid(!showGrid)}
							toggleFullscreen={() => void toggleFullscreen()}
							zoomIn={() => reactFlowInstance?.zoomIn()}
							zoomOut={() => reactFlowInstance?.zoomOut()}
							handleAutoLayout={handleAutoLayout}
							isFullscreen={isFullscreen}
							showGrid={showGrid}
						/>
					</Panel>

					<FloatingControls
						position={mousePosition}
						showArchived={showArchived}
						onToggleArchived={() => setShowArchived((prev: boolean) => !prev)}
					/>

					{/* Settings Menu */}
					<Menu
						anchorEl={settingsAnchorEl}
						open={Boolean(settingsAnchorEl)}
						onClose={handleSettingsClose}
						anchorOrigin={{
							vertical: 'bottom',
							horizontal: 'right',
						}}
						transformOrigin={{
							vertical: 'top',
							horizontal: 'right',
						}}
						slotProps={{
							paper: { sx: { width: 280, p: 2 } },
						}}>
						<Typography variant="subtitle2" gutterBottom>
							Zoom Level: {Math.round(zoomLevel * 100)}%
						</Typography>
						<Box sx={{ px: 1, mb: 2 }}>
							<Slider
								value={zoomLevel}
								onChange={handleZoomChange}
								min={0.1}
								max={2}
								step={0.1}
								marks={[
									{ value: 0.5, label: '50%' },
									{ value: 1, label: '100%' },
									{ value: 1.5, label: '150%' },
								]}
								valueLabelDisplay="auto"
								valueLabelFormat={(value: number) => `${Math.round(value * 100)}%`}
							/>
						</Box>

						<Divider sx={{ my: 1 }} />

						<Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
							Keyboard Shortcuts
						</Typography>
						<MenuItem dense sx={{ py: 0.5 }}>
							<Typography variant="body2">Ctrl + L: Auto Layout</Typography>
						</MenuItem>
						<MenuItem dense sx={{ py: 0.5 }}>
							<Typography variant="body2">Ctrl + +: Zoom In</Typography>
						</MenuItem>
						<MenuItem dense sx={{ py: 0.5 }}>
							<Typography variant="body2">Ctrl + -: Zoom Out</Typography>
						</MenuItem>
						<MenuItem dense sx={{ py: 0.5 }}>
							<Typography variant="body2">Ctrl + 0: Fit View</Typography>
						</MenuItem>
						<MenuItem dense sx={{ py: 0.5 }}>
							<Typography variant="body2">F: Fullscreen</Typography>
						</MenuItem>
						<MenuItem dense sx={{ py: 0.5 }}>
							<Typography variant="body2">Delete: Remove Selected</Typography>
						</MenuItem>
					</Menu>

					{showEditDialog && selectedNode && (
						<NodeEditDialog
							open={showEditDialog}
							onClose={handleCloseEditDialog}
							initialData={selectedNode.data}
							initialType={selectedNode.type}
							onSave={({ title, content, type }: NodeEditDialogResult) => {
								updateNodeData(selectedNode.id, {
									title,
									content,
									type,
									updatedAt: new Date().toISOString(),
								})
								handleCloseEditDialog()
							}}
						/>
					)}
				</ReactFlow>
			</div>
		</ReactFlowProvider>
	)
}
