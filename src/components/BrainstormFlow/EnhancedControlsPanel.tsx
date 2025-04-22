import {
	Add as AddIcon,
	Delete as DeleteIcon,
	Save as SaveIcon,
	Undo as UndoIcon,
	Redo as RedoIcon,
	ContentCopy as CopyIcon,
	ContentPaste as PasteIcon,
	ContentCut as CutIcon,
	FormatColorFill as FillIcon,
	BorderColor as BorderColorIcon,
	TextFields as TextIcon,
	Settings as SettingsIcon,
	ZoomIn as ZoomInIcon,
	ZoomOut as ZoomOutIcon,
	FitScreen as FitViewIcon,
	GridOn as GridIcon,
	GridOff as GridOffIcon,
	Menu as MenuIcon,
	Close as CloseIcon,
} from '@mui/icons-material'
import {
	Box,
	Fab,
	IconButton,
	Tooltip,
	useTheme,
	useMediaQuery,
	Menu,
	MenuItem,
	ListItemIcon,
	ListItemText,
	Divider,
	Paper,
	Typography,
	Drawer,
	Button,
	Slider,
	TextField,
	InputAdornment,
	alpha,
} from '@mui/material'
import React, { useState, useRef, useEffect } from 'react'

import { useI18n } from '../../contexts/I18nContext'

interface EnhancedControlsPanelProps {
	onAddNode?: () => void
	onDelete?: () => void
	onSave?: () => void
	onUndo?: () => void
	onRedo?: () => void
	onCopy?: () => void
	onPaste?: () => void
	onCut?: () => void
	onOpenNodeStyle?: () => void
	onOpenEdgeStyle?: () => void
	onOpenTextStyle?: () => void
	onOpenSettings?: () => void
	onZoomIn?: () => void
	onZoomOut?: () => void
	onFitView?: () => void
	onToggleGrid?: () => void
	onZoomChange?: (zoom: number) => void
	canUndo?: boolean
	canRedo?: boolean
	hasSelection?: boolean
	hasCopiedItems?: boolean
	showGrid?: boolean
	currentZoom?: number
}

/**
 * Enhanced controls panel with a clean, non-overlapping UI
 * Based on the provided screenshot design
 */
