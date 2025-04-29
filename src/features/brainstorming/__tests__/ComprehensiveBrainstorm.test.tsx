import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { useState } from 'react'
import type { ReactNode } from 'react'
import { vi } from 'vitest'

import { I18nProvider } from '../../../contexts/I18nContext'
import ComprehensiveBrainstorm from '../ComprehensiveBrainstorm'
import type { BrainstormNode, BrainstormSession } from '../types'

import { MOCK_NODE_BASE, MOCK_SESSION, TEST_PROJECT_ID } from './constants'
import { setupTest } from './testUtils'

// Enhanced ReactFlow mock with proper event handling
vi.mock('reactflow', () => {
	const MockReactFlow = ({
		children,
		nodes,
		edges,
		onNodesChange,
		onEdgesChange,
		onConnect,
	}: {
		children: React.ReactNode,
		nodes: any[],
		edges: any[],
		onNodesChange?: (changes: any) => void,
		onEdgesChange?: (changes: any) => void,
		onConnect?: (connection: any) => void,
	}) => {
		return (
			<div data-testid="react-flow-mock">
				{children}
				<div data-testid="nodes-count">{nodes.length}</div>
				<div data-testid="edges-count">{edges.length}</div>
				<button
					data-testid="delete-node"
					onClick={() => onNodesChange?.([{
						type: 'remove',
						id: nodes[0]?.id,
					}])}
				>
					Delete Node
				</button>
			</div>
		)
	}

	return {
		default: MockReactFlow,
		ReactFlow: MockReactFlow,
		Background: () => null,
		Controls: () => null,
		useNodesState: (initialNodes: any[] = []) => {
			const [nodes, setNodes] = useState(initialNodes)
			const onNodesChange = (changes: any[]) => {
				changes.forEach((change) => {
					if (change.type === 'remove') {
						setNodes((nodes) => nodes.filter((n) => n.id !== change.id))
					}
				})
			}
			return [nodes, setNodes, onNodesChange]
		},
		useEdgesState: (initialEdges: any[] = []) => {
			const [edges, setEdges] = useState(initialEdges)
			const onEdgesChange = (changes: any[]) => {
				changes.forEach((change) => {
					if (change.type === 'remove') {
						setEdges((edges) => edges.filter((e) => e.id !== change.id))
					}
				})
			}
			return [edges, setEdges, onEdgesChange]
		},
		MarkerType: {
			ArrowClosed: 'arrowclosed',
		},
		addEdge: vi.fn((params, edges) => [...edges, { id: `${params.source}-${params.target}`, ...params }]),
		Position: {
			Left: 'left',
			Top: 'top',
			Right: 'right',
			Bottom: 'bottom',
		},
		Panel: () => null,
		MiniMap: () => null,
		useReactFlow: vi.fn().mockReturnValue({
			fitView: vi.fn(),
			zoomIn: vi.fn(),
			zoomOut: vi.fn(),
			setCenter: vi.fn(),
			getNodes: vi.fn().mockReturnValue([]),
			getEdges: vi.fn().mockReturnValue([]),
			setNodes: vi.fn(),
			setEdges: vi.fn(),
			project: vi.fn().mockImplementation(({ x, y }) => ({ x, y })),
		}),
	}
})

describe('ComprehensiveBrainstorm', () => {
	const mockOnSave = vi.fn().mockImplementation((session: BrainstormSession) => Promise.resolve())
	const mockOnClose = vi.fn()

	beforeEach(() => {
		vi.clearAllMocks()
	})

	setupTest()

	const renderComponent = (session = MOCK_SESSION) =>
		render(
			<I18nProvider initialLocale="en">
				<ComprehensiveBrainstorm
					projectId={TEST_PROJECT_ID}
					session={session}
					onSave={mockOnSave}
					onClose={mockOnClose}
				/>
			</I18nProvider>,
		)

	it('should render existing nodes from session', () => {
		renderComponent()
		expect(screen.getByTestId('nodes-count')).toHaveTextContent('2')
		expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
	})

	it('should handle node deletion', async () => {
		renderComponent()
		const initialNodesCount = screen.getByTestId('nodes-count')
		expect(initialNodesCount).toHaveTextContent('2')

		const deleteButton = screen.getByTestId('delete-node')
		await userEvent.click(deleteButton)

		await waitFor(() => {
			expect(screen.getByTestId('nodes-count')).toHaveTextContent('1')
		})

		const saveButton = screen.getByRole('button', { name: /save/i })
		await userEvent.click(saveButton)

		await waitFor(() => {
			expect(mockOnSave).toHaveBeenCalledWith(
				expect.objectContaining({
					nodes: expect.arrayContaining([
						expect.objectContaining({ id: 'node-2' }),
					]),
				}),
			)
		})
	})

	it('should save changes when save button is clicked', async () => {
		renderComponent()
		const saveButton = screen.getByRole('button', { name: /save/i })
		await userEvent.click(saveButton)

		await waitFor(() => {
			expect(mockOnSave).toHaveBeenCalled()
		})

		const [savedSession] = mockOnSave.mock.lastCall as [BrainstormSession]
		expect(savedSession.id).toBe('test-session')
		expect(savedSession.nodes.length).toBe(2)
	})

	it('should close when close button is clicked', async () => {
		renderComponent()
		const closeButton = screen.getByRole('button', { name: /close/i })
		await userEvent.click(closeButton)
		expect(mockOnClose).toHaveBeenCalled()
	})

	it('should support undo/redo operations', async () => {
		renderComponent()

		const deleteButton = screen.getByTestId('delete-node')
		await userEvent.click(deleteButton)

		const saveButton = screen.getByRole('button', { name: /save/i })
		await userEvent.click(saveButton)

		expect(screen.getByTestId('nodes-count')).toHaveTextContent('1')

		const undoButton = screen.getByRole('button', { name: /undo/i })
		await userEvent.click(undoButton)

		await waitFor(() => {
			expect(screen.getByTestId('nodes-count')).toHaveTextContent('2')
		})

		const redoButton = screen.getByRole('button', { name: /redo/i })
		await userEvent.click(redoButton)

		await waitFor(() => {
			expect(screen.getByTestId('nodes-count')).toHaveTextContent('1')
		})
	})
})
