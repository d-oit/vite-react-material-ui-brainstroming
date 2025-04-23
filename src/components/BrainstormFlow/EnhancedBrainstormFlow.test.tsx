import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'

import { useSettings } from '../../contexts/SettingsContext'
import { useBrainstormStore } from '../../store/brainstormStore'
import { EdgeType, NodeType } from '../../types/enums'

import { EnhancedBrainstormFlow } from './EnhancedBrainstormFlow'
import type { CustomNodeType, CustomEdge } from './types'
import { getLayoutedElements } from './utils/autoLayout'

// Mock getLayoutedElements from utils
vi.mock('./utils/autoLayout', () => ({
	getLayoutedElements: vi.fn((nodes, edges) => ({ nodes, edges })),
}))

// Mock the ReactFlow component and other dependencies
vi.mock('reactflow', async () => {
	return {
		Background: () => <div data-testid="background" />,
		Panel: ({ children }: { children: React.ReactNode }) => <div data-testid="panel">{children}</div>,
		addEdge: vi.fn(),
		applyNodeChanges: vi.fn(),
		applyEdgeChanges: vi.fn(),
		ReactFlow: ({
			children,
			onNodeClick,
		}: {
			children: React.ReactNode
			onNodeClick?: (event: React.MouseEvent<Element, MouseEvent>, node: any) => void
		}) => (
			<div
				data-testid="react-flow"
				onClick={() => {
					const mockEvent = {
						nativeEvent: new MouseEvent('click'),
						isDefaultPrevented: () => false,
						isPropagationStopped: () => false,
						persist: () => {},
					} as React.MouseEvent<Element, MouseEvent>
					onNodeClick?.(mockEvent, { id: '1', type: NodeType.IDEA })
				}}
				role="button"
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === 'Enter') {
						const mockEvent = {
							nativeEvent: new MouseEvent('click'),
							isDefaultPrevented: () => false,
							isPropagationStopped: () => false,
							persist: () => {},
						} as React.MouseEvent<Element, MouseEvent>
						onNodeClick?.(mockEvent, { id: '1', type: NodeType.IDEA })
					}
				}}>
				{children}
			</div>
		),
		default: ({ children }: { children: React.ReactNode }) => <div data-testid="react-flow">{children}</div>,
		fitView: vi.fn(),
		zoomIn: vi.fn(),
		zoomOut: vi.fn(),
	}
})

// Mock the hooks
vi.mock('../../store/brainstormStore', () => ({
	useBrainstormStore: vi.fn(),
}))

vi.mock('../../contexts/SettingsContext', () => ({
	useSettings: vi.fn(),
}))

// Mock the components
vi.mock('./EnhancedMiniMap', () => ({
	__esModule: true,
	default: () => <div data-testid="minimap" />,
	EnhancedMiniMap: () => <div data-testid="minimap" />,
}))

vi.mock('./FloatingControls', () => ({
	FloatingControls: ({ onToggleArchived }: { onToggleArchived: () => void }) => (
		<div data-testid="floating-controls">
			<button onClick={onToggleArchived}>Toggle Archived</button>
		</div>
	),
}))

interface NodeEditDialogProps {
	open: boolean
	onClose: () => void
	onSave: (data: { title: string; content: string; type: NodeType }) => void
	initialData: { type: NodeType }
}

vi.mock('./NodeEditDialog', () => ({
	__esModule: true,
	default: ({ open, onClose, onSave, initialData }: NodeEditDialogProps) =>
		typeof open === 'boolean' && open ? (
			<div data-testid="node-edit-dialog">
				<button onClick={() => onSave({ title: 'Updated Title', content: 'Updated Content', type: initialData.type })}>
					Save
				</button>
				<button onClick={onClose}>Cancel</button>
			</div>
		) : null,
}))

