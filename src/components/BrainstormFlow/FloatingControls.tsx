import ArchiveIcon from '@mui/icons-material/Archive'
import BoltIcon from '@mui/icons-material/Bolt'
import NoteIcon from '@mui/icons-material/Note'
import StorageIcon from '@mui/icons-material/Storage'
import TaskIcon from '@mui/icons-material/Task'
import UnarchiveIcon from '@mui/icons-material/Unarchive'
import { SpeedDial, SpeedDialAction, SpeedDialIcon, IconButton, Tooltip } from '@mui/material'
import React from 'react'
import { useReactFlow } from 'reactflow'

import { useBrainstormStore } from '../../store/brainstormStore'
import { NodeType } from '../../types/enums'

interface FloatingControlsProps {
    position: { x: number; y: number }
    showArchived: boolean
    onToggleArchived: () => void
    viewport?: { zoom: number; x: number; y: number }
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
	position,
	showArchived,
	onToggleArchived,
	viewport = { zoom: 1, x: 0, y: 0 },
}) => {
	const addNode = useBrainstormStore((state) => state.addNode)
	const { fitView } = useReactFlow()

	const handleAddNode = (type: NodeType) => {

		// Calculate position in viewport center
		const flowPosition = {
			x: -viewport.x / viewport.zoom + window.innerWidth / (2 * viewport.zoom),
			y: -viewport.y / viewport.zoom + window.innerHeight / (2 * viewport.zoom),
		}

		addNode({
			type,
			label: `New ${type}`,
			position: flowPosition,
		})

		// Fit view to include all nodes with animation
		fitView({ duration: 500, padding: 0.2 })
	}

	return (
		<>
			<SpeedDial
				ariaLabel="Add node"
				sx={(theme) => ({
					position: 'absolute',
					bottom: theme.spacing(4),
					right: theme.spacing(4),
					zIndex: theme.zIndex.speedDial,
					'& .MuiSpeedDial-fab': {
						width: 56,
						height: 56,
						boxShadow: theme.shadows[4],
						backgroundColor: theme.palette.primary.main,
						'&:hover': {
							backgroundColor: theme.palette.primary.dark,
						},
					},
					'& .MuiSpeedDial-actions': {
						paddingBottom: theme.spacing(0.5),
						gap: theme.spacing(1),
					},
				})}
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
					sx={(theme) => ({
						position: 'absolute',
						bottom: theme.spacing(4),
						left: theme.spacing(4),
						zIndex: theme.zIndex.speedDial,
						bgcolor: theme.palette.background.paper,
						boxShadow: theme.shadows[2],
						'&:hover': {
							bgcolor: theme.palette.action.hover,
						},
					})}>
					{showArchived ? <UnarchiveIcon /> : <ArchiveIcon />}
				</IconButton>
			</Tooltip>
		</>
	)
}
