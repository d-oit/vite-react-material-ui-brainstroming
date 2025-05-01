import { ThemeProvider, createTheme } from '@mui/material'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { createInstance } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach, beforeAll } from 'vitest'

import { useProject } from '../../hooks/useProject'
import type { Project } from '../../types'
import { ProjectTemplate } from '../../types/project'
import ProjectDetailPage from '../ProjectDetailPage'

// Create test i18n instance
const testI18n = createInstance({
	lng: 'en',
	fallbackLng: 'en',
	ns: ['translation'],
	defaultNS: 'translation',
	interpolation: { escapeValue: false },
	resources: {
		en: {
			translation: {
				common: {
					loading: 'Loading...',
					error: 'Error',
					save: 'Save',
					edit: 'Edit',
					delete: 'Delete',
					cancel: 'Cancel',
					name: 'Name',
					description: 'Description',
					version: 'Version {{version}}',
				},
				project: {
					title: 'Project Details',
					newVersion: 'New Version',
					settings: 'Settings',
					overview: 'Overview',
					brainstorm: 'Brainstorm',
				},
			},
		},
	},
})

// Initialize i18n instance
beforeAll(() => {
	return testI18n.init()
})

// Mock components
vi.mock('../../components/Layout/AppShell', () => ({
	default: ({ children }: { children: React.ReactNode }) => <div data-testid="app-shell">{children}</div>,
}))

vi.mock('../../components/Project/ProjectBrainstormingSection', () => ({
	ProjectBrainstormingSection: () => <div data-testid="brainstorming-section">Brainstorming Section</div>,
}))

vi.mock('../../components/Project/ProjectSettingsSection', () => ({
	default: () => <div data-testid="settings-section">Settings Section</div>,
}))

vi.mock('../../components/Chat/ChatInterface', () => ({
	ChatInterface: () => <div data-testid="chat-interface">Chat Interface</div>,
}))

vi.mock('../../components/BrainstormFlow/KeyboardShortcutsHandler', () => ({
	default: () => <div data-testid="keyboard-shortcuts">Keyboard Shortcuts</div>,
}))

vi.mock('../../components/Help/HelpOverlay', () => ({
	default: () => <div data-testid="help-overlay">Help Overlay</div>,
}))

// Mock hooks
vi.mock('../../hooks/useProject', () => ({
	useProject: vi.fn(),
}))

// Create mock project
const mockProject: Project = {
	id: 'test-project-id',
	name: 'Test Project',
	description: 'Test Description',
	createdAt: '2023-01-01T00:00:00.000Z',
	updatedAt: '2023-01-01T00:00:00.000Z',
	version: '1.0.0',
	template: ProjectTemplate.CUSTOM,
	nodes: [],
	edges: [],
	syncSettings: {
		enableS3Sync: false,
		syncFrequency: 'manual',
		intervalMinutes: 30,
		autoSave: false,
	},
	isPinned: false,
}

const findSaveButton = (buttons: HTMLElement[]) => {
	return buttons.find((button) => {
		if (button instanceof HTMLButtonElement) {
			const isEnabled = !button.hasAttribute('disabled')
			const inPaper = button.closest('.MuiPaper-root') !== null
			return isEnabled && inPaper
		}
		return false
	})
}

// Mock save functions
const mockSaveProject = vi.fn().mockResolvedValue(true)
const mockCreateNewVersion = vi.fn().mockResolvedValue(true)

