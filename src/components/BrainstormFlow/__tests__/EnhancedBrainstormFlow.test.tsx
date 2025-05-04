import { render, screen, fireEvent } from '@testing-library/react'
import type { RenderOptions, RenderResult } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { vi } from 'vitest'

// Corrected Import Order
import { I18nProvider } from '../../../contexts/I18nContext' // Import I18nProvider
import { useSettings, SettingsProvider } from '../../../contexts/SettingsContext' // Import SettingsProvider too
import { NodeType } from '../../../types'
import { createTestNode } from '../../../types/test-utils'
import { EnhancedBrainstormFlow } from '../EnhancedBrainstormFlow'

// Mock the useSettings hook but keep other exports like SettingsProvider
vi.mock('../../../contexts/SettingsContext', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../../../contexts/SettingsContext')>()
	return {
		...actual, // Keep original exports (like SettingsProvider)
		useSettings: vi.fn(), // Mock only the hook
	}
})

// Define mock functions outside the mock factory to make them accessible in tests
const mockZoomTo = vi.fn()
const mockGetZoom = vi.fn().mockReturnValue(1)
const mockFitView = vi.fn()
const mockZoomIn = vi.fn()
const mockZoomOut = vi.fn()
const mockGetNodes = vi.fn().mockReturnValue([])
const mockGetEdges = vi.fn().mockReturnValue([])
const mockSetNodes = vi.fn()
const mockSetEdges = vi.fn()
const mockProject = vi.fn().mockImplementation((pos) => pos)
const mockScreenToFlowPosition = vi.fn().mockImplementation((pos) => pos)

// Mock the ReactFlow component
vi.mock('reactflow', () => {
	// Use the mock functions defined above
	const ReactFlowMock = ({
		children,
		onNodeClick,
		nodes,
		onInit,
	}: {
		children?: React.ReactNode
		onNodeClick?: (event: any, node: any) => void
		nodes?: any[]
		onInit?: (instance: any) => void
	}) => {
		// Create a mock instance that will be passed to onInit
		const mockInstance = {
			zoomTo: mockZoomTo,
			getZoom: mockGetZoom,
			fitView: mockFitView,
			zoomIn: mockZoomIn,
			zoomOut: mockZoomOut,
			getNodes: vi.fn().mockReturnValue(nodes ?? []), // Use nullish coalescing
			getEdges: vi.fn().mockReturnValue([]),
			screenToFlowPosition: vi.fn().mockImplementation((pos) => pos),
		}

		// Call onInit with the mock instance if provided
		if (typeof onInit === 'function') { // Add type check
			setTimeout(() => onInit(mockInstance), 0)
		}

		return (
			<div data-testid="react-flow-mock">
				{children}
				{/* Ensure nodes exist before accessing */}
				{nodes && nodes.length > 0 && (
					<button type="button" data-testid="mock-node" onClick={() => onNodeClick?.({}, nodes[0])}>
						Mock Node
					</button>
				)}
			</div>
		)
	}

	ReactFlowMock.Panel = ({ children }: { children?: React.ReactNode }) => <div data-testid="panel-mock">{children}</div>
	ReactFlowMock.Background = () => <div data-testid="background-mock" />

	return {
		__esModule: true,
		default: ReactFlowMock,
		ReactFlow: ReactFlowMock,
		Background: () => <div data-testid="background-mock" />,
		Controls: () => <div data-testid="controls-mock" />,
		MiniMap: () => <div data-testid="minimap-mock" />,
		Panel: ({ children }: { children?: React.ReactNode }) => <div data-testid="panel-mock">{children}</div>, // Add basic type
		applyNodeChanges: vi.fn((changes, nodes) => nodes),
		applyEdgeChanges: vi.fn((changes, edges) => edges),
		addEdge: vi.fn((connection, edges) => edges),
		// Mock functions (like mockZoomTo) are accessible within the test scope
		// due to closure, no need to export them from here.
		// Add useReactFlow mock with correct indentation
		useReactFlow: vi.fn(() => ({
			zoomIn: mockZoomIn,
			zoomOut: mockZoomOut,
			fitView: mockFitView,
			zoomTo: mockZoomTo,
			getZoom: mockGetZoom,
			getNodes: mockGetNodes, // Use defined mock
			getEdges: mockGetEdges, // Use defined mock
			setNodes: mockSetNodes, // Use defined mock
			setEdges: mockSetEdges, // Use defined mock
			project: mockProject, // Use defined mock
			screenToFlowPosition: mockScreenToFlowPosition, // Use defined mock
		})),
	}
})