describe('EnhancedBrainstormFlow', () => {
	const mockSetNodes = vi.fn()
	const mockSetEdges = vi.fn()
	const mockUpdateNodeData = vi.fn()
	const mockToggleArchiveNode = vi.fn()
	const mockAddNode = vi.fn()
	const mockFitView = vi.fn()
	const mockZoomIn = vi.fn()
	const mockZoomOut = vi.fn()

	beforeEach(() => {
		// Setup mocks
		const defaultNode: CustomNodeType = {
			id: '1',
			type: NodeType.IDEA,
			data: {
				id: '1',
				title: 'Test Node',
				content: 'Test Content',
				type: NodeType.IDEA,
				isArchived: false,
				createdAt: '2024-04-23T00:00:00Z',
				updatedAt: '2024-04-23T00:00:00Z',
			},
			position: { x: 0, y: 0 },
		}

		;(useBrainstormStore as any).mockReturnValue({
			nodes: [defaultNode],
			edges: [],
			setNodes: mockSetNodes,
			setEdges: mockSetEdges,
			updateNodeData: mockUpdateNodeData,
			toggleArchiveNode: mockToggleArchiveNode,
			addNode: mockAddNode,
			reactFlowInstance: {
				fitView: mockFitView,
				zoomIn: mockZoomIn,
				zoomOut: mockZoomOut,
			},
		})

		;(useSettings as any).mockReturnValue({
			settings: {
				autoSave: true,
			},
			nodePreferences: {
				nodeSizes: {
					small: { width: 150, fontSize: 0.8 },
					medium: { width: 200, fontSize: 1 },
					large: { width: 300, fontSize: 1.2 },
				},
			},
		})

		// Reset mocks
		vi.clearAllMocks()
	})

	it('renders without crashing', () => {
		render(<EnhancedBrainstormFlow initialNodes={[]} initialEdges={[]} onSave={vi.fn()} />)
		expect(screen.getByTestId('react-flow')).toBeInTheDocument()
	})

	it('renders controls and minimap', () => {
		render(<EnhancedBrainstormFlow initialNodes={[]} initialEdges={[]} onSave={vi.fn()} />)
		expect(screen.getByTestId('panel')).toBeInTheDocument()
		expect(screen.getByTestId('minimap')).toBeInTheDocument()
	})

	it('toggles fullscreen mode when fullscreen button is clicked', () => {
		const requestFullscreenMock = vi.fn()
		const exitFullscreenMock = vi.fn()

		Object.defineProperty(document.documentElement, 'requestFullscreen', {
			value: requestFullscreenMock,
			writable: true,
		})

		Object.defineProperty(document, 'exitFullscreen', {
			value: exitFullscreenMock,
			writable: true,
		})

		render(<EnhancedBrainstormFlow initialNodes={[]} initialEdges={[]} onSave={vi.fn()} />)
		const fullscreenButton = screen.getAllByRole('button')[2]
		fireEvent.click(fullscreenButton)
		expect(requestFullscreenMock).toHaveBeenCalled()
	})

	it('opens node edit dialog when clicking a node', () => {
		render(<EnhancedBrainstormFlow initialNodes={[]} initialEdges={[]} onSave={vi.fn()} />)

		// Click the ReactFlow component (mocked to simulate node click)
		fireEvent.click(screen.getByTestId('react-flow'))

		// Check if edit dialog is shown
		expect(screen.getByTestId('node-edit-dialog')).toBeInTheDocument()
	})

	it('updates node data when saving edit dialog', async () => {
		render(<EnhancedBrainstormFlow initialNodes={[]} initialEdges={[]} onSave={vi.fn()} />)

		// Click node to open dialog
		fireEvent.click(screen.getByTestId('react-flow'))

		// Click save in dialog
		fireEvent.click(screen.getByText('Save'))

		// Verify node data was updated
		expect(mockUpdateNodeData).toHaveBeenCalledWith('1', {
			title: 'Updated Title',
			content: 'Updated Content',
			type: NodeType.IDEA,
			updatedAt: expect.any(String),
		})
	})

	it('initializes with provided nodes and edges', () => {
		const initialNodes: CustomNodeType[] = [{
			id: '1',
			type: NodeType.IDEA,
			data: {
				id: '1',
				title: 'Initial',
				content: '',
				type: NodeType.IDEA,
				createdAt: '2024-04-23T00:00:00Z',
				updatedAt: '2024-04-23T00:00:00Z',
			},
			position: { x: 0, y: 0 },
		}]
		const initialEdges: CustomEdge[] = [{
			id: 'e1',
			source: '1',
			target: '2',
			type: EdgeType.DEFAULT,
		}]

		render(
			<EnhancedBrainstormFlow
				initialNodes={initialNodes}
				initialEdges={initialEdges}
				onSave={vi.fn()}
			/>,
		)

		expect(mockSetNodes).toHaveBeenCalledWith(initialNodes)
		expect(mockSetEdges).toHaveBeenCalledWith(initialEdges)
	})

	it('updates zoom level when using slider in settings menu', () => {
		const mockZoomTo: (zoom: number) => void = vi.fn()
		const mockBrainstormStore = useBrainstormStore()

		;(useBrainstormStore as any).mockReturnValue({
			...mockBrainstormStore,
			reactFlowInstance: { zoomTo: mockZoomTo },
		})

		render(<EnhancedBrainstormFlow initialNodes={[]} initialEdges={[]} onSave={vi.fn()} />)

		// Open settings menu
		const settingsButton = screen.getAllByRole('button')[0]
		fireEvent.click(settingsButton)

		// Find and change zoom slider
		const slider = screen.getByRole('slider')
		fireEvent.change(slider, { target: { value: 1.5 } })

		expect(mockZoomTo).toHaveBeenCalledWith(1.5)
	})

	it('toggles grid visibility when grid button is clicked', () => {
		render(<EnhancedBrainstormFlow initialNodes={[]} initialEdges={[]} onSave={vi.fn()} />)

		const gridButton = screen.getAllByRole('button')[1]

		// Grid should be visible by default
		expect(screen.getByTestId('background')).toBeInTheDocument()

		// Click to hide grid
		fireEvent.click(gridButton)

		// Grid should be hidden
		expect(screen.queryByTestId('background')).not.toBeInTheDocument()
	})

	it('filters archived nodes when showArchived is false', () => {
		const mockBrainstormStore = useBrainstormStore()
		const archivedNode: CustomNodeType = {
			id: '2',
			type: NodeType.IDEA,
			data: {
				id: '2',
				title: 'Archived Node',
				content: 'Archived',
				type: NodeType.IDEA,
				isArchived: true,
				createdAt: '2024-04-23T00:00:00Z',
				updatedAt: '2024-04-23T00:00:00Z',
			},
			position: { x: 100, y: 100 },
		}

		;(useBrainstormStore as any).mockReturnValue({
			...mockBrainstormStore,
			nodes: [...mockBrainstormStore.nodes, archivedNode],
		})

		render(<EnhancedBrainstormFlow initialNodes={[]} initialEdges={[]} onSave={vi.fn()} />)

		// Toggle archived visibility
		fireEvent.click(screen.getByText('Toggle Archived'))

		// Verify the store was updated
		expect(mockSetNodes).toHaveBeenCalled()
	})

	it('handles keyboard shortcuts', () => {
		render(<EnhancedBrainstormFlow initialNodes={[]} initialEdges={[]} onSave={vi.fn()} />)

		// Test auto-layout (Ctrl + L)
		fireEvent.keyDown(document, { key: 'l', ctrlKey: true })
		expect(mockFitView).toHaveBeenCalled()

		// Test zoom in (Ctrl + +)
		fireEvent.keyDown(document, { key: '+', ctrlKey: true })
		expect(mockZoomIn).toHaveBeenCalled()

		// Test zoom out (Ctrl + -)
		fireEvent.keyDown(document, { key: '-', ctrlKey: true })
		expect(mockZoomOut).toHaveBeenCalled()
	})

	it('handles auto-layout', () => {
		const mockNodes = [{ id: '1' }]
		const mockEdges = [{ id: 'e1' }]

		;(useBrainstormStore as any).mockReturnValue({
			nodes: mockNodes,
			edges: mockEdges,
			setNodes: mockSetNodes,
			setEdges: mockSetEdges,
			reactFlowInstance: { fitView: mockFitView },
		})

		render(<EnhancedBrainstormFlow initialNodes={[]} initialEdges={[]} onSave={vi.fn()} />)

		// Click the auto-layout button
		const layoutButton = screen.getAllByRole('button')[3]
		fireEvent.click(layoutButton)

		expect(getLayoutedElements).toHaveBeenCalledWith(mockNodes, mockEdges)
		expect(mockSetNodes).toHaveBeenCalled()
		expect(mockSetEdges).toHaveBeenCalled()
		expect(mockFitView).toHaveBeenCalled()
	})

	it('calls onSave when nodes or edges change', () => {
		const onSave = vi.fn()
		const mockNodes = [{ id: '1' }]
		const mockEdges = [{ id: 'e1' }]

		;(useBrainstormStore as any).mockReturnValue({
			nodes: mockNodes,
			edges: mockEdges,
		})

		render(<EnhancedBrainstormFlow initialNodes={[]} initialEdges={[]} onSave={onSave} />)

		expect(onSave).toHaveBeenCalledWith(mockNodes, mockEdges)
	})
})