describe('ProjectDetailPage', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		// Setup mock implementation
		vi.mocked(useProject).mockReturnValue({
			project: mockProject,
			loading: false,
			error: null,
			isSaving: false,
			hasChanges: false,
			saveProject: mockSaveProject,
			createNewVersion: mockCreateNewVersion,
			loadProject: vi.fn(),
			createProject: vi.fn(),
			addNode: vi.fn(),
			updateNode: vi.fn(),
			removeNode: vi.fn(),
			addEdge: vi.fn(),
			updateEdge: vi.fn(),
			removeEdge: vi.fn(),
		})
	})

	const renderComponent = () => {
		const theme = createTheme()
		return render(
			<I18nextProvider i18n={testI18n}>
				<ThemeProvider theme={theme}>
					<MemoryRouter initialEntries={['/projects/test-project-id']}>
						<Routes>
							<Route path="/projects/:projectId" element={<ProjectDetailPage />} />
						</Routes>
					</MemoryRouter>
				</ThemeProvider>
			</I18nextProvider>,
		)
	}

	it('renders loading state when project is loading', () => {
		vi.mocked(useProject).mockReturnValue({
			project: null,
			loading: true,
			error: null,
			isSaving: false,
			hasChanges: false,
			saveProject: mockSaveProject,
			createNewVersion: mockCreateNewVersion,
			loadProject: vi.fn(),
			createProject: vi.fn(),
			addNode: vi.fn(),
			updateNode: vi.fn(),
			removeNode: vi.fn(),
			addEdge: vi.fn(),
			updateEdge: vi.fn(),
			removeEdge: vi.fn(),
		})

		renderComponent()
		expect(screen.getByRole('progressbar')).toBeInTheDocument()
	})

	it('renders error state when there is an error', () => {
		vi.mocked(useProject).mockReturnValue({
			project: null,
			loading: false,
			error: 'Failed to load project',
			isSaving: false,
			hasChanges: false,
			saveProject: mockSaveProject,
			createNewVersion: mockCreateNewVersion,
			loadProject: vi.fn(),
			createProject: vi.fn(),
			addNode: vi.fn(),
			updateNode: vi.fn(),
			removeNode: vi.fn(),
			addEdge: vi.fn(),
			updateEdge: vi.fn(),
			removeEdge: vi.fn(),
		})

		renderComponent()
		expect(screen.getByText(/Failed to load project/i)).toBeInTheDocument()
	})

	it('renders project details when project is loaded', () => {
		renderComponent()
		expect(screen.getByText('Test Project')).toBeInTheDocument()
		expect(screen.getByText('Version 1.0.0')).toBeInTheDocument()
	})

	it('allows editing project name', async () => {
		renderComponent()

		const editNameButton = screen.getByLabelText('Edit project name')
		fireEvent.click(editNameButton)

		const nameInput = screen.getByDisplayValue('Test Project')
		fireEvent.change(nameInput, { target: { value: 'Updated Project Name' } })
		fireEvent.keyDown(nameInput, { key: 'Enter' })

		await waitFor(() => {
			expect(mockSaveProject).toHaveBeenCalledWith(
				expect.objectContaining({
					name: 'Updated Project Name',
				}),
			)
		})
	})

	it('allows editing project description', async () => {
		renderComponent()

		const editDescriptionButton = screen.getByRole('button', { name: /Edit Description/i })
		fireEvent.click(editDescriptionButton)

		const descriptionInput = screen.getByDisplayValue('Test Description')
		fireEvent.change(descriptionInput, { target: { value: 'Updated Description' } })

		const saveButtons = screen.getAllByRole('button', { name: /Save$/i })
		const saveButton = findSaveButton(saveButtons)
		if (!saveButton) throw new Error('Save button not found')

		fireEvent.click(saveButton)

		await waitFor(() => {
			expect(mockSaveProject).toHaveBeenCalledWith(
				expect.objectContaining({
					description: 'Updated Description',
				}),
			)
		})
	})

	it('saves project when Save button is clicked', async () => {
		vi.mocked(useProject).mockReturnValue({
			...vi.mocked(useProject)(),
			hasChanges: true,
		})

		renderComponent()
		const saveButton = screen.getByRole('button', { name: /Save\*/i })
		fireEvent.click(saveButton)

		expect(mockSaveProject).toHaveBeenCalled()
	})

	it('creates a new version when New Version button is clicked', async () => {
		renderComponent()

		const newVersionButton = screen.getByRole('button', { name: /New Version/i })
		fireEvent.click(newVersionButton)

		expect(mockCreateNewVersion).toHaveBeenCalled()
	})

	it('toggles chat when Assistant button is clicked', () => {
		renderComponent()
		expect(screen.queryByTestId('chat-interface')).not.toBeInTheDocument()

		const assistantButton = screen.getByRole('button', { name: /Assistant/i })
		fireEvent.click(assistantButton)

		expect(screen.getByTestId('chat-interface')).toBeInTheDocument()
	})

	it('switches tabs when tab is clicked', () => {
		renderComponent()

		// Initially, Overview tab should be active
		expect(screen.getByText('Test Description')).toBeInTheDocument()

		// Click the Brainstorm tab
		const brainstormTab = screen.getByRole('tab', { name: /Brainstorm/i })
		fireEvent.click(brainstormTab)
		expect(screen.getByTestId('brainstorming-section')).toBeInTheDocument()

		// Click the Settings tab
		const settingsTab = screen.getByRole('tab', { name: /Settings/i })
		fireEvent.click(settingsTab)
		expect(screen.getByTestId('settings-section')).toBeInTheDocument()
	})
})
