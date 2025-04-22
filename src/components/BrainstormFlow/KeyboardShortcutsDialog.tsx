import { Close as CloseIcon } from '@mui/icons-material'
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Typography,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	IconButton,
	useTheme,
	useMediaQuery,
	Box,
} from '@mui/material'
import React from 'react'

import { useI18n } from '../../contexts/I18nContext'

interface KeyboardShortcutsDialogProps {
	open: boolean
	onClose: () => void
}

/**
 * Dialog that displays all available keyboard shortcuts
 */
const KeyboardShortcutsDialog: React.FC<KeyboardShortcutsDialogProps> = ({ open, onClose }) => {
	const theme = useTheme()
	const { t } = useI18n()
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

	// Define all keyboard shortcuts
	const shortcuts = [
		{
			category: t('shortcuts.category.navigation') || 'Navigation',
			items: [
				{
					action: t('shortcuts.zoomIn') || 'Zoom In',
					shortcut: 'Ctrl + =, Ctrl + +',
				},
				{
					action: t('shortcuts.zoomOut') || 'Zoom Out',
					shortcut: 'Ctrl + -, Ctrl + _',
				},
				{
					action: t('shortcuts.fitView') || 'Fit View',
					shortcut: 'Ctrl + 0',
				},
				{
					action: t('shortcuts.toggleGrid') || 'Toggle Grid',
					shortcut: 'Ctrl + G',
				},
			],
		},
		{
			category: t('shortcuts.category.editing') || 'Editing',
			items: [
				{
					action: t('shortcuts.addNode') || 'Add Node',
					shortcut: 'Ctrl + N',
				},
				{
					action: t('shortcuts.delete') || 'Delete Selected',
					shortcut: 'Delete, Backspace',
				},
				{
					action: t('shortcuts.copy') || 'Copy Selected',
					shortcut: 'Ctrl + C',
				},
				{
					action: t('shortcuts.paste') || 'Paste',
					shortcut: 'Ctrl + V',
				},
			],
		},
		{
			category: t('shortcuts.category.history') || 'History',
			items: [
				{
					action: t('shortcuts.undo') || 'Undo',
					shortcut: 'Ctrl + Z',
				},
				{
					action: t('shortcuts.redo') || 'Redo',
					shortcut: 'Ctrl + Shift + Z, Ctrl + Y',
				},
				{
					action: t('shortcuts.save') || 'Save',
					shortcut: 'Ctrl + S',
				},
			],
		},
		{
			category: t('shortcuts.category.help') || 'Help',
			items: [
				{
					action: t('shortcuts.help') || 'Help',
					shortcut: 'F1, ?',
				},
				{
					action: t('shortcuts.showShortcuts') || 'Show Shortcuts',
					shortcut: 'Ctrl + /',
				},
			],
		},
	]

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="md"
			fullWidth
			fullScreen={isMobile}
			aria-labelledby="keyboard-shortcuts-dialog-title">
			<DialogTitle id="keyboard-shortcuts-dialog-title" sx={{ display: 'flex', alignItems: 'center' }}>
				<Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
					{t('shortcuts.title') || 'Keyboard Shortcuts'}
				</Typography>
				<IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
					<CloseIcon />
				</IconButton>
			</DialogTitle>
			<DialogContent dividers>
				{shortcuts.map((category) => (
					<Box key={category.category} sx={{ marginBottom: theme.spacing(3) }}>
						<Typography variant="h6" gutterBottom>
							{category.category}
						</Typography>
						<TableContainer component={Paper} variant="outlined">
							<Table size={isMobile ? 'small' : 'medium'}>
								<TableHead>
									<TableRow>
										<TableCell>{t('shortcuts.action') || 'Action'}</TableCell>
										<TableCell>{t('shortcuts.shortcut') || 'Shortcut'}</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{category.items.map((item) => (
										<TableRow key={item.action}>
											<TableCell>{item.action}</TableCell>
											<TableCell>
												<Typography
													component="code"
													sx={{
														backgroundColor: theme.palette.action.hover,
														padding: theme.spacing(0.5, 1),
														borderRadius: 1,
														fontFamily: 'monospace',
													}}>
													{item.shortcut}
												</Typography>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					</Box>
				))}
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} color="primary">
					{t('common.close') || 'Close'}
				</Button>
			</DialogActions>
		</Dialog>
	)
}

export default KeyboardShortcutsDialog
