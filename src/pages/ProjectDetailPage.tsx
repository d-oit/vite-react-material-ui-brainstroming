import {
	Save as SaveIcon,
	Chat as ChatIcon,
	Close as CloseIcon,
	Add as AddIcon,
	Edit as EditIcon,
} from '@mui/icons-material'
import {
	Box,
	Typography,
	Paper,
	CircularProgress,
	Button,
	useMediaQuery,
	useTheme,
	Drawer,
	IconButton,
	Tab,
	Tabs,
	Container,
	Fab,
	Tooltip,
	TextField,
} from '@mui/material'
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'

import KeyboardShortcutsHandler from '../components/BrainstormFlow/KeyboardShortcutsHandler'
import { ChatInterface } from '../components/Chat/ChatInterface'
import HelpOverlay from '../components/Help/HelpOverlay'
import AppShell from '../components/Layout/AppShell'
import { ProjectBrainstormingSection } from '../components/Project/ProjectBrainstormingSection'
import ProjectSettingsSection from '../components/Project/ProjectSettingsSection'
import StatusIndicator from '../components/UI/StatusIndicator'
import { useI18n } from '../contexts/I18nContext'
import { useProject } from '../hooks/useProject'
import { useBrainstormStore } from '../store/brainstormStore' // Import the store
import type { Node, Edge, Project } from '../types'
import type { NodeSuggestion } from '../types/chat'

interface TabPanelProps {
	children?: React.ReactNode
	index: number
	value: number
}

const TabPanel = (props: TabPanelProps) => {
	const { children, value, index, ...other } = props

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`project-tab-${index}`}
			aria-labelledby={`project-tab-${index}`}
			{...other}>
			{value === index && <Box sx={{ height: '100%' }}>{children}</Box>}
		</div>
	)
}

