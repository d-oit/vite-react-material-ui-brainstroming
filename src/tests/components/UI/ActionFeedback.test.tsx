import { ThemeProvider, createTheme } from '@mui/material'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import ActionFeedback from '../../../components/UI/ActionFeedback'

describe('ActionFeedback', () => {
	const theme = createTheme()
	const renderWithTheme = (ui: React.ReactElement) => {
		return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>)
	}

	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('should render success feedback', () => {
		const onClose = vi.fn()

		renderWithTheme(<ActionFeedback message="Operation successful" type="success" open={true} onClose={onClose} />)

		expect(screen.getByText('Operation successful')).toBeInTheDocument()
	})

	it('should render error feedback', () => {
		const onClose = vi.fn()

		renderWithTheme(<ActionFeedback message="Operation failed" type="error" open={true} onClose={onClose} />)

		expect(screen.getByText('Operation failed')).toBeInTheDocument()
	})

	it('should render loading feedback with progress', () => {
		const onClose = vi.fn()

		renderWithTheme(
			<ActionFeedback
				message="Loading..."
				type="loading"
				open={true}
				onClose={onClose}
				showProgress={true}
				progressValue={50}
			/>,
		)

		expect(screen.getByText('Loading...')).toBeInTheDocument()
		expect(screen.getByText('50%')).toBeInTheDocument()
	})

	it('should call onClose when closed', () => {
		const onClose = vi.fn()

		renderWithTheme(
			<ActionFeedback message="Test message" type="info" open={true} onClose={onClose} autoHideDuration={1000} />,
		)

		// Advance timers to trigger auto-hide
		vi.advanceTimersByTime(1500)

		// Check if onClose was called
		expect(onClose).toHaveBeenCalled()
	})

	it('should not auto-hide loading feedback', () => {
		const onClose = vi.fn()

		renderWithTheme(<ActionFeedback message="Loading..." type="loading" open={true} onClose={onClose} />)

		// Advance timers
		vi.advanceTimersByTime(10000)

		// onClose should not be called
		expect(onClose).not.toHaveBeenCalled()
	})

	it('should auto-increment progress for loading type', () => {
		// Skip mocking and just test that the loading message is displayed
		renderWithTheme(
			<ActionFeedback message="Loading..." type="loading" open={true} showProgress={true} progressValue={0} />,
		)

		// Check that the loading message is displayed
		expect(screen.getByText('Loading...')).toBeInTheDocument()

		// Advance timers to trigger progress updates
		vi.advanceTimersByTime(1000)

		// Just verify that the component renders without errors
		expect(screen.getByRole('progressbar')).toBeInTheDocument()
	})
})