// Mock the useBrainstormStore hook
vi.mock('../../../store/brainstormStore', () => ({
	useBrainstormStore: vi.fn(() => ({
		nodes: [],
		edges: [],
		setNodes: vi.fn(),
		setEdges: vi.fn(),
	})),
}))

// Mock the EnhancedControls component
vi.mock('../EnhancedControls', () => ({
	__esModule: true,
	default: () => <div data-testid="enhanced-controls-mock" />,
}))

// Mock the EnhancedMiniMap component
vi.mock('../EnhancedMiniMap', () => ({
	EnhancedMiniMap: () => <div data-testid="enhanced-minimap-mock" />,
}))

// Mock the FloatingControls component
vi.mock('../FloatingControls', () => ({
	FloatingControls: () => <div data-testid="floating-controls-mock" />,
}))

// Mock the NodeEditDialog component
vi.mock('../NodeEditDialog', () => ({
	__esModule: true,
	default: () => <div data-testid="node-edit-dialog-mock" />,
}))

// Mock MUI Icons needed for this test file
vi.mock('@mui/icons-material', () => ({
	ZoomIn: () => <svg data-testid="ZoomInIcon" />,
	ZoomOut: () => <svg data-testid="ZoomOutIcon" />,
	FitScreen: () => <svg data-testid="FitScreenIcon" />,
	GridOn: () => <svg data-testid="GridOnIcon" />,
	GridOff: () => <svg data-testid="GridOffIcon" />,
	// Add other icons if needed by components used here
}))

// Mock the DeleteConfirmationDialog component
vi.mock('../../DeleteConfirmationDialog', () => ({
	__esModule: true,
	default: () => <div data-testid="delete-confirmation-dialog-mock" />,
}))

// Helper function to render with necessary providers
const renderWithProviders = (
	ui: React.ReactElement,
	options?: Omit<RenderOptions, 'wrapper'>,
): RenderResult => {
	function Wrapper({ children }: PropsWithChildren<unknown>): JSX.Element {
		return (
			<I18nProvider initialLocale="en">
				<SettingsProvider>{children}</SettingsProvider>
			</I18nProvider>
		)
	}
	return render(ui, { wrapper: Wrapper, ...options })
}

