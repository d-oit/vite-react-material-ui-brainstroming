import { Close as CloseIcon } from '@mui/icons-material'
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	TextField,
	Box,
	IconButton,
	useMediaQuery,
	useTheme,
	Drawer,
	AppBar,
	Toolbar,
	Typography,
	Chip,
	Autocomplete,
} from '@mui/material'
import React, { useState, useEffect } from 'react'

import { useI18n } from '../../contexts/I18nContext'
import type { Node } from '../../types'

interface NodeEditDialogProps {
	open: boolean
	onClose: () => void
	node: Node | null
	onSave: (nodeId: string, newData: { label: string; content: string; tags?: string[] }) => void
}

const ResponsiveNodeEditDialog: React.FC<NodeEditDialogProps> = ({ open, onClose, node, onSave }) => {
	const theme = useTheme()
	const { t } = useI18n()
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
	const [label, setLabel] = useState('')
	const [content, setContent] = useState('')
	const [tags, setTags] = useState<string[]>([])
	const [inputValue, setInputValue] = useState('')

	useEffect(() => {
		if (node) {
			setLabel(node.data.label || '')
			setContent(node.data.content || '')
			setTags(node.data.tags || [])
		}
	}, [node])

	const handleSave = () => {
		if (node) {
			onSave(node.id, {
				label,
				content,
				tags,
			})
		}
		onClose()
	}

	const handleAddTag = (tag: string) => {
		if (tag && !tags.includes(tag)) {
			setTags([...tags, tag])
		}
		setInputValue('')
	}

	const handleDeleteTag = (tagToDelete: string) => {
		setTags(tags.filter((tag) => tag !== tagToDelete))
	}

	const dialogContent = (
		<>
			<TextField
				autoFocus
				margin="dense"
				id="node-label"
				label={t('flow.nodeLabel') || 'Label'}
				type="text"
				fullWidth
				value={label}
				onChange={(e) => setLabel(e.target.value)}
				variant="outlined"
			/>
			<TextField
				margin="dense"
				id="node-content"
				label={t('flow.nodeContent') || 'Content'}
				multiline
				rows={isMobile ? 6 : 10}
				fullWidth
				value={content}
				onChange={(e) => setContent(e.target.value)}
				variant="outlined"
			/>
			<Box sx={{ mt: 2 }}>
				<Autocomplete
					multiple
					id="node-tags"
					options={[]}
					freeSolo
					value={tags}
					inputValue={inputValue}
					onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
					onChange={(_, newValue) => setTags(newValue as string[])}
					renderTags={(value, getTagProps) =>
						value.map((option, index) => (
							<Chip
								label={option}
								{...getTagProps({ index })}
								onDelete={() => handleDeleteTag(option)}
								key={option}
							/>
						))
					}
					renderInput={(params) => (
						<TextField
							{...params}
							variant="outlined"
							label={t('flow.nodeTags') || 'Tags'}
							placeholder={t('flow.addTag') || 'Add tag'}
							onKeyDown={(e) => {
								if (e.key === 'Enter' && inputValue) {
									e.preventDefault()
									handleAddTag(inputValue)
								}
							}}
						/>
					)}
				/>
			</Box>
		</>
	)

	// Mobile version uses a full-screen drawer
	if (isMobile) {
		return (
			<Drawer
				anchor="bottom"
				open={open}
				onClose={onClose}
				PaperProps={{
					sx: {
						height: '100%',
						maxHeight: '100%',
						borderTopLeftRadius: 16,
						borderTopRightRadius: 16,
					},
				}}>
				<AppBar position="static" color="default" elevation={0}>
					<Toolbar>
						<Typography variant="h6" sx={{ flexGrow: 1 }}>
							{t('flow.editNode') || 'Edit Node'}
						</Typography>
						<IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
							<CloseIcon />
						</IconButton>
					</Toolbar>
				</AppBar>
				<DialogContent sx={{ pt: 2, pb: 2 }}>{dialogContent}</DialogContent>
				<Box
					sx={{
						p: 2,
						borderTop: `1px solid ${theme.palette.divider}`,
						position: 'sticky',
						bottom: 0,
						backgroundColor: theme.palette.background.paper,
						display: 'flex',
						justifyContent: 'space-between',
						width: '100%',
					}}>
					<Button onClick={onClose} color="inherit">
						{t('common.cancel') || 'Cancel'}
					</Button>
					<Button onClick={handleSave} color="primary" variant="contained">
						{t('common.save') || 'Save'}
					</Button>
				</Box>
			</Drawer>
		)
	}

	// Desktop version uses a regular dialog
	return (
		<Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
			<DialogTitle>{t('flow.editNode') || 'Edit Node'}</DialogTitle>
			<DialogContent>{dialogContent}</DialogContent>
			<DialogActions>
				<Button onClick={onClose} color="inherit">
					{t('common.cancel') || 'Cancel'}
				</Button>
				<Button onClick={handleSave} color="primary">
					{t('common.save') || 'Save'}
				</Button>
			</DialogActions>
		</Dialog>
	)
}

export default React.memo(ResponsiveNodeEditDialog)
