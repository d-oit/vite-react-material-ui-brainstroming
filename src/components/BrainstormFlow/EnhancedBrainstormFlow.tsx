// MUI imports
import { FullscreenExit as FullscreenExitIcon } from '@mui/icons-material'
import { Box, IconButton, Menu, MenuItem, Typography, Divider, Slider, useTheme } from '@mui/material'
// React and ReactFlow imports
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
import type { Node as ProjectNode, Edge as ProjectEdge } from '../../types/models'
import type { Node as FlowNode, Edge as FlowEdge } from 'reactflow'
import DeleteConfirmationDialog from '../DeleteConfirmationDialog'

// Local Components
import ControlsPanel from './ControlsPanel'
import { EnhancedMiniMap } from './EnhancedMiniMap'
import { FloatingControls } from './FloatingControls'
import NodeEditDialog from './NodeEditDialog'
import CustomNodeComponent from './nodes/CustomNode'
import type { CustomNodeData } from './nodes/CustomNode'

// Extended node data interface that includes all required fields
interface NodeData extends CustomNodeData {
	id: string
	title: string
	content: string
	createdAt: string
	updatedAt: string
	tags?: string[]
	color?: string
}

// Type definitions for ReactFlow
// Custom type definitions
interface CustomNodeType extends Omit<FlowNode<NodeData>, 'type' | 'style'> {
	type: NodeType
	style?: Record<string, unknown>
}

interface CustomEdge extends Omit<FlowEdge, 'type' | 'label'> {
	type: EdgeType
	label?: string
}

// Helper functions to convert between ReactFlow and Project types
const createFlowNodes = (nodes: ReactFlowNode[]): ProjectNode[] => {
	return nodes.map((node) => {
		const nodeType = (node.type ?? NodeType.IDEA) as NodeType
		const defaultData = createDefaultNodeData(node.id, nodeType)

		return {
			id: node.id,
			type: nodeType,
			position: node.position,
			data: {
				...defaultData,
				...node.data,
			},
			style: node.style as Record<string, unknown>,
			selected: node.selected,
		}
	})
}

const createFlowEdges = (edges: ReactFlowEdge[]): ProjectEdge[] => {
	return edges.map((edge) => ({
		id: edge.id,
		source: edge.source,
		target: edge.target,
		type: (edge.type ?? EdgeType.DEFAULT) as EdgeType,
		label: typeof edge.label === 'string' ? edge.label : undefined,
		animated: edge.animated,
		style: edge.style as Record<string, unknown>,
		selected: edge.selected,
	}))
}

// Component registration
const nodeTypes = {
	[NodeType.IDEA]: CustomNodeComponent,
	[NodeType.TASK]: CustomNodeComponent,
	[NodeType.RESOURCE]: CustomNodeComponent,
	[NodeType.NOTE]: CustomNodeComponent,
}

const createDefaultNodeData = (id: string, type: NodeType = NodeType.IDEA): NodeData => ({
	id,
	label: '',
	title: '',
	content: '',
	type,
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
	tags: [],
	notes: '',
	onEdit: undefined,
	onDelete: undefined,
	onChat: undefined,
})

// Safe accessor functions for node data
const getNodeDataProperty = <T,>(node: CustomNodeType, property: string, defaultValue: T): T => {
	if (node.data === null || node.data === undefined) return defaultValue
	return (node.data as any)[property] ?? defaultValue
}

const hasNodeDataMethod = (node: CustomNodeType, methodName: string): boolean => {
	if (node.data === null || node.data === undefined) return false
	return typeof (node.data as any)[methodName] === 'function'
}

// These interfaces are not needed and causing type issues
// We'll use the base types directly

// Transform node to ensure it has the correct type
const transformNode = (node: CustomNodeType): CustomNodeType => ({
	...node,
	type: (node.type ?? NodeType.IDEA) as NodeType,
	data: {
		...node.data,
		id: node.id,
		type: (node.type ?? NodeType.IDEA) as NodeType,
	},
	style: node.style as Record<string, unknown>,
})

