import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import React from 'react'

import type { Edge } from '../../types/models'

import type { ContextMenuItem } from './ContextMenu'
import ContextMenu from './ContextMenu'

interface EdgeContextMenuProps {
	edge: Edge
	position: { x: number; y: number } | null
	onClose: () => void
	onChangeStyle: (edgeId: string) => void
	onSetRelationType: (edgeId: string) => void
	onDelete: (edgeId: string) => void
}

const EdgeContextMenu: React.FC<EdgeContextMenuProps> = ({
	edge,
	position,
	onClose,
	onChangeStyle,
	onSetRelationType,
	onDelete,
}) => {
	const menuItems: ContextMenuItem[] = [
		{
			label: 'Change Connection Style',
			icon: <SwapHorizIcon />,
			onClick: () => onChangeStyle(edge.id),
		},
		{
			label: 'Set Relationship Type',
			icon: <EditIcon />,
			onClick: () => onSetRelationType(edge.id),
		},
		{
			label: '',
			onClick: () => {},
			divider: true,
		},
		{
			label: 'Delete',
			icon: <DeleteIcon />,
			onClick: () => onDelete(edge.id),
		},
	]

	return <ContextMenu items={menuItems} position={position} onClose={onClose} data-testid="edge-context-menu" />
}

export default EdgeContextMenu
