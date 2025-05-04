import {
	Edit as EditIcon,
	Delete as DeleteIcon,
	Archive as ArchiveIcon,
	CloudUpload as CloudUploadIcon,
	Star as StarIcon,
	StarBorder as StarBorderIcon,
	MoreVert as MoreVertIcon,
} from '@mui/icons-material'
import {
	Card,
	CardContent,
	CardHeader,
	Typography,
	Box,
	Chip,
	IconButton,
	Menu,
	MenuItem,
	ListItemIcon,
	ListItemText,
	alpha,
	useTheme,
	Tooltip,
	CardActionArea,
	Divider,
} from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useI18n } from '../../contexts/I18nContext'
import type { Project , NodeType } from '../../types'
import { NODE_TYPES } from '../../types'
import { formatDate } from '../../utils/dateUtils'

interface ProjectCardProps {
	project: Project
	onDelete?: (id: string) => void
	onArchive?: (id: string) => void
	onSync?: (id: string) => void
	onPin?: (id: string, isPinned: boolean) => void
}

export const ProjectCard = ({ project, onDelete, onArchive, onSync, onPin }: ProjectCardProps) => {
	const theme = useTheme()
	const navigate = useNavigate()
	const { t } = useI18n()
	const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
	const [isPinned, setIsPinned] = useState(Boolean(project.isPinned))

	const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation()
		setMenuAnchorEl(event.currentTarget)
	}

	const handleMenuClose = () => {
		setMenuAnchorEl(null)
	}

	const handleOpenProject = () => {
		void navigate(`/projects/${project.id}`)
	}

	const handleDelete = (event: React.MouseEvent) => {
		event.stopPropagation()
		if (onDelete) {
			onDelete(project.id)
		}
		handleMenuClose()
	}

	const handleArchive = (event: React.MouseEvent) => {
		event.stopPropagation()
		if (onArchive) {
			onArchive(project.id)
		}
		handleMenuClose()
	}

	const handleSync = (event: React.MouseEvent) => {
		event.stopPropagation()
		if (onSync) {
			onSync(project.id)
		}
		handleMenuClose()
	}

	const handleTogglePin = (event: React.MouseEvent) => {
		event.stopPropagation()
		const newPinnedState = !isPinned
		setIsPinned(newPinnedState)
		if (onPin) {
			onPin(project.id, newPinnedState)
		}
	}

	// Calculate node count by type
	const nodeTypes = project.nodes.reduce<Record<string, number>>((acc, node) => {
		const type = NODE_TYPES.includes(node.type as NodeType) ? node.type : 'unknown'
		// Create a new object to avoid mutation
		return {
			...acc,
			// eslint-disable-next-line security/detect-object-injection
			[type]: (acc[type] || 0) + 1,
		}
	}, {})

	// Get total node count
	const totalNodes = project.nodes.length

	// Format dates
	const createdDate = formatDate(project.createdAt)
	const updatedDate = formatDate(project.updatedAt)

	return (
		<Card
			sx={{
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				transition: theme.transitions.create(['transform', 'box-shadow'], {
					duration: '250ms',
				}),
				'&:hover': {
					transform: 'translateY(-4px)',
					boxShadow: theme.shadows[8],
				},
				position: 'relative',
				overflow: 'hidden', // Change from 'visible' to 'hidden'
				// Set a fixed aspect ratio for consistency
				aspectRatio: '3/2',
			}}>
			{/* Pin button */}
			<Tooltip title={isPinned ? t('project.unpin') : t('project.pin')}>
				<IconButton
					size="small"
					onClick={handleTogglePin}
					sx={{
						position: 'absolute',
						bottom: -1,
						right: -1,
						backgroundColor: theme.palette.background.paper,
						boxShadow: theme.shadows[2],
						zIndex: 1,
						color: isPinned ? theme.palette.primary.main : undefined,
						'&:hover': {
							backgroundColor: alpha(theme.palette.primary.main, 0.1),
						},
					}}>
					{isPinned ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
				</IconButton>
			</Tooltip>

			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'flex-start',
					p: 2,
					pb: 0,
				}}>
				<Typography variant="h6" noWrap sx={{ fontWeight: 600 }}>
					{project.name}
				</Typography>
				<IconButton aria-label="settings" onClick={handleMenuOpen} size="small">
					<MoreVertIcon />
				</IconButton>
			</Box>

			<CardActionArea
				onClick={handleOpenProject}
				sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
				<CardContent sx={{ pt: 1, pb: 2, flexGrow: 1 }}>
					<Typography
						variant="body2"
						color="text.secondary"
						sx={{
							mb: 2,
							display: '-webkit-box',
							WebkitLineClamp: 2,
							WebkitBoxOrient: 'vertical',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							height: '2.86em', // 2 lines of text
						}}>
						{project.description || t('project.noDescription')}
					</Typography>

					<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
						{Object.entries(nodeTypes).map(([type, count]) => (
							<Chip
								key={type}
								label={`${count} ${type}${count !== 1 ? 's' : ''}`}
								size="small"
								sx={{
									backgroundColor: alpha(theme.palette.primary.main, 0.1),
									color: theme.palette.primary.main,
									fontWeight: 500,
								}}
							/>
						))}
						{totalNodes === 0 && (
							<Chip
								label={t('project.empty')}
								size="small"
								sx={{
									backgroundColor: alpha(theme.palette.warning.main, 0.1),
									color: theme.palette.warning.main,
								}}
							/>
						)}
					</Box>

					<Divider sx={{ my: 1.5 }} />

					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
						<Typography variant="caption" color="text.secondary">
							{t('project.created')}: {createdDate}
						</Typography>
						<Typography variant="caption" color="text.secondary">
							{t('project.updated')}: {updatedDate}
						</Typography>
					</Box>
				</CardContent>
			</CardActionArea>

			<Menu
				id={`project-menu-${project.id}`}
				anchorEl={menuAnchorEl}
				open={Boolean(menuAnchorEl)}
				onClose={handleMenuClose}
				onClick={(e) => e.stopPropagation()}
				transformOrigin={{ horizontal: 'right', vertical: 'top' }}
				anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
				PaperProps={{
					elevation: 2,
					sx: {
						minWidth: 180,
						borderRadius: 2,
						mt: 1,
						'& .MuiMenuItem-root': {
							px: 2,
							py: 1,
							borderRadius: 1,
							mx: 0.5,
							my: 0.25,
							'&:hover': {
								backgroundColor: alpha(theme.palette.primary.main, 0.08),
							},
						},
					},
				}}>
				<MenuItem onClick={handleOpenProject}>
					<ListItemIcon>
						<EditIcon fontSize="small" />
					</ListItemIcon>
					<ListItemText>{t('project.open')}</ListItemText>
				</MenuItem>

				{onArchive && (
					<MenuItem onClick={handleArchive}>
						<ListItemIcon>
							<ArchiveIcon fontSize="small" />
						</ListItemIcon>
						<ListItemText>{t('project.archive')}</ListItemText>
					</MenuItem>
				)}

				{onSync && (
					<MenuItem onClick={handleSync}>
						<ListItemIcon>
							<CloudUploadIcon fontSize="small" />
						</ListItemIcon>
						<ListItemText>{t('project.sync')}</ListItemText>
					</MenuItem>
				)}

				<Divider sx={{ my: 1 }} />

				{onDelete && (
					<MenuItem onClick={handleDelete} sx={{ color: theme.palette.error.main }}>
						<ListItemIcon sx={{ color: theme.palette.error.main }}>
							<DeleteIcon fontSize="small" />
						</ListItemIcon>
						<ListItemText>{t('project.delete')}</ListItemText>
					</MenuItem>
				)}
			</Menu>
		</Card>
	)
}

export default ProjectCard
