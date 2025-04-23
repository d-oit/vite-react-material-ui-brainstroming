import ArchiveIcon from '@mui/icons-material/Archive'
import BoltIcon from '@mui/icons-material/Bolt'
import NoteIcon from '@mui/icons-material/Note'
import StorageIcon from '@mui/icons-material/Storage'
import TaskIcon from '@mui/icons-material/Task'
import UnarchiveIcon from '@mui/icons-material/Unarchive'
import { SpeedDial, SpeedDialAction, SpeedDialIcon, IconButton, Tooltip } from '@mui/material'
import React from 'react'

import { useBrainstormStore } from '../../store/brainstormStore'
import { NodeType } from '../../types/enums'

interface FloatingControlsProps {
	position?: { x: number; y: number }
	showArchived: boolean
	onToggleArchived: () => void
}

const nodeTypes: Array<{
	type: NodeType
	icon: React.ReactNode
	label: string
}> = [
	{ type: NodeType.IDEA, icon: <BoltIcon />, label: 'Add Idea' },
	{ type: NodeType.TASK, icon: <TaskIcon />, label: 'Add Task' },
	{ type: NodeType.RESOURCE, icon: <StorageIcon />, label: 'Add Resource' },
	{ type: NodeType.NOTE, icon: <NoteIcon />, label: 'Add Note' },
]

export const FloatingControls: React.FC<FloatingControlsProps> = ({
	position = { x: 100, y: 100 },
	showArchived,
	onToggleArchived,
}) => {
	const addNode = useBrainstormStore((state) => state.addNode)

	const handleAddNode = (type: NodeType) => {
		addNode({
			type,
			label: `New ${type}`,
			position: {
				x: position.x,
				y: position.y,
			},
		})
	}

	return (
		<>
			<SpeedDial
				ariaLabel="Add node"
				sx={{
					position: 'absolute',
					bottom: 16,
					right: 16,
					zIndex: 1000,
					'& .MuiSpeedDial-fab': {
						width: 56,
						height: 56,
						boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
					},
				}}
				icon={<SpeedDialIcon />}>
				{nodeTypes.map(({ type, icon, label }) => (
					<SpeedDialAction
						key={type}
						icon={icon}
						tooltipTitle={label}
						onClick={() => handleAddNode(type)}
					/>
				))}
			</SpeedDial>

			<Tooltip title={showArchived ? 'Hide archived nodes' : 'Show archived nodes'}>
				<IconButton
					aria-label="Toggle archived nodes"
					onClick={onToggleArchived}
					sx={{
						position: 'absolute',
						bottom: 16,
						left: 16,
						zIndex: 1000,
						bgcolor: 'background.paper',
						boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
						'&:hover': {
							bgcolor: 'action.hover',
						},
					}}>
					{showArchived ? <UnarchiveIcon /> : <ArchiveIcon />}
				</IconButton>
			</Tooltip>
		</>
	)
}
