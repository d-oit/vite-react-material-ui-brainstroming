import { ZoomIn, ZoomOut, FitScreen, GridOn, GridOff, Fullscreen, FullscreenExit } from '@mui/icons-material'
import { Box, IconButton, Tooltip, Slider, alpha, useTheme } from '@mui/material'
import React from 'react'

import { useI18n } from '../../hooks/useI18n'

interface EnhancedZoomControlsProps {
	zoomIn: () => void
	zoomOut: () => void
	fitView: () => void
	zoomLevel: number
	onZoomChange: (zoom: number) => void
	showGrid: boolean
	onToggleGrid: () => void
	isFullscreen: boolean
	onToggleFullscreen: () => void
}

const EnhancedZoomControls: React.FC<EnhancedZoomControlsProps> = ({
	zoomIn,
	zoomOut,
	fitView,
	zoomLevel,
	onZoomChange,
	showGrid,
	onToggleGrid,
	isFullscreen,
	onToggleFullscreen,
}) => {
	const theme = useTheme()
	const { t } = useI18n()

	return (
		<Box
			sx={{
				position: 'absolute',
				top: 10,
				right: 10,
				zIndex: 10,
				display: 'flex',
				flexDirection: 'column',
				gap: 0.5,
				backgroundColor: alpha(theme.palette.background.paper, 0.95),
				backdropFilter: 'blur(8px)',
				borderRadius: 2,
				padding: 0.5,
				boxShadow: theme.shadows[3],
			}}
		>
			<Tooltip title={t('brainstorm.zoomIn') || 'Zoom In'}>
				<IconButton onClick={zoomIn} size="small">
					<ZoomIn fontSize="small" />
				</IconButton>
			</Tooltip>

			<Tooltip title={t('brainstorm.zoomOut') || 'Zoom Out'}>
				<IconButton onClick={zoomOut} size="small">
					<ZoomOut fontSize="small" />
				</IconButton>
			</Tooltip>

			<Tooltip title={t('brainstorm.fitView') || 'Fit View'}>
				<IconButton onClick={fitView} size="small">
					<FitScreen fontSize="small" />
				</IconButton>
			</Tooltip>

			<Slider
				orientation="vertical"
				min={0.1}
				max={1.5}
				step={0.1}
				value={zoomLevel}
				onChange={(_, value) => onZoomChange(value as number)}
				sx={{ height: 80, my: 1 }}
			/>

			<Tooltip title={t('brainstorm.toggleGrid') || (showGrid ? 'Hide Grid' : 'Show Grid')}>
				<IconButton onClick={onToggleGrid} size="small">
					{showGrid ? <GridOff fontSize="small" /> : <GridOn fontSize="small" />}
				</IconButton>
			</Tooltip>

			<Tooltip title={t('brainstorm.toggleFullscreen') || (isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen')}>
				<IconButton onClick={onToggleFullscreen} size="small">
					{isFullscreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
				</IconButton>
			</Tooltip>
		</Box>
	)
}

export default EnhancedZoomControls
export { EnhancedZoomControls }
