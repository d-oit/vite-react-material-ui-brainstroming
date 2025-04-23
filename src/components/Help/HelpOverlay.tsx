import {
	Help as HelpIcon,
	Close as CloseIcon,
	PlayArrow as PlayIcon,
	School as TutorialIcon,
	Lightbulb as TipIcon,
	Keyboard as KeyboardIcon,
	Info as InfoIcon,
	QuestionAnswer as FaqIcon,
} from '@mui/icons-material'
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Fab,
	IconButton,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Paper,
	Tooltip,
	Typography,
	useTheme,
} from '@mui/material'
import React, { useState, useEffect } from 'react'

import { useI18n } from '../../contexts/I18nContext'

interface TourStep {
	target: string
	title: string
	content: string
	placement?: 'top' | 'right' | 'bottom' | 'left'
}

interface GuidedTour {
	id: string
	title: string
	description: string
	steps: TourStep[]
}

interface HelpTip {
	id: string
	title: string
	content: string
	category: string
}

interface HelpOverlayProps {
	tours?: GuidedTour[]
	tips?: HelpTip[]
	onStartTour?: (tourId: string) => void
}

export const HelpOverlay: React.FC<HelpOverlayProps> = ({ tours = [], tips = [], onStartTour }) => {
	const theme = useTheme()
	const { t } = useI18n()
	const [open, setOpen] = useState(false)
	const [activeTab, setActiveTab] = useState<'tours' | 'tips' | 'keyboard' | 'faq'>('tours')
	const [tipCategories, setTipCategories] = useState<string[]>([])
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

	// Extract unique tip categories
	useEffect(() => {
		const categories = [...new Set(tips.map((tip) => tip.category))]
		setTipCategories(categories)
		if (categories.length > 0 && !selectedCategory) {
			setSelectedCategory(categories[0])
		}
	}, [tips, selectedCategory])

	const handleOpen = () => {
		setOpen(true)
	}

	const handleClose = () => {
		setOpen(false)
	}

	const handleStartTour = (tourId: string) => {
		if (onStartTour) {
			onStartTour(tourId)
			handleClose()
		}
	}

	// Filter tips by selected category
	const filteredTips = selectedCategory ? tips.filter((tip) => tip.category === selectedCategory) : tips

	return (
		<>
			<Tooltip title={t('help.openHelp') || 'Help & Tutorials'}>
				<Fab
					color="secondary"
					size="medium"
					aria-label={t('help.openHelp') || 'Help & Tutorials'}
					onClick={handleOpen}
					sx={{
						position: 'fixed',
						bottom: 16, // Changed from 80 to 16 to position at the very bottom
						left: 16,
						zIndex: 1000,
					}}>
					<HelpIcon />
				</Fab>
			</Tooltip>

			<Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth aria-labelledby="help-dialog-title">
				<DialogTitle id="help-dialog-title">
					<Box display="flex" alignItems="center" justifyContent="space-between">
						<Typography variant="h6">{t('help.title') || 'Help & Tutorials'}</Typography>
						<IconButton
							edge="end"
							color="inherit"
							onClick={handleClose}
							aria-label={t('common.close') || 'Close'}>
							<CloseIcon />
						</IconButton>
					</Box>
				</DialogTitle>
				<DialogContent dividers>
					<Box sx={{ display: 'flex', mb: 2 }}>
						<Box sx={{ borderBottom: 1, borderColor: 'divider', width: '100%' }}>
							<Box sx={{ display: 'flex', overflow: 'auto' }}>
								<Button
									onClick={() => setActiveTab('tours')}
									sx={{
										px: 3,
										py: 1,
										borderBottom: activeTab === 'tours' ? 2 : 0,
										borderColor: 'primary.main',
										borderRadius: 0,
										color: activeTab === 'tours' ? 'primary.main' : 'text.primary',
										minWidth: 'auto',
									}}
									startIcon={<TutorialIcon />}>
									{t('help.tours') || 'Guided Tours'}
								</Button>
								<Button
									onClick={() => setActiveTab('tips')}
									sx={{
										px: 3,
										py: 1,
										borderBottom: activeTab === 'tips' ? 2 : 0,
										borderColor: 'primary.main',
										borderRadius: 0,
										color: activeTab === 'tips' ? 'primary.main' : 'text.primary',
										minWidth: 'auto',
									}}
									startIcon={<TipIcon />}>
									{t('help.tips') || 'Tips & Tricks'}
								</Button>
								<Button
									onClick={() => setActiveTab('keyboard')}
									sx={{
										px: 3,
										py: 1,
										borderBottom: activeTab === 'keyboard' ? 2 : 0,
										borderColor: 'primary.main',
										borderRadius: 0,
										color: activeTab === 'keyboard' ? 'primary.main' : 'text.primary',
										minWidth: 'auto',
									}}
									startIcon={<KeyboardIcon />}>
									{t('help.shortcuts') || 'Keyboard Shortcuts'}
								</Button>
								<Button
									onClick={() => setActiveTab('faq')}
									sx={{
										px: 3,
										py: 1,
										borderBottom: activeTab === 'faq' ? 2 : 0,
										borderColor: 'primary.main',
										borderRadius: 0,
										color: activeTab === 'faq' ? 'primary.main' : 'text.primary',
										minWidth: 'auto',
									}}
									startIcon={<FaqIcon />}>
									{t('help.faq') || 'FAQ'}
								</Button>
							</Box>
						</Box>
					</Box>

					{/* Guided Tours Tab */}
					{activeTab === 'tours' && (
						<>
							<Typography variant="subtitle1" gutterBottom>
								{t('help.toursDescription') ||
									'Take a guided tour to learn how to use the application.'}
							</Typography>
							<List>
								{tours.length === 0 ? (
									<ListItem>
										<ListItemText
											primary={t('help.noToursAvailable') || 'No tours available'}
											secondary={
												t('help.checkBackLater') || 'Please check back later for new tours'
											}
										/>
									</ListItem>
								) : (
									tours.map((tour) => (
										<ListItem key={tour.id} disablePadding>
											<ListItemButton onClick={() => handleStartTour(tour.id)}>
												<ListItemIcon>
													<PlayIcon color="primary" />
												</ListItemIcon>
												<ListItemText primary={tour.title} secondary={tour.description} />
												<Button
													variant="outlined"
													size="small"
													startIcon={<PlayIcon />}
													onClick={(e) => {
														e.stopPropagation()
														handleStartTour(tour.id)
													}}>
													{t('help.startTour') || 'Start Tour'}
												</Button>
											</ListItemButton>
										</ListItem>
									))
								)}
							</List>
						</>
					)}

					{/* Tips & Tricks Tab */}
					{activeTab === 'tips' && (
						<>
							<Box sx={{ display: 'flex', mb: 2 }}>
								<Box sx={{ width: '30%', mr: 2 }}>
									<Typography variant="subtitle1" gutterBottom>
										{t('help.categories') || 'Categories'}
									</Typography>
									<List dense>
										{tipCategories.map((category) => (
											<ListItem key={category} disablePadding>
												<ListItemButton
													selected={selectedCategory === category}
													onClick={() => setSelectedCategory(category)}>
													<ListItemText primary={category} />
												</ListItemButton>
											</ListItem>
										))}
									</List>
								</Box>
								<Box sx={{ width: '70%' }}>
									<Typography variant="subtitle1" gutterBottom>
										{selectedCategory || t('help.allTips') || 'All Tips'}
									</Typography>
									{filteredTips.length === 0 ? (
										<Typography variant="body2" color="text.secondary">
											{t('help.noTipsAvailable') || 'No tips available in this category'}
										</Typography>
									) : (
										filteredTips.map((tip) => (
											<Paper
												key={tip.id}
												elevation={1}
												sx={{
													p: 2,
													mb: 2,
													borderLeft: `4px solid ${theme.palette.primary.main}`,
												}}>
												<Typography variant="subtitle2" gutterBottom>
													<TipIcon
														fontSize="small"
														color="primary"
														sx={{ verticalAlign: 'middle', mr: 1 }}
													/>
													{tip.title}
												</Typography>
												<Typography variant="body2">{tip.content}</Typography>
											</Paper>
										))
									)}
								</Box>
							</Box>
						</>
					)}

					{/* Keyboard Shortcuts Tab */}
					{activeTab === 'keyboard' && (
						<>
							<Typography variant="subtitle1" gutterBottom>
								{t('help.keyboardShortcutsDescription') ||
									'Keyboard shortcuts to help you work more efficiently.'}
							</Typography>
							<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
								<Paper sx={{ p: 2, flex: '1 1 45%', minWidth: 250 }}>
									<Typography variant="subtitle2" gutterBottom>
										{t('help.generalShortcuts') || 'General'}
									</Typography>
									<List dense>
										<ListItem>
											<ListItemText
												primary={t('shortcuts.save') || 'Save'}
												secondary="Ctrl + S"
											/>
										</ListItem>
										<ListItem>
											<ListItemText
												primary={t('shortcuts.undo') || 'Undo'}
												secondary="Ctrl + Z"
											/>
										</ListItem>
										<ListItem>
											<ListItemText
												primary={t('shortcuts.redo') || 'Redo'}
												secondary="Ctrl + Y"
											/>
										</ListItem>
										<ListItem>
											<ListItemText
												primary={t('shortcuts.showShortcuts') || 'Show Keyboard Shortcuts'}
												secondary="Shift + ?"
											/>
										</ListItem>
									</List>
								</Paper>
								<Paper sx={{ p: 2, flex: '1 1 45%', minWidth: 250 }}>
									<Typography variant="subtitle2" gutterBottom>
										{t('help.navigationShortcuts') || 'Navigation'}
									</Typography>
									<List dense>
										<ListItem>
											<ListItemText
												primary={t('shortcuts.zoomIn') || 'Zoom In'}
												secondary="Ctrl + +"
											/>
										</ListItem>
										<ListItem>
											<ListItemText
												primary={t('shortcuts.zoomOut') || 'Zoom Out'}
												secondary="Ctrl + -"
											/>
										</ListItem>
										<ListItem>
											<ListItemText
												primary={t('shortcuts.fitView') || 'Fit View'}
												secondary="Ctrl + 0"
											/>
										</ListItem>
										<ListItem>
											<ListItemText
												primary={t('shortcuts.toggleGrid') || 'Toggle Grid'}
												secondary="Ctrl + G"
											/>
										</ListItem>
									</List>
								</Paper>
								<Paper sx={{ p: 2, flex: '1 1 45%', minWidth: 250 }}>
									<Typography variant="subtitle2" gutterBottom>
										{t('help.editingShortcuts') || 'Editing'}
									</Typography>
									<List dense>
										<ListItem>
											<ListItemText
												primary={t('shortcuts.addNode') || 'Add New Node'}
												secondary="Ctrl + N"
											/>
										</ListItem>
										<ListItem>
											<ListItemText
												primary={t('shortcuts.delete') || 'Delete Selected'}
												secondary="Delete"
											/>
										</ListItem>
										<ListItem>
											<ListItemText
												primary={t('shortcuts.copy') || 'Copy'}
												secondary="Ctrl + C"
											/>
										</ListItem>
										<ListItem>
											<ListItemText
												primary={t('shortcuts.paste') || 'Paste'}
												secondary="Ctrl + V"
											/>
										</ListItem>
									</List>
								</Paper>
								<Paper sx={{ p: 2, flex: '1 1 45%', minWidth: 250 }}>
									<Typography variant="subtitle2" gutterBottom>
										{t('help.viewShortcuts') || 'View'}
									</Typography>
									<List dense>
										<ListItem>
											<ListItemText
												primary={t('shortcuts.toggleChat') || 'Toggle Chat Panel'}
												secondary="Ctrl + Shift + C"
											/>
										</ListItem>
										<ListItem>
											<ListItemText
												primary={t('shortcuts.toggleFullscreen') || 'Toggle Fullscreen'}
												secondary="Ctrl + Shift + F"
											/>
										</ListItem>
										<ListItem>
											<ListItemText
												primary={t('shortcuts.escape') || 'Cancel Current Action'}
												secondary="Escape"
											/>
										</ListItem>
										<ListItem>
											<ListItemText
												primary={t('shortcuts.selectAll') || 'Select All'}
												secondary="Ctrl + A"
											/>
										</ListItem>
									</List>
								</Paper>
							</Box>
						</>
					)}

					{/* FAQ Tab */}
					{activeTab === 'faq' && (
						<>
							<Typography variant="subtitle1" gutterBottom>
								{t('help.faqDescription') || 'Frequently asked questions and answers.'}
							</Typography>
							<List>
								<ListItem>
									<ListItemIcon>
										<InfoIcon color="primary" />
									</ListItemIcon>
									<ListItemText
										primary={t('help.faq1Question') || 'How do I create a new project?'}
										secondary={
											t('help.faq1Answer') ||
											'Go to the Projects page and click on the "New Project" button. You can then select a template or start from scratch.'
										}
									/>
								</ListItem>
								<ListItem>
									<ListItemIcon>
										<InfoIcon color="primary" />
									</ListItemIcon>
									<ListItemText
										primary={t('help.faq2Question') || 'How do I add nodes to the canvas?'}
										secondary={
											t('help.faq2Answer') ||
											'You can add nodes by right-clicking on the canvas and selecting the type of node you want to add, or by using the toolbar at the top of the canvas.'
										}
									/>
								</ListItem>
								<ListItem>
									<ListItemIcon>
										<InfoIcon color="primary" />
									</ListItemIcon>
									<ListItemText
										primary={t('help.faq3Question') || 'How do I connect nodes?'}
										secondary={
											t('help.faq3Answer') ||
											'Click and drag from the handle at the bottom of a node to the handle at the top of another node to create a connection.'
										}
									/>
								</ListItem>
								<ListItem>
									<ListItemIcon>
										<InfoIcon color="primary" />
									</ListItemIcon>
									<ListItemText
										primary={t('help.faq4Question') || 'How do I save my work?'}
										secondary={
											t('help.faq4Answer') ||
											'Your work is automatically saved as you make changes. You can also manually save by pressing Ctrl+S or clicking the Save button in the toolbar.'
										}
									/>
								</ListItem>
								<ListItem>
									<ListItemIcon>
										<InfoIcon color="primary" />
									</ListItemIcon>
									<ListItemText
										primary={t('help.faq5Question') || 'How do I export my project?'}
										secondary={
											t('help.faq5Answer') ||
											'Go to the Project Settings tab and click on the Export button. You can export your project in various formats including PNG, PDF, and JSON.'
										}
									/>
								</ListItem>
							</List>
						</>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={handleClose} color="primary">
						{t('common.close') || 'Close'}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	)
}

export default HelpOverlay
