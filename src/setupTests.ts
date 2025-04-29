import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'
import type { ReactNode, MouseEvent } from 'react'
import React from 'react'
import type { Node, Edge, NodeChange, EdgeChange, Connection, XYPosition } from 'reactflow'
import '@testing-library/jest-dom'
import { vi, beforeEach, afterEach } from 'vitest'

interface CustomMatchers<R = unknown> {
	toHaveTestId(id: string): R
}

declare module 'vitest' {
	interface Assertion extends TestingLibraryMatchers<typeof expect.stringContaining, void> {
		toHaveTestId(id: string): void
	}
}

// Mock window.matchMedia
beforeEach(() => {
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: vi.fn().mockImplementation((query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	})
})

// Mock IntersectionObserver
class MockIntersectionObserver implements IntersectionObserver {
	readonly root: Element | null = null
	readonly rootMargin: string = ''
	readonly thresholds: ReadonlyArray<number> = []

	constructor() {
		this.observe = vi.fn()
		this.unobserve = vi.fn()
		this.disconnect = vi.fn()
		this.takeRecords = vi.fn()
	}

	observe = vi.fn()
	unobserve = vi.fn()
	disconnect = vi.fn()
	takeRecords = vi.fn()
}

window.IntersectionObserver = MockIntersectionObserver

// Mock ResizeObserver
class MockResizeObserver implements ResizeObserver {
	constructor() {
		this.observe = vi.fn()
		this.unobserve = vi.fn()
		this.disconnect = vi.fn()
	}

	observe = vi.fn()
	unobserve = vi.fn()
	disconnect = vi.fn()
}

window.ResizeObserver = MockResizeObserver

// Mock fetch
window.fetch = vi.fn()

interface ReactFlowProps {
	children?: ReactNode
	onNodesChange?: (changes: NodeChange[]) => void
	onEdgesChange?: (changes: EdgeChange[]) => void
	onConnect?: (connection: Connection) => void
	onNodeClick?: (event: MouseEvent, node: Node) => void
	onNodeDragStop?: (event: MouseEvent, node: Node) => void
}

const MockReactFlow: React.FC<ReactFlowProps> = ({
	children,
	onNodesChange,
	onEdgesChange,
	onConnect,
	onNodeClick,
	onNodeDragStop,
}) => {
	return React.createElement('div', {
		'data-testid': 'react-flow',
		onClick: (e: MouseEvent) => {
			if (onNodeClick) {
				onNodeClick(e, { id: 'test-node' } as Node)
			}
		},
		onDragEnd: (e: MouseEvent) => {
			if (onNodeDragStop) {
				onNodeDragStop(e, { id: 'test-node' } as Node)
			}
		},
	}, children)
}

// Enhanced React Flow mock
vi.mock('reactflow', async () => {
	const actual = await vi.importActual('reactflow')
	const mockNodes: Node[] = []
	const mockEdges: Edge[] = []

	return {
		...actual,
		ReactFlow: MockReactFlow,
		Background: () => null,
		Controls: () => null,
		useNodesState: () => {
			const [nodes, setNodes] = React.useState<Node[]>(mockNodes)
			const onNodesChange = (changes: NodeChange[]) => {
				changes.forEach((change) => {
					if (change.type === 'remove') {
						mockNodes.splice(mockNodes.findIndex((n) => n.id === change.id), 1)
					}
				})
				setNodes([...mockNodes])
			}
			return [nodes, setNodes, onNodesChange]
		},
		useEdgesState: () => {
			const [edges, setEdges] = React.useState<Edge[]>(mockEdges)
			const onEdgesChange = (changes: EdgeChange[]) => {
				changes.forEach((change) => {
					if (change.type === 'remove') {
						mockEdges.splice(mockEdges.findIndex((e) => e.id === change.id), 1)
					}
				})
				setEdges([...mockEdges])
			}
			return [edges, setEdges, onEdgesChange]
		},
		MarkerType: {
			ArrowClosed: 'arrowclosed',
		},
		Panel: () => null,
		MiniMap: () => null,
		addEdge: vi.fn((params: Connection, edges: Edge[]) => [
			...edges,
			{ id: `${params.source}-${params.target}`, ...params },
		]),
		Position: {
			Left: 'left',
			Top: 'top',
			Right: 'right',
			Bottom: 'bottom',
		},
		useReactFlow: vi.fn().mockReturnValue({
			fitView: vi.fn(),
			zoomIn: vi.fn(),
			zoomOut: vi.fn(),
			setCenter: vi.fn(),
			getNodes: vi.fn().mockReturnValue(mockNodes),
			getEdges: vi.fn().mockReturnValue(mockEdges),
			setNodes: vi.fn((nodes: Node[]) => {
				mockNodes.length = 0
				mockNodes.push(...nodes)
			}),
			setEdges: vi.fn((edges: Edge[]) => {
				mockEdges.length = 0
				mockEdges.push(...edges)
			}),
			project: vi.fn().mockImplementation((position: XYPosition) => position),
			deleteElements: vi.fn(({ nodes, edges }: { nodes?: Node[]; edges?: Edge[] }) => {
				if (nodes?.length) {
					const nodeIds = nodes.map((n) => n.id)
					mockNodes.splice(0, mockNodes.length, ...mockNodes.filter((n) => !nodeIds.includes(n.id)))
				}
				if (edges?.length) {
					const edgeIds = edges.map((e) => e.id)
					mockEdges.splice(0, mockEdges.length, ...mockEdges.filter((e) => !edgeIds.includes(e.id)))
				}
			}),
		}),
	}
})

// Mock ID generator
vi.mock('./utils/idGenerator', async () => {
	const actual = await vi.importActual<typeof import('./utils/idGenerator')>('./utils/idGenerator')
	let counter = 0
	return {
		...actual,
		generateUniqueId: vi.fn(() => `test-node-${counter++}`),
	}
})

afterEach(() => {
	vi.clearAllMocks()
})
