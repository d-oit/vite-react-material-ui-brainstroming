import { Box, Typography, Button } from '@mui/material'
import React, { useState, useCallback } from 'react'

import CanvasContextMenu from '../components/BrainstormFlow/CanvasContextMenu'
import EdgeContextMenu from '../components/BrainstormFlow/EdgeContextMenu'
import NodeContextMenu from '../components/BrainstormFlow/NodeContextMenu'
import type { Node, Edge } from '../types'
import { NodeType } from '../types'

/**
 * This is an example component that demonstrates how to use the context menus.
 * It's not meant to be used in production, but rather as a reference for how to
 * implement context menus in the EnhancedBrainstormFlow component.
 */
const ContextMenuExample: React.FC = () => {
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

	// Example node and edge
	const exampleNode: Node = {
		id: 'node-1',
		type: NodeType.IDEA,
		position: { x: 0, y: 0 },
		data: {
			title: 'Example Node',
			content: 'This is an example node',
		},
	}

	const exampleEdge: Edge = {
		id: 'edge-1',
		source: 'node-1',
		target: 'node-2',
		type: 'default',
	}

	// Node context menu handlers
	const handleOpenNodeContextMenu = useCallback(
		(event: React.MouseEvent) => {
			event.preventDefault()
			setNodeContextMenuPosition({ x: event.clientX, y: event.clientY })
			setNodeContextMenuNode(exampleNode)
			setNodeContextMenuOpen(true)
		},
		[exampleNode],
	)

	const handleCloseNodeContextMenu = useCallback(() => {
		setNodeContextMenuOpen(false)
		setNodeContextMenuPosition(null)
	}, [])

	const handleEditNode = useCallback(
		(node: Node) => {
			console.log('Edit node:', node)
			handleCloseNodeContextMenu()
		},
		[handleCloseNodeContextMenu],
	)

	const handleDuplicateNode = useCallback(
		(node: Node) => {
			console.log('Duplicate node:', node)
			handleCloseNodeContextMenu()
		},
		[handleCloseNodeContextMenu],
	)

	const handleDeleteNode = useCallback(
		(node: Node) => {
			console.log('Delete node:', node)
			handleCloseNodeContextMenu()
		},
		[handleCloseNodeContextMenu],
	)

	const handleStyleNode = useCallback(
		(node: Node) => {
			console.log('Style node:', node)
			handleCloseNodeContextMenu()
		},
		[handleCloseNodeContextMenu],
	)

	const handleAddChildNode = useCallback(
		(node: Node) => {
			console.log('Add child node:', node)
			handleCloseNodeContextMenu()
		},
		[handleCloseNodeContextMenu],
	)

	const handleLinkNodeToChat = useCallback(
		(node: Node) => {
			console.log('Link node to chat:', node)
			handleCloseNodeContextMenu()
		},
		[handleCloseNodeContextMenu],
	)

	// Edge context menu handlers
	const handleOpenEdgeContextMenu = useCallback(
		(event: React.MouseEvent) => {
			event.preventDefault()
			setEdgeContextMenuPosition({ x: event.clientX, y: event.clientY })
			setEdgeContextMenuEdge(exampleEdge)
			setEdgeContextMenuOpen(true)
		},
		[exampleEdge],
	)

	const handleCloseEdgeContextMenu = useCallback(() => {
		setEdgeContextMenuOpen(false)
		setEdgeContextMenuPosition(null)
	}, [])

	const handleDeleteEdge = useCallback(
		(edge: Edge) => {
			console.log('Delete edge:', edge)
			handleCloseEdgeContextMenu()
		},
		[handleCloseEdgeContextMenu],
	)

	const handleStyleEdge = useCallback(
		(edge: Edge) => {
			console.log('Style edge:', edge)
			handleCloseEdgeContextMenu()
		},
		[handleCloseEdgeContextMenu],
	)

	const handleChangeEdgeType = useCallback(
		(edge: Edge, type: 'straight' | 'curved') => {
			console.log('Change edge type:', edge, type)
			handleCloseEdgeContextMenu()
		},
		[handleCloseEdgeContextMenu],
	)

	// Canvas context menu handlers
	const handleOpenCanvasContextMenu = useCallback((event: React.MouseEvent) => {
		event.preventDefault()
		setCanvasContextMenuPosition({ x: event.clientX, y: event.clientY })
		setCanvasContextMenuOpen(true)
	}, [])

	const handleCloseCanvasContextMenu = useCallback(() => {
		setCanvasContextMenuOpen(false)
		setCanvasContextMenuPosition(null)
	}, [])

	const handleAddNode = useCallback(
		(type: NodeType, position: { x: number; y: number }) => {
			console.log('Add node:', type, position)
			handleCloseCanvasContextMenu()
		},
		[handleCloseCanvasContextMenu],
	)

	const handlePaste = useCallback(() => {
		console.log('Paste')
		handleCloseCanvasContextMenu()
	}, [handleCloseCanvasContextMenu])

	const handleFitView = useCallback(() => {
		console.log('Fit view')
		handleCloseCanvasContextMenu()
	}, [handleCloseCanvasContextMenu])

	const handleToggleGrid = useCallback(() => {
		console.log('Toggle grid')
		handleCloseCanvasContextMenu()
	}, [handleCloseCanvasContextMenu])

	const handleUndo = useCallback(() => {
		console.log('Undo')
		handleCloseCanvasContextMenu()
	}, [handleCloseCanvasContextMenu])

	const handleRedo = useCallback(() => {
		console.log('Redo')
		handleCloseCanvasContextMenu()
	}, [handleCloseCanvasContextMenu])

	return (
		<Box sx={{ p: 4 }}>
			<Typography variant="h4" gutterBottom>
				Context Menu Example
			</Typography>

			<Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
				<Button variant="contained" onContextMenu={handleOpenNodeContextMenu}>
					Right-click for Node Context Menu
				</Button>

				<Button variant="contained" onContextMenu={handleOpenEdgeContextMenu}>
					Right-click for Edge Context Menu
				</Button>

				<Button variant="contained" onContextMenu={handleOpenCanvasContextMenu}>
					Right-click for Canvas Context Menu
				</Button>
			</Box>

			<Typography variant="body1">
				Right-click on the buttons above to see the context menus in action. Check the console for the actions
				that are triggered when you click on the menu items.
			</Typography>

			{/* Node Context Menu */}
			<NodeContextMenu
				node={nodeContextMenuNode}
				anchorPosition={nodeContextMenuPosition}
				open={nodeContextMenuOpen}
				onClose={handleCloseNodeContextMenu}
				onEdit={handleEditNode}
				onDuplicate={handleDuplicateNode}
				onDelete={handleDeleteNode}
				onStyle={handleStyleNode}
				onAddChild={handleAddChildNode}
				onLinkToChat={handleLinkNodeToChat}
			/>

			{/* Edge Context Menu */}
			<EdgeContextMenu
				edge={edgeContextMenuEdge}
				anchorPosition={edgeContextMenuPosition}
				open={edgeContextMenuOpen}
				onClose={handleCloseEdgeContextMenu}
				onDelete={handleDeleteEdge}
				onStyle={handleStyleEdge}
				onChangeType={handleChangeEdgeType}
			/>

			{/* Canvas Context Menu */}
			<CanvasContextMenu
				anchorPosition={canvasContextMenuPosition}
				open={canvasContextMenuOpen}
				onClose={handleCloseCanvasContextMenu}
				onAddNode={handleAddNode}
				onPaste={handlePaste}
				onFitView={handleFitView}
				onToggleGrid={handleToggleGrid}
				onUndo={handleUndo}
				onRedo={handleRedo}
				showGrid={true}
				canUndo={true}
				canRedo={true}
				canPaste={true}
			/>
		</Box>
	)
}

export default ContextMenuExample