// Transform edge to ensure it has the correct type
const transformEdge = (edge: CustomEdge): CustomEdge => ({
	...edge,
	type: (edge.type ?? EdgeType.DEFAULT) as EdgeType,
	label: edge.label?.toString(),
})

type NodeTypeModel = NodeType
interface EnhancedBrainstormFlowProps {
	initialNodes: CustomNodeType[]
	initialEdges: CustomEdge[]
	onSave?: (nodes: CustomNodeType[], edges: CustomEdge[]) => void
}

// Removed duplicate nodeTypes definition
// Component Implementation

// Removed unused helper functions

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
	const _theme = useTheme()
	const flowRef = useRef<HTMLDivElement>(null)
	const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
	const { nodes: storeNodes, edges: storeEdges, setNodes, setEdges } = useBrainstormStore()
	// Cast store values to the correct types
	const nodes = storeNodes as CustomNodeType[]
	const edges = storeEdges as CustomEdge[]

	// UI State
	const [mousePosition, setMousePosition] = useState({ x: 100, y: 100 })
	const [showEditDialog, setShowEditDialog] = useState(false)
	const [showDeleteDialog, setShowDeleteDialog] = useState(false)
	const [showChatPanel, setShowChatPanel] = useState(false)
	const [selectedNode, setSelectedNode] = useState<CustomNodeType | null>(null)
	const [isFullscreen, setIsFullscreen] = useState(false)
	const [settingsAnchorEl, setSettingsAnchorEl] = useState<HTMLElement | null>(null)
	const [zoomLevel, setZoomLevel] = useState<number>(1)
	const [showGrid, setShowGrid] = useState<boolean>(true)
	const { settings } = useSettings()

	// Accessibility and UX State
	const [_isLoading, setIsLoading] = useState(false)

	// Removed unused debounced save function

	// Show loading state while initializing
	useEffect(() => {
		setIsLoading(!reactFlowInstance)
	}, [reactFlowInstance])

	// Settings menu handlers
	const handleSettingsOpen = (event: React.MouseEvent<HTMLElement>) => {
		setSettingsAnchorEl(event.currentTarget)
		// Update zoom level when opening settings
		if (reactFlowInstance) {
			setZoomLevel(reactFlowInstance.getZoom())
		}
	}

	const handleSettingsClose = () => {
		setSettingsAnchorEl(null)
	}

	const handleZoomChange = (_event: Event, newValue: number | number[]) => {
		const zoom = Array.isArray(newValue) ? newValue[0] : newValue
		setZoomLevel(zoom)
		if (reactFlowInstance) {
			reactFlowInstance.zoomTo(zoom)
		}
	}

	const onNodesChange = useCallback(
		(changes: NodeChange[]) => {
			setNodes((currentNodes) => {
				const updatedNodes = applyNodeChanges(changes, currentNodes)
				return updatedNodes.map((node) => ({
					...node,
					type: node.type as NodeType,
					data: node.data as NodeData,
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
			setEdges((currentEdges) => addEdge(connection, currentEdges) as CustomEdge[])
		},
		[setEdges],
	)

	// Track mouse position for new node placement
	const onMouseMove = useCallback(
		(event: React.MouseEvent) => {
			if (reactFlowInstance) {
				const bounds = flowRef.current?.getBoundingClientRect()
				if (bounds) {
					const position = reactFlowInstance.screenToFlowPosition({
						x: event.clientX - bounds.left,
						y: event.clientY - bounds.top,
					})
					setMousePosition(position)
				}
			}
		},
		[reactFlowInstance],
	)

	// Save changes when needed
	const handleSave = useCallback(() => {
		if (onSave && reactFlowInstance) {
			const currentNodes = reactFlowInstance.getNodes() as CustomNodeType[]
			const currentEdges = reactFlowInstance.getEdges() as CustomEdge[]
			onSave(currentNodes, currentEdges)
		}
	}, [onSave, reactFlowInstance])

	// Initialize flow with props
	useEffect(() => {
		setNodes(initialNodes)
		setEdges(initialEdges)
	}, [initialNodes, initialEdges, setNodes, setEdges])

	// Track previous state to detect changes
	const prevNodesRef = useRef<string>(JSON.stringify(initialNodes))
	const prevEdgesRef = useRef<string>(JSON.stringify(initialEdges))

	// Auto-save only when there are actual changes
	useEffect(() => {
		const currentNodesJSON = JSON.stringify(nodes)
		const currentEdgesJSON = JSON.stringify(edges)

		// Check if nodes or edges have changed
		const nodesChanged = currentNodesJSON !== prevNodesRef.current
		const edgesChanged = currentEdgesJSON !== prevEdgesRef.current

		// Only save if there are actual changes
		if (nodesChanged || edgesChanged) {
			handleSave()

			// Update previous state references
			prevNodesRef.current = currentNodesJSON
			prevEdgesRef.current = currentEdgesJSON
		}
	}, [nodes, edges, handleSave])

	// Handle node click for editing
	const handleNodeClick = useCallback<NodeMouseHandler>((_event: React.MouseEvent, node: ReactFlowNode) => {
		setSelectedNode({
			...node,
			type: node.type as NodeType,
			data: node.data as NodeData,
		} as CustomNodeType)
		setShowEditDialog(true)
	}, [])

	// Removed unused handler functions

	// Handle dialog close
	const handleCloseEditDialog = useCallback(() => {
		setShowEditDialog(false)
		setSelectedNode(null)
	}, [])

	// Handle delete confirmation
	const handleConfirmDelete = useCallback(() => {
		if (selectedNode) {
			// Remove the node from the flow
			setNodes((nodes) => nodes.filter((n) => n.id !== selectedNode.id))

			// Close the dialog and reset selected node
			setShowDeleteDialog(false)
			setSelectedNode(null)

			// Log the deletion for debugging
			console.log(`Node ${selectedNode.id} deleted successfully`)
		}
	}, [selectedNode, setNodes])

	// Handle delete dialog close
	const handleCloseDeleteDialog = useCallback(() => {
		setShowDeleteDialog(false)
		setSelectedNode(null)
	}, [])

	// Handle chat panel close
	const handleCloseChatPanel = useCallback(() => {
		setShowChatPanel(false)
		setSelectedNode(null)
	}, [])

	// Handle node update
	const handleNodeUpdate = useCallback(
		(nodeId: string, data: Record<string, unknown>) => {
			setNodes((nodes) =>
				nodes.map((node) =>
					node.id === nodeId
						? {
								...node,
								data: {
									...node.data,
									...data,
								},
							}
						: node,
				),
			)
			setShowEditDialog(false)
			setSelectedNode(null)
		},
		[setNodes],
	)

	// Toggle fullscreen mode
	const toggleFullscreen = useCallback(async () => {
		const newFullscreenState = !isFullscreen
		setIsFullscreen(newFullscreenState)

		// Use document.body for fullscreen to ensure the entire page is included
		try {
			if (newFullscreenState) {
				// First set our state, then try browser fullscreen API
				await document.documentElement?.requestFullscreen?.()
			} else {
				// Exit browser fullscreen if active
				await document.exitFullscreen?.()
			}
		} catch (error) {
			console.error('Error with fullscreen API:', error)
			// Fallback to CSS-only fullscreen if browser API fails
		}
	}, [isFullscreen])

	// Fit view to ensure all nodes are visible
	const fitViewToNodes = useCallback(() => {
		if (reactFlowInstance) {
			reactFlowInstance.fitView({ padding: 0.2 })
		}
	}, [reactFlowInstance])

	// Use effect to force re-render when component mounts
	useEffect(() => {
		fitViewToNodes()
	}, [fitViewToNodes])

	// Add fullscreen change event listener
	useEffect(() => {
		const handleFullscreenChange = () => {
			// Update our state when browser fullscreen changes
			setIsFullscreen(!!document.fullscreenElement)
		}

		document.addEventListener('fullscreenchange', handleFullscreenChange)
		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange)
		}
	}, [])

	return (
		<ReactFlowProvider>
			<div
				ref={flowRef}
				className={`flow-container ${isFullscreen ? 'fullscreen' : ''}`}
				onMouseMove={onMouseMove}
				data-testid="enhanced-brainstorm-flow"
				style={{
					width: '100%',
					height: isFullscreen ? '100vh' : '80vh',
					minHeight: '500px',
					display: 'flex',
					flexDirection: 'column'
				}}>
				{/* Mobile fullscreen close button */}
				{isFullscreen && (
					<Box className="mobile-close-button">
						<IconButton
							onClick={() => void toggleFullscreen()}
							size="large"
							color="primary"
							aria-label="Exit fullscreen"
							data-testid="exit-fullscreen-button">
							<FullscreenExitIcon />
						</IconButton>
					</Box>
				)}
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
					style={{ width: '100%', height: '100%', flex: 1 }}
					onNodeDragStop={(_event, _node) => {
						if (settings.autoSave) {
							handleSave()
						}
					}}>
					{showGrid && <Background />}

					{/* Controls in the top-right corner with proper spacing */}
					<Panel position="top-right">
						<ControlsPanel
							handleSettingsOpen={handleSettingsOpen}
							toggleGrid={() => setShowGrid(!showGrid)}
							toggleFullscreen={() => void toggleFullscreen()}
							zoomIn={() => reactFlowInstance?.zoomIn()}
							zoomOut={() => reactFlowInstance?.zoomOut()}
							isFullscreen={isFullscreen}
							showGrid={showGrid}
						/>
					</Panel>

					{/* Help button in bottom-left corner */}
					<Panel position="bottom-left">
						<button
							type="button"
							className="flow-help-button"
							onClick={() => window.open('/help', '_blank')}
							title="Help">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
								<path fill="none" d="M0 0h24v24H0z" />
								<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
							</svg>
						</button>
					</Panel>

					{/* Enhanced MiniMap positioned at the bottom-right with proper spacing */}
					<Panel position="bottom-right" style={{ bottom: '80px', right: '20px' }}>
						<EnhancedMiniMap
							nodes={nodes.map(
								(node) =>
									({
										...node,
										type: node.type ?? NodeType.IDEA,
										data: node.data as NodeData,
									}) as ProjectNode,
							)}
							edges={edges.map(
								(edge) =>
									({
										...edge,
										type: (edge.type as EdgeType) ?? EdgeType.DEFAULT,
										label: typeof edge.label === 'string' ? edge.label : undefined,
									}) as ProjectEdge,
							)}
							onNodeClick={(nodeId) => {
								const node = nodes.find((n) => n.id === nodeId)
								if (node) {
									const event = new MouseEvent('click') as unknown as React.MouseEvent
									handleNodeClick(event, node as CustomNodeType)
								}
							}}
							onZoomIn={() => reactFlowInstance?.zoomIn()}
							onZoomOut={() => reactFlowInstance?.zoomOut()}
							onFitView={fitViewToNodes}
						/>
					</Panel>
				</ReactFlow>
				<FloatingControls position={mousePosition} />

				{/* Node Edit Dialog */}
				{showEditDialog && selectedNode && (
					<NodeEditDialog
						open={showEditDialog}
						onClose={handleCloseEditDialog}
						initialData={selectedNode.data as NodeData}
						initialType={selectedNode.type as NodeTypeModel}
						onSave={(data, type) => handleNodeUpdate(selectedNode.id, { ...data, type })}
					/>
				)}

				{/* Delete Confirmation Dialog */}
				{showDeleteDialog && selectedNode && (
					<DeleteConfirmationDialog
						open={showDeleteDialog}
						onClose={handleCloseDeleteDialog}
						onConfirm={handleConfirmDelete}
					/>
				)}

				{/* Chat Panel */}
				{showChatPanel && selectedNode && (
					<LLMChatPanel
						open={showChatPanel}
						onClose={handleCloseChatPanel}
						projectId={selectedNode.id}
						session={{
							id: 'flow-chat',
							projectId: selectedNode.id,
							nodes: [],
							templateId: '',
							history: [],
							created: new Date(),
							modified: new Date(),
							isQuick: false,
						}}
						onInsightGenerated={() => {}}
					/>
				)}

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
							valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
						/>
					</Box>

					<Divider sx={{ my: 1 }} />

					<Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
						Keyboard Shortcuts
					</Typography>
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
			</div>
		</ReactFlowProvider>
	)
}



