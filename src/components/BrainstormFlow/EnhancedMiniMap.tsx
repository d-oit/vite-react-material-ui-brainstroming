import {
	ZoomIn as ZoomInIcon,
	ZoomOut as ZoomOutIcon,
	Fullscreen as ExpandIcon,
	FullscreenExit as CollapseIcon,
	Visibility as ShowIcon,
	VisibilityOff as HideIcon,
} from '@mui/icons-material'
import { Box, IconButton, Tooltip, useTheme } from '@mui/material'
import React, { useState } from 'react'
import { MiniMap as ReactFlowMiniMap } from 'reactflow'

import { useI18n } from '../../contexts/I18nContext'
import type { Node, Edge } from '../../types'

interface EnhancedMiniMapProps {
	nodes: Node[];
	edges: Edge[];
	onNodeClick: (nodeId: string) => void;
	onZoomIn?: () => void;
	onZoomOut?: () => void;
	onFitView?: () => void;
	nodeColor?: string | ((node: Node) => string);
	nodeBorderRadius?: number;
	nodeStrokeWidth?: number;
	nodeStrokeColor?: string;
	maskColor?: string;
	backgroundColor?: string;
	borderColor?: string;
	zoomable?: boolean;
	pannable?: boolean;
	defaultVisible?: boolean;
	defaultExpanded?: boolean;
}

export const EnhancedMiniMap: React.FC<EnhancedMiniMapProps> = ({
	nodes,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	edges,
	onNodeClick,
	onZoomIn,
	onZoomOut,
	onFitView,
	nodeColor,
	nodeBorderRadius = 4,
	nodeStrokeWidth = 2,
	nodeStrokeColor,
	maskColor,
	backgroundColor,
	borderColor,
	zoomable = true,
	pannable = true,
	defaultVisible = true,
	defaultExpanded = false,
}) => {
	const theme = useTheme()
	const { t } = useI18n()
	const [visible, setVisible] = useState(defaultVisible)
	const [expanded, setExpanded] = useState(defaultExpanded)

	// Default colors based on theme
	const defaultBackgroundColor =
		theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[100]

	const defaultBorderColor = theme.palette.divider

	const defaultMaskColor =
		theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)'

	const defaultNodeStrokeColor =
		theme.palette.mode === 'dark' ? theme.palette.grey[300] : theme.palette.grey[700]

	// If not visible, just show the toggle button
	if (!visible) {
		return (
			<Box
				sx={{
					zIndex: 1000,
				}}
			>
				<Tooltip title={t('flow.showMiniMap') || 'Show mini map'}>
					<IconButton
						onClick={() => setVisible(true)}
						size="small"
						sx={{
							backgroundColor: defaultBackgroundColor,
							border: `1px solid ${defaultBorderColor}`,
							'&:hover': {
								backgroundColor:
									theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200],
							},
						}}
						aria-label={t('flow.showMiniMap') || 'Show mini map'}
					>
						<ShowIcon fontSize="small" />
					</IconButton>
				</Tooltip>
			</Box>
		)
	}

	return (
		<Box
			sx={{
				zIndex: 1000,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'flex-end',
			}}
			role="region"
			aria-label={t('flow.miniMap') || 'Flow minimap'}
		>
			{/* MiniMap first */}
			<Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
				{/* Controls positioned on the left side of the minimap */}
				<Box
					id="minimap-box-btn"
					sx={{
						display: 'flex',
						flexDirection: 'column',
						gap: 0.5,
						marginRight: 1,
						zIndex: 1001,
					}}
				>
					<Tooltip title={t('flow.hideMiniMap') || 'Hide mini map'} placement="left">
						<IconButton
							onClick={() => setVisible(false)}
							size="small"
							sx={{
								backgroundColor: defaultBackgroundColor,
								border: `1px solid ${defaultBorderColor}`,
								'&:hover': {
									backgroundColor:
										theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200],
								},
							}}
							aria-label={t('flow.hideMiniMap') || 'Hide mini map'}
						>
							<HideIcon fontSize="small" />
						</IconButton>
					</Tooltip>
				</Box>

				<ReactFlowMiniMap
					nodes={nodes}
					nodeColor={nodeColor}
					nodeBorderRadius={nodeBorderRadius}
					nodeStrokeWidth={nodeStrokeWidth}
					nodeStrokeColor={nodeStrokeColor || defaultNodeStrokeColor}
					maskColor={maskColor || defaultMaskColor}
					zoomable={zoomable}
					pannable={pannable}
					onNodeClick={onNodeClick}
					style={{
						backgroundColor: backgroundColor || defaultBackgroundColor,
						border: `1px solid ${borderColor || defaultBorderColor}`,
						width: expanded ? 240 : 160,
						height: expanded ? 180 : 120,
						transition: 'width 0.3s ease, height 0.3s ease',
						boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
						borderRadius: 4,
					}}
					aria-hidden="true"
					id="minimap-container"
				/>
			</Box>
		</Box>
	)
}

export default EnhancedMiniMap
