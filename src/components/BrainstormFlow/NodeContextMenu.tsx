import {
	Edit as EditIcon,
	ContentCopy as DuplicateIcon,
	Delete as DeleteIcon,
	ColorLens as StyleIcon,
	AddCircleOutline as AddChildIcon,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	Chat as ChatIcon,
	Link as LinkIcon,
} from '@mui/icons-material'
import { Menu, MenuItem, ListItemIcon, ListItemText, Divider, useTheme } from '@mui/material'
import React from 'react'

import { useI18n } from '../../contexts/I18nContext'
import type { Node } from '../../types'

interface NodeContextMenuProps {
	node: Node | null
	anchorPosition: { x: number; y: number } | null
	open: boolean
	onClose: () => void
	onEdit: (node: Node) => void
	onDuplicate: (node: Node) => void
	onDelete: (node: Node) => void
	onStyle: (node: Node) => void
	onAddChild: (node: Node) => void
	onLinkToChat: (node: Node) => void
}

/**
 * NodeContextMenu component for displaying a context menu for nodes
 * Provides options for editing, duplicating, styling, and deleting nodes
 */
export const NodeContextMenu: React.FC<NodeContextMenuProps> = ({
	node,
	anchorPosition,
	open,
	onClose,
	onEdit,
	onDuplicate,
	onDelete,
	onStyle,
	onAddChild,
	onLinkToChat,
}) => {
	const theme = useTheme()
	const { t } = useI18n()

	// Only render if we have a node
	if (!node) return null

	return (
		<Menu
			open={open}
			onClose={onClose}
			anchorReference="anchorPosition"
			anchorPosition={anchorPosition !== null ? { top: anchorPosition.y, left: anchorPosition.x } : undefined}
			// Ensure the menu is properly labeled for screen readers
			MenuListProps={{
				'aria-label': t('flow.nodeContextMenu') || 'Node context menu',
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
					onEdit(node)
					onClose()
				}}
				aria-label={t('flow.editNode') || 'Edit node'}>
				<ListItemIcon>
					<EditIcon fontSize="small" />
				</ListItemIcon>
				<ListItemText>{t('flow.edit') || 'Edit'}</ListItemText>
			</MenuItem>

			<MenuItem
				onClick={() => {
					onDuplicate(node)
					onClose()
				}}
				aria-label={t('flow.duplicateNode') || 'Duplicate node'}>
				<ListItemIcon>
					<DuplicateIcon fontSize="small" />
				</ListItemIcon>
				<ListItemText>{t('flow.duplicate') || 'Duplicate'}</ListItemText>
			</MenuItem>

			<Divider />

			<MenuItem
				onClick={() => {
					onStyle(node)
					onClose()
				}}
				aria-label={t('flow.styleNode') || 'Style node'}>
				<ListItemIcon>
					<StyleIcon fontSize="small" />
				</ListItemIcon>
				<ListItemText>{t('flow.style') || 'Style'}</ListItemText>
			</MenuItem>

			<MenuItem
				onClick={() => {
					onAddChild(node)
					onClose()
				}}
				aria-label={t('flow.addChildNode') || 'Add child node'}>
				<ListItemIcon>
					<AddChildIcon fontSize="small" />
				</ListItemIcon>
				<ListItemText>{t('flow.addChild') || 'Add Child'}</ListItemText>
			</MenuItem>

			<Divider />

			<MenuItem
				onClick={() => {
					onLinkToChat(node)
					onClose()
				}}
				aria-label={t('flow.linkToChat') || 'Link to chat'}>
				<ListItemIcon>
					<LinkIcon fontSize="small" />
				</ListItemIcon>
				<ListItemText>{t('flow.linkToChat') || 'Link to Chat'}</ListItemText>
			</MenuItem>

			<Divider />

			<MenuItem
				onClick={() => {
					onDelete(node)
					onClose()
				}}
				aria-label={t('flow.deleteNode') || 'Delete node'}
				sx={{ color: theme.palette.error.main }}>
				<ListItemIcon sx={{ color: 'inherit' }}>
					<DeleteIcon fontSize="small" color="error" />
				</ListItemIcon>
				<ListItemText>{t('flow.delete') || 'Delete'}</ListItemText>
			</MenuItem>
		</Menu>
	)
}

export default NodeContextMenu
