import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import DeleteConfirmationDialog from '../../components/DeleteConfirmationDialog'

const mockUpdateSettings = vi.fn()

// Mock the SettingsContext
vi.mock('../../contexts/SettingsContext', () => ({
	useSettings: () => ({
		updateSettings: mockUpdateSettings,
		settings: {
			skipDeleteConfirmation: false,
		},
	}),
}))

describe('DeleteConfirmationDialog', () => {
	beforeEach(() => {
		mockUpdateSettings.mockClear()
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	const defaultProps = {
		open: true,
		onClose: vi.fn(),
		onConfirm: vi.fn(),
		title: 'Delete Node',
	}

	it('should not render when closed', () => {
		render(<DeleteConfirmationDialog {...defaultProps} open={false} />)
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
	})

	it('should render with correct content when open', () => {
		render(<DeleteConfirmationDialog {...defaultProps} />)
		expect(screen.getByRole('dialog')).toBeInTheDocument()
		expect(screen.getByText('Delete Node')).toBeInTheDocument()
		expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/don't ask again/i)).toBeInTheDocument()
	})

	it('should render with default props when not provided', () => {
		render(<DeleteConfirmationDialog open={true} onClose={vi.fn()} onConfirm={vi.fn()} />)
		expect(screen.getByText('Delete Confirmation')).toBeInTheDocument()
		expect(screen.getByText(/are you sure you want to delete this item/i)).toBeInTheDocument()
	})

	it('should render custom message when provided', () => {
		const customMessage = 'Custom delete message'
		render(<DeleteConfirmationDialog {...defaultProps} message={customMessage} />)
		expect(screen.getByText(customMessage)).toBeInTheDocument()
	})

	it('should have correct z-index styling', () => {
		render(<DeleteConfirmationDialog {...defaultProps} />)
		const dialog = screen.getByTestId('delete-confirmation-dialog')
		expect(dialog).toHaveStyle({ zIndex: 10001 })
	})

	it('should call onClose when cancel button is clicked', async () => {
		const onClose = vi.fn()
		render(<DeleteConfirmationDialog {...defaultProps} onClose={onClose} />)
		fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
		await waitFor(() => {
			expect(onClose).toHaveBeenCalledTimes(1)
		})
	})

	it('should call onConfirm when delete button is clicked', async () => {
		const onConfirm = vi.fn()
		render(<DeleteConfirmationDialog {...defaultProps} onConfirm={onConfirm} />)
		fireEvent.click(screen.getByRole('button', { name: /delete/i }))
		await waitFor(() => {
			expect(onConfirm).toHaveBeenCalledTimes(1)
		})
	})

	it('should handle "Don\'t ask again" checkbox', async () => {
		render(<DeleteConfirmationDialog {...defaultProps} />)
		const checkbox = screen.getByLabelText(/don't ask again/i)
		expect(checkbox).not.toBeChecked()

		fireEvent.click(checkbox)
		expect(checkbox).toBeChecked()

		fireEvent.click(screen.getByRole('button', { name: /delete/i }))
		await waitFor(() => {
			expect(mockUpdateSettings).toHaveBeenCalledWith({
				skipDeleteConfirmation: true,
			})
		})
	})

	it('should prevent event propagation when clicking inside dialog', () => {
		const mockStopPropagation = vi.fn()
		render(<DeleteConfirmationDialog {...defaultProps} />)

		const dialog = screen.getByRole('dialog')
		fireEvent.click(dialog, { stopPropagation: mockStopPropagation })

		expect(mockStopPropagation).toHaveBeenCalled()
	})

	it('should be accessible', () => {
		render(<DeleteConfirmationDialog {...defaultProps} />)
		const dialog = screen.getByRole('dialog')
		expect(dialog).toHaveAttribute('aria-labelledby', 'delete-confirmation-dialog-title')
		expect(dialog).toHaveAttribute('aria-describedby', 'delete-confirmation-dialog-description')
	})
})
