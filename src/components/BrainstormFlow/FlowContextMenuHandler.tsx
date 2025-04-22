import React, { useCallback, useState } from 'react'
import type { Node as FlowNode, Edge as FlowEdge } from 'reactflow'
import { useReactFlow } from 'reactflow'

import { useI18n } from '../../contexts/I18nContext'
import type { Node, Edge, NodeType } from '../../types'

import ContextMenus from './ContextMenus'

interface FlowContextMenuHandlerProps {
	nodes: Node[]
	edges: Edge[]
	onNodesChange: (nodes: Node[]) => void
	onEdgesChange: (edges: Edge[]) => void
	onNodeEdit: (node: Node) => void
	onNodeDelete: (node: Node) => void
	onNodeStyle: (node: Node) => void
	onAddChildNode: (node: Node) => void
	onLinkNodeToChat: (node: Node) => void
	readOnly?: boolean
}

export const FlowContextMenuHandler: React.FC<FlowContextMenuHandlerProps> = ({
	nodes,
	edges,
	onNodesChange,
	onEdgesChange,
	onNodeEdit,
	onNodeDelete,
	onNodeStyle,
	onAddChildNode,
	onLinkNodeToChat,
	readOnly = false,
}) => {
	const { t } = useI18n()
	const { getNodes, getEdges, fitView, project, getZoom } = useReactFlow()

	// Node context menu state
	const [nodeContextMenuOpen, setNodeContextMenuOpen] = useState(false)
	const [nodeContextMenuPosition, setNodeContextMenuPosition] = useState<{
		x: number
		y: number
	} | null>(null)
	const [nodeContextMenuNode, setNodeContextMenuNode] = useState<Node | null>(null)

	// Edge context menu state
	const [edgeContextMenuOpen, setEdgeContextMenuOpen] = useState(false)
	const [edgeContextMenuPosition, setEdgeContextMenuPosition] = useState<{
		x: number
		y: number
	} | null>(null)
	const [edgeContextMenuEdge, setEdgeContextMenuEdge] = useState<Edge | null>(null)

	// Canvas context menu state
	const [canvasContextMenuOpen, setCanvasContextMenuOpen] = useState(false)
	const [canvasContextMenuPosition, setCanvasContextMenuPosition] = useState<{
		x: number
		y: number
	} | null>(null)

	// Clipboard state
	const [clipboard, setClipboard] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null)

	// Undo/Redo state
	const [undoStack, setUndoStack] = useState<Array<{ nodes: Node[]; edges: Edge[] }>>([])
	const [redoStack, setRedoStack] = useState<Array<{ nodes: Node[]; edges: Edge[] }>>([])

	// Grid state
	const [showGrid, setShowGrid] = useState(true)

	// Node context menu handlers
	const handleOpenNodeContextMenu = useCallback(
		(event: React.MouseEvent, node: FlowNode) => {
			if (readOnly) return

			event.preventDefault()
			event.stopPropagation()

			const nodeData = nodes.find((n) => n.id === node.id)
			if (!nodeData) return

			setNodeContextMenuNode(nodeData)
			setNodeContextMenuPosition({ x: event.clientX, y: event.clientY })
			setNodeContextMenuOpen(true)
		},
		[nodes, readOnly],
	)

	const handleCloseNodeContextMenu = useCallback(() => {
		setNodeContextMenuOpen(false)
		setNodeContextMenuPosition(null)
	}, [])

	// Edge context menu handlers
	const handleOpenEdgeContextMenu = useCallback(
		(event: React.MouseEvent, edge: FlowEdge) => {
			if (readOnly) return

			event.preventDefault()
			event.stopPropagation()

			const edgeData = edges.find((e) => e.id === edge.id)
			if (!edgeData) return

			setEdgeContextMenuEdge(edgeData)
			setEdgeContextMenuPosition({ x: event.clientX, y: event.clientY })
			setEdgeContextMenuOpen(true)
		},
		[edges, readOnly],
	)

	const handleCloseEdgeContextMenu = useCallback(() => {
		setEdgeContextMenuOpen(false)
		setEdgeContextMenuPosition(null)
	}, [])

	// Canvas context menu handlers
	const handleOpenCanvasContextMenu = useCallback(
		(event: React.MouseEvent) => {
			if (readOnly) return

			event.preventDefault()
			event.stopPropagation()

			// Convert screen coordinates to flow coordinates
			const reactFlowBounds = event.currentTarget.getBoundingClientRect()
			const position = project({
				x: event.clientX - reactFlowBounds.left,
				y: event.clientY - reactFlowBounds.top,
			})

			setCanvasContextMenuPosition({ x: event.clientX, y: event.clientY })
			setCanvasContextMenuOpen(true)
		},
		[project, readOnly],
	)

	const handleCloseCanvasContextMenu = useCallback(() => {
		setCanvasContextMenuOpen(false)
		setCanvasContextMenuPosition(null)
	}, [])

	// Node context menu action handlers
	const handleEditNode = useCallback(
		(node: Node) => {
			onNodeEdit(node)
			handleCloseNodeContextMenu()
		},
		[onNodeEdit, handleCloseNodeContextMenu],
	)

	const handleDuplicateNode = useCallback(
		(node: Node) => {
			const newNode: Node = {
				...node,
				id: `${node.id}-copy-${Date.now()}`,
				position: {
					x: node.position.x + 50,
					y: node.position.y + 50,
				},
				data: {
					...node.data,
					id: `${node.data.id}-copy-${Date.now()}`,
					label: `${node.data.label} (${t('common.copy')})`,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
			}

			onNodesChange([...nodes, newNode])
			handleCloseNodeContextMenu()
		},
		[nodes, onNodesChange, handleCloseNodeContextMenu, t],
	)

	const handleDeleteNode = useCallback(
		(node: Node) => {
			onNodeDelete(node)
			handleCloseNodeContextMenu()
		},
		[onNodeDelete, handleCloseNodeContextMenu],
	)

	const handleStyleNode = useCallback(
		(node: Node) => {
			onNodeStyle(node)
			handleCloseNodeContextMenu()
		},
		[onNodeStyle, handleCloseNodeContextMenu],
	)

	const handleAddChildNode = useCallback(
		(node: Node) => {
			const childNode: Node = {
				id: `node-${Date.now()}`,
				type: node.type,
				position: {
					x: node.position.x + 150,
					y: node.position.y + 100,
				},
				data: {
					id: `data-${Date.now()}`,
					label: t('flow.childNodeLabel', { parent: node.data.label }),
					content: '',
					tags: [],
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
			}

			const childEdge: Edge = {
				id: `edge-${Date.now()}`,
				source: node.id,
				target: childNode.id,
				type: 'smoothstep',
				animated: false,
			}

			onNodesChange([...nodes, childNode])
			onEdgesChange([...edges, childEdge])
			handleCloseNodeContextMenu()
		},
		[nodes, edges, onNodesChange, onEdgesChange, handleCloseNodeContextMenu, t],
	)

	const handleLinkNodeToChat = useCallback(
		(node: Node) => {
			onLinkNodeToChat(node)
			handleCloseNodeContextMenu()
		},
		[onLinkNodeToChat, handleCloseNodeContextMenu],
	)

	// Edge context menu action handlers
	const handleDeleteEdge = useCallback(
		(edge: Edge) => {
			const newEdges = edges.filter((e) => e.id !== edge.id)
			onEdgesChange(newEdges)
			handleCloseEdgeContextMenu()
		},
		[edges, onEdgesChange, handleCloseEdgeContextMenu],
	)

	const handleStyleEdge = useCallback(
		(edge: Edge) => {
			// This would open an edge style dialog
			console.log('Style edge', edge)
			handleCloseEdgeContextMenu()
		},
		[handleCloseEdgeContextMenu],
	)

	const handleChangeEdgeType = useCallback(
		(edge: Edge, type: 'straight' | 'curved') => {
			const newEdges = edges.map((e) => {
				if (e.id === edge.id) {
					return {
						...e,
						type: type === 'straight' ? 'default' : 'smoothstep',
					}
				}
				return e
			})
			onEdgesChange(newEdges)
			handleCloseEdgeContextMenu()
		},
		[edges, onEdgesChange, handleCloseEdgeContextMenu],
	)

	// Canvas context menu action handlers
	const handleAddNode = useCallback(
		(type: NodeType, position: { x: number; y: number }) => {
			if (!canvasContextMenuPosition) return

			// Convert screen coordinates to flow coordinates
			const reactFlowBounds = document.querySelector('.react-flow')?.getBoundingClientRect()
			if (!reactFlowBounds) return

			const flowPosition = project({
				x: position.x - reactFlowBounds.left,
				y: position.y - reactFlowBounds.top,
			})

			const newNode: Node = {
				id: `node-${Date.now()}`,
				type,
				position: flowPosition,
				data: {
					id: `data-${Date.now()}`,
					label: t(`flow.defaultLabels.${type}`) || type,
					content: '',
					tags: [],
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
			}

			onNodesChange([...nodes, newNode])
			handleCloseCanvasContextMenu()
		},
		[nodes, onNodesChange, handleCloseCanvasContextMenu, project, canvasContextMenuPosition, t],
	)

	const handlePaste = useCallback(() => {
		if (!clipboard || !canvasContextMenuPosition) return

		// Convert screen coordinates to flow coordinates
		const reactFlowBounds = document.querySelector('.react-flow')?.getBoundingClientRect()
		if (!reactFlowBounds) return

		const flowPosition = project({
			x: canvasContextMenuPosition.x - reactFlowBounds.left,
			y: canvasContextMenuPosition.y - reactFlowBounds.top,
		})

		// Create new nodes with new IDs and positions
		const nodeIdMap = new Map<string, string>()
		const newNodes = clipboard.nodes.map((node) => {
			const newId = `${node.id}-copy-${Date.now()}`
			nodeIdMap.set(node.id, newId)

			return {
				...node,
				id: newId,
				position: {
					x: node.position.x + (flowPosition.x - clipboard.nodes[0].position.x),
					y: node.position.y + (flowPosition.y - clipboard.nodes[0].position.y),
				},
				data: {
					...node.data,
					id: `${node.data.id}-copy-${Date.now()}`,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
			}
		})

		// Create new edges with new IDs and updated source/target
		const newEdges = clipboard.edges
			.filter((edge) => nodeIdMap.has(edge.source) && nodeIdMap.has(edge.target))
			.map((edge) => ({
				...edge,
				id: `${edge.id}-copy-${Date.now()}`,
				source: nodeIdMap.get(edge.source) || '',
				target: nodeIdMap.get(edge.target) || '',
			}))

		onNodesChange([...nodes, ...newNodes])
		onEdgesChange([...edges, ...newEdges])
		handleCloseCanvasContextMenu()
	}, [
		clipboard,
		canvasContextMenuPosition,
		project,
		nodes,
		edges,
		onNodesChange,
		onEdgesChange,
		handleCloseCanvasContextMenu,
	])

	const handleFitView = useCallback(() => {
		fitView?.({ padding: 0.2 })
		handleCloseCanvasContextMenu()
	}, [fitView, handleCloseCanvasContextMenu])

	const handleToggleGrid = useCallback(() => {
		setShowGrid((prev) => !prev)
		handleCloseCanvasContextMenu()
	}, [handleCloseCanvasContextMenu])

	const handleUndo = useCallback(() => {
		if (undoStack.length === 0) return

		const lastState = undoStack[undoStack.length - 1]
		setUndoStack(undoStack.slice(0, -1))
		setRedoStack([...redoStack, { nodes, edges }])

		onNodesChange(lastState.nodes)
		onEdgesChange(lastState.edges)
		handleCloseCanvasContextMenu()
	}, [undoStack, redoStack, nodes, edges, onNodesChange, onEdgesChange, handleCloseCanvasContextMenu])

	const handleRedo = useCallback(() => {
		if (redoStack.length === 0) return

		const nextState = redoStack[redoStack.length - 1]
		setRedoStack(redoStack.slice(0, -1))
		setUndoStack([...undoStack, { nodes, edges }])

		onNodesChange(nextState.nodes)
		onEdgesChange(nextState.edges)
		handleCloseCanvasContextMenu()
	}, [undoStack, redoStack, nodes, edges, onNodesChange, onEdgesChange, handleCloseCanvasContextMenu])

	// Copy to clipboard
	const handleCopyToClipboard = useCallback(
		(selectedNodes: Node[]) => {
			if (selectedNodes.length === 0) return

			// Get all edges between the selected nodes
			const selectedNodeIds = new Set(selectedNodes.map((node) => node.id))
			const selectedEdges = edges.filter(
				(edge) => selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target),
			)

			setClipboard({
				nodes: selectedNodes,
				edges: selectedEdges,
			})
		},
		[edges],
	)

	return (
		<>
			<ContextMenus
				// Node context menu props
				nodeContextMenuOpen={nodeContextMenuOpen}
				nodeContextMenuPosition={nodeContextMenuPosition}
				nodeContextMenuNode={nodeContextMenuNode}
				onCloseNodeContextMenu={handleCloseNodeContextMenu}
				onEditNode={handleEditNode}
				onDuplicateNode={handleDuplicateNode}
				onDeleteNode={handleDeleteNode}
				onStyleNode={handleStyleNode}
				onAddChildNode={handleAddChildNode}
				onLinkNodeToChat={handleLinkNodeToChat}
				// Edge context menu props
				edgeContextMenuOpen={edgeContextMenuOpen}
				edgeContextMenuPosition={edgeContextMenuPosition}
				edgeContextMenuEdge={edgeContextMenuEdge}
				onCloseEdgeContextMenu={handleCloseEdgeContextMenu}
				onDeleteEdge={handleDeleteEdge}
				onStyleEdge={handleStyleEdge}
				onChangeEdgeType={handleChangeEdgeType}
				// Canvas context menu props
				canvasContextMenuOpen={canvasContextMenuOpen}
				canvasContextMenuPosition={canvasContextMenuPosition}
				onCloseCanvasContextMenu={handleCloseCanvasContextMenu}
				onAddNode={handleAddNode}
				onPaste={handlePaste}
				onFitView={handleFitView}
				onToggleGrid={handleToggleGrid}
				onUndo={handleUndo}
				onRedo={handleRedo}
				showGrid={showGrid}
				canUndo={undoStack.length > 0}
				canRedo={redoStack.length > 0}
				canPaste={clipboard !== null}
			/>
			<div
				style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: -1 }}
				onContextMenu={handleOpenCanvasContextMenu}
			/>
		</>
	)
}

export default FlowContextMenuHandler
