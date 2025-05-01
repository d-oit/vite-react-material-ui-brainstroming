import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import CustomNode from '../../components/BrainstormFlow/CustomNode'
import { mockResizeObserver, actWrapper } from '../../test/test-utils'
import { NodeType } from '../../types'

describe('CustomNode', () => {
	let cleanup: () => void
	let originalInnerWidth: number

	beforeEach(() => {
		// Store original window.innerWidth
		originalInnerWidth = window.innerWidth
		// Mock ResizeObserver
		cleanup = mockResizeObserver()
	})

	afterEach(() => {
		cleanup()
		// Restore original window.innerWidth
		Object.defineProperty(window, 'innerWidth', {
			writable: true,
			configurable: true,
			value: originalInnerWidth,
		})
	})

	it('renders a node with the correct label and content', async () => {
		// Create test data
		const nodeData = {
			id: 'node-1',
			title: 'Test Node',
			label: 'Test Node',
			content: 'This is a test node',
			tags: ['tag1', 'tag2'],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			onEdit: vi.fn(),
			onDelete: vi.fn(),
		}

		await actWrapper(async () => {
			render(
				<CustomNode
					id="node-1"
					type={NodeType.IDEA}
					data={nodeData}
					selected={false}
					zIndex={1}
					isConnectable={true}
					xPos={0}
					yPos={0}
					dragging={false}
				/>,
			)
		})

		expect(screen.getByText('Test Node')).toBeInTheDocument()
		expect(screen.getByText('This is a test node')).toBeInTheDocument()
		expect(screen.getByText('tag1')).toBeInTheDocument()
		expect(screen.getByText('tag2')).toBeInTheDocument()
	})

	it('calls onEdit when the edit button is clicked', async () => {
		const onEdit = vi.fn()
		const nodeData = {
			id: 'node-1',
			title: 'Test Node',
			label: 'Test Node',
			content: 'This is a test node',
			tags: [],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			onEdit,
			onDelete: vi.fn(),
		}

		await actWrapper(async () => {
			render(
				<CustomNode
					id="node-1"
					type={NodeType.IDEA}
					data={nodeData}
					selected={false}
					zIndex={1}
					isConnectable={true}
					xPos={0}
					yPos={0}
					dragging={false}
				/>,
			)
		})

		const editButton = screen.getByLabelText('Edit node')
		await actWrapper(async () => {
			fireEvent.click(editButton)
		})

		expect(onEdit).toHaveBeenCalledWith('node-1')
	})

	it('calls onDelete when the delete button is clicked', async () => {
		const onDelete = vi.fn()
		const nodeData = {
			id: 'node-1',
			title: 'Test Node',
			label: 'Test Node',
			content: 'This is a test node',
			tags: [],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			onEdit: vi.fn(),
			onDelete,
		}

		await actWrapper(async () => {
			render(
				<CustomNode
					id="node-1"
					type={NodeType.IDEA}
					data={nodeData}
					selected={false}
					zIndex={1}
					isConnectable={true}
					xPos={0}
					yPos={0}
					dragging={false}
				/>,
			)
		})

		const deleteButton = screen.getByLabelText('Delete node')
		await actWrapper(async () => {
			fireEvent.click(deleteButton)
		})

		expect(onDelete).toHaveBeenCalledWith('node-1', expect.any(Object))
	})

	it('collapses content on mobile when it is too long', async () => {
		Object.defineProperty(window, 'innerWidth', {
			writable: true,
			configurable: true,
			value: 400, // Mobile width
		})

		const longContent = 'a'.repeat(200)
		const nodeData = {
			id: 'node-1',
			title: 'Test Node',
			label: 'Test Node',
			content: longContent,
			tags: [],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			onEdit: vi.fn(),
			onDelete: vi.fn(),
		}

		await actWrapper(async () => {
			render(
				<CustomNode
					id="node-1"
					type={NodeType.IDEA}
					data={nodeData}
					selected={false}
					zIndex={1}
					isConnectable={true}
					xPos={0}
					yPos={0}
					dragging={false}
				/>,
			)
		})

		expect(screen.getByText(/tap to expand/)).toBeInTheDocument()
	})

	it('calls onEdit when collapsed content is clicked', async () => {
		Object.defineProperty(window, 'innerWidth', {
			writable: true,
			configurable: true,
			value: 400,
		})

		const longContent = 'a'.repeat(200)
		const onEdit = vi.fn()
		const nodeData = {
			id: 'node-1',
			title: 'Test Node',
			label: 'Test Node',
			content: longContent,
			tags: [],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			onEdit,
			onDelete: vi.fn(),
		}

		await actWrapper(async () => {
			render(
				<CustomNode
					id="node-1"
					type={NodeType.IDEA}
					data={nodeData}
					selected={false}
					zIndex={1}
					isConnectable={true}
					xPos={0}
					yPos={0}
					dragging={false}
				/>,
			)
		})

		const collapsedContent = screen.getByText(/tap to expand/)
		await actWrapper(async () => {
			fireEvent.click(collapsedContent)
		})

		expect(onEdit).toHaveBeenCalledWith('node-1')
	})

	it('applies different styles based on node type', async () => {
		const nodeData = {
			id: 'node-1',
			title: 'Test Node',
			label: 'Test Node',
			content: 'This is a test node',
			tags: [],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			onEdit: vi.fn(),
			onDelete: vi.fn(),
		}

		const { rerender } = render(
			<CustomNode
				id="node-1"
				type={NodeType.IDEA}
				data={nodeData}
				selected={false}
				zIndex={1}
				isConnectable={true}
				xPos={0}
				yPos={0}
				dragging={false}
			/>,
		)

		const ideaNode = document.querySelector('[data-testid="custom-node"]')
		expect(ideaNode).toHaveClass('idea-node')

		await actWrapper(async () => {
			rerender(
				<CustomNode
					id="node-1"
					type={NodeType.TASK}
					data={nodeData}
					selected={false}
					zIndex={1}
					isConnectable={true}
					xPos={0}
					yPos={0}
					dragging={false}
				/>,
			)
		})

		const taskNode = document.querySelector('[data-testid="custom-node"]')
		expect(taskNode).toHaveClass('task-node')
	})
})
