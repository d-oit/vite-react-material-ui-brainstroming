import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { describe, it, expect, vi } from 'vitest'

import { I18nProvider } from '../../../contexts/I18nContext'
import QuickBrainstorm from '../QuickBrainstorm'
import type { BrainstormSession } from '../types'

import { mockGenerateId, setupTest } from './testUtils'
import './matchers' // Import custom matchers

describe('QuickBrainstorm', () => {
	const mockOnSave = vi.fn()
	const mockOnClose = vi.fn()
	const mockOnConvert = vi.fn()

	setupTest() // Includes beforeEach for clearing mocks

	beforeEach(() => {
		vi.clearAllMocks()
	})

	const renderComponent = () =>
		render(
			<I18nProvider initialLocale="en">
				<QuickBrainstorm onSave={mockOnSave} onClose={mockOnClose} onConvert={mockOnConvert} />
			</I18nProvider>,
		)

	const getTextbox = () => screen.getByPlaceholderText('brainstorming.quickIdea')
	const getAddButton = () => screen.getByTestId('AddIcon').closest('button') as HTMLButtonElement
	const getSaveButton = () => screen.getByLabelText('Save')
	const getRemoveButtonForItem = (itemText: string) => {
		const listItem = screen.getByText(itemText).closest('li')
		if (!listItem) throw new Error(`List item containing "${itemText}" not found.`)
		const removeButton = listItem.querySelector('button[aria-label="common.remove"]')
		if (!removeButton) throw new Error(`Remove button for "${itemText}" not found.`)
		return removeButton as HTMLButtonElement
	}
	const getConvertButton = () => screen.getByRole('button', { name: /convert/i })

	it('should add new ideas when enter is pressed', async () => {
		const user = userEvent.setup()
		renderComponent()
		await user.type(getTextbox(), 'New idea{Enter}')
		expect(await screen.findByText('New idea')).toBeInTheDocument()
	})

	it('should remove ideas when delete is clicked', async () => {
		const user = userEvent.setup()
		renderComponent()

		await user.type(getTextbox(), 'Idea to delete{Enter}')
		const idea = await screen.findByText('Idea to delete') // Wait for the idea to appear
		expect(idea).toBeInTheDocument()

		await user.click(getRemoveButtonForItem('Idea to delete'))

		await waitFor(() => {
			expect(screen.queryByText('Idea to delete')).not.toBeInTheDocument()
		})
	})

	it('should save ideas when save button is clicked', async () => {
		const user = userEvent.setup()
		renderComponent()

		await user.type(getTextbox(), 'Idea 1{Enter}')
		await screen.findByText('Idea 1') // Wait for first idea

		await user.type(getTextbox(), 'Idea 2{Enter}')
		await screen.findByText('Idea 2') // Wait for second idea

		await user.click(getSaveButton())

		await waitFor(() => {
			expect(mockOnSave).toHaveBeenCalledWith(expect.toBeValidSession())
			const savedSession = mockOnSave.mock.calls[0][0] as BrainstormSession
			expect(savedSession).toContainNode({ content: 'Idea 1' })
			expect(savedSession).toContainNode({ content: 'Idea 2' })
		})
	})

	it('should convert to full session when convert button is clicked', async () => {
		const user = userEvent.setup()
		renderComponent()

		await user.type(getTextbox(), 'Idea for conversion{Enter}')
		await screen.findByText('Idea for conversion') // Wait for idea

		// Wait for the button to become enabled
		await waitFor(() => expect(getConvertButton()).not.toBeDisabled())
		await user.click(getConvertButton())

		await waitFor(() => {
			expect(mockOnConvert).toHaveBeenCalledWith(expect.toBeValidSession())
			const convertedSession = mockOnConvert.mock.calls[0][0] as BrainstormSession
			expect(convertedSession).toContainNode({ content: 'Idea for conversion' })
		})
	})

	it('should disable buttons when there are no ideas', () => {
		renderComponent()
		expect(getSaveButton()).toBeDisabled()
		expect(getConvertButton()).toBeDisabled()
	})

	it('should handle multiline input correctly', async () => {
		const user = userEvent.setup()
		renderComponent()
		await user.type(getTextbox(), 'Line 1\nLine 2{Enter}')

		// Check if the text exists within the list item structure
		const listItem = await screen.findByRole('listitem')
		expect(listItem).toHaveTextContent(/Line 1.*Line 2/s)
	})
})
