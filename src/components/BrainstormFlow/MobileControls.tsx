import {
	ZoomIn as ZoomInIcon,
	ZoomOut as ZoomOutIcon,
	FitScreen as FitScreenIcon,
	Add as AddIcon,
	Delete as DeleteIcon,
	ContentCopy as CopyIcon,
	ContentPaste as PasteIcon,
	Save as SaveIcon,
	Undo as UndoIcon,
	Redo as RedoIcon,
	GridOn as GridOnIcon,
	GridOff as GridOffIcon,
} from '@mui/icons-material'
import { Box, IconButton, SpeedDial, SpeedDialAction, SpeedDialIcon, useTheme, Tooltip } from '@mui/material'
import React from 'react'

import { useI18n } from '../../contexts/I18nContext'
import { NodeType } from '../../types'

interface MobileControlsProps {
	onZoomIn: () => void
	onZoomOut: () => void
	onFitView: () => void
	onAddNode?: (type: NodeType) => void
	onSave?: () => void
	onUndo?: () => void
	onRedo?: () => void
	onToggleGrid?: () => void
	onCopy?: () => void
	onPaste?: () => void
	showGrid?: boolean
	canUndo?: boolean
	canRedo?: boolean
	canPaste?: boolean
	readOnly?: boolean
}

const MobileControls: React.FC<MobileControlsProps> = ({
	onZoomIn,
	onZoomOut,
	onFitView,
	onAddNode,
	onSave,
	onUndo,
	onRedo,
	onToggleGrid,
	onCopy,
	onPaste,
	showGrid = true,
	canUndo = false,
	canRedo = false,
	canPaste = false,
	readOnly = false,
}) => {
	const theme = useTheme()
	const { t } = useI18n()
	const [open, setOpen] = React.useState(false)

	const handleOpen = () => setOpen(true)
	const handleClose = () => setOpen(false)

	// Basic zoom controls that are always visible
	const renderBasicControls = () => (
		<Box
			sx={{
				position: 'absolute',
				bottom: 16,
				left: '50%',
				transform: 'translateX(-50%)',
				display: 'flex',
				gap: 1,
				backgroundColor: theme.palette.background.paper,
				borderRadius: 20, // More rounded for touch
				boxShadow: theme.shadows[3],
				p: 0.5,
				zIndex: 1000,
				'& .MuiIconButton-root': {
					color: theme.palette.text.primary,
				},
			}}>
			<IconButton onClick={onZoomIn} size="small" aria-label={t('brainstorm.zoomIn') || 'Zoom in'}>
				<ZoomInIcon fontSize="small" />
			</IconButton>
			<IconButton onClick={onZoomOut} size="small" aria-label={t('brainstorm.zoomOut') || 'Zoom out'}>
				<ZoomOutIcon fontSize="small" />
			</IconButton>
			<IconButton onClick={onFitView} size="small" aria-label={t('brainstorm.fitView') || 'Fit view'}>
				<FitScreenIcon fontSize="small" />
			</IconButton>
		</Box>
	)

	// Advanced controls in a speed dial
	const renderAdvancedControls = () => {
		if (readOnly) return null

		const actions = [
			...(onAddNode
				? [
					{
						icon: <AddIcon />,
						name: t('brainstorm.addNode') || 'Add Node',
						onClick: () => {
							onAddNode(NodeType.IDEA)
							handleClose()
						},
					},
				]
				: []),
			...(onSave
				? [
					{
						icon: <SaveIcon />,
						name: t('common.save') || 'Save',
						onClick: () => {
							onSave()
							handleClose()
						},
					},
				]
				: []),
			...(onUndo && canUndo
				? [
					{
						icon: <UndoIcon />,
						name: t('common.undo') || 'Undo',
						onClick: () => {
							onUndo()
							handleClose()
						},
					},
				]
				: []),
			...(onRedo && canRedo
				? [
					{
						icon: <RedoIcon />,
						name: t('common.redo') || 'Redo',
						onClick: () => {
							onRedo()
							handleClose()
						},
					},
				]
				: []),
			...(onToggleGrid
				? [
					{
						icon: showGrid ? <GridOffIcon /> : <GridOnIcon />,
						name: showGrid
							? t('brainstorm.hideGrid') || 'Hide Grid'
							: t('brainstorm.showGrid') || 'Show Grid',
						onClick: () => {
							onToggleGrid()
							handleClose()
						},
					},
				]
				: []),
			...(onCopy
				? [
					{
						icon: <CopyIcon />,
						name: t('common.copy') || 'Copy',
						onClick: () => {
							onCopy()
							handleClose()
						},
					},
				]
				: []),
			...(onPaste && canPaste
				? [
					{
						icon: <PasteIcon />,
						name: t('common.paste') || 'Paste',
						onClick: () => {
							onPaste()
							handleClose()
						},
					},
				]
				: []),
		]

		return (
			<SpeedDial
				ariaLabel={t('brainstorm.moreActions') || 'More Actions'}
				sx={{
					position: 'absolute',
					bottom: 16,
					right: 16,
					zIndex: 1000,
					'& .MuiSpeedDial-fab': {
						width: 48,
						height: 48,
						boxShadow: theme.shadows[3],
					},
				}}
				icon={<SpeedDialIcon />}
				onClose={handleClose}
				onOpen={handleOpen}
				open={open}
				direction="up">
				{actions.map((action) => (
					<SpeedDialAction
						key={action.name}
						icon={action.icon}
						tooltipTitle={action.name}
						tooltipOpen
						onClick={action.onClick}
					/>
				))}
			</SpeedDial>
		)
	}

	return (
		<>
			{renderBasicControls()}
			{renderAdvancedControls()}
		</>
	)
}

export default MobileControls