const EnhancedControlsPanel: React.FC<EnhancedControlsPanelProps> = ({
	onAddNode,
	onDelete,
	onSave,
	onUndo,
	onRedo,
	onCopy,
	onPaste,
	onCut,
	onOpenNodeStyle,
	onOpenEdgeStyle,
	onOpenTextStyle,
	onOpenSettings,
	onZoomIn,
	onZoomOut,
	onFitView,
	onToggleGrid,
	onZoomChange,
	canUndo = false,
	canRedo = false,
	hasSelection = false,
	hasCopiedItems = false,
	showGrid = true,
	currentZoom = 1,
}) => {
	const { t } = useI18n()
	const theme = useTheme()
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
	const [zoomValue, setZoomValue] = useState<number>(currentZoom * 100)

	// Update zoom value when currentZoom changes
	useEffect(() => {
		setZoomValue(Math.round(currentZoom * 100))
	}, [currentZoom])

	// Handle zoom input change
	const handleZoomChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = parseInt(event.target.value, 10)
		if (!isNaN(newValue) && newValue > 0 && newValue <= 200) {
			setZoomValue(newValue)
			onZoomChange?.(newValue / 100)
		}
	}

	return (
		<Paper
			elevation={3}
			sx={{
				position: 'absolute',
				top: 16,
				left: '50%',
				transform: 'translateX(-50%)',
				display: 'flex',
				flexDirection: { xs: 'column', sm: 'row' },
				borderRadius: 2,
				p: 1,
				gap: 1,
				zIndex: 100, // Higher z-index to ensure it's above other elements
				backgroundColor: alpha(theme.palette.background.paper, 0.98), // More opaque for better visibility
				backdropFilter: 'blur(8px)',
				boxShadow: theme.shadows[4], // Stronger shadow for better visibility
				maxWidth: { xs: '95%', sm: 'auto' },
				transition: 'all 0.3s ease',
				border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, // Subtle border for better definition
			}}>
			{/* Edit tools group */}
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					bgcolor: alpha(theme.palette.background.default, 0.4),
					borderRadius: 1,
					p: 0.5,
				}}>
				<Tooltip title={t('common.undo') || 'Undo'}>
					<span>
						{' '}
						{/* Wrapper to handle disabled state */}
						<IconButton onClick={onUndo} disabled={!canUndo} size="small" aria-label={t('common.undo')}>
							<UndoIcon fontSize="small" />
						</IconButton>
					</span>
				</Tooltip>

				<Tooltip title={t('common.redo') || 'Redo'}>
					<span>
						{' '}
						{/* Wrapper to handle disabled state */}
						<IconButton onClick={onRedo} disabled={!canRedo} size="small" aria-label={t('common.redo')}>
							<RedoIcon fontSize="small" />
						</IconButton>
					</span>
				</Tooltip>

				{hasSelection && (
					<>
						<Tooltip title={t('common.copy') || 'Copy'}>
							<IconButton onClick={onCopy} size="small" aria-label={t('common.copy')}>
								<CopyIcon fontSize="small" />
							</IconButton>
						</Tooltip>

						<Tooltip title={t('common.cut') || 'Cut'}>
							<IconButton onClick={onCut} size="small" aria-label={t('common.cut')}>
								<CutIcon fontSize="small" />
							</IconButton>
						</Tooltip>
					</>
				)}

				{hasCopiedItems && (
					<Tooltip title={t('common.paste') || 'Paste'}>
						<IconButton onClick={onPaste} size="small" aria-label={t('common.paste')}>
							<PasteIcon fontSize="small" />
						</IconButton>
					</Tooltip>
				)}
			</Box>

			{/* Zoom controls group */}
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					bgcolor: alpha(theme.palette.background.default, 0.4),
					borderRadius: 1,
					p: 0.5,
				}}>
				<Tooltip title={t('common.zoomOut') || 'Zoom Out'}>
					<IconButton onClick={onZoomOut} size="small" aria-label={t('common.zoomOut')}>
						<ZoomOutIcon fontSize="small" />
					</IconButton>
				</Tooltip>

				{!isMobile && (
					<Box
						component="form"
						sx={{
							display: 'flex',
							alignItems: 'center',
							width: 64,
							mx: 0.5,
						}}
						onSubmit={(e) => e.preventDefault()}>
						<TextField
							value={zoomValue}
							onChange={handleZoomChange}
							variant="standard"
							size="small"
							InputProps={{
								endAdornment: <InputAdornment position="end">%</InputAdornment>,
								sx: { fontSize: '0.875rem' },
							}}
							aria-label={t('common.zoomLevel')}
							sx={{ width: '100%' }}
						/>
					</Box>
				)}

				<Tooltip title={t('common.zoomIn') || 'Zoom In'}>
					<IconButton onClick={onZoomIn} size="small" aria-label={t('common.zoomIn')}>
						<ZoomInIcon fontSize="small" />
					</IconButton>
				</Tooltip>

				<Tooltip title={t('common.fitView') || 'Fit View'}>
					<IconButton onClick={onFitView} size="small" aria-label={t('common.fitView')}>
						<FitViewIcon fontSize="small" />
					</IconButton>
				</Tooltip>
			</Box>

			{/* Node/Edge styling group */}
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					bgcolor: alpha(theme.palette.background.default, 0.4),
					borderRadius: 1,
					p: 0.5,
				}}>
				<Tooltip title={t('common.addNode') || 'Add Node'}>
					<IconButton onClick={onAddNode} size="small" color="primary" aria-label={t('common.addNode')}>
						<AddIcon fontSize="small" />
					</IconButton>
				</Tooltip>

				{hasSelection && (
					<Tooltip title={t('common.delete') || 'Delete'}>
						<IconButton onClick={onDelete} size="small" color="error" aria-label={t('common.delete')}>
							<DeleteIcon fontSize="small" />
						</IconButton>
					</Tooltip>
				)}

				<Tooltip title={t('common.nodeStyle') || 'Node Style'}>
					<IconButton onClick={onOpenNodeStyle} size="small" aria-label={t('common.nodeStyle')}>
						<FillIcon fontSize="small" />
					</IconButton>
				</Tooltip>

				<Tooltip title={t('common.edgeStyle') || 'Edge Style'}>
					<IconButton onClick={onOpenEdgeStyle} size="small" aria-label={t('common.edgeStyle')}>
						<BorderColorIcon fontSize="small" />
					</IconButton>
				</Tooltip>

				<Tooltip title={t('common.toggleGrid') || 'Toggle Grid'}>
					<IconButton
						onClick={onToggleGrid}
						color={showGrid ? 'primary' : 'default'}
						size="small"
						aria-label={t('common.toggleGrid')}>
						<GridIcon fontSize="small" />
					</IconButton>
				</Tooltip>
			</Box>

			{/* Save and settings */}
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					bgcolor: alpha(theme.palette.background.default, 0.4),
					borderRadius: 1,
					p: 0.5,
				}}>
				<Tooltip title={t('common.save') || 'Save'}>
					<IconButton onClick={onSave} size="small" color="primary" aria-label={t('common.save')}>
						<SaveIcon fontSize="small" />
					</IconButton>
				</Tooltip>

				<Tooltip title={t('common.settings') || 'Settings'}>
					<IconButton onClick={onOpenSettings} size="small" aria-label={t('common.settings')}>
						<SettingsIcon fontSize="small" />
					</IconButton>
				</Tooltip>
			</Box>
		</Paper>
	)
}

export default EnhancedControlsPanel
