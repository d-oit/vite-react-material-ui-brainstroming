import {
	AddCircleOutline as AddIcon,
	Lightbulb as IdeaIcon,
	Task as TaskIcon,
	Note as NoteIcon,
	Link as ResourceIcon,
} from '@mui/icons-material'
import {
	IconButton,
	Tooltip,
	Menu,
	MenuItem,
	ListItemIcon,
	ListItemText,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	TextField,
	FormControl,
	InputLabel,
	Select,
	Box,
} from '@mui/material'
import React, { useState } from 'react'

import { useI18n } from '../../contexts/I18nContext'
import { NodeType } from '../../types'

interface AddToBrainstormButtonProps {
	messageContent: string
	onAddToCanvas: (nodeData: { type: NodeType; label: string; content: string; tags?: string[] }) => void
}

export const AddToBrainstormButton: React.FC<AddToBrainstormButtonProps> = ({ messageContent, onAddToCanvas }) => {
	const { t } = useI18n()
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
	const [dialogOpen, setDialogOpen] = useState(false)
	const [nodeType, setNodeType] = useState<NodeType>(NodeType.IDEA)
	const [nodeLabel, setNodeLabel] = useState('')
	const [nodeContent, setNodeContent] = useState('')
	const [nodeTags, setNodeTags] = useState('')

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget)
	}

	const handleClose = () => {
		setAnchorEl(null)
	}

	const handleNodeTypeSelect = (type: NodeType) => {
		setNodeType(type)
		setNodeLabel('')
		setNodeContent(messageContent)
		setNodeTags('')
		setDialogOpen(true)
		handleClose()
	}

	const handleDialogClose = () => {
		setDialogOpen(false)
	}

	const handleAddToCanvas = () => {
		onAddToCanvas({
			type: nodeType,
			label: nodeLabel,
			content: nodeContent,
			tags: nodeTags
				.split(',')
				.map((tag) => tag.trim())
				.filter((tag) => tag !== ''),
		})
		setDialogOpen(false)
	}

	const getNodeTypeIcon = (type: NodeType) => {
		switch (type) {
		case NodeType.IDEA:
			return <IdeaIcon />
		case NodeType.TASK:
			return <TaskIcon />
		case NodeType.NOTE:
			return <NoteIcon />
		case NodeType.RESOURCE:
			return <ResourceIcon />
		default:
			return <IdeaIcon />
		}
	}

	const getNodeTypeLabel = (type: NodeType) => {
		switch (type) {
		case NodeType.IDEA:
			return t('nodeTypes.idea') || 'Idea'
		case NodeType.TASK:
			return t('nodeTypes.task') || 'Task'
		case NodeType.NOTE:
			return t('nodeTypes.note') || 'Note'
		case NodeType.RESOURCE:
			return t('nodeTypes.resource') || 'Resource'
		default:
			return t('nodeTypes.idea') || 'Idea'
		}
	}

	return (
		<>
			<Tooltip title={t('chat.addToCanvas') || 'Add to canvas'}>
				<IconButton size="small" onClick={handleClick} aria-label={t('chat.addToCanvas') || 'Add to canvas'}>
					<AddIcon fontSize="small" />
				</IconButton>
			</Tooltip>

			<Menu
				anchorEl={anchorEl}
				open={Boolean(anchorEl)}
				onClose={handleClose}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'center',
				}}
				transformOrigin={{
					vertical: 'top',
					horizontal: 'center',
				}}>
				<MenuItem onClick={() => handleNodeTypeSelect(NodeType.IDEA)}>
					<ListItemIcon>
						<IdeaIcon fontSize="small" />
					</ListItemIcon>
					<ListItemText>{t('nodeTypes.idea') || 'Idea'}</ListItemText>
				</MenuItem>
				<MenuItem onClick={() => handleNodeTypeSelect(NodeType.TASK)}>
					<ListItemIcon>
						<TaskIcon fontSize="small" />
					</ListItemIcon>
					<ListItemText>{t('nodeTypes.task') || 'Task'}</ListItemText>
				</MenuItem>
				<MenuItem onClick={() => handleNodeTypeSelect(NodeType.NOTE)}>
					<ListItemIcon>
						<NoteIcon fontSize="small" />
					</ListItemIcon>
					<ListItemText>{t('nodeTypes.note') || 'Note'}</ListItemText>
				</MenuItem>
				<MenuItem onClick={() => handleNodeTypeSelect(NodeType.RESOURCE)}>
					<ListItemIcon>
						<ResourceIcon fontSize="small" />
					</ListItemIcon>
					<ListItemText>{t('nodeTypes.resource') || 'Resource'}</ListItemText>
				</MenuItem>
			</Menu>

			<Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
				<DialogTitle>
					{t('chat.addToCanvasAs', { type: getNodeTypeLabel(nodeType).toLowerCase() }) ||
						`Add as ${getNodeTypeLabel(nodeType)}`}
				</DialogTitle>
				<DialogContent>
					<Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 1 }}>
						<Box sx={{ mr: 2 }}>{getNodeTypeIcon(nodeType)}</Box>
						<FormControl fullWidth>
							<InputLabel id="node-type-label">{t('flow.nodeType') || 'Node Type'}</InputLabel>
							<Select
								labelId="node-type-label"
								value={nodeType}
								label={t('flow.nodeType') || 'Node Type'}
								onChange={(e) => setNodeType(e.target.value as NodeType)}>
								<MenuItem value={NodeType.IDEA}>{t('nodeTypes.idea') || 'Idea'}</MenuItem>
								<MenuItem value={NodeType.TASK}>{t('nodeTypes.task') || 'Task'}</MenuItem>
								<MenuItem value={NodeType.NOTE}>{t('nodeTypes.note') || 'Note'}</MenuItem>
								<MenuItem value={NodeType.RESOURCE}>{t('nodeTypes.resource') || 'Resource'}</MenuItem>
							</Select>
						</FormControl>
					</Box>

					<TextField
						autoFocus
						margin="dense"
						label={t('flow.nodeTitle') || 'Title'}
						type="text"
						fullWidth
						value={nodeLabel}
						onChange={(e) => setNodeLabel(e.target.value)}
						variant="outlined"
						sx={{ mb: 2 }}
					/>

					<TextField
						margin="dense"
						label={t('flow.nodeContent') || 'Content'}
						multiline
						rows={6}
						fullWidth
						value={nodeContent}
						onChange={(e) => setNodeContent(e.target.value)}
						variant="outlined"
						sx={{ mb: 2 }}
					/>

					<TextField
						margin="dense"
						label={t('flow.nodeTags') || 'Tags (comma separated)'}
						type="text"
						fullWidth
						value={nodeTags}
						onChange={(e) => setNodeTags(e.target.value)}
						variant="outlined"
						placeholder="tag1, tag2, tag3"
						helperText={t('flow.nodeTagsHelp') || 'Separate tags with commas'}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleDialogClose}>{t('common.cancel') || 'Cancel'}</Button>
					<Button
						onClick={handleAddToCanvas}
						variant="contained"
						color="primary"
						disabled={!nodeLabel.trim()}>
						{t('chat.addToCanvas') || 'Add to Canvas'}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	)
}

export default AddToBrainstormButton
