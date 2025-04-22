import {
	Accessibility as AccessibilityIcon,
	Close as CloseIcon,
	ZoomIn as ZoomInIcon,
	ZoomOut as ZoomOutIcon,
	FitScreen as FitScreenIcon,
	Add as AddIcon,
	Help as HelpIcon,
} from '@mui/icons-material'
import {
	Box,
	Typography,
	Drawer,
	IconButton,
	List,
	ListItem,
	ListItemText,
	Divider,
	Button,
	Switch,
	FormControlLabel,
	Tooltip,
	useTheme,
} from '@mui/material'
import React, { useState } from 'react'

import { useI18n } from '../../contexts/I18nContext'
import type { Node } from '../../types'
import { NodeType } from '../../types'

import AccessibleNode from './AccessibleNode'

interface AccessibilityPanelProps {
	open: boolean
	onClose: () => void
	nodes: Node[]
	onNodeSelect: (nodeId: string) => void
	onNodeEdit: (nodeId: string) => void
	onNodeDelete: (nodeId: string) => void
	onAddNode: (type: NodeType) => void
	onZoomIn: () => void
	onZoomOut: () => void
	onFitView: () => void
	selectedNodeId: string | null
	readOnly?: boolean
}

/**
 * A panel that provides accessibility features for the flow editor
 * This includes keyboard navigation, screen reader support, and high contrast mode
 */