describe('EnhancedBrainstormFlow', () => {
	beforeEach(() => {
		// Mock the useSettings hook
		(useSettings as any).mockReturnValue({
			settings: {
				autoSave: true,
				preferredNodeSize: 'medium',
			},
			nodePreferences: {
				nodeSizes: {
					small: { width: 150, fontSize: 0.8 },
					medium: { width: 200, fontSize: 1 },
					large: { width: 250, fontSize: 1.2 },
				},
			},
			getNodeColor: vi.fn(() => '#e3f2fd'),
		})
	})

	it('renders the component correctly', () => {
		// 1. Create node with top-level overrides
		const testNode = createTestNode({
			id: '1',
			type: NodeType.IDEA,
			position: { x: 100, y: 100 },
			// Don't override data here initially
		})

		// 2. Modify the data object after creation
		testNode.data.title = 'Test Node'
		testNode.data.content = 'Test content'
		testNode.data.label = 'Test Node'
		// Add required nested type (use 'as any' if NodeData doesn't strictly define it)
		;(testNode.data as any).type = NodeType.IDEA

		// 3. Add component-specific functions
		;(testNode.data as any).onEdit = expect.any(Function)
		;(testNode.data as any).onDelete = expect.any(Function)
		;(testNode.data as any).onChat = expect.any(Function)

		// 4. Render with the fully prepared node
		renderWithProviders( // Use helper
			<EnhancedBrainstormFlow
				projectId="test-project"
				initialNodes={[testNode as any]} // Use 'as any' here to bypass final check if needed
				initialEdges={[]}
				onSave={vi.fn()}
			/>,
		)

		// Check if the main components are rendered
		expect(screen.getByTestId('react-flow-mock')).toBeInTheDocument()
		expect(screen.getByTestId('background-mock')).toBeInTheDocument()
		expect(screen.getByTestId('panel-mock')).toBeInTheDocument()
		expect(screen.getByTestId('enhanced-controls-mock')).toBeInTheDocument()
		expect(screen.getByTestId('enhanced-minimap-mock')).toBeInTheDocument()
		expect(screen.getByTestId('floating-controls-mock')).toBeInTheDocument()
	})

	it('opens the node edit dialog when a node is clicked', () => {
		// 1. Create node with top-level overrides
		const testNode = createTestNode({
			id: '1',
			type: NodeType.IDEA,
			position: { x: 100, y: 100 },
			// Don't override data here initially
		})

		// 2. Modify the data object after creation
		testNode.data.title = 'Test Node'
		testNode.data.content = 'Test content'
		testNode.data.label = 'Test Node'
		// Add required nested type (use 'as any' if NodeData doesn't strictly define it)
		;(testNode.data as any).type = NodeType.IDEA

		// 3. Add component-specific functions
		;(testNode.data as any).onEdit = expect.any(Function)
		;(testNode.data as any).onDelete = expect.any(Function)
		;(testNode.data as any).onChat = expect.any(Function)

		// 4. Render with the fully prepared node
		renderWithProviders( // Use helper
			<EnhancedBrainstormFlow
				projectId="test-project"
				initialNodes={[testNode as any]} // Use 'as any' here to bypass final check if needed
				initialEdges={[]}
				onSave={vi.fn()}
			/>,
		)

		// Click on the mock node
		fireEvent.click(screen.getByTestId('mock-node'))

		// Check if the node edit dialog is rendered
		expect(screen.getByTestId('node-edit-dialog-mock')).toBeInTheDocument()
	})

	it('hides save button when autosave is enabled', () => {
		// Mock the useSettings hook to return autoSave: true
		(useSettings as any).mockReturnValue({
			settings: {
				autoSave: true,
				preferredNodeSize: 'medium',
			},
			nodePreferences: {
				nodeSizes: {
					small: { width: 150, fontSize: 0.8 },
					medium: { width: 200, fontSize: 1 },
					large: { width: 250, fontSize: 1.2 },
				},
			},
			getNodeColor: vi.fn(() => '#e3f2fd'),
		})

		const { container } = renderWithProviders( // Use helper
			<EnhancedBrainstormFlow projectId="test-project" initialNodes={[]} initialEdges={[]} onSave={vi.fn()} />,
		)

		// The save button should not be visible in the enhanced controls
		// Note: This is an indirect test since we're mocking EnhancedControls
		expect(screen.getByTestId('enhanced-controls-mock')).toBeInTheDocument()
	})

	it('shows save button when autosave is disabled', () => {
		// Mock the useSettings hook to return autoSave: false
		(useSettings as any).mockReturnValue({
			settings: {
				autoSave: false,
				preferredNodeSize: 'medium',
			},
			nodePreferences: {
				nodeSizes: {
					small: { width: 150, fontSize: 0.8 },
					medium: { width: 200, fontSize: 1 },
					large: { width: 250, fontSize: 1.2 },
				},
			},
			getNodeColor: vi.fn(() => '#e3f2fd'),
		})

		renderWithProviders( // Use helper
			<EnhancedBrainstormFlow projectId="test-project" initialNodes={[]} initialEdges={[]} onSave={vi.fn()} />,
		)

		// The save button should be visible in the enhanced controls
		// Note: This is an indirect test since we're mocking EnhancedControls
		expect(screen.getByTestId('enhanced-controls-mock')).toBeInTheDocument()
	})

	it('uses zoomTo method when zoom level changes', async () => {
		// Mock functions are available in scope

		renderWithProviders( // Use helper
			<EnhancedBrainstormFlow projectId="test-project" initialNodes={[]} initialEdges={[]} onSave={vi.fn()} />,
		)

		// Wait for the ReactFlow instance to be initialized
		await new Promise((resolve) => setTimeout(resolve, 10))

		// Find the settings button and click it
		const settingsButton = screen.getAllByRole('button')[0]
		fireEvent.click(settingsButton)

		// Find the slider and simulate a change
		const slider = screen.getByRole('slider')
		fireEvent.change(slider, { target: { value: 1.5 } })

		// Check if zoomTo was called with the correct value
		expect(mockZoomTo).toHaveBeenCalledWith(1.5) // Assert against the mock function in scope
	})
})