const ProjectDetailPage = () => {
	const { projectId } = useParams<{ projectId: string }>()
	const theme = useTheme()
	const isMobile = useMediaQuery(theme.breakpoints.down('md'))
	const { t } = useI18n()
	const [chatOpen, setChatOpen] = useState(false) // Chat closed by default
	const [_nodes, setNodes] = useState<Node[]>([])
	const [_edges, setEdges] = useState<Edge[]>([])

	// Check if the URL contains '/brainstorm' to set the initial tab value
	const initialTabValue = window.location.pathname.includes('/brainstorm') ? 1 : 0
	const [tabValue, setTabValue] = useState(initialTabValue)

	// State for editable fields
	const [isEditingName, setIsEditingName] = useState(false)
	const [isEditingDescription, setIsEditingDescription] = useState(false)
	const [editedName, setEditedName] = useState('')
	const [editedDescription, setEditedDescription] = useState('')

	const { project, loading, error, isSaving, hasChanges, saveProject, createNewVersion } = useProject({
		projectId,
		autoSave: true,
	})

	// Get the load function from the store
	const loadNodes = useBrainstormStore((state) => state.loadNodesWithPositions)

	useEffect(() => {
		// Load nodes into the store when projectId is available
		if (projectId) {
			console.log(`ProjectDetailPage: Loading nodes for projectId: ${projectId}`)
			loadNodes(projectId)
		}
	}, [projectId, loadNodes])

	useEffect(() => {
		if (project !== null && project !== undefined) {
			// This local state might become redundant if ProjectBrainstormingSection reads directly from the store
			setNodes(project.nodes)
			setEdges(project.edges)
			setEditedName(project.name)
			setEditedDescription(project.description || '')
		}
	}, [project])

	const handleSaveFlow = (updatedNodes: Node[], updatedEdges: Edge[]) => {
		if (project !== null && project !== undefined) {
			// Check if nodes or edges have actually changed
			const nodesChanged = JSON.stringify(updatedNodes) !== JSON.stringify(project.nodes)
			const edgesChanged = JSON.stringify(updatedEdges) !== JSON.stringify(project.edges)

			if (nodesChanged || edgesChanged) {
				setNodes(updatedNodes)
				setEdges(updatedEdges)

				// Create updated project with new nodes and edges
				const _updatedProject = {
					...project,
					nodes: updatedNodes,
					edges: updatedEdges,
					updatedAt: new Date().toISOString(),
				}

				// Save project
				void saveProject(_updatedProject)
			}
		}
	}

	const handleCreateNewVersion = async () => {
		if (project !== null && project !== undefined) {
			await createNewVersion()
		}
	}

	// Function to save edited project details
	const handleProjectDetailsChange = async (field: 'name' | 'description', value: string) => {
		if (project !== null && project !== undefined) {
			// Update local state
			if (field === 'name') {
				setEditedName(value)
			} else {
				setEditedDescription(value)
			}

			// Create updated project with new field value
			const updatedProject = {
				...project,
				[field]: value,
				updatedAt: new Date().toISOString(),
			}

			// Save project with the updated project object
			await saveProject(updatedProject)
		}
	}

	const toggleChat = () => {
		setChatOpen((prev) => !prev)
	}

	const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
		setTabValue(newValue)

		// Update URL when tab changes
		const baseUrl = `/projects/${projectId}`
		if (newValue === 1) {
			window.history.pushState(null, '', `${baseUrl}/brainstorm`)
		} else if (newValue === 2) {
			window.history.pushState(null, '', `${baseUrl}/settings`)
		} else {
			window.history.pushState(null, '', baseUrl)
		}
	}

	// Function to handle adding nodes from chat suggestions
	const handleAddNodesFromChat = useCallback(
		(suggestions: NodeSuggestion[]) => {
			if (!project) return

			// Implementation would go here - for now just log the suggestions
			console.log('Adding nodes from chat suggestions:', suggestions)

			// In a real implementation, you would:
			// 1. Convert suggestions to actual nodes
			// 2. Add them to the current nodes array
			// 3. Update the project
		},
		[project],
	)

	// Function to save project description
	const handleSaveProjectDetails = () => {
		// Always save if the description is not empty, regardless of whether it has changed
		if (editedDescription.trim() !== '') {
			void handleProjectDetailsChange('description', editedDescription)
		}
		setIsEditingDescription(false)
	}

	if (loading) {
		return (
			<AppShell
				title={t('project.title')}
				onThemeToggle={() => {}}
				isDarkMode={theme.palette.mode === 'dark'}
				loading={true}>
				<Container maxWidth="lg">
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							height: '80vh',
							position: 'relative',
						}}>
						<StatusIndicator
							status="loading"
							message={t('app.loadingProject')}
							position="center"
							size="large"
						/>
					</Box>
				</Container>
			</AppShell>
		)
	}

	if ((error !== null && error !== undefined && error !== '') || project === null || project === undefined) {
		return (
			<AppShell
				title={t('project.title')}
				onThemeToggle={() => {}}
				isDarkMode={theme.palette.mode === 'dark'}
				error={error}>
				<Container maxWidth="lg">
					<Paper sx={{ p: 3 }}>
						<Typography color="error" variant="h6">
							Error: {error !== null && error !== undefined && error !== '' ? error : 'Project not found'}
						</Typography>
					</Paper>
				</Container>
			</AppShell>
		)
	}

	return (
		<AppShell
			title={project.name}
			version={project.version}
			onThemeToggle={() => {}}
			isDarkMode={theme.palette.mode === 'dark'}>
			{/* Status indicators */}
			{isSaving && (
				<StatusIndicator
					status="loading"
					message={t('common.saving')}
					position="bottom-right"
					size="small"
					showBackground={false}
				/>
			)}
			{error && <StatusIndicator status="error" message={error} position="top-right" size="small" />}
			<Box
				sx={{
					mb: 2,
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					flexWrap: { xs: 'wrap', sm: 'nowrap' },
				}}>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						gap: 1,
						flexGrow: 1,
						mr: 2,
						mb: { xs: 2, sm: 0 },
					}}>
					{isEditingName ? (
						<TextField
							fullWidth
							variant="outlined"
							size="small"
							value={editedName}
							onChange={(e) => {
								setEditedName(e.target.value)
								// Don't trigger save on every keystroke, use debounce
								if (e.target.value.trim() !== '' && e.target.value !== project.name) {
									const timeoutId = setTimeout(() => {
										void handleProjectDetailsChange('name', e.target.value)
									}, 1000) // 1 second debounce
									return () => clearTimeout(timeoutId)
								}
							}}
							autoFocus
							onBlur={() => {
								// Always save if the name is not empty, regardless of whether it has changed
								if (editedName.trim() !== '') {
									void handleProjectDetailsChange('name', editedName)
									setIsEditingName(false)
								} else {
									setEditedName(project.name)
									setIsEditingName(false)
								}
							}}
							onKeyDown={(e) => {
								if (e.key === 'Enter' && editedName.trim() !== '') {
									// Always save on Enter if the name is not empty
									void handleProjectDetailsChange('name', editedName)
									setIsEditingName(false)
								} else if (e.key === 'Escape') {
									// Reset to original name on Escape
									setEditedName(project.name)
									setIsEditingName(false)
								}
							}}
							InputProps={{
								sx: { borderRadius: 1 },
							}}
						/>
					) : (
						<Box sx={{ display: 'flex', alignItems: 'center' }}>
							<Typography variant="h5" component="h1" sx={{ wordBreak: 'break-word' }}>
								{project.name}
							</Typography>
							<IconButton
								size="small"
								onClick={() => setIsEditingName(true)}
								sx={{ ml: 1, color: 'primary.main' }}
								aria-label="Edit project name">
								<EditIcon fontSize="small" />
							</IconButton>
						</Box>
					)}
					{/* Version information removed from here and only shown in app header */}
				</Box>

				<Box sx={{ display: 'flex', gap: 1 }}>
					{/* Only show Save button when autoSave is disabled */}
					{!project.autoSave && (
						<Button
							variant="outlined"
							startIcon={isSaving ? <CircularProgress size={16} /> : <SaveIcon />}
							onClick={() => {
								void saveProject()
							}}
							disabled={isSaving || !hasChanges}
							size={isMobile ? 'small' : 'medium'}
							sx={{
								minWidth: '90px', // Fixed width to prevent layout shifts
								transition: 'all 0.2s ease-in-out',
								position: 'relative',
								'& .MuiCircularProgress-root': {
									transition: 'opacity 0.2s ease-in-out',
									opacity: isSaving ? 1 : 0,
								},
								'& .MuiSvgIcon-root': {
									transition: 'opacity 0.2s ease-in-out',
									opacity: isSaving ? 0 : 1,
									position: isSaving ? 'absolute' : 'relative',
									left: isSaving ? '16px' : 'auto',
								},
							}}>
							{hasChanges ? `${t('common.save')}*` : t('common.save')}
						</Button>
					)}

					<Button
						variant="outlined"
						onClick={() => {
							void handleCreateNewVersion()
						}}
						disabled={isSaving}
						size={isMobile ? 'small' : 'medium'}>
						{t('project.newVersion')}
					</Button>

					<Button
						variant="contained"
						color="secondary"
						startIcon={<ChatIcon />}
						onClick={toggleChat}
						size={isMobile ? 'small' : 'medium'}>
						{t('chat.assistant')}
					</Button>
				</Box>
			</Box>

			<Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
				<Tabs value={tabValue} onChange={handleTabChange} aria-label="project tabs">
					<Tab label={t('brainstorm.overview')} id="project-tab-0" />
					<Tab label={t('brainstorm.brainstorm')} id="project-tab-1" />
					<Tab label={t('brainstorm.settings')} id="project-tab-2" />
				</Tabs>
			</Box>

			<TabPanel value={tabValue} index={0}>
				<Paper sx={{ p: 3, mb: 2 }}>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
						<Typography variant="h6" sx={{ fontWeight: 'medium' }}>
							{t('project.projectDetails')}
						</Typography>
						{isEditingDescription ? (
							<Button
								variant="contained"
								size="small"
								onClick={handleSaveProjectDetails}
								startIcon={<SaveIcon />}
								sx={{ boxShadow: (theme) => theme.shadows[2] }}>
								{t('common.save')}
							</Button>
						) : (
							<Button
								variant="outlined"
								size="small"
								onClick={() => setIsEditingDescription(true)}
								startIcon={<EditIcon />}
								sx={{ borderColor: 'primary.main' }}>
								{t('project.editDescription')}
							</Button>
						)}
					</Box>

					{isEditingDescription ? (
						<TextField
							fullWidth
							multiline
							rows={4}
							variant="outlined"
							value={editedDescription}
							onChange={(e) => {
								setEditedDescription(e.target.value)
								// Debounce to avoid too many saves
								const timeoutId = setTimeout(() => {
									void handleProjectDetailsChange('description', e.target.value)
								}, 1000) // 1 second debounce
								return () => clearTimeout(timeoutId)
							}}
							placeholder="Enter project description"
							sx={{ mb: 2 }}
							InputProps={{
								sx: {
									borderRadius: 1,
									'&:focus-within': {
										borderColor: 'primary.main',
									},
								},
							}}
							onBlur={handleSaveProjectDetails}
						/>
					) : (
						<Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
							{project.description !== null &&
							project.description !== undefined &&
							project.description !== ''
								? project.description
								: t('project.noDescriptionProvided')}
						</Typography>
					)}
				</Paper>
			</TabPanel>

			<TabPanel value={tabValue} index={1}>
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: chatOpen ? { xs: '1fr', md: '1fr 350px' } : '1fr',
						gridTemplateRows: chatOpen && isMobile ? '1fr 300px' : '1fr',
						gap: 2,
						height: { xs: 'calc(100vh - 200px)', md: 'calc(100vh - 180px)' },
						position: 'relative',
						transition: 'all 0.3s ease',
						overflow: 'hidden',
					}}>
					{/* Main brainstorming area */}
					<Box
						sx={{
							gridColumn: '1',
							gridRow: '1',
							height: '100%',
							width: '100%',
							overflow: 'hidden',
							borderRadius: 1,
							boxShadow: (theme) => theme.shadows[1],
							border: '1px solid',
							borderColor: 'divider',
							bgcolor: 'background.paper',
						}}>
						<ProjectBrainstormingSection
							projectId={project.id}
							template={project.template}
							initialNodes={project.nodes}
							initialEdges={project.edges}
							syncSettings={project.syncSettings}
							readOnly={isSaving}
						/>
					</Box>

					{/* Chat panel with responsive design */}
					{chatOpen && (
						<Box
							sx={{
								gridColumn: { xs: '1', md: '2' },
								gridRow: { xs: '2', md: '1' },
								height: '100%',
								width: '100%',
								display: 'flex',
								flexDirection: 'column',
								borderRadius: 1,
								overflow: 'hidden',
								border: '1px solid',
								borderColor: 'divider',
								boxShadow: (theme) => theme.shadows[1],
								bgcolor: 'background.paper',
							}}>
							{/* Chat header */}
							<Box
								sx={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									p: 1.5,
									borderBottom: 1,
									borderColor: 'divider',
									bgcolor: (theme) =>
										theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
								}}>
								<Typography variant="subtitle1" fontWeight="medium">
									{t('chat.aiAssistant')}
								</Typography>
								<IconButton
									size="small"
									onClick={toggleChat}
									aria-label={t('chat.closeChat')}
									sx={{ color: 'text.secondary' }}>
									<CloseIcon fontSize="small" />
								</IconButton>
							</Box>

							{/* Chat content */}
							<Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
								<ChatInterface
									onAddNodes={handleAddNodesFromChat}
									projectContext={{
										projectId: project.id,
										projectName: project.name,
										projectDescription: project.description || '',
										template: project.template,
									}}
								/>
							</Box>
						</Box>
					)}
				</Box>
			</TabPanel>

			<TabPanel value={tabValue} index={2}>
				<ProjectSettingsSection
					project={project}
					onSave={(updatedProject: Project) => {
						// Only save if there are actual changes
						if (JSON.stringify(updatedProject) !== JSON.stringify(project)) {
							// Update the project in state
							if (project !== null && project !== undefined) {
								// Create a merged project with the updates
								const mergedProject = {
									...project,
									...updatedProject,
									updatedAt: new Date().toISOString(),
								}

								// Update local state
								setNodes(mergedProject.nodes)
								setEdges(mergedProject.edges)

								// Save project
								void saveProject(mergedProject)
							}
						}
					}}
					isSaving={isSaving}
					error={error}
				/>
			</TabPanel>

			<Box
				sx={{
					position: 'fixed',
					bottom: 16,
					right: 16,
					display: 'flex',
					flexDirection: 'column',
					gap: 2,
					zIndex: 1000,
				}}>
				{!chatOpen && !isMobile && tabValue === 1 && (
					<IconButton
						color="secondary"
						aria-label="chat"
						onClick={toggleChat}
						sx={{ bgcolor: 'background.paper' }}>
						<ChatIcon />
					</IconButton>
				)}

				{/* Only show Save button when autoSave is disabled */}
				{!project.autoSave && (
					<IconButton
						color="primary"
						aria-label="save"
						onClick={() => {
							void saveProject()
						}}
						disabled={isSaving || !hasChanges}
						sx={{
							bgcolor: 'background.paper',
							transition: 'all 0.2s ease-in-out',
							position: 'relative',
							'&:disabled': {
								opacity: 0.6,
							},
						}}>
						{isSaving ? (
							<CircularProgress
								size={24}
								sx={{
									position: 'absolute',
									transition: 'opacity 0.2s ease-in-out',
								}}
							/>
						) : (
							<SaveIcon />
						)}
					</IconButton>
				)}
			</Box>

			{/* Keyboard shortcuts handler */}
			<KeyboardShortcutsHandler
				onSave={() => void saveProject()}
				onZoomIn={() => console.log('Zoom in')}
				onZoomOut={() => console.log('Zoom out')}
				onFitView={() => console.log('Fit view')}
				onUndo={() => console.log('Undo')}
				onRedo={() => console.log('Redo')}
				onDelete={() => console.log('Delete')}
				onAddNode={() => console.log('Add node')}
				onToggleChat={toggleChat}
				disabled={tabValue !== 1} // Only enable shortcuts in brainstorming tab
			/>

			{/* Help overlay */}
			<HelpOverlay
				tours={[
					{
						id: 'brainstorming-tour',
						title: 'Brainstorming Canvas Tour',
						description: 'Learn how to use the brainstorming canvas to organize your ideas.',
						steps: [
							{
								target: '.react-flow__pane',
								title: 'Canvas',
								content:
									'This is your brainstorming canvas. You can add nodes, connect them, and organize your ideas here.',
								placement: 'bottom',
							},
							{
								target: '.react-flow__node',
								title: 'Nodes',
								content:
									'These are your idea nodes. Double-click to edit them directly, or use the edit button to open the editor.',
								placement: 'right',
							},
							{
								target: '.react-flow__handle',
								title: 'Handles',
								content:
									'Drag from these handles to connect nodes and create relationships between ideas.',
								placement: 'bottom',
							},
						],
					},
				]}
				tips={[
					{
						id: 'keyboard-shortcuts',
						title: 'Use Keyboard Shortcuts',
						content: 'Press Shift+? to see all available keyboard shortcuts for faster workflow.',
						category: 'Productivity',
					},
					{
						id: 'direct-editing',
						title: 'Edit Nodes Directly',
						content: 'Double-click on any node to edit its content directly on the canvas.',
						category: 'Editing',
					},
					{
						id: 'chat-assistant',
						title: 'Use the AI Assistant',
						content:
							'The chat assistant can help generate ideas and provide suggestions for your brainstorming session.',
						category: 'AI Features',
					},
				]}
			/>
		</AppShell>
	)
}

export default ProjectDetailPage