const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({
	open,
	onClose,
	nodes,
	onNodeSelect,
	onNodeEdit,
	onNodeDelete,
	onAddNode,
	onZoomIn,
	onZoomOut,
	onFitView,
	selectedNodeId,
	readOnly = false,
}) => {
	const theme = useTheme()
	const { t } = useI18n()
	const [highContrastMode, setHighContrastMode] = useState(false)
	const [largeTextMode, setLargeTextMode] = useState(false)

	// Apply high contrast styles if enabled
	const getNodeStyle = (node: Node) => {
		if (highContrastMode) {
			return {
				backgroundColor: theme.palette.mode === 'dark' ? '#000000' : '#ffffff',
				borderColor: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
				color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
			}
		}
		return node.style
	}

	// Apply large text styles if enabled
	const textSizeMultiplier = largeTextMode ? 1.5 : 1

	return (
		<Drawer
			anchor="right"
			open={open}
			onClose={onClose}
			PaperProps={{
				sx: {
					width: 350,
					p: 2,
					...(highContrastMode && {
						backgroundColor: theme.palette.mode === 'dark' ? '#000000' : '#ffffff',
						color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
					}),
				},
			}}>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					mb: 2,
				}}>
				<Typography
					variant="h6"
					sx={{ fontSize: `${1.25 * textSizeMultiplier}rem` }}
					id="accessibility-panel-title">
					<AccessibilityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
					{t('accessibility.title') || 'Accessibility Panel'}
				</Typography>
				<IconButton onClick={onClose} aria-label={t('common.close') || 'Close'}>
					<CloseIcon />
				</IconButton>
			</Box>

			<Divider sx={{ mb: 2 }} />

			{/* Accessibility Options */}
			<Typography
				variant="subtitle1"
				sx={{ mb: 1, fontSize: `${1 * textSizeMultiplier}rem` }}
				id="accessibility-options-title">
				{t('accessibility.options') || 'Accessibility Options'}
			</Typography>
			<Box sx={{ mb: 2 }}>
				<FormControlLabel
					control={
						<Switch
							checked={highContrastMode}
							onChange={(e) => setHighContrastMode(e.target.checked)}
							name="highContrastMode"
						/>
					}
					label={
						<Typography sx={{ fontSize: `${0.875 * textSizeMultiplier}rem` }}>
							{t('accessibility.highContrast') || 'High Contrast Mode'}
						</Typography>
					}
				/>
				<FormControlLabel
					control={
						<Switch
							checked={largeTextMode}
							onChange={(e) => setLargeTextMode(e.target.checked)}
							name="largeTextMode"
						/>
					}
					label={
						<Typography sx={{ fontSize: `${0.875 * textSizeMultiplier}rem` }}>
							{t('accessibility.largeText') || 'Large Text Mode'}
						</Typography>
					}
				/>
			</Box>

			<Divider sx={{ mb: 2 }} />

			{/* Navigation Controls */}
			<Typography
				variant="subtitle1"
				sx={{ mb: 1, fontSize: `${1 * textSizeMultiplier}rem` }}
				id="navigation-controls-title">
				{t('accessibility.navigationControls') || 'Navigation Controls'}
			</Typography>
			<Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
				<Tooltip title={t('brainstorm.zoomIn') || 'Zoom In'}>
					<Button
						variant="outlined"
						startIcon={<ZoomInIcon />}
						onClick={onZoomIn}
						aria-label={t('brainstorm.zoomIn') || 'Zoom In'}>
						<Typography sx={{ fontSize: `${0.875 * textSizeMultiplier}rem` }}>
							{t('brainstorm.zoomIn') || 'Zoom In'}
						</Typography>
					</Button>
				</Tooltip>
				<Tooltip title={t('brainstorm.zoomOut') || 'Zoom Out'}>
					<Button
						variant="outlined"
						startIcon={<ZoomOutIcon />}
						onClick={onZoomOut}
						aria-label={t('brainstorm.zoomOut') || 'Zoom Out'}>
						<Typography sx={{ fontSize: `${0.875 * textSizeMultiplier}rem` }}>
							{t('brainstorm.zoomOut') || 'Zoom Out'}
						</Typography>
					</Button>
				</Tooltip>
				<Tooltip title={t('brainstorm.fitView') || 'Fit View'}>
					<Button
						variant="outlined"
						startIcon={<FitScreenIcon />}
						onClick={onFitView}
						aria-label={t('brainstorm.fitView') || 'Fit View'}>
						<Typography sx={{ fontSize: `${0.875 * textSizeMultiplier}rem` }}>
							{t('brainstorm.fitView') || 'Fit View'}
						</Typography>
					</Button>
				</Tooltip>
			</Box>

			{!readOnly && (
				<Box sx={{ mb: 2 }}>
					<Tooltip title={t('brainstorm.addNode') || 'Add Node'}>
						<Button
							variant="contained"
							startIcon={<AddIcon />}
							onClick={() => onAddNode(NodeType.IDEA)}
							fullWidth
							aria-label={t('brainstorm.addNode') || 'Add Node'}>
							<Typography sx={{ fontSize: `${0.875 * textSizeMultiplier}rem` }}>
								{t('brainstorm.addNode') || 'Add Node'}
							</Typography>
						</Button>
					</Tooltip>
				</Box>
			)}

			<Divider sx={{ mb: 2 }} />

			{/* Keyboard Navigation Instructions */}
			<Box sx={{ mb: 2 }}>
				<Typography
					variant="subtitle1"
					sx={{ mb: 1, fontSize: `${1 * textSizeMultiplier}rem` }}
					id="keyboard-navigation-title">
					<HelpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
					{t('accessibility.keyboardNavigation') || 'Keyboard Navigation'}
				</Typography>
				<List dense>
					<ListItem>
						<ListItemText
							primary={
								<Typography sx={{ fontSize: `${0.875 * textSizeMultiplier}rem` }}>
									{t('accessibility.tabToNavigate') || 'Tab: Navigate between nodes'}
								</Typography>
							}
						/>
					</ListItem>
					<ListItem>
						<ListItemText
							primary={
								<Typography sx={{ fontSize: `${0.875 * textSizeMultiplier}rem` }}>
									{t('accessibility.enterToSelect') || 'Enter: Select node'}
								</Typography>
							}
						/>
					</ListItem>
					<ListItem>
						<ListItemText
							primary={
								<Typography sx={{ fontSize: `${0.875 * textSizeMultiplier}rem` }}>
									{t('accessibility.eToEdit') || 'E: Edit selected node'}
								</Typography>
							}
						/>
					</ListItem>
					<ListItem>
						<ListItemText
							primary={
								<Typography sx={{ fontSize: `${0.875 * textSizeMultiplier}rem` }}>
									{t('accessibility.deleteToRemove') || 'Delete: Remove selected node'}
								</Typography>
							}
						/>
					</ListItem>
				</List>
			</Box>

			<Divider sx={{ mb: 2 }} />

			{/* Accessible Node List */}
			<Typography
				variant="subtitle1"
				sx={{ mb: 1, fontSize: `${1 * textSizeMultiplier}rem` }}
				id="nodes-list-title">
				{t('accessibility.nodesList') || 'Nodes List'}
			</Typography>
			<Box
				sx={{
					overflowY: 'auto',
					maxHeight: 'calc(100vh - 400px)',
					mb: 2,
				}}
				role="list"
				aria-labelledby="nodes-list-title">
				{nodes.length === 0 ? (
					<Typography
						variant="body2"
						sx={{ fontSize: `${0.875 * textSizeMultiplier}rem`, fontStyle: 'italic' }}>
						{t('accessibility.noNodes') || 'No nodes available'}
					</Typography>
				) : (
					nodes.map((node) => (
						<AccessibleNode
							key={node.id}
							data={node.data}
							isSelected={node.id === selectedNodeId}
							onSelect={() => onNodeSelect(node.id)}
							onEdit={() => onNodeEdit(node.id)}
							onDelete={() => onNodeDelete(node.id)}
							style={getNodeStyle(node)}
						/>
					))
				)}
			</Box>
		</Drawer>
	)
}

export default AccessibilityPanel
