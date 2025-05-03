import {
	AddCircleOutline as AddNodeIcon,
	ContentPaste as PasteIcon,
	ZoomOutMap as FitViewIcon,
	GridOn as GridIcon,
	GridOff as GridOffIcon,
	Undo as UndoIcon,
	Redo as RedoIcon,
} from '@mui/icons-material'
import { Menu, MenuItem, ListItemIcon, ListItemText, Divider, useTheme } from '@mui/material'
import React from 'react'

import { useI18n } from '../../contexts/I18nContext'
import { NodeType } from '../../types'

interface CanvasContextMenuProps {
	anchorPosition: { x: number; y: number } | null
	open: boolean
	onClose: () => void
	onAddNode: (type: NodeType, position: { x: number; y: number }) => void
	onPaste: () => void
	onFitView: () => void
	onToggleGrid: () => void
	onUndo: () => void
	onRedo: () => void
	showGrid: boolean
	canUndo: boolean
	canRedo: boolean
	canPaste: boolean
}

/**
 * CanvasContextMenu component for displaying a context menu for the canvas
 * Provides options for adding nodes, pasting, fitting view, toggling grid, and undo/redo
 */
export const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
	anchorPosition,
	open,
	onClose,
	onAddNode,
	onPaste,
	onFitView,
	onToggleGrid,
	onUndo,
	onRedo,
	showGrid,
	canUndo,
	canRedo,
	canPaste,
}) => {
	const theme = useTheme()
	const { t } = useI18n()

	return (
		<Menu
			open={open}
			onClose={onClose}
			anchorReference="anchorPosition"
			anchorPosition={
				anchorPosition !== null
					? { top: anchorPosition.y, left: anchorPosition.x }
					: undefined
			}
			// Ensure the menu is properly labeled for screen readers
			MenuListProps={{
				'aria-label': t('brainstorm.canvasContextMenu') || 'Canvas context menu',
				dense: true,
			}}
			PaperProps={{
				elevation: 3,
				sx: {
					minWidth: 200,
					maxWidth: 300,
					borderRadius: 1,
					border: `1px solid ${theme.palette.divider}`,
				},
			}}>
			<MenuItem
				onClick={() => {
					if (anchorPosition) {
						onAddNode(NodeType.IDEA, { x: anchorPosition.x, y: anchorPosition.y })
					}
					onClose()
				}}
				aria-label={t('brainstorm.addIdeaNode') || 'Add idea node'}>
				<ListItemIcon>
					<AddNodeIcon fontSize="small" />
				</ListItemIcon>
				<ListItemText>{t('brainstorm.addIdea') || 'Add Idea'}</ListItemText>
			</MenuItem>

			<MenuItem
				onClick={() => {
					if (anchorPosition) {
						onAddNode(NodeType.TASK, { x: anchorPosition.x, y: anchorPosition.y })
					}
					onClose()
				}}
				aria-label={t('brainstorm.addTaskNode') || 'Add task node'}>
				<ListItemIcon>
					<AddNodeIcon fontSize="small" />
				</ListItemIcon>
				<ListItemText>{t('brainstorm.addTask') || 'Add Task'}</ListItemText>
			</MenuItem>

			<MenuItem
				onClick={() => {
					if (anchorPosition) {
						onAddNode(NodeType.NOTE, { x: anchorPosition.x, y: anchorPosition.y })
					}
					onClose()
				}}
				aria-label={t('brainstorm.addNoteNode') || 'Add note node'}>
				<ListItemIcon>
					<AddNodeIcon fontSize="small" />
				</ListItemIcon>
				<ListItemText>{t('brainstorm.addNote') || 'Add Note'}</ListItemText>
			</MenuItem>

			<MenuItem
				onClick={() => {
					if (anchorPosition) {
						onAddNode(NodeType.RESOURCE, { x: anchorPosition.x, y: anchorPosition.y })
					}
					onClose()
				}}
				aria-label={t('brainstorm.addResourceNode') || 'Add resource node'}>
				<ListItemIcon>
					<AddNodeIcon fontSize="small" />
				</ListItemIcon>
				<ListItemText>{t('brainstorm.addResource') || 'Add Resource'}</ListItemText>
			</MenuItem>

			<Divider />

			<MenuItem
				onClick={() => {
					onPaste()
					onClose()
				}}
				disabled={!canPaste}
				aria-label={t('brainstorm.paste') || 'Paste'}>
				<ListItemIcon>
					<PasteIcon fontSize="small" />
				</ListItemIcon>
				<ListItemText>{t('brainstorm.paste') || 'Paste'}</ListItemText>
			</MenuItem>

			<Divider />

			<MenuItem
				onClick={() => {
					onFitView()
					onClose()
				}}
				aria-label={t('brainstorm.fitView') || 'Fit view'}>
				<ListItemIcon>
					<FitViewIcon fontSize="small" />
				</ListItemIcon>
				<ListItemText>{t('brainstorm.fitView') || 'Fit View'}</ListItemText>
			</MenuItem>

			<MenuItem
				onClick={() => {
					onToggleGrid()
					onClose()
				}}
				aria-label={showGrid ? t('brainstorm.hideGrid') || 'Hide grid' : t('brainstorm.showGrid') || 'Show grid'}>
				<ListItemIcon>
					{showGrid ? <GridOffIcon fontSize="small" /> : <GridIcon fontSize="small" />}
				</ListItemIcon>
				<ListItemText>
					{showGrid ? t('brainstorm.hideGrid') || 'Hide Grid' : t('brainstorm.showGrid') || 'Show Grid'}
				</ListItemText>
			</MenuItem>

			<Divider />

			<MenuItem
				onClick={() => {
					onUndo()
					onClose()
				}}
				disabled={!canUndo}
				aria-label={t('brainstorm.undo') || 'Undo'}>
				<ListItemIcon>
					<UndoIcon fontSize="small" />
				</ListItemIcon>
				<ListItemText>{t('brainstorm.undo') || 'Undo'}</ListItemText>
			</MenuItem>

			<MenuItem
				onClick={() => {
					onRedo()
					onClose()
				}}
				disabled={!canRedo}
				aria-label={t('brainstorm.redo') || 'Redo'}>
				<ListItemIcon>
					<RedoIcon fontSize="small" />
				</ListItemIcon>
				<ListItemText>{t('brainstorm.redo') || 'Redo'}</ListItemText>
			</MenuItem>
		</Menu>
	)
}

export default CanvasContextMenu
