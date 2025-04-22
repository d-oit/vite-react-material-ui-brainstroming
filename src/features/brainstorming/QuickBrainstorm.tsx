import AddIcon from '@mui/icons-material/Add'
import SaveIcon from '@mui/icons-material/Save'
import UpgradeIcon from '@mui/icons-material/Upgrade'
import {
	Box,
	Button,
	IconButton,
	List,
	ListItem,
	ListItemSecondaryAction,
	ListItemText,
	Paper,
	Stack,
	TextField,
	Tooltip,
} from '@mui/material'
import React, { useCallback, useState } from 'react'

import { useI18n } from '../../contexts/I18nContext'
import { generateUniqueId } from '../../utils/idGenerator'

import type { BrainstormNode, BrainstormSession, QuickBrainstormProps } from './types'

export default function QuickBrainstorm({ onSave, onClose, onConvert }: QuickBrainstormProps) {
	const { t } = useI18n()
	const [ideas, setIdeas] = useState<BrainstormNode[]>([])
	const [newIdea, setNewIdea] = useState('')

	const handleAddIdea = useCallback(() => {
		if (newIdea.trim()) {
			const idea: BrainstormNode = {
				id: generateUniqueId(),
				type: 'idea',
				content: newIdea.trim(),
				position: { x: 0, y: ideas.length * 100 },
			}

			setIdeas((prev) => [...prev, idea])
			setNewIdea('')
		}
	}, [newIdea, ideas.length])

	const handleKeyPress = useCallback(
		(event: React.KeyboardEvent) => {
			if (event.key === 'Enter' && !event.shiftKey) {
				event.preventDefault()
				handleAddIdea()
			}
		},
		[handleAddIdea],
	)

	const handleRemoveIdea = useCallback((idToRemove: string) => {
		setIdeas((prev) => prev.filter((idea) => idea.id !== idToRemove))
	}, [])

	const handleSave = useCallback(async () => {
		if (ideas.length === 0) return

		const session: BrainstormSession = {
			id: generateUniqueId(),
			projectId: '', // Quick brainstorm doesn't require a project
			templateId: '', // No template for quick brainstorm
			nodes: ideas,
			history: [],
			created: new Date(),
			modified: new Date(),
			isQuick: true,
		}

		await onSave?.(session)
	}, [ideas, onSave])

	const handleConvert = useCallback(async () => {
		if (ideas.length === 0 || !onConvert) return

		const session: BrainstormSession = {
			id: generateUniqueId(),
			projectId: '', // Will be assigned when converting
			templateId: '', // Will be assigned when converting
			nodes: ideas,
			history: [],
			created: new Date(),
			modified: new Date(),
			isQuick: true,
		}

		await onConvert(session)
	}, [ideas, onConvert])

	return (
		<Paper
			sx={{
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				p: 2,
				gap: 2,
			}}>
			<Stack direction="row" spacing={1}>
				<TextField
					fullWidth
					placeholder={t('brainstorming.quickIdea')}
					value={newIdea}
					onChange={(e) => setNewIdea(e.target.value)}
					onKeyPress={handleKeyPress}
					multiline
					maxRows={3}
				/>
				<IconButton onClick={handleAddIdea} disabled={!newIdea.trim()}>
					<AddIcon />
				</IconButton>
			</Stack>

			<Box sx={{ flexGrow: 1, overflow: 'auto' }}>
				<List>
					{ideas.map((idea, index) => (
						<ListItem key={idea.id}>
							<ListItemText primary={idea.content} />
							<ListItemSecondaryAction>
								<IconButton
									edge="end"
									onClick={() => handleRemoveIdea(idea.id)}
									aria-label={t('common.remove')}>
									<AddIcon sx={{ transform: 'rotate(45deg)' }} />
								</IconButton>
							</ListItemSecondaryAction>
						</ListItem>
					))}
				</List>
			</Box>

			<Stack direction="row" spacing={1} justifyContent="flex-end">
				<Button startIcon={<UpgradeIcon />} onClick={handleConvert} disabled={ideas.length === 0}>
					{t('brainstorming.convertToFull')}
				</Button>
				<Tooltip title={t('common.save')}>
					<IconButton onClick={handleSave} disabled={ideas.length === 0}>
						<SaveIcon />
					</IconButton>
				</Tooltip>
			</Stack>
		</Paper>
	)
}
