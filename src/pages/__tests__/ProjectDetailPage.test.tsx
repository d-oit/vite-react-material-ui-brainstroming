import { screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'

import { useProject } from '../../hooks/useProject'
import { renderWithProviders } from '../../tests/test-setup'
import type { Project } from '../../types'
import { ProjectTemplate } from '../../types/project'
import ProjectDetailPage from '../ProjectDetailPage'

// Mock components
vi.mock('../../components/Layout/AppShell', () => ({
	// Updated mock to accept and render version prop
	default: ({ children, version }: { children: React.ReactNode; version?: string }) => (
		<div data-testid="app-shell">
			{version && <span>Version {version}</span>} {/* Render version if provided */}
			{children}
		</div>
	),
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

	const renderTestComponent = () => {
		// Set the initial route for BrowserRouter provided by renderWithProviders
		window.history.pushState({}, 'Test Page', '/projects/test-project-id')

		return renderWithProviders(<ProjectDetailPage />)
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

		const { container } = renderTestComponent()
		expect(container).toBeTruthy() // Basic check
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

		const { container } = renderTestComponent()
		expect(container).toBeTruthy() // Basic check
		expect(screen.getByText(/Failed to load project/i)).toBeInTheDocument()
	})

	it('renders project details when project is loaded', async () => {
		renderTestComponent()
		await waitFor(() => {
			expect(screen.getByText('Test Project')).toBeInTheDocument()
		})
		// Check for the specific version number rendered by the mock AppShell
		expect(screen.getByText(/1\.0\.0/)).toBeInTheDocument()
	})

	it('allows editing project name', async () => {
		renderTestComponent()
		await waitFor(() => {
			expect(screen.getByText('Test Project')).toBeInTheDocument()
		})

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
		renderTestComponent()
		await waitFor(() => {
			expect(screen.getByText('Test Description')).toBeInTheDocument()
		})

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

		renderTestComponent()
		await waitFor(() => {
			// The save button text comes from i18n common.save
			// Check if the button indicating changes exists
			expect(screen.getByRole('button', { name: /Save\*/i })).toBeInTheDocument()
		})

		const saveButton = screen.getByRole('button', { name: /Save\*/i })
		fireEvent.click(saveButton)

		await waitFor(() => {
			expect(mockSaveProject).toHaveBeenCalled()
		})
	})

	it('creates a new version when New Version button is clicked', async () => {
		renderTestComponent()
		await waitFor(() => {
			// Text comes from i18n project.newVersion
			expect(screen.getByRole('button', { name: /New Version/i })).toBeInTheDocument()
		})

		const newVersionButton = screen.getByRole('button', { name: /New Version/i })
		fireEvent.click(newVersionButton)

		await waitFor(() => {
			expect(mockCreateNewVersion).toHaveBeenCalled()
		})
	})

	it('toggles chat when Assistant button is clicked', async () => {
		renderTestComponent()

		// Wait for initial render
		await waitFor(() => {
			expect(screen.getByRole('button', { name: /Assistant/i })).toBeInTheDocument()
			expect(screen.getByRole('tab', { name: /Brainstorm/i })).toBeInTheDocument()
		})

		// Switch to the Brainstorm tab first
		const brainstormTab = screen.getByRole('tab', { name: /Brainstorm/i })
		fireEvent.click(brainstormTab)

		// Wait for the brainstorm section to appear (indicating the tab switch is complete)
		await waitFor(() => {
			expect(screen.getByTestId('brainstorming-section')).toBeInTheDocument()
		})

		// Ensure chat is not visible initially on this tab
		expect(screen.queryByTestId('chat-interface')).not.toBeInTheDocument()

		// Click the Assistant button
		const assistantButton = screen.getByRole('button', { name: /Assistant/i })
		fireEvent.click(assistantButton)

		// Assert that the chat interface appears
		await waitFor(() => {
			expect(screen.getByTestId('chat-interface')).toBeInTheDocument()
		})
	})

	it('switches tabs when tab is clicked', async () => {
		renderTestComponent()
		await waitFor(() => {
			// Check overview tab content initially visible
			expect(screen.getByText('Test Description')).toBeInTheDocument()
		})

		// Click the Brainstorm tab
		// Text comes from i18n project.brainstorm
		const brainstormTab = screen.getByRole('tab', { name: /Brainstorm/i })
		fireEvent.click(brainstormTab)
		await waitFor(() => {
			expect(screen.getByTestId('brainstorming-section')).toBeInTheDocument()
		})

		// Click the Settings tab
		// Text comes from i18n project.settings
		const settingsTab = screen.getByRole('tab', { name: /Settings/i })
		fireEvent.click(settingsTab)
		await waitFor(() => {
			expect(screen.getByTestId('settings-section')).toBeInTheDocument()
		})
	})
})
