import { screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { MemoizedNodeEditDialog as NodeEditDialog } from '../../components/BrainstormFlow/NodeEditDialog'
import { NodeType, NodeSize } from '../../types'
import type { NodeData } from '../../types'
import { renderWithProviders } from '../test-utils'

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

		expect(screen.getByText('Edit Node')).toBeInTheDocument()
		expect(screen.getByRole('textbox', { name: /label/i })).toHaveValue('Test Node')
		expect(screen.getByRole('textbox', { name: /content/i })).toHaveValue('This is a test node')

		const tagListContainer = screen.getByTestId('tag-list-container')
		expect(tagListContainer).toBeInTheDocument()
		expect(within(tagListContainer).getByText('tag1')).toBeInTheDocument()
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

		fireEvent.change(screen.getByRole('textbox', { name: /label/i }), {
			target: { value: 'Updated Label' },
		})

		fireEvent.change(screen.getByRole('textbox', { name: /content/i }), {
			target: { value: 'Updated content' },
		})

		const actions = screen.getByRole('dialog').querySelector('.MuiDialogActions-root')
		expect(actions).toBeInstanceOf(HTMLElement)
		if (!actions) {
			throw new Error('Actions not found')
		}

		const saveButton = within(actions as HTMLElement).getByRole('button', { name: 'Save' })
		fireEvent.click(saveButton)

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

	it('calls onClose when the cancel button is clicked', () => {
		renderWithProviders(
			<NodeEditDialog
				open={true}
				onClose={mockOnClose}
				onSave={mockOnSave}
				initialData={editInitialData}
				initialType={NodeType.IDEA}
			/>,
		)
		const actions = screen.getByRole('dialog').querySelector('.MuiDialogActions-root')
		expect(actions).toBeInstanceOf(HTMLElement)
		if (!actions) {
			throw new Error('Actions not found')
		}

		const cancelButton = within(actions as HTMLElement).getByRole('button', { name: 'Cancel' })
		fireEvent.click(cancelButton)
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

		const tagListContainer = screen.getByTestId('tag-list-container')
		const addTagInput = screen.getByRole('textbox', { name: /add tag/i })

		await userEvent.type(addTagInput, 'tag2')
		fireEvent.keyPress(addTagInput, { key: 'Enter', code: 'Enter', charCode: 13 })
		// Wait for the tag to appear
		await waitFor(() => {
			expect(within(tagListContainer).getByText('tag2')).toBeInTheDocument()
		})

		const tag1Text = within(tagListContainer).getByText('tag1')
		const tag1Chip = tag1Text.closest('.MuiChip-root')
		expect(tag1Chip).toBeInTheDocument()

		const deleteButton = within(tag1Chip as HTMLElement).getByTestId('CancelIcon')
		expect(deleteButton).toBeInTheDocument()
		fireEvent.click(deleteButton)

		await waitFor(() => {
			expect(within(tagListContainer).queryByText('tag1')).not.toBeInTheDocument()
		})

		const actions = screen.getByRole('dialog').querySelector('.MuiDialogActions-root')
		expect(actions).toBeInstanceOf(HTMLElement)
		if (!actions) {
			throw new Error('Actions not found')
		}

		const saveButton = within(actions as HTMLElement).getByRole('button', { name: 'Save' })
		fireEvent.click(saveButton)

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

		fireEvent.mouseDown(screen.getByRole('combobox', { name: /node type/i }))
		await screen.findByRole('listbox')
		fireEvent.click(screen.getByRole('option', { name: 'Task' }))

		const actions = screen.getByRole('dialog').querySelector('.MuiDialogActions-root')
		expect(actions).toBeInstanceOf(HTMLElement)
		if (!actions) {
			throw new Error('Actions not found')
		}

		const saveButton = within(actions as HTMLElement).getByRole('button', { name: 'Save' })
		fireEvent.click(saveButton)

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

		fireEvent.mouseDown(screen.getByRole('combobox', { name: /size/i }))
		await screen.findByRole('listbox')
		fireEvent.click(screen.getByRole('option', { name: 'Large' }))

		const actions = screen.getByRole('dialog').querySelector('.MuiDialogActions-root')
		expect(actions).toBeInstanceOf(HTMLElement)
		if (!actions) {
			throw new Error('Actions not found')
		}

		const saveButton = within(actions as HTMLElement).getByRole('button', { name: 'Save' })
		fireEvent.click(saveButton)

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

		expect(screen.getByText('Add New Node')).toBeInTheDocument()
		expect(screen.getByRole('textbox', { name: /label/i })).toHaveValue('')
		expect(screen.getByRole('textbox', { name: /content/i })).toHaveValue('')

		const actions = screen.getByRole('dialog').querySelector('.MuiDialogActions-root')
		expect(actions).toBeInstanceOf(HTMLElement)
		if (!actions) {
			throw new Error('Actions not found')
		}

		const addButton = within(actions as HTMLElement).getByRole('button', { name: 'Add' })
		expect(addButton).toBeInTheDocument()

		const saveButton = within(actions as HTMLElement).queryByRole('button', { name: 'Save' })
		expect(saveButton).not.toBeInTheDocument()
	})
})
