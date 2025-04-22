import type { SxProps } from '@mui/material'
import { Box } from '@mui/material'
import React, { useEffect, useState } from 'react'

interface ScreenReaderAnnouncerProps {
	messages: string[]
	politeness?: 'polite' | 'assertive'
	clearDelay?: number
}

/**
 * A component that announces messages to screen readers using ARIA live regions.
 *
 * @param messages - Array of messages to announce
 * @param politeness - ARIA live politeness setting ('polite' or 'assertive')
 * @param clearDelay - Time in ms after which to clear the message (default: 5000ms)
 */
export const ScreenReaderAnnouncer: React.FC<ScreenReaderAnnouncerProps> = ({
	messages,
	politeness = 'polite',
	clearDelay = 5000,
}) => {
	const [currentMessages, setCurrentMessages] = useState<string[]>([])

	// Update current messages when messages prop changes
	useEffect(() => {
		if (messages.length > 0) {
			setCurrentMessages(messages)

			// Clear messages after delay
			const timerId = setTimeout(() => {
				setCurrentMessages([])
			}, clearDelay)

			return () => clearTimeout(timerId)
		}
	}, [messages, clearDelay])

	// Styles for the visually hidden element
	const visuallyHiddenStyles: SxProps = {
		position: 'absolute',
		width: '1px',
		height: '1px',
		padding: 0,
		margin: '-1px',
		overflow: 'hidden',
		clip: 'rect(0, 0, 0, 0)',
		whiteSpace: 'nowrap',
		border: 0,
	}

	return (
		<Box
			aria-live={politeness}
			aria-atomic="true"
			aria-relevant="additions text"
			sx={visuallyHiddenStyles}
			role={politeness === 'assertive' ? 'alert' : undefined}>
			{currentMessages.map((message, index) => (
				<p key={`${index}-${message}`}>{message}</p>
			))}
		</Box>
	)
}

export default ScreenReaderAnnouncer
