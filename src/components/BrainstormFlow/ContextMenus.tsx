import React from 'react'

import type { Node, Edge, NodeType } from '../../types'

import { CanvasContextMenu } from './CanvasContextMenu'
import { EdgeContextMenu } from './EdgeContextMenu'
import { NodeContextMenu } from './NodeContextMenu'

interface ContextMenusProps {
	// Node context menu props
	nodeContextMenuOpen: boolean
	nodeContextMenuPosition: { x: number; y: number } | null
	nodeContextMenuNode: Node | null
	onCloseNodeContextMenu: () => void
	onEditNode: (node: Node) => void
	onDuplicateNode: (node: Node) => void
	onDeleteNode: (node: Node) => void
	onStyleNode: (node: Node) => void
	onAddChildNode: (node: Node) => void
	onLinkNodeToChat: (node: Node) => void

	// Edge context menu props
	edgeContextMenuOpen: boolean
	edgeContextMenuPosition: { x: number; y: number } | null
	edgeContextMenuEdge: Edge | null
	onCloseEdgeContextMenu: () => void
	onDeleteEdge: (edge: Edge) => void
	onStyleEdge: (edge: Edge) => void
	onChangeEdgeType: (edge: Edge, type: 'straight' | 'curved') => void

	// Canvas context menu props
	canvasContextMenuOpen: boolean
	canvasContextMenuPosition: { x: number; y: number } | null
	onCloseCanvasContextMenu: () => void
	onAddNode: (type: NodeType, position: { x: number; y: number }) => void
	onPaste: () => void
	onFitView: () => void
	onToggleGrid: () => void
	onUndo: () => void
	onRedo: () => void
	showGrid: boolean
	canUndo: boolean
	canRedo: boolean
	canPaste: boolean
}

/**
 * ContextMenus component that manages all context menus in the flow editor
 * Includes context menus for nodes, edges, and the canvas
 */
export const ContextMenus: React.FC<ContextMenusProps> = ({
	// Node context menu props
	nodeContextMenuOpen,
	nodeContextMenuPosition,
	nodeContextMenuNode,
	onCloseNodeContextMenu,
	onEditNode,
	onDuplicateNode,
	onDeleteNode,
	onStyleNode,
	onAddChildNode,
	onLinkNodeToChat,

	// Edge context menu props
	edgeContextMenuOpen,
	edgeContextMenuPosition,
	edgeContextMenuEdge,
	onCloseEdgeContextMenu,
	onDeleteEdge,
	onStyleEdge,
	onChangeEdgeType,

	// Canvas context menu props
	canvasContextMenuOpen,
	canvasContextMenuPosition,
	onCloseCanvasContextMenu,
	onAddNode,
	onPaste,
	onFitView,
	onToggleGrid,
	onUndo,
	onRedo,
	showGrid,
	canUndo,
	canRedo,
	canPaste,
}) => {
	return (
		<>
			{/* Node Context Menu */}
			<NodeContextMenu
				node={nodeContextMenuNode}
				anchorPosition={nodeContextMenuPosition}
				open={nodeContextMenuOpen}
				onClose={onCloseNodeContextMenu}
				onEdit={onEditNode}
				onDuplicate={onDuplicateNode}
				onDelete={onDeleteNode}
				onStyle={onStyleNode}
				onAddChild={onAddChildNode}
				onLinkToChat={onLinkNodeToChat}
			/>

			{/* Edge Context Menu */}
			<EdgeContextMenu
				edge={edgeContextMenuEdge}
				anchorPosition={edgeContextMenuPosition}
				open={edgeContextMenuOpen}
				onClose={onCloseEdgeContextMenu}
				onDelete={onDeleteEdge}
				onStyle={onStyleEdge}
				onChangeType={onChangeEdgeType}
			/>

			{/* Canvas Context Menu */}
			<CanvasContextMenu
				anchorPosition={canvasContextMenuPosition}
				open={canvasContextMenuOpen}
				onClose={onCloseCanvasContextMenu}
				onAddNode={onAddNode}
				onPaste={onPaste}
				onFitView={onFitView}
				onToggleGrid={onToggleGrid}
				onUndo={onUndo}
				onRedo={onRedo}
				showGrid={showGrid}
				canUndo={canUndo}
				canRedo={canRedo}
				canPaste={canPaste}
			/>
		</>
	)
}

export default ContextMenus
