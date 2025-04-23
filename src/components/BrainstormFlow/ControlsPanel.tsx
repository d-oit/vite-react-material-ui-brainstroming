import {
	ZoomIn as ZoomInIcon,
	ZoomOut as ZoomOutIcon,
	Fullscreen as FullscreenIcon,
	FullscreenExit as FullscreenExitIcon,
	GridOn as GridOnIcon,
	GridOff as GridOffIcon,
	Settings as SettingsIcon,
	AutoFixHigh as AutoFixHighIcon,
} from '@mui/icons-material'
import {
	Box,
	IconButton,
	Tooltip,
	Stack,
	useTheme,
	alpha,
} from '@mui/material'

interface ControlsPanelProps {
	handleSettingsOpen: (event: React.MouseEvent<HTMLElement>) => void
	toggleGrid: () => void
	toggleFullscreen: () => void
	zoomIn: () => void
	zoomOut: () => void
	handleAutoLayout?: () => void
	isFullscreen: boolean
	showGrid: boolean
}

export default function ControlsPanel({
	handleSettingsOpen,
	toggleGrid,
	toggleFullscreen,
	zoomIn,
	zoomOut,
	handleAutoLayout,
	isFullscreen,
	showGrid,
}: ControlsPanelProps) {
	const theme = useTheme()

	return (
		<Box
			sx={{
				backgroundColor: alpha(theme.palette.background.paper, 0.8),
				backdropFilter: 'blur(8px)',
				borderRadius: 1,
				p: 0.5,
				border: 1,
				borderColor: 'divider',
			}}>
			<Stack direction="row" spacing={0.5}>
				<Tooltip title="Zoom in">
					<IconButton
						onClick={zoomIn}
						size="small"
						color="primary"
						aria-label="Zoom in">
						<ZoomInIcon />
					</IconButton>
				</Tooltip>
				<Tooltip title="Zoom out">
					<IconButton
						onClick={zoomOut}
						size="small"
						color="primary"
						aria-label="Zoom out">
						<ZoomOutIcon />
					</IconButton>
				</Tooltip>
				<Tooltip title={showGrid ? 'Hide grid' : 'Show grid'}>
					<IconButton
						onClick={toggleGrid}
						size="small"
						color="primary"
						aria-label={showGrid ? 'Hide grid' : 'Show grid'}>
						{showGrid ? <GridOffIcon /> : <GridOnIcon />}
					</IconButton>
				</Tooltip>
				{handleAutoLayout && (
					<Tooltip title="Auto-arrange nodes">
						<IconButton
							onClick={handleAutoLayout}
							size="small"
							color="primary"
							aria-label="Auto-arrange nodes">
							<AutoFixHighIcon />
						</IconButton>
					</Tooltip>
				)}
				<Tooltip title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
					<IconButton
						onClick={toggleFullscreen}
						size="small"
						color="primary"
						aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
						{isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
					</IconButton>
				</Tooltip>
				<Tooltip title="Settings">
					<IconButton
						onClick={handleSettingsOpen}
						size="small"
						color="primary"
						aria-label="Open settings">
						<SettingsIcon />
					</IconButton>
				</Tooltip>
			</Stack>
		</Box>
	)
}
