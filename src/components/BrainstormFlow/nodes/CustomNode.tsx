import ChatIcon from '@mui/icons-material/Chat'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import NoteAddIcon from '@mui/icons-material/NoteAdd'
import { Box, IconButton, Paper, Typography, useTheme, useMediaQuery, Chip } from '@mui/material'
import React, { memo, useState, useMemo } from 'react'
import type { NodeProps } from 'reactflow'
import { Handle, Position } from 'reactflow'

import { useSettings } from '../../../contexts/SettingsContext'
import type { NodeType } from '../../../types/enums'
import type { NodeData } from '../types'

const CustomNode: React.FC<NodeProps<NodeData>> = ({ data, selected, id }) => {
	const [showNotes, setShowNotes] = useState(false)

	const { getNodeColor, nodePreferences, settings } = useSettings()
	const theme = useTheme()
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

	// Calculate node size based on settings
	const nodeSize = useMemo(() => {
		if (!nodePreferences) return { width: 200, fontSize: 1 }

		// Use preferred size from settings
		const preferredSize = settings.preferredNodeSize || 'medium'

		// Get the size configuration
		let sizeConfig
		switch (preferredSize) {
		case 'small':
			sizeConfig = nodePreferences.nodeSizes.small
			break
		case 'large':
			sizeConfig = nodePreferences.nodeSizes.large
			break
		case 'medium':
		default:
			sizeConfig = nodePreferences.nodeSizes.medium
			break
		}

		// Adjust size for mobile devices
		const width = isMobile ? Math.min(sizeConfig.width, window.innerWidth * 0.8) : sizeConfig.width

		return {
			width: width,
			fontSize: sizeConfig.fontSize,
		}
	}, [nodePreferences, settings.preferredNodeSize, isMobile])

	const getNodeStyle = () => {
		const baseStyle = {
			padding: 2,
			minWidth: nodeSize.width,
			width: nodeSize.width,
			borderRadius: 1,
			fontSize: `${nodeSize.fontSize}rem`,
		}

		// Get color from settings
		const backgroundColor = data.color || getNodeColor(data.type)

		return {
			...baseStyle,
			backgroundColor,
			border: selected ? `2px solid ${theme.palette.primary.main}` : '1px solid #ccc',
		}
	}

	return (
		<Paper elevation={selected ? 3 : 1} sx={getNodeStyle()}>
			<Handle type="target" position={Position.Top} />

			<Box sx={{ p: 1 }}>
				<Typography variant="body1">{data.label || data.title}</Typography>

				{data.tags && data.tags.length > 0 && (
					<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5, mb: 1 }}>
						{data.tags.map((tag) => (
							<Chip
								key={tag}
								label={tag}
								size="small"
								sx={{
									height: 20,
									fontSize: '0.7rem',
									backgroundColor: `${theme.palette.primary.main}20`,
								}}
							/>
						))}
					</Box>
				)}

				{data.content && (
					<Typography
						variant="body2"
						sx={{
							mt: 1,
							color: theme.palette.text.secondary,
							fontSize: '0.85em',
							whiteSpace: 'pre-wrap',
							wordBreak: 'break-word',
						}}>
						{data.content}
					</Typography>
				)}

				<Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 1 }}>
					<IconButton
						size="small"
						onClick={() => setShowNotes(!showNotes)}
						color={showNotes ? 'primary' : 'default'}>
						<NoteAddIcon fontSize="small" />
					</IconButton>
					<IconButton
						size="small"
						onClick={() => data.onEdit?.(id)}
						data-testid={`edit-${id}`}>
						<EditIcon fontSize="small" />
					</IconButton>
					<IconButton
						size="small"
						color="error"
						onClick={(e) => {
							e.stopPropagation() // Prevent node selection
							data.onDelete?.(id, e)
						}}
						data-testid={`delete-${id}`}
						aria-label="Delete node"
						title="Delete node">
						<DeleteIcon fontSize="small" />
					</IconButton>
					<IconButton
						size="small"
						color="primary"
						onClick={() => data.onChat?.(id)}
						data-testid={`chat-${id}`}>
						<ChatIcon fontSize="small" />
					</IconButton>
				</Box>

				{showNotes && data.content && (
					<Box sx={{ mt: 1, p: 1, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 1 }}>
						<Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
							{data.content}
						</Typography>
					</Box>
				)}
			</Box>

			<Handle type="source" position={Position.Bottom} />
		</Paper>
	)
}

export default memo(CustomNode)
