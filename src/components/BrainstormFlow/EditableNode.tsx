import {
	Edit as EditIcon,
	Delete as DeleteIcon,
	Check as SaveIcon,
	Close as CancelIcon,
	FormatColorFill as StyleIcon,
	ContentCopy as DuplicateIcon,
} from '@mui/icons-material'
import {
	Card,
	CardContent,
	Typography,
	Box,
	IconButton,
	Chip,
	useTheme,
	useMediaQuery,
	TextField,
	InputAdornment,
	Tooltip,
} from '@mui/material'
import React, { useState, useRef, useEffect, memo, useMemo } from 'react'
import type { NodeProps } from 'reactflow'
import { Handle, Position } from 'reactflow'

import { useI18n } from '../../contexts/I18nContext'
import { useSettings } from '../../contexts/SettingsContext'
import type { NodeData, NodeType } from '../../types'

import NodeInlineEditor from './NodeInlineEditor'

interface EditableNodeProps extends NodeProps {
	data: NodeData & {
		onEdit?: (id: string) => void
		onDelete?: (id: string, event: React.MouseEvent) => void
		onDuplicate?: (id: string) => void
		onStyle?: (id: string) => void
		onSaveDirectEdit?: (id: string, newData: { label: string; content: string }) => void
	}
}

// Border colors are derived from the node colors
const getNodeBorderColor = (backgroundColor: string): string => {
	// Convert hex to RGB and darken
	const hex = backgroundColor.replace('#', '')
	const r = parseInt(hex.substring(0, 2), 16)
	const g = parseInt(hex.substring(2, 4), 16)
	const b = parseInt(hex.substring(4, 6), 16)

	// Darken the color by reducing brightness
	const darkenFactor = 0.6 // 60% darker
	const darkerR = Math.floor(r * darkenFactor)
	const darkerG = Math.floor(g * darkenFactor)
	const darkerB = Math.floor(b * darkenFactor)

	return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`
}

const EditableNode = ({ data, id, type, selected }: EditableNodeProps) => {
	const nodeType = type as NodeType
	const { getNodeColor, nodePreferences } = useSettings()
	const theme = useTheme()
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
	const { t } = useI18n()

	// State for direct editing
	const [isEditing, setIsEditing] = useState(false)
	const [editingField, setEditingField] = useState<'label' | 'content' | null>(null)
	const [editedLabel, setEditedLabel] = useState(data.label)
	const [editedContent, setEditedContent] = useState(data.content)
	const labelInputRef = useRef<HTMLInputElement>(null)
	const contentInputRef = useRef<HTMLInputElement>(null)

	// Get node color from settings context
	const backgroundColor = getNodeColor(nodeType, data.color)
	const borderColor = getNodeBorderColor(backgroundColor)

	// Check if touch optimization is enabled
	const isTouchOptimized = nodePreferences?.touchOptimized === true

	// Calculate node size based on preferences, node data, and screen size
	const nodeSize = useMemo(() => {
		if (!nodePreferences) return { width: 200, fontSize: 1 }

		// Use node-specific size if available, otherwise use default
		const size = data.size !== undefined ? data.size : nodePreferences.defaultSize

		// Ensure we have a valid size value
		const validSize = ['small', 'medium', 'large'].includes(size) ? size : 'medium'

		// Get the size configuration from node preferences
		// Use a type-safe approach to avoid object injection
		let sizeConfig
		switch (validSize) {
		case 'small':
			sizeConfig = nodePreferences.nodeSizes.small
			break
		case 'medium':
			sizeConfig = nodePreferences.nodeSizes.medium
			break
		case 'large':
			sizeConfig = nodePreferences.nodeSizes.large
			break
		default:
			sizeConfig = null
		}

		if (!sizeConfig) {
			console.error('Invalid size configuration for node:', { size, validSize, nodePreferences })
			// Fallback to medium if sizeConfig is undefined
			return {
				width: 200,
				fontSize: 1,
				padding: 1,
				iconSize: 'small',
				chipSize: 'small',
				maxContentLines: 4,
			}
		}

		// Get viewport width for responsive sizing
		const viewportWidth = window.innerWidth

		// Adjust for different screen sizes
		if (isMobile) {
			return {
				width: Math.min(sizeConfig.width, viewportWidth * 0.8), // 80% of viewport on mobile
				fontSize: sizeConfig.fontSize * 0.9, // Slightly smaller font on mobile
				padding: 0.75, // Reduced padding on mobile
				iconSize: 'small', // Smaller icons on mobile
				chipSize: 'small', // Smaller chips on mobile
				maxContentLines: 3, // Fewer content lines on mobile
			}
		} else if (viewportWidth < 1024) {
			// Tablet
			return {
				width: Math.min(sizeConfig.width, viewportWidth * 0.4), // 40% of viewport on tablet
				fontSize: sizeConfig.fontSize * 0.95, // Slightly smaller font on tablet
				padding: 1, // Standard padding on tablet
				iconSize: 'small', // Standard icons on tablet
				chipSize: 'small', // Standard chips on tablet
				maxContentLines: 4, // Standard content lines on tablet
			}
		}

		// Desktop
		return {
			...sizeConfig,
			padding: 1.5, // Standard padding on desktop
			iconSize: 'small', // Standard icons on desktop
			chipSize: 'small', // Standard chips on desktop
			maxContentLines: 5, // Standard content lines on desktop
		}
	}, [nodePreferences, isMobile, data.size])

	// Determine if content should be collapsed based on screen size and content length
	const shouldCollapseContent = useMemo(() => {
		return isMobile && data.content.length > 100 && !isEditing
	}, [isMobile, data.content.length, isEditing])

	// Determine if we should use touch-friendly styles
	const useTouchStyles = useMemo(() => {
		return isMobile || isTouchOptimized
	}, [isMobile, isTouchOptimized])

	// Handle double-click to start editing
	const handleDoubleClick = (field: 'label' | 'content') => (e: React.MouseEvent) => {
		e.stopPropagation()
		if (!isEditing && !isMobile) {
			setIsEditing(true)
			setEditingField(field)
		}
	}

	// Handle save of direct edits
	const handleSaveEdit = () => {
		if (data.onSaveDirectEdit) {
			data.onSaveDirectEdit(id, {
				label: editedLabel,
				content: editedContent,
			})
		}
		setIsEditing(false)
		setEditingField(null)
	}

	// Handle save of inline label edit
	const handleSaveLabelInline = (newLabel: string) => {
		setEditedLabel(newLabel)
		if (data.onSaveDirectEdit) {
			data.onSaveDirectEdit(id, {
				label: newLabel,
				content: data.content,
			})
		}
		setIsEditing(false)
		setEditingField(null)
	}

	// Handle save of inline content edit
	const handleSaveContentInline = (newContent: string) => {
		setEditedContent(newContent)
		if (data.onSaveDirectEdit) {
			data.onSaveDirectEdit(id, {
				label: data.label,
				content: newContent,
			})
		}
		setIsEditing(false)
		setEditingField(null)
	}

	// Handle cancel of direct edits
	const handleCancelEdit = () => {
		setEditedLabel(data.label)
		setEditedContent(data.content)
		setIsEditing(false)
		setEditingField(null)
	}

	// Focus the label input when editing starts
	useEffect(() => {
		if (isEditing && labelInputRef.current) {
			labelInputRef.current.focus()
		}
	}, [isEditing])

	// Handle keyboard shortcuts for editing
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (isEditing) {
			if (e.key === 'Escape') {
				handleCancelEdit()
			} else if (e.key === 'Enter' && e.ctrlKey) {
				handleSaveEdit()
			}
		}
	}

	return (
		<Card
			sx={{
				minWidth: isMobile ? '90%' : nodeSize.width,
				maxWidth: isMobile ? '95%' : nodeSize.width * 1.5,
				width: isMobile ? '90%' : nodeSize.width,
				backgroundColor,
				borderLeft: `4px solid ${borderColor}`,
				boxShadow: selected ? 4 : 2,
				transition: 'all 0.2s ease',
				fontSize: `${nodeSize.fontSize}rem`,
				'&:hover': {
					boxShadow: 4,
					transform: isMobile ? 'none' : 'translateY(-2px)',
				},
				// Touch-friendly styles for mobile or when touch optimization is enabled
				...(useTouchStyles && {
					padding: '4px',
					'& .react-flow__handle': {
						width: '14px',
						height: '14px',
					},
				}),
			}}
			role="article"
			aria-label={`${nodeType.toLowerCase()} node: ${data.label}`}
			tabIndex={0}
			// Double click is now handled on individual elements
			onKeyDown={handleKeyDown}>
			<Handle
				type="target"
				position={Position.Top}
				style={{
					width: 10,
					height: 10,
					background: borderColor,
					border: '2px solid white',
					zIndex: 10,
				}}
				className="react-flow__handle-custom"
				aria-label="Connection target point"
				role="button"
				tabIndex={0}
			/>

			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					p: 1,
					borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
				}}>
				{isEditing ? (
					<TextField
						inputRef={labelInputRef}
						value={editedLabel}
						onChange={(e) => setEditedLabel(e.target.value)}
						size="small"
						fullWidth
						variant="standard"
						placeholder={t('flow.nodeTitle') || 'Node title'}
						sx={{
							fontSize: `calc(${nodeSize.fontSize}rem * 1.1)`,
							fontWeight: 'bold',
							'& .MuiInputBase-input': {
								fontSize: `calc(${nodeSize.fontSize}rem * 1.1)`,
								fontWeight: 'bold',
							},
						}}
						InputProps={{
							endAdornment: (
								<InputAdornment position="end">
									<Tooltip title={t('flow.saveChanges') || 'Save changes'}>
										<IconButton
											size="small"
											onClick={handleSaveEdit}
											aria-label={t('flow.saveChanges') || 'Save changes'}>
											<SaveIcon fontSize="small" />
										</IconButton>
									</Tooltip>
									<Tooltip title={t('flow.cancelChanges') || 'Cancel changes'}>
										<IconButton
											size="small"
											onClick={handleCancelEdit}
											aria-label={t('flow.cancelChanges') || 'Cancel changes'}>
											<CancelIcon fontSize="small" />
										</IconButton>
									</Tooltip>
								</InputAdornment>
							),
						}}
					/>
				) : (
					<>
						<Box
							sx={{
								position: 'relative',
								maxWidth: isMobile ? '150px' : '200px',
							}}
							onDoubleClick={handleDoubleClick('label')}>
							{editingField === 'label' ? (
								<NodeInlineEditor
									initialText={data.label}
									onSave={handleSaveLabelInline}
									onCancel={handleCancelEdit}
									nodeId={id}
								/>
							) : (
								<Typography
									variant="subtitle1"
									fontWeight="bold"
									sx={{
										fontSize: `calc(${nodeSize.fontSize}rem * 1.1)`,
										overflow: 'hidden',
										textOverflow: 'ellipsis',
										whiteSpace: 'nowrap',
										maxWidth: '100%',
									}}>
									{data.label}
								</Typography>
							)}
						</Box>

						<Box>
							{!isMobile && (
								<>
									<Tooltip title={t('flow.styleNode') || 'Style node'}>
										<IconButton
											size="small"
											onClick={() => data.onStyle?.(id)}
											aria-label={t('flow.styleNode') || 'Style node'}>
											<StyleIcon fontSize="small" />
										</IconButton>
									</Tooltip>
									<Tooltip title={t('flow.duplicateNode') || 'Duplicate node'}>
										<IconButton
											size="small"
											onClick={() => data.onDuplicate?.(id)}
											aria-label={t('flow.duplicateNode') || 'Duplicate node'}>
											<DuplicateIcon fontSize="small" />
										</IconButton>
									</Tooltip>
								</>
							)}
							<Tooltip title={t('flow.editNode') || 'Edit node'}>
								<IconButton
									size="small"
									onClick={() => data.onEdit?.(id)}
									aria-label={t('flow.editNode') || 'Edit node'}>
									<EditIcon fontSize="small" />
								</IconButton>
							</Tooltip>
							<Tooltip title={t('flow.deleteNode') || 'Delete node'}>
								<IconButton
									size="small"
									onClick={(e) => {
										e.stopPropagation() // Prevent node selection
										data.onDelete?.(id, e)
									}}
									aria-label={t('flow.deleteNode') || 'Delete node'}
									color="error">
									<DeleteIcon fontSize="small" />
								</IconButton>
							</Tooltip>
						</Box>
					</>
				)}
			</Box>

			<CardContent sx={{ p: nodeSize.padding }}>
				{/* Tags section - moved above content for better information hierarchy */}
				{data.tags && data.tags.length > 0 && !isEditing && (
					<Box
						sx={{
							display: 'flex',
							flexWrap: 'wrap',
							gap: 0.5,
							mb: 1,
							// Hide tags on mobile if there are more than 2
							...(isMobile &&
								data.tags.length > 2 && {
								'& .MuiChip-root:nth-of-type(n+3)': {
									display: 'none',
								},
								'&::after': {
									content: data.tags.length > 2 ? '"..."' : 'none',
									fontSize: '0.75rem',
									opacity: 0.7,
									marginLeft: '4px',
								},
							}),
						}}
						aria-label="Tags"
						role="group">
						{data.tags.map((tag) => (
							<Chip
								key={tag}
								label={tag}
								size={(nodeSize.chipSize as 'small' | 'medium') || 'small'}
								sx={{
									// Make chips more compact on mobile
									...(isMobile && {
										height: '20px',
										'& .MuiChip-label': {
											padding: '0 6px',
											fontSize: '0.625rem',
										},
									}),
									backgroundColor: `${borderColor}40`, // 40 = 25% opacity
								}}
								aria-label={`Tag: ${tag}`}
							/>
						))}
					</Box>
				)}

				{/* Content section */}
				<Box sx={{ position: 'relative' }} onDoubleClick={handleDoubleClick('content')}>
					{editingField === 'content' ? (
						<NodeInlineEditor
							initialText={data.content}
							onSave={handleSaveContentInline}
							onCancel={handleCancelEdit}
							nodeId={id}
						/>
					) : isEditing ? (
						<TextField
							inputRef={contentInputRef}
							value={editedContent}
							onChange={(e) => setEditedContent(e.target.value)}
							multiline
							fullWidth
							variant="outlined"
							placeholder={t('flow.nodeContent') || 'Node content'}
							minRows={3}
							maxRows={10}
							sx={{
								fontSize: `calc(${nodeSize.fontSize}rem * 0.9)`,
								'& .MuiInputBase-input': {
									fontSize: `calc(${nodeSize.fontSize}rem * 0.9)`,
								},
							}}
						/>
					) : (
						<Typography
							variant="body2"
							sx={{
								whiteSpace: 'pre-wrap',
								fontSize: `calc(${nodeSize.fontSize}rem * 0.9)`,
								overflow: 'hidden',
								display: '-webkit-box',
								WebkitLineClamp: nodeSize.maxContentLines,
								WebkitBoxOrient: 'vertical',
								transition: 'all 0.3s ease',
								cursor: shouldCollapseContent ? 'pointer' : 'default',
							}}
							onClick={() => {
								if (shouldCollapseContent && data.onEdit) {
									data.onEdit(id)
								}
							}}
							aria-label={shouldCollapseContent ? 'Collapsed content (tap to expand)' : 'Content'}>
							{shouldCollapseContent
								? `${data.content.substring(0, 100)}... (tap to expand)`
								: data.content}
						</Typography>
					)}
				</Box>
			</CardContent>

			<Handle
				type="source"
				position={Position.Bottom}
				style={{
					width: useTouchStyles ? 14 : 10,
					height: useTouchStyles ? 14 : 10,
					background: borderColor,
					border: '2px solid white',
					zIndex: 10,
					// Make handles easier to tap on mobile or when touch optimization is enabled
					...(useTouchStyles && {
						bottom: -8,
					}),
				}}
				className="react-flow__handle-custom"
				aria-label="Connection source point"
				role="button"
				tabIndex={0}
			/>
		</Card>
	)
}

export default memo(EditableNode)
