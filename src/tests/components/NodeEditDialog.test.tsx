import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { MemoizedNodeEditDialog as NodeEditDialog } from '../../components/BrainstormFlow/NodeEditDialog'
import { NodeType, NodeSize } from '../../types'
import type { NodeData } from '../../types'
import { renderWithProviders } from '../test-setup'

describe('NodeEditDialog', () => {
	const mockOnClose = vi.fn()
	const mockOnSave = vi.fn()

	const editInitialData: NodeData = {
		id: 'node-1',
		title: 'Test Node',
		label: 'Test Node',
		content: 'This is a test node',
		tags: ['tag1'],
		color: '#e3f2fd',
		size: NodeSize.MEDIUM,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		type: NodeType.IDEA,
	}

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('renders with the correct initial values in edit mode', () => {
		renderWithProviders(
			<NodeEditDialog
				open={true}
				onClose={mockOnClose}
				onSave={mockOnSave}
				initialData={editInitialData}
				initialType={NodeType.IDEA}
			/>,
		)

		expect(screen.getByRole('heading', { name: 'Edit Node' })).toBeInTheDocument()
		expect(screen.getByRole('textbox', { name: /label/i })).toHaveValue('Test Node')
		expect(screen.getByRole('textbox', { name: /content/i })).toHaveValue('This is a test node')
		expect(screen.getByText('tag1')).toBeInTheDocument()
	})

	it('calls onSave with the updated values when the save button is clicked', async () => {
		renderWithProviders(
			<NodeEditDialog
				open={true}
				onClose={mockOnClose}
				onSave={mockOnSave}
				initialData={editInitialData}
				initialType={NodeType.IDEA}
			/>,
		)

		const user = userEvent.setup()

		await user.clear(screen.getByRole('textbox', { name: /label/i }))
		await user.type(screen.getByRole('textbox', { name: /label/i }), 'Updated Label')

		await user.clear(screen.getByRole('textbox', { name: /content/i }))
		await user.type(screen.getByRole('textbox', { name: /content/i }), 'Updated content')

		await user.click(screen.getByRole('button', { name: 'Save' }))

		await waitFor(() => {
			expect(mockOnSave).toHaveBeenCalledWith(
				expect.objectContaining({
					label: 'Updated Label',
					title: 'Updated Label',
					content: 'Updated content',
					tags: ['tag1'],
					color: '#e3f2fd',
					size: NodeSize.MEDIUM,
				}),
				NodeType.IDEA,
			)
		})
	})

	it('calls onClose when the cancel button is clicked', async () => {
		renderWithProviders(
			<NodeEditDialog
				open={true}
				onClose={mockOnClose}
				onSave={mockOnSave}
				initialData={editInitialData}
				initialType={NodeType.IDEA}
			/>,
		)

		const user = userEvent.setup()
		await user.click(screen.getByRole('button', { name: 'Cancel' }))

		expect(mockOnClose).toHaveBeenCalled()
	})

	it('allows adding and removing tags', async () => {
		renderWithProviders(
			<NodeEditDialog
				open={true}
				onClose={mockOnClose}
				onSave={mockOnSave}
				initialData={editInitialData}
				initialType={NodeType.IDEA}
			/>,
		)

		const user = userEvent.setup()

		const addTagInput = screen.getByRole('textbox', { name: /add tag/i })
		await user.type(addTagInput, 'tag2{Enter}')

		expect(await screen.findByText('tag2')).toBeInTheDocument()

		await user.click(screen.getByLabelText('Remove tag1'))

		expect(screen.queryByText('tag1')).not.toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: 'Save' }))

		await waitFor(() => {
			expect(mockOnSave).toHaveBeenCalledWith(
				expect.objectContaining({
					tags: ['tag2'],
				}),
				NodeType.IDEA,
			)
		})
	})

	it('allows changing the node type and preserves color', async () => {
		renderWithProviders(
			<NodeEditDialog
				open={true}
				onClose={mockOnClose}
				onSave={mockOnSave}
				initialData={editInitialData}
				initialType={NodeType.IDEA}
			/>,
		)

		const user = userEvent.setup()

		await user.click(screen.getByRole('combobox', { name: /node type/i }))
		await user.click(screen.getByRole('option', { name: 'Task' }))

		await user.click(screen.getByRole('button', { name: 'Save' }))

		await waitFor(() => {
			expect(mockOnSave).toHaveBeenCalledWith(
				expect.objectContaining({
					color: '#e3f2fd',
					size: NodeSize.MEDIUM,
				}),
				NodeType.TASK,
			)
		})
	})

	it('allows changing the node size and preserves color', async () => {
		renderWithProviders(
			<NodeEditDialog
				open={true}
				onClose={mockOnClose}
				onSave={mockOnSave}
				initialData={editInitialData}
				initialType={NodeType.IDEA}
			/>,
		)

		const user = userEvent.setup()

		await user.click(screen.getByRole('combobox', { name: /size/i }))
		await user.click(screen.getByRole('option', { name: 'Large' }))

		await user.click(screen.getByRole('button', { name: 'Save' }))

		await waitFor(() => {
			expect(mockOnSave).toHaveBeenCalledWith(
				expect.objectContaining({
					color: '#e3f2fd',
					size: NodeSize.LARGE,
				}),
				NodeType.IDEA,
			)
		})
	})

	it('renders in add mode when no initialData is provided', () => {
		renderWithProviders(
			<NodeEditDialog open={true} onClose={mockOnClose} onSave={mockOnSave} initialType={NodeType.IDEA} />,
		)

		expect(screen.getByRole('heading', { name: 'Add New Node' })).toBeInTheDocument()
		expect(screen.getByRole('textbox', { name: /label/i })).toHaveValue('')
		expect(screen.getByRole('textbox', { name: /content/i })).toHaveValue('')

		expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
		expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
	})
})
